/**
 * Public Chinese almanac (通书/黄历) day pack via lunar-javascript.
 * No personal chart — safe for SSR and SEO.
 */

// @ts-ignore
import { Solar } from 'lunar-javascript';
import { isHuangDaoShen } from '@/lib/almanac/elements';
import type { AlmanacDayPack, AlmanacHourSlot, AlmanacLuck, AlmanacMonthCell } from '@/lib/almanac/types';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Civil sun-sign (approx boundaries) for global layer */
function westernSignForMd(month: number, day: number): { zh: string; en: string } {
  const md = month * 100 + day;
  if (md >= 1222 || md <= 119) return { zh: '摩羯座', en: 'Capricorn' };
  if (md <= 218) return { zh: '水瓶座', en: 'Aquarius' };
  if (md <= 320) return { zh: '双鱼座', en: 'Pisces' };
  if (md <= 419) return { zh: '白羊座', en: 'Aries' };
  if (md <= 520) return { zh: '金牛座', en: 'Taurus' };
  if (md <= 621) return { zh: '双子座', en: 'Gemini' };
  if (md <= 722) return { zh: '巨蟹座', en: 'Cancer' };
  if (md <= 822) return { zh: '狮子座', en: 'Leo' };
  if (md <= 922) return { zh: '处女座', en: 'Virgo' };
  if (md <= 1023) return { zh: '天秤座', en: 'Libra' };
  if (md <= 1122) return { zh: '天蝎座', en: 'Scorpio' };
  return { zh: '射手座', en: 'Sagittarius' };
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => `${x || ''}`.trim()).filter(Boolean);
}

