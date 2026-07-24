'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  createDefaultLabState,
  simulateSpaceField,
  type SpaceLabState,
  type SpaceVent,
} from '@/lib/fengshui/space';
import {
  openingsToVents,
  type SuggestedOpening,
} from '@/lib/fengshui/space/opening-suggest';
import {
  applyPresetToState,
  type LayoutDomain,
  type LayoutPreset,
} from '@/lib/fengshui/space/layout-presets';
import type { SpaceGeoPlace } from '@/lib/fengshui/space/types';
import { SpaceViewport } from './space-viewport';
import { SpaceControlPanel } from './space-control-panel';
import { SpaceCompassPanel } from './space-compass-panel';
import { LayoutPresetPicker } from './layout-preset-picker';
import { MapPlacePicker } from './map-place-picker';
import { SiteAdvisorPanel } from './site-advisor-panel';
import type { SiteCandidateResult } from '@/lib/fengshui/space/site-advisor';

const SpaceViewport3D = dynamic(
  () => import('./space-viewport-3d').then((m) => m.SpaceViewport3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0b0e14] text-[13px] text-white/50">
        加载 Three.js 三维场景…
      </div>
    ),
  },
);

type ViewMode = 'plan' | 'iso' | 'three';
type WorkbenchTab = 'preset' | 'site' | 'controls';

