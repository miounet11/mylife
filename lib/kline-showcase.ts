/**
 * 人生 K 线 · 产品说明与示例样本
 *
 * 人生 K 线 = 以八字原局为基线，叠加大运 / 流年 / 用神匹配后的
 * 「事业 · 财富 · 关系 · 健康」多年趋势曲线（V6：无 Math.sin 伪周期）。
 *
 * 示例用固定生辰实时演算，仅作产品演示，非真人档案。
 */

import { determineYongShen } from '@/lib/bazi-analyzer';
import { calculateDayun } from '@/lib/dayun-calculator';
import { calculateFourPillars } from '@/lib/fortune-engine';
import { generateLifeKlineV6, type KlinePointV6 } from '@/lib/kline-v6';
import { buildKlineStageNarrative } from '@/lib/kline-stage';

export type KlineShowcaseChartPoint = {
  year: number;
  career: number;
  wealth: number;
  marriage: number;
  health: number;
  score: number;
  evidence?: {
    ganZhi?: string;
    dayunGanZhi?: string | null;
    drivers?: string[];
    risks?: string[];
  };
};

export type KlineShowcaseSample = {
  id: string;
  /** 展示用化名 */
  label: string;
  labelEn?: string;
  /** 一句话人设 */
  persona: string;
  personaEn?: string;
  /** 可读的出生摘要（演示） */
  birthSummary: string;
  /** 本例要教什么 */
  teach: string;
  teachEn?: string;
  peakYear: number | null;
  troughYear: number | null;
  series: KlineShowcaseChartPoint[];
};

export const LIFE_KLINE_PRODUCT = {
  name: '人生 K 线',
  english: 'Life K-Line',
  oneLiner: '把八字大运与流年，画成可对照的人生 K 线（蜡烛图 + 均线）。',
  oneLinerEn: 'Dayun and yearly luck drawn as a readable Life K-Line (candles + moving averages).',
  whatItIs: [
    '借用股价走势的读法：每年一根蜡烛，颜色看质量，均线看阶段。',
    '以你的日主、用神与大运为底，按年给出事业 / 财富 / 关系 / 健康可解释分数。',
    '峰值、谷值、换运、本命年、冲太岁会标在图上，用来对照阶段，不是定生死。',
  ],
  whatItIsEn: [
    'Read it like a price chart: one candle a year, color for quality, averages for the stage.',
    'Day master, useful god, and decade luck set the floor; each year scores career, wealth, relationship, and health.',
    'Peaks, troughs, luck changes, and clash years are marked for stage-reading — not fate decrees.',
  ],
  howBuilt: [
    { step: '1', title: '原局基线', detail: '四柱五行与用神 / 忌神，定事业、财、关系、健康的底色。' },
    { step: '2', title: '大运加权', detail: '十年大运天干地支与用忌匹配，形成阶段背景。' },
    { step: '3', title: '流年触发', detail: '每年干支再叠加合冲刑害与十神关系，得到当年分。' },
    { step: '4', title: '读图行动', detail: '看当前处于高 / 平 / 低段，再决定冲刺、布局或防守。' },
  ],
  howBuiltEn: [
    { step: '1', title: 'Natal baseline', detail: 'Four pillars, five elements, and useful/avoiding gods set career, wealth, relationship, and health tone.' },
    { step: '2', title: 'Decade weighting', detail: 'Ten-year stems/branches vs. useful gods form the stage background.' },
    { step: '3', title: 'Yearly trigger', detail: 'Annual stems overlay combinations, clashes, and ten-god relations for that year’s score.' },
    { step: '4', title: 'Read, then act', detail: 'See whether you are in a high, flat, or low band — then push, lay groundwork, or defend.' },
  ],
  howToRead: [
    { title: '先看蜡烛与均线', detail: '颜色是当年质量，MA5/MA10 看阶段；不必盯住某一年的绝对数字。' },
    { title: '再切曲线看事业 / 财 / 关系 / 健康', detail: '同一年不同板块可能一强一弱——这是结构差异，不是「全好或全坏」。' },
    { title: '对照当下与未来 2–3 年', detail: '当前年附近最有决策价值；远期只作阶段参考。' },
    { title: '低谷不等于坏事', detail: '常对应宜稳、宜修结构的窗口；高峰也要避免过度扩张。' },
  ],
  disclaimer:
    '示例与报告曲线均为结构参考，不构成投资、医疗或人生决策保证。生辰越准确，阶段定位越稳。',
} as const;

type DemoSeed = {
  id: string;
  label: string;
  labelEn: string;
  persona: string;
  personaEn: string;
  teach: string;
  teachEn: string;
  birthDate: string; // YYYY-MM-DD
  birthTime: string;
  gender: 'male' | 'female';
  birthPlace: string;
};

