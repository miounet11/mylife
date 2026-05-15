import type { FortuneRecord } from '@/lib/user-types';

export type MeasurementStageStatus = 'strong' | 'stable' | 'watch' | 'risk';

export interface MeasurementStageAnalysis {
  id: string;
  label: string;
  order: number;
  score: number;
  level: string;
  status: MeasurementStageStatus;
  reason: string;
  optimizationHint: string;
}


export interface ReportMeasurementUserAnalysis {
  reportId: string;
  name: string;
  totalStages: number;
  complete: boolean;
  averageScore: number;
  stages: MeasurementStageAnalysis[];
  optimizationPriorities: MeasurementStageAnalysis[];
  strongestStages: MeasurementStageAnalysis[];
  weakestStage: MeasurementStageAnalysis | null;
  summary: string;
}

type RawMeasurementStage = {
  id?: string;
  label?: string;
  order?: number;
  score?: number;
  level?: string;
  conclusion?: string;
};

function compactText(value?: string | null, fallback = '') {
  return `${value || ''}`.replace(/\s+/g, ' ').trim() || fallback;
}

function getMeasurementResults(report: FortuneRecord): RawMeasurementStage[] {
  const engineEvidence = report.analysis?.contextSignals?.engineEvidence as { measurementResults?: RawMeasurementStage[] } | undefined;
  return Array.isArray(engineEvidence?.measurementResults) ? engineEvidence.measurementResults : [];
}

function resolveStageStatus(score: number, level: string): MeasurementStageStatus {
  if (score >= 85 || level === 'good' || level === 'strong') return 'strong';
  if (score >= 75 && level !== 'risk') return 'stable';
  if (score >= 65 || level === 'watch') return 'watch';
  return 'risk';
}

function buildOptimizationHint(stage: Pick<MeasurementStageAnalysis, 'id' | 'score' | 'status'>) {
  if (stage.status === 'strong') return '保持现有证据链，不需要优先返工。';
  if (stage.status === 'stable') return '补充真实事件或用户上下文，验证该环节是否还能提分。';

  const domainHint: Record<string, string> = {
    pillars: '优先复核出生时间、地点、时区和四柱排盘元数据。',
    'five-elements': '拆透干、根气、藏干和季节权重，避免只看百分比。',
    'day-master-strength': '补得令、得地、得助与克泄耗的分项证据。',
    pattern: '补正格/变格形成条件、破格原因和质量分。',
    'ten-gods': '补十神透藏、组合关系和现实领域映射。',
    'yong-shen': '补调候、通关、扶抑、病药四层优先级。',
    'shen-sha': '降低神煞主导权，只保留辅助信号和边界说明。',
    dayun: '补原局与大运关系、起运边界和阶段证据。',
    kline: '补原局 + 大运 + 流年的年度驱动与风险证据。',
    'domain-advice': '把建议绑定到测算证据，减少泛泛而谈。',
  };

  return domainHint[stage.id] || '优先补证据、边界样本和用户可读解释。';
}

export function buildReportMeasurementUserAnalysis(report: FortuneRecord): ReportMeasurementUserAnalysis {
  const stages = getMeasurementResults(report)
    .map((stage, index): MeasurementStageAnalysis => {
      const score = typeof stage.score === 'number' ? stage.score : 0;
      const level = compactText(stage.level, score >= 85 ? 'good' : score >= 65 ? 'watch' : 'risk');
      const status = resolveStageStatus(score, level);
      const analysisStage = {
        id: stage.id || `stage-${index + 1}`,
        label: stage.label || stage.id || '未知测算',
        order: typeof stage.order === 'number' ? stage.order : index + 1,
        score,
        level,
        status,
        reason: compactText(stage.conclusion, '该环节缺少明确结论。'),
        optimizationHint: '',
      };
      analysisStage.optimizationHint = buildOptimizationHint(analysisStage);
      return analysisStage;
    })
    .sort((left, right) => left.order - right.order);

  const averageScore = stages.length > 0
    ? Math.round((stages.reduce((sum, stage) => sum + stage.score, 0) / stages.length) * 100) / 100
    : 0;
  const optimizationPriorities = [...stages]
    .filter((stage) => stage.status !== 'strong' || stage.score < 95)
    .sort((left, right) => left.score - right.score || left.order - right.order)
    .slice(0, 5);
  const strongestStages = [...stages]
    .sort((left, right) => right.score - left.score || left.order - right.order)
    .slice(0, 3);
  const weakestStage = optimizationPriorities[0] || null;

  return {
    reportId: report.id,
    name: report.name,
    totalStages: stages.length,
    complete: stages.length >= 10 && stages.every((stage, index) => stage.order === index + 1),
    averageScore,
    stages,
    optimizationPriorities,
    strongestStages,
    weakestStage,
    summary: weakestStage
      ? `当前 ${stages.length} 个测算环节均分 ${averageScore}，最该优化：${weakestStage.label}（${weakestStage.score} 分）。`
      : stages.length > 0
        ? `当前 ${stages.length} 个测算环节均分 ${averageScore}，全部达到 95+。`
        : '当前没有可分析的测算环节。',
  };
}

export function renderReportMeasurementUserAnalysis(analysis: ReportMeasurementUserAnalysis) {
  const lines: string[] = [];
  lines.push(`# Report Measurement User Analysis`);
  lines.push('');
  lines.push(`- reportId: ${analysis.reportId}`);
  lines.push(`- name: ${analysis.name}`);
  lines.push(`- totalStages: ${analysis.totalStages}`);
  lines.push(`- complete: ${analysis.complete ? 'yes' : 'no'}`);
  lines.push(`- averageScore: ${analysis.averageScore}`);
  lines.push(`- summary: ${analysis.summary}`);
  lines.push('');
  lines.push('## Stage scores');
  analysis.stages.forEach((stage) => {
    lines.push(`- ${stage.order}. ${stage.label} [${stage.id}] — ${stage.score} (${stage.status})：${stage.reason}`);
  });
  lines.push('');
  lines.push('## Optimization priorities');
  analysis.optimizationPriorities.forEach((stage, index) => {
    lines.push(`${index + 1}. ${stage.label} — ${stage.score}：${stage.optimizationHint}`);
  });
  return lines.join('\n');
}
