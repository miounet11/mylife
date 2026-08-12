// ── 八字分析器 V6 ──

import {
  GAN_TO_WUXING,
  ZHI_CANG_GAN,
  calculateShiShen,
} from '@/lib/bazi-constants';
import type { ShenShaResult } from '@/lib/shensha-calculator';

export interface YongShenResult {
  dayMaster: string;
  dayMasterElement: string;
  strength: string;
  strengthDesc: string;
  score: number;
  yongShen: string[];
  xiShen: string[];
  jiShen: string[];
  qiuShen: string[];
  analysis: string;
  tiaohuo?: { element: string; reason: string; note: string };
  tongguan?: { element: string; reason: string; note: string };
  pattern?: { pattern: string; description: string };
  confidence?: { score: number; boundary?: string };
  threeGain?: { reasonChain: string[] };
  /**
   * 面向用户的表述（先扶抑、后调候，贴近大众心智）。
   * 引擎内部仍用 score/藏干/司令；此处只负责「怎么说」。
   */
  userFacing?: {
    /** 一句总览：身偏弱，宜水木生扶 */
    headline: string;
    /** 宜生扶 | 宜克泄 | 宜调候补缺 */
    actionHint: string;
    /** 扶抑主用（中文五行） */
    structureYong: string[];
    /** 调候说明（有则显示，不与主用混列） */
    tiaohuoNote?: string;
  };
  details: {
    helpStrength: number;
    drainStrength: number;
    seasonBonus: number;
    /** 人元司令（分日）摘要；无出生日则退回本气 */
    siling?: {
      gan: string;
      element: string;
      role: string;
      dayInMonth: number;
      fromSiling: boolean;
    };
  };
  priority: Array<{ element: string; reason: string }>;
}

/** Optional birth timing so 司令 can resolve by day-of-month within the branch. */
export type DetermineYongShenOptions = {
  /** Day index within month branch (1-based from 交节). Wins over birthDate. */
  dayInMonth?: number | null;
  /** Civil birth date; used with lunar PrevJie to compute dayInMonth. */
  birthDate?: Date | string | null;
  birthHour?: number;
  birthMinute?: number;
};

function parseBirthDateOption(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }
  const m = `${value}`.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  return Number.isFinite(d.getTime()) ? d : null;
}

function resolveDayInMonthOption(opts?: DetermineYongShenOptions | null): number | null {
  if (!opts) return null;
  if (opts.dayInMonth != null && Number.isFinite(opts.dayInMonth)) {
    return Math.floor(Number(opts.dayInMonth));
  }
  const birth = parseBirthDateOption(opts.birthDate);
  if (!birth) return null;
  return computeDayInMonthBranch(
    birth,
    opts.birthHour ?? 12,
    opts.birthMinute ?? 0,
  );
}

const ELEMENTS = ['wood', 'fire', 'earth', 'metal', 'water'] as const;
type Element = (typeof ELEMENTS)[number];

const CN_TO_EN: Record<string, Element> = {
  '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water',
};
const EN_TO_CN: Record<Element, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
};

const GENERATES: Record<Element, Element> = {
  wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood',
};
const CONTROLS: Record<Element, Element> = {
  wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood',
};

const GENERATED_BY: Record<Element, Element> = {
  wood: 'water', fire: 'wood', earth: 'fire', metal: 'earth', water: 'metal',
};
const CONTROLLED_BY: Record<Element, Element> = {
  wood: 'metal', fire: 'water', earth: 'wood', water: 'earth', metal: 'fire',
};

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'];

/** 月令四季旺相休囚死 */
const SEASON_STATE: Record<string, Record<Element, number>> = {
  spring: { wood: 15, fire: 10, earth: -5, metal: 0, water: 5 },
  summer: { wood: 5, fire: 15, earth: 10, metal: -5, water: 0 },
  autumn: { wood: -5, fire: 0, earth: 5, metal: 15, water: 10 },
  winter: { wood: 10, fire: -5, earth: 0, metal: 5, water: 15 },
};

const MONTH_TO_SEASON: Record<string, keyof typeof SEASON_STATE> = {
  '寅': 'spring', '卯': 'spring', '辰': 'spring',
  '巳': 'summer', '午': 'summer', '未': 'summer',
  '申': 'autumn', '酉': 'autumn', '戌': 'autumn',
  '亥': 'winter', '子': 'winter', '丑': 'winter',
};

const ROOT_WEIGHTS = [12, 7, 4];
const HIDDEN_WEIGHTS = [1.0, 0.6, 0.35];
const STEM_WEIGHTS = { helpSame: 6, helpGenerate: 5, drainOutput: 4, drainWealth: 5, drainControl: 7 };

const TIAN_YI_GUI_REN: Record<string, string[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳'],
  '辛': ['寅', '午'],
};

const TAO_HUA: Record<string, string> = {
  '寅': '卯', '午': '卯', '戌': '卯',
  '申': '酉', '子': '酉', '辰': '酉',
  '亥': '子', '卯': '子', '未': '子',
  '巳': '午', '酉': '午', '丑': '午',
};

const YANG_REN: Record<string, string> = {
  '甲': '卯', '乙': '寅', '丙': '午', '丁': '巳',
  '戊': '午', '己': '巳', '庚': '酉', '辛': '申',
  '壬': '子', '癸': '亥',
};

const YI_MA: Record<string, string> = {
  '寅': '申', '午': '申', '戌': '申',
  '申': '寅', '子': '寅', '辰': '寅',
  '巳': '亥', '酉': '亥', '丑': '亥',
  '亥': '巳', '卯': '巳', '未': '巳',
};

const WEN_CHANG: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉',
  '戊': '申', '己': '酉', '庚': '亥', '辛': '子',
  '壬': '寅', '癸': '卯',
};

const LUCKY_COLORS: Record<Element, string[]> = {
  wood: ['绿色', '青色'], fire: ['红色', '紫色'], earth: ['黄色', '棕色'],
  metal: ['白色', '金色'], water: ['黑色', '蓝色'],
};
const LUCKY_DIRECTIONS: Record<Element, string> = {
  wood: '东方', fire: '南方', earth: '中央', metal: '西方', water: '北方',
};
const LUCKY_NUMBERS: Record<Element, number[]> = {
  wood: [3, 8], fire: [2, 7], earth: [5, 0], metal: [4, 9], water: [1, 6],
};

