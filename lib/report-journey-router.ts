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

export interface LayeredReportJourney {
  workflowId: string;
  headline: string;
  summary: string;
  currentLayer: ReportJourneyLayerKey;
  primaryAction: ReportJourneyAction;
  layers: ReportJourneyLayer[];
  categoryRoutes: ReportJourneyCategoryRoute[];
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

  if (params.quality?.status === 'retry' || params.quality?.deliveryTier === 'basic') {
    return {
      href: '#deep-report',
      label: '先看核心深度解释',
      description: '当前先交付稳定版，先把结构证据和阶段判断读清楚，后台增强可继续补齐。',
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
  const categoryRoutes = buildCategoryRoutes({
    report: params.report,
    source,
    signalText,
  });
  const primaryAction = buildPrimaryAction({
    reportId: params.report.id,
    quality: params.quality || null,
    validation: params.validation || null,
    categoryRoutes,
  });
  const driftCount = params.validation?.driftCount || 0;
  const hasValidatedEvents = (params.validation?.accurateCount || 0) > 0;

  return {
    workflowId: workflow.workflowId,
    headline: '这份报告按四层继续读',
    summary: '先用首报抓主线，再看深报证据，然后进入最相关专项，最后用真实事件回头验证。',
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
        description: '先看一句话判断、当前阶段、现在先做什么和先别做什么。',
        href: `/result/${params.report.id}`,
        status: 'current',
        badge: '当前',
      },
      {
        key: 'deep-report',
        title: '第二层：深入报告',
        description: '继续看命理证据、五行结构、阶段窗口和行动解释。',
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
  };
}
