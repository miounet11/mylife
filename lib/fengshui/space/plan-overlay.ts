/**
 * 专业平面展示层 — 参考日式户型+方位叠图（八方位/二十四山/九宫/扇区/九星示意）
 * 结构示意用途，非断事吉凶结论。
 */

export type PlanOverlayMode =
  | 'none'
  | 'bagua8'
  | 'radial24'
  | 'bagua9'
  | 'sector'
  | 'flyingStar';

export const PLAN_OVERLAY_LABELS: Record<PlanOverlayMode, string> = {
  none: '无叠图',
  bagua8: '八方位',
  radial24: '二十四山',
  bagua9: '九宫格',
  sector: '扇区示意',
  flyingStar: '九星扇区',
};

/** 屏幕上方为北时的方位角（度，顺时针从北） */
const FACING_TO_BEARING: Record<string, number> = {
  北: 0,
  东北: 45,
  东: 90,
  东南: 135,
  南: 180,
  西南: 225,
  西: 270,
  西北: 315,
};

const EIGHT: Array<{ name: string; short: string; bearing: number; color: string }> = [
  { name: '北', short: '北', bearing: 0, color: '#0ea5e9' },
  { name: '东北', short: '东北', bearing: 45, color: '#22c55e' },
  { name: '东', short: '东', bearing: 90, color: '#84cc16' },
  { name: '东南', short: '东南', bearing: 135, color: '#eab308' },
  { name: '南', short: '南', bearing: 180, color: '#f97316' },
  { name: '西南', short: '西南', bearing: 225, color: '#ef4444' },
  { name: '西', short: '西', bearing: 270, color: '#a855f7' },
  { name: '西北', short: '西北', bearing: 315, color: '#6366f1' },
];

/** 二十四山（简化标签） */
const MOUNTAINS_24 = [
  '壬',
  '子',
  '癸',
  '丑',
  '艮',
  '寅',
  '甲',
  '卯',
  '乙',
  '辰',
  '巽',
  '巳',
  '丙',
  '午',
  '丁',
  '未',
  '坤',
  '申',
  '庚',
  '西',
  '辛',
  '戌',
  '乾',
  '亥',
];

/** 九星示意色（教学用） */
const NINE_STAR_COLORS = [
  { name: '一白', color: 'rgba(56,189,248,0.28)' },
  { name: '二黑', color: 'rgba(55,65,81,0.22)' },
  { name: '三碧', color: 'rgba(52,211,153,0.28)' },
  { name: '四绿', color: 'rgba(74,222,128,0.28)' },
  { name: '五黄', color: 'rgba(250,204,21,0.32)' },
  { name: '六白', color: 'rgba(226,232,240,0.35)' },
  { name: '七赤', color: 'rgba(248,113,113,0.28)' },
  { name: '八白', color: 'rgba(255,255,255,0.28)' },
  { name: '九紫', color: 'rgba(192,132,252,0.30)' },
];

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}

/** 方位角→画布向量：北向上，顺时针 */
function bearingToCanvas(bearingDeg: number, r: number) {
  const a = deg2rad(bearingDeg);
  return { x: Math.sin(a) * r, y: -Math.cos(a) * r };
}

export type PlanOverlayDrawOpts = {
  ctx: CanvasRenderingContext2D;
  ox: number;
  oy: number;
  size: number;
  mode: PlanOverlayMode;
  entranceFacing: string;
  /** paper style light plan like references */
  paperStyle?: boolean;
};

export function drawPlanPaperBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  ox: number,
  oy: number,
  size: number,
) {
  ctx.fillStyle = '#eef2e8';
  ctx.fillRect(0, 0, W, H);
  // light plot margin
  ctx.fillStyle = '#dce8d0';
  ctx.fillRect(ox - 12, oy - 12, size + 24, size + 24);
  ctx.fillStyle = '#f8f6f1';
  ctx.fillRect(ox, oy, size, size);
  // grid like CAD
  ctx.strokeStyle = 'rgba(100,120,90,0.08)';
  ctx.lineWidth = 1;
  const step = size / 16;
  for (let i = 1; i < 16; i++) {
    ctx.beginPath();
    ctx.moveTo(ox + i * step, oy);
    ctx.lineTo(ox + i * step, oy + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ox, oy + i * step);
    ctx.lineTo(ox + size, oy + i * step);
    ctx.stroke();
  }
}

