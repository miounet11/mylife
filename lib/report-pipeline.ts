import { analyzeFortune } from '@/lib/fortune-engine';
import { runAgenticPipeline } from '@/lib/agentic-report';
import { generateFortuneInterpretation } from '@/lib/llm';
import { buildReportQualityAudit } from '@/lib/report-quality';
import { deriveReportReasoningMode } from '@/lib/report-reasoning-mode';
import type { FortuneAnalysisResult, FortuneRecord } from '@/lib/user-types';

const ANALYZE_LLM_TIMEOUT_MS = 9000;
const ANALYZE_LLM_BUDGET_MS = 9500;
const ENABLE_AGENTIC_PIPELINE = process.env.ENABLE_AGENTIC_PIPELINE !== '0';

export const CURRENT_REPORT_VERSION = 'v3';
export const ENGINE_BUILD_VERSIONS = {
  core: 'bazi-core-v1',
  llm: 'fortune-llm-v1',
  kline: 'life-kline-v2',
  reviewer: 'consensus-v1',
  prompts: 'agent-prompts-v1',
  report: CURRENT_REPORT_VERSION,
} as const;

type PipelineSource = 'analyze' | 'upgrade';
type ReportStage = 'engine' | 'llm' | 'agentic' | 'merge';

export async function generateVersionedReport(params: {
  name: string;
  birthDate: Date;
  birthTime: string;
  birthPlace: string;
  timezone: number;
  gender: 'male' | 'female';
  sect?: 1 | 2;
  source: PipelineSource;
  upgradedFromVersion?: string;
  onProgress?: (event: {
    stage: ReportStage;
    status: 'started' | 'completed';
    detail: string;
  }) => void | Promise<void>;
}) {
  await params.onProgress?.({
    stage: 'engine',
    status: 'started',
    detail: '结构化命理引擎开始计算四柱、五行、十神与大运底座。',
  });
  const baseResult = analyzeFortune(
    params.name,
    params.birthDate,
    params.birthTime,
    params.birthPlace,
    params.timezone,
    params.gender,
    { sect: params.sect || 2 }
  );
  await params.onProgress?.({
    stage: 'engine',
    status: 'completed',
    detail: '基础命盘与运势结构已完成，开始进入增强分析层。',
  });

  await params.onProgress?.({
    stage: 'llm',
    status: 'started',
    detail: '正在调用语言模型增强解释层，补充更完整的自然语言报告。',
  });
  await params.onProgress?.({
    stage: 'agentic',
    status: 'started',
    detail: '并发专家 Agent 已启动，正在整合事业、关系、健康与策略视角。',
  });
  const [llmEnhancement, agentic] = await Promise.all([
    enhanceWithLLM(baseResult as unknown as Record<string, unknown>, async (event) => {
      await params.onProgress?.({
        stage: 'llm',
        status: 'started',
        detail: event.detail,
      });
    }),
    runAgenticPipeline({
      enabled: ENABLE_AGENTIC_PIPELINE,
      groundTruth: {
        birthDate: params.birthDate,
        report: baseResult,
      },
      context: {
        birthDate: params.birthDate,
        birthPlace: params.birthPlace,
        currentPlace: params.birthPlace,
        report: {
          advice: baseResult.advice,
          fortune: baseResult.fortune,
        },
      },
      onProgress: async (event) => {
        await params.onProgress?.({
          stage: 'agentic',
          status: 'started',
          detail: event.detail,
        });
      },
    }),
  ]);
  await params.onProgress?.({
    stage: 'llm',
    status: 'completed',
    detail: llmEnhancement.llmUsed
      ? '语言模型增强已完成，正文将使用更完整的解释与建议。'
      : '语言模型未稳定返回，当前将回退为结构化引擎与专家层整合输出。',
  });
  await params.onProgress?.({
    stage: 'agentic',
    status: 'completed',
    detail: agentic.used || ((agentic.orchestration.successRate || 0) > 0)
      ? '并发 Agent 已返回有效结果，正在做一致性校验与融合。'
      : '并发 Agent 已执行，但本次主要采用 deterministic 专家层与校验结果。',
  });
  const { llmInterpretation, llmUsed } = llmEnhancement;

  await params.onProgress?.({
    stage: 'merge',
    status: 'started',
    detail: '正在整合引擎、LLM、Agent 与人生 K 线结果，准备最终报告。',
  });
  const merged = mergeLLMResult(baseResult, llmInterpretation, {
    llmUsed,
    source: params.source,
    upgradedFromVersion: params.upgradedFromVersion,
    agentic,
  });
  await params.onProgress?.({
    stage: 'merge',
    status: 'completed',
    detail: '最终报告已完成整合，可以进入结果页。',
  });

  return {
    result: {
      ...merged,
      reportVersion: CURRENT_REPORT_VERSION,
    },
    llmUsed,
  };
}

