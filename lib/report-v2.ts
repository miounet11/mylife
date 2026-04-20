import type {
  ReportActionBoardSection,
  ReportBlueprintSection,
  ReportCockpitSection,
  ReportCurrentStateSection,
  ReportLifeKLineSection,
  ReportPersonalityBridgeSection,
  ReportScenarioPanelSection,
  ReportTimelineSection,
  ReportV4Sections,
  ReportValidationSection,
} from './report-types';
import type { EventDateKey, EventViewImpact, EventViewType } from './event-view';
import { formatLocalDateKey } from './utils';

type KlinePoint = {
  year: number;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
};

type DayunInfo = {
  quality?: 'excellent' | 'good' | 'neutral' | 'bad' | 'poor';
  ganZhi?: string;
};

type Relationships = {
  combination?: string[];
  clash?: string[];
  penalty?: string[];
  harm?: string[];
};

type ReportV2Input = {
  basic?: {
    dayMaster?: string;
    pillars?: Array<{
      relationships?: Relationships;
    }>;
  };
  analysis?: {
    opening?: string;
    summary?: string;
  };
  pattern?: {
    type?: string;
    description?: string;
  };
  advice?: {
    yongShen?: string[];
    xiShen?: string[];
    jiShen?: string[];
    career?: { general?: string; specific?: string[]; timing?: string; avoid?: string[] };
    wealth?: { general?: string; specific?: string[]; timing?: string; avoid?: string[] };
    marriage?: { general?: string; specific?: string[]; timing?: string };
    health?: { general?: string; specific?: string[]; timing?: string; avoid?: string[] };
  };
  fiveElements?: Partial<Record<'wood' | 'fire' | 'earth' | 'metal' | 'water', { strength?: number }>>;
  fortune?: {
    currentDaYun?: string;
    currentLiuNian?: string;
    interaction?: string;
  };
  klineData?: KlinePoint[] | null;
  dayun?: {
    currentDayun?: DayunInfo | null;
  };
  shenSha?: {
    list?: Array<unknown>;
  };
};

export type ScenarioKey = 'overall' | 'career' | 'wealth' | 'marriage' | 'health';

export interface ScenarioView {
  key: ScenarioKey;
  title: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  status: 'push' | 'steady' | 'caution';
  summary: string;
  focus: string[];
  risks: string[];
  actionLabel: string;
}

export interface MonthlyWindow {
  key: string;
  year: number;
  month: number;
  label: string;
  element: string;
  score: number;
  status: 'push' | 'steady' | 'caution';
  theme: string;
  reason: string;
}

export interface ConfidenceAnalysis {
  overallScore: number;
  level: 'high' | 'medium' | 'watch';
  summary: string;
  stablePoints: string[];
  sensitivePoints: string[];
  birthTimeSensitivity: {
    level: 'low' | 'medium' | 'high';
    explanation: string;
    affectedAreas: string[];
  };
}

export interface ReportActionSuggestion {
  key: string;
  title: string;
  type: EventViewType;
  date: EventDateKey;
  impact: EventViewImpact;
  description: string;
  reason: string;
  reminderAdvanceDays: number;
  source: 'scenario' | 'window';
}

export interface YearlyRoadmapPhase {
  key: string;
  title: string;
  timeline: string;
  score: number;
  status: 'push' | 'steady' | 'caution';
  theme: string;
  primaryFocus: string;
  actions: string[];
  risks: string[];
}

export interface ReportValidationInsights {
  totalLinkedEvents: number;
  accurateCount: number;
  driftCount: number;
  pendingCount: number;
  summary: string;
  lessons: string[];
}

export interface ReportCorrectionInsight {
  level: 'healthy' | 'watch' | 'action';
  summary: string;
  likelyCause: string;
  fixes: string[];
  checkpoints: string[];
}

export interface DecisionPlaybookItem {
  key: string;
  track: ScenarioKey;
  title: string;
  priority: 'P1' | 'P2' | 'P3' | 'Observe';
  score: number;
  stance: 'advance' | 'stabilize' | 'guard';
  bestWindow: string;
  whyNow: string;
  nowAction: string;
  avoidAction: string;
}

export interface YearlyTrendSnapshot {
  year: number;
  overallScore: number;
  dominantTrack: string;
  pressureTrack: string;
  headline: string;
  advice: string;
}

export interface ExpertInterpretationBlock {
  key: string;
  title: string;
  headline: string;
  detail: string;
  tags: string[];
}

type CalendarAnchor = Date | string;

type ReportV4BuilderInput = {
  result: ReportV2Input;
  scenarioViews?: ScenarioView[];
  monthlyWindows?: MonthlyWindow[];
  confidence?: ConfidenceAnalysis | null;
  decisionPlaybook?: DecisionPlaybookItem[];
  actionSuggestions?: ReportActionSuggestion[];
  validationInsights?: ReportValidationInsights | null;
  correctionInsight?: ReportCorrectionInsight | null;
  stateVector?: {
    current?: {
      tianShi: number;
      diLi: number;
      renHe: number;
    };
  } | null;
  expertInterpretation?: ExpertInterpretationBlock[];
  yearlyTrendSnapshots?: YearlyTrendSnapshot[];
};

