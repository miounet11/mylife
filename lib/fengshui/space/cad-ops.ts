/**
 * CAD 户型编辑运算：吸附、面积、结构同步、撤销栈辅助
 */

import type { FloorZone, FloorZoneKind } from './floor-plan-style';
import { buildFloorPlanStyle } from './floor-plan-style';
import type { SpaceLabState, SpaceStructure } from './types';

export type CadTool =
  | 'select'
  | 'pan'
  | 'add-room'
  | 'add-vent-in'
  | 'add-vent-out'
  | 'measure'
  | 'delete';

export const CAD_ROOM_KINDS: FloorZoneKind[] = [
  'living',
  'bedroom',
  'bath',
  'kitchen',
  'balcony',
  'corridor',
  'storage',
  'shop',
  'office',
  'yard',
];

export function snapValue(v: number, step: number): number {
  if (!step || step <= 0) return v;
  return Math.round(v / step) * step;
}

export function snapZone(
  z: Pick<FloorZone, 'x' | 'y' | 'w' | 'h'>,
  step: number,
): Pick<FloorZone, 'x' | 'y' | 'w' | 'h'> {
  const x = snapValue(z.x, step);
  const y = snapValue(z.y, step);
  let w = Math.max(step * 2, snapValue(z.w, step));
  let h = Math.max(step * 2, snapValue(z.h, step));
  // keep inside 0..1
  w = Math.min(w, 1 - x);
  h = Math.min(h, 1 - y);
  return {
    x: clamp01(x),
    y: clamp01(y),
    w: Math.max(step, w),
    h: Math.max(step, h),
  };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export function zoneAreaSqm(z: FloorZone, widthM: number, depthM: number): number {
  return Math.round(z.w * widthM * z.h * depthM * 10) / 10;
}

export function recomputeZoneAreas(
  zones: FloorZone[],
  widthM: number,
  depthM: number,
): FloorZone[] {
  return zones.map((z) => ({
    ...z,
    areaSqm: zoneAreaSqm(z, widthM, depthM),
  }));
}

/** 从 CAD 分区生成场模拟用 structures（墙体/体块近似） */
export function structuresFromZones(zones: FloorZone[]): Omit<SpaceStructure, 'id'>[] {
  return zones
    .filter((z) => z.kind !== 'corridor' && z.kind !== 'balcony')
    .map((z) => ({
      kind: 'box' as const,
      x: z.x,
      y: z.y,
      w: z.w,
      h: z.h,
      block:
        z.kind === 'bath' || z.kind === 'storage'
          ? 0.55
          : z.kind === 'bedroom'
            ? 0.4
            : z.kind === 'kitchen'
              ? 0.35
              : 0.25,
    }));
}

export function ensureFloorZones(state: SpaceLabState): FloorZone[] {
  if (state.floorZones && state.floorZones.length > 0) {
    return state.floorZones.map((z) => ({
      id: z.id,
      kind: (z.kind as FloorZoneKind) || 'other',
      x: z.x,
      y: z.y,
      w: z.w,
      h: z.h,
      labelKey: (z.labelKey as FloorZoneKind) || (z.kind as FloorZoneKind) || 'other',
      label: z.label,
      areaSqm: z.areaSqm,
      furniture: z.furniture as FloorZone['furniture'],
    }));
  }
  const area = Math.max(20, state.room.widthM * state.room.depthM);
  return buildFloorPlanStyle({
    domain: state.activeDomain || 'residential',
    layout: state.layoutLabel || state.presetTitle || '',
    areaSqm: area,
  }).zones;
}

export function newRoomZone(
  kind: FloorZoneKind,
  at?: { x: number; y: number },
  snap = 0.02,
): FloorZone {
  const defaults: Record<FloorZoneKind, { w: number; h: number }> = {
    living: { w: 0.35, h: 0.35 },
    bedroom: { w: 0.22, h: 0.28 },
    bath: { w: 0.14, h: 0.14 },
    kitchen: { w: 0.18, h: 0.2 },
    balcony: { w: 0.3, h: 0.1 },
    corridor: { w: 0.12, h: 0.2 },
    storage: { w: 0.12, h: 0.12 },
    shop: { w: 0.4, h: 0.35 },
    office: { w: 0.3, h: 0.3 },
    yard: { w: 0.4, h: 0.3 },
    other: { w: 0.2, h: 0.2 },
  };
  const d = defaults[kind] || defaults.other;
  const furniture: FloorZone['furniture'] =
    kind === 'bedroom'
      ? ['bed']
      : kind === 'living'
        ? ['sofa', 'table']
        : kind === 'bath'
          ? ['toilet', 'sink']
          : kind === 'kitchen'
            ? ['stove', 'sink']
            : kind === 'office'
              ? ['desk']
              : [];
  const raw = {
    x: at?.x ?? 0.35,
    y: at?.y ?? 0.35,
    w: d.w,
    h: d.h,
  };
  const s = snapZone(raw, snap);
  return {
    id: `zone-${kind}-${Date.now().toString(36)}`,
    kind,
    ...s,
    labelKey: kind,
    furniture,
  };
}

export function hitTestZone(
  zones: FloorZone[],
  nx: number,
  ny: number,
): FloorZone | null {
  // top-most last drawn = reverse
  for (let i = zones.length - 1; i >= 0; i--) {
    const z = zones[i];
    if (nx >= z.x && nx <= z.x + z.w && ny >= z.y && ny <= z.y + z.h) return z;
  }
  return null;
}

export type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export function hitTestHandle(
  z: FloorZone,
  nx: number,
  ny: number,
  tol = 0.025,
): ResizeHandle | null {
  const x0 = z.x;
  const y0 = z.y;
  const x1 = z.x + z.w;
  const y1 = z.y + z.h;
  const near = (a: number, b: number) => Math.abs(a - b) <= tol;
  const inX = nx >= x0 - tol && nx <= x1 + tol;
  const inY = ny >= y0 - tol && ny <= y1 + tol;
  if (!inX || !inY) return null;
  if (near(nx, x0) && near(ny, y0)) return 'nw';
  if (near(nx, x1) && near(ny, y0)) return 'ne';
  if (near(nx, x0) && near(ny, y1)) return 'sw';
  if (near(nx, x1) && near(ny, y1)) return 'se';
  if (near(ny, y0) && nx > x0 && nx < x1) return 'n';
  if (near(ny, y1) && nx > x0 && nx < x1) return 's';
  if (near(nx, x0) && ny > y0 && ny < y1) return 'w';
  if (near(nx, x1) && ny > y0 && ny < y1) return 'e';
  return null;
}

export function applyResize(
  z: FloorZone,
  handle: ResizeHandle,
  nx: number,
  ny: number,
  snap: number,
): FloorZone {
  let { x, y, w, h } = z;
  const x1 = x + w;
  const y1 = y + h;
  if (handle.includes('w')) {
    const nx2 = Math.min(nx, x1 - snap * 2);
    w = x1 - nx2;
    x = nx2;
  }
  if (handle.includes('e')) {
    w = Math.max(snap * 2, nx - x);
  }
  if (handle.includes('n')) {
    const ny2 = Math.min(ny, y1 - snap * 2);
    h = y1 - ny2;
    y = ny2;
  }
  if (handle.includes('s')) {
    h = Math.max(snap * 2, ny - y);
  }
  const s = snapZone({ x, y, w, h }, snap);
  return { ...z, ...s };
}

export type CadHistoryEntry = {
  zones: FloorZone[];
  widthM: number;
  depthM: number;
};

export function cloneZones(zones: FloorZone[]): FloorZone[] {
  return zones.map((z) => ({ ...z, furniture: z.furniture ? [...z.furniture] : undefined }));
}
