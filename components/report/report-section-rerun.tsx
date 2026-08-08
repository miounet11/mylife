'use client';

import { useState } from 'react';
import { SECTION_RERUN_CATALOG } from '@/lib/experience-kernel/section-catalog';

type Props = {
  reportId: string;
  canManage?: boolean;
};

/**
 * Owner control: re-run 1–2 report agent sections without full upgrade thrash.
 */
export default function ReportSectionRerun({ reportId, canManage = false }: Props) {
  const [selected, setSelected] = useState<string[]>(['career_wealth']);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!canManage || !reportId) return null;

  function toggle(key: string) {
    setSelected((cur) => {
      if (cur.includes(key)) return cur.filter((k) => k !== key);
      if (cur.length >= 2) return [...cur.slice(1), key];
      return [...cur, key];
    });
  }

  async function run() {
    if (!selected.length || busy) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/report/${encodeURIComponent(reportId)}/section-rerun`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentKeys: selected }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || '专章重算失败');
      }
      const okList = (data.succeeded || []).join('、') || selected.join('、');
      setMessage(`已更新：${okList}（${data.durationMs || 0}ms）。刷新页面即可看到新内容。`);
      // soft reload so SSR picks up new analysis
      window.setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : '专章重算失败');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id="section-rerun"
      className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4"
      aria-label="专章补强"
    >
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[color:var(--brand-strong)]">
        SECTION RERUN
      </div>
      <h3 className="mt-1 text-[15px] font-bold text-[color:var(--ink-1)]">专章补强（不全量重算）</h3>
      <p className="mt-1 text-[12px] leading-[1.5] text-[color:var(--ink-4)]">
        只重跑你勾选的专家层（最多 2 项），命盘底座与日主/用神锁定不变。比整份升级更快。
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SECTION_RERUN_CATALOG.map((item) => {
          const on = selected.includes(item.key);
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => toggle(item.key)}
              disabled={busy}
              title={item.description}
              className={`rounded-full border px-2.5 py-1 text-[12px] font-medium transition ${
                on
                  ? 'border-[color:var(--ink-1)] bg-[color:var(--ink-1)] text-white'
                  : 'border-[color:var(--hairline)] bg-white text-[color:var(--ink-3)] hover:border-[color:var(--hairline-strong)]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || selected.length === 0}
          className="fb-btn fb-btn-primary h-9 px-4 text-[13px] disabled:opacity-50"
        >
          {busy ? '正在补强…' : `重算已选专章（${selected.length}）`}
        </button>
        {message ? (
          <span className="text-[12px] text-[color:var(--data-up)]">{message}</span>
        ) : null}
        {error ? <span className="text-[12px] text-[color:var(--alert)]">{error}</span> : null}
      </div>
    </section>
  );
}
