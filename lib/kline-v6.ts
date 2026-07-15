/**
 * V6 K-line 算法 — 移除 sin() 人造周期，改用真实命理加权引擎。
 *
 * 核心变化：
 * - 不再使用 Math.sin(seed) 当作"确定性因子"
 * - 每个年度分数 = 原局基线 + 大运加权 + 流年加权 + 合冲刑害修正
 * - 所有因子的方向、量级都可解释（用神/忌神匹配 → 加/减分）
 *
 * 输出与旧版 v1 接口兼容（FortuneAnalysisResult['klineData']）。
 */

import type { DayunResult } from '@/lib/dayun-calculator';
import type { FortuneAnalysisResult, Pillar } from '@/lib/user-types';
import type { YongShenResult } from '@/lib/bazi-analyzer';
import {
  GAN_TO_WUXING,
  GAN_HE, GAN_CHONG,
  ZHI_HE, ZHI_CHONG, ZHI_XING, ZHI_HAI,
  calculateShiShen,
} from '@/lib/bazi-constants';

// ── 天干/地支 → 年份映射（简化版流年干支推导） ──
const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function getYearGanZhi(year: number): string {
  const ganIdx = (year - 4) % 10;
  const zhiIdx = (year - 4) % 12;
  return (TIAN_GAN[ganIdx] || '') + (DI_ZHI[zhiIdx] || '');
}

// ── 五行生克权重量表 ──
const ELEMENT_GENERATE: Record<string, string> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const ELEMENT_CONTROL: Record<string, string> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

// ── 原局基线计算 ──
interface NatalBaseline {
  career: number;    // -15 ~ +15
  wealth: number;    // -15 ~ +15
  marriage: number;  // -15 ~ +15
  health: number;    // -15 ~ +15
}

function computeNatalBaseline(
  pillars: Pillar[],
  yongShen: YongShenResult | null,
): NatalBaseline {
  const dayElement = GAN_TO_WUXING[pillars[2]?.celestialStem] || 'wood';
  const yongElements = yongShen?.yongShen || [];
  const jiElements = yongShen?.jiShen || [];

  // 通根计数
  const rootCount = pillars.reduce((sum, p) =>
    sum + p.hiddenStems.filter(s => GAN_TO_WUXING[s] === dayElement).length, 0);

  // 用神通根
  const yongRootCount = pillars.reduce((sum, p) =>
    sum + p.hiddenStems.filter(s => yongElements.includes(GAN_TO_WUXING[s])).length, 0);

  // 合冲刑害
  const allZhi = pillars.map(p => p.earthlyBranch);
  const clashes = countRelations(allZhi, ZHI_CHONG);
  const combinations = countRelations(allZhi, ZHI_HE);
  const penalties = countRelations(allZhi, ZHI_XING);
  const harms = countRelations(allZhi, ZHI_HAI);

  // 事业线 = 官杀 + 印星 + 通根
  const career = clampNatal(
    (yongRootCount * 3) + rootCount * 2 - clashes * 1.5 - penalties * 1
  );

  // 财富线 = 财星 + 食伤生财
  const wealth = clampNatal(
    yongRootCount * 2.5 + rootCount * 1.5 - harms * 1.8 + combinations * 1.2
  );

  // 婚恋线 = 日支合冲 + 桃花 + 配偶星
  const marriage = clampNatal(
    combinations * 2 - clashes * 2.5 - penalties * 1.5 + rootCount * 0.8
  );

  // 健康线 = 通根 - 冲刑 - 忌神
  const health = clampNatal(
    rootCount * 1.8 - clashes * 2 - penalties * 1.5 - jiElements.length * 1.2
  );

  return { career, wealth, marriage, health };
}

function countRelations(allZhi: string[], relMap: Record<string, string>): number {
  let count = 0;
  for (let i = 0; i < allZhi.length; i++) {
    for (let j = i + 1; j < allZhi.length; j++) {
      if (relMap[allZhi[i]] === allZhi[j]) count++;
    }
  }
  return count;
}

function clampNatal(val: number): number {
  return Math.max(-15, Math.min(15, Math.round(val * 10) / 10));
}

