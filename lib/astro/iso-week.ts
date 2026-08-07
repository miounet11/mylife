/**
 * Pure ISO-week helpers — safe for client components (no engine / DB imports).
 */

import { isValidIsoDate, shiftIsoDate } from '@/lib/astro/daily-window';

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