export function buildScenarioViews(result: ReportV2Input): ScenarioView[] {
  const futurePoints = getFutureKlineSource(result.klineData || []);
  const patternType = result.pattern?.type || '当前命局';
  const currentDaYun = result.fortune?.currentDaYun || '当前阶段';
  const scenarios: Array<{
    key: ScenarioKey;
    title: string;
    metric: keyof KlinePoint | 'overall';
    summary: string;
    focus: string[];
    risks: string[];
  }> = [
    {
      key: 'overall',
      title: '综合版',
      metric: 'overall',
      summary: `${patternType}是当前主判断，${currentDaYun}决定了未来一段时间的总体节奏。`,
      focus: [
        result.fortune?.interaction || '先看结构，再看阶段，再决定放大还是收缩。',
        `用神以${(result.advice?.yongShen || []).join('、') || '当前结构综合判断'}为主。`,
      ],
      risks: [
        `忌神为${(result.advice?.jiShen || []).join('、') || '现实反馈持续校正'}，短期决策避免逆势硬推。`,
      ],
    },
    {
      key: 'career',
      title: '事业版',
      metric: 'career',
      summary: result.advice?.career?.general || '事业看结构是否支撑长期推进，也看当前阶段是否适合主动争取。',
      focus: compactList(result.advice?.career?.specific, result.advice?.career?.timing),
      risks: compactList(result.advice?.career?.avoid),
    },
    {
      key: 'wealth',
      title: '财富版',
      metric: 'wealth',
      summary: result.advice?.wealth?.general || '财富不只看赚钱能力，也看节奏、配置与风险控制。',
      focus: compactList(result.advice?.wealth?.specific, result.advice?.wealth?.timing),
      risks: compactList(result.advice?.wealth?.avoid),
    },
    {
      key: 'marriage',
      title: '婚恋版',
      metric: 'marriage',
      summary: result.advice?.marriage?.general || '关系板块更看节奏与互动质量，不适合只看单点好坏。',
      focus: compactList(result.advice?.marriage?.specific, result.advice?.marriage?.timing),
      risks: ['婚恋、关系与合作信息对时柱更敏感，判断时更需要结合真实经历。'],
    },
    {
      key: 'health',
      title: '健康版',
      metric: 'health',
      summary: result.advice?.health?.general || '健康板块重点不在恐吓，而在提前调整负荷与作息节奏。',
      focus: compactList(result.advice?.health?.specific, result.advice?.health?.timing),
      risks: compactList(result.advice?.health?.avoid),
    },
  ];

  return scenarios.map((scenario) => {
    const metricSeries = scenario.metric === 'overall'
      ? futurePoints.map((point) => average([point.career, point.wealth, point.marriage, point.health]))
      : futurePoints.map((point) => {
          const metric = scenario.metric as Exclude<typeof scenario.metric, 'overall'>;
          return point[metric];
        });
    const first = metricSeries[0] ?? 60;
    const last = metricSeries[metricSeries.length - 1] ?? first;
    const avgScore = Math.round(average(metricSeries));
    const trend = last - first >= 6 ? 'up' : first - last >= 6 ? 'down' : 'stable';
    const status = avgScore >= 72 ? 'push' : avgScore >= 58 ? 'steady' : 'caution';

    return {
      key: scenario.key,
      title: scenario.title,
      score: avgScore,
      trend,
      status,
      summary: scenario.summary,
      focus: ensureFallback(scenario.focus, '当前还没有更多细分建议，可先看总评与行运交互。'),
      risks: ensureFallback(scenario.risks, '这一板块暂未返回明确风险项，仍建议结合真实节奏保守推进。'),
      actionLabel: mapScenarioActionLabel(status, scenario.title),
    };
  });
}

