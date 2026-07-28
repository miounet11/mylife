/**
 * 西占太阳星座 + 十二生肖（由公历生日推导）
 * 上升/月亮需自报或精确时辰星盘，此处仅作结构底座字段。
 */

export type WesternSign = {
  key: string;
  zh: string;
  en: string;
  element: '火' | '土' | '风' | '水';
  modality: '基本' | '固定' | '变动';
  /** month-day inclusive start MM-DD */
  start: string;
  end: string;
};

export const WESTERN_SIGNS: WesternSign[] = [
  { key: 'capricorn', zh: '摩羯座', en: 'Capricorn', element: '土', modality: '基本', start: '12-22', end: '01-19' },
  { key: 'aquarius', zh: '水瓶座', en: 'Aquarius', element: '风', modality: '固定', start: '01-20', end: '02-18' },
  { key: 'pisces', zh: '双鱼座', en: 'Pisces', element: '水', modality: '变动', start: '02-19', end: '03-20' },
  { key: 'aries', zh: '白羊座', en: 'Aries', element: '火', modality: '基本', start: '03-21', end: '04-19' },
  { key: 'taurus', zh: '金牛座', en: 'Taurus', element: '土', modality: '固定', start: '04-20', end: '05-20' },
  { key: 'gemini', zh: '双子座', en: 'Gemini', element: '风', modality: '变动', start: '05-21', end: '06-21' },
  { key: 'cancer', zh: '巨蟹座', en: 'Cancer', element: '水', modality: '基本', start: '06-22', end: '07-22' },
  { key: 'leo', zh: '狮子座', en: 'Leo', element: '火', modality: '固定', start: '07-23', end: '08-22' },
  { key: 'virgo', zh: '处女座', en: 'Virgo', element: '土', modality: '变动', start: '08-23', end: '09-22' },
  { key: 'libra', zh: '天秤座', en: 'Libra', element: '风', modality: '基本', start: '09-23', end: '10-23' },
  { key: 'scorpio', zh: '天蝎座', en: 'Scorpio', element: '水', modality: '固定', start: '10-24', end: '11-22' },
  { key: 'sagittarius', zh: '射手座', en: 'Sagittarius', element: '火', modality: '变动', start: '11-23', end: '12-21' },
];

export const CHINESE_ZODIAC = [
  '鼠',
  '牛',
  '虎',
  '兔',
  '龙',
  '蛇',
  '马',
  '羊',
  '猴',
  '鸡',
  '狗',
  '猪',
] as const;

export type ChineseZodiacAnimal = (typeof CHINESE_ZODIAC)[number];

function mdToNum(md: string): number {
  const [m, d] = md.split('-').map(Number);
  return m * 100 + d;
}

/**
 * 太阳星座（常用民用分界；交点前后 1 日建议按精确星历核对）
 */
export function getSunSign(birthDate: string): WesternSign | null {
  const m = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const md = mdToNum(`${m[2]}-${m[3]}`);

  for (const sign of WESTERN_SIGNS) {
    const start = mdToNum(sign.start);
    const end = mdToNum(sign.end);
    if (start > end) {
      // Capricorn wraps year
      if (md >= start || md <= end) return sign;
    } else if (md >= start && md <= end) {
      return sign;
    }
  }
  return null;
}

/**
 * 生肖：按公历年近似（立春前出生者民间常归上一年，此处标注为「公历年近似」）
 * year base: 1984 = 鼠 → (year - 4) % 12
 */
export function getChineseZodiac(birthDate: string): {
  animal: ChineseZodiacAnimal;
  year: number;
  note: string;
} | null {
  const m = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  // Rough: if before Feb 4, treat as previous solar year for zodiac (near 立春)
  let zYear = year;
  if (month < 2 || (month === 2 && day < 4)) {
    zYear = year - 1;
  }
  const idx = ((zYear - 4) % 12 + 12) % 12;
  return {
    animal: CHINESE_ZODIAC[idx],
    year: zYear,
    note: '按近立春分界的公历近似，精确生肖以农历年柱为准',
  };
}

export function buildAstroFromBirth(birthDate: string | null | undefined): {
  sunSign: string | null;
  sunSignEn: string | null;
  chineseZodiac: string | null;
  chineseZodiacYear: number | null;
  element: string | null;
  modality: string | null;
  note: string | null;
} {
  if (!birthDate) {
    return {
      sunSign: null,
      sunSignEn: null,
      chineseZodiac: null,
      chineseZodiacYear: null,
      element: null,
      modality: null,
      note: null,
    };
  }
  const sun = getSunSign(birthDate);
  const cz = getChineseZodiac(birthDate);
  return {
    sunSign: sun?.zh || null,
    sunSignEn: sun?.en || null,
    chineseZodiac: cz ? `${cz.animal}` : null,
    chineseZodiacYear: cz?.year || null,
    element: sun?.element || null,
    modality: sun?.modality || null,
    note: cz?.note || null,
  };
}

export const WESTERN_SIGN_OPTIONS = WESTERN_SIGNS.map((s) => ({
  key: s.key,
  label: s.zh,
  en: s.en,
}));
