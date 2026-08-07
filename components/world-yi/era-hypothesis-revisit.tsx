'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  clearEraHypothesisScore,
  listEraHypothesesWithScores,
  saveEraHypothesisScore,
  summarizeEraHypothesisScores,
  type EraHypothesisOutcome,
  type EraHypothesisWithScore,
} from '@/lib/era-hypothesis-store';
import { trackProductEvent } from '@/lib/product-analytics';

const OUTCOMES: Array<{
  key: Exclude<EraHypothesisOutcome, 'pending'>;
  zh: string;
  en: string;
}> = [
  { key: 'hit', zh: '命中', en: 'Hit' },
  { key: 'partial', zh: '部分', en: 'Partial' },
  { key: 'miss', zh: '落空', en: 'Miss' },
];

export default function EraHypothesisRevisit({
  locale = 'zh-CN',
  compact = false,
  source = 'era_timing',
}: {
  locale?: string | null;
  compact?: boolean;
  source?: string;
}) {
  const en = `${locale || ''}`.toLowerCase().startsWith('en');
  const [rows, setRows] = useState<EraHypothesisWithScore[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const list = listEraHypothesesWithScores();
    setRows(list);
    setNotes((prev) => {
      const next = { ...prev };
      for (const item of list) {
        if (item.score?.note && next[item.id] === undefined) {
          next[item.id] = item.score.note;
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const summary = useMemo(() => {
    const scores = rows.map((r) => r.score).filter((s): s is NonNullable<typeof s> => Boolean(s));
    return summarizeEraHypothesisScores(scores);
  }, [rows]);

  const handleScore = async (
    id: string,
    outcome: Exclude<EraHypothesisOutcome, 'pending'>,
  ) => {
    setSavingId(id);
    saveEraHypothesisScore({
      hypothesisId: id,
      outcome,
      note: notes[id],
    });
    trackProductEvent('era_hypothesis_scored', {
      hypothesisId: id,
      outcome,
      source,
    });
    refresh();
    setSavingId(null);
  };

  const handleClear = (id: string) => {
    clearEraHypothesisScore(id);
    trackProductEvent('era_hypothesis_score_cleared', { hypothesisId: id, source });
    refresh();
  };

  return (
    <section
      className={`rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-white ${
        compact ? 'p-3' : 'p-4 md:p-5'
      }`}
      data-era-hypothesis-revisit="1"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand)]">
            {en ? 'Revisit scoring' : '假设回访打分'}
          </p>
          <h3 className="mt-1 text-[15px] font-bold text-[color:var(--ink-1)]">
            {en ? 'Calibrate era hypotheses' : '校准时代假设'}
          </h3>
          <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
            {en
              ? 'Hit / partial / miss — stored on this device. Not investment advice.'
              : '命中 / 部分 / 落空 — 保存在本机。不构成投资建议。'}
          </p>
        </div>
        <div className="text-[11px] text-[color:var(--ink-5)]">
          {en
            ? `${summary.hit} hit · ${summary.partial} partial · ${summary.miss} miss · ${summary.pending} open`
            : `${summary.hit} 命中 · ${summary.partial} 部分 · ${summary.miss} 落空 · ${summary.pending} 待评`}
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {rows.map((item) => {
          const outcome = item.score?.outcome || 'pending';
          const pending = outcome === 'pending';
          return (
            <li
              key={item.id}
              className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h4 className="text-[13px] font-bold text-[color:var(--ink-1)]">
                    {en ? item.labelEn : item.label}
                  </h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
                    {en ? item.claimEn : item.claim}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-[color:var(--hairline)] px-2 py-0.5 text-[10px] text-[color:var(--ink-4)]">
                  {pending
                    ? en
                      ? 'Pending'
                      : '待评'
                    : OUTCOMES.find((o) => o.key === outcome)?.[en ? 'en' : 'zh']}
                  {' · '}
                  {en ? `by ${item.observeByEn}` : `至 ${item.observeBy}`}
                </span>
              </div>

              {!compact ? (
                <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--ink-5)]">
                  <strong>{en ? 'Falsify if' : '证伪'}</strong>
                  {' — '}
                  {en ? item.falsifyIfEn : item.falsifyIf}
                </p>
              ) : null}

              <label className="mt-2 block">
                <span className="sr-only">{en ? 'Note' : '备注'}</span>
                <textarea
                  value={notes[item.id] || ''}
                  onChange={(e) =>
                    setNotes((prev) => ({
                      ...prev,
                      [item.id]: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder={
                    en
                      ? 'Optional note: what evidence did you see?'
                      : '可选备注：你看到了哪些公开证据？'
                  }
                  className="w-full resize-y rounded-lg border border-[color:var(--hairline)] bg-white px-2.5 py-2 text-[12px] text-[color:var(--ink-2)] outline-none focus:border-[color:var(--brand)]"
                />
              </label>

              <div className="mt-2 flex flex-wrap gap-2">
                {OUTCOMES.map((o) => {
                  const active = outcome === o.key;
                  return (
                    <button
                      key={o.key}
                      type="button"
                      disabled={savingId === item.id}
                      onClick={() => void handleScore(item.id, o.key)}
                      className={`h-8 rounded-full px-3 text-[12px] font-semibold transition ${
                        active
                          ? 'bg-[color:var(--brand)] text-white'
                          : 'border border-[color:var(--hairline)] bg-white text-[color:var(--ink-2)] hover:border-[color:var(--brand)]'
                      }`}
                    >
                      {en ? o.en : o.zh}
                    </button>
                  );
                })}
                {!pending ? (
                  <button
                    type="button"
                    onClick={() => handleClear(item.id)}
                    className="h-8 px-2 text-[11px] text-[color:var(--ink-5)] underline-offset-2 hover:underline"
                  >
                    {en ? 'Clear' : '清除'}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap gap-3 text-[12px]">
        <Link
          href="/world-yi/era-timing"
          className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
        >
          {en ? 'Era timing method' : '时代天时方法'}
        </Link>
        <Link
          href="/predictions"
          className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
        >
          {en ? 'Personal prediction revisit' : '个人预测回访'}
        </Link>
        <Link
          href="/annual-review"
          className="text-[color:var(--ink-3)] underline-offset-2 hover:underline"
        >
          {en ? 'Annual review' : '年度复盘'}
        </Link>
      </div>
    </section>
  );
}