export function buildMonthlyWindows(result: ReportV2Input, startDate: CalendarAnchor = new Date()): MonthlyWindow[] {
  const favored = [...(result.advice?.yongShen || []), ...(result.advice?.xiShen || [])];
  const avoided = result.advice?.jiShen || [];
  const source = getFutureKlineSource(result.klineData || []);
  const baseOverall = source.length > 0
    ? average(source.map((point) => average([point.career, point.wealth, point.marriage, point.health])))
    : 60;
  const dayunModifier = mapDayunModifier(result.dayun?.currentDayun?.quality);
  const windows: MonthlyWindow[] = [];
  const { year: startYear, month: startMonth } = resolveCalendarAnchor(startDate);

  for (let offset = 0; offset < 12; offset++) {
    const date = new Date(startYear, startMonth + offset, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const element = mapMonthElement(month);
    const monthlySeed = hashString(`${year}-${month}-${(result.pattern?.type || '')}-${(favored || []).join(',')}`);
    const randomDrift = (monthlySeed % 11) - 5;
    const favorableBoost = favored.includes(element) ? 8 : 0;
    const avoidPenalty = avoided.includes(element) ? -8 : 0;
    const score = clamp(Math.round(baseOverall + dayunModifier + favorableBoost + avoidPenalty + randomDrift), 38, 92);
    const status = score >= 72 ? 'push' : score >= 58 ? 'steady' : 'caution';
    const theme = buildMonthlyTheme(result, year, month);
    const reason = buildMonthlyReason({ element, favored, avoided, status, currentDaYun: result.fortune?.currentDaYun || '' });

    windows.push({
      key: `${year}-${String(month).padStart(2, '0')}`,
      year,
      month,
      label: `${year}.${String(month).padStart(2, '0')}`,
      element,
      score,
      status,
      theme,
      reason,
    });
  }

  return windows;
}

export function buildConfidenceAnalysis(result: ReportV2Input): ConfidenceAnalysis {
  const pillars = result.basic?.pillars || [];
  const completeFields = [
    pillars.length === 4,
    !!result.pattern?.type,
    !!(result.advice?.yongShen || []).length,
    !!result.fortune?.currentDaYun,
    !!result.dayun?.currentDayun,
    !!(result.klineData || []).length,
    !!(result.shenSha?.list || []).length,
  ].filter(Boolean).length;
  const completenessScore = Math.round((completeFields / 7) * 45);
  const fiveElementSpread = getFiveElementSpread(result.fiveElements || {});
  const structureScore = clamp(20 + Math.round(Math.min(fiveElementSpread, 20)), 18, 30);
  const trendScore = (result.klineData || []).length > 0 ? 15 : 6;
  const overallScore = clamp(completenessScore + structureScore + trendScore + 10, 45, 95);
  const level = overallScore >= 80 ? 'high' : overallScore >= 65 ? 'medium' : 'watch';

  const hourRelations = pillars[3]?.relationships;
  const sensitivityIndex = [
    (hourRelations?.clash || []).length,
    (hourRelations?.penalty || []).length,
    (hourRelations?.harm || []).length,
  ].reduce((sum, value) => sum + value, 0);
  const birthTimeLevel = sensitivityIndex >= 2 ? 'high' : sensitivityIndex === 1 ? 'medium' : 'low';

  return {
    overallScore,
    level,
    summary: overallScore >= 80
      ? '这份报告的核心结构判断较稳定，适合作为中长期参考基线。'
      : overallScore >= 65
        ? '这份报告的核心结构可用，但短期节奏判断更适合结合真实事件复核。'
        : '这份报告可作为参考起点，但更建议结合出生时间核对与后续事件验证。',
    stablePoints: ensureFallback([
      result.pattern?.type ? `格局判断以${result.pattern.type}为核心，这部分稳定性最高。` : '',
      (result.advice?.yongShen || []).length > 0 ? `用神集中在${result.advice?.yongShen?.join('、')}，这会持续影响决策偏好。` : '',
      result.fortune?.currentDaYun ? `当前大运已明确落在${result.fortune.currentDaYun}。` : '',
      fiveElementSpread > 0 ? `五行强弱差已形成，结构补偏方向较清晰。` : '',
    ], '当前稳定结论尚未完全展开，建议优先参考格局、用神和当前大运。'),
    sensitivePoints: ensureFallback([
      '月度窗口和短期推进节奏，比长期格局更依赖实时阶段判断。',
      '婚恋、合作、子女、晚景相关信息对时柱更敏感。',
      birthTimeLevel !== 'low' ? '当前时柱关系较活跃，出生时间偏差会影响部分细节结论。' : '',
    ], '当前敏感项较少，但短期时机判断仍建议结合真实情况复核。'),
    birthTimeSensitivity: {
      level: birthTimeLevel,
      explanation: birthTimeLevel === 'high'
        ? '时柱关系较复杂，若出生时间前后有偏差，婚恋、子女、晚年和短期窗口判断更可能变化。'
        : birthTimeLevel === 'medium'
          ? '时柱存在一定交互，核心格局通常不变，但细节时机判断会受到影响。'
          : '时柱关系相对平稳，核心判断较稳定，短期节奏仍建议结合实际事件验证。',
      affectedAreas: birthTimeLevel === 'high'
        ? ['婚恋关系', '短期窗口', '合作节奏', '晚年走势']
        : birthTimeLevel === 'medium'
          ? ['婚恋关系', '短期窗口', '合作节奏']
          : ['短期窗口', '阶段节奏'],
    },
  };
}

export function buildReportActionSuggestions(
  result: ReportV2Input & {
    scenarioViews?: ScenarioView[];
    monthlyWindows?: MonthlyWindow[];
  },
  startDate: CalendarAnchor = new Date()
): ReportActionSuggestion[] {
  const scenarios = (result.scenarioViews || buildScenarioViews(result))
    .filter((item) => item.key !== 'overall');
  const windows = result.monthlyWindows || buildMonthlyWindows(result, startDate);
  const sortedWindows = [...windows].sort((left, right) => right.score - left.score);
  const strongestScenario = [...scenarios].sort((left, right) => right.score - left.score)[0];
  const cautionScenario = [...scenarios]
    .filter((item) => item.status === 'caution')
    .sort((left, right) => left.score - right.score)[0];
  const bestWindow = sortedWindows[0];
  const riskWindow = [...windows].sort((left, right) => left.score - right.score)[0];
  const suggestions: ReportActionSuggestion[] = [];

  if (bestWindow && strongestScenario) {
    suggestions.push({
      key: `window-${bestWindow.key}-${strongestScenario.key}`,
      title: `${bestWindow.label} ${mapTrackLabel(strongestScenario.key)}推进窗口`,
      type: mapScenarioToEventType(strongestScenario.key),
      date: `${bestWindow.key}-01`,
      impact: bestWindow.status === 'caution' ? 'neutral' : 'positive',
      description: `${bestWindow.theme}，适合围绕${mapTrackLabel(strongestScenario.key)}安排关键动作或确认节点。`,
      reason: `${bestWindow.reason} ${strongestScenario.summary}`,
      reminderAdvanceDays: 7,
      source: 'window',
    });
  }

  if (riskWindow) {
    const riskScenario = cautionScenario || strongestScenario;
    suggestions.push({
      key: `risk-${riskWindow.key}-${riskScenario?.key || 'overall'}`,
      title: `${riskWindow.label} 节奏风控检查`,
      type: mapScenarioToEventType(riskScenario?.key || 'overall'),
      date: `${riskWindow.key}-01`,
      impact: 'negative',
      description: `${riskWindow.theme}阶段更适合复盘、减仓、降噪或延后高风险决定。`,
      reason: `${riskWindow.reason} ${(riskScenario?.risks || []).slice(0, 1).join('') || '这一阶段优先控制风险。'}`,
      reminderAdvanceDays: 10,
      source: 'window',
    });
  }

  if (strongestScenario) {
    const anchorDate = bestWindow ? `${bestWindow.key}-01` : formatDateKey(startDate);
    suggestions.push({
      key: `scenario-${strongestScenario.key}`,
      title: `${strongestScenario.title} 关键动作复盘`,
      type: mapScenarioToEventType(strongestScenario.key),
      date: anchorDate,
      impact: strongestScenario.status === 'caution' ? 'neutral' : 'positive',
      description: `${strongestScenario.actionLabel}，适合提前记录目标、动作和验证结果。`,
      reason: [...strongestScenario.focus, ...strongestScenario.risks].slice(0, 2).join(' '),
      reminderAdvanceDays: 5,
      source: 'scenario',
    });
  }

  return dedupeActionSuggestions(suggestions).slice(0, 3);
}

export function buildYearlyRoadmap(
  result: ReportV2Input & {
    scenarioViews?: ScenarioView[];
    monthlyWindows?: MonthlyWindow[];
  },
  startDate: CalendarAnchor = new Date()
): YearlyRoadmapPhase[] {
  const scenarios = (result.scenarioViews || buildScenarioViews(result)).filter((item) => item.key !== 'overall');
  const windows = result.monthlyWindows || buildMonthlyWindows(result, startDate);
  const strongestScenario = [...scenarios].sort((left, right) => right.score - left.score)[0];
  const weakestScenario = [...scenarios].sort((left, right) => left.score - right.score)[0];
  const phases: YearlyRoadmapPhase[] = [];

  for (let index = 0; index < 4; index++) {
    const segment = windows.slice(index * 3, index * 3 + 3);
    if (segment.length === 0) {
      continue;
    }

    const score = Math.round(average(segment.map((item) => item.score)));
    const status = score >= 72 ? 'push' : score >= 58 ? 'steady' : 'caution';
    const bestMonth = [...segment].sort((left, right) => right.score - left.score)[0];
    const worstMonth = [...segment].sort((left, right) => left.score - right.score)[0];
    const referenceScenario = status === 'caution' ? weakestScenario || strongestScenario : strongestScenario || weakestScenario;

    phases.push({
      key: `phase-${index + 1}`,
      title: `第 ${index + 1} 阶段`,
      timeline: `${segment[0].label} - ${segment[segment.length - 1].label}`,
      score,
      status,
      theme: bestMonth?.theme || '阶段推进',
      primaryFocus: referenceScenario?.actionLabel || '先稳结构，再推进关键动作',
      actions: ensureFallback(
        [
          referenceScenario?.focus?.[0] || '',
          bestMonth ? `优先围绕 ${bestMonth.label} 的“${bestMonth.theme}”安排关键动作。` : '',
          status === 'caution'
            ? '减少并行战线，把验证和纠偏放在推进之前。'
            : status === 'steady'
              ? '控制推进节奏，先把最关键的一件事做成。'
              : '适合主动争取、签约、确认节点或放大既有优势。',
        ],
        '当前阶段仍建议围绕主判断有节奏地推进。'
      ).slice(0, 3),
      risks: ensureFallback(
        [
          worstMonth ? `${worstMonth.label} 需要额外谨慎：${worstMonth.reason}` : '',
          ...(referenceScenario?.risks || []).slice(0, 2),
        ],
        '当前阶段未见额外放大的风险信号，但仍建议结合真实节奏持续复核。'
      ).slice(0, 3),
    });
  }

  return phases;
}

export function buildReportValidationInsights(
  linkedEvents: Array<{
    title?: string;
    userFeedback?: { wasAccurate?: boolean; userNotes?: string };
    fortuneAnalysis?: { reason?: string };
  }>
): ReportValidationInsights {
  const accurateCount = linkedEvents.filter((item) => item.userFeedback?.wasAccurate === true).length;
  const driftCount = linkedEvents.filter((item) => item.userFeedback?.wasAccurate === false).length;
  const pendingCount = Math.max(linkedEvents.length - accurateCount - driftCount, 0);
  const lessons = ensureFallback(
    [
      driftCount > 0 ? '已出现偏差的事件，优先回看时机判断、执行偏差和出生时辰敏感度。' : '',
      accurateCount > 0 ? '已经验证准确的事件，适合作为后续阶段判断的参考样本。' : '',
      pendingCount > 0 ? '仍有待验证事件，建议继续记录结果，不要只停留在结论层。' : '',
      ...linkedEvents
        .filter((item) => !!item.userFeedback?.userNotes)
        .slice(0, 2)
        .map((item) => item.userFeedback?.userNotes || ''),
    ],
    '当前还没有关联验证数据，先把关键窗口期与现实节点存成事件。'
  ).slice(0, 4);

  let summary = '当前还没有关联验证数据，建议先把关键窗口期和现实节点沉淀为事件。';
  if (linkedEvents.length > 0) {
    summary = `这份报告当前关联 ${linkedEvents.length} 个事件，其中准确 ${accurateCount} 个，偏差 ${driftCount} 个，待验证 ${pendingCount} 个。`;
  }

  return {
    totalLinkedEvents: linkedEvents.length,
    accurateCount,
    driftCount,
    pendingCount,
    summary,
    lessons,
  };
}

export function buildReportCorrectionInsight(params: {
  validationInsights?: ReportValidationInsights | null;
  confidence?: ConfidenceAnalysis | null;
  scenarioViews?: ScenarioView[];
  monthlyWindows?: MonthlyWindow[];
}): ReportCorrectionInsight {
  const validation = params.validationInsights;
  const confidence = params.confidence;
  const scenarios = params.scenarioViews || [];
  const windows = params.monthlyWindows || [];
  const weakestScenario = [...scenarios]
    .filter((item) => item.key !== 'overall')
    .sort((left, right) => left.score - right.score)[0];
  const riskyWindow = [...windows].sort((left, right) => left.score - right.score)[0];
  const driftCount = validation?.driftCount || 0;
  const pendingCount = validation?.pendingCount || 0;
  const level: ReportCorrectionInsight['level'] = driftCount >= 2
    ? 'action'
    : driftCount === 1 || (confidence?.level === 'watch' && pendingCount > 0)
      ? 'watch'
      : 'healthy';

  let likelyCause = '当前验证状态整体健康，优先继续积累更多真实事件，不要过早下结论。';
  if (level === 'action') {
    likelyCause = confidence?.birthTimeSensitivity.level === 'high'
      ? '偏差更可能来自时辰敏感导致的细节时机变化，需要优先复核出生时间。'
      : weakestScenario
        ? `偏差更可能集中在${weakestScenario.title}板块的时机判断或执行偏差，而不是整份报告全部失效。`
        : '偏差更可能来自短期时机判断与现实执行节奏不一致。';
  } else if (level === 'watch') {
    likelyCause = riskyWindow
      ? `${riskyWindow.label} 本身就是低分窗口，若这里出现偏差，优先从阶段节奏和动作选择上纠偏。`
      : '目前更像是局部偏差，建议继续记录验证结果再下更强判断。';
  }

  const fixes = ensureFallback(
    [
      confidence?.birthTimeSensitivity.level === 'high' ? '先核对出生时间是否有前后误差，再看婚恋、合作和短期窗口判断。' : '',
      weakestScenario ? `优先回看 ${weakestScenario.title} 的推进动作，拆开“判断是否错”和“执行是否跑偏”。` : '',
      riskyWindow ? `对于 ${riskyWindow.label} 这类低分窗口，先做复盘和减法，不要继续硬推高风险决定。` : '',
      driftCount > 0 ? '把已出现偏差的事件补充复盘备注，形成可继续训练的真实样本。' : '',
    ],
    '继续沉淀事件样本，用更多真实结果来验证报告判断。'
  ).slice(0, 4);

  const checkpoints = ensureFallback(
    [
      riskyWindow ? `下一个重点复核节点：${riskyWindow.label}` : '',
      validation && validation.pendingCount > 0 ? `还有 ${validation.pendingCount} 个事件待验证，优先补回结果。` : '',
      confidence?.level === 'watch' ? '当前报告可信度偏观察级，所有短期时机判断都应结合现实事件复核。' : '',
      weakestScenario ? `${weakestScenario.title} 是当前最需要重点校验的板块。` : '',
    ],
    '先继续记录更多事件，再进入下一轮纠偏。'
  ).slice(0, 4);

  return {
    level,
    summary: level === 'action'
      ? '这份报告已经出现明确偏差，当前最重要的不是继续看更多内容，而是先做结构化纠偏。'
      : level === 'watch'
        ? '这份报告已有轻度偏差迹象，适合边记录、边复核、边调整动作节奏。'
        : '当前验证状态整体稳定，说明报告主判断仍可继续作为行动基线。',
    likelyCause,
    fixes,
    checkpoints,
  };
}

export function buildDecisionPlaybook(
  result: ReportV2Input & {
    scenarioViews?: ScenarioView[];
    monthlyWindows?: MonthlyWindow[];
  },
  startDate = new Date()
): DecisionPlaybookItem[] {
  const scenarios = (result.scenarioViews || buildScenarioViews(result))
    .filter((item) => item.key !== 'overall')
    .sort((left, right) => right.score - left.score);
  const windows = result.monthlyWindows || buildMonthlyWindows(result, startDate);
  const bestWindow = [...windows].sort((left, right) => right.score - left.score)[0];
  const stableWindow = [...windows]
    .filter((item) => item.status !== 'caution')
    .sort((left, right) => right.score - left.score)[0];
  const riskWindow = [...windows].sort((left, right) => left.score - right.score)[0];

  return scenarios.map((scenario, index) => {
    const priority: DecisionPlaybookItem['priority'] = index === 0 ? 'P1' : index === 1 ? 'P2' : index === 2 ? 'P3' : 'Observe';
    const stance: DecisionPlaybookItem['stance'] = scenario.status === 'push'
      ? 'advance'
      : scenario.status === 'steady'
        ? 'stabilize'
        : 'guard';
    const recommendedWindow = scenario.status === 'caution'
      ? riskWindow
      : scenario.status === 'steady'
        ? stableWindow || bestWindow || riskWindow
        : bestWindow || stableWindow || riskWindow;
    const focusLine = scenario.focus[0] || scenario.summary;
    const riskLine = scenario.risks[0] || '当前板块仍建议先记录结果，再做更大动作。';

    return {
      key: `playbook-${scenario.key}`,
      track: scenario.key,
      title: `${mapTrackLabel(scenario.key)}操作剧本`,
      priority,
      score: scenario.score,
      stance,
      bestWindow: recommendedWindow?.label || formatDateKey(startDate).slice(0, 7).replace('-', '.'),
      whyNow: `${scenario.summary} ${recommendedWindow ? `参考窗口 ${recommendedWindow.label}。` : ''}`.trim(),
      nowAction: scenario.status === 'push'
        ? `${focusLine} 当前更适合主动推进、确认节点或把资源向这一板块集中。`
        : scenario.status === 'steady'
          ? `${focusLine} 当前更适合先做一件最关键的事，逐步验证后再放大。`
          : `${focusLine} 当前更适合减并行、做复盘、先修正动作再决定要不要继续。`,
      avoidAction: riskLine,
    };
  }).slice(0, 4);
}

export function buildYearlyTrendSnapshots(result: ReportV2Input): YearlyTrendSnapshot[] {
  const source = getFutureKlineSource(result.klineData || []).slice(0, 3);
  const fallbackSource = (result.klineData || []).slice(-3);
  const snapshots = (source.length > 0 ? source : fallbackSource).map((point) => {
    const entries = [
      { label: '事业', value: point.career },
      { label: '财富', value: point.wealth },
      { label: '关系', value: point.marriage },
      { label: '健康', value: point.health },
    ].sort((left, right) => right.value - left.value);
    const dominant = entries[0];
    const pressure = entries[entries.length - 1];
    const overallScore = Math.round(average(entries.map((item) => item.value)));

    return {
      year: point.year,
      overallScore,
      dominantTrack: dominant.label,
      pressureTrack: pressure.label,
      headline: overallScore >= 74
        ? `${point.year} 更适合主动布局 ${dominant.label}，把增长做实。`
        : overallScore >= 62
          ? `${point.year} 是稳步推进年，重点在 ${dominant.label}，不要同时拉太多战线。`
          : `${point.year} 先稳结构，重点防守 ${pressure.label} 板块的波动。`,
      advice: overallScore >= 74
        ? `${dominant.label} 是最强项，适合争取节点；${pressure.label} 仍要留出风控缓冲。`
        : overallScore >= 62
          ? `${dominant.label} 可以推进，但更适合分段验证；${pressure.label} 不宜硬推。`
          : `${pressure.label} 是主要压力位，先降噪减法，再围绕 ${dominant.label} 保持最小推进。`,
    };
  });

  return snapshots;
}

export function buildExpertInterpretation(result: ReportV2Input & {
  scenarioViews?: ScenarioView[];
  monthlyWindows?: MonthlyWindow[];
  confidence?: ConfidenceAnalysis | null;
}): ExpertInterpretationBlock[] {
  const scenarios = (result.scenarioViews || buildScenarioViews(result)).filter((item) => item.key !== 'overall');
  const strongestScenario = [...scenarios].sort((left, right) => right.score - left.score)[0];
  const weakestScenario = [...scenarios].sort((left, right) => left.score - right.score)[0];
  const windows = result.monthlyWindows || buildMonthlyWindows(result);
  const bestWindow = [...windows].sort((left, right) => right.score - left.score)[0];
  const riskWindow = [...windows].sort((left, right) => left.score - right.score)[0];
  const confidence = result.confidence || buildConfidenceAnalysis(result);
  const favored = [...(result.advice?.yongShen || []), ...(result.advice?.xiShen || [])].filter(Boolean);
  const avoided = (result.advice?.jiShen || []).filter(Boolean);

  return [
    {
      key: 'structure_anchor',
      title: '结构原点',
      headline: `${result.pattern?.type || '当前命局'} 是整份报告的判断轴心。`,
      detail: [
        result.pattern?.description || '',
        favored.length > 0 ? `用神/喜神更偏向 ${favored.join('、')}。` : '',
        avoided.length > 0 ? `决策上尤其要防 ${avoided.join('、')} 的失衡放大。` : '',
      ].filter(Boolean).join(' '),
      tags: ensureFallback([
        result.basic?.dayMaster ? `日主 ${result.basic.dayMaster}` : '',
        result.pattern?.type || '',
        favored.length > 0 ? `用神 ${favored.join('、')}` : '',
      ], '结构判断'),
    },
    {
      key: 'timing_anchor',
      title: '阶段判断',
      headline: `${result.fortune?.currentDaYun || '当前阶段'} 决定了这几年更该怎么走。`,
      detail: [
        result.fortune?.interaction || '',
        bestWindow ? `当前最顺手的短期窗口在 ${bestWindow.label}。` : '',
        riskWindow ? `最需要控节奏的窗口在 ${riskWindow.label}。` : '',
      ].filter(Boolean).join(' '),
      tags: ensureFallback([
        result.fortune?.currentDaYun || '',
        result.fortune?.currentLiuNian || '',
        bestWindow ? `窗口 ${bestWindow.label}` : '',
      ], '阶段节奏'),
    },
    {
      key: 'main_contradiction',
      title: '当前主要矛盾',
      headline: strongestScenario && weakestScenario
        ? `最值得放大的板块是 ${mapTrackLabel(strongestScenario.key)}，最需要控制的是 ${mapTrackLabel(weakestScenario.key)}。`
        : '当前最重要的是先把结构与阶段判断接到现实动作上。',
      detail: [
        strongestScenario ? strongestScenario.summary : '',
        weakestScenario ? `但 ${mapTrackLabel(weakestScenario.key)} 板块更容易成为现实阻力，需要提前留缓冲。` : '',
      ].filter(Boolean).join(' '),
      tags: ensureFallback([
        strongestScenario ? `主线 ${mapTrackLabel(strongestScenario.key)}` : '',
        weakestScenario ? `压力位 ${mapTrackLabel(weakestScenario.key)}` : '',
        strongestScenario ? strongestScenario.actionLabel : '',
      ], '板块取舍'),
    },
    {
      key: 'execution_rule',
      title: '执行原则',
      headline: confidence.level === 'high'
        ? '这份报告适合拿来做中长期基线，但短期动作仍然要看窗口。'
        : confidence.level === 'medium'
          ? '这份报告可用，但要边推进边验证，不适合一次押满。'
          : '这份报告更适合作为起点，所有短期结论都应该先小步验证。',
      detail: [
        confidence.summary,
        confidence.birthTimeSensitivity.level !== 'low'
          ? `时辰敏感度为 ${confidence.birthTimeSensitivity.level}，婚恋、合作和短期窗口更要留出复核空间。`
          : '',
      ].filter(Boolean).join(' '),
      tags: ensureFallback([
        `可信度 ${confidence.level}`,
        `时辰敏感 ${confidence.birthTimeSensitivity.level}`,
      ], '执行原则'),
    },
  ];
}

export function buildReportCockpitSection(params: ReportV4BuilderInput): ReportCockpitSection {
  const scenarios = params.scenarioViews || buildScenarioViews(params.result);
  const windows = params.monthlyWindows || buildMonthlyWindows(params.result);
  const confidence = params.confidence || buildConfidenceAnalysis(params.result);
  const playbook = params.decisionPlaybook || buildDecisionPlaybook({
    ...params.result,
    scenarioViews: scenarios,
    monthlyWindows: windows,
  });
  const strongestScenario = scenarios.find((item) => item.key !== 'overall') || scenarios[0];
  const bestWindow = [...windows].sort((left, right) => right.score - left.score)[0];
  const riskWindow = [...windows].sort((left, right) => left.score - right.score)[0];
  const favored = compactUniqueLines([
    ...(params.result.advice?.yongShen || []),
    ...(params.result.advice?.xiShen || []),
  ], 3);

  return {
    headline: compactSentence(params.result.analysis?.opening || strongestScenario?.summary || '先看结构主轴，再决定当前动作节奏。', 54),
    judgment: compactSentence(playbook[0]?.whyNow || strongestScenario?.summary || '', 88),
    stageLabel: params.result.fortune?.currentDaYun || confidence.summary,
    identityLabel: compactSentence(params.result.pattern?.type || params.result.basic?.dayMaster || '', 36),
    confidenceLabel: `${mapConfidenceLabel(confidence.level)} · ${confidence.overallScore}`,
    topActions: compactUniqueLines([
      playbook[0]?.nowAction,
      ...(params.actionSuggestions || []).map((item) => item.description),
      strongestScenario?.actionLabel,
    ], 3),
    avoidances: compactUniqueLines([
      playbook[0]?.avoidAction,
      ...(confidence.sensitivePoints || []),
      riskWindow ? `${riskWindow.label} 优先控节奏。` : '',
    ], 3),
    focusChips: compactUniqueLines([
      params.result.pattern?.type,
      strongestScenario ? `${mapTrackLabel(strongestScenario.key)}主线` : '',
      ...favored.map((item) => `${item}顺势`),
    ], 4),
    periodCards: compactPeriodCards([
      bestWindow ? {
        label: '最近顺风窗口',
        value: bestWindow.label,
        tone: bestWindow.status,
        note: compactSentence(bestWindow.theme, 28),
      } : null,
      riskWindow ? {
        label: '需要控风险',
        value: riskWindow.label,
        tone: riskWindow.status,
        note: compactSentence(riskWindow.reason, 34),
      } : null,
      strongestScenario ? {
        label: '当前主战场',
        value: mapTrackLabel(strongestScenario.key),
        tone: strongestScenario.status,
        note: compactSentence(strongestScenario.actionLabel, 30),
      } : null,
    ]),
  };
}

export function buildReportLifeKLineSection(params: ReportV4BuilderInput): ReportLifeKLineSection {
  const snapshots = params.yearlyTrendSnapshots || buildYearlyTrendSnapshots(params.result);
  const latest = snapshots[0];
  const current = params.stateVector?.current;

  return {
    headline: latest ? `${latest.year} - ${latest.year + 2} 长弧线` : '人生长弧线',
    summary: compactSentence(latest?.headline || params.result.fortune?.interaction || '', 88),
    arcLabel: compactSentence(latest?.advice || '', 60),
    latestMetrics: [
      current ? { label: '天时', value: current.tianShi.toFixed(1), tone: mapMetricTone(current.tianShi) } : null,
      current ? { label: '地利', value: current.diLi.toFixed(1), tone: mapMetricTone(current.diLi) } : null,
      current ? { label: '人和', value: current.renHe.toFixed(1), tone: mapMetricTone(current.renHe) } : null,
      latest ? { label: '主导板块', value: latest.dominantTrack, tone: 'strong' as const } : null,
    ].filter(Boolean) as ReportLifeKLineSection['latestMetrics'],
  };
}

export function buildReportBlueprintSection(params: ReportV4BuilderInput): ReportBlueprintSection {
  const expert = params.expertInterpretation || buildExpertInterpretation({
    ...params.result,
    scenarioViews: params.scenarioViews,
    monthlyWindows: params.monthlyWindows,
    confidence: params.confidence,
  });
  const strongestScenario = (params.scenarioViews || buildScenarioViews(params.result)).find((item) => item.key !== 'overall');
  const weakestScenario = [...(params.scenarioViews || buildScenarioViews(params.result))]
    .filter((item) => item.key !== 'overall')
    .sort((left, right) => left.score - right.score)[0];
  const favored = compactUniqueLines([
    ...(params.result.advice?.yongShen || []),
    ...(params.result.advice?.xiShen || []),
  ], 3);

  return {
    typeLabel: params.result.pattern?.type,
    strongestAdvantage: compactSentence(strongestScenario?.summary || expert[0]?.headline || '', 56),
    recurringRisk: compactSentence(weakestScenario?.risks?.[0] || expert[2]?.detail || '', 56),
    usefulDirection: compactSentence(favored.length > 0 ? `优先放大 ${favored.join('、')} 对应动作。` : expert[1]?.headline || '', 56),
    unsuitablePattern: compactSentence((params.result.advice?.jiShen || []).length > 0 ? `避免 ${params.result.advice?.jiShen?.join('、')} 失衡放大。` : weakestScenario?.actionLabel || '', 56),
    facts: compactUniqueLines([
      expert[0]?.headline,
      expert[1]?.headline,
      params.result.basic?.dayMaster ? `日主 ${params.result.basic.dayMaster}` : '',
      favored.length > 0 ? `顺势元素 ${favored.join('、')}` : '',
    ], 4),
  };
}

export function buildReportCurrentStateSection(params: ReportV4BuilderInput): ReportCurrentStateSection {
  const scenarios = params.scenarioViews || buildScenarioViews(params.result);
  const confidence = params.confidence || buildConfidenceAnalysis(params.result);
  const leadScenario = scenarios.find((item) => item.key !== 'overall') || scenarios[0];
  const current = params.stateVector?.current;
  const stance = mapScenarioToCurrentStateStance(leadScenario?.status, confidence.level);

  return {
    headline: compactSentence(leadScenario?.summary || params.result.analysis?.summary || '当前重点是先校准阶段，再做关键动作。', 64),
    summary: compactSentence(params.result.fortune?.interaction || confidence.summary || '', 92),
    stance,
    stanceLabel: mapCurrentStateLabel(stance),
    evidence: compactUniqueLines([
      params.result.pattern?.type ? `结构主轴：${params.result.pattern.type}` : '',
      params.result.fortune?.currentDaYun ? `当前阶段：${params.result.fortune.currentDaYun}` : '',
      current ? `天时/地利/人和：${current.tianShi.toFixed(1)} / ${current.diLi.toFixed(1)} / ${current.renHe.toFixed(1)}` : '',
      leadScenario?.focus?.[0],
    ], 3),
    usageNote: compactSentence(leadScenario?.actionLabel || confidence.summary || '', 58),
  };
}

export function buildReportTimelineSection(params: ReportV4BuilderInput): ReportTimelineSection {
  const windows = params.monthlyWindows || buildMonthlyWindows(params.result);

  return {
    headline: '未来 12 个月节奏板',
    summary: compactSentence('把窗口分成推进、稳住、谨慎、回看四种节奏，不把每个月都写成长文。', 68),
    items: windows.slice(0, 12).map((item) => ({
      label: item.label,
      theme: compactSentence(item.theme, 26),
      status: item.status,
      statusLabel: mapWindowStatusLabel(item.status, item.score),
      reason: compactSentence(item.reason, 44),
    })),
  };
}

export function buildReportScenarioPanelSection(params: ReportV4BuilderInput): ReportScenarioPanelSection {
  const scenarios = (params.scenarioViews || buildScenarioViews(params.result))
    .filter((item) => item.key !== 'overall')
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  return {
    summary: compactSentence('每个板块只保留一个判断、一个理由、一个动作，避免重复叙述。', 66),
    panels: scenarios.map((item) => ({
      key: item.key,
      title: mapTrackLabel(item.key),
      verdict: compactSentence(item.actionLabel, 28),
      reason: compactSentence(item.summary || item.focus?.[0] || '', 56),
      action: compactSentence(item.focus?.[0] || item.risks?.[0] || '', 56),
      status: item.status,
      scoreLabel: `评分 ${item.score}`,
    })),
  };
}

export function buildReportActionBoardSection(params: ReportV4BuilderInput): ReportActionBoardSection {
  const playbook = params.decisionPlaybook || buildDecisionPlaybook({
    ...params.result,
    scenarioViews: params.scenarioViews,
    monthlyWindows: params.monthlyWindows,
  });
  const suggestions = params.actionSuggestions || buildReportActionSuggestions({
    ...params.result,
    scenarioViews: params.scenarioViews,
    monthlyWindows: params.monthlyWindows,
  });

  return {
    focusSummary: compactSentence(playbook[0]?.whyNow || suggestions[0]?.reason || '先做当下最值得验证的动作。', 78),
    now: compactUniqueLines([
      ...playbook.slice(0, 2).map((item) => item.nowAction),
      suggestions[0]?.description,
    ], 3),
    next30Days: compactUniqueLines([
      playbook[0]?.bestWindow ? `围绕 ${playbook[0].bestWindow} 安排关键节点。` : '',
      suggestions[0]?.reason,
      playbook[1]?.nowAction,
    ], 3),
    next90Days: compactUniqueLines([
      ...playbook.slice(0, 3).map((item) => item.whyNow),
      suggestions[1]?.reason,
    ], 3),
    avoidList: compactUniqueLines([
      ...playbook.slice(0, 2).map((item) => item.avoidAction),
      suggestions.find((item) => item.impact === 'negative')?.description,
    ], 3),
  };
}

export function buildReportValidationSection(params: ReportV4BuilderInput): ReportValidationSection {
  const confidence = params.confidence || buildConfidenceAnalysis(params.result);
  const validation = params.validationInsights;
  const correction = params.correctionInsight;

  return {
    confidenceLabel: `${mapConfidenceLabel(confidence.level)} · ${confidence.overallScore}`,
    summary: compactSentence(validation?.summary || confidence.summary || '', 84),
    tone: confidence.level,
    highConfidencePoints: compactUniqueLines(confidence.stablePoints || [], 3),
    sensitivePoints: compactUniqueLines(confidence.sensitivePoints || [], 3),
    correctionSummary: compactSentence(correction?.summary || correction?.likelyCause || '', 84),
    eventPrompts: compactUniqueLines([
      validation?.pendingCount ? `还有 ${validation.pendingCount} 个事件待验证。` : '',
      ...(correction?.checkpoints || []),
      '遇到转岗、合作、关系推进或健康波动时及时回填结果。',
    ], 3),
  };
}

export function buildReportPersonalityBridgeSection(params: ReportV4BuilderInput): ReportPersonalityBridgeSection | undefined {
  const expert = params.expertInterpretation || buildExpertInterpretation({
    ...params.result,
    scenarioViews: params.scenarioViews,
    monthlyWindows: params.monthlyWindows,
    confidence: params.confidence,
  });
  const tags = compactUniqueLines(expert.flatMap((item) => item.tags || []), 3);
  if (tags.length === 0) {
    return undefined;
  }

  return {
    label: compactSentence(params.result.pattern?.type || params.result.basic?.dayMaster || '结构画像', 28),
    summary: compactSentence('这是帮助你理解风格的软桥接标签，不是确定性人格结论。', 52),
    traits: tags,
    disclaimers: ['仅作沟通桥接，不等同于 MBTI / SBTI 定型判断。'],
  };
}

export function buildReportV4Sections(params: ReportV4BuilderInput): ReportV4Sections {
  const scenarioViews = params.scenarioViews || buildScenarioViews(params.result);
  const monthlyWindows = params.monthlyWindows || buildMonthlyWindows(params.result);
  const confidence = params.confidence || buildConfidenceAnalysis(params.result);
  const decisionPlaybook = params.decisionPlaybook || buildDecisionPlaybook({
    ...params.result,
    scenarioViews,
    monthlyWindows,
  });
  const actionSuggestions = params.actionSuggestions || buildReportActionSuggestions({
    ...params.result,
    scenarioViews,
    monthlyWindows,
  });
  const expertInterpretation = params.expertInterpretation || buildExpertInterpretation({
    ...params.result,
    scenarioViews,
    monthlyWindows,
    confidence,
  });

  return {
    cockpit: buildReportCockpitSection({ ...params, scenarioViews, monthlyWindows, confidence, decisionPlaybook, actionSuggestions }),
    lifeKLine: buildReportLifeKLineSection({ ...params, scenarioViews, monthlyWindows }),
    coreBlueprint: buildReportBlueprintSection({ ...params, scenarioViews, monthlyWindows, confidence, expertInterpretation }),
    currentOperatingSystem: buildReportCurrentStateSection({ ...params, scenarioViews, confidence }),
    timeline12Months: buildReportTimelineSection({ ...params, monthlyWindows }),
    scenarioPanels: buildReportScenarioPanelSection({ ...params, scenarioViews }),
    actionBoard: buildReportActionBoardSection({ ...params, scenarioViews, monthlyWindows, decisionPlaybook, actionSuggestions }),
    validationLayer: buildReportValidationSection({ ...params, confidence }),
    personalityBridge: buildReportPersonalityBridgeSection({ ...params, expertInterpretation }),
  };
}

function getFutureKlineSource(data: KlinePoint[]) {
  if (!data || data.length === 0) return [];
  const currentYear = new Date().getUTCFullYear();
  const future = data.filter((item) => item.year >= currentYear).slice(0, 5);
  if (future.length > 0) return future;
  return data.slice(-5);
}

function compactList(values?: string[], extra?: string) {
  const list = [...(values || [])];
  if (extra) list.unshift(extra);
  return list.filter(Boolean).slice(0, 4);
}

function ensureFallback(values: string[], fallback: string) {
  return values.filter(Boolean).length > 0 ? values.filter(Boolean) : [fallback];
}

function compactUniqueLines(values: Array<string | null | undefined>, limit: number) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleaned = `${value || ''}`.replace(/\s+/g, ' ').trim();
    if (!cleaned) continue;

    const signature = cleaned
      .replace(/[，。,.；;：:\s]/g, '')
      .slice(0, 42);
    if (seen.has(signature)) continue;

    seen.add(signature);
    result.push(cleaned);
    if (result.length >= limit) break;
  }

  return result;
}

