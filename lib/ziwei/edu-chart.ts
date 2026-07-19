/**
 * Educational 紫微斗数 structure chart (lite).
 * Computes 命宫/十二宫 + simplified 14 主星 + 生年四化 for learning.
 * Not a full professional engine (no 辅星/大限/飞星) — honest product boundary.
 */

import { Solar } from 'lunar-javascript';
import {
  calculateTrueSolarTime,
  type TrueSolarTimeResult,
} from '@/lib/solar-time';
import { toEduCityLongitudes } from '@/lib/geo/city-longitudes';

export const PALACE_NAMES = [
  '命宫',
  '兄弟',
  '夫妻',
  '子女',
  '财帛',
  '疾厄',
  '迁移',
  '交友',
  '官禄',
  '田宅',
  '福德',
  '父母',
] as const;

export const EARTHLY_BRANCHES = [
  '子',
  '丑',
  '寅',
  '卯',
  '辰',
  '巳',
  '午',
  '未',
  '申',
  '酉',
  '戌',
  '亥',
] as const;

export const HOUR_BRANCH_OPTIONS = EARTHLY_BRANCHES.map((b, i) => ({
  index: i,
  label: `${b}时`,
}));

/** 五行局 (educational fixed map by year branch % 5 simplified) */
export type WuXingJu = {
  name: string;
  ju: 2 | 3 | 4 | 5 | 6;
};

/** 14 main stars in classic 紫微系列 / 天府系列 relative order */
const ZIWEI_SERIES = ['紫微', '天机', '太阳', '武曲', '天同', '廉贞'] as const;
// offsets from 紫微 (clockwise palace steps) — educational simplification
const ZIWEI_SERIES_OFFSET = [0, 1, 3, 4, 5, 8] as const;
const TIANFU_SERIES = ['天府', '太阴', '贪狼', '巨门', '天相', '天梁', '七杀', '破军'] as const;
const TIANFU_SERIES_OFFSET = [0, 1, 2, 3, 4, 5, 6, 10] as const;

export type SiHuaKind = '禄' | '权' | '科' | '忌';

export type EduZiweiInput = {
  /** 农历月 1–12 */
  lunarMonth: number;
  /** 农历日 1–30 */
  lunarDay: number;
  /** 时辰 0=子 … 11=亥 */
  hourBranch: number;
  /** 年支 0=子 … 11=亥（用于示意五行局） */
  yearBranch?: number;
  /** 年干 0=甲 … 9=癸（生年四化） */
  yearStem?: number;
};

export type EduStar = {
  name: string;
  sihua?: SiHuaKind;
};

export type EduPalace = {
  index: number;
  name: string;
  branch: string;
  isMing: boolean;
  isShen: boolean;
  stars: EduStar[];
};

export type EduZiweiChart = {
  ju: WuXingJu;
  mingBranchIndex: number;
  shenBranchIndex: number;
  ziweiBranchIndex: number;
  tianfuBranchIndex: number;
  yearStemLabel?: string;
  sihua: Array<{ kind: SiHuaKind; star: string }>;
  palaces: EduPalace[];
  disclaimer: string;
  source?: {
    solar?: string;
    lunarLabel?: string;
  };
};

export const HEAVENLY_STEMS = [
  '甲',
  '乙',
  '丙',
  '丁',
  '戊',
  '己',
  '庚',
  '辛',
  '壬',
  '癸',
] as const;

/** Classic 生年四化 table */
const YEAR_SIHUA: Record<number, Record<SiHuaKind, string>> = {
  0: { 禄: '廉贞', 权: '破军', 科: '武曲', 忌: '太阳' },
  1: { 禄: '天机', 权: '天梁', 科: '紫微', 忌: '太阴' },
  2: { 禄: '天同', 权: '天机', 科: '文昌', 忌: '廉贞' },
  3: { 禄: '太阴', 权: '天同', 科: '天机', 忌: '巨门' },
  4: { 禄: '贪狼', 权: '太阴', 科: '右弼', 忌: '天机' },
  5: { 禄: '武曲', 权: '贪狼', 科: '天梁', 忌: '文曲' },
  6: { 禄: '太阳', 权: '武曲', 科: '太阴', 忌: '天同' },
  7: { 禄: '巨门', 权: '太阳', 科: '文曲', 忌: '文昌' },
  8: { 禄: '天梁', 权: '紫微', 科: '左辅', 忌: '武曲' },
  9: { 禄: '破军', 权: '巨门', 科: '太阴', 忌: '贪狼' },
};

