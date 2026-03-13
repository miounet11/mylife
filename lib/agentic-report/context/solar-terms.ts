// @ts-ignore
import { Solar } from 'lunar-javascript';

export interface SolarTermContext {
  currentSolarTerm?: string;
  nextSolarTerm?: string;
  isBeforeLichun: boolean;
  currentLunarYear?: string;
  currentLiuNian?: string;
}

export function getSolarTermContext(date: Date): SolarTermContext {
  try {
    const solar = Solar.fromYmdHms(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes(),
      date.getSeconds()
    );
    const lunar = solar.getLunar();
    const prevJie = lunar.getPrevJie();
    const nextJie = lunar.getNextJie();
    const lichunDate = buildLichunDate(date.getFullYear());

    return {
      currentSolarTerm: prevJie?.getName(),
      nextSolarTerm: nextJie?.getName(),
      isBeforeLichun: !!lichunDate && date.getTime() < lichunDate.getTime(),
      currentLunarYear: lunar.getYearInGanZhi(),
      currentLiuNian: lunar.getYearInGanZhi(),
    };
  } catch {
    return {
      currentSolarTerm: undefined,
      nextSolarTerm: undefined,
      isBeforeLichun: date.getMonth() === 0 || (date.getMonth() === 1 && date.getDate() < 4),
      currentLunarYear: undefined,
      currentLiuNian: undefined,
    };
  }
}

function buildLichunDate(year: number) {
  try {
    const probe = Solar.fromYmdHms(year, 2, 4, 12, 0, 0);
    const jie = probe.getLunar().getPrevJie(true);
    if (!jie || jie.getName() !== '立春') return null;
    const solar = jie.getSolar();
    return new Date(
      solar.getYear(),
      solar.getMonth() - 1,
      solar.getDay(),
      solar.getHour(),
      solar.getMinute(),
      solar.getSecond()
    );
  } catch {
    return null;
  }
}
