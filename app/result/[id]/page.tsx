// 结构判断结果页面
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import NextDynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Compass } from 'lucide-react';

// 动态导入以减少首屏加载
const TrustReport = NextDynamic(() => import('@/components/trust-report'), {
  loading: () => <ReportSkeleton />,
});

const NextStepGuide = NextDynamic(() => import('@/components/next-step-guide'), {
  loading: () => <GuideSkeleton />,
});

interface PageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    source?: string;
    view?: string;
  }>;
}

import {
  eventOperations,
  fortuneOperations,
  premiumServiceRequestOperations,
  reportUpgradeJobOperations,
  userOperations,
} from '@/lib/database';
import SiteFooter from '@/components/site-footer';
import ReportMembershipPanel from '@/components/membership/report-membership-panel';
import SiteHeader from '@/components/site-header';
import ResultPublicControls from '@/components/result-public-controls';
import PublicReportInteractionPanel from '@/components/public-report-interaction-panel';
import ReportEnginePanel from '@/components/report-engine-panel';
import ReportPremiumServices from '@/components/report-premium-services';
import ReportSubscriptionPanel from '@/components/report-subscription-panel';
import SurfaceJourneyPanel from '@/components/surface-journey-panel';
import UpdatesStatusPanel from '@/components/updates-status-panel';
import ToolRecommendations from '@/components/tool-recommendations';
import type { UpdatesStatusSummary } from '@/components/updates-status-panel';
import RelatedContent from '@/components/related-content';
import ResultDeferredSection from '@/components/result-deferred-section';
import ReportCockpit from '@/components/report/report-cockpit';
import { ReportCover } from '@/components/report/report-cover';
import DegradeNotice from '@/components/degrade-notice';
import LifeKLineSummaryCard from '@/components/report/life-kline-summary-card';
import ReportStageProgress from '@/components/report/report-stage-progress';
import {
  PastPresentFutureRow,
  ValidationFeedbackHero,
} from '@/components/report/report-deep-summary-blocks';
import PremiumTeaser from '@/components/premium-teaser';
import ReportFollowupAugmenterTrigger from '@/components/report-followup-augmenter-trigger';
import { ReportSurface } from '@/components/report-surface';
import ReportBlueprintCards from '@/components/report/report-blueprint-cards';
import ReportCurrentState from '@/components/report/report-current-state';
import ReportRhythmTimeline from '@/components/report/report-rhythm-timeline';
import ReportScenarioPanels from '@/components/report/report-scenario-panels';
import ReportActionBoard from '@/components/report/report-action-board';
import ReportValidationPanel from '@/components/report/report-validation-panel';
import ReportTimingTabs from '@/components/report/report-timing-tabs';
import ReportContinueExplorationNav from '@/components/report/report-continue-exploration-nav';
import ReportChapterDock, {
  type ReportChapterDockItem,
} from '@/components/report/report-chapter-dock';
import ReportMetaSidebar from '@/components/report/report-meta-sidebar';
import { getCurrentUserId } from '@/lib/user-utils';
import { resolveTimingProfileForFortune } from '@/lib/life-timing/resolve-timing-profile';
import { determineYongShen, analyzeShenSha } from '@/lib/bazi-analyzer';
import { calculateDayun } from '@/lib/dayun-calculator';
import type { FortuneAnalysisResult, FortuneRecord } from '@/lib/user-types';
import AnalyticsPageView from '@/components/analytics-page-view';
import ReportEventCapture from '@/components/report-event-capture';
import {
  buildConfidenceAnalysis,
  buildDecisionPlaybook,
  buildExpertInterpretation,
  buildReportCorrectionInsight,
  buildMonthlyWindows,
  buildReportActionSuggestions,
  buildReportV4Sections,
  buildReportValidationInsights,
  buildScenarioViews,
  buildYearlyTrendSnapshots,
  buildYearlyRoadmap,
} from '@/lib/report-v2';
import { localizeElementList, presentReportText, withPresentedAdvice } from '@/lib/report-presentation';
import { buildProReportView } from '@/lib/report-pro-view';
import ProReportShell from '@/components/report-pro/pro-report-shell';
import ProExpertBanner from '@/components/report-pro/pro-expert-banner';
import ProUserCalibration from '@/components/report-pro/pro-user-calibration';
import { buildExpertDeskView } from '@/lib/report-expert-view';
import ExpertDesk from '@/components/report-expert/expert-desk';
import { buildStateVectorData } from '@/lib/state-vector';
import { ENGINE_BUILD_VERSIONS } from '@/lib/report-pipeline';
import { deriveReportReasoningMode } from '@/lib/report-reasoning-mode';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import { createLineageEntry } from '@/lib/report-version-lineage';
import { buildPremiumServiceOffers, pickPrimaryPremiumOffer } from '@/lib/report-premium-services';
import { buildJourneyForReport } from '@/lib/surface-journeys';
import { buildReportStageLadder, describeReportDeliveryStage } from '@/lib/report-quality';
import { getCurrentLocalMonthKey, parseLocalDate } from '@/lib/utils';
import {
  buildReportChatSource,
  buildReportContinueChatHref,
  buildReportFollowupQuestion,
  buildReportFollowupSuggestions,
} from '@/lib/chat-entry';
import ReportConsultantCards from '@/components/report/report-consultant-cards';
import { buildSourceCtaStrategy, buildSourceJourneyCopy, getSourceContext } from '@/lib/source-context';
import { buildLayeredReportJourney } from '@/lib/report-journey-router';
import type { ReferenceIntelligencePack } from '@/lib/reference-intelligence';
import {
  buildFutureGuidanceBlock,
  buildPastValidationBlock,
  buildPresentDiagnosisBlock,
  compactCopy,
  getPublicDisplayName,
  inferWorldYiGuidedPaths,
  sanitizePublicFortuneRecord,
} from '@/lib/report-page-helpers';
import { buildPublicReportSeo } from '@/lib/public-growth-feed';


function buildFortuneRecordForExperience(params: {
  id: string;
  result: NonNullable<Awaited<ReturnType<typeof getResult>>>;
}): FortuneRecord {
  const { id, result } = params;

  return {
    id,
    userId: result.basic.userId,
    name: result.basic.name,
    birthDate: (result.basic as { birthDate?: string }).birthDate || '',
    birthTime: (result.basic as { birthTime?: string }).birthTime || '',
    birthPlace: (result.basic as { birthPlace?: string }).birthPlace,
    timezone: (result.basic as { timezone?: number }).timezone || 8,
    gender: (result.basic as { gender?: 'male' | 'female' }).gender || 'male',
    bazi: result.basic,
    fiveElements: result.fiveElements,
    tenGods: result.tenGods,
    pattern: result.pattern,
    fortune: result.fortune,
    advice: result.advice,
    evidence: result.evidence,
    analysis: result.analysis,
    klineData: result.klineData || undefined,
    dayun: result.dayun,
    shenSha: result.shenSha,
    reportVersion: result.reportVersion,
    isPublic: result.isPublic,
  };
}