// ── 大运加权 ──
function dayunWeight(
  activeDayun: DayunResult['dayunList'][number] | null,
  yongShen: YongShenResult | null,
): number {
  if (!activeDayun || !yongShen) return 0;
  const yongElements = yongShen.yongShen;
  const jiElements = yongShen.jiShen;
  let weight = 0;

  // 天干匹配
  if (activeDayun.ganWuxing) {
    if (yongElements.includes(activeDayun.ganWuxing)) weight += 8;
    else if (jiElements.includes(activeDayun.ganWuxing)) weight -= 7;
  }

  // 地支匹配
  if (activeDayun.zhiWuxing) {
    if (yongElements.includes(activeDayun.zhiWuxing)) weight += 6;
    else if (jiElements.includes(activeDayun.zhiWuxing)) weight -= 5;
  }

  // quality 修正
  if (activeDayun.quality === 'excellent') weight += 3;
  else if (activeDayun.quality === 'poor') weight -= 4;

  return weight;
}

// ── 流年加权 ──
function liunianWeight(
  liuNianGanZhi: string,
  dayMaster: string,
  yongShen: YongShenResult | null,
  pillars: Pillar[],
): { score: number; shiShen: string; relationLabel: string } {
  if (!yongShen) return { score: 0, shiShen: '', relationLabel: '' };

  const gan = liuNianGanZhi[0];
  const zhi = liuNianGanZhi[1];
  const element = GAN_TO_WUXING[gan] || '';
  const yongElements = yongShen.yongShen;
  const jiElements = yongShen.jiShen;
  const xiElements = yongShen.xiShen;

  let score = 0;
  if (yongElements.includes(element)) score += 10;
  else if (xiElements.includes(element)) score += 5;
  else if (jiElements.includes(element)) score -= 8;

  // 地支与原局合冲刑害
  const allZhi = pillars.map(p => p.earthlyBranch);
  let relationScore = 0;
  const relations: string[] = [];

  for (const pZhi of allZhi) {
    if (ZHI_HE[zhi] === pZhi) { relationScore += 4; relations.push(`合${pZhi}`); }
    if (ZHI_CHONG[zhi] === pZhi) { relationScore -= 6; relations.push(`冲${pZhi}`); }
    if (ZHI_XING[zhi] === pZhi) { relationScore -= 3; relations.push(`刑${pZhi}`); }
    if (ZHI_HAI[zhi] === pZhi) { relationScore -= 2; relations.push(`害${pZhi}`); }
  }

  // 天干合冲
  const allGan = pillars.map(p => p.celestialStem);
  for (const pGan of allGan) {
    if (GAN_HE[gan] === pGan) { relationScore += 3; relations.push(`合${pGan}`); }
    if (GAN_CHONG[gan] === pGan) { relationScore -= 4; relations.push(`冲${pGan}`); }
  }

  const shiShen = calculateShiShen(dayMaster, gan) || '';
  return {
    score: score + relationScore * 0.7,
    shiShen,
    relationLabel: relations.join('、'),
  };
}

// ── 格局差异化权重 ──
export interface PatternWeights {
  career: { dayun: number; liunian: number };
  wealth: { dayun: number; liunian: number };
  marriage: { dayun: number; liunian: number };
  health: { dayun: number; liunian: number };
}

const DEFAULT_PATTERN_WEIGHTS: PatternWeights = {
  career: { dayun: 0.85, liunian: 0.75 },
  wealth: { dayun: 0.75, liunian: 0.8 },
  marriage: { dayun: 0.35, liunian: 0.5 },
  health: { dayun: 0.3, liunian: 0.35 },
};

export function getPatternWeights(pattern: string): PatternWeights {
  const p = pattern || '正格';

  if (p.includes('官') || p.includes('杀') || p.includes('印') || p === '建禄格' || p === '羊刃格') {
    return {
      career: { dayun: 0.92, liunian: 0.82 },
      wealth: { dayun: 0.68, liunian: 0.72 },
      marriage: { dayun: 0.38, liunian: 0.48 },
      health: { dayun: 0.32, liunian: 0.36 },
    };
  }

  if (p.includes('财') || p.includes('偏财') || p.includes('正财')) {
    return {
      career: { dayun: 0.72, liunian: 0.68 },
      wealth: { dayun: 0.9, liunian: 0.88 },
      marriage: { dayun: 0.42, liunian: 0.55 },
      health: { dayun: 0.28, liunian: 0.32 },
    };
  }

  if (p.includes('食神') || p.includes('伤官') || p.includes('从儿')) {
    return {
      career: { dayun: 0.78, liunian: 0.7 },
      wealth: { dayun: 0.88, liunian: 0.85 },
      marriage: { dayun: 0.45, liunian: 0.58 },
      health: { dayun: 0.34, liunian: 0.38 },
    };
  }

  if (p.includes('从旺') || p.includes('从强') || p.includes('专旺')) {
    return {
      career: { dayun: 0.8, liunian: 0.78 },
      wealth: { dayun: 0.7, liunian: 0.74 },
      marriage: { dayun: 0.3, liunian: 0.42 },
      health: { dayun: 0.42, liunian: 0.45 },
    };
  }

  if (p.includes('从弱') || p.includes('从杀') || p.includes('从财')) {
    return {
      career: { dayun: 0.88, liunian: 0.8 },
      wealth: { dayun: 0.82, liunian: 0.84 },
      marriage: { dayun: 0.48, liunian: 0.62 },
      health: { dayun: 0.38, liunian: 0.4 },
    };
  }

  return DEFAULT_PATTERN_WEIGHTS;
}

