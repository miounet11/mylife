'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AgenticInsightPanel from '@/components/report/agentic-insight-panel';
import { deriveReportReasoningMode, type ReportReasoningMode } from '@/lib/report-reasoning-mode';
import type {
  ConfidenceAnalysis,
  DecisionPlaybookItem,
  ExpertInterpretationBlock,
  MonthlyWindow,
  ReportCorrectionInsight,
  ReportValidationInsights,
  ScenarioKey,
  ScenarioView,
  YearlyTrendSnapshot,
  YearlyRoadmapPhase,
} from '@/lib/report-v2';
import {
  Activity,
  ArrowRightLeft,
  BadgeAlert,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  Compass,
  Flame,
  Gem,
  Heart,
  Layers3,
  Leaf,
  Scale,
  ShieldCheck,
  Sparkles,
  Telescope,
  TrendingUp,
  Waves,
} from 'lucide-react';

type ElementKey = 'wood' | 'fire' | 'earth' | 'metal' | 'water';

type ElementValue = {
  strength?: number;
  quality?: string;
  description?: string;
  state?: string;
};

type PillarData = {
  celestialStem?: string;
  earthlyBranch?: string;
  hiddenStems?: string[];
  nayin?: string;
  relationships?: {
    combination?: string[];
    clash?: string[];
    penalty?: string[];
    harm?: string[];
  };
};

type DayunInfo = {
  index: number;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  ganZhi: string;
  description: string;
  quality: 'excellent' | 'good' | 'neutral' | 'bad' | 'poor';
  yongShenMatch: 'good' | 'neutral' | 'bad';
  isCurrent: boolean;
};

type ShenShaInfo = {
  name: string;
  type: 'auspicious' | 'inauspicious' | 'neutral';
  description: string;
  pillar: 'year' | 'month' | 'day' | 'hour';
};

type ReportResult = {
  basic?: {
    name?: string;
    dayMaster?: string;
    pillars?: PillarData[];
  };
  fiveElements?: Partial<Record<ElementKey, ElementValue>>;
  tenGods?: {
    self?: string;
    output?: string[];
    input?: string[];
    control?: string[];
    controlled?: string[];
  };
  pattern?: {
    type?: string;
    strength?: string;
    quality?: string;
    description?: string;
  };
  fortune?: {
    currentDaYun?: string;
    currentLiuNian?: string;
    interaction?: string;
    nextYear?: string;
  };
  advice?: {
    career?: { general?: string; specific?: string[]; timing?: string; avoid?: string[] };
    wealth?: { general?: string; specific?: string[]; timing?: string; avoid?: string[] };
    marriage?: { general?: string; specific?: string[]; timing?: string };
    health?: { general?: string; specific?: string[]; timing?: string; avoid?: string[] };
    colors?: string[];
    directions?: string[];
    numbers?: number[];
    yongShen?: string[];
    xiShen?: string[];
    jiShen?: string[];
  };
  evidence?: {
    statistics?: {
      totalSamples?: number;
      similarCases?: number;
      successRate?: number;
      averageIncome?: string;
      averageAge?: number;
    };
    celebrities?: Array<{
      name?: string;
      similar?: string[];
      lesson?: string;
    }>;
  };
  analysis?: {
    opening?: string;
    explanation?: string;
    agenticUsed?: boolean;
    reasoningMode?: ReportReasoningMode;
  };
  agenticUsed?: boolean;
  reasoningMode?: ReportReasoningMode;
  verify?: {
    consistencyScore?: number;
    verdict?: 'PASS' | 'WARN' | 'FAIL';
    failedRules?: string[];
  };
  orchestration?: {
    totalLlmCalls?: number;
    successRate?: number;
    succeeded?: string[];
    failed?: string[];
    errors?: Array<{ key: string; error: string }>;
    agentSources?: Record<string, 'llm' | 'fallback'>;
  };
  loop?: {
    review?: {
      conflicts?: Array<{ id?: string; type?: string; severity?: string; explanation?: string }>;
      repairPlan?: {
        actions?: Array<{ order?: number; action?: string; reason?: string }>;
      };
    };
  };
  contextSignals?: Record<string, unknown>;
  agentResults?: Record<string, unknown>;
  klineData?: Array<{
    year: number;
    career: number;
    wealth: number;
    marriage: number;
    health: number;
  }> | null;
  dayun?: {
    startAge?: number;
    currentDayun?: DayunInfo | null;
    currentDayunYear?: number;
    dayuns?: DayunInfo[];
  };
  shenSha?: {
    list?: ShenShaInfo[];
    auspicious?: string[];
    inauspicious?: string[];
    summary?: string;
  };
  scenarioViews?: ScenarioView[];
  monthlyWindows?: MonthlyWindow[];
  confidence?: ConfidenceAnalysis;
  yearlyRoadmap?: YearlyRoadmapPhase[];
  decisionPlaybook?: DecisionPlaybookItem[];
  yearlyTrendSnapshots?: YearlyTrendSnapshot[];
  expertInterpretation?: ExpertInterpretationBlock[];
  validationInsights?: ReportValidationInsights;
  correctionInsight?: ReportCorrectionInsight;
  stateVector?: {
    current?: {
      tianShi: number;
      diLi: number;
      renHe: number;
    };
    history?: Array<{
      year: number;
      tianShi: number;
      diLi: number;
      renHe: number;
    }>;
    forecast?: Array<{
      year: number;
      tianShi: number;
      diLi: number;
      renHe: number;
    }>;
  };
  referenceIntelligence?: {
    pack?: {
      authority?: {
        sourceCount?: number;
        classicBookCount?: number;
        authorityScore?: number;
      };
      dimensions?: {
        tianShi?: { score?: number; signals?: string[] };
        diLi?: { score?: number; signals?: string[] };
        renHe?: { score?: number; signals?: string[] };
      };
      modelDirectives?: string[];
    };
  };
};

const elementMeta: Record<ElementKey, { label: string; color: string; icon: typeof Leaf }> = {
  wood: { label: '木', color: 'from-emerald-500 to-emerald-400', icon: Leaf },
  fire: { label: '火', color: 'from-rose-500 to-orange-400', icon: Flame },
  earth: { label: '土', color: 'from-amber-500 to-yellow-400', icon: Compass },
  metal: { label: '金', color: 'from-slate-500 to-slate-300', icon: Gem },
  water: { label: '水', color: 'from-sky-500 to-cyan-400', icon: Waves },
};

const pillarLabels = ['年柱', '月柱', '日柱', '时柱'];
const palaceLabels = ['祖上根基', '月令核心', '自我本体', '晚景结果'];

