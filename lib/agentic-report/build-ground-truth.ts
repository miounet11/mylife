// @ts-ignore
import { Solar } from 'lunar-javascript';
import type { DayunResult } from '@/lib/dayun-calculator';
import type { Pillar } from '@/lib/user-types';
import type {
  BuildGroundTruthInput,
  EngineGroundTruth,
  EngineStrength,
  KlineAnchorPoint,
  KlinePhase,
  KlineStructuredPoint,
  TimeWindowSummary,
} from '@/lib/agentic-report/types';

const PILLAR_KEYS = ['year', 'month', 'day', 'hour'] as const;

export function buildEngineGroundTruth({
  birthDate,
  report,
  version = 'engine-ground-truth-v1',
}: BuildGroundTruthInput): EngineGroundTruth {
  const pillars = report.basic.pillars || [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentAge = currentYear - birthDate.getFullYear();
  const structuredPoints = buildStructuredKlinePoints(birthDate, report.klineData || []);
  const anchorPoints = buildKlineAnchors(structuredPoints);
  const phases = buildKlinePhases(structuredPoints);
  const timeWindows = buildTimeWindows(structuredPoints);
  const overallWindows = summarizeOverallWindows(structuredPoints);
  const dayun = buildDayunWindows(report.dayun, birthDate.getFullYear(), currentAge);
  const currentPoint = structuredPoints.find((point) => point.year === currentYear) || null;

  return {
    version,
    generatedAt: now.toISOString(),
    constitution: {
      dayMaster: report.basic.dayMaster,
      strength: normalizeStrength(report.pattern?.strength),
      patternType: report.pattern?.type || '未定格局',
      yongShen: report.advice?.yongShen || [],
      xiShen: report.advice?.xiShen || [],
      jiShen: report.advice?.jiShen || [],
      seasonContext: buildSeasonContext(birthDate),
    },
    pillars: {
      year: stringifyPillar(pillars[0]),
      month: stringifyPillar(pillars[1]),
      day: stringifyPillar(pillars[2]),
      hour: stringifyPillar(pillars[3]),
      details: pillars,
    },
    tenGodsTable: buildTenGodsTable(pillars),
    dayun,
    shenSha: {
      list: normalizeShenSha(report.shenSha),
    },
    kline: {
      version: 'life-kline-v3-grounded',
      points: structuredPoints,
      anchorPoints,
      phases,
      windows: overallWindows,
    },
    timeWindows,
    derivedFacts: {
      currentAge,
      currentYear,
      currentScore: currentPoint?.score ?? null,
      peakScore: anchorPoints.find((point) => point.type === 'peak')?.score ?? null,
      troughScore: anchorPoints.find((point) => point.type === 'trough')?.score ?? null,
    },
  };
}

function buildStructuredKlinePoints(
  birthDate: Date,
  klineData: Array<{ year: number; career: number; wealth: number; marriage: number; health: number }>
): KlineStructuredPoint[] {
  return klineData.map((point, index) => {
    const score = average([point.career, point.wealth, point.marriage, point.health]);
    const prevScore = index > 0
      ? average([
          klineData[index - 1].career,
          klineData[index - 1].wealth,
          klineData[index - 1].marriage,
          klineData[index - 1].health,
        ])
      : score;
    const delta = score - prevScore;
    const open = clampScore(Math.round(score - delta * 0.6));
    const close = clampScore(score);
    const high = clampScore(Math.max(open, close) + 4);
    const low = clampScore(Math.min(open, close) - 4);

    return {
      year: point.year,
      age: point.year - birthDate.getFullYear(),
      score: close,
      open,
      close,
      high,
      low,
      career: point.career,
      wealth: point.wealth,
      marriage: point.marriage,
      health: point.health,
      reason: describePoint(point, delta),
    };
  });
}

function buildKlineAnchors(points: KlineStructuredPoint[]): KlineAnchorPoint[] {
  if (!points.length) return [];

  const sorted = [...points].sort((a, b) => b.score - a.score);
  const peak = sorted[0];
  const trough = sorted[sorted.length - 1];
  const currentIndex = Math.floor(points.length / 2);
  const turningCandidate = points[currentIndex];
  const anchors: KlineAnchorPoint[] = [];

  if (peak) {
    anchors.push({
      year: peak.year,
      age: peak.age,
      score: peak.score,
      type: 'peak',
      reason: '综合分数最高，适合作为关键峰值窗口。',
    });
  }

  if (trough && trough.year !== peak?.year) {
    anchors.push({
      year: trough.year,
      age: trough.age,
      score: trough.score,
      type: 'trough',
      reason: '综合分数最低，适合作为关键回撤窗口。',
    });
  }

  if (turningCandidate && turningCandidate.year !== peak?.year && turningCandidate.year !== trough?.year) {
    anchors.push({
      year: turningCandidate.year,
      age: turningCandidate.age,
      score: turningCandidate.score,
      type: 'turning',
      reason: '处于当前 K 线区间中部，适合作为阶段转折观察点。',
    });
  }

  return anchors.sort((a, b) => a.year - b.year);
}

function buildKlinePhases(points: KlineStructuredPoint[]): KlinePhase[] {
  const phases: KlinePhase[] = [];

  for (let index = 0; index < points.length; index += 5) {
    const segment = points.slice(index, index + 5);
    if (!segment.length) continue;

    const start = segment[0];
    const end = segment[segment.length - 1];
    const avgScore = average(segment.map((item) => item.score));
    const trend = end.score - start.score >= 6 ? 'up' : start.score - end.score >= 6 ? 'down' : 'stable';

    phases.push({
      label: `${start.year}-${end.year}阶段`,
      startYear: start.year,
      endYear: end.year,
      startAge: start.age,
      endAge: end.age,
      averageScore: avgScore,
      trend,
    });
  }

  return phases;
}

function buildTimeWindows(points: KlineStructuredPoint[]): EngineGroundTruth['timeWindows'] {
  return {
    career: summarizeDimensionWindows(points, 'career'),
    wealth: summarizeDimensionWindows(points, 'wealth'),
    relationship: summarizeDimensionWindows(points, 'marriage'),
    health: summarizeDimensionWindows(points, 'health'),
  };
}

function summarizeOverallWindows(points: KlineStructuredPoint[]): TimeWindowSummary[] {
  const phases = buildKlinePhases(points);

  return phases.map((phase) => ({
    startYear: phase.startYear,
    endYear: phase.endYear,
    startAge: phase.startAge,
    endAge: phase.endAge,
    label: phase.label,
    score: phase.averageScore,
  }));
}

function summarizeDimensionWindows(
  points: KlineStructuredPoint[],
  key: 'career' | 'wealth' | 'marriage' | 'health'
): TimeWindowSummary[] {
  const windows: TimeWindowSummary[] = [];

  for (let index = 0; index < points.length; index += 3) {
    const segment = points.slice(index, index + 3);
    if (!segment.length) continue;

    const start = segment[0];
    const end = segment[segment.length - 1];
    const score = average(segment.map((item) => item[key]));
    windows.push({
      startYear: start.year,
      endYear: end.year,
      startAge: start.age,
      endAge: end.age,
      label: `${start.year}-${end.year}`,
      score,
    });
  }

  return windows;
}

function buildDayunWindows(
  dayunResult: DayunResult | undefined,
  birthYear: number,
  currentAge: number
): EngineGroundTruth['dayun'] {
  const windows = (dayunResult?.dayuns || []).map((item) => ({
    label: `${item.ganZhi}大运`,
    startAge: item.startAge,
    endAge: item.endAge,
    startYear: item.startYear || birthYear + item.startAge,
    endYear: item.endYear || birthYear + item.endAge,
    ganZhi: item.ganZhi,
    quality: item.quality,
    yongShenMatch: item.yongShenMatch,
    isCurrent: item.isCurrent,
  }));

  return {
    startAge: dayunResult?.startAge || 0,
    direction: inferDayunDirection(dayunResult, currentAge),
    currentDayun: dayunResult?.currentDayun?.ganZhi,
    currentRange: dayunResult?.currentDayun
      ? `${dayunResult.currentDayun.startAge}-${dayunResult.currentDayun.endAge}岁`
      : undefined,
    windows,
  };
}

function inferDayunDirection(
  dayunResult: DayunResult | undefined,
  currentAge: number
): EngineGroundTruth['dayun']['direction'] {
  if (!dayunResult?.dayuns?.length) return 'unknown';
  return dayunResult.dayuns[0].startAge <= currentAge ? 'forward' : 'unknown';
}

function buildTenGodsTable(pillars: Pillar[]) {
  return PILLAR_KEYS.map((pillarKey, index) => {
    const pillar = pillars[index];
    return {
      pillar: pillarKey,
      stem: pillar?.celestialStem || '',
      branch: pillar?.earthlyBranch || '',
      hiddenShiShen: pillar?.hiddenStems || [],
    };
  });
}

function normalizeShenSha(shenSha: unknown): EngineGroundTruth['shenSha']['list'] {
  const rawList = (shenSha as { list?: Array<Record<string, unknown>> } | undefined)?.list || [];
  return rawList.map((item) => {
    const name = `${item.name || item.label || item.shenSha || '未知神煞'}`;
    const text = JSON.stringify(item);
    const impact = /(贵人|文昌|天喜|福星|天德|月德)/.test(text)
      ? 'positive'
      : /(劫煞|羊刃|亡神|灾煞|孤辰|寡宿)/.test(text)
        ? 'negative'
        : 'neutral';

    return {
      name,
      pillar: typeof item.pillar === 'string' ? item.pillar : undefined,
      impact,
    };
  });
}

function buildSeasonContext(birthDate: Date) {
  try {
    const solar = Solar.fromYmdHms(
      birthDate.getFullYear(),
      birthDate.getMonth() + 1,
      birthDate.getDate(),
      12,
      0,
      0
    );
    const lunar = solar.getLunar();
    return `${lunar.getMonthInChinese()}月，前节气为${lunar.getPrevJie().getName()}。`;
  } catch {
    return `${birthDate.getMonth() + 1}月出生，按当月季节环境理解命局。`;
  }
}

function normalizeStrength(strength?: string): EngineStrength {
  if (!strength) return 'balanced';
  if (/(强|旺)/.test(strength)) return 'strong';
  if (/(弱|衰)/.test(strength)) return 'weak';
  if (/从/.test(strength)) return 'follow';
  return 'balanced';
}

function stringifyPillar(pillar?: Pillar) {
  return pillar ? `${pillar.celestialStem}${pillar.earthlyBranch}` : '';
}

function describePoint(
  point: { career: number; wealth: number; marriage: number; health: number },
  delta: number
) {
  const score = average([point.career, point.wealth, point.marriage, point.health]);
  const trend = delta >= 6 ? '整体加速上行' : delta <= -6 ? '整体承压回调' : '整体维持震荡';
  return `${trend}，综合分约${score}分，事业${point.career}、财富${point.wealth}、关系${point.marriage}、健康${point.health}。`;
}

function clampScore(value: number) {
  return Math.max(20, Math.min(95, value));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}
