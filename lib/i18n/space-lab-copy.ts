/**
 * Space Field Lab UI copy — zh-CN / zh-Hant / en
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';

type Dict = {
  productName: string;
  tagline: string;
  tabs: { preset: string; site: string; controls: string };
  views: { plan: string; iso: string; three: string };
  overlays: Record<string, string>;
  layers: Record<string, string>;
  compass: {
    title: string;
    north: string;
    drag: string;
    snap: string;
    rotate: string;
    entrance: string;
  };
  plan: {
    living: string;
    bedroom: string;
    bath: string;
    kitchen: string;
    balcony: string;
    corridor: string;
    storage: string;
    entrance: string;
    overlayHint: string;
    paperOn: string;
    paperOff: string;
  };
  pro: { copy: string; exportJson: string; save: string; publish: string };
  site: { map: string; locate: string; toPreset: string; footfall: string };
  show: { compass: string; nineGrid: string; furniture: string; labels: string; areas: string };
  loading3d: string;
  disclaimer: string;
};

const ZH_CN: Dict = {
  productName: '空间场',
  tagline: '方案 · 地图 · 方位 · 平面叠图',
  tabs: { preset: '方案', site: '地图选址', controls: '控制' },
  views: { plan: '平面', iso: '等距', three: '3D' },
  overlays: {
    none: '无叠图',
    bagua8: '八方位',
    radial24: '二十四山',
    bagua9: '九宫格',
    sector: '扇区',
    flyingStar: '九星扇区',
  },
  layers: {
    energy: '能量',
    wind: '风速',
    light: '采光',
    nineStar: '九星',
    qimen: '奇门',
  },
  compass: {
    title: '虚拟罗盘',
    north: '北',
    drag: '拖动指针或点方位，旋转整图',
    snap: '八方吸附',
    rotate: '图面旋转',
    entrance: '主入口',
  },
  plan: {
    living: '客厅',
    bedroom: '卧室',
    bath: '卫生间',
    kitchen: '厨房',
    balcony: '阳台',
    corridor: '过道',
    storage: '储物',
    entrance: '入口',
    overlayHint: '叠图为结构示意，非吉凶断事',
    paperOn: '纸质底',
    paperOff: '深色底',
  },
  pro: { copy: '复制简报', exportJson: '导出JSON', save: '保存', publish: '发文' },
  site: { map: '地图选址', locate: '定位到我', toPreset: '去选方案', footfall: '估人流' },
  show: {
    compass: '指北',
    nineGrid: '九宫线',
    furniture: '家具',
    labels: '房间名',
    areas: '面积',
  },
  loading3d: '加载三维场景…',
  disclaimer: '结构教学示意 · 非吉凶断事',
};

const ZH_HANT: Dict = {
  ...ZH_CN,
  productName: '空間場',
  tagline: '方案 · 地圖 · 方位 · 平面疊圖',
  tabs: { preset: '方案', site: '地圖選址', controls: '控制' },
  views: { plan: '平面', iso: '等距', three: '3D' },
  overlays: {
    none: '無疊圖',
    bagua8: '八方位',
    radial24: '二十四山',
    bagua9: '九宮格',
    sector: '扇區',
    flyingStar: '九星扇區',
  },
  layers: {
    energy: '能量',
    wind: '風速',
    light: '採光',
    nineStar: '九星',
    qimen: '奇門',
  },
  compass: {
    title: '虛擬羅盤',
    north: '北',
    drag: '拖動指針或點方位，旋轉整圖',
    snap: '八方吸附',
    rotate: '圖面旋轉',
    entrance: '主入口',
  },
  plan: {
    living: '客廳',
    bedroom: '臥室',
    bath: '衛浴',
    kitchen: '廚房',
    balcony: '陽台',
    corridor: '過道',
    storage: '儲物',
    entrance: '入口',
    overlayHint: '疊圖為結構示意，非吉凶斷事',
    paperOn: '紙質底',
    paperOff: '深色底',
  },
  pro: { copy: '複製簡報', exportJson: '匯出JSON', save: '儲存', publish: '發文' },
  site: { map: '地圖選址', locate: '定位到我', toPreset: '去選方案', footfall: '估人流' },
  show: {
    compass: '指北',
    nineGrid: '九宮線',
    furniture: '家具',
    labels: '房間名',
    areas: '面積',
  },
  loading3d: '載入三維場景…',
  disclaimer: '結構教學示意 · 非吉凶斷事',
};

const EN: Dict = {
  productName: 'Space Field',
  tagline: 'Layout · Map · Orientation · Plan overlays',
  tabs: { preset: 'Layouts', site: 'Map', controls: 'Controls' },
  views: { plan: 'Plan', iso: 'Iso', three: '3D' },
  overlays: {
    none: 'None',
    bagua8: '8 Directions',
    radial24: '24 Mountains',
    bagua9: '9 Palaces',
    sector: 'Sectors',
    flyingStar: 'Nine Stars',
  },
  layers: {
    energy: 'Energy',
    wind: 'Wind',
    light: 'Light',
    nineStar: 'Stars',
    qimen: 'Qimen',
  },
  compass: {
    title: 'Virtual compass',
    north: 'N',
    drag: 'Drag needle or tap a direction to rotate the plan',
    snap: 'Snap 8-way',
    rotate: 'Plan rotation',
    entrance: 'Entrance',
  },
  plan: {
    living: 'Living',
    bedroom: 'Bedroom',
    bath: 'Bath',
    kitchen: 'Kitchen',
    balcony: 'Balcony',
    corridor: 'Hall',
    storage: 'Storage',
    entrance: 'Entry',
    overlayHint: 'Structural overlay for teaching — not fortune-telling',
    paperOn: 'Paper plan',
    paperOff: 'Dark plan',
  },
  pro: { copy: 'Copy brief', exportJson: 'Export JSON', save: 'Save', publish: 'Publish' },
  site: { map: 'Map site', locate: 'Locate me', toPreset: 'Layouts', footfall: 'Footfall' },
  show: {
    compass: 'Compass',
    nineGrid: 'Grid',
    furniture: 'Furniture',
    labels: 'Labels',
    areas: 'Areas',
  },
  loading3d: 'Loading 3D…',
  disclaimer: 'Structural teaching view · not fate judgment',
};

export type SpaceLabCopy = Dict;

export function spaceLabCopy(locale: SiteLocale | string | undefined): SpaceLabCopy {
  const l = `${locale || 'zh-CN'}`.toLowerCase();
  if (l.startsWith('en')) return EN;
  if (l.includes('hant') || l === 'zh-tw' || l === 'zh-hk') return ZH_HANT;
  return ZH_CN;
}

/** Overlay labels by locale */
export function overlayLabel(mode: string, locale?: string): string {
  const c = spaceLabCopy(locale);
  return c.overlays[mode] || mode;
}
