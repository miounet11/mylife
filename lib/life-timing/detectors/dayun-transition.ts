import type { TimingPoint, DetectorInput } from '../types';
import { addDays } from '../lunar-utils';

export function detectDayunTransition(input: DetectorInput): TimingPoint[] {
  const points: TimingPoint[] = [];
  const dayuns = input.dayunResult?.dayuns || [];

  for (const dayun of dayuns) {
    const startAge = dayun.startAge;
    const startDate = addYearsToBirth(input.birthDate, startAge);
    const monthsUntilStart = monthsBetween(input.currentDate, startDate);

    if (monthsUntilStart >= 0 && monthsUntilStart <= 12) {
      points.push({
        id: `dayun_${dayun.ganZhi}_${startAge}`,
        type: 'dayun_transition',
        severity: 'critical',
        startDate: toIsoDate(addDays(startDate, -30)),
        endDate: toIsoDate(addYearsToBirth(input.birthDate, startAge + 10)),
        rawReason: `进入${dayun.ganZhi}大运（${startAge}-${startAge + 10}岁），10 年人生节奏切换`,
        context: {
          ganZhi: dayun.ganZhi,
          startAge,
          startDate: toIsoDate(startDate),
        },
      });
    }
  }

  return points;
}

function addYearsToBirth(birth: Date, years: number): Date {
  const result = new Date(birth);
  result.setFullYear(birth.getFullYear() + years);
  return result;
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
