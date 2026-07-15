'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, Wrench } from 'lucide-react';
import {
  fetchToolSessionHistory,
  readToolHistory,
  type ToolHistoryEntry,
  type ToolSessionHistoryItem,
} from '@/lib/tool-history';

function formatWhen(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ToolHistoryPanel({
  title,
  description,
  compact,
  limit = 8,
  showVisits = true,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
  limit?: number;
  /** Show localStorage page visits under server runs. */
  showVisits?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ToolSessionHistoryItem[]>([]);
  const [visits, setVisits] = useState<ToolHistoryEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [serverSessions] = await Promise.all([fetchToolSessionHistory(limit)]);
      if (cancelled) return;
      setSessions(serverSessions);
      if (showVisits) {
        setVisits(readToolHistory().slice(0, Math.max(4, Math.floor(limit / 2))));
      }
      setLoading(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [limit, showVisits]);

  const hasSessions = sessions.length > 0;
  const visitOnly = !hasSessions && visits.length > 0;

  return (
    <section className={`fb-card ${compact ? 'p-3' : 'p-4 md:p-5'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-[color:var(--ink-2)]">
            <Wrench className="h-3.5 w-3.5 text-[color:var(--brand)]" />
            {title || '工具使用记录'}
          </h2>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-[color:var(--ink-4)]">{description}</p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-[color:var(--ink-4)]">
              已完成的工具结果会保存在本会话，可点开快速回看结论与建议。
            </p>
          )}
        </div>
        <Link
          href="/tools"
          className="shrink-0 text-[12px] font-semibold text-[color:var(--brand)] hover:no-underline"
        >
          工具中心
        </Link>
      </div>

      {loading ? (
        <div className="mt-3 flex items-center gap-2 text-[12px] text-[color:var(--ink-4)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          加载工具记录…
        </div>
      ) : null}

      {!loading && hasSessions ? (
        <ul className="mt-3 space-y-2">
          {sessions.map((session) => (
            <li key={session.id}>
              <Link
                href={session.resultHref}
                className="block rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2.5 transition hover:border-[color:var(--brand-soft-2)] hover:bg-[color:var(--bg-sunken)] hover:no-underline"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[color:var(--ink-1)]">
                      {session.title}
                      <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--brand)]">
                        {session.status === 'completed' ? '已完成' : session.status}
                      </span>
                    </div>
                    {session.headline ? (
                      <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[color:var(--ink-3)]">
                        {session.headline}
                      </p>
                    ) : session.summary ? (
                      <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[color:var(--ink-3)]">
                        {session.summary}
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[color:var(--ink-4)]">
                      <span>{formatWhen(session.createdAt)}</span>
                      {session.reportId ? (
                        <span className="truncate">报告 {session.reportId.slice(0, 18)}…</span>
                      ) : null}
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-bold text-[color:var(--brand)]">
                    看结果
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {!loading && !hasSessions ? (
        <div className="mt-3 rounded-[var(--radius-sm)] border border-dashed border-[color:var(--hairline)] px-3 py-3">
          <p className="text-[13px] leading-5 text-[color:var(--ink-3)]">
            {visitOnly
              ? '你浏览过工具页，但还没有完整跑出可回看的结果。先生成报告再运行工具。'
              : '暂无工具运行记录。完成一次综合报告后，可在工具中心做单项聚焦判断。'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/tools" className="fb-btn fb-btn-primary h-8 px-3 text-[12px] hover:no-underline">
              去工具中心
            </Link>
            <Link href="/analyze" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
              先生成报告
            </Link>
          </div>
        </div>
      ) : null}

      {!loading && showVisits && visits.length ? (
        <div className="mt-3 border-t border-[color:var(--hairline)] pt-3">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--ink-4)]">
            最近浏览
          </div>
          <ul className="mt-1.5 space-y-1">
            {visits.map((entry) => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  className="flex items-center justify-between rounded-[var(--radius-sm)] px-1 py-1.5 text-[12px] font-semibold text-[color:var(--ink-3)] hover:text-[color:var(--brand)] hover:no-underline"
                >
                  <span className="truncate">{entry.title}</span>
                  <span className="ml-2 shrink-0 text-[10px] font-normal text-[color:var(--ink-4)]">
                    {formatWhen(entry.usedAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
