// 结构判断结果页面
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { notFound } from 'next/navigation';
import NextDynamic from 'next/dynamic';
import { Suspense } from 'react';
import {
  CalendarClock,
  Compass,
} from 'lucide-react';

// 动态导入以减少首屏加载
const TrustReport = NextDynamic(() => import('@/components/trust-report'), {
  loading: () => <ReportSkeleton />,
});

const FortuneChart = NextDynamic(() => import('@/components/fortune-kline-chart'), {
  loading: () => <ChartSkeleton />,
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
import ReportBlueprintCards from '@/components/report/report-blueprint-cards';
import ReportCurrentState from '@/components/report/report-current-state';
import ReportRhythmTimeline from '@/components/report/report-rhythm-timeline';
import ReportScenarioPanels from '@/components/report/report-scenario-panels';
import ReportActionBoard from '@/components/report/report-action-board';
import ReportValidationPanel from '@/components/report/report-validation-panel';
import ReportNextActions from '@/components/report/report-next-actions';
import ReportReadingPath from '@/components/report/report-reading-path';
import { getCurrentUserId } from '@/lib/user-utils';
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
import { CURRENT_REPORT_VERSION, ENGINE_BUILD_VERSIONS } from '@/lib/report-pipeline';
import { deriveReportReasoningMode, getReasoningModeLabel, type ReportReasoningMode } from '@/lib/report-reasoning-mode';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import { createLineageEntry } from '@/lib/report-version-lineage';
import { buildPremiumServiceOffers } from '@/lib/report-premium-services';
import { buildJourneyForReport } from '@/lib/surface-journeys';
import { buildReportStageLadder, describeReportDeliveryStage } from '@/lib/report-quality';
import { getCurrentLocalMonthKey, parseLocalDate } from '@/lib/utils';
import { buildChatHref, buildReportFollowupQuestion } from '@/lib/chat-entry';
import { buildSourceCtaStrategy, buildSourceJourneyCopy, getSourceContext } from '@/lib/source-context';
import { buildLayeredReportJourney } from '@/lib/report-journey-router';
import type { ReferenceIntelligencePack } from '@/lib/reference-intelligence';

function getPublicDisplayName(name?: string | null) {
  const cleaned = `${name || ''}`.trim();
  if (!cleaned) return '某位用户';
  if (cleaned.length === 1) return `${cleaned}**`;
  return `${cleaned.slice(0, 1)}**`;
}

function compactCopy(value?: string | null, maxLength = 92) {
  const normalized = `${value || ''}`.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function getLifeKLineMetricToneClasses(tone?: 'strong' | 'steady' | 'watch') {
  if (tone === 'strong') {
    return {
      card: 'border-emerald-200 bg-emerald-50/70',
      label: 'text-emerald-700',
      value: 'text-emerald-900',
    };
  }
  if (tone === 'watch') {
    return {
      card: 'border-amber-200 bg-amber-50/75',
      label: 'text-amber-800',
      value: 'text-amber-950',
    };
  }
  return {
    card: 'border-sky-200 bg-sky-50/70',
    label: 'text-sky-700',
    value: 'text-sky-900',
  };
}

function buildPastValidationBlock(params: {
  structuredBlock?: {
    headline?: string;
    evidence?: string[];
  };
  validationInsights: {
    totalLinkedEvents?: number;
    accurateCount?: number;
    driftCount?: number;
    pendingCount?: number;
  };
  linkedEvents: Array<{
    title?: string;
    userFeedback?: { wasAccurate?: boolean; userNotes?: string } | undefined;
    fortuneAnalysis?: { reason?: string } | undefined;
  }>;
}) {
  if (params.structuredBlock?.headline || (params.structuredBlock?.evidence || []).length > 0) {
    return {
      eyebrow: (params.validationInsights.totalLinkedEvents || 0) > 0 ? '已发生的印证' : '先建立印证样本',
      headline: compactCopy(
        params.structuredBlock?.headline || '你过去的人生里，已经反复出现过与这份命理结构一致的信号。'
      ),
      evidence: (params.structuredBlock?.evidence || []).filter(Boolean).slice(0, 3),
    };
  }

  const accurateEvents = params.linkedEvents.filter((event) => event.userFeedback?.wasAccurate === true).slice(0, 2);
  const driftEvents = params.linkedEvents.filter((event) => event.userFeedback?.wasAccurate === false).slice(0, 1);
  const accurateCount = params.validationInsights.accurateCount || 0;
  const driftCount = params.validationInsights.driftCount || 0;
  const pendingCount = params.validationInsights.pendingCount || 0;
  const totalLinkedEvents = params.validationInsights.totalLinkedEvents || 0;

  let headline = '你的人生主线已经开始在现实里显形，只是还需要继续补样本。';
  if (accurateCount >= 2) {
    headline = `这份命理判断已经被 ${accurateCount} 个真实事件印证，不是空泛结论。`;
  } else if (accurateCount === 1) {
    headline = '这份命理判断已经出现首个现实印证，说明主线方向是对的。';
  } else if (driftCount > 0) {
    headline = '现实反馈显示这份判断并非全错，真正要修的是时机和动作，不是推翻整体结构。';
  }

  const evidence = [
    ...accurateEvents.map((event) => compactCopy(
      `${event.title || '已记录事件'}：${event.userFeedback?.userNotes || event.fortuneAnalysis?.reason || '这类节点已经和报告判断形成对应。'}`
    )),
    ...driftEvents.map((event) => compactCopy(
      `${event.title || '偏差事件'}：当前出现偏差，更像时机或执行跑偏，适合回看当时动作与节奏。`
    )),
    totalLinkedEvents === 0
      ? '现在还没有足够的现实样本，后面一旦遇到转岗、合作、感情推进、搬迁、健康波动等节点，应立即记录。'
      : `当前共关联 ${totalLinkedEvents} 个事件，其中待继续观察 ${pendingCount} 个。`,
  ].filter(Boolean).slice(0, 3) as string[];

  return {
    eyebrow: totalLinkedEvents > 0 ? '已发生的印证' : '先建立印证样本',
    headline,
    evidence,
  };
}

function buildPresentDiagnosisBlock(params: {
  structuredBlock?: {
    headline?: string;
    evidence?: string[];
  };
  currentStageSummary: string;
  decisionHeadline: string;
  patternType?: string;
  currentDaYun?: string;
  favoredElements: string[];
  stateVectorCards: Array<{ label: string; value: number }>;
}) {
  if (params.structuredBlock?.headline || (params.structuredBlock?.evidence || []).length > 0) {
    return {
      eyebrow: '你现在所处的位置',
      headline: compactCopy(
        params.structuredBlock?.headline || params.decisionHeadline || params.currentStageSummary
      ),
      evidence: (params.structuredBlock?.evidence || []).filter(Boolean).slice(0, 3),
    };
  }

  const strongestVector = [...params.stateVectorCards].sort((left, right) => right.value - left.value)[0];
  const weakestVector = [...params.stateVectorCards].sort((left, right) => left.value - right.value)[0];
  const evidence = [
    params.patternType ? `命局主轴：你当前按 ${params.patternType} 结构来判断，不能脱离这个骨架。` : '',
    params.currentDaYun ? `阶段位置：现在正落在 ${params.currentDaYun} 这一步运，重点是认清这一步到底要你收、要你守，还是要你推。` : '',
    params.favoredElements.length > 0 ? `顺势方向：现阶段优先放大 ${params.favoredElements.join('、')} 对应的动作和环境。` : '',
    strongestVector && weakestVector
      ? `现实侧重点：${strongestVector.label}相对占优，${weakestVector.label}更容易拖后腿，决策时不要平均用力。`
      : '',
  ].filter(Boolean).slice(0, 3);

  return {
    eyebrow: '你现在所处的位置',
    headline: compactCopy(
      params.decisionHeadline || params.currentStageSummary || '你现在最重要的，不是继续求更多答案，而是认清当前阶段真正的主轴。'
    ),
    evidence,
  };
}

function buildFutureGuidanceBlock(params: {
  structuredBlock?: {
    headline?: string;
    evidence?: string[];
  };
  decisionNowAction: string;
  decisionAvoidAction: string;
  nextFocusSummary: string;
  leadWindow?: { label: string; theme?: string } | null;
  topMonthlyWindows: Array<{ label: string; theme?: string; status?: string }>;
}) {
  if (params.structuredBlock?.headline || (params.structuredBlock?.evidence || []).length > 0) {
    return {
      eyebrow: '接下来会怎么走',
      headline: compactCopy(
        params.structuredBlock?.headline || '接下来不要分散出击，先把当前阶段最该落地的动作做出来。'
      ),
      evidence: (params.structuredBlock?.evidence || []).filter(Boolean).slice(0, 4),
    };
  }

  const leadWindowLabel = params.leadWindow
    ? `${params.leadWindow.label}${params.leadWindow.theme ? ` · ${params.leadWindow.theme}` : ''}`
    : '';
  const evidence = [
    leadWindowLabel ? `最近优先窗口：${leadWindowLabel}。这不是让你同时做很多事，而是要求你在窗口内把关键动作做准。` : '',
    params.decisionNowAction ? `现在就做：${params.decisionNowAction}` : '',
    params.decisionAvoidAction ? `明确避开：${params.decisionAvoidAction}` : '',
    params.topMonthlyWindows.length > 1
      ? `后续观察顺序：${params.topMonthlyWindows.map((item) => item.label).join('、')}。`
      : params.nextFocusSummary,
  ].filter(Boolean).slice(0, 4);

  return {
    eyebrow: '接下来会怎么走',
    headline: compactCopy(
      leadWindowLabel
        ? `接下来最容易起变化的是 ${leadWindowLabel} 这段，你要做的是顺势推进，而不是逆势硬顶。`
        : '接下来不要分散出击，先把当前阶段最该落地的动作做出来。'
    ),
    evidence,
  };
}

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

function inferWorldYiGuidedPaths(signalText: string) {
  const lowered = signalText.toLowerCase();
  const domainCandidates = [
    {
      key: 'career',
      href: '/world-yi/domains/career',
      title: '进入事业分科',
      description: '把岗位、角色密度、推进节奏和组织压力重新排清。',
      matches: ['事业', '工作', '职业', '升职', '岗位', '团队', '老板', 'career', 'job', 'promotion'],
    },
    {
      key: 'wealth',
      href: '/world-yi/domains/wealth',
      title: '进入财富分科',
      description: '把赚钱、守财、现金流和扩张时机拆开看。',
      matches: ['财富', '赚钱', '收入', '现金流', '理财', '财务', '投资', 'wealth', 'money', 'cash'],
    },
    {
      key: 'relationship',
      href: '/world-yi/domains/relationship',
      title: '进入关系分科',
      description: '把关系从合不合，拉回边界、节奏和环境压力。',
      matches: ['关系', '感情', '婚姻', '伴侣', '恋爱', '复合', 'relationship', 'marriage', 'partner'],
    },
    {
      key: 'health',
      href: '/world-yi/domains/health',
      title: '进入健康分科',
      description: '先看恢复秩序、透支循环和环境密度，再谈推进。',
      matches: ['健康', '身体', '恢复', '焦虑', '睡眠', '压力', 'health', 'stress', 'recovery'],
    },
    {
      key: 'family',
      href: '/world-yi/domains/family',
      title: '进入家庭分科',
      description: '处理责任排序、代际压力和家庭恢复位。',
      matches: ['家庭', '父母', '孩子', '照护', '代际', 'family', 'parent', 'child'],
    },
    {
      key: 'migration',
      href: '/world-yi/domains/migration',
      title: '进入迁移分科',
      description: '把留回、城市、身份成本和环境匹配一起看。',
      matches: ['迁移', '移民', '出国', '回国', '城市', '海外', 'migration', 'overseas', 'relocation'],
    },
  ] as const;
  const matchedDomain = domainCandidates.find((candidate) => candidate.matches.some((keyword) => lowered.includes(keyword)));

  return [
    {
      href: '/knowledge/world-yi-methodology',
      title: '先回方法论',
      description: '如果你想知道这份结果为什么这样排，先看结构、阶段、环境、动作的判断总法。',
    },
    matchedDomain
      ? {
          href: matchedDomain.href,
          title: matchedDomain.title,
          description: matchedDomain.description,
        }
      : {
          href: '/world-yi/domains',
          title: '进入人生六域',
          description: '把当前问题挂回事业、财富、关系、健康、家庭、迁移六条主线里继续读。',
        },
    lowered.includes('海外') || lowered.includes('出国') || lowered.includes('移民') || lowered.includes('跨境') || lowered.includes('global') || lowered.includes('overseas')
      ? {
          href: '/world-yi/global',
          title: '进入全球华人层',
          description: '当前问题涉及身份、迁移、跨文化或双边生活时，直接切到全球判断层。',
        }
      : {
          href: '/world-yi/network',
          title: '查看专题地图',
          description: '从总入口切进六域、应用、全球与英文路径，看到这份报告在母系统中的位置。',
        },
    lowered.includes('名字') || lowered.includes('起名') || lowered.includes('家宅') || lowered.includes('择时') || lowered.includes('寻物')
      ? {
          href: '/world-yi/applications',
          title: '进入生活应用层',
          description: '当前问题更接近日常应用，就继续下钻到起名、择时、家宅和寻物路径。',
        }
      : {
          href: '/world-yi/book',
          title: '看世界易主书',
          description: '如果你要理解世界易的母体系，就从十卷主书工程继续展开。',
        },
  ];
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  try {
    const fortuneData = fortuneOperations.getById(id);
    if (fortuneData) {
      const publicName = getPublicDisplayName(fortuneData.name);
      const isPublic = fortuneData.isPublic !== false;
      return {
        title: `${publicName}的结构判断报告 | 人生K线`,
        description: `${publicName}的结构判断报告，基于真太阳时修正与结构化解读，默认私密，可按需创建分享页。`,
        alternates: {
          canonical: `https://www.life-kline.com/result/${id}`,
        },
        robots: {
          index: isPublic,
          follow: isPublic,
        },
        openGraph: {
          url: `https://www.life-kline.com/result/${id}`,
          title: `${publicName}的结构判断 | 人生K线`,
          description: '结构化判断结果页，展示结构、趋势与建议，可按需分享。',
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

async function getResult(reportId: string) {
  try {
    const fortuneData = fortuneOperations.getById(reportId);
    if (!fortuneData) return null;
    const analysis = (fortuneData.analysis ?? {
      opening: '当前结构、阶段与节奏已经开始显形。',
      explanation: '当前结果已由结构化引擎生成，可先查看场景视图、月度窗口和行动建议，再继续进入 AI 深问。',
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
  const result = await getResult(id);
  const currentUserId = await getCurrentUserId();

  if (!result) {
    notFound();
  }

  const canManage = !!currentUserId && result.basic.userId === currentUserId;
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
  const reasoningModeLabel = getReasoningModeLabel(result.reasoningMode || 'engine');
  if (result.isPublic === false && !canManage) {
    notFound();
  }
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
    ? '后台增强进行中'
    : upgradeJob?.status === 'retry' || upgradeJob?.status === 'pending'
    ? '后台排队增强中'
    : upgradeJob?.status === 'completed'
    ? '后台增强已完成'
    : upgradeJob?.status === 'failed'
    ? '后台增强已暂停'
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
  const reportChatSource = entrySource.startsWith('lifecycle_report_followup')
    ? entrySource
    : entrySource
      ? `result_report_followup:${entrySource}`
      : 'result_report_followup';
  const reportChatHref = buildChatHref({
    reportId: id,
    question: reportFollowupQuestion,
    source: reportChatSource,
    ctaStrategyKey: sourceCtaStrategy.strategyKey,
    sourceFamily: sourceCtaStrategy.sourceFamily,
  });
  const coreSectionNames = ['总览', '当前阶段', '命局结构', '立即动作', '引擎状态', '天时地利人和'];
  const deferredSectionNames = ['可信报告', '专项服务', '订阅更新', '趋势图', '下一步', '延伸内容'];
  const isEnhancementPending = !result.llmUsed && !!upgradeJob?.status && ['pending', 'running', 'retry'].includes(upgradeJob.status);
  const enhancementStatusMessage = isEnhancementPending
    ? upgradeJob?.lastError === 'LLM_UNAVAILABLE'
      ? '当前先显示稳定可读版。后台已经在持续尝试深度增强，但上游模型今天波动较大，增强版会在成功后自动补齐。'
      : '当前先显示稳定可读版。后台增强任务仍在继续，不需要反复刷新页面。'
    : !result.llmUsed
    ? '当前这份结果以结构化引擎和专家层整合输出为主，适合先看结论、阶段和行动建议。'
    : '当前已经拿到深度增强版，可直接按完整路径阅读。';
  const feedbackLevel = correctionInsight.level || 'healthy';
  const feedbackHeroTone = feedbackLevel === 'action'
    ? 'bg-rose-50 text-rose-700 border-rose-200'
    : feedbackLevel === 'watch'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';
  const feedbackHeroLabel = feedbackLevel === 'action'
    ? '需要纠偏'
    : feedbackLevel === 'watch'
      ? '持续观察'
      : '反馈稳定';
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${publicName}的结构判断报告`,
    description: `AI驱动的结构判断公开结果页。此为${publicName}的公开报告。`,
    mainEntityOfPage: `https://www.life-kline.com/result/${id}`,
    author: {
      '@type': 'Organization',
      name: '人生K线',
      url: 'https://www.life-kline.com'
    }
  };
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

      <main className="page-frame py-8 pb-16 md:py-12 md:pb-20">
        <section className="mb-10 grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="glass-panel rounded-[1.75rem] p-5 md:p-6">
            <div>
              <div className="section-label">个人结构总览</div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[color:var(--muted)]">
                {isEnhancementPending ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800">
                    深度增强补强中
                  </span>
                ) : null}
                <span>
                  {`${result.llmUsed ? 'LLM 深度增强' : '结构化整合输出'} · ${reasoningModeLabel} · 报告 ${result.reportVersion || 'v1'} · ${deliveryTierLabel}`}
                </span>
              </div>

              <h1 className="mt-4 max-w-4xl text-3xl font-black leading-tight text-[color:var(--ink)] md:text-4xl">
                {reportV4Sections.cockpit.headline || `${publicName}当前最重要的，`}
              </h1>

              <div className="mt-6">
                <ReportCockpit
                  section={reportV4Sections.cockpit}
                  reportId={id}
                  chatHref={reportChatHref}
                  eventsHref={`/events?reportId=${encodeURIComponent(id)}`}
                  guidedPaths={worldYiGuidedPaths.slice(0, 3)}
                  followupQuestion={reportFollowupQuestion}
                  sourceGuidance={entrySource ? sourceContext.reportHeadline : undefined}
                  chatLabel={sourceCtaStrategy.reportSecondaryLabel}
                  eventsLabel={sourceCtaStrategy.reportEventLabel}
                  ctaStrategyKey={sourceCtaStrategy.strategyKey}
                  sourceFamily={sourceCtaStrategy.sourceFamily}
                />
              </div>

              <div className="mt-5">
                <ReportReadingPath
                  route={layeredReportJourney}
                  reportId={id}
                  ctaStrategyKey={sourceCtaStrategy.strategyKey}
                  sourceFamily={sourceCtaStrategy.sourceFamily}
                />
              </div>

              <div className="mt-5">
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


              <details id="deep-report" className="mt-6 rounded-[1.35rem] border border-[color:var(--line)] bg-white/64 p-4 open:bg-white/84">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">深入报告</div>
                      <h2 className="mt-2 text-xl font-black text-[color:var(--ink)] md:text-2xl">展开结构证据、趋势和场景细节</h2>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                        首屏先看总览和三步动作；需要细节时再展开这里，减少单个结果页的信息噪音。
                      </p>
                    </div>
                    <span className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--ink)]">展开深入内容</span>
                  </div>
                </summary>

                <div id="trend" className="mt-6 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
                  <div className="soft-card rounded-[1.35rem] p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">人生长弧线</div>
                        <h3 className="mt-2 text-lg font-bold text-[color:var(--ink)]">
                          {reportV4Sections.lifeKLine.headline || '人生长弧线'}
                        </h3>
                      </div>
                      {reportV4Sections.lifeKLine.arcLabel ? (
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                          {compactCopy(reportV4Sections.lifeKLine.arcLabel, 30)}
                        </div>
                      ) : null}
                    </div>

                    {reportV4Sections.lifeKLine.summary ? (
                      <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                        {compactCopy(reportV4Sections.lifeKLine.summary, 108)}
                      </p>
                    ) : null}

                    {reportV4Sections.lifeKLine.latestMetrics.length > 0 ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {reportV4Sections.lifeKLine.latestMetrics.map((item) => {
                          const toneClasses = getLifeKLineMetricToneClasses(item.tone);

                          return (
                            <div key={item.label} className={`rounded-[1.2rem] border px-4 py-3 ${toneClasses.card}`}>
                              <div className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClasses.label}`}>
                                {item.label}
                              </div>
                              <div className={`mt-2 text-base font-bold ${toneClasses.value}`}>{item.value}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    {result.klineData && result.klineData.length > 0 ? (
                      <div className="mt-4 rounded-[1.15rem] border border-[color:var(--line)] bg-white/84 p-3">
                        <Suspense fallback={<ChartSkeleton />}>
                          <FortuneChart data={result.klineData} height={320} />
                        </Suspense>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                        暂无趋势图数据，先结合节奏板与驾驶舱判断推进。
                      </div>
                    )}
                  </div>
                  <ReportRhythmTimeline section={reportV4Sections.timeline12Months} />
                </div>

              <div id="overview" className="mt-6">
                <ReportBlueprintCards section={reportV4Sections.coreBlueprint} />
              </div>

              <div className="mt-5">
                <ReportCurrentState section={reportV4Sections.currentOperatingSystem} />
              </div>

              <div id="scenario" className="mt-5">
                <ReportScenarioPanels section={reportV4Sections.scenarioPanels} />
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <ReportActionBoard section={reportV4Sections.actionBoard} />
                <ReportValidationPanel section={reportV4Sections.validationLayer} />
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                {[
                  pastValidationBlock,
                  presentDiagnosisBlock,
                  futureGuidanceBlock,
                  ].map((section, index) => (
                    <div
                      key={section.eyebrow}
                    className={`rounded-[1.25rem] border px-5 py-5 ${
                      index === 0
                        ? 'border-emerald-200 bg-emerald-50/70'
                        : index === 1
                        ? 'border-[color:var(--line)] bg-white/82'
                        : 'border-amber-200 bg-amber-50/75'
                    }`}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--muted)]">
                      {section.eyebrow}
                    </div>
                    <div className="mt-3 text-base font-bold leading-7 text-[color:var(--ink)]">
                      {section.headline}
                    </div>
                    <div className="mt-4 grid gap-3">
                      {section.evidence.map((item) => (
                        <div key={item} className="rounded-2xl bg-white/88 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className={`mt-5 rounded-[1.25rem] border px-4 py-4 ${
                isEnhancementPending
                  ? 'border-amber-200 bg-amber-50/80'
                  : result.llmUsed
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : 'border-[color:var(--line)] bg-white/75'
              }`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    isEnhancementPending
                      ? 'bg-white text-amber-800'
                      : result.llmUsed
                      ? 'bg-white text-emerald-700'
                      : 'bg-slate-100 text-[color:var(--muted)]'
                  }`}>
                    {qualityAudit
                      ? `质量 ${qualityAudit.overallScore || '--'} / ${qualityAudit.grade || 'B'}`
                      : isEnhancementPending
                      ? '稳定版已可阅读'
                      : result.llmUsed
                      ? '深度版已送达'
                      : '当前为稳定可读版'}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                    {`当前阶段 ${currentStageLadderItem.shortLabel}`}
                  </span>
                  {qualityAudit?.targetAchieved ? (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      已达到 S级目标
                    </span>
                  ) : null}
                  {upgradeStatusLabel ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                      {upgradeStatusLabel}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">
                  {qualityAudit?.summary || enhancementStatusMessage}
                </div>
                <div className="mt-4 rounded-[1.1rem] border border-white/70 bg-white/78 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">报告升级路径</div>
                      <div className="mt-2 text-sm font-semibold text-[color:var(--ink)]">
                        {`你现在拿到的是${currentStageLadderItem.label}。`}
                      </div>
                    </div>
                    {nextStageLadderItem ? (
                      <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                        {`下一阶段 ${nextStageLadderItem.shortLabel}`}
                      </div>
                    ) : (
                      <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        已到当前最高阶段
                      </div>
                    )}
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {reportStageLadder.map((item) => (
                      <div
                        key={item.key}
                        data-stage-key={item.key}
                        className={`rounded-[1.1rem] border px-4 py-4 ${
                          item.status === 'current'
                            ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                            : item.status === 'completed'
                            ? 'border-emerald-200 bg-emerald-50/80'
                            : 'border-[color:var(--line)] bg-slate-50/90'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            item.status === 'current'
                              ? 'bg-white text-[color:var(--accent-strong)]'
                              : item.status === 'completed'
                              ? 'bg-white text-emerald-700'
                              : 'bg-white text-[color:var(--muted)]'
                          }`}>
                            {item.status === 'current' ? '当前' : item.status === 'completed' ? '已完成' : '待解锁'}
                          </span>
                        </div>
                        <div className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
                          {item.description}
                        </div>
                      </div>
                    ))}
                  </div>
                  {nextStageLadderItem ? (
                    <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                      <span className="font-semibold text-[color:var(--accent-strong)]">下一阶段：</span>
                      {`${nextStageLadderItem.label}会补足${nextStageLadderItem.description.replace(/^会补足/, '')}`}
                    </div>
                  ) : null}
                </div>
                {upgradeJob?.status ? (
                  <div className="mt-3 text-xs text-[color:var(--muted)]">
                    {`${upgradeStatusLabel}，已尝试 ${upgradeJob.attempts || 0} / ${upgradeJob.maxAttempts || 0} 次。`}
                    {upgradeJob.nextRunAt ? ` 下一次计划时间 ${upgradeJob.nextRunAt}。` : ''}
                  </div>
                ) : null}
              </div>

              {canManage ? (
                <div className="mt-5 rounded-[1.25rem] border border-[color:var(--line)] bg-white/78 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${feedbackHeroTone}`}>
                      {feedbackHeroLabel}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                      {`关联事件 ${validationInsights.totalLinkedEvents || 0}`}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                      {`待验证 ${validationInsights.pendingCount || 0}`}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                      {`偏差 ${validationInsights.driftCount || 0}`}
                    </span>
                  </div>
                  <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">
                    {validationInsights.summary}
                  </div>
                  <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                    {correctionInsight.summary}
                  </div>
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {reportHighlights.map((item) => (
                  <div key={item.label} className="rounded-[1.1rem] bg-white/80 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                    <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.value}</div>
                  </div>
                ))}
              </div>


              <div className="mt-6 soft-card rounded-[1.35rem] p-5">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-5 w-5 text-[color:var(--warm)]" />
                  <div className="font-semibold text-[color:var(--ink)]">继续展开的顺序</div>
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-[0.96fr_1.04fr]">
                  <div className="rounded-[1.1rem] bg-slate-50 px-4 py-4">
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">现在先看</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {coreSectionNames.map((item) => (
                        <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--ink)]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.1rem] bg-slate-50 px-4 py-4">
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">后面再展开</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {deferredSectionNames.map((item) => (
                        <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              </details>
            </div>
          </div>

          <div className="grid gap-4">
            <ReportEnginePanel
              reportId={id}
              canManage={canManage}
              reportVersion={result.reportVersion || 'v1'}
              llmUsed={result.llmUsed}
              agenticUsed={result.agenticUsed}
              reasoningMode={result.reasoningMode}
              consistencyScore={result.verify?.consistencyScore}
              verifyVerdict={result.verify?.verdict}
              qualityAudit={result.qualityAudit}
              upgradeJob={result.upgradeJob}
              generatedFrom={result.generatedFrom}
              upgradedFromVersion={result.upgradedFromVersion}
              engineBuilds={result.engineBuilds || ENGINE_BUILD_VERSIONS}
              enhancementNotes={result.enhancementNotes || []}
              orchestration={result.orchestration}
              feedbackLoop={result.analysis?.feedbackLoop}
              versionLineage={result.versionLineage}
            />

            {canManage ? (
              <UpdatesStatusPanel
                reportId={id}
                compact
                title="这份报告的升级与更新"
                description="查看这份报告后续的升级进度、月度提醒和订阅状态，避免结果停留在一次性生成。"
                initialAuthenticated={updatesPanelInitialAuthenticated}
                initialSummary={updatesPanelInitialSummary}
                ctaStrategyKey={sourceCtaStrategy.strategyKey}
                sourceFamily={sourceCtaStrategy.sourceFamily}
              />
            ) : null}

            {stateVectorCards.length > 0 && (
              <div className="soft-card rounded-[1.35rem] p-5">
                <div className="flex items-center gap-3">
                  <Compass className="h-5 w-5 text-[color:var(--accent-strong)]" />
                  <div className="font-semibold text-[color:var(--ink)]">天时地利人和</div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {stateVectorCards.map((item) => (
                    <div key={item.label} className="rounded-[1.1rem] bg-slate-50 px-4 py-4">
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                      <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
                {referenceAuthority ? (
                  <div className="mt-4 rounded-[1.1rem] bg-[rgba(178,149,93,0.1)] px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                        {`参考权威度 ${referenceAuthority.authorityScore}`}
                      </span>
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                        {`来源 ${referenceAuthority.sourceCount}`}
                      </span>
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                        {`经典书目 ${referenceAuthority.classicBookCount}`}
                      </span>
                    </div>
                    {referenceLeadDirective ? (
                      <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">{referenceLeadDirective}</div>
                    ) : null}
                    {referenceSignals.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {referenceSignals.map((signal) => (
                          <span key={signal} className="rounded-full bg-white px-3 py-1 text-xs text-[color:var(--ink)]">
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

          </div>
        </section>

        <ProductSurfaceRolePanel
          surface="result"
          className="mb-10"
          title="结果页先解决阅读顺序，再进入深入判断"
          description="这一页不把所有命理内容一次性摊开，而是先让用户看懂主判断和下一步动作，再按追问、工具、事件验证逐层深入。"
          compact
        />

        <div className="mt-6">
          <PublicReportInteractionPanel
            reportId={id}
            publicName={publicName}
            canManage={canManage}
            isPublic={result.isPublic}
            reportChatHref={reportChatHref}
            toolHref={primaryToolRoute?.href}
          />
        </div>

        <div className="mt-6">
          <ResultPublicControls
            reportId={id}
            initialIsPublic={result.isPublic}
            canManage={canManage}
            publicName={publicName}
            reportVersion={result.reportVersion || 'v1'}
            deliveryTierLabel={deliveryTierLabel}
            reasoningModeLabel={reasoningModeLabel}
            summary={currentStageSummary}
            nextFocusSummary={nextFocusSummary}
            highlights={reportHighlights}
          />
        </div>

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

        <div className="mt-16">
          <ResultDeferredSection
            id="premium"
            title="专项服务"
            description="当主报告已经指出方向，这里承接更聚焦的专项判断和深度服务需求。"
            delayMs={180}
          >
            <div className="scroll-mt-28">
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
        </div>

        <div className="mt-16">
          <ResultDeferredSection
            id="subscription"
            title="订阅与更新"
            description="把后续月度提醒、升级增强和邮件留存接回这份主报告，方便你持续复访。"
            delayMs={320}
          >
            <div className="scroll-mt-28">
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
        </div>


        <div className="mt-16">
          <ResultDeferredSection
            id="next-step"
            title="下一步行动"
            description="把这份报告转成接下来最值得执行、验证和复盘的几个动作，而不是停在阅读层。"
            delayMs={620}
          >
            <div className="scroll-mt-28">
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
        </div>

        <div className="mt-16">
          <SurfaceJourneyPanel
            journey={reportJourney}
            title={reportJourneyCopy.title}
            description={reportJourneyCopy.description}
            badge={entrySource ? `${sourceContext.guidanceLabel} · 来源已保留` : undefined}
          />
        </div>

        <div className="mt-16">
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

        <div className="mt-16">
          <ResultDeferredSection
            title="延伸内容"
            description="把相关知识、案例和后续阅读接到这份报告后面，方便你继续补全判断上下文。"
            delayMs={760}
          >
            <RelatedContent source={entrySource || `result_report:${id}`} />
          </ResultDeferredSection>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

// 骨架组件
function ReportSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
      <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
  );
}

function GuideSkeleton() {
  return (
    <div className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
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
