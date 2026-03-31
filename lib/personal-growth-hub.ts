import { buildPremiumServiceOffers, getPremiumServiceLabel } from '@/lib/report-premium-services';
import { buildPersonalizedJourney } from '@/lib/surface-journeys';
import { buildToolRecommendations, getToolDefinition, type ToolDefinition } from '@/lib/tools';
import type { FortuneRecord, ToolSessionRecord } from '@/lib/user-types';

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
}) {
  const latestTool = params.toolSessions?.[0]?.toolSlug
    ? getToolDefinition(params.toolSessions[0].toolSlug)
    : null;
  const recommended = buildToolRecommendations({
    report: params.report,
    recentSessions: params.toolSessions || [],
    limit: 3,
  })
    .map((item) => getToolDefinition(item.slug))
    .filter((item): item is ToolDefinition => !!item);

  const deduped = [latestTool, ...recommended]
    .filter((item, index, array): item is ToolDefinition => !!item && array.findIndex((candidate) => candidate?.slug === item.slug) === index);

  return {
    primaryTool: deduped[0] || null,
    secondaryTool: deduped[1] || null,
  };
}

export function buildPersonalGrowthHub(params: {
  reports?: FortuneRecord[];
  toolSessions?: ToolSessionRecord[];
}): PersonalGrowthHubSummary {
  const latestReport = (params.reports || [])[0] || null;
  const latestToolSessions = params.toolSessions || [];
  const latestTool = latestToolSessions[0]?.toolSlug ? getToolDefinition(latestToolSessions[0].toolSlug) : null;
  const hasPersonalSignal = !!latestReport || latestToolSessions.length > 0;
  const journeySummary = buildPersonalizedJourney(params);
  const { primaryTool, secondaryTool } = pickRecommendedTools({
    report: latestReport,
    toolSessions: latestToolSessions,
  });
  const premiumOffer = latestReport
    ? buildPremiumServiceOffers({
      scenarioViews: latestReport.scenarioViews || [],
      monthlyWindows: latestReport.monthlyWindows || [],
      correctionInsight: latestReport.analysis?.feedbackLoop?.correctionInsight,
    })[0] || null
    : null;

  const focusLine = latestReport
    ? `最近的主轴更接近“${latestReport.pattern?.type || '综合判断'}”，最稳的动作不是重新泛问，而是沿着主问题继续下钻。`
    : latestTool
      ? `最近已经开始做“${latestTool.shortTitle}”，现在应该把单点判断接回综合报告和更深承接。`
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