export function sihuaForYearStem(yearStem: number): Array<{ kind: SiHuaKind; star: string }> {
  const table = YEAR_SIHUA[((yearStem % 10) + 10) % 10];
  if (!table) return [];
  return (['禄', '权', '科', '忌'] as SiHuaKind[]).map((kind) => ({
    kind,
    star: table[kind],
  }));
}

export type EduSolarInput = {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
};

export type EduSolarConvResult = EduZiweiInput & {
  lunarLabel: string;
  yearStem: number;
  yearBranch: number;
};

export type EduTrueSolarInput = EduSolarInput & {
  /** Degrees east positive; required when useTrueSolar is true */
  longitude?: number;
  /** Civil timezone offset hours; default 8 (CST / UTC+8) */
  timezone?: number;
  /** When true and longitude is finite, apply 真太阳时 before lunar conversion */
  useTrueSolar?: boolean;
};

export type EduTrueSolarConvResult = EduSolarConvResult & {
  /** Civil clock label used before correction */
  civilLabel: string;
  /** Present when true solar correction was applied */
  trueSolar?: TrueSolarTimeResult;
  /** Why correction was skipped, if requested but not applied */
  trueSolarSkipped?: string;
};

/** Quick city longitudes for educational true-solar UI (approx. city centers). */
export const EDU_CITY_LONGITUDES: Array<{ id: string; zh: string; en: string; longitude: number }> = [
  ...toEduCityLongitudes(),
  { id: 'overseas', zh: '海外手填', en: 'Overseas (manual)', longitude: NaN },
];

/** Convert solar civil date/time → educational ziwei input (lunar month/day/hour/year). */
export function eduInputFromSolar(input: EduSolarInput): EduSolarConvResult {
  const hour = Math.min(23, Math.max(0, Math.floor(input.hour ?? 12)));
  const minute = Math.min(59, Math.max(0, Math.floor(input.minute ?? 0)));
  const solar = Solar.fromYmdHms(input.year, input.month, input.day, hour, minute, 0);
  const lunar = solar.getLunar();
  const lunarMonth = Math.abs(Number(lunar.getMonth()) || 1);
  const lunarDay = Number(lunar.getDay()) || 1;
  // 时辰：23:00–00:59 子, 每 2 小时一辰
  const hourBranch = Math.floor(((hour + 1) % 24) / 2);
  const yearGanIndex = HEAVENLY_STEMS.indexOf(lunar.getYearGan() as (typeof HEAVENLY_STEMS)[number]);
  const yearZhiIndex = EARTHLY_BRANCHES.indexOf(
    lunar.getYearZhi() as (typeof EARTHLY_BRANCHES)[number],
  );
  return {
    lunarMonth,
    lunarDay,
    hourBranch,
    yearStem: yearGanIndex >= 0 ? yearGanIndex : 0,
    yearBranch: yearZhiIndex >= 0 ? yearZhiIndex : 0,
    lunarLabel: `${lunar.getYearInGanZhi()}年 ${lunarMonth}月${lunarDay}日 ${EARTHLY_BRANCHES[hourBranch]}时`,
  };
}

/**
 * Optional 真太阳时 correction before lunar conversion (educational).
 * When useTrueSolar && longitude is finite: correct civil time, then eduInputFromSolar.
 * Default timezone 8; without longitude, skips correction and notes why.
 */
