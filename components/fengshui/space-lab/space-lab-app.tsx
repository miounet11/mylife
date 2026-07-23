'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  createDefaultLabState,
  simulateSpaceField,
  type SpaceLabState,
} from '@/lib/fengshui/space';
import { SpaceViewport } from './space-viewport';
import { SpaceControlPanel } from './space-control-panel';
import { SpaceCompassPanel } from './space-compass-panel';

export function SpaceLabApp() {
  const [state, setState] = useState<SpaceLabState>(() => createDefaultLabState());
  const [selectedVentId, setSelectedVentId] = useState<string | null>('vent-in-1');
  const [viewMode, setViewMode] = useState<'plan' | 'iso'>('plan');
  const [tick, setTick] = useState(0);

  const patch = useCallback((fn: (s: SpaceLabState) => SpaceLabState) => {
    setState((s) => fn(s));
    setTick((t) => t + 1);
  }, []);

  const result = useMemo(() => simulateSpaceField(state), [state, tick]);

  const windOn = state.vents.some((v) => v.enabled);
  const nineOn = state.time.nineStarEnabled;

  const onUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('图片请小于 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '');
      patch((s) => ({ ...s, underlayDataUrl: url }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Hero strip */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-strong)]">
            Space Field Lab
          </p>
          <h1 className="mt-1 text-[22px] font-black tracking-tight text-[color:var(--ink-1)] md:text-[26px]">
            空间场模拟工作台
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[color:var(--ink-4)]">
            热力 · 立体示意 · 风口/采光控制 · 时辰九星叠加 · 户型图底板。结构近似可视化，不说吉凶标签。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px]">
          <Link
            href="/tools/fengshui-simulator"
            className="rounded-full border border-[color:var(--hairline)] px-3 py-1.5 text-[color:var(--ink-2)] hover:bg-[color:var(--bg-sunken)]"
          >
            商铺五行快测
          </Link>
          <Link
            href="/chat?intent=home-layout-diagnosis"
            className="rounded-full border border-[color:var(--hairline)] px-3 py-1.5 text-[color:var(--ink-2)] hover:bg-[color:var(--bg-sunken)]"
          >
            AI 户型诊断
          </Link>
        </div>
      </div>

      {/* Main stage */}
      <div className="grid gap-3 lg:grid-cols-[300px_minmax(0,1fr)_240px]">
        <div className="order-2 max-h-[78vh] lg:order-1">
          <SpaceControlPanel
            state={state}
            selectedVentId={selectedVentId}
            windOn={windOn}
            nineOn={nineOn}
            onPatch={patch}
            onSelectVent={setSelectedVentId}
            onUpload={onUpload}
            onClearUnderlay={() => patch((s) => ({ ...s, underlayDataUrl: null }))}
            viewMode={viewMode}
            onViewMode={setViewMode}
          />
        </div>

        <div className="order-1 min-h-[420px] overflow-hidden rounded-xl border border-[color:var(--hairline)] bg-[#0b0e14] shadow-lg lg:order-2 lg:min-h-[640px]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[11px] text-white/60">
            <span>视口 · {viewMode === 'plan' ? '平面热力分布' : '立体示意'}</span>
            <button
              type="button"
              className="rounded-md bg-white/10 px-2 py-0.5 text-white/80 hover:bg-white/15"
              onClick={() => {
                setState(createDefaultLabState());
                setSelectedVentId('vent-in-1');
                setTick((t) => t + 1);
              }}
            >
              重置流场
            </button>
          </div>
          <div className="h-[520px] w-full lg:h-[600px]">
            <SpaceViewport
              state={state}
              result={result}
              selectedVentId={selectedVentId}
              onSelectVent={setSelectedVentId}
              onMoveVent={(id, x, y) =>
                patch((s) => ({
                  ...s,
                  vents: s.vents.map((v) => (v.id === id ? { ...v, x, y } : v)),
                }))
              }
              viewMode={viewMode}
            />
          </div>
        </div>

        <div className="order-3 space-y-3">
          <SpaceCompassPanel
            time={state.time}
            meta={result.meta}
            onChangeHour={(h) =>
              patch((s) => ({
                ...s,
                time: { ...s.time, hour: h, followClock: false },
              }))
            }
            onToggleFollow={(v) =>
              patch((s) => ({ ...s, time: { ...s.time, followClock: v } }))
            }
            onToggleNine={(v) =>
              patch((s) => ({ ...s, time: { ...s.time, nineStarEnabled: v } }))
            }
            onTide={(v) => patch((s) => ({ ...s, time: { ...s.time, tideBoost: v } }))}
          />

          <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 text-[12px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
              结构读数
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Metric label="峰值能量" value={`${(result.summary.peakEnergy * 100).toFixed(0)}`} />
              <Metric label="均值能量" value={`${(result.summary.avgEnergy * 100).toFixed(0)}`} />
              <Metric
                label="滞留占比"
                value={`${(result.summary.stagnationRatio * 100).toFixed(0)}%`}
              />
              <Metric
                label="高速通道"
                value={`${(result.summary.draftCorridor * 100).toFixed(0)}%`}
              />
            </div>
            <ul className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-[color:var(--ink-3)]">
              {result.summary.structuralNotes.map((n) => (
                <li key={n} className="flex gap-1.5">
                  <span className="text-[color:var(--brand)]">·</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-[color:var(--hairline)] pt-2">
              <div className="text-[11px] font-semibold text-[color:var(--ink-2)]">优先动作</div>
              <ol className="mt-1 list-decimal space-y-1 pl-4 text-[12px] text-[color:var(--ink-3)]">
                {result.summary.priorityActions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-[color:var(--ink-5)]">
        本工作台输出为结构近似与教学示意，不替代实测风环境/光照分析，也不提供吉凶断语。
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[color:var(--bg-sunken)] px-2 py-1.5">
      <div className="text-[10px] text-[color:var(--ink-5)]">{label}</div>
      <div className="text-[15px] font-bold tabular-nums text-[color:var(--ink-1)]">{value}</div>
    </div>
  );
}
