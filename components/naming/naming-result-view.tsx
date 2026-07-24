'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { NamingSessionResult } from '@/lib/naming';
import { encodeNameKey } from '@/lib/naming';

type Props = {
  sessionId: string;
  result: NamingSessionResult;
};

export function NamingResultView({ sessionId, result }: Props) {
  const [publishing, setPublishing] = useState(false);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const modeLabel =
    result.mode === 'person' ? '个人起名' : result.mode === 'company' ? '公司起名' : '产品起名';

  const publish = async () => {
    setPublishing(true);
    setErr(null);
    try {
      const res = await fetch('/api/publish/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'naming',
          namingMode: result.mode,
          useLlm: false,
          surnameOrBrand:
            result.input.surname || result.input.industry || result.input.category || '',
          candidates: result.candidates.slice(0, 12).map((c) => ({
            name: c.fullName || c.name,
            score: c.score,
            reason: c.reason,
          })),
          summary: result.summary,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || '发布失败');
      setPublicUrl(data.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '发布失败');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-3 py-6 sm:px-4 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-600">
            {modeLabel} · 结果页
            {result.llm.usedLlm ? ' · AI 已测算' : ' · 结构引擎'}
          </div>
          <h1 className="mt-1 text-[24px] font-black tracking-tight text-slate-900">
            {result.title}
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-slate-600">
            {result.summary}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <Link
            href="/tools/naming"
            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold"
          >
            再测一次
          </Link>
          <button
            type="button"
            disabled={publishing}
            onClick={() => void publish()}
            className="rounded-md bg-slate-900 px-3 py-1.5 font-semibold text-white disabled:opacity-40"
          >
            {publishing ? '发布中…' : '公开发布短名单'}
          </button>
        </div>
      </div>

      {err ? <div className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{err}</div> : null}
      {publicUrl ? (
        <a
          href={publicUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-[12px] font-semibold text-sky-700 underline"
        >
          打开公开页 →
        </a>
      ) : null}

      {/* input strip */}
      <div className="flex flex-wrap gap-2 text-[11px]">
        {result.input.surname ? <Chip>姓 {result.input.surname}</Chip> : null}
        {result.input.industry ? <Chip>行业 {result.input.industry}</Chip> : null}
        {result.input.category ? <Chip>品类 {result.input.category}</Chip> : null}
        {result.input.keywords?.length ? (
          <Chip>关键词 {result.input.keywords.join('、')}</Chip>
        ) : null}
        {result.input.yongShen?.length ? (
          <Chip>用神 {result.input.yongShen.join('、')}</Chip>
        ) : null}
        {result.input.style ? <Chip>风格 {result.input.style}</Chip> : null}
        <Chip>{result.candidates.length} 个候选</Chip>
      </div>

      {/* AI scheme */}
      <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
        <h2 className="text-[14px] font-bold text-indigo-900">AI 方案建议</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-indigo-950/80">
          {(result.llm.schemeAdvice || []).map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        {(result.llm.riskNotes || []).length ? (
          <div className="mt-3 border-t border-indigo-100 pt-3 text-[12px] text-indigo-800/70">
            {(result.llm.riskNotes || []).map((r) => (
              <p key={r}>· {r}</p>
            ))}
          </div>
        ) : null}
      </section>

      {/* ranking */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[16px] font-black text-slate-900">候选排行</h2>
          <span className="text-[11px] text-slate-400">点击名字进入下一级详解</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {result.candidates.map((c, i) => {
            const display = c.fullName || c.name;
            const href = `/tools/naming/result/${sessionId}/name/${encodeNameKey(display)}`;
            return (
              <Link
                key={`${display}-${i}`}
                href={href}
                className="group rounded-xl border border-slate-200 bg-white p-3 transition hover:border-indigo-400 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">#{i + 1}</span>
                      <span className="text-[15px] font-black leading-snug text-slate-900 group-hover:text-indigo-700">
                        {display}
                      </span>
                    </div>
                    {c.name && c.fullName && c.name !== c.fullName ? (
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        字号 <span className="font-semibold text-slate-700">{c.name}</span>
                      </div>
                    ) : null}
                    {c.english ? (
                      <div className="text-[11px] text-slate-400">{c.english}</div>
                    ) : null}
                    {c.patternLabel || c.jurisdiction ? (
                      <div className="mt-1 text-[10px] font-semibold text-violet-600">
                        {[c.patternLabel, c.jurisdiction].filter(Boolean).join(' · ')}
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[20px] font-black text-indigo-600">{c.score}</div>
                    <div className="text-[10px] text-slate-400">综合</div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.elements.map((e) => (
                    <span
                      key={e.char + e.element}
                      className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
                    >
                      {e.char}·{e.element}
                    </span>
                  ))}
                </div>
                {c.strokesSummary ? (
                  <div className="mt-1 text-[10px] text-slate-400">康熙 {c.strokesSummary}</div>
                ) : null}
                {c.methods && c.methods.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.methods
                      .slice()
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 4)
                      .map((m) => (
                        <span
                          key={m.id}
                          className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-700"
                          title={m.note}
                        >
                          {m.label} {m.score}
                        </span>
                      ))}
                  </div>
                ) : null}
                <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-slate-500">
                  {c.reason}
                </p>
                <div className="mt-2 text-[11px] font-semibold text-indigo-600">
                  查看下一级详解 →
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <p className="text-[11px] leading-relaxed text-slate-400">{result.disclaimer}</p>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600">
      {children}
    </span>
  );
}
