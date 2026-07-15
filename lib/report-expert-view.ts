/**
 * 专业版命盘工具视图
 *
 * 面向命理从业者：排盘、基础命盘全量、大运流年运局、岁运关系、真太阳时。
 * 数据来自引擎落库字段 + solar-time / 经度解析（不另起一套算法）。
 */

import type { DayunInfo, DayunResult } from '@/lib/dayun-calculator';
import type {
  FiveElements,
  FortuneAnalysisResult,
  Pattern,
  Pillar,
  TenGods,
} from '@/lib/user-types';
import { resolveBirthLocationProfile } from '@/lib/fortune-engine';
import { calculateTrueSolarTime, type TrueSolarTimeResult } from '@/lib/solar-time';
import { localizeElementList, presentReportText } from '@/lib/report-presentation';
import {
  getApproxMonthGanZhi,
  getChangSheng,
  getKongWangByDayPillar,
  isZhiKongWang,
} from '@/lib/bazi-pro-tools';
import { calculateShiShen } from '@/lib/bazi-constants';
import { getSolarTermContext } from '@/lib/agentic-report/context/solar-terms';
import { getMacroCycleSignals } from '@/lib/agentic-report/context/macro-cycles';
import { getGeoClimateSignals } from '@/lib/agentic-report/context/geo-climate';
import { getSpatialFactors } from '@/lib/agentic-report/context/spatial-factors';

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'] as const;

const ELEMENT_CN: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
  木: '木',
  火: '火',
  土: '土',
  金: '金',
  水: '水',
};

export type ExpertDimensionKey =
  | 'input'
  | 'solar'
  | 'chart'
  | 'elements'
  | 'tenGods'
  | 'pattern'
  | 'yongJi'
  | 'changsheng'
  | 'kongwang'
  | 'dayun'
  | 'liunian'
  | 'liuyue'
  | 'suiyun'
  | 'probe'
  | 'cosmos'
  | 'domains'
  | 'playbook'
  | 'boost'
  | 'client-pack'
  | 'glossary'
  | 'shensha'
  | 'kline'
  | 'print';

export interface ExpertDimensionMeta {
  key: ExpertDimensionKey;
  label: string;
  short: string;
  description: string;
}

/** 专业八字需要的维度清单（工具页目录） */
export const EXPERT_DIMENSIONS: ExpertDimensionMeta[] = [
  { key: 'input', label: '出生输入', short: '输入', description: '公历、时区、出生地、性别、钟表时间' },
  { key: 'solar', label: '真太阳时', short: '真太阳', description: '经度修正、均时差、有效排盘时刻' },
  { key: 'chart', label: '四柱排盘', short: '排盘', description: '干支、藏干、纳音、刑冲合害' },
  { key: 'changsheng', label: '十二长生', short: '长生', description: '日主临四柱/大运地支的十二长生' },
  { key: 'kongwang', label: '空亡', short: '空亡', description: '日旬空亡及落空柱位' },
  { key: 'elements', label: '五行强弱', short: '五行', description: '木火土金水力量与质量' },
  { key: 'tenGods', label: '十神配置', short: '十神', description: '日主十神与生克关系' },
  { key: 'pattern', label: '格局', short: '格局', description: '格局类型、强弱、定性描述' },
  { key: 'yongJi', label: '用神喜忌', short: '用忌', description: '用神 / 喜神 / 忌神' },
  { key: 'dayun', label: '大运表', short: '大运', description: '起运、十步大运、当前运局' },
  { key: 'liunian', label: '流年', short: '流年', description: '当年流年与后续走势' },
  { key: 'liuyue', label: '流月表', short: '流月', description: '近 12 流月干支与长生空亡' },
  { key: 'suiyun', label: '岁运关系', short: '岁运', description: '大运 × 流年交互' },
  { key: 'probe', label: '自选流年点盘', short: '点盘', description: '任选公历年推流年干支与长生空亡' },
  { key: 'cosmos', label: '时空大盘', short: '时空', description: '测算时点天时地利人和、节气、宏观行业地理' },
  { key: 'domains', label: '专项研判', short: '专项', description: '事业行业、婚配、健康、财富等引擎建议' },
  { key: 'playbook', label: '操作剧本', short: '剧本', description: '分轨决策与窗口动作' },
  { key: 'boost', label: '增运参数', short: '增运', description: '颜色、方位、数字、时机' },
  { key: 'client-pack', label: '对客话术', short: '话术', description: '3 分钟口播、案主白话、异议应答' },
  { key: 'glossary', label: '规则速查', short: '速查', description: '十二长生/空亡/十神等不必翻书' },
  { key: 'shensha', label: '神煞', short: '神煞', description: '神煞列表（若有）' },
  { key: 'kline', label: '运势曲线', short: 'K线', description: '人生 K 线作运势对照' },
  { key: 'print', label: '排盘纸', short: '打印', description: '打印/导出专业排盘纸' },
];

/** 测算时点 · 更大纬度 */
export interface ExpertCosmosPack {
  measuredAt: string;
  /** stored=报告落库信号；synthesized=专业版即时补算 */
  source: 'stored' | 'synthesized' | 'mixed';
  temporal: {
    solarTerm: string;
    nextSolarTerm: string;
    lunarYear: string;
    liuNian: string;
    phaseLabel: string;
    year: number;
    month: number;
    day: number;
    isBeforeLichun: boolean;
  };
  stateVector: Array<{ label: string; value: number; detail: string }>;
  nationalCycle: { label: string; direction: string; reason: string } | null;
  economicCycle: { label: string; direction: string; reason: string } | null;
  industries: Array<{ industry: string; direction: string; confidence: number; reason: string }>;
  geo: {
    birthPlace: string;
    currentPlace: string;
    climateBias: string[];
    geographyPreference: string[];
    cityEnergyTags: string[];
  };
  spatial: {
    favorableDirections: string[];
    unfavorableDirections: string[];
    movementAdvice: string[];
    environmentAdvice: string[];
  };
  human: {
    lifeStage: string;
    relationshipFocus: string;
    familyRolePressure: string[];
    collaborationMode: string[];
  };
  monthlyWindows: Array<{
    label: string;
    score: number;
    status: string;
    theme: string;
    reason: string;
  }>;
  /** 近 7 年 K 线四维速查（事业/财/婚/健） */
  domainTimeline: Array<{
    year: number;
    ganZhi: string;
    career: number;
    wealth: number;
    marriage: number;
    health: number;
  }>;
}

