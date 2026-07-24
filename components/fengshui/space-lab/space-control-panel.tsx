'use client';

import type React from 'react';
import type { FieldLayer, SpaceLabState, SpaceVent } from '@/lib/fengshui/space';
import { azimuthToFacingLabel } from '@/lib/fengshui/space';

const LAYERS: { key: FieldLayer; label: string }[] = [
  { key: 'energy', label: '能量分布' },
  { key: 'wind', label: '风速强度' },
  { key: 'light', label: '光波采光' },
  { key: 'nineStar', label: '九星旺衰' },
  { key: 'qimen', label: '奇门遁甲' },
];

const FACINGS = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'];

type Props = {
  state: SpaceLabState;
  selectedVentId: string | null;
  windOn: boolean;
  nineOn: boolean;
  onPatch: (fn: (s: SpaceLabState) => SpaceLabState) => void;
  onSelectVent: (id: string | null) => void;
  onUpload: (file: File) => void;
  onClearUnderlay: () => void;
  viewMode: 'plan' | 'iso';
  onViewMode: (m: 'plan' | 'iso') => void;
  /** optional override for view mode buttons (e.g. include Three.js) */
  extraViewModes?: React.ReactNode;
};

export function SpaceControlPanel({
  state,
  selectedVentId,
  windOn,
  nineOn,
  onPatch,
  onSelectVent,
  onUpload,
  onClearUnderlay,
  viewMode,
  onViewMode,
  extraViewModes,
}: Props) {
  const vent = state.vents.find((v) => v.id === selectedVentId) || state.vents[0];

  const updateVent = (patch: Partial<SpaceVent>) => {
    if (!vent) return;
    onPatch((s) => ({
      ...s,
      vents: s.vents.map((v) => (v.id === vent.id ? { ...v, ...patch } : v)),
    }));
    onSelectVent(vent.id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-hidden rounded-lg border border-white/10 bg-[#10141c]/95 p-2 text-[11px] text-white/90">
      <div className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300/90">
        控制台
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

      <div className="flex flex-wrap gap-2">
        <Toggle
          on={windOn}
          label={`风口：${windOn ? '开' : '关'}`}
          onClick={() =>
            onPatch((s) => ({
              ...s,
              vents: s.vents.map((v) => ({ ...v, enabled: !windOn })),
            }))
          }
        />
        <Toggle
          on={nineOn}
          label={`九星干扰：${nineOn ? '开' : '关'}`}
          onClick={() =>
            onPatch((s) => ({
              ...s,
              time: { ...s.time, nineStarEnabled: !nineOn },
            }))
          }
        />
        <Toggle
          on={state.qimenEnabled !== false}
          label={`奇门：${state.qimenEnabled !== false ? '开' : '关'}`}
          onClick={() =>
            onPatch((s) => ({
              ...s,
              qimenEnabled: s.qimenEnabled === false,
            }))
          }
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {LAYERS.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => onPatch((s) => ({ ...s, activeLayer: l.key }))}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
              state.activeLayer === l.key
                ? 'bg-amber-400 text-black'
                : 'bg-white/10 text-white/70 hover:bg-white/15'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {extraViewModes || (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onViewMode('plan')}
            className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold ${
              viewMode === 'plan' ? 'bg-white text-black' : 'bg-white/10'
            }`}
          >
            平面热力
          </button>
          <button
            type="button"
            onClick={() => onViewMode('iso')}
            className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold ${
              viewMode === 'iso' ? 'bg-white text-black' : 'bg-white/10'
            }`}
          >
            立体示意
          </button>
        </div>
      )}

      {/* Upload */}
      <section className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-2.5">
        <div className="font-semibold text-white/80">户型图底板</div>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/5 px-3 py-4 text-center hover:bg-white/10">
          <span className="text-[12px] font-medium">点击上传平面图</span>
          <span className="mt-0.5 text-[10px] text-white/40">PNG / JPG · 将叠加热力层</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
            }}
          />
        </label>
        {state.underlayDataUrl ? (
          <>
            <label className="block space-y-1">
              <span className="text-white/45">底板透明度 {Math.round(state.underlayOpacity * 100)}%</span>
              <input
                type="range"
                min={0.1}
                max={0.8}
                step={0.05}
                value={state.underlayOpacity}
                onChange={(e) =>
                  onPatch((s) => ({ ...s, underlayOpacity: Number(e.target.value) }))
                }
                className="w-full accent-amber-400"
              />
            </label>
            <button
              type="button"
              onClick={onClearUnderlay}
              className="w-full rounded-lg border border-white/15 py-1.5 text-[11px] text-white/70 hover:bg-white/5"
            >
              清除户型图
            </button>
          </>
        ) : null}
      </section>

      {/* Room */}
      <section className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-2.5">
        <div className="font-semibold text-white/80">房间与朝向</div>
        <label className="block space-y-1">
          <span className="text-white/45">主入口朝向</span>
          <select
            value={state.room.entranceFacing}
            onChange={(e) =>
              onPatch((s) => ({
                ...s,
                room: { ...s.room, entranceFacing: e.target.value },
              }))
            }
            className="w-full rounded-md border border-white/15 bg-[#0b0e14] px-2 py-1.5 text-[12px]"
          >
            {FACINGS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Num
            label="面宽 m"
            value={state.room.widthM}
            min={3}
            max={30}
            onChange={(v) => onPatch((s) => ({ ...s, room: { ...s.room, widthM: v } }))}
          />
          <Num
            label="进深 m"
            value={state.room.depthM}
            min={3}
            max={30}
            onChange={(v) => onPatch((s) => ({ ...s, room: { ...s.room, depthM: v } }))}
          />
        </div>
      </section>

      {/* Vent editor */}
      {vent ? (
        <section className="space-y-2 rounded-lg border border-amber-400/25 bg-amber-400/5 p-2.5">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-amber-200">
              风口 · {vent.kind === 'inlet' ? '进风' : '出风'} · 拖动可移动
            </div>
            <button
              type="button"
              className="text-[11px] text-red-300/80 hover:text-red-200"
              onClick={() => {
                onPatch((s) => ({
                  ...s,
                  vents: s.vents.filter((v) => v.id !== vent.id),
                }));
                onSelectVent(null);
              }}
            >
              删除此风口
            </button>
          </div>
          <Slider
            label={`出风方向（方位角） ${vent.azimuthDeg.toFixed(0)}° ${azimuthToFacingLabel(vent.azimuthDeg)}`}
            min={0}
            max={359}
            value={vent.azimuthDeg}
            onChange={(v) => updateVent({ azimuthDeg: v })}
          />
          <details open className="space-y-2">
            <summary className="cursor-pointer text-white/60">风场属性</summary>
            <Slider
              label={`扩散角度 ${vent.spreadDeg.toFixed(0)}°`}
              min={20}
              max={160}
              value={vent.spreadDeg}
              onChange={(v) => updateVent({ spreadDeg: v })}
            />
            <Slider
              label={`风速 ${vent.speed.toFixed(0)}`}
              min={5}
              max={80}
              value={vent.speed}
              onChange={(v) => updateVent({ speed: v })}
            />
            <Slider
              label={`能量强度 ${vent.intensity.toFixed(1)}`}
              min={0.5}
              max={4}
              step={0.1}
              value={vent.intensity}
              onChange={(v) => updateVent({ intensity: v })}
            />
            <Slider
              label={`消散周期（半衰期） ${vent.halfLifeSec.toFixed(1)}s`}
              min={4}
              max={30}
              step={0.5}
              value={vent.halfLifeSec}
              onChange={(v) => updateVent({ halfLifeSec: v })}
            />
          </details>
        </section>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="rounded-lg bg-emerald-500/20 py-2 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/30"
          onClick={() => {
            const id = `vent-in-${Date.now()}`;
            onPatch((s) => ({
              ...s,
              vents: [
                ...s.vents,
                {
                  id,
                  kind: 'inlet',
                  x: 0.5,
                  y: 0.85,
                  azimuthDeg: 90,
                  spreadDeg: 90,
                  speed: 40,
                  intensity: 2,
                  halfLifeSec: 12,
                  enabled: true,
                },
              ],
            }));
            onSelectVent(id);
          }}
        >
          增加风口
        </button>
        <button
          type="button"
          className="rounded-lg bg-sky-500/20 py-2 text-[11px] font-semibold text-sky-200 hover:bg-sky-500/30"
          onClick={() => {
            const id = `vent-out-${Date.now()}`;
            onPatch((s) => ({
              ...s,
              vents: [
                ...s.vents,
                {
                  id,
                  kind: 'outlet',
                  x: 0.5,
                  y: 0.15,
                  azimuthDeg: 270,
                  spreadDeg: 80,
                  speed: 36,
                  intensity: 1.8,
                  halfLifeSec: 12,
                  enabled: true,
                },
              ],
            }));
            onSelectVent(id);
          }}
        >
          增加出风口
        </button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {(['box', 'column', 'arc'] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            className="rounded-lg border border-white/10 py-1.5 text-[10px] text-white/70 hover:bg-white/5"
            onClick={() =>
              onPatch((s) => ({
                ...s,
                structures: [
                  ...s.structures,
                  {
                    id: `st-${Date.now()}-${kind}`,
                    kind,
                    x: 0.35 + Math.random() * 0.2,
                    y: 0.35 + Math.random() * 0.2,
                    w: kind === 'column' ? 0.08 : 0.16,
                    h: kind === 'column' ? 0.08 : 0.14,
                    block: kind === 'column' ? 0.75 : 0.5,
                  },
                ],
              }))
            }
          >
            {kind === 'box' ? '长方体' : kind === 'column' ? '圆柱' : '弧形墙'}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="rounded-lg border border-white/10 py-1.5 text-[11px] text-white/50 hover:bg-white/5"
        onClick={() => onPatch((s) => ({ ...s, structures: [] }))}
      >
        清空全部结构
      </button>

      <p className="shrink-0 text-[9px] leading-snug text-white/35">
        结构近似场 · 可在视口拖动风口
      </p>
      </div>
    </div>
  );
}

function Toggle({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
        on ? 'bg-emerald-500/90 text-black' : 'bg-white/10 text-white/60'
      }`}
    >
      {label}
    </button>
  );
}

function Slider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-white/55">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-400"
      />
    </label>
  );
}

function Num({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="text-white/45">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-white/15 bg-[#0b0e14] px-2 py-1 text-[12px]"
      />
    </label>
  );
}
