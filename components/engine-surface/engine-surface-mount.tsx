'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import {
  ENGINE_MODULE_META,
  type EngineModuleId,
  type EngineSurfacePack,
} from '@/lib/engine-surface/types';

type Props = {
  pack: EngineSurfacePack;
  /** Prefer these modules first when available */
  prefer?: EngineModuleId[];
  /** Start with all modules expanded */
  dense?: boolean;
  title?: string;
  className?: string;
  /** Anchor id (default engine-surface) */
  id?: string;
};

/**
 * Reusable engine/structure display mount.
 * Use on report, tool-result, expert — same pack, same modules.
 */
export default function EngineSurfaceMount({
  pack,
  prefer,
  dense = false,
  title = '引擎结构台',
  className = '',
  id = 'engine-surface',
}: Props) {
  const available = useMemo(() => {
    const set = new Set(pack.modules);
    const ordered = [
      ...(prefer || []),
      ...pack.modules,
    ].filter((mid, i, arr) => set.has(mid) && arr.indexOf(mid) === i);
    return ordered;
  }, [pack.modules, prefer]);

  const [active, setActive] = useState<EngineModuleId | 'all'>(
    dense ? 'all' : available[0] || 'all',
  );

  if (!available.length) return null;

  const show = (mid: EngineModuleId) => active === 'all' || active === mid;

  return (
    <section
      id={id}
      className={`scroll-mt-header rounded-[12px] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 md:p-4 ${className}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
            Engine Surface · 结构化展示
          </p>
          <h2 className="mt-0.5 text-[15px] font-bold text-[color:var(--ink-1)] md:text-[16px]">
            {title}
          </h2>
          <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">
            引擎与结构字段的可复用模块 · 点击切换 · 全开可对照
            {pack.dayMaster ? ` · 日主 ${pack.dayMaster}` : ''}
            {pack.pattern ? ` · ${pack.pattern}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {pack.tags.slice(0, 6).map((t) => (
            <span
              key={t}
              className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--ink-3)]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Module rail */}
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[color:var(--hairline)] pt-3">
        <Chip
          on={active === 'all'}
          onClick={() => setActive('all')}
          label="全部"
        />
        {available.map((id) => (
          <Chip
            key={id}
            on={active === id}
            onClick={() => setActive(id)}
            label={ENGINE_MODULE_META[id].short}
            title={ENGINE_MODULE_META[id].blurb}
          />
        ))}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {show('identity') && pack.identity ? (
          <Card title="排盘锁定" blurb={ENGINE_MODULE_META.identity.blurb}>
            <Row k="钟表" v={`${pack.identity.clockBirthDate || '—'} ${pack.identity.clockBirthTime || ''}`} />
            {pack.identity.effectiveBirthTime &&
            pack.identity.effectiveBirthTime !== pack.identity.clockBirthTime ? (
              <Row k="有效" v={pack.identity.effectiveBirthTime} />
            ) : null}
            {pack.identity.chartFingerprint ? (
              <Row k="指纹" v={pack.identity.chartFingerprint} mono />
            ) : null}
            <Row
              k="选项"
              v={[
                pack.identity.useSolarTime ? '真太阳时' : '钟表时',
                pack.identity.useSeparateZiHour ? '晚子换日' : '晚子不换日',
              ].join(' · ')}
            />
            {pack.identity.birthPlace ? <Row k="地点" v={pack.identity.birthPlace} /> : null}
            {pack.identity.timeMismatch ? (
              <p className="mt-1 text-[11px] font-medium text-amber-800">
                资料时间与锁定时间不一致，以锁定为准。
              </p>
            ) : null}
          </Card>
        ) : null}

        {show('pillars') && pack.pillars.length ? (
          <Card title="四柱" blurb={ENGINE_MODULE_META.pillars.blurb}>
            <div className="grid grid-cols-4 gap-1.5">
              {pack.pillars.map((p) => (
                <div
                  key={p.label}
                  className="rounded-[6px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-1.5 py-1.5 text-center"
                >
                  <div className="text-[10px] text-[color:var(--ink-5)]">{p.label}</div>
                  <div className="font-mono text-[14px] font-bold text-[color:var(--ink-1)]">
                    {p.ganZhi}
                  </div>
                </div>
              ))}
            </div>
            {pack.dayMaster ? (
              <p className="mt-2 text-[12px] text-[color:var(--ink-3)]">
                日主 <span className="font-bold text-[color:var(--ink-1)]">{pack.dayMaster}</span>
              </p>
            ) : null}
          </Card>
        ) : null}

        {show('yongji') && (pack.yongShen.length || pack.jiShen.length) ? (
          <Card title="用神忌神" blurb={ENGINE_MODULE_META.yongji.blurb}>
            <div className="flex flex-wrap gap-1.5">
              {pack.yongShen.map((y) => (
                <Tag key={`y-${y}`} tone="up">
                  用 {y}
                </Tag>
              ))}
              {pack.xiShen.map((x) => (
                <Tag key={`x-${x}`} tone="brand">
                  喜 {x}
                </Tag>
              ))}
              {pack.jiShen.map((j) => (
                <Tag key={`j-${j}`} tone="warn">
                  忌 {j}
                </Tag>
              ))}
            </div>
          </Card>
        ) : null}

        {show('elements') && pack.elements.length ? (
          <Card title="五行" blurb={ENGINE_MODULE_META.elements.blurb}>
            <ul className="space-y-1">
              {pack.elements.map((e) => (
                <li key={e.key} className="flex items-center gap-2 text-[12px]">
                  <span className="w-6 font-semibold text-[color:var(--ink-1)]">{e.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--hairline)]">
                    <div
                      className="h-full rounded-full bg-[color:var(--brand-strong)]"
                      style={{
                        width: `${Math.min(100, Math.max(4, Number(e.strength) || 0))}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-right tabular-nums text-[color:var(--ink-4)]">
                    {typeof e.strength === 'number' ? Math.round(e.strength) : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {show('dayun') && pack.dayun.length ? (
          <Card title="大运" blurb={ENGINE_MODULE_META.dayun.blurb} wide>
            <div className="max-h-48 overflow-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="text-[color:var(--ink-5)]">
                  <tr>
                    <th className="py-1 font-medium">干支</th>
                    <th className="py-1 font-medium">年份</th>
                    <th className="py-1 font-medium">质量</th>
                    <th className="py-1 font-medium">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {pack.dayun.map((d) => (
                    <tr
                      key={`${d.ganZhi}-${d.startYear}`}
                      className={`border-t border-[color:var(--hairline)] ${
                        d.isCurrent ? 'bg-[color:var(--brand-soft)]/30' : ''
                      }`}
                    >
                      <td className="py-1 font-mono font-bold">{d.ganZhi}</td>
                      <td className="py-1 tabular-nums text-[color:var(--ink-3)]">
                        {d.startYear}–{d.endYear}
                        {d.startAge != null ? ` · ${d.startAge}–${d.endAge}岁` : ''}
                      </td>
                      <td className="py-1">{d.quality || d.yongShenMatch || '—'}</td>
                      <td className="py-1">{d.isCurrent ? '当前' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}

        {show('kline') && pack.kline ? (
          <Card title="人生 K 线" blurb={ENGINE_MODULE_META.kline.blurb}>
            {pack.kline.stageHeadline ? (
              <p className="text-[12px] font-medium leading-relaxed text-[color:var(--ink-2)]">
                {pack.kline.stageHeadline}
              </p>
            ) : null}
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
              <Mini k="样本" v={pack.kline.spanLabel || `${pack.kline.sampleYears}年`} />
              <Mini
                k="今年"
                v={
                  pack.kline.currentScore != null
                    ? String(pack.kline.currentScore)
                    : '—'
                }
              />
              <Mini
                k="高点"
                v={
                  pack.kline.peakYear
                    ? `${pack.kline.peakYear}·${pack.kline.peakScore ?? ''}`
                    : '—'
                }
              />
              <Mini
                k="低谷"
                v={
                  pack.kline.troughYear
                    ? `${pack.kline.troughYear}·${pack.kline.troughScore ?? ''}`
                    : '—'
                }
              />
            </div>
            {pack.kline.href ? (
              <a
                href={pack.kline.href}
                className="mt-2 inline-block text-[12px] font-semibold text-[color:var(--ink-1)] underline-offset-2 hover:underline"
              >
                打开完整 K 线 / 引擎台 →
              </a>
            ) : null}
          </Card>
        ) : null}

        {show('months') && pack.months.length ? (
          <Card title="近月节奏" blurb={ENGINE_MODULE_META.months.blurb} wide>
            <div className="flex flex-wrap gap-1.5">
              {pack.months.map((m) => (
                <span
                  key={m.key}
                  className="rounded-[6px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/40 px-2 py-1 text-[11px]"
                >
                  <span className="font-semibold text-[color:var(--ink-2)]">{m.label}</span>
                  {m.score != null ? (
                    <span className="ml-1 tabular-nums text-[color:var(--ink-1)]">{m.score}</span>
                  ) : null}
                  {m.status ? (
                    <span className="ml-1 text-[color:var(--ink-5)]">{m.status}</span>
                  ) : null}
                </span>
              ))}
            </div>
          </Card>
        ) : null}

        {show('almanac') ? (
          <Card title="万年历" blurb={ENGINE_MODULE_META.almanac.blurb}>
            <p className="text-[12px] text-[color:var(--ink-3)]">{pack.almanac.blurb}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={pack.almanac.todayHref}
                className="rounded-full bg-[color:var(--ink-1)] px-3 py-1 text-[12px] font-semibold text-white"
              >
                今日通书
              </Link>
              {pack.almanac.yearHref ? (
                <Link
                  href={pack.almanac.yearHref}
                  className="rounded-full border border-[color:var(--hairline-strong)] px-3 py-1 text-[12px] font-medium text-[color:var(--ink-2)]"
                >
                  本年入口
                </Link>
              ) : null}
              <Link
                href="/almanac"
                className="rounded-full px-3 py-1 text-[12px] text-[color:var(--ink-4)] hover:underline"
              >
                通书首页
              </Link>
            </div>
          </Card>
        ) : null}

        {show('tenGods') && pack.tenGods.length ? (
          <Card title="十神" blurb={ENGINE_MODULE_META.tenGods.blurb}>
            <ul className="space-y-1 text-[12px]">
              {pack.tenGods.map((t) => (
                <li key={t.label}>
                  <span className="font-semibold text-[color:var(--ink-2)]">{t.label}</span>
                  <span className="text-[color:var(--ink-4)]"> · {t.value}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {show('shenSha') && pack.shenSha.length ? (
          <Card title="神煞" blurb={ENGINE_MODULE_META.shenSha.blurb}>
            <div className="flex flex-wrap gap-1.5">
              {pack.shenSha.map((s) => (
                <Tag key={s}>{s}</Tag>
              ))}
            </div>
          </Card>
        ) : null}

        {show('risks') && pack.risks.length ? (
          <Card title="避险" blurb={ENGINE_MODULE_META.risks.blurb}>
            <ul className="space-y-1 text-[12px] text-[color:var(--ink-2)]">
              {pack.risks.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
          </Card>
        ) : null}

        {show('formula') ? (
          <Card title="引擎口径" blurb={ENGINE_MODULE_META.formula.blurb} wide>
            <ul className="space-y-1 text-[11px] leading-relaxed text-[color:var(--ink-4)]">
              {pack.formulaLines.map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
            <p className="mt-2 text-[10px] text-[color:var(--ink-5)]">
              pack {pack.version} · source {pack.source}
              {pack.reportId ? ` · ${pack.reportId}` : ''}
            </p>
          </Card>
        ) : null}
      </div>
    </section>
  );
}

function Chip({
  on,
  onClick,
  label,
  title,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={
        on
          ? 'rounded-full bg-[color:var(--ink-1)] px-2.5 py-1 text-[11px] font-semibold text-white'
          : 'rounded-full border border-[color:var(--hairline)] px-2.5 py-1 text-[11px] text-[color:var(--ink-4)] hover:border-[color:var(--ink-1)]'
      }
    >
      {label}
    </button>
  );
}

function Card({
  title,
  blurb,
  children,
  wide,
}: {
  title: string;
  blurb?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-[10px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/20 p-3 ${
        wide ? 'md:col-span-2' : ''
      }`}
    >
      <div className="text-[12px] font-bold text-[color:var(--ink-1)]">{title}</div>
      {blurb ? (
        <div className="mt-0.5 text-[10px] text-[color:var(--ink-5)]">{blurb}</div>
      ) : null}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex gap-2 text-[12px] leading-relaxed">
      <span className="w-10 shrink-0 text-[color:var(--ink-5)]">{k}</span>
      <span
        className={`min-w-0 break-all text-[color:var(--ink-2)] ${
          mono ? 'font-mono text-[11px]' : ''
        }`}
      >
        {v}
      </span>
    </div>
  );
}

function Mini({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1">
      <div className="text-[10px] text-[color:var(--ink-5)]">{k}</div>
      <div className="font-semibold tabular-nums text-[color:var(--ink-1)]">{v}</div>
    </div>
  );
}

function Tag({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'up' | 'warn' | 'brand';
}) {
  const cls =
    tone === 'up'
      ? 'border-[rgba(47,125,82,0.25)] bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : tone === 'brand'
          ? 'border-[color:var(--brand-strong)]/25 bg-[color:var(--brand-soft)]/40 text-[color:var(--brand-strong)]'
          : 'border-[color:var(--hairline)] bg-white text-[color:var(--ink-3)]';
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}
