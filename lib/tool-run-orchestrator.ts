import { trackServerEvent } from '@/lib/analytics';
import { callJsonLLM } from '@/lib/agentic-report/llm-client';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { buildToolRunSummary, getToolDefinition, type ToolDefinition, type ToolRunSummary } from '@/lib/tools';
import { getOrCreateGuestUserId } from '@/lib/user-utils';
import { generateId } from '@/lib/utils';
import { loadWorkflowContract, type LifeKlineWorkflowContract } from '@/lib/workflow-contract';
import type { FortuneRecord, ToolSessionRecord } from '@/lib/user-types';

export const TOOL_RUN_WORKFLOW_PATH = 'data/workflows/tool-run-v1.json';

export type ToolRunStage =
  | 'validate-tool'
  | 'load-report'
  | 'load-memory'
  | 'deterministic-summary'
  | 'llm-enhancement'
  | 'auto-qa'
  | 'conversion-scoring'
  | 'persist-session'
  | 'journey-handoff'
  | 'complete';

export type ToolRunEvent = {
  at: string;
  stage: ToolRunStage;
  status: 'started' | 'completed' | 'skipped' | 'failed';
  detail: string;
  meta?: Record<string, unknown>;
};

export type ToolRunInput = {
  toolSlug: string;
  reportId?: string;
  note?: string;
  attribution?: Record<string, unknown> | null;
  userAgent?: string | null;
};

export type ToolRunExecution = {
  userId: string;
  sessionId: string;
  tool: ToolDefinition;
  report: FortuneRecord;
  result: ToolRunSummary;
  events: ToolRunEvent[];
  workflowSnapshot: {
    workflowId: string;
    stages: string[];
    qualityPolicy: Record<string, unknown>;
    memoryPolicy: Record<string, unknown>;
    generatedAt: string;
  };
};

function nowIso() {
  return new Date().toISOString();
}

function readNumber(value: unknown, fallback: number, min = 1) {
  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? Math.max(min, Math.round(numeric)) : fallback;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => `${item || ''}`.trim()).filter(Boolean)
    : [];
}

export function loadToolRunWorkflow(): LifeKlineWorkflowContract {
  return loadWorkflowContract(TOOL_RUN_WORKFLOW_PATH, 'tool-run-v1');
}

function buildWorkflowSnapshot(workflow: LifeKlineWorkflowContract) {
  return {
    workflowId: workflow.id,
    stages: workflow.stages,
    qualityPolicy: workflow.qualityPolicy,
    memoryPolicy: workflow.memoryPolicy || {},
    generatedAt: nowIso(),
  };
}

function createEventRecorder() {
  const events: ToolRunEvent[] = [];
  return {
    events,
    push(event: Omit<ToolRunEvent, 'at'>) {
      events.push({ at: nowIso(), ...event });
    },
  };
}

function inheritedCategories(recentSessions: ToolSessionRecord[], limit: number) {
  return Array.from(new Set(
    recentSessions
      .slice(0, limit)
      .map((item) => (item.meta as Record<string, unknown> | undefined)?.category || 'unknown')
  ));
}

type RawToolLlmEnhancement = {
  headline?: unknown;
  summary?: unknown;
  recommendedAction?: unknown;
  riskReminder?: unknown;
  whyItMatches?: unknown;
  evidence?: unknown;
  premiumPreview?: unknown;
  deepDiveSections?: unknown;
  conversionBridge?: unknown;
};

function mergeString(base: string, candidate: unknown, minLength = 8) {
  const value = `${candidate || ''}`.trim();
  return value.length >= minLength ? value : base;
}

function mergeStringArray(base: string[], candidate: unknown, minItems = 1) {
  const values = readStringArray(candidate);
  return values.length >= minItems ? values : base;
}

function normalizeDeepDiveSections(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const heading = `${(item as any).heading || ''}`.trim();
      const body = `${(item as any).body || ''}`.trim();
      return heading && body ? { heading, body } : null;
    })
    .filter((item): item is { heading: string; body: string } => Boolean(item))
    .slice(0, 5);
}

function buildToolEnhancementSystemPrompt() {
  return [
    '你是人生K线 / 世界易的单项工具增强器。',
    '你的任务是在 deterministic 工具结果基础上做更有用的深度解释，不改变底层命理结论。',
    '输出严格 JSON，字段：headline, summary, recommendedAction, riskReminder, whyItMatches, evidence, premiumPreview, deepDiveSections, conversionBridge。',
    'deepDiveSections 为 3-5 个对象：{"heading": string, "body": string}。',
    '必须克制、现代、非恐吓、非决定论；只谈结构、阶段、环境、动作、风险和复盘。',
    '不要声称百分百预测，不要替代法律、医疗、财务等专业建议。',
  ].join('\n');
}

