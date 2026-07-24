'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  buildProBriefText,
  buildProSessionExport,
  createDefaultLabState,
  DOMAIN_MODEL_META,
  downloadJson,
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
import type { SpaceActiveDomain, SpaceGeoPlace } from '@/lib/fengshui/space/types';
import { SpaceViewport } from './space-viewport';
import { SpaceControlPanel } from './space-control-panel';
import { LayoutPresetPicker } from './layout-preset-picker';
import { MapPlacePicker } from './map-place-picker';
import { VirtualCompass } from './virtual-compass';
import { spaceLabCopy } from '@/lib/i18n/space-lab-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';

const SpaceViewport3D = dynamic(
  () => import('./space-viewport-3d').then((m) => m.SpaceViewport3D),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#0b0e14] text-[13px] text-white/50">
        Loading 3D…
      </div>
    ),
  },
);

type ViewMode = 'plan' | 'iso' | 'three';
type WorkbenchTab = 'preset' | 'site' | 'controls';

export function SpaceLabApp({ locale = 'zh-CN' }: { locale?: SiteLocale | string }) {
  const copy = useMemo(() => spaceLabCopy(locale), [locale]);
  const [state, setState] = useState<SpaceLabState>(() => createDefaultLabState());
  const [selectedVentId, setSelectedVentId] = useState<string | null>('vent-in-1');
  const [viewMode, setViewMode] = useState<ViewMode>('plan');
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
    setState(next);
    setTick((t) => t + 1);
    setSelectedVentId(next.vents[0]?.id || null);
    setOpenings([]);
    const model = DOMAIN_MODEL_META[preset.domain as SpaceActiveDomain]?.modelName || '';
    setBanner(
      `已加载「${preset.title}」· ${DOMAIN_MODEL_META[preset.domain as SpaceActiveDomain]?.label || ''} · 3D ${model}`,
    );
  };

  const onDomainChange = (domain: LayoutDomain) => {
    const meta = DOMAIN_MODEL_META[domain as SpaceActiveDomain];
    if (!meta) return;
    patch((s) => ({
      ...s,
      activeDomain: domain as SpaceActiveDomain,
      room: {
        ...s.room,
        widthM: meta.defaultRoom.widthM,
        depthM: meta.defaultRoom.depthM,
        heightM: meta.defaultRoom.heightM,
      },
      presetTitle: null,
      presetId: null,
      layoutLabel: domain === 'residential' || domain === 'apartment' ? '三室两厅' : meta.label,
    }));
    setBanner(`${meta.label} · ${meta.modelName}`);
  };

  const exportProSession = () => {
    const exp = buildProSessionExport(state, result);
    downloadJson(
      `space-lab-${exp.domain}-${Date.now()}.json`,
      exp,
    );
    setBanner('已下载专业会话 JSON（可归档 / 对接 CRM）');
  };

  const copyProBrief = async () => {
    const exp = buildProSessionExport(state, result);
    const text = buildProBriefText(exp);
    try {
      await navigator.clipboard.writeText(text);
      setBanner('专业简报已复制，可粘贴到客户沟通 / 微信');
    } catch {
      setBanner('复制失败，请检查浏览器权限');
    }
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
          layoutTitle: `${DOMAIN_MODEL_META[state.activeDomain]?.label || '空间场'} · ${state.room.widthM.toFixed(0)}×${state.room.depthM.toFixed(0)}m · ${state.room.entranceFacing}向`,
          areaSqm: state.room.widthM * state.room.depthM,
          geoAddress: state.geo?.address,
          domain: state.activeDomain,
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
          domain: state.activeDomain,
          pro: buildProSessionExport(state, result),
          note: openings.length
            ? `含门窗建议 ${openings.length} 处 · ${state.activeDomain} · 层 ${state.activeLayer}`
            : `空间场快照 · ${DOMAIN_MODEL_META[state.activeDomain]?.label || ''} · 层 ${state.activeLayer}`,
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
    <div className="flex gap-1">
      {(
        [
          { id: 'plan' as const, label: copy.views.plan },
          { id: 'iso' as const, label: copy.views.iso },
          { id: 'three' as const, label: copy.views.three },
        ] as const
      ).map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setViewMode(m.id)}
          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
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

  /** 一屏工作台：参考选房站「左清单 + 右实景」——无内层滚动条 */
  return (
    <div className="flex h-[calc(100dvh-3.25rem)] min-h-[560px] flex-col overflow-hidden">
      {/* 顶栏 — 单行 */}
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[color:var(--hairline)] pb-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <h1 className="truncate text-[15px] font-black tracking-tight text-[color:var(--ink-1)]">
            {copy.productName}
          </h1>
          <span className="hidden truncate text-[11px] text-[color:var(--ink-5)] sm:inline">
            {copy.tagline}
          </span>
          {banner ? (
            <span className="max-w-[40vw] truncate text-[11px] text-emerald-700">{banner}</span>
          ) : null}
          {error ? (
            <span className="max-w-[30vw] truncate text-[11px] text-red-600">{error}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[10px]">
          <span className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5 font-semibold text-[color:var(--ink-2)]">
            {DOMAIN_MODEL_META[state.activeDomain]?.label || '阳宅'}
          </span>
          <button
            type="button"
            onClick={() => patch((s) => ({ ...s, proMode: !s.proMode }))}
            className={`rounded-md px-2 py-1 font-semibold ${
              state.proMode
                ? 'bg-[color:var(--ink-1)] text-white'
                : 'border border-[color:var(--hairline)] text-[color:var(--ink-2)]'
            }`}
            title="专业模式：比例尺、完整读数、导出"
          >
            {state.proMode ? 'PRO' : 'PRO'}
          </button>
          <button
            type="button"
            onClick={() => void copyProBrief()}
            className="rounded-md border border-[color:var(--hairline)] px-2 py-1 font-semibold text-[color:var(--ink-2)]"
          >
            {copy.pro.copy}
          </button>
          <button
            type="button"
            onClick={exportProSession}
            className="rounded-md border border-[color:var(--hairline)] px-2 py-1 font-semibold text-[color:var(--ink-2)]"
          >
            {copy.pro.exportJson}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveSession()}
            className="rounded-md bg-[color:var(--brand-soft)] px-2 py-1 font-semibold text-[color:var(--brand-strong)] disabled:opacity-40"
          >
            {copy.pro.save}
          </button>
          <button
            type="button"
            disabled={publishing}
            onClick={() => void publishInsight()}
            className="rounded-md border border-[color:var(--hairline)] px-2 py-1 font-semibold text-[color:var(--ink-2)]"
          >
            {copy.pro.publish}
          </button>
        </div>
      </header>

      {/* 主区 左 | 右 */}
      <div className="mt-2 grid min-h-0 flex-1 grid-cols-1 gap-2 overflow-hidden lg:grid-cols-[minmax(300px,34%)_minmax(0,1fr)]">
        {/* 左栏 */}
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[color:var(--hairline)] bg-[color:var(--paper)]">
          <div className="flex shrink-0 border-b border-[color:var(--hairline)]">
            {(
              [
                { id: 'preset' as const, label: copy.tabs.preset },
                { id: 'site' as const, label: copy.tabs.site },
                { id: 'controls' as const, label: copy.tabs.controls },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setWorkbenchTab(t.id)}
                className={`flex-1 py-1.5 text-[11px] font-semibold ${
                  workbenchTab === t.id
                    ? 'border-b-2 border-[color:var(--ink-1)] text-[color:var(--ink-1)]'
                    : 'text-[color:var(--ink-4)]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-hidden p-2">
            {workbenchTab === 'preset' ? (
              <LayoutPresetPicker
                variant="fit"
                activeDomain={state.activeDomain}
                busy={generatingLayout || suggesting}
                onApplyPreset={applyLayoutPreset}
                onGenerateLlm={generateLayoutLlm}
                onDomainChange={onDomainChange}
              />
            ) : null}

            {workbenchTab === 'site' ? (
              <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-hidden">
                <MapPlacePicker
                  value={state.geo}
                  onSelect={injectGeo}
                  compact
                  autoLocate
                />
                <div className="flex shrink-0 flex-wrap gap-1 border-t border-[color:var(--hairline)] pt-1.5">
                  <button
                    type="button"
                    className="rounded bg-[color:var(--ink-1)] px-2 py-1 text-[10px] font-semibold text-white"
                    onClick={() => {
                      setWorkbenchTab('preset');
                      setBanner('区位已就绪 · 在「方案」加载户型，右侧即时预览');
                    }}
                  >
                    去选方案
                  </button>
                  <button
                    type="button"
                    className="rounded border border-[color:var(--hairline)] px-2 py-1 text-[10px] font-semibold"
                    onClick={() => {
                      if (!state.geo) {
                        setBanner('请先在地图拖标或授权定位');
                        return;
                      }
                      void (async () => {
                        try {
                          const res = await fetch('/api/fengshui/space/site-advise', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              purpose: 'shop',
                              enrichPoi: true,
                              candidates: [
                                {
                                  label: state.geo!.name || '当前点',
                                  address: state.geo!.address,
                                  lat: state.geo!.lat,
                                  lng: state.geo!.lng,
                                  streetFront: true,
                                },
                              ],
                            }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setBanner(data.message || data.result?.summary);
                          } else {
                            setError(data.error || '评估失败');
                          }
                        } catch {
                          setError('选址评估失败');
                        }
                      })();
                    }}
                  >
                    估人流
                  </button>
                </div>
              </div>
            ) : null}

            {workbenchTab === 'controls' ? (
              <div className="flex h-full min-h-0 flex-col gap-1.5 overflow-hidden">
                <VirtualCompass
                  compact
                  copy={copy}
                  locale={locale}
                  planRotationDeg={state.room.planRotationDeg || 0}
                  entranceFacing={state.room.entranceFacing}
                  onRotate={(deg) =>
                    patch((s) => ({
                      ...s,
                      room: { ...s.room, planRotationDeg: deg },
                    }))
                  }
                  onEntrance={(facing) =>
                    patch((s) => ({
                      ...s,
                      room: { ...s.room, entranceFacing: facing },
                    }))
                  }
                />
                <div className="flex shrink-0 flex-wrap gap-1">
                  {(
                    [
                      { key: 'showFurniture' as const, label: copy.show.furniture },
                      { key: 'showRoomLabels' as const, label: copy.show.labels },
                      { key: 'showRoomAreas' as const, label: copy.show.areas },
                      { key: 'planPaperStyle' as const, label: copy.plan.paperOn },
                    ] as const
                  ).map((t) => {
                    const on = state[t.key] !== false;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() =>
                          patch((s) => ({
                            ...s,
                            [t.key]: s[t.key] === false,
                          }))
                        }
                        className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                          on
                            ? 'bg-[color:var(--ink-1)] text-white'
                            : 'border border-[color:var(--hairline)] text-[color:var(--ink-4)]'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                <div className="min-h-0 flex-1 overflow-hidden">
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
              </div>
            ) : null}
          </div>
        </aside>

        {/* 右栏 — 预览铺满 */}
        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[color:var(--hairline)] bg-[#0b0e14]">
          <div
            className={`flex shrink-0 items-center justify-between gap-2 border-b px-2 py-1.5 text-[10px] ${
              viewMode === 'plan' && state.planPaperStyle !== false
                ? 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-4)]'
                : 'border-white/10 text-white/60'
            }`}
          >
            <span className="truncate font-medium">
              {viewMode === 'plan'
                ? copy.views.plan
                : viewMode === 'iso'
                  ? copy.views.iso
                  : copy.views.three}{' '}
              · {state.room.widthM.toFixed(1)}×{state.room.depthM.toFixed(1)}m ·{' '}
              {state.room.entranceFacing}
              {state.geo ? ` · ${state.geo.name || state.geo.address.slice(0, 16)}` : ''}
            </span>
            <div className="flex items-center gap-1.5">
              {viewModeButtons}
              <button
                type="button"
                className="rounded bg-white/10 px-1.5 py-0.5 text-white/80"
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

          <div
            className={`relative min-h-0 flex-1 ${
              viewMode === 'plan' && state.planPaperStyle !== false ? 'bg-[#eef2e8]' : 'bg-[#0b0e14]'
            }`}
          >
            {viewMode === 'three' ? (
              <SpaceViewport3D
                state={state}
                result={result}
                locale={locale}
                northLabel={copy.compass.north}
                entranceLabel={`${copy.compass.entrance} ${state.room.entranceFacing}`}
              />
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
                copy={copy}
                locale={locale}
              />
            )}
          </div>

          {/* 底栏读数 — 固定一行，不滚动 */}
          <div className="flex shrink-0 items-stretch gap-px border-t border-white/10 bg-[#0f131a] text-[10px]">
            <MetricBar label="峰值" value={`${(result.summary.peakEnergy * 100).toFixed(0)}`} />
            <MetricBar label="均值" value={`${(result.summary.avgEnergy * 100).toFixed(0)}`} />
            <MetricBar
              label="滞留"
              value={`${(result.summary.stagnationRatio * 100).toFixed(0)}%`}
            />
            <MetricBar
              label="通道"
              value={`${(result.summary.draftCorridor * 100).toFixed(0)}%`}
            />
            <div className="min-w-0 flex-[2] truncate px-2 py-1.5 text-white/55">
              {result.summary.structuralNotes[0] || result.summary.priorityActions[0] || '—'}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricBar({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-[3.5rem] flex-col justify-center px-2 py-1.5">
      <span className="text-[9px] text-white/40">{label}</span>
      <span className="text-[12px] font-bold tabular-nums text-white/90">{value}</span>
    </div>
  );
}
