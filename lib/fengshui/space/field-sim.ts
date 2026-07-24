/**
 * 空间结构场近似模拟
 * - 非 CFD；用距离衰减 + 扇形注入 + 简易扩散
 * - 墙/体块为衰减体，门窗为源/汇
 */

import type {
  FieldGrids,
  SpaceFieldSummary,
  SpaceLabState,
  SpaceSimResult,
  SpaceStructure,
  SpaceVent,
} from './types';
import {
  entranceElementCn,
  hourToDizhi,
  moonPhaseLabel,
  resolveNineStar,
  sunAzimuthDeg,
} from './compass-time';
import { analyzeQimenSpace, qimenGridFromReading } from './qimen-analysis';

function degToRad(d: number) {
  return (d * Math.PI) / 180;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function angleDiffDeg(a: number, b: number) {
  let d = ((a - b + 540) % 360) - 180;
  return Math.abs(d);
}

function idx(x: number, y: number, w: number) {
  return y * w + x;
}

function applyBlockers(
  grid: Float32Array,
  w: number,
  h: number,
  structures: SpaceStructure[],
) {
  for (const s of structures) {
    const x0 = Math.floor(clamp01(s.x) * (w - 1));
    const y0 = Math.floor(clamp01(s.y) * (h - 1));
    const bw = Math.max(1, Math.floor(s.w * w));
    const bh = Math.max(1, Math.floor(s.h * h));
    const damp = 1 - clamp01(s.block);
    for (let y = y0; y < Math.min(h, y0 + bh); y++) {
      for (let x = x0; x < Math.min(w, x0 + bw); x++) {
        grid[idx(x, y, w)] *= damp;
      }
    }
  }
}

function injectVent(
  energy: Float32Array,
  wind: Float32Array,
  w: number,
  h: number,
  vent: SpaceVent,
  roomAspect: number,
) {
  if (!vent.enabled) return;
  const cx = clamp01(vent.x) * (w - 1);
  const cy = clamp01(vent.y) * (h - 1);
  const sign = vent.kind === 'outlet' ? -0.65 : 1;
  const reach = 0.12 + vent.speed * 0.01;
  const rCells = Math.max(4, Math.floor(reach * Math.max(w, h)));
  const half = vent.spreadDeg / 2;
  const intensity = vent.intensity * (0.5 + Math.min(1, vent.halfLifeSec / 20));

  for (let dy = -rCells; dy <= rCells; dy++) {
    for (let dx = -rCells; dx <= rCells; dx++) {
      const x = Math.round(cx + dx);
      const y = Math.round(cy + dy);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const dist = Math.hypot(dx / w, (dy / h) * roomAspect);
      if (dist > reach) continue;
      // azimuth: 0 east, 90 north-screen is up (-y)
      const ang = (Math.atan2(-dy, dx) * 180) / Math.PI;
      const ad = angleDiffDeg(ang, vent.azimuthDeg);
      if (ad > half) continue;
      const fall = Math.exp(-dist / (reach * 0.45));
      const cone = 1 - ad / half;
      const v = intensity * fall * cone * sign;
      const i = idx(x, y, w);
      energy[i] += Math.abs(v) * (vent.kind === 'outlet' ? 0.35 : 1);
      wind[i] += Math.abs(v) * (0.6 + vent.speed / 80);
    }
  }
}

function injectLight(
  light: Float32Array,
  w: number,
  h: number,
  lx: number,
  ly: number,
  azimuth: number,
  intensity: number,
) {
  const cx = clamp01(lx) * (w - 1);
  const cy = clamp01(ly) * (h - 1);
  const rCells = Math.floor(0.45 * Math.max(w, h));
  for (let dy = -rCells; dy <= rCells; dy++) {
    for (let dx = -rCells; dx <= rCells; dx++) {
      const x = Math.round(cx + dx);
      const y = Math.round(cy + dy);
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const dist = Math.hypot(dx / w, dy / h);
      if (dist > 0.55) continue;
      const ang = (Math.atan2(-dy, dx) * 180) / Math.PI;
      const ad = angleDiffDeg(ang, azimuth);
      const beam = ad < 70 ? 1 - ad / 70 : 0.15;
      const fall = Math.exp(-dist * 3.2);
      light[idx(x, y, w)] += intensity * fall * beam;
    }
  }
}

function diffuse(grid: Float32Array, w: number, h: number, steps: number, rate: number) {
  const a = new Float32Array(grid);
  const b = new Float32Array(grid.length);
  let useA = true;
  for (let s = 0; s < steps; s++) {
    const src = useA ? a : b;
    const dst = useA ? b : a;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = idx(x, y, w);
        const c = src[i];
        const l = x > 0 ? src[i - 1] : c;
        const r = x < w - 1 ? src[i + 1] : c;
        const u = y > 0 ? src[i - w] : c;
        const d = y < h - 1 ? src[i + w] : c;
        dst[i] = c * (1 - rate) + ((l + r + u + d) / 4) * rate;
      }
    }
    useA = !useA;
  }
  grid.set(useA ? a : b);
}

