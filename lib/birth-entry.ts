import { Solar } from 'lunar-javascript';
import { DI_ZHI, TIAN_GAN } from '@/lib/bazi-constants';

export type BirthEntryMode = 'solar' | 'lunar' | 'pillars';

export interface BirthMomentValue {
  birthDate: string;
  birthTime: string;
}

export const LUNAR_MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
export const LUNAR_DAY_NAMES = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];
export const JIA_ZI_OPTIONS = Array.from({ length: 60 }, (_, index) => (
  `${TIAN_GAN[index % TIAN_GAN.length]}${DI_ZHI[index % DI_ZHI.length]}`
));

export function formatPart(value: number) {
  return String(value).padStart(2, '0');
}

export function parseBirthMoment({ birthDate, birthTime }: BirthMomentValue) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const [hour, minute] = birthTime.split(':').map(Number);
  return { year, month, day, hour, minute };
}

export function toBirthDate(year: number, month: number, day: number) {
  return `${year}-${formatPart(month)}-${formatPart(day)}`;
}

export function toBirthTime(hour: number, minute: number) {
  return `${formatPart(hour)}:${formatPart(minute)}`;
}

export function getSolarInstance(value: BirthMomentValue) {
  const { year, month, day, hour, minute } = parseBirthMoment(value);
  return Solar.fromYmdHms(year, month, day, hour, minute, 0);
}

export function formatSolarDisplay(value: BirthMomentValue) {
  const { year, month, day, hour, minute } = parseBirthMoment(value);
  return `${year}年${formatPart(month)}月${formatPart(day)}日 ${formatPart(hour)}:${formatPart(minute)}`;
}

export function formatLunarMonth(month: number) {
  const label = LUNAR_MONTH_NAMES[Math.abs(month) - 1] || String(Math.abs(month));
  return `${month < 0 ? '闰' : ''}${label}月`;
}

export function formatLunarDay(day: number) {
  return LUNAR_DAY_NAMES[day - 1] || String(day);
}

export function formatLunarDisplay(value: BirthMomentValue) {
  const lunar = getSolarInstance(value).getLunar();
  return `农历 ${lunar.getYear()}年${formatLunarMonth(lunar.getMonth())}${formatLunarDay(lunar.getDay())} ${formatPart(lunar.getHour())}:${formatPart(lunar.getMinute())}`;
}

export function getPillarValues(value: BirthMomentValue) {
  const eightChar = getSolarInstance(value).getLunar().getEightChar();
  return {
    yearPillar: eightChar.getYear(),
    monthPillar: eightChar.getMonth(),
    dayPillar: eightChar.getDay(),
    timePillar: eightChar.getTime(),
  };
}

export function formatPillarsDisplay(value: BirthMomentValue) {
  const pillars = getPillarValues(value);
  return `四柱 ${pillars.yearPillar} ${pillars.monthPillar} ${pillars.dayPillar} ${pillars.timePillar}`;
}

export function formatBirthDisplay(mode: BirthEntryMode, value: BirthMomentValue) {
  if (mode === 'lunar') return formatLunarDisplay(value);
  if (mode === 'pillars') return formatPillarsDisplay(value);
  return formatSolarDisplay(value);
}

export function parseCompactBirthInput(input: string) {
  const digits = input.replace(/\D/g, '');
  if (digits.length !== 8 && digits.length !== 12) return null;

  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const hour = digits.length === 12 ? Number(digits.slice(8, 10)) : 0;
  const minute = digits.length === 12 ? Number(digits.slice(10, 12)) : 0;

  return { year, month, day, hour, minute };
}
