import { calculateFourPillars } from '@/lib/fortune-engine';
import {
  analyzeShenSha,
  determineYongShen,
  type YongShenResult,
} from '@/lib/bazi-analyzer';
import { calculateDayun, resolveDayunList, type DayunResult } from '@/lib/dayun-calculator';
import { generateLifeKlineV6, detectKlineAnchorsV6 } from '@/lib/kline-v6';
import type { CreateContextInput } from '@/lib/agentic-report/create-agentic-context';
import type { Pillar } from '@/lib/user-types';
import { buildBirthSignature } from '@/lib/profile-birth-signature';
import { getOrCreateProfile, updateProfile } from '@/lib/life-profile/store';
import {
  buildChartCalculationIdentity,
  normalizeClockTime,
  resolveEffectiveTiming,
  type ChartCalculationIdentity,
  type EffectiveTiming,
} from '@/lib/calculation-identity';
import { resolveCityLongitude } from '@/lib/geo/city-longitudes';

export interface BirthInput {
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
  birthAccuracy?: 'exact' | 'range' | 'unknown';
  gender?: 'male' | 'female';
  name?: string;
  /** Civil timezone offset hours (default 8). */
  timezone?: number;
  /** Explicit longitude; falls back to place resolve then timezone*15. */
  longitude?: number;
  /**
   * True solar correction. Default: true when accuracy is not `unknown` and a
   * place/longitude can be resolved (aligned with analyze form).
   */
  useTrueSolarTime?: boolean;
  /** Late-Zi next-day (sect 1). Default false (sect 2). */
  useSeparateZiHour?: boolean;
  sect?: 1 | 2;
}

function parseBirthDate(value: string): Date {
  // Prefer local Y-M-D parse to avoid UTC shift for pure date strings.
  const m = String(value || '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid birthDate');
  }
  return date;
}

function resolveBirthTime(input: BirthInput): string {
  if (input.birthAccuracy === 'unknown' || !input.birthTime) {
    return '12:00';
  }
  return normalizeClockTime(input.birthTime) || input.birthTime;
}

function resolveStructureTiming(input: BirthInput): {
  clockDate: string;
  clockTime: string;
  timezone: number;
  longitude: number;
  useSolar: boolean;
  useSeparateZiHour: boolean;
  sect: 1 | 2;
  timing: EffectiveTiming;
} {
  const clockDate = String(input.birthDate || '').trim();
  const clockTime = resolveBirthTime(input);
  const timezone = Number.isFinite(input.timezone as number) ? Number(input.timezone) : 8;
  const placeLon = resolveCityLongitude(input.birthPlace)?.longitude;
  const longitude =
    Number.isFinite(input.longitude as number)
      ? Number(input.longitude)
      : placeLon ?? timezone * 15;
  const hasLon =
    Number.isFinite(input.longitude as number) || placeLon != null || Boolean(input.birthPlace?.trim());
  const useSolar =
    typeof input.useTrueSolarTime === 'boolean'
      ? input.useTrueSolarTime
      : input.birthAccuracy !== 'unknown' && hasLon;
  const useSeparateZiHour = Boolean(input.useSeparateZiHour);
  const sect: 1 | 2 = input.sect || (useSeparateZiHour ? 1 : 2);
  const timing = resolveEffectiveTiming({
    birthDate: clockDate,
    birthTime: clockTime,
    timezone,
    longitude,
    useSolarTime: useSolar,
    useSeparateZiHour,
  });
  return {
    clockDate,
    clockTime,
    timezone,
    longitude,
    useSolar,
    useSeparateZiHour,
    sect,
    timing,
  };
}

function elementScoresFromPillars(pillars: Pillar[]): Record<string, number> {
  const scores = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const map: Record<string, keyof typeof scores> = {
    甲: 'wood', 乙: 'wood',
    丙: 'fire', 丁: 'fire',
    戊: 'earth', 己: 'earth',
    庚: 'metal', 辛: 'metal',
    壬: 'water', 癸: 'water',
  };

  for (const pillar of pillars) {
    const stemElement = map[pillar.celestialStem];
    if (stemElement) scores[stemElement] += 12;
    const branchElement = map[pillar.earthlyBranch];
    if (branchElement) scores[branchElement] += 8;
    for (const hidden of pillar.hiddenStems || []) {
      const hiddenElement = map[hidden];
      if (hiddenElement) scores[hiddenElement] += 4;
    }
  }

  return scores;
}

function inferYongShen(pillars: Pillar[]): YongShenResult | null {
  const direct = determineYongShen(pillars.map((pillar) => pillar.celestialStem + pillar.earthlyBranch));
  if (direct) return direct;

  const dayMaster = pillars[2]?.celestialStem;
  if (!dayMaster) return null;

  const elementMap: Record<string, string> = {
    甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水',
  };
  const scores = elementScoresFromPillars(pillars);
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const dayElement = elementMap[dayMaster] || '木';
  const weakest = sorted[sorted.length - 1]?.[0];
  const strongest = sorted[0]?.[0];
  const cnMap: Record<string, string> = {
    wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
  };
  const yongShen = weakest ? [cnMap[weakest]] : [];
  const jiShen = strongest ? [cnMap[strongest]] : [];

  return {
    dayMaster,
    dayMasterElement: dayElement,
    strength: '中和',
    strengthDesc: '基于五行分布的基础推断',
    score: 50,
    yongShen,
    xiShen: yongShen,
    jiShen,
    qiuShen: [],
    analysis: '引擎基础推断：优先补偏弱五行，谨慎使用偏旺五行。',
    details: { helpStrength: 0, drainStrength: 0, seasonBonus: 0 },
    priority: yongShen.map((element) => ({ element, reason: '偏弱五行优先' })),
  };
}

