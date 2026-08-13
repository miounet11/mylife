'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  WORLD_YI_LOGIC_DOMAINS,
  explainWorldYiQuery,
  explainWorldYiSituation,
  listWorldYiSituations,
  type WorldYiExplanation,
  type WorldYiLogicDomain,
} from '@/lib/world-yi-logic';

function Reading({ exp }: { exp: WorldYiExplanation }) {
  const rows = [
    { k: '结构', v: exp.structure },
    { k: '时位', v: exp.timing },
    { k: '环境', v: exp.environment },
    { k: '动作', v: exp.action },
    { k: '风险', v: exp.risk },
  ];
  return (
    <div className="space-y-3">
      <p className="text-[15px] font-semibold text-[color:var(--ink-1)]">{exp.headline}</p>
      {exp.terms.length ? (
        <p className="text-[12px] text-[color:var(--ink-4)]">
          用语：{exp.terms.map((t) => t.name).join(' · ')}
        </p>
      ) : null}
      <dl className="divide-y divide-[color:var(--hairline)]">
        {rows.map((row) => (
          <div key={row.k} className="grid gap-1 py-2.5 sm:grid-cols-[52px_minmax(0,1fr)]">
            <dt className="text-[12px] font-medium text-[color:var(--ink-3)]">{row.k}</dt>
            <dd className="text-[13px] leading-[1.65] text-[color:var(--ink-2)]">{row.v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-[12px] leading-[1.55] text-[color:var(--ink-5)]">拒绝：{exp.refuse}</p>
      <Link
        href="/analyze?source=world_yi_logic"
        className="inline-block text-[13px] font-semibold text-[color:var(--brand-strong)] underline-offset-2 hover:underline"
      >
        接到我的结构报告
      </Link>
    </div>
  );
}

export function WorldYiLogicDesk() {
  const [domain, setDomain] = useState<WorldYiLogicDomain | 'all'>('all');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState('offer-held');

  const list = useMemo(() => listWorldYiSituations(domain), [domain]);

  const explanation = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) return explainWorldYiQuery(trimmed);
    return explainWorldYiSituation(activeId) || explainWorldYiQuery(list[0]?.title || '');
  }, [query, activeId, list]);

  return (
    <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 shadow-card md:p-5">
      <div className="mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand)]">
          处境对照
        </p>
        <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--ink-1)]">
          用世界易定义说明眼前这件事
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--ink-4)]">
          先点层，再给定义，再落到可验证动作。不是吉凶判决。
        </p>
      </div>

      <label className="block">
        <span className="sr-only">描述你的处境</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="例如：有 offer 不敢走 / 存不下钱 / 不顺就想换城"
          className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 text-[13px] text-[color:var(--ink-1)] outline-none ring-0 placeholder:text-[color:var(--ink-5)] focus:border-[color:var(--brand)]"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {WORLD_YI_LOGIC_DOMAINS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setDomain(item.id);
              setQuery('');
            }}
            className={`rounded px-2 py-0.5 text-[12px] ${
              domain === item.id
                ? 'bg-[color:var(--ink-1)] text-white'
                : 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)] hover:text-[color:var(--ink-1)]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)]">
        <ul className="divide-y divide-[color:var(--hairline)] border-y border-[color:var(--hairline)]">
          {list.map((item) => {
            const on = !query.trim() && item.id === activeId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(item.id);
                    setQuery('');
                  }}
                  className={`w-full px-1 py-2.5 text-left ${
                    on ? 'bg-[color:var(--bg-sunken)]' : 'hover:bg-[color:var(--bg-sunken)]/60'
                  }`}
                >
                  <span className="block text-[13px] font-medium text-[color:var(--ink-1)]">{item.title}</span>
                  <span className="mt-0.5 block text-[12px] leading-[1.5] text-[color:var(--ink-5)]">
                    {item.appearance}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <Reading exp={explanation} />
      </div>
    </section>
  );
}