function parseBazi(bazi: string[]) {
  if (!bazi || bazi.length < 4) return null;
  const pillars = bazi.slice(0, 4).map((gz) => ({
    gan: gz[0] || '',
    zhi: gz[1] || '',
    ganZhi: gz,
  }));
  if (pillars.some((p) => !p.gan || !p.zhi)) return null;
  return pillars;
}

function toElement(gan: string): Element | null {
  const el = GAN_TO_WUXING[gan];
  return (el as Element) || null;
}

function uniqElements(elements: Element[]): Element[] {
  return [...new Set(elements)];
}

/**
 * 十二月人元司令分野（约 30 日）— 自月建交节起算。
 * 次序为用事先后（余气→中气→本气），与 ZHI_CANG_GAN 本中余存储序不同。
 * 参考常见《三命通会》分野表（天数因流派略差 ±1，作工程近似）。
 */
const SILING_SEGMENTS: Record<string, Array<{ gan: string; days: number; role: string }>> = {
  子: [
    { gan: '壬', days: 10, role: '余气' },
    { gan: '癸', days: 20, role: '本气' },
  ],
  丑: [
    { gan: '癸', days: 9, role: '余气' },
    { gan: '辛', days: 3, role: '中气' },
    { gan: '己', days: 18, role: '本气' },
  ],
  寅: [
    { gan: '戊', days: 7, role: '余气' },
    { gan: '丙', days: 7, role: '中气' },
    { gan: '甲', days: 16, role: '本气' },
  ],
  卯: [
    { gan: '甲', days: 10, role: '余气' },
    { gan: '乙', days: 20, role: '本气' },
  ],
  辰: [
    { gan: '乙', days: 9, role: '余气' },
    { gan: '癸', days: 3, role: '中气' },
    { gan: '戊', days: 18, role: '本气' },
  ],
  巳: [
    { gan: '戊', days: 5, role: '余气' },
    { gan: '庚', days: 9, role: '中气' },
    { gan: '丙', days: 16, role: '本气' },
  ],
  午: [
    { gan: '丙', days: 10, role: '余气' },
    { gan: '己', days: 9, role: '中气' },
    { gan: '丁', days: 11, role: '本气' },
  ],
  未: [
    { gan: '丁', days: 9, role: '余气' },
    { gan: '乙', days: 3, role: '中气' },
    { gan: '己', days: 18, role: '本气' },
  ],
  申: [
    { gan: '戊', days: 7, role: '余气' },
    { gan: '壬', days: 7, role: '中气' },
    { gan: '庚', days: 16, role: '本气' },
  ],
  酉: [
    { gan: '庚', days: 10, role: '余气' },
    { gan: '辛', days: 20, role: '本气' },
  ],
  戌: [
    { gan: '辛', days: 9, role: '余气' },
    { gan: '丁', days: 3, role: '中气' },
    { gan: '戊', days: 18, role: '本气' },
  ],
  亥: [
    { gan: '戊', days: 7, role: '余气' },
    { gan: '甲', days: 7, role: '中气' },
    { gan: '壬', days: 16, role: '本气' },
  ],
};

export type SilingYuan = {
  gan: string;
  element: Element;
  role: string;
  /** 1-based day within month branch */
  dayInMonth: number;
  /** true when resolved from day-of-month, false = fallback 本气 */
  fromSiling: boolean;
};

/**
 * 按月内第几天取「人元司令」。
 * dayInMonth: 自月建交节起第 1 日…约 30 日；越界夹到首尾段。
 */
export function resolveSilingYuan(monthZhi: string, dayInMonth?: number | null): SilingYuan {
  const hidden = ZHI_CANG_GAN[monthZhi] || [];
  const fallbackGan = hidden[0] || '甲';
  const fallbackEl = toElement(fallbackGan) || 'wood';
  const segs = SILING_SEGMENTS[monthZhi];
  if (!segs?.length || dayInMonth == null || !Number.isFinite(dayInMonth)) {
    return {
      gan: fallbackGan,
      element: fallbackEl,
      role: '本气',
      dayInMonth: dayInMonth && dayInMonth > 0 ? Math.floor(dayInMonth) : 0,
      fromSiling: false,
    };
  }
  const total = segs.reduce((s, x) => s + x.days, 0) || 30;
  let d = Math.floor(dayInMonth);
  if (d < 1) d = 1;
  if (d > total) d = total;
  let cursor = 0;
  for (const seg of segs) {
    cursor += seg.days;
    if (d <= cursor) {
      const el = toElement(seg.gan) || fallbackEl;
      return {
        gan: seg.gan,
        element: el,
        role: seg.role,
        dayInMonth: d,
        fromSiling: true,
      };
    }
  }
  const last = segs[segs.length - 1];
  return {
    gan: last.gan,
    element: toElement(last.gan) || fallbackEl,
    role: last.role,
    dayInMonth: d,
    fromSiling: true,
  };
}

/**
 * 出生时刻 → 当前月建内第几天（交节起算）。
 * 失败返回 null，调用方退回本气。
 */
export function computeDayInMonthBranch(
  birthDate: Date,
  hour = 12,
  minute = 0,
): number | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Solar } = require('lunar-javascript') as {
      Solar: {
        fromYmdHms: (
          y: number,
          m: number,
          d: number,
          h: number,
          mi: number,
          s: number,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ) => any;
      };
    };
    const y = birthDate.getFullYear();
    const m = birthDate.getMonth() + 1;
    const d = birthDate.getDate();
    const lunar = Solar.fromYmdHms(y, m, d, hour, minute, 0).getLunar();
    const prevJie = lunar.getPrevJie().getSolar();
    const jieMs = new Date(
      prevJie.getYear(),
      prevJie.getMonth() - 1,
      prevJie.getDay(),
      0,
      0,
      0,
    ).getTime();
    const birthMs = new Date(y, m - 1, d, hour, minute, 0).getTime();
    const days = Math.floor((birthMs - jieMs) / (24 * 3600 * 1000)) + 1;
    if (!Number.isFinite(days) || days < 1) return 1;
    return Math.min(days, 35);
  } catch {
    return null;
  }
}

