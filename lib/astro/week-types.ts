/** Week pack view types — client-safe (no engine / DB). */

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
