/**
 * All 12 signs weekly averages for one ISO week — engine-backed ranking.
 */

import { buildAstroWeekPack } from '@/lib/astro/week-engine';
import { datesInIsoWeek, parseIsoWeekId } from '@/lib/astro/week-engine';
import { ASTRO_SIGNS } from '@/lib/astro/signs-data';
import { buildAlmanacDayPack } from '@/lib/almanac/day-pack';
import type { SignKey } from '@/lib/astro/types';
import type { PersonalDayStance } from '@/lib/almanac/types';

export type WeekSignRow = {
  key: SignKey;
  title: string;
  href: string;
  avg: number;
  pushDays: number;
  conserveDays: number;
  bestDate: string | null;
  carefulDate: string | null;
  dominantStance: PersonalDayStance;
};

export type WeekComparePack = {
  weekId: string;
  label: string;
  startDate: string;
  endDate: string;
  midDayGanZhi: string;
  signs: WeekSignRow[];
  top: WeekSignRow[];
  low: WeekSignRow[];
};

function dominantStance(push: number, conserve: number, total: number): PersonalDayStance {
  if (push >= conserve && push >= total - push - conserve) return 'push';
  if (conserve >= push) return 'conserve';
  return 'steady';
}

export function buildWeekComparePack(weekId: string): WeekComparePack | null {
  if (!parseIsoWeekId(weekId)) return null;
  const dates = datesInIsoWeek(weekId);
  if (dates.length < 7) return null;

  const mid = dates[3];
  const midPack = buildAlmanacDayPack(mid);

  const signs: WeekSignRow[] = [];
  for (const s of ASTRO_SIGNS) {
    const w = buildAstroWeekPack(
      weekId,
      { kind: 'sign', key: s.key },
      s.zh,
      (date) => `/astro/signs/${s.key}/day/${date}`,
    );
    if (!w) continue;
    signs.push({
      key: s.key,
      title: `${s.symbol} ${s.zh}`,
      href: `/astro/signs/${s.key}/week/${weekId}`,
      avg: w.avg,
      pushDays: w.pushDays,
      conserveDays: w.conserveDays,
      bestDate: w.best?.date || null,
      carefulDate: w.careful?.date || null,
      dominantStance: dominantStance(w.pushDays, w.conserveDays, w.days.length),
    });
  }
  if (!signs.length) return null;
  const sorted = [...signs].sort((a, b) => b.avg - a.avg);

  return {
    weekId,
    label: `${weekId}（${dates[0]} ~ ${dates[6]}）`,
    startDate: dates[0],
    endDate: dates[6],
    midDayGanZhi: midPack?.lunar.dayGanZhi || '—',
    signs,
    top: sorted.slice(0, 3),
    low: [...sorted].reverse().slice(0, 3),
  };
}
