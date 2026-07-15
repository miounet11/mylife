/**
 * 命盘计算身份（Calculation Identity）
 *
 * 保证：同一用户输入在 analyze / upgrade / agent 路径上永不“换盘”。
 * - 保存钟表时间（展示用）与有效排盘时间（真太阳时后）
 * - 升级时必须复用同一有效时间与同一四柱指纹
 */

import { calculateTrueSolarTime } from '@/lib/solar-time';
import type { FortuneAnalysisResult, FortuneRecord, Pillar } from '@/lib/user-types';

export const CALCULATION_IDENTITY_VERSION = 'calc-identity-v1';

export type ClockParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export type EffectiveTimingInput = {
  birthDate: string; // YYYY-MM-DD (clock)
  birthTime: string; // HH:mm or HH:mm:ss (clock)
  birthSecond?: number;
  timezone?: number;
  longitude?: number;
  useSolarTime?: boolean;
  useDaylightSaving?: boolean;
  useSeparateZiHour?: boolean;
};

export type EffectiveTiming = {
  usedSolarTime: boolean;
  solarTimeDetail: string;
  clockBirthDate: string;
  clockBirthTime: string;
  effectiveBirthDate: string; // YYYY-MM-DD used for pillars
  effectiveBirthTime: string; // HH:mm used for pillars
  effectiveBirthDateObj: Date;
  effectiveSecond: number;
  timezone: number;
  longitude: number;
  useDaylightSaving: boolean;
  useSeparateZiHour: boolean;
  longitudeOffsetMinutes: number;
  equationOfTimeMinutes: number;
  totalCorrectionMinutes: number;
};