export async function regenerateReportFromRecord(record: FortuneRecord) {
  return generateVersionedReport({
    name: record.name,
    birthDate: new Date(record.birthDate),
    birthTime: record.birthTime,
    birthPlace: record.birthPlace || '北京',
    timezone: record.timezone || 8,
    gender: record.gender,
    source: 'upgrade',
    upgradedFromVersion: record.reportVersion || 'v1',
  });
}

async function enhanceWithLLM(
  baseResult: Record<string, unknown>,
  onProgress?: (event: {
    type: 'model-attempt' | 'model-fallback' | 'model-success' | 'model-failed';
    model: string;
    nextModel?: string;
    detail: string;
  }) => void | Promise<void>
) {
  let routeTimeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const llmInterpretation = await Promise.race([
      generateFortuneInterpretation(baseResult, ANALYZE_LLM_TIMEOUT_MS, onProgress),
      new Promise<null>((resolve) => {
        routeTimeoutId = setTimeout(() => resolve(null), ANALYZE_LLM_BUDGET_MS);
      }),
    ]);

    return {
      llmInterpretation,
      llmUsed: !!llmInterpretation,
    };
  } catch {
    return {
      llmInterpretation: null,
      llmUsed: false,
    };
  } finally {
    if (routeTimeoutId) {
      clearTimeout(routeTimeoutId);
    }
  }
}

