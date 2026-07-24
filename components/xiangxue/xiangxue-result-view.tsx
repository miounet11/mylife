'use client';

/**
 * 面相 / 手相 · 结果页
 * 视觉对齐全站 Linear 浅色壳：paper / ink / hairline / brand
 * 功能保留：双层分析、章节筛选、框架表、维度分
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { XiangxueLayer, XiangxueSessionResult } from '@/lib/xiangxue';

type Props = {
  sessionId: string;
  result: XiangxueSessionResult;
};

const LAYER_META: Record<
  XiangxueLayer,
  { label: string; short: string; badge: string; bar: string; soft: string; border: string; text: string }
> = {
  physical: {
    label: '物理层',
    short: '物理',
    badge: 'bg-slate-800 text-white',
    bar: 'bg-slate-700',
    soft: 'bg-[color:var(--bg)]',
    border: 'border-[color:var(--hairline)]',
    text: 'text-[color:var(--ink-1)]',
  },
  mingli: {
    label: '命理层',
    short: '命理',
    badge: 'bg-[color:var(--brand)] text-white',
    bar: 'bg-[color:var(--brand)]',
    soft: 'bg-[color:var(--brand-soft)]',
    border: 'border-indigo-100',
    text: 'text-indigo-950',
  },
  meta: {
    label: '综合',
    short: '综合',
    badge: 'bg-slate-600 text-white',
    bar: 'bg-slate-500',
    soft: 'bg-[color:var(--bg-sunken)]',
    border: 'border-[color:var(--hairline)]',
    text: 'text-[color:var(--ink-1)]',
  },
};

type Filter = 'all' | XiangxueLayer;

export function XiangxueResultView({ sessionId, result }: Props) {
  const kindPath = result.kind === 'face' ? 'physiognomy' : 'palmistry';
  const isFace = result.kind === 'face';
  const [filter, setFilter] = useState<Filter>('all');

  const physicalDims = (result.dims || []).filter((d) => d.layer === 'physical' || !d.layer);
  const mingliDims = (result.dims || []).filter((d) => d.layer === 'mingli');
  const sections = result.sections?.length ? result.sections : fallbackSections(result);

  const visibleSections = useMemo(() => {
    if (filter === 'all') return sections;
    return sections.filter((s) => s.layer === filter);
  }, [sections, filter]);

  const conf = result.confidenceScore ?? result.photoQuality?.score ?? 50;

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-3 py-6 sm:px-4 pb-16">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--hairline)] pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[color:var(--ink-4)]">
            <span className="uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
              {isFace ? 'Physiognomy' : 'Palmistry'} · 系统报告
            </span>
            <span className="text-[color:var(--ink-5)]">·</span>
            <span>{result.schema === 'life-kline.xiangxue.v3' ? 'v3' : 'v2'}</span>
            <span className="text-[color:var(--ink-5)]">·</span>
            <span>{result.llmUsed ? '视觉模型已读图' : '结构引擎'}</span>
          </div>
          <h1 className="mt-1 text-[24px] font-black tracking-tight text-[color:var(--ink-1)] sm:text-[26px]">
            {result.title}
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[color:var(--ink-3)]">
            {result.summary}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {(result.visibleTags || []).slice(0, 10).map((t) => (
              <span
                key={t}
                className="rounded-md bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--ink-3)]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        {result.media?.publicPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.media.publicPath}
            alt=""
            className="h-24 w-24 shrink-0 rounded-xl border border-[color:var(--hairline)] object-cover shadow-sm"
          />
        ) : null}
      </header>

      {/* Score row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ScoreCard label="综合" value={result.overallScore} emphasize />
        <ScoreCard label="物理层" value={result.physicalScore ?? result.overallScore} />
        <ScoreCard label="命理层" value={result.mingliScore ?? result.overallScore} />
        <ScoreCard label="可信度" value={conf} />
      </div>

      {/* Dual headlines */}
      <div className="grid gap-3 sm:grid-cols-3">
        <HeadlineCard
          step="①"
          layer="physical"
          title="物理 · 可见结构"
          body={result.physicalHeadline || result.summary}
        />
        <HeadlineCard
          step="②"
          layer="mingli"
          title="命理 · 交叉阅读"
          body={result.mingliHeadline || '未生成命理交叉摘要'}
        />
        <HeadlineCard
          step="③"
          layer="meta"
          title="综合 · 行动取向"
          body={result.synthesisHeadline || '物理定边界，命理谈气质，落到可验证动作。'}
        />
      </div>

      {/* Reading path */}
      {(result.readingPath || []).length > 0 ? (
        <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 shadow-[var(--shadow-card)]">
          <div className="mb-2 text-[11px] font-semibold text-[color:var(--ink-4)]">系统阅读路径</div>
          <div className="flex flex-wrap gap-2">
            {result.readingPath.map((step) => (
              <span
                key={step}
                className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--bg)] px-2.5 py-1 text-[11px] font-semibold text-[color:var(--ink-2)]"
              >
                {step}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Framework */}
      {(result.framework || []).length > 0 ? (
        <section className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[14px] font-bold text-[color:var(--ink-1)]">
              {isFace ? '经典框架 · 三庭五眼 → 十二宫' : '经典框架 · 手型三线 → 掌丘气机'}
            </h2>
            <span className="text-[10px] font-semibold text-[color:var(--ink-4)]">物理名 → 教学名</span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {result.framework!.map((f) => {
              const meta = LAYER_META[f.layer] || LAYER_META.meta;
              return (
                <div
                  key={f.id}
                  className={`rounded-lg border ${meta.border} ${meta.soft} p-3`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${meta.badge}`}>
                      {meta.short}
                    </span>
                    <span className={`text-[13px] font-bold ${meta.text}`}>{f.classicName}</span>
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-[color:var(--ink-3)]">
                    {f.physicalFocus}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--ink-3)]">{f.note}</p>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Photo + birth */}
      <div className="grid gap-3 lg:grid-cols-2">
        {result.photoQuality ? (
          <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[12px] font-bold text-[color:var(--ink-1)]">成像质量（物理门槛）</div>
                <div className="mt-0.5 text-[11px] text-[color:var(--ink-3)]">
                  等级{' '}
                  <b className="text-[color:var(--ink-1)]">
                    {result.photoQuality.level === 'good'
                      ? '良好'
                      : result.photoQuality.level === 'ok'
                        ? '尚可'
                        : '建议补拍'}
                  </b>
                  · 分 {result.photoQuality.score}
                </div>
              </div>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[color:var(--bg-sunken)]">
                <div
                  className="h-full rounded-full bg-[color:var(--brand)]"
                  style={{ width: `${Math.min(100, result.photoQuality.score)}%` }}
                />
              </div>
            </div>
            {(result.photoQuality.tips || []).length ? (
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[12px] text-[color:var(--ink-3)]">
                {result.photoQuality.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {result.birth ? (
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
            <div className="text-[12px] font-bold text-amber-950">天时档案 · 命理交叉已开启</div>
            <div className="mt-2 space-y-1 text-[12px] text-amber-900/90">
              <div>{result.birth.birthDate || '已关联生辰'}</div>
              {result.birth.dayMaster ? <div>日主 · {result.birth.dayMaster}</div> : null}
              {result.birth.yongShen?.length ? (
                <div>用神 · {result.birth.yongShen.join('、')}</div>
              ) : null}
              {result.birth.note ? (
                <div className="text-amber-800/70">{result.birth.note}</div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[color:var(--hairline-strong)] bg-[color:var(--bg)] p-4 text-[12px] text-[color:var(--ink-3)]">
            未绑定生辰：命理层为弱提示。
            <Link
              href={`/tools/${kindPath}`}
              className="ml-1 font-semibold text-[color:var(--brand)] underline"
            >
              补生辰重测
            </Link>
          </div>
        )}
      </div>

      {/* Strengths / watchpoints */}
      {(result.strengths?.length || result.watchpoints?.length) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {result.strengths?.length ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="text-[12px] font-bold text-emerald-900">相对清晰 / 可依托点</div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-emerald-900/80">
                {result.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {result.watchpoints?.length ? (
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
              <div className="text-[12px] font-bold text-red-900">弱证据 / 需注意</div>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-red-900/80">
                {result.watchpoints.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Layer filter */}
      <div className="sticky top-0 z-20 -mx-1 flex flex-wrap gap-1.5 border-b border-[color:var(--hairline)] bg-[color:var(--bg)]/95 px-1 py-2.5 backdrop-blur">
        {(
          [
            ['all', '全部章节'],
            ['physical', '① 物理'],
            ['mingli', '② 命理'],
            ['meta', '③ 综合'],
          ] as const
        ).map(([k, lab]) => (
          <button
            key={k}
            type="button"
            onClick={() => setFilter(k)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-bold transition ${
              filter === k
                ? 'bg-slate-900 text-white'
                : 'bg-[color:var(--paper)] text-[color:var(--ink-2)] border border-[color:var(--hairline)]'
            }`}
          >
            {lab}
          </button>
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {visibleSections.map((sec, idx) => {
          const meta = LAYER_META[sec.layer] || LAYER_META.meta;
          return (
            <section
              key={sec.id || idx}
              id={sec.id}
              className={`overflow-hidden rounded-xl border ${meta.border} bg-[color:var(--paper)] shadow-[var(--shadow-card)]`}
            >
              <div className={`border-b ${meta.border} ${meta.soft} px-4 py-3`}>
                <div className="flex flex-wrap items-center gap-2">
                  {sec.step ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white">
                      {sec.step}
                    </span>
                  ) : null}
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${meta.badge}`}>
                    {meta.label}
                  </span>
                  <h2 className={`text-[15px] font-bold ${meta.text}`}>{sec.heading}</h2>
                </div>
                {sec.lead ? (
                  <p className="mt-1.5 text-[12px] leading-relaxed text-[color:var(--ink-3)]">
                    {sec.lead}
                  </p>
                ) : null}
              </div>
              <div className="divide-y divide-[color:var(--hairline)]">
                {(sec.items || []).map((it, i) => (
                  <div key={`${it.title}-${i}`} className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-[13px] font-bold text-[color:var(--ink-1)]">{it.title}</div>
                      {it.tag ? (
                        <span className="rounded bg-[color:var(--bg-sunken)] px-1.5 py-0.5 text-[9px] font-semibold text-[color:var(--ink-4)]">
                          {it.tag}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
                      {it.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Dim panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        <DimPanel title="物理维度（可见）" dims={physicalDims} barClass="bg-slate-700" />
        <DimPanel title="命理维度（教学）" dims={mingliDims} barClass="bg-[color:var(--brand)]" />
      </div>

      {/* Actions */}
      <section className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 shadow-[var(--shadow-card)]">
        <h2 className="text-[15px] font-bold text-[color:var(--ink-1)]">下一步 · 可验证动作</h2>
        <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">
          把报告收成现实中能检查的一步，而不是求「准不准」。
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13px] leading-relaxed text-[color:var(--ink-2)]">
          {(result.actions || []).map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ol>
      </section>

      {/* Nav */}
      <div className="flex flex-wrap gap-2 text-[12px]">
        <Link
          href={`/tools/${kindPath}`}
          className="rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white"
        >
          再测一张
        </Link>
        <Link
          href={isFace ? '/tools/palmistry' : '/tools/physiognomy'}
          className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2 font-semibold text-[color:var(--ink-2)]"
        >
          {isFace ? '手相' : '面相'}
        </Link>
        <Link
          href="/tools/naming"
          className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2 font-semibold text-[color:var(--ink-2)]"
        >
          起名工坊
        </Link>
        <Link
          href="/analyze"
          className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2 font-semibold text-[color:var(--ink-2)]"
        >
          完整八字
        </Link>
        <Link
          href="/tools/fengshui-space"
          className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2 font-semibold text-[color:var(--ink-2)]"
        >
          空间场
        </Link>
      </div>

      <div className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--bg)] p-3 text-[11px] leading-relaxed text-[color:var(--ink-4)]">
        {(result.disclaimers || []).map((d) => (
          <p key={d}>· {d}</p>
        ))}
        {result.media?.allowSeoLineArt ? (
          <p className="mt-1 text-[color:var(--success)]">已授权脱敏线图用于教学内容（原图不公开）。</p>
        ) : null}
        <p className="mt-1 text-[color:var(--ink-5)]">会话 {sessionId.slice(0, 18)}…</p>
      </div>
    </div>
  );
}

function HeadlineCard({
  step,
  layer,
  title,
  body,
}: {
  step: string;
  layer: XiangxueLayer;
  title: string;
  body: string;
}) {
  const meta = LAYER_META[layer];
  return (
    <div className={`rounded-xl border ${meta.border} ${meta.soft} p-3.5`}>
      <div className="flex items-center gap-2">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${meta.badge}`}>{step}</span>
        <span className={`text-[11px] font-bold ${meta.text}`}>{title}</span>
      </div>
      <p className="mt-2 text-[13px] font-medium leading-relaxed text-[color:var(--ink-2)]">{body}</p>
    </div>
  );
}

function ScoreCard({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 text-center shadow-[var(--shadow-card)]">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--ink-4)]">
        {label}
      </div>
      <div
        className={`mt-1 text-[26px] font-black tracking-tight sm:text-[28px] ${
          emphasize ? 'text-[color:var(--brand)]' : 'text-[color:var(--ink-1)]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function DimPanel({
  title,
  dims,
  barClass,
}: {
  title: string;
  dims: Array<{
    id: string;
    label: string;
    score: number;
    note: string;
    confidence?: number;
    evidence?: string;
  }>;
  barClass: string;
}) {
  if (!dims.length) return null;
  return (
    <div className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 shadow-[var(--shadow-card)]">
      <h3 className="text-[13px] font-bold text-[color:var(--ink-1)]">{title}</h3>
      <div className="mt-3 space-y-3">
        {dims.map((d) => (
          <div key={d.id}>
            <div className="flex items-center justify-between gap-2 text-[12px]">
              <span className="font-semibold text-[color:var(--ink-2)]">{d.label}</span>
              <span className="flex items-center gap-1.5">
                {d.evidence ? (
                  <span className="rounded bg-[color:var(--bg-sunken)] px-1 py-0.5 text-[9px] text-[color:var(--ink-4)]">
                    {d.evidence === 'visible' ? '可见' : d.evidence === 'weak' ? '弱' : '推断'}
                  </span>
                ) : null}
                <span className="font-black text-[color:var(--ink-1)]">{d.score}</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color:var(--bg-sunken)]">
              <div
                className={`h-full rounded-full ${barClass}`}
                style={{ width: `${Math.min(100, d.score)}%` }}
              />
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-[color:var(--ink-4)]">{d.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function fallbackSections(result: XiangxueSessionResult): XiangxueSessionResult['sections'] {
  const phys = (result.observations || []).filter((o) => !o.layer || o.layer === 'physical');
  const ming = (result.observations || []).filter((o) => o.layer === 'mingli');
  return [
    {
      id: 'phys',
      layer: 'physical',
      step: 1,
      heading: '一、物理层',
      lead: '可见结构观察',
      items: phys.map((o) => ({ title: o.title, body: o.body, tag: '可见' })),
    },
    {
      id: 'ming',
      layer: 'mingli',
      step: 2,
      heading: '二、命理层',
      lead: '教学交叉阅读',
      items: ming.length
        ? ming.map((o) => ({ title: o.title, body: o.body, tag: '教学' }))
        : [{ title: '交叉', body: result.mingliHeadline || '—', tag: '教学' }],
    },
  ];
}