/** 事业/婚配/健康/财富等专项 */
export interface ExpertDomainCard {
  key: string;
  title: string;
  score: number | null;
  status: string;
  general: string;
  specific: string[];
  timing: string;
  avoid: string[];
  /** 宜做 / 行动清单（引擎 actions） */
  actions: string[];
  /** 驱动因素（引擎 drivers） */
  drivers: string[];
  direction: string;
  directions: string[];
  colors: string[];
  focus: string[];
  risks: string[];
  /** 当前年附近 K 线分（若有） */
  klineScore: number | null;
}

export interface ExpertPlaybookRow {
  key: string;
  title: string;
  track: string;
  priority: string;
  score: number;
  stance: string;
  bestWindow: string;
  whyNow: string;
  nowAction: string;
  avoidAction: string;
}

export interface ExpertBoostPack {
  colors: string[];
  directions: string[];
  numbers: string[];
  timing: string[];
}

export interface ExpertPillarRow {
  label: string;
  gan: string;
  zhi: string;
  ganZhi: string;
  hiddenStems: string[];
  nayin: string;
  mainElement: string;
  hiddenElements: string[];
  combinations: string[];
  clashes: string[];
  penalties: string[];
  harms: string[];
  /** 日主十二长生 */
  changSheng: string;
  /** 是否落日空亡 */
  isKongWang: boolean;
  /** 天干十神（相对日主） */
  ganShiShen: string;
}

export interface ExpertLiuyueRow {
  year: number;
  month: number;
  label: string;
  ganZhi: string;
  changSheng: string;
  isKongWang: boolean;
}

export interface ExpertSolarBlock {
  clockDate: string;
  clockTime: string;
  birthPlace: string;
  timezone: number;
  longitude: number | null;
  locationNote: string;
  locationConfidence: string;
  usedEstimate: boolean;
  trueSolar: TrueSolarTimeResult | null;
  trueSolarText: string;
  longitudeOffset: number | null;
  equationOfTime: number | null;
  totalCorrection: number | null;
}

export interface ExpertDayunRow {
  index: number;
  ganZhi: string;
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  ganWuxing: string;
  zhiWuxing: string;
  quality: string;
  yongShenMatch: string;
  description: string;
  isCurrent: boolean;
  changSheng: string;
  isKongWang: boolean;
}

export interface ExpertDeskView {
  title: string;
  dayMaster: string;
  gender: string;
  input: {
    name: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    timezone: number;
    gender: string;
  };
  solar: ExpertSolarBlock;
  pillars: ExpertPillarRow[];
  fiveElements: Array<{ key: string; label: string; strength: number; quality: string; description: string }>;
  tenGods: { self: string; output: string[]; input: string[]; control: string[]; controlled: string[] };
  pattern: { type: string; strength: string; quality: string; description: string };
  yongJi: { yongShen: string[]; xiShen: string[]; jiShen: string[] };
  dayun: {
    startAge: number;
    currentYearInDayun: number;
    current: ExpertDayunRow | null;
    rows: ExpertDayunRow[];
  };
  liunian: {
    currentText: string;
    currentGanZhi: string;
    nextYearText: string;
    trend: string;
  };
  suiyun: {
    summary: string;
    dayunGanZhi: string;
    liunianGanZhi: string;
    notes: string[];
  };
  shenSha: string[];
  /** 日旬空亡地支 */
  kongWang: string[];
  /** 日主 */
  dayMasterForTools: string;
  /** 日柱干支（空亡锚） */
  dayPillarGanZhi: string;
  /** 点盘默认参数 */
  probeDefaults: {
    dayMaster: string;
    dayPillarGanZhi: string;
    currentDayunGanZhi: string;
    yongShen: string[];
    jiShen: string[];
    birthYear: number;
  };
  cosmos: ExpertCosmosPack;
  domains: ExpertDomainCard[];
  playbook: ExpertPlaybookRow[];
  boost: ExpertBoostPack;
  /** 未来 12 流月速查 */
  liuyue: ExpertLiuyueRow[];
  dimensions: ExpertDimensionMeta[];
}