function mergeLLMResult(
  baseResult: FortuneAnalysisResult,
  llmInterpretation: Record<string, any> | null,
  meta: {
    llmUsed: boolean;
    source: PipelineSource;
    upgradedFromVersion?: string;
    agentic: Awaited<ReturnType<typeof runAgenticPipeline>>;
  }
) {
  const llmResult = llmInterpretation || null;
  const agentResults = (meta.agentic.agentResults || {}) as Record<string, unknown>;
  const baseAdvice = (baseResult.advice || {}) as FortuneAnalysisResult['advice'] & {
    yongShen?: string[];
    jiShen?: string[];
    xiShen?: string[];
    numbers?: number[];
  };
  const careerAgent = readAgentData(agentResults, 'career_wealth');
  const relationshipAgent = readAgentData(agentResults, 'relationship_family');
  const healthAgent = readAgentData(agentResults, 'health_lifestyle');
  const strategyAgent = readAgentData(agentResults, 'strategy_advisor');
  const temporalAgent = readAgentData(agentResults, 'temporal_spatial_advisor');
  const klineAgent = readAgentData(agentResults, 'kline_narrative');
  const coreAgent = readAgentData(agentResults, 'core_constitution');
  const agenticUsed = meta.agentic.used || ((meta.agentic.orchestration.successRate || 0) > 0);
  const agentSuccessCount = meta.agentic.orchestration.succeeded?.length || 0;
  const agentFailureCount = meta.agentic.orchestration.failed?.length || 0;
  const reasoningMode = deriveReportReasoningMode({
    reasoningMode: meta.agentic.orchestration.mode,
    agenticUsed,
    orchestrationMode: meta.agentic.orchestration.mode,
    orchestrationSuccessRate: meta.agentic.orchestration.successRate,
    successfulAgents: meta.agentic.orchestration.succeeded,
    agentResults: meta.agentic.agentResults as Record<string, unknown>,
    contextSignals: meta.agentic.context.context as unknown as Record<string, unknown>,
    verifyVerdict: meta.agentic.verify.verdict,
  });
  const merged = {
    ...baseResult,
    pattern: {
      ...baseResult.pattern,
      ...(llmResult?.pattern || {}),
      type: baseResult.pattern?.type || llmResult?.pattern?.type || '正格',
    },
    fiveElements: llmResult?.fiveElements || baseResult.fiveElements,
    fortune: {
      ...(llmResult?.fortune || baseResult.fortune),
      interaction: joinParagraphs([
        llmResult?.fortune?.interaction || baseResult.fortune?.interaction,
        klineAgent.summary,
        strategyAgent.summary,
      ]),
      nextYear: joinParagraphs([
        llmResult?.fortune?.nextYear || baseResult.fortune?.nextYear,
        temporalAgent.summary,
      ]),
    },
    advice: {
      ...(llmResult?.advice || baseResult.advice),
      career: mergeCareerAdvice(baseResult.advice?.career, llmResult?.advice?.career, careerAgent, strategyAgent),
      wealth: mergeWealthAdvice(baseResult.advice?.wealth, llmResult?.advice?.wealth, careerAgent, strategyAgent, temporalAgent),
      marriage: mergeMarriageAdvice(baseResult.advice?.marriage, llmResult?.advice?.marriage, relationshipAgent),
      health: mergeHealthAdvice(baseResult.advice?.health, llmResult?.advice?.health, healthAgent),
      yongShen: baseAdvice.yongShen || [],
      jiShen: baseAdvice.jiShen || [],
      xiShen: baseAdvice.xiShen || [],
      colors: baseAdvice.colors || [],
      directions: baseAdvice.directions || [],
      numbers: baseAdvice.numbers || [],
    },
    analysis: {
      ...(llmResult?.analysis || baseResult.analysis),
      opening: joinParagraphs([
        llmResult?.analysis?.opening || baseResult.analysis?.opening,
        coreAgent.summary,
      ]),
    },
    evidence: {
      ...baseResult.evidence,
      celebrities: llmResult?.evidence?.celebrities || baseResult.evidence.celebrities,
    },
  };

  merged.analysis = {
    ...merged.analysis,
    llmUsed: meta.llmUsed,
    agenticUsed,
    reasoningMode,
    pipelineVersion: CURRENT_REPORT_VERSION,
    generatedFrom: meta.source,
    generatedAt: new Date().toISOString(),
    upgradedFromVersion: meta.upgradedFromVersion,
    engineBuilds: { ...ENGINE_BUILD_VERSIONS },
    orchestration: meta.agentic.orchestration,
    verify: meta.agentic.verify,
    contextUsed: {
      solarTerm: !!meta.agentic.context.context.temporal.currentSolarTerm,
      lichunBoundary: true,
      nationalCycle: !!meta.agentic.context.context.macroCycles.nationalCycle,
      industryCycle: !!meta.agentic.context.context.macroCycles.industryCycle?.length,
      geoClimate: !!meta.agentic.context.context.geoClimate.climateBias?.length,
      spatialFactors: !!meta.agentic.context.context.spatialFactors.favorableDirections?.length,
    },
    contextSignals: meta.agentic.context.context as unknown as Record<string, unknown>,
    agentResults: meta.agentic.agentResults as Record<string, unknown>,
    loop: {
      review: meta.agentic.review,
      repair: meta.agentic.repair,
    },
    enhancementNotes: [
      `核心命局由 ${ENGINE_BUILD_VERSIONS.core} 计算生成。`,
      meta.llmUsed
        ? `解析文本已由 ${ENGINE_BUILD_VERSIONS.llm} 做深度增强。`
        : '本次未获取到 LLM 深度增强，当前由结构化引擎与 deterministic 专家层共同生成正文。',
      `人生 K 线与趋势判断按 ${ENGINE_BUILD_VERSIONS.kline} 版本生成。`,
      meta.agentic.enabled && agenticUsed
        ? `并发 Agent 已实际参与主报告生成，成功 ${agentSuccessCount} 个，失败 ${agentFailureCount} 个，并经过 ${ENGINE_BUILD_VERSIONS.reviewer} 一致性校验。`
        : meta.agentic.enabled
        ? `本次已尝试并发 Agent，但上游模型未在时限内稳定返回，当前正文未采用 Agent 的实时 LLM 输出，仅保留 deterministic 专家层与一致性校验结果。`
        : '当前采用 deterministic 专家层、天地人上下文补强与一致性校验闭环。',
    ],
  };

  const strategySummary = strategyAgent.summary;
  const temporalSummary = temporalAgent.summary;
  const coreSummary = coreAgent.summary;

  merged.analysis.explanation = [
    merged.analysis.explanation,
    coreSummary,
    strategySummary,
    temporalSummary,
  ].filter(Boolean).join('\n\n');
  merged.analysis.qualityAudit = buildReportQualityAudit(merged as FortuneAnalysisResult);

  return merged;
}

function readAgentSummary(agentResults: Record<string, unknown>, key: string) {
  const result = agentResults?.[key] as { summary?: string } | undefined;
  return result?.summary || '';
}

function readAgentData(agentResults: Record<string, unknown>, key: string) {
  const result = (agentResults?.[key] || {}) as {
    summary?: string;
    actions?: string[];
    risks?: string[];
    highlights?: string[];
    windows?: Array<{ label?: string; advice?: string }>;
  };

  return {
    summary: result.summary || '',
    actions: result.actions || [],
    risks: result.risks || [],
    highlights: result.highlights || [],
    windows: result.windows || [],
  };
}