function tenGodBonusForElement(dmElement: Element, other: Element): number {
  if (other === dmElement) return 16;
  if (other === GENERATED_BY[dmElement]) return 12;
  if (other === CONTROLLED_BY[dmElement]) return -10;
  if (other === GENERATES[dmElement]) return -7;
  if (other === CONTROLS[dmElement]) return -5;
  return 0;
}

/**
 * 月令对日主的「得令 / 失令」加权。
 * 优先「人元司令」（分日），否则月支本气；中余气轻量修正 + 四季弱修正。
 */
function getMonthOrderBonus(
  monthZhi: string,
  dmElement: Element,
  siling?: SilingYuan | null,
): number {
  const hidden = ZHI_CANG_GAN[monthZhi] || [];
  const commandGan = siling?.gan || hidden[0];
  const commandEl = siling?.element || (commandGan ? toElement(commandGan) : null);

  let bonus = 0;
  if (commandEl) {
    bonus = tenGodBonusForElement(dmElement, commandEl);
    // 司令若非本气（余气/中气用事），权重略减
    if (siling?.fromSiling && siling.role !== '本气') {
      bonus *= 0.85;
    }
  }

  // 非司令藏干：轻量背景
  hidden.forEach((gan, i) => {
    if (gan === commandGan) return;
    const el = toElement(gan);
    if (!el) return;
    const w = i === 0 ? 2.5 : i === 1 ? 1.8 : 1.2;
    if (el === dmElement || el === GENERATED_BY[dmElement]) bonus += w;
    else if (el === CONTROLLED_BY[dmElement]) bonus -= w * 0.75;
    else if (el === GENERATES[dmElement] || el === CONTROLS[dmElement]) bonus -= w * 0.35;
  });

  const season = MONTH_TO_SEASON[monthZhi] || 'spring';
  const seasonal = (SEASON_STATE[season][dmElement] || 0) * 0.2;
  bonus += seasonal;

  return Math.round(bonus * 10) / 10;
}

/** @deprecated use getMonthOrderBonus */
function getSeasonBonus(monthZhi: string, dmElement: Element): number {
  return getMonthOrderBonus(monthZhi, dmElement, null);
}

function calculateRootStrength(pillars: ReturnType<typeof parseBazi>, dmElement: Element): number {
  if (!pillars) return 0;
  let score = 0;
  pillars.forEach((pillar, idx) => {
    const hidden = ZHI_CANG_GAN[pillar.zhi] || [];
    hidden.forEach((gan, hIdx) => {
      if (toElement(gan) === dmElement) {
        const base = idx === 2 ? ROOT_WEIGHTS[0] : ROOT_WEIGHTS[Math.min(hIdx, 2)];
        score += base * HIDDEN_WEIGHTS[hIdx];
      }
    });
  });
  return score;
}

/** 地支藏干并入帮扶/克泄的柱权重（日支通根另计，此处不再重复） */
const BRANCH_PILLAR_SCALE = [0.28, 0.55, 0, 0.32]; // 年 月 日 时

function applyHelpDrainForElement(
  el: Element,
  dmElement: Element,
  scale: number,
  acc: { help: number; drain: number },
) {
  if (el === dmElement) acc.help += STEM_WEIGHTS.helpSame * scale;
  else if (el === GENERATED_BY[dmElement]) acc.help += STEM_WEIGHTS.helpGenerate * scale;
  else if (el === GENERATES[dmElement]) acc.drain += STEM_WEIGHTS.drainOutput * scale;
  else if (el === CONTROLS[dmElement]) acc.drain += STEM_WEIGHTS.drainWealth * scale;
  else if (el === CONTROLLED_BY[dmElement]) acc.drain += STEM_WEIGHTS.drainControl * scale;
}

function calculateStemHelpDrain(
  pillars: ReturnType<typeof parseBazi>,
  dayMaster: string,
  dmElement: Element,
): { help: number; drain: number } {
  if (!pillars) return { help: 0, drain: 0 };
  const acc = { help: 0, drain: 0 };

  // 1) 天干（日干本身不计）
  pillars.forEach((pillar, idx) => {
    if (idx === 2) return;
    const el = toElement(pillar.gan);
    if (!el) return;
    applyHelpDrainForElement(el, dmElement, 1, acc);
  });

  // 2) 地支藏干（月令权重大，年/时次之；日支由通根处理）
  pillars.forEach((pillar, idx) => {
    const pillarScale = BRANCH_PILLAR_SCALE[idx] ?? 0;
    if (pillarScale <= 0) return;
    const hidden = ZHI_CANG_GAN[pillar.zhi] || [];
    hidden.forEach((gan, hIdx) => {
      const el = toElement(gan);
      if (!el) return;
      const scale = pillarScale * (HIDDEN_WEIGHTS[hIdx] ?? 0.3);
      applyHelpDrainForElement(el, dmElement, scale, acc);
    });
  });

  return {
    help: Math.round(acc.help * 10) / 10,
    drain: Math.round(acc.drain * 10) / 10,
  };
}

function calculateElementScores(bazi: string[]): Record<Element, number> {
  const pillars = parseBazi(bazi);
  const scores: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  if (!pillars) return scores;

  pillars.forEach((pillar, idx) => {
    const ganEl = toElement(pillar.gan);
    if (ganEl) scores[ganEl] += idx === 1 ? 12 : idx === 2 ? 10 : 8;

    const hidden = ZHI_CANG_GAN[pillar.zhi] || [];
    hidden.forEach((gan, hIdx) => {
      const el = toElement(gan);
      if (!el) return;
      const weight = (idx === 1 ? 10 : 8) * HIDDEN_WEIGHTS[hIdx];
      scores[el] += weight;
    });
  });

  return scores;
}

