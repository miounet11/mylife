/**
 * 空间场 · 预设方案库
 * 覆盖住宅主流户型、商铺常见面宽/进深、墓穴常见穴位形态（约 95% 常见场景）。
 * 输出可直接 patch 进 SpaceLabState 的几何与风口。
 */

import type { SpaceLabState, SpaceLight, SpaceRoom, SpaceStructure, SpaceVent } from './types';

export type LayoutDomain = 'residential' | 'shop' | 'tomb';

export type LayoutPreset = {
  id: string;
  domain: LayoutDomain;
  title: string;
  /** e.g. 两室一厅 / 临街窄铺 / 双穴并排 */
  layout: string;
  /** 典型建筑面积 m² */
  areaSqm: number;
  areaMin: number;
  areaMax: number;
  tags: string[];
  blurb: string;
  popularity: number;
  room: SpaceRoom;
  vents: Omit<SpaceVent, 'id'>[];
  lights: Omit<SpaceLight, 'id'>[];
  structures: Omit<SpaceStructure, 'id'>[];
};

function vent(
  partial: Omit<SpaceVent, 'id' | 'enabled'> & { enabled?: boolean },
): Omit<SpaceVent, 'id'> {
  return { enabled: true, ...partial };
}

function light(
  partial: Omit<SpaceLight, 'id' | 'enabled' | 'followSun'> & {
    enabled?: boolean;
    followSun?: boolean;
  },
): Omit<SpaceLight, 'id'> {
  const { enabled = true, followSun = true, ...rest } = partial;
  return { ...rest, enabled, followSun };
}

function structure(
  partial: Omit<SpaceStructure, 'id'>,
): Omit<SpaceStructure, 'id'> {
  return partial;
}

function room(
  widthM: number,
  depthM: number,
  entranceFacing: string,
  heightM = 2.8,
): SpaceRoom {
  return { widthM, depthM, heightM, entranceFacing, planRotationDeg: 0 };
}

/** 由面积与面宽比估算进深 */
export function dimensionsFromArea(areaSqm: number, aspect = 1.15): { widthM: number; depthM: number } {
  const a = Math.max(12, Math.min(400, areaSqm));
  const widthM = Math.sqrt(a / aspect);
  const depthM = a / widthM;
  return {
    widthM: Math.round(widthM * 10) / 10,
    depthM: Math.round(depthM * 10) / 10,
  };
}

