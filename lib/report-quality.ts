import type { FortuneAnalysisResult } from '@/lib/user-types';

export type ReportQualityDimensionKey =
  | 'engine'
  | 'llm'
  | 'agentic'
  | 'consistency'
  | 'completeness';

export type ReportQualityDimensionStatus = 'strong' | 'ok' | 'watch' | 'weak';
export type ReportQualityAuditStatus = 'ready' | 'watch' | 'retry';
export type ReportQualityAuditGrade = 'S' | 'A' | 'B' | 'C';
export type ReportDeliveryTier = 'basic' | 'enhanced' | 'expert';
export type UserFacingReportStageKey = 'simple' | 'deep' | 'detailed';
export type UserFacingReportStageStatus = 'completed' | 'current' | 'locked';

export const REPORT_EXPERT_TARGET_SCORE = 95;
export const REPORT_EXPERT_TARGET_GRADE: ReportQualityAuditGrade = 'S';
const REPORT_EXPERT_DIMENSION_FLOORS: Record<ReportQualityDimensionKey, number> = {
  engine: 90,
  llm: 90,
  agentic: 85,
  consistency: 95,
  completeness: 95,
};

export interface ReportQualityAuditDimension {
  key: ReportQualityDimensionKey;
  label: string;
  score: number;
  status: ReportQualityDimensionStatus;
  detail: string;
}

export interface ReportQualityAudit {
  overallScore: number;
  grade: ReportQualityAuditGrade;
  status: ReportQualityAuditStatus;
  deliveryTier: ReportDeliveryTier;
  targetScore: number;
  targetGrade: ReportQualityAuditGrade;
  targetAchieved: boolean;
  summary: string;
  dimensions: ReportQualityAuditDimension[];
  strengths: string[];
  concerns: string[];
  blockingIssues: string[];
  recommendedActions: string[];
  nextActionLabel: string;
}

interface NarrativeQualitySignals {
  missingSummary: boolean;
  leakedInternalTerms: boolean;
  duplicateNarrative: boolean;
  malformedRange: boolean;
  templateResidue: boolean;
  crossTopicLeak: boolean;
  severeUserVisibleDefect: boolean;
}

interface MeasurementStageSignal {
  id?: string;
  label?: string;
  order?: number;
  score?: number;
  level?: string;
  conclusion?: string;
  evidence?: unknown[];
  actions?: unknown[];
}

interface MeasurementStageQualitySummary {
  total: number;
  complete: boolean;
  ordered: boolean;
  evidenceComplete: boolean;
  actionComplete: boolean;
  averageScore: number;
  riskStages: Array<Required<Pick<MeasurementStageSignal, 'id' | 'label' | 'conclusion'>> & { score: number }>;
}

const EXPECTED_MEASUREMENT_STAGE_IDS = [
  'pillars',
  'five-elements',
  'day-master-strength',
  'pattern',
  'ten-gods',
  'yong-shen',
  'shen-sha',
  'dayun',
  'kline',
  'domain-advice',
];

