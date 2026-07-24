'use client';

import { useMemo, useState } from 'react';
import {
  DOMAIN_LABELS,
  RESIDENTIAL_LAYOUT_OPTIONS,
  SHOP_LAYOUT_OPTIONS,
  TOMB_LAYOUT_OPTIONS,
  VILLA_LAYOUT_OPTIONS,
  RURAL_LAYOUT_OPTIONS,
  OFFICE_LAYOUT_OPTIONS,
  APARTMENT_LAYOUT_OPTIONS,
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
  /** denser single-column for left workbench pane */
  variant?: 'default' | 'sidebar';
};

const DOMAIN_ORDER: LayoutDomain[] = [
  'residential',
  'villa',
  'rural',
  'apartment',
  'office',
  'shop',
  'tomb',
];

const FACINGS = ['东', '东南', '南', '西南', '西', '西北', '北', '东北'];

export function LayoutPresetPicker({
  onApplyPreset,
  onGenerateLlm,
  busy,
  variant = 'default',
}: Props) {
  const sidebar = variant === 'sidebar';
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
        : domain === 'villa'
          ? VILLA_LAYOUT_OPTIONS
          : domain === 'rural'
            ? RURAL_LAYOUT_OPTIONS
            : domain === 'office'
              ? OFFICE_LAYOUT_OPTIONS
              : domain === 'apartment'
                ? APARTMENT_LAYOUT_OPTIONS
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
      ? '阴宅常用 0.5–15㎡（单元投影）'
      : domain === 'shop'
        ? '商铺常见 20–180㎡'
        : '住宅常见 35–160㎡';

  return (
    <div
      className={
        sidebar
          ? 'space-y-2.5'
          : 'space-y-3 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 md:p-4'
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            快速选方案
          </div>
          {!sidebar ? (
            <p className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
              阳宅 / 商铺 / 阴宅等各约 100 套预设；填面积与几室几厅即可快选，也可用 grok-4.3 定制。
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-[color:var(--ink-4)]">
              点选即加载 · 右侧视口同步
            </p>
          )}
        </div>
        <div className="text-[11px] text-[color:var(--ink-5)]">
          {sidebar ? `${domainTotal} 套` : `总目录 ${stats.total} · 本类 ${domainTotal} · 展示前 ${presets.length} 条`}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {DOMAIN_ORDER.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              setDomain(d);
              setLayout('');
              setAreaSqm(
                d === 'tomb'
                  ? 3
                  : d === 'shop'
                    ? 60
                    : d === 'villa'
                      ? 220
                      : d === 'rural'
                        ? 160
                        : d === 'office'
                          ? 300
                          : d === 'apartment'
                            ? 80
                            : 90,
              );
            }}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              domain === d
                ? 'bg-[color:var(--ink-1)] text-white'
                : 'border border-[color:var(--hairline)] text-[color:var(--ink-3)]'
            }`}
          >
            {DOMAIN_LABELS[d]}
          </button>
        ))}
      </div>

      <div className={sidebar ? 'grid gap-2' : 'grid gap-2 sm:grid-cols-2 lg:grid-cols-4'}>
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

      <div
        className={
          sidebar
            ? 'grid max-h-[min(42vh,360px)] gap-1.5 overflow-y-auto'
            : 'grid max-h-[360px] gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3'
        }
      >
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy}
            onClick={() => onApplyPreset(p, areaSqm || p.areaSqm)}
            className={`text-left transition hover:border-[color:var(--brand)]/40 hover:bg-[color:var(--brand-soft)]/40 disabled:opacity-50 ${
              sidebar
                ? 'rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2.5 py-2'
                : 'rounded-xl border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className={`font-bold text-[color:var(--ink-1)] ${sidebar ? 'text-[12px]' : 'text-[13px]'}`}>
                {p.title}
              </div>
              <span className="shrink-0 rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--ink-3)]">
                ~{p.areaSqm}㎡
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-[color:var(--brand-strong)]">{p.layout}</div>
            {!sidebar ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[color:var(--ink-4)]">
                {p.blurb}
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap gap-1">
              {p.tags.slice(0, sidebar ? 2 : 3).map((t) => (
                <span
                  key={t}
                  className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] text-[color:var(--ink-5)]"
                >
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
        {presets.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-[color:var(--hairline)] p-3 text-center text-[12px] text-[color:var(--ink-5)]">
            无匹配预设，可改面积或用下方模型定制。
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-[color:var(--brand)]/25 bg-[color:var(--brand-soft)]/40 p-2.5">
        <div className="text-[12px] font-semibold text-[color:var(--ink-1)]">模型定制</div>
        {!sidebar ? (
          <p className="mt-0.5 text-[11px] text-[color:var(--ink-4)]">
            按面积 + 布局 + 备注生成；优先匹配目录，再用 grok-4.3 细化。
          </p>
        ) : null}
        <div className={`mt-2 grid gap-2 ${sidebar ? '' : 'sm:grid-cols-[1fr_auto_auto]'}`}>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="补充：北入户、后厨…"
            className="fb-input h-9 px-2 text-[13px]"
          />
          <div className={sidebar ? 'grid grid-cols-[1fr_auto] gap-2' : 'contents'}>
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
              className="h-9 rounded-lg bg-[color:var(--ink-1)] px-3 text-[12px] font-semibold text-white disabled:opacity-40"
            >
              {busy ? '…' : '生成并加载'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