function normalizePositive(grid: Float32Array) {
  let max = 0;
  for (let i = 0; i < grid.length; i++) max = Math.max(max, grid[i]);
  if (max <= 1e-6) return;
  for (let i = 0; i < grid.length; i++) grid[i] = grid[i] / max;
}

function nineStarField(
  w: number,
  h: number,
  bias: number,
  entranceFacing: string,
): Float32Array {
  const g = new Float32Array(w * h);
  // 3x3 palace weights, center slightly higher/lower by bias
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = Math.min(2, Math.floor((x / w) * 3));
      const py = Math.min(2, Math.floor((y / h) * 3));
      const palace = py * 3 + px;
      // SE wealth-ish boost for demo structural layer when facing south-ish
      let m = 0.75 + (palace % 3) * 0.08 + Math.floor(palace / 3) * 0.05;
      if (palace === 8) m *= 1.1;
      if (palace === 0) m *= 0.9;
      if (entranceFacing.includes('南') && palace >= 6) m *= 1.08;
      g[idx(x, y, w)] = m * bias;
    }
  }
  normalizePositive(g);
  return g;
}

function summarize(
  energy: Float32Array,
  wind: Float32Array,
  light: Float32Array,
  nine: Float32Array,
  state: SpaceLabState,
): SpaceFieldSummary {
  let peak = 0;
  let sum = 0;
  let stagnant = 0;
  let draft = 0;
  let lightSum = 0;
  let nineSum = 0;
  const n = energy.length;
  for (let i = 0; i < n; i++) {
    peak = Math.max(peak, energy[i]);
    sum += energy[i];
    if (energy[i] < 0.18 && wind[i] < 0.15) stagnant++;
    if (wind[i] > 0.72) draft++;
    lightSum += light[i];
    nineSum += nine[i];
  }
  const avg = sum / n;
  const stagnationRatio = stagnant / n;
  const draftCorridor = draft / n;
  const lightBalance = 1 - Math.min(1, Math.abs(lightSum / n - 0.45) * 2);
  const nineStarBias = nineSum / n;

  const structuralNotes: string[] = [];
  const priorityActions: string[] = [];

  structuralNotes.push(
    `室内场峰值 ${(peak * 100).toFixed(0)}，均值 ${(avg * 100).toFixed(0)}（相对归一化，非实测）。`,
  );
  if (stagnationRatio > 0.22) {
    structuralNotes.push(
      `约 ${(stagnationRatio * 100).toFixed(0)}% 区域同时呈现低能量与低风速，易形成滞留区（边角/体块背风侧）。`,
    );
    priorityActions.push('在滞留区增加回风口或降低过高体块遮挡，优先打通主通道。');
  }
  if (draftCorridor > 0.12) {
    structuralNotes.push(
      `存在明显高速通道（约 ${(draftCorridor * 100).toFixed(0)}% 格点），门窗对穿时气流停留时间偏短。`,
    );
    priorityActions.push('对冲门窗之间加软隔断或货架/屏风，拉长路径、降低直冲。');
  }
  if (lightBalance < 0.55) {
    structuralNotes.push('采光层分布不均：一侧过曝、一侧偏暗时，作业面舒适度与展示面对比会失衡。');
    priorityActions.push('补侧向漫射光源，或调整落地窗遮阳，使作业区照度更均匀。');
  }
  if (state.time.nineStarEnabled) {
    structuralNotes.push(
      `九星示意层已叠加（教学倍率），主入口朝向「${state.room.entranceFacing}」对应五行「${entranceElementCn(state.room.entranceFacing)}」。`,
    );
  }
  if (state.vents.filter((v) => v.enabled).length === 0) {
    structuralNotes.push('当前未启用风口：场由采光与九宫层主导，可添加进/出风口观察通道变化。');
    priorityActions.push('至少放置 1 个进风口（门）与 1 个出风口（窗/回风），再看热力。');
  }
  if (priorityActions.length === 0) {
    priorityActions.push('维持主通道畅通，避免高体块正对入户形成遮挡。');
    priorityActions.push('用时辰滑块对比午间与傍晚采光层，核对真实窗向是否一致。');
  }

  return {
    peakEnergy: peak,
    avgEnergy: avg,
    stagnationRatio,
    draftCorridor,
    lightBalance,
    nineStarBias,
    structuralNotes,
    priorityActions: priorityActions.slice(0, 4),
  };
}