function buildToolEnhancementUserPrompt(params: {
  tool: ToolDefinition;
  report: FortuneRecord;
  result: ToolRunSummary;
  recentSessions: ToolSessionRecord[];
  note?: string;
}) {
  return JSON.stringify({
    tool: {
      slug: params.tool.slug,
      title: params.tool.title,
      category: params.tool.category,
      userIntent: params.tool.userIntent,
      valuePromise: params.tool.valuePromise,
      rightQuestion: params.tool.rightQuestion,
      premiumModules: params.tool.premiumModules,
      nextToolSlugs: params.tool.nextToolSlugs,
    },
    userQuestion: params.note || '',
    deterministicResult: params.result,
    reportContext: {
      name: params.report.name,
      pattern: params.report.pattern,
      fortune: params.report.fortune,
      advice: params.report.advice,
      analysis: params.report.analysis,
      reportVersion: params.report.reportVersion,
    },
    recentToolSessions: params.recentSessions.slice(0, 4).map((item) => ({
      toolSlug: item.toolSlug,
      result: item.result,
      meta: item.meta,
    })),
    outputRules: [
      '免费结果也要有真实价值，不能只做销售引导。',
      'premiumPreview 只能说明深测会展开什么，不要制造焦虑。',
      'deepDiveSections 要能直接放进工具结果页。',
      'recommendedAction 必须是一个可执行的下一步动作。',
    ],
  }, null, 2);
}

async function enhanceToolResultWithLlm(params: {
  workflow: LifeKlineWorkflowContract;
  tool: ToolDefinition;
  report: FortuneRecord;
  result: ToolRunSummary;
  recentSessions: ToolSessionRecord[];
  note?: string;
}) {
  const runtime = params.workflow.runtime || {};
  if (!readBoolean(runtime.llmEnhancementEnabled, false)) {
    return {
      result: params.result,
      llmUsed: false,
      deepDiveSections: [],
      conversionBridge: '',
    };
  }

  const raw = await callJsonLLM<RawToolLlmEnhancement>({
    system: buildToolEnhancementSystemPrompt(),
    user: buildToolEnhancementUserPrompt(params),
    model: readString(runtime.llmModel, 'grok-420-fast'),
    modelChain: readStringArray(runtime.llmModelChain),
    timeoutMs: readNumber(runtime.llmTimeoutMs, 12_000, 1000),
    maxTokens: readNumber(runtime.llmMaxTokens, 1200, 400),
    temperature: 0.45,
    traceLabel: `tool-run:${params.tool.slug}`,
    scope: 'agent',
    disableHealthReorder: true,
    reasoningEffort: 'low',
  });

  if (!raw) {
    return {
      result: params.result,
      llmUsed: false,
      deepDiveSections: [],
      conversionBridge: '',
    };
  }

  return {
    result: {
      ...params.result,
      headline: mergeString(params.result.headline, raw.headline),
      summary: mergeString(params.result.summary, raw.summary, 20),
      recommendedAction: mergeString(params.result.recommendedAction, raw.recommendedAction),
      riskReminder: mergeString(params.result.riskReminder, raw.riskReminder),
      whyItMatches: mergeString(params.result.whyItMatches, raw.whyItMatches, 16),
      evidence: mergeStringArray(params.result.evidence, raw.evidence, 2),
      premiumPreview: mergeStringArray(params.result.premiumPreview, raw.premiumPreview, 2),
    },
    llmUsed: true,
    deepDiveSections: normalizeDeepDiveSections(raw.deepDiveSections),
    conversionBridge: `${raw.conversionBridge || ''}`.trim(),
  };
}

function scoreToolResultQuality(result: ToolRunSummary, deepDiveSections: Array<{ heading: string; body: string }>) {
  const checks = {
    hasHeadline: result.headline.trim().length >= 12,
    hasSummary: result.summary.trim().length >= 48,
    hasAction: result.recommendedAction.trim().length >= 10,
    hasRisk: result.riskReminder.trim().length >= 10,
    hasEvidence: result.evidence.length >= 3,
    hasPremiumPreview: result.premiumPreview.length >= 2,
    hasDeepDive: deepDiveSections.length >= 3,
    avoidsFateClaims: !/一定|必然|注定|百分百|绝对/.test([
      result.headline,
      result.summary,
      result.recommendedAction,
      result.riskReminder,
      result.whyItMatches,
      ...result.evidence,
      ...result.premiumPreview,
      ...deepDiveSections.map((item) => `${item.heading}${item.body}`),
    ].join('\n')),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passed / Object.keys(checks).length) * 100);
  return {
    score,
    grade: score >= 90 ? 'S' : score >= 78 ? 'A' : score >= 65 ? 'B' : 'C',
    checks,
  };
}