export function drawPlanOverlay(opts: PlanOverlayDrawOpts) {
  const { ctx, ox, oy, size, mode, entranceFacing } = opts;
  if (mode === 'none') return;

  const cx = ox + size / 2;
  const cy = oy + size / 2;
  const R = size * 0.46;

  if (mode === 'bagua8') drawBagua8(ctx, cx, cy, R, entranceFacing);
  else if (mode === 'radial24') drawRadial24(ctx, cx, cy, R, entranceFacing);
  else if (mode === 'bagua9') drawBagua9(ctx, ox, oy, size, entranceFacing);
  else if (mode === 'sector') drawSector(ctx, cx, cy, R, entranceFacing);
  else if (mode === 'flyingStar') drawFlyingStar(ctx, cx, cy, R, entranceFacing);
}

function drawBagua8(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  entranceFacing: string,
) {
  // outer ring
  ctx.strokeStyle = 'rgba(30,40,50,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  // 8 rays
  for (let i = 0; i < 8; i++) {
    const b = i * 45 + 22.5;
    const p = bearingToCanvas(b, R);
    ctx.strokeStyle = 'rgba(40,50,60,0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + p.x, cy + p.y);
    ctx.stroke();
  }

  // direction badges
  for (const d of EIGHT) {
    const p = bearingToCanvas(d.bearing, R * 0.88);
    const x = cx + p.x;
    const y = cy + p.y;
    ctx.beginPath();
    ctx.arc(x, y, 14, 0, Math.PI * 2);
    ctx.fillStyle = d.color;
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px ui-sans-serif, system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.short, x, y);
  }

  // 鬼門 NE / SW markers
  drawGhostGates(ctx, cx, cy, R);

  // entrance arrow
  drawEntrance(ctx, cx, cy, R, entranceFacing);

  // center
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(15,23,42,0.75)';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '9px ui-sans-serif';
  ctx.fillText('中', cx, cy);
}

function drawRadial24(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  entranceFacing: string,
) {
  for (let i = 0; i < 24; i++) {
    const b = i * 15;
    const pOuter = bearingToCanvas(b, R);
    const pInner = bearingToCanvas(b, R * 0.12);
    const isCardinal = i % 3 === 0;
    ctx.strokeStyle = isCardinal ? 'rgba(220,38,38,0.55)' : 'rgba(37,99,235,0.45)';
    ctx.lineWidth = isCardinal ? 1.4 : 0.9;
    ctx.beginPath();
    ctx.moveTo(cx + pInner.x, cy + pInner.y);
    ctx.lineTo(cx + pOuter.x, cy + pOuter.y);
    ctx.stroke();

    const labelR = R * 1.06;
    const pl = bearingToCanvas(b, labelR);
    ctx.fillStyle = isCardinal ? '#b91c1c' : '#1d4ed8';
    ctx.font = isCardinal ? 'bold 10px ui-sans-serif' : '9px ui-sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(MOUNTAINS_24[i] || '', cx + pl.x, cy + pl.y);
  }

  ctx.strokeStyle = 'rgba(15,23,42,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();

  drawGhostGates(ctx, cx, cy, R);
  drawEntrance(ctx, cx, cy, R, entranceFacing);

  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
}

