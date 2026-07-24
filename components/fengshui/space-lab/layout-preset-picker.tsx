'use client';

import { useEffect, useMemo, useState } from 'react';
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
  /** 切换领域时立即切换右侧 Three.js 模型（无需等点方案） */
  onDomainChange?: (domain: LayoutDomain) => void;
  busy?: boolean;
  /** fit = dense list like 选房站, paginated, no sparse cards */
  variant?: 'default' | 'sidebar' | 'fit';
  /** 当前已激活领域（与 3D 同步高亮） */
  activeDomain?: LayoutDomain;
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

/** 选房站风格：一屏约 10 行密列表 */
const PAGE_SIZE_FIT = 10;

export function LayoutPresetPicker({
  onApplyPreset,
  onGenerateLlm,
  onDomainChange,
  busy,
  variant = 'default',
  activeDomain,
}: Props) {
  const fit = variant === 'fit' || variant === 'sidebar';
  const [domain, setDomain] = useState<LayoutDomain>(activeDomain || 'residential');

  useEffect(() => {
    if (activeDomain && activeDomain !== domain) setDomain(activeDomain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDomain]);
  const [layout, setLayout] = useState('');
  const [areaSqm, setAreaSqm] = useState(90);
  const [facing, setFacing] = useState('南');
  const [notes, setNotes] = useState('');
  const [model, setModel] = useState<'grok-4.3-fast' | 'grok-4.3-high'>('grok-4.3-fast');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [appliedId, setAppliedId] = useState<string | null>(null);

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

  const presets = useMemo(() => {
    return filterPresets({
      domain,
      layout: layout || undefined,
      areaSqm,
      query: query || undefined,
    });
  }, [domain, layout, areaSqm, query]);

  const domainTotal = listPresets(domain).length;
  const pageSize = fit ? PAGE_SIZE_FIT : 48;
  const capped = presets.slice(0, fit ? 80 : presets.length);
  const pageCount = Math.max(1, Math.ceil(capped.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = capped.slice(safePage * pageSize, safePage * pageSize + pageSize);

  useEffect(() => {
    setPage(0);
  }, [domain, layout, areaSqm, query]);

  const pickDomain = (d: LayoutDomain) => {
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
    onDomainChange?.(d);
  };

  return (
    <div className={fit ? 'flex h-full min-h-0 flex-col gap-1.5 overflow-hidden' : 'space-y-3'}>
      <div className="flex shrink-0 items-center justify-between gap-1">
        <span className="text-[11px] font-bold tracking-wide text-[color:var(--brand-strong)]">
          方案目录
        </span>
        <span className="tabular-nums text-[10px] text-[color:var(--ink-5)]">
          {DOMAIN_LABELS[domain]} {domainTotal} · {safePage + 1}/{pageCount}
        </span>
      </div>

      {/* 领域 — 紧凑胶囊一行多枚 */}
      <div className="flex shrink-0 flex-wrap gap-0.5">
        {DOMAIN_ORDER.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => pickDomain(d)}
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${
              domain === d
                ? 'bg-[color:var(--ink-1)] text-white'
                : 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)] hover:bg-[color:var(--hairline)]'
            }`}
          >
            {DOMAIN_LABELS[d]}
          </button>
        ))}
      </div>

      {/* 筛选条 — 买房站风格工具栏 */}
      <div className="grid shrink-0 grid-cols-4 gap-1">
        <input
          type="number"
          min={domain === 'tomb' ? 0.3 : 12}
          max={domain === 'tomb' ? 30 : 300}
          step={domain === 'tomb' ? 0.1 : 1}
          value={areaSqm}
          onChange={(e) => setAreaSqm(Number(e.target.value) || 0)}
          className="fb-input h-7 px-1 text-[11px]"
          title="面积㎡"
          placeholder="面积"
        />
        <select
          value={layout}
          onChange={(e) => setLayout(e.target.value)}
          className="fb-input h-7 px-0.5 text-[10px]"
          title="布局"
        >
          <option value="">布局</option>
          {layoutOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <select
          value={facing}
          onChange={(e) => setFacing(e.target.value)}
          className="fb-input h-7 px-0.5 text-[10px]"
          title="朝向"
        >
          {FACINGS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜"
          className="fb-input h-7 px-1 text-[11px]"
        />
      </div>

      {/* 密列表 — 像贝壳/链家房源行，非大卡片 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-[color:var(--hairline)]">
        <div className="grid shrink-0 grid-cols-[1fr_44px_40px] gap-1 border-b border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2 py-1 text-[9px] font-medium text-[color:var(--ink-5)]">
          <span>方案</span>
          <span className="text-right">面积</span>
          <span className="text-right">热度</span>
        </div>
        <ul className="flex min-h-0 flex-1 flex-col">
          {pageItems.map((p, idx) => {
            const active = appliedId === p.id;
            return (
              <li key={p.id} className="min-h-0 flex-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setAppliedId(p.id);
                    onApplyPreset(p, areaSqm || p.areaSqm);
                  }}
                  className={`grid h-full w-full grid-cols-[1fr_44px_40px] items-center gap-1 border-b border-[color:var(--hairline)]/70 px-2 text-left transition disabled:opacity-50 ${
                    active
                      ? 'bg-[color:var(--brand-soft)]'
                      : idx % 2 === 0
                        ? 'bg-[color:var(--paper)] hover:bg-[color:var(--bg-sunken)]'
                        : 'bg-[color:var(--bg-sunken)]/40 hover:bg-[color:var(--bg-sunken)]'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[11px] font-semibold leading-tight text-[color:var(--ink-1)]">
                      {p.title}
                    </span>
                    <span className="block truncate text-[9px] leading-tight text-[color:var(--ink-5)]">
                      {p.layout}
                      {p.tags[0] ? ` · ${p.tags[0]}` : ''}
                    </span>
                  </span>
                  <span className="text-right text-[11px] font-semibold tabular-nums text-[color:var(--ink-2)]">
                    {p.areaSqm}
                  </span>
                  <span className="text-right text-[10px] tabular-nums text-[color:var(--ink-5)]">
                    {p.popularity}
                  </span>
                </button>
              </li>
            );
          })}
          {pageItems.length === 0 ? (
            <li className="flex flex-1 items-center justify-center text-[11px] text-[color:var(--ink-5)]">
              无匹配方案
            </li>
          ) : null}
        </ul>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-1">
        <button
          type="button"
          disabled={safePage <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="rounded px-2 py-0.5 text-[10px] font-semibold text-[color:var(--ink-2)] ring-1 ring-[color:var(--hairline)] disabled:opacity-30"
        >
          上页
        </button>
        <span className="text-[9px] text-[color:var(--ink-5)]">
          {safePage * pageSize + 1}–{safePage * pageSize + pageItems.length} / {capped.length}
        </span>
        <button
          type="button"
          disabled={safePage >= pageCount - 1}
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          className="rounded px-2 py-0.5 text-[10px] font-semibold text-[color:var(--ink-2)] ring-1 ring-[color:var(--hairline)] disabled:opacity-30"
        >
          下页
        </button>
      </div>

      <div className="grid shrink-0 grid-cols-[1fr_auto_auto] gap-1">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="AI 定制备注"
          className="fb-input h-7 px-1.5 text-[11px]"
        />
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as 'grok-4.3-fast' | 'grok-4.3-high')}
          className="fb-input h-7 px-0.5 text-[10px]"
        >
          <option value="grok-4.3-fast">fast</option>
          <option value="grok-4.3-high">high</option>
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
              presetId: pageItems[0]?.id,
            })
          }
          className="h-7 rounded-md bg-[color:var(--ink-1)] px-2 text-[10px] font-semibold text-white disabled:opacity-40"
        >
          {busy ? '…' : '生成'}
        </button>
      </div>
    </div>
  );
}