const RESIDENTIAL: LayoutPreset[] = [
  {
    id: 'res-studio-35',
    domain: 'residential',
    title: '开间 / 一室',
    layout: '一室',
    areaSqm: 35,
    areaMin: 25,
    areaMax: 45,
    tags: ['小户型', '刚需', '开间'],
    blurb: '单间功能区 + 厨卫靠内，适合租住与过渡。',
    popularity: 92,
    room: room(5.2, 6.8, '南'),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.92, azimuthDeg: 90, spreadDeg: 100, speed: 40, intensity: 2.2, halfLifeSec: 12 }),
      vent({ kind: 'outlet', x: 0.55, y: 0.1, azimuthDeg: 270, spreadDeg: 80, speed: 32, intensity: 1.6, halfLifeSec: 10 }),
    ],
    lights: [light({ x: 0.5, y: 0.88, azimuthDeg: 90, intensity: 1.15, label: '南窗采光', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.08, y: 0.55, w: 0.22, h: 0.28, block: 0.55 }),
      structure({ kind: 'box', x: 0.72, y: 0.12, w: 0.2, h: 0.18, block: 0.45 }),
    ],
  },
  {
    id: 'res-1b1l-55',
    domain: 'residential',
    title: '一室一厅',
    layout: '一室一厅',
    areaSqm: 55,
    areaMin: 45,
    areaMax: 70,
    tags: ['刚需', '南北'],
    blurb: '客卧分离，厅南卧北或厅南厨卫侧置。',
    popularity: 96,
    room: room(6.5, 8.5, '南'),
    vents: [
      vent({ kind: 'inlet', x: 0.48, y: 0.93, azimuthDeg: 90, spreadDeg: 96, speed: 42, intensity: 2.4, halfLifeSec: 14 }),
      vent({ kind: 'outlet', x: 0.5, y: 0.08, azimuthDeg: 270, spreadDeg: 75, speed: 34, intensity: 1.7, halfLifeSec: 11 }),
      vent({ kind: 'outlet', x: 0.12, y: 0.4, azimuthDeg: 0, spreadDeg: 65, speed: 26, intensity: 1.3, halfLifeSec: 10 }),
    ],
    lights: [light({ x: 0.5, y: 0.9, azimuthDeg: 90, intensity: 1.2, label: '客厅南窗', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.08, y: 0.55, w: 0.28, h: 0.32, block: 0.5 }),
      structure({ kind: 'box', x: 0.68, y: 0.12, w: 0.24, h: 0.22, block: 0.48 }),
      structure({ kind: 'column', x: 0.45, y: 0.42, w: 0.06, h: 0.06, block: 0.35 }),
    ],
  },
  {
    id: 'res-2b1l-75',
    domain: 'residential',
    title: '两室一厅',
    layout: '两室一厅',
    areaSqm: 75,
    areaMin: 65,
    areaMax: 90,
    tags: ['刚需', '改善', '主流'],
    blurb: '主流刚需：南厅 + 主卧南/次卧北，厨卫集中。',
    popularity: 99,
    room: room(7.8, 9.6, '南'),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.94, azimuthDeg: 90, spreadDeg: 100, speed: 44, intensity: 2.5, halfLifeSec: 14 }),
      vent({ kind: 'outlet', x: 0.72, y: 0.1, azimuthDeg: 270, spreadDeg: 70, speed: 33, intensity: 1.7, halfLifeSec: 11 }),
      vent({ kind: 'outlet', x: 0.18, y: 0.12, azimuthDeg: 270, spreadDeg: 70, speed: 30, intensity: 1.5, halfLifeSec: 11 }),
      vent({ kind: 'outlet', x: 0.08, y: 0.5, azimuthDeg: 0, spreadDeg: 60, speed: 24, intensity: 1.2, halfLifeSec: 9 }),
    ],
    lights: [
      light({ x: 0.5, y: 0.9, azimuthDeg: 90, intensity: 1.25, label: '客厅采光', followSun: true }),
      light({ x: 0.78, y: 0.18, azimuthDeg: 90, intensity: 0.9, label: '主卧窗', followSun: true }),
    ],
    structures: [
      structure({ kind: 'box', x: 0.05, y: 0.55, w: 0.3, h: 0.35, block: 0.52 }),
      structure({ kind: 'box', x: 0.62, y: 0.08, w: 0.3, h: 0.28, block: 0.5 }),
      structure({ kind: 'box', x: 0.08, y: 0.08, w: 0.26, h: 0.26, block: 0.48 }),
      structure({ kind: 'box', x: 0.72, y: 0.55, w: 0.2, h: 0.22, block: 0.42 }),
    ],
  },
  {
    id: 'res-2b2l-90',
    domain: 'residential',
    title: '两室两厅',
    layout: '两室两厅',
    areaSqm: 90,
    areaMin: 80,
    areaMax: 105,
    tags: ['改善', '客餐分离'],
    blurb: '客厅餐厅分离，动线更清晰，适合小家庭。',
    popularity: 94,
    room: room(8.5, 10.6, '南'),
    vents: [
      vent({ kind: 'inlet', x: 0.52, y: 0.94, azimuthDeg: 90, spreadDeg: 100, speed: 45, intensity: 2.5, halfLifeSec: 14 }),
      vent({ kind: 'outlet', x: 0.75, y: 0.08, azimuthDeg: 270, spreadDeg: 72, speed: 34, intensity: 1.7, halfLifeSec: 11 }),
      vent({ kind: 'outlet', x: 0.2, y: 0.1, azimuthDeg: 270, spreadDeg: 70, speed: 32, intensity: 1.5, halfLifeSec: 11 }),
      vent({ kind: 'outlet', x: 0.1, y: 0.55, azimuthDeg: 0, spreadDeg: 60, speed: 25, intensity: 1.2, halfLifeSec: 9 }),
    ],
    lights: [light({ x: 0.52, y: 0.9, azimuthDeg: 90, intensity: 1.3, label: '客厅南窗', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.06, y: 0.5, w: 0.28, h: 0.28, block: 0.5 }),
      structure({ kind: 'box', x: 0.38, y: 0.55, w: 0.22, h: 0.22, block: 0.4 }),
      structure({ kind: 'box', x: 0.65, y: 0.08, w: 0.28, h: 0.3, block: 0.5 }),
      structure({ kind: 'box', x: 0.08, y: 0.08, w: 0.26, h: 0.28, block: 0.48 }),
    ],
  },
  {
    id: 'res-3b1l-100',
    domain: 'residential',
    title: '三室一厅',
    layout: '三室一厅',
    areaSqm: 100,
    areaMin: 90,
    areaMax: 115,
    tags: ['改善', '刚需'],
    blurb: '三房集中卫生间，厅大房适中。',
    popularity: 97,
    room: room(9.0, 11.2, '南'),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.94, azimuthDeg: 90, spreadDeg: 105, speed: 46, intensity: 2.6, halfLifeSec: 15 }),
      vent({ kind: 'outlet', x: 0.8, y: 0.08, azimuthDeg: 270, spreadDeg: 70, speed: 34, intensity: 1.7, halfLifeSec: 11 }),
      vent({ kind: 'outlet', x: 0.5, y: 0.08, azimuthDeg: 270, spreadDeg: 65, speed: 30, intensity: 1.4, halfLifeSec: 10 }),
      vent({ kind: 'outlet', x: 0.18, y: 0.1, azimuthDeg: 270, spreadDeg: 70, speed: 32, intensity: 1.5, halfLifeSec: 11 }),
    ],
    lights: [light({ x: 0.5, y: 0.9, azimuthDeg: 90, intensity: 1.3, label: '客厅', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.05, y: 0.52, w: 0.28, h: 0.32, block: 0.5 }),
      structure({ kind: 'box', x: 0.65, y: 0.06, w: 0.28, h: 0.28, block: 0.5 }),
      structure({ kind: 'box', x: 0.35, y: 0.06, w: 0.24, h: 0.24, block: 0.45 }),
      structure({ kind: 'box', x: 0.06, y: 0.06, w: 0.24, h: 0.26, block: 0.48 }),
      structure({ kind: 'box', x: 0.72, y: 0.55, w: 0.2, h: 0.2, block: 0.4 }),
    ],
  },
  {
    id: 'res-3b2l-120',
    domain: 'residential',
    title: '三室两厅',
    layout: '三室两厅',
    areaSqm: 120,
    areaMin: 105,
    areaMax: 140,
    tags: ['改善', '主流', '南北通透'],
    blurb: '客餐分离 + 三卧，覆盖大量改善盘。',
    popularity: 98,
    room: room(9.6, 12.5, '南'),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.94, azimuthDeg: 90, spreadDeg: 105, speed: 48, intensity: 2.6, halfLifeSec: 15 }),
      vent({ kind: 'outlet', x: 0.82, y: 0.08, azimuthDeg: 270, spreadDeg: 72, speed: 35, intensity: 1.8, halfLifeSec: 12 }),
      vent({ kind: 'outlet', x: 0.5, y: 0.08, azimuthDeg: 270, spreadDeg: 68, speed: 32, intensity: 1.5, halfLifeSec: 11 }),
      vent({ kind: 'outlet', x: 0.18, y: 0.1, azimuthDeg: 270, spreadDeg: 70, speed: 32, intensity: 1.5, halfLifeSec: 11 }),
      vent({ kind: 'outlet', x: 0.08, y: 0.48, azimuthDeg: 0, spreadDeg: 55, speed: 24, intensity: 1.2, halfLifeSec: 9 }),
    ],
    lights: [
      light({ x: 0.5, y: 0.9, azimuthDeg: 90, intensity: 1.35, label: '客厅', followSun: true }),
      light({ x: 0.8, y: 0.15, azimuthDeg: 90, intensity: 0.95, label: '主卧', followSun: true }),
    ],
    structures: [
      structure({ kind: 'box', x: 0.05, y: 0.48, w: 0.3, h: 0.28, block: 0.48 }),
      structure({ kind: 'box', x: 0.38, y: 0.52, w: 0.22, h: 0.22, block: 0.38 }),
      structure({ kind: 'box', x: 0.65, y: 0.05, w: 0.28, h: 0.3, block: 0.5 }),
      structure({ kind: 'box', x: 0.35, y: 0.05, w: 0.24, h: 0.26, block: 0.46 }),
      structure({ kind: 'box', x: 0.05, y: 0.05, w: 0.24, h: 0.26, block: 0.46 }),
    ],
  },
  {
    id: 'res-4b2l-140',
    domain: 'residential',
    title: '四室两厅',
    layout: '四室两厅',
    areaSqm: 140,
    areaMin: 125,
    areaMax: 170,
    tags: ['改善', '多代'],
    blurb: '四房两厅，双卫或主卧套卫常见。',
    popularity: 90,
    room: room(10.5, 13.4, '南'),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.94, azimuthDeg: 90, spreadDeg: 110, speed: 50, intensity: 2.7, halfLifeSec: 15 }),
      vent({ kind: 'outlet', x: 0.85, y: 0.08, azimuthDeg: 270, spreadDeg: 70, speed: 36, intensity: 1.8, halfLifeSec: 12 }),
      vent({ kind: 'outlet', x: 0.55, y: 0.08, azimuthDeg: 270, spreadDeg: 65, speed: 32, intensity: 1.5, halfLifeSec: 11 }),
      vent({ kind: 'outlet', x: 0.25, y: 0.08, azimuthDeg: 270, spreadDeg: 65, speed: 30, intensity: 1.4, halfLifeSec: 10 }),
      vent({ kind: 'outlet', x: 0.08, y: 0.35, azimuthDeg: 0, spreadDeg: 55, speed: 24, intensity: 1.2, halfLifeSec: 9 }),
    ],
    lights: [light({ x: 0.5, y: 0.9, azimuthDeg: 90, intensity: 1.4, label: '客厅', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.04, y: 0.45, w: 0.28, h: 0.3, block: 0.48 }),
      structure({ kind: 'box', x: 0.7, y: 0.04, w: 0.26, h: 0.28, block: 0.5 }),
      structure({ kind: 'box', x: 0.4, y: 0.04, w: 0.24, h: 0.26, block: 0.46 }),
      structure({ kind: 'box', x: 0.1, y: 0.04, w: 0.24, h: 0.26, block: 0.46 }),
      structure({ kind: 'box', x: 0.72, y: 0.5, w: 0.22, h: 0.24, block: 0.42 }),
    ],
  },
  {
    id: 'res-duplex-160',
    domain: 'residential',
    title: '复式 / 跃层（标准层示意）',
    layout: '复式',
    areaSqm: 160,
    areaMin: 140,
    areaMax: 220,
    tags: ['改善', '复式'],
    blurb: '以一层公共区 + 楼梯核示意；上层卧室可另开层分析。',
    popularity: 78,
    room: room(10, 12, '南', 3.0),
    vents: [
      vent({ kind: 'inlet', x: 0.48, y: 0.93, azimuthDeg: 90, spreadDeg: 100, speed: 46, intensity: 2.5, halfLifeSec: 14 }),
      vent({ kind: 'outlet', x: 0.75, y: 0.1, azimuthDeg: 270, spreadDeg: 70, speed: 34, intensity: 1.7, halfLifeSec: 11 }),
      vent({ kind: 'outlet', x: 0.2, y: 0.12, azimuthDeg: 270, spreadDeg: 70, speed: 32, intensity: 1.5, halfLifeSec: 11 }),
    ],
    lights: [light({ x: 0.5, y: 0.9, azimuthDeg: 90, intensity: 1.3, label: '一层南窗', followSun: true })],
    structures: [
      structure({ kind: 'column', x: 0.48, y: 0.42, w: 0.12, h: 0.18, block: 0.7 }),
      structure({ kind: 'box', x: 0.08, y: 0.55, w: 0.28, h: 0.28, block: 0.48 }),
      structure({ kind: 'box', x: 0.65, y: 0.1, w: 0.28, h: 0.28, block: 0.5 }),
    ],
  },
  {
    id: 'res-east-west-85',
    domain: 'residential',
    title: '东西向两室',
    layout: '两室一厅',
    areaSqm: 85,
    areaMin: 70,
    areaMax: 100,
    tags: ['东西向', '刚需'],
    blurb: '入口东或西，侧向采光为主，注意西晒。',
    popularity: 82,
    room: room(7.2, 11.8, '东'),
    vents: [
      vent({ kind: 'inlet', x: 0.08, y: 0.5, azimuthDeg: 0, spreadDeg: 95, speed: 42, intensity: 2.3, halfLifeSec: 13 }),
      vent({ kind: 'outlet', x: 0.92, y: 0.5, azimuthDeg: 180, spreadDeg: 90, speed: 38, intensity: 1.9, halfLifeSec: 12 }),
      vent({ kind: 'outlet', x: 0.5, y: 0.1, azimuthDeg: 270, spreadDeg: 60, speed: 26, intensity: 1.3, halfLifeSec: 10 }),
    ],
    lights: [light({ x: 0.12, y: 0.5, azimuthDeg: 0, intensity: 1.1, label: '东窗', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.25, y: 0.08, w: 0.28, h: 0.3, block: 0.5 }),
      structure({ kind: 'box', x: 0.55, y: 0.55, w: 0.28, h: 0.3, block: 0.48 }),
    ],
  },
  {
    id: 'res-north-entry-95',
    domain: 'residential',
    title: '北入户三室',
    layout: '三室两厅',
    areaSqm: 95,
    areaMin: 85,
    areaMax: 115,
    tags: ['北入户'],
    blurb: '北门入户、南向采光卧室/客厅，国内常见塔楼。',
    popularity: 88,
    room: room(8.8, 10.8, '北'),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.08, azimuthDeg: 270, spreadDeg: 100, speed: 42, intensity: 2.3, halfLifeSec: 13 }),
      vent({ kind: 'outlet', x: 0.5, y: 0.92, azimuthDeg: 90, spreadDeg: 95, speed: 40, intensity: 2.0, halfLifeSec: 12 }),
      vent({ kind: 'outlet', x: 0.12, y: 0.55, azimuthDeg: 0, spreadDeg: 60, speed: 26, intensity: 1.3, halfLifeSec: 10 }),
    ],
    lights: [light({ x: 0.5, y: 0.9, azimuthDeg: 90, intensity: 1.35, label: '南向采光', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.08, y: 0.2, w: 0.25, h: 0.25, block: 0.48 }),
      structure({ kind: 'box', x: 0.65, y: 0.55, w: 0.28, h: 0.3, block: 0.5 }),
      structure({ kind: 'box', x: 0.1, y: 0.55, w: 0.26, h: 0.28, block: 0.48 }),
    ],
  },
];