export function buildReportQualityAudit(result: FortuneAnalysisResult): ReportQualityAudit {
  const llmUsed = !!result.analysis?.llmUsed;
  const providerHealthDeferred = result.analysis?.providerHealthDeferred === true;
  const orchestration = result.analysis?.orchestration;
  const verify = result.analysis?.verify;
  const agentSuccessRate = typeof orchestration?.successRate === 'number'
    ? orchestration.successRate
    : 0;
  const totalAgentCalls = orchestration?.totalLlmCalls || 0;
  const narrativeSignals = inspectNarrativeQuality(result);
  const measurementSummary = inspectMeasurementStageQuality(result);

  const engineScore = clampScore(scoreEngineFoundation(result, measurementSummary));
  const llmScore = clampScore(scoreLLMEnhancement(result, narrativeSignals));
  const agenticScore = clampScore(scoreAgenticExecution(result));
  const consistencyScore = clampScore(
    (verify?.consistencyScore ?? 62) - getConsistencyPenalty(narrativeSignals)
  );
  const completenessScore = clampScore(scoreCompleteness(result, narrativeSignals, measurementSummary));

  const dimensions: ReportQualityAuditDimension[] = [
    {
      key: 'engine',
      label: '命理底座',
      score: engineScore,
      status: toDimensionStatus(engineScore),
      detail: engineScore >= 85
        ? '四柱、五行、运势结构与人生 K 线底座较完整。'
        : '基础结构可用，但仍有部分底座信号不够完整。',
    },
    {
      key: 'llm',
      label: '正文质量',
      score: llmScore,
      status: toDimensionStatus(llmScore),
      detail: llmUsed
        ? narrativeSignals.severeUserVisibleDefect
          ? '本次虽然拿到了补全文本，但仍有明显模板化或脏文本残留。'
          : '本次拿到了更完整的正文补全。'
        : '本次未获得稳定的正文补全，正文以结构化整合输出为主。',
    },
    {
      key: 'agentic',
      label: '专家协同',
      score: agenticScore,
      status: toDimensionStatus(agenticScore),
      detail: totalAgentCalls > 0
        ? `多维补充判断已执行，完成度约 ${Math.round(agentSuccessRate * 100)}%。`
        : '当前主要采用基础结构判断和规则化补强。',
    },
    {
      key: 'consistency',
      label: '一致性校验',
      score: consistencyScore,
      status: toDimensionStatus(consistencyScore),
      detail: narrativeSignals.malformedRange
        ? '阶段窗口文本存在异常，时机判断需按保守分处理。'
        : verify?.verdict
        ? `当前校验结论为 ${verify.verdict}。`
        : '当前未拿到完整校验结论，按保守评分处理。',
    },
    {
      key: 'completeness',
      label: '内容完整度',
      score: completenessScore,
      status: toDimensionStatus(completenessScore),
      detail: narrativeSignals.missingSummary
        ? '阶段摘要缺失，用户无法第一眼获取主结论。'
        : completenessScore >= 85
        ? '正文、建议、窗口与趋势内容相对充足。'
        : '内容可阅读，但解释深度或行动建议仍有补强空间。',
    },
  ];

  const overallScore = clampScore(Math.round(
    engineScore * 0.18 +
    llmScore * 0.24 +
    agenticScore * 0.16 +
    consistencyScore * 0.22 +
    completenessScore * 0.2
  ));

  const status = deriveAuditStatus({
    overallScore,
    llmUsed,
    providerHealthDeferred,
    verifyVerdict: verify?.verdict,
    agentSuccessRate,
    narrativeSignals,
  });
  const grade = deriveAuditGrade(overallScore);

  const strengths: string[] = [];
  const concerns: string[] = [];
  const recommendedActions: string[] = [];

  if (engineScore >= 85) {
    strengths.push('命理底座完整，四柱、五行、运势与 K 线结构已成型。');
  } else {
    concerns.push('底座信息完整度一般，部分结构信号还不够扎实。');
  }

  if (measurementSummary.complete && measurementSummary.ordered && measurementSummary.evidenceComplete && measurementSummary.actionComplete) {
    strengths.push('十个测算环节已形成完整证据链，报告不是拼接文案。');
  } else if (measurementSummary.total > 0) {
    concerns.push('测算环节证据链不完整，部分结果组合还需要补齐依据或行动项。');
    recommendedActions.push('优先补齐低分测算环节的 evidence/actions，再进入正式报告编排。');
  }

  measurementSummary.riskStages.slice(0, 2).forEach((stage) => {
    concerns.push(`${stage.label}环节评分偏低，建议复核：${stage.conclusion}`);
  });
  if (measurementSummary.riskStages.length > 0) {
    recommendedActions.push(`先复核${measurementSummary.riskStages[0].label}等薄弱测算环节，再做结果组合推荐。`);
  }

  if (llmUsed) {
    if (!narrativeSignals.severeUserVisibleDefect) {
      strengths.push('本次拿到了更完整的正文补全，解释会更细更完整。');
    }
  } else if (providerHealthDeferred) {
    strengths.push('系统已切换为稳定专家版交付，避免长时间等待后仍返回不可读结果。');
    recommendedActions.push('当前版本可先使用；稍后再触发增强重算以争取更高分专家版。');
  } else {
    concerns.push('本次未获得稳定的正文补全，文本深度会低于理想版本。');
    recommendedActions.push('建议稍后使用当前版本重新升级重算，争取拿到完整正文。');
  }

  if (totalAgentCalls > 0 && agentSuccessRate >= 0.5) {
    strengths.push('多维补充判断有实际参与，事业、关系、健康与策略视角更完整。');
  } else if (totalAgentCalls > 0) {
    concerns.push('多维补充判断本次完成度偏低，部分维度仍主要依赖基础结果。');
  } else {
    concerns.push('本次未形成有效的多维补充判断。');
  }

  if (verify?.verdict === 'PASS') {
    strengths.push('一致性校验通过，时序、行业、地理与 K 线信号对齐较好。');
  } else if (verify?.verdict === 'WARN') {
    concerns.push('一致性校验需要留意，适合重点复核短期窗口和策略建议。');
    recommendedActions.push('阅读时优先区分稳定结论与短期时机判断，避免把时机建议当成绝对结论。');
  } else if (verify?.verdict === 'FAIL') {
    concerns.push('一致性校验未通过，这份报告更适合作为参考草稿而不是最终版本。');
    recommendedActions.push('建议核对出生时间与出生地后重新测算，并稍后升级重算。');
  }

  if (completenessScore < 80) {
    concerns.push('当前内容完整度仍有提升空间，尤其是解释深度或行动建议颗粒度。');
    recommendedActions.push('如果你需要更强的决策参考，建议稍后重新生成。');
  } else {
    strengths.push('当前正文覆盖了结构、趋势、建议与阶段窗口，已具备较完整的阅读价值。');
  }

  if (narrativeSignals.missingSummary) {
    concerns.push('阶段摘要缺失，用户第一眼拿不到主结论。');
    recommendedActions.push('先补齐一句话阶段摘要，再交付结果页主报告。');
  }
  if (narrativeSignals.leakedInternalTerms || narrativeSignals.templateResidue) {
    concerns.push('正文仍有模板化或内部提示词残留，用户会直接感知为不专业。');
    recommendedActions.push('清理模板残留与内部上下文字段后，再作为正式报告交付。');
  }
  if (narrativeSignals.duplicateNarrative) {
    concerns.push('正文出现重复叙述，阅读成本过高。');
    recommendedActions.push('合并重复段落，优先保留“结构-阶段-动作”主线。');
  }
  if (narrativeSignals.malformedRange) {
    concerns.push('阶段窗口表述异常，时机建议可信度不足。');
    recommendedActions.push('重新生成阶段窗口，只保留与当前阶段直接相关的时间表达。');
  }
  if (narrativeSignals.crossTopicLeak) {
    concerns.push('分科建议存在串味，不同板块的动作边界不够清晰。');
    recommendedActions.push('按事业、财富、关系、健康重新过滤建议，避免板块串写。');
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push('当前版本可直接使用；若后续补充真实事件反馈，系统还能继续修正和增强报告。');
  }

  const blockingIssues = deriveBlockingIssues({
    llmUsed,
    providerHealthDeferred,
    agentSuccessRate,
    verifyVerdict: verify?.verdict,
    dimensions,
    narrativeSignals,
  });
  const targetAchieved = isReportExpertGrade({
    overallScore,
    grade,
    dimensions,
  });
  const deliveryTier = getReportDeliveryTier({
    llmUsed,
    providerHealthDeferred,
    agentSuccessRate,
    verifyVerdict: verify?.verdict,
    targetAchieved,
    narrativeSignals,
  });
  const nextActionLabel = targetAchieved
    ? '已达到细致版'
    : narrativeSignals.severeUserVisibleDefect
    ? '修正文案后重算'
    : verify?.verdict === 'FAIL'
    ? '核对信息后重新测算'
    : '继续补全到细致版';

  return {
    overallScore,
    grade,
    status,
    deliveryTier,
    targetScore: REPORT_EXPERT_TARGET_SCORE,
    targetGrade: REPORT_EXPERT_TARGET_GRADE,
    targetAchieved,
    summary: buildSummary(status, llmUsed, providerHealthDeferred, verify?.verdict, targetAchieved, narrativeSignals),
    dimensions,
    strengths: uniqueList(strengths),
    concerns: uniqueList(concerns),
    blockingIssues,
    recommendedActions: uniqueList(recommendedActions),
    nextActionLabel,
  };
}

