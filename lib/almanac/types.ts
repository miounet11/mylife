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
  lunar: {
    yearGanZhi: string;
    monthGanZhi: string;
    dayGanZhi: string;
    yearShengXiao: string;
    monthChinese: string;
    dayChinese: string;
    /** 农历展示 e.g. 六月廿五 */
    lunarText: string;
  };
  jieQi: string | null;
  festivals: string[];
  yi: string[];
  ji: string[];
  chong: string;
  sha: string;
  jiShen: string[];
  xiongSha: string[];
  positions: {
    xi: string;
    fu: string;
    cai: string;
    yangGui?: string;
  };
  zhiXing: string;
  xiu: string;
  xiuLuck: string;
  pengZu: string[];
  nayin: string;
  hours: AlmanacHourSlot[];
  /** Short public summary for cards */
  summary: string;
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
