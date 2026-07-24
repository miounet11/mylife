'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { XiangxueLayer, XiangxueSessionResult } from '@/lib/xiangxue';

type Props = {
  sessionId: string;
  result: XiangxueSessionResult;
};

const LAYER_META: Record<
  XiangxueLayer,
  { label: string; short: string; accent: string; bg: string; border: string; badge: string; ring: string }
> = {
  physical: {
    label: '物理层',
    short: '物理',
    accent: 'text-sky-900',
    bg: 'bg-sky-50/90',
    border: 'border-sky-200/80',
    badge: 'bg-sky-600',
    ring: 'ring-sky-400',
  },
  mingli: {
    label: '命理层',
    short: '命理',
    accent: 'text-amber-950',
    bg: 'bg-amber-50/90',
    border: 'border-amber-200/80',
    badge: 'bg-amber-700',
    ring: 'ring-amber-400',
  },
  meta: {
    label: '综合',
    short: '综合',
    accent: 'text-violet-950',
    bg: 'bg-violet-50/90',
    border: 'border-violet-200/80',
    badge: 'bg-violet-700',
    ring: 'ring-violet-400',
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
    <div className="min-h-screen bg-[#0b0d12]">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(99,102,241,0.35),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(14,165,233,0.2),_transparent_50%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-wide text-white/55">
              <span className="rounded-full bg-gradient-to-r from-rose-500/30 to-orange-500/20 px-2.5 py-0.5 text-rose-100 ring-1 ring-rose-400/30">
                {isFace ? '面相 · 系统报告' : '手相 · 系统报告'}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/70">
                {result.schema === 'life-kline.xiangxue.v3' ? 'v3' : 'v2'}
              </span>
              <span>{result.llmUsed ? '视觉模型已读图' : '结构引擎'}</span>
              <span className="text-white/25">|</span>
              <span className="text-sky-200/90">① 物理</span>
              <span className="text-white/25">→</span>
              <span className="text-amber-200/90">② 命理</span>
              <span className="text-white/25">→</span>
              <span className="text-violet-200/90">③ 综合</span>
            </div>
            <h1 className="mt-3 text-[28px] font-black tracking-tight text-white sm:text-[34px]">
              {result.title}
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-white/70">
              {result.summary}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(result.visibleTags || []).slice(0, 10).map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-semibold text-white/65"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-3">
            {result.media?.publicPath ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.media.publicPath}
                alt=""
                className="h-32 w-32 rounded-2xl border border-white/20 object-cover shadow-2xl shadow-indigo-500/20 ring-2 ring-white/10"
              />
            ) : null}
            <div className="text-center text-[10px] text-white/40">会话 {sessionId.slice(0, 12)}…</div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-5 px-4 py-6 pb-24">
        {/* ── Score rings ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <RingScore label="综合" value={result.overallScore} tone="indigo" />
          <RingScore label="物理层" value={result.physicalScore ?? result.overallScore} tone="sky" />
          <RingScore label="命理层" value={result.mingliScore ?? result.overallScore} tone="amber" />
          <RingScore label="可信度" value={conf} tone="violet" />
        </div>

        {/* ── Dual + synthesis headlines ── */}
        <div className="grid gap-3 lg:grid-cols-3">
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

        {/* ── Reading path timeline ── */}
        {(result.readingPath || []).length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-white/40">
              系统阅读路径
            </div>
            <div className="flex min-w-max items-center gap-0">
              {result.readingPath.map((step, i) => (
                <div key={step} className="flex items-center">
                  <div className="rounded-xl border border-white/10 bg-gradient-to-b from-white/10 to-white/[0.02] px-3 py-2 text-[11px] font-semibold text-white/85">
                    {step}
                  </div>
                  {i < result.readingPath.length - 1 ? (
                    <div className="mx-1 h-px w-4 bg-gradient-to-r from-indigo-400/60 to-transparent sm:w-6" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Framework map ── */}
        {(result.framework || []).length > 0 ? (
          <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-indigo-950/40 p-4 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[14px] font-black text-white">
                {isFace ? '经典框架 · 三庭五眼 → 十二宫' : '经典框架 · 手型三线 → 掌丘气机'}
              </h2>
              <span className="text-[10px] font-semibold text-white/40">物理名 → 教学名</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {result.framework!.map((f) => {
                const meta = LAYER_META[f.layer] || LAYER_META.meta;
                return (
                  <div
                    key={f.id}
                    className={`rounded-xl border ${meta.border} ${meta.bg} p-3`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`rounded ${meta.badge} px-1.5 py-0.5 text-[9px] font-bold text-white`}>
                        {meta.short}
                      </span>
                      <span className={`text-[13px] font-black ${meta.accent}`}>{f.classicName}</span>
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-slate-600">{f.physicalFocus}</div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">{f.note}</p>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* ── Photo quality + birth ── */}
        <div className="grid gap-3 lg:grid-cols-2">
          {result.photoQuality ? (
            <div className="rounded-2xl border border-white/10 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[12px] font-bold text-slate-800">成像质量（物理门槛）</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    等级{' '}
                    <b className="text-slate-800">
                      {result.photoQuality.level === 'good'
                        ? '良好'
                        : result.photoQuality.level === 'ok'
                          ? '尚可'
                          : '建议补拍'}
                    </b>
                    · 分 {result.photoQuality.score}
                  </div>
                </div>
                <QualityBar score={result.photoQuality.score} />
              </div>
              {(result.photoQuality.tips || []).length ? (
                <ul className="mt-3 list-disc space-y-0.5 pl-4 text-[12px] text-slate-600">
                  {result.photoQuality.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {result.birth ? (
            <div className="rounded-2xl border border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm">
              <div className="text-[12px] font-bold text-amber-950">天时档案 · 命理交叉已开启</div>
              <div className="mt-2 space-y-1 text-[12px] text-amber-900/90">
                <div>{result.birth.birthDate || '已关联生辰'}</div>
                {result.birth.dayMaster ? <div>日主 · {result.birth.dayMaster}</div> : null}
                {result.birth.yongShen?.length ? (
                  <div>用神 · {result.birth.yongShen.join('、')}</div>
                ) : null}
                {result.birth.note ? <div className="text-amber-800/70">{result.birth.note}</div> : null}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-[12px] text-white/55">
              未绑定生辰：命理层为弱提示。
              <Link href={`/tools/${kindPath}`} className="ml-1 font-semibold text-indigo-300 underline">
                补生辰重测
              </Link>
            </div>
          )}
        </div>

        {/* ── Strengths / watchpoints ── */}
        {(result.strengths?.length || result.watchpoints?.length) ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {result.strengths?.length ? (
              <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/95 p-4">
                <div className="text-[12px] font-black text-emerald-900">相对清晰 / 可依托点</div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-emerald-900/85">
                  {result.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {result.watchpoints?.length ? (
              <div className="rounded-2xl border border-rose-200/60 bg-rose-50/95 p-4">
                <div className="text-[12px] font-black text-rose-900">弱证据 / 需注意</div>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[12px] leading-relaxed text-rose-900/85">
                  {result.watchpoints.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* ── Layer filter (sticky) ── */}
        <div className="sticky top-0 z-20 -mx-1 flex flex-wrap gap-2 bg-[#0b0d12]/95 px-1 py-3 backdrop-blur">
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
              className={`rounded-full px-3.5 py-1.5 text-[12px] font-bold transition ${
                filter === k
                  ? 'bg-white text-slate-900 shadow-lg shadow-white/10'
                  : 'border border-white/15 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {lab}
            </button>
          ))}
        </div>

        {/* ── Systematic sections ── */}
        <div className="space-y-4">
          {visibleSections.map((sec, idx) => {
            const meta = LAYER_META[sec.layer] || LAYER_META.meta;
            return (
              <section
                key={sec.id || idx}
                id={sec.id}
                className={`overflow-hidden rounded-2xl border ${meta.border} bg-white shadow-lg shadow-black/20`}
              >
                <div className={`border-b ${meta.border} ${meta.bg} px-4 py-3.5`}>
                  <div className="flex flex-wrap items-center gap-2">
                    {sec.step ? (
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[12px] font-black text-white">
                        {sec.step}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-md ${meta.badge} px-2 py-0.5 text-[10px] font-bold text-white`}
                    >
                      {meta.label}
                    </span>
                    <h2 className={`text-[15px] font-black ${meta.accent}`}>{sec.heading}</h2>
                  </div>
                  {sec.lead ? (
                    <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">{sec.lead}</p>
                  ) : null}
                </div>
                <div className="divide-y divide-slate-100">
                  {(sec.items || []).map((it, i) => (
                    <div key={`${it.title}-${i}`} className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-[13px] font-bold text-slate-900">{it.title}</div>
                        {it.tag ? (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                            {it.tag}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">{it.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* ── Dim scores ── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <DimPanel title="物理维度（可见）" dims={physicalDims} accent="sky" />
          <DimPanel title="命理维度（教学）" dims={mingliDims} accent="amber" />
        </div>

        {/* ── Actions CTA ── */}
        <section className="relative overflow-hidden rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-700 p-6 text-white shadow-2xl shadow-indigo-900/40">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <h2 className="text-[16px] font-black">下一步 · 可验证动作</h2>
          <p className="mt-1 text-[12px] text-white/70">把报告收成现实中能检查的一步，而不是求「准不准」。</p>
          <ol className="relative mt-4 list-decimal space-y-2.5 pl-5 text-[13px] leading-relaxed text-white/95">
            {(result.actions || []).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </section>

        {/* ── Nav ── */}
        <div className="flex flex-wrap gap-2.5 text-[12px]">
          <Link
            href={`/tools/${kindPath}`}
            className="rounded-xl bg-white px-4 py-2.5 font-bold text-slate-900 shadow"
          >
            再测一张
          </Link>
          <Link
            href={isFace ? '/tools/palmistry' : '/tools/physiognomy'}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-semibold text-white/80"
          >
            {isFace ? '手相' : '面相'}
          </Link>
          <Link
            href="/tools/naming"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-semibold text-white/80"
          >
            起名工坊
          </Link>
          <Link
            href="/analyze"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-semibold text-white/80"
          >
            完整八字
          </Link>
          <Link
            href="/tools/fengshui-space"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 font-semibold text-white/80"
          >
            空间场
          </Link>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-[11px] leading-relaxed text-white/35">
          {(result.disclaimers || []).map((d) => (
            <p key={d}>· {d}</p>
          ))}
          {result.media?.allowSeoLineArt ? (
            <p className="mt-1 text-emerald-400/80">已授权脱敏线图用于教学内容（原图不公开）。</p>
          ) : null}
        </div>
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
    <div className={`rounded-2xl border ${meta.border} ${meta.bg} p-4 shadow-sm`}>
      <div className="flex items-center gap-2">
        <span className={`rounded-md ${meta.badge} px-2 py-0.5 text-[10px] font-bold text-white`}>
          {step}
        </span>
        <span className={`text-[11px] font-bold ${meta.accent}`}>{title}</span>
      </div>
      <p className={`mt-2 text-[13px] font-medium leading-relaxed ${meta.accent}`}>{body}</p>
    </div>
  );
}

function RingScore({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'indigo' | 'sky' | 'amber' | 'violet';
}) {
  const colors = {
    indigo: { stroke: '#818cf8', text: 'text-indigo-200' },
    sky: { stroke: '#38bdf8', text: 'text-sky-200' },
    amber: { stroke: '#fbbf24', text: 'text-amber-200' },
    violet: { stroke: '#a78bfa', text: 'text-violet-200' },
  }[tone];
  const r = 28;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value));
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-4">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="36"
          cy="36"
          r={r}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={`-mt-12 text-[18px] font-black text-white`}>{value}</div>
      <div className={`mt-5 text-[10px] font-bold uppercase tracking-wide ${colors.text}`}>{label}</div>
    </div>
  );
}

function QualityBar({ score }: { score: number }) {
  return (
    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
        style={{ width: `${Math.min(100, score)}%` }}
      />
    </div>
  );
}

function DimPanel({
  title,
  dims,
  accent,
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
  accent: 'sky' | 'amber';
}) {
  const bar = accent === 'sky' ? 'bg-sky-500' : 'bg-amber-500';
  const head = accent === 'sky' ? 'text-sky-300' : 'text-amber-300';
  if (!dims.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <h3 className={`text-[13px] font-black ${head}`}>{title}</h3>
      <div className="mt-3 space-y-3.5">
        {dims.map((d) => (
          <div key={d.id}>
            <div className="flex items-center justify-between gap-2 text-[12px]">
              <span className="font-semibold text-white/85">{d.label}</span>
              <span className="flex items-center gap-1.5">
                {d.evidence ? (
                  <span className="rounded bg-white/10 px-1 py-0.5 text-[9px] text-white/45">
                    {d.evidence === 'visible' ? '可见' : d.evidence === 'weak' ? '弱' : '推断'}
                  </span>
                ) : null}
                <span className="font-black text-white">{d.score}</span>
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${bar}`}
                style={{ width: `${Math.min(100, d.score)}%` }}
              />
            </div>
            <p className="mt-0.5 text-[11px] leading-snug text-white/45">{d.note}</p>
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
