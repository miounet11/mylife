import { buildPremiumServiceOffers, getPremiumServiceLabel } from '@/lib/report-premium-services';
import type { MonthlyWindow, ReportCorrectionInsight, ScenarioView } from '@/lib/report-v2';
import { buildPersonalizedJourney } from '@/lib/surface-journeys';
import { buildToolRecommendations, getToolDefinition, type ToolDefinition } from '@/lib/tools';
import type { FortuneRecord, ReportJourneyEventRecord, ToolSessionRecord } from '@/lib/user-types';

export interface PersonalGrowthHubSummary {
  heading: string;
  description: string;
  focusLine: string;
  urgencyLine: string;
  reportHref: string;
  reportLabel: string;
  primaryTool: {
    slug: string;
    title: string;
    href: string;
    hook: string;
    freeValueLine: string;
    paidValueLine: string;
    premiumServiceLabel: string;
  } | null;
  secondaryTool: {
    slug: string;
    title: string;
    href: string;
  } | null;
  knowledgeCard: {
    href: string;
    title: string;
  } | null;
  caseCard: {
    href: string;
    title: string;
  } | null;
}

function pickRecommendedTools(params: {
  report?: FortuneRecord | null;
  toolSessions?: ToolSessionRecord[];
  journeyEvents?: ReportJourneyEventRecord[];
}) {
  const latestJourneyTool = params.journeyEvents
    ?.map((event) => event.toolSlug ? getToolDefinition(event.toolSlug) : null)
    .find((tool): tool is ToolDefinition => !!tool) || null;
  const latestTool = params.toolSessions?.[0]?.toolSlug
    ? getToolDefinition(params.toolSessions[0].toolSlug)
    : null;
  const recommended = buildToolRecommendations({
    report: params.report,
    recentSessions: (params.toolSessions || []).map((session) => ({
      id: session.id,
      userId: session.userId,
      reportId: session.reportId,
      toolSlug: session.toolSlug,
      status: session.status,
      input: (session.input || {}) as Record<string, unknown>,
      result: (session.result || {}) as any,
      meta: session.meta,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    })),
    limit: 3,
  })
    .map((item) => getToolDefinition(item.slug))
    .filter((item): item is ToolDefinition => !!item);

  const deduped = [latestJourneyTool, latestTool, ...recommended]
    .filter((item, index, array): item is ToolDefinition => !!item && array.findIndex((candidate) => candidate?.slug === item.slug) === index);

  return {
    primaryTool: deduped[0] || null,
    secondaryTool: deduped[1] || null,
  };
}

export function buildPersonalGrowthHub(params: {
  reports?: FortuneRecord[];
  toolSessions?: ToolSessionRecord[];
  journeyEvents?: ReportJourneyEventRecord[];
}): PersonalGrowthHubSummary {
  const latestReport = (params.reports || [])[0] || null;
  const latestToolSessions = params.toolSessions || [];
  const latestJourneyEvents = params.journeyEvents || [];
  const latestJourneyCategory = latestJourneyEvents.find((event) => event.category)?.category || '';
  const latestJourneyToolSlug = latestJourneyEvents.find((event) => event.toolSlug)?.toolSlug || '';
  const latestTool = latestToolSessions[0]?.toolSlug ? getToolDefinition(latestToolSessions[0].toolSlug) : null;
  const hasPersonalSignal = !!latestReport || latestToolSessions.length > 0 || latestJourneyEvents.length > 0;
  const journeySummary = buildPersonalizedJourney(params);
  const { primaryTool, secondaryTool } = pickRecommendedTools({
    report: latestReport,
    toolSessions: latestToolSessions,
    journeyEvents: latestJourneyEvents,
  });
  const reportExperience = latestReport as (FortuneRecord & {
    scenarioViews?: ScenarioView[];
    monthlyWindows?: MonthlyWindow[];
  }) | null;
  const correctionInsight = latestReport?.analysis?.feedbackLoop?.correctionInsight as ReportCorrectionInsight | undefined;
  const premiumOffer = latestReport
    ? buildPremiumServiceOffers({
      scenarioViews: reportExperience?.scenarioViews || [],
      monthlyWindows: reportExperience?.monthlyWindows || [],
      correctionInsight,
    })[0] || null
    : null;

  const focusLine = latestReport
    ? latestJourneyToolSlug && primaryTool?.slug === latestJourneyToolSlug
      ? `你最近已经主动点进“${primaryTool.shortTitle}”，系统会优先承接这个专项选择，而不是重新泛推。`
      : `最近的主轴更接近“${latestReport.pattern?.type || '综合判断'}”，最稳的动作不是重新泛问，而是沿着主问题继续下钻。`
    : latestTool
      ? `最近已经开始做“${latestTool.shortTitle}”，现在应该把单点判断接回综合报告和更深承接。`
      : latestJourneyCategory
        ? `最近的路径选择集中在“${latestJourneyCategory}”，下一步应先接回这个专项，而不是重新浏览。`
      : '还没有形成稳定路径，先做综合测算，再选一个高频工具建立第一次可复用判断。';
  const urgencyLine = premiumOffer
    ? `当前最值得推进的付费承接是 ${premiumOffer.title}，因为它能把“知道一点”升级成“真正能做决定”。`
    : primaryTool
      ? `当前最自然的付费承接是 ${getPremiumServiceLabel(primaryTool.premiumServiceKey || 'event-verdict')}，因为免费层已经能先帮你缩窄问题。`
      : '先建立一次可复用的个人判断记录，后面所有工具和内容才会越用越准。';

  return {
    heading: '下一步，不该只停在浏览',
    description: hasPersonalSignal
      ? '系统已经有你最近的报告和工具历史。这里应该直接把你带回最该继续的报告、工具、文章、案例和付费承接点。'
      : '先建立第一条可复用的判断路径：综合测算打底，再接一个工具，再补一篇方法文和一个案例。',
    focusLine,
    urgencyLine,
    reportHref: latestReport ? `/result/${latestReport.id}` : '/analyze',
    reportLabel: latestReport ? '回到最近综合报告' : '先建立综合测算底盘',
    primaryTool: primaryTool ? {
      slug: primaryTool.slug,
      title: primaryTool.shortTitle,
      href: `/tools/${primaryTool.slug}`,
      hook: primaryTool.hook,
      freeValueLine: primaryTool.freeValueLine,
      paidValueLine: primaryTool.paidValueLine,
      premiumServiceLabel: getPremiumServiceLabel(primaryTool.premiumServiceKey || 'event-verdict'),
    } : null,
    secondaryTool: secondaryTool ? {
      slug: secondaryTool.slug,
      title: secondaryTool.shortTitle,
      href: `/tools/${secondaryTool.slug}`,
    } : null,
    knowledgeCard: journeySummary.journey.knowledgeCards[0]
      ? {
        href: journeySummary.journey.knowledgeCards[0].href,
        title: journeySummary.journey.knowledgeCards[0].title,
      }
      : null,
    caseCard: journeySummary.journey.caseCards[0]
      ? {
        href: journeySummary.journey.caseCards[0].href,
        title: journeySummary.journey.caseCards[0].title,
      }
      : null,
  };
}
