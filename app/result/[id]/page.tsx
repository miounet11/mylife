// 结构判断结果页面
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import NextDynamic from 'next/dynamic';
import { Suspense } from 'react';
import {
  ArrowRight,
  Bot,
  CalendarClock,
  Compass,
  LineChart,
  LockKeyhole,
  ScrollText,
  Share2,
  Sparkles,
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
import ReportEnginePanel from '@/components/report-engine-panel';
import ReportPremiumServices from '@/components/report-premium-services';
import ReportSubscriptionPanel from '@/components/report-subscription-panel';
import SurfaceJourneyPanel from '@/components/surface-journey-panel';
import UpdatesStatusPanel from '@/components/updates-status-panel';
import ToolRecommendations from '@/components/tool-recommendations';
import type { UpdatesStatusSummary } from '@/components/updates-status-panel';
import RelatedContent from '@/components/related-content';
import ResultDeferredSection from '@/components/result-deferred-section';
import { getCurrentUserId } from '@/lib/user-utils';
import { determineYongShen, analyzeShenSha } from '@/lib/bazi-analyzer';
import { calculateDayun } from '@/lib/dayun-calculator';
import AnalyticsPageView from '@/components/analytics-page-view';
import ReportEventCapture from '@/components/report-event-capture';
import {
  buildConfidenceAnalysis,
  buildDecisionPlaybook,
  buildExpertInterpretation,
  buildReportCorrectionInsight,
  buildMonthlyWindows,
  buildReportActionSuggestions,
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
    robots: {
      index: true,
      follow: true,
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
    }) as {
      opening?: string;
      explanation?: string;
      llmUsed?: boolean;
      agenticUsed?: boolean;
      reasoningMode?: ReportReasoningMode;
      pipelineVersion?: string;
      generatedFrom?: 'analyze' | 'upgrade';
      generatedAt?: string;
      upgradedFromVersion?: string;
      engineBuilds?: {
        core: string;
        llm: string;
        kline: string;
        report: string;
        reviewer?: string;
        prompts?: string;
      };
      orchestration?: {
        mode?: 'single-llm' | 'deterministic-expert' | 'parallel-agents';
        totalLlmCalls?: number;
        successRate?: number;
        succeeded?: string[];
        failed?: string[];
        errors?: Array<{ key: string; error: string }>;
        agentSources?: Record<string, 'llm' | 'fallback'>;
      };
      verify?: {
        consistencyScore?: number;
        verdict?: 'PASS' | 'WARN' | 'FAIL';
        failedRules?: string[];
      };
      qualityAudit?: {
        overallScore?: number;
        grade?: 'S' | 'A' | 'B' | 'C';
        status?: 'ready' | 'watch' | 'retry';
        deliveryTier?: 'basic' | 'enhanced' | 'expert';
        targetScore?: number;
        targetGrade?: 'S' | 'A' | 'B' | 'C';
        targetAchieved?: boolean;
        summary?: string;
        dimensions?: Array<{
          key?: 'engine' | 'llm' | 'agentic' | 'consistency' | 'completeness';
          label?: string;
          score?: number;
          status?: 'strong' | 'ok' | 'watch' | 'weak';
          detail?: string;
        }>;
        strengths?: string[];
        concerns?: string[];
        blockingIssues?: string[];
        recommendedActions?: string[];
        nextActionLabel?: string;
      };
      feedbackLoop?: {
        syncedAt?: string;
        linkedReportId?: string;
        validationInsights?: {
          totalLinkedEvents?: number;
          accurateCount?: number;
          driftCount?: number;
          pendingCount?: number;
          summary?: string;
          lessons?: string[];
        };
        correctionInsight?: {
          level?: 'healthy' | 'watch' | 'action';
          summary?: string;
          likelyCause?: string;
          fixes?: string[];
          checkpoints?: string[];
        };
      };
      versionLineage?: Array<{
        version?: string;
        generatedAt?: string;
        generatedFrom?: 'analyze' | 'upgrade';
        upgradedFromVersion?: string;
        reasoningMode?: ReportReasoningMode;
        llmUsed?: boolean;
        agenticUsed?: boolean;
        qualityScore?: number;
        qualityGrade?: 'S' | 'A' | 'B' | 'C';
        deliveryTier?: 'basic' | 'enhanced' | 'expert';
        targetAchieved?: boolean;
        summary?: string;
      }>;
      upgradeJob?: {
        status?: 'pending' | 'running' | 'retry' | 'completed' | 'failed' | 'cancelled';
        attempts?: number;
        maxAttempts?: number;
        nextRunAt?: string;
        bestScore?: number;
        bestGrade?: 'S' | 'A' | 'B' | 'C';
        lastError?: string;
      };
      loop?: Record<string, unknown>;
      contextSignals?: Record<string, unknown>;
      agentResults?: Record<string, unknown>;
      enhancementNotes?: string[];
      [key: string]: unknown;
    };

    const pillars = fortuneData.bazi?.pillars || [];
    const bazi = pillars
      .map((pillar) => `${pillar?.celestialStem || ''}${pillar?.earthlyBranch || ''}`)
      .filter((item) => item.length === 2);
    const yongShenResult = bazi.length === 4 ? determineYongShen(bazi) : null;
    const dayun = fortuneData.dayun || (pillars.length >= 2 && fortuneData.birthDate && fortuneData.birthTime
      ? calculateDayun(
          new Date(fortuneData.birthDate),
          fortuneData.birthTime,
          fortuneData.gender,
          pillars[0]?.celestialStem || '',
          {
            gan: pillars[1]?.celestialStem || '',
            zhi: pillars[1]?.earthlyBranch || '',
          },
          yongShenResult,
          new Date(fortuneData.birthDate).getFullYear()
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
        : [createLineageEntry(analysis as any, fortuneData.reportVersion || 'v1')].filter(Boolean),
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
    const monthlyWindows = buildMonthlyWindows(baseResult);
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
    });
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

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;
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
  const updatesPanelInitialSummary: UpdatesStatusSummary = canManage && updatesPanelInitialAuthenticated
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
  const correctionInsight = buildReportCorrectionInsight({
    validationInsights,
    confidence: result.confidence,
    scenarioViews: result.scenarioViews,
    monthlyWindows: result.monthlyWindows,
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
  const reportActions = [
    {
      title: '看完可继续深问 AI',
      description: '把关键结论继续追问成可执行问题。',
      icon: Bot,
    },
    {
      title: '把关键窗口落成事件',
      description: '把窗口存成事件，后面才能验证和复盘。',
      icon: CalendarClock,
    },
    {
      title: result.isPublic ? '这份报告可直接分享' : '这份报告目前为隐藏模式',
      description: result.isPublic
        ? '当前可通过匿名链接分享。'
        : '默认私密，需要时再手动开启。',
      icon: Share2,
    },
  ];
  const qualityAudit = result.qualityAudit;
  const upgradeJob = result.upgradeJob;
  const deliveryTierLabel = qualityAudit?.deliveryTier === 'expert'
    ? 'S级专家版'
    : qualityAudit?.deliveryTier === 'enhanced'
    ? '增强版'
    : '基础版';
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
  const reportJourney = buildJourneyForReport({
    id,
    userId: result.basic.userId,
    name: result.basic.name,
    birthDate: (result.basic as { birthDate?: string }).birthDate || '',
    birthTime: (result.basic as { birthTime?: string }).birthTime || '',
    birthPlace: (result.basic as { birthPlace?: string }).birthPlace,
    timezone: (result.basic as { timezone?: number }).timezone || 8,
    gender: (result.basic as { gender?: 'male' | 'female' }).gender || 'male',
    bazi: result.basic as any,
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
  const coreSectionNames = ['总览', '当前阶段', '命局结构', '立即动作', '引擎状态', '天时地利人和'];
  const deferredSectionNames = ['可信报告', '专项服务', '订阅更新', '趋势图', '下一步', '延伸内容'];
  const stagedReadingHint = result.qualityAudit?.targetAchieved || result.llmUsed
    ? '页面内容较多，系统会先让你看到核心判断，再逐步展开验证、趋势和延伸区块。'
    : '当前先交付核心判断和可执行结论，验证、趋势和延伸区块会继续分批展开，后台也会继续增强。';
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
        }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="再次分析" />

      <main className="page-frame py-8 pb-16 md:py-12 md:pb-20">
        <section className="mb-10 grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="glass-panel relative overflow-hidden rounded-[2.25rem] p-6 md:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--accent),var(--warm),#d97706)]" />
            <div className="absolute -right-12 top-8 h-44 w-44 rounded-full bg-[rgba(178,149,93,0.16)] blur-3xl" />
            <div className="absolute left-8 top-24 h-32 w-32 rounded-full bg-[rgba(201,125,58,0.16)] blur-3xl" />

            <div className="relative">
              <div className="section-label">个人结构总览</div>

              <div className="mt-5 flex flex-wrap gap-2">
                {isEnhancementPending ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                    深度增强补强中
                  </span>
                ) : null}
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                  {result.llmUsed ? 'LLM 深度增强' : '结构化整合输出'}
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                  {reasoningModeLabel}
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                  {`报告 ${result.reportVersion || 'v1'}`}
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                  {deliveryTierLabel}
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                  {result.isPublic ? '已开启分享模式' : '默认私密'}
                </span>
              </div>

              <h1 className="mt-5 max-w-4xl text-3xl font-black leading-tight text-[color:var(--ink)] md:text-5xl">
                {publicName}当前最重要的，
                <span className="font-serif text-[color:var(--accent-strong)]">不是再听一句抽象判断，而是看清所处阶段和下一步节奏。</span>
              </h1>

              <p className="intro-copy mt-4">先做一个动作，再展开阅读。</p>
              <div className="intro-panel mt-3">优先顺序：追问 → 记事件 → 开更新。</div>

              <div className="mt-5 rounded-[1.5rem] border border-[color:var(--line)] bg-white/80 px-4 py-4">
                <div className="action-guide">核心操作</div>
                <div className="action-strip mt-3 flex flex-wrap gap-3">
                  <Link href={`/chat?reportId=${encodeURIComponent(id)}`} className="action-primary action-main">
                    进入结构追问
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href={`/events?reportId=${encodeURIComponent(id)}`} className="action-secondary">
                    管理关联事件
                  </Link>
                  <Link href="#subscription" className="action-secondary">
                    开启月度更新
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {worldYiGuidedPaths.slice(0, 3).map((item) => (
                    <Link key={item.href} href={item.href} className="rounded-[1.2rem] bg-slate-50 px-4 py-3 transition hover:bg-white">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                        <ArrowRight className="h-4 w-4 text-[color:var(--accent-strong)]" />
                      </div>
                      <div className="intro-copy mt-2">{item.description}</div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className={`mt-5 rounded-[1.5rem] border px-4 py-4 ${
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
                    {isEnhancementPending
                      ? '稳定版已可阅读'
                      : result.llmUsed
                      ? '深度版已送达'
                      : '当前为稳定可读版'}
                  </span>
                  {upgradeStatusLabel ? (
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                      {upgradeStatusLabel}
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">
                  {enhancementStatusMessage}
                </div>
              </div>

              {qualityAudit ? (
                <div className="mt-5 rounded-[1.5rem] border border-[color:var(--line)] bg-white/75 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                      {`质量 ${qualityAudit.overallScore || '--'} / ${qualityAudit.grade || 'B'}`}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      qualityAudit.targetAchieved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                    }`}>
                      {qualityAudit.targetAchieved
                        ? '已达到 95 分 S级目标'
                        : `距离 ${qualityAudit.targetScore || 95} 分 S级目标仍需增强`}
                    </span>
                  </div>
                  <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">
                    {qualityAudit.summary}
                  </div>
                  {upgradeJob?.status ? (
                    <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                      {`${upgradeStatusLabel}，已尝试 ${upgradeJob.attempts || 0} / ${upgradeJob.maxAttempts || 0} 次。`}
                      {upgradeJob.nextRunAt ? ` 下一次计划时间 ${upgradeJob.nextRunAt}。` : ''}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {canManage ? (
                <div className="mt-5 rounded-[1.5rem] border border-[color:var(--line)] bg-white/78 px-4 py-4">
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
                  <div key={item.label} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                    <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded-[1.5rem] bg-[rgba(178,149,93,0.1)] px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">决策摘要</div>
                    <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                      {decisionWindowLabel}
                    </span>
                  </div>
                  <div className="mt-2 text-lg font-bold leading-8 text-[color:var(--ink)]">
                    {decisionHeadline}
                  </div>
                  <div className="mt-4 space-y-3">
                    {decisionEvidence.map((item) => (
                      <div key={item} className="rounded-2xl bg-white/78 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-2xl bg-white/80 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                    {nextFocusSummary}
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-white/82 px-4 py-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">现在怎么做</div>
                  <div className="mt-3 grid gap-3">
                    <div className="rounded-2xl bg-[rgba(178,149,93,0.1)] px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">现在先做</div>
                      <div className="mt-2 text-xs leading-6 text-[color:var(--ink)]">{decisionNowAction}</div>
                    </div>
                    <div className="rounded-2xl bg-rose-50 px-4 py-3">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-rose-500">先别做</div>
                      <div className="mt-2 text-xs leading-6 text-rose-800">{decisionAvoidAction}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-3">
                    <Link
                      href={`/chat?reportId=${encodeURIComponent(id)}`}
                      className="action-primary action-main justify-between"
                    >
                      进入结构追问
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="#subscription"
                      className="action-secondary justify-between"
                    >
                      开启月度更新
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/analyze"
                      className="action-secondary justify-between"
                    >
                      再次生成一份
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="intro-copy mt-4">默认私密，开启后仍以匿名方式分享。</div>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-white/80 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                    分批呈现
                  </span>
                  {upgradeJob?.status && ['pending', 'running', 'retry'].includes(upgradeJob.status) ? (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                      后台增强中
                    </span>
                  ) : null}
                </div>
                <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">
                  {stagedReadingHint}
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">现在先看</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {coreSectionNames.map((item) => (
                        <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[color:var(--ink)]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">继续展开</div>
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
            </div>
          </div>

          <div className="grid gap-4">
            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="font-semibold text-[color:var(--ink)]">分享与可见性</div>
              <p className="intro-copy mt-2">默认私密，开启后外部用户仅能通过匿名链接查看。</p>
              <div className="mt-4">
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
            </div>

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
                description="这里直接看订阅状态、升级进度和最近更新。"
                initialAuthenticated={updatesPanelInitialAuthenticated}
                initialSummary={updatesPanelInitialSummary}
              />
            ) : null}

            {reportActions.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="soft-card rounded-[1.75rem] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="font-semibold text-[color:var(--ink)]">{item.title}</div>
                </div>
                  <p className="intro-copy mt-3">{item.description}</p>
                </div>
              );
            })}

            {stateVectorCards.length > 0 && (
              <div className="soft-card rounded-[1.75rem] p-5">
              <div className="flex items-center gap-3">
                <Compass className="h-5 w-5 text-[color:var(--accent-strong)]" />
                <div className="font-semibold text-[color:var(--ink)]">天时地利人和</div>
              </div>
                <p className="intro-copy mt-2">看时机、环境和关系，判断推进阻力与放大效应。</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {stateVectorCards.map((item) => (
                    <div key={item.label} className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                      <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value.toFixed(1)}</div>
                      <div className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.detail}</div>
                    </div>
                  ))}
                </div>
                {referenceAuthority ? (
                  <div className="mt-4 rounded-[1.4rem] bg-[rgba(178,149,93,0.1)] px-4 py-4">
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

            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-[color:var(--warm)]" />
                <div className="font-semibold text-[color:var(--ink)]">阅读路径</div>
              </div>
              <div className="mt-3 space-y-3">
                {[
                  '先看总览和核心结构',
                  '再看五行分布与趋势图',
                  '最后进入结构追问或再次生成一份',
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-[color:var(--ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <ReportEventCapture reportId={id} suggestions={result.actionSuggestions || []} />

            {canManage && (
              <div className="soft-card rounded-[1.75rem] p-5">
                <div className="font-semibold text-[color:var(--ink)]">这份报告的验证状态</div>
                <p className="intro-copy mt-2">{validationInsights.summary}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    { label: '已验证准确', value: validationInsights.accurateCount },
                    { label: '已记录偏差', value: validationInsights.driftCount },
                    { label: '待验证', value: validationInsights.pendingCount },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                      <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {canManage && validationInsights.totalLinkedEvents > 0 && (
              <div className="soft-card rounded-[1.75rem] p-5">
                <div className="font-semibold text-[color:var(--ink)]">纠偏优先级</div>
                <p className="intro-copy mt-2">{correctionInsight.summary}</p>
                <div className="mt-4 rounded-[1.4rem] bg-slate-50 px-4 py-4">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">更可能的原因</div>
                  <div className="mt-2 text-xs leading-6 text-[color:var(--ink)]">{correctionInsight.likelyCause}</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* LLM 状态提示 */}
        <div className="mx-auto mb-6 flex max-w-6xl flex-col gap-4">
          <div className="flex justify-end">
            {result.llmUsed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                AI 深度解析
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
                isEnhancementPending
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  isEnhancementPending ? 'bg-amber-500' : 'bg-slate-400'
                }`}></span>
                {isEnhancementPending ? '稳定版已出，深度增强中' : '基础引擎解析'}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
              (result.reportVersion || 'v1') === CURRENT_REPORT_VERSION
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-amber-200 bg-amber-50 text-amber-700'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${
                (result.reportVersion || 'v1') === CURRENT_REPORT_VERSION ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></span>
              {`报告 ${result.reportVersion || 'v1'}`}
            </span>
          </div>

          <div className="scrollbar-none overflow-x-auto">
            <div className="flex min-w-max gap-3">
                  {[
                  { href: '#overview', label: '总览', icon: Sparkles },
                  { href: '#scenario', label: '场景', icon: ArrowRight },
                  { href: '#expert', label: '专家', icon: ScrollText },
                  { href: '#agentic', label: '并发层', icon: Bot },
                  { href: '#pillars', label: '结构盘', icon: Compass },
                  { href: '#engine', label: '引擎', icon: Bot },
                  { href: '#elements', label: '五行', icon: LineChart },
                  { href: '#windows', label: '窗口', icon: CalendarClock },
                  { href: '#playbook', label: '执行', icon: Bot },
                  { href: '#roadmap', label: '路线图', icon: Compass },
                  { href: '#trajectory', label: '三年', icon: LineChart },
                  { href: '#confidence', label: '可信度', icon: LockKeyhole },
                  { href: '#validation', label: '验证', icon: LockKeyhole },
                  { href: '#correction', label: '纠偏', icon: Compass },
                  { href: '#premium', label: '专项', icon: Sparkles },
                  { href: '#subscription', label: '订阅', icon: Sparkles },
                  { href: '#advice', label: '建议', icon: ScrollText },
                  { href: '#trend', label: '趋势', icon: CalendarClock },
                  { href: '#next-step', label: '下一步', icon: ArrowRight },
                ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="product-chip"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <ResultDeferredSection
          id="validation"
          title="可信报告与验证区块正在整理"
          description="核心结论已经优先显示。可信度、验证和纠偏区块会继续补齐后展开，不需要重复刷新。"
          delayMs={0}
        >
          <Suspense fallback={<ReportSkeleton />}>
            <TrustReport result={{ ...result, validationInsights, correctionInsight }} />
          </Suspense>
        </ResultDeferredSection>

        <div className="mt-16">
          <ResultDeferredSection
            id="premium"
            title="专项服务区块正在载入"
            description="专项模拟、断事和事件复盘会在主报告后继续展开，避免一上来被整页信息压住。"
            delayMs={180}
          >
            <div className="scroll-mt-28">
              <ReportPremiumServices
                reportId={id}
                canManage={canManage}
                offers={premiumServiceOffers}
                initialEmail={initialPremiumEmail}
                initialRequests={initialPremiumRequests}
              />
            </div>
          </ResultDeferredSection>
        </div>

        <div className="mt-16">
          <ResultDeferredSection
            id="subscription"
            title="订阅与更新区块正在载入"
            description="月度更新、订阅入口和增强跟踪会继续补上，先看主报告不影响判断。"
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
              />
            </div>
          </ResultDeferredSection>
        </div>

        {result.klineData && result.klineData.length > 0 && (
          <div className="mt-12">
            <ResultDeferredSection
              id="trend"
              title="趋势图正在载入"
              description="人生K线和趋势图会在首屏判断后继续显示，核心判断不会因此延后。"
              delayMs={480}
            >
              <div className="scroll-mt-28">
                <Suspense fallback={<ChartSkeleton />}>
                  <FortuneChart data={result.klineData} />
                </Suspense>
              </div>
            </ResultDeferredSection>
          </div>
        )}

        <div className="mt-16">
          <ResultDeferredSection
            id="next-step"
            title="下一步行动区块正在载入"
            description="系统先给你核心判断，再继续补齐后续动作、验证提醒和延伸阅读路径。"
            delayMs={620}
          >
            <div className="scroll-mt-28">
              <Suspense fallback={<GuideSkeleton />}>
                <NextStepGuide
                  reportId={id}
                  hasPendingValidation={validationInsights.pendingCount > 0}
                  hasDrift={validationInsights.driftCount > 0}
                  canManage={canManage}
                />
              </Suspense>
            </div>
          </ResultDeferredSection>
        </div>

        <div className="mt-16">
          <SurfaceJourneyPanel
            journey={reportJourney}
            title="这份主测算已经接到工具和内容系统"
            description="综合报告负责定主轴，小工具负责拆具体问题，文章和案例负责沉淀理解与说服力。你不需要在这些入口之间来回断开。"
          />
        </div>

        <div className="mt-16">
          <ToolRecommendations
            report={{
              id,
              userId: result.basic.userId,
              name: result.basic.name,
              birthDate: (result.basic as { birthDate?: string }).birthDate || '',
              birthTime: (result.basic as { birthTime?: string }).birthTime || '',
              birthPlace: (result.basic as { birthPlace?: string }).birthPlace,
              timezone: (result.basic as { timezone?: number }).timezone || 8,
              gender: (result.basic as { gender?: 'male' | 'female' }).gender || 'male',
              bazi: result.basic as any,
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
            }}
            page={`/result/${id}`}
            title="推荐单项工具"
            description="综合报告先看全局，再用单项工具把某一件事继续拆深，最容易形成复访和持续判断。"
          />
        </div>

        <div className="mt-16">
          <ResultDeferredSection
            title="延伸内容区块正在载入"
            description="相关内容和进一步阅读会在主报告后继续展开，先把这份结果读清楚更重要。"
            delayMs={760}
          >
            <RelatedContent />
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
      pack?: {
        authority?: {
          sourceCount?: number;
          classicBookCount?: number;
          authorityScore?: number;
        };
        dimensions?: {
          tianShi?: { signals?: string[] };
          diLi?: { signals?: string[] };
          renHe?: { signals?: string[] };
        };
        modelDirectives?: string[];
        stateVectorAdjustment?: {
          tianShiDelta?: number;
          diLiDelta?: number;
          renHeDelta?: number;
        };
      };
      overlay?: Record<string, unknown>;
    };
  };

  return record.referenceIntelligence;
}