function normalizeElementScores(scores: Record<Element, number>): Record<Element, number> {
  const total = ELEMENTS.reduce((sum, el) => sum + scores[el], 0) || 1;
  const normalized: Record<Element, number> = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  ELEMENTS.forEach((el) => { normalized[el] = (scores[el] / total) * 100; });
  return normalized;
}

function resolveStrengthLevel(score: number): { strength: string; strengthDesc: string } {
  if (score >= 72) return { strength: 'very_strong', strengthDesc: '身极旺' };
  if (score >= 58) return { strength: 'strong', strengthDesc: '身偏旺' };
  if (score >= 42) return { strength: 'neutral', strengthDesc: '中和' };
  if (score >= 28) return { strength: 'weak', strengthDesc: '身偏弱' };
  return { strength: 'very_weak', strengthDesc: '身极弱' };
}

/**
 * 从格判定（从严）：
 * - 传统：日主无根或极弱才论「从」；有明显通根不得从旺/从强。
 * - 此前仅用 score+selfGroup 会在「酉月甲木但寅卯通根」时误判从旺。
 */
function detectCongPattern(
  normalized: Record<Element, number>,
  dmElement: Element,
  strengthScore: number,
  rootStrength = 0,
): { pattern: string; description: string } | null {
  const selfGroup = normalized[dmElement] + normalized[GENERATED_BY[dmElement]];
  const sorted = ELEMENTS.map((el) => ({ el, pct: normalized[el] })).sort((a, b) => b.pct - a.pct);
  const dominant = sorted[0];

  // 通根明显（约等于日支中气以上）→ 不从
  const hasSolidRoot = rootStrength >= 8;

  if (!hasSolidRoot && strengthScore >= 72 && selfGroup >= 58 && dominant.el === dmElement) {
    return {
      pattern: '从旺格',
      description: `${EN_TO_CN[dmElement]}气独旺且日主无坚实通根，全局顺势而从，宜顺其旺势取用神。`,
    };
  }

  if (!hasSolidRoot && strengthScore >= 68 && selfGroup >= 55) {
    return {
      pattern: '从强格',
      description: `印比党众极盛、日主少根，宜顺旺势，以泄耗为调节。`,
    };
  }

  // 从弱：日主极弱且印比很少
  if (strengthScore <= 30 && selfGroup <= 16 && rootStrength <= 5) {
    const drainEl = sorted[0].el;
    const patternName = drainEl === CONTROLS[dmElement] ? '从财格'
      : drainEl === CONTROLLED_BY[dmElement] ? '从杀格'
        : drainEl === GENERATES[dmElement] ? '从儿格' : '从弱格';
    return {
      pattern: patternName,
      description: `日主${EN_TO_CN[dmElement]}极弱少根，${EN_TO_CN[drainEl]}势成主导，宜从势而行。`,
    };
  }

  if (strengthScore <= 34 && selfGroup <= 20 && rootStrength <= 4) {
    return {
      pattern: '从弱格',
      description: `日主失令少根，全局克泄耗重，宜从顺势五行。`,
    };
  }

  return null;
}

function detectTiaohuo(monthZhi: string): YongShenResult['tiaohuo'] | undefined {
  const season = MONTH_TO_SEASON[monthZhi];
  if (season === 'winter') {
    return {
      element: 'fire',
      reason: '冬月水寒木冻，需火调候暖局',
      note: '优先见丙丁或南方火气，改善寒凝之弊',
    };
  }
  if (season === 'summer') {
    return {
      element: 'water',
      reason: '夏月火旺土燥，需水调候润局',
      note: '优先见壬癸或北方水气，缓解炎燥之弊',
    };
  }
  return undefined;
}

function detectTongguan(normalized: Record<Element, number>): YongShenResult['tongguan'] | undefined {
  const pairs: Array<{ a: Element; b: Element; bridge: Element; label: string }> = [
    { a: 'wood', b: 'earth', bridge: 'fire', label: '木土相战' },
    { a: 'earth', b: 'water', bridge: 'metal', label: '土水相战' },
    { a: 'water', b: 'fire', bridge: 'wood', label: '水火相战' },
    { a: 'fire', b: 'metal', bridge: 'earth', label: '火金相战' },
    { a: 'metal', b: 'wood', bridge: 'water', label: '金木相战' },
  ];

  for (const pair of pairs) {
    const scoreA = normalized[pair.a];
    const scoreB = normalized[pair.b];
    if (scoreA >= 22 && scoreB >= 22 && Math.abs(scoreA - scoreB) <= 12) {
      return {
        element: pair.bridge,
        reason: `${pair.label}，以${EN_TO_CN[pair.bridge]}通关`,
        note: `当${EN_TO_CN[pair.a]}与${EN_TO_CN[pair.b]}两旺相峙时，${EN_TO_CN[pair.bridge]}可化对峙为流通`,
      };
    }
  }
  return undefined;
}

/** 十神角色白话（相对日主）— 大众最熟的读法 */
function tenGodRolePlain(dmElement: Element, el: Element): string {
  if (el === dmElement) return '比劫帮身';
  if (el === GENERATED_BY[dmElement]) return '印星生身';
  if (el === GENERATES[dmElement]) return '食伤泄秀';
  if (el === CONTROLS[dmElement]) return '财星耗身';
  if (el === CONTROLLED_BY[dmElement]) return '官杀克身';
  return '五行调节';
}

function strengthActionHint(strength: string, strengthDesc: string): string {
  if (strength === 'very_strong' || strength === 'strong' || strengthDesc.includes('偏旺')) {
    return '宜克泄（官杀、财、食伤一类）';
  }
  if (strength === 'very_weak' || strength === 'weak' || strengthDesc.includes('偏弱')) {
    return '宜生扶（印、比劫一类）';
  }
  return '宜补偏调候，不强求一边倒';
}