export function buildExpertDeskView(params: {
  result: FortuneAnalysisResult & {
    basic?: FortuneAnalysisResult['basic'] & {
      name?: string;
      birthDate?: string;
      birthTime?: string;
      birthPlace?: string;
      timezone?: number;
      gender?: string;
      year?: string;
      month?: string;
      day?: string;
      hour?: string;
    };
  };
  raw?: {
    birthDate?: string;
    birthTime?: string;
    birthPlace?: string;
    timezone?: number;
    gender?: string;
    name?: string;
  } | null;
  dayun?: DayunResult | null;
  /** 页面已构建的场景分 / 状态向量 / 月窗 / 剧本 */
  scenarioViews?: Array<{
    key: string;
    title?: string;
    score?: number;
    status?: string;
    summary?: string;
    focus?: string[];
    risks?: string[];
    actionLabel?: string;
  }> | null;
  stateVector?: {
    current?: { tianShi?: number; diLi?: number; renHe?: number };
  } | null;
  monthlyWindows?: Array<{
    label?: string;
    score?: number;
    status?: string;
    theme?: string;
    reason?: string;
  }> | null;
  decisionPlaybook?: Array<{
    key?: string;
    title?: string;
    track?: string;
    priority?: string;
    score?: number;
    stance?: string;
    bestWindow?: string;
    whyNow?: string;
    nowAction?: string;
    avoidAction?: string;
  }> | null;
  contextSignals?: Record<string, unknown> | null;
}): ExpertDeskView {
  const result = params.result;
  const raw = params.raw || {};
  const birthDate = raw.birthDate || (result.basic as any)?.birthDate || '';
  const birthTime = raw.birthTime || (result.basic as any)?.birthTime || '12:00';
  const birthPlace = raw.birthPlace || (result.basic as any)?.birthPlace || '';
  const timezone = Number(raw.timezone ?? (result.basic as any)?.timezone ?? 8) || 8;
  const gender = raw.gender || (result.basic as any)?.gender || '';
  const name = raw.name || (result.basic as any)?.name || '';

  const dayMasterEarly = presentReportText(result.basic?.dayMaster, 4) || '';
  let pillars = buildPillarRows(result.basic?.pillars, result.basic, dayMasterEarly, []);
  const dayMaster = dayMasterEarly || pillars[2]?.gan || '';
  const dayPillarGanZhi = pillars[2]?.ganZhi || '';
  const kongWang = getKongWangByDayPillar(dayPillarGanZhi);
  pillars = buildPillarRows(result.basic?.pillars, result.basic, dayMaster, kongWang);

  const solar = buildSolarBlock({ birthDate, birthTime, birthPlace, timezone });
  const fiveElements = buildFiveElements(result.fiveElements);
  const tenGods = {
    self: presentReportText(result.tenGods?.self, 8) || dayMaster,
    output: asStringList(result.tenGods?.output),
    input: asStringList(result.tenGods?.input),
    control: asStringList(result.tenGods?.control),
    controlled: asStringList(result.tenGods?.controlled),
  };
  const pattern = {
    type: presentReportText(result.pattern?.type, 24) || '—',
    strength: presentReportText(result.pattern?.strength, 16) || '—',
    quality: presentReportText(result.pattern?.quality, 16) || '—',
    description: presentReportText(result.pattern?.description, 320) || '',
  };
  const yongJi = {
    yongShen: localizeElementList(result.advice?.yongShen || result.yongShen?.yongShen || []),
    xiShen: localizeElementList(result.advice?.xiShen || result.yongShen?.xiShen || []),
    jiShen: localizeElementList(result.advice?.jiShen || result.yongShen?.jiShen || []),
  };

  const dayunResult = params.dayun || (result.dayun as DayunResult | undefined) || null;
  const dayunRows = (dayunResult?.dayuns || []).map((d) => mapDayunRow(d, dayMaster, kongWang));
  const currentDayun =
    dayunRows.find((d) => d.isCurrent) ||
    (dayunResult?.currentDayun ? mapDayunRow(dayunResult.currentDayun, dayMaster, kongWang) : null);

  const liunianText = presentReportText(result.fortune?.currentLiuNian, 120) || '';
  const liunianGanZhi = extractGanZhi(liunianText) || extractGanZhi(result.fortune?.currentDaYun || '');
  const dayunGanZhi = currentDayun?.ganZhi || extractGanZhi(result.fortune?.currentDaYun || '') || '';

  const suiyunSummary =
    presentReportText(result.fortune?.interaction, 280) ||
    (dayunGanZhi && liunianGanZhi
      ? `当前运局 ${dayunGanZhi}，流年 ${liunianGanZhi}，需结合干支生克与用忌综合看岁运。`
      : '岁运交互文案待补全，请对照大运表与流年干支自行推演。');

  const suiyunNotes = buildSuiyunNotes(dayunGanZhi, liunianGanZhi, yongJi);

  const shenSha = extractShenSha(result);
  const cosmos = buildCosmosPack(params, birthPlace);
  const domains = buildDomainCards(result, params.scenarioViews);
  const playbook = buildPlaybookRows(params.decisionPlaybook);
  const boost = buildBoostPack(result);

  return {
    title: `专业命盘 · ${dayMaster || '排盘'}`,
    dayMaster,
    gender: gender === 'female' ? '女' : gender === 'male' ? '男' : gender || '—',
    input: {
      name: presentReportText(name, 24) || '—',
      birthDate: birthDate || '—',
      birthTime: birthTime || '—',
      birthPlace: birthPlace || '—',
      timezone,
      gender: gender === 'female' ? '女' : gender === 'male' ? '男' : gender || '—',
    },
    solar,
    pillars,
    fiveElements,
    tenGods,
    pattern,
    yongJi,
    dayun: {
      startAge: dayunResult?.startAge ?? 0,
      currentYearInDayun: dayunResult?.currentDayunYear ?? 0,
      current: currentDayun,
      rows: dayunRows,
    },
    liunian: {
      currentText: liunianText || '—',
      currentGanZhi: liunianGanZhi || '—',
      nextYearText: presentReportText(result.fortune?.nextYear, 200) || '—',
      trend: presentReportText(result.fortune?.trend, 200) || '—',
    },
    suiyun: {
      summary: suiyunSummary,
      dayunGanZhi: dayunGanZhi || '—',
      liunianGanZhi: liunianGanZhi || '—',
      notes: suiyunNotes,
    },
    shenSha,
    kongWang,
    dayMasterForTools: dayMaster,
    dayPillarGanZhi,
    probeDefaults: {
      dayMaster,
      dayPillarGanZhi,
      currentDayunGanZhi: currentDayun?.ganZhi || '',
      yongShen: yongJi.yongShen,
      jiShen: yongJi.jiShen,
      birthYear: Number((birthDate || '').slice(0, 4)) || new Date().getFullYear() - 30,
    },
    cosmos,
    domains,
    playbook,
    boost,
    liuyue: buildLiuyueRows(dayMaster, kongWang),
    dimensions: EXPERT_DIMENSIONS,
  };
}

