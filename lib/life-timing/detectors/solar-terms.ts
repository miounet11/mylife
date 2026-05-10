// @ts-ignore
import { Solar } from 'lunar-javascript';
import type { TimingPoint } from '../types';
import { addDays } from '../lunar-utils';

const FOUR_MAIN_TERMS = ['立春', '立夏', '立秋', '立冬'] as const;
type MainTerm = typeof FOUR_MAIN_TERMS[number];

export function detectSolarTerms(currentDate: Date): TimingPoint[] {
  const points: TimingPoint[] = [];

  for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
    const checkDate = addDays(currentDate, dayOffset);
    const solar = Solar.fromYmd(
      checkDate.getFullYear(),
      checkDate.getMonth() + 1,
      checkDate.getDate()
    );
    const lunar = solar.getLunar();
    const jieQi = lunar.getJieQi() as MainTerm;

    if (FOUR_MAIN_TERMS.includes(jieQi)) {
      points.push({
        id: `solar_${jieQi}_${checkDate.getFullYear()}`,
        type: 'solar_term',
        severity: jieQi === '立春' ? 'caution' : 'notice',
        startDate: toIsoDate(checkDate),
        endDate: toIsoDate(addDays(checkDate, 7)),
        rawReason: `${jieQi}节气过渡期，命理上能量切换的关键 7 天`,
        context: { termName: jieQi },
      });
    }
  }

  return points.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