function scoreConversionReadiness(params: {
  tool: ToolDefinition;
  result: ToolRunSummary;
  qualityScore: number;
  conversionBridge?: string;
}) {
  let score = 0;
  if (params.result.recommendedAction.length >= 12) score += 20;
  if (params.result.riskReminder.length >= 12) score += 15;
  if (params.result.premiumPreview.length >= 3) score += 20;
  if (params.tool.premiumServiceKey) score += 15;
  if (params.tool.nextToolSlugs.length >= 3) score += 10;
  if ((params.conversionBridge || '').length >= 20) score += 10;
  if (params.qualityScore >= 78) score += 10;

  return {
    score,
    tier: score >= 80 ? 'high' : score >= 55 ? 'medium' : 'low',
    nextBestAction: params.tool.premiumServiceKey
      ? 'premium_service'
      : params.tool.nextToolSlugs[0]
      ? 'next_tool'
      : 'chat_followup',
  };
}

export async function runToolWorkflow(input: ToolRunInput): Promise<ToolRunExecution> {
  const workflow = loadToolRunWorkflow();
  const recorder = createEventRecorder();
  const workflowSnapshot = buildWorkflowSnapshot(workflow);
  const memoryPolicy = workflow.memoryPolicy || {};
  const recentSessionLimit = readNumber(memoryPolicy.recentSessionLimit, 6);
  const inheritSessionLimit = readNumber(memoryPolicy.inheritSessionLimit, 4);

  const userId = await getOrCreateGuestUserId();
  const toolSlug = input.toolSlug.trim();

  recorder.push({
    stage: 'validate-tool',
    status: 'started',
    detail: '正在校验工具定义。',
    meta: { toolSlug },
  });
  const tool = getToolDefinition(toolSlug);
  if (!tool) {
    recorder.push({
      stage: 'validate-tool',
      status: 'failed',
      detail: '工具不存在。',
      meta: { toolSlug },
    });
    throw new Error('TOOL_NOT_FOUND');
  }
  recorder.push({
    stage: 'validate-tool',
    status: 'completed',
    detail: '工具定义已加载。',
    meta: { toolSlug: tool.slug, category: tool.category },
  });

  recorder.push({
    stage: 'load-report',
    status: 'started',
    detail: '正在加载用户报告上下文。',
    meta: { reportId: input.reportId || null },
  });
  const report = input.reportId
    ? fortuneOperations.getById(input.reportId)
    : fortuneOperations.getByUserId(userId)[0] || null;
  if (!report) {
    recorder.push({
      stage: 'load-report',
      status: 'failed',
      detail: '用户尚未完成综合报告。',
    });
    throw new Error('REPORT_REQUIRED');
  }
  if (report.userId !== userId) {
    recorder.push({
      stage: 'load-report',
      status: 'failed',
      detail: '报告不属于当前用户。',
      meta: { reportId: report.id },
    });
    throw new Error('REPORT_FORBIDDEN');
  }
  recorder.push({
    stage: 'load-report',
    status: 'completed',
    detail: '报告上下文已加载。',
    meta: { reportId: report.id, reportVersion: report.reportVersion || null },
  });

  recorder.push({
    stage: 'load-memory',
    status: 'started',
    detail: '正在继承最近工具记忆。',
  });
  const recentSessions = toolSessionOperations.listByUser(userId, recentSessionLimit);
  recorder.push({
    stage: 'load-memory',
    status: 'completed',
    detail: '工具记忆已加载。',
    meta: {
      recentSessionCount: recentSessions.length,
      inheritedSessionIds: recentSessions.slice(0, inheritSessionLimit).map((item) => item.id),
    },
  });

  trackServerEvent({
    userId,
    sessionId: userId,
    userAgent: input.userAgent,
    eventName: 'tool_run_started',
    page: `/tools/${tool.slug}`,
    meta: {
      workflowId: workflow.id,
      toolSlug: tool.slug,
      reportId: report.id,
      category: tool.category,
      attribution: input.attribution || null,
    },
  });

  recorder.push({
    stage: 'deterministic-summary',
    status: 'started',
    detail: '正在生成确定性工具摘要。',
  });
  const deterministicResult = buildToolRunSummary({
    tool,
    report,
    recentSessions: recentSessions as any,
    note: input.note || '',
  });
  recorder.push({
    stage: 'deterministic-summary',
    status: 'completed',
    detail: '确定性工具摘要已完成。',
  });

  recorder.push({
    stage: 'llm-enhancement',
    status: 'started',
    detail: '正在尝试使用 LLM 做工具结果深度解释。',
  });
  const enhanced = await enhanceToolResultWithLlm({
    workflow,
    tool,
    report,
    result: deterministicResult,
    recentSessions,
    note: input.note || '',
  });
  const result = enhanced.result;
  recorder.push({
    stage: 'llm-enhancement',
    status: enhanced.llmUsed ? 'completed' : 'skipped',
    detail: enhanced.llmUsed
      ? 'LLM 深度解释已合并到工具结果。'
      : 'LLM 未稳定返回，本次采用确定性工具结果。',
    meta: {
      llmUsed: enhanced.llmUsed,
      deepDiveSections: enhanced.deepDiveSections.length,
    },
  });

  recorder.push({
    stage: 'auto-qa',
    status: 'started',
    detail: '正在执行工具结果自动质检。',
  });
  const quality = scoreToolResultQuality(result, enhanced.deepDiveSections);
  recorder.push({
    stage: 'auto-qa',
    status: 'completed',
    detail: `工具结果自动质检完成：${quality.grade} / ${quality.score}。`,
    meta: quality,
  });

  recorder.push({
    stage: 'conversion-scoring',
    status: 'started',
    detail: '正在计算工具结果的后续承接强度。',
  });
  const conversion = scoreConversionReadiness({
    tool,
    result,
    qualityScore: quality.score,
    conversionBridge: enhanced.conversionBridge,
  });
  recorder.push({
    stage: 'conversion-scoring',
    status: 'completed',
    detail: `后续承接强度为 ${conversion.tier}。`,
    meta: conversion,
  });

  const sessionId = `tool_${generateId()}`;
  recorder.push({
    stage: 'persist-session',
    status: 'started',
    detail: '正在保存工具运行会话。',
    meta: { sessionId },
  });
  toolSessionOperations.create({
    id: sessionId,
    userId,
    reportId: report.id,
    toolSlug: tool.slug,
    status: 'completed',
    input: {
      note: input.note || '',
      reportName: report.name,
    },
    result: result as unknown as Record<string, unknown>,
    meta: {
      workflow: workflowSnapshot,
      llmEnhancement: {
        used: enhanced.llmUsed,
        deepDiveSections: enhanced.deepDiveSections,
        conversionBridge: enhanced.conversionBridge,
      },
      quality,
      conversion,
      toolTitle: tool.shortTitle,
      category: tool.category,
      premiumServiceKey: tool.premiumServiceKey || null,
      chatIntent: tool.chatIntent || null,
      nextToolSlugs: tool.nextToolSlugs,
      inheritedSessionIds: recentSessions.slice(0, inheritSessionLimit).map((item) => item.id),
      inheritedCategories: inheritedCategories(recentSessions, inheritSessionLimit),
      attribution: input.attribution || null,
      orchestrationEvents: recorder.events,
    },
  });
  recorder.push({
    stage: 'persist-session',
    status: 'completed',
    detail: '工具运行会话已保存。',
    meta: { sessionId },
  });

  recorder.push({
    stage: 'journey-handoff',
    status: 'completed',
    detail: '已准备后续工具与高级服务承接信息。',
    meta: {
      nextToolSlugs: tool.nextToolSlugs,
      premiumServiceKey: tool.premiumServiceKey || null,
    },
  });

  recorder.push({
    stage: 'complete',
    status: 'completed',
    detail: '工具运行工作流完成。',
    meta: { sessionId },
  });

  trackServerEvent({
    userId,
    sessionId: userId,
    userAgent: input.userAgent,
    eventName: 'tool_run_completed',
    page: `/tool-result/${sessionId}`,
    meta: {
      workflowId: workflow.id,
      toolSlug: tool.slug,
      reportId: report.id,
      category: tool.category,
      attribution: input.attribution || null,
    },
  });

  return {
    userId,
    sessionId,
    tool,
    report,
    result,
    events: recorder.events,
    workflowSnapshot,
  };
}