function buildLiuyueRows(dayMaster: string, kongWang: string[]): ExpertLiuyueRow[] {
  const now = new Date();
  const rows: ExpertLiuyueRow[] = [];
  for (let i = 0; i < 12; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const ganZhi = getApproxMonthGanZhi(year, month);
    const zhi = ganZhi[1] || '';
    rows.push({
      year,
      month,
      label: `${year}.${String(month).padStart(2, '0')}`,
      ganZhi,
      changSheng: getChangSheng(dayMaster, zhi),
      isKongWang: isZhiKongWang(zhi, kongWang),
    });
  }
  return rows;
}

function buildCosmosPack(
  params: Parameters<typeof buildExpertDeskView>[0],
  birthPlace: string
): ExpertCosmosPack {
  const result = params.result;
  const cs = (params.contextSignals ||
    (result as any)?.analysis?.contextSignals ||
    (result as any)?.contextSignals ||
    {}) as Record<string, any>;

  const now = new Date();
  const yong = localizeElementList(
    result.advice?.yongShen || result.yongShen?.yongShen || []
  );
  const xi = localizeElementList(result.advice?.xiShen || result.yongShen?.xiShen || []);
  const ji = localizeElementList(result.advice?.jiShen || result.yongShen?.jiShen || []);
  const favored = [...yong, ...xi];

  // 落库信号可能不完整：用同一套 agentic context 模块即时补满专业版
  const synthSolar = getSolarTermContext(now);
  const industryHints = gatherIndustryHints(result.advice, (result as any).careerSuggestion);
  const synthMacro = getMacroCycleSignals(now.getFullYear(), industryHints);
  const synthGeo = getGeoClimateSignals({
    birthPlace,
    currentPlace: birthPlace,
    favoredElements: favored,
    avoidedElements: ji,
  });
  const synthSpatial = getSpatialFactors({
    favoredDirections: asStringListLong(result.advice?.directions, 12),
    favoredElements: favored,
    avoidedElements: ji,
  });

  const temporal = cs.temporal || {};
  const geo = cs.geoClimate || {};
  const macro = cs.macroCycles || {};
  const spatial = cs.spatialFactors || {};
  const human = cs.humanFactors || {};
  const sv = params.stateVector?.current || (result as any)?.stateVector?.current || {};

  const hasStoredTemporal = Boolean(temporal.currentSolarTerm || temporal.currentLiuNian);
  const hasStoredMacro = Boolean(macro.nationalCycle || macro.industryCycle?.length);
  const hasStoredGeo = Boolean(geo.climateBias?.length || geo.geographyPreference?.length);
  const source: ExpertCosmosPack['source'] =
    hasStoredTemporal && hasStoredMacro && hasStoredGeo
      ? 'stored'
      : hasStoredTemporal || hasStoredMacro || hasStoredGeo
        ? 'mixed'
        : 'synthesized';

  const stateVector = [
    {
      label: '天时',
      value: round1(sv.tianShi),
      detail: '时机、节气与阶段节奏',
    },
    {
      label: '地利',
      value: round1(sv.diLi),
      detail: '地理、城市与空间匹配',
    },
    {
      label: '人和',
      value: round1(sv.renHe),
      detail: '关系协同与互动质量',
    },
  ].filter((x) => x.value != null) as ExpertCosmosPack['stateVector'];

  const stateOut =
    stateVector.length > 0
      ? stateVector
      : [
          { label: '天时', value: 0, detail: '向量未落库 · 对照节气/流年/宏观' },
          { label: '地利', value: 0, detail: '见地理气候与方位' },
          { label: '人和', value: 0, detail: '见婚配与人生阶段' },
        ];

  const macroSrc = hasStoredMacro ? macro : synthMacro;
  const industries = Array.isArray(macroSrc.industryCycle)
    ? macroSrc.industryCycle.map((item: any) => ({
        industry: presentReportText(item.industry, 24) || '综合行业',
        direction: presentReportText(item.direction, 16) || 'flat',
        confidence: Number(item.confidence) || 0,
        reason: presentReportText(item.reason, 160) || '',
      }))
    : [];

  const geoSrc = hasStoredGeo ? geo : synthGeo;
  const spatialSrc =
    spatial.favorableDirections?.length || spatial.movementAdvice?.length
      ? spatial
      : synthSpatial;

  const monthlyWindows = (params.monthlyWindows || [])
    .slice(0, 12)
    .map((w) => ({
      label: presentReportText(w.label, 16) || '—',
      score: Number(w.score) || 0,
      status: presentReportText(w.status, 12) || '—',
      theme: presentReportText(w.theme, 24) || '',
      reason: presentReportText(w.reason, 140) || '',
    }));

  const birthYear =
    Number((params.raw?.birthDate || (result.basic as any)?.birthDate || '').slice(0, 4)) ||
    now.getFullYear() - 30;
  const age = Math.max(0, now.getFullYear() - birthYear);
  const lifeStage =
    presentReportText(human.lifeStage, 16) ||
    (age < 24 ? 'early' : age < 34 ? 'rising' : age < 46 ? 'prime' : age < 58 ? 'transition' : 'later');
  const relationshipFocus =
    presentReportText(human.relationshipFocus, 80) || defaultRelationshipFocus(age);
  const familyRolePressure = asStringListLong(human.familyRolePressure, 80).length
    ? asStringListLong(human.familyRolePressure, 80)
    : [defaultFamilyPressure(age)];
  const collaborationMode = asStringListLong(human.collaborationMode, 80).length
    ? asStringListLong(human.collaborationMode, 80)
    : defaultCollaboration(favored, industries);

  return {
    measuredAt:
      presentReportText(temporal.currentDate, 40) ||
      presentReportText(cs.generatedAt, 40) ||
      now.toISOString(),
    source,
    temporal: {
      solarTerm:
        presentReportText(temporal.currentSolarTerm, 12) ||
        presentReportText(synthSolar.currentSolarTerm, 12) ||
        '—',
      nextSolarTerm:
        presentReportText(temporal.nextSolarTerm, 12) ||
        presentReportText(synthSolar.nextSolarTerm, 12) ||
        '—',
      lunarYear:
        presentReportText(temporal.currentLunarYear || temporal.currentLiuNian, 12) ||
        presentReportText(synthSolar.currentLunarYear || synthSolar.currentLiuNian, 12) ||
        '—',
      liuNian:
        presentReportText(temporal.currentLiuNian, 12) ||
        presentReportText(synthSolar.currentLiuNian, 12) ||
        '—',
      phaseLabel: presentReportText(temporal.currentPhaseLabel, 32) || inferPhaseFromKline(result, now.getFullYear()),
      year: Number(temporal.currentYear) || now.getFullYear(),
      month: Number(temporal.currentMonth) || now.getMonth() + 1,
      day: now.getDate(),
      isBeforeLichun: Boolean(
        temporal.isBeforeLichun ?? synthSolar.isBeforeLichun
      ),
    },
    stateVector: stateOut,
    nationalCycle: macroSrc.nationalCycle
      ? {
          label: presentReportText(macroSrc.nationalCycle.label, 24) || '—',
          direction: presentReportText(macroSrc.nationalCycle.direction, 16) || '—',
          reason: presentReportText(macroSrc.nationalCycle.reason, 160) || '',
        }
      : null,
    economicCycle: macroSrc.economicCycle
      ? {
          label: presentReportText(macroSrc.economicCycle.label, 24) || '—',
          direction: presentReportText(macroSrc.economicCycle.direction, 16) || '—',
          reason: presentReportText(macroSrc.economicCycle.reason, 160) || '',
        }
      : null,
    industries,
    geo: {
      birthPlace: presentReportText(geoSrc.birthPlace || birthPlace, 32) || '—',
      currentPlace: presentReportText(geoSrc.currentPlace || birthPlace, 32) || '—',
      climateBias: asStringListLong(geoSrc.climateBias, 80),
      geographyPreference: asStringListLong(geoSrc.geographyPreference, 80),
      cityEnergyTags: asStringListLong(geoSrc.cityEnergyTags, 24),
    },
    spatial: {
      favorableDirections: asStringListLong(spatialSrc.favorableDirections, 12),
      unfavorableDirections: asStringListLong(spatialSrc.unfavorableDirections, 12),
      movementAdvice: asStringListLong(spatialSrc.movementAdvice, 100),
      environmentAdvice: asStringListLong(spatialSrc.environmentAdvice, 100),
    },
    human: {
      lifeStage,
      relationshipFocus,
      familyRolePressure,
      collaborationMode,
    },
    monthlyWindows,
    domainTimeline: buildDomainTimeline(result),
  };
}

