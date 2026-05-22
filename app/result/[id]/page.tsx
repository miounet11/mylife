// 结构判断结果页面
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import NextDynamic from 'next/dynamic';
import { Suspense } from 'react';
import {
  Compass,
  Layers,
  Activity,
  CalendarDays,
  Target,
  CheckCircle2,
  LineChart,
  ScrollText,
  Bell,
  Footprints,
  Wrench,
  BookOpen,
} from 'lucide-react';

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
import SiteHeader from '@/components/site-header';
import ResultPublicControls from '@/components/result-public-controls';
import PublicReportInteractionPanel from '@/components/public-report-interaction-panel';
import ReportEnginePanel from '@/components/report-engine-panel';
import ReportPremiumServices from '@/components/report-premium-services';
import ReportSubscriptionPanel from '@/components/report-subscription-panel';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
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
  ReadingPathPlanner,
  ReportHighlightsGrid,
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
import ReportNextActions from '@/components/report/report-next-actions';
import ReportReadingPath from '@/components/report/report-reading-path';
import ReportTimingTabs from '@/components/report/report-timing-tabs';
import ReportContinueExplorationNav from '@/components/report/report-continue-exploration-nav';
import ReportAnchorRail, { type ReportAnchorRailItem } from '@/components/report/report-anchor-rail';
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
import { buildStateVectorData } from '@/lib/state-vector';
import { ENGINE_BUILD_VERSIONS } from '@/lib/report-pipeline';
import { deriveReportReasoningMode } from '@/lib/report-reasoning-mode';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import { createLineageEntry } from '@/lib/report-version-lineage';
import { buildPremiumServiceOffers, pickPrimaryPremiumOffer } from '@/lib/report-premium-services';
import { buildJourneyForReport } from '@/lib/surface-journeys';
import { buildReportStageLadder, describeReportDeliveryStage } from '@/lib/report-quality';
import { getCurrentLocalMonthKey, parseLocalDate } from '@/lib/utils';
import { buildChatHref, buildReportChatSource, buildReportFollowupQuestion, buildReportFollowupSuggestions } from '@/lib/chat-entry';
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
  const shouldShowFullReport = resolvedSearchParams.view === 'full';
  if (!shouldShowFullReport) {
    const query = entrySource ? `?source=${encodeURIComponent(entrySource)}` : '';
    redirect(`/r/${encodeURIComponent(id)}${query}`);
  }
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
  const favoredElements = [...(result.advice?.yongShen || []), ...(result.advice?.xiShen || [])].slice(0, 3);
  const decisionEvidence = [
    result.pattern?.type
      ? `结构主轴：当前以 ${result.pattern.type} 为主判断。`
      : '',
    result.fortune?.currentDaYun
      ? `阶段位置：当前行运落在 ${result.fortune.currentDaYun}。`
      : '',
    favoredElements.length > 0
      ? `顺势重点：优先放大 ${favoredElements.join('、')} 对应动作。`
      : result.confidence?.stablePoints?.[0] || '',
  ].filter(Boolean).slice(0, 3);
  const decisionHeadline = compactCopy(
    leadPlaybook?.whyNow
      || currentStageSummary
      || result.confidence?.summary
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
  const reportChatHref = buildChatHref({
    reportId: id,
    question: reportFollowupQuestion,
    source: reportChatSource,
    ctaStrategyKey: sourceCtaStrategy.strategyKey,
    sourceFamily: sourceCtaStrategy.sourceFamily,
  });
  const coreSectionNames = ['总览', '当前阶段', '命局结构', '立即动作', '报告状态', '天时地利人和'];
  const deferredSectionNames = ['可信报告', '专项服务', '订阅更新', '趋势图', '下一步', '延伸内容'];
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

  // v5-D60 FB 2017 timeline 风：左 sticky 锚 rail
  const anchorRailItems: ReportAnchorRailItem[] = [
    { id: 'cockpit', label: '总览与下一步', icon: Compass },
    { id: 'deep-report', label: '深入报告', icon: Layers },
    { id: 'current-state', label: '当前状态', icon: Activity },
    { id: 'trend', label: '趋势与节奏', icon: LineChart },
    { id: 'scenario', label: '场景视图', icon: ScrollText },
    { id: 'action-validation', label: '行动与验证', icon: Target },
    { id: 'past-present-future', label: '过去 · 现在 · 未来', icon: CalendarDays },
    { id: 'validation', label: '可信报告', icon: CheckCircle2 },
    { id: 'subscription', label: '订阅与更新', icon: Bell },
    { id: 'next-step', label: '下一步行动', icon: Footprints },
    { id: 'tool-recommendations', label: '推荐工具', icon: Wrench },
    { id: 'related-content', label: '延伸内容', icon: BookOpen },
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

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <ReportSurface>
          {/* v5-D60 FB 2017 timeline 三栏布局：左 rail / 中阅读流 / 右 meta sidebar */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
            <ReportAnchorRail items={anchorRailItems} title="这份报告" />

            <div className="min-w-0 flex-1 lg:max-w-[680px] space-y-2">
              {/* Sub-Spec B1 软入口：让用户发现新版"未来时间地图" */}
              <Link
                href={`/r/${id}`}
                className="fb-card block p-3 transition hover:border-[#3b5998]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3b5998] mb-1">
                      新版 · 时间地图
                    </div>
                    <div className="text-[14px] text-[color:var(--ink-1)] leading-[1.34]">
                      看你未来 30 天 / 12 个月 / 5 年的命理时点 →
                    </div>
                  </div>
                  <span className="text-[#3b5998] font-bold text-lg">→</span>
                </div>
              </Link>

              <div className="fb-card overflow-hidden">
                <ReportCover
                  userName={publicName}
                  birthIso={canManage && result.basic && (result.basic as any).birthDate
                    ? `${(result.basic as any).birthDate}${
                        (result.basic as any).birthTime ? ' ' + (result.basic as any).birthTime : ''
                      }`
                    : undefined}
                  birthLocation={canManage ? (result.basic as any)?.birthPlace || undefined : undefined}
                  pillarSummary={
                    result.basic && (result.basic as any).year && (result.basic as any).month
                      ? `${(result.basic as any).year} ${(result.basic as any).month} ${(result.basic as any).day} ${(result.basic as any).hour}`
                      : undefined
                  }
                  qualityTier={deliveryTierLabel}
                />
              </div>

              <section id="cockpit" className="fb-card scroll-mt-24 border-t-2 border-t-[#3b5998] p-4 md:p-5">
                <div className="fb-section-title text-[16px] font-bold text-[color:var(--ink-1)]">
                  个人结构总览
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-[color:var(--ink-4)]">
                  {isEnhancementPending ? (
                    <span className="rounded-[3px] bg-[color:var(--signal-soft)] px-2 py-0.5 text-[color:var(--signal-strong)]">
                      内容补全中
                    </span>
                  ) : null}
                  <span>
                    {`${result.llmUsed ? '内容已完善' : '基础可读版'} · ${deliveryTierLabel}`}
                  </span>
                </div>

                <h1 className="mt-3 max-w-4xl text-[22px] md:text-[26px] font-bold leading-[1.34] text-[color:var(--ink-1)]">
                  {reportV4Sections.cockpit.headline || `${publicName}当前最重要的，`}
                </h1>

                <div className="mt-4">
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

                {/* v5-A3 (2026-05-08) basic 报告仍在补强时，明确告诉用户 */}
                {isEnhancementPending ? (
                  <div className="mt-4">
                    <DegradeNotice
                      pending={isEnhancementPending}
                      lastError={upgradeJob?.lastError}
                      reportId={id}
                    />
                  </div>
                ) : null}

                <div className="mt-4">
                  <ReportReadingPath
                    route={layeredReportJourney}
                    reportId={id}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                  />
                </div>

                <div className="mt-4">
                  <ReportNextActions
                    reportId={id}
                    chatHref={reportChatHref}
                    eventsHref={`/events?reportId=${encodeURIComponent(id)}`}
                    deepReportHref={layeredReportJourney.primaryAction.href}
                    toolHref={primaryToolRoute?.href}
                    actionSuggestionCount={result.actionSuggestions?.length || 0}
                    pastEventTemplateCount={result.analysis?.pastEventTemplates?.length || 0}
                    followupQuestion={reportFollowupQuestion}
                    title={entrySource ? `先接住“${sourceContext.shortLabel}”带回来的这次回访` : undefined}
                    description={entrySource ? sourceContext.reportDescription : undefined}
                    deepReportLabel={layeredReportJourney.primaryAction.label}
                    toolLabel={primaryToolRoute ? `进入${primaryToolRoute.categoryLabel}` : undefined}
                    chatLabel={sourceCtaStrategy.reportPrimaryLabel}
                    eventLabel={sourceCtaStrategy.reportEventLabel}
                    pastEventLabel={sourceCtaStrategy.reportPastEventLabel}
                    ctaStrategyKey={sourceCtaStrategy.strategyKey}
                    sourceFamily={sourceCtaStrategy.sourceFamily}
                  />
                </div>

                {/* v5-D38 时间地图 Tab：30d / 12m / 5y 一键切换 */}
                {timingRecord ? (
                  <div className="mt-4">
                    <ReportTimingTabs record={timingRecord} />
                  </div>
                ) : null}
              </section>

              <section id="deep-report" className="fb-card scroll-mt-24 border-t-2 border-t-[#3b5998] p-4 md:p-5">
                <header>
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="fb-section-title text-[16px] font-bold text-[color:var(--ink-1)]">深入报告</div>
                      <p className="mt-1 text-[13px] leading-[1.5] text-[color:var(--ink-4)]">
                        首屏总览和三步动作之后，下面是完整命理细节。
                      </p>
                    </div>
                  </div>
                </header>

                <div id="trend" className="mt-4 grid gap-3 scroll-mt-24 xl:grid-cols-[1.08fr_0.92fr]">
                  <LifeKLineSummaryCard
                    section={reportV4Sections.lifeKLine}
                    klineData={result.klineData}
                  />
                  <ReportRhythmTimeline section={reportV4Sections.timeline12Months} />
                </div>

                <div id="overview" className="mt-3">
                  <ReportBlueprintCards section={reportV4Sections.coreBlueprint} />
                </div>

                <div id="current-state" className="mt-3 scroll-mt-24">
                  <ReportCurrentState section={reportV4Sections.currentOperatingSystem} />
                </div>

                <div id="scenario" className="mt-3 scroll-mt-24">
                  <ReportScenarioPanels section={reportV4Sections.scenarioPanels} />
                </div>

                <div id="action-validation" className="mt-3 grid gap-3 scroll-mt-24 xl:grid-cols-2">
                  <ReportActionBoard section={reportV4Sections.actionBoard} />
                  <ReportValidationPanel section={reportV4Sections.validationLayer} />
                </div>

                {/* v5-D1: 主报告读完后的专项服务 teaser */}
                {primaryPremiumOffer ? (
                  <div className="mt-4">
                    <PremiumTeaser
                      reportId={id}
                      offer={primaryPremiumOffer}
                      anchorHref="#premium"
                      ctaStrategyKey={sourceCtaStrategy.strategyKey}
                      sourceFamily={sourceCtaStrategy.sourceFamily}
                    />
                  </div>
                ) : null}

                <div id="past-present-future" className="mt-3 scroll-mt-24">
                  <PastPresentFutureRow
                    past={pastValidationBlock}
                    present={presentDiagnosisBlock}
                    future={futureGuidanceBlock}
                  />
                </div>

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

                {canManage ? (
                  <ValidationFeedbackHero
                    toneClass={feedbackHeroTone}
                    label={feedbackHeroLabel}
                    validationInsights={validationInsights}
                    correctionInsight={correctionInsight}
                  />
                ) : null}

                <ReportHighlightsGrid items={reportHighlights} />

                <ReadingPathPlanner
                  coreSectionNames={coreSectionNames}
                  deferredSectionNames={deferredSectionNames}
                />
              </section>

              {/* v5-D38 继续探索导航 */}
              <div>
                <ReportContinueExplorationNav reportId={id} />
              </div>

              <ProductSurfaceRolePanel
                surface="result"
                title="结果页先解决阅读顺序，再进入深入判断"
                description="这一页不把所有命理内容一次性摊开，而是先让用户看懂主判断和下一步动作，再按追问、工具、事件验证逐层深入。"
                compact
              />

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

              <ResultDeferredSection
                id="validation"
                title="可信报告与验证"
                description="把这份报告放回真实事件中持续验证，帮助你区分哪些判断已经落地，哪些还需要校正。"
                delayMs={0}
              >
                <Suspense fallback={<ReportSkeleton />}>
                  <TrustReport result={{ ...result, validationInsights, correctionInsight }} />
                </Suspense>
              </ResultDeferredSection>

              <ResultDeferredSection
                id="premium"
                title="专项服务"
                description="当主报告已经指出方向，这里承接更聚焦的专项判断和深度服务需求。"
                delayMs={180}
              >
                <div className="scroll-mt-24">
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
              </ResultDeferredSection>

              <ResultDeferredSection
                id="subscription"
                title="订阅与更新"
                description="把后续月度提醒、内容更新和邮件留存接回这份主报告，方便你持续复访。"
                delayMs={320}
              >
                <div className="scroll-mt-24">
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
              </ResultDeferredSection>

              <ResultDeferredSection
                id="next-step"
                title="下一步行动"
                description="把这份报告转成接下来最值得执行、验证和复盘的几个动作，而不是停在阅读层。"
                delayMs={620}
              >
                <div className="scroll-mt-24">
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
                </div>
              </ResultDeferredSection>

              <SurfaceJourneyPanel
                journey={reportJourney}
                title={reportJourneyCopy.title}
                description={reportJourneyCopy.description}
                badge={entrySource ? `${sourceContext.guidanceLabel} · 来源已保留` : undefined}
              />

              <div id="tool-recommendations" className="scroll-mt-24">
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

              <div id="related-content" className="scroll-mt-24">
                <ResultDeferredSection
                  title="延伸内容"
                  description="把相关知识、案例和后续阅读接到这份报告后面，方便你继续补全判断上下文。"
                  delayMs={760}
                >
                  <RelatedContent source={entrySource || `result_report:${id}`} />
                </ResultDeferredSection>
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
                consistencyScore={result.verify?.consistencyScore}
                verifyVerdict={result.verify?.verdict}
                qualityAudit={result.qualityAudit}
                upgradeJob={result.upgradeJob}
                generatedFrom={result.generatedFrom}
                engineBuilds={result.engineBuilds || ENGINE_BUILD_VERSIONS}
                enhancementNotes={canManage ? (result.enhancementNotes || []) : []}
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

              {stateVectorCards.length > 0 && (
                <div className="fb-card p-4">
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-[#3b5998]" />
                    <div className="text-[14px] font-bold text-[color:var(--ink-1)]">天时地利人和</div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {stateVectorCards.map((item) => (
                      <div key={item.label} className="rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-2 py-2 text-center">
                        <div className="text-[11px] text-[color:var(--ink-4)] tracking-[0.14em]">{item.label}</div>
                        <div className="mt-1 text-[18px] font-bold text-[#3b5998]">{item.value.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                  {referenceAuthority ? (
                    <div className="mt-3 rounded-[3px] border border-[color:var(--hairline)] bg-[#f6f7f9] px-3 py-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-[3px] bg-[color:var(--paper)] px-2 py-0.5 text-[11px] font-semibold text-[#3b5998]">
                          {`参考权威度 ${referenceAuthority.authorityScore}`}
                        </span>
                        <span className="rounded-[3px] bg-[color:var(--paper)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--ink-4)]">
                          {`来源 ${referenceAuthority.sourceCount}`}
                        </span>
                        <span className="rounded-[3px] bg-[color:var(--paper)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--ink-4)]">
                          {`经典 ${referenceAuthority.classicBookCount}`}
                        </span>
                      </div>
                      {referenceLeadDirective ? (
                        <div className="mt-2 text-[12px] leading-[1.5] text-[color:var(--ink-1)]">{referenceLeadDirective}</div>
                      ) : null}
                      {referenceSignals.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {referenceSignals.map((signal) => (
                            <span key={signal} className="rounded-[3px] bg-[color:var(--paper)] px-2 py-0.5 text-[11px] text-[color:var(--ink-2)]">
                              {signal}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}

              <ReportEventCapture
                reportId={id}
                suggestions={result.actionSuggestions || []}
                pastEventTemplates={result.analysis?.pastEventTemplates || []}
                ctaStrategyKey={sourceCtaStrategy.strategyKey}
                sourceFamily={sourceCtaStrategy.sourceFamily}
              />
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