export function createDefaultLabState(): SpaceLabState {
  const now = new Date();
  return {
    room: {
      widthM: 8,
      depthM: 6,
      heightM: 2.8,
      entranceFacing: '南',
      planRotationDeg: 0,
    },
    vents: [
      {
        id: 'vent-in-1',
        kind: 'inlet',
        x: 0.5,
        y: 0.92,
        azimuthDeg: 90,
        spreadDeg: 96,
        speed: 42,
        intensity: 2.4,
        halfLifeSec: 14,
        enabled: true,
      },
      {
        id: 'vent-out-1',
        kind: 'outlet',
        x: 0.5,
        y: 0.08,
        azimuthDeg: 270,
        spreadDeg: 80,
        speed: 36,
        intensity: 1.8,
        halfLifeSec: 12,
        enabled: true,
      },
    ],
    lights: [
      {
        id: 'sun-1',
        x: 0.5,
        y: 0.85,
        azimuthDeg: 240,
        intensity: 1.2,
        followSun: true,
        label: '南侧落地窗采光',
        enabled: true,
      },
    ],
    structures: [
      { id: 's1', kind: 'box', x: 0.15, y: 0.35, w: 0.18, h: 0.22, block: 0.55 },
      { id: 's2', kind: 'column', x: 0.72, y: 0.4, w: 0.1, h: 0.1, block: 0.7 },
    ],
    time: {
      hour: now.getHours(),
      minute: now.getMinutes(),
      followClock: false,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      nineStarEnabled: true,
      tideBoost: 0.75,
    },
    activeLayer: 'energy',
    showCompass: true,
    showNinePalace: true,
    underlayDataUrl: null,
    underlayOpacity: 0.35,
    gridSize: 64,
    geo: null,
    qimenEnabled: true,
    activeDomain: 'residential',
    proMode: true,
    presetTitle: null,
    presetId: null,
  };
}