export interface UserFacingReportStage {
  key: UserFacingReportStageKey;
  label: string;
  shortLabel: string;
  description: string;
}

export interface UserFacingReportStageLadderItem extends UserFacingReportStage {
  status: UserFacingReportStageStatus;
}

const USER_FACING_REPORT_STAGES: Record<ReportDeliveryTier, UserFacingReportStage> = {
  basic: {
    key: 'simple',
    label: '简单报告',
    shortLabel: '简单版',
    description: '先给你一个可读的主结论，方便尽快完成第一次报告体验。',
  },
  enhanced: {
    key: 'deep',
    label: '深度报告',
    shortLabel: '深度版',
    description: '会补足更完整的结构解释、阶段判断和重点建议。',
  },
  expert: {
    key: 'detailed',
    label: '更细致的报告',
    shortLabel: '细致版',
    description: '会补足更多细节拆解、阶段窗口和动作颗粒度，适合继续深挖。',
  },
};

const REPORT_STAGE_ORDER: ReportDeliveryTier[] = ['basic', 'enhanced', 'expert'];

export function describeReportDeliveryStage(deliveryTier?: ReportDeliveryTier | null): UserFacingReportStage {
  return USER_FACING_REPORT_STAGES[deliveryTier || 'basic'];
}

export function buildReportStageLadder(deliveryTier?: ReportDeliveryTier | null): UserFacingReportStageLadderItem[] {
  const currentIndex = Math.max(0, REPORT_STAGE_ORDER.indexOf(deliveryTier || 'basic'));

  return REPORT_STAGE_ORDER.map((tier, index) => ({
    ...describeReportDeliveryStage(tier),
    status: index < currentIndex
      ? 'completed'
      : index === currentIndex
        ? 'current'
        : 'locked',
  }));
}