function buildYongXiJiQiu(
  dmElement: Element,
  strength: string,
  pattern: { pattern: string; description: string } | null,
  normalized: Record<Element, number>,
  tiaohuo?: YongShenResult['tiaohuo'],
  tongguan?: YongShenResult['tongguan'],
  _opts?: { help?: number; drain?: number },
): Pick<YongShenResult, 'yongShen' | 'xiShen' | 'jiShen' | 'qiuShen' | 'priority'> {
  let yong: Element[] = [];
  let xi: Element[] = [];
  let ji: Element[] = [];
  let qiu: Element[] = [];

  if (pattern?.pattern.includes('从旺') || pattern?.pattern === '从强格') {
    yong = [dmElement];
    xi = [GENERATES[dmElement]];
    ji = [CONTROLLED_BY[dmElement], CONTROLLED_BY[GENERATES[dmElement]]];
    qiu = [CONTROLLED_BY[dmElement]];
  } else if (pattern?.pattern.includes('从')) {
    const sorted = ELEMENTS.map((el) => ({ el, pct: normalized[el] })).sort((a, b) => b.pct - a.pct);
    const dominant = sorted[0].el;
    yong = [dominant];
    xi = [GENERATED_BY[dominant], GENERATES[dominant]].filter((el) => el !== dmElement);
    ji = [dmElement, GENERATED_BY[dmElement]];
    qiu = [GENERATED_BY[dmElement]];
  } else if (strength === 'very_strong' || strength === 'strong') {
    yong = uniqElements([CONTROLLED_BY[dmElement], CONTROLS[dmElement], GENERATES[dmElement]]);
    xi = uniqElements([CONTROLS[dmElement], GENERATES[dmElement]]);
    ji = uniqElements([dmElement, GENERATED_BY[dmElement]]);
    qiu = uniqElements([GENERATED_BY[dmElement], GENERATED_BY[GENERATED_BY[dmElement]]]);
  } else if (strength === 'very_weak' || strength === 'weak') {
    yong = uniqElements([GENERATED_BY[dmElement], dmElement]);
    xi = uniqElements([GENERATED_BY[dmElement], dmElement]);
    ji = uniqElements([GENERATES[dmElement], CONTROLS[dmElement], CONTROLLED_BY[dmElement]]);
    qiu = uniqElements([CONTROLS[dmElement], CONTROLLED_BY[dmElement]]);
  } else {
    // 中和：按五行偏枯补缺；若印比偏弱则仍以扶身为先
    const selfGroup = normalized[dmElement] + normalized[GENERATED_BY[dmElement]];
    const drainGroup =
      normalized[GENERATES[dmElement]] +
      normalized[CONTROLS[dmElement]] +
      normalized[CONTROLLED_BY[dmElement]];
    if (selfGroup + 6 < drainGroup) {
      // 中和偏弱：扶身（印/比）— 大众心智：偏弱就喜印比
      yong = uniqElements([GENERATED_BY[dmElement], dmElement]);
      xi = uniqElements([GENERATED_BY[dmElement], dmElement, GENERATES[dmElement]]);
      ji = uniqElements([CONTROLLED_BY[dmElement], CONTROLS[dmElement]]);
      qiu = uniqElements([CONTROLLED_BY[dmElement]]);
    } else if (selfGroup > drainGroup + 6) {
      // 中和偏旺：抑身
      yong = uniqElements([CONTROLLED_BY[dmElement], GENERATES[dmElement], CONTROLS[dmElement]]);
      xi = uniqElements([GENERATES[dmElement], CONTROLS[dmElement]]);
      ji = uniqElements([dmElement, GENERATED_BY[dmElement]]);
      qiu = uniqElements([GENERATED_BY[dmElement]]);
    } else {
      const weakest = ELEMENTS.map((el) => ({ el, pct: normalized[el] })).sort((a, b) => a.pct - b.pct)[0].el;
      const strongest = ELEMENTS.map((el) => ({ el, pct: normalized[el] })).sort((a, b) => b.pct - a.pct)[0].el;
      yong = [weakest];
      xi = uniqElements([weakest, GENERATED_BY[weakest]]);
      ji = [strongest];
      qiu = [GENERATES[strongest]];
    }
  }

  /**
   * 调候：不并入主「用神」列表。
   * 用户心智：身弱=喜印比；若把冬火与水木并列成「用神」，会像系统自相矛盾。
   * 普及读法：先扶抑定主用，调候作喜神/附注（「另需火暖局」）。
   * 例外：扶抑主用本身已是该五行（如夏月身旺用水），则保持在用神，不再重复塞喜神。
   */
  const tiaohuoEl = tiaohuo?.element as Element | undefined;
  if (tiaohuoEl && !yong.includes(tiaohuoEl) && !ji.includes(tiaohuoEl)) {
    xi = uniqElements([tiaohuoEl, ...xi]);
  }
  if (tongguan && !xi.includes(tongguan.element as Element) && !yong.includes(tongguan.element as Element)) {
    xi = uniqElements([tongguan.element as Element, ...xi]);
  }

  yong = yong.filter((el) => !ji.includes(el)).slice(0, 3);
  xi = xi.filter((el) => !ji.includes(el) && !yong.includes(el)).slice(0, 3);
  ji = ji.filter((el) => !yong.includes(el)).slice(0, 3);
  qiu = qiu.filter((el) => !yong.includes(el) && !xi.includes(el)).slice(0, 2);

  const priority = [
    ...yong.map((element) => ({
      element,
      reason: `用神（扶抑）：${tenGodRolePlain(dmElement, element)}`,
    })),
    ...xi.map((element) => {
      const isTiao = tiaohuoEl === element;
      const isTong = tongguan?.element === element;
      const tag = isTiao ? '喜神（调候）' : isTong ? '喜神（通关）' : '喜神';
      return { element, reason: `${tag}：${tenGodRolePlain(dmElement, element)}` };
    }),
    ...ji.map((element) => ({
      element,
      reason: `忌神：${tenGodRolePlain(dmElement, element)}，易加重失衡`,
    })),
    ...qiu.map((element) => ({ element, reason: '仇神：助忌伤用' })),
  ];

  return { yongShen: yong, xiShen: xi, jiShen: ji, qiuShen: qiu, priority };
}

/**
 * 用大众最熟的「得令 / 得地 / 得势 → 身强身弱 → 扶抑用神」叙事写理由链。
 * 内部司令/藏干只翻译成日常用语，不抛术语颠覆认知。
 */
