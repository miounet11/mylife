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

export function buildReportQualityAudit(result: FortuneAnalysisResult): ReportQualityAudit {
  const llmUsed = !!result.analysis?.llmUsed;
  const orchestration = result.analysis?.orchestration;
  const verify = result.analysis?.verify;
  const agentSuccessRate = typeof orchestration?.successRate === 'number'
    ? orchestration.successRate
    : 0;
  const totalAgentCalls = orchestration?.totalLlmCalls || 0;

  const engineScore = clampScore(scoreEngineFoundation(result));
  const llmScore = clampScore(scoreLLMEnhancement(result));
  const agenticScore = clampScore(scoreAgenticExecution(result));
  const consistencyScore = clampScore(verify?.consistencyScore ?? 62);
  const completenessScore = clampScore(scoreCompleteness(result));

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
      label: '语言增强',
      score: llmScore,
      status: toDimensionStatus(llmScore),
      detail: llmUsed
        ? '本次拿到了 LLM 深度增强正文。'
        : '本次未获得稳定的 LLM 深度增强，正文以结构化整合输出为主。',
    },
    {
      key: 'agentic',
      label: '专家协同',
      score: agenticScore,
      status: toDimensionStatus(agenticScore),
      detail: totalAgentCalls > 0
        ? `并发专家层已执行，成功率约 ${Math.round(agentSuccessRate * 100)}%。`
        : '当前主要采用 deterministic 专家层和规则化补强。',
    },
    {
      key: 'consistency',
      label: '一致性校验',
      score: consistencyScore,
      status: toDimensionStatus(consistencyScore),
      detail: verify?.verdict
        ? `当前校验结论为 ${verify.verdict}。`
        : '当前未拿到完整校验结论，按保守评分处理。',
    },
    {
      key: 'completeness',
      label: '内容完整度',
      score: completenessScore,
      status: toDimensionStatus(completenessScore),
      detail: completenessScore >= 85
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
    verifyVerdict: verify?.verdict,
    agentSuccessRate,
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

  if (llmUsed) {
    strengths.push('本次拿到了 LLM 深度增强，正文解释会更细更完整。');
  } else {
    concerns.push('本次未获得稳定的 LLM 深度增强，文本深度会低于理想版本。');
    recommendedActions.push('建议稍后使用当前版本重新升级重算，争取拿到完整的 LLM 增强正文。');
  }

  if (totalAgentCalls > 0 && agentSuccessRate >= 0.5) {
    strengths.push('并发专家层有实际参与，事业、关系、健康与策略视角更完整。');
  } else if (totalAgentCalls > 0) {
    concerns.push('并发专家层本次回退较多，部分维度仍主要依赖 deterministic 结果。');
  } else {
    concerns.push('本次未形成有效的并发专家增强闭环。');
  }

  if (verify?.verdict === 'PASS') {
    strengths.push('一致性校验通过，时序、行业、地理与 K 线信号对齐较好。');
  } else if (verify?.verdict === 'WARN') {
    concerns.push('一致性校验为 WARN，适合重点复核短期窗口和策略建议。');
    recommendedActions.push('阅读时优先区分稳定结论与短期时机判断，避免把时机建议当成绝对结论。');
  } else if (verify?.verdict === 'FAIL') {
    concerns.push('一致性校验未通过，这份报告更适合作为参考草稿而不是最终版本。');
    recommendedActions.push('建议核对出生时间与出生地后重新测算，并等待上游模型稳定后升级重算。');
  }

  if (completenessScore < 80) {
    concerns.push('当前内容完整度仍有提升空间，尤其是解释深度或行动建议颗粒度。');
    recommendedActions.push('如果你需要更强的决策参考，优先等待增强链路稳定后重新生成。');
  } else {
    strengths.push('当前正文覆盖了结构、趋势、建议与阶段窗口，已具备较完整的阅读价值。');
  }

  if (recommendedActions.length === 0) {
    recommendedActions.push('当前版本可直接使用；若后续补充真实事件反馈，系统还能继续修正和增强报告。');
  }

  const blockingIssues = deriveBlockingIssues({
    llmUsed,
    agentSuccessRate,
    verifyVerdict: verify?.verdict,
    dimensions,
  });
  const targetAchieved = isReportExpertGrade({
    overallScore,
    grade,
    dimensions,
  });
  const deliveryTier = getReportDeliveryTier({
    llmUsed,
    agentSuccessRate,
    verifyVerdict: verify?.verdict,
    targetAchieved,
  });
  const nextActionLabel = targetAchieved
    ? '已达到 S级专家版'
    : verify?.verdict === 'FAIL'
    ? '核对信息后重新测算'
    : '继续增强到 S级';

  return {
    overallScore,
    grade,
    status,
    deliveryTier,
    targetScore: REPORT_EXPERT_TARGET_SCORE,
    targetGrade: REPORT_EXPERT_TARGET_GRADE,
    targetAchieved,
    summary: buildSummary(status, llmUsed, verify?.verdict, targetAchieved),
    dimensions,
    strengths: uniqueList(strengths),
    concerns: uniqueList(concerns),
    blockingIssues,
    recommendedActions: uniqueList(recommendedActions),
    nextActionLabel,
  };
}