function scoreEngineFoundation(result: FortuneAnalysisResult, measurementSummary = inspectMeasurementStageQuality(result)) {
  let score = 54;
  const pillars = result.basic?.pillars || [];
  const fiveElementCount = Object.values(result.fiveElements || {}).filter(Boolean).length;
  const advice = result.advice || {};

  if (pillars.length >= 4) score += 9;
  if (fiveElementCount >= 5) score += 7;
  if (result.dayun?.dayuns?.length || result.dayun?.currentDayun) score += 7;
  if ((result.klineData || []).length >= 3) score += 7;
  if ((result.shenSha?.list || []).length > 0 || (result.shenSha?.summary || '').length > 0) score += 5;
  if (result.pattern?.type) score += 4;
  if (advice.career?.general && advice.wealth?.general && advice.marriage?.general && advice.health?.general) score += 5;

  if (measurementSummary.complete) score += 5;
  if (measurementSummary.ordered) score += 3;
  if (measurementSummary.evidenceComplete) score += 4;
  if (measurementSummary.actionComplete) score += 3;
  if (measurementSummary.averageScore >= 82) score += 4;
  else if (measurementSummary.averageScore > 0 && measurementSummary.averageScore < 65) score -= 6;
  if (!measurementSummary.evidenceComplete) score -= 4;
  if (!measurementSummary.actionComplete) score -= 4;
  score -= Math.min(10, measurementSummary.riskStages.length * 3);

  return score;
}

