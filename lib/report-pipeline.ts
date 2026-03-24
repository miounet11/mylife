import { analyzeFortune } from '@/lib/fortune-engine';
import { runAgenticPipeline } from '@/lib/agentic-report';
import { CORE_AGENT_KEYS, type CoreAgentKey } from '@/lib/agentic-report/agent-definitions';
import { getModelFallbackChain } from '@/lib/llm-model-fallback';
import {
  assessScopeProviderHealth,
  hasRunnableModelsForSnapshots,
  shouldConservativelyDeferForSnapshots,
} from '@/lib/llm-provider-health';
import { generateFortuneInterpretationCore, generateFortuneInterpretationFollowup } from '@/lib/llm';
import { buildReportQualityAudit } from '@/lib/report-quality';
import { deriveReportReasoningMode } from '@/lib/report-reasoning-mode';
import type { FortuneAnalysisResult, FortuneRecord } from '@/lib/user-types';

const ANALYZE_LLM_CORE_TIMEOUT_MS = 12000;
const ANALYZE_LLM_FOLLOWUP_TIMEOUT_MS = 5000;
const ENABLE_AGENTIC_PIPELINE = process.env.ENABLE_AGENTIC_PIPELINE !== '0';
const ANALYZE_FRONT_AGENT_KEYS: CoreAgentKey[] = [
  'core_constitution',
  'kline_narrative',
  'strategy_advisor',
];
const ANALYZE_FALLBACK_AGENT_KEYS: CoreAgentKey[] = [
  'kline_narrative',
  'strategy_advisor',
];
const ANALYZE_AGENT_MAIN_TASK_TIMEOUT_MS = 13000;
const ANALYZE_AGENT_MAIN_LLM_TIMEOUT_MS = 12000;

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

type PipelineSource = 'analyze' | 'upgrade';
type ReportStage = 'engine' | 'llm' | 'agentic' | 'merge';

