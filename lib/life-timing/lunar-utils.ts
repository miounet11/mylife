// @ts-ignore
import { Solar } from 'lunar-javascript';

/** 取一年的立春日期（北京时间） */
export function findLiChun(year: number): Date {
  for (let day = 3; day <= 5; day++) {
    const solar = Solar.fromYmd(year, 2, day);
    const lunar = solar.getLunar();
    if (lunar.getJieQi() === '立春') {
      return new Date(year, 1, day);
    }
  }
  return new Date(year, 1, 4);
}

/** 取某年立春后到次年立春前的命理年干支 */
export function getLiuNianGanZhi(year: number): string {
  const liChun = findLiChun(year);
  const solar = Solar.fromYmd(liChun.getFullYear(), liChun.getMonth() + 1, liChun.getDate());
  return solar.getLunar().getYearInGanZhi();
}

/** 取当前日期所属的命理年干支（注意立春切换） */
export function getCurrentLiuNianGanZhi(currentDate: Date): string {
  const solar = Solar.fromYmd(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    currentDate.getDate()
  );
  return solar.getLunar().getYearInGanZhi();
}

/** 日期加天数 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