function buildPlainReasonChain(params: {
  dmElement: Element;
  monthZhi: string;
  siling: SilingYuan;
  seasonBonus: number;
  rootStrength: number;
  help: number;
  drain: number;
  strengthDesc: string;
  pattern: { pattern: string; description: string } | null;
  yong: Element[];
  ji: Element[];
  tiaohuo?: YongShenResult['tiaohuo'];
  tongguan?: YongShenResult['tongguan'];
}): string[] {
  const {
    dmElement, monthZhi, siling, seasonBonus, rootStrength,
    help, drain, strengthDesc, pattern, yong, ji, tiaohuo, tongguan,
  } = params;
  const dmCn = EN_TO_CN[dmElement];
  const cmdCn = EN_TO_CN[siling.element];

  // 1) 月令 — 得令/失令（不提司令分野术语）
  let monthLine: string;
  if (seasonBonus >= 8) {
    monthLine = `月令${monthZhi}以${cmdCn}当令，日主${dmCn}得令，根基偏旺`;
  } else if (seasonBonus < 0) {
    monthLine = `月令${monthZhi}以${cmdCn}当令，日主${dmCn}偏失令（不得令）`;
  } else {
    monthLine = `月令${monthZhi}以${cmdCn}为主气，日主${dmCn}平令，不算特别旺也不算特别弱`;
  }

  // 2) 得地 / 得势
  const rootWord =
    rootStrength >= 12 ? '通根较深（得地）'
      : rootStrength >= 6 ? '有一定通根'
        : rootStrength > 0 ? '通根偏浅'
          : '几乎无根';
  let forceLine: string;
  if (drain > help * 1.15) {
    forceLine = `${rootWord}；生扶弱于克泄耗（不得势），整体偏消耗`;
  } else if (help > drain * 1.15) {
    forceLine = `${rootWord}；生扶重于克泄耗（得势），整体偏有力`;
  } else {
    forceLine = `${rootWord}；生扶与克泄大致相当`;
  }

  // 3) 结论强弱 + 扶抑
  const yongText = yong.map((e) => {
    const cn = EN_TO_CN[e];
    return `${cn}（${tenGodRolePlain(dmElement, e)}）`;
  }).join('、');
  const jiText = ji.slice(0, 2).map((e) => EN_TO_CN[e]).join('、');
  const patternName = pattern?.pattern && !pattern.pattern.includes('正格')
    ? `，格局倾向「${pattern.pattern}」`
    : '';
  const structureLine = `综合为「${strengthDesc}」${patternName} → 按扶抑：主用神取${yongText || '结构综合'}${jiText ? `，忌${jiText}` : ''}`;

  const chain = [monthLine, forceLine, structureLine];

  // 4) 调候附注（不与主用混谈）
  if (tiaohuo) {
    const te = EN_TO_CN[tiaohuo.element as Element] || tiaohuo.element;
    chain.push(`另需调候：${tiaohuo.reason}（喜${te}作辅助，不改变上面扶抑主线）`);
  }
  if (tongguan) {
    const te = EN_TO_CN[tongguan.element as Element] || tongguan.element;
    chain.push(`通关：${tongguan.reason}（喜${te}化对峙）`);
  }

  return chain;
}

function buildConfidence(score: number): YongShenResult['confidence'] {
  const distance = Math.abs(score - 50);
  const boundary = distance < 8 ? '日主强弱接近中和边界' : distance < 14 ? '日主强弱处于临界区间' : undefined;
  const clarity = Math.min(1, distance / 35);
  return {
    score: Math.round((0.45 + clarity * 0.55) * 100) / 100,
    boundary,
  };
}

function buildAnalysisText(
  dmElement: Element,
  strengthDesc: string,
  pattern: { pattern: string; description: string } | null,
  yong: Element[],
  ji: Element[],
): string {
  const parts = [
    `日主${EN_TO_CN[dmElement]}，${strengthDesc}`,
    pattern ? `格局为${pattern.pattern}` : '按正格扶抑取用',
    yong.length ? `用神取${yong.map((e) => EN_TO_CN[e]).join('、')}` : '',
    ji.length ? `忌神为${ji.map((e) => EN_TO_CN[e]).join('、')}` : '',
  ].filter(Boolean);
  return parts.join('；') + '。';
}

