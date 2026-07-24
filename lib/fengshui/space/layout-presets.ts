/**
 * 空间场 · 大规模预设目录
 * 住宅 / 商铺 / 阴宅 各约 100 套，由参数模板 × 面积档 × 朝向 展开，
 * 覆盖国内常见刚需改善户型、临街商铺、阴宅穴位形态（目标 ≥95% 检索命中）。
 */

import type { SpaceLabState, SpaceLight, SpaceRoom, SpaceStructure, SpaceVent } from './types';

export type LayoutDomain =
  | 'residential'
  | 'shop'
  | 'tomb'
  | 'villa'
  | 'rural'
  | 'office'
  | 'apartment';

export type LayoutPreset = {
  id: string;
  domain: LayoutDomain;
  title: string;
  layout: string;
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

const FACINGS = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'] as const;

/** 入口朝向 → 进风方位角（屏幕：0东 90北 180西 270南；y 向下时 门在底边 y≈0.92 朝室内约 90） */
const FACE_AZ: Record<string, number> = {
  东: 0,
  东南: 45,
  南: 90,
  西南: 135,
  西: 180,
  西北: 225,
  北: 270,
  东北: 315,
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function dimensionsFromArea(areaSqm: number, aspect = 1.15): { widthM: number; depthM: number } {
  const a = Math.max(0.4, Math.min(400, areaSqm));
  const widthM = Math.sqrt(a / aspect);
  const depthM = a / widthM;
  return { widthM: round1(widthM), depthM: round1(depthM) };
}

function vent(p: Omit<SpaceVent, 'id' | 'enabled'> & { enabled?: boolean }): Omit<SpaceVent, 'id'> {
  return { enabled: true, ...p };
}

function light(
  p: Omit<SpaceLight, 'id' | 'enabled' | 'followSun'> & { enabled?: boolean; followSun?: boolean },
): Omit<SpaceLight, 'id'> {
  const { enabled = true, followSun = true, ...rest } = p;
  return { ...rest, enabled, followSun };
}

function structure(p: Omit<SpaceStructure, 'id'>): Omit<SpaceStructure, 'id'> {
  return p;
}

function room(widthM: number, depthM: number, entranceFacing: string, heightM = 2.8): SpaceRoom {
  return { widthM, depthM, heightM, entranceFacing, planRotationDeg: 0 };
}

/** 门在朝向侧边缘，气流吹向室内 */
function inletForFacing(facing: string) {
  const az = FACE_AZ[facing] ?? 90;
  // place door on the edge of facing, blow inward (az + 180 for outdoor? )
  // Plan: y=0 top north-ish when facing 南 door at bottom y=0.93, blow up (screen up = -y) azimuth 90
  switch (facing) {
    case '南':
      return { x: 0.5, y: 0.93, azimuthDeg: 90 };
    case '北':
      return { x: 0.5, y: 0.07, azimuthDeg: 270 };
    case '东':
      return { x: 0.07, y: 0.5, azimuthDeg: 0 };
    case '西':
      return { x: 0.93, y: 0.5, azimuthDeg: 180 };
    case '东南':
      return { x: 0.22, y: 0.88, azimuthDeg: 45 };
    case '西南':
      return { x: 0.78, y: 0.88, azimuthDeg: 135 };
    case '东北':
      return { x: 0.22, y: 0.12, azimuthDeg: 315 };
    case '西北':
      return { x: 0.78, y: 0.12, azimuthDeg: 225 };
    default:
      return { x: 0.5, y: 0.93, azimuthDeg: az };
  }
}

function oppositeFacing(facing: string): string {
  const i = FACINGS.indexOf(facing as (typeof FACINGS)[number]);
  if (i < 0) return '北';
  return FACINGS[(i + 4) % 8];
}

function outletForFacing(facing: string) {
  return inletForFacing(oppositeFacing(facing));
}

type RoomTemplate = {
  key: string;
  layout: string;
  title: string;
  tags: string[];
  blurb: string;
  /** typical areas to expand */
  areas: number[];
  aspect: number;
  heightM?: number;
  popularity: number;
  /** structure pattern id */
  pattern:
    | 'open'
    | 'one_bed'
    | 'two_bed'
    | 'three_bed'
    | 'four_bed'
    | 'duplex'
    | 'shop_narrow'
    | 'shop_square'
    | 'shop_corner'
    | 'shop_kitchen'
    | 'shop_kiosk'
    | 'shop_double'
    | 'tomb_single'
    | 'tomb_double'
    | 'tomb_family'
    | 'tomb_wall'
    | 'tomb_pagoda'
    | 'tomb_lawn'
    | 'villa_courtyard'
    | 'rural_yard'
    | 'office_open'
    | 'apartment_tower';
};

function buildStructures(pattern: RoomTemplate['pattern'], seed: number): Omit<SpaceStructure, 'id'>[] {
  const j = (n: number) => clamp(0.04 + ((seed * 17 + n * 13) % 20) / 100, 0.03, 0.85);
  switch (pattern) {
    case 'open':
      return [
        structure({ kind: 'box', x: 0.7, y: 0.12, w: 0.22, h: 0.18, block: 0.4 }),
        structure({ kind: 'box', x: j(1), y: 0.55, w: 0.18, h: 0.2, block: 0.35 }),
      ];
    case 'one_bed':
      return [
        structure({ kind: 'box', x: 0.08, y: 0.55, w: 0.3, h: 0.32, block: 0.5 }),
        structure({ kind: 'box', x: 0.68, y: 0.1, w: 0.24, h: 0.22, block: 0.45 }),
        structure({ kind: 'column', x: 0.45, y: 0.42, w: 0.06, h: 0.06, block: 0.3 }),
      ];
    case 'two_bed':
      return [
        structure({ kind: 'box', x: 0.05, y: 0.55, w: 0.3, h: 0.35, block: 0.52 }),
        structure({ kind: 'box', x: 0.62, y: 0.08, w: 0.3, h: 0.28, block: 0.5 }),
        structure({ kind: 'box', x: 0.08, y: 0.08, w: 0.26, h: 0.26, block: 0.48 }),
        structure({ kind: 'box', x: 0.72, y: 0.55, w: 0.2, h: 0.22, block: 0.4 }),
      ];
    case 'three_bed':
      return [
        structure({ kind: 'box', x: 0.05, y: 0.5, w: 0.28, h: 0.32, block: 0.5 }),
        structure({ kind: 'box', x: 0.65, y: 0.06, w: 0.28, h: 0.28, block: 0.5 }),
        structure({ kind: 'box', x: 0.35, y: 0.06, w: 0.24, h: 0.24, block: 0.46 }),
        structure({ kind: 'box', x: 0.06, y: 0.06, w: 0.24, h: 0.26, block: 0.48 }),
        structure({ kind: 'box', x: 0.72, y: 0.55, w: 0.2, h: 0.2, block: 0.4 }),
      ];
    case 'four_bed':
      return [
        structure({ kind: 'box', x: 0.04, y: 0.45, w: 0.28, h: 0.3, block: 0.48 }),
        structure({ kind: 'box', x: 0.7, y: 0.04, w: 0.26, h: 0.28, block: 0.5 }),
        structure({ kind: 'box', x: 0.4, y: 0.04, w: 0.24, h: 0.26, block: 0.46 }),
        structure({ kind: 'box', x: 0.1, y: 0.04, w: 0.24, h: 0.26, block: 0.46 }),
        structure({ kind: 'box', x: 0.72, y: 0.5, w: 0.22, h: 0.24, block: 0.42 }),
        structure({ kind: 'box', x: 0.38, y: 0.52, w: 0.2, h: 0.2, block: 0.38 }),
      ];
    case 'duplex':
      return [
        structure({ kind: 'column', x: 0.46, y: 0.4, w: 0.12, h: 0.18, block: 0.7 }),
        structure({ kind: 'box', x: 0.08, y: 0.55, w: 0.28, h: 0.28, block: 0.48 }),
        structure({ kind: 'box', x: 0.65, y: 0.1, w: 0.28, h: 0.28, block: 0.5 }),
      ];
    case 'shop_narrow':
      return [
        structure({ kind: 'box', x: 0.15, y: 0.35, w: 0.2, h: 0.45, block: 0.4 }),
        structure({ kind: 'box', x: 0.65, y: 0.35, w: 0.2, h: 0.45, block: 0.4 }),
        structure({ kind: 'box', x: 0.25, y: 0.08, w: 0.5, h: 0.18, block: 0.55 }),
      ];
    case 'shop_square':
      return [
        structure({ kind: 'box', x: 0.35, y: 0.35, w: 0.3, h: 0.3, block: 0.35 }),
        structure({ kind: 'box', x: 0.1, y: 0.55, w: 0.18, h: 0.3, block: 0.4 }),
        structure({ kind: 'box', x: 0.72, y: 0.55, w: 0.18, h: 0.3, block: 0.4 }),
      ];
    case 'shop_corner':
      return [
        structure({ kind: 'box', x: 0.3, y: 0.3, w: 0.35, h: 0.35, block: 0.35 }),
        structure({ kind: 'box', x: 0.1, y: 0.1, w: 0.2, h: 0.2, block: 0.5 }),
      ];
    case 'shop_kitchen':
      return [
        structure({ kind: 'box', x: 0.15, y: 0.45, w: 0.7, h: 0.25, block: 0.3 }),
        structure({ kind: 'box', x: 0.15, y: 0.05, w: 0.7, h: 0.28, block: 0.6 }),
      ];
    case 'shop_kiosk':
      return [structure({ kind: 'box', x: 0.3, y: 0.3, w: 0.4, h: 0.4, block: 0.45 })];
    case 'shop_double':
      return [
        structure({ kind: 'box', x: 0.15, y: 0.35, w: 0.25, h: 0.4, block: 0.35 }),
        structure({ kind: 'box', x: 0.6, y: 0.35, w: 0.25, h: 0.4, block: 0.35 }),
        structure({ kind: 'box', x: 0.35, y: 0.08, w: 0.3, h: 0.18, block: 0.5 }),
      ];
    case 'tomb_single':
      return [
        structure({ kind: 'box', x: 0.3, y: 0.35, w: 0.4, h: 0.35, block: 0.65 }),
        structure({ kind: 'box', x: 0.35, y: 0.72, w: 0.3, h: 0.12, block: 0.35 }),
      ];
    case 'tomb_double':
      return [
        structure({ kind: 'box', x: 0.12, y: 0.32, w: 0.32, h: 0.36, block: 0.65 }),
        structure({ kind: 'box', x: 0.56, y: 0.32, w: 0.32, h: 0.36, block: 0.65 }),
        structure({ kind: 'box', x: 0.3, y: 0.75, w: 0.4, h: 0.12, block: 0.35 }),
      ];
    case 'tomb_family':
      return [
        structure({ kind: 'box', x: 0.08, y: 0.28, w: 0.24, h: 0.35, block: 0.65 }),
        structure({ kind: 'box', x: 0.38, y: 0.28, w: 0.24, h: 0.35, block: 0.65 }),
        structure({ kind: 'box', x: 0.68, y: 0.28, w: 0.24, h: 0.35, block: 0.65 }),
        structure({ kind: 'box', x: 0.25, y: 0.72, w: 0.5, h: 0.14, block: 0.35 }),
      ];
    case 'tomb_wall':
      return [structure({ kind: 'box', x: 0.15, y: 0.2, w: 0.7, h: 0.55, block: 0.75 })];
    case 'tomb_pagoda':
      return [
        structure({ kind: 'column', x: 0.4, y: 0.35, w: 0.2, h: 0.2, block: 0.7 }),
        structure({ kind: 'box', x: 0.2, y: 0.55, w: 0.6, h: 0.25, block: 0.5 }),
      ];
    case 'tomb_lawn':
      return [structure({ kind: 'box', x: 0.35, y: 0.4, w: 0.3, h: 0.2, block: 0.25 })];
    case 'villa_courtyard':
      return [
        structure({ kind: 'box', x: 0.08, y: 0.08, w: 0.35, h: 0.35, block: 0.55 }),
        structure({ kind: 'box', x: 0.55, y: 0.08, w: 0.35, h: 0.28, block: 0.5 }),
        structure({ kind: 'box', x: 0.08, y: 0.55, w: 0.28, h: 0.3, block: 0.48 }),
        structure({ kind: 'box', x: 0.45, y: 0.5, w: 0.2, h: 0.15, block: 0.2 }),
        structure({ kind: 'column', x: 0.72, y: 0.62, w: 0.1, h: 0.1, block: 0.4 }),
      ];
    case 'rural_yard':
      return [
        structure({ kind: 'box', x: 0.15, y: 0.15, w: 0.55, h: 0.35, block: 0.55 }),
        structure({ kind: 'box', x: 0.15, y: 0.6, w: 0.25, h: 0.25, block: 0.45 }),
        structure({ kind: 'box', x: 0.55, y: 0.6, w: 0.3, h: 0.25, block: 0.4 }),
        structure({ kind: 'arc', x: 0.4, y: 0.85, w: 0.2, h: 0.08, block: 0.3 }),
      ];
    case 'office_open':
      return [
        structure({ kind: 'box', x: 0.08, y: 0.15, w: 0.2, h: 0.7, block: 0.35 }),
        structure({ kind: 'box', x: 0.72, y: 0.15, w: 0.2, h: 0.7, block: 0.35 }),
        structure({ kind: 'box', x: 0.35, y: 0.35, w: 0.3, h: 0.3, block: 0.25 }),
        structure({ kind: 'column', x: 0.48, y: 0.12, w: 0.08, h: 0.08, block: 0.5 }),
      ];
    case 'apartment_tower':
      return [
        structure({ kind: 'box', x: 0.1, y: 0.1, w: 0.35, h: 0.35, block: 0.5 }),
        structure({ kind: 'box', x: 0.55, y: 0.1, w: 0.35, h: 0.35, block: 0.5 }),
        structure({ kind: 'box', x: 0.1, y: 0.55, w: 0.35, h: 0.35, block: 0.48 }),
        structure({ kind: 'column', x: 0.46, y: 0.46, w: 0.1, h: 0.12, block: 0.65 }),
      ];
    default:
      return [structure({ kind: 'box', x: j(2), y: j(3), w: 0.2, h: 0.2, block: 0.4 })];
  }
}

function buildVents(facing: string, pattern: RoomTemplate['pattern']): Omit<SpaceVent, 'id'>[] {
  const inn = inletForFacing(facing);
  const out = outletForFacing(facing);
  const base: Omit<SpaceVent, 'id'>[] = [
    vent({
      kind: 'inlet',
      x: inn.x,
      y: inn.y,
      azimuthDeg: inn.azimuthDeg,
      spreadDeg: pattern.startsWith('shop') ? 105 : pattern.startsWith('tomb') ? 85 : 100,
      speed: pattern.startsWith('shop') ? 46 : 40,
      intensity: pattern.startsWith('shop') ? 2.5 : 2.2,
      halfLifeSec: pattern.startsWith('tomb') ? 16 : 13,
    }),
    vent({
      kind: 'outlet',
      x: out.x,
      y: out.y,
      azimuthDeg: out.azimuthDeg,
      spreadDeg: 75,
      speed: 34,
      intensity: 1.7,
      halfLifeSec: 11,
    }),
  ];

  if (pattern === 'shop_corner') {
    base.push(
      vent({
        kind: 'inlet',
        x: 0.93,
        y: 0.5,
        azimuthDeg: 180,
        spreadDeg: 95,
        speed: 42,
        intensity: 2.3,
        halfLifeSec: 12,
      }),
    );
  }
  if (pattern === 'shop_kitchen') {
    base[1] = vent({
      kind: 'outlet',
      x: 0.5,
      y: 0.08,
      azimuthDeg: 270,
      spreadDeg: 90,
      speed: 52,
      intensity: 2.8,
      halfLifeSec: 8,
    });
  }
  if (pattern === 'two_bed' || pattern === 'three_bed' || pattern === 'four_bed') {
    base.push(
      vent({
        kind: 'outlet',
        x: 0.12,
        y: 0.45,
        azimuthDeg: 0,
        spreadDeg: 60,
        speed: 26,
        intensity: 1.3,
        halfLifeSec: 10,
      }),
    );
  }
  if (pattern === 'tomb_double' || pattern === 'tomb_family') {
    base.push(
      vent({
        kind: 'outlet',
        x: 0.2,
        y: 0.15,
        azimuthDeg: 270,
        spreadDeg: 55,
        speed: 22,
        intensity: 1.2,
        halfLifeSec: 14,
      }),
      vent({
        kind: 'outlet',
        x: 0.8,
        y: 0.15,
        azimuthDeg: 270,
        spreadDeg: 55,
        speed: 22,
        intensity: 1.2,
        halfLifeSec: 14,
      }),
    );
  }
  return base;
}

function buildLights(facing: string, pattern: RoomTemplate['pattern']): Omit<SpaceLight, 'id'>[] {
  const inn = inletForFacing(facing);
  const list: Omit<SpaceLight, 'id'>[] = [
    light({
      x: clamp(inn.x, 0.1, 0.9),
      y: clamp(inn.y > 0.5 ? 0.88 : 0.12, 0.08, 0.92),
      azimuthDeg: FACE_AZ[facing] ?? 90,
      intensity: pattern.startsWith('shop') ? 1.4 : 1.2,
      label: '主采光',
      followSun: !pattern.startsWith('tomb') || pattern === 'tomb_lawn',
    }),
  ];
  if (pattern === 'two_bed' || pattern === 'three_bed' || pattern === 'four_bed') {
    list.push(
      light({
        x: 0.78,
        y: 0.18,
        azimuthDeg: FACE_AZ[facing] ?? 90,
        intensity: 0.95,
        label: '卧室窗',
        followSun: true,
      }),
    );
  }
  return list;
}

function expandTemplate(
  domain: LayoutDomain,
  tpl: RoomTemplate,
  facings: readonly string[],
): LayoutPreset[] {
  const out: LayoutPreset[] = [];
  let idx = 0;
  for (const area of tpl.areas) {
    for (const facing of facings) {
      idx += 1;
      const { widthM, depthM } = dimensionsFromArea(area, tpl.aspect);
      const margin = Math.max(area * 0.18, domain === 'tomb' ? 0.3 : 8);
      const id = `${domain.slice(0, 3)}-${tpl.key}-a${area}-f${facing}-${idx}`;
      out.push({
        id,
        domain,
        title: `${tpl.title} · ${facing}向 · ${area}㎡`,
        layout: tpl.layout,
        areaSqm: area,
        areaMin: round1(area - margin),
        areaMax: round1(area + margin),
        tags: [...tpl.tags, facing, `${area}㎡`],
        blurb: `${tpl.blurb} 入口${facing}；面宽约 ${widthM}m × 进深约 ${depthM}m。`,
        popularity: clamp(tpl.popularity - (idx % 7), 55, 99),
        room: room(widthM, depthM, facing, tpl.heightM ?? (domain === 'tomb' ? 1.2 : domain === 'shop' ? 3.3 : 2.8)),
        vents: buildVents(facing, tpl.pattern),
        lights: buildLights(facing, tpl.pattern),
        structures: buildStructures(tpl.pattern, area + facing.charCodeAt(0)),
      });
    }
  }
  return out;
}

// ---------- 住宅模板：面积档 × 朝向 ≈ 100+ ----------
const RES_TEMPLATES: RoomTemplate[] = [
  {
    key: 'studio',
    layout: '一室',
    title: '开间/一室',
    tags: ['小户型', '刚需', '开间'],
    blurb: '单间功能区，厨卫靠内。',
    areas: [28, 32, 35, 38, 42, 48],
    aspect: 1.25,
    popularity: 90,
    pattern: 'open',
  },
  {
    key: '1b1l',
    layout: '一室一厅',
    title: '一室一厅',
    tags: ['刚需', '一居'],
    blurb: '客卧分离，厅南卧侧常见。',
    areas: [45, 50, 55, 58, 62, 68],
    aspect: 1.2,
    popularity: 94,
    pattern: 'one_bed',
  },
  {
    key: '1b1l-loft',
    layout: '一室一厅',
    title: 'LOFT一居',
    tags: ['LOFT', '小户型'],
    blurb: '挑高一层半，公区+夹层睡区示意。',
    areas: [40, 48, 55, 65],
    aspect: 1.1,
    heightM: 3.6,
    popularity: 78,
    pattern: 'duplex',
  },
  {
    key: '2b1l',
    layout: '两室一厅',
    title: '两室一厅',
    tags: ['刚需', '主流'],
    blurb: '主流刚需两房。',
    areas: [65, 70, 75, 78, 82, 88, 92],
    aspect: 1.18,
    popularity: 99,
    pattern: 'two_bed',
  },
  {
    key: '2b2l',
    layout: '两室两厅',
    title: '两室两厅',
    tags: ['改善', '客餐分离'],
    blurb: '客餐分离，动线更清晰。',
    areas: [80, 85, 90, 95, 100, 108],
    aspect: 1.15,
    popularity: 95,
    pattern: 'two_bed',
  },
  {
    key: '3b1l',
    layout: '三室一厅',
    title: '三室一厅',
    tags: ['改善', '三房'],
    blurb: '三房一厅，卫生间集中。',
    areas: [90, 95, 100, 105, 112, 118],
    aspect: 1.14,
    popularity: 96,
    pattern: 'three_bed',
  },
  {
    key: '3b2l',
    layout: '三室两厅',
    title: '三室两厅',
    tags: ['改善', '主流', '南北通透'],
    blurb: '客餐分离 + 三卧。',
    areas: [100, 108, 115, 120, 128, 135, 145],
    aspect: 1.12,
    popularity: 98,
    pattern: 'three_bed',
  },
  {
    key: '3b2l2b',
    layout: '三室两厅两卫',
    title: '三室两厅两卫',
    tags: ['改善', '双卫'],
    blurb: '主卧套卫常见改善盘。',
    areas: [110, 120, 130, 140, 150],
    aspect: 1.1,
    popularity: 92,
    pattern: 'three_bed',
  },
  {
    key: '4b2l',
    layout: '四室两厅',
    title: '四室两厅',
    tags: ['改善', '多代'],
    blurb: '四房两厅，适合多代同住。',
    areas: [125, 135, 145, 155, 165, 180],
    aspect: 1.08,
    popularity: 88,
    pattern: 'four_bed',
  },
  {
    key: '4b2l2b',
    layout: '四室两厅两卫',
    title: '四室两厅两卫',
    tags: ['改善', '双卫'],
    blurb: '四房双卫改善户型。',
    areas: [140, 150, 160, 175, 190],
    aspect: 1.05,
    popularity: 86,
    pattern: 'four_bed',
  },
  {
    key: '5b',
    layout: '五室两厅',
    title: '五室大平层',
    tags: ['大平层', '高端'],
    blurb: '五房大平层示意。',
    areas: [180, 200, 220, 250],
    aspect: 1.02,
    popularity: 70,
    pattern: 'four_bed',
  },
  {
    key: 'duplex',
    layout: '复式',
    title: '复式/跃层',
    tags: ['复式', '改善'],
    blurb: '一层公区+楼梯核示意。',
    areas: [120, 140, 160, 180, 200],
    aspect: 1.05,
    heightM: 3.0,
    popularity: 76,
    pattern: 'duplex',
  },
];

// ---------- 商铺模板 ----------
const SHOP_TEMPLATES: RoomTemplate[] = [
  {
    key: 'narrow',
    layout: '窄面宽深铺',
    title: '临街窄铺',
    tags: ['临街', '零售'],
    blurb: '窄面宽、大进深，门头进后仓出。',
    areas: [20, 25, 30, 35, 40, 45, 50, 55],
    aspect: 2.0,
    heightM: 3.2,
    popularity: 97,
    pattern: 'shop_narrow',
  },
  {
    key: 'square',
    layout: '方铺',
    title: '方正铺',
    tags: ['零售', '服务'],
    blurb: '面宽进深接近，中岛+后仓。',
    areas: [40, 50, 60, 70, 80, 90],
    aspect: 1.05,
    heightM: 3.3,
    popularity: 94,
    pattern: 'shop_square',
  },
  {
    key: 'corner',
    layout: '角铺',
    title: '角铺双开面',
    tags: ['角铺', '高曝光'],
    blurb: '两面沿街。',
    areas: [50, 60, 70, 80, 100, 120],
    aspect: 1.0,
    heightM: 3.5,
    popularity: 91,
    pattern: 'shop_corner',
  },
  {
    key: 'restaurant',
    layout: '餐饮铺',
    title: '餐饮前厅后厨',
    tags: ['餐饮', '后厨'],
    blurb: '前厅就餐、后厨排烟。',
    areas: [60, 80, 100, 120, 150, 180],
    aspect: 1.35,
    heightM: 3.4,
    popularity: 93,
    pattern: 'shop_kitchen',
  },
  {
    key: 'cafe',
    layout: '轻餐饮/咖啡',
    title: '轻餐咖啡铺',
    tags: ['餐饮', '轻餐'],
    blurb: '吧台+少量座位。',
    areas: [35, 45, 55, 70, 90],
    aspect: 1.2,
    heightM: 3.2,
    popularity: 88,
    pattern: 'shop_square',
  },
  {
    key: 'beauty',
    layout: '美业小铺',
    title: '美甲美容铺',
    tags: ['美业', '服务'],
    blurb: '小隔间工位+前台。',
    areas: [30, 40, 50, 65, 80],
    aspect: 1.25,
    heightM: 3.0,
    popularity: 87,
    pattern: 'shop_square',
  },
  {
    key: 'kiosk',
    layout: '中岛档口',
    title: '商场中岛',
    tags: ['商场', '档口'],
    blurb: '四面或三面通透。',
    areas: [12, 18, 25, 30, 40],
    aspect: 1.0,
    heightM: 3.0,
    popularity: 86,
    pattern: 'shop_kiosk',
  },
  {
    key: 'market',
    layout: '市场档口',
    title: '批发市场档口',
    tags: ['市场', '档口'],
    blurb: '通道主导气流。',
    areas: [8, 12, 16, 24, 32],
    aspect: 1.4,
    heightM: 3.0,
    popularity: 80,
    pattern: 'shop_kiosk',
  },
  {
    key: 'double',
    layout: '双开间',
    title: '双开间旗舰',
    tags: ['旗舰', '零售'],
    blurb: '双门头或一门一橱。',
    areas: [90, 110, 130, 150, 180],
    aspect: 0.85,
    heightM: 3.6,
    popularity: 84,
    pattern: 'shop_double',
  },
  {
    key: 'triple',
    layout: '三开间',
    title: '三开间沿街',
    tags: ['旗舰', '临街'],
    blurb: '大面宽沿街展示。',
    areas: [120, 150, 180, 220],
    aspect: 0.7,
    heightM: 3.8,
    popularity: 75,
    pattern: 'shop_double',
  },
  {
    key: 'office-bottom',
    layout: '底商',
    title: '写字楼底商',
    tags: ['底商', '办公区'],
    blurb: '公区人流+临街门头。',
    areas: [50, 80, 100, 140, 200],
    aspect: 1.15,
    heightM: 3.5,
    popularity: 82,
    pattern: 'shop_square',
  },
  {
    key: 'warehouse-front',
    layout: '前店后仓',
    title: '前店后仓',
    tags: ['仓储', '批发'],
    blurb: '前展示后仓储。',
    areas: [80, 120, 160, 200, 280],
    aspect: 1.6,
    heightM: 4.0,
    popularity: 79,
    pattern: 'shop_narrow',
  },
];

// ---------- 阴宅模板 ----------
const TOMB_TEMPLATES: RoomTemplate[] = [
  {
    key: 'single',
    layout: '单穴',
    title: '单穴标准',
    tags: ['墓园', '标准'],
    blurb: '单体穴位+碑前供台。',
    areas: [1.5, 2.0, 2.5, 3.0, 3.5, 4.0],
    aspect: 1.3,
    heightM: 1.2,
    popularity: 96,
    pattern: 'tomb_single',
  },
  {
    key: 'single-large',
    layout: '单穴',
    title: '单穴加宽',
    tags: ['墓园'],
    blurb: '加宽单穴，祭台更开敞。',
    areas: [4.5, 5.0, 6.0, 7.0],
    aspect: 1.2,
    heightM: 1.3,
    popularity: 85,
    pattern: 'tomb_single',
  },
  {
    key: 'double',
    layout: '双穴并排',
    title: '双穴并排',
    tags: ['合葬', '夫妻穴'],
    blurb: '并排双穴共用祭台。',
    areas: [3.5, 4.5, 5.0, 6.0, 7.5, 8.0],
    aspect: 0.85,
    heightM: 1.2,
    popularity: 94,
    pattern: 'tomb_double',
  },
  {
    key: 'double-tandem',
    layout: '双穴前后',
    title: '双穴纵列',
    tags: ['合葬'],
    blurb: '前后纵列双穴。',
    areas: [4.0, 5.5, 7.0, 9.0],
    aspect: 1.6,
    heightM: 1.2,
    popularity: 80,
    pattern: 'tomb_double',
  },
  {
    key: 'family3',
    layout: '家族三穴',
    title: '家族三穴',
    tags: ['家族'],
    blurb: '一排三穴或品字。',
    areas: [7, 9, 11, 13, 15],
    aspect: 0.75,
    heightM: 1.3,
    popularity: 82,
    pattern: 'tomb_family',
  },
  {
    key: 'family5',
    layout: '家族多穴',
    title: '家族五穴片区',
    tags: ['家族', '墓园'],
    blurb: '多穴位片区示意。',
    areas: [12, 16, 20, 25],
    aspect: 0.9,
    heightM: 1.4,
    popularity: 70,
    pattern: 'tomb_family',
  },
  {
    key: 'wall',
    layout: '壁葬格',
    title: '壁葬格位',
    tags: ['壁葬', '骨灰格'],
    blurb: '墙格+走廊通道。',
    areas: [0.4, 0.6, 0.8, 1.0, 1.2],
    aspect: 0.7,
    heightM: 2.4,
    popularity: 88,
    pattern: 'tomb_wall',
  },
  {
    key: 'pagoda',
    layout: '塔葬',
    title: '塔葬单元',
    tags: ['塔葬'],
    blurb: '塔内单元格。',
    areas: [0.8, 1.2, 1.5, 2.0, 2.5],
    aspect: 1.0,
    heightM: 2.8,
    popularity: 74,
    pattern: 'tomb_pagoda',
  },
  {
    key: 'lawn',
    layout: '草坪葬',
    title: '草坪/生态葬',
    tags: ['生态', '草坪'],
    blurb: '低碑或无碑开敞。',
    areas: [0.8, 1.2, 1.5, 2.0, 2.5],
    aspect: 1.1,
    heightM: 0.8,
    popularity: 78,
    pattern: 'tomb_lawn',
  },
  {
    key: 'tree',
    layout: '树葬',
    title: '树葬点位',
    tags: ['生态', '树葬'],
    blurb: '树下穴位，弱遮挡。',
    areas: [1.0, 1.5, 2.0, 3.0],
    aspect: 1.0,
    heightM: 0.9,
    popularity: 72,
    pattern: 'tomb_lawn',
  },
  {
    key: 'sea-memo',
    layout: '海葬纪念',
    title: '海葬纪念碑位',
    tags: ['海葬', '纪念'],
    blurb: '纪念碑墙位示意（非海区）。',
    areas: [0.5, 0.8, 1.0, 1.5],
    aspect: 0.8,
    heightM: 2.0,
    popularity: 65,
    pattern: 'tomb_wall',
  },
  {
    key: 'garden',
    layout: '艺术墓',
    title: '艺术/定制墓',
    tags: ['艺术墓'],
    blurb: '定制造型穴位，前庭更开敞。',
    areas: [6, 8, 10, 12, 16],
    aspect: 1.1,
    heightM: 1.5,
    popularity: 68,
    pattern: 'tomb_single',
  },
];

function buildDomain(
  domain: LayoutDomain,
  templates: RoomTemplate[],
  facingMode: 'all' | 'cardinal' | 'south_bias',
): LayoutPreset[] {
  let facings: readonly string[] = FACINGS;
  if (facingMode === 'cardinal') facings = ['东', '南', '西', '北'];
  if (facingMode === 'south_bias') facings = ['南', '东南', '西南', '北', '东', '西'];

  const list: LayoutPreset[] = [];
  for (const tpl of templates) {
    list.push(...expandTemplate(domain, tpl, facings));
  }
  // ensure ~100 by trimming or padding
  if (list.length > 120) {
    // keep highest popularity diversity: take first 100 after sort by layout+area
    return list.sort((a, b) => b.popularity - a.popularity || a.areaSqm - b.areaSqm).slice(0, 100);
  }
  // pad with extra area steps if under 100
  if (list.length < 100) {
    const extraFacings = FACINGS;
    const padTemplates = templates.slice(0, 4);
    const moreAreas = [33, 47, 63, 77, 93, 107, 123, 137, 153, 167];
    for (const tpl of padTemplates) {
      if (list.length >= 100) break;
      for (const area of moreAreas) {
        if (list.length >= 100) break;
        for (const facing of extraFacings) {
          if (list.length >= 100) break;
          const exists = list.some((p) => p.layout === tpl.layout && p.areaSqm === area && p.room.entranceFacing === facing);
          if (exists) continue;
          const { widthM, depthM } = dimensionsFromArea(area, tpl.aspect);
          list.push({
            id: `${domain.slice(0, 3)}-pad-${tpl.key}-${area}-${facing}`,
            domain,
            title: `${tpl.title} · ${facing}向 · ${area}㎡`,
            layout: tpl.layout,
            areaSqm: area,
            areaMin: round1(area * 0.82),
            areaMax: round1(area * 1.18),
            tags: [...tpl.tags, facing, '扩展'],
            blurb: `${tpl.blurb}（扩展档）`,
            popularity: 60,
            room: room(widthM, depthM, facing, tpl.heightM ?? 2.8),
            vents: buildVents(facing, tpl.pattern),
            lights: buildLights(facing, tpl.pattern),
            structures: buildStructures(tpl.pattern, area),
          });
        }
      }
    }
  }
  return list.slice(0, 100);
}

const VILLA_TEMPLATES: RoomTemplate[] = [
  {
    key: 'villa-single',
    layout: '独栋别墅',
    title: '独栋别墅',
    tags: ['别墅', '独栋'],
    blurb: '独门独院，前庭后院。',
    areas: [180, 220, 260, 300, 350, 400],
    aspect: 1.05,
    heightM: 3.2,
    popularity: 92,
    pattern: 'villa_courtyard',
  },
  {
    key: 'villa-town',
    layout: '联排别墅',
    title: '联排别墅',
    tags: ['别墅', '联排'],
    blurb: '联排窄面宽，前后庭。',
    areas: [140, 160, 180, 200, 240],
    aspect: 1.4,
    heightM: 3.0,
    popularity: 88,
    pattern: 'villa_courtyard',
  },
  {
    key: 'villa-duplex',
    layout: '叠拼别墅',
    title: '叠拼别墅',
    tags: ['别墅', '叠拼'],
    blurb: '上下叠拼，入户与庭院示意。',
    areas: [120, 150, 170, 190, 220],
    aspect: 1.15,
    heightM: 3.0,
    popularity: 84,
    pattern: 'duplex',
  },
  {
    key: 'villa-courtyard',
    layout: '合院别墅',
    title: '中式合院',
    tags: ['别墅', '合院'],
    blurb: '围合庭院，多进示意。',
    areas: [200, 250, 300, 360, 420],
    aspect: 1.0,
    heightM: 3.3,
    popularity: 80,
    pattern: 'villa_courtyard',
  },
  {
    key: 'villa-mountain',
    layout: '山景别墅',
    title: '山景/坡地别墅',
    tags: ['别墅', '山景'],
    blurb: '坡地退台，景观朝向主导。',
    areas: [220, 280, 320, 380],
    aspect: 1.1,
    heightM: 3.2,
    popularity: 76,
    pattern: 'villa_courtyard',
  },
];

const RURAL_TEMPLATES: RoomTemplate[] = [
  {
    key: 'rural-siheyuan',
    layout: '三合院',
    title: '农村三合院',
    tags: ['宅基地', '院落'],
    blurb: '正房+厢房+院坝。',
    areas: [120, 150, 180, 200, 240],
    aspect: 1.0,
    heightM: 3.0,
    popularity: 94,
    pattern: 'rural_yard',
  },
  {
    key: 'rural-single',
    layout: '单排正房',
    title: '单排农房',
    tags: ['宅基地'],
    blurb: '一排正房+前院。',
    areas: [80, 100, 120, 140, 160],
    aspect: 1.6,
    heightM: 3.0,
    popularity: 90,
    pattern: 'rural_yard',
  },
  {
    key: 'rural-two-floor',
    layout: '两层自建',
    title: '两层自建房',
    tags: ['宅基地', '自建'],
    blurb: '两层砖混自建常见。',
    areas: [140, 160, 180, 200, 220, 260],
    aspect: 1.2,
    heightM: 3.1,
    popularity: 92,
    pattern: 'rural_yard',
  },
  {
    key: 'rural-courtyard',
    layout: '四合院式',
    title: '农家四合围',
    tags: ['宅基地', '合院'],
    blurb: '四面围合小院。',
    areas: [160, 200, 240, 280],
    aspect: 1.0,
    heightM: 3.0,
    popularity: 82,
    pattern: 'villa_courtyard',
  },
  {
    key: 'rural-new',
    layout: '新式小二楼',
    title: '新式小二楼',
    tags: ['宅基地', '新式'],
    blurb: '临路小二楼+后院。',
    areas: [100, 130, 160, 190, 220],
    aspect: 1.25,
    heightM: 3.2,
    popularity: 86,
    pattern: 'rural_yard',
  },
];

const OFFICE_TEMPLATES: RoomTemplate[] = [
  {
    key: 'office-open',
    layout: '开放办公',
    title: '开放式办公层',
    tags: ['办公', '开放'],
    blurb: '大开间工位+两侧会议室。',
    areas: [200, 300, 400, 500, 600, 800],
    aspect: 1.3,
    heightM: 3.2,
    popularity: 95,
    pattern: 'office_open',
  },
  {
    key: 'office-cell',
    layout: '隔间办公',
    title: '隔间写字间',
    tags: ['办公', '隔间'],
    blurb: '沿窗隔间+中廊。',
    areas: [80, 120, 160, 200, 250],
    aspect: 1.5,
    heightM: 3.0,
    popularity: 90,
    pattern: 'office_open',
  },
  {
    key: 'office-corner',
    layout: '角间高管',
    title: '角间/老板间',
    tags: ['办公', '高管'],
    blurb: '角窗视野，独立门。',
    areas: [40, 55, 70, 90],
    aspect: 1.1,
    heightM: 3.0,
    popularity: 84,
    pattern: 'shop_corner',
  },
  {
    key: 'office-meeting',
    layout: '会议层',
    title: '会议培训层',
    tags: ['办公', '会议'],
    blurb: '大会议室+茶歇。',
    areas: [150, 220, 300, 400],
    aspect: 1.2,
    heightM: 3.3,
    popularity: 80,
    pattern: 'office_open',
  },
  {
    key: 'office-soho',
    layout: 'SOHO',
    title: 'SOHO 小型办公',
    tags: ['办公', 'SOHO'],
    blurb: '公寓式办公。',
    areas: [50, 70, 90, 110, 130],
    aspect: 1.15,
    heightM: 2.9,
    popularity: 88,
    pattern: 'one_bed',
  },
];

const APARTMENT_TEMPLATES: RoomTemplate[] = [
  {
    key: 'apt-studio',
    layout: '公寓开间',
    title: '酒店式开间',
    tags: ['公寓', '开间'],
    blurb: '酒店式公寓单间。',
    areas: [25, 30, 35, 40, 48],
    aspect: 1.3,
    heightM: 2.7,
    popularity: 90,
    pattern: 'open',
  },
  {
    key: 'apt-1b',
    layout: '公寓一居',
    title: '公寓一居室',
    tags: ['公寓'],
    blurb: '一室一厅公寓。',
    areas: [40, 50, 55, 60, 70],
    aspect: 1.2,
    heightM: 2.8,
    popularity: 93,
    pattern: 'one_bed',
  },
  {
    key: 'apt-2b',
    layout: '公寓两居',
    title: '公寓两居室',
    tags: ['公寓'],
    blurb: '塔楼两居常见。',
    areas: [70, 80, 90, 100, 110],
    aspect: 1.15,
    heightM: 2.8,
    popularity: 95,
    pattern: 'two_bed',
  },
  {
    key: 'apt-3b',
    layout: '公寓三居',
    title: '公寓三居室',
    tags: ['公寓', '塔楼'],
    blurb: '塔楼三居。',
    areas: [95, 105, 115, 125, 140],
    aspect: 1.12,
    heightM: 2.85,
    popularity: 92,
    pattern: 'three_bed',
  },
  {
    key: 'apt-tower',
    layout: '塔楼标准层',
    title: '公寓塔楼一梯多户',
    tags: ['公寓', '公区'],
    blurb: '电梯核+多户示意（单户分析用单元）。',
    areas: [60, 80, 100, 120],
    aspect: 1.0,
    heightM: 2.9,
    popularity: 85,
    pattern: 'apartment_tower',
  },
  {
    key: 'apt-service',
    layout: '服务式公寓',
    title: '服务式公寓',
    tags: ['公寓', '酒店式'],
    blurb: '带公区服务的公寓单元。',
    areas: [45, 55, 65, 80, 100],
    aspect: 1.18,
    heightM: 2.8,
    popularity: 82,
    pattern: 'one_bed',
  },
];

const RESIDENTIAL = buildDomain('residential', RES_TEMPLATES, 'south_bias');
const SHOP = buildDomain('shop', SHOP_TEMPLATES, 'cardinal');
const TOMB = buildDomain('tomb', TOMB_TEMPLATES, 'all');
const VILLA = buildDomain('villa', VILLA_TEMPLATES, 'south_bias');
const RURAL = buildDomain('rural', RURAL_TEMPLATES, 'cardinal');
const OFFICE = buildDomain('office', OFFICE_TEMPLATES, 'cardinal');
const APARTMENT = buildDomain('apartment', APARTMENT_TEMPLATES, 'south_bias');

export const LAYOUT_PRESETS: LayoutPreset[] = [
  ...RESIDENTIAL,
  ...SHOP,
  ...TOMB,
  ...VILLA,
  ...RURAL,
  ...OFFICE,
  ...APARTMENT,
];

export const DOMAIN_LABELS: Record<LayoutDomain, string> = {
  residential: '阳宅',
  shop: '商铺',
  tomb: '阴宅',
  villa: '别墅',
  rural: '农村宅基地',
  office: '办公楼',
  apartment: '公寓楼',
};

export function listPresets(domain?: LayoutDomain): LayoutPreset[] {
  const list = domain ? LAYOUT_PRESETS.filter((p) => p.domain === domain) : LAYOUT_PRESETS;
  return [...list].sort((a, b) => b.popularity - a.popularity || a.areaSqm - b.areaSqm);
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
    list = list.filter(
      (p) =>
        p.layout.includes(layout) ||
        p.title.includes(layout) ||
        p.tags.some((t) => t.includes(layout)),
    );
  }
  if (typeof params.areaSqm === 'number' && Number.isFinite(params.areaSqm)) {
    const a = params.areaSqm;
    list = list
      .filter((p) => a >= p.areaMin * 0.7 && a <= p.areaMax * 1.4)
      .sort((x, y) => Math.abs(x.areaSqm - a) - Math.abs(y.areaSqm - a));
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
  const target = clamp(areaSqm, preset.areaMin * 0.75, preset.areaMax * 1.5);
  const ratio = Math.sqrt(target / Math.max(0.5, preset.areaSqm));
  return {
    ...preset,
    areaSqm: Math.round(target * 10) / 10,
    room: {
      ...preset.room,
      widthM: round1(preset.room.widthM * ratio),
      depthM: round1(preset.room.depthM * ratio),
    },
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
    lights: p.lights.map((l, i) => ({ ...l, id: `${p.id}-light-${i}-${stamp}` })),
    structures: p.structures.map((s, i) => ({ ...s, id: `${p.id}-st-${i}-${stamp}` })),
    geo: state.geo,
    qimenEnabled: state.qimenEnabled !== false,
    activeDomain: p.domain,
    presetTitle: p.title,
    presetId: p.id,
  };
}

export const RESIDENTIAL_LAYOUT_OPTIONS = [
  '一室',
  '一室一厅',
  '两室一厅',
  '两室两厅',
  '三室一厅',
  '三室两厅',
  '三室两厅两卫',
  '四室两厅',
  '四室两厅两卫',
  '五室两厅',
  '复式',
];

export const SHOP_LAYOUT_OPTIONS = [
  '窄面宽深铺',
  '方铺',
  '角铺',
  '餐饮铺',
  '轻餐饮/咖啡',
  '美业小铺',
  '中岛档口',
  '市场档口',
  '双开间',
  '三开间',
  '底商',
  '前店后仓',
];

export const TOMB_LAYOUT_OPTIONS = [
  '单穴',
  '双穴并排',
  '双穴前后',
  '家族三穴',
  '家族多穴',
  '壁葬格',
  '塔葬',
  '草坪葬',
  '树葬',
  '海葬纪念',
  '艺术墓',
];

/** 统计信息，便于 UI 展示 */
export function presetCatalogStats() {
  return {
    total: LAYOUT_PRESETS.length,
    residential: listPresets('residential').length,
    shop: listPresets('shop').length,
    tomb: listPresets('tomb').length,
    villa: listPresets('villa').length,
    rural: listPresets('rural').length,
    office: listPresets('office').length,
    apartment: listPresets('apartment').length,
  };
}

export const VILLA_LAYOUT_OPTIONS = ['独栋别墅', '联排别墅', '叠拼别墅', '合院别墅', '山景别墅'];
export const RURAL_LAYOUT_OPTIONS = ['三合院', '单排正房', '两层自建', '四合院式', '新式小二楼'];
export const OFFICE_LAYOUT_OPTIONS = ['开放办公', '隔间办公', '角间高管', '会议层', 'SOHO'];
export const APARTMENT_LAYOUT_OPTIONS = [
  '公寓开间',
  '公寓一居',
  '公寓两居',
  '公寓三居',
  '塔楼标准层',
  '服务式公寓',
];
