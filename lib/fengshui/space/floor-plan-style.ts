/**
 * 售楼处风格户型分区 — 参考常见户型彩平（客餐厅浅黄、卧室木色、卫浴浅灰）
 */

export type FloorZoneKind =
  | 'living'
  | 'bedroom'
  | 'bath'
  | 'kitchen'
  | 'balcony'
  | 'corridor'
  | 'storage'
  | 'shop'
  | 'office'
  | 'yard'
  | 'other';

export type FloorZone = {
  id: string;
  kind: FloorZoneKind;
  /** 0–1 normalized in plan space (before rotation) */
  x: number;
  y: number;
  w: number;
  h: number;
  labelKey: FloorZoneKind;
  /** optional fixed label override */
  label?: string;
  areaSqm?: number;
  /** furniture glyphs */
  furniture?: Array<'bed' | 'sofa' | 'table' | 'toilet' | 'sink' | 'stove' | 'desk'>;
};

export type FloorPlanStyle = {
  zones: FloorZone[];
  /** total area for labels */
  totalAreaSqm: number;
};

const FILL: Record<FloorZoneKind, string> = {
  living: '#f5e6b8',
  bedroom: '#f0d9a8',
  bath: '#e8eef5',
  kitchen: '#efe8dc',
  balcony: '#f7f3e8',
  corridor: '#f3efe6',
  storage: '#ebe4d8',
  shop: '#f5f0e6',
  office: '#e8eef5',
  yard: '#dce8d0',
  other: '#f0ebe3',
};

const STROKE = 'rgba(40,45,55,0.55)';

export function zoneFill(kind: FloorZoneKind): string {
  return FILL[kind] || FILL.other;
}

export function zoneStroke(): string {
  return STROKE;
}

/**
 * Build a readable real-estate style floor plan from domain + layout keywords.
 */