export function determineYongShen(
  bazi: string[],
  options?: DetermineYongShenOptions | null,
): YongShenResult | null {
  const pillars = parseBazi(bazi);
  if (!pillars) return null;

  const dayMaster = pillars[2].gan;
  const dmElement = toElement(dayMaster);
  if (!dmElement) return null;

  const monthZhi = pillars[1].zhi;

  const dayInMonth = resolveDayInMonthOption(options);
  const siling = resolveSilingYuan(monthZhi, dayInMonth);
  const seasonBonus = getMonthOrderBonus(monthZhi, dmElement, siling);
  const rootStrength = calculateRootStrength(pillars, dmElement);
  const { help, drain } = calculateStemHelpDrain(pillars, dayMaster, dmElement);

  const rawScore = 50 + seasonBonus + rootStrength + help - drain;
  let score = Math.max(5, Math.min(95, Math.round(rawScore)));
  let { strength, strengthDesc } = resolveStrengthLevel(score);

  // 克泄明显大于帮扶、且分数贴近强弱分界时，禁止硬判身偏旺/偏弱（防喜忌翻转）
  if (drain > help * 1.15 && score >= 56 && score <= 66 && strength === 'strong') {
    score = Math.min(score, 55);
    ({ strength, strengthDesc } = resolveStrengthLevel(score));
  } else if (help > drain * 1.15 && score >= 34 && score <= 44 && strength === 'weak') {
    score = Math.max(score, 45);
    ({ strength, strengthDesc } = resolveStrengthLevel(score));
  }

  // 中和区间内标注偏旺/偏弱，避免用户读成「绝对身强」
  if (strength === 'neutral') {
    if (drain > help * 1.1) strengthDesc = '中和偏弱';
    else if (help > drain * 1.1) strengthDesc = '中和偏旺';
  }

  const elementScores = calculateElementScores(bazi);
  const normalized = normalizeElementScores(elementScores);
  const pattern = detectCongPattern(normalized, dmElement, score, rootStrength);
  const tiaohuo = detectTiaohuo(monthZhi);
  const tongguan = detectTongguan(normalized);
  const { yongShen, xiShen, jiShen, qiuShen, priority } = buildYongXiJiQiu(
    dmElement, strength, pattern, normalized, tiaohuo, tongguan, { help, drain },
  );

  const confidence = buildConfidence(score);
  const yongEls = yongShen as Element[];
  const jiEls = jiShen as Element[];
  const reasonChain = buildPlainReasonChain({
    dmElement,
    monthZhi,
    siling,
    seasonBonus,
    rootStrength,
    help,
    drain,
    strengthDesc,
    pattern,
    yong: yongEls,
    ji: jiEls,
    tiaohuo,
    tongguan,
  });
  const threeGain: YongShenResult['threeGain'] = { reasonChain };

  const actionHint = strengthActionHint(strength, strengthDesc);
  const structureYongCn = yongEls.map((e) => EN_TO_CN[e]);
  const tiaohuoNote = tiaohuo
    ? `${tiaohuo.reason}（${EN_TO_CN[tiaohuo.element as Element] || tiaohuo.element}作调候辅助，不是扶抑主用神）`
    : undefined;
  const headline = `日主${EN_TO_CN[dmElement]}「${strengthDesc}」，${actionHint}；主用神${structureYongCn.join('、') || '综合'}`;

  let analysis = buildAnalysisText(dmElement, strengthDesc, pattern, yongEls, jiEls);
  if (tiaohuo) {
    analysis = analysis.replace(/。$/, '') + `；${tiaohuo.reason}。`;
  }

  return {
    dayMaster,
    dayMasterElement: EN_TO_CN[dmElement],
    strength,
    strengthDesc,
    score,
    yongShen,
    xiShen,
    jiShen,
    qiuShen,
    analysis,
    tiaohuo,
    tongguan,
    pattern: pattern || { pattern: '正格', description: '日主强弱适中，按扶抑取用；调候、通关作辅助。' },
    confidence,
    threeGain,
    userFacing: {
      headline,
      actionHint,
      structureYong: structureYongCn,
      tiaohuoNote,
    },
    details: {
      helpStrength: Math.round(help * 10) / 10,
      drainStrength: Math.round(drain * 10) / 10,
      seasonBonus,
      siling: {
        gan: siling.gan,
        element: EN_TO_CN[siling.element],
        role: siling.role,
        dayInMonth: siling.dayInMonth,
        fromSiling: siling.fromSiling,
      },
    },
    priority,
  };
}

