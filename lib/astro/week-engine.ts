/**
 * Weekly aggregation of engine daily scores for a sign/zone identity.
 * Pure ISO-week calendar helpers live in `iso-week.ts` (client-safe).
 */

import { buildAstroDailyMatchPack } from '@/lib/astro/daily-match-engine';
import type { AstroDailyIdentity } from '@/lib/astro/daily-match-types';
import {
  datesInIsoWeek,
  isoWeekIdFromDate,
  currentIsoWeekId,
  parseIsoWeekId,
  mondayOfIsoWeek,
  shiftIsoWeek,
} from '@/lib/astro/iso-week';
import type { AstroWeekPack, WeekDayCell } from '@/lib/astro/week-types';

export type { AstroWeekPack, WeekDayCell } from '@/lib/astro/week-types';

const WEEKDAYS_ZH = ['日', '一', '二', '三', '四', '五', '六'];

// Re-export pure helpers so existing server imports keep working.
export {
  isoWeekIdFromDate,
  parseIsoWeekId,
  mondayOfIsoWeek,
  datesInIsoWeek,
  currentIsoWeekId,
  shiftIsoWeek,
};

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