// ── 五行生理健康衰减 ──
function resolveDayMasterElement(dayMaster: string, yongShen: YongShenResult | null): string {
  const fromGan = GAN_TO_WUXING[dayMaster];
  if (fromGan) return fromGan;
  const cn = yongShen?.dayMasterElement;
  if (!cn) return 'wood';
  const map: Record<string, string> = { '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water' };
  return map[cn] || 'wood';
}

function healthDecayByElement(age: number, dayMaster: string, yongShen: YongShenResult | null): number {
  if (age <= 0) return 0;

  const element = resolveDayMasterElement(dayMaster, yongShen);
  const jiPenalty = yongShen?.jiShen?.includes(element) ? 0.15 : 0;

  switch (element) {
    case 'water': {
      // 肾水系统：30 岁后线性衰减
      if (age <= 30) return 0;
      return -((age - 30) * 0.06 + jiPenalty);
    }
    case 'fire': {
      // 心火系统：40 岁后波动加剧
      if (age <= 40) return age > 32 ? -((age - 32) * 0.02) : 0;
      const base = -((age - 40) * 0.05);
      const volatility = Math.sin((age - 40) / 3) * 0.4;
      return base + volatility - jiPenalty;
    }
    case 'wood': {
      // 肝木系统：35 岁后压力敏感
      if (age <= 35) return 0;
      return -((age - 35) * 0.045 + jiPenalty);
    }
    case 'metal': {
      // 肺金系统：45 岁后呼吸/免疫负担
      if (age <= 45) return age > 38 ? -((age - 38) * 0.015) : 0;
      return -((age - 45) * 0.05 + jiPenalty);
    }
    case 'earth':
    default: {
      // 脾胃土系统：38 岁后代谢放缓
      if (age <= 38) return 0;
      return -((age - 38) * 0.035 + jiPenalty);
    }
  }
}

// ── 主函数：生成 V6 K-line ──

export interface KlineEvidenceV6 {
  natal: Array<{ driver: string; impact: number }>;
  dayun: Array<{ driver: string; impact: number }>;
  liunian: Array<{ driver: string; impact: number }>;
  drivers: string[];
  risks: string[];
  ganZhi: string;
  dayunGanZhi: string | null;
  elementBreakdown: {
    yearElement: string;
    yongShenMatch: 'strong' | 'good' | 'neutral' | 'bad' | 'conflict';
    relationSummary: string;
  };
}

export interface KlinePointV6 {
  year: number;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
  evidence: KlineEvidenceV6;
}

export type LifeKlineV6Options = {
  /** 前后各 N 年（默认 10）；与 fromBirth 互斥时 fromBirth 优先 */
  yearRange?: number;
  /** 从出生年起铺整段人生 */
  fromBirth?: boolean;
  /** 人生年数（默认 80，含出生年共 80 点） */
  lifeYears?: number;
  /** 强制起止年（含） */
  startYear?: number;
  endYear?: number;
};

/**
 * 生成人生 K 线（年粒度）
 * - 默认：当前年前后 yearRange
 * - fromBirth + lifeYears=80：出生起 80 年整段人生
 */
