'use client';

import { useEffect, useRef } from 'react';
import type { FieldGrids, SpaceLabState, SpaceSimResult } from '@/lib/fengshui/space';
import {
  buildFloorPlanStyle,
  drawFurnitureIcon,
  drawPlanOverlay,
  drawPlanPaperBackground,
  heatmapColor,
  pickLayerGrid,
  zoneFill,
  zoneStroke,
} from '@/lib/fengshui/space';
import type { SpaceLabCopy } from '@/lib/i18n/space-lab-copy';

type Props = {
  state: SpaceLabState;
  result: SpaceSimResult;
  selectedVentId: string | null;
  onSelectVent: (id: string | null) => void;
  onMoveVent: (id: string, x: number, y: number) => void;
  viewMode: 'plan' | 'iso';
  copy?: SpaceLabCopy;
  locale?: string;
};

function labelForKind(kind: string, copy?: SpaceLabCopy): string {
  if (!copy) {
    const zh: Record<string, string> = {
      living: '客厅',
      bedroom: '卧室',
      bath: '卫生间',
      kitchen: '厨房',
      balcony: '阳台',
      corridor: '过道',
      storage: '储物',
      shop: '营业区',
      office: '办公',
      yard: '院落',
      other: '空间',
    };
    return zh[kind] || kind;
  }
  const m = copy.plan as Record<string, string>;
  return m[kind] || kind;
}

function rotateNorm(x: number, y: number, deg: number) {
  const a = ((deg - 0) * Math.PI) / 180;
  // rotate around 0.5,0.5 — deg is planRotation where 0 = north up
  const cx = x - 0.5;
  const cy = y - 0.5;
  // screen: +x right, +y down; north rotation clockwise for building
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return {
    x: 0.5 + cx * cos - cy * sin,
    y: 0.5 + cx * sin + cy * cos,
  };
}

function drawIsoRoom(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  grids: FieldGrids,
  layer: Float32Array,
  state: SpaceLabState,
  copy?: SpaceLabCopy,
) {
  ctx.clearRect(0, 0, W, H);
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
  const rot = state.room.planRotationDeg || 0;

  const project = (nx: number, ny: number, nz: number) => {
    const r = rotateNorm(nx, ny, rot);
    const x = (r.x - 0.5) * scale * 1.4;
    const y = (r.y - 0.5) * scale * 1.1;
    const z = nz * scale * 0.35;
    return {
      x: ox + (x - y) * Math.cos(Math.PI / 6),
      y: oy + (x + y) * Math.sin(Math.PI / 6) - z,
    };
  };

  const step = 2;
  for (let gy = 0; gy < gh - step; gy += step) {
    for (let gx = 0; gx < gw - step; gx += step) {
      const v = layer[gy * gw + gx];
      const [r, g, b, a] = heatmapColor(v, 160);
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
      ctx.fillStyle = `rgba(${r},${g},${b},${(a / 255) * 0.65})`;
      ctx.fill();
    }
  }

  // floor plate
  const corners = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  ctx.strokeStyle = 'rgba(40,45,55,0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const [x0, y0] = corners[i];
    const [x1, y1] = corners[(i + 1) % 4];
    const b0 = project(x0, y0, 0);
    const b1 = project(x1, y1, 0);
    const t0 = project(x0, y0, 0.45);
    const t1 = project(x1, y1, 0.45);
    ctx.beginPath();
    ctx.moveTo(b0.x, b0.y);
    ctx.lineTo(b1.x, b1.y);
    ctx.lineTo(t1.x, t1.y);
    ctx.lineTo(t0.x, t0.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fill();
    ctx.stroke();
  }

  // iso compass
  drawHudCompass(ctx, 48, 48, state.room.planRotationDeg || 0, state.room.entranceFacing, copy);

  ctx.fillStyle = 'rgba(30,30,30,0.6)';
  ctx.font = '11px ui-sans-serif, system-ui';
  ctx.textAlign = 'left';
  ctx.fillText(
    `${copy?.views.iso || '等距'} · ${state.room.entranceFacing} · rot ${Math.round(state.room.planRotationDeg || 0)}°`,
    16,
    H - 16,
  );
}

