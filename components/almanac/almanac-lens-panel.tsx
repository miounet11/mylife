'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  ALMANAC_LENSES,
  type AlmanacLensId,
  type AlmanacLensResult,
} from '@/lib/almanac/llm-lenses';
import { trackProductEvent } from '@/lib/product-analytics';

export default function AlmanacLensPanel({
  date,
  hasChart,
}: {
  date: string;
  hasChart: boolean;
}) {
  const [active, setActive] = useState<AlmanacLensId | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AlmanacLensResult | null>(null);
  const [error, setError] = useState('');
  const [llmUsed, setLlmUsed] = useState(false);

  const run = async (lensId: AlmanacLensId) => {
    setActive(lensId);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/almanac/lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, lensId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || '生成失败');
        setResult(null);
        return;
      }
      setResult(data.result);
      setLlmUsed(Boolean(data.llmUsed));
      trackProductEvent('almanac_lens_run', {
        date,
        lensId,
        llmUsed: Boolean(data.llmUsed),
        hasChart: Boolean(data.hasChart),
      });
    } catch {
      setError('网络异常');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand)]">
            AI 个人黄历镜头
          </p>
          <h3 className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">
            点选固定视角，读懂今天与你的匹配
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
            {hasChart
              ? '已接入你的命盘结构；镜头只解读，不改写四柱。'
              : '未绑定命盘时仍可看公共节奏；绑定后叙述会贴合日主与用神。'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {ALMANAC_LENSES.map((lens) => {
          const on = active === lens.id;
          return (
            <button
              key={lens.id}
              type="button"
              disabled={loading}
              onClick={() => void run(lens.id)}
              className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                on
                  ? 'border-[color:var(--brand)] bg-[color:var(--brand)] text-white'
                  : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-2)] hover:border-[color:var(--brand)]'
              }`}
            >
              {lens.chip}
              <span className="ml-1 font-normal opacity-80">{lens.title.replace(/^今日/, '')}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-[13px] text-[color:var(--ink-4)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在写你的个人黄历…
        </div>
      ) : null}

      {error ? <p className="mt-3 text-[12px] text-amber-800">{error}</p> : null}

      {result && !loading ? (
        <article className="mt-4 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[15px] font-bold text-[color:var(--ink-1)]">{result.title}</h4>
            <span className="rounded-full bg-[color:var(--brand-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[color:var(--brand-strong)]">
              {result.mood}
              {llmUsed ? '' : ' · 结构模板'}
            </span>
          </div>
          <div className="mt-3 space-y-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
            {result.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          {result.bullets.length ? (
            <ul className="mt-3 space-y-1.5 border-t border-[color:var(--hairline)] pt-3 text-[12px] text-[color:var(--ink-3)]">
              {result.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-[color:var(--brand)]">●</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {result.closing ? (
            <p className="mt-3 text-[12px] font-medium text-[color:var(--ink-2)]">{result.closing}</p>
          ) : null}
        </article>
      ) : null}
    </section>
  );
}