const SHOP: LayoutPreset[] = [
  {
    id: 'shop-narrow-40',
    domain: 'shop',
    title: '临街窄铺',
    layout: '窄面宽深铺',
    areaSqm: 40,
    areaMin: 25,
    areaMax: 55,
    tags: ['临街', '零售', '餐饮'],
    blurb: '面宽 3.5–5m、进深大，门头进风 + 后厨/后仓出风。',
    popularity: 97,
    room: room(4.5, 9.0, '南', 3.2),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.94, azimuthDeg: 90, spreadDeg: 110, speed: 48, intensity: 2.8, halfLifeSec: 12 }),
      vent({ kind: 'outlet', x: 0.5, y: 0.08, azimuthDeg: 270, spreadDeg: 80, speed: 40, intensity: 2.0, halfLifeSec: 10 }),
    ],
    lights: [light({ x: 0.5, y: 0.92, azimuthDeg: 90, intensity: 1.5, label: '门头橱窗', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.15, y: 0.35, w: 0.2, h: 0.45, block: 0.4 }),
      structure({ kind: 'box', x: 0.65, y: 0.35, w: 0.2, h: 0.45, block: 0.4 }),
      structure({ kind: 'box', x: 0.25, y: 0.08, w: 0.5, h: 0.18, block: 0.55 }),
    ],
  },
  {
    id: 'shop-square-60',
    domain: 'shop',
    title: '方正铺',
    layout: '方铺',
    areaSqm: 60,
    areaMin: 45,
    areaMax: 80,
    tags: ['零售', '服务'],
    blurb: '面宽进深接近，中岛货架 + 后仓。',
    popularity: 94,
    room: room(7.5, 8.0, '南', 3.3),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.94, azimuthDeg: 90, spreadDeg: 105, speed: 46, intensity: 2.6, halfLifeSec: 13 }),
      vent({ kind: 'outlet', x: 0.85, y: 0.15, azimuthDeg: 200, spreadDeg: 70, speed: 34, intensity: 1.7, halfLifeSec: 11 }),
      vent({ kind: 'outlet', x: 0.15, y: 0.15, azimuthDeg: 340, spreadDeg: 70, speed: 34, intensity: 1.7, halfLifeSec: 11 }),
    ],
    lights: [light({ x: 0.5, y: 0.9, azimuthDeg: 90, intensity: 1.4, label: '门面', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.35, y: 0.35, w: 0.3, h: 0.3, block: 0.35 }),
      structure({ kind: 'box', x: 0.1, y: 0.55, w: 0.18, h: 0.3, block: 0.4 }),
      structure({ kind: 'box', x: 0.72, y: 0.55, w: 0.18, h: 0.3, block: 0.4 }),
    ],
  },
  {
    id: 'shop-corner-80',
    domain: 'shop',
    title: '角铺 / 双开面',
    layout: '角铺',
    areaSqm: 80,
    areaMin: 60,
    areaMax: 110,
    tags: ['角铺', '高曝光'],
    blurb: '两面沿街，双入口或一门一橱窗。',
    popularity: 91,
    room: room(9.0, 9.0, '南', 3.5),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.94, azimuthDeg: 90, spreadDeg: 100, speed: 48, intensity: 2.7, halfLifeSec: 13 }),
      vent({ kind: 'inlet', x: 0.94, y: 0.5, azimuthDeg: 180, spreadDeg: 95, speed: 44, intensity: 2.4, halfLifeSec: 12 }),
      vent({ kind: 'outlet', x: 0.15, y: 0.15, azimuthDeg: 315, spreadDeg: 75, speed: 36, intensity: 1.8, halfLifeSec: 11 }),
    ],
    lights: [
      light({ x: 0.5, y: 0.9, azimuthDeg: 90, intensity: 1.4, label: '南面', followSun: true }),
      light({ x: 0.9, y: 0.5, azimuthDeg: 180, intensity: 1.2, label: '东/西侧', followSun: true }),
    ],
    structures: [
      structure({ kind: 'box', x: 0.3, y: 0.3, w: 0.35, h: 0.35, block: 0.35 }),
      structure({ kind: 'box', x: 0.1, y: 0.1, w: 0.2, h: 0.2, block: 0.5 }),
    ],
  },
  {
    id: 'shop-restaurant-100',
    domain: 'shop',
    title: '餐饮前厅后厨',
    layout: '餐饮铺',
    areaSqm: 100,
    areaMin: 70,
    areaMax: 150,
    tags: ['餐饮', '后厨'],
    blurb: '前厅就餐、后厨排烟为主出风，注意油烟通道。',
    popularity: 93,
    room: room(8.5, 12.0, '南', 3.4),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.94, azimuthDeg: 90, spreadDeg: 105, speed: 46, intensity: 2.5, halfLifeSec: 12 }),
      vent({ kind: 'outlet', x: 0.5, y: 0.08, azimuthDeg: 270, spreadDeg: 90, speed: 52, intensity: 2.8, halfLifeSec: 8 }),
      vent({ kind: 'outlet', x: 0.12, y: 0.25, azimuthDeg: 0, spreadDeg: 55, speed: 28, intensity: 1.4, halfLifeSec: 9 }),
    ],
    lights: [light({ x: 0.5, y: 0.88, azimuthDeg: 90, intensity: 1.35, label: '门厅', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.15, y: 0.45, w: 0.7, h: 0.25, block: 0.3 }),
      structure({ kind: 'box', x: 0.15, y: 0.05, w: 0.7, h: 0.28, block: 0.6 }),
    ],
  },
  {
    id: 'shop-mall-kiosk-25',
    domain: 'shop',
    title: '商场中岛 / 档口',
    layout: '中岛档口',
    areaSqm: 25,
    areaMin: 12,
    areaMax: 40,
    tags: ['商场', '档口'],
    blurb: '四面可通或三面围合，气流受公区主导。',
    popularity: 86,
    room: room(5.0, 5.0, '南', 3.0),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.92, azimuthDeg: 90, spreadDeg: 120, speed: 40, intensity: 2.2, halfLifeSec: 10 }),
      vent({ kind: 'inlet', x: 0.08, y: 0.5, azimuthDeg: 0, spreadDeg: 100, speed: 36, intensity: 2.0, halfLifeSec: 10 }),
      vent({ kind: 'outlet', x: 0.92, y: 0.5, azimuthDeg: 180, spreadDeg: 100, speed: 36, intensity: 2.0, halfLifeSec: 10 }),
    ],
    lights: [light({ x: 0.5, y: 0.5, azimuthDeg: 90, intensity: 1.1, label: '公区顶光', followSun: false })],
    structures: [structure({ kind: 'box', x: 0.3, y: 0.3, w: 0.4, h: 0.4, block: 0.45 })],
  },
  {
    id: 'shop-double-bay-120',
    domain: 'shop',
    title: '双开间旗舰',
    layout: '双开间',
    areaSqm: 120,
    areaMin: 90,
    areaMax: 180,
    tags: ['旗舰', '零售'],
    blurb: '双门头或一门一橱，进深适中。',
    popularity: 84,
    room: room(12.0, 10.0, '南', 3.6),
    vents: [
      vent({ kind: 'inlet', x: 0.35, y: 0.94, azimuthDeg: 90, spreadDeg: 95, speed: 46, intensity: 2.5, halfLifeSec: 13 }),
      vent({ kind: 'inlet', x: 0.7, y: 0.94, azimuthDeg: 90, spreadDeg: 95, speed: 46, intensity: 2.5, halfLifeSec: 13 }),
      vent({ kind: 'outlet', x: 0.5, y: 0.08, azimuthDeg: 270, spreadDeg: 85, speed: 40, intensity: 2.0, halfLifeSec: 11 }),
    ],
    lights: [light({ x: 0.5, y: 0.9, azimuthDeg: 90, intensity: 1.5, label: '双开间门头', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.15, y: 0.35, w: 0.25, h: 0.4, block: 0.35 }),
      structure({ kind: 'box', x: 0.6, y: 0.35, w: 0.25, h: 0.4, block: 0.35 }),
      structure({ kind: 'box', x: 0.35, y: 0.08, w: 0.3, h: 0.18, block: 0.5 }),
    ],
  },
];

