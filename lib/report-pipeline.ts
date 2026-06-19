import { analyzeFortune } from '@/lib/fortune-engine';
import { createAgenticContext, runAgenticPipeline } from '@/lib/agentic-report';
import { CORE_AGENT_KEYS, type CoreAgentKey } from '@/lib/agentic-report/agent-definitions';
import { isAgenticPipelineEnabled } from '@/lib/env';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';
import {
  assessScopeProviderHealth,
  hasRunnableModelsForSnapshots,
  shouldConservativelyDeferForSnapshots,
} from '@/lib/llm-provider-health';
import { generateFortuneInterpretationCore, generateFortuneInterpretationFollowup } from '@/lib/llm';
import { buildReportQualityAudit } from '@/lib/report-quality';
import { applyReliabilityGuard } from '@/lib/report-reliability';
import { deriveReportReasoningMode } from '@/lib/report-reasoning-mode';
import type { FortuneAnalysisResult, FortuneRecord } from '@/lib/user-types';
import { parseLocalDate, heavyGenerationCache } from '@/lib/utils';
import { getWorldYiV2MatchesForReport } from '@/lib/content-store';

// 首次 analyze 是用户等待路径：核心草案快速交付，长尾补强交给后续升级/重试。
// v5-C2 (2026-05-15): 上游偶发 abort 集中在分钟级，把 upgrader 主 LLM 预算抬到 180s 量级，
// 让单次请求能撑过 ~14s 上游平均延迟 + 重试 + fallback。analyze 路径仍受用户等待约束，仅微调。
// v5-C3 (2026-05-15): 直连探测显示主模型 gpt-5.4-mini-my 平均 ~9s（最高 11s），
// 之前 22s/8s/8s/9s 苛刻预算把主模型 1 次 + fallback 1 次都不够跑完即 abort。
// 抬到 32s/12s/14s/15s，覆盖 ~11s 主 + ~1s fallback(gpt-4.1-mini) 真实延迟，仍在用户可接受范围。
const ANALYZE_LLM_CORE_TIMEOUT_MS = 32000;
const ANALYZE_LLM_FOLLOWUP_TIMEOUT_MS = 12000;
const UPGRADE_LLM_CORE_TIMEOUT_MS = 180000;
const UPGRADE_LLM_FOLLOWUP_TIMEOUT_MS = 90000;
const ENABLE_AGENTIC_PIPELINE = isAgenticPipelineEnabled();
const ANALYZE_FRONT_AGENT_KEYS: CoreAgentKey[] = [
  'core_constitution',
  'kline_narrative',
  'strategy_advisor',
];
const ANALYZE_FALLBACK_AGENT_KEYS: CoreAgentKey[] = [
  'kline_narrative',
  'strategy_advisor',
];
// 用户实时 analyze 链路不再跑 LLM agents。
// 线上失败集中在 13~14s Request aborted，根因是 report LLM + 多 agent 并发抢同一上游。
// analyze 只交付 engine + report LLM + deterministic expert；后台 upgrade 再补 agent enrichment。
const ANALYZE_AGENT_MAIN_TASK_TIMEOUT_MS = 0;
const ANALYZE_AGENT_MAIN_LLM_TIMEOUT_MS = 0;

export const CURRENT_REPORT_VERSION = 'v3';
export const ENGINE_BUILD_VERSIONS = {
  core: 'bazi-core-v1',
  llm: 'fortune-llm-v1',
  kline: 'life-kline-v2',
  reviewer: 'consensus-v1',
  prompts: 'agent-prompts-v1',
  report: CURRENT_REPORT_VERSION,
} as const;

export function resolveAnalyzeAgentKeys(params: {
  llmUsed: boolean;
  shouldRunAgentic: boolean;
}): CoreAgentKey[] {
  if (!params.shouldRunAgentic) {
    return [...CORE_AGENT_KEYS];
  }

  return params.llmUsed
    ? ANALYZE_FRONT_AGENT_KEYS
    : ANALYZE_FALLBACK_AGENT_KEYS;
}

export function shouldRunAnalyzeAgentic(params: {
  source: PipelineSource;
  llmUsed: boolean;
  deferredByProviderHealth: boolean;
  agentScopeHealthDeferred: boolean;
  agentScopeSnapshotsConservative: boolean;
}) {
  if (!ENABLE_AGENTIC_PIPELINE) {
    return false;
  }

  // 用户实时 analyze 是转化核心链路：不要在这里并发跑 LLM agents。
  // 线上失败集中在 agent scope 的 13~14s Request aborted；这会污染熔断、制造 upgrade retry，
  // 但主报告 engine + report LLM 本身稳定。agent enrichment 交给后台 upgrade/cron 实例处理。
  if (params.source === 'analyze') {
    return false;
  }

  if (params.agentScopeHealthDeferred || params.agentScopeSnapshotsConservative) {
    return false;
  }

  return true;
}

export function shouldDeferReportLlmForSource(params: {
  source: PipelineSource;
  providerHealthDeferred: boolean;
  reportScopeSnapshotsConservative: boolean;
  hasRunnableModels: boolean;
}) {
  if (params.source === 'analyze') {
    return params.providerHealthDeferred
      || params.reportScopeSnapshotsConservative
      || !params.hasRunnableModels;
  }

  return params.providerHealthDeferred
    || params.reportScopeSnapshotsConservative
    || !params.hasRunnableModels;
}

type PipelineSource = 'analyze' | 'upgrade';
type ReportStage = 'engine' | 'llm' | 'agentic' | 'merge';

type FallbackNarrative = {
  opening: string;
  summary: string;
  explanation: string;
};

type NarrativeJudgmentBlock = {
  headline: string;
  evidence: string[];
};

type NarrativeJudgmentBlocks = {
  pastValidation: NarrativeJudgmentBlock;
  presentDiagnosis: NarrativeJudgmentBlock;
  futureGuidance: NarrativeJudgmentBlock;
};

type PastEventTemplate = NonNullable<FortuneAnalysisResult['analysis']['pastEventTemplates']>[number];

