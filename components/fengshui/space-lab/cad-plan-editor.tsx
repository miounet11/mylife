'use client';

/**
 * 极简 CAD 房间块编辑
 *
 * 操作（零模式切换主路径）：
 * 1. 空白处拖矩形 → 创建房间
 * 2. 双击空白 → 放一个标准大小房间
 * 3. 点房间块 → 选中（蓝框 + 8 个缩放点）
 * 4. 拖块体 → 移动（自动对齐邻房边线）
 * 5. 拖蓝点 → 缩放
 * 6. 顶栏点类型 → 改已选房间类型 / 设下次创建类型
 * 7. Del 删块 · Ctrl+Z 撤销 · 方向键微调 · D 复制
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SpaceLabState, SpaceVent } from '@/lib/fengshui/space';
import {
  applyResize,
  bringZoneToFront,
  CAD_ROOM_KINDS,
  cloneZones,
  cursorForHandle,
  duplicateZone,
  ensureFloorZones,
  furnitureForKind,
  hitTestHandle,
  hitTestZone,
  newRoomZone,
  nudgeZone,
  recomputeZoneAreas,
  snapMoveToPeers,
  snapResizeToPeers,
  snapValue,
  snapZone,
  structuresFromZones,
  zoneFromDragRect,
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

/** 次要工具：不打断「画块/选块」主路径 */
type AuxTool = 'none' | 'measure' | 'door-in' | 'door-out';

type DragState =
  | { kind: 'draw'; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'move'; id: string; startX: number; startY: number; orig: FloorZone }
  | { kind: 'resize'; id: string; handle: ResizeHandle; orig: FloorZone }
  | { kind: 'measure'; x0: number; y0: number; x1: number; y1: number };

const FALLBACK_KIND: Record<string, string> = {
  shop: '商铺',
  office: '办公',
  yard: '庭院',
  other: '其他',
};