type FallbackNarrative = {
  opening: string;
  summary: string;
  explanation: string;
};

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
  const llmCore = await enhanceWithLLM(baseResult as unknown as Record<string, unknown>, null, async (event) => {
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
      ? '语言模型增强已完成，正文将使用更完整的解释与建议。'
      : '核心解释未稳定返回，当前将回退为结构化引擎与专家层整合输出。',
  });
  await params.onProgress?.({
    stage: 'agentic',
    status: 'started',
    detail: llmCore.llmUsed
      ? '核心解释已返回，正在并行补强建议层与并发专家 Agent 视角。'
      : '当前直接进入并发专家 Agent 阶段，优先保证结果稳定交付。',
  });
  const agentScopeHealth = assessScopeProviderHealth(
    getModelFallbackChain(process.env.DEFAULT_MODEL || 'auto'),
    'agent'
  );
  const shouldRunAgentic = ENABLE_AGENTIC_PIPELINE
    && !agentScopeHealth.shouldDefer
    && !shouldConservativelyDeferForSnapshots(agentScopeHealth.snapshots || []);
  const agentKeys = params.source === 'analyze'
    ? resolveAnalyzeAgentKeys({
        llmUsed: llmCore.llmUsed,
        shouldRunAgentic,
      })
    : [...CORE_AGENT_KEYS];
  const [llmEnhancement, agentic] = await Promise.all([
    llmCore.llmInterpretation
      ? enhanceWithLLM(baseResult as unknown as Record<string, unknown>, llmCore.llmInterpretation as Record<string, unknown>, async (event) => {
          await params.onProgress?.({
            stage: 'llm',
            status: 'started',
            detail: event.detail,
          });
        })
      : Promise.resolve(llmCore),
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
      ? '当前 Agent 模型波动较大，本次已切换为稳定专家层兜底输出，避免长时间等待。'
      : agentic.used || ((agentic.orchestration.successRate || 0) > 0)
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
    llmUnavailable: llmEnhancement.llmUnavailable,
    deferredByProviderHealth: llmEnhancement.deferredByProviderHealth,
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
  draft: Record<string, unknown> | null,
  onProgress?: (event: {
    type: 'model-attempt' | 'model-fallback' | 'model-success' | 'model-failed';
    model: string;
    nextModel?: string;
    detail: string;
  }) => void | Promise<void>
) {
  try {
    const llmHealth = assessScopeProviderHealth(
      getModelFallbackChain(process.env.DEFAULT_MODEL || 'auto', 'report'),
      'report'
    );
    const reportSnapshots = llmHealth.snapshots || [];
    if (
      (llmHealth.shouldDefer && !hasRunnableModelsForSnapshots(reportSnapshots))
      || shouldConservativelyDeferForSnapshots(reportSnapshots)
    ) {
      await onProgress?.({
        type: 'model-failed',
        model: 'provider_health_gate',
        detail: '当前报告增强模型全部处于熔断或不可探测状态，本次直接采用结构化引擎与专家层结果，避免长时间等待。',
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
        ANALYZE_LLM_CORE_TIMEOUT_MS,
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
      ANALYZE_LLM_FOLLOWUP_TIMEOUT_MS,
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
  const focusedNarrative = buildDeterministicFallbackNarrative(merged as FortuneAnalysisResult, {
    openingOverride: llmResult?.analysis?.opening || baseResult.analysis?.opening,
    summaryOverride: llmResult?.analysis?.summary || baseResult.analysis?.summary,
    explanationOverride: llmResult?.analysis?.explanation || baseResult.analysis?.explanation,
    coreSummary,
    strategySummary,
    temporalSummary,
  });

  merged.analysis.opening = focusedNarrative.opening;
  merged.analysis.summary = focusedNarrative.summary;
  merged.analysis.explanation = focusedNarrative.explanation;
  merged.analysis.qualityAudit = buildReportQualityAudit(merged as FortuneAnalysisResult);

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
  const evidenceLine = cleanNarrativeText(
    evidenceHighlights
      || (favored.length > 0 ? `优先顺着${favored.join('、')}对应的动作去取舍。` : '')
      || result.pattern?.description
  );
  const actionLine = cleanNarrativeText(
    [
      actionFocus ? `现在更适合先做：${actionFocus}` : '',
      timingFocus ? `重点窗口放在${timingFocus}` : '',
      summarizeActionOrRisk(extras?.strategySummary || '', 'action'),
    ].filter(Boolean).join('；')
  );
  const riskLine = cleanNarrativeText(
    [
      avoidFocus ? `先别做：${avoidFocus}` : '',
      summarizeActionOrRisk(extras?.temporalSummary || '', 'risk'),
      summarizeActionOrRisk(result.fortune?.interaction || '', 'risk'),
    ].filter(Boolean).join('；')
  );
  const summaryLine = cleanNarrativeText(
    sanitizeNarrativeForUser(
      extras?.summaryOverride
      || [
        patternLine,
        favored.length > 0 ? `优先顺着${favored.join('、')}相关方向推进。` : '',
      ].filter(Boolean).join(' ')
    )
  );
  const openingLine = cleanNarrativeText(
    trimToSentence(rawOpening || summaryLine || patternLine, 48)
  );

  return {
    opening: openingLine,
    summary: summaryLine,
    explanation: [
      `主判断：${patternLine}`,
      `判断依据：${evidenceLine || '当前先以命局结构、行运位置和用神取舍作为主依据。'}。`,
      `现在先做：${actionLine || '先推进一个低成本、可验证的小动作，再根据反馈继续收口。'}。`,
      `风险提醒：${riskLine || '不要在时机没有坐实前同时推进多个高成本动作。'}。`,
    ].map((line) => cleanNarrativeText(sanitizeNarrativeForUser(line))).join('\n\n'),
  };
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

function firstNonEmpty(values: Array<string | undefined>) {
  return values.map((item) => `${item || ''}`.trim()).find(Boolean) || '';
}

function cleanNarrativeText(value: string) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/[；;]{2,}/g, '；')
    .replace(/[。]{2,}/g, '。')
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
  /这份命盘的落地效果会被[^。]*。?/g,
  /命局主轴围绕[^。]*。?/g,
  /生时环境落在[^。]*。?/g,
  /四柱落点为[^。]*。?/g,
  /当前最优策略不是同时做很多事[^。]*。?/g,
  /现实落地优先结合[^。]*。?/g,
  /解释增强即可。?/g,
  /格局清正。?/g,
  /乃富贵之命也。?/g,
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
    .replace(/[（(][^)）]*(macro_cycle|solar_terms|geography|industry_cycle)[^)）]*[）)]/ig, '')
    .replace(/\s+/g, ' ')
    .replace(/[；;]{2,}/g, '；')
    .replace(/[。]{2,}/g, '。')
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