export function buildFloorPlanStyle(input: {
  domain: string;
  layout?: string;
  areaSqm: number;
  locale?: string;
}): FloorPlanStyle {
  const area = Math.max(20, input.areaSqm || 90);
  const layout = input.layout || '';
  const domain = input.domain || 'residential';

  if (domain === 'shop') {
    return {
      totalAreaSqm: area,
      zones: [
        zone('front', 'shop', 0.08, 0.55, 0.84, 0.38, area * 0.55, ['table']),
        zone('back', 'storage', 0.12, 0.08, 0.76, 0.4, area * 0.35, []),
        zone('door', 'corridor', 0.35, 0.88, 0.3, 0.08, area * 0.05, []),
      ],
    };
  }
  if (domain === 'office') {
    return {
      totalAreaSqm: area,
      zones: [
        zone('open', 'office', 0.08, 0.12, 0.55, 0.76, area * 0.55, ['desk', 'desk']),
        zone('meet', 'living', 0.68, 0.12, 0.24, 0.35, area * 0.2, ['table']),
        zone('core', 'corridor', 0.68, 0.52, 0.24, 0.36, area * 0.15, []),
      ],
    };
  }
  if (domain === 'tomb') {
    return {
      totalAreaSqm: area,
      zones: [
        zone('plot', 'yard', 0.1, 0.1, 0.8, 0.8, area, []),
        zone('altar', 'other', 0.35, 0.55, 0.3, 0.2, area * 0.15, []),
      ],
    };
  }
  if (domain === 'rural' || domain === 'villa') {
    return {
      totalAreaSqm: area,
      zones: [
        zone('yard', 'yard', 0.08, 0.55, 0.84, 0.35, area * 0.35, []),
        zone('main', 'living', 0.15, 0.12, 0.5, 0.38, area * 0.3, ['sofa', 'table']),
        zone('side', 'bedroom', 0.68, 0.12, 0.22, 0.38, area * 0.2, ['bed']),
      ],
    };
  }

  // residential / apartment — approximate 2–3 bed from layout string
  const beds = /五|5/.test(layout)
    ? 5
    : /四|4/.test(layout)
      ? 4
      : /三|3/.test(layout)
        ? 3
        : /两|二|2/.test(layout)
          ? 2
          : /一|1/.test(layout)
            ? 1
            : 3;

  const zones: FloorZone[] = [];
  // living center-right (like reference image)
  zones.push(
    zone('living', 'living', 0.28, 0.28, 0.42, 0.48, area * 0.32, ['sofa', 'table']),
  );
  // balcony top
  zones.push(zone('balA', 'balcony', 0.28, 0.06, 0.42, 0.18, area * 0.06, []));
  // kitchen top-right
  zones.push(zone('kit', 'kitchen', 0.72, 0.06, 0.22, 0.28, area * 0.08, ['stove', 'sink']));
  // corridor
  zones.push(zone('cor', 'corridor', 0.28, 0.22, 0.2, 0.08, area * 0.03, []));

  if (beds >= 1) {
    zones.push(zone('bedA', 'bedroom', 0.72, 0.4, 0.22, 0.32, area * 0.12, ['bed']));
  }
  if (beds >= 2) {
    zones.push(zone('bedB', 'bedroom', 0.06, 0.55, 0.2, 0.28, area * 0.14, ['bed']));
  }
  if (beds >= 3) {
    zones.push(zone('bedC', 'bedroom', 0.06, 0.12, 0.2, 0.28, area * 0.1, ['bed']));
  }
  // baths left mid
  zones.push(zone('bathA', 'bath', 0.06, 0.42, 0.2, 0.12, area * 0.04, ['toilet', 'sink']));
  if (beds >= 2) {
    zones.push(zone('bathB', 'bath', 0.06, 0.84, 0.2, 0.1, area * 0.035, ['toilet']));
  }
  // balcony bottom dashed style
  zones.push(zone('balB', 'balcony', 0.28, 0.82, 0.42, 0.12, area * 0.07, []));
  // storage
  zones.push(zone('sto', 'storage', 0.72, 0.74, 0.14, 0.12, area * 0.025, []));

  return { totalAreaSqm: area, zones };
}

function zone(
  id: string,
  kind: FloorZoneKind,
  x: number,
  y: number,
  w: number,
  h: number,
  areaSqm: number,
  furniture: FloorZone['furniture'],
): FloorZone {
  return {
    id,
    kind,
    x,
    y,
    w,
    h,
    labelKey: kind,
    areaSqm: Math.round(areaSqm * 10) / 10,
    furniture,
  };
}

/** Draw furniture icons inside a zone (canvas coords) */
export function drawFurnitureIcon(
  ctx: CanvasRenderingContext2D,
  type: NonNullable<FloorZone['furniture']>[number],
  cx: number,
  cy: number,
  scale: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.strokeStyle = 'rgba(40,45,55,0.55)';
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 1.2;
  if (type === 'bed') {
    ctx.fillRect(-14, -10, 28, 20);
    ctx.strokeRect(-14, -10, 28, 20);
    ctx.fillRect(-14, -10, 28, 6);
  } else if (type === 'sofa') {
    ctx.fillRect(-16, -6, 32, 14);
    ctx.strokeRect(-16, -6, 32, 14);
    ctx.strokeRect(-16, -10, 8, 6);
    ctx.strokeRect(8, -10, 8, 6);
  } else if (type === 'table') {
    ctx.beginPath();
    ctx.rect(-10, -10, 20, 20);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'toilet') {
    ctx.beginPath();
    ctx.ellipse(0, 2, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (type === 'sink' || type === 'stove') {
    ctx.fillRect(-8, -6, 16, 12);
    ctx.strokeRect(-8, -6, 16, 12);
  } else if (type === 'desk') {
    ctx.fillRect(-12, -6, 24, 12);
    ctx.strokeRect(-12, -6, 24, 12);
  }
  ctx.restore();
}