function buildDomainCards(
  result: FortuneAnalysisResult,
  scenarioViews?: Parameters<typeof buildExpertDeskView>[0]['scenarioViews']
): ExpertDomainCard[] {
  const advice = result.advice || ({} as any);
  const scenarios = scenarioViews || (result as any).scenarioViews || [];
  const findSc = (key: string) => scenarios.find((s: any) => s.key === key);
  const klineNow = pickCurrentKline(result);

  const specs: Array<{ key: string; title: string; adviceKey: string; klineKey?: keyof NonNullable<typeof klineNow> }> = [
    { key: 'career', title: '事业 · 行业', adviceKey: 'career', klineKey: 'career' },
    { key: 'wealth', title: '财富 · 投资节奏', adviceKey: 'wealth', klineKey: 'wealth' },
    { key: 'marriage', title: '婚配 · 情感关系', adviceKey: 'marriage', klineKey: 'marriage' },
    { key: 'health', title: '身体 · 健康系统', adviceKey: 'health', klineKey: 'health' },
  ];

  const cards = specs.map(({ key, title, adviceKey, klineKey }) => {
    const block = (advice as any)[adviceKey] || {};
    const sc = findSc(key);
    const risks = uniqueStrings([
      ...asStringListLong(block.risks, 80),
      ...asStringListLong(sc?.risks, 80),
    ]).slice(0, 8);
    const avoid = uniqueStrings([
      ...asStringListLong(block.avoid, 80),
      ...risks.slice(0, 3),
    ]).slice(0, 8);
    const directions = uniqueStrings([
      ...asStringListLong(block.directions, 12),
      ...(block.direction ? [presentReportText(block.direction, 12)] : []),
    ]).filter(Boolean);
    const klineScore =
      klineNow && klineKey && typeof (klineNow as any)[klineKey] === 'number'
        ? Number((klineNow as any)[klineKey])
        : null;

    return {
      key,
      title,
      score: typeof sc?.score === 'number' ? sc.score : klineScore,
      status: presentReportText(sc?.status, 12) || (klineScore != null ? klineBand(klineScore) : '—'),
      general: presentReportText(block.general || sc?.summary, 480) || '—',
      specific: asStringListLong(block.specific, 100).slice(0, 10),
      timing: presentReportText(block.timing, 200) || '',
      avoid,
      actions: uniqueStrings([
        ...asStringListLong(block.actions, 100),
        ...asStringListLong(block.specific, 100),
      ]).slice(0, 10),
      drivers: asStringListLong(block.drivers, 100).slice(0, 8),
      direction: directions[0] || '',
      directions,
      colors: asStringListLong(block.colors, 16).slice(0, 8),
      focus: asStringListLong(sc?.focus, 40).slice(0, 6),
      risks,
      klineScore,
    } satisfies ExpertDomainCard;
  });

  // 其他场景分（学习/家庭等，若引擎有）
  for (const sc of scenarios) {
    if (!sc?.key || specs.some((s) => s.key === sc.key) || sc.key === 'overall') continue;
    cards.push({
      key: sc.key,
      title: presentReportText(sc.title || sc.key, 24) || sc.key,
      score: typeof sc.score === 'number' ? sc.score : null,
      status: presentReportText(sc.status, 12) || '—',
      general: presentReportText(sc.summary, 320) || '—',
      specific: [],
      timing: '',
      avoid: [],
      actions: asStringListLong(sc.focus, 40).slice(0, 5),
      drivers: [],
      direction: '',
      directions: [],
      colors: [],
      focus: asStringListLong(sc.focus, 40).slice(0, 5),
      risks: asStringListLong(sc.risks, 80).slice(0, 5),
      klineScore: null,
    });
  }

  // 体貌 / 体质
  const physique = (result as any).physique;
  if (physique?.bodyType || physique?.description) {
    cards.push({
      key: 'physique',
      title: '体貌 · 体质倾向',
      score: null,
      status: 'ref',
      general: presentReportText(physique.description || physique.bodyType, 320) || '—',
      specific: physique.bodyType ? [presentReportText(physique.bodyType, 40)] : [],
      timing: '',
      avoid: [],
      actions: [],
      drivers: ['日主五行取象'],
      direction: '',
      directions: [],
      colors: [],
      focus: [],
      risks: [],
      klineScore: null,
    });
  }

  // 行业适配映射（十神 → 行业）
  const careerSug = (result as any).careerSuggestion;
  if (careerSug?.primary?.length || careerSug?.secondary?.length || careerSug?.reason) {
    cards.push({
      key: 'career-map',
      title: '行业适配映射（十神）',
      score: null,
      status: 'map',
      general:
        presentReportText(careerSug.reason, 320) ||
        '行业适配由月柱/时柱十神与日主用神共同推导，供专业版对照取舍。',
      specific: [
        ...asStringListLong(careerSug.primary, 24).map((x) => `主适：${x}`),
        ...asStringListLong(careerSug.secondary, 24).map((x) => `次适：${x}`),
        ...asStringListLong(careerSug.avoid, 24).map((x) => `慎入：${x}`),
      ].slice(0, 12),
      timing: '',
      avoid: asStringListLong(careerSug.avoid, 24),
      actions: asStringListLong(careerSug.primary, 24).map((x) => `优先试探：${x}`).slice(0, 6),
      drivers: asStringListLong(
        careerSug.reasons || (careerSug.reason ? [careerSug.reason] : []),
        80
      ),
      direction: '',
      directions: [],
      colors: [],
      focus: asStringListLong(careerSug.primary, 24).slice(0, 4),
      risks: asStringListLong(careerSug.avoid, 24).map((x) => `慎入 ${x}`),
      klineScore: null,
    });
  }

  // 总评 overall
  if (advice.overall) {
    cards.unshift({
      key: 'overall',
      title: '总评 · 趋利避害总则',
      score: typeof findSc('overall')?.score === 'number' ? findSc('overall')!.score! : null,
      status: presentReportText(findSc('overall')?.status, 12) || 'core',
      general: presentReportText(advice.overall, 480) || '—',
      specific: [],
      timing: asStringListLong(advice.timing, 80).join('；'),
      avoid: asStringListLong(advice.jiShen, 12).map((x) => `忌神 ${x}`),
      actions: asStringListLong(advice.yongShen, 12).map((x) => `顺用神 ${x}`),
      drivers: [
        ...asStringListLong(advice.yongShen, 12).map((x) => `用 ${x}`),
        ...asStringListLong(advice.xiShen, 12).map((x) => `喜 ${x}`),
      ],
      direction: asStringListLong(advice.directions, 12)[0] || '',
      directions: asStringListLong(advice.directions, 12),
      colors: asStringListLong(advice.colors, 16),
      focus: [],
      risks: asStringListLong(advice.jiShen, 12).map((x) => `忌 ${x}`),
      klineScore: null,
    });
  }

  return cards;
}