/** 固定演示盘（公开假名），仅用于产品说明 */
const DEMO_SEEDS: DemoSeed[] = [
  {
    id: 'steady-builder',
    label: '稳建型 · 阿森',
    labelEn: 'Steady · Arsen',
    persona: '偏事业节奏清晰、财富线随大运抬升的示例',
    personaEn: 'Clear career rhythm, with the wealth line lifting on decade luck',
    teach: '看清「十年大运背景」如何托起或压低事业与财线。',
    teachEn: 'See how a ten-year luck background lifts or suppresses career and wealth.',
    birthDate: '1988-05-12',
    birthTime: '09:30',
    gender: 'male',
    birthPlace: '上海',
  },
  {
    id: 'wave-connector',
    label: '波段型 · 小林',
    labelEn: 'Wave · Lin',
    persona: '关系与事业波段更明显、宜择窗推进的示例',
    personaEn: 'Relationship and career waves are more visible — pick windows to advance',
    teach: '同一人生里，板块节奏可以不同步——先保优势线。',
    teachEn: 'Tracks in one life can be out of sync — protect the strong line first.',
    birthDate: '1992-11-03',
    birthTime: '14:20',
    gender: 'female',
    birthPlace: '成都',
  },
  {
    id: 'late-bloom',
    label: '后发型 · 老周',
    labelEn: 'Late bloom · Zhou',
    persona: '前段偏稳、中后段窗口抬升的示例',
    personaEn: 'Earlier years stay even; the mid-to-late window lifts',
    teach: '人生 K 线不是「越早越高越好」，关键看你所在的大运段。',
    teachEn: 'A Life K-Line is not “higher earlier is better” — the decade you are in matters.',
    birthDate: '1978-03-21',
    birthTime: '07:45',
    gender: 'male',
    birthPlace: '北京',
  },
];

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function toChartPoints(raw: KlinePointV6[]): KlineShowcaseChartPoint[] {
  return raw.map((p) => {
    const career = Number(p.career) || 0;
    const wealth = Number(p.wealth) || 0;
    const marriage = Number(p.marriage) || 0;
    const health = Number(p.health) || 0;
    return {
      year: p.year,
      career,
      wealth,
      marriage,
      health,
      score: Math.round((career + wealth + marriage + health) / 4),
      evidence: {
        ganZhi: p.evidence?.ganZhi,
        dayunGanZhi: p.evidence?.dayunGanZhi,
        drivers: p.evidence?.drivers?.slice(0, 2),
        risks: p.evidence?.risks?.slice(0, 2),
      },
    };
  });
}

function findExtremes(series: KlineShowcaseChartPoint[]) {
  let peak: KlineShowcaseChartPoint | null = null;
  let trough: KlineShowcaseChartPoint | null = null;
  for (const p of series) {
    if (!peak || p.score > peak.score) peak = p;
    if (!trough || p.score < trough.score) trough = p;
  }
  return {
    peakYear: peak?.year ?? null,
    troughYear: trough?.year ?? null,
  };
}

function buildOneSample(seed: DemoSeed): KlineShowcaseSample | null {
  try {
    const birthDate = parseYmd(seed.birthDate);
    const pillars = calculateFourPillars(birthDate, seed.birthTime, 8, {
      birthPlace: seed.birthPlace,
      useTrueSolarTime: false,
      sect: 2,
    });
    const baziStr = pillars.map((p) => `${p.celestialStem}${p.earthlyBranch}`);
    const hour = Number(`${seed.birthTime || '12:00'}`.split(':')[0] || 12);
    const minute = Number(`${seed.birthTime || '12:00'}`.split(':')[1] || 0);
    const yongShen = determineYongShen(baziStr, {
      birthDate,
      birthHour: Number.isFinite(hour) ? hour : 12,
      birthMinute: Number.isFinite(minute) ? minute : 0,
    });
    const dayun = calculateDayun(
      birthDate,
      seed.birthTime,
      seed.gender,
      pillars[0]?.celestialStem || '',
      { gan: pillars[1]?.celestialStem || '', zhi: pillars[1]?.earthlyBranch || '' },
      yongShen,
      birthDate.getFullYear(),
    );
    const raw = generateLifeKlineV6(birthDate, seed.gender, pillars, yongShen, dayun as any, {
      fromBirth: true,
      lifeYears: 80,
    });
    const series = toChartPoints(raw);
    if (series.length < 20) return null;
    const extremes = findExtremes(series);
    return {
      id: seed.id,
      label: seed.label,
      labelEn: seed.labelEn,
      persona: seed.persona,
      personaEn: seed.personaEn,
      birthSummary: `演示生辰 ${seed.birthDate} ${seed.birthTime} · ${seed.birthPlace}（非真人）`,
      teach: seed.teach,
      teachEn: seed.teachEn,
      peakYear: extremes.peakYear,
      troughYear: extremes.troughYear,
      series,
    };
  } catch (err) {
    console.warn('[kline-showcase] sample failed', seed.id, err instanceof Error ? err.message : err);
    return null;
  }
}