function scoreLLMEnhancement(result: FortuneAnalysisResult, narrativeSignals: NarrativeQualitySignals) {
  if (!result.analysis?.llmUsed) {
    return 38;
  }

  const explanationLength = `${result.analysis?.explanation || ''}`.replace(/\s+/g, '').length;
  let score = 72;

  if (explanationLength >= 420) score = 94;
  else if (explanationLength >= 280) score = 88;
  else if (explanationLength >= 180) score = 80;

  if (narrativeSignals.missingSummary) score -= 18;
  if (narrativeSignals.leakedInternalTerms) score -= 26;
  if (narrativeSignals.templateResidue) score -= 14;
  if (narrativeSignals.duplicateNarrative) score -= 16;
  if (narrativeSignals.malformedRange) score -= 10;
  if (narrativeSignals.crossTopicLeak) score -= 12;

  return score;
}

function scoreAgenticExecution(result: FortuneAnalysisResult) {
  const orchestration = result.analysis?.orchestration;
  if (!orchestration?.totalLlmCalls) {
    return 72;
  }

  const successRate = typeof orchestration.successRate === 'number'
    ? orchestration.successRate
    : 0;

  if (successRate >= 0.85) return 92;
  if (successRate >= 0.6) return 84;
  if (successRate >= 0.3) return 72;
  if (successRate > 0) return 60;
  return 42;
}

function scoreCompleteness(
  result: FortuneAnalysisResult,
  narrativeSignals: NarrativeQualitySignals,
  measurementSummary = inspectMeasurementStageQuality(result)
) {
  let score = 46;
  const explanationLength = `${result.analysis?.explanation || ''}`.replace(/\s+/g, '').length;
  const adviceCount = [
    ...(result.advice?.career?.specific || []),
    ...(result.advice?.wealth?.specific || []),
    ...(result.advice?.marriage?.specific || []),
    ...(result.advice?.health?.specific || []),
  ].filter(Boolean).length;
  const celebrityCount = (result.evidence?.celebrities || []).length;
  const klineCount = (result.klineData || []).length;

  if (explanationLength >= 200) score += 18;
  else if (explanationLength >= 120) score += 12;
  else if (explanationLength >= 80) score += 8;

  if (adviceCount >= 8) score += 14;
  else if (adviceCount >= 5) score += 10;
  else if (adviceCount >= 3) score += 6;

  if (celebrityCount > 0) score += 6;
  if (klineCount >= 3) score += 8;
  if ((result.fortune?.interaction || '').length >= 20) score += 6;

  if (measurementSummary.complete) score += 4;
  if (measurementSummary.evidenceComplete) score += 4;
  if (measurementSummary.actionComplete) score += 3;
  if (measurementSummary.averageScore >= 82) score += 2;
  if (measurementSummary.riskStages.length > 0) score -= Math.min(6, measurementSummary.riskStages.length * 2);

  if (narrativeSignals.missingSummary) score -= 22;
  if (narrativeSignals.duplicateNarrative) score -= 12;
  if (narrativeSignals.templateResidue) score -= 8;
  if (narrativeSignals.crossTopicLeak) score -= 8;

  return score;
}

function deriveAuditStatus(params: {
  overallScore: number;
  llmUsed: boolean;
  providerHealthDeferred: boolean;
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL';
  agentSuccessRate: number;
  narrativeSignals?: NarrativeQualitySignals;
}): ReportQualityAuditStatus {
  if (
    params.verifyVerdict === 'FAIL'
    || (!params.llmUsed && !params.providerHealthDeferred)
    || params.overallScore < 66
    || params.narrativeSignals?.severeUserVisibleDefect
  ) {
    return 'retry';
  }
  if (params.verifyVerdict === 'WARN' || params.agentSuccessRate < 0.5 || params.overallScore < 82) {
    return 'watch';
  }
  return 'ready';
}

function deriveAuditGrade(score: number): ReportQualityAuditGrade {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 68) return 'B';
  return 'C';
}

