/**
 * Monthly score grid for a sign/zone — engine scores per day, no fluff.
 */

import { buildAstroDailyMatchPack } from '@/lib/astro/daily-match-engine';
import type { AstroDailyIdentity } from '@/lib/astro/daily-match-types';
import { isValidIsoDate } from '@/lib/astro/daily-window';
import type { PersonalDayStance } from '@/lib/almanac/types';

export type MonthDayCell = {
  date: string;
  day: number;
  composite: number;
  stance: PersonalDayStance;
  dayGanZhi: string;
  href: string;
};

export type AstroMonthPack = {
  year: number;
  month: number;
  label: string;
  identityLabel: string;
  cells: MonthDayCell[];
  avg: number;
  best: MonthDayCell | null;
  careful: MonthDayCell | null;
  pushDays: number;
  conserveDays: number;
};

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function buildAstroMonthPack(
  year: number,
  month: number,
  identity: AstroDailyIdentity,
  identityLabel: string,
  hrefForDate: (date: string) => string,
): AstroMonthPack | null {
  if (year < 1900 || year > 2100 || month < 1 || month > 12) return null;
  const n = daysInMonth(year, month);
  const cells: MonthDayCell[] = [];
  for (let d = 1; d <= n; d++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (!isValidIsoDate(date)) continue;
    const pack = buildAstroDailyMatchPack(date, identity);
    if (!pack) continue;
    cells.push({
      date,
      day: d,
      composite: pack.scores.composite,
      stance: pack.scores.stance,
      dayGanZhi: pack.almanac.dayGanZhi,
      href: hrefForDate(date),
    });
  }
  if (!cells.length) return null;
  const avg = Math.round(cells.reduce((s, c) => s + c.composite, 0) / cells.length);
  const best = [...cells].sort((a, b) => b.composite - a.composite)[0] || null;
  const careful = [...cells].sort((a, b) => a.composite - b.composite)[0] || null;
  return {
    year,
    month,
    label: `${year}年${month}月`,
    identityLabel,
    cells,
    avg,
    best,
    careful,
    pushDays: cells.filter((c) => c.stance === 'push').length,
    conserveDays: cells.filter((c) => c.stance === 'conserve').length,
  };
}

export function parseYearMonth(ym: string): { year: number; month: number } | null {
  const m = ym.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function currentYearMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftYearMonth(ym: string, delta: number): string {
  const p = parseYearMonth(ym);
  if (!p) return ym;
  const d = new Date(p.year, p.month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