export function generateLifeKlineV6(
  birthDate: Date,
  gender: 'male' | 'female',
  pillars: Pillar[],
  yongShen: YongShenResult | null,
  dayunResult?: DayunResult,
  yearRangeOrOptions: number | LifeKlineV6Options = 10,
): KlinePointV6[] {
  const currentYear = new Date().getFullYear();
  const birthYear = birthDate.getFullYear();
  const dayMaster = pillars[2]?.celestialStem || '';
  const natal = computeNatalBaseline(pillars, yongShen);
  const years: KlinePointV6[] = [];

  const opts: LifeKlineV6Options =
    typeof yearRangeOrOptions === 'number'
      ? { yearRange: yearRangeOrOptions }
      : yearRangeOrOptions || {};

  const lifeYears = opts.lifeYears ?? 80;
  let startYear: number;
  let endYear: number;
  if (typeof opts.startYear === 'number' && typeof opts.endYear === 'number') {
    startYear = opts.startYear;
    endYear = opts.endYear;
  } else if (opts.fromBirth) {
    startYear = birthYear;
    endYear = birthYear + Math.max(1, lifeYears) - 1;
    // 至少覆盖到当前年后 2 年，避免“只看到过去”
    endYear = Math.max(endYear, currentYear + 2);
  } else {
    const yearRange = opts.yearRange ?? 10;
    startYear = Math.max(birthYear, currentYear - yearRange);
    endYear = currentYear + yearRange;
  }

  for (let year = startYear; year <= endYear; year++) {
    const age = year - birthYear;
    const liuNianGanZhi = getYearGanZhi(year);
    const liuNian = liunianWeight(liuNianGanZhi, dayMaster, yongShen, pillars);
    const rawDayunList = dayunResult?.dayunList
      ?? (dayunResult as { dayuns?: typeof dayunResult.dayunList } | null | undefined)?.dayuns
      ?? [];
    const dayunList = Array.isArray(rawDayunList) ? rawDayunList : [];
    const activeDayun = dayunList.find((d) => year >= d.startYear && year <= d.endYear) || null;
    const dayunW = dayunWeight(activeDayun, yongShen);
    const ageHealth = healthDecayByElement(age, dayMaster, yongShen);
    const weights = getPatternWeights(yongShen?.pattern?.pattern || '正格');

    // 四条线的分数 = 60(基线) + 原局因子 + 大运因子(按格局权重) + 流年因子(按格局权重)
    const careerScore = clampScore(60 + natal.career + dayunW * weights.career.dayun + liuNian.score * weights.career.liunian);
    const wealthScore = clampScore(60 + natal.wealth + dayunW * weights.wealth.dayun + liuNian.score * weights.wealth.liunian);
    const marriageScore = clampScore(60 + natal.marriage + dayunW * weights.marriage.dayun + liuNian.score * weights.marriage.liunian);
    const healthScore = clampScore(60 + natal.health + dayunW * weights.health.dayun + liuNian.score * weights.health.liunian + ageHealth);

    const liuNianElement = GAN_TO_WUXING[liuNianGanZhi[0]] || '';
    const yongShenMatch = resolveYongShenMatch(liuNianElement, yongShen);

    const evidence: KlineEvidenceV6 = {
      natal: [
        { driver: `日主${dayMaster}，用神${(yongShen?.yongShen || []).join('、')}`, impact: Math.round((natal.career + natal.wealth + natal.marriage + natal.health) / 4) },
      ],
      dayun: activeDayun
        ? [
            { driver: `${activeDayun.ganZhi}大运（${activeDayun.startYear}-${activeDayun.endYear}年）`, impact: dayunW },
            { driver: `大运${activeDayun.yongShenMatch === 'good' ? '顺用神' : activeDayun.yongShenMatch === 'bad' ? '逆用神' : '平稳'}`, impact: activeDayun.yongShenMatch === 'good' ? 3 : activeDayun.yongShenMatch === 'bad' ? -3 : 0 },
          ]
        : [{ driver: '无当前大运数据', impact: 0 }],
      liunian: [
        { driver: `${liuNianGanZhi}流年·${liuNianElement}${liuNian.shiShen ? `·${liuNian.shiShen}` : ''}`, impact: liuNian.score },
        { driver: liuNian.relationLabel ? `与原局${liuNian.relationLabel}` : '与原局无特殊合冲刑害', impact: liuNian.relationLabel ? Math.round(liuNian.score * 0.7) : 0 },
      ],
      drivers: [
        `${yongShenMatch === 'strong' || yongShenMatch === 'good' ? '顺用神之年' : yongShenMatch === 'conflict' ? '忌神触达之年' : '平运之年'}`,
        activeDayun ? `${activeDayun.ganZhi}大运${yongShenMatch === 'strong' ? '加持' : '均衡'}流年` : '',
      ].filter(Boolean),
      risks: [
        yongShen?.jiShen?.includes(liuNianElement) ? `流年${liuNianElement}落忌神` : '',
        activeDayun?.yongShenMatch === 'bad' ? `大运${activeDayun.ganZhi}与用神相逆` : '',
      ].filter(Boolean),
      ganZhi: liuNianGanZhi,
      dayunGanZhi: activeDayun?.ganZhi || null,
      elementBreakdown: {
        yearElement: liuNianElement,
        yongShenMatch,
        relationSummary: liuNian.relationLabel || '平稳',
      },
    };

    years.push({ year, career: careerScore, wealth: wealthScore, marriage: marriageScore, health: healthScore, evidence });
  }

  return years;
}

