/** Western astrology content hub — 十二星座 / 48星区 / 上升 */

export type ElementKey = '火' | '土' | '风' | '水';
export type ModalityKey = '基本' | '固定' | '变动';

export type SignKey =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

export type AstroSignProfile = {
  key: SignKey;
  zh: string;
  en: string;
  symbol: string;
  element: ElementKey;
  modality: ModalityKey;
  ruler: string;
  /** Civil sun-sign bounds MM-DD inclusive */
  start: string;
  end: string;
  keywords: string[];
  summary: string;
  strengths: string[];
  watchouts: string[];
  career: string;
  relationship: string;
  /** World Yi bridge: structure language */
  worldYiBridge: string;
  /** Almanac / daily rhythm note */
  dailyRhythm: string;
  /** Pairing notes (soft, non-fatal) */
  pairsWell: SignKey[];
  needsWork: SignKey[];
};

export type ZonePhase = 1 | 2 | 3 | 4;

export type AstroZone48 = {
  id: string;
  /** 1..48 */
  index: number;
  signKey: SignKey;
  phase: ZonePhase;
  /** e.g. 白羊座·一区 */
  title: string;
  titleEn: string;
  start: string;
  end: string;
  /** Cross-border flavor when near sign cusp */
  cuspWith?: SignKey | null;
  summary: string;
  traits: string[];
  actionTip: string;
};

export type RisingProfile = {
  key: SignKey;
  zh: string;
  en: string;
  firstImpression: string;
  bodyStyle: string;
  socialMode: string;
  strengths: string[];
  watchouts: string[];
  worldYiBridge: string;
};
