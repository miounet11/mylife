'use client';

import { useMemo, useState } from 'react';
import {
  DOMAIN_LABELS,
  RESIDENTIAL_LAYOUT_OPTIONS,
  SHOP_LAYOUT_OPTIONS,
  TOMB_LAYOUT_OPTIONS,
  filterPresets,
  listPresets,
  presetCatalogStats,
  type LayoutDomain,
  type LayoutPreset,
} from '@/lib/fengshui/space/layout-presets';

type Props = {
  onApplyPreset: (preset: LayoutPreset, areaSqm: number) => void;
  onGenerateLlm: (input: {
    domain: LayoutDomain;
    layout: string;
    areaSqm: number;
    entranceFacing: string;
    notes: string;
    model: 'grok-4.3-fast' | 'grok-4.3-high';
    presetId?: string;
  }) => Promise<void>;
  busy?: boolean;
};

const FACINGS = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'];

export function LayoutPresetPicker({ onApplyPreset, onGenerateLlm, busy }: Props) {
  const [domain, setDomain] = useState<LayoutDomain>('residential');
  const [layout, setLayout] = useState('');
  const [areaSqm, setAreaSqm] = useState(90);
  const [facing, setFacing] = useState('南');
  const [notes, setNotes] = useState('');
  const [model, setModel] = useState<'grok-4.3-fast' | 'grok-4.3-high'>('grok-4.3-fast');
  const [query, setQuery] = useState('');

  const layoutOptions =
    domain === 'shop'
      ? SHOP_LAYOUT_OPTIONS
      : domain === 'tomb'
        ? TOMB_LAYOUT_OPTIONS
        : RESIDENTIAL_LAYOUT_OPTIONS;

  const stats = useMemo(() => presetCatalogStats(), []);

  const presets = useMemo(() => {
    const list = filterPresets({
      domain,
      layout: layout || undefined,
      areaSqm,
      query: query || undefined,
    });
    // UI: show top matches first; cap render for performance
    return list.slice(0, 48);
  }, [domain, layout, areaSqm, query]);

  const domainTotal = listPresets(domain).length;

  const areaHint =
    domain === 'tomb'
      ? '穴位常用 0.5–15㎡（单元投影）'
      : domain === 'shop'
        ? '商铺常见 20–180㎡'
        : '住宅常见 35–160㎡';

  return (
    <div className="space-y-3 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 md:p-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            快速选方案
          </div>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
            住宅 / 商铺 / 墓穴各约 100 套预设；填面积与几室几厅即可快选，也可用 grok-4.3 定制。
          </p>
        </div>
        <div className="text-[11px] text-[color:var(--ink-5)]">
          总目录 {stats.total} · 本类 {domainTotal} · 展示前 {presets.length} 条
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(DOMAIN_LABELS) as LayoutDomain[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setDomain(d);
              setLayout('');
              setAreaSqm(d === 'tomb' ? 3 : d === 'shop' ? 60 : 90);
            }}
            className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
              domain === d
                ? 'bg-[color:var(--ink-1)] text-white'
                : 'border border-[color:var(--hairline)] text-[color:var(--ink-3)]'
            }`}
          >
            {DOMAIN_LABELS[d]}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block space-y-1 text-[12px]">
          <span className="text-[color:var(--ink-5)]">面积 ㎡ · {areaHint}</span>
          <input
            type="number"
            min={domain === 'tomb' ? 0.3 : 12}
            max={domain === 'tomb' ? 30 : 300}
            step={domain === 'tomb' ? 0.1 : 1}
            value={areaSqm}
            onChange={(e) => setAreaSqm(Number(e.target.value) || 0)}
            className="fb-input h-9 w-full px-2 text-[13px]"
          />
        </label>
        <label className="block space-y-1 text-[12px]">
          <span className="text-[color:var(--ink-5)]">布局 / 业态</span>
          <select
            value={layout}
            onChange={(e) => setLayout(e.target.value)}
            className="fb-input h-9 w-full px-2 text-[13px]"
          >
            <option value="">全部</option>
            {layoutOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-[12px]">
          <span className="text-[color:var(--ink-5)]">主入口 / 朝向</span>
          <select
            value={facing}
            onChange={(e) => setFacing(e.target.value)}
            className="fb-input h-9 w-full px-2 text-[13px]"
          >
            {FACINGS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-[12px]">
          <span className="text-[color:var(--ink-5)]">关键词</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="如：南北、角铺、壁葬"
            className="fb-input h-9 w-full px-2 text-[13px]"
          />
        </label>
      </div>

      <div className="grid max-h-[360px] gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy}
            onClick={() => onApplyPreset(p, areaSqm || p.areaSqm)}
            className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3 text-left transition hover:border-[color:var(--brand)]/40 hover:bg-[color:var(--brand-soft)]/40 disabled:opacity-50"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-[13px] font-bold text-[color:var(--ink-1)]">{p.title}</div>
              <span className="shrink-0 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--ink-3)]">
                ~{p.areaSqm}㎡
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-[color:var(--brand-strong)]">{p.layout}</div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[color:var(--ink-4)]">
              {p.blurb}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-[color:var(--ink-5)]"
                >
                  {t}
                </span>
              ))}
              <span className="text-[10px] text-[color:var(--ink-5)]">热度 {p.popularity}</span>
            </div>
          </button>
        ))}
        {presets.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-[color:var(--hairline)] p-4 text-center text-[12px] text-[color:var(--ink-5)]">
            无匹配预设，可改面积或用下方模型定制。
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-[color:var(--brand)]/25 bg-[color:var(--brand-soft)]/40 p-3">
        <div className="text-[12px] font-semibold text-[color:var(--ink-1)]">模型定制布局</div>
        <p className="mt-0.5 text-[11px] text-[color:var(--ink-4)]">
          按面积 + 布局 + 备注生成；优先匹配目录，再用 grok-4.3 细化。
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="补充：如北入户、要后厨、双穴靠山侧…"
            className="fb-input h-9 px-2 text-[13px]"
          />
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as 'grok-4.3-fast' | 'grok-4.3-high')}
            className="fb-input h-9 px-2 text-[12px]"
          >
            <option value="grok-4.3-fast">grok-4.3-fast</option>
            <option value="grok-4.3-high">grok-4.3-high</option>
          </select>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void onGenerateLlm({
                domain,
                layout,
                areaSqm,
                entranceFacing: facing,
                notes,
                model,
                presetId: presets[0]?.id,
              })
            }
            className="h-9 rounded-lg bg-[color:var(--ink-1)] px-4 text-[12px] font-semibold text-white disabled:opacity-40"
          >
            {busy ? '生成中…' : '生成并加载'}
          </button>
        </div>
      </div>
    </div>
  );
}