/** Prod dayun-calculator returns `dayuns`; kline historically expected `dayunList`. */
function normalizeDayunResult(raw: DayunResult | null): DayunResult {
  if (!raw) {
    return { startAge: 0, dayuns: [], dayunList: [], currentDayun: null, currentDayunYear: 0, currentDayunIndex: 0 };
  }
  const dayunList = resolveDayunList(raw);
  return {
    ...raw,
    dayuns: dayunList,
    dayunList,
    currentDayunIndex: raw.currentDayunIndex ?? raw.currentDayun?.index ?? 0,
  };
}

export type FortuneStructureBundle = CreateContextInput & {
  /** Analyze-aligned timing + locked calculation identity for this recompute. */
  timing: EffectiveTiming;
  calculationIdentity: ChartCalculationIdentity;
  clockBirthDate: string;
  clockBirthTime: string;
  sect: 1 | 2;
};

/**
 * Build structural chart (pillars / dayun / kline) from civil birth fields.
 * Timing path matches analyze: resolveEffectiveTiming once, then pillars on
 * effective time with useTrueSolarTime=false (no double solar correction).
 */
export function buildFortuneContextInput(input: BirthInput): FortuneStructureBundle {
  const gender = input.gender || 'male';
  const birthPlace = input.birthPlace?.trim() || '北京';
  const {
    clockDate,
    clockTime,
    timezone,
    sect,
    timing,
  } = resolveStructureTiming(input);

  // Display / signature stay on civil clock; pillars use effective timing only.
  const pillarDate = timing.effectiveBirthDateObj;
  const pillarTime = timing.effectiveBirthTime;
  const civilDate = parseBirthDate(clockDate);

  const pillars = calculateFourPillars(pillarDate, pillarTime, timezone, {
    birthPlace,
    useTrueSolarTime: false,
    sect,
  });
  const yongShen = inferYongShen(pillars);
  const dayun = normalizeDayunResult(calculateDayun(
    civilDate,
    clockTime,
    gender,
    pillars[0]?.celestialStem || '',
    { gan: pillars[1]?.celestialStem || '', zhi: pillars[1]?.earthlyBranch || '' },
    yongShen,
    civilDate.getFullYear(),
  ));

  const kline = generateLifeKlineV6(civilDate, gender, pillars, yongShen, dayun, {
    fromBirth: true,
    lifeYears: 80,
  });
  const anchors = detectKlineAnchorsV6(kline);
  const elements = elementScoresFromPillars(pillars);
  const pattern = yongShen?.pattern?.pattern || '正格';

  const baziStr = pillars.map((p) => `${p.celestialStem}${p.earthlyBranch}`);
  let shenSha: string[] = [];
  try {
    const shenShaResult = analyzeShenSha(baziStr);
    const list = shenShaResult?.list;
    if (Array.isArray(list)) {
      shenSha = list
        .map((item) => (typeof item === 'string' ? item : item?.name || ''))
        .filter(Boolean);
    }
  } catch {
    shenSha = [];
  }

  const birthSignature = buildBirthSignature({
    birthDate: clockDate,
    birthTime: clockTime,
    birthPlace,
    birthAccuracy: input.birthAccuracy,
    gender,
  });

  // Server-safe: life-profile store is browser-first; never let profile IO break report generation.
  let lifeProfile = null as ReturnType<typeof getOrCreateProfile> | null;
  try {
    lifeProfile = getOrCreateProfile(birthSignature);
    if (!lifeProfile.yongShen || lifeProfile.pattern !== pattern) {
      lifeProfile = updateProfile(birthSignature, {
        yongShen,
        pattern,
      });
    }
  } catch {
    lifeProfile = null;
  }

  const calculationIdentity = buildChartCalculationIdentity({
    timing,
    pillars,
    sect,
  });

  return {
    truthInput: {
      birthDate: civilDate,
      pillars,
      yongShen,
      dayun,
      kline: Array.isArray(kline) ? kline : [],
      anchors: Array.isArray(anchors) ? anchors : [],
      shenSha,
      pattern,
      lifeProfile,
    },
    signalsInput: {
      birthDate: civilDate,
      elements,
      birthPlace,
    },
    reportRaw: {
      birthAccuracy: input.birthAccuracy || 'range',
      gender,
      birthTime: input.birthAccuracy === 'unknown' ? null : clockTime,
      birthPlace,
      dayMaster: pillars[2]?.celestialStem,
      birthSignature,
      intent: null,
    },
    lifeProfile,
    timing,
    calculationIdentity,
    clockBirthDate: clockDate,
    clockBirthTime: clockTime,
    sect,
  };
}