/**
 * 月粒度 K 线：在年分基础上叠加流月干支用忌修正（公历月近似，非精确节气月）
 * 用于「近 10 年 / 近 3 年」按月阅读。
 */
export interface KlineMonthPointV6 {
  year: number;
  month: number;
  /** YYYY-MM */
  key: string;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
  evidence: KlineEvidenceV6 & { monthGanZhi?: string };
}

export function generateMonthlyKlineV6(
  birthDate: Date,
  gender: 'male' | 'female',
  pillars: Pillar[],
  yongShen: YongShenResult | null,
  dayunResult: DayunResult | undefined,
  opts: { startYear: number; startMonth?: number; endYear: number; endMonth?: number },
): KlineMonthPointV6[] {
  const yearly = generateLifeKlineV6(birthDate, gender, pillars, yongShen, dayunResult, {
    startYear: opts.startYear,
    endYear: opts.endYear,
  });
  const byYear = new Map(yearly.map((p) => [p.year, p]));
  const out: KlineMonthPointV6[] = [];
  const startM = opts.startMonth ?? 1;
  const endM = opts.endMonth ?? 12;

  for (let year = opts.startYear; year <= opts.endYear; year++) {
    const yPoint = byYear.get(year);
    if (!yPoint) continue;
    const mFrom = year === opts.startYear ? startM : 1;
    const mTo = year === opts.endYear ? endM : 12;
    for (let month = mFrom; month <= mTo; month++) {
      const monthGz = getApproxMonthGanZhiLocal(year, month);
      const delta = monthStemDelta(monthGz, yongShen);
      const career = clampScore(yPoint.career + delta * 0.85);
      const wealth = clampScore(yPoint.wealth + delta * 0.9);
      const marriage = clampScore(yPoint.marriage + delta * 0.55);
      const health = clampScore(yPoint.health + delta * 0.4);
      out.push({
        year,
        month,
        key: `${year}-${String(month).padStart(2, '0')}`,
        career,
        wealth,
        marriage,
        health,
        evidence: {
          ...yPoint.evidence,
          monthGanZhi: monthGz,
          ganZhi: `${yPoint.evidence.ganZhi}/${monthGz}`,
          liunian: [
            ...(yPoint.evidence.liunian || []),
            {
              driver: `流月${monthGz}（公历${month}月近似）`,
              impact: Math.round(delta * 10) / 10,
            },
          ],
          drivers: [
            ...(yPoint.evidence.drivers || []).slice(0, 2),
            delta > 1 ? `流月偏用神` : delta < -1 ? `流月偏忌神` : `流月中平`,
          ],
        },
      });
    }
  }
  return out;
}

/** 与 bazi-pro-tools 同口径的近似月柱（避免循环依赖） */
function getApproxMonthGanZhiLocal(year: number, month: number): string {
  const yearGz = getYearGanZhi(year);
  const yearGan = yearGz[0] || '甲';
  const yearGanIdx = TIAN_GAN.indexOf(yearGan);
  const yinGanStarts = [2, 4, 6, 8, 0];
  const group = ((yearGanIdx % 5) + 5) % 5;
  const yinGanIdx = yinGanStarts[group] ?? 2;
  const zhiIdx = (month + 1) % 12;
  const ganIdx = (yinGanIdx + ((zhiIdx - 2 + 12) % 12)) % 10;
  return `${TIAN_GAN[ganIdx]}${DI_ZHI[zhiIdx]}`;
}