function drawBagua9(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  size: number,
  entranceFacing: string,
) {
  // 3x3 cells — 坐北朝南习惯：上北下南（与参考图入口在下一致时可旋转）
  // 我们标准：上北，入口标注在对应边
  const cells: Array<{ name: string; color: string; note: string }> = [
    { name: '西北\n财/贵', color: 'rgba(234,179,8,0.22)', note: '金' },
    { name: '北\n事业', color: 'rgba(14,165,233,0.22)', note: '水' },
    { name: '东北\n学业', color: 'rgba(34,197,94,0.22)', note: '土' },
    { name: '西\n人际', color: 'rgba(168,85,247,0.18)', note: '金' },
    { name: '中\n平衡', color: 'rgba(250,204,21,0.28)', note: '土' },
    { name: '东\n健康', color: 'rgba(132,204,22,0.22)', note: '木' },
    { name: '西南\n姻缘', color: 'rgba(244,63,94,0.18)', note: '土' },
    { name: '南\n名誉', color: 'rgba(249,115,22,0.22)', note: '火' },
    { name: '东南\n文昌', color: 'rgba(45,212,191,0.2)', note: '木' },
  ];
  // order row-major with top=N: NW N NE / W C E / SW S SE
  const order = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const cell = size / 3;
  for (let i = 0; i < 9; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const c = cells[order[i]];
    const x = ox + col * cell;
    const y = oy + row * cell;
    ctx.fillStyle = c.color;
    ctx.fillRect(x, y, cell, cell);
    ctx.strokeStyle = 'rgba(15,23,42,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cell, cell);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px ui-sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = c.name.split('\n');
    lines.forEach((line, li) => {
      ctx.fillText(line, x + cell / 2, y + cell / 2 + (li - (lines.length - 1) / 2) * 13);
    });
  }

  // entrance bar at facing edge
  const face = FACING_TO_BEARING[entranceFacing] ?? 180;
  ctx.fillStyle = '#f59e0b';
  if (face > 135 && face < 225) {
    // 南 — bottom
    ctx.fillRect(ox + size * 0.25, oy + size - 8, size * 0.5, 8);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px ui-sans-serif';
    ctx.fillText(`入口 · ${entranceFacing}`, ox + size / 2, oy + size - 18);
  } else if (face >= 45 && face <= 135) {
    ctx.fillRect(ox + size - 8, oy + size * 0.25, 8, size * 0.5);
  } else if (face > 225 && face < 315) {
    ctx.fillRect(ox, oy + size * 0.25, 8, size * 0.5);
  } else {
    ctx.fillRect(ox + size * 0.25, oy, size * 0.5, 8);
  }
}

function drawSector(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  entranceFacing: string,
) {
  // 8 wedges alternating cool/warm — like reference blue/red triangles
  for (let i = 0; i < 8; i++) {
    const start = deg2rad(i * 45 - 90);
    const end = deg2rad((i + 1) * 45 - 90);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, start, end);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? 'rgba(37,99,235,0.14)' : 'rgba(220,38,38,0.12)';
    ctx.fill();
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(37,99,235,0.45)' : 'rgba(220,38,38,0.4)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  for (const d of EIGHT) {
    const p = bearingToCanvas(d.bearing, R * 0.92);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px ui-sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.short, cx + p.x, cy + p.y);
  }

  drawGhostGates(ctx, cx, cy, R);
  drawEntrance(ctx, cx, cy, R, entranceFacing);
}

function drawFlyingStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  entranceFacing: string,
) {
  // 9 pie-ish sectors around — simplified teaching colors
  for (let i = 0; i < 9; i++) {
    const start = deg2rad(i * 40 - 90);
    const end = deg2rad((i + 1) * 40 - 90);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, start, end);
    ctx.closePath();
    ctx.fillStyle = NINE_STAR_COLORS[i].color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,23,42,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const mid = (i + 0.5) * 40;
    const p = bearingToCanvas(mid, R * 0.62);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px ui-sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(NINE_STAR_COLORS[i].name, cx + p.x, cy + p.y);
  }

  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(250,204,21,0.55)';
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px ui-sans-serif';
  ctx.fillText('中宫', cx, cy);

  drawEntrance(ctx, cx, cy, R, entranceFacing);
}

function drawGhostGates(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
  // 东北鬼門 / 西南裏鬼門
  for (const g of [
    { b: 45, label: '鬼門' },
    { b: 225, label: '裏鬼門' },
  ]) {
    const p = bearingToCanvas(g.b, R * 0.78);
    ctx.fillStyle = 'rgba(239,68,68,0.9)';
    ctx.font = 'bold 10px ui-sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.label, cx + p.x, cy + p.y);
    // ray
    const p0 = bearingToCanvas(g.b, R * 0.15);
    const p1 = bearingToCanvas(g.b, R * 1.02);
    ctx.strokeStyle = 'rgba(239,68,68,0.55)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(cx + p0.x, cy + p0.y);
    ctx.lineTo(cx + p1.x, cy + p1.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawEntrance(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  R: number,
  entranceFacing: string,
) {
  const b = FACING_TO_BEARING[entranceFacing] ?? 180;
  const p = bearingToCanvas(b, R * 1.08);
  ctx.fillStyle = '#ea580c';
  ctx.font = 'bold 11px ui-sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`入口·${entranceFacing}`, cx + p.x, cy + p.y);

  // arrow toward center from entrance side
  const outer = bearingToCanvas(b, R * 0.95);
  const inner = bearingToCanvas(b, R * 0.55);
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx + outer.x, cy + outer.y);
  ctx.lineTo(cx + inner.x, cy + inner.y);
  ctx.stroke();
}