const TOMB: LayoutPreset[] = [
  {
    id: 'tomb-single-std',
    domain: 'tomb',
    title: '单穴标准',
    layout: '单穴',
    areaSqm: 2.5,
    areaMin: 1.5,
    areaMax: 4,
    tags: ['墓园', '标准'],
    blurb: '单体穴位，碑前供台，顺山朝向示意。',
    popularity: 96,
    room: room(1.8, 2.4, '南', 1.2),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.88, azimuthDeg: 90, spreadDeg: 80, speed: 28, intensity: 1.6, halfLifeSec: 16 }),
      vent({ kind: 'outlet', x: 0.5, y: 0.15, azimuthDeg: 270, spreadDeg: 70, speed: 24, intensity: 1.3, halfLifeSec: 14 }),
    ],
    lights: [light({ x: 0.5, y: 0.85, azimuthDeg: 90, intensity: 1.0, label: '前向开敞', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.3, y: 0.35, w: 0.4, h: 0.35, block: 0.65 }),
      structure({ kind: 'box', x: 0.35, y: 0.72, w: 0.3, h: 0.12, block: 0.35 }),
    ],
  },
  {
    id: 'tomb-double-side',
    domain: 'tomb',
    title: '双穴并排',
    layout: '双穴并排',
    areaSqm: 5,
    areaMin: 3.5,
    areaMax: 8,
    tags: ['合葬', '夫妻穴'],
    blurb: '并排双穴 + 共用祭台，侧向余步。',
    popularity: 94,
    room: room(3.2, 2.6, '南', 1.2),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.9, azimuthDeg: 90, spreadDeg: 90, speed: 30, intensity: 1.7, halfLifeSec: 16 }),
      vent({ kind: 'outlet', x: 0.2, y: 0.15, azimuthDeg: 270, spreadDeg: 60, speed: 22, intensity: 1.2, halfLifeSec: 14 }),
      vent({ kind: 'outlet', x: 0.8, y: 0.15, azimuthDeg: 270, spreadDeg: 60, speed: 22, intensity: 1.2, halfLifeSec: 14 }),
    ],
    lights: [light({ x: 0.5, y: 0.88, azimuthDeg: 90, intensity: 1.05, label: '前向', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.12, y: 0.32, w: 0.32, h: 0.36, block: 0.65 }),
      structure({ kind: 'box', x: 0.56, y: 0.32, w: 0.32, h: 0.36, block: 0.65 }),
      structure({ kind: 'box', x: 0.3, y: 0.75, w: 0.4, h: 0.12, block: 0.35 }),
    ],
  },
  {
    id: 'tomb-family-3',
    domain: 'tomb',
    title: '家族三穴',
    layout: '家族三穴',
    areaSqm: 9,
    areaMin: 7,
    areaMax: 15,
    tags: ['家族', '合葬'],
    blurb: '一排三穴或品字，前广场供祭。',
    popularity: 80,
    room: room(4.5, 3.2, '南', 1.3),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.9, azimuthDeg: 90, spreadDeg: 95, speed: 32, intensity: 1.8, halfLifeSec: 16 }),
      vent({ kind: 'outlet', x: 0.15, y: 0.15, azimuthDeg: 270, spreadDeg: 55, speed: 22, intensity: 1.2, halfLifeSec: 14 }),
      vent({ kind: 'outlet', x: 0.5, y: 0.12, azimuthDeg: 270, spreadDeg: 55, speed: 22, intensity: 1.2, halfLifeSec: 14 }),
      vent({ kind: 'outlet', x: 0.85, y: 0.15, azimuthDeg: 270, spreadDeg: 55, speed: 22, intensity: 1.2, halfLifeSec: 14 }),
    ],
    lights: [light({ x: 0.5, y: 0.88, azimuthDeg: 90, intensity: 1.1, label: '祭台前', followSun: true })],
    structures: [
      structure({ kind: 'box', x: 0.08, y: 0.28, w: 0.24, h: 0.35, block: 0.65 }),
      structure({ kind: 'box', x: 0.38, y: 0.28, w: 0.24, h: 0.35, block: 0.65 }),
      structure({ kind: 'box', x: 0.68, y: 0.28, w: 0.24, h: 0.35, block: 0.65 }),
      structure({ kind: 'box', x: 0.25, y: 0.72, w: 0.5, h: 0.14, block: 0.35 }),
    ],
  },
  {
    id: 'tomb-wall-niche',
    domain: 'tomb',
    title: '壁葬 / 格位',
    layout: '壁葬格',
    areaSqm: 0.6,
    areaMin: 0.3,
    areaMax: 1.2,
    tags: ['壁葬', '骨灰格'],
    blurb: '墙格单元，前走廊通道主导气流。',
    popularity: 85,
    room: room(1.2, 0.8, '南', 2.4),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.9, azimuthDeg: 90, spreadDeg: 100, speed: 26, intensity: 1.4, halfLifeSec: 12 }),
      vent({ kind: 'outlet', x: 0.5, y: 0.1, azimuthDeg: 270, spreadDeg: 80, speed: 24, intensity: 1.3, halfLifeSec: 12 }),
    ],
    lights: [light({ x: 0.5, y: 0.7, azimuthDeg: 90, intensity: 0.9, label: '廊道光', followSun: false })],
    structures: [structure({ kind: 'box', x: 0.15, y: 0.2, w: 0.7, h: 0.55, block: 0.75 })],
  },
  {
    id: 'tomb-pagoda',
    domain: 'tomb',
    title: '塔葬 / 楼葬单元',
    layout: '塔葬',
    areaSqm: 1.5,
    areaMin: 0.8,
    areaMax: 3,
    tags: ['塔葬'],
    blurb: '塔内单元格，垂直层叠，水平通道示意。',
    popularity: 72,
    room: room(2.0, 2.0, '南', 2.8),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.88, azimuthDeg: 90, spreadDeg: 90, speed: 28, intensity: 1.5, halfLifeSec: 13 }),
      vent({ kind: 'outlet', x: 0.15, y: 0.2, azimuthDeg: 0, spreadDeg: 70, speed: 24, intensity: 1.3, halfLifeSec: 12 }),
      vent({ kind: 'outlet', x: 0.85, y: 0.2, azimuthDeg: 180, spreadDeg: 70, speed: 24, intensity: 1.3, halfLifeSec: 12 }),
    ],
    lights: [light({ x: 0.5, y: 0.5, azimuthDeg: 90, intensity: 0.85, label: '室内照度', followSun: false })],
    structures: [
      structure({ kind: 'column', x: 0.4, y: 0.35, w: 0.2, h: 0.2, block: 0.7 }),
      structure({ kind: 'box', x: 0.2, y: 0.55, w: 0.6, h: 0.25, block: 0.5 }),
    ],
  },
  {
    id: 'tomb-lawn',
    domain: 'tomb',
    title: '草坪葬 / 生态穴位',
    layout: '草坪葬',
    areaSqm: 1.2,
    areaMin: 0.6,
    areaMax: 2.5,
    tags: ['生态', '草坪'],
    blurb: '低碑或无碑，开敞气流，弱遮挡。',
    popularity: 76,
    room: room(1.5, 1.8, '南', 0.8),
    vents: [
      vent({ kind: 'inlet', x: 0.5, y: 0.85, azimuthDeg: 90, spreadDeg: 120, speed: 32, intensity: 1.8, halfLifeSec: 18 }),
      vent({ kind: 'outlet', x: 0.5, y: 0.15, azimuthDeg: 270, spreadDeg: 120, speed: 30, intensity: 1.6, halfLifeSec: 18 }),
    ],
    lights: [light({ x: 0.5, y: 0.5, azimuthDeg: 90, intensity: 1.2, label: '全开敞日照', followSun: true })],
    structures: [structure({ kind: 'box', x: 0.35, y: 0.4, w: 0.3, h: 0.2, block: 0.25 })],
  },
];