function monthStemDelta(monthGanZhi: string, yongShen: YongShenResult | null): number {
  if (!yongShen || !monthGanZhi) return 0;
  const gan = monthGanZhi[0] || '';
  const zhi = monthGanZhi[1] || '';
  const ganEl = GAN_TO_WUXING[gan] || '';
  // 地支五行粗映射
  const zhiElMap: Record<string, string> = {
    子: 'water', 丑: 'earth', 寅: 'wood', 卯: 'wood',
    辰: 'earth', 巳: 'fire', 午: 'fire', 未: 'earth',
    申: 'metal', 酉: 'metal', 戌: 'earth', 亥: 'water',
  };
  const zhiEl = zhiElMap[zhi] || '';
  let d = 0;
  const yong = yongShen.yongShen || [];
  const xi = yongShen.xiShen || [];
  const ji = yongShen.jiShen || [];
  if (yong.includes(ganEl)) d += 4;
  else if (xi.includes(ganEl)) d += 2.5;
  else if (ji.includes(ganEl)) d -= 3.5;
  if (yong.includes(zhiEl)) d += 2;
  else if (ji.includes(zhiEl)) d -= 2;
  return Math.max(-8, Math.min(8, d));
}

function clampScore(val: number): number {
  return Math.max(25, Math.min(98, Math.round(val)));
}

function resolveYongShenMatch(element: string, yongShen: YongShenResult | null): KlineEvidenceV6['elementBreakdown']['yongShenMatch'] {
  if (!yongShen) return 'neutral';
  if (yongShen.yongShen.includes(element)) return 'strong';
  if (yongShen.xiShen.includes(element)) return 'good';
  if (yongShen.jiShen.includes(element)) return 'conflict';
  if (yongShen.qiuShen?.includes(element)) return 'bad';
  return 'neutral';
}

// ── 锚点检测（自动识别高低点） ──
export interface KlineAnchorV6 {
  year: number;
  age: number;
  score: number;
  type: 'peak' | 'trough' | 'turning' | 'stable';
  reason: string;
}

export function detectKlineAnchorsV6(klineData: KlinePointV6[]): KlineAnchorV6[] {
  if (klineData.length < 3) return [];
  const anchors: KlineAnchorV6[] = [];

  for (let i = 1; i < klineData.length - 1; i++) {
    const prev = average([klineData[i - 1].career, klineData[i - 1].wealth, klineData[i - 1].marriage, klineData[i - 1].health]);
    const curr = average([klineData[i].career, klineData[i].wealth, klineData[i].marriage, klineData[i].health]);
    const next = average([klineData[i + 1].career, klineData[i + 1].wealth, klineData[i + 1].marriage, klineData[i + 1].health]);

    const threshold = 5; // 至少 5 分差才算锚点
    if (curr > prev + threshold && curr > next + threshold) {
      anchors.push({
        year: klineData[i].year,
        age: klineData[i].year - (klineData[0].year - (klineData[0].evidence?.natal?.[0] ? 0 : klineData[0].year)),
        score: Math.round(curr),
        type: 'peak',
        reason: buildAnchorReason(klineData[i], 'peak'),
      });
    } else if (curr < prev - threshold && curr < next - threshold) {
      anchors.push({
        year: klineData[i].year,
        age: klineData[i].year - (klineData[0].year),
        score: Math.round(curr),
        type: 'trough',
        reason: buildAnchorReason(klineData[i], 'trough'),
      });
    } else if (Math.abs(curr - prev) >= threshold && Math.abs(curr - next) < 3) {
      anchors.push({
        year: klineData[i].year,
        age: klineData[i].year - klineData[0].year,
        score: Math.round(curr),
        type: 'turning',
        reason: buildAnchorReason(klineData[i], 'turning'),
      });
    }
  }

  return anchors;
}

function buildAnchorReason(point: KlinePointV6, type: string): string {
  const eb = point.evidence?.elementBreakdown;
  const ysm = eb?.yongShenMatch;
  if (type === 'peak') return `${point.year}年${ysm === 'strong' ? '用神到位' : ysm === 'good' ? '喜神显达' : '运作顺遂'}，四线齐升形成高点。`;
  if (type === 'trough') return `${point.year}年${ysm === 'conflict' ? '忌神触达' : '节奏受压'}，宜收敛守势。`;
  return `${point.year}年运势转折，${ysm === 'strong' ? '顺势而变' : '主动调整节奏'}。`;
}

function average(vals: number[]): number {
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
