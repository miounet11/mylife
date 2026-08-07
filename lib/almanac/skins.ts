/**
 * Calendar display skins — inspired by traditional tear-off 黄历 and modern web UX.
 */

export type AlmanacSkinId = 'modern' | 'tear' | 'personal' | 'grid' | 'global';

export type AlmanacSkinDef = {
  id: AlmanacSkinId;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  /** Preview hint for switcher */
  preview: string;
};

export const ALMANAC_SKINS: AlmanacSkinDef[] = [
  {
    id: 'modern',
    label: '现代卡片',
    labelEn: 'Modern cards',
    description: '人生K线默认：清晰分区、匹配分与时辰列表。',
    descriptionEn: 'Default Life K-Line layout: clear sections, score, hours.',
    preview: '分栏清晰',
  },
  {
    id: 'tear',
    label: '撕页通书',
    labelEn: 'Tear-off tong-shu',
    description: '参考传统挂历撕页：大号日期、宜忌、十二时辰格、方位冲煞一屏 dens e。',
    descriptionEn: 'Paper tear-off style: big date, yi/ji, 12-hour grid, directions.',
    preview: '纸质挂历',
  },
  {
    id: 'personal',
    label: '个人日运',
    labelEn: 'Personal daily',
    description: '星座站逻辑：星级、一句话 mood、可借力/宜注意优先。',
    descriptionEn: 'Horoscope-site logic: stars, mood line, favors/watchouts first.',
    preview: '每日回看',
  },
  {
    id: 'grid',
    label: '时辰宫格',
    labelEn: 'Hour grid',
    description: '以十二时辰为中心：吉/中/凶色块 + 个人分。',
    descriptionEn: 'Hours-first: auspicious/mid/inauspicious tiles + personal scores.',
    preview: '时辰优先',
  },
  {
    id: 'global',
    label: '全球对照',
    labelEn: 'Global compare',
    description: '通书 · 六曜 · 星座摘要并排，适合多文化用户。',
    descriptionEn: 'Tong-shu · Rokuyō · sun-sign side by side.',
    preview: '多传统',
  },
];

export function getAlmanacSkin(id?: string | null): AlmanacSkinDef {
  return ALMANAC_SKINS.find((s) => s.id === id) || ALMANAC_SKINS[0];
}