export const LAYOUT_PRESETS: LayoutPreset[] = [...RESIDENTIAL, ...SHOP, ...TOMB];

export const DOMAIN_LABELS: Record<LayoutDomain, string> = {
  residential: '住宅户型',
  shop: '商铺',
  tomb: '墓穴 / 穴位',
};

export function listPresets(domain?: LayoutDomain): LayoutPreset[] {
  const list = domain ? LAYOUT_PRESETS.filter((p) => p.domain === domain) : LAYOUT_PRESETS;
  return [...list].sort((a, b) => b.popularity - a.popularity);
}

export function getPresetById(id: string): LayoutPreset | undefined {
  return LAYOUT_PRESETS.find((p) => p.id === id);
}

export function filterPresets(params: {
  domain?: LayoutDomain;
  layout?: string;
  areaSqm?: number;
  query?: string;
}): LayoutPreset[] {
  let list = listPresets(params.domain);
  if (params.layout) {
    const layout = params.layout.trim();
    list = list.filter((p) => p.layout.includes(layout) || p.title.includes(layout) || p.tags.some((t) => t.includes(layout)));
  }
  if (typeof params.areaSqm === 'number' && Number.isFinite(params.areaSqm)) {
    const a = params.areaSqm;
    list = list
      .filter((p) => a >= p.areaMin * 0.75 && a <= p.areaMax * 1.35)
      .sort((a, b) => Math.abs(a.areaSqm - params.areaSqm!) - Math.abs(b.areaSqm - params.areaSqm!));
  }
  if (params.query?.trim()) {
    const q = params.query.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.layout.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.blurb.includes(q),
    );
  }
  return list;
}