export function eduInputFromSolarWithTrueSolar(input: EduTrueSolarInput): EduTrueSolarConvResult {
  const hour = Math.min(23, Math.max(0, Math.floor(input.hour ?? 12)));
  const minute = Math.min(59, Math.max(0, Math.floor(input.minute ?? 0)));
  const timezone = Number.isFinite(input.timezone) ? Number(input.timezone) : 8;
  const civilLabel = `${input.year}-${String(input.month).padStart(2, '0')}-${String(input.day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  const wantTrueSolar = Boolean(input.useTrueSolar);
  const lon = input.longitude;
  const hasLon = typeof lon === 'number' && Number.isFinite(lon);

  if (wantTrueSolar && hasLon) {
    const trueSolar = calculateTrueSolarTime(
      input.year,
      input.month,
      input.day,
      hour,
      minute,
      0,
      lon as number,
      timezone,
    );
    const conv = eduInputFromSolar({
      year: trueSolar.year,
      month: trueSolar.month,
      day: trueSolar.day,
      hour: trueSolar.hour,
      minute: trueSolar.minute,
    });
    return {
      ...conv,
      civilLabel,
      trueSolar,
    };
  }

  const conv = eduInputFromSolar({
    year: input.year,
    month: input.month,
    day: input.day,
    hour,
    minute,
  });

  let trueSolarSkipped: string | undefined;
  if (wantTrueSolar && !hasLon) {
    trueSolarSkipped = '未提供有效经度，已跳过真太阳时修正，按钟表时间换算。';
  }

  return {
    ...conv,
    civilLabel,
    ...(trueSolarSkipped ? { trueSolarSkipped } : {}),
  };
}

function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

/**
 * 命宫：寅起正月顺数至生月，再从该宫起子时逆数至生时。
 * branch index: 子=0 … 亥=11；寅=2
 */
export function computeMingBranchIndex(lunarMonth: number, hourBranch: number): number {
  const month = Math.min(12, Math.max(1, Math.floor(lunarMonth)));
  const hour = mod12(Math.floor(hourBranch));
  // 寅宫 + (month-1) 顺
  const afterMonth = mod12(2 + (month - 1));
  // 从该宫起子=0 逆数 hour 步：afterMonth - hour
  return mod12(afterMonth - hour);
}

/** 身宫：寅起正月顺数至生月，再从该宫起子时顺数至生时 */
export function computeShenBranchIndex(lunarMonth: number, hourBranch: number): number {
  const month = Math.min(12, Math.max(1, Math.floor(lunarMonth)));
  const hour = mod12(Math.floor(hourBranch));
  const afterMonth = mod12(2 + (month - 1));
  return mod12(afterMonth + hour);
}

/**
 * 示意五行局：真实体系用命宫干支纳音；教育版用年支简化映射，并在 UI 标明。
 */
export function estimateJu(yearBranch = 0): WuXingJu {
  const map: WuXingJu[] = [
    { name: '水二局', ju: 2 },
    { name: '火六局', ju: 6 },
    { name: '木三局', ju: 3 },
    { name: '金四局', ju: 4 },
    { name: '土五局', ju: 5 },
  ];
  return map[mod12(yearBranch) % 5];
}

/**
 * 紫微星落宫（教育近似）：
 * 经典用「生日 ÷ 局数」得商余再顺逆安星；此处实现常用口诀简化版。
 */
export function computeZiweiBranchIndex(lunarDay: number, ju: number): number {
  const day = Math.min(30, Math.max(1, Math.floor(lunarDay)));
  const j = ju as 2 | 3 | 4 | 5 | 6;
  // 商 = ceil(day/j)
  const q = Math.ceil(day / j);
  const r = q * j - day;
  // 口诀简化：余数为 0 则商数宫；否则奇退偶进（常见教学表述的简化）
  let steps = q;
  if (r !== 0) {
    if (r % 2 === 1) steps = q - r;
    else steps = q + r;
  }
  if (steps < 1) steps = 1;
  // 从寅起顺数 steps
  return mod12(2 + (steps - 1));
}

/** 天府与紫微相对：寅起紫微，则天府在对宫规则的教学简化——紫微在寅则府在寅，对称分布 */
export function computeTianfuBranchIndex(ziweiBranchIndex: number): number {
  // Classic: 紫微天府对照表（寅↔寅, 卯↔丑, 辰↔子, 巳↔亥, 午↔戌, 未↔酉, 申↔申…）
  const table = [0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]; // indexed by 紫微支
  // More standard pair:
  const pair: Record<number, number> = {
    2: 2, // 寅-寅
    3: 1, // 卯-丑
    4: 0, // 辰-子
    5: 11, // 巳-亥
    6: 10, // 午-戌
    7: 9, // 未-酉
    8: 8, // 申-申
    9: 7, // 酉-未
    10: 6, // 戌-午
    11: 5, // 亥-巳
    0: 4, // 子-辰
    1: 3, // 丑-卯
  };
  return pair[mod12(ziweiBranchIndex)] ?? mod12(table[mod12(ziweiBranchIndex)]);
}

export function buildEduZiweiChart(input: EduZiweiInput): EduZiweiChart {
  const lunarMonth = Math.min(12, Math.max(1, Math.floor(input.lunarMonth || 1)));
  const lunarDay = Math.min(30, Math.max(1, Math.floor(input.lunarDay || 1)));
  const hourBranch = mod12(Math.floor(input.hourBranch || 0));
  const yearBranch = mod12(Math.floor(input.yearBranch ?? 0));
  const yearStem = ((Math.floor(input.yearStem ?? 0) % 10) + 10) % 10;

  const ju = estimateJu(yearBranch);
  const mingBranchIndex = computeMingBranchIndex(lunarMonth, hourBranch);
  const shenBranchIndex = computeShenBranchIndex(lunarMonth, hourBranch);
  const ziweiBranchIndex = computeZiweiBranchIndex(lunarDay, ju.ju);
  const tianfuBranchIndex = computeTianfuBranchIndex(ziweiBranchIndex);
  const sihua = sihuaForYearStem(yearStem);
  const sihuaByStar = new Map(sihua.map((s) => [s.star, s.kind]));

  // stars per branch index
  const starsByBranch: EduStar[][] = Array.from({ length: 12 }, () => []);

  ZIWEI_SERIES.forEach((name, i) => {
    const idx = mod12(ziweiBranchIndex + ZIWEI_SERIES_OFFSET[i]);
    starsByBranch[idx].push({ name, sihua: sihuaByStar.get(name) });
  });
  TIANFU_SERIES.forEach((name, i) => {
    // 天府系从天府起顺行（教学简化）
    const idx = mod12(tianfuBranchIndex + TIANFU_SERIES_OFFSET[i]);
    if (!starsByBranch[idx].some((s) => s.name === name)) {
      starsByBranch[idx].push({ name, sihua: sihuaByStar.get(name) });
    }
  });
  // 四化中的文昌/文曲/左辅/右弼若未在十四主星列表，仅在图例展示，不强行安星

  // Palace arrangement: 命宫 at mingBranchIndex, reverse (counterclockwise) for next palaces
  const palaces: EduPalace[] = [];
  for (let p = 0; p < 12; p += 1) {
    const branchIndex = mod12(mingBranchIndex - p);
    palaces.push({
      index: p,
      name: PALACE_NAMES[p],
      branch: EARTHLY_BRANCHES[branchIndex],
      isMing: p === 0,
      isShen: branchIndex === shenBranchIndex,
      stars: starsByBranch[branchIndex],
    });
  }

  return {
    ju,
    mingBranchIndex,
    shenBranchIndex,
    ziweiBranchIndex,
    tianfuBranchIndex,
    yearStemLabel: HEAVENLY_STEMS[yearStem],
    sihua,
    palaces,
    disclaimer:
      '教育排盘：命宫/身宫按农历月时推算；五行局为年支示意；十四主星为教学相对落点；生年四化按年干表。不含辅星、大限、飞星，不自动断事。',
  };
}
