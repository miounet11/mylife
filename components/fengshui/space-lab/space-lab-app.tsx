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

export function SpaceLabApp() {
  const [state, setState] = useState<SpaceLabState>(() => createDefaultLabState());
  const [selectedVentId, setSelectedVentId] = useState<string | null>('vent-in-1');
  const [viewMode, setViewMode] = useState<ViewMode>('three');
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--brand-strong)]">
            Space Field Lab Pro
          </p>
          <h1 className="mt-1 text-[22px] font-black tracking-tight text-[color:var(--ink-1)] md:text-[26px]">
            空间场模拟工作台
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[color:var(--ink-4)]">
            选阳宅/铺面/阴宅 · 人流估算 · 地图注入 · 预设缩放 · grok-4.3 定制 · 多模态门窗 · 真 3D 与热力 · 会员存档。
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
            AI 户型深聊
          </Link>
          <Link
            href="/membership?source=fengshui_space"
            className="rounded-full border border-[color:var(--brand)]/30 bg-[color:var(--brand-soft)] px-3 py-1.5 font-semibold text-[color:var(--brand-strong)]"
          >
            会员权益
          </Link>
        </div>
      </div>

      {/* status / membership strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2 text-[12px]">
        <span className="font-semibold text-[color:var(--ink-2)]">
          {memberInfo?.isMember ? '会员 · 无限存档' : `免费存档 ${memberInfo?.used ?? 0}/${memberInfo?.freeLimit ?? 3}`}
        </span>
        <span className="text-[color:var(--ink-5)]">·</span>
        <span className="text-[color:var(--ink-4)]">
          上传平面图后自动建议门窗；可拖动微调再保存 tool_session
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            disabled={suggesting || !state.underlayDataUrl}
            onClick={() =>
              state.underlayDataUrl &&
              void runOpeningSuggest(state.underlayDataUrl, state.room.entranceFacing)
            }
            className="rounded-lg bg-[color:var(--ink-1)] px-3 py-1.5 font-semibold text-white disabled:opacity-40"
          >
            {suggesting ? '识别中…' : '重新识别门窗'}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveSession()}
            className="rounded-lg border border-[color:var(--brand)] bg-[color:var(--brand-soft)] px-3 py-1.5 font-semibold text-[color:var(--brand-strong)] disabled:opacity-40"
          >
            {saving ? '保存中…' : '保存结果'}
          </button>
          <button
            type="button"
            disabled={publishing}
            onClick={() => void publishInsight()}
            className="rounded-lg border border-[color:var(--hairline)] px-3 py-1.5 font-semibold text-[color:var(--ink-2)] disabled:opacity-40"
          >
            {publishing ? '生成公开文…' : '脱敏发文'}
          </button>
          {lastSessionId ? (
            <Link
              href={`/tool-result/${lastSessionId}`}
              className="rounded-lg border border-[color:var(--hairline)] px-3 py-1.5 text-[color:var(--ink-2)]"
            >
              查看存档
            </Link>
          ) : null}
          {publicUrl ? (
            <Link
              href={publicUrl}
              className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 font-semibold text-emerald-800"
            >
              打开公开笔记
            </Link>
          ) : null}
        </div>
      </div>

      <LayoutPresetPicker
        busy={generatingLayout || suggesting}
        onApplyPreset={applyLayoutPreset}
        onGenerateLlm={generateLayoutLlm}
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <MapPlacePicker value={state.geo} onSelect={injectGeo} />
        {result.qimen ? (
          <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 text-[12px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
              奇门遁甲示意 · {result.qimen.juLabel}
            </div>
            <p className="mt-1 text-[11px] text-[color:var(--ink-4)]">
              值符 {result.qimen.valueFu} · 值使 {result.qimen.valueShi} · 时
              {result.qimen.hourPillar} / 日{result.qimen.dayPillar}
            </p>
            <ul className="mt-2 grid grid-cols-3 gap-1.5">
              {result.qimen.palaces.map((p) => (
                <li
                  key={p.index}
                  className="rounded-lg bg-[color:var(--bg-sunken)] px-1.5 py-1 text-[10px] leading-snug"
                >
                  <span className="font-semibold text-[color:var(--ink-1)]">
                    {p.index + 1} {p.door}
                  </span>
                  <div className="text-[color:var(--ink-5)]">{p.star}</div>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--ink-4)]">
              {result.qimen.summaryNotes[2] || result.qimen.summaryNotes[0]}
            </p>
          </div>
        ) : null}
      </div>

      <SiteAdvisorPanel
        currentGeo={state.geo}
        onInjectWinner={injectSiteWinner}
        onApplyDomain={(domain) => {
          setBanner(
            `请在上方「快速选方案」切换到对应领域（推荐 domain：${domain === 'tomb' ? '阴宅' : domain === 'shop' ? '商铺' : domain === 'villa' ? '别墅' : domain === 'apartment' ? '公寓楼' : '阳宅'}）并加载预设`,
          );
        }}
      />

      {banner ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[12px] text-emerald-800">
          {banner}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-400/40 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}{' '}
          {error.includes('会员') ? (
            <Link href="/membership?source=fengshui_space_save" className="font-semibold underline">
              去开通
            </Link>
          ) : null}
        </div>
      ) : null}

      {openings.length > 0 ? (
        <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
            多模态门窗建议
          </div>
          <ul className="mt-2 grid gap-2 md:grid-cols-3">
            {openings.map((o, i) => (
              <li
                key={`${o.label}-${i}`}
                className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--paper)] p-2 text-[12px]"
              >
                <div className="font-semibold text-[color:var(--ink-1)]">
                  {o.label}{' '}
                  <span className="text-[10px] font-normal text-[color:var(--ink-5)]">
                    {o.kind === 'inlet' ? '进风' : '出风'} · 置信 {(o.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--ink-4)]">{o.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
            onClearUnderlay={() => {
              patch((s) => ({ ...s, underlayDataUrl: null }));
              setOpenings([]);
            }}
            viewMode={viewMode === 'three' ? 'plan' : viewMode}
            onViewMode={(m) => setViewMode(m)}
            extraViewModes={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('plan')}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold ${
                    viewMode === 'plan' ? 'bg-white text-black' : 'bg-white/10'
                  }`}
                >
                  平面热力
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('iso')}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold ${
                    viewMode === 'iso' ? 'bg-white text-black' : 'bg-white/10'
                  }`}
                >
                  等距示意
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('three')}
                  className={`flex-1 rounded-lg py-1.5 text-[11px] font-semibold ${
                    viewMode === 'three' ? 'bg-amber-400 text-black' : 'bg-white/10'
                  }`}
                >
                  真 3D
                </button>
              </div>
            }
          />
        </div>

        <div className="order-1 min-h-[420px] overflow-hidden rounded-xl border border-[color:var(--hairline)] bg-[#0b0e14] shadow-lg lg:order-2 lg:min-h-[640px]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2 text-[11px] text-white/60">
            <span>
              视口 ·{' '}
              {viewMode === 'plan'
                ? '平面热力'
                : viewMode === 'iso'
                  ? '等距立体'
                  : 'Three.js 真 3D'}
            </span>
            <button
              type="button"
              className="rounded-md bg-white/10 px-2 py-0.5 text-white/80 hover:bg-white/15"
              onClick={() => {
                setState(createDefaultLabState());
                setSelectedVentId('vent-in-1');
                setOpenings([]);
                setTick((t) => t + 1);
              }}
            >
              重置流场
            </button>
          </div>
          <div className="h-[520px] w-full lg:h-[600px]">
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
        热力与 3D 雾效为结构近似可视化；多模态门窗建议可被拖动覆盖。存档写入 tool_sessions，会员无限回看。
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