export function CadPlanEditor({
  state,
  onChange,
  copy,
  selectedVentId,
  onSelectVent,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aux, setAux] = useState<AuxTool>('none');
  const [drawKind, setDrawKind] = useState<FloorZoneKind>('bedroom');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverCursor, setHoverCursor] = useState('crosshair');
  const [hint, setHint] = useState('空白拖矩形建房 · 点块选中 · 拖块移动 · 拖蓝点缩放');
  const [tick, setTick] = useState(0);
  const drag = useRef<DragState | null>(null);
  const [rubber, setRubber] = useState<DragState | null>(null);
  const history = useRef<FloorZone[][]>([]);
  const future = useRef<FloorZone[][]>([]);
  const preDragZones = useRef<FloorZone[] | null>(null);
  const moved = useRef(false);
  const lastPointer = useRef({ x: 0.5, y: 0.5 });

  const zones = ensureFloorZones(state);
  const snap = state.cadSnap && state.cadSnap > 0 ? state.cadSnap : 0.02;
  const result = simulateSpaceField(state);

  const kindLabel = useCallback(
    (k: string) =>
      (copy.plan as Record<string, string>)[k] || FALLBACK_KIND[k] || k,
    [copy.plan],
  );

  const commitZones = useCallback(
    (next: FloorZone[], historyBefore: FloorZone[] | null) => {
      if (historyBefore) {
        history.current = [
          ...history.current.slice(-40),
          cloneZones(historyBefore),
        ];
        future.current = [];
      }
      const z = recomputeZoneAreas(next, state.room.widthM, state.room.depthM);
      const stamp = Date.now();
      onChange({
        ...state,
        floorZones: z,
        structures: structuresFromZones(z).map((s, i) => ({
          ...s,
          id: `cad-${i}-${stamp}`,
        })),
      });
      setTick((t) => t + 1);
    },
    [onChange, state],
  );

  const livePreview = useCallback(
    (next: FloorZone[]) => {
      onChange({
        ...state,
        floorZones: recomputeZoneAreas(next, state.room.widthM, state.room.depthM),
      });
      setTick((t) => t + 1);
    },
    [onChange, state],
  );

  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (!prev) return;
    future.current.push(cloneZones(zones));
    onChange({
      ...state,
      floorZones: prev,
      structures: structuresFromZones(prev).map((s, i) => ({ ...s, id: `u-${i}` })),
    });
    setSelectedId(null);
    setTick((t) => t + 1);
    setHint('已撤销');
  }, [onChange, state, zones]);

  const redo = useCallback(() => {
    const n = future.current.pop();
    if (!n) return;
    history.current.push(cloneZones(zones));
    onChange({
      ...state,
      floorZones: n,
      structures: structuresFromZones(n).map((s, i) => ({ ...s, id: `r-${i}` })),
    });
    setTick((t) => t + 1);
    setHint('已重做');
  }, [onChange, state, zones]);

  // 预设切换时种子化房间块
  useEffect(() => {
    if (!state.floorZones?.length) {
      const z = ensureFloorZones({ ...state, floorZones: null });
      const next = recomputeZoneAreas(z, state.room.widthM, state.room.depthM);
      onChange({
        ...state,
        floorZones: next,
        structures: structuresFromZones(next).map((s, i) => ({
          ...s,
          id: `seed-${i}`,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.presetId, state.activeDomain]);

  const layout = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(280, Math.floor(rect.width));
    const H = Math.max(280, Math.floor(rect.height));
    const pad = 28;
    const size = Math.min(W, H) - pad * 2;
    return {
      W,
      H,
      size,
      ox: (W - size) / 2,
      oy: (H - size) / 2 - 2,
      rect,
    };
  };

  const toNorm = (cx: number, cy: number) => {
    const L = layout();
    if (!L) return { x: 0.5, y: 0.5 };
    return {
      x: Math.max(0, Math.min(1, (cx - L.rect.left - L.ox) / L.size)),
      y: Math.max(0, Math.min(1, (cy - L.rect.top - L.oy) / L.size)),
    };
  };

  // —— paint ——
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
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, W, H);
    }

    const zlist = ensureFloorZones(state);
    const ghost =
      rubber?.kind === 'draw'
        ? zoneFromDragRect(drawKind, rubber.x0, rubber.y0, rubber.x1, rubber.y1, snap)
        : null;

    const drawBlock = (z: FloorZone, selected: boolean, ghosting = false) => {
      const px = ox + z.x * size;
      const py = oy + z.y * size;
      const pw = Math.max(2, z.w * size);
      const ph = Math.max(2, z.h * size);
      ctx.globalAlpha = ghosting ? 0.4 : 1;
      ctx.fillStyle = zoneFill(z.kind);
      ctx.fillRect(px, py, pw, ph);
      ctx.strokeStyle = selected ? '#2563eb' : zoneStroke();
      ctx.lineWidth = selected ? 2.8 : 1.5;
      if (z.kind === 'balcony') ctx.setLineDash([5, 3]);
      ctx.strokeRect(px, py, pw, ph);
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // 拖画 / 选中：实时尺寸
      if ((selected || ghosting) && pw > 28 && ph > 20) {
        const wm = (z.w * state.room.widthM).toFixed(1);
        const dm = (z.h * state.room.depthM).toFixed(1);
        const area =
          z.areaSqm ??
          Math.round(z.w * state.room.widthM * z.h * state.room.depthM * 10) / 10;
        ctx.fillStyle = selected || ghosting ? '#2563eb' : '#1e293b';
        ctx.font = 'bold 11px ui-sans-serif, system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${wm}×${dm}m · ${area}㎡`, px + pw / 2, py - 6);
      }

      if (selected && !ghosting) {
        const grips: [number, number][] = [
          [px, py],
          [px + pw, py],
          [px, py + ph],
          [px + pw, py + ph],
          [px + pw / 2, py],
          [px + pw / 2, py + ph],
          [px, py + ph / 2],
          [px + pw, py + ph / 2],
        ];
        for (const [hx, hy] of grips) {
          ctx.fillStyle = '#fff';
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(hx - 7, hy - 7, 14, 14, 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      const cx = px + pw / 2;
      const cy = py + ph / 2;
      if (!ghosting && state.showFurniture !== false && z.furniture?.length) {
        z.furniture.forEach((f, i) => {
          const dx = (i - (z.furniture!.length - 1) / 2) * 16;
          drawFurnitureIcon(ctx, f as 'bed', cx + dx, cy + 10, 0.85);
        });
      }
      if (state.showRoomLabels !== false && !ghosting) {
        const name = z.label || kindLabel(z.kind);
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 12px ui-sans-serif, system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, cx, cy - (state.showRoomAreas !== false ? 7 : 0));
        if (state.showRoomAreas !== false && z.areaSqm != null) {
          ctx.font = '10px ui-sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText(`${z.areaSqm}㎡`, cx, cy + 8);
        }
      }
    };

    // 选中块最后画，保证在最上
    for (const z of zlist) {
      if (z.id !== selectedId) drawBlock(z, false);
    }
    const sel = zlist.find((z) => z.id === selectedId);
    if (sel) drawBlock(sel, true);
    if (ghost) drawBlock(ghost, true, true);

    // 轻量热力
    const layer = pickLayerGrid(result.grids, state.activeLayer);
    const gw = result.grids.width;
    const cell = size / gw;
    for (let y = 0; y < result.grids.height; y += 2) {
      for (let x = 0; x < gw; x += 2) {
        const v = layer[y * gw + x];
        if (v < 0.15) continue;
        const [r, g, b, a] = heatmapColor(v, 60);
        ctx.fillStyle = `rgba(${r},${g},${b},${(a / 255) * 0.22})`;
        ctx.fillRect(ox + x * cell, oy + y * cell, cell * 2, cell * 2);
      }
    }

    for (const v of state.vents) {
      const px = ox + v.x * size;
      const py = oy + v.y * size;
      ctx.beginPath();
      ctx.arc(px, py, selectedVentId === v.id ? 9 : 7, 0, Math.PI * 2);
      ctx.fillStyle = v.kind === 'inlet' ? '#16a34a' : '#0284c7';
      ctx.fill();
    }

    drawPlanOverlay({
      ctx,
      ox,
      oy,
      size,
      mode: state.planOverlayMode || 'none',
      entranceFacing: state.room.entranceFacing,
      paperStyle: paper,
    });

    ctx.strokeStyle = 'rgba(15,23,42,0.7)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(ox, oy, size, size);

    if (rubber?.kind === 'measure') {
      const ax = ox + rubber.x0 * size;
      const ay = oy + rubber.y0 * size;
      const bx = ox + rubber.x1 * size;
      const by = oy + rubber.y1 * size;
      ctx.strokeStyle = '#7c3aed';
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      const dx = (rubber.x1 - rubber.x0) * state.room.widthM;
      const dy = (rubber.y1 - rubber.y0) * state.room.depthM;
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 12px ui-sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${Math.hypot(dx, dy).toFixed(2)} m`,
        (ax + bx) / 2,
        (ay + by) / 2 - 8,
      );
    }
  }, [
    state,
    selectedId,
    rubber,
    tick,
    result,
    snap,
    drawKind,
    selectedVentId,
    kindLabel,
  ]);

  const onPointerDown = (e: React.PointerEvent) => {
    const n = toNorm(e.clientX, e.clientY);
    lastPointer.current = n;
    moved.current = false;
    preDragZones.current = null;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (aux === 'measure') {
      drag.current = { kind: 'measure', x0: n.x, y0: n.y, x1: n.x, y1: n.y };
      setRubber(drag.current);
      return;
    }

    if (aux === 'door-in' || aux === 'door-out') {
      const id = `vent-${Date.now()}`;
      const vent: SpaceVent = {
        id,
        kind: aux === 'door-in' ? 'inlet' : 'outlet',
        x: snapValue(n.x, snap),
        y: snapValue(n.y, snap),
        azimuthDeg: aux === 'door-in' ? 90 : 270,
        spreadDeg: 90,
        speed: 40,
        intensity: 2,
        halfLifeSec: 12,
        enabled: true,
      };
      onChange({ ...state, vents: [...state.vents, vent] });
      onSelectVent(id);
      setAux('none');
      setHint('已放门窗 · 继续拖空白建房');
      return;
    }

    // 主路径：命中块 → 选中 / 缩放 / 移动
    // 先测选中块的 grip（更大容差）
    const selected = selectedId ? zones.find((z) => z.id === selectedId) : null;
    if (selected) {
      const handle = hitTestHandle(selected, n.x, n.y, 0.05);
      if (handle) {
        preDragZones.current = cloneZones(zones);
        drag.current = {
          kind: 'resize',
          id: selected.id,
          handle,
          orig: { ...selected },
        };
        setHint('拖动蓝点调整大小');
        return;
      }
    }

    const hit = hitTestZone(zones, n.x, n.y);
    if (hit) {
      const ordered = bringZoneToFront(zones, hit.id);
      if (ordered !== zones) {
        // 只改绘制顺序，不进历史
        onChange({ ...state, floorZones: ordered });
      }
      setSelectedId(hit.id);
      onSelectVent(null);
      const handle = hitTestHandle(hit, n.x, n.y, 0.05);
      preDragZones.current = cloneZones(zones);
      if (handle) {
        drag.current = { kind: 'resize', id: hit.id, handle, orig: { ...hit } };
        setHint('拖动蓝点调整大小');
      } else {
        drag.current = {
          kind: 'move',
          id: hit.id,
          startX: n.x,
          startY: n.y,
          orig: { ...hit },
        };
        setHint('拖动房间块移动 · 自动对齐邻边');
      }
      return;
    }

    // 空白 → CAD 拖矩形建房
    setSelectedId(null);
    drag.current = { kind: 'draw', x0: n.x, y0: n.y, x1: n.x, y1: n.y };
    setRubber(drag.current);
    setHint(`拖出「${kindLabel(drawKind)}」矩形，松开完成`);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const n = toNorm(e.clientX, e.clientY);
    lastPointer.current = n;
    const d = drag.current;

    // hover 光标
    if (!d && aux === 'none') {
      const sel = selectedId ? zones.find((z) => z.id === selectedId) : null;
      if (sel) {
        const h = hitTestHandle(sel, n.x, n.y, 0.05);
        if (h) {
          setHoverCursor(cursorForHandle(h));
          return;
        }
      }
      const hit = hitTestZone(zones, n.x, n.y);
      if (hit) {
        const h2 = hitTestHandle(hit, n.x, n.y, 0.05);
        setHoverCursor(h2 ? cursorForHandle(h2) : 'grab');
      } else {
        setHoverCursor('crosshair');
      }
    }

    if (!d) return;
    moved.current = true;

    if (d.kind === 'draw') {
      const next = { ...d, x1: n.x, y1: n.y };
      drag.current = next;
      setRubber(next);
      return;
    }
    if (d.kind === 'measure') {
      const next = { ...d, x1: n.x, y1: n.y };
      drag.current = next;
      setRubber(next);
      return;
    }
    if (d.kind === 'move') {
      const dx = n.x - d.startX;
      const dy = n.y - d.startY;
      const raw = {
        x: d.orig.x + dx,
        y: d.orig.y + dy,
        w: d.orig.w,
        h: d.orig.h,
      };
      const aligned = snapMoveToPeers(raw, zones, d.id, snap);
      livePreview(
        zones.map((z) => (z.id === d.id ? { ...d.orig, ...aligned } : z)),
      );
      setHoverCursor('grabbing');
      return;
    }
    if (d.kind === 'resize') {
      let resized = applyResize(d.orig, d.handle, n.x, n.y, snap);
      resized = snapResizeToPeers(resized, d.handle, zones);
      livePreview(zones.map((z) => (z.id === d.id ? resized : z)));
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    setRubber(null);

    if (!d) return;

    if (d.kind === 'draw') {
      const w = Math.abs(d.x1 - d.x0);
      const h = Math.abs(d.y1 - d.y0);
      if (w < 0.035 && h < 0.035) {
        setHint('按住拖出矩形创建房间 · 或双击空白放标准块');
        return;
      }
      const z = zoneFromDragRect(drawKind, d.x0, d.y0, d.x1, d.y1, snap);
      commitZones([...zones, z], cloneZones(zones));
      setSelectedId(z.id);
      setHint('已创建 · 拖蓝点调大小 · 点类型条改用途');
      return;
    }

    if (d.kind === 'measure') {
      const dx = (d.x1 - d.x0) * state.room.widthM;
      const dy = (d.y1 - d.y0) * state.room.depthM;
      setHint(`测量 ${Math.hypot(dx, dy).toFixed(2)} m`);
      setAux('none');
      return;
    }

    if ((d.kind === 'move' || d.kind === 'resize') && moved.current) {
      const before = preDragZones.current || zones;
      const current = ensureFloorZones(state);
      // state 已是 livePreview 后的位置；补 structures + 写历史
      commitZones(current, cloneZones(before));
      setHint('已更新 · 与 3D / 场模拟同步');
    }
    preDragZones.current = null;
  };

  /** 双击空白：放标准大小房间 */
  const onDoubleClick = (e: React.MouseEvent) => {
    const n = toNorm(e.clientX, e.clientY);
    if (hitTestZone(zones, n.x, n.y)) return;
    const z = newRoomZone(drawKind, { x: n.x - 0.1, y: n.y - 0.1 }, snap);
    // 中心落在双击点
    const centered = snapZone(
      { x: n.x - z.w / 2, y: n.y - z.h / 2, w: z.w, h: z.h },
      snap,
    );
    const room = { ...z, ...centered };
    commitZones([...zones, room], cloneZones(zones));
    setSelectedId(room.id);
    setHint(`已放「${kindLabel(drawKind)}」· 拖蓝点调大小`);
  };

  const changeSelectedKind = (kind: FloorZoneKind) => {
    setDrawKind(kind);
    if (!selectedId) {
      setHint(`下次创建：${kindLabel(kind)} · 空白拖矩形`);
      return;
    }
    commitZones(
      zones.map((z) =>
        z.id === selectedId
          ? {
              ...z,
              kind,
              labelKey: kind,
              furniture: furnitureForKind(kind),
              label: undefined,
            }
          : z,
      ),
      cloneZones(zones),
    );
    setHint(`已改为「${kindLabel(kind)}」`);
  };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    commitZones(
      zones.filter((z) => z.id !== selectedId),
      cloneZones(zones),
    );
    setSelectedId(null);
    setHint('已删除房间块');
  }, [selectedId, zones, commitZones]);

  const dupSelected = useCallback(() => {
    if (!selectedId) return;
    const src = zones.find((z) => z.id === selectedId);
    if (!src) return;
    const copyZ = duplicateZone(src, snap);
    commitZones([...zones, copyZ], cloneZones(zones));
    setSelectedId(copyZ.id);
    setHint('已复制房间块');
  }, [selectedId, zones, snap, commitZones]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        dupSelected();
        return;
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setAux('none');
        setRubber(null);
        drag.current = null;
        setHint('已取消选择');
        return;
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        deleteSelected();
        return;
      }
      if (selectedId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? snap * 2 : snap;
        const dx =
          e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy =
          e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        const src = zones.find((z) => z.id === selectedId);
        if (!src) return;
        commitZones(
          zones.map((z) => (z.id === selectedId ? nudgeZone(z, dx, dy, snap) : z)),
          cloneZones(zones),
        );
        setHint('方向键微调位置 · Shift 大步');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, deleteSelected, dupSelected, selectedId, zones, snap, commitZones]);

  const selectedKind = selectedId
    ? zones.find((z) => z.id === selectedId)?.kind
    : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#eef2e8]">
      {/* 极简工具条：类型 + 少量动作 */}
      <div className="flex shrink-0 flex-col gap-1 border-b border-[color:var(--hairline)] bg-white/95 px-2 py-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-0.5 text-[10px] font-bold text-slate-500">房间</span>
          {CAD_ROOM_KINDS.slice(0, 8).map((k) => {
            const active = selectedKind ? selectedKind === k : drawKind === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => changeSelectedKind(k)}
                className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                  active
                    ? 'bg-[#2563eb] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title={
                  selectedId
                    ? `改为${kindLabel(k)}`
                    : `创建类型：${kindLabel(k)}`
                }
              >
                {kindLabel(k)}
              </button>
            );
          })}
          <span className="mx-0.5 h-4 w-px bg-slate-200" />
          <button
            type="button"
            disabled={!selectedId}
            onClick={dupSelected}
            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold disabled:opacity-30"
            title="复制选中块 (Ctrl+D)"
          >
            复制
          </button>
          <button
            type="button"
            disabled={!selectedId}
            onClick={deleteSelected}
            className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-semibold text-red-700 disabled:opacity-30"
            title="删除 (Del)"
          >
            删除
          </button>
          <button
            type="button"
            onClick={undo}
            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold"
            title="Ctrl+Z"
          >
            撤销
          </button>
          <button
            type="button"
            onClick={redo}
            className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-semibold"
            title="Ctrl+Shift+Z"
          >
            重做
          </button>
          <span className="mx-0.5 h-4 w-px bg-slate-200" />
          <button
            type="button"
            onClick={() => {
              setAux(aux === 'measure' ? 'none' : 'measure');
              setHint(aux === 'measure' ? '回到画块' : '拖动测量距离');
            }}
            className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
              aux === 'measure' ? 'bg-violet-600 text-white' : 'bg-slate-50 text-slate-600'
            }`}
          >
            测
          </button>
          <button
            type="button"
            onClick={() => {
              setAux(aux === 'door-in' ? 'none' : 'door-in');
              setHint('点图放置入口');
            }}
            className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
              aux === 'door-in' ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600'
            }`}
          >
            门
          </button>
          <button
            type="button"
            onClick={() => {
              setAux(aux === 'door-out' ? 'none' : 'door-out');
              setHint('点图放置窗户/出风');
            }}
            className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
              aux === 'door-out' ? 'bg-sky-600 text-white' : 'bg-slate-50 text-slate-600'
            }`}
          >
            窗
          </button>
        </div>
        <p className="text-[9px] leading-tight text-slate-500">{hint}</p>
      </div>

      <canvas
        ref={canvasRef}
        className="min-h-0 w-full flex-1 touch-none"
        style={{
          cursor:
            aux === 'measure'
              ? 'crosshair'
              : aux === 'door-in' || aux === 'door-out'
                ? 'cell'
                : rubber?.kind === 'draw'
                  ? 'crosshair'
                  : hoverCursor,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      />
    </div>
  );
}