function buildSummary(
  status: ReportQualityAuditStatus,
  llmUsed: boolean,
  providerHealthDeferred: boolean,
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL',
  targetAchieved?: boolean,
  narrativeSignals?: NarrativeQualitySignals
) {
  if (targetAchieved) {
    return '本次报告已经达到高分细致版标准，可作为当前阶段的主报告使用。';
  }
  if (narrativeSignals?.severeUserVisibleDefect) {
    return '本次报告存在明显文本缺陷或模板残留，当前不应按正式结果交付，建议先修正文案后重算。';
  }
  if (status === 'ready') {
    return '本次报告整体稳定，已经达到可直接使用的深度版标准，后续仍可继续补全细节。';
  }
  if (providerHealthDeferred) {
    return '本次报告已按稳定深度版交付，当前可先使用，稍后可再升级到更完整版本。';
  }
  if (status === 'watch') {
    return '本次报告整体可读，但部分内容或校验项处于观察状态，短期时机与策略建议建议结合现实再复核。';
  }
  if (!llmUsed) {
    return '本次报告已生成可读结果，但正文还不够完整，建议稍后升级重算以获取更完整版本。';
  }
  if (verifyVerdict === 'FAIL') {
    return '本次报告的一致性校验未通过，更适合作为参考草稿，建议核对出生信息后重新测算。';
  }
  return '本次报告存在明显降级或完整性不足，建议稍后升级重算。';
}

function deriveBlockingIssues(params: {
  llmUsed: boolean;
  providerHealthDeferred: boolean;
  agentSuccessRate: number;
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL';
  dimensions: ReportQualityAuditDimension[];
  narrativeSignals: NarrativeQualitySignals;
}) {
  const issues: string[] = [];

  if (!params.llmUsed && !params.providerHealthDeferred) {
    issues.push('缺少稳定的深度正文');
  }
  if (params.agentSuccessRate < 0.5) {
    issues.push('多维补充判断完成度不足');
  }
  if (params.verifyVerdict === 'WARN') {
    issues.push('一致性校验仍需观察');
  }
  if (params.verifyVerdict === 'FAIL') {
    issues.push('一致性校验未通过');
  }
  if (params.narrativeSignals.missingSummary) {
    issues.push('阶段摘要缺失');
  }
  if (params.narrativeSignals.leakedInternalTerms || params.narrativeSignals.templateResidue) {
    issues.push('正文存在模板化或内部提示词残留');
  }
  if (params.narrativeSignals.duplicateNarrative) {
    issues.push('正文存在重复叙述');
  }
  if (params.narrativeSignals.malformedRange) {
    issues.push('阶段窗口表述异常');
  }
  if (params.narrativeSignals.crossTopicLeak) {
    issues.push('分科建议边界不清');
  }

  params.dimensions.forEach((dimension) => {
    const floor = REPORT_EXPERT_DIMENSION_FLOORS[dimension.key];
    if (dimension.score < floor) {
      issues.push(`${dimension.label}仍需补强`);
    }
  });

  return uniqueList(issues);
}

export function isReportExpertGrade(input: {
  overallScore: number;
  grade: ReportQualityAuditGrade;
  dimensions: ReportQualityAuditDimension[];
}) {
  if (input.overallScore < REPORT_EXPERT_TARGET_SCORE) {
    return false;
  }
  if (input.grade !== REPORT_EXPERT_TARGET_GRADE) {
    return false;
  }
  return input.dimensions.every((dimension) => dimension.score >= REPORT_EXPERT_DIMENSION_FLOORS[dimension.key]);
}

function getReportDeliveryTier(params: {
  llmUsed: boolean;
  providerHealthDeferred: boolean;
  agentSuccessRate: number;
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL';
  targetAchieved: boolean;
  narrativeSignals: NarrativeQualitySignals;
}): ReportDeliveryTier {
  if (params.targetAchieved) {
    return 'expert';
  }
  if (params.narrativeSignals.severeUserVisibleDefect) {
    return 'basic';
  }
  if (params.providerHealthDeferred && params.verifyVerdict !== 'FAIL') {
    return 'enhanced';
  }
  if (params.llmUsed && params.verifyVerdict !== 'FAIL' && params.agentSuccessRate >= 0.3) {
    return 'enhanced';
  }
  return 'basic';
}

