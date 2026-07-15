'use client';

import { useMemo, useState } from 'react';
import {
  FEEDBACK_CATEGORIES,
  getFeedbackCategoryLabel,
  type SiteFeedbackRecord,
} from '@/lib/user-feedback-types';

type Counts = Record<string, number>;

export default function AdminFeedbackClient({
  initialItems,
  initialCounts,
}: {
  initialItems: SiteFeedbackRecord[];
  initialCounts: Counts;
}) {
  const [items, setItems] = useState(initialItems);
  const [counts, setCounts] = useState(initialCounts);
  const [filter, setFilter] = useState<'all' | SiteFeedbackRecord['status']>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.status === filter);
  }, [filter, items]);

  const setStatus = async (id: string, status: SiteFeedbackRecord['status']) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || '更新失败');
      setItems((prev) => prev.map((item) => (item.id === id ? data.item : item)));
      // refresh counts lightly
      setCounts((prev) => {
        const next = { ...prev };
        const old = items.find((item) => item.id === id);
        if (old) next[old.status] = Math.max(0, (next[old.status] || 0) - 1);
        next[status] = (next[status] || 0) + 1;
        return next;
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : '更新失败');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { key: 'total', label: '全部' },
          { key: 'new', label: '未读' },
          { key: 'read', label: '已读' },
          { key: 'done', label: '已处理' },
          { key: 'ignored', label: '忽略' },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key === 'total' ? 'all' : (item.key as SiteFeedbackRecord['status']))}
            className={`rounded-[var(--radius)] border px-3 py-3 text-left transition ${
              (item.key === 'total' && filter === 'all') || filter === item.key
                ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)]'
                : 'border-[color:var(--hairline)] bg-[color:var(--paper)] hover:bg-[color:var(--bg-sunken)]'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--ink-4)]">
              {item.label}
            </div>
            <div className="mt-1 text-xl font-black tabular-nums text-[color:var(--ink-1)]">
              {counts[item.key] || 0}
            </div>
          </button>
        ))}
      </div>

      <div className="fb-card overflow-hidden">
        <div className="border-b border-[color:var(--hairline)] px-4 py-3 text-sm font-semibold text-[color:var(--ink-2)]">
          列表（{visible.length}）· 类型对照：
          {FEEDBACK_CATEGORIES.map((c) => c.label).join(' / ')}
        </div>
        <ul className="divide-y divide-[color:var(--hairline)]">
          {visible.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-[color:var(--ink-4)]">暂无反馈</li>
          ) : (
            visible.map((item) => (
              <li key={item.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-[var(--radius-sm)] bg-[color:var(--brand-soft)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--brand-strong)]">
                        {getFeedbackCategoryLabel(item.category)}
                      </span>
                      <span className="text-[11px] font-mono text-[color:var(--ink-4)]">{item.status}</span>
                      <span className="text-[11px] text-[color:var(--ink-4)]">
                        {new Date(item.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    {item.pageUrl ? (
                      <a
                        href={item.pageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block break-all text-[12px] font-medium text-[color:var(--brand)] hover:underline"
                      >
                        {item.pageUrl}
                      </a>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['read', 'done', 'ignored', 'new'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={busyId === item.id || item.status === status}
                        onClick={() => void setStatus(item.id, status)}
                        className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-2 py-1 text-[11px] font-semibold text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)] disabled:opacity-40"
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[color:var(--ink-2)]">
                  {item.message}
                </p>
                <div className="mt-2 font-mono text-[10px] text-[color:var(--ink-5)]">
                  {item.id}
                  {item.userId ? ` · user ${item.userId}` : ' · anonymous'}
                  {item.clientIp ? ` · ${item.clientIp}` : ''}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