export type ChartCalculationIdentity = {
  version: typeof CALCULATION_IDENTITY_VERSION;
  clockBirthDate: string;
  clockBirthTime: string;
  effectiveBirthDate: string;
  effectiveBirthTime: string;
  timezone: number;
  longitude: number;
  useSolarTime: boolean;
  useDaylightSaving: boolean;
  useSeparateZiHour: boolean;
  sect: 1 | 2;
  solarTimeDetail: string;
  longitudeOffsetMinutes: number;
  equationOfTimeMinutes: number;
  totalCorrectionMinutes: number;
  chartFingerprint: string;
  lockedAt: string;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatDateParts(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function formatTimeParts(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

export function parseBirthDateParts(birthDate: string): { year: number; month: number; day: number } {
  const [year, month, day] = birthDate.split('-').map(Number);
  return {
    year: year || 1970,
    month: month || 1,
    day: day || 1,
  };
}

export function parseBirthTimeParts(
  birthTime: string,
  birthSecond?: number
): { hour: number; minute: number; second: number } {
  const parts = birthTime.split(':').map(Number);
  return {
    hour: parts[0] || 0,
    minute: parts[1] || 0,
    second: Number.isFinite(birthSecond as number)
      ? Number(birthSecond)
      : Number.isFinite(parts[2])
        ? Number(parts[2])
        : 0,
  };
}

/** 夏令时回退到标准钟表时间：固定 -60 分钟（与历史 analyze 行为一致）。 */
export function toStandardClockTime(parts: ClockParts): ClockParts {
  const utcDate = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  );
  utcDate.setUTCMinutes(utcDate.getUTCMinutes() - 60);
  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
    hour: utcDate.getUTCHours(),
    minute: utcDate.getUTCMinutes(),
    second: utcDate.getUTCSeconds(),
  };
}

export function resolveEffectiveTiming(input: EffectiveTimingInput): EffectiveTiming {
  const timezone = Number.isFinite(input.timezone as number) ? Number(input.timezone) : 8;
  const longitude = Number.isFinite(input.longitude as number)
    ? Number(input.longitude)
    : 116.407;
  const useDaylightSaving = Boolean(input.useDaylightSaving);
  const useSeparateZiHour = Boolean(input.useSeparateZiHour);
  const dateParts = parseBirthDateParts(input.birthDate);
  const timeParts = parseBirthTimeParts(input.birthTime, input.birthSecond);

  const clock: ClockParts = {
    year: dateParts.year,
    month: dateParts.month,
    day: dateParts.day,
    hour: timeParts.hour,
    minute: timeParts.minute,
    second: timeParts.second,
  };
  const normalizedClock = useDaylightSaving ? toStandardClockTime(clock) : clock;

  let effective = { ...normalizedClock };
  let usedSolarTime = false;
  let solarTimeDetail = '本次未启用真太阳时修正。';
  let longitudeOffsetMinutes = 0;
  let equationOfTimeMinutes = 0;
  let totalCorrectionMinutes = 0;

  if (input.useSolarTime) {
    const solar = calculateTrueSolarTime(
      normalizedClock.year,
      normalizedClock.month,
      normalizedClock.day,
      normalizedClock.hour,
      normalizedClock.minute,
      normalizedClock.second,
      longitude,
      timezone
    );
    effective = {
      year: solar.year,
      month: solar.month,
      day: solar.day,
      hour: solar.hour,
      minute: solar.minute,
      second: solar.second,
    };
    usedSolarTime = true;
    longitudeOffsetMinutes = solar.longitudeOffset;
    equationOfTimeMinutes = solar.equationOfTime;
    totalCorrectionMinutes = solar.correctionMinutes;
    solarTimeDetail =
      `钟表时间 ${formatDateParts(normalizedClock.year, normalizedClock.month, normalizedClock.day)} ` +
      `${formatTimeParts(normalizedClock.hour, normalizedClock.minute)}:${pad2(normalizedClock.second)} ` +
      `已修正为真太阳时 ${formatDateParts(effective.year, effective.month, effective.day)} ` +
      `${formatTimeParts(effective.hour, effective.minute)}:${pad2(effective.second)}。`;
  }

  const clockBirthDate = formatDateParts(clock.year, clock.month, clock.day);
  const clockBirthTime = formatTimeParts(clock.hour, clock.minute);
  const effectiveBirthDate = formatDateParts(effective.year, effective.month, effective.day);
  const effectiveBirthTime = formatTimeParts(effective.hour, effective.minute);

  return {
    usedSolarTime,
    solarTimeDetail,
    clockBirthDate,
    clockBirthTime,
    effectiveBirthDate,
    effectiveBirthTime,
    effectiveBirthDateObj: new Date(effective.year, effective.month - 1, effective.day),
    effectiveSecond: effective.second,
    timezone,
    longitude,
    useDaylightSaving,
    useSeparateZiHour,
    longitudeOffsetMinutes,
    equationOfTimeMinutes,
    totalCorrectionMinutes,
  };
}

export function pillarsToFingerprint(pillars: Pillar[] | undefined | null): string {
  if (!Array.isArray(pillars) || pillars.length === 0) return '';
  return pillars
    .slice(0, 4)
    .map((p) => `${p?.celestialStem || ''}${p?.earthlyBranch || ''}`)
    .join(' ');
}

export function extractPillarsFromBasic(
  basic: FortuneAnalysisResult['basic'] | FortuneRecord['bazi'] | undefined | null
): Pillar[] {
  if (!basic || typeof basic !== 'object') return [];
  const pillars = (basic as { pillars?: Pillar[] }).pillars;
  return Array.isArray(pillars) ? pillars : [];
}

export function buildChartCalculationIdentity(params: {
  timing: EffectiveTiming;
  pillars?: Pillar[] | null;
  sect?: 1 | 2;
  lockedAt?: string;
}): ChartCalculationIdentity {
  return {
    version: CALCULATION_IDENTITY_VERSION,
    clockBirthDate: params.timing.clockBirthDate,
    clockBirthTime: params.timing.clockBirthTime,
    effectiveBirthDate: params.timing.effectiveBirthDate,
    effectiveBirthTime: params.timing.effectiveBirthTime,
    timezone: params.timing.timezone,
    longitude: params.timing.longitude,
    useSolarTime: params.timing.usedSolarTime,
    useDaylightSaving: params.timing.useDaylightSaving,
    useSeparateZiHour: params.timing.useSeparateZiHour,
    sect: params.sect || (params.timing.useSeparateZiHour ? 1 : 2),
    solarTimeDetail: params.timing.solarTimeDetail,
    longitudeOffsetMinutes: params.timing.longitudeOffsetMinutes,
    equationOfTimeMinutes: params.timing.equationOfTimeMinutes,
    totalCorrectionMinutes: params.timing.totalCorrectionMinutes,
    chartFingerprint: pillarsToFingerprint(params.pillars),
    lockedAt: params.lockedAt || new Date().toISOString(),
  };
}

function isIdentityShape(value: unknown): value is ChartCalculationIdentity {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.effectiveBirthDate === 'string' &&
    typeof v.effectiveBirthTime === 'string' &&
    typeof v.clockBirthDate === 'string' &&
    typeof v.clockBirthTime === 'string'
  );
}