function toDimensionStatus(score: number): ReportQualityDimensionStatus {
  if (score >= 88) return 'strong';
  if (score >= 76) return 'ok';
  if (score >= 62) return 'watch';
  return 'weak';
}

function uniqueList(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getConsistencyPenalty(signals: NarrativeQualitySignals) {
  let penalty = 0;

  if (signals.leakedInternalTerms) penalty += 10;
  if (signals.templateResidue) penalty += 8;
  if (signals.duplicateNarrative) penalty += 6;
  if (signals.malformedRange) penalty += 8;
  if (signals.crossTopicLeak) penalty += 6;

  return penalty;
}

function inspectMeasurementStageQuality(result: FortuneAnalysisResult): MeasurementStageQualitySummary {
  const engineEvidence = result.analysis?.contextSignals?.engineEvidence as { measurementResults?: MeasurementStageSignal[]; stageResults?: MeasurementStageSignal[] } | undefined;
  const stages = Array.isArray(engineEvidence?.measurementResults)
    ? engineEvidence.measurementResults
    : Array.isArray(engineEvidence?.stageResults)
      ? engineEvidence.stageResults
      : [];
  const scores = stages
    .map((stage) => typeof stage.score === 'number' ? stage.score : null)
    .filter((score): score is number => score !== null);
  const stageIds = stages.map((stage) => stage.id || '');
  const complete = EXPECTED_MEASUREMENT_STAGE_IDS.every((id) => stageIds.includes(id));
  const ordered = EXPECTED_MEASUREMENT_STAGE_IDS.every((id, index) => stages[index]?.id === id && stages[index]?.order === index + 1);
  const evidenceComplete = stages.length > 0 && stages.every((stage) => Array.isArray(stage.evidence) && stage.evidence.length > 0);
  const actionComplete = stages.length > 0 && stages.every((stage) => Array.isArray(stage.actions) && stage.actions.length > 0);
  const averageScore = scores.length > 0
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
  const riskStages = stages
    .filter((stage) => (typeof stage.score === 'number' && stage.score < 65) || ['risk', 'watch'].includes(`${stage.level || ''}`))
    .map((stage) => ({
      id: stage.id || 'unknown',
      label: stage.label || stage.id || '未知测算',
      score: typeof stage.score === 'number' ? stage.score : 0,
      conclusion: stage.conclusion || '暂无结论',
    }));

  return {
    total: stages.length,
    complete,
    ordered,
    evidenceComplete,
    actionComplete,
    averageScore,
    riskStages,
  };
}

function inspectNarrativeQuality(result: FortuneAnalysisResult): NarrativeQualitySignals {
  const opening = `${result.analysis?.opening || ''}`;
  const summary = `${result.analysis?.summary || ''}`.trim();
  const explanation = `${result.analysis?.explanation || ''}`;
  const adviceTexts = [
    result.advice?.career?.general,
    result.advice?.career?.timing,
    ...(result.advice?.career?.specific || []),
    ...(result.advice?.career?.avoid || []),
    result.advice?.wealth?.general,
    result.advice?.wealth?.timing,
    ...(result.advice?.wealth?.specific || []),
    ...(result.advice?.wealth?.avoid || []),
    result.advice?.marriage?.general,
    result.advice?.marriage?.timing,
    ...(result.advice?.marriage?.specific || []),
    result.advice?.health?.general,
    result.advice?.health?.timing,
    ...(result.advice?.health?.specific || []),
    ...(result.advice?.health?.avoid || []),
  ].filter(Boolean).join('\n');
  const combined = [opening, summary, explanation, adviceTexts].filter(Boolean).join('\n');

  const leakedInternalTerms = /(macro_cycle|solar_terms?|geography|industry_cycle|geoClimate|spatialFactors?|currentSolarTerm|nationalCycle)/i.test(combined);
  const templateResidue = /(命局主轴围绕|生时环境落在|四柱落点为|外部参照|解释增强即可|当前最优策略不是同时做很多事|显著放大或压制|格局清正|乃富贵之命也)/.test(combined);
  const duplicateNarrative = hasDuplicateNarrative(opening, summary, explanation);
  const malformedRange = hasMalformedNarrativeRange(combined);
  const crossTopicLeak = hasCrossTopicLeak(result);
  const missingSummary = summary.length < 8;
  const severeUserVisibleDefect = missingSummary || leakedInternalTerms || templateResidue || duplicateNarrative || malformedRange || crossTopicLeak;

  return {
    missingSummary,
    leakedInternalTerms,
    duplicateNarrative,
    malformedRange,
    templateResidue,
    crossTopicLeak,
    severeUserVisibleDefect,
  };
}

function hasDuplicateNarrative(opening: string, summary: string, explanation: string) {
  const segments = [opening, summary, ...`${explanation || ''}`.split(/\n+/)]
    .map((segment) => normalizeNarrativeSegment(segment))
    .filter((segment) => segment.length >= 12);

  const seen = new Set<string>();
  for (const segment of segments) {
    if (seen.has(segment)) {
      return true;
    }
    seen.add(segment);
  }

  return false;
}

function hasMalformedNarrativeRange(value: string) {
  if (/(\d{4})-\1/.test(value)) {
    return true;
  }

  const currentYear = new Date().getUTCFullYear();
  const matches = value.matchAll(/围绕(\d{4})-(\d{4})(?:阶段|窗口)排序动作/g);
  for (const match of matches) {
    const startYear = Number(match[1]);
    const endYear = Number(match[2]);
    if (endYear < currentYear - 1 || startYear > currentYear + 8) {
      return true;
    }
  }

  return false;
}

function hasCrossTopicLeak(result: FortuneAnalysisResult) {
  const topicPatterns = {
    career: /(围绕(?:财富|关系|健康)做一条最短路径|主攻方向先放在(?:财富|关系|健康)|(?:财富|关系|健康)板块把节奏拖散)/,
    wealth: /(围绕(?:事业|关系|健康)做一条最短路径|主攻方向先放在(?:事业|关系|健康)|(?:事业|关系|健康)板块把节奏拖散)/,
    marriage: /(围绕(?:事业|财富|健康)做一条最短路径|主攻方向先放在(?:事业|财富|健康)|(?:事业|财富|健康)板块把节奏拖散)/,
    health: /(围绕(?:事业|财富|关系)做一条最短路径|主攻方向先放在(?:事业|财富|关系)|(?:事业|财富|关系)板块把节奏拖散)/,
  } as const;

  return (
    sectionHasCrossTopicLeak(topicPatterns.career, [
      result.advice?.career?.general || '',
      result.advice?.career?.timing || '',
      ...(result.advice?.career?.specific || []),
      ...(result.advice?.career?.avoid || []),
    ])
    || sectionHasCrossTopicLeak(topicPatterns.wealth, [
      result.advice?.wealth?.general || '',
      result.advice?.wealth?.timing || '',
      ...(result.advice?.wealth?.specific || []),
      ...(result.advice?.wealth?.avoid || []),
    ])
    || sectionHasCrossTopicLeak(topicPatterns.marriage, [
      result.advice?.marriage?.general || '',
      result.advice?.marriage?.timing || '',
      ...(result.advice?.marriage?.specific || []),
    ])
    || sectionHasCrossTopicLeak(topicPatterns.health, [
      result.advice?.health?.general || '',
      result.advice?.health?.timing || '',
      ...(result.advice?.health?.specific || []),
      ...(result.advice?.health?.avoid || []),
    ])
  );
}

function sectionHasCrossTopicLeak(pattern: RegExp, values: string[]) {
  return values.some((value) => pattern.test(value));
}

function normalizeNarrativeSegment(value: string) {
  return `${value || ''}`
    .replace(/\s+/g, '')
    .replace(/[，。；：、]/g, '')
    .toLowerCase();
}