function mergeCareerAdvice(
  baseAdvice: FortuneAnalysisResult['advice']['career'] | undefined,
  llmAdvice: Record<string, any> | null | undefined,
  careerAgent: ReturnType<typeof readAgentData>,
  strategyAgent: ReturnType<typeof readAgentData>
) {
  return {
    ...(llmAdvice || baseAdvice),
    general: joinParagraphs([
      llmAdvice?.general || baseAdvice?.general,
      careerAgent.summary,
    ]),
    specific: uniqueList([
      ...(llmAdvice?.specific || baseAdvice?.specific || []),
      ...careerAgent.actions,
      ...strategyAgent.actions.slice(0, 1),
    ]),
    timing: llmAdvice?.timing || baseAdvice?.timing || windowLabel(careerAgent) || windowLabel(strategyAgent),
    avoid: uniqueList([
      ...(llmAdvice?.avoid || baseAdvice?.avoid || []),
      ...careerAgent.risks,
      ...strategyAgent.risks,
    ]),
    direction: llmAdvice?.direction || baseAdvice?.direction || '',
    colors: llmAdvice?.colors || baseAdvice?.colors || [],
  };
}

function mergeWealthAdvice(
  baseAdvice: FortuneAnalysisResult['advice']['wealth'] | undefined,
  llmAdvice: Record<string, any> | null | undefined,
  careerAgent: ReturnType<typeof readAgentData>,
  strategyAgent: ReturnType<typeof readAgentData>,
  temporalAgent: ReturnType<typeof readAgentData>
) {
  return {
    ...(llmAdvice || baseAdvice),
    general: joinParagraphs([
      llmAdvice?.general || baseAdvice?.general,
      careerAgent.summary,
      temporalAgent.summary,
    ]),
    specific: uniqueList([
      ...(llmAdvice?.specific || baseAdvice?.specific || []),
      ...strategyAgent.actions,
    ]),
    timing: llmAdvice?.timing || baseAdvice?.timing || windowLabel(strategyAgent) || windowLabel(temporalAgent),
    direction: llmAdvice?.direction || baseAdvice?.direction || '',
    colors: llmAdvice?.colors || baseAdvice?.colors || [],
    avoid: uniqueList([
      ...(llmAdvice?.avoid || baseAdvice?.avoid || []),
      ...strategyAgent.risks,
      ...temporalAgent.risks,
    ]),
  };
}

function mergeMarriageAdvice(
  baseAdvice: FortuneAnalysisResult['advice']['marriage'] | undefined,
  llmAdvice: Record<string, any> | null | undefined,
  relationshipAgent: ReturnType<typeof readAgentData>
) {
  return {
    ...(llmAdvice || baseAdvice),
    general: joinParagraphs([
      llmAdvice?.general || baseAdvice?.general,
      relationshipAgent.summary,
    ]),
    specific: uniqueList([
      ...(llmAdvice?.specific || baseAdvice?.specific || []),
      ...relationshipAgent.actions,
    ]),
    timing: llmAdvice?.timing || baseAdvice?.timing || windowLabel(relationshipAgent),
    direction: llmAdvice?.direction || baseAdvice?.direction || '',
    colors: llmAdvice?.colors || baseAdvice?.colors || [],
  };
}

function mergeHealthAdvice(
  baseAdvice: FortuneAnalysisResult['advice']['health'] | undefined,
  llmAdvice: Record<string, any> | null | undefined,
  healthAgent: ReturnType<typeof readAgentData>
) {
  return {
    ...(llmAdvice || baseAdvice),
    general: joinParagraphs([
      llmAdvice?.general || baseAdvice?.general,
      healthAgent.summary,
    ]),
    specific: uniqueList([
      ...(llmAdvice?.specific || baseAdvice?.specific || []),
      ...healthAgent.actions,
    ]),
    timing: llmAdvice?.timing || baseAdvice?.timing || windowLabel(healthAgent),
    directions: llmAdvice?.directions || baseAdvice?.directions || [],
    colors: llmAdvice?.colors || baseAdvice?.colors || [],
    avoid: uniqueList([
      ...(llmAdvice?.avoid || baseAdvice?.avoid || []),
      ...healthAgent.risks,
    ]),
  };
}

function uniqueList(values: string[]) {
  return [...new Set(values.filter(Boolean))].slice(0, 6);
}

function joinParagraphs(values: Array<string | undefined>) {
  return values.filter(Boolean).join('\n\n');
}

function windowLabel(agent: ReturnType<typeof readAgentData>) {
  return agent.windows?.[0]?.label || '';
}