function scoreEngineFoundation(result: FortuneAnalysisResult) {
  let score = 58;
  const pillars = result.basic?.pillars || [];
  const fiveElementCount = Object.values(result.fiveElements || {}).filter(Boolean).length;
  const advice = result.advice || {};

  if (pillars.length >= 4) score += 10;
  if (fiveElementCount >= 5) score += 8;
  if (result.dayun?.dayuns?.length || result.dayun?.currentDayun) score += 8;
  if ((result.klineData || []).length >= 3) score += 8;
  if ((result.shenSha?.list || []).length > 0 || (result.shenSha?.summary || '').length > 0) score += 6;
  if (result.pattern?.type) score += 4;
  if (advice.career?.general && advice.wealth?.general && advice.marriage?.general && advice.health?.general) score += 6;

  return score;
}

function scoreLLMEnhancement(result: FortuneAnalysisResult) {
  if (!result.analysis?.llmUsed) {
    return 38;
  }

  const explanationLength = `${result.analysis?.explanation || ''}`.replace(/\s+/g, '').length;
  if (explanationLength >= 420) return 94;
  if (explanationLength >= 280) return 88;
  if (explanationLength >= 180) return 80;
  return 72;
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

function scoreCompleteness(result: FortuneAnalysisResult) {
  let score = 48;
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

  return score;
}

function deriveAuditStatus(params: {
  overallScore: number;
  llmUsed: boolean;
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL';
  agentSuccessRate: number;
}): ReportQualityAuditStatus {
  if (params.verifyVerdict === 'FAIL' || !params.llmUsed || params.overallScore < 66) {
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
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL',
  targetAchieved?: boolean
) {
  if (targetAchieved) {
    return '本次报告已经达到 95 分以上的 S级专家交付标准，可作为当前阶段的专家版主报告使用。';
  }
  if (status === 'ready') {
    return '本次报告整体稳定，已经达到可直接使用的增强版标准，但距离 95 分 S级专家版仍有提升空间。';
  }
  if (status === 'watch') {
    return '本次报告整体可读，但部分增强链路或校验项处于观察状态，短期时机与策略建议建议结合现实再复核。';
  }
  if (!llmUsed) {
    return '本次报告已生成可读结果，但没有拿到稳定的 LLM 深度增强，建议稍后升级重算以获取更完整版本。';
  }
  if (verifyVerdict === 'FAIL') {
    return '本次报告的一致性校验未通过，更适合作为参考草稿，建议核对出生信息后重新测算。';
  }
  return '本次报告存在明显降级或完整性不足，建议稍后升级重算。';
}

function deriveBlockingIssues(params: {
  llmUsed: boolean;
  agentSuccessRate: number;
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL';
  dimensions: ReportQualityAuditDimension[];
}) {
  const issues: string[] = [];

  if (!params.llmUsed) {
    issues.push('缺少稳定的 LLM 深度增强正文');
  }
  if (params.agentSuccessRate < 0.5) {
    issues.push('并发专家链路成功率不足');
  }
  if (params.verifyVerdict === 'WARN') {
    issues.push('一致性校验仍处于观察级');
  }
  if (params.verifyVerdict === 'FAIL') {
    issues.push('一致性校验未通过');
  }

  params.dimensions.forEach((dimension) => {
    const floor = REPORT_EXPERT_DIMENSION_FLOORS[dimension.key];
    if (dimension.score < floor) {
      issues.push(`${dimension.label}未达到 S级门槛`);
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
  agentSuccessRate: number;
  verifyVerdict?: 'PASS' | 'WARN' | 'FAIL';
  targetAchieved: boolean;
}): ReportDeliveryTier {
  if (params.targetAchieved) {
    return 'expert';
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