/** 服务端生成演示样本（真实 V6 引擎）。 */
export function getKlineShowcaseSamples(): KlineShowcaseSample[] {
  return DEMO_SEEDS.map(buildOneSample).filter((s): s is KlineShowcaseSample => Boolean(s));
}

export type PersonalKlineHighlight = {
  sampleYears: number;
  spanLabel: string;
  currentYearScore: number | null;
  peak: { year: number; score: number } | null;
  trough: { year: number; score: number } | null;
  readingTips: string[];
  /** 人话阶段结论（一眼好） */
  stageHeadline: string | null;
  stageSupport: string | null;
  stageAction: string | null;
  age: number | null;
  tone: 'rising' | 'steady' | 'pressure' | 'mixed' | null;
  /** 校准软提示（不改分） */
  calibrationNote: string | null;
  calibrationCount: number;
};

/** 从用户报告 klineData 提炼「结果页首屏可读」摘要。 */
export function buildPersonalKlineHighlight(
  klineData?: Array<{
    year?: number;
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
  }> | null,
  opts?: {
    birthYear?: number;
    calibrationMarkers?: Array<{ year: number; kind: 'confirmed' | 'denied'; title?: string }> | null;
  },
): PersonalKlineHighlight | null {
  if (!Array.isArray(klineData) || klineData.length < 3) return null;

  const stage = buildKlineStageNarrative(klineData, {
    birthYear: opts?.birthYear,
    calibrationMarkers: opts?.calibrationMarkers,
  });

  const points = klineData
    .map((p) => {
      const year = Number(p.year);
      if (!Number.isFinite(year)) return null;
      const dims = [p.career, p.wealth, p.marriage, p.health]
        .map(Number)
        .filter((n) => Number.isFinite(n));
      const score =
        Number(p.score) > 0
          ? Number(p.score)
          : dims.length
            ? dims.reduce((a, b) => a + b, 0) / dims.length
            : 0;
      return { year, score: Math.round(score) };
    })
    .filter((p): p is { year: number; score: number } => Boolean(p));
  if (points.length < 3) return null;

  const years = points.map((p) => p.year);
  const minY = Math.min(...years);
  const maxY = Math.max(...years);
  const currentYear = new Date().getFullYear();
  const current = points.find((p) => p.year === currentYear) || null;
  let peak = points[0]!;
  let trough = points[0]!;
  for (const p of points) {
    if (p.score > peak.score) peak = p;
    if (p.score < trough.score) trough = p;
  }

  const readingTips = stage
    ? [
        stage.support,
        stage.actionHint,
        stage.peak?.reason
          ? `高点 ${stage.peak.year} 参考原因：${stage.peak.reason}`
          : `高点参考约 ${peak.year}（${peak.score}）· 低谷约 ${trough.year}（${trough.score}）`,
      ]
    : [
        current
          ? `今年综合参考约 ${current.score} 分，先看综合线再切分线。`
          : `样本覆盖 ${points.length} 年，建议先看「人生焦点」窗。`,
        `高点参考约 ${peak.year} 年（${peak.score}），低谷参考约 ${trough.year} 年（${trough.score}）。`,
        '曲线由大运 + 流年 + 用神加权生成；改生辰会重算整条线。',
      ];

  return {
    sampleYears: points.length,
    spanLabel: `${minY}–${maxY}`,
    currentYearScore: stage?.currentScore ?? current?.score ?? null,
    peak: stage?.peak
      ? { year: stage.peak.year, score: stage.peak.score }
      : { year: peak.year, score: peak.score },
    trough: stage?.trough
      ? { year: stage.trough.year, score: stage.trough.score }
      : { year: trough.year, score: trough.score },
    readingTips,
    stageHeadline: stage?.headline ?? null,
    stageSupport: stage?.support ?? null,
    stageAction: stage?.actionHint ?? null,
    age: stage?.age ?? null,
    tone: stage?.tone ?? null,
    calibrationNote: stage?.calibrationNote ?? null,
    calibrationCount: Array.isArray(opts?.calibrationMarkers)
      ? opts!.calibrationMarkers!.length
      : 0,
  };
}