/** 从 analysis / contextSignals / engineEvidence 中读取已锁定的计算身份。 */
export function readChartCalculationIdentity(
  record: Pick<FortuneRecord, 'analysis' | 'bazi'> | null | undefined
): ChartCalculationIdentity | null {
  const analysis = record?.analysis as Record<string, unknown> | undefined;
  if (!analysis) return null;

  const contextSignals = (analysis.contextSignals || {}) as Record<string, unknown>;
  const direct = contextSignals.calculationIdentity || contextSignals.calculationProfile;
  if (isIdentityShape(direct)) {
    return {
      ...direct,
      version: CALCULATION_IDENTITY_VERSION,
      chartFingerprint:
        direct.chartFingerprint || pillarsToFingerprint(extractPillarsFromBasic(record?.bazi)),
      sect: (direct.sect as 1 | 2) || (direct.useSeparateZiHour ? 1 : 2),
      timezone: Number(direct.timezone) || 8,
      longitude: Number(direct.longitude) || 116.407,
      useSolarTime: Boolean(direct.useSolarTime),
      useDaylightSaving: Boolean(direct.useDaylightSaving),
      useSeparateZiHour: Boolean(direct.useSeparateZiHour),
      solarTimeDetail: String(direct.solarTimeDetail || ''),
      longitudeOffsetMinutes: Number(direct.longitudeOffsetMinutes) || 0,
      equationOfTimeMinutes: Number(direct.equationOfTimeMinutes) || 0,
      totalCorrectionMinutes: Number(direct.totalCorrectionMinutes) || 0,
      lockedAt: String(direct.lockedAt || ''),
    };
  }

  const engineEvidence =
    (contextSignals.engineEvidence as Record<string, unknown> | undefined) ||
    ((analysis as { engineEvidence?: Record<string, unknown> }).engineEvidence);
  const evidenceProfile = engineEvidence?.calculationProfile as Record<string, unknown> | undefined;
  if (evidenceProfile && evidenceProfile.trueSolarTimeApplied === true) {
    // 仅有证据包、没有完整 identity 时，无法安全还原有效时间。
    return null;
  }

  return null;
}

export function attachChartCalculationIdentity(
  analysis: FortuneAnalysisResult['analysis'] | Record<string, unknown> | undefined,
  identity: ChartCalculationIdentity
): FortuneAnalysisResult['analysis'] {
  const base = { ...(analysis || {}) } as Record<string, unknown>;
  const contextSignals = {
    ...((base.contextSignals as Record<string, unknown>) || {}),
    calculationIdentity: identity,
  };
  const enhancementNotes = Array.isArray(base.enhancementNotes)
    ? [...(base.enhancementNotes as string[])]
    : [];
  if (identity.useSolarTime && identity.solarTimeDetail) {
    const already = enhancementNotes.some((n) => String(n).includes('真太阳时'));
    if (!already) {
      enhancementNotes.push(identity.solarTimeDetail);
    }
  }
  return {
    ...base,
    contextSignals,
    enhancementNotes,
  } as FortuneAnalysisResult['analysis'];
}

function recordLikelyUsedSolarTime(record: FortuneRecord): boolean {
  const analysis = record.analysis as Record<string, unknown> | undefined;
  if (!analysis) return false;
  const notes = Array.isArray(analysis.enhancementNotes)
    ? (analysis.enhancementNotes as string[]).join('\n')
    : '';
  const explanation = typeof analysis.explanation === 'string' ? analysis.explanation : '';
  const blob = `${notes}\n${explanation}`;
  return /真太阳时/.test(blob);
}

/**
 * 升级 / 重算时的排盘输入。
 * 优先使用锁定的有效时间；没有 identity 时：
 * 1) 若历史文案暗示启用真太阳时，则按钟表时间 + 出生地默认经度重放修正；
 * 2) 否则回退钟表时间。
 * 最终仍有 lockStructuralChartFields 双保险。
 */
export function resolveRegenerationTiming(record: FortuneRecord): {
  birthDate: Date;
  birthTime: string;
  birthPlace: string;
  timezone: number;
  gender: 'male' | 'female';
  sect: 1 | 2;
  identity: ChartCalculationIdentity | null;
  source: 'locked-identity' | 'legacy-solar-replay' | 'clock-fallback';
  chartFingerprint: string;
} {
  const identity = readChartCalculationIdentity(record);
  const lockedPillars = extractPillarsFromBasic(record.bazi);
  const chartFingerprint =
    identity?.chartFingerprint || pillarsToFingerprint(lockedPillars);

  if (identity) {
    const [y, m, d] = identity.effectiveBirthDate.split('-').map(Number);
    return {
      birthDate: new Date(y, (m || 1) - 1, d || 1),
      birthTime: identity.effectiveBirthTime,
      birthPlace: record.birthPlace || '北京',
      timezone: identity.timezone || record.timezone || 8,
      gender: record.gender,
      sect: identity.sect || (identity.useSeparateZiHour ? 1 : 2),
      identity,
      source: 'locked-identity',
      chartFingerprint,
    };
  }

  if (recordLikelyUsedSolarTime(record) && record.birthDate && record.birthTime) {
    const replay = resolveEffectiveTiming({
      birthDate: record.birthDate,
      birthTime: record.birthTime,
      timezone: record.timezone || 8,
      // 历史记录未必存经度：北京默认与 analyze 缺省一致
      longitude: 116.407,
      useSolarTime: true,
      useDaylightSaving: false,
      useSeparateZiHour: false,
    });
    return {
      birthDate: replay.effectiveBirthDateObj,
      birthTime: replay.effectiveBirthTime,
      birthPlace: record.birthPlace || '北京',
      timezone: replay.timezone,
      gender: record.gender,
      sect: 2,
      identity: null,
      source: 'legacy-solar-replay',
      chartFingerprint,
    };
  }

  const parsed = parseLocalDateSafe(record.birthDate);
  return {
    birthDate: parsed,
    birthTime: record.birthTime,
    birthPlace: record.birthPlace || '北京',
    timezone: record.timezone || 8,
    gender: record.gender,
    sect: 2,
    identity: null,
    source: 'clock-fallback',
    chartFingerprint,
  };
}

