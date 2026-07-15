/**
 * K 线阅读视图：人生 80 年（年）/ 近 10 年（月）/ 近 3 年（月）
 * 优先使用报告已有 year 点；缺口用流年干支×用忌确定性补全（无 sin 周期）。
 */

export type KlineViewMode = 'life80' | 'months10' | 'months3';

export interface KlineYearInput {
  year: number;
  career?: number;
  wealth?: number;
  marriage?: number;
  health?: number;
  score?: number;
  evidence?: {
    ganZhi?: string;
    dayunGanZhi?: string | null;
    drivers?: string[];
    risks?: string[];
  };
}

export interface KlineChartPoint {
  /** X 轴键：年用 2024，月用 2024-03 */
  key: string;
  year: number;
  month?: number;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
  overall: number;
  ganZhi?: string;
  drivers?: string[];
  risks?: string[];
}

const TIAN_GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DI_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const GAN_EL: Record<string, string> = {
  甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土',
  庚: '金', 辛: '金', 壬: '水', 癸: '水',
};
const ZHI_EL: Record<string, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火',
  午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};
// English element tokens from engine
const EN_TO_CN: Record<string, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
};

function yearGanZhi(year: number): string {
  const ganIdx = ((year - 4) % 10 + 10) % 10;
  const zhiIdx = ((year - 4) % 12 + 12) % 12;
  return `${TIAN_GAN[ganIdx]}${DI_ZHI[zhiIdx]}`;
}

function monthGanZhi(year: number, month: number): string {
  const yearGan = yearGanZhi(year)[0] || '甲';
  const yearGanIdx = TIAN_GAN.indexOf(yearGan);
  const yinGanStarts = [2, 4, 6, 8, 0];
  const group = ((yearGanIdx % 5) + 5) % 5;
  const yinGanIdx = yinGanStarts[group] ?? 2;
  const zhiIdx = (month + 1) % 12;
  const ganIdx = (yinGanIdx + ((zhiIdx - 2 + 12) % 12)) % 10;
  return `${TIAN_GAN[ganIdx]}${DI_ZHI[zhiIdx]}`;
}

function normEls(list?: string[]): string[] {
  return (list || [])
    .map((s) => EN_TO_CN[s] || s)
    .filter(Boolean);
}

function clamp(n: number) {
  return Math.max(25, Math.min(98, Math.round(n)));
}

function overallOf(p: { career: number; wealth: number; marriage: number; health: number; score?: number }) {
  if (typeof p.score === 'number' && p.score > 0) return p.score;
  return Math.round((p.career + p.wealth + p.marriage + p.health) / 4);
}

function toYearPoint(p: KlineYearInput): KlineChartPoint {
  const career = Number(p.career) || 0;
  const wealth = Number(p.wealth) || 0;
  const marriage = Number(p.marriage) || 0;
  const health = Number(p.health) || 0;
  return {
    key: String(p.year),
    year: p.year,
    career,
    wealth,
    marriage,
    health,
    overall: overallOf({ career, wealth, marriage, health, score: p.score }),
    ganZhi: p.evidence?.ganZhi || yearGanZhi(p.year),
    drivers: p.evidence?.drivers?.slice(0, 2),
    risks: p.evidence?.risks?.slice(0, 2),
  };
}

function stemDelta(ganZhi: string, yong: string[], ji: string[]): number {
  const g = ganZhi[0] || '';
  const z = ganZhi[1] || '';
  const ge = GAN_EL[g] || '';
  const ze = ZHI_EL[z] || '';
  let d = 0;
  if (yong.includes(ge)) d += 3.5;
  else if (ji.includes(ge)) d -= 3;
  if (yong.includes(ze)) d += 1.5;
  else if (ji.includes(ze)) d -= 1.5;
  return d;
}

function fillMissingYear(
  year: number,
  nearest: KlineChartPoint | null,
  yong: string[],
  ji: string[],
): KlineChartPoint {
  const gz = yearGanZhi(year);
  const base = nearest || {
    key: String(year),
    year,
    career: 60,
    wealth: 60,
    marriage: 60,
    health: 60,
    overall: 60,
  };
  const d = stemDelta(gz, yong, ji);
  // 随距邻近年份略衰减，避免补点全贴同一水平
  const drift = nearest ? Math.min(6, Math.abs(year - nearest.year) * 0.15) : 0;
  const sign = d >= 0 ? 1 : -1;
  return {
    key: String(year),
    year,
    career: clamp(base.career + d * 0.85 - sign * drift * 0.3),
    wealth: clamp(base.wealth + d * 0.9 - sign * drift * 0.25),
    marriage: clamp(base.marriage + d * 0.5),
    health: clamp(base.health + d * 0.35 - drift * 0.2),
    overall: 0,
    ganZhi: gz,
    drivers: d > 1 ? [`${gz}偏用神`] : d < -1 ? [`${gz}偏忌神`] : [`${gz}中平`],
    risks: d < -2 ? ['流年承压，宜收敛'] : [],
  };
}

function recomputeOverall(p: KlineChartPoint): KlineChartPoint {
  return {
    ...p,
    overall: Math.round((p.career + p.wealth + p.marriage + p.health) / 4),
  };
}