export function simulateSpaceField(state: SpaceLabState): SpaceSimResult {
  const w = state.gridSize;
  const h = state.gridSize;
  const energy = new Float32Array(w * h);
  const wind = new Float32Array(w * h);
  const light = new Float32Array(w * h);
  const aspect = state.room.depthM / Math.max(0.1, state.room.widthM);

  let hour = state.time.hour;
  let minute = state.time.minute;
  if (state.time.followClock) {
    const n = new Date();
    hour = n.getHours();
    minute = n.getMinutes();
  }

  const sunAz = sunAzimuthDeg(hour, minute);
  const star = resolveNineStar(state.time.year, hour);
  const tide = 0.85 + state.time.tideBoost * 0.2;

  for (const vent of state.vents) {
    injectVent(energy, wind, w, h, vent, aspect);
  }

  // ambient base
  for (let i = 0; i < energy.length; i++) {
    energy[i] = energy[i] * tide + 0.08;
    wind[i] = wind[i] * 0.9 + 0.05;
  }

  for (const L of state.lights) {
    if (!L.enabled) continue;
    const az = L.followSun ? sunAz : L.azimuthDeg;
    injectLight(light, w, h, L.x, L.y, az, L.intensity);
  }

  applyBlockers(energy, w, h, state.structures);
  applyBlockers(wind, w, h, state.structures);
  applyBlockers(light, w, h, state.structures);

  diffuse(energy, w, h, 10, 0.35);
  diffuse(wind, w, h, 8, 0.4);
  diffuse(light, w, h, 6, 0.3);

  normalizePositive(energy);
  normalizePositive(wind);
  normalizePositive(light);

  const nine = state.time.nineStarEnabled
    ? nineStarField(w, h, star.bias * tide, state.room.entranceFacing)
    : new Float32Array(w * h);

  // blend nine-star softly into energy for active display
  if (state.time.nineStarEnabled) {
    for (let i = 0; i < energy.length; i++) {
      energy[i] = clamp01(energy[i] * 0.82 + nine[i] * 0.18);
    }
  }

  const qimenReading =
    state.qimenEnabled !== false
      ? analyzeQimenSpace(state.time, state.room.entranceFacing)
      : null;
  const qimen =
    qimenReading != null ? qimenGridFromReading(qimenReading, w, h) : new Float32Array(w * h);

  if (qimenReading && state.qimenEnabled !== false) {
    for (let i = 0; i < energy.length; i++) {
      energy[i] = clamp01(energy[i] * 0.88 + qimen[i] * 0.12);
    }
  }

  const grids: FieldGrids = {
    energy,
    wind,
    light,
    nineStar: nine,
    qimen,
    width: w,
    height: h,
  };
  const summary = summarize(energy, wind, light, nine, state);
  if (qimenReading) {
    summary.structuralNotes = [
      ...summary.structuralNotes.slice(0, 3),
      ...qimenReading.summaryNotes.slice(0, 2),
    ];
    summary.priorityActions = [
      ...qimenReading.actions.slice(0, 2),
      ...summary.priorityActions,
    ].slice(0, 5);
  }

  return {
    grids,
    summary,
    qimen: qimenReading,
    meta: {
      dizhiHour: hourToDizhi(hour),
      sunAzimuthDeg: sunAz,
      moonPhaseLabel: moonPhaseLabel(state.time.day),
      nineStarLabel: state.time.nineStarEnabled ? star.name : '关闭',
      entranceElement: entranceElementCn(state.room.entranceFacing),
      geoAddress: state.geo?.address || null,
    },
  };
}

/** Map 0-1 value to heatmap RGBA */
export function heatmapColor(t: number, alpha = 220): [number, number, number, number] {
  const v = clamp01(t);
  // blue → cyan → green → yellow → red
  let r = 0;
  let g = 0;
  let b = 0;
  if (v < 0.25) {
    const k = v / 0.25;
    r = 20;
    g = Math.floor(40 + 180 * k);
    b = Math.floor(200 - 40 * k);
  } else if (v < 0.5) {
    const k = (v - 0.25) / 0.25;
    r = Math.floor(40 + 80 * k);
    g = Math.floor(220 - 20 * k);
    b = Math.floor(160 - 120 * k);
  } else if (v < 0.75) {
    const k = (v - 0.5) / 0.25;
    r = Math.floor(120 + 100 * k);
    g = Math.floor(200 - 40 * k);
    b = Math.floor(40 - 20 * k);
  } else {
    const k = (v - 0.75) / 0.25;
    r = Math.floor(220 + 35 * k);
    g = Math.floor(160 - 120 * k);
    b = 20;
  }
  return [r, g, b, alpha];
}

export function pickLayerGrid(grids: FieldGrids, layer: SpaceLabState['activeLayer']): Float32Array {
  switch (layer) {
    case 'wind':
      return grids.wind;
    case 'light':
      return grids.light;
    case 'nineStar':
      return grids.nineStar;
    case 'qimen':
      return grids.qimen;
    default:
      return grids.energy;
  }
}