export function scalePresetToArea(preset: LayoutPreset, areaSqm: number): LayoutPreset {
  const target = Math.max(preset.areaMin * 0.8, Math.min(preset.areaMax * 1.4, areaSqm));
  const ratio = Math.sqrt(target / preset.areaSqm);
  const widthM = Math.round(preset.room.widthM * ratio * 10) / 10;
  const depthM = Math.round(preset.room.depthM * ratio * 10) / 10;
  return {
    ...preset,
    areaSqm: Math.round(target),
    room: { ...preset.room, widthM, depthM },
  };
}

export function applyPresetToState(
  state: SpaceLabState,
  preset: LayoutPreset,
  options?: { areaSqm?: number },
): SpaceLabState {
  const p =
    typeof options?.areaSqm === 'number' ? scalePresetToArea(preset, options.areaSqm) : preset;
  const stamp = Date.now();
  return {
    ...state,
    room: { ...p.room },
    vents: p.vents.map((v, i) => ({ ...v, id: `${p.id}-vent-${i}-${stamp}` })),
    lights: p.lights.map((l, i) => ({
      ...l,
      id: `${p.id}-light-${i}-${stamp}`,
    })),
    structures: p.structures.map((s, i) => ({
      ...s,
      id: `${p.id}-st-${i}-${stamp}`,
    })),
  };
}

/** 常见布局选项（筛选用） */
export const RESIDENTIAL_LAYOUT_OPTIONS = [
  '一室',
  '一室一厅',
  '两室一厅',
  '两室两厅',
  '三室一厅',
  '三室两厅',
  '四室两厅',
  '复式',
];

export const SHOP_LAYOUT_OPTIONS = [
  '窄面宽深铺',
  '方铺',
  '角铺',
  '餐饮铺',
  '中岛档口',
  '双开间',
];

export const TOMB_LAYOUT_OPTIONS = [
  '单穴',
  '双穴并排',
  '家族三穴',
  '壁葬格',
  '塔葬',
  '草坪葬',
];