export function generateBaziShiShenAnalysis(bazi: string[]) {
  const pillars = parseBazi(bazi);
  const empty = {
    tenGodStructure: {
      self: '',
      output: [] as string[],
      wealth: [] as string[],
      input: [] as string[],
      control: [] as string[],
      controlled: [] as string[],
      lifeDomains: [] as Array<{ domain: string; driver: string; evidence: string[] }>,
      riskPatterns: [] as Array<{ name: string; note: string }>,
      opportunityPatterns: [] as Array<{ name: string; note: string }>,
      evidenceChain: [] as string[],
      byPillar: [] as Array<{ pillar: string; stem: string; branch: string; shiShen: string }>,
    },
    shiShenCount: {} as Record<string, number>,
    pillarsAnalysis: [] as Array<{ pillar: string; ganZhi: string; tianGanShiShen: string; branchShiShen: string[] }>,
  };

  if (!pillars) return empty;

  const dayMaster = pillars[2].gan;
  const shiShenCount: Record<string, number> = {};
  const pillarsAnalysis: typeof empty.pillarsAnalysis = [];
  const byPillar: typeof empty.tenGodStructure.byPillar = [];

  const output: string[] = [];
  const wealth: string[] = [];
  const input: string[] = [];
  const control: string[] = [];
  const controlled: string[] = [];

  const addGod = (name: string | null, weight = 1) => {
    if (!name) return;
    shiShenCount[name] = (shiShenCount[name] || 0) + weight;
    if (name === '正印' || name === '偏印') output.push(name);
    else if (name === '正财' || name === '偏财') input.push(name);
    else if (name === '正官' || name === '七杀') control.push(name);
    else if (name === '食神' || name === '伤官') controlled.push(name);
    else if (name === '比肩' || name === '劫财') wealth.push(name);
  };

  pillars.forEach((pillar, idx) => {
    const stemGod = idx === 2 ? '日主' : calculateShiShen(dayMaster, pillar.gan);
    const branchGods = (ZHI_CANG_GAN[pillar.zhi] || [])
      .map((gan) => calculateShiShen(dayMaster, gan))
      .filter((g): g is string => Boolean(g));

    if (idx !== 2) addGod(stemGod, 1.2);
    branchGods.forEach((g, hIdx) => addGod(g, hIdx === 0 ? 1 : 0.6));

    pillarsAnalysis.push({
      pillar: PILLAR_LABELS[idx],
      ganZhi: pillar.ganZhi,
      tianGanShiShen: stemGod || '',
      branchShiShen: branchGods,
    });

    byPillar.push({
      pillar: PILLAR_LABELS[idx],
      stem: pillar.gan,
      branch: pillar.zhi,
      shiShen: stemGod || '',
    });
  });

  const dominant = Object.entries(shiShenCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  const riskPatterns: Array<{ name: string; note: string }> = [];
  const opportunityPatterns: Array<{ name: string; note: string }> = [];

  if ((shiShenCount['伤官'] || 0) > 0 && (shiShenCount['正官'] || 0) > 0) {
    riskPatterns.push({ name: '伤官见官', note: '表达、规则与职位压力并存，注意分寸。' });
  }
  if ((shiShenCount['劫财'] || 0) >= 1.5 && (shiShenCount['正财'] || 0) > 0) {
    riskPatterns.push({ name: '比劫夺财', note: '合作与现金流边界需提前约定。' });
  }
  if ((shiShenCount['正印'] || 0) > 0 && (shiShenCount['正财'] || 0) > 0) {
    riskPatterns.push({ name: '财印相战', note: '现实收益与长期投入容易互相挤压。' });
  }
  if ((shiShenCount['食神'] || 0) > 0 || (shiShenCount['伤官'] || 0) > 0) {
    opportunityPatterns.push({ name: '食伤泄秀', note: '适合表达、作品与长期输出。' });
  }
  if ((shiShenCount['正财'] || 0) > 0 || (shiShenCount['偏财'] || 0) > 0) {
    opportunityPatterns.push({ name: '财星得用', note: '机会捕捉与资源配置能力可放大。' });
  }

  const lifeDomains = [
    {
      domain: 'career',
      driver: control.length ? `官杀${[...new Set(control)].join('、')}主导事业压力与职位` : '事业看月柱、官杀与印星结构',
      evidence: [...new Set(control), ...new Set(output)].slice(0, 4),
    },
    {
      domain: 'wealth',
      driver: input.length ? `财星${[...new Set(input)].join('、')}主资源与现金流` : '财富看财星、食伤生财与比劫分财',
      evidence: [...new Set(input), ...new Set(controlled)].slice(0, 4),
    },
    {
      domain: 'relationship',
      driver: '婚恋看日支、配偶星与合冲刑害',
      evidence: [...new Set([...input, ...control])].slice(0, 3),
    },
    {
      domain: 'growth',
      driver: output.length ? `印星${[...new Set(output)].join('、')}主学习恢复与底层能量` : '成长看印星、根气与调候',
      evidence: [...new Set(output)].slice(0, 3),
    },
  ];

  const evidenceChain = [
    `月令十神：${pillarsAnalysis[1]?.tianGanShiShen || '未知'}`,
    `时柱十神：${pillarsAnalysis[3]?.tianGanShiShen || '未知'}`,
    dominant ? `最显十神：${dominant}` : '',
    riskPatterns[0] ? `风险：${riskPatterns[0].name}` : '',
    opportunityPatterns[0] ? `机会：${opportunityPatterns[0].name}` : '',
  ].filter(Boolean);

  return {
    tenGodStructure: {
      self: dayMaster,
      output: [...new Set(output)],
      wealth: [...new Set(wealth)],
      input: [...new Set(input)],
      control: [...new Set(control)],
      controlled: [...new Set(controlled)],
      lifeDomains,
      riskPatterns,
      opportunityPatterns,
      evidenceChain,
      byPillar,
    },
    shiShenCount,
    pillarsAnalysis,
  };
}

export function getLuckyElements(yongShen: YongShenResult) {
  const toEl = (raw: string | undefined): Element => {
    if (!raw) return 'fire';
    if (ELEMENTS.includes(raw as Element)) return raw as Element;
    return CN_TO_EN[raw] || 'fire';
  };
  const primary = toEl(yongShen.yongShen[0]);
  const secondary = toEl(yongShen.xiShen[0] || yongShen.yongShen[1]) || primary;

  return {
    colors: [...new Set([...LUCKY_COLORS[primary], ...LUCKY_COLORS[secondary]])].slice(0, 4),
    directions: [...new Set([LUCKY_DIRECTIONS[primary], LUCKY_DIRECTIONS[secondary]])],
    numbers: [...new Set([...LUCKY_NUMBERS[primary], ...LUCKY_NUMBERS[secondary]])].slice(0, 4),
    yongShen: yongShen.yongShen,
    jiShen: yongShen.jiShen,
    xiShen: yongShen.xiShen,
  };
}

export function calculateWuxingStrength(bazi: string[], element: string): number {
  const enElement = CN_TO_EN[element] || (ELEMENTS.includes(element as Element) ? element as Element : null);
  if (!enElement) return 0;

  const scores = calculateElementScores(bazi);
  const total = ELEMENTS.reduce((sum, el) => sum + scores[el], 0) || 1;
  return Math.round((scores[enElement] / total) * 1000) / 10;
}

export function analyzeShenSha(bazi: string[]): ShenShaResult | null {
  const pillars = parseBazi(bazi);
  if (!pillars) return null;

  const dayMaster = pillars[2].gan;
  const dayBranch = pillars[2].zhi;
  const yearBranch = pillars[0].zhi;
  const list: ShenShaResult['list'] = [];

  const allBranches = pillars.map((p, idx) => ({ zhi: p.zhi, label: PILLAR_LABELS[idx] }));

  const tianYi = TIAN_YI_GUI_REN[dayMaster] || [];
  allBranches.forEach(({ zhi, label }) => {
    if (tianYi.includes(zhi)) {
      list.push({ name: '天乙贵人', pillar: label, description: `${zhi}为${dayMaster}日贵人位` });
    }
  });

  const peachTarget = TAO_HUA[dayBranch] || TAO_HUA[yearBranch];
  if (peachTarget) {
    allBranches.forEach(({ zhi, label }) => {
      if (zhi === peachTarget) {
        list.push({ name: '桃花', pillar: label, description: '人缘、魅力与关系机缘增强' });
      }
    });
  }

  const yangRen = YANG_REN[dayMaster];
  if (yangRen) {
    allBranches.forEach(({ zhi, label }) => {
      if (zhi === yangRen) {
        list.push({ name: '羊刃', pillar: label, description: '魄力与风险并存，注意冲动与外伤' });
      }
    });
  }

  const yiMa = YI_MA[yearBranch] || YI_MA[dayBranch];
  if (yiMa) {
    allBranches.forEach(({ zhi, label }) => {
      if (zhi === yiMa) {
        list.push({ name: '驿马', pillar: label, description: '变动、出行与跨域机会' });
      }
    });
  }

  const wenChang = WEN_CHANG[dayMaster];
  if (wenChang) {
    allBranches.forEach(({ zhi, label }) => {
      if (zhi === wenChang) {
        list.push({ name: '文昌', pillar: label, description: '学习、考试与表达力提升' });
      }
    });
  }

  return { list };
}