function parseYmd(date: string): { y: number; m: number; d: number } | null {
  const m = `${date || ''}`.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function formatDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function hourLuck(tianShen: string): AlmanacLuck {
  if (isHuangDaoShen(tianShen)) return 'auspicious';
  if (!tianShen) return 'neutral';
  return 'inauspicious';
}

function buildHours(lunar: {
  getTimes: () => Array<{
    getGanZhi: () => string;
    getTianShen: () => string;
    getMinHm: () => string;
    getMaxHm: () => string;
    getYi?: () => string[];
    getJi?: () => string[];
  }>;
}): AlmanacHourSlot[] {
  try {
    const times = lunar.getTimes() || [];
    // Skip 子时 overnight duplicate index if library returns 13
    const slots = times.slice(0, 12);
    return slots.map((t, index) => {
      const tianShen = `${t.getTianShen?.() || ''}`.trim();
      const minHm = `${t.getMinHm?.() || ''}`.trim();
      const maxHm = `${t.getMaxHm?.() || ''}`.trim();
      return {
        index,
        ganZhi: `${t.getGanZhi?.() || ''}`.trim(),
        timeLabel: minHm && maxHm ? `${minHm}–${maxHm}` : '',
        minHm,
        maxHm,
        tianShen,
        luck: hourLuck(tianShen),
        yi: asStringArray(t.getYi?.()),
        ji: asStringArray(t.getJi?.()),
      };
    });
  } catch {
    return [];
  }
}

export function buildAlmanacDayPack(date: string | Date = new Date()): AlmanacDayPack | null {
  let y: number;
  let m: number;
  let d: number;
  if (typeof date === 'string') {
    const parsed = parseYmd(date);
    if (!parsed) return null;
    ({ y, m, d } = parsed);
  } else {
    y = date.getFullYear();
    m = date.getMonth() + 1;
    d = date.getDate();
  }

  try {
    const solar = Solar.fromYmd(y, m, d);
    const lunar = solar.getLunar();
    const dateStr = formatDate(y, m, d);
    const weekday = solar.getWeek?.() ?? new Date(y, m - 1, d).getDay();
    const yi = asStringArray(lunar.getDayYi?.());
    const ji = asStringArray(lunar.getDayJi?.());
    const jieQi = `${lunar.getJieQi?.() || ''}`.trim() || null;
    const festivals = asStringArray(lunar.getFestivals?.()).concat(asStringArray(lunar.getOtherFestivals?.()));
    const dayGanZhi = `${lunar.getDayInGanZhi?.() || ''}`.trim();
    const hours = buildHours(lunar);

    const monthCn = `${lunar.getMonthInChinese?.() || ''}`.trim();
    const dayCn = `${lunar.getDayInChinese?.() || ''}`.trim();
    const liuYao = `${lunar.getLiuYao?.() || ''}`.trim();
    const nineStar = (() => {
      try {
        const ns = lunar.getDayNineStar?.();
        return ns ? `${ns}` : '';
      } catch {
        return '';
      }
    })();
    const west = westernSignForMd(m, d);
    const daysInLunarMonth = (() => {
      try {
        return Number(lunar.getDayCount?.() || 0);
      } catch {
        return 0;
      }
    })();

    const summaryParts = [
      `${dateStr} · 农历${monthCn}${dayCn}`,
      dayGanZhi ? `日柱 ${dayGanZhi}` : '',
      liuYao ? `六曜 ${liuYao}` : '',
      yi.length ? `宜 ${yi.slice(0, 4).join('、')}` : '',
      ji.length ? `忌 ${ji.slice(0, 3).join('、')}` : '',
    ].filter(Boolean);

    return {
      date: dateStr,
      year: y,
      month: m,
      day: d,
      weekday,
      weekdayLabel: `星期${WEEKDAYS[weekday] || ''}`,
      weekdayEn: WEEKDAYS_EN[weekday] || '',
      lunar: {
        yearGanZhi: `${lunar.getYearInGanZhi?.() || ''}`.trim(),
        monthGanZhi: `${lunar.getMonthInGanZhi?.() || ''}`.trim(),
        dayGanZhi,
        yearShengXiao: `${lunar.getYearShengXiao?.() || ''}`.trim(),
        dayShengXiao: `${lunar.getDayShengXiao?.() || ''}`.trim(),
        monthChinese: monthCn,
        dayChinese: dayCn,
        lunarText: `${monthCn}${dayCn}`,
        monthSizeLabel: daysInLunarMonth >= 30 ? '大' : daysInLunarMonth > 0 ? '小' : '',
      },
      jieQi,
      prevJieQi: `${lunar.getPrevJieQi?.()?.getName?.() || lunar.getPrevJieQi?.() || ''}`.trim() || null,
      nextJieQi: `${lunar.getNextJieQi?.()?.getName?.() || lunar.getNextJieQi?.() || ''}`.trim() || null,
      festivals,
      yi,
      ji,
      chong: `${lunar.getDayChongDesc?.() || ''}`.trim(),
      chongShengXiao: `${lunar.getDayChongShengXiao?.() || ''}`.trim(),
      sha: `${lunar.getDaySha?.() || ''}`.trim(),
      jiShen: asStringArray(lunar.getDayJiShen?.()),
      xiongSha: asStringArray(lunar.getDayXiongSha?.()),
      positions: {
        xi: `${lunar.getDayPositionXiDesc?.() || ''}`.trim(),
        fu: `${lunar.getDayPositionFuDesc?.() || ''}`.trim(),
        cai: `${lunar.getDayPositionCaiDesc?.() || ''}`.trim(),
        yangGui: `${lunar.getDayPositionYangGuiDesc?.() || ''}`.trim() || undefined,
        yinGui: `${lunar.getDayPositionYinGuiDesc?.() || ''}`.trim() || undefined,
        tai: `${lunar.getDayPositionTai?.() || ''}`.trim(),
      },
      tianShen: `${lunar.getDayTianShen?.() || ''}`.trim(),
      tianShenType: `${lunar.getDayTianShenType?.() || ''}`.trim(),
      zhiXing: `${lunar.getZhiXing?.() || ''}`.trim(),
      xiu: `${lunar.getXiu?.() || ''}`.trim(),
      xiuLuck: `${lunar.getXiuLuck?.() || ''}`.trim(),
      xiuSong: `${lunar.getXiuSong?.() || ''}`.trim(),
      pengZu: [
        `${lunar.getPengZuGan?.() || ''}`.trim(),
        `${lunar.getPengZuZhi?.() || ''}`.trim(),
      ].filter(Boolean),
      nayin: `${lunar.getDayNaYin?.() || ''}`.trim(),
      liuYao,
      nineStar,
      dayLu: `${lunar.getDayLu?.() || ''}`.trim(),
      hours,
      westernSign: west.zh,
      westernSignEn: west.en,
      summary: summaryParts.join(' · '),
    };
  } catch (error) {
    console.error('[almanac] buildAlmanacDayPack failed', date, error);
    return null;
  }
}

export function buildAlmanacMonthGrid(year: number, month: number, today = new Date()): AlmanacMonthCell[] {
  const first = new Date(year, month - 1, 1);
  const startWeekday = first.getDay(); // 0 Sun
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = formatDate(today.getFullYear(), today.getMonth() + 1, today.getDate());

  const cells: AlmanacMonthCell[] = [];
  // Leading padding from previous month
  const prevDays = new Date(year, month - 1, 0).getDate();
  for (let i = 0; i < startWeekday; i++) {
    const day = prevDays - startWeekday + i + 1;
    const pm = month === 1 ? 12 : month - 1;
    const py = month === 1 ? year - 1 : year;
    const date = formatDate(py, pm, day);
    const pack = buildAlmanacDayPack(date);
    cells.push({
      date,
      day,
      inMonth: false,
      isToday: date === todayStr,
      dayGanZhi: pack?.lunar.dayGanZhi || '',
      yiPreview: pack?.yi[0] || '',
      hasJieQi: Boolean(pack?.jieQi),
      jieQi: pack?.jieQi || null,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = formatDate(year, month, day);
    const pack = buildAlmanacDayPack(date);
    cells.push({
      date,
      day,
      inMonth: true,
      isToday: date === todayStr,
      dayGanZhi: pack?.lunar.dayGanZhi || '',
      yiPreview: pack?.yi[0] || '',
      hasJieQi: Boolean(pack?.jieQi),
      jieQi: pack?.jieQi || null,
    });
  }

  // Trailing to complete weeks (42 cells max for 6 rows)
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1];
    const nextDate = new Date(last.date);
    nextDate.setDate(nextDate.getDate() + 1);
    const date = formatDate(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
    const pack = buildAlmanacDayPack(date);
    cells.push({
      date,
      day: nextDate.getDate(),
      inMonth: false,
      isToday: date === todayStr,
      dayGanZhi: pack?.lunar.dayGanZhi || '',
      yiPreview: pack?.yi[0] || '',
      hasJieQi: Boolean(pack?.jieQi),
      jieQi: pack?.jieQi || null,
    });
  }

  return cells;
}

export function todayDateString(now = new Date()): string {
  return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