const tenGodGroupMeta = [
  {
    key: 'output',
    title: '印比帮扶',
    description: '代表资源、学习、贵人、恢复力，是命局站稳脚跟的底盘。',
    accent: 'bg-emerald-500',
  },
  {
    key: 'controlled',
    title: '食伤表达',
    description: '代表输出、表达、创造、技能转化，是把能力变成影响力的路径。',
    accent: 'bg-sky-500',
  },
  {
    key: 'input',
    title: '财星落点',
    description: '代表现实回报、资源配置、商业转化，是结果兑现能力。',
    accent: 'bg-amber-500',
  },
  {
    key: 'control',
    title: '官杀约束',
    description: '代表规则、责任、压力、职位要求，是外部秩序对个人的塑形。',
    accent: 'bg-rose-500',
  },
] as const;

export default function TrustReport({ result }: { result: ReportResult }) {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('overall');
  if (!result) return null;
  const analysis = result.analysis || {};
  const basic = result.basic || { dayMaster: '', pillars: [] };
  const pillars = basic.pillars || [];
  const fiveElements = result.fiveElements || {};
  const pattern = result.pattern || { type: '未知', quality: '', strength: '', description: '' };
  const fortune = result.fortune || { currentDaYun: '', currentLiuNian: '', interaction: '', nextYear: '' };
  const advice = result.advice || {};
  const dayun = result.dayun || {};
  const shenSha = result.shenSha || {};
  const evidence = result.evidence || {};
  const scenarioViews = result.scenarioViews || [];
  const monthlyWindows = result.monthlyWindows || [];
  const confidence = result.confidence;
  const yearlyRoadmap = result.yearlyRoadmap || [];
  const decisionPlaybook = result.decisionPlaybook || [];
  const yearlyTrendSnapshots = result.yearlyTrendSnapshots || [];
  const expertInterpretation = result.expertInterpretation || [];
  const validationInsights = result.validationInsights;
  const correctionInsight = result.correctionInsight;
  const stateVector = result.stateVector;
  const referencePack = result.referenceIntelligence?.pack;
  const reasoningMode = deriveReportReasoningMode({
    reasoningMode: result.reasoningMode || analysis.reasoningMode,
    agenticUsed: result.agenticUsed || analysis.agenticUsed,
    agentResults: result.agentResults,
    contextSignals: result.contextSignals,
    verifyVerdict: result.verify?.verdict,
  });
  const temporal = (result.contextSignals?.temporal || {}) as Record<string, unknown>;
  const macroCycles = (result.contextSignals?.macroCycles || {}) as Record<string, unknown>;
  const geoClimate = (result.contextSignals?.geoClimate || {}) as Record<string, unknown>;
  const spatialFactors = (result.contextSignals?.spatialFactors || {}) as Record<string, unknown>;

  const elementEntries = (Object.entries(fiveElements) as [ElementKey, ElementValue][])
    .filter(([key]) => key in elementMeta)
    .sort((a, b) => Number(b[1]?.strength || 0) - Number(a[1]?.strength || 0));

  const strongestElement = elementEntries[0];
  const weakestElement = elementEntries[elementEntries.length - 1];
  const elementDelta = strongestElement && weakestElement
    ? Number(strongestElement[1]?.strength || 0) - Number(weakestElement[1]?.strength || 0)
    : 0;
  const balanceLevel = getBalanceLevel(elementDelta);
  const klineInsight = buildKlineInsight(result.klineData || [], resolveKlineAnchorYear(result));
  const decisionSummary = buildDecisionSummary({
    patternType: pattern.type || '命局未定',
    currentDaYun: fortune.currentDaYun || '',
    strongestElement: strongestElement ? `${elementMeta[strongestElement[0]].label}${formatPercent(strongestElement[1]?.strength)}` : '',
    weakestElement: weakestElement ? `${elementMeta[weakestElement[0]].label}${formatPercent(weakestElement[1]?.strength)}` : '',
    bestTrack: klineInsight.bestTrack,
  });
  const expertCards = [
    {
      label: '命局定位',
      value: `${pattern.type || '未知'} / ${mapStrengthText(pattern.strength)}`,
      detail: pattern.description || '当前命局结构已建立，但尚未写出更多定位说明。',
    },
    {
      label: '当前阶段',
      value: fortune.currentDaYun || '以当前阶段判断为准',
      detail: fortune.interaction || '建议结合当前阶段与真实节奏继续验证。',
    },
    {
      label: '优先动作',
      value: decisionSummary.title,
      detail: decisionSummary.description,
    },
  ];

  const quickStats = [
    { label: '日主', value: basic.dayMaster || '未知' },
    { label: '格局', value: pattern.type || '未知' },
    { label: '用神', value: (advice.yongShen || []).join('、') || '以当前结构综合判断' },
    { label: '当前流年', value: fortune.currentLiuNian || '以当年节奏为准' },
  ];

  const pillarInsights = pillars.map((pillar, index) => {
    const relationshipNotes = buildRelationshipNotes(pillar?.relationships);
    return {
      label: pillarLabels[index] || `第${index + 1}柱`,
      palace: palaceLabels[index] || '结构信息',
      value: `${pillar?.celestialStem || '-'}${pillar?.earthlyBranch || '-'}`,
      notes: relationshipNotes.length > 0 ? relationshipNotes : ['当前柱位未见强烈合冲刑害信号'],
    };
  });

  const tenGodCards = tenGodGroupMeta.map((item) => {
    const values = dedupeValues(result.tenGods?.[item.key] || []);
    return {
      ...item,
      values,
      summary: values.length > 0 ? `${item.title}以${values.join('、')}为主。` : `${item.title}在显性结构中不突出。`,
    };
  });

  const reasoningSteps = [
    `先看月令与日主：${analysis.opening || `日主为${basic.dayMaster || '未知'}，以月令定气势，以日元定立场。`}`,
    `再看结构定性：${pattern.description || `${pattern.type || '当前格局'}是本盘的核心结构判断。`}`,
    `然后看用神与忌神：用${(advice.yongShen || []).join('、') || '以当前结构综合判断'}，喜${(advice.xiShen || []).join('、') || '以当前趋势继续观察'}，忌${(advice.jiShen || []).join('、') || '优先结合现实反馈规避'}。`,
    `最后叠加行运：${fortune.interaction || '当前更建议把阶段判断和现实节奏一起看，而不是单独解读静态结构。'}`,
  ];

  const currentDayun = dayun.currentDayun || null;
  const visibleDayuns = (dayun.dayuns || []).filter(Boolean).slice(
    currentDayun ? currentDayun.index : 0,
    currentDayun ? currentDayun.index + 3 : 3
  );
  const shenShaItems = shenSha.list || [];
  const evidenceStats = evidence.statistics;
  const celebrities = evidence.celebrities || [];
  const activeScenario = scenarioViews.find((item) => item.key === selectedScenario) || scenarioViews[0];
  const contextBriefs = [
    {
      label: '时序锚点',
      value: [
        readContextText(temporal.currentSolarTerm),
        temporal.nextSolarTerm ? `下一节气 ${readContextText(temporal.nextSolarTerm)}` : '',
        temporal.currentLiuNian ? `流年 ${readContextText(temporal.currentLiuNian)}` : '',
      ].filter(Boolean).join(' / ') || '节气与流年信号待补全',
      detail: temporal.isBeforeLichun ? '当前仍按立春前口径理解年度环境。' : '当前已按立春后口径理解年度环境。',
    },
    {
      label: '宏观环境',
      value: readMacroSummary(macroCycles),
      detail: '把个人命局放进国运、经济周期与行业景气度里判断，才能决定动作大小。',
    },
    {
      label: '地理气候',
      value: readGeoSummary(geoClimate),
      detail: readStringList(geoClimate.climateBias as string[] | undefined, '当前环境建议仍以命局方向为主。'),
    },
    {
      label: '空间方位',
      value: readStringList(spatialFactors.favorableDirections as string[] | undefined, '当前未返回明确有利方位。'),
      detail: readStringList(spatialFactors.movementAdvice as string[] | undefined, '优先选择低摩擦、高匹配环境。'),
    },
  ];
  const stateVectorCards = stateVector?.current
    ? [
        {
          label: '天时',
          value: stateVector.current.tianShi.toFixed(1),
          detail: referencePack?.dimensions?.tianShi?.score
            ? `参考层评分 ${referencePack.dimensions.tianShi.score.toFixed(1)}，更强调时机、节气与窗口。`
            : '更看节气、阶段、流年和推进窗口。',
        },
        {
          label: '地利',
          value: stateVector.current.diLi.toFixed(1),
          detail: referencePack?.dimensions?.diLi?.score
            ? `参考层评分 ${referencePack.dimensions.diLi.score.toFixed(1)}，更强调城市、环境与空间匹配。`
            : '更看城市、空间环境和迁移匹配。',
        },
        {
          label: '人和',
          value: stateVector.current.renHe.toFixed(1),
          detail: referencePack?.dimensions?.renHe?.score
            ? `参考层评分 ${referencePack.dimensions.renHe.score.toFixed(1)}，更强调关系、合作与互动质量。`
            : '更看关系协同、合作质量和边界。',
        },
      ]
    : [];
  const referenceCards = referencePack?.authority
    ? [
        {
          label: '参考权威度',
          value: String(referencePack.authority.authorityScore || 0),
          detail: `当前共吸收 ${referencePack.authority.sourceCount || 0} 个来源，经典书目 ${referencePack.authority.classicBookCount || 0} 个。`,
        },
        {
          label: '模型指令',
          value: referencePack.modelDirectives?.[0] || '当前外部资料主要作为解释增强层。',
          detail: '外部资料不会替代底层结构判断，只用于校准和增强解释。',
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <Card id="overview" variant="gradient" className="relative overflow-hidden scroll-mt-28">
        <div className="absolute -right-12 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-32 w-32 rounded-full bg-[rgba(255,255,255,0.08)] blur-3xl" />

        <CardHeader className="relative z-10 pb-2">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-white/80">
            <ShieldCheck className="h-3.5 w-3.5" />
            EXPERT ENGINE REPORT
          </div>
          <CardTitle className="mt-4 max-w-4xl text-3xl font-black text-white md:text-5xl">
            这份报告要把结构引擎、阶段引擎与人生 K 线引擎
            <span className="font-serif">落成用户真正看得懂的判断链。</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="relative z-10 space-y-6 pt-2">
          <p className="max-w-4xl whitespace-pre-wrap text-sm leading-6 text-white/82">
            {analysis.explanation || '本报告已基于四柱、五行、十神、大运与趋势曲线完成结构化归纳。'}
          </p>

          <div className="grid gap-4 md:grid-cols-4">
            {quickStats.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">{item.label}</div>
                <div className="mt-2 text-lg font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {expertCards.map((item) => (
              <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-white/60">{item.label}</div>
                <div className="mt-2 text-lg font-bold leading-8 text-white">{item.value}</div>
                <div className="mt-2 text-xs leading-6 text-white/76">{item.detail}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {scenarioViews.length > 0 && activeScenario && (
        <Card id="scenario" className="scroll-mt-28">
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <ArrowRightLeft className="h-5 w-5 text-[color:var(--accent-strong)]" />
              场景版视图
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="flex flex-wrap gap-3">
              {scenarioViews.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedScenario(item.key)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedScenario === item.key
                      ? 'bg-[color:var(--accent-strong)] text-white'
                      : 'border border-[color:var(--line)] bg-white text-[color:var(--muted)]'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">{activeScenario.title}</div>
                    <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{activeScenario.actionLabel}</div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapScenarioBadge(activeScenario.status)}`}>
                    {mapScenarioStatus(activeScenario.status)}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <InsightCard
                    label="场景评分"
                    value={`${activeScenario.score}/100`}
                    detail={activeScenario.trend === 'up' ? '趋势正在走强' : activeScenario.trend === 'down' ? '趋势偏弱，先控节奏' : '趋势相对平稳'}
                  />
                  <InsightCard
                    label="当前判断"
                    value={activeScenario.title}
                    detail={activeScenario.summary}
                  />
                  <InsightCard
                    label="推荐动作"
                    value={activeScenario.actionLabel}
                    detail=""
                  />
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[1.75rem] bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">优先看点</div>
                  <div className="mt-3 grid gap-3">
                    {activeScenario.focus.map((item) => (
                      <div key={item} className="rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.75rem] bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">风险提醒</div>
                  <div className="mt-3 grid gap-3">
                    {activeScenario.risks.map((item) => (
                      <div key={item} className="rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {expertInterpretation.length > 0 && (
        <Card id="expert" className="scroll-mt-28">
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <BookOpen className="h-5 w-5 text-[color:var(--accent-strong)]" />
              专家解释层
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 xl:grid-cols-2">
              {expertInterpretation.map((item) => (
                <div key={item.key} className="rounded-[1.75rem] border border-[color:var(--line)] bg-white p-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">{item.title}</div>
                  <div className="mt-3 text-lg font-bold leading-8 text-[color:var(--ink)]">{item.headline}</div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-[color:var(--ink)]">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(result.agenticUsed || result.verify?.verdict || Object.keys(result.agentResults || {}).length > 0) && (
        <div id="agentic" className="scroll-mt-28">
          <AgenticInsightPanel
            agenticUsed={result.agenticUsed || analysis.agenticUsed}
            reasoningMode={reasoningMode}
            orchestration={result.orchestration}
            verify={result.verify}
            loop={result.loop}
            agentResults={result.agentResults}
            contextSignals={result.contextSignals}
          />
        </div>
      )}

      <div id="pillars" className="grid scroll-mt-28 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Activity className="h-5 w-5 text-[color:var(--accent-strong)]" />
              四柱结构总览
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              {pillarInsights.map((item, index) => {
                const pillar = pillars[index] || {};
                const isDayMaster = index === 2;
                return (
                  <div
                    key={item.label}
                    className={`relative rounded-[1.5rem] border p-4 text-center ${
                      isDayMaster
                        ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]'
                        : 'border-[color:var(--line)] bg-slate-50'
                    }`}
                  >
                    {isDayMaster && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[color:var(--accent-strong)] px-3 py-1 text-[11px] font-semibold text-white">
                        日主
                      </div>
                    )}
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">{item.palace}</div>
                    <div className="mt-4 font-serif text-5xl font-black text-[color:var(--ink)]">{pillar.celestialStem || '-'}</div>
                    <div className="mt-2 font-serif text-5xl font-black text-[color:var(--ink)]">{pillar.earthlyBranch || '-'}</div>
                    <div className="mt-5 space-y-2 border-t border-white/60 pt-4 text-left text-xs text-[color:var(--muted)]">
                      <div className="flex items-start justify-between gap-3">
                        <span>纳音</span>
                        <span className="font-semibold text-[color:var(--ink)]">{pillar.nayin || '-'}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span>藏干</span>
                        <span className="font-semibold text-[color:var(--ink)]">{(pillar.hiddenStems || []).join(' ') || '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {pillarInsights.map((item) => (
                <div key={`${item.label}-note`} className="rounded-[1.5rem] bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                  <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.value}</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.notes.map((note) => (
                      <span key={note} className="rounded-full bg-white px-3 py-1 text-xs text-[color:var(--ink)]">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <ArrowRightLeft className="h-5 w-5 text-[color:var(--warm)]" />
              专家结论面板
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <MetricTile label="命局格局" value={pattern.type || '未知'} emphasis />
            <MetricTile label="命局强弱" value={mapStrengthText(pattern.strength)} />
            <MetricTile label="用神" value={(advice.yongShen || []).join('、') || '需结合命局结构综合判断'} />
            <MetricTile label="喜神" value={(advice.xiShen || []).join('、') || '需结合行运节奏继续确认'} />
            <MetricTile label="忌神" value={(advice.jiShen || []).join('、') || '需结合现实反馈持续校正'} />
            <MetricTile label="当前运势交互" value={fortune.interaction || '需结合当前大运与流年联动判断'} />
          </CardContent>
        </Card>
      </div>

      <div id="engine" className="grid scroll-mt-28 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Layers3 className="h-5 w-5 text-[color:var(--accent-strong)]" />
              十神主轴与结构引擎
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {tenGodCards.map((item) => (
              <section key={item.key} className="rounded-[1.5rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-4">
                <div className="flex items-center gap-3">
                  <span className={`h-3 w-3 rounded-full ${item.accent}`} />
                  <div className="font-semibold text-[color:var(--ink)]">{item.title}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.values.length > 0 ? item.values.map((value) => (
                    <span key={value} className="rounded-full bg-slate-50 px-3 py-1 text-sm font-medium text-[color:var(--ink)]">
                      {value}
                    </span>
                  )) : (
                    <span className="rounded-full bg-slate-50 px-3 py-1 text-sm text-[color:var(--muted)]">显性权重较低</span>
                  )}
                </div>
              </section>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <BookOpen className="h-5 w-5 text-[color:var(--warm)]" />
              推导链与落点
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {reasoningSteps.map((step, index) => (
              <div key={step} className="rounded-[1.5rem] bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">Step {index + 1}</div>
                <div className="mt-2 text-xs leading-6 text-[color:var(--ink)]">{step}</div>
              </div>
            ))}

            <div className="grid gap-4 sm:grid-cols-2">
              <InsightCard label="决策主战场" value={klineInsight.bestTrack} detail="" />
              <InsightCard label="需要收敛的板块" value={klineInsight.riskTrack} detail="" />
              <InsightCard label="顺势条件" value={balanceLevel.title} detail={balanceLevel.description} />
              <InsightCard label="下一年提醒" value={fortune.nextYear || '建议结合下一阶段窗口提前布局'} detail="把下一步提前写成时间窗口，而不是等事件发生后再解释。" />
            </div>
          </CardContent>
        </Card>
      </div>

      {reasoningMode !== 'engine' && (
        <Card id="context" className="scroll-mt-28">
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Compass className="h-5 w-5 text-[color:var(--accent-strong)]" />
              天时地利人和决策面
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {contextBriefs.map((item) => (
                <InsightCard key={item.label} label={item.label} value={item.value} detail={item.detail} />
              ))}
            </div>

            {stateVectorCards.length > 0 && (
              <div className="grid gap-4 md:grid-cols-3">
                {stateVectorCards.map((item) => (
                  <InsightCard key={item.label} label={item.label} value={item.value} detail={item.detail} />
                ))}
              </div>
            )}

            {referenceCards.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {referenceCards.map((item) => (
                  <InsightCard key={item.label} label={item.label} value={item.value} detail={item.detail} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div id="elements" className="grid scroll-mt-28 gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="text-lg">五行力量分布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {elementEntries.map(([key, value]) => {
              const meta = elementMeta[key];
              const Icon = meta.icon;
              return (
                <div key={key}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[color:var(--ink)]">{meta.label}</div>
                        <div className="text-xs text-[color:var(--muted)]">{value?.description || '结构值'}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[color:var(--ink)]">{formatPercent(value?.strength)}</div>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${meta.color}`}
                      style={{ width: `${Math.min(Number(value?.strength || 0), 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="text-lg">五行诊断与补偏</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
            <InsightCard
              label="最强元素"
              value={strongestElement ? `${elementMeta[strongestElement[0]].label} ${formatPercent(strongestElement[1]?.strength)}` : '以全局结构综合判断'}
              detail={strongestElement?.[1]?.description || '当前结构以综合判断为主，强势元素说明会随底层数据完整度提升而更细化。'}
            />
            <InsightCard
              label="最弱元素"
              value={weakestElement ? `${elementMeta[weakestElement[0]].label} ${formatPercent(weakestElement[1]?.strength)}` : '以全局结构综合判断'}
              detail={weakestElement?.[1]?.description || '当前结构以综合判断为主，薄弱元素需要结合阶段节奏与现实反馈继续验证。'}
            />
            <InsightCard label="平衡程度" value={balanceLevel.title} detail={balanceLevel.description} />
            <InsightCard label="有利方向" value={(advice.directions || []).join('、') || '以用神五行延伸判断'} detail="方向只作为环境优化，不替代行动本身。" />
            <InsightCard label="幸运颜色" value={(advice.colors || []).join('、') || '以用神五行延伸判断'} detail="颜色不是玄学装饰，而是对用神五行的日常提醒。" />
            <InsightCard label="幸运数字" value={formatNumberList(advice.numbers)} detail="把抽象用神转成可执行的生活偏好配置。" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Telescope className="h-5 w-5 text-[color:var(--accent-strong)]" />
              大运阶段与人生 K 线引擎
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {currentDayun && (
              <div className="rounded-[1.5rem] bg-[color:var(--accent-soft)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">当前大运</div>
                <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{currentDayun.ganZhi}</div>
                <div className="mt-1 text-sm text-[color:var(--muted)]">
                  {currentDayun.startAge}-{currentDayun.endAge}岁 / {currentDayun.startYear}-{currentDayun.endYear}年
                </div>
                <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">
                  {currentDayun.description}
                  {dayun.currentDayunYear ? ` 当前处于这步大运的第 ${dayun.currentDayunYear} 年。` : ''}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {visibleDayuns.length > 0 ? visibleDayuns.map((item) => (
                <div key={`${item.ganZhi}-${item.startYear}`} className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-lg font-bold text-[color:var(--ink)]">{item.ganZhi}</div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${mapDayunBadge(item.quality)}`}>
                      {mapDayunQuality(item.quality)}
                    </span>
                  </div>
                <div className="mt-2 text-xs text-[color:var(--muted)]">
                  {item.startAge}-{item.endAge}岁 / {item.startYear}-{item.endYear}年
                </div>
                </div>
              )) : (
                <div className="rounded-[1.5rem] bg-slate-50 p-4 text-sm text-[color:var(--muted)]">暂无完整大运序列</div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TrendCard
                title="未来上升更明显"
                value={klineInsight.bestTrack}
                description=""
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <TrendCard
                title="未来需要控节奏"
                value={klineInsight.riskTrack}
                description=""
                icon={<Scale className="h-4 w-4" />}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Sparkles className="h-5 w-5 text-[color:var(--warm)]" />
              神煞与证据层
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {shenSha.summary && (
              <div className="rounded-[1.5rem] bg-slate-50 p-4 text-xs leading-6 text-[color:var(--ink)]">
                {shenSha.summary}
              </div>
            )}

            {shenShaItems.length > 0 && (
              <div className="grid gap-3">
                {shenShaItems.slice(0, 6).map((item) => (
                  <div key={`${item.name}-${item.pillar}`} className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4">
                    <div className="flex items-center gap-3">
                      {item.type === 'auspicious' ? (
                        <BadgeCheck className="h-5 w-5 text-emerald-600" />
                      ) : item.type === 'inauspicious' ? (
                        <BadgeAlert className="h-5 w-5 text-rose-600" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-amber-600" />
                      )}
                      <div className="font-semibold text-[color:var(--ink)]">{item.name}</div>
                      <div className="text-xs text-[color:var(--muted)]">{mapPillarName(item.pillar)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {evidenceStats && (
              <div className="grid gap-3 sm:grid-cols-2">
                <StatTile label="参考样本" value={formatCount(evidenceStats.totalSamples)} />
                <StatTile label="相似案例" value={formatCount(evidenceStats.similarCases)} />
                <StatTile label="成功率" value={formatRate(evidenceStats.successRate)} />
                <StatTile label="平均成事年龄" value={evidenceStats.averageAge ? `${evidenceStats.averageAge}岁` : '以样本节奏继续观察'} />
              </div>
            )}

            {celebrities.length > 0 && (
              <div className="grid gap-3">
                {celebrities.slice(0, 2).map((item) => (
                  <div key={item.name} className="rounded-[1.5rem] bg-slate-50 p-4">
                    <div className="font-semibold text-[color:var(--ink)]">{item.name || '参考案例'}</div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">{(item.similar || []).join('、') || '结构相似'}</div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--ink)]">{item.lesson || '该参考案例已纳入样本，但当前未展开更细的经验拆解。'}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {monthlyWindows.length > 0 && (
        <Card id="windows" className="scroll-mt-28">
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <CalendarClock className="h-5 w-5 text-[color:var(--accent-strong)]" />
              未来 12 个月窗口
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {monthlyWindows.map((item) => (
                <div key={item.key} className="rounded-[1.5rem] border border-[color:var(--line)] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${mapScenarioBadge(item.status)}`}>
                      {mapMonthlyStatus(item.status)}
                    </span>
                  </div>
                  <div className="mt-3 text-xl font-black text-[color:var(--ink)]">{item.score}</div>
                  <div className="mt-1 text-xs text-[color:var(--muted)]">{item.element}月令倾向</div>
                  <div className="mt-3 text-sm font-medium text-[color:var(--ink)]">{item.theme}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {decisionPlaybook.length > 0 && (
        <Card id="playbook" className="scroll-mt-28">
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Sparkles className="h-5 w-5 text-[color:var(--accent-strong)]" />
              决策执行看板
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 xl:grid-cols-2">
              {decisionPlaybook.map((item) => (
                <div key={item.key} className="rounded-[1.75rem] border border-[color:var(--line)] bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">{item.title}</div>
                      <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.bestWindow}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mapPlaybookPriorityBadge(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mapPlaybookStanceBadge(item.stance)}`}>
                        {mapPlaybookStance(item.stance)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InsightCard label="板块评分" value={`${item.score}/100`} detail={item.whyNow} />
                    <InsightCard label="当前动作" value={item.nowAction} detail="" />
                  </div>

                  <div className="mt-4 rounded-[1.5rem] bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">本阶段避免</div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--ink)]">{item.avoidAction}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {yearlyRoadmap.length > 0 && (
        <Card id="roadmap" className="scroll-mt-28">
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Compass className="h-5 w-5 text-[color:var(--accent-strong)]" />
              年度关键决策路线图
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 xl:grid-cols-2">
              {yearlyRoadmap.map((phase) => (
                <div key={phase.key} className="rounded-[1.75rem] border border-[color:var(--line)] bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">{phase.title}</div>
                      <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{phase.timeline}</div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mapScenarioBadge(phase.status)}`}>
                      {mapScenarioStatus(phase.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InsightCard label="阶段评分" value={`${phase.score}/100`} detail={phase.theme} />
                    <InsightCard label="主判断" value={phase.primaryFocus} detail="把阶段策略写成动作语言，而不是抽象好坏。" />
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-[1.5rem] bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">建议动作</div>
                      <div className="mt-3 grid gap-3">
                        {phase.actions.map((item) => (
                          <div key={item} className="rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] bg-slate-50 p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">风险控制</div>
                      <div className="mt-3 grid gap-3">
                        {phase.risks.map((item) => (
                          <div key={item} className="rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {yearlyTrendSnapshots.length > 0 && (
        <Card id="trajectory" className="scroll-mt-28">
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <TrendingUp className="h-5 w-5 text-[color:var(--accent-strong)]" />
              三年趋势总览
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="grid gap-4 xl:grid-cols-3">
              {yearlyTrendSnapshots.map((item) => (
                <div key={item.year} className="rounded-[1.75rem] border border-[color:var(--line)] bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-2xl font-black text-[color:var(--ink)]">{item.year}</div>
                    <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                      {item.overallScore}/100
                    </div>
                  </div>
                  <div className="mt-4 text-xs leading-6 text-[color:var(--ink)]">{item.headline}</div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InsightCard label="最强主线" value={item.dominantTrack} detail="" />
                    <InsightCard label="压力位" value={item.pressureTrack} detail="" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {confidence && (
        <div id="confidence" className="grid scroll-mt-28 gap-6 lg:grid-cols-[1fr_1fr]">
          <Card>
            <CardHeader className="border-b border-[color:var(--line)] pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <ShieldCheck className="h-5 w-5 text-[color:var(--accent-strong)]" />
                可信度判断
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="rounded-[1.75rem] bg-[color:var(--accent-soft)] p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">结构可信度</div>
                <div className="mt-2 text-4xl font-black text-[color:var(--ink)]">{confidence.overallScore}</div>
                <div className="mt-1 text-sm text-[color:var(--muted)]">{mapConfidenceLevel(confidence.level)}</div>
                <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">{confidence.summary}</div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">稳定结论</div>
                  <div className="mt-3 grid gap-3">
                    {confidence.stablePoints.map((item) => (
                      <div key={item} className="rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">敏感结论</div>
                  <div className="mt-3 grid gap-3">
                    {confidence.sensitivePoints.map((item) => (
                      <div key={item} className="rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-[color:var(--line)] pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <Telescope className="h-5 w-5 text-[color:var(--warm)]" />
                时辰敏感度
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="rounded-[1.75rem] bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">时柱影响等级</div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mapSensitivityBadge(confidence.birthTimeSensitivity.level)}`}>
                    {mapSensitivityLevel(confidence.birthTimeSensitivity.level)}
                  </span>
                </div>
                <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">{confidence.birthTimeSensitivity.explanation}</div>
              </div>

              <div className="rounded-[1.75rem] bg-slate-50 p-5">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">最受影响的板块</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {confidence.birthTimeSensitivity.affectedAreas.map((item) => (
                    <span key={item} className="rounded-full bg-white px-3 py-2 text-sm font-medium text-[color:var(--ink)]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {validationInsights && validationInsights.totalLinkedEvents > 0 && (
        <Card id="validation" className="scroll-mt-28">
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <ShieldCheck className="h-5 w-5 text-[color:var(--accent-strong)]" />
              验证与纠偏闭环
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="rounded-[1.75rem] bg-[color:var(--accent-soft)] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">闭环状态</div>
              <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">{validationInsights.summary}</div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <InsightCard label="关联事件" value={String(validationInsights.totalLinkedEvents)} detail="这份报告已经沉淀到现实世界的节点数量。" />
              <InsightCard label="验证准确" value={String(validationInsights.accurateCount)} detail="这些是目前与报告判断相符的事件。" />
              <InsightCard label="出现偏差" value={String(validationInsights.driftCount)} detail="这些事件值得重点做纠偏分析。" />
              <InsightCard label="待验证" value={String(validationInsights.pendingCount)} detail="还需要继续记录结果，不要让判断停在纸面上。" />
            </div>

            <div className="grid gap-3">
              {validationInsights.lessons.map((item) => (
                <div key={item} className="rounded-[1.5rem] bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {correctionInsight && validationInsights && validationInsights.totalLinkedEvents > 0 && (
        <Card id="correction" className="scroll-mt-28">
          <CardHeader className="border-b border-[color:var(--line)] pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Scale className="h-5 w-5 text-[color:var(--warm)]" />
              偏差纠偏策略
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="rounded-[1.75rem] bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">当前级别</div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  correctionInsight.level === 'action'
                    ? 'bg-rose-50 text-rose-700'
                    : correctionInsight.level === 'watch'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {correctionInsight.level === 'action' ? '立即纠偏' : correctionInsight.level === 'watch' ? '持续观察' : '整体健康'}
                </span>
              </div>
              <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">{correctionInsight.summary}</div>
              <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">{correctionInsight.likelyCause}</div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">纠偏动作</div>
                <div className="mt-3 grid gap-3">
                  {correctionInsight.fixes.map((item) => (
                    <div key={item} className="rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">下一步检查点</div>
                <div className="mt-3 grid gap-3">
                  {correctionInsight.checkpoints.map((item) => (
                    <div key={item} className="rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card id="advice" className="scroll-mt-28">
        <CardHeader className="border-b border-[color:var(--line)] pb-4">
          <CardTitle className="text-lg">行动建议与执行顺序</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <AdviceSection
            title="总评"
            accent="bg-[color:var(--accent)]"
            summary={analysis.explanation || '当前报告已完成结构判断，建议结合上方场景、窗口与执行看板一起理解整体结论。'}
          />
          <AdviceSection
            title="事业推进"
            accent="bg-sky-500"
            summary={advice.career?.general || '事业板块建议优先围绕当前阶段节奏、岗位要求与自身强项配置资源。'}
            points={advice.career?.specific || []}
            extra={advice.career?.timing ? `时机把握：${advice.career.timing}` : ''}
            icon={<BriefcaseBusiness className="h-4 w-4" />}
          />
          <AdviceSection
            title="财富配置"
            accent="bg-emerald-500"
            summary={advice.wealth?.general || '财富板块建议优先看现金流安全边界、配置节奏与收益兑现路径。'}
            points={advice.wealth?.specific || []}
            extra={advice.wealth?.timing ? `配置节奏：${advice.wealth.timing}` : ''}
            icon={<Compass className="h-4 w-4" />}
          />
          <AdviceSection
            title="关系经营"
            accent="bg-rose-500"
            summary={advice.marriage?.general || '关系板块建议先看互动节奏、边界感与现实推进条件，再判断是否加速。'}
            points={advice.marriage?.specific || []}
            extra={advice.marriage?.timing ? `关系窗口：${advice.marriage.timing}` : ''}
            icon={<Heart className="h-4 w-4" />}
          />
          <AdviceSection
            title="健康节奏"
            accent="bg-amber-500"
            summary={advice.health?.general || '健康板块建议优先管理透支、恢复效率与长期节奏，不要等问题放大后再处理。'}
            points={advice.health?.specific || []}
            extra={advice.health?.timing ? `养护重点：${advice.health.timing}` : ''}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function MetricTile({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-[1.5rem] border px-4 py-4 ${emphasis ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)]' : 'border-[color:var(--line)] bg-white'}`}>
      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{label}</div>
      <div className={`mt-2 ${emphasis ? 'text-xl' : 'text-base'} font-bold leading-8 text-[color:var(--ink)]`}>{value}</div>
    </div>
  );
}

function InsightCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[1.5rem] bg-slate-50 p-4">
      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{label}</div>
      <div className="mt-2 text-base font-bold leading-7 text-[color:var(--ink)]">{value}</div>
      {detail ? <div className="mt-2 text-xs text-[color:var(--muted)]">{detail}</div> : null}
    </div>
  );
}

function TrendCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {icon}
        {title}
      </div>
      <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{value}</div>
      {description ? <div className="mt-2 text-xs text-[color:var(--muted)]">{description}</div> : null}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] bg-slate-50 p-4">
      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{label}</div>
      <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{value}</div>
    </div>
  );
}

function AdviceSection({
  title,
  accent,
  summary,
  points = [],
  extra = '',
  icon,
}: {
  title: string;
  accent: string;
  summary: string;
  points?: string[];
  extra?: string;
  icon?: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-[color:var(--line)] bg-[color:var(--surface-strong)] p-5 md:p-6">
      <div className="flex items-center gap-3">
        <span className={`h-3 w-3 rounded-full ${accent}`} />
        {icon}
        <h3 className="text-lg font-bold text-[color:var(--ink)]">{title}</h3>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-[color:var(--ink)]">{summary}</p>
      {points.length > 0 && (
        <div className="mt-4 grid gap-3">
          {points.map((item, index) => (
            <div key={`${title}-${index}`} className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
              {item}
            </div>
          ))}
        </div>
      )}
      {extra && <div className="mt-4 rounded-2xl bg-[color:var(--accent-soft)] px-4 py-3 text-sm font-medium text-[color:var(--accent-strong)]">{extra}</div>}
    </section>
  );
}

function dedupeValues(values: string[]) {
  return [...new Set((values || []).filter(Boolean))];
}

function buildRelationshipNotes(relationships?: PillarData['relationships']) {
  const notes: string[] = [];

  if ((relationships?.combination || []).length > 0) {
    notes.push(`有合 ${relationships?.combination?.join('、')}`);
  }
  if ((relationships?.clash || []).length > 0) {
    notes.push(`有冲 ${relationships?.clash?.join('、')}`);
  }
  if ((relationships?.penalty || []).length > 0) {
    notes.push(`有刑 ${relationships?.penalty?.join('、')}`);
  }
  if ((relationships?.harm || []).length > 0) {
    notes.push(`有害 ${relationships?.harm?.join('、')}`);
  }

  return notes;
}

function mapStrengthText(strength?: string) {
  const map: Record<string, string> = {
    strong: '偏强',
    medium: '中和',
    weak: '偏弱',
    excellent: '上等',
    good: '良好',
  };

  return map[strength || ''] || strength || '以结构综合判断';
}

function getBalanceLevel(delta: number) {
  if (delta >= 18) {
    return {
      title: '偏差明显',
      description: '强弱差距较大，现实中更适合主动补偏，而不是任由强项继续失衡扩大。',
    };
  }

  if (delta >= 10) {
    return {
      title: '轻度失衡',
      description: '结构并非失控，但强项和短板已经拉开差距，决策时要避免只顺着惯性走。',
    };
  }

  return {
    title: '相对均衡',
    description: '五行差距不算大，说明命局更考验阶段节奏和外部选择，而不是单点补救。',
  };
}

function formatPercent(value?: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function readContextText(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function readStringList(values: string[] | undefined, fallback: string) {
  return values && values.length > 0 ? values.join('；') : fallback;
}

function readMacroSummary(macroCycles: Record<string, unknown>) {
  const national = macroCycles.nationalCycle as { label?: string } | undefined;
  const economic = macroCycles.economicCycle as { label?: string } | undefined;
  const industries = (macroCycles.industryCycle as Array<{ industry?: string; direction?: string }> | undefined) || [];
  const leadIndustry = industries[0];

  return [
    national?.label,
    economic?.label,
    leadIndustry?.industry
      ? `${leadIndustry.industry}${leadIndustry.direction === 'down' ? '承压' : leadIndustry.direction === 'up' ? '上行' : '分化'}`
      : '',
  ].filter(Boolean).join(' / ') || '当前宏观周期信号待补全';
}

function readGeoSummary(geoClimate: Record<string, unknown>) {
  const currentPlace = geoClimate.currentPlace as string | undefined;
  const tags = (geoClimate.cityEnergyTags as string[] | undefined) || [];
  if (currentPlace && tags.length > 0) {
    return `${currentPlace} / ${tags.slice(0, 2).join('、')}`;
  }
  return currentPlace || '当前地理环境信号待补全';
}

function formatNumberList(values?: number[]) {
  return values && values.length > 0 ? values.join('、') : '以场景需求灵活取用';
}

function formatCount(value?: number) {
  if (!value) return '样本持续积累中';
  return value >= 10000 ? `${Math.round(value / 1000) / 10}万` : `${value}`;
}

function formatRate(value?: number) {
  if (value === undefined || value === null) return '验证数据持续积累中';
  if (value <= 1) return `${Math.round(value * 100)}%`;
  return `${Math.round(value)}%`;
}

function resolveKlineAnchorYear(result: ReportResult) {
  const currentLiuNian = result.fortune?.currentLiuNian || '';
  const liuNianYear = currentLiuNian.match(/\d{4}/)?.[0];
  if (liuNianYear) {
    return Number(liuNianYear);
  }

  const currentDayun = result.dayun?.currentDayun;
  if (currentDayun?.startYear) {
    return currentDayun.startYear;
  }

  const sortedYears = (result.klineData || [])
    .map((item) => item.year)
    .filter((year) => Number.isFinite(year))
    .sort((left, right) => left - right);

  return sortedYears.length > 0 ? sortedYears[Math.max(0, sortedYears.length - 5)] : undefined;
}

function buildKlineInsight(data: Array<{ year: number; career: number; wealth: number; marriage: number; health: number }>, anchorYear?: number) {
  if (!data || data.length === 0) {
    return {
      bestTrack: '以当前阶段为主',
      riskTrack: '先做风险验证',
      bestTrackNote: '趋势数据仍在补齐，现阶段建议以当前大运、流年与现实反馈共同判断主线。',
      riskTrackNote: '趋势数据仍在补齐，涉及高风险决策时更适合先验证、再放大动作。',
    };
  }

  const futureData = anchorYear ? data.filter((item) => item.year >= anchorYear).slice(0, 5) : [];
  const source = futureData.length > 0 ? futureData : data.slice(-5);
  const metrics = [
    { key: 'career', label: '事业' },
    { key: 'wealth', label: '财富' },
    { key: 'marriage', label: '关系' },
    { key: 'health', label: '健康' },
  ] as const;

  const scored = metrics.map((metric) => {
    const values = source.map((item) => item[metric.key]);
    const avg = values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1);
    const slope = values.length > 1 ? values[values.length - 1] - values[0] : 0;
    return {
      ...metric,
      avg,
      slope,
      score: avg + slope * 0.6,
    };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];
  const risk = [...scored].reverse()[0];

  return {
    bestTrack: best ? best.label : '以当前阶段为主',
    riskTrack: risk ? risk.label : '先做风险验证',
    bestTrackNote: best ? `未来几年 ${best.label} 维度平均值更高，且走势更容易形成顺势推进。` : '趋势数据仍在补齐，建议先以当前阶段与现实反馈共同判断主线。',
    riskTrackNote: risk ? `未来几年 ${risk.label} 维度相对偏弱，更适合先稳节奏、降风险、做修正。` : '趋势数据仍在补齐，涉及高风险动作时更适合先验证、再推进。',
  };
}

function buildDecisionSummary({
  patternType,
  currentDaYun,
  strongestElement,
  weakestElement,
  bestTrack,
}: {
  patternType: string;
  currentDaYun: string;
  strongestElement: string;
  weakestElement: string;
  bestTrack: string;
}) {
  const title = bestTrack && !['以当前阶段为主', '先做风险验证'].includes(bestTrack) ? `优先放大${bestTrack}` : '先看结构再行动';
  const description = [
    patternType ? `当前命局以${patternType}为主判断。` : '',
    currentDaYun ? `行运阶段落在${currentDaYun}。` : '',
    strongestElement ? `强项集中在${strongestElement}。` : '',
    weakestElement ? `短板集中在${weakestElement}。` : '',
  ].filter(Boolean).join('');

  return {
    title,
    description: description || '先确认强弱、用忌和行运位置，再决定放大还是收缩。',
  };
}

function mapDayunQuality(quality: DayunInfo['quality']) {
  const map: Record<DayunInfo['quality'], string> = {
    excellent: '上升',
    good: '偏吉',
    neutral: '平稳',
    bad: '偏弱',
    poor: '谨慎',
  };

  return map[quality] || '平稳';
}

function mapDayunBadge(quality: DayunInfo['quality']) {
  const map: Record<DayunInfo['quality'], string> = {
    excellent: 'bg-emerald-50 text-emerald-700',
    good: 'bg-teal-50 text-teal-700',
    neutral: 'bg-slate-100 text-slate-600',
    bad: 'bg-amber-50 text-amber-700',
    poor: 'bg-rose-50 text-rose-700',
  };

  return map[quality] || 'bg-slate-100 text-slate-600';
}

function mapPillarName(pillar: ShenShaInfo['pillar']) {
  const map: Record<ShenShaInfo['pillar'], string> = {
    year: '年柱',
    month: '月柱',
    day: '日柱',
    hour: '时柱',
  };

  return map[pillar] || pillar;
}

function mapScenarioStatus(status: ScenarioView['status']) {
  const map: Record<ScenarioView['status'], string> = {
    push: '主动推进',
    steady: '稳中求进',
    caution: '先控风险',
  };

  return map[status] || '稳中求进';
}

function mapMonthlyStatus(status: MonthlyWindow['status']) {
  const map: Record<MonthlyWindow['status'], string> = {
    push: '推进月',
    steady: '平衡月',
    caution: '观察月',
  };

  return map[status] || '平衡月';
}

function mapScenarioBadge(status: 'push' | 'steady' | 'caution') {
  const map: Record<'push' | 'steady' | 'caution', string> = {
    push: 'bg-emerald-50 text-emerald-700',
    steady: 'bg-amber-50 text-amber-700',
    caution: 'bg-rose-50 text-rose-700',
  };

  return map[status];
}

function mapPlaybookPriorityBadge(priority: DecisionPlaybookItem['priority']) {
  const map: Record<DecisionPlaybookItem['priority'], string> = {
    P1: 'bg-emerald-50 text-emerald-700',
    P2: 'bg-sky-50 text-sky-700',
    P3: 'bg-amber-50 text-amber-700',
    Observe: 'bg-slate-100 text-slate-700',
  };

  return map[priority];
}

function mapPlaybookStanceBadge(stance: DecisionPlaybookItem['stance']) {
  const map: Record<DecisionPlaybookItem['stance'], string> = {
    advance: 'bg-emerald-50 text-emerald-700',
    stabilize: 'bg-sky-50 text-sky-700',
    guard: 'bg-rose-50 text-rose-700',
  };

  return map[stance];
}

function mapPlaybookStance(stance: DecisionPlaybookItem['stance']) {
  const map: Record<DecisionPlaybookItem['stance'], string> = {
    advance: '主动推进',
    stabilize: '稳步推进',
    guard: '优先防守',
  };

  return map[stance];
}

function mapConfidenceLevel(level: ConfidenceAnalysis['level']) {
  const map: Record<ConfidenceAnalysis['level'], string> = {
    high: '高可信度',
    medium: '中等可信度',
    watch: '需结合更多验证',
  };

  return map[level] || '中等可信度';
}

function mapSensitivityLevel(level: ConfidenceAnalysis['birthTimeSensitivity']['level']) {
  const map: Record<ConfidenceAnalysis['birthTimeSensitivity']['level'], string> = {
    low: '低敏感',
    medium: '中敏感',
    high: '高敏感',
  };

  return map[level] || '中敏感';
}

function mapSensitivityBadge(level: ConfidenceAnalysis['birthTimeSensitivity']['level']) {
  const map: Record<ConfidenceAnalysis['birthTimeSensitivity']['level'], string> = {
    low: 'bg-emerald-50 text-emerald-700',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-rose-50 text-rose-700',
  };

  return map[level] || 'bg-amber-50 text-amber-700';
}