function buildDomainTimeline(result: FortuneAnalysisResult): ExpertCosmosPack['domainTimeline'] {
  const rows = Array.isArray(result.klineData) ? result.klineData : [];
  if (!rows.length) return [];
  const year = new Date().getFullYear();
  return rows
    .filter((r) => r.year >= year - 2 && r.year <= year + 4)
    .slice(0, 8)
    .map((r) => ({
      year: r.year,
      ganZhi: presentReportText(r.evidence?.ganZhi, 4) || '',
      career: Math.round(Number(r.career) || 0),
      wealth: Math.round(Number(r.wealth) || 0),
      marriage: Math.round(Number(r.marriage) || 0),
      health: Math.round(Number(r.health) || 0),
    }));
}

function pickCurrentKline(result: FortuneAnalysisResult) {
  const rows = Array.isArray(result.klineData) ? result.klineData : [];
  const year = new Date().getFullYear();
  return rows.find((r) => r.year === year) || rows.find((r) => r.year === year - 1) || null;
}

function inferPhaseFromKline(result: FortuneAnalysisResult, year: number): string {
  const row = (result.klineData || []).find((r) => r.year === year);
  if (!row) return '—';
  const avg = (row.career + row.wealth + row.marriage + row.health) / 4;
  if (avg >= 75) return '高点扩展段';
  if (avg >= 60) return '平稳推进段';
  if (avg >= 45) return '调整蓄力段';
  return '防守修复段';
}

function gatherIndustryHints(
  advice?: FortuneAnalysisResult['advice'],
  careerSug?: { primary?: string[]; secondary?: string[] }
): string[] {
  const blob = [
    ...(advice?.career?.specific || []),
    advice?.career?.general || '',
    ...(careerSug?.primary || []),
    ...(careerSug?.secondary || []),
  ].join(' ');
  const keywords = ['科技', '教育', '金融', '地产', '制造', '咨询', '内容', '医疗', '能源', '法律', '军警', '艺术', '餐饮'];
  const found = keywords.filter((k) => blob.includes(k));
  return found.length ? found.slice(0, 5) : ['综合行业', '科技', '金融'];
}

function defaultRelationshipFocus(age: number) {
  if (age < 28) return '关系重点在筛选同频圈层与合作边界。';
  if (age < 40) return '关系重点在伴侣协同、家庭节奏与事业平衡。';
  if (age < 55) return '关系重点在家庭责任分配与长期信任维护。';
  return '关系重点在稳定支持系统和情绪能量管理。';
}

