/**
 * 业态域 → 3D 模型套件元数据与默认体量
 * 几何在 React Three Fiber 中程序化生成（无外部 GLB 依赖）
 */

import type { SpaceActiveDomain } from './types';

export const DOMAIN_MODEL_META: Record<
  SpaceActiveDomain,
  {
    label: string;
    modelName: string;
    blurb: string;
    /** 默认室内/地块体量 m */
    defaultRoom: { widthM: number; depthM: number; heightM: number };
    groundColor: string;
    accentColor: string;
    fogFar: number;
    particleCount: number;
  }
> = {
  residential: {
    label: '阳宅',
    modelName: '单元住宅 · 阳台体块',
    blurb: '标准户型壳体 + 阳台板',
    defaultRoom: { widthM: 9, depthM: 7, heightM: 2.8 },
    groundColor: '#cfc8ba',
    accentColor: '#94a3b8',
    fogFar: 26,
    particleCount: 360,
  },
  villa: {
    label: '别墅',
    modelName: '独栋别墅 · 坡顶庭院',
    blurb: '双层主屋 + 坡屋顶 + 前院',
    defaultRoom: { widthM: 14, depthM: 11, heightM: 3.2 },
    groundColor: '#9caf88',
    accentColor: '#b45309',
    fogFar: 36,
    particleCount: 420,
  },
  rural: {
    label: '农村宅基地',
    modelName: '合院宅基 · 厢房围合',
    blurb: '正房 + 厢房 + 院落围墙',
    defaultRoom: { widthM: 16, depthM: 14, heightM: 3.0 },
    groundColor: '#c4b59a',
    accentColor: '#78716c',
    fogFar: 40,
    particleCount: 300,
  },
  apartment: {
    label: '公寓楼',
    modelName: '板式高层 · 叠层示意',
    blurb: '多层板楼体量 + 标准层',
    defaultRoom: { widthM: 12, depthM: 9, heightM: 2.7 },
    groundColor: '#a8a29e',
    accentColor: '#64748b',
    fogFar: 48,
    particleCount: 500,
  },
  office: {
    label: '办公楼',
    modelName: '塔楼幕墙 · 裙房',
    blurb: '玻璃塔楼 + 底层裙房',
    defaultRoom: { widthM: 18, depthM: 14, heightM: 3.6 },
    groundColor: '#94a3b8',
    accentColor: '#38bdf8',
    fogFar: 55,
    particleCount: 520,
  },
  shop: {
    label: '商铺',
    modelName: '临街铺面 · 橱窗雨棚',
    blurb: '玻璃门头 + 雨棚 + 后仓',
    defaultRoom: { widthM: 7, depthM: 12, heightM: 3.4 },
    groundColor: '#d6d3d1',
    accentColor: '#f59e0b',
    fogFar: 28,
    particleCount: 280,
  },
  tomb: {
    label: '阴宅',
    modelName: '穴位台基 · 碑石神道',
    blurb: '台基 + 碑 + 丘封示意',
    defaultRoom: { widthM: 6, depthM: 8, heightM: 1.4 },
    groundColor: '#6b7280',
    accentColor: '#a8a29e',
    fogFar: 32,
    particleCount: 180,
  },
};

export function isSpaceActiveDomain(v: unknown): v is SpaceActiveDomain {
  return (
    v === 'residential' ||
    v === 'shop' ||
    v === 'tomb' ||
    v === 'villa' ||
    v === 'rural' ||
    v === 'office' ||
    v === 'apartment'
  );
}