function compactSentence(value?: string | null, maxLength = 80) {
  const cleaned = `${value || ''}`.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trim()}…`;
}

function compactPeriodCards(cards: Array<ReportCockpitSection['periodCards'][number] | null>) {
  return cards.filter(Boolean) as ReportCockpitSection['periodCards'];
}

function mapConfidenceLabel(level: ConfidenceAnalysis['level']) {
  if (level === 'high') return '高可信';
  if (level === 'medium') return '中可信';
  return '观察级';
}

function mapMetricTone(value: number): 'strong' | 'steady' | 'watch' {
  if (value >= 7.2) return 'strong';
  if (value >= 5.8) return 'steady';
  return 'watch';
}

function mapScenarioToCurrentStateStance(
  status: ScenarioView['status'] | undefined,
  confidenceLevel: ConfidenceAnalysis['level']
): ReportCurrentStateSection['stance'] {
  if (confidenceLevel === 'watch') return 'adjust';
  if (status === 'push') return 'push';
  if (status === 'caution') return 'recover';
  return 'hold';
}

function mapCurrentStateLabel(stance: ReportCurrentStateSection['stance']) {
  if (stance === 'push') return '主动推进';
  if (stance === 'adjust') return '边走边校准';
  if (stance === 'recover') return '先复盘修正';
  return '稳住节奏';
}

function mapWindowStatusLabel(status: MonthlyWindow['status'], score?: number) {
  if (status === 'push') return '推进';
  if (status === 'steady') return typeof score === 'number' && score < 64 ? '准备' : '稳住';
  return typeof score === 'number' && score < 52 ? '回看' : '谨慎';
}

function mapScenarioActionLabel(status: ScenarioView['status'], title: string) {
  if (status === 'push') return `${title}适合主动推进`;
  if (status === 'steady') return `${title}更适合稳中求进`;
  return `${title}优先控风险`;
}

function mapMonthElement(month: number) {
  const map: Record<number, string> = {
    1: '水',
    2: '木',
    3: '木',
    4: '土',
    5: '火',
    6: '火',
    7: '土',
    8: '金',
    9: '金',
    10: '土',
    11: '水',
    12: '水',
  };

  return map[month] || '土';
}

function buildMonthlyTheme(result: ReportV2Input, year: number, month: number) {
  const source = getFutureKlineSource(result.klineData || []);
  const target = source.find((item) => item.year === year) || source[source.length - 1];
  if (!target) return '结构整理';
  const entries = [
    { label: '事业推进', value: target.career },
    { label: '财富配置', value: target.wealth },
    { label: '关系经营', value: target.marriage },
    { label: '健康节奏', value: target.health },
  ].sort((left, right) => right.value - left.value);
  const top = entries[0];
  return `${top.label} · ${String(month).padStart(2, '0')}月`;
}

function buildMonthlyReason({
  element,
  favored,
  avoided,
  status,
  currentDaYun,
}: {
  element: string;
  favored: string[];
  avoided: string[];
  status: MonthlyWindow['status'];
  currentDaYun: string;
}) {
  const relation = favored.includes(element)
    ? `本月属${element}，与用神/喜神方向更接近。`
    : avoided.includes(element)
      ? `本月属${element}，与忌神方向更接近，宜防节奏失衡。`
      : `本月属${element}，与命局关系中性，更适合稳步推进。`;

  const statusText = status === 'push'
    ? '适合主动推进关键动作。'
    : status === 'steady'
      ? '适合有节制地推进。'
      : '更适合先观察再行动。';

  return `${relation}${currentDaYun ? ` 当前行运仍受${currentDaYun}影响。` : ''}${statusText}`;
}

function mapDayunModifier(quality?: DayunInfo['quality']) {
  switch (quality) {
    case 'excellent':
      return 8;
    case 'good':
      return 5;
    case 'neutral':
      return 0;
    case 'bad':
      return -5;
    case 'poor':
      return -8;
    default:
      return 0;
  }
}

function getFiveElementSpread(fiveElements: Partial<Record<'wood' | 'fire' | 'earth' | 'metal' | 'water', { strength?: number }>>) {
  const values = Object.values(fiveElements)
    .map((item) => Number(item?.strength || 0))
    .filter((value) => !Number.isNaN(value));
  if (values.length === 0) return 0;
  return Math.max(...values) - Math.min(...values);
}

function average(values: number[]) {
  if (!values || values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index++) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function resolveCalendarAnchor(anchor: CalendarAnchor) {
  if (typeof anchor === 'string') {
    const monthMatched = anchor.match(/^(\d{4})-(\d{2})$/);
    if (monthMatched) {
      return {
        year: Number(monthMatched[1]),
        month: Number(monthMatched[2]) - 1,
      };
    }

    const dayMatched = anchor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dayMatched) {
      return {
        year: Number(dayMatched[1]),
        month: Number(dayMatched[2]) - 1,
      };
    }
  }

  const date = anchor instanceof Date ? anchor : new Date(anchor);
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
  };
}

function formatDateKey(date: CalendarAnchor) {
  if (typeof date === 'string') {
    const monthMatched = date.match(/^(\d{4})-(\d{2})$/);
    if (monthMatched) {
      return `${monthMatched[1]}-${monthMatched[2]}-01`;
    }

    const dayMatched = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dayMatched) {
      return `${dayMatched[1]}-${dayMatched[2]}-01`;
    }
  }

  const localDateKey = formatLocalDateKey(date instanceof Date ? date : new Date(date));
  const matched = localDateKey.match(/^(\d{4})-(\d{2})-\d{2}$/);

  if (!matched) {
    return localDateKey;
  }

  return `${matched[1]}-${matched[2]}-01`;
}

function mapScenarioToEventType(key: ScenarioKey): ReportActionSuggestion['type'] {
  switch (key) {
    case 'career':
      return 'career';
    case 'wealth':
      return 'wealth';
    case 'marriage':
      return 'marriage';
    case 'health':
      return 'health';
    default:
      return 'other';
  }
}

function mapTrackLabel(key: ScenarioKey) {
  switch (key) {
    case 'career':
      return '事业';
    case 'wealth':
      return '财富';
    case 'marriage':
      return '关系';
    case 'health':
      return '健康';
    default:
      return '综合';
  }
}

function dedupeActionSuggestions(items: ReportActionSuggestion[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const signature = `${item.title}-${item.date}`;
    if (seen.has(signature)) {
      return false;
    }
    seen.add(signature);
    return true;
  });
}
