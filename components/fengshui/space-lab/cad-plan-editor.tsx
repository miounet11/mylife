'use client';

/**
 * CAD-style floor plan editor — select / move / resize / add / delete / measure / undo
 * Designed like a light CAD for 户型 matching (not full AutoCAD).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SpaceLabState, SpaceVent } from '@/lib/fengshui/space';
import {
  applyResize,
  CAD_ROOM_KINDS,
  cloneZones,
  ensureFloorZones,
  hitTestHandle,
  hitTestZone,
  newRoomZone,
  recomputeZoneAreas,
  snapValue,
  snapZone,
  structuresFromZones,
  type CadTool,
  type ResizeHandle,
} from '@/lib/fengshui/space/cad-ops';
import {
  drawFurnitureIcon,
  drawPlanOverlay,
  drawPlanPaperBackground,
  heatmapColor,
  pickLayerGrid,
  simulateSpaceField,
  zoneFill,
  zoneStroke,
  type FloorZone,
  type FloorZoneKind,
} from '@/lib/fengshui/space';
import type { SpaceLabCopy } from '@/lib/i18n/space-lab-copy';

type Props = {
  state: SpaceLabState;
  onChange: (next: SpaceLabState) => void;
  copy: SpaceLabCopy;
  locale?: string;
  selectedVentId: string | null;
  onSelectVent: (id: string | null) => void;
};

const TOOL_ICONS: Record<CadTool, string> = {
  select: '↖',
  pan: '✋',
  'add-room': '▢',
  'add-vent-in': '●',
  'add-vent-out': '○',
  measure: '↔',
  delete: '⌫',
};

export function CadPlanEditor({
  state,
  onChange,
  copy,
  locale,
  selectedVentId,
  onSelectVent,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<CadTool>('select');
  const [addKind, setAddKind] = useState<FloorZoneKind>('bedroom');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState('选择房间拖动；角点缩放 · 网格吸附');
  const drag = useRef<{
    mode: 'move' | 'resize' | 'measure' | 'pan';
    id?: string;
    handle?: ResizeHandle;
    startX: number;
    startY: number;
    orig?: FloorZone;
    measureTo?: { x: number; y: number };
    panOx?: number;
    panOy?: number;
  } | null>(null);
  const history = useRef<FloorZone[][]>([]);
  const future = useRef<FloorZone[][]>([]);
  const [measure, setMeasure] = useState<{
    a: { x: number; y: number };
    b: { x: number; y: number };
  } | null>(null);
  const [tick, setTick] = useState(0);

  const zones = ensureFloorZones(state);
  const snap = state.cadSnap ?? 0.02;
  const result = simulateSpaceField(state);

  const pushHistory = useCallback(
    (z: FloorZone[]) => {
      history.current = [...history.current.slice(-39), cloneZones(z)];
      future.current = [];
    },
    [],
  );

  const commitZones = useCallback(
    (nextZones: FloorZone[], record = true) => {
      const widthM = state.room.widthM;
      const depthM = state.room.depthM;
      const z = recomputeZoneAreas(nextZones, widthM, depthM);
      if (record) pushHistory(zones);
      const structs = structuresFromZones(z);
      const stamp = Date.now();
      onChange({
        ...state,
        floorZones: z,
        structures: structs.map((s, i) => ({
          ...s,
          id: `cad-st-${i}-${stamp}`,
        })),
      });
      setTick((t) => t + 1);
    },
    [onChange, pushHistory, state, zones],
  );

  const undo = () => {
    const prev = history.current.pop();
    if (!prev) return;
    future.current.push(cloneZones(zones));
    onChange({
      ...state,
      floorZones: prev,
      structures: structuresFromZones(prev).map((s, i) => ({
        ...s,
        id: `cad-st-${i}`,
      })),
    });
    setTick((t) => t + 1);
  };

  const redo = () => {
    const n = future.current.pop();
    if (!n) return;
    history.current.push(cloneZones(zones));
    onChange({
      ...state,
      floorZones: n,
      structures: structuresFromZones(n).map((s, i) => ({
        ...s,
        id: `cad-st-${i}`,
      })),
    });
    setTick((t) => t + 1);
  };

  // seed CAD zones when empty
  useEffect(() => {
    if (!state.floorZones || state.floorZones.length === 0) {
      const z = ensureFloorZones({ ...state, floorZones: null });
      const widthM = state.room.widthM;
      const depthM = state.room.depthM;
      const next = recomputeZoneAreas(z, widthM, depthM);
      const structs = structuresFromZones(next);
      onChange({
        ...state,
        floorZones: next,
        structures: structs.map((s, i) => ({ ...s, id: `cad-seed-${i}` })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.presetId, state.activeDomain]);

  const layout = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(320, Math.floor(rect.width));
    const H = Math.max(320, Math.floor(rect.height));
    const pad = 36;
    const size = Math.min(W, H) - pad * 2;
    const ox = (W - size) / 2;
    const oy = (H - size) / 2 - 4;
    return { W, H, pad, size, ox, oy, rect };
  }, []);

  const clientToNorm = (clientX: number, clientY: number) => {
    const L = layout();
    if (!L) return { x: 0.5, y: 0.5 };
    const x = (clientX - L.rect.left - L.ox) / L.size;
    const y = (clientY - L.rect.top - L.oy) / L.size;
    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    };
  };

  // paint
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const L = layout();
    if (!L) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = L.W * dpr;
    canvas.height = L.H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { W, H, size, ox, oy } = L;
    const paper = state.planPaperStyle !== false;
    if (paper) drawPlanPaperBackground(ctx, W, H, ox, oy, size);
    else {
      ctx.fillStyle = '#0f1218';
      ctx.fillRect(0, 0, W, H);
    }

    // underlay
    // zones
    const zlist = ensureFloorZones(state);
    for (const z of zlist) {
      const selected = z.id === selectedId;
      ctx.fillStyle = zoneFill(z.kind as FloorZoneKind);
      ctx.strokeStyle = selected ? '#2563eb' : zoneStroke();
      ctx.lineWidth = selected ? 2.5 : z.kind === 'balcony' ? 1 : 1.6;
      if (z.kind === 'balcony') ctx.setLineDash([4, 3]);
      ctx.fillRect(ox + z.x * size, oy + z.y * size, z.w * size, z.h * size);
      ctx.strokeRect(ox + z.x * size, oy + z.y * size, z.w * size, z.h * size);
      ctx.setLineDash([]);

      // dim lines when selected
      if (selected) {
        const px = ox + z.x * size;
        const py = oy + z.y * size;
        const pw = z.w * size;
        const ph = z.h * size;
        const wm = (z.w * state.room.widthM).toFixed(1);
        const dm = (z.h * state.room.depthM).toFixed(1);
        ctx.fillStyle = '#2563eb';
        ctx.font = 'bold 10px ui-sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${wm}m`, px + pw / 2, py - 6);
        ctx.save();
        ctx.translate(px - 8, py + ph / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${dm}m`, 0, 0);
        ctx.restore();
        // handles
        const hs = [
          [px, py],
          [px + pw, py],
          [px, py + ph],
          [px + pw, py + ph],
          [px + pw / 2, py],
          [px + pw / 2, py + ph],
          [px, py + ph / 2],
          [px + pw, py + ph / 2],
        ];
        for (const [hx, hy] of hs) {
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 1.5;
          ctx.fillRect(hx - 4, hy - 4, 8, 8);
          ctx.strokeRect(hx - 4, hy - 4, 8, 8);
        }
      }

      const cx = ox + (z.x + z.w / 2) * size;
      const cy = oy + (z.y + z.h / 2) * size;
      if (state.showFurniture !== false && z.furniture?.length) {
        z.furniture.forEach((f, fi) => {
          const dx = (fi - (z.furniture!.length - 1) / 2) * 18;
          drawFurnitureIcon(ctx, f as 'bed', cx + dx, cy + 8, 0.9);
        });
      }
      if (state.showRoomLabels !== false) {
        const name =
          z.label ||
          (copy.plan as Record<string, string>)[z.kind] ||
          z.kind;
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 11px ui-sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name, cx, cy - (z.areaSqm && state.showRoomAreas !== false ? 6 : 0));
        if (state.showRoomAreas !== false && z.areaSqm) {
          ctx.font = '10px ui-sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText(`${z.areaSqm}㎡`, cx, cy + 8);
        }
      }
    }

    // soft field heat
    const layer = pickLayerGrid(result.grids, state.activeLayer);
    const gw = result.grids.width;
    const gh = result.grids.height;
    const cell = size / gw;
    for (let y = 0; y < gh; y += 2) {
      for (let x = 0; x < gw; x += 2) {
        const v = layer[y * gw + x];
        if (v < 0.12) continue;
        const [r, g, b, a] = heatmapColor(v, 70);
        ctx.fillStyle = `rgba(${r},${g},${b},${(a / 255) * 0.3})`;
        ctx.fillRect(ox + x * cell, oy + y * cell, cell * 2, cell * 2);
      }
    }

    // vents
    for (const v of state.vents) {
      const px = ox + v.x * size;
      const py = oy + v.y * size;
      ctx.beginPath();
      ctx.arc(px, py, selectedVentId === v.id ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = v.kind === 'inlet' ? '#16a34a' : '#0284c7';
      ctx.fill();
      if (selectedVentId === v.id) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // overlay bagua etc.
    drawPlanOverlay({
      ctx,
      ox,
      oy,
      size,
      mode: state.planOverlayMode || 'none',
      entranceFacing: state.room.entranceFacing,
      paperStyle: paper,
    });

    ctx.strokeStyle = 'rgba(15,23,42,0.65)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(ox, oy, size, size);

    // measure
    if (measure) {
      const ax = ox + measure.a.x * size;
      const ay = oy + measure.a.y * size;
      const bx = ox + measure.b.x * size;
      const by = oy + measure.b.y * size;
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      const dx = (measure.b.x - measure.a.x) * state.room.widthM;
      const dy = (measure.b.y - measure.a.y) * state.room.depthM;
      const dist = Math.sqrt(dx * dx + dy * dy);
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 11px ui-sans-serif';
      ctx.fillText(`${dist.toFixed(2)} m`, (ax + bx) / 2, (ay + by) / 2 - 6);
    }

    // grid snap hint
    ctx.fillStyle = 'rgba(15,23,42,0.45)';
    ctx.font = '10px ui-sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      `CAD · snap ${(snap * 100).toFixed(0)}% · ${state.room.widthM.toFixed(1)}×${state.room.depthM.toFixed(1)}m · ${tool}`,
      ox,
      oy + size + 16,
    );
  }, [state, zones, selectedId, measure, tool, tick, result, copy, snap, layout, selectedVentId]);

  const onPointerDown = (e: React.PointerEvent) => {
    const n = clientToNorm(e.clientX, e.clientY);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    if (tool === 'measure') {
      drag.current = { mode: 'measure', startX: n.x, startY: n.y };
      setMeasure({ a: n, b: n });
      setStatus('拖动测量距离');
      return;
    }

    if (tool === 'add-room') {
      const z = newRoomZone(addKind, { x: n.x - 0.1, y: n.y - 0.1 }, snap);
      commitZones([...zones, z]);
      setSelectedId(z.id);
      setTool('select');
      setStatus('已添加房间 · 可拖动角点调整');
      return;
    }

    if (tool === 'add-vent-in' || tool === 'add-vent-out') {
      const id = `vent-${Date.now()}`;
      const vent: SpaceVent = {
        id,
        kind: tool === 'add-vent-in' ? 'inlet' : 'outlet',
        x: snapValue(n.x, snap),
        y: snapValue(n.y, snap),
        azimuthDeg: tool === 'add-vent-in' ? 90 : 270,
        spreadDeg: 90,
        speed: 40,
        intensity: 2,
        halfLifeSec: 12,
        enabled: true,
      };
      onChange({ ...state, vents: [...state.vents, vent] });
      onSelectVent(id);
      setTool('select');
      setStatus('已添加门窗/风口');
      return;
    }

    if (tool === 'delete') {
      const hit = hitTestZone(zones, n.x, n.y);
      if (hit) {
        commitZones(zones.filter((z) => z.id !== hit.id));
        setSelectedId(null);
        setStatus('已删除房间');
      }
      return;
    }

    // select / resize / move
    const hit = hitTestZone(zones, n.x, n.y);
    if (hit) {
      setSelectedId(hit.id);
      onSelectVent(null);
      const handle = hitTestHandle(hit, n.x, n.y);
      if (handle) {
        drag.current = {
          mode: 'resize',
          id: hit.id,
          handle,
          startX: n.x,
          startY: n.y,
          orig: { ...hit },
        };
      } else {
        drag.current = {
          mode: 'move',
          id: hit.id,
          startX: n.x,
          startY: n.y,
          orig: { ...hit },
        };
      }
    } else {
      setSelectedId(null);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const n = clientToNorm(e.clientX, e.clientY);
    const d = drag.current;
    if (!d) return;

    if (d.mode === 'measure') {
      setMeasure({ a: { x: d.startX, y: d.startY }, b: n });
      return;
    }

    if (!d.id || !d.orig) return;
    const idx = zones.findIndex((z) => z.id === d.id);
    if (idx < 0) return;
    const next = [...zones];

    if (d.mode === 'move') {
      const dx = n.x - d.startX;
      const dy = n.y - d.startY;
      const moved = snapZone(
        {
          x: d.orig.x + dx,
          y: d.orig.y + dy,
          w: d.orig.w,
          h: d.orig.h,
        },
        snap,
      );
      next[idx] = { ...d.orig, ...moved };
      // live preview without history spam
      onChange({
        ...state,
        floorZones: recomputeZoneAreas(next, state.room.widthM, state.room.depthM),
      });
      setTick((t) => t + 1);
    } else if (d.mode === 'resize' && d.handle) {
      const resized = applyResize(d.orig, d.handle, n.x, n.y, snap);
      next[idx] = resized;
      onChange({
        ...state,
        floorZones: recomputeZoneAreas(next, state.room.widthM, state.room.depthM),
      });
      setTick((t) => t + 1);
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (d && (d.mode === 'move' || d.mode === 'resize') && d.id) {
      // commit with history
      const z = ensureFloorZones(state);
      pushHistory(zones);
      const structs = structuresFromZones(z);
      onChange({
        ...state,
        floorZones: recomputeZoneAreas(z, state.room.widthM, state.room.depthM),
        structures: structs.map((s, i) => ({ ...s, id: `cad-st-${i}-${Date.now()}` })),
      });
      setStatus('已更新 · 3D/场模拟已同步');
    }
    if (d?.mode === 'measure') {
      setStatus('测量完成');
    }
    drag.current = null;
  };

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          commitZones(zones.filter((z) => z.id !== selectedId));
          setSelectedId(null);
        }
      }
      if (e.key === 'v' || e.key === 'V') setTool('select');
      if (e.key === 'm' || e.key === 'M') setTool('measure');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const tools: { id: CadTool; label: string }[] = [
    { id: 'select', label: '选择' },
    { id: 'add-room', label: '加房间' },
    { id: 'add-vent-in', label: '门/进风' },
    { id: 'add-vent-out', label: '窗/出风' },
    { id: 'measure', label: '测量' },
    { id: 'delete', label: '删除' },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* CAD ribbon */}
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-[color:var(--hairline)] bg-[color:var(--paper)] px-2 py-1">
        {tools.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.label}
            onClick={() => {
              setTool(t.id);
              setStatus(
                t.id === 'select'
                  ? '选择 · 拖动移动 · 角点缩放'
                  : t.id === 'add-room'
                    ? `点击平面添加「${addKind}」`
                    : t.id === 'measure'
                      ? '拖动画线测量'
                      : t.id === 'delete'
                        ? '点击房间删除'
                        : '点击平面放置',
              );
            }}
            className={`rounded px-2 py-1 text-[10px] font-semibold ${
              tool === t.id
                ? 'bg-[color:var(--ink-1)] text-white'
                : 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)] hover:bg-[color:var(--hairline)]'
            }`}
          >
            <span className="mr-0.5 opacity-70">{TOOL_ICONS[t.id]}</span>
            {t.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-[color:var(--hairline)]" />
        <select
          value={addKind}
          onChange={(e) => {
            setAddKind(e.target.value as FloorZoneKind);
            setTool('add-room');
          }}
          className="fb-input h-7 max-w-[7rem] px-1 text-[10px]"
          title="房间类型"
        >
          {CAD_ROOM_KINDS.map((k) => (
            <option key={k} value={k}>
              {(copy.plan as Record<string, string>)[k] || k}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={undo}
          className="rounded border border-[color:var(--hairline)] px-2 py-1 text-[10px] font-semibold"
        >
          撤销
        </button>
        <button
          type="button"
          onClick={redo}
          className="rounded border border-[color:var(--hairline)] px-2 py-1 text-[10px] font-semibold"
        >
          重做
        </button>
        <label className="ml-1 flex items-center gap-1 text-[9px] text-[color:var(--ink-5)]">
          吸附
          <select
            value={String(snap)}
            onChange={(e) =>
              onChange({ ...state, cadSnap: Number(e.target.value) || 0.02 })
            }
            className="fb-input h-6 px-1 text-[10px]"
          >
            <option value="0.01">1%</option>
            <option value="0.02">2%</option>
            <option value="0.05">5%</option>
            <option value="0">关</option>
          </select>
        </label>
        <span className="ml-auto truncate text-[9px] text-[color:var(--ink-5)]">{status}</span>
      </div>

      <canvas
        ref={canvasRef}
        className="min-h-0 w-full flex-1 cursor-crosshair"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
