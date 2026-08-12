import type { CreateContextInput } from '@/lib/agentic-report/create-agentic-context';
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
import { runNatalEngineChain } from '@/lib/natal-engine-chain';

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

  const natal = runNatalEngineChain({
    civilDate,
    civilTime: clockTime,
    pillarDate,
    pillarTime,
    timezone,
    birthPlace,
    sect,
    gender,
  });
  const { pillars, yongShen, dayun, kline, anchors, shenSha, elements, pattern } = natal;

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