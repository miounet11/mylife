'use client';

/**
 * 会员页 · 数据底座完整度里程碑卡片
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { LifeFoundationSnapshot } from '@/lib/life-foundation/types';
import { fetchJsonWithTimeout } from '@/lib/utils';

export default function FoundationMilestoneCard({ source = 'membership' }: { source?: string }) {
  const [snap, setSnap] = useState<LifeFoundationSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchJsonWithTimeout<{ success?: boolean; foundation?: LifeFoundationSnapshot }>(
      '/api/profile/foundation',
      { timeoutMs: 8_000, timeoutReason: 'membership-foundation' },
    )
      .then(({ response, data }) => {
        if (!cancelled && response.ok && data?.foundation) setSnap(data.foundation);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!snap) return null;

  const next = snap.milestones?.find((m) => !m.done);
  const done = snap.milestoneProgress?.done ?? 0;
  const total = snap.milestoneProgress?.total ?? snap.milestones?.length ?? 0;

  return (
    <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-medium text-[color:var(--ink-5)]">人生数据底座</div>
          <h3 className="mt-0.5 text-[15px] font-semibold text-[color:var(--ink-1)]">
            完整度 {snap.overall}% · 里程碑 {done}/{total}
          </h3>
          <p className="mt-1 text-[12px] text-[color:var(--ink-5)]">
            {snap.gradeLabel}
            {next ? ` · 下一站：${next.label}` : ' · 核心里程碑已齐'}
          </p>
        </div>
        <Link
          href={`/profile/foundation?source=${encodeURIComponent(source)}`}
          className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-slate-800"
        >
          {next ? next.ctaLabel : '查看底座'}
        </Link>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color:var(--bg-sunken)]">
        <div
          className="h-full rounded-full bg-[color:var(--ink-1)]"
          style={{ width: `${Math.max(4, Math.min(100, snap.overall))}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {(snap.milestones || []).slice(0, 5).map((m) => (
          <span key={m.id} className="inline-flex items-center gap-1 text-[10px] text-[color:var(--ink-5)]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                m.done ? 'bg-[color:var(--ink-1)]' : 'bg-[color:var(--hairline-strong)]'
              }`}
            />
            {m.label}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--ink-5)]">
        参数越全，会员深度服务与每日提醒越能贴你的固定背景。底座免费完善；会员解锁更完整交付与回访。
      </p>
    </section>
  );
}