function defaultFamilyPressure(age: number) {
  if (age < 26) return '角色压力相对较轻，试错空间更大。';
  if (age < 40) return '事业与家庭双线并行，时间分配压力较高。';
  if (age < 55) return '家庭责任、代际支持、职业稳定性会共同影响决策。';
  return '更需要平衡身体负荷、家庭支持和长期生活质量。';
}

function defaultCollaboration(
  favored: string[],
  industries: Array<{ industry: string; direction: string }>
) {
  const out: string[] = [];
  if (favored.includes('木')) out.push('适合成长型、学习型长期主义团队。');
  if (favored.includes('火')) out.push('适合高表达、高推进环境。');
  if (favored.includes('土')) out.push('适合稳定流程清晰的组织框架。');
  if (favored.includes('金')) out.push('适合规则明确、结果导向体系。');
  if (favored.includes('水')) out.push('适合跨区域、跨资源协作结构。');
  const down = industries.find((i) => i.direction === 'down');
  if (down) out.push(`当前${down.industry}承压，宜轻资产试探。`);
  return out.length ? out : ['优先低摩擦、能形成长期复利的合作组合。'];
}

function klineBand(score: number) {
  if (score >= 75) return 'push';
  if (score >= 55) return 'steady';
  if (score >= 40) return 'caution';
  return 'defend';
}

