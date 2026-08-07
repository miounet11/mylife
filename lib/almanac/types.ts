/** Public tong-shu day pack + personal overlay types */

export type AlmanacLuck = 'auspicious' | 'inauspicious' | 'neutral';

export type AlmanacHourSlot = {
  index: number;
  ganZhi: string;
  /** Clock range e.g. 09:00–11:00 */
  timeLabel: string;
  minHm: string;
  maxHm: string;
  tianShen: string;
  /** 黄道六神 → auspicious; 黑道 → inauspicious */
  luck: AlmanacLuck;
  yi: string[];
  ji: string[];
};

export type AlmanacDayPack = {
  /** YYYY-MM-DD solar */
  date: string;
  year: number;
  month: number;
  day: number;
  weekday: number;
  weekdayLabel: string;
  weekdayEn: string;
  lunar: {
    yearGanZhi: string;
    monthGanZhi: string;
    dayGanZhi: string;
    yearShengXiao: string;
    dayShengXiao: string;
    monthChinese: string;
    dayChinese: string;
    /** 农历展示 e.g. 六月廿五 */
    lunarText: string;
    monthSizeLabel: string;
  };
  jieQi: string | null;
  prevJieQi: string | null;
  nextJieQi: string | null;
  festivals: string[];
  yi: string[];
  ji: string[];
  chong: string;
  chongShengXiao: string;
  sha: string;
  jiShen: string[];
  xiongSha: string[];
  positions: {
    xi: string;
    fu: string;
    cai: string;
    yangGui?: string;
    yinGui?: string;
    tai: string;
  };
  /** 黄道/黑道 + 当日天神 */
  tianShen: string;
  tianShenType: string;
  zhiXing: string;
  xiu: string;
  xiuLuck: string;
  xiuSong: string;
  pengZu: string[];
  nayin: string;
  /** 六曜（日本等） */
  liuYao: string;
  /** 九星 */
  nineStar: string;
  /** 日禄等 */
  dayLu: string;
  hours: AlmanacHourSlot[];
  /** 太阳星座（公历）— 全球层 */
  westernSign: string;
  westernSignEn: string;
  yearNaYin: string;
  monthNaYin: string;
  season: string;
  hou: string;
  wuHou: string;
  /** Short public summary for cards */
  summary: string;
  /** SEO-friendly long description */
  longSummary: string;
};

export type PersonalDayStance = 'push' | 'steady' | 'conserve';

export type PersonalHourNote = {
  ganZhi: string;
  timeLabel: string;
  publicLuck: AlmanacLuck;
  personalScore: number;
  label: string;
  reason: string;
};

export type PersonalDayOverlay = {
  date: string;
  dayMaster: string;
  dayBranch: string;
  yongShen: string[];
  dayGanZhi: string;
  stance: PersonalDayStance;
  score: number;
  headline: string;
  /** 星座站式一句话主基调 */
  moodLine: string;
  /** 星级 1-5 供 UI */
  stars: number;
  watchouts: string[];
  favors: string[];
  hours: PersonalHourNote[];
  topHours: PersonalHourNote[];
  avoidHours: PersonalHourNote[];
  disclaimer: string;
  dayMasterElement?: string;
  strengthDesc?: string;
};

export type AlmanacMonthCell = {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  dayGanZhi: string;
  yiPreview: string;
  hasJieQi: boolean;
  jieQi: string | null;
};
