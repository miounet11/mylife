/**
 * Engine Surface — reusable structured display pack.
 * Turn engine / report facts into cit-able modules for any result page.
 */

export type EngineModuleId =
  | 'identity'
  | 'pillars'
  | 'yongji'
  | 'elements'
  | 'dayun'
  | 'kline'
  | 'months'
  | 'almanac'
  | 'tenGods'
  | 'shenSha'
  | 'risks'
  | 'formula';

export const ENGINE_MODULE_META: Record<
  EngineModuleId,
  { label: string; short: string; blurb: string }
> = {
  identity: {
    label: '排盘锁定',
    short: '身份',
    blurb: '钟表时间 / 有效时间 / 四柱指纹',
  },
  pillars: {
    label: '四柱',
    short: '四柱',
    blurb: '年月日时干支',
  },
  yongji: {
    label: '用神忌神',
    short: '用忌',
    blurb: '趋利避害结构',
  },
  elements: {
    label: '五行',
    short: '五行',
    blurb: '强弱与引导',
  },
  dayun: {
    label: '大运',
    short: '大运',
    blurb: '十年段表',
  },
  kline: {
    label: '人生K线',
    short: 'K线',
    blurb: '年焦点与高低点',
  },
  months: {
    label: '近月',
    short: '近月',
    blurb: '近窗时间条',
  },
  almanac: {
    label: '万年历',
    short: '通书',
    blurb: '日运 / 通书入口',
  },
  tenGods: {
    label: '十神',
    short: '十神',
    blurb: '十神关系摘要',
  },
  shenSha: {
    label: '神煞',
    short: '神煞',
    blurb: '神煞列表',
  },
  risks: {
    label: '避险',
    short: '避险',
    blurb: '结构风险提示',
  },
  formula: {
    label: '口径',
    short: '口径',
    blurb: '引擎公式与边界',
  },
};

export type EngineSurfaceIdentity = {
  clockBirthDate?: string | null;
  clockBirthTime?: string | null;
  effectiveBirthTime?: string | null;
  chartFingerprint?: string | null;
  useSolarTime?: boolean;
  useSeparateZiHour?: boolean;
  timeMismatch?: boolean;
  birthPlace?: string | null;
};

export type EngineSurfacePillar = {
  label: string;
  ganZhi: string;
  gan?: string;
  zhi?: string;
};

export type EngineSurfaceDayunRow = {
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge?: number;
  endAge?: number;
  quality?: string;
  yongShenMatch?: string;
  isCurrent?: boolean;
  description?: string;
};

export type EngineSurfaceKlineSnap = {
  sampleYears: number;
  spanLabel?: string;
  currentScore?: number | null;
  peakYear?: number | null;
  peakScore?: number | null;
  troughYear?: number | null;
  troughScore?: number | null;
  stageHeadline?: string | null;
  href?: string;
};

export type EngineSurfaceMonthItem = {
  key: string;
  label: string;
  score?: number | null;
  status?: string;
  href?: string;
};

export type EngineSurfacePack = {
  version: 'engine-surface-v1';
  source: 'report' | 'tool' | 'birth' | 'unknown';
  dayMaster?: string | null;
  pattern?: string | null;
  gender?: string | null;
  modules: EngineModuleId[];
  identity: EngineSurfaceIdentity | null;
  pillars: EngineSurfacePillar[];
  yongShen: string[];
  jiShen: string[];
  xiShen: string[];
  elements: Array<{ key: string; label: string; strength?: number; note?: string }>;
  dayun: EngineSurfaceDayunRow[];
  kline: EngineSurfaceKlineSnap | null;
  months: EngineSurfaceMonthItem[];
  tenGods: Array<{ label: string; value: string }>;
  shenSha: string[];
  risks: string[];
  formulaLines: string[];
  almanac: {
    todayHref: string;
    yearHref?: string | null;
    blurb: string;
  };
  reportId?: string | null;
  /** free tags for UI chips */
  tags: string[];
};