function uniqueStrings(items: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const t = `${item || ''}`.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function asStringListLong(values: unknown, maxLen = 80): string[] {
  if (!Array.isArray(values)) {
    if (typeof values === 'string' && values.trim()) {
      return [presentReportText(values, maxLen)].filter(Boolean);
    }
    return [];
  }
  return values.map((v) => presentReportText(v, maxLen)).filter(Boolean);
}

function buildPlaybookRows(
  playbook?: Parameters<typeof buildExpertDeskView>[0]['decisionPlaybook']
): ExpertPlaybookRow[] {
  if (!Array.isArray(playbook)) return [];
  return playbook.slice(0, 8).map((item, i) => ({
    key: item.key || `pb-${i}`,
    title: presentReportText(item.title, 28) || '操作剧本',
    track: presentReportText(item.track, 12) || '—',
    priority: presentReportText(item.priority, 8) || '—',
    score: Number(item.score) || 0,
    stance: presentReportText(item.stance, 12) || '—',
    bestWindow: presentReportText(item.bestWindow, 20) || '—',
    whyNow: presentReportText(item.whyNow, 160) || '',
    nowAction: presentReportText(item.nowAction, 120) || '',
    avoidAction: presentReportText(item.avoidAction, 120) || '',
  }));
}

function buildBoostPack(result: FortuneAnalysisResult): ExpertBoostPack {
  const advice = result.advice || ({} as any);
  // 合并专项颜色/方位，避免只取顶层空数组
  const domainColors = ['career', 'wealth', 'marriage', 'health'].flatMap((k) =>
    asStringListLong((advice as any)[k]?.colors, 16)
  );
  const domainDirs = ['career', 'wealth', 'marriage', 'health'].flatMap((k) => {
    const b = (advice as any)[k] || {};
    return [
      ...asStringListLong(b.directions, 12),
      ...(b.direction ? [presentReportText(b.direction, 12)] : []),
    ];
  });
  return {
    colors: uniqueStrings([...asStringListLong(advice.colors, 16), ...domainColors]).slice(0, 10),
    directions: uniqueStrings([...asStringListLong(advice.directions, 12), ...domainDirs]).slice(0, 10),
    numbers: (Array.isArray(advice.numbers) ? advice.numbers : [])
      .map((n: unknown) => String(n))
      .slice(0, 10),
    timing: uniqueStrings(asStringListLong(advice.timing, 80)).slice(0, 10),
  };
}

function round1(v: unknown): number | null {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
}

function buildPillarRows(
  pillars?: Pillar[] | null,
  basic?: { year?: string; month?: string; day?: string; hour?: string },
  dayMaster = '',
  kongWang: string[] = []
): ExpertPillarRow[] {
  if (Array.isArray(pillars) && pillars.length) {
    return pillars.slice(0, 4).map((p, i) => {
      const gan = presentReportText(p.celestialStem, 2);
      const zhi = presentReportText(p.earthlyBranch, 2);
      return {
        label: PILLAR_LABELS[i] || `柱${i + 1}`,
        gan,
        zhi,
        ganZhi: `${gan}${zhi}`,
        hiddenStems: asStringList(p.hiddenStems),
        nayin: presentReportText(p.nayin, 12) || '—',
        mainElement: ELEMENT_CN[p.fiveElements?.main || ''] || presentReportText(p.fiveElements?.main, 4) || '—',
        hiddenElements: (p.fiveElements?.hidden || []).map((e) => ELEMENT_CN[e] || e),
        combinations: asStringList(p.relationships?.combination),
        clashes: asStringList(p.relationships?.clash),
        penalties: asStringList(p.relationships?.penalty),
        harms: asStringList(p.relationships?.harm),
        changSheng: getChangSheng(dayMaster, zhi),
        isKongWang: isZhiKongWang(zhi, kongWang),
        ganShiShen: dayMaster && gan ? calculateShiShen(dayMaster, gan) || '—' : '—',
      };
    });
  }

  return [basic?.year, basic?.month, basic?.day, basic?.hour]
    .map((v, i) => {
      const gz = presentReportText(v, 4);
      const gan = gz.slice(0, 1);
      const zhi = gz.slice(1, 2);
      return {
        label: PILLAR_LABELS[i]!,
        gan,
        zhi,
        ganZhi: gz || '—',
        hiddenStems: [] as string[],
        nayin: '—',
        mainElement: '—',
        hiddenElements: [] as string[],
        combinations: [] as string[],
        clashes: [] as string[],
        penalties: [] as string[],
        harms: [] as string[],
        changSheng: getChangSheng(dayMaster, zhi),
        isKongWang: isZhiKongWang(zhi, kongWang),
        ganShiShen: dayMaster && gan ? calculateShiShen(dayMaster, gan) || '—' : '—',
      };
    })
    .filter((p) => p.ganZhi && p.ganZhi !== '—');
}

function buildSolarBlock(input: {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  timezone: number;
}): ExpertSolarBlock {
  const location = resolveBirthLocationProfile(input.birthPlace, input.timezone);
  const parts = parseClock(input.birthDate, input.birthTime);
  let trueSolar: TrueSolarTimeResult | null = null;
  if (parts && location.longitude != null) {
    try {
      trueSolar = calculateTrueSolarTime(
        parts.year,
        parts.month,
        parts.day,
        parts.hour,
        parts.minute,
        0,
        location.longitude,
        input.timezone
      );
    } catch {
      trueSolar = null;
    }
  }

  const trueSolarText = trueSolar
    ? `${trueSolar.year}-${pad2(trueSolar.month)}-${pad2(trueSolar.day)} ${pad2(trueSolar.hour)}:${pad2(trueSolar.minute)}`
    : '未能计算（缺出生日期或经度）';

  return {
    clockDate: input.birthDate || '—',
    clockTime: input.birthTime || '—',
    birthPlace: input.birthPlace || '—',
    timezone: input.timezone,
    longitude: location.longitude,
    locationNote: location.note || '',
    locationConfidence: location.confidence || 'low',
    usedEstimate: location.confidence !== 'high',
    trueSolar,
    trueSolarText,
    longitudeOffset: trueSolar?.longitudeOffset ?? null,
    equationOfTime: trueSolar?.equationOfTime ?? null,
    totalCorrection: trueSolar?.correctionMinutes ?? null,
  };
}

function buildFiveElements(fe?: FiveElements | null) {
  const order = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
  return order.map((key) => {
    const item = fe?.[key];
    return {
      key,
      label: ELEMENT_CN[key] || key,
      strength: Number(item?.strength) || 0,
      quality: presentReportText(item?.quality, 12) || '—',
      description: presentReportText(item?.description, 80) || '',
    };
  });
}

function mapDayunRow(d: DayunInfo, dayMaster = '', kongWang: string[] = []): ExpertDayunRow {
  const zhi = (d.zhi || d.ganZhi?.[1] || '').trim();
  return {
    index: d.index,
    ganZhi: d.ganZhi,
    startAge: d.startAge,
    endAge: d.endAge,
    startYear: d.startYear,
    endYear: d.endYear,
    ganWuxing: ELEMENT_CN[d.ganWuxing] || d.ganWuxing,
    zhiWuxing: ELEMENT_CN[d.zhiWuxing] || d.zhiWuxing,
    quality: d.quality,
    yongShenMatch: d.yongShenMatch,
    description: presentReportText(d.description, 80) || '',
    isCurrent: !!d.isCurrent,
    changSheng: getChangSheng(dayMaster, zhi),
    isKongWang: isZhiKongWang(zhi, kongWang),
  };
}

function buildSuiyunNotes(
  dayunGanZhi: string,
  liunianGanZhi: string,
  yongJi: { yongShen: string[]; jiShen: string[] }
): string[] {
  const notes: string[] = [];
  if (dayunGanZhi && liunianGanZhi) {
    notes.push(`岁运对照：大运 ${dayunGanZhi} × 流年 ${liunianGanZhi}`);
    if (dayunGanZhi === liunianGanZhi) {
      notes.push('岁运并临：大运与流年干支相同，力量叠加强，吉凶更易放大。');
    }
    const dGan = dayunGanZhi[0];
    const lGan = liunianGanZhi[0];
    const dZhi = dayunGanZhi[1];
    const lZhi = liunianGanZhi[1];
    if (dGan && lGan && dGan === lGan) notes.push(`天干同气：${dGan}，宜看天干五行是否为用/忌。`);
    if (dZhi && lZhi && dZhi === lZhi) notes.push(`地支伏吟：${dZhi}，地支力量加重。`);
  }
  if (yongJi.jiShen.length) {
    notes.push(`忌神 ${yongJi.jiShen.join('、')} 若在岁运透干或旺地，优先防守。`);
  }
  if (yongJi.yongShen.length) {
    notes.push(`用神 ${yongJi.yongShen.join('、')} 若在岁运得气，可作进取窗口参考。`);
  }
  if (!notes.length) notes.push('请结合原局用忌与干支刑冲合害自行点盘。');
  return notes.slice(0, 6);
}

function extractShenSha(result: FortuneAnalysisResult): string[] {
  const shen = (result as any).shenSha;
  if (!shen) return [];
  if (Array.isArray(shen.list)) {
    return shen.list
      .map((item: any) => {
        if (typeof item === 'string') return presentReportText(item, 24);
        return presentReportText(item?.name || item?.title || item?.label, 24);
      })
      .filter(Boolean)
      .slice(0, 20);
  }
  if (Array.isArray(shen)) {
    return shen.map((x) => presentReportText(x, 24)).filter(Boolean).slice(0, 20);
  }
  return [];
}

function extractGanZhi(text: string): string {
  const m = `${text || ''}`.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/);
  return m?.[0] || '';
}

function parseClock(dateStr: string, timeStr: string) {
  const dm = `${dateStr || ''}`.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!dm) return null;
  const tm = `${timeStr || '12:00'}`.match(/^(\d{1,2}):(\d{1,2})/);
  return {
    year: Number(dm[1]),
    month: Number(dm[2]),
    day: Number(dm[3]),
    hour: tm ? Number(tm[1]) : 12,
    minute: tm ? Number(tm[2]) : 0,
  };
}

function asStringList(values?: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => presentReportText(v, 12)).filter(Boolean);
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}
