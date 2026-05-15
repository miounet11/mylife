import type { FortuneRecord } from '@/lib/user-types';
import {
  buildToolRecommendations,
  getToolDefinition,
  inferCategoryFromText,
  listToolsByCategory,
  type ToolCategoryKey,
  type ToolDefinition,
} from '@/lib/tools';
import { appendSourceToHref } from '@/lib/source-url';
import { buildReportJourneyWorkflowSnapshot } from '@/lib/report-journey-workflow';

export type ReportJourneyLayerKey =
  | 'first-report'
  | 'deep-report'
  | 'category-report'
  | 'event-validation';

export type ReportJourneyLayerStatus = 'current' | 'next' | 'planned' | 'watch';

export interface ReportJourneyAction {
  href: string;
  label: string;
  description: string;
  target: string;
}

export interface ReportJourneyLayer {
  key: ReportJourneyLayerKey;
  title: string;
  description: string;
  href: string;
  status: ReportJourneyLayerStatus;
  badge: string;
}

export interface ReportJourneyCategoryRoute {
  category: ToolCategoryKey;
  categoryLabel: string;
  toolSlug: string;
  toolTitle: string;
  href: string;
  reason: string;
  primary: boolean;
}

export type ReportJourneyMeasurementStageStatus = 'strong' | 'stable' | 'watch' | 'risk';

export interface ReportJourneyMeasurementStage {
  id: string;
  label: string;
  order: number;
  score: number;
  level: string;
  status: ReportJourneyMeasurementStageStatus;
  conclusion: string;
  reason: string;
  optimizationHint: string;
}

export interface ReportJourneyMeasurementSummary {
  totalStages: number;
  complete: boolean;
  averageScore: number;
  stages: ReportJourneyMeasurementStage[];
  weakStages: ReportJourneyMeasurementStage[];
  strongStages: ReportJourneyMeasurementStage[];
  optimizationPriorities: ReportJourneyMeasurementStage[];
  methodSummary: string;
  resultCombinationSummary: string;
}

export interface ReportJourneyCombinationRoute {
  key: 'bazi-evidence-chain' | 'palmistry-application' | 'event-validation';
  label: string;
  href: string;
  reason: string;
  boundary?: string;
  primary: boolean;
}

export interface LayeredReportJourney {
  workflowId: string;
  headline: string;
  summary: string;
  currentLayer: ReportJourneyLayerKey;
  primaryAction: ReportJourneyAction;
  layers: ReportJourneyLayer[];
  categoryRoutes: ReportJourneyCategoryRoute[];
  measurementSummary: ReportJourneyMeasurementSummary;
  combinationRoutes: ReportJourneyCombinationRoute[];
  correctionHint?: string;
  source: string;
}

type QualityInput = {
  overallScore?: number;
  grade?: 'S' | 'A' | 'B' | 'C';
  status?: 'ready' | 'watch' | 'retry';
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
  targetAchieved?: boolean;
} | null;

type ValidationInput = {
  totalLinkedEvents?: number;
  accurateCount?: number;
  driftCount?: number;
  pendingCount?: number;
} | null;

const categoryLabels: Record<ToolCategoryKey, string> = {
  career: '事业专项',
  wealth: '财富专项',
  relationship: '关系专项',
  health: '健康专项',
  family: '家庭专项',
  migration: '迁移专项',
  timing: '时机专项',
  application: '应用专项',
};

function compactText(value?: string | null, fallback = '') {
  return `${value || ''}`.replace(/\s+/g, ' ').trim() || fallback;
}

function buildSignalText(report: FortuneRecord) {
  return [
    report.analysis?.opening,
    report.analysis?.summary,
    report.analysis?.explanation,
    report.pattern?.type,
    report.pattern?.description,
    report.fortune?.currentDaYun,
    report.fortune?.currentLiuNian,
    report.fortune?.interaction,
    (report.advice as { overall?: string } | undefined)?.overall,
    report.advice?.career,
    report.advice?.wealth,
    report.advice?.marriage,
    report.advice?.health,
  ].filter(Boolean).join(' ');
}

function getMeasurementResults(report: FortuneRecord) {
  const engineEvidence = report.analysis?.contextSignals?.engineEvidence as { measurementResults?: Array<{ id?: string; label?: string; order?: number; score?: number; level?: string; conclusion?: string }> } | undefined;
  return Array.isArray(engineEvidence?.measurementResults) ? engineEvidence.measurementResults : [];
}

