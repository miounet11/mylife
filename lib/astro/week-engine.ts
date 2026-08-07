/**
 * Weekly aggregation of engine daily scores for a sign/zone identity.
 */

import { buildAstroDailyMatchPack } from '@/lib/astro/daily-match-engine';
import type { AstroDailyIdentity } from '@/lib/astro/daily-match-types';
import { isValidIsoDate, shiftIsoDate } from '@/lib/astro/daily-window';
import type { PersonalDayStance } from '@/lib/almanac/types';

export type WeekDayCell = {
  date: string;
  weekday: string;
  composite: number;
  stance: PersonalDayStance;
  dayGanZhi: string;
  headline: string;
  href: string;
};

export type AstroWeekPack = {
  weekId: string;
  label: string;
  startDate: string;
  endDate: string;
  identityLabel: string;
  days: WeekDayCell[];
  avg: number;
  best: WeekDayCell | null;
  careful: WeekDayCell | null;
  pushDays: number;
  conserveDays: number;
  summary: string;
};

const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

/** ISO week id: 2026-W32 (Monday start) */
export function isoWeekIdFromDate(date: string): string | null {
  if (!isValidIsoDate(date)) return null;
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  // Thursday in current week decides the year
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((dt.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const isoYear = dt.getUTCFullYear();
  return `${isoYear}-W${String(weekNo).padStart(2, '0')}`;
}

export function parseIsoWeekId(weekId: string): { year: number; week: number } | null {
  const m = weekId.match(/^(\d{4})-W(\d{2})$/i);
  if (!m) return null;
  const year = Number(m[1]);
  const week = Number(m[2]);
  if (week < 1 || week > 53) return null;
  return { year, week };
}

/** Monday of ISO week as YYYY-MM-DD */
export function mondayOfIsoWeek(weekId: string): string | null {
  const p = parseIsoWeekId(weekId);
  if (!p) return null;
  // ISO: week 1 contains Jan 4
  const jan4 = new Date(Date.UTC(p.year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const monday = new Date(mondayWeek1);
  monday.setUTCDate(mondayWeek1.getUTCDate() + (p.week - 1) * 7);
  const y = monday.getUTCFullYear();
  const mo = String(monday.getUTCMonth() + 1).padStart(2, '0');
  const da = String(monday.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

export function datesInIsoWeek(weekId: string): string[] {
  const mon = mondayOfIsoWeek(weekId);
  if (!mon) return [];
  return Array.from({ length: 7 }, (_, i) => shiftIsoDate(mon, i));
}

export function buildAstroWeekPack(
  weekId: string,
  identity: AstroDailyIdentity,
  identityLabel: string,
  hrefForDate: (date: string) => string,
): AstroWeekPack | null {
  const dates = datesInIsoWeek(weekId);
  if (!dates.length) return null;
  const days: WeekDayCell[] = [];
  for (const date of dates) {
    const pack = buildAstroDailyMatchPack(date, identity);
    if (!pack) continue;
    const [y, m, d] = date.split('-').map(Number);
    const wd = new Date(y, m - 1, d).getDay();
    days.push({
      date,
      weekday: `周${WEEKDAYS_ZH[wd]}`,
      composite: pack.scores.composite,
      stance: pack.scores.stance,
      dayGanZhi: pack.almanac.dayGanZhi,
      headline: pack.narrative.moodLine.slice(0, 48),
      href: hrefForDate(date),
    });
  }
  if (!days.length) return null;
  const avg = Math.round(days.reduce((s, c) => s + c.composite, 0) / days.length);
  const best = [...days].sort((a, b) => b.composite - a.composite)[0] || null;
  const careful = [...days].sort((a, b) => a.composite - b.composite)[0] || null;
  const pushDays = days.filter((c) => c.stance === 'push').length;
  const conserveDays = days.filter((c) => c.stance === 'conserve').length;
  const summary = [
    `${identityLabel}${weekId}：均分${avg}`,
    best ? `较顺${best.weekday}${best.date.slice(5)}（${best.composite}）` : '',
    careful ? `宜慎${careful.weekday}${careful.date.slice(5)}（${careful.composite}）` : '',
    `可推进${pushDays}天·守成${conserveDays}天`,
  ]
    .filter(Boolean)
    .join('；');

  return {
    weekId,
    label: `${weekId}（${dates[0]} ~ ${dates[6]}）`,
    startDate: dates[0],
    endDate: dates[6],
    identityLabel,
    days,
    avg,
    best,
    careful,
    pushDays,
    conserveDays,
    summary,
  };
}

export function currentIsoWeekId(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return isoWeekIdFromDate(`${y}-${m}-${d}`) || `${y}-W01`;
}

export function shiftIsoWeek(weekId: string, delta: number): string {
  const mon = mondayOfIsoWeek(weekId);
  if (!mon) return weekId;
  const shifted = shiftIsoDate(mon, delta * 7);
  return isoWeekIdFromDate(shifted) || weekId;
}