function parseLocalDateSafe(value: string): Date {
  const [y, m, d] = String(value || '').split('-').map(Number);
  if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
    return new Date(y, m - 1, d);
  }
  const fallback = new Date(value);
  return Number.isFinite(fallback.getTime()) ? fallback : new Date();
}

export function fingerprintsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  return a.trim() === b.trim();
}

/**
 * 若重算结果与锁定四柱不一致，强制回填原盘结构字段，杜绝“换盘写库”。
 */
export function lockStructuralChartFields<T extends FortuneAnalysisResult>(
  regenerated: T,
  locked: Pick<FortuneRecord, 'bazi' | 'fiveElements' | 'tenGods' | 'pattern' | 'dayun' | 'shenSha' | 'klineData'>,
  expectedFingerprint: string
): { result: T; chartLocked: boolean; regeneratedFingerprint: string } {
  const regeneratedFingerprint = pillarsToFingerprint(
    extractPillarsFromBasic(regenerated.basic)
  );
  if (!expectedFingerprint || fingerprintsMatch(expectedFingerprint, regeneratedFingerprint)) {
    return { result: regenerated, chartLocked: false, regeneratedFingerprint };
  }

  return {
    result: {
      ...regenerated,
      basic: locked.bazi || regenerated.basic,
      fiveElements: locked.fiveElements || regenerated.fiveElements,
      tenGods: locked.tenGods || regenerated.tenGods,
      pattern: locked.pattern || regenerated.pattern,
      dayun: locked.dayun ?? regenerated.dayun,
      shenSha: locked.shenSha ?? regenerated.shenSha,
      klineData: locked.klineData ?? regenerated.klineData,
      analysis: {
        ...(regenerated.analysis || {}),
        enhancementNotes: [
          ...((((regenerated.analysis as { enhancementNotes?: string[] } | undefined)
            ?.enhancementNotes) || []) as string[]),
          `命盘身份锁定：重算四柱「${regeneratedFingerprint}」与原盘「${expectedFingerprint}」不一致，已强制保留原盘结构。`,
        ],
      },
    },
    chartLocked: true,
    regeneratedFingerprint,
  };
}

/**
 * 将 baseResult 展平为 agentic groundTruth 顶层字段。
 * 兼容历史 { report: baseResult } 包装。
 */
export function flattenGroundTruthFromReport(
  birthDate: Date,
  baseResult: FortuneAnalysisResult | null | undefined,
  extras?: Record<string, unknown>
) {
  const report = baseResult || ({} as FortuneAnalysisResult);
  const pillars = extractPillarsFromBasic(report.basic);
  const contextSignals = (report.analysis as { contextSignals?: Record<string, unknown> } | undefined)
    ?.contextSignals || {};
  const engineEvidence = (contextSignals.engineEvidence || {}) as Record<string, unknown>;
  const shenShaObj = report.shenSha as { list?: Array<string | { name?: string }> } | string[] | undefined;
  const shenShaList = Array.isArray(shenShaObj)
    ? shenShaObj
    : Array.isArray(shenShaObj?.list)
      ? shenShaObj.list.map((item) => (typeof item === 'string' ? item : item?.name || '')).filter(Boolean)
      : [];

  return {
    birthDate,
    pillars,
    yongShen:
      report.yongShen ||
      contextSignals.yongShen ||
      engineEvidence.yongShen ||
      null,
    dayun: report.dayun || null,
    kline: Array.isArray(report.klineData) ? report.klineData : [],
    anchors:
      (report as { anchors?: unknown[] }).anchors ||
      (engineEvidence.anchors as unknown[]) ||
      [],
    shenSha: shenShaList,
    pattern:
      (report.pattern as { type?: string } | undefined)?.type ||
      (report.pattern as { name?: string } | undefined)?.name ||
      undefined,
    // 保留 report 包以兼容旧适配器；新路径以顶层字段为准
    report,
    ...extras,
  };
}
