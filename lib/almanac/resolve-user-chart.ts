/**
 * Resolve user chart for almanac personal layer via fortune engine when possible.
 */

import { determineYongShen } from '@/lib/bazi-analyzer';
import { calculateFourPillars } from '@/lib/fortune-engine';
import type { PersonalDayInput } from '@/lib/almanac/personal-day';

const EN_WX: Record<string, string> = {
  wood: '木',
  fire: '火',
  earth: '土',
  metal: '金',
  water: '水',
  木: '木',
  火: '火',
  土: '土',
  金: '金',
  水: '水',
};

export type UserChartSnapshot = PersonalDayInput & {
  source: 'engine' | 'stored_pillars' | 'birth_only' | 'query';
  bazi?: string[];
  dayMasterElement?: string;
  strengthDesc?: string;
  analysisSnippet?: string;
  birthDate?: string;
  name?: string;
};

function mapYongList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((x) => EN_WX[`${x || ''}`.trim().toLowerCase()] || EN_WX[`${x || ''}`.trim()] || '')
    .filter(Boolean);
}

function parseBirthTimeHour(birthTime?: string | null): number {
  const tm = `${birthTime || ''}`.match(/(\d{1,2})/);
  if (!tm) return 12;
  return Math.min(23, Math.max(0, Number(tm[1])));
}

function parseBirthDate(birthDate: string): Date | null {
  const m = `${birthDate || ''}`.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Run four pillars + yongShen from birth fields. */
export function buildChartFromBirth(input: {
  birthDate: string;
  birthTime?: string | null;
  birthPlace?: string | null;
  gender?: 'male' | 'female' | string | null;
}): UserChartSnapshot | null {
  const date = parseBirthDate(input.birthDate);
  if (!date) return null;
  const time = `${input.birthTime || '12:00'}`.trim() || '12:00';
  const timeNorm = /^\d{1,2}:\d{2}/.test(time)
    ? time.slice(0, 5).padStart(5, '0')
    : `${String(parseBirthTimeHour(time)).padStart(2, '0')}:00`;

  try {
    const pillars = calculateFourPillars(date, timeNorm, 8, {
      birthPlace: input.birthPlace || null,
      useTrueSolarTime: Boolean(input.birthPlace),
    });
    const bazi = pillars.map((p) => `${p.celestialStem}${p.earthlyBranch}`);
    const day = pillars[2];
    const hour = Number(timeNorm.split(':')[0] || 12);
    const minute = Number(timeNorm.split(':')[1] || 0);
    const ys = determineYongShen(bazi, {
      birthDate: date,
      birthHour: Number.isFinite(hour) ? hour : 12,
      birthMinute: Number.isFinite(minute) ? minute : 0,
    });
    return {
      source: 'engine',
      dayMaster: day.celestialStem,
      dayBranch: day.earthlyBranch,
      dayPillar: `${day.celestialStem}${day.earthlyBranch}`,
      yongShen: mapYongList(ys?.yongShen) || mapYongList(ys?.dayMasterElement ? [ys.dayMasterElement] : []),
      bazi,
      dayMasterElement: ys?.dayMasterElement || EN_WX[day.fiveElements?.main || ''] || undefined,
      strengthDesc: ys?.strengthDesc || undefined,
      analysisSnippet: ys?.analysis?.slice(0, 120) || undefined,
      birthDate: input.birthDate,
    };
  } catch (error) {
    console.error('[almanac] buildChartFromBirth failed', error);
    return null;
  }
}

export function chartFromStoredFortune(fortune: {
  birthDate?: string | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  gender?: string | null;
  name?: string | null;
  result?: {
    pillars?: Array<{ celestialStem?: string; earthlyBranch?: string }>;
    yongShen?: string[];
    dayMaster?: string;
    analysis?: { summary?: string };
  } | null;
}): UserChartSnapshot | null {
  const pillars = fortune.result?.pillars;
  if (Array.isArray(pillars) && pillars[2]?.celestialStem) {
    const bazi = pillars
      .slice(0, 4)
      .map((p) => `${p.celestialStem || ''}${p.earthlyBranch || ''}`)
      .filter((x) => x.length >= 2);
    let yong = mapYongList(fortune.result?.yongShen);
    let strengthDesc: string | undefined;
    let dayMasterElement: string | undefined;
    let analysisSnippet: string | undefined;
    if (bazi.length === 4) {
      try {
        const ys = determineYongShen(bazi, {
          birthDate: fortune.birthDate || undefined,
          birthHour: fortune.birthTime ? Number(`${fortune.birthTime}`.split(':')[0]) : undefined,
        });
        if (ys) {
          if (!yong.length) yong = mapYongList(ys.yongShen);
          strengthDesc = ys.strengthDesc;
          dayMasterElement = ys.dayMasterElement;
          analysisSnippet = ys.analysis?.slice(0, 120);
        }
      } catch {
        // keep stored
      }
    }
    return {
      source: 'stored_pillars',
      dayMaster: pillars[2].celestialStem!,
      dayBranch: pillars[2].earthlyBranch || '',
      dayPillar: `${pillars[2].celestialStem}${pillars[2].earthlyBranch || ''}`,
      yongShen: yong,
      bazi,
      dayMasterElement,
      strengthDesc,
      analysisSnippet,
      birthDate: fortune.birthDate || undefined,
      name: fortune.name || undefined,
    };
  }

  if (fortune.birthDate) {
    const chart = buildChartFromBirth({
      birthDate: fortune.birthDate,
      birthTime: fortune.birthTime,
      birthPlace: fortune.birthPlace,
      gender: fortune.gender,
    });
    if (chart) {
      return { ...chart, name: fortune.name || undefined, source: chart.source };
    }
  }
  return null;
}

/** Load primary fortune chart for user id (server). */
export async function resolveUserChartForAlmanac(userId: string | null): Promise<UserChartSnapshot | null> {
  if (!userId) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { fortuneOperations } = require('@/lib/database') as {
      fortuneOperations?: {
        listByUser?: (uid: string) => Array<{
          isPrimary?: boolean;
          birthDate?: string;
          birthTime?: string;
          birthPlace?: string;
          gender?: string;
          name?: string;
          result?: UserChartSnapshot extends never ? never : Record<string, unknown>;
        }>;
      };
    };
    const list = fortuneOperations?.listByUser?.(userId) || [];
    const primary = list.find((f) => f.isPrimary) || list[0];
    if (!primary) return null;
    return chartFromStoredFortune(primary as never);
  } catch {
    return null;
  }
}