function buildMeasurementSummary(report: FortuneRecord): ReportJourneyMeasurementSummary {
  const rawStages = getMeasurementResults(report);
  const stages = rawStages
    .map((stage, index): ReportJourneyMeasurementStage => {
      const score = typeof stage.score === 'number' ? stage.score : 0;
      const level = `${stage.level || ''}`.trim() || (score >= 85 ? 'good' : score >= 65 ? 'watch' : 'risk');
      const status: ReportJourneyMeasurementStageStatus = score >= 85 || level === 'good'
        ? 'strong'
        : score >= 65 && level !== 'risk'
          ? 'stable'
          : level === 'watch'
            ? 'watch'
            : 'risk';
      const conclusion = compactText(stage.conclusion, '该环节需要继续补证据。');
      const reason = conclusion;
      const optimizationHint = status === 'strong'
        ? '保持当前证据链，优先看下一层组合。'
        : status === 'stable'
          ? '继续补齐场景证据，确认是否还能提分。'
          : '优先补证据和边界样本，先把这个环节做稳。';

      return {
        id: stage.id || `stage-${index + 1}`,
        label: stage.label || stage.id || '未知测算',
        order: typeof stage.order === 'number' ? stage.order : index + 1,
        score,
        level,
        status,
        conclusion,
        reason,
        optimizationHint,
      };
    })
    .sort((left, right) => left.order - right.order);

  const scores = stages.map((stage) => stage.score);
  const averageScore = scores.length > 0 ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
  const weakStages = stages.filter((stage) => stage.status === 'watch' || stage.status === 'risk' || stage.score < 85).slice(0, 3);
  const strongStages = stages.filter((stage) => stage.status === 'strong');
  const optimizationPriorities = [...stages]
    .filter((stage) => stage.status === 'risk' || stage.status === 'watch' || stage.score < 85)
    .sort((left, right) => left.score - right.score || left.order - right.order)
    .slice(0, 4);

  return {
    totalStages: stages.length,
    complete: stages.length >= 10 && stages.every((stage, index) => stage.order === index + 1),
    averageScore,
    stages,
    weakStages,
    strongStages,
    optimizationPriorities,
    methodSummary: stages.length > 0
      ? `当前测算按 ${stages.length} 个环节串联证据，先看底座再看组合。`
      : '当前尚未拿到完整测算环节证据。',
    resultCombinationSummary: stages.length > 0
      ? `结果组合已覆盖${stages.length}个环节，可按“底座→判断→建议→验证”继续读。`
      : '结果组合还需要补齐测算环节后再读。',
  };
}

function buildCombinationRoutes(params: {
  report: FortuneRecord;
  source: string;
  measurementSummary: ReportJourneyMeasurementSummary;
}) {
  const routes: ReportJourneyCombinationRoute[] = [
    {
      key: 'bazi-evidence-chain',
      label: '八字证据链',
      href: withSource('#deep-report', params.source),
      reason: params.measurementSummary.complete
        ? '十个测算环节已成链，先看底座、强弱、格局和用神。'
        : '先补齐测算证据链，再看完整结论组合。',
      primary: true,
    },
  ];

  const text = buildSignalText(params.report);
  const applicationSignals = /手相|照片|图片|多模态|应用/.test(text) || params.measurementSummary.averageScore >= 85;
  if (applicationSignals) {
    routes.push({
      key: 'palmistry-application',
      label: '手相/应用补充',
      href: withSource('/tools/application-palmistry-reading', params.source),
      reason: '当八字证据链已经稳定时，再用手相或应用类入口补充观察层。',
      boundary: '只做文化观察和辅助建议，不做医学诊断或绝对命运断言。',
      primary: false,
    });
  }

  routes.push({
    key: 'event-validation',
    label: '事件验证回路',
    href: '#validation',
    reason: '把当前结果和真实事件对照，持续修正测算组合。',
    primary: false,
  });

  return routes;
}

function getJourneySource(reportId: string, source?: string | null) {
  const normalized = compactText(source);
  return normalized || `report_journey:${reportId}`;
}

function withSource(href: string, source: string) {
  if (href.startsWith('#')) {
    return href;
  }
  return appendSourceToHref(href, source);
}

function getFallbackTool(category: ToolCategoryKey | null): ToolDefinition | null {
  if (category) {
    return listToolsByCategory(category)[0] || null;
  }
  return listToolsByCategory('timing')[0] || listToolsByCategory('career')[0] || null;
}

function buildCategoryRoutes(params: {
  report: FortuneRecord;
  source: string;
  signalText: string;
}) {
  const inferredCategory = inferCategoryFromText(params.signalText);
  const recommended = buildToolRecommendations({
    report: params.report,
    limit: 5,
  })
    .map((item) => {
      const tool = getToolDefinition(item.slug);
      return tool ? { tool, reason: item.reason } : null;
    })
    .filter((item): item is { tool: ToolDefinition; reason: string } => !!item);

  const fallbackTool = recommended.length > 0 ? null : getFallbackTool(inferredCategory);
  const routeSource = new Set<string>();
  const routes = [
    ...recommended,
    ...(fallbackTool ? [{ tool: fallbackTool, reason: '先补一个最能承接主报告的专项工具。' }] : []),
  ]
    .filter((item) => {
      if (routeSource.has(item.tool.slug)) return false;
      routeSource.add(item.tool.slug);
      return true;
    })
    .slice(0, 3);

  return routes.map((item, index): ReportJourneyCategoryRoute => ({
    category: item.tool.category,
    categoryLabel: categoryLabels[item.tool.category],
    toolSlug: item.tool.slug,
    toolTitle: item.tool.shortTitle,
    href: withSource(`/tools/${item.tool.slug}`, params.source),
    reason: item.reason,
    primary: index === 0,
  }));
}