export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const fortuneData = fortuneOperations.getById(id);
    if (fortuneData) {
      const isPublic = fortuneData.isPublic !== false;
      const publicSeo = buildPublicReportSeo(fortuneData);
      return {
        title: `${publicSeo.title} | 人生K线`,
        description: publicSeo.description,
        alternates: {
          canonical: `https://www.life-kline.com/result/${id}`,
        },
        robots: {
          index: isPublic,
          follow: isPublic,
        },
        openGraph: {
          url: `https://www.life-kline.com/result/${id}`,
          title: `${publicSeo.title} | 人生K线`,
          description: publicSeo.description,
        },
      };
    }
  } catch(e) {
    // ignore
  }
  
  return {
    title: '您的结构判断报告 | 人生K线',
    description: '结构化判断结果页，围绕个人结构、阶段节奏、行动建议与验证闭环展开。',
    alternates: {
      canonical: `https://www.life-kline.com/result/${id}`,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

async function getResult(reportId: string, options?: { publicView?: boolean }) {
  try {
    const originalFortuneData = fortuneOperations.getById(reportId);
    if (!originalFortuneData) return null;
    const fortuneData = options?.publicView ? sanitizePublicFortuneRecord(originalFortuneData) : originalFortuneData;
    const analysis = (fortuneData.analysis ?? {
      opening: '当前结构、阶段与节奏已经开始显形。',
      explanation: '当前结果已完成结构判断，可先查看场景视图、月度窗口和行动建议，再继续深入追问。',
    }) as FortuneAnalysisResult['analysis'];

    const pillars = fortuneData.bazi?.pillars || [];
    const bazi = pillars
      .map((pillar) => `${pillar?.celestialStem || ''}${pillar?.earthlyBranch || ''}`)
      .filter((item) => item.length === 2);
    const yongShenResult = bazi.length === 4 ? determineYongShen(bazi) : null;
    const parsedBirthDate = parseLocalDate(fortuneData.birthDate);
    const dayun = fortuneData.dayun || (pillars.length >= 2 && parsedBirthDate && fortuneData.birthTime
      ? calculateDayun(
          parsedBirthDate,
          fortuneData.birthTime,
          fortuneData.gender,
          pillars[0]?.celestialStem || '',
          {
            gan: pillars[1]?.celestialStem || '',
            zhi: pillars[1]?.earthlyBranch || '',
          },
          yongShenResult,
          parsedBirthDate.getFullYear()
        )
      : undefined);
    const shenSha = fortuneData.shenSha || (bazi.length === 4 ? analyzeShenSha(bazi) || undefined : undefined);
    const baseResult = {
      basic: {
        ...fortuneData.bazi,
        name: fortuneData.name || '判断对象',
        dayMaster: fortuneData.bazi?.dayMaster || '未知',
        userId: fortuneData.userId,
      },
      fiveElements: fortuneData.fiveElements,
      tenGods: fortuneData.tenGods,
      pattern: fortuneData.pattern,
      fortune: fortuneData.fortune,
      advice: fortuneData.advice,
      evidence: fortuneData.evidence,
      analysis,
      klineData: fortuneData.klineData || null,
      dayun,
      shenSha,
      reportVersion: fortuneData.reportVersion || 'v1',
      llmUsed: analysis.llmUsed ?? false,
      agenticUsed: analysis.agenticUsed ?? false,
      reasoningMode: deriveReportReasoningMode({
        reasoningMode: analysis.reasoningMode,
        agenticUsed: analysis.agenticUsed ?? false,
        orchestrationMode: analysis.orchestration?.mode,
        orchestrationSuccessRate: analysis.orchestration?.successRate,
        successfulAgents: analysis.orchestration?.succeeded,
        agentResults: analysis.agentResults,
        contextSignals: analysis.contextSignals,
        verifyVerdict: analysis.verify?.verdict,
        enhancementNotes: analysis.enhancementNotes,
      }),
      engineBuilds: analysis.engineBuilds || {
        ...ENGINE_BUILD_VERSIONS,
        report: fortuneData.reportVersion || 'v1',
      },
      verify: analysis.verify,
      qualityAudit: analysis.qualityAudit,
      versionLineage: analysis.versionLineage?.length
        ? analysis.versionLineage
        : [createLineageEntry(analysis, fortuneData.reportVersion || 'v1')]
            .filter((entry): entry is NonNullable<ReturnType<typeof createLineageEntry>> => !!entry),
      upgradeJob: reportUpgradeJobOperations.getByReportId(reportId) || undefined,
      orchestration: analysis.orchestration,
      loop: analysis.loop as Record<string, unknown> | undefined,
      contextSignals: analysis.contextSignals,
      agentResults: analysis.agentResults,
      pipelineVersion: analysis.pipelineVersion || fortuneData.reportVersion || 'v1',
      generatedFrom: analysis.generatedFrom,
      upgradedFromVersion: analysis.upgradedFromVersion,
      enhancementNotes: analysis.enhancementNotes || [],
      isPublic: fortuneData.isPublic !== false,
    };
    const scenarioViews = buildScenarioViews(baseResult);
    const calendarAnchor = getCurrentLocalMonthKey() || new Date();
    const monthlyWindows = buildMonthlyWindows(baseResult, calendarAnchor);
    const confidence = buildConfidenceAnalysis(baseResult);
    const yearlyRoadmap = buildYearlyRoadmap({
      ...baseResult,
      scenarioViews,
      monthlyWindows,
    });
    const decisionPlaybook = buildDecisionPlaybook({
      ...baseResult,
      scenarioViews,
      monthlyWindows,
    });
    const yearlyTrendSnapshots = buildYearlyTrendSnapshots(baseResult);
    const expertInterpretation = buildExpertInterpretation({
      ...baseResult,
      scenarioViews,
      monthlyWindows,
      confidence,
    });
    const actionSuggestions = buildReportActionSuggestions({
      ...baseResult,
      scenarioViews,
      monthlyWindows,
    }, calendarAnchor);
    const referenceIntelligence = readReferenceIntelligence(analysis.contextSignals);
    const stateVector = buildStateVectorData({
      klineData: fortuneData.klineData || null,
      advice: fortuneData.advice,
      dayun,
      referencePack: referenceIntelligence?.pack,
    });

    // Transform database format to match frontend expectations
    return {
      ...baseResult,
      scenarioViews,
      monthlyWindows,
      confidence,
      yearlyRoadmap,
      decisionPlaybook,
      yearlyTrendSnapshots,
      expertInterpretation,
      actionSuggestions,
      stateVector,
      referenceIntelligence,
    };
  } catch(e) {
    console.error("Error fetching report:", e);
    return null;
  }
}

export default async function ResultPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const entrySource = resolvedSearchParams.source?.trim() || '';
  const sourceContext = getSourceContext(entrySource);
  const sourceCtaStrategy = buildSourceCtaStrategy(entrySource);
  const summaryHref = entrySource
    ? `/r/${id}?source=${encodeURIComponent(entrySource)}`
    : `/r/${id}`;
  const viewParam = `${resolvedSearchParams.view || ''}`.trim().toLowerCase();
  // 默认 / 空 / full = 正常用户主报告；classic|expert = 专业版细读；summary = 短摘要 /r
  if (viewParam === 'summary' || viewParam === 'short') {
    const query = entrySource ? `?source=${encodeURIComponent(entrySource)}` : '';
    redirect(`/r/${encodeURIComponent(id)}${query}`);
  }
  const isExpertOnly = viewParam === 'classic' || viewParam === 'expert' || viewParam === 'pro';
  const isClassicOnly = isExpertOnly;
  const expertHref = entrySource
    ? `/result/${id}?view=expert&source=${encodeURIComponent(entrySource)}`
    : `/result/${id}?view=expert`;
  const massHref = entrySource
    ? `/result/${id}?source=${encodeURIComponent(entrySource)}`
    : `/result/${id}`;
  const currentUserId = await getCurrentUserId();
  const rawFortuneData = fortuneOperations.getById(id);

  if (!rawFortuneData) {
    notFound();
  }

  const canManage = !!currentUserId && rawFortuneData.userId === currentUserId;
  if (rawFortuneData.isPublic === false && !canManage) {
    notFound();
  }

  const result = await getResult(id, { publicView: !canManage });

  if (!result) {
    notFound();
  }

  // v5-D38 时间地图 Tab：在 cockpit 后展示 30d/12m/5y 三档
  // resolve 内部已 memoize；失败时静默不展示，不阻断主报告
  let timingRecord: any = null;
  try {
    const resolved = resolveTimingProfileForFortune({
      id: rawFortuneData.id,
      userId: rawFortuneData.userId,
      birthDate: rawFortuneData.birthDate,
      birthTime: rawFortuneData.birthTime,
      gender: rawFortuneData.gender,
      analysis: rawFortuneData.analysis,
    });
    timingRecord = resolved?.record || null;
  } catch (err) {
    console.warn('[result-page] resolveTimingProfileForFortune failed', err);
  }

  const currentUserRecord = currentUserId ? userOperations.getById(currentUserId) as {
    email?: string | null;
    email_verified?: number;
  } | null : null;
  const updatesPanelInitialAuthenticated = !!currentUserRecord?.email && currentUserRecord?.email_verified === 1;
  const updatesPanelInitialSummary: UpdatesStatusSummary = canManage
    ? buildUpdatesSummary({
        userId: currentUserId!,
        email: currentUserRecord?.email,
        requestedReportId: id,
      })
    : null;
  const linkedEvents = canManage
    ? eventOperations
        .getByUserId(result.basic.userId)
        .filter((event) => (event.fortuneAnalysis as { reportId?: string } | undefined)?.reportId === id)
    : [];
  const validationInsights = buildReportValidationInsights(
    linkedEvents.map((event) => ({
      title: event.title,
      userFeedback: event.userFeedback as { wasAccurate?: boolean; userNotes?: string } | undefined,
      fortuneAnalysis: event.fortuneAnalysis as { reason?: string } | undefined,
    }))
  );
  const confirmedPastEventTitles = linkedEvents
    .filter((event) => {
      const feedback = event.userFeedback as { wasAccurate?: boolean } | undefined;
      const analysis = event.fortuneAnalysis as { templateKind?: string } | undefined;
      return feedback?.wasAccurate === true && analysis?.templateKind === 'past_event';
    })
    .map((event) => event.title)
    .slice(0, 3);
  const correctionInsight = buildReportCorrectionInsight({
    validationInsights,
    confidence: result.confidence,
    scenarioViews: result.scenarioViews,
    monthlyWindows: result.monthlyWindows,
  });
  const reportV4Sections = buildReportV4Sections({
    result,
    scenarioViews: result.scenarioViews,
    monthlyWindows: result.monthlyWindows,
    confidence: result.confidence,
    decisionPlaybook: result.decisionPlaybook,
    actionSuggestions: result.actionSuggestions,
    validationInsights,
    correctionInsight,
    stateVector: result.stateVector,
    expertInterpretation: result.expertInterpretation,
    yearlyTrendSnapshots: result.yearlyTrendSnapshots,
  });
  const proReportView = buildProReportView({
    result: result as any,
    scenarioViews: result.scenarioViews,
    monthlyWindows: result.monthlyWindows,
    yearlyTrendSnapshots: result.yearlyTrendSnapshots,
    expertInterpretation: result.expertInterpretation,
    decisionPlaybook: result.decisionPlaybook,
    cockpitHeadline: reportV4Sections.cockpit?.headline,
  });
  const expertDeskView = buildExpertDeskView({
    result: result as any,
    raw: {
      birthDate: (rawFortuneData as any).birthDate || (rawFortuneData as any).birth_date,
      birthTime: (rawFortuneData as any).birthTime || (rawFortuneData as any).birth_time,
      birthPlace: (rawFortuneData as any).birthPlace || (rawFortuneData as any).birth_place,
      timezone: (rawFortuneData as any).timezone,
      gender: (rawFortuneData as any).gender,
      name: (rawFortuneData as any).name,
    },
    dayun: (result as any).dayun || (rawFortuneData as any).dayun || null,
    scenarioViews: result.scenarioViews,
    stateVector: result.stateVector,
    monthlyWindows: result.monthlyWindows,
    decisionPlaybook: result.decisionPlaybook,
    contextSignals:
      (result as any).contextSignals ||
      (result as any).analysis?.contextSignals ||
      (rawFortuneData as any).analysis?.contextSignals ||
      null,
  });
  const premiumServiceOffers = buildPremiumServiceOffers({
    scenarioViews: result.scenarioViews,
    monthlyWindows: result.monthlyWindows,
    correctionInsight,
  });
  // v5-D1 (2026-05-08): 智能挑选最该 surfacing 的一个 offer
  const primaryPremiumOffer = pickPrimaryPremiumOffer({
    offers: premiumServiceOffers,
    scenarioViews: result.scenarioViews,
    monthlyWindows: result.monthlyWindows,
    correctionInsight,
  });
  const initialPremiumRequests = canManage
    ? premiumServiceRequestOperations.listByUserAndReport(currentUserId!, id, 6)
    : [];
  const initialPremiumEmail = `${currentUserRecord?.email || ''}`.trim();
  const publicName = getPublicDisplayName(result.basic.name);
  const fiveElements = result.fiveElements || {};
  const sortedElements = Object.entries(fiveElements).sort(
    (left, right) => Number((right[1] as { strength?: number })?.strength || 0) - Number((left[1] as { strength?: number })?.strength || 0)
  );
  const strongestEntry = sortedElements[0];
  const weakestEntry = [...sortedElements].reverse()[0];
  const elementLabelMap: Record<string, string> = {
    wood: '木',
    fire: '火',
    earth: '土',
    metal: '金',
    water: '水',
  };
  const reportHighlights = [
    { label: '日主', value: result.basic.dayMaster || '未知' },
    { label: '格局', value: result.pattern?.type || '未知' },
    { label: '最强五行', value: strongestEntry ? elementLabelMap[strongestEntry[0]] || strongestEntry[0] : '继续结合结构判断' },
    { label: '最弱五行', value: weakestEntry ? elementLabelMap[weakestEntry[0]] || weakestEntry[0] : '继续结合结构判断' },
  ];
  const qualityAudit = result.qualityAudit;
  const upgradeJob = result.upgradeJob;
  const reportDeliveryStage = describeReportDeliveryStage(qualityAudit?.deliveryTier);
  const reportStageLadder = buildReportStageLadder(qualityAudit?.deliveryTier);
  const currentStageLadderItem = reportStageLadder.find((item) => item.status === 'current') || reportStageLadder[0];
  const nextStageLadderItem = reportStageLadder.find((item) => item.status === 'locked') || null;
  const deliveryTierLabel = reportDeliveryStage.label;
  const upgradeStatusLabel = upgradeJob?.status === 'running'
    ? '内容补全进行中'
    : upgradeJob?.status === 'retry' || upgradeJob?.status === 'pending'
    ? '等待内容补全'
    : upgradeJob?.status === 'completed'
    ? '内容已补全'
    : upgradeJob?.status === 'failed'
    ? '内容补全已暂停'
    : '';
  const topMonthlyWindows = (result.monthlyWindows || []).slice(0, 3).map((item) => ({
    label: item.label,
    theme: item.theme,
    status: item.status,
  }));
  // 首屏顾问卡：best = 高分窗，risk = 低分窗（与 report-v2 playbook 一致）
  const consultantWindows = (() => {
    const windows = [...(result.monthlyWindows || [])];
    if (windows.length === 0) {
      const lead = topMonthlyWindows[0]?.label;
      return lead ? { best: lead, risk: undefined as string | undefined } : null;
    }
    const best = [...windows].sort((a, b) => b.score - a.score)[0];
    const risk = [...windows].sort((a, b) => a.score - b.score)[0];
    return {
      best: best?.label || undefined,
      risk: risk && risk.key !== best?.key ? risk.label : undefined,
    };
  })();
  const stateVectorCurrent = result.stateVector?.current;
  const stateVectorCards = stateVectorCurrent
    ? [
        { label: '天时', value: stateVectorCurrent.tianShi, detail: '看当前时机、阶段节奏和推进窗口。' },
        { label: '地利', value: stateVectorCurrent.diLi, detail: '看城市、空间环境和地理匹配度。' },
        { label: '人和', value: stateVectorCurrent.renHe, detail: '看关系协同、合作边界和互动质量。' },
      ]
    : [];
  const referenceAuthority = result.referenceIntelligence?.pack?.authority;
  const referenceLeadDirective = result.referenceIntelligence?.pack?.modelDirectives?.[0];
  const referenceSignals = [
    ...(result.referenceIntelligence?.pack?.dimensions?.tianShi?.signals || []),
    ...(result.referenceIntelligence?.pack?.dimensions?.diLi?.signals || []),
    ...(result.referenceIntelligence?.pack?.dimensions?.renHe?.signals || []),
  ].slice(0, 6);
  const currentStageSummary = result.scenarioViews?.[0]?.summary
    || result.analysis?.opening
    || result.pattern?.description
    || '当前结果已经完成结构判断、阶段判断和行动建议的初步整合。';
  const nextFocusSummary = topMonthlyWindows.length > 0
    ? `接下来优先关注 ${topMonthlyWindows.map((item) => item.label).join('、')}。`
    : '接下来应优先结合人生K线、当前大运和场景建议看清阶段主线。';
  const leadPlaybook = result.decisionPlaybook?.[0];
  const leadWindow = topMonthlyWindows[0];
  const favoredElements = localizeElementList([
    ...(result.advice?.yongShen || []),
    ...(result.advice?.xiShen || []),
  ]).slice(0, 3);
  const decisionEvidence = [
    result.pattern?.type
      ? `结构主轴：当前以 ${result.pattern.type} 为主判断。`
      : '',
    result.fortune?.currentDaYun
      ? `阶段位置：当前行运落在 ${presentReportText(result.fortune.currentDaYun)}。`
      : '',
    favoredElements.length > 0
      ? `顺势重点：优先放大 ${favoredElements.join('、')} 对应动作。`
      : presentReportText(result.confidence?.stablePoints?.[0] || ''),
  ].filter(Boolean).slice(0, 3);
  const decisionHeadline = compactCopy(
    presentReportText(
      leadPlaybook?.whyNow
        || currentStageSummary
        || result.confidence?.summary
    )
  );
  const decisionWindowLabel = leadWindow
    ? `${leadWindow.label} · ${leadWindow.theme}`
    : compactCopy(nextFocusSummary, 48);
  const decisionNowAction = compactCopy(
    leadPlaybook?.nowAction
      || result.actionSuggestions?.[0]?.description
      || '先按当前阶段主线推进一个最小可验证动作，再继续观察反馈。'
  );
  const decisionAvoidAction = compactCopy(
    leadPlaybook?.avoidAction
      || result.confidence?.sensitivePoints?.[0]
      || qualityAudit?.concerns?.[0]
      || '不要在时机未确认前同时推进多个高成本动作。'
  );
  const pastValidationBlock = buildPastValidationBlock({
    structuredBlock: result.analysis?.judgmentBlocks?.pastValidation,
    validationInsights,
    linkedEvents: linkedEvents.map((event) => ({
      title: event.title,
      userFeedback: event.userFeedback as { wasAccurate?: boolean; userNotes?: string } | undefined,
      fortuneAnalysis: event.fortuneAnalysis as { reason?: string } | undefined,
    })),
  });
  if (confirmedPastEventTitles.length > 0) {
    pastValidationBlock.evidence = [
      `你已经亲自确认过这些过去节点：${confirmedPastEventTitles.join('、')}。`,
      ...pastValidationBlock.evidence,
    ].slice(0, 3);
  }
  const presentDiagnosisBlock = buildPresentDiagnosisBlock({
    structuredBlock: result.analysis?.judgmentBlocks?.presentDiagnosis,
    currentStageSummary,
    decisionHeadline,
    patternType: result.pattern?.type,
    currentDaYun: result.fortune?.currentDaYun,
    favoredElements,
    stateVectorCards,
  });
  const futureGuidanceBlock = buildFutureGuidanceBlock({
    structuredBlock: result.analysis?.judgmentBlocks?.futureGuidance,
    decisionNowAction,
    decisionAvoidAction,
    nextFocusSummary,
    leadWindow,
    topMonthlyWindows,
  });
  const experienceReport = buildFortuneRecordForExperience({ id, result });
  const reportJourney = buildJourneyForReport(experienceReport, { source: entrySource || null });
  const layeredReportJourney = buildLayeredReportJourney({
    report: experienceReport,
    quality: qualityAudit || null,
    validation: validationInsights,
    source: entrySource || `result_report:${id}`,
  });
  const primaryToolRoute = layeredReportJourney.categoryRoutes[0] || null;
  const reportJourneyCopy = buildSourceJourneyCopy(entrySource, {
    title: '这份主测算已经接到工具和内容系统',
    description: '从主报告继续通往单项工具、专题阅读和后续动作，让这份结果成为长期工作的起点。',
  });
  const worldYiSignalText = [
    result.pattern?.type,
    currentStageSummary,
    decisionNowAction,
    decisionAvoidAction,
    result.analysis?.opening,
    result.analysis?.explanation,
    ...(result.confidence?.stablePoints || []),
    ...(result.confidence?.sensitivePoints || []),
  ].filter(Boolean).join(' ');
  const worldYiGuidedPaths = inferWorldYiGuidedPaths(worldYiSignalText);
  const reportFollowupQuestion = buildReportFollowupQuestion({
    actionSuggestions: result.actionSuggestions,
    defaultQuestion: result.analysis?.summary || result.analysis?.opening || decisionNowAction,
  });
  // v5-B1 (2026-05-08): 把单条 followup 升级成 3 条上下文化追问
  // v5-B4 (2026-05-08): 接入更多上下文（场景视图、纠偏洞察、最逾期事件）
  const cautionScenario = (result.scenarioViews || []).find((s) => s.key !== 'overall' && s.status === 'caution') || null;
  const pushScenario = (result.scenarioViews || []).find((s) => s.key !== 'overall' && s.status === 'push') || null;

  // 找最逾期但仍在 14 天内的待验证事件（v5-B4）
  const todayMs = (() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t.getTime();
  })();
  const pendingOverdueEvent = (() => {
    if (!Array.isArray(linkedEvents) || linkedEvents.length === 0) return null;
    const candidates = linkedEvents
      .filter((e) => {
        const fb = (e as any).userFeedback;
        if (fb && fb.wasAccurate !== undefined) return false;
        if (!e.date) return false;
        const eventTime = new Date(`${e.date}T00:00:00`).getTime();
        if (!Number.isFinite(eventTime)) return false;
        const overdueDays = Math.floor((todayMs - eventTime) / 86_400_000);
        return overdueDays >= 3 && overdueDays <= 14;
      })
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const oldest = candidates[0];
    if (!oldest) return null;
    const overdueDays = Math.floor((todayMs - new Date(`${oldest.date}T00:00:00`).getTime()) / 86_400_000);
    return { title: oldest.title, date: oldest.date, overdueDays };
  })();

  const reportFollowupSuggestions = buildReportFollowupSuggestions({
    publicName,
    patternType: result.pattern?.type,
    dayMaster: result.basic?.dayMaster,
    actionSuggestions: result.actionSuggestions,
    topMonthlyWindow: topMonthlyWindows[0],
    hasRiskScenario: Array.isArray(result.confidence?.sensitivePoints) && result.confidence.sensitivePoints.length > 0,
    cautionScenario,
    pushScenario,
    correctionLevel: correctionInsight?.level,
    correctionSummary: correctionInsight?.summary,
    pendingOverdueEvent,
  });

  // v5-B5 (2026-05-08): 优先使用缓存的追问建议，否则用确定性建议
  const cachedFollowupSuggestions = (result.analysis as any)?.followupSuggestions;
  const cachedFollowupAt = (result.analysis as any)?.followupSuggestionsAt;
  const cachedAge = cachedFollowupAt ? Date.now() - new Date(cachedFollowupAt).getTime() : Infinity;
  const followupCacheFresh = Array.isArray(cachedFollowupSuggestions)
    && cachedFollowupSuggestions.length > 0
    && Number.isFinite(cachedAge)
    && cachedAge < 24 * 60 * 60 * 1000;
  const finalFollowupSuggestions = followupCacheFresh ? cachedFollowupSuggestions : reportFollowupSuggestions;
  const shouldTriggerAugmenter = !followupCacheFresh;
  const reportChatSource = buildReportChatSource(entrySource);
  // Primary continue: consultant-card opening (no long prefill)
  const reportChatHref = buildReportContinueChatHref({
    reportId: id,
    source: reportChatSource,
    teacher: 'overview',
    window: (finalFollowupSuggestions?.[0] as { label?: string } | undefined)?.label || null,
    ctaStrategyKey: sourceCtaStrategy.strategyKey,
    sourceFamily: sourceCtaStrategy.sourceFamily,
  });
  const isEnhancementPending = !result.llmUsed && !!upgradeJob?.status && ['pending', 'running', 'retry'].includes(upgradeJob.status);
  const enhancementStatusMessage = isEnhancementPending
    ? '当前先显示可读版，内容补全仍在继续，不需要反复刷新页面。'
    : !result.llmUsed
    ? '当前这份结果适合先看结论、阶段和行动建议；如需更完整内容，可稍后重新生成。'
    : '当前内容已补全，可直接按完整路径阅读。';
  const feedbackLevel = correctionInsight.level || 'healthy';
  const feedbackHeroTone = feedbackLevel === 'action'
    ? 'bg-[color:var(--alert-soft)] text-[color:var(--alert)] border-[color:var(--alert)]'
    : feedbackLevel === 'watch'
      ? 'bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)] border-[color:var(--signal)]'
      : 'bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)] border-[rgba(47,125,82,0.20)]';
  const feedbackHeroLabel = feedbackLevel === 'action'
    ? '需要纠偏'
    : feedbackLevel === 'watch'
      ? '持续观察'
      : '反馈稳定';
  
  const publicSeo = buildPublicReportSeo(buildFortuneRecordForExperience({ id, result }));
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: publicSeo.title,
    description: publicSeo.description,
    mainEntityOfPage: `https://www.life-kline.com/result/${id}`,
    author: {
      '@type': 'Organization',
      name: '人生K线',
      url: 'https://www.life-kline.com'
    }
  };

  // 悬浮章节：Pro 一览优先；详细长文折叠时仍可跳转
  // 只传可序列化字段（iconKey），禁止传 Lucide 组件函数给 Client Component
  const chapterDockItems: ReportChapterDockItem[] = isClassicOnly
    ? [
        { id: 'report-consultants', label: '问顾问', iconKey: 'footprints' },
        { id: 'expert-desk', label: '排盘', iconKey: 'layers' },
        { id: 'ex-dayun', label: '大运', iconKey: 'calendar' },
        { id: 'ex-cosmos', label: '时空', iconKey: 'compass' },
        { id: 'ex-domains', label: '专项', iconKey: 'target' },
        { id: 'ex-probe', label: '点盘', iconKey: 'check' },
        { id: 'ex-print', label: '打印', iconKey: 'bell' },
      ]
    : [
        { id: 'report-consultants', label: '问顾问', iconKey: 'footprints' },
        { id: 'pro-action', label: '行动', iconKey: 'target' },
        { id: 'pro-guide', label: '结论', iconKey: 'compass' },
        { id: 'pro-kline', label: 'K线', iconKey: 'layers' },
        { id: 'pro-overview', label: '总评', iconKey: 'check' },
        { id: 'pro-elements', label: '喜用', iconKey: 'layers' },
        { id: 'pro-time', label: '时间', iconKey: 'calendar' },
        { id: 'pro-calibration', label: '校准', iconKey: 'bell' },
      ];

  // v5-D60 右栏元数据
  const modelChainLabel = result.orchestration?.mode
    ? `${result.orchestration.mode}`
    : null;
  const reasoningModeLabel = (() => {
    switch (result.reasoningMode) {
      case 'parallel-agents':
        return '并发 Agent';
      case 'deterministic-expert':
        return 'Deterministic 专家层';
      case 'engine':
        return '基础引擎';
      default:
        return null;
    }
  })();
  const generatedAtIso = (rawFortuneData as { createdAt?: string }).createdAt
    || (rawFortuneData as { updatedAt?: string }).updatedAt
    || null;
  return (
    <div className="page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnalyticsPageView
        eventName="report_viewed"
        page={`/result/${id}`}
        meta={{
          reportId: id,
          isPublic: result.isPublic,
          reportVersion: result.reportVersion || 'v1',
          reasoningMode: result.reasoningMode || 'engine',
          pattern: result.pattern?.type || '',
          source: entrySource || null,
        }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="再次分析" />

      {/* v5-B5: 追问建议补全（fire-and-forget，不阻塞渲染） */}
      <ReportFollowupAugmenterTrigger reportId={id} shouldTrigger={shouldTriggerAugmenter} />

      <main className="page-frame py-6 pb-24 md:py-8 md:pb-20">
        <ReportSurface>
          {/* 章节导航悬浮，不占左栏；正文 + 右侧 meta */}
          <ReportChapterDock items={chapterDockItems} title="报告章节" />

          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start lg:gap-5 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:max-w-[1100px] 2xl:mx-auto">
            <div className="min-w-0 space-y-4 md:space-y-5">
              {!isClassicOnly ? (
                <>
                  <ProReportShell
                    view={proReportView}
                    klineData={result.klineData}
                    summaryHref={summaryHref}
                    expertHref={expertHref}
                    publicName={publicName}
                    reportId={id}
                    canManage={canManage}
                    consultantWindows={consultantWindows}
                    birthYear={(() => {
                      const raw =
                        (rawFortuneData as any).birthDate ||
                        (rawFortuneData as any).birth_date ||
                        (result.basic as any)?.birthDate ||
                        '';
                      const m = String(raw).match(/^(\d{4})/);
                      return m ? Number(m[1]) : undefined;
                    })()}
                    currentDayun={
                      (result as any).dayun?.currentDayun ||
                      (result as any).dayun?.current ||
                      expertDeskView?.dayun?.current ||
                      null
                    }
                    currentDaYunText={
                      (result as any).fortune?.currentDaYun ||
                      proReportView.subtitle ||
                      ''
                    }
                    birthTimeUncertain={(() => {
                      const t = String(
                        (rawFortuneData as any).birthTime ||
                          (result.basic as any)?.birthTime ||
                          ''
                      ).trim();
                      if (!t || /未知|不详|不清楚|noon|12:00|12：00/.test(t)) return true;
                      const certainty = (result.analysis as any)?.birthTimeCertainty;
                      if (certainty === 'low' || certainty === 'unknown') return true;
                      return false;
                    })()}
                  />
                  <ProUserCalibration
                    reportId={id}
                    canManage={canManage}
                    pastEventTemplates={result.analysis?.pastEventTemplates || []}
                  />
                  <ProExpertBanner mode="entry" expertHref={expertHref} />
                </>
              ) : (
                <ProExpertBanner mode="header" massHref={massHref} />
              )}

              {/* 专业版：排盘工作台为主；仅 view=expert|classic|pro */}
              {isClassicOnly ? (
              <div id="classic-report" className="scroll-mt-header space-y-4 md:space-y-5">
              <ExpertDesk desk={expertDeskView} klineData={result.klineData} reportId={id} />

              <div className="rounded-[10px] border border-dashed border-[#94a3b8] bg-[#f8fafc] px-4 py-3 text-[12px] text-[#64748b]">
                以下为报告叙述层（驾驶舱 / 场景 / 证据），可与上方排盘交叉验证。
              </div>

              <div className="fb-card overflow-hidden">
                <ReportCover
                  userName={publicName}
                  birthIso={canManage && result.basic && (result.basic as any).birthDate
                    ? `${(result.basic as any).birthDate}${
                        (result.basic as any).birthTime ? ' ' + (result.basic as any).birthTime : ''
                      }`
                    : rawFortuneData.birthDate
                      ? `${rawFortuneData.birthDate}${rawFortuneData.birthTime ? ` ${rawFortuneData.birthTime}` : ''}`
                    : undefined}
                  birthLocation={
                    canManage
                      ? (result.basic as any)?.birthPlace || rawFortuneData.birthPlace || undefined
                      : undefined
                  }
                  pillarSummary={
                    expertDeskView.pillars.map((p) => p.ganZhi).join(' ') ||
                    (result.basic && (result.basic as any).year && (result.basic as any).month
                      ? `${(result.basic as any).year} ${(result.basic as any).month} ${(result.basic as any).day} ${(result.basic as any).hour}`
                      : undefined)
                  }
                  qualityTier={deliveryTierLabel}
                />
              </div>

              {/* ① 核心结论：只保留驾驶舱 + 一条紧凑行动条 */}
              <section id="cockpit" className="fb-card scroll-mt-header border-t-2 border-t-[#3b5998] p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="fb-section-title text-[15px] font-bold text-[color:var(--ink-1)]">
                    专业① 核心结论（排盘研判）
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[color:var(--ink-4)]">
                    {isEnhancementPending ? (
                      <span className="rounded-[3px] bg-[color:var(--signal-soft)] px-2 py-0.5 text-[color:var(--signal-strong)]">
                        内容补全中
                      </span>
                    ) : null}
                    <span className="rounded-[3px] bg-[#f6f7f9] px-2 py-0.5">
                      {`${result.llmUsed ? '内容已完善' : '基础可读版'} · ${deliveryTierLabel}`}
                    </span>
                  </div>
                </div>

                <h1 className="mt-2.5 max-w-4xl text-[20px] font-bold leading-[1.35] text-[color:var(--ink-1)] md:text-[24px]">
                  {reportV4Sections.cockpit.headline || `${publicName}当前最重要的，`}
                </h1>

                <div className="mt-3">
                  <ReportCockpit
                    section={reportV4Sections.cockpit}
                    reportId={id}
                    chatHref={reportChatHref}
                    eventsHref={`/events?reportId=${encodeURIComponent(id)}`}
                    guidedPaths={worldYiGuidedPaths.slice(0, 3)}
                    followupQuestion={reportFollowupQuestion}
                    followupSuggestions={finalFollowupSuggestions}
                    sourceGuidance={entrySource ? sourceContext.reportHeadline : undefined}
                    chatLabel={sourceCtaStrategy.reportSecondaryLabel}
                    eventsLabel={sourceCtaStrategy.reportEventLabel}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                  />
                </div>

                {isEnhancementPending ? (
                  <div className="mt-3">
                    <DegradeNotice
                      pending={isEnhancementPending}
                      lastError={upgradeJob?.lastError}
                      reportId={id}
                    />
                  </div>
                ) : null}

                {/* 紧凑跳转，不再堆叠完整 ReadingPath / NextActions 双模块 */}
                <div className="mt-4 grid gap-2 border-t border-[color:var(--hairline)] pt-3 sm:grid-cols-2 lg:grid-cols-4">
                  <a href="#report-consultants" className="rounded-[3px] border border-[color:var(--hairline)] bg-white px-3 py-2 text-[12px] font-semibold text-[color:var(--ink-2)] hover:bg-[#f6f7f9]">
                    先问一位顾问
                  </a>
                  <a href="#timing-map" className="rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-3 py-2 text-[12px] font-semibold text-[#3b5998] hover:bg-[#e9ebee]">
                    下一步 → 看时间地图
                  </a>
                  <a href="#deep-structure" className="rounded-[3px] border border-[color:var(--hairline)] bg-white px-3 py-2 text-[12px] font-semibold text-[color:var(--ink-2)] hover:bg-[#f6f7f9]">
                    或 → 看结构节奏
                  </a>
                  <a href={reportChatHref} className="rounded-[3px] border border-[#3b5998]/25 bg-white px-3 py-2 text-[12px] font-semibold text-[#3b5998] hover:bg-[#e9ebee]">
                    {sourceCtaStrategy.reportPrimaryLabel || '去 AI 深问'}
                  </a>
                </div>

                <div className="mt-4">
                  <ReportConsultantCards
                    reportId={id}
                    windows={consultantWindows}
                    source={`report:${id}:classic_cockpit`}
                  />
                </div>
              </section>

              {/* ② 时间地图：独立成章，不再塞进结论卡 */}
              {timingRecord ? (
                <section id="timing-map" className="fb-card scroll-mt-header border-t-2 border-t-[#3b5998] p-4 md:p-5">
                  <div className="fb-section-title text-[15px] font-bold text-[color:var(--ink-1)]">
                    ② 时间地图
                  </div>
                  <p className="mt-1 text-[12px] leading-[1.5] text-[color:var(--ink-4)]">
                    未来 30 天 / 12 个月 / 5 年关键时点。先定位窗口，再读结构细节。
                  </p>
                  <div className="mt-3">
                    <ReportTimingTabs record={timingRecord} />
                  </div>
                </section>
              ) : null}

              {/* ③ 结构节奏：单列清晰阅读（宽屏再双列） */}
              <section id="deep-structure" className="fb-card scroll-mt-header border-t-2 border-t-[#3b5998] p-4 md:p-5">
                <div className="fb-section-title text-[15px] font-bold text-[color:var(--ink-1)]">
                  ③ 结构与节奏
                </div>
                <p className="mt-1 max-w-2xl text-[12px] leading-[1.5] text-[color:var(--ink-4)]">
                  命盘底层、阶段节奏、当前状态与四场景判断。同一结论只在这里展开一次。
                </p>
                <div className="mt-3 space-y-3">
                  <div id="trend" className="scroll-mt-header space-y-3">
                    <LifeKLineSummaryCard
                      section={reportV4Sections.lifeKLine}
                      klineData={result.klineData}
                    />
                    <ReportRhythmTimeline section={reportV4Sections.timeline12Months} />
                  </div>
                  <div id="overview" className="scroll-mt-header">
                    <ReportBlueprintCards section={reportV4Sections.coreBlueprint} />
                  </div>
                  <div id="current-state" className="scroll-mt-header">
                    <ReportCurrentState section={reportV4Sections.currentOperatingSystem} />
                  </div>
                  <div id="scenario" className="scroll-mt-header">
                    <ReportScenarioPanels section={reportV4Sections.scenarioPanels} />
                  </div>
                </div>
              </section>

              {/* ④ 行动方案：只放行动/验证/阶段，不塞专项推销 */}
              <section id="deep-action" className="fb-card scroll-mt-header border-t-2 border-t-[#3b5998] p-4 md:p-5">
                <div className="fb-section-title text-[15px] font-bold text-[color:var(--ink-1)]">
                  ④ 行动与验证
                </div>
                <p className="mt-1 max-w-2xl text-[12px] leading-[1.5] text-[color:var(--ink-4)]">
                  对应「治疗方案 / 干预建议」：先做什么、不做什么，以及可信度与阶段进度。
                </p>
                <div id="action-validation" className="mt-3 space-y-3 scroll-mt-header">
                  <ReportActionBoard section={reportV4Sections.actionBoard} />
                  <ReportValidationPanel section={reportV4Sections.validationLayer} />
                </div>
                <div id="past-present-future" className="mt-3 scroll-mt-header">
                  <PastPresentFutureRow
                    past={pastValidationBlock}
                    present={presentDiagnosisBlock}
                    future={futureGuidanceBlock}
                  />
                </div>
                <div className="mt-3">
                  <ReportStageProgress
                    ladder={reportStageLadder}
                    current={currentStageLadderItem}
                    next={nextStageLadderItem}
                    qualityAudit={qualityAudit}
                    llmUsed={result.llmUsed}
                    isEnhancementPending={isEnhancementPending}
                    enhancementStatusMessage={enhancementStatusMessage}
                    upgradeStatus={upgradeJob?.status}
                    upgradeStatusLabel={upgradeStatusLabel}
                  />
                </div>
                {canManage ? (
                  <div className="mt-3">
                    <ValidationFeedbackHero
                      toneClass={feedbackHeroTone}
                      label={feedbackHeroLabel}
                      validationInsights={validationInsights}
                      correctionInsight={correctionInsight}
                    />
                  </div>
                ) : null}
                <div className="mt-4 grid gap-2 border-t border-[color:var(--hairline)] pt-3 sm:grid-cols-2">
                  <a href="#event-samples" className="rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-3 py-2 text-[12px] font-semibold text-[#3b5998] hover:bg-[#e9ebee]">
                    下一步 → 样本回填校准
                  </a>
                  <a href="#services" className="rounded-[3px] border border-[color:var(--hairline)] bg-white px-3 py-2 text-[12px] font-semibold text-[color:var(--ink-2)] hover:bg-[#f6f7f9]">
                    或 → 回访与专项服务
                  </a>
                </div>
              </section>

              {/* ⑤ 样本回填：从窄侧栏挪到正文，避免中文竖排与碎片感 */}
              {(result.actionSuggestions?.length || result.analysis?.pastEventTemplates?.length) ? (
                <section id="event-samples" className="fb-card scroll-mt-header border-t-2 border-t-[#3b5998] p-4 md:p-5">
                  <div className="fb-section-title text-[15px] font-bold text-[color:var(--ink-1)]">
                    ⑤ 样本回填
                  </div>
                  <p className="mt-1 max-w-2xl text-[12px] leading-[1.5] text-[color:var(--ink-4)]">
                    对应「病史核对 / 基线样本」：把报告判断与真实经历对齐，供后续纠偏。
                  </p>
                  <div className="mt-4">
                    <ReportEventCapture
                      reportId={id}
                      suggestions={result.actionSuggestions || []}
                      pastEventTemplates={result.analysis?.pastEventTemplates || []}
                      ctaStrategyKey={sourceCtaStrategy.strategyKey}
                      sourceFamily={sourceCtaStrategy.sourceFamily}
                      variant="document"
                    />
                  </div>
                </section>
              ) : null}

              {/* 分享与公开：轻量条，不打断主阅读流 */}
              <div className="space-y-3">
                <PublicReportInteractionPanel
                  reportId={id}
                  publicName={publicName}
                  canManage={canManage}
                  isPublic={result.isPublic}
                  reportChatHref={reportChatHref}
                  toolHref={primaryToolRoute?.href}
                />
                <ResultPublicControls
                  reportId={id}
                  initialIsPublic={result.isPublic}
                  canManage={canManage}
                  publicName={publicName}
                  deliveryTierLabel={deliveryTierLabel}
                  summary={currentStageSummary}
                  nextFocusSummary={nextFocusSummary}
                  highlights={reportHighlights}
                />
              </div>

              {/* ⑥ 证据附录 */}
              <ResultDeferredSection
                id="validation"
                title="⑥ 证据附录"
                description="四柱、五行、大运、窗口与可信度——技术细节放在结论之后，默认按需展开。"
                delayMs={0}
              >
                <Suspense fallback={<ReportSkeleton />}>
                  <TrustReport
                    result={{
                      ...withPresentedAdvice(result as any),
                      validationInsights,
                      correctionInsight,
                    }}
                  />
                </Suspense>
              </ResultDeferredSection>
              </div>
              ) : null}

              {/* 回访与服务：正常页与专业版均可 */}
              <div id="services" className="scroll-mt-header space-y-4">
                <div className="fb-card border-t-2 border-t-[#3b5998] px-4 py-3 md:px-5">
                  <div className="text-[15px] font-bold text-[color:var(--ink-1)]">回访与服务</div>
                  <p className="mt-0.5 text-[12px] leading-[1.55] text-[color:var(--ink-4)]">
                    读完主判断后再处理：会员权限、深度专项、订阅提醒与延伸工具。
                  </p>
                </div>

                <div className="fb-card p-4 md:p-5">
                  <div className="text-[13px] font-bold text-[color:var(--ink-1)]">会员与权限</div>
                  <div className="mt-3">
                    <ReportMembershipPanel reportId={id} source="result_full_report" />
                  </div>
                </div>

                <div id="premium" className="fb-card scroll-mt-header p-4 md:p-5">
                  <div className="text-[13px] font-bold text-[color:var(--ink-1)]">深度专项服务</div>
                  <div className="mt-3">
                    <ReportPremiumServices
                      reportId={id}
                      canManage={canManage}
                      offers={premiumServiceOffers}
                      initialEmail={initialPremiumEmail}
                      initialRequests={initialPremiumRequests}
                      ctaStrategyKey={sourceCtaStrategy.strategyKey}
                      sourceFamily={sourceCtaStrategy.sourceFamily}
                    />
                  </div>
                  {primaryPremiumOffer ? (
                    <div className="mt-4 border-t border-[color:var(--hairline)] pt-3">
                      <PremiumTeaser
                        reportId={id}
                        offer={primaryPremiumOffer}
                        anchorHref="#premium"
                        ctaStrategyKey={sourceCtaStrategy.strategyKey}
                        sourceFamily={sourceCtaStrategy.sourceFamily}
                      />
                    </div>
                  ) : null}
                </div>

                <div id="subscription" className="fb-card scroll-mt-header p-4 md:p-5">
                  <div className="text-[13px] font-bold text-[color:var(--ink-1)]">订阅与更新</div>
                  <div className="mt-3">
                    <ReportSubscriptionPanel
                      reportId={id}
                      canManage={canManage}
                      deliveryTierLabel={deliveryTierLabel}
                      qualityScore={qualityAudit?.overallScore}
                      qualityGrade={qualityAudit?.grade}
                      targetAchieved={qualityAudit?.targetAchieved}
                      upgradeStatusLabel={upgradeStatusLabel}
                      monthlyHighlights={topMonthlyWindows}
                      ctaStrategyKey={sourceCtaStrategy.strategyKey}
                      sourceFamily={sourceCtaStrategy.sourceFamily}
                    />
                  </div>
                </div>

                <div id="next-step" className="fb-card scroll-mt-header space-y-4 p-4 md:p-5">
                  <div>
                    <div className="text-[13px] font-bold text-[color:var(--ink-1)]">延伸与下一步</div>
                    <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
                      可执行清单、路径与延伸阅读，按需展开。
                    </p>
                  </div>
                  <Suspense fallback={<GuideSkeleton />}>
                    <NextStepGuide
                      reportId={id}
                      hasPendingValidation={validationInsights.pendingCount > 0}
                      hasDrift={validationInsights.driftCount > 0}
                      canManage={canManage}
                      ctaStrategyKey={sourceCtaStrategy.strategyKey}
                      sourceFamily={sourceCtaStrategy.sourceFamily}
                    />
                  </Suspense>
                  <ReportContinueExplorationNav reportId={id} />
                  <SurfaceJourneyPanel
                    journey={reportJourney}
                    title={reportJourneyCopy.title}
                    description={reportJourneyCopy.description}
                    badge={entrySource ? `${sourceContext.guidanceLabel} · 来源已保留` : undefined}
                  />
                  <div id="tool-recommendations" className="scroll-mt-header">
                    <ToolRecommendations
                      report={experienceReport}
                      page={`/result/${id}`}
                      title="推荐单项工具"
                      description="根据这份主报告的结构和当前重点，优先给出最值得继续细化的单项工具。"
                      enableQuickStart
                      source={entrySource || `result_report:${id}`}
                      ctaStrategyKey={sourceCtaStrategy.strategyKey}
                      sourceFamily={sourceCtaStrategy.sourceFamily}
                    />
                  </div>
                  <div id="related-content" className="scroll-mt-header">
                    <RelatedContent
                      source={entrySource || `result_report:${id}`}
                      reportContext={{
                        pillars: [
                          result.pattern?.type,
                          result.fortune?.currentDaYun,
                          ...(result.advice?.yongShen || []),
                        ].filter(Boolean) as string[],
                        themes: ['career', 'wealth', 'relationship', 'health', 'timing', 'kline'],
                        agentModules: ['core_constitution', 'career_wealth', 'strategy_advisor', 'temporal_spatial_advisor'],
                        yongShen: [...(result.advice?.yongShen || []), ...(result.advice?.xiShen || [])],
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 右栏：报告 meta + 状态卡 */}
            <ReportMetaSidebar
              reportId={id}
              isPublic={!!result.isPublic}
              generatedAt={generatedAtIso}
              qualityLabel={deliveryTierLabel}
              qualityScore={typeof qualityAudit?.overallScore === 'number' ? qualityAudit.overallScore : null}
              reportVersion={result.reportVersion || 'v1'}
              reasoningMode={reasoningModeLabel}
              modelChainLabel={modelChainLabel}
            >
              <ReportEnginePanel
                reportId={id}
                canManage={canManage}
                reportVersion={result.reportVersion || 'v1'}
                llmUsed={result.llmUsed}
                agenticUsed={!!result.agenticUsed || !!result.analysis?.agenticUsed}
                consistencyScore={result.verify?.consistencyScore}
                verifyVerdict={result.verify?.verdict}
                qualityAudit={result.qualityAudit}
                upgradeJob={result.upgradeJob}
                generatedFrom={result.generatedFrom}
                engineBuilds={result.engineBuilds || ENGINE_BUILD_VERSIONS}
                enhancementNotes={canManage ? (result.enhancementNotes || []) : []}
                orchestration={result.orchestration || result.analysis?.orchestration}
                feedbackLoop={result.analysis?.feedbackLoop}
              />

              {canManage ? (
                <UpdatesStatusPanel
                  reportId={id}
                  compact
                  title="这份报告的后续更新"
                  description="查看后续内容更新、月度提醒和订阅状态，方便你持续复访。"
                  initialAuthenticated={updatesPanelInitialAuthenticated}
                  initialSummary={updatesPanelInitialSummary}
                  ctaStrategyKey={sourceCtaStrategy.strategyKey}
                  sourceFamily={sourceCtaStrategy.sourceFamily}
                />
              ) : null}

              {/* 侧栏只放轻量元信息；事件回填已迁到正文⑤，避免 260px 窄栏竖排 */}
              {stateVectorCards.length > 0 && (
                <div className="fb-card p-4">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-[#3b5998]" />
                    <div className="text-[14px] font-bold text-[color:var(--ink-1)]">天时地利人和</div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {stateVectorCards.map((item) => (
                      <div key={item.label} className="rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-1.5 py-2 text-center">
                        <div className="text-[10px] text-[color:var(--ink-4)] tracking-[0.08em]">{item.label}</div>
                        <div className="mt-1 text-[16px] font-bold tabular-nums text-[#3b5998]">{item.value.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                  {referenceAuthority ? (
                    <div className="mt-3 rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-[3px] bg-[color:var(--paper)] px-2 py-0.5 text-xs font-semibold text-[#3b5998]">
                          {`权威度 ${referenceAuthority.authorityScore}`}
                        </span>
                        <span className="rounded-[3px] bg-[color:var(--paper)] px-2 py-0.5 text-xs font-semibold text-[color:var(--ink-4)]">
                          {`来源 ${referenceAuthority.sourceCount}`}
                        </span>
                      </div>
                      {referenceLeadDirective ? (
                        <div className="mt-2 text-[11px] leading-[1.5] text-[color:var(--ink-1)] break-words">{referenceLeadDirective}</div>
                      ) : null}
                    </div>
                  ) : null}
                  <a
                    href={isClassicOnly ? '#event-samples' : '#pro-calibration'}
                    className="mt-3 flex h-9 items-center justify-center rounded-[3px] border border-[color:var(--hairline)] bg-white text-[12px] font-semibold text-[#3b5998] hover:bg-[#e9ebee]"
                  >
                    {isClassicOnly ? '去样本回填' : '去校准互动'}
                  </a>
                </div>
              )}
            </ReportMetaSidebar>
          </div>
        </ReportSurface>
      </main>

      <SiteFooter />
    </div>
  );
}

// 骨架组件
function ReportSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="h-64 bg-[color:var(--bg-sunken)] rounded-[var(--radius)] animate-pulse"></div>
      <div className="h-96 bg-[color:var(--bg-sunken)] rounded-[var(--radius)] animate-pulse"></div>
      <div className="h-96 bg-[color:var(--bg-sunken)] rounded-[var(--radius)] animate-pulse"></div>
      <div className="h-96 bg-[color:var(--bg-sunken)] rounded-[var(--radius)] animate-pulse"></div>
      <div className="h-96 bg-[color:var(--bg-sunken)] rounded-[var(--radius)] animate-pulse"></div>
    </div>
  );
}

function GuideSkeleton() {
  return (
    <div className="h-64 bg-[color:var(--bg-sunken)] rounded-[var(--radius)] animate-pulse"></div>
  );
}

function readReferenceIntelligence(contextSignals: unknown) {
  const record = (contextSignals || {}) as {
    referenceIntelligence?: {
      pack?: ReferenceIntelligencePack;
      overlay?: Record<string, unknown>;
    };
  };

  return record.referenceIntelligence;
}