function nearestYear(map: Map<number, KlineChartPoint>, year: number): KlineChartPoint | null {
  if (map.has(year)) return map.get(year)!;
  let best: KlineChartPoint | null = null;
  let bestDist = Infinity;
  for (const p of map.values()) {
    const dist = Math.abs(p.year - year);
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }
  return best;
}

export function inferBirthYear(yearly: KlineYearInput[], explicit?: number): number {
  if (explicit && explicit > 1900 && explicit < 2100) return explicit;
  if (!yearly.length) return new Date().getFullYear() - 30;
  const years = yearly.map((p) => p.year).sort((a, b) => a - b);
  // 若跨度接近人生，取最小年为出生附近
  const minY = years[0]!;
  const maxY = years[years.length - 1]!;
  if (maxY - minY >= 40) return minY;
  // 短样本：用最小年回推（报告常给当前±10）
  return minY;
}

export function buildLife80YearSeries(
  yearly: KlineYearInput[],
  opts?: { birthYear?: number; yongShen?: string[]; jiShen?: string[]; lifeYears?: number }
): KlineChartPoint[] {
  const yong = normEls(opts?.yongShen);
  const ji = normEls(opts?.jiShen);
  const lifeYears = opts?.lifeYears ?? 80;
  const birthYear = inferBirthYear(yearly, opts?.birthYear);
  const endYear = birthYear + lifeYears - 1;
  const map = new Map<number, KlineChartPoint>();
  for (const p of yearly) {
    map.set(p.year, toYearPoint(p));
  }
  const out: KlineChartPoint[] = [];
  for (let y = birthYear; y <= endYear; y++) {
    if (map.has(y)) {
      out.push(map.get(y)!);
    } else {
      out.push(recomputeOverall(fillMissingYear(y, nearestYear(map, y), yong, ji)));
    }
  }
  return out;
}

export function buildMonthlySeries(
  yearly: KlineYearInput[],
  opts: {
    yearsBack: number;
    yongShen?: string[];
    jiShen?: string[];
    now?: Date;
    birthYear?: number;
  }
): KlineChartPoint[] {
  const now = opts.now || new Date();
  const yong = normEls(opts.yongShen);
  const ji = normEls(opts.jiShen);
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;
  // 近 N 年：含当前月，回溯 yearsBack 年
  let startYear = endYear - opts.yearsBack;
  let startMonth = endMonth + 1;
  if (startMonth > 12) {
    startMonth = 1;
    startYear += 1;
  }
  // 实际：从 (endYear - yearsBack) 同月的下一个月 或 整段 yearsBack*12 个月
  // 简化：从 endYear-yearsBack 年 1 月 到 当前月
  startYear = endYear - opts.yearsBack;
  startMonth = 1;

  const life = buildLife80YearSeries(yearly, {
    birthYear: opts.birthYear,
    yongShen: opts.yongShen,
    jiShen: opts.jiShen,
    lifeYears: 90,
  });
  const yearMap = new Map(life.map((p) => [p.year, p]));
  const out: KlineChartPoint[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const yBase = yearMap.get(year) || fillMissingYear(year, nearestYear(yearMap, year), yong, ji);
    const mFrom = year === startYear ? startMonth : 1;
    const mTo = year === endYear ? endMonth : 12;
    for (let month = mFrom; month <= mTo; month++) {
      const mgz = monthGanZhi(year, month);
      const d = stemDelta(mgz, yong, ji);
      const career = clamp(yBase.career + d * 0.85);
      const wealth = clamp(yBase.wealth + d * 0.9);
      const marriage = clamp(yBase.marriage + d * 0.55);
      const health = clamp(yBase.health + d * 0.4);
      out.push({
        key: `${year}-${String(month).padStart(2, '0')}`,
        year,
        month,
        career,
        wealth,
        marriage,
        health,
        overall: Math.round((career + wealth + marriage + health) / 4),
        ganZhi: `${yBase.ganZhi || yearGanZhi(year)}/${mgz}`,
        drivers: [
          ...(yBase.drivers || []).slice(0, 1),
          d > 1 ? `月柱${mgz}偏用` : d < -1 ? `月柱${mgz}偏忌` : `月柱${mgz}`,
        ],
        risks: d < -2 ? ['本月宜缓重大决策'] : yBase.risks?.slice(0, 1),
      });
    }
  }
  return out;
}

export function buildKlineViewSeries(
  yearly: KlineYearInput[],
  mode: KlineViewMode,
  opts?: { birthYear?: number; yongShen?: string[]; jiShen?: string[]; now?: Date }
): KlineChartPoint[] {
  if (mode === 'life80') {
    return buildLife80YearSeries(yearly, opts);
  }
  if (mode === 'months10') {
    return buildMonthlySeries(yearly, { yearsBack: 10, ...opts });
  }
  return buildMonthlySeries(yearly, { yearsBack: 3, ...opts });
}

export const KLINE_VIEW_META: Record<
  KlineViewMode,
  { label: string; short: string; description: string }
> = {
  life80: {
    label: '人生 80 年',
    short: '80年·年',
    description: '从出生年起按年铺开，看整段大运节奏',
  },
  months10: {
    label: '近 10 年',
    short: '10年·月',
    description: '按月粒度看近十年起伏与窗口',
  },
  months3: {
    label: '近 3 年',
    short: '3年·月',
    description: '按月粒度看近三年节奏，便于决策对照',
  },
};