function drawHudCompass(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  planRot: number,
  entrance: string,
  copy?: SpaceLabCopy,
) {
  const r = 22;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(15,23,42,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.translate(cx, cy);
  ctx.rotate((planRot * Math.PI) / 180);
  ctx.beginPath();
  ctx.moveTo(0, -r + 4);
  ctx.lineTo(-4, 4);
  ctx.lineTo(4, 4);
  ctx.closePath();
  ctx.fillStyle = '#dc2626';
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 9px ui-sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(copy?.compass.north || 'N', cx, cy - r - 4);
  ctx.fillStyle = '#0f172a';
  ctx.font = '8px ui-sans-serif';
  ctx.fillText(entrance, cx, cy + r + 10);
}

export function SpaceViewport({
  state,
  result,
  selectedVentId,
  onSelectVent,
  onMoveVent,
  viewMode,
  copy,
  locale,
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
    const areaSqm = Math.max(12, state.room.widthM * state.room.depthM);
    const floor = buildFloorPlanStyle({
      domain: state.activeDomain || 'residential',
      layout: state.layoutLabel || state.presetTitle || '',
      areaSqm,
      locale,
    });
    const rot = state.room.planRotationDeg || 0;

    const paintPlan = (underlay?: HTMLImageElement | null) => {
      if (cancelled) return;
      ctx.clearRect(0, 0, W, H);

      const pad = 40;
      const size = Math.min(W, H) - pad * 2;
      const ox = (W - size) / 2;
      const oy = (H - size) / 2 - 6;
      const paper = state.planPaperStyle !== false;
      const overlayMode = state.planOverlayMode || 'none';

      if (paper) {
        drawPlanPaperBackground(ctx, W, H, ox, oy, size);
      } else {
        ctx.fillStyle = '#0f1218';
        ctx.fillRect(0, 0, W, H);
      }

      if (underlay) {
        ctx.save();
        ctx.translate(ox + size / 2, oy + size / 2);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.globalAlpha = state.underlayOpacity;
        ctx.drawImage(underlay, -size / 2, -size / 2, size, size);
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // Real-estate floor zones (售楼处彩平)
      if (!underlay || state.underlayOpacity < 0.85) {
        for (const z of floor.zones) {
          const corners = [
            rotateNorm(z.x, z.y, rot),
            rotateNorm(z.x + z.w, z.y, rot),
            rotateNorm(z.x + z.w, z.y + z.h, rot),
            rotateNorm(z.x, z.y + z.h, rot),
          ];
          ctx.beginPath();
          corners.forEach((c, i) => {
            const px = ox + c.x * size;
            const py = oy + c.y * size;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          });
          ctx.closePath();
          ctx.fillStyle = zoneFill(z.kind);
          ctx.fill();
          ctx.strokeStyle = zoneStroke();
          ctx.lineWidth = z.kind === 'balcony' ? 1 : 1.8;
          if (z.kind === 'balcony') ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);

          const c = rotateNorm(z.x + z.w / 2, z.y + z.h / 2, rot);
          const cx = ox + c.x * size;
          const cy = oy + c.y * size;

          if (state.showFurniture !== false && z.furniture?.length) {
            const sc = Math.min(z.w, z.h) * size * 0.035;
            z.furniture.forEach((f, fi) => {
              const dx = (fi - (z.furniture!.length - 1) / 2) * 16 * Math.max(0.8, sc / 8);
              drawFurnitureIcon(ctx, f, cx + dx, cy + 6, Math.max(0.7, Math.min(1.2, sc / 10)));
            });
          }

          if (state.showRoomLabels !== false) {
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 11px ui-sans-serif, system-ui';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const name = labelForKind(z.labelKey, copy);
            ctx.fillText(name, cx, cy - (state.showRoomAreas !== false && z.areaSqm ? 7 : 0));
            if (state.showRoomAreas !== false && z.areaSqm) {
              ctx.font = '10px ui-sans-serif, system-ui';
              ctx.fillStyle = '#64748b';
              ctx.fillText(`${z.areaSqm}㎡`, cx, cy + 8);
            }
          }
        }
      }

      // soft heat overlay
      const heatAlpha = paper ? 70 : 160;
      const gw = result.grids.width;
      const gh = result.grids.height;
      const cell = size / gw;
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const v = layer[y * gw + x];
          if (v < 0.08) continue;
          const [r, g, b, a] = heatmapColor(v, heatAlpha);
          const p = rotateNorm((x + 0.5) / gw, (y + 0.5) / gh, rot);
          ctx.fillStyle = `rgba(${r},${g},${b},${(a / 255) * 0.35})`;
          ctx.fillRect(ox + p.x * size - cell / 2, oy + p.y * size - cell / 2, cell + 0.5, cell + 0.5);
        }
      }

      ctx.strokeStyle = paper ? 'rgba(15,23,42,0.65)' : 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(ox, oy, size, size);

      if (state.showNinePalace && overlayMode !== 'bagua9') {
        ctx.strokeStyle = paper ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.15)';
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

      drawPlanOverlay({
        ctx,
        ox,
        oy,
        size,
        mode: overlayMode,
        entranceFacing: state.room.entranceFacing,
        paperStyle: paper,
      });

      for (const v of state.vents) {
        const p = rotateNorm(v.x, v.y, rot);
        const px = ox + p.x * size;
        const py = oy + p.y * size;
        ctx.beginPath();
        ctx.arc(px, py, selectedVentId === v.id ? 9 : 6, 0, Math.PI * 2);
        ctx.fillStyle = v.enabled
          ? v.kind === 'inlet'
            ? '#16a34a'
            : '#0284c7'
          : 'rgba(150,150,150,0.5)';
        ctx.fill();
      }

      if (state.showCompass) {
        drawHudCompass(ctx, ox + 26, oy + 26, rot, state.room.entranceFacing, copy);
      }

      ctx.fillStyle = paper ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.75)';
      ctx.font = '11px ui-sans-serif, system-ui';
      ctx.textAlign = 'left';
      const entranceLabel = copy?.compass.entrance || '入口';
      ctx.fillText(
        `${entranceLabel} ${state.room.entranceFacing} · ${Math.round(areaSqm)}㎡ · ${layerLabel(state.activeLayer, copy)}`,
        ox,
        oy + size + 16,
      );
      ctx.font = '10px ui-sans-serif, system-ui';
      ctx.fillStyle = paper ? 'rgba(15,23,42,0.45)' : 'rgba(255,255,255,0.45)';
      ctx.fillText(copy?.plan.overlayHint || copy?.disclaimer || '', ox, oy + size + 30);
    };

    if (viewMode === 'iso') {
      drawIsoRoom(ctx, W, H, result.grids, layer, state, copy);
      return () => {
        cancelled = true;
      };
    }

    if (state.underlayDataUrl) {
      const img = new Image();
      img.onload = () => paintPlan(img);
      img.onerror = () => paintPlan(null);
      img.src = state.underlayDataUrl;
      paintPlan(null);
    } else {
      paintPlan(null);
    }

    return () => {
      cancelled = true;
    };
  }, [state, result, selectedVentId, viewMode, copy, locale]);

  const toNorm = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const pad = 40;
    const size = Math.min(W, H) - pad * 2;
    const ox = (W - size) / 2;
    const oy = (H - size) / 2 - 6;
    const x = (clientX - rect.left - ox) / size;
    const y = (clientY - rect.top - oy) / size;
    // inverse rotate
    const rot = -((state.room.planRotationDeg || 0) * Math.PI) / 180;
    const cx = x - 0.5;
    const cy = y - 0.5;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    return {
      x: Math.max(0.02, Math.min(0.98, 0.5 + cx * cos - cy * sin)),
      y: Math.max(0.02, Math.min(0.98, 0.5 + cx * sin + cy * cos)),
    };
  };

  const hitVent = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const W = rect.width;
    const H = rect.height;
    const pad = 40;
    const size = Math.min(W, H) - pad * 2;
    const ox = (W - size) / 2;
    const oy = (H - size) / 2 - 6;
    const rot = state.room.planRotationDeg || 0;
    for (const v of state.vents) {
      const p = rotateNorm(v.x, v.y, rot);
      const px = ox + p.x * size;
      const py = oy + p.y * size;
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

function layerLabel(l: SpaceLabState['activeLayer'], copy?: SpaceLabCopy) {
  if (copy?.layers?.[l]) return copy.layers[l];
  switch (l) {
    case 'wind':
      return '风速';
    case 'light':
      return '采光';
    case 'nineStar':
      return '九星';
    case 'qimen':
      return '奇门';
    default:
      return '能量';
  }
}
