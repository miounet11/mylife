/**
 * Global almanac region / tradition profiles.
 * Each region reweights which blocks appear and how labels read — same day engine, different focus.
 */

export type AlmanacRegionId =
  | 'cn'
  | 'tw'
  | 'hk'
  | 'sg'
  | 'jp'
  | 'kr'
  | 'vn'
  | 'us'
  | 'global';

export type AlmanacRegionProfile = {
  id: AlmanacRegionId;
  label: string;
  labelEn: string;
  flag: string;
  /** Short landing blurb */
  blurb: string;
  blurbEn: string;
  /** Which content blocks to emphasize */
  focus: Array<
    | 'tongshu'
    | 'hours'
    | 'personal'
    | 'liuyao'
    | 'zodiac'
    | 'western'
    | 'festivals'
    | 'fengshui'
    | 'jieqi'
  >;
  /** UI accent for chip */
  accent: string;
};

export const ALMANAC_REGIONS: AlmanacRegionProfile[] = [
  {
    id: 'cn',
    label: '中国大陆 · 通书',
    labelEn: 'Mainland China · Tong Shu',
    flag: 'CN',
    blurb: '完整通书：宜忌、冲煞、黄道时辰、吉神方位、建除二十八宿。',
    blurbEn: 'Full tong-shu: yi/ji, clash, huangdao hours, deities, zhi-xing & mansions.',
    focus: ['tongshu', 'hours', 'personal', 'jieqi', 'fengshui'],
    accent: 'brand',
  },
  {
    id: 'tw',
    label: '台湾 · 農民曆',
    labelEn: 'Taiwan · Farmer Almanac',
    flag: 'TW',
    blurb: '農民曆阅读习惯：宜忌、时辰、冲肖、胎神与节气并重。',
    blurbEn: 'Taiwan farmer-almanac habits: yi/ji, hours, clash animal, fetal god, solar terms.',
    focus: ['tongshu', 'hours', 'jieqi', 'personal', 'festivals'],
    accent: 'brand',
  },
  {
    id: 'hk',
    label: '香港 · 通胜',
    labelEn: 'Hong Kong · Tung Shing',
    flag: 'HK',
    blurb: '通胜择日文化：时辰吉凶、冲煞、方位与出行参考。',
    blurbEn: 'Tung Shing culture: hour luck, clash, directions, travel notes.',
    focus: ['tongshu', 'hours', 'fengshui', 'personal'],
    accent: 'brand',
  },
  {
    id: 'sg',
    label: '新加坡/马来 · 华人',
    labelEn: 'SG/MY · Chinese diaspora',
    flag: 'SG',
    blurb: '华人社区常用通书 + 英文并列，偏事业与家庭择日。',
    blurbEn: 'Diaspora tong-shu with bilingual lean; career & family date selection.',
    focus: ['tongshu', 'hours', 'personal', 'western'],
    accent: 'brand',
  },
  {
    id: 'jp',
    label: '日本 · 六曜',
    labelEn: 'Japan · Rokuyō',
    flag: 'JP',
    blurb: '六曜（先胜/友引/先负/佛灭/大安/赤口）为日重点，辅以节气。',
    blurbEn: 'Rokuyō day quality first; solar terms secondary.',
    focus: ['liuyao', 'jieqi', 'festivals', 'personal'],
    accent: 'rose',
  },
  {
    id: 'kr',
    label: '韩国 · 日历民俗',
    labelEn: 'Korea · Folk calendar',
    flag: 'KR',
    blurb: '节气与生肖日柱，配合个人结构节奏（非完整韩国四柱引擎）。',
    blurbEn: 'Solar terms + day animal; personal structure rhythm (not full Saju engine).',
    focus: ['jieqi', 'zodiac', 'personal', 'hours'],
    accent: 'sky',
  },
  {
    id: 'vn',
    label: '越南 · 华人/农历',
    labelEn: 'Vietnam · Lunar',
    flag: 'VN',
    blurb: '农历与通书宜忌，适合跨境华人对照家乡习惯。',
    blurbEn: 'Lunar + tong-shu yi/ji for cross-border Chinese habits.',
    focus: ['tongshu', 'festivals', 'hours', 'personal'],
    accent: 'brand',
  },
  {
    id: 'us',
    label: '北美 · 星座+通书',
    labelEn: 'North America · Zodiac + Tong Shu',
    flag: 'US',
    blurb: '星座日运叙述习惯 + 华人通书层，双语友好。',
    blurbEn: 'Western daily-horoscope narrative + Chinese tong-shu layer.',
    focus: ['western', 'personal', 'hours', 'tongshu'],
    accent: 'violet',
  },
  {
    id: 'global',
    label: '全球 · 综合',
    labelEn: 'Global · Mixed',
    flag: '🌐',
    blurb: '通书 + 六曜 + 星座摘要并列，适合多文化用户一屏对照。',
    blurbEn: 'Tong-shu + Rokuyō + sun-sign summary side by side.',
    focus: ['tongshu', 'liuyao', 'western', 'personal', 'hours'],
    accent: 'brand',
  },
];

export function getAlmanacRegion(id?: string | null): AlmanacRegionProfile {
  const found = ALMANAC_REGIONS.find((r) => r.id === id);
  return found || ALMANAC_REGIONS[0];
}

export function regionShows(region: AlmanacRegionProfile, key: AlmanacRegionProfile['focus'][number]) {
  return region.focus.includes(key);
}
