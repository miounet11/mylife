'use client';

import { useEffect, useRef } from 'react';
import type { FieldGrids, SpaceLabState, SpaceSimResult } from '@/lib/fengshui/space';
import { heatmapColor, pickLayerGrid } from '@/lib/fengshui/space';

type Props = {
  state: SpaceLabState;
  result: SpaceSimResult;
  selectedVentId: string | null;
  onSelectVent: (id: string | null) => void;
  onMoveVent: (id: string, x: number, y: number) => void;
  viewMode: 'plan' | 'iso';
};

function drawIsoRoom(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  grids: FieldGrids,
  layer: Float32Array,
  state: SpaceLabState,
) {
  ctx.clearRect(0, 0, W, H);
  // background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#f4f1ea');
  bg.addColorStop(1, '#e8e4db');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const ox = W * 0.5;
  const oy = H * 0.62;
  const scale = Math.min(W, H) * 0.38;
  const gw = grids.width;
  const gh = grids.height;

  const project = (nx: number, ny: number, nz: number) => {
    // nx,ny 0-1 floor, nz height 0-1
    const x = (nx - 0.5) * scale * 1.4;
    const y = (ny - 0.5) * scale * 1.1;
    const z = nz * scale * 0.35;
    // isometric
    return {
      x: ox + (x - y) * Math.cos(Math.PI / 6),
      y: oy + (x + y) * Math.sin(Math.PI / 6) - z,
    };
  };

  // floor heat quads
  const step = 2;
  for (let gy = 0; gy < gh - step; gy += step) {
    for (let gx = 0; gx < gw - step; gx += step) {
      const v = layer[gy * gw + gx];
      const [r, g, b, a] = heatmapColor(v, 200);
      const n0 = { x: gx / gw, y: gy / gh };
      const n1 = { x: (gx + step) / gw, y: gy / gh };
      const n2 = { x: (gx + step) / gw, y: (gy + step) / gh };
      const n3 = { x: gx / gw, y: (gy + step) / gh };
      const p0 = project(n0.x, n0.y, 0);
      const p1 = project(n1.x, n1.y, 0);
      const p2 = project(n2.x, n2.y, 0);
      const p3 = project(n3.x, n3.y, 0);
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.closePath();
      ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
      ctx.fill();
    }
  }

  // walls
  const wallH = 0.55;
  const corners = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  ctx.strokeStyle = 'rgba(40,45,55,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const [x0, y0] = corners[i];
    const [x1, y1] = corners[(i + 1) % 4];
    const b0 = project(x0, y0, 0);
    const b1 = project(x1, y1, 0);
    const t0 = project(x0, y0, wallH);
    const t1 = project(x1, y1, wallH);
    ctx.beginPath();
    ctx.moveTo(b0.x, b0.y);
    ctx.lineTo(b1.x, b1.y);
    ctx.lineTo(t1.x, t1.y);
    ctx.lineTo(t0.x, t0.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
    ctx.stroke();
  }

  // structures as boxes
  for (const s of state.structures) {
    const p = project(s.x + s.w / 2, s.y + s.h / 2, 0.35);
    ctx.fillStyle = 'rgba(80,90,110,0.45)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, 14 * s.w * 8, 10 * s.h * 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // vents
  for (const v of state.vents) {
    if (!v.enabled) continue;
    const p = project(v.x, v.y, 0.05);
    ctx.fillStyle = v.kind === 'inlet' ? '#22c55e' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(30,30,30,0.55)';
  ctx.font = '12px ui-sans-serif, system-ui';
  ctx.fillText('立体示意 · 地面热力贴片（非扫描实测）', 16, 24);
}

export function SpaceViewport({
  state,
  result,
  selectedVentId,
  onSelectVent,
  onMoveVent,
  viewMode,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragId = useRef<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let cancelled = false;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(320, Math.floor(rect.width));
    const H = Math.max(320, Math.floor(rect.height));
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const layer = pickLayerGrid(result.grids, state.activeLayer);

    const paintPlan = (underlay?: HTMLImageElement | null) => {
      if (cancelled) return;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0f1218';
      ctx.fillRect(0, 0, W, H);

      const pad = 24;
      const size = Math.min(W, H) - pad * 2;
      const ox = (W - size) / 2;
      const oy = (H - size) / 2;

      if (underlay) {
        ctx.globalAlpha = state.underlayOpacity;
        ctx.drawImage(underlay, ox, oy, size, size);
        ctx.globalAlpha = 1;
      }

      const gw = result.grids.width;
      const gh = result.grids.height;
      const cell = size / gw;
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const v = layer[y * gw + x];
          const [r, g, b, a] = heatmapColor(v, underlay ? 160 : 230);
          ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
          ctx.fillRect(ox + x * cell, oy + y * cell, cell + 0.5, cell + 0.5);
        }
      }

      if (state.showNinePalace) {
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(ox + (size * i) / 3, oy);
          ctx.lineTo(ox + (size * i) / 3, oy + size);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(ox, oy + (size * i) / 3);
          ctx.lineTo(ox + size, oy + (size * i) / 3);
          ctx.stroke();
        }
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.strokeRect(ox, oy, size, size);

      for (const s of state.structures) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(ox + s.x * size, oy + s.y * size, s.w * size, s.h * size);
        ctx.strokeRect(ox + s.x * size, oy + s.y * size, s.w * size, s.h * size);
      }

      for (const v of state.vents) {
        const px = ox + v.x * size;
        const py = oy + v.y * size;
        ctx.beginPath();
        ctx.arc(px, py, selectedVentId === v.id ? 10 : 7, 0, Math.PI * 2);
        ctx.fillStyle = v.enabled
          ? v.kind === 'inlet'
            ? '#4ade80'
            : '#38bdf8'
          : 'rgba(150,150,150,0.5)';
        ctx.fill();
        if (selectedVentId === v.id) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        const rad = deg2rad(v.azimuthDeg);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(rad) * 28, py - Math.sin(rad) * 28);
        ctx.stroke();
      }

      for (const L of state.lights) {
        if (!L.enabled) continue;
        const px = ox + L.x * size;
        const py = oy + L.y * size;
        ctx.fillStyle = 'rgba(250,204,21,0.85)';
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px ui-sans-serif, system-ui';
      ctx.fillText(`主入口朝向 · ${state.room.entranceFacing}`, ox, oy + size + 18);
      ctx.fillText(
        `层：${layerLabel(state.activeLayer)} · ${result.meta.dizhiHour}时 · ${result.meta.nineStarLabel}`,
        ox,
        oy + size + 34,
      );
    };

    if (viewMode === 'iso') {
      drawIsoRoom(ctx, W, H, result.grids, layer, state);
      return () => {
        cancelled = true;
      };
    }

    if (state.underlayDataUrl) {
      const img = new Image();
      img.onload = () => paintPlan(img);
      img.onerror = () => paintPlan(null);
      img.src = state.underlayDataUrl;
      // paint once without image first
      paintPlan(null);
    } else {
      paintPlan(null);
    }

    return () => {
      cancelled = true;
    };
  }, [state, result, selectedVentId, viewMode]);

  const toNorm = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const pad = 24;
    const size = Math.min(W, H) - pad * 2;
    const ox = (W - size) / 2;
    const oy = (H - size) / 2;
    const x = (clientX - rect.left - ox) / size;
    const y = (clientY - rect.top - oy) / size;
    return {
      x: Math.max(0.02, Math.min(0.98, x)),
      y: Math.max(0.02, Math.min(0.98, y)),
    };
  };

  const hitVent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const pad = 24;
    const size = Math.min(W, H) - pad * 2;
    const ox = (W - size) / 2;
    const oy = (H - size) / 2;
    for (const v of state.vents) {
      const px = ox + v.x * size;
      const py = oy + v.y * size;
      const dx = clientX - rect.left - px;
      const dy = clientY - rect.top - py;
      if (dx * dx + dy * dy < 14 * 14) return v.id;
    }
    return null;
  };

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full cursor-crosshair rounded-[var(--radius)]"
      style={{ touchAction: 'none' }}
      onPointerDown={(e) => {
        if (viewMode !== 'plan') return;
        const id = hitVent(e.clientX, e.clientY);
        if (id) {
          dragId.current = id;
          onSelectVent(id);
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
        } else {
          onSelectVent(null);
        }
      }}
      onPointerMove={(e) => {
        if (viewMode !== 'plan' || !dragId.current) return;
        const n = toNorm(e.clientX, e.clientY);
        onMoveVent(dragId.current, n.x, n.y);
      }}
      onPointerUp={() => {
        dragId.current = null;
      }}
    />
  );
}

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}

function layerLabel(l: SpaceLabState['activeLayer']) {
  switch (l) {
    case 'wind':
      return '风速强度';
    case 'light':
      return '光波采光';
    case 'nineStar':
      return '九星旺衰';
    default:
      return '能量分布';
  }
}