export async function generateVersionedReport(params: {
  name: string;
  birthDate: Date;
  birthTime: string;
  birthPlace: string;
  timezone: number;
  gender: 'male' | 'female';
  sect?: 1 | 2;
  tacitSummary?: string;
  tacitSignals?: string[];
  source: PipelineSource;
  userId?: string;
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
  const preLlmContext = createAgenticContext({
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
        tacitSummary: params.tacitSummary,
        tacitSignals: params.tacitSignals,
      },
    },
  });
  const llmInput = {
    ...baseResult,
    tacitSummary: params.tacitSummary,
    tacitSignals: params.tacitSignals,
    worldStateSnapshot: preLlmContext.context.worldState,
    contextSnapshot: {
      temporal: preLlmContext.context.temporal,
      macroCycles: preLlmContext.context.macroCycles,
      geoClimate: preLlmContext.context.geoClimate,
      humanFactors: preLlmContext.context.humanFactors,
    },
  } as Record<string, unknown>;

  await params.onProgress?.({
    stage: 'llm',
    status: 'started',
    detail: '正在整理更完整的自然语言报告。'
  });
  const llmTimeouts = params.source === 'analyze'
    ? {
        core: ANALYZE_LLM_CORE_TIMEOUT_MS,
        followup: ANALYZE_LLM_FOLLOWUP_TIMEOUT_MS,
      }
    : {
        core: UPGRADE_LLM_CORE_TIMEOUT_MS,
        followup: UPGRADE_LLM_FOLLOWUP_TIMEOUT_MS,
      };
  const llmCore = await enhanceWithLLM(llmInput, null, llmTimeouts, params.source, async (event) => {
    await params.onProgress?.({
      stage: 'llm',
      status: 'started',
      detail: event.detail,
    });
  });
  await params.onProgress?.({
    stage: 'llm',
    status: 'completed',
    detail: llmCore.llmUsed
      ? '报告正文已补充更完整的解释与建议。'
      : '核心解释暂未稳定返回，当前先整理可阅读的基础内容。',
  });
  await params.onProgress?.({
    stage: 'agentic',
    status: 'started',
    detail: llmCore.llmUsed
      ? '核心解释已返回，正在补充建议层和多角度判断。'
      : '当前先补充多角度判断，优先保证结果稳定交付。',
  });
  const agentScopeHealth = assessScopeProviderHealth(
    getModelFallbackChain(undefined, 'agent'),
    'agent'
  );
  const shouldRunAgentic = shouldRunAnalyzeAgentic({
    source: params.source,
    llmUsed: llmCore.llmUsed,
    deferredByProviderHealth: llmCore.deferredByProviderHealth,
    agentScopeHealthDeferred: agentScopeHealth.shouldDefer,
    agentScopeSnapshotsConservative: shouldConservativelyDeferForSnapshots(agentScopeHealth.snapshots || []),
  });
  const agentKeys = params.source === 'analyze'
    ? resolveAnalyzeAgentKeys({
        llmUsed: llmCore.llmUsed,
        shouldRunAgentic,
      })
    : [...CORE_AGENT_KEYS];
  const followupPromise = params.source === 'analyze'
    ? Promise.resolve(llmCore)
    : llmCore.llmInterpretation
    ? enhanceWithLLM(llmInput, llmCore.llmInterpretation as Record<string, unknown>, llmTimeouts, params.source, async (event) => {
        await params.onProgress?.({
          stage: 'llm',
          status: 'started',
          detail: event.detail,
        });
      })
    : Promise.resolve(llmCore);
  const [llmEnhancement, agentic] = await Promise.all([
    followupPromise,
    runAgenticPipeline({
      enabled: shouldRunAgentic,
      agentKeys,
      enableRetry: params.source !== 'analyze',
      mainTaskTimeoutMs: params.source === 'analyze' ? ANALYZE_AGENT_MAIN_TASK_TIMEOUT_MS : undefined,
      mainLlmTimeoutMs: params.source === 'analyze' ? ANALYZE_AGENT_MAIN_LLM_TIMEOUT_MS : undefined,
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
          tacitSummary: params.tacitSummary,
          tacitSignals: params.tacitSignals,
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
    stage: 'agentic',
    status: 'completed',
    detail: !shouldRunAgentic
      ? '部分补充内容暂未稳定返回，本次先采用可阅读的基础判断，避免长时间等待。'
      : agentic.used || ((agentic.orchestration.successRate || 0) > 0)
      ? '补充判断已返回，正在做一致性校对与融合。'
      : '补充判断暂未完整返回，本次先采用基础判断与校对结果。',
  });
  const { llmInterpretation, llmUsed } = llmEnhancement;

  await params.onProgress?.({
    stage: 'merge',
    status: 'started',
    detail: '正在整合结构、趋势和行动建议，准备最终报告。'
  });
  const merged = mergeLLMResult(baseResult, llmInterpretation, {
    llmUsed,
    deferredByProviderHealth: llmEnhancement.deferredByProviderHealth,
    source: params.source,
    upgradedFromVersion: params.upgradedFromVersion,
    agentic,
  });

  // Stability guard (highest dim): stage large agentic outputs (parallel LLM results) via
  // bounded cache before finalize/serialize. Full blobs only meta-tracked to avoid retaining
  // multi-MB agent graphs in any process (web or worker). Heavy report paths still benefit.
  try {
    const agentData = (agentic as any)?.agentResults || agentic;
    const agentSize = JSON.stringify(agentData || {}).length;
    if (agentSize > 120000) {
      const gk = `report-agentic-${(params.userId || 'anon').toString().slice(0,6)}-${Date.now()}`;
      heavyGenerationCache.set(gk, { meta: 'agentic-report-staged', bytes: agentSize }, Math.min(agentSize, 256*1024));
    }
  } catch {}
  await params.onProgress?.({
    stage: 'merge',
    status: 'completed',
    detail: '最终报告已完成整合，可以进入结果页。',
  });

  const finalized = finalizeReportForDelivery(merged as FortuneAnalysisResult);

  return {
    result: {
      ...finalized,
      reportVersion: CURRENT_REPORT_VERSION,
    },
    llmUsed,
    llmUnavailable: llmEnhancement.llmUnavailable,
    deferredByProviderHealth: llmEnhancement.deferredByProviderHealth,
  };
}

export async function regenerateReportFromRecord(record: FortuneRecord) {
  const parsedBirthDate = parseLocalDate(record.birthDate);

  if (!parsedBirthDate) {
    throw new Error(`Invalid birthDate in record: ${record.birthDate}`);
  }

  return generateVersionedReport({
    name: record.name,
    birthDate: parsedBirthDate,
    birthTime: record.birthTime,
    birthPlace: record.birthPlace || '北京',
    timezone: record.timezone || 8,
    gender: record.gender,
    userId: record.userId,
    source: 'upgrade',
    upgradedFromVersion: record.reportVersion || 'v1',
  });
}

export function finalizeReportForDelivery(result: FortuneAnalysisResult): FortuneAnalysisResult {
  const repairedAdvice = repairExistingAdvice(result.advice as FortuneAnalysisResult['advice']);
  const repairedFortune = {
    ...(result.fortune || {}),
    interaction: joinParagraphs([result.fortune?.interaction]),
    nextYear: joinParagraphs([result.fortune?.nextYear]),
  };

  const draft = {
    ...result,
    fortune: repairedFortune,
    advice: repairedAdvice,
    analysis: {
      ...(result.analysis || {}),
    },
  } as FortuneAnalysisResult;

  const repairedNarrative = buildDeterministicFallbackNarrative(draft, {
    openingOverride: result.analysis?.opening,
    summaryOverride: result.analysis?.summary,
    explanationOverride: hasStructuredNarrativeSections(result.analysis?.explanation || '')
      ? ''
      : result.analysis?.explanation,
  });

  draft.analysis = {
    ...(draft.analysis || {}),
    opening: repairedNarrative.opening,
    summary: repairedNarrative.summary,
    explanation: repairedNarrative.explanation,
    judgmentBlocks: buildNarrativeJudgmentBlocks(draft),
    pastEventTemplates: buildPastEventTemplates(draft),
  };
  draft.analysis.qualityAudit = buildReportQualityAudit(draft);
  const guarded = applyReliabilityGuard(draft);
  guarded.analysis = {
    ...(guarded.analysis || {}),
    qualityAudit: buildReportQualityAudit(guarded),
  };

  return guarded;
}

export function repairStoredReportNarrative(record: FortuneRecord): FortuneAnalysisResult {
  const draft = {
    basic: record.bazi,
    fiveElements: record.fiveElements,
    tenGods: record.tenGods,
    pattern: record.pattern,
    fortune: {
      ...(record.fortune || {}),
      interaction: joinParagraphs([record.fortune?.interaction]),
      nextYear: joinParagraphs([record.fortune?.nextYear]),
      trend: joinParagraphs([record.fortune?.trend]),
    },
    advice: record.advice as FortuneAnalysisResult['advice'],
    evidence: record.evidence,
    analysis: {
      ...(record.analysis || {}),
    },
    klineData: record.klineData,
    dayun: record.dayun,
    shenSha: record.shenSha,
  } as FortuneAnalysisResult;
  const finalized = finalizeReportForDelivery(draft);

  finalized.analysis = {
    ...(finalized.analysis || {}),
    pipelineVersion: CURRENT_REPORT_VERSION,
    generatedAt: new Date().toISOString(),
  };
  finalized.analysis.qualityAudit = buildReportQualityAudit(finalized);

  return finalized;
}

async function enhanceWithLLM(
  baseResult: Record<string, unknown>,
  draft: Record<string, unknown> | null,
  timeouts: {
    core: number;
    followup: number;
  },
  source: PipelineSource,
  onProgress?: (event: {
    type: 'model-attempt' | 'model-fallback' | 'model-success' | 'model-failed';
    model: string;
    nextModel?: string;
    detail: string;
  }) => void | Promise<void>
) {
  try {
    const llmHealth = assessScopeProviderHealth(
      getModelFallbackChain(undefined, 'report'),
      'report'
    );
    const reportSnapshots = llmHealth.snapshots || [];
    const shouldDeferLlm = shouldDeferReportLlmForSource({
      source,
      providerHealthDeferred: llmHealth.shouldDefer,
      reportScopeSnapshotsConservative: shouldConservativelyDeferForSnapshots(reportSnapshots),
      hasRunnableModels: hasRunnableModelsForSnapshots(reportSnapshots),
    });

    if (shouldDeferLlm) {
      await onProgress?.({
        type: 'model-failed',
        model: 'provider_health_gate',
        detail: source === 'analyze'
          ? '当前报告增强模型波动较大，本次直接采用结构化引擎与专家层结果，避免首份报告长时间等待。'
          : '当前报告增强模型全部处于熔断或不可探测状态，本次直接采用结构化引擎与专家层结果，避免长时间等待。',
      });

      return {
        llmInterpretation: draft || null,
        llmUsed: !!draft,
        llmUnavailable: !draft,
        deferredByProviderHealth: true,
      };
    }

    if (!draft) {
      const llmInterpretation = await generateFortuneInterpretationCore(
        baseResult,
        timeouts.core,
        onProgress
      );

      return {
        llmInterpretation,
        llmUsed: !!llmInterpretation,
        llmUnavailable: !llmInterpretation,
        deferredByProviderHealth: false,
      };
    }

    const llmInterpretation = await generateFortuneInterpretationFollowup(
      baseResult,
      draft,
      timeouts.followup,
      onProgress
    );

    return {
      llmInterpretation,
      llmUsed: !!llmInterpretation,
      llmUnavailable: false,
      deferredByProviderHealth: false,
    };
  } catch {
    return {
      llmInterpretation: draft || null,
      llmUsed: !!draft,
      llmUnavailable: !draft,
      deferredByProviderHealth: false,
    };
  }
}

function mergeLLMResult(
  baseResult: FortuneAnalysisResult,
  llmInterpretation: Record<string, any> | null,
  meta: {
    llmUsed: boolean;
    deferredByProviderHealth: boolean;
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
  const agenticContextSignals = meta.agentic.context.context as unknown as Record<string, unknown>;
  const baseContextSignals = (baseResult.analysis?.contextSignals || {}) as Record<string, unknown>;
  const mergedContextSignals = {
    ...agenticContextSignals,
    ...baseContextSignals,
  } as Record<string, unknown>;
  const reasoningMode = deriveReportReasoningMode({
    reasoningMode: meta.agentic.orchestration.mode,
    agenticUsed,
    orchestrationMode: meta.agentic.orchestration.mode,
    orchestrationSuccessRate: meta.agentic.orchestration.successRate,
    successfulAgents: meta.agentic.orchestration.succeeded,
    agentResults: meta.agentic.agentResults as Record<string, unknown>,
    contextSignals: mergedContextSignals,
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
    providerHealthDeferred: meta.deferredByProviderHealth,
    agenticUsed,
    reasoningMode,
    pipelineVersion: CURRENT_REPORT_VERSION,
    generatedFrom: meta.source,
    generatedAt: new Date().toISOString(),
    upgradedFromVersion: meta.upgradedFromVersion,
    engineBuilds: { ...ENGINE_BUILD_VERSIONS },
    orchestration: meta.agentic.orchestration,
    verify: meta.agentic.verify,
    v4ContractVersion: 'v1',
    sectionOwnership: buildReportSectionOwnership(),
    v4OwnedConcepts: buildReportSectionOwnership(),
    contextUsed: {
      solarTerm: !!meta.agentic.context.context.temporal.currentSolarTerm,
      lichunBoundary: true,
      nationalCycle: !!meta.agentic.context.context.macroCycles.nationalCycle,
      industryCycle: !!meta.agentic.context.context.macroCycles.industryCycle?.length,
      geoClimate: !!meta.agentic.context.context.geoClimate.climateBias?.length,
      spatialFactors: !!meta.agentic.context.context.spatialFactors.favorableDirections?.length,
    },
    contextSignals: mergedContextSignals,
    agentResults: meta.agentic.agentResults as Record<string, unknown>,
    loop: {
      review: meta.agentic.review,
      repair: meta.agentic.repair,
    },
    enhancementNotes: uniqueList([
      ...((baseResult.analysis?.enhancementNotes || []) as string[]),
      `核心命局由 ${ENGINE_BUILD_VERSIONS.core} 计算生成。`,
      meta.llmUsed
        ? `解析文本已由 ${ENGINE_BUILD_VERSIONS.llm} 做深度增强。`
        : meta.deferredByProviderHealth
        ? '上游模型当前波动较大，本次主动切换为稳定专家版交付，优先保证结果可读与可用。'
        : '本次未获取到 LLM 深度增强，当前由结构化引擎与 deterministic 专家层共同生成正文。',
      `人生 K 线与趋势判断按 ${ENGINE_BUILD_VERSIONS.kline} 版本生成。`,
      meta.agentic.enabled && agenticUsed
        ? `并发 Agent 已实际参与主报告生成，成功 ${agentSuccessCount} 个，失败 ${agentFailureCount} 个，并经过 ${ENGINE_BUILD_VERSIONS.reviewer} 一致性校验。`
        : meta.agentic.enabled
        ? `本次已尝试并发 Agent，但上游模型未在时限内稳定返回，当前正文未采用 Agent 的实时 LLM 输出，仅保留 deterministic 专家层与一致性校验结果。`
        : '当前采用 deterministic 专家层、天地人上下文补强与一致性校验闭环。',
    ]),
  };

  const strategySummary = strategyAgent.summary;
  const temporalSummary = temporalAgent.summary;
  const coreSummary = coreAgent.summary;
  // v5-A9 (2026-05-10): structure LLM 失败但 agent 成功时，让 agent LLM 救场
  // 之前 openingOverride 用 baseResult 的规则引擎模板，导致即使 agent 生成了 LLM 内容，
  // opening 仍然是 "极弱格局是当前主判断，重心落在XX大运" 这种机械模板。
  // 现在当 structure 失败但任意 agent LLM 命中时，把 core/kline agent summary 作为 opening 种子
  const agentSourcesMap = (meta.agentic.orchestration.agentSources || {}) as Record<string, string>;
  const agentLlmHits = Object.values(agentSourcesMap).filter((v) => v === 'llm').length;
  const structureLlmMissing = !llmResult?.analysis?.opening && !llmResult?.analysis?.summary;
  const agentRescueActive = structureLlmMissing && agentLlmHits >= 2;
  const agentRescueOpening = agentRescueActive
    ? firstNonEmpty([coreAgent.summary, klineAgent.summary, strategyAgent.summary])
    : '';
  const agentRescueSummary = agentRescueActive
    ? firstNonEmpty([strategyAgent.summary, klineAgent.summary, coreAgent.summary])
    : '';

  const focusedNarrative = buildDeterministicFallbackNarrative(merged as FortuneAnalysisResult, {
    openingOverride: llmResult?.analysis?.opening || agentRescueOpening || baseResult.analysis?.opening,
    summaryOverride: llmResult?.analysis?.summary || agentRescueSummary || baseResult.analysis?.summary,
    explanationOverride: llmResult?.analysis?.explanation || baseResult.analysis?.explanation,
    coreSummary,
    strategySummary,
    temporalSummary,
  });

  merged.analysis.opening = focusedNarrative.opening;
  merged.analysis.summary = focusedNarrative.summary;
  merged.analysis.explanation = dedupeAdjacentNarrativeParagraphs(focusedNarrative.explanation);
  merged.analysis.judgmentBlocks = buildNarrativeJudgmentBlocks(merged as FortuneAnalysisResult, {
    coreSummary,
    strategySummary,
    temporalSummary,
  });
  merged.analysis.pastEventTemplates = buildPastEventTemplates(merged as FortuneAnalysisResult, {
    coreSummary,
    strategySummary,
    temporalSummary,
  });
  merged.analysis.qualityAudit = buildReportQualityAudit(merged as FortuneAnalysisResult);

  // World Yi v2.0 Report Integration: surface live doctrine-spine + judgment primitives
  // into stored analysis (feeds UI surfaces, upgrade lineage, and user report history).
  // Uses schedulePublishedAt + meta from publication program. New v2 pieces auto-appear
  // in reports as publication flow promotes them. Bidirectional: also populates context for agents.
  try {
    const pillarsForMatch = [
      baseResult.pattern?.type,
      ...(baseResult.advice?.yongShen || []),
      ...(baseResult.advice?.xiShen || []),
      baseResult.fortune?.currentDaYun,
    ].filter(Boolean) as string[];
    const themesForMatch = ['career', 'wealth', 'relationship', 'health', 'timing', 'kline'];
    const agentsForMatch = ['core_constitution', 'career_wealth', 'strategy_advisor', 'temporal_spatial_advisor', 'kline_narrative'];
    const worldYiV2Refs = getWorldYiV2MatchesForReport({
      pillars: pillarsForMatch,
      themes: themesForMatch,
      agentModules: agentsForMatch,
      yongShen: [...(baseResult.advice?.yongShen || []), ...(baseResult.advice?.xiShen || [])],
    }, 4);
    (merged.analysis as any).worldYiV2References = worldYiV2Refs;
    if (worldYiV2Refs.length > 0) {
      const titles = worldYiV2Refs.map((r: any) => r.title).join('；');
      (merged.analysis as any).enhancementNotes = uniqueList([
        ...(((merged.analysis as any).enhancementNotes || []) as string[]),
        `World Yi v2 doctrine 已桥接：${titles}（schedulePublishedAt 自动生效，primitives 匹配 pillars/agents）。`,
      ]);
    }
  } catch {
    // non-fatal; report still delivers
  }

  return merged;
}

export function buildDeterministicFallbackNarrative(
  result: FortuneAnalysisResult,
  extras?: {
    openingOverride?: string;
    summaryOverride?: string;
    explanationOverride?: string;
    coreSummary?: string;
    strategySummary?: string;
    temporalSummary?: string;
  }
): FallbackNarrative {
  const favored = uniqueList([
    ...(result.advice?.yongShen || []),
    ...(result.advice?.xiShen || []),
  ]).slice(0, 3);
  const actionFocus = firstNonEmpty([
    ...(result.advice?.career?.specific || []),
    ...(result.advice?.wealth?.specific || []),
    ...(result.advice?.marriage?.specific || []),
    ...(result.advice?.health?.specific || []),
  ]);
  const timingFocus = firstNonEmpty([
    result.advice?.career?.timing,
    result.advice?.wealth?.timing,
    result.advice?.marriage?.timing,
    result.advice?.health?.timing,
    result.advice?.timing?.[0],
  ]);
  const avoidFocus = firstNonEmpty([
    ...(result.advice?.career?.avoid || []),
    ...(result.advice?.wealth?.avoid || []),
    ...(result.advice?.health?.avoid || []),
    ...(result.advice?.marriage?.avoid || []),
  ]);
  const rawOpening = sanitizeNarrativeForUser([
    extras?.openingOverride || '',
    extras?.summaryOverride || '',
  ].filter(Boolean).join('。'));
  const evidenceHighlights = summarizeNarrativeEvidence([
    extras?.explanationOverride || '',
    extras?.coreSummary || '',
    result.pattern?.description || '',
    result.analysis?.opening || '',
  ].join(' '));
  const patternLine = cleanNarrativeText(
    `${result.pattern?.type || '当前命局'}是当前主判断，${result.fortune?.currentDaYun || '当前阶段'}决定接下来一段时间的推进节奏。`
  );
  const worldYiLead = cleanNarrativeText(
    [
      result.pattern?.type ? `世界易看你，你不是乱，而是${result.pattern.type}结构正在发力。` : '世界易看你，你不是乱，而是有结构。',
      result.fortune?.currentDaYun ? `当前重点就在${result.fortune.currentDaYun}这段阶段。` : '当前重点是先看阶段，不要只跟着情绪走。',
    ].join(' ')
  );
  const evidenceLine = cleanNarrativeText(
    evidenceHighlights
      || (favored.length > 0 ? `优先顺着${favored.join('、')}对应的动作去取舍。` : '')
      || result.pattern?.description
  );
  const pastValidationLine = cleanNarrativeText(
    [
      evidenceHighlights
        ? `这类结构过去往往会先在现实里反复出现相似信号，当前已经能看到的印证是：${evidenceHighlights}`
        : '',
      result.pattern?.description
        ? `命局底色早就存在，过去容易反复出现的不是偶然事件，而是${result.pattern.description}`
        : '',
    ].filter(Boolean).join('；')
  );
  const actionLine = cleanNarrativeText(
    [
      actionFocus ? stripDecisionCue(actionFocus, 'action') : '',
      timingFocus ? formatTimingReference(timingFocus) : '',
      summarizeActionOrRisk(extras?.strategySummary || '', 'action'),
    ].filter(Boolean).join('；')
  );
  const futureLine = cleanNarrativeText(
    [
      timingFocus ? formatTimingReference(timingFocus) : '',
      summarizeActionOrRisk(extras?.temporalSummary || '', 'action'),
      result.fortune?.nextYear ? sanitizeNarrativeForUser(result.fortune.nextYear) : '',
    ].filter(Boolean).join('；')
  );
  const riskLine = cleanNarrativeText(
    [
      avoidFocus ? stripDecisionCue(avoidFocus, 'risk') : '',
      summarizeActionOrRisk(extras?.temporalSummary || '', 'risk'),
      summarizeActionOrRisk(result.fortune?.interaction || '', 'risk'),
    ].filter(Boolean).join('；')
  );
  const summaryLine = cleanNarrativeText(
    sanitizeNarrativeForUser(
      extras?.summaryOverride
      || [
        worldYiLead,
        favored.length > 0 ? `优先顺着${favored.join('、')}相关方向推进。` : '',
      ].filter(Boolean).join(' ')
    )
  );
  const openingCandidate = trimToSentence(rawOpening || summaryLine || patternLine, 48);
  const openingLine = cleanNarrativeText(
    !openingCandidate
      ? summaryLine
      : openingCandidate.includes('从您的命局来看')
      ? summaryLine
      : openingCandidate
  );

  return {
    opening: openingLine,
    summary: summaryLine,
    explanation: [
      `世界易判断：先看结构，再看阶段，再看环境，最后决定动作。这种判断包含可言传的规则，也包含长期经验积累出来的默会知识。`,
      `已发生的印证：${pastValidationLine || '这类命局不是突然如此，而是过去已经在一些关键节点反复表现出同一条主线。'}。`,
      `主判断：${patternLine}`,
      `判断依据：${evidenceLine || '当前先以命局结构、行运位置和用神取舍作为主依据。'}。`,
      `接下来会怎么走：${futureLine || '后面最值得关注的，不是再听更多说法，而是看窗口变化后你的主线是否开始加速显形。'}。`,
      `现在先做：${actionLine || '先推进一个低成本、可验证的小动作，再根据反馈继续收口。'}。`,
      `风险提醒：${riskLine || '不要在时机没有坐实前同时推进多个高成本动作。'}。`,
    ].map((line) => cleanNarrativeText(sanitizeNarrativeForUser(line))).join('\n\n'),
  };
}

function buildNarrativeJudgmentBlocks(
  result: FortuneAnalysisResult,
  extras?: {
    coreSummary?: string;
    strategySummary?: string;
    temporalSummary?: string;
  }
): NarrativeJudgmentBlocks {
  const favored = uniqueList([
    ...(result.advice?.yongShen || []),
    ...(result.advice?.xiShen || []),
  ]).slice(0, 3);
  const actionFocus = firstNonEmpty([
    ...(result.advice?.career?.specific || []),
    ...(result.advice?.wealth?.specific || []),
    ...(result.advice?.marriage?.specific || []),
    ...(result.advice?.health?.specific || []),
  ]);
  const timingFocus = firstNonEmpty([
    result.advice?.career?.timing,
    result.advice?.wealth?.timing,
    result.advice?.marriage?.timing,
    result.advice?.health?.timing,
    result.advice?.timing?.[0],
  ]);
  const avoidFocus = firstNonEmpty([
    ...(result.advice?.career?.avoid || []),
    ...(result.advice?.wealth?.avoid || []),
    ...(result.advice?.health?.avoid || []),
    ...(result.advice?.marriage?.avoid || []),
  ]);
  const evidenceHighlights = summarizeNarrativeEvidence([
    extras?.coreSummary || '',
    result.pattern?.description || '',
    result.analysis?.opening || '',
    result.analysis?.explanation || '',
  ].join(' '));
  const pastEvidence = dedupeNarrativeSegments([
    evidenceHighlights
      ? `已经出现过的相似信号：${evidenceHighlights}`
      : '',
    result.pattern?.description
      ? `反复发生的底层原因：${result.pattern.description}`
      : '',
    result.fortune?.interaction
      ? `过去常见的表现方式：${summarizeActionOrRisk(result.fortune.interaction, 'risk') || sanitizeNarrativeForUser(result.fortune.interaction)}`
      : '',
  ].map((item) => cleanNarrativeText(item)).filter(Boolean)).slice(0, 3);
  const presentEvidence = dedupeNarrativeSegments([
    result.pattern?.type ? `当前主轴：${result.pattern.type}` : '',
    result.fortune?.currentDaYun ? `当前阶段：${result.fortune.currentDaYun}` : '',
    favored.length > 0 ? `顺势重点：${favored.join('、')}` : '',
    extras?.coreSummary || '',
  ].map((item) => cleanNarrativeText(item)).filter(Boolean)).slice(0, 3);
  const futureEvidence = dedupeNarrativeSegments([
    timingFocus ? formatTimingReference(timingFocus) : '',
    actionFocus ? `下一步动作：${stripDecisionCue(actionFocus, 'action')}` : '',
    avoidFocus ? `先避开的动作：${stripDecisionCue(avoidFocus, 'risk')}` : '',
    extras?.strategySummary ? summarizeActionOrRisk(extras.strategySummary, 'action') : '',
    extras?.temporalSummary ? summarizeActionOrRisk(extras.temporalSummary, 'action') : '',
    result.fortune?.nextYear ? sanitizeNarrativeForUser(result.fortune.nextYear) : '',
  ].map((item) => cleanNarrativeText(item)).filter(Boolean)).slice(0, 4);

  return {
    pastValidation: {
      headline: cleanNarrativeText(
        pastEvidence[0]
          ? '你过去的人生里，已经反复出现过与这份命理结构一致的信号。'
          : '这类命局不会突然显形，过去通常已经埋下相同主线。'
      ),
      evidence: pastEvidence,
    },
    presentDiagnosis: {
      headline: cleanNarrativeText(
        [
          result.pattern?.type ? `你现在真正处在 ${result.pattern.type} 的发力阶段。` : '',
          result.fortune?.currentDaYun ? `当前关键不在多想，而在看清 ${result.fortune.currentDaYun} 这一步到底要你怎么走。` : '',
        ].filter(Boolean).join(' ')
      ) || '你现在最重要的，不是继续寻找更多答案，而是看清当前阶段的主轴。',
      evidence: presentEvidence,
    },
    futureGuidance: {
      headline: cleanNarrativeText(
        timingFocus
          ? `接下来最容易起变化的是 ${formatTimingReference(timingFocus)} 这一段，动作要提前收口。`
          : '接下来真正拉开差距的，不是想法，而是你是否顺着窗口把关键动作做准。'
      ),
      evidence: futureEvidence,
    },
  };
}

function buildPastEventTemplates(
  result: FortuneAnalysisResult,
  extras?: {
    coreSummary?: string;
    strategySummary?: string;
    temporalSummary?: string;
  }
): PastEventTemplate[] {
  const interactionRisk = summarizeActionOrRisk(result.fortune?.interaction || '', 'risk');
  const strategyAction = summarizeActionOrRisk(extras?.strategySummary || '', 'action');
  const temporalAction = summarizeActionOrRisk(extras?.temporalSummary || '', 'action');
  const normalizedCurrentDaYun = cleanNarrativeText(result.fortune?.currentDaYun || '当前阶段');
  const windowHint = cleanNarrativeText(
    firstNonEmpty([
      formatTimingReference(firstNonEmpty([
        result.advice?.career?.timing,
        result.advice?.wealth?.timing,
        result.advice?.marriage?.timing,
        result.advice?.health?.timing,
      ])),
      normalizedCurrentDaYun,
    ])
  );

  const candidates: PastEventTemplate[] = [
    {
      key: 'career_shift',
      title: '过去出现过一次事业方向重排或岗位切换',
      type: 'career',
      description: `你过去大概率经历过一次“继续硬撑不对、换方向才对”的阶段，常见表现是岗位调整、项目重排、离开原团队，或者突然意识到原路径不能再按老办法走。`,
      reason: cleanNarrativeText(
        [
          result.pattern?.type ? `${result.pattern.type} 在现实里常先表现为事业主线重排。 ` : '',
          normalizedCurrentDaYun ? `当前判断主轴落在 ${normalizedCurrentDaYun}，说明这种切换并不随机。 ` : '',
          strategyAction || extras?.coreSummary || '',
        ].join('')
      ),
      confidenceLabel: 'high',
      occurrenceWindow: windowHint,
    },
    {
      key: 'relationship_tension',
      title: '过去出现过一次关系压力上升或沟通明显失衡',
      type: 'marriage',
      description: '你过去大概率经历过一段关系摩擦明显放大的时期，常见表现是冷战、反复争执、推进受阻，或者需要重新定义边界。',
      reason: cleanNarrativeText(
        [
          result.advice?.marriage?.general || '',
          interactionRisk || '',
          result.pattern?.description || '',
        ].join('；')
      ),
      confidenceLabel: 'medium',
      occurrenceWindow: windowHint,
    },
    {
      key: 'health_overdraw',
      title: '过去出现过一次明显透支或恢复周期变长',
      type: 'health',
      description: '你过去很可能有过一段身体和情绪一起下滑的阶段，常见表现是睡眠紊乱、疲惫堆积、效率下降，或者必须靠休整才能拉回来。',
      reason: cleanNarrativeText(
        [
          result.advice?.health?.general || '',
          ...(result.advice?.health?.avoid || []).slice(0, 1),
          interactionRisk,
        ].filter(Boolean).join('；')
      ),
      confidenceLabel: 'high',
      occurrenceWindow: '高压阶段前后',
    },
    {
      key: 'money_rebalance',
      title: '过去出现过一次钱财分配失衡或现金流收缩',
      type: 'wealth',
      description: '你过去大概率有过一次明显的财务收缩或资源错配，常见表现是支出压力突然变大、投入回报不成正比，或者不得不重新安排现金流。',
      reason: cleanNarrativeText(
        [
          result.advice?.wealth?.general || '',
          ...(result.advice?.wealth?.avoid || []).slice(0, 1),
          temporalAction,
        ].filter(Boolean).join('；')
      ),
      confidenceLabel: 'medium',
      occurrenceWindow: windowHint,
    },
  ];

  return candidates
    .map((item) => ({
      ...item,
      title: cleanNarrativeText(item.title),
      description: cleanNarrativeText(item.description),
      reason: cleanNarrativeText(item.reason),
      occurrenceWindow: cleanNarrativeText(item.occurrenceWindow || ''),
    }))
    .filter((item) => item.title && item.description && item.reason)
    .slice(0, 4);
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
    specific: sanitizeAdviceItems('career', [
      ...(llmAdvice?.specific || baseAdvice?.specific || []),
      ...careerAgent.actions,
      ...strategyAgent.actions.slice(0, 1),
    ]),
    timing: sanitizeAdviceTiming('career', llmAdvice?.timing || baseAdvice?.timing || windowLabel(careerAgent) || windowLabel(strategyAgent)),
    avoid: sanitizeAdviceItems('career', [
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
    ]),
    specific: sanitizeAdviceItems('wealth', [
      ...(llmAdvice?.specific || baseAdvice?.specific || []),
      ...careerAgent.actions,
      ...strategyAgent.actions,
      ...temporalAgent.actions,
    ]),
    timing: sanitizeAdviceTiming('wealth', llmAdvice?.timing || baseAdvice?.timing || windowLabel(strategyAgent) || windowLabel(temporalAgent)),
    direction: llmAdvice?.direction || baseAdvice?.direction || '',
    colors: llmAdvice?.colors || baseAdvice?.colors || [],
    avoid: sanitizeAdviceItems('wealth', [
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
    specific: sanitizeAdviceItems('marriage', [
      ...(llmAdvice?.specific || baseAdvice?.specific || []),
      ...relationshipAgent.actions,
    ]),
    timing: sanitizeAdviceTiming('marriage', llmAdvice?.timing || baseAdvice?.timing || windowLabel(relationshipAgent)),
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
    specific: sanitizeAdviceItems('health', [
      ...(llmAdvice?.specific || baseAdvice?.specific || []),
      ...healthAgent.actions,
    ]),
    timing: sanitizeAdviceTiming('health', llmAdvice?.timing || baseAdvice?.timing || windowLabel(healthAgent)),
    directions: llmAdvice?.directions || baseAdvice?.directions || [],
    colors: llmAdvice?.colors || baseAdvice?.colors || [],
    avoid: sanitizeAdviceItems('health', [
      ...(llmAdvice?.avoid || baseAdvice?.avoid || []),
      ...healthAgent.risks,
    ]),
  };
}

function buildReportSectionOwnership() {
  return {
    cockpit: ['opening', 'summary', 'currentDaYun', 'decisionPlaybook', 'actionSuggestions', 'confidence'],
    lifeKLine: ['klineData', 'yearlyTrendSnapshots', 'stateVector'],
    blueprint: ['pattern', 'dayMaster', 'yongShen', 'xiShen', 'jiShen', 'expertInterpretation'],
    currentOperatingSystem: ['scenarioViews', 'fortune.interaction', 'stateVector', 'confidence'],
    timeline12Months: ['monthlyWindows'],
    scenarioPanels: ['scenarioViews'],
    actionBoard: ['decisionPlaybook', 'actionSuggestions'],
    validationLayer: ['confidence', 'validationInsights', 'correctionInsight'],
    personalityBridge: ['pattern', 'expertInterpretation.tags'],
  } as const;
}

function uniqueList(values: string[]) {
  return [...new Set(values.filter(Boolean))].slice(0, 6);
}

function joinParagraphs(values: Array<string | undefined>) {
  const paragraphs = values
    .flatMap((value) => `${value || ''}`.split(/\n+/))
    .map((value) => cleanNarrativeText(sanitizeNarrativeForUser(value)))
    .filter(Boolean);

  return dedupeNarrativeSegments(paragraphs).join('\n\n');
}

function firstNonEmpty(values: Array<string | undefined>) {
  return values.map((item) => `${item || ''}`.trim()).find(Boolean) || '';
}

function cleanNarrativeText(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[，,；;:：]+/g, '')
    .replace(/[，,]\s*[，,]/g, '，')
    .replace(/[；;]{2,}/g, '；')
    .replace(/[。]{2,}/g, '。')
    .replace(/([，；])。/g, '。')
    .replace(/：\s+/g, '：')
    .trim()
    .replace(/[；;,，。]+$/g, '');
}

function windowLabel(agent: ReturnType<typeof readAgentData>) {
  return agent.windows?.[0]?.label || '';
}

const NARRATIVE_NOISE_PATTERNS = [
  /macro_cycle/ig,
  /solar_terms?/ig,
  /geography/ig,
  /industry_cycle/ig,
  /geoClimate/ig,
  /spatialFactors?/ig,
  /currentSolarTerm/ig,
  /nationalCycle/ig,
  /天时外部参照[^。]*。?/g,
  /地利外部参照[^。]*。?/g,
  /人和外部参照[^。]*。?/g,
  /这份命盘的落地效果会被[^。]*。?/g,
  /当前最优策略不是同时做很多事[^。]*。?/g,
  /命局主轴围绕[^。]*。?/g,
  /生时环境落在[^。]*。?/g,
  /四柱落点为[^。]*。?/g,
  /现实落地优先结合[^。]*。?/g,
  /主攻方向先放在[^；。]*[；。]?/g,
  /(?:^|[。；，,\s])(?:当前)?(?:事业|财富|关系|健康)窗口[:：][^。；]*/g,
  /解释增强即可。?/g,
  /格局清正。?/g,
  /乃富贵之命也。?/g,
  /(?:relationship|family_role|settlement)/ig,
];

const HYPE_OPENING_PATTERNS = [
  /^细观您的八字[，,]?/,
  /^您好[，,][^。]{0,12}。?/,
  /^从您的八字来看[，,]?/,
  /^王焙琪[，,]/,
];

function sanitizeNarrativeForUser(value: string) {
  let next = `${value || ''}`;

  for (const pattern of NARRATIVE_NOISE_PATTERNS) {
    next = next.replace(pattern, ' ');
  }

  next = next
    .replace(/\b([A-Za-z_]+)\b/g, (token) => (
      ['macro_cycle', 'solar_terms', 'geography', 'industry_cycle', 'geoClimate', 'spatialFactors', 'currentSolarTerm', 'nationalCycle']
        .includes(token)
        ? ''
        : token
    ))
    .replace(/(\d{4})-\1/g, '$1年前后')
    .replace(/围绕(\d{4})-(\d{4})(?:阶段|窗口)排序动作/g, (_, start, end) => {
      const normalized = normalizeWindowRange(Number(start), Number(end));
      return normalized === '当前阶段'
        ? '围绕当前阶段排序动作'
        : `围绕${normalized}排序动作`;
    })
    .replace(/[（(][^)）]*(macro_cycle|solar_terms|geography|industry_cycle)[^)）]*[）)]/ig, '')
    .replace(/\s+/g, ' ')
    .replace(/[；;]{2,}/g, '；')
    .replace(/[。]{2,}/g, '。')
    .replace(/([，；])。/g, '。')
    .trim();

  return next;
}

function summarizeNarrativeEvidence(value: string) {
  const sentences = splitChineseSentences(sanitizeNarrativeForUser(value))
    .filter((sentence) => sentence.length >= 8)
    .filter((sentence) => !/^当前最优策略/.test(sentence))
    .filter((sentence) => !/命局主轴|生时环境|四柱落点/.test(sentence))
    .slice(0, 2);

  return cleanNarrativeText(sentences.join('；'));
}

function summarizeActionOrRisk(value: string, kind: 'action' | 'risk') {
  const sentences = splitChineseSentences(sanitizeNarrativeForUser(value))
    .filter((sentence) => sentence.length >= 8)
    .filter((sentence) => kind === 'action'
      ? /(适合|宜|先|可以|推进|布局|收口|聚焦|发力)/.test(sentence)
      : /(不要|避免|风险|谨慎|留出缓冲|先别)/.test(sentence))
    .slice(0, 1);

  return cleanNarrativeText(sentences.join('；'));
}

function splitChineseSentences(value: string) {
  return `${value || ''}`
    .split(/[。！？!?\n]+/)
    .map((item) => cleanNarrativeText(item))
    .filter(Boolean);
}

function trimToSentence(value: string, limit: number) {
  const normalized = sanitizeNarrativeForUser(value);
  const firstSentence = splitChineseSentences(normalized)[0] || normalized;
  const deHyped = HYPE_OPENING_PATTERNS.reduce(
    (text, pattern) => text.replace(pattern, ''),
    firstSentence
  ).trim();

  if (deHyped.length <= limit) {
    return deHyped;
  }

  return `${deHyped.slice(0, Math.max(0, limit - 1)).trim()}…`;
}

function formatTimingReference(value: string) {
  const normalized = stripDecisionCue(cleanNarrativeText(sanitizeNarrativeForUser(value)), 'timing');
  if (!normalized) {
    return '';
  }

  if (/(年|月|季度|上半年|下半年|农历|近期|阶段|窗口|岁|春|夏|秋|冬)/.test(normalized)) {
    return `重点窗口放在${normalized}`;
  }

  return `重点参照${normalized}`;
}

type AdviceTopic = 'career' | 'wealth' | 'marriage' | 'health';

const ADVICE_TOPIC_BLOCKERS: Record<AdviceTopic, RegExp[]> = {
  career: [/围绕(?:财富|关系|健康)做一条最短路径/, /主攻方向先放在(?:财富|关系|健康)/, /(?:财富|关系|健康)板块把节奏拖散/],
  wealth: [/围绕(?:事业|关系|健康)做一条最短路径/, /主攻方向先放在(?:事业|关系|健康)/, /(?:事业|关系|健康)板块把节奏拖散/],
  marriage: [/围绕(?:事业|财富|健康)做一条最短路径/, /主攻方向先放在(?:事业|财富|健康)/, /(?:事业|财富|健康)板块把节奏拖散/],
  health: [/围绕(?:事业|财富|关系)做一条最短路径/, /主攻方向先放在(?:事业|财富|关系)/, /(?:事业|财富|关系)板块把节奏拖散/],
};

function sanitizeAdviceItems(topic: AdviceTopic, values: string[]) {
  const blockers = ADVICE_TOPIC_BLOCKERS[topic];

  return dedupeNarrativeSegments(values
    .map((value) => cleanNarrativeText(sanitizeNarrativeForUser(value)))
    .filter((value) => value.length >= 4)
    .filter((value) => !blockers.some((pattern) => pattern.test(value))))
    .slice(0, 6);
}

function sanitizeAdviceTiming(topic: AdviceTopic, value: string) {
  const [timing] = sanitizeAdviceItems(topic, [value]);
  return timing || '';
}

function repairExistingAdvice(advice?: FortuneAnalysisResult['advice']) {
  return {
    ...(advice || {}),
    career: advice?.career ? {
      ...advice.career,
      general: joinParagraphs([advice.career.general]),
      specific: sanitizeAdviceItems('career', advice.career.specific || []),
      timing: sanitizeAdviceTiming('career', advice.career.timing || ''),
      avoid: sanitizeAdviceItems('career', advice.career.avoid || []),
    } : undefined,
    wealth: advice?.wealth ? {
      ...advice.wealth,
      general: joinParagraphs([advice.wealth.general]),
      specific: sanitizeAdviceItems('wealth', advice.wealth.specific || []),
      timing: sanitizeAdviceTiming('wealth', advice.wealth.timing || ''),
      avoid: sanitizeAdviceItems('wealth', advice.wealth.avoid || []),
    } : undefined,
    marriage: advice?.marriage ? {
      ...advice.marriage,
      general: joinParagraphs([advice.marriage.general]),
      specific: sanitizeAdviceItems('marriage', advice.marriage.specific || []),
      timing: sanitizeAdviceTiming('marriage', advice.marriage.timing || ''),
      avoid: sanitizeAdviceItems('marriage', advice.marriage.avoid || []),
    } : undefined,
    health: advice?.health ? {
      ...advice.health,
      general: joinParagraphs([advice.health.general]),
      specific: sanitizeAdviceItems('health', advice.health.specific || []),
      timing: sanitizeAdviceTiming('health', advice.health.timing || ''),
      avoid: sanitizeAdviceItems('health', advice.health.avoid || []),
    } : undefined,
    colors: advice?.colors || [],
    directions: advice?.directions || [],
    numbers: advice?.numbers || [],
    yongShen: advice?.yongShen || [],
    jiShen: advice?.jiShen || [],
    xiShen: advice?.xiShen || [],
    timing: dedupeNarrativeSegments((advice?.timing || [])
      .map((value) => stripDecisionCue(cleanNarrativeText(sanitizeNarrativeForUser(value)), 'timing'))
      .filter((value) => value.length >= 2)),
  };
}

function stripDecisionCue(value: string, kind: 'action' | 'risk' | 'timing') {
  const normalized = cleanNarrativeText(sanitizeNarrativeForUser(value));
  if (!normalized) {
    return '';
  }

  const patterns = kind === 'action'
    ? [/^(?:现在更适合先做|现在先做|先做|宜先|先把)[：:\s]*/]
    : kind === 'risk'
    ? [/^(?:先别做|不要|避免|应避免)[：:\s]*/]
    : [/^(?:重点窗口放在|重点参照)[：:\s]*/];

  return patterns.reduce((text, pattern) => text.replace(pattern, '').trim(), normalized);
}

function dedupeNarrativeSegments(values: string[]) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalized = normalizeNarrativeForCompare(value);
    if (!normalized || seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

function dedupeAdjacentNarrativeParagraphs(value: string) {
  const paragraphs = `${value || ''}`
    .split(/\n{2,}/)
    .map((item) => cleanNarrativeText(item))
    .filter(Boolean);

  return dedupeNarrativeSegments(paragraphs).join('\n\n');
}

function normalizeNarrativeForCompare(value: string) {
  return cleanNarrativeText(sanitizeNarrativeForUser(value))
    .replace(/[，。；：、\s]/g, '')
    .toLowerCase();
}

function hasStructuredNarrativeSections(value: string) {
  return ['世界易判断：', '主判断：', '判断依据：', '现在先做：', '风险提醒：']
    .every((label) => `${value || ''}`.includes(label));
}

function normalizeWindowRange(startYear: number, endYear: number) {
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    return '';
  }

  if (startYear === endYear) {
    return `${startYear}年前后`;
  }

  const currentYear = new Date().getUTCFullYear();
  if (endYear < currentYear - 1 || startYear > currentYear + 8) {
    return '当前阶段';
  }

  return `${startYear}-${endYear}阶段`;
}
