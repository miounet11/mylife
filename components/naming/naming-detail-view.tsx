'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { NameCandidate, NamingDetailLlm, NamingSessionResult } from '@/lib/naming';

type Props = {
  sessionId: string;
  name: string;
  candidate: NameCandidate | null;
  result: NamingSessionResult;
};

export function NamingDetailView({ sessionId, name, candidate, result }: Props) {
  const [detail, setDetail] = useState<NamingDetailLlm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/naming/detail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, name }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || '详解失败');
        if (!cancelled) setDetail(data.detail);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '详解失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, name]);

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-3 py-6 sm:px-4 pb-16">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500">
        <Link href={`/tools/naming/result/${sessionId}`} className="text-indigo-600 underline">
          ← 返回方案结果
        </Link>
        <span>/</span>
        <span>下一级详解</span>
      </div>

      <header>
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-600">
          单名详解
          {detail?.usedLlm ? ' · AI 已测算' : loading ? ' · AI 测算中…' : ''}
        </div>
        <h1 className="mt-1 text-[28px] font-black tracking-tight text-slate-900">{name}</h1>
        {candidate ? (
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-[22px] font-black text-indigo-600">{candidate.score}</span>
            <span className="text-[12px] text-slate-500">综合分</span>
            <div className="flex flex-wrap gap-1">
              {candidate.elements.map((e) => (
                <span
                  key={e.char}
                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold"
                >
                  {e.char} · {e.element}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      {candidate ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric label="五行/用神" v={candidate.breakdown.wuxing} />
          <Metric label="音韵" v={candidate.breakdown.phonology} />
          <Metric label="字义" v={candidate.breakdown.semantics} />
          {candidate.breakdown.brandability != null ? (
            <Metric label="传播感" v={candidate.breakdown.brandability} />
          ) : candidate.breakdown.wuge != null ? (
            <Metric label="五格参考" v={candidate.breakdown.wuge} />
          ) : (
            <Metric label="综合" v={candidate.score} />
          )}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-[13px] text-slate-500">
          AI 正在撰写下一级详解…
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          {error}（仍展示结构分）
        </div>
      ) : null}

      {detail ? (
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-[14px] font-bold text-slate-900">{detail.title}</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{detail.overview}</p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-[13px] font-bold text-slate-900">逐字拆解</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-slate-600">
              {detail.charBreakdown.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-[13px] font-bold">音韵</h2>
              <p className="mt-2 text-[13px] text-slate-600">{detail.soundNote}</p>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-[13px] font-bold">匹配说明</h2>
              <p className="mt-2 text-[13px] text-slate-600">{detail.fitNote}</p>
            </section>
          </div>

          {detail.variants?.length ? (
            <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
              <h2 className="text-[13px] font-bold text-indigo-900">可微调变体</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {detail.variants.map((v) => (
                  <span
                    key={v}
                    className="rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-slate-800 shadow-sm"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {detail.caution?.length ? (
            <section className="text-[12px] text-slate-500">
              {detail.caution.map((c) => (
                <p key={c}>· {c}</p>
              ))}
            </section>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <Link
          href={`/tools/naming/result/${sessionId}`}
          className="rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold"
        >
          返回排行
        </Link>
        <Link
          href="/tools/naming"
          className="rounded-lg bg-slate-900 px-3 py-2 text-[12px] font-semibold text-white"
        >
          新方案
        </Link>
      </div>

      <p className="text-[11px] text-slate-400">{result.disclaimer}</p>
    </div>
  );
}

function Metric({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-semibold text-slate-500">{label}</div>
      <div className="text-[18px] font-black text-slate-900">{v}</div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, v)}%` }} />
      </div>
    </div>
  );
}