export function SpaceLabApp() {
  const [state, setState] = useState<SpaceLabState>(() => createDefaultLabState());
  const [selectedVentId, setSelectedVentId] = useState<string | null>('vent-in-1');
  const [viewMode, setViewMode] = useState<ViewMode>('three');
  const [workbenchTab, setWorkbenchTab] = useState<WorkbenchTab>('preset');
  const [tick, setTick] = useState(0);
  const [suggesting, setSuggesting] = useState(false);
  const [generatingLayout, setGeneratingLayout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openings, setOpenings] = useState<SuggestedOpening[]>([]);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [memberInfo, setMemberInfo] = useState<{
    isMember: boolean;
    authenticated: boolean;
    used: number;
    freeLimit: number;
  } | null>(null);

  const patch = useCallback((fn: (s: SpaceLabState) => SpaceLabState) => {
    setState((s) => fn(s));
    setTick((t) => t + 1);
  }, []);

  const result = useMemo(() => simulateSpaceField(state), [state, tick]);

  const windOn = state.vents.some((v) => v.enabled);
  const nineOn = state.time.nineStarEnabled;

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/fengshui/space/save');
        const data = await res.json();
        if (data?.success) {
          setMemberInfo({
            isMember: Boolean(data.isMember),
            authenticated: Boolean(data.authenticated),
            used: Number(data.used) || 0,
            freeLimit: Number(data.freeLimit) || 3,
          });
        }
      } catch {
        // ignore
      }
    })();
  }, [lastSessionId]);

  const runOpeningSuggest = async (dataUrl: string, facing: string) => {
    setSuggesting(true);
    setError(null);
    setBanner('正在用多模态识别门窗位…');
    try {
      const res = await fetch('/api/fengshui/space/suggest-openings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: dataUrl, entranceFacing: facing }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || '门窗建议失败');
      }
      const list = (data.openings || []) as SuggestedOpening[];
      setOpenings(list);
      const vents: SpaceVent[] = openingsToVents(list);
      patch((s) => ({ ...s, vents }));
      if (vents[0]) setSelectedVentId(vents[0].id);
      setBanner(
        `${data.message || '已生成门窗建议'}（模式：${data.mode === 'vision' ? '多模态视觉' : '启发式'}）`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '门窗建议失败');
      setBanner(null);
    } finally {
      setSuggesting(false);
    }
  };

  const applyLayoutPreset = (preset: LayoutPreset, areaSqm: number) => {
    setError(null);
    const next = applyPresetToState(state, preset, { areaSqm });
    // honor current facing if user already set something in room - use preset facing
    setState(next);
    setTick((t) => t + 1);
    setSelectedVentId(next.vents[0]?.id || null);
    setOpenings([]);
    setBanner(
      `已加载预设「${preset.title}」· ${preset.layout} · 约 ${Math.round(areaSqm || preset.areaSqm)}㎡（已按面积缩放）`,
    );
    // keep preview in view: on small screens switch focus isn't needed — right pane is sticky
  };

  const generateLayoutLlm = async (input: {
    domain: LayoutDomain;
    layout: string;
    areaSqm: number;
    entranceFacing: string;
    notes: string;
    model: 'grok-4.3-fast' | 'grok-4.3-high';
    presetId?: string;
  }) => {
    setGeneratingLayout(true);
    setError(null);
    setBanner(`正在用 ${input.model} 生成布局…`);
    try {
      const res = await fetch('/api/fengshui/space/generate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.preset) {
        throw new Error(data.error || '布局生成失败');
      }
      const preset = data.preset as LayoutPreset;
      const next = applyPresetToState(state, preset, {
        areaSqm: Number(preset.areaSqm) || input.areaSqm,
      });
      // apply entrance facing preference from form when model didn't override strongly
      if (input.entranceFacing) {
        next.room.entranceFacing = input.entranceFacing;
      }
      setState(next);
      setTick((t) => t + 1);
      setSelectedVentId(next.vents[0]?.id || null);
      setOpenings([]);
      setBanner(data.message || `已加载：${preset.title}（${data.mode}）`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '布局生成失败');
      setBanner(null);
    } finally {
      setGeneratingLayout(false);
    }
  };

  const onUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 8 * 1024 * 1024) {
      setError('图片请小于 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || '');
      patch((s) => ({ ...s, underlayDataUrl: url }));
      void runOpeningSuggest(url, state.room.entranceFacing);
    };
    reader.readAsDataURL(file);
  };

  const injectGeo = (place: SpaceGeoPlace) => {
    patch((s) => ({ ...s, geo: place }));
    setBanner(`已注入区位：${place.address}`);
  };

  const injectSiteWinner = (place: SpaceGeoPlace, meta: SiteCandidateResult) => {
    patch((s) => ({
      ...s,
      geo: place,
      room: {
        ...s.room,
        entranceFacing: s.room.entranceFacing,
      },
    }));
    setBanner(
      `已采用选址「${meta.label}」· 综合 ${meta.totalScore} 分 · 人流 ${meta.footTraffic.band}（${meta.footTraffic.index}）`,
    );
  };

  const publishInsight = async () => {
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch('/api/publish/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'space_lab',
          useLlm: true,
          model: 'grok-4.3-fast',
          summary: result.summary,
          qimen: result.qimen,
          layoutTitle: state.room.entranceFacing
            ? `${state.room.widthM}×${state.room.depthM}m · ${state.room.entranceFacing}向`
            : '空间场',
          areaSqm: state.room.widthM * state.room.depthM,
          geoAddress: state.geo?.address,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '发布失败');
      setPublicUrl(data.url);
      setBanner(data.message || '已发布脱敏公开笔记');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  const saveSession = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/fengshui/space/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: result.summary,
          meta: result.meta,
          room: state.room,
          vents: state.vents,
          lights: state.lights,
          structures: state.structures,
          openings,
          note: openings.length
            ? `含门窗建议 ${openings.length} 处 · 层 ${state.activeLayer}`
            : `空间场快照 · 层 ${state.activeLayer}`,
        }),
      });
      const data = await res.json();
      if (res.status === 403 && data.code === 'member_required') {
        setError(data.error);
        setBanner(null);
        return;
      }
      if (!res.ok || !data.success) {
        throw new Error(data.error || '保存失败');
      }
      setLastSessionId(data.sessionId);
      setBanner(data.message || '已保存');
      if (data.remaining != null) {
        setMemberInfo((m) =>
          m
            ? { ...m, used: data.used, isMember: data.isMember }
            : {
                isMember: data.isMember,
                authenticated: true,
                used: data.used,
                freeLimit: data.freeLimit || 3,
              },
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const viewModeButtons = (
    <div className="flex gap-1.5">
      {(
        [
          { id: 'plan' as const, label: '平面' },
          { id: 'iso' as const, label: '等距' },
          { id: 'three' as const, label: '真3D' },
        ] as const
      ).map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setViewMode(m.id)}
          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
            viewMode === m.id
              ? m.id === 'three'
                ? 'bg-amber-400 text-black'
                : 'bg-white text-black'
              : 'bg-white/10 text-white/75 hover:bg-white/15'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {/* compact chrome */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-strong)]">
            Space Field Lab
          </p>
          <h1 className="text-[18px] font-black tracking-tight text-[color:var(--ink-1)] md:text-[22px]">
            空间场模拟工作台
          </h1>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
            左选方案 / 选址 / 控制 · 右栏即时预览，无需滚到屏幕外
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-full border border-[color:var(--hairline)] px-2 py-1 font-semibold text-[color:var(--ink-2)]">
            {memberInfo?.isMember
              ? '会员 · 无限存档'
              : `存档 ${memberInfo?.used ?? 0}/${memberInfo?.freeLimit ?? 3}`}
          </span>
          <Link
            href="/tools/fengshui-simulator"
            className="rounded-full border border-[color:var(--hairline)] px-2.5 py-1 text-[color:var(--ink-2)] hover:bg-[color:var(--bg-sunken)]"
          >
            商铺快测
          </Link>
          <Link
            href="/membership?source=fengshui_space"
            className="rounded-full border border-[color:var(--brand)]/30 bg-[color:var(--brand-soft)] px-2.5 py-1 font-semibold text-[color:var(--brand-strong)]"
          >
            会员
          </Link>
          <button
            type="button"
            className="rounded-full border border-[color:var(--hairline)] px-2.5 py-1 text-[color:var(--ink-2)]"
            onClick={() => {
              const url = 'https://www.life-kline.com/tools/fengshui-space';
              const text = '人生K线空间场：选阳宅/铺面/阴宅，估人流，看热力3D。';
              if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
                void navigator.share({ title: '空间场模拟', text, url }).catch(() => {
                  void navigator.clipboard?.writeText(`${text}\n${url}`);
                  setBanner('已复制分享文案与链接');
                });
              } else {
                void navigator.clipboard?.writeText(`${text}\n${url}`);
                setBanner('已复制分享文案与链接');
              }
            }}
          >
            分享
          </button>
        </div>
      </div>

      {banner ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[12px] text-emerald-800">
          {banner}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-400/40 bg-red-50 px-3 py-1.5 text-[12px] text-red-700">
          {error}{' '}
          {error.includes('会员') ? (
            <Link href="/membership?source=fengshui_space_save" className="font-semibold underline">
              去开通
            </Link>
          ) : null}
        </div>
      ) : null}

      {/* ===== 左右工作台：左操作 · 右即时预览 ===== */}
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(300px,400px)_minmax(0,1fr)]">
        {/* LEFT · controls (scroll inside) */}
        <aside className="order-2 flex min-h-0 flex-col rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] lg:order-1 lg:sticky lg:top-2 lg:max-h-[calc(100vh-4.5rem)]">
          <div className="flex shrink-0 gap-0.5 border-b border-[color:var(--hairline)] p-1.5">
            {(
              [
                { id: 'preset' as const, label: '选方案' },
                { id: 'site' as const, label: '选址·人流' },
                { id: 'controls' as const, label: '控制台' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setWorkbenchTab(t.id)}
                className={`flex-1 rounded-lg py-2 text-[12px] font-semibold transition ${
                  workbenchTab === t.id
                    ? 'bg-[color:var(--ink-1)] text-white'
                    : 'text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-2.5">
            {workbenchTab === 'preset' ? (
              <LayoutPresetPicker
                variant="sidebar"
                busy={generatingLayout || suggesting}
                onApplyPreset={applyLayoutPreset}
                onGenerateLlm={generateLayoutLlm}
              />
            ) : null}

            {workbenchTab === 'site' ? (
              <div className="space-y-3">
                <MapPlacePicker value={state.geo} onSelect={injectGeo} />
                <SiteAdvisorPanel
                  currentGeo={state.geo}
                  onInjectWinner={injectSiteWinner}
                  onApplyDomain={(domain) => {
                    setWorkbenchTab('preset');
                    setBanner(
                      `已切到「选方案」· 请选择领域（推荐：${
                        domain === 'tomb'
                          ? '阴宅'
                          : domain === 'shop'
                            ? '商铺'
                            : domain === 'villa'
                              ? '别墅'
                              : domain === 'apartment'
                                ? '公寓楼'
                                : '阳宅'
                      }）并加载预设；右侧视口会同步更新。`,
                    );
                  }}
                />
              </div>
            ) : null}

            {workbenchTab === 'controls' ? (
              <div className="space-y-3">
                <div className="max-h-[min(62vh,560px)] overflow-y-auto rounded-xl">
                  <SpaceControlPanel
                    state={state}
                    selectedVentId={selectedVentId}
                    windOn={windOn}
                    nineOn={nineOn}
                    onPatch={patch}
                    onSelectVent={setSelectedVentId}
                    onUpload={onUpload}
                    onClearUnderlay={() => {
                      patch((s) => ({ ...s, underlayDataUrl: null }));
                      setOpenings([]);
                    }}
                    viewMode={viewMode === 'three' ? 'plan' : viewMode}
                    onViewMode={(m) => setViewMode(m)}
                    extraViewModes={viewModeButtons}
                  />
                </div>
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
                {openings.length > 0 ? (
                  <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-2.5">
                    <div className="text-[11px] font-bold text-[color:var(--brand-strong)]">
                      门窗建议
                    </div>
                    <ul className="mt-1.5 max-h-36 space-y-1 overflow-y-auto">
                      {openings.map((o, i) => (
                        <li key={`${o.label}-${i}`} className="text-[11px] text-[color:var(--ink-3)]">
                          <span className="font-semibold text-[color:var(--ink-1)]">{o.label}</span>
                          {' · '}
                          {o.kind === 'inlet' ? '进风' : '出风'} · {(o.confidence * 100).toFixed(0)}%
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* left footer actions always visible */}
          <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-[color:var(--hairline)] p-2">
            <button
              type="button"
              disabled={suggesting || !state.underlayDataUrl}
              onClick={() =>
                state.underlayDataUrl &&
                void runOpeningSuggest(state.underlayDataUrl, state.room.entranceFacing)
              }
              className="rounded-lg bg-[color:var(--ink-1)] px-2.5 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40"
            >
              {suggesting ? '识别…' : '识别门窗'}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveSession()}
              className="rounded-lg border border-[color:var(--brand)] bg-[color:var(--brand-soft)] px-2.5 py-1.5 text-[11px] font-semibold text-[color:var(--brand-strong)] disabled:opacity-40"
            >
              {saving ? '…' : '保存'}
            </button>
            <button
              type="button"
              disabled={publishing}
              onClick={() => void publishInsight()}
              className="rounded-lg border border-[color:var(--hairline)] px-2.5 py-1.5 text-[11px] font-semibold text-[color:var(--ink-2)] disabled:opacity-40"
            >
              {publishing ? '…' : '发文'}
            </button>
            {lastSessionId ? (
              <Link
                href={`/tool-result/${lastSessionId}`}
                className="rounded-lg border border-[color:var(--hairline)] px-2.5 py-1.5 text-[11px] text-[color:var(--ink-2)]"
              >
                存档
              </Link>
            ) : null}
            {publicUrl ? (
              <Link
                href={publicUrl}
                className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-800"
              >
                公开笔记
              </Link>
            ) : null}
          </div>
        </aside>

        {/* RIGHT · live preview (sticky) */}
        <section className="order-1 flex min-w-0 flex-col gap-2 lg:order-2 lg:sticky lg:top-2">
          <div className="overflow-hidden rounded-xl border border-[color:var(--hairline)] bg-[#0b0e14] shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2 text-[11px] text-white/60">
              <span className="font-medium text-white/80">
                实时视口 ·{' '}
                {viewMode === 'plan' ? '平面热力' : viewMode === 'iso' ? '等距' : 'Three.js 3D'}
                <span className="ml-2 text-white/40">
                  {state.room.widthM.toFixed(1)}×{state.room.depthM.toFixed(1)}m ·{' '}
                  {state.room.entranceFacing}向
                </span>
              </span>
              <div className="flex items-center gap-2">
                {viewModeButtons}
                <button
                  type="button"
                  className="rounded-md bg-white/10 px-2 py-1 text-white/80 hover:bg-white/15"
                  onClick={() => {
                    setState(createDefaultLabState());
                    setSelectedVentId('vent-in-1');
                    setOpenings([]);
                    setTick((t) => t + 1);
                  }}
                >
                  重置
                </button>
              </div>
            </div>
            {/* fill viewport height on desktop; shorter on mobile so left tabs stay reachable */}
            <div className="h-[min(52vh,420px)] w-full sm:h-[min(56vh,480px)] lg:h-[min(72vh,680px)]">
              {viewMode === 'three' ? (
                <SpaceViewport3D state={state} result={result} />
              ) : (
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
              )}
            </div>
          </div>

          {/* live metrics under viewport — still in sticky column */}
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-2.5 text-[12px]">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
                结构读数（随左侧选择实时变）
              </div>
              <div className="mt-1.5 grid grid-cols-4 gap-1.5 sm:grid-cols-2">
                <Metric label="峰值" value={`${(result.summary.peakEnergy * 100).toFixed(0)}`} />
                <Metric label="均值" value={`${(result.summary.avgEnergy * 100).toFixed(0)}`} />
                <Metric
                  label="滞留"
                  value={`${(result.summary.stagnationRatio * 100).toFixed(0)}%`}
                />
                <Metric
                  label="通道"
                  value={`${(result.summary.draftCorridor * 100).toFixed(0)}%`}
                />
              </div>
              <ul className="mt-2 max-h-24 space-y-1 overflow-y-auto text-[11px] leading-snug text-[color:var(--ink-3)]">
                {result.summary.structuralNotes.slice(0, 4).map((n) => (
                  <li key={n} className="flex gap-1">
                    <span className="text-[color:var(--brand)]">·</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>

            {result.qimen ? (
              <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-2.5 text-[12px]">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
                  奇门 · {result.qimen.juLabel}
                </div>
                <p className="mt-1 text-[10px] text-[color:var(--ink-4)]">
                  值符 {result.qimen.valueFu} · 值使 {result.qimen.valueShi}
                </p>
                <ul className="mt-1.5 grid grid-cols-3 gap-1">
                  {result.qimen.palaces.slice(0, 9).map((p) => (
                    <li
                      key={p.index}
                      className="rounded bg-[color:var(--bg-sunken)] px-1 py-0.5 text-[9px] leading-tight"
                    >
                      <span className="font-semibold text-[color:var(--ink-1)]">
                        {p.index + 1}
                        {p.door}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-2.5 text-[12px]">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
                  优先动作
                </div>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-[11px] text-[color:var(--ink-3)]">
                  {result.summary.priorityActions.slice(0, 4).map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </section>
      </div>

      <p className="text-center text-[11px] text-[color:var(--ink-5)]">
        桌面端：左侧改方案，右侧视口与读数即时刷新。移动端：预览在上，下方切换「选方案 / 选址 / 控制台」。
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
