/**
 * All 12 signs (and optional 48 zones sample) scored for one civil day.
 */

import { buildAstroDailyMatchPack } from '@/lib/astro/daily-match-engine';
import { isValidIsoDate } from '@/lib/astro/daily-window';
import { ASTRO_SIGNS } from '@/lib/astro/signs-data';
import { ASTRO_ZONES_48 } from '@/lib/astro/zones-48';
import { buildAlmanacDayPack } from '@/lib/almanac/day-pack';
import type { PersonalDayStance } from '@/lib/almanac/types';
import type { SignKey } from '@/lib/astro/types';

export type DayCompareRow = {
  key: string;
  title: string;
  href: string;
  composite: number;
  stance: PersonalDayStance;
  structure: number;
  expression: number;
};

export type DayComparePack = {
  date: string;
  dayGanZhi: string;
  lunarText: string;
  yi: string[];
  ji: string[];
  signs: DayCompareRow[];
  topSigns: DayCompareRow[];
  lowSigns: DayCompareRow[];
  zoneSamples: DayCompareRow[];
};

export function buildDayComparePack(date: string): DayComparePack | null {
  if (!isValidIsoDate(date)) return null;
  const almanac = buildAlmanacDayPack(date);
  if (!almanac) return null;

  const signs: DayCompareRow[] = [];
  for (const s of ASTRO_SIGNS) {
    const p = buildAstroDailyMatchPack(date, { kind: 'sign', key: s.key as SignKey });
    if (!p) continue;
    signs.push({
      key: s.key,
      title: `${s.symbol} ${s.zh}`,
      href: `/astro/signs/${s.key}/day/${date}`,
      composite: p.scores.composite,
      stance: p.scores.stance,
      structure: p.scores.structure,
      expression: p.scores.expression,
    });
  }
  if (!signs.length) return null;

  const sorted = [...signs].sort((a, b) => b.composite - a.composite);
  // Sample zone phase 3 for each sign (main temperament)
  const zoneSamples: DayCompareRow[] = [];
  for (const z of ASTRO_ZONES_48.filter((x) => x.phase === 3)) {
    const p = buildAstroDailyMatchPack(date, { kind: 'zone', id: z.id });
    if (!p) continue;
    zoneSamples.push({
      key: z.id,
      title: z.title,
      href: `/astro/zones/${z.id}/day/${date}`,
      composite: p.scores.composite,
      stance: p.scores.stance,
      structure: p.scores.structure,
      expression: p.scores.expression,
    });
  }
  zoneSamples.sort((a, b) => b.composite - a.composite);

  return {
    date,
    dayGanZhi: almanac.lunar.dayGanZhi,
    lunarText: almanac.lunar.lunarText,
    yi: almanac.yi,
    ji: almanac.ji,
    signs,
    topSigns: sorted.slice(0, 3),
    lowSigns: [...sorted].reverse().slice(0, 3),
    zoneSamples: zoneSamples.slice(0, 6),
  };
}