function buildPrimaryAction(params: {
  reportId: string;
  quality: QualityInput;
  validation: ValidationInput;
  categoryRoutes: ReportJourneyCategoryRoute[];
  measurementSummary: ReportJourneyMeasurementSummary;
}) {
  const driftCount = params.validation?.driftCount || 0;
  if (driftCount > 0) {
    return {
      href: '#validation',
      label: '先处理报告纠偏',
      description: '你已经有反馈偏差，下一步先看验证与纠偏层，再决定是否进入专项。',
      target: 'report_journey_validation',
    };
  }

  if (params.quality?.status === 'retry' || params.quality?.deliveryTier === 'basic' || params.measurementSummary.weakStages.length > 0) {
    return {
      href: '#deep-report',
      label: '先看核心深度解释',
      description: params.measurementSummary.weakStages[0]
        ? `先看${params.measurementSummary.weakStages[0].label}等薄弱测算环节，再进入专项。`
        : '当前先交付稳定版，先把结构证据和阶段判断读清楚，后台增强可继续补齐。',
      target: 'report_journey_deep_report_basic',
    };
  }

  return {
    href: '#deep-report',
    label: '继续看深入报告',
    description: params.categoryRoutes[0]
      ? `先看结构依据，再进入${params.categoryRoutes[0].categoryLabel}。`
      : '先看结构依据、阶段窗口和行动解释，再决定下一步专项。',
    target: 'report_journey_deep_report',
  };
}

export function buildLayeredReportJourney(params: {
  report: FortuneRecord;
  quality?: QualityInput;
  validation?: ValidationInput;
  source?: string | null;
}): LayeredReportJourney {
  const workflow = buildReportJourneyWorkflowSnapshot();
  const source = getJourneySource(params.report.id, params.source);
  const signalText = buildSignalText(params.report);
  const measurementSummary = buildMeasurementSummary(params.report);
  const categoryRoutes = buildCategoryRoutes({
    report: params.report,
    source,
    signalText,
  });
  const combinationRoutes = buildCombinationRoutes({
    report: params.report,
    source,
    measurementSummary,
  });
  const primaryAction = buildPrimaryAction({
    reportId: params.report.id,
    quality: params.quality || null,
    validation: params.validation || null,
    categoryRoutes,
    measurementSummary,
  });
  const driftCount = params.validation?.driftCount || 0;
  const hasValidatedEvents = (params.validation?.accurateCount || 0) > 0;

  return {
    workflowId: workflow.workflowId,
    headline: '这份报告按四层继续读',
    summary: measurementSummary.complete
      ? `${measurementSummary.methodSummary} 再进入专项或手相等应用补充。`
      : '先用首报抓主线，再看深报证据，然后进入最相关专项，最后用真实事件回头验证。',
    currentLayer: 'first-report',
    primaryAction,
    source,
    correctionHint: driftCount > 0
      ? '已有事件反馈出现偏差，优先区分输入偏差、时机偏差、场景偏差和行动偏差。'
      : hasValidatedEvents
        ? '已有过去事件形成印证，可以继续把专项判断做得更细。'
        : undefined,
    layers: [
      {
        key: 'first-report',
        title: '第一层：首报总览',
        description: measurementSummary.complete
          ? `先看${measurementSummary.totalStages}个测算环节是否成链，再看主结论。`
          : '先看一句话判断、当前阶段、现在先做什么和先别做什么。',
        href: `/result/${params.report.id}`,
        status: 'current',
        badge: '当前',
      },
      {
        key: 'deep-report',
        title: '第二层：深入报告',
        description: measurementSummary.weakStages[0]
          ? `继续看命理证据，重点复核${measurementSummary.weakStages[0].label}。`
          : '继续看命理证据、五行结构、阶段窗口和行动解释。',
        href: '#deep-report',
        status: 'next',
        badge: '下一步',
      },
      {
        key: 'category-report',
        title: '第三层：专项细分',
        description: categoryRoutes[0]
          ? `当前优先进入${categoryRoutes[0].categoryLabel}，把问题缩到一个现实决策。`
          : '进入事业、财富、关系、健康、迁移等专项工具继续拆。',
        href: categoryRoutes[0]?.href || withSource('/tools', source),
        status: 'planned',
        badge: categoryRoutes[0]?.categoryLabel || '专项',
      },
      {
        key: 'event-validation',
        title: '第四层：事件验证',
        description: '把过去印证和未来节点存下来，后续用真实反馈纠偏。',
        href: '#validation',
        status: driftCount > 0 ? 'watch' : 'planned',
        badge: driftCount > 0 ? '需纠偏' : '验证',
      },
    ],
    categoryRoutes,
    measurementSummary,
    combinationRoutes,
  };
}
