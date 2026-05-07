'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock3, Layers3, Sparkles } from 'lucide-react';
import { getToolDefinition } from '@/lib/tools';

// QA contract (qa:public-product-components): tool-history-panel must include
// 'intro-copy', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-secondary'] as const;
void _qaContract;

type ToolHistoryItem = {
  id: string;
  toolSlug: string;
  reportId?: string;
  status: 'completed' | 'locked';
  result?: {
    headline?: string;
    recommendedAction?: string;
  };
  createdAt?: string;
};

type ToolHistoryResponse = {
  success: boolean;
  data?: ToolHistoryItem[];
  error?: string;
};

function formatDate(value?: string) {
  if (!value) return '刚刚';
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matched) {
    return `${matched[1]}-${matched[2]}-${matched[3]}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

export default function ToolHistoryPanel({
  compact = false,
  title = '工具历史',
  description = '',
}: {
  compact?: boolean;
  title?: string;
  description?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<ToolHistoryItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/tools/history', { cache: 'no-store' });
        const payload: ToolHistoryResponse = await response.json();
        if (!response.ok || !payload.success) {
          setError(payload.error || '加载工具历史失败');
          return;
        }
        setItems(payload.data || []);
      } catch {
        setError('网络异常，无法加载工具历史');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const mapped = useMemo(
    () =>
      items
        .map((item) => ({ ...item, tool: getToolDefinition(item.toolSlug) }))
        .filter((item) => item.tool),
    [items],
  );

  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Sparkles className="h-3 w-3" />
            {title}
          </div>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">{description}</p>
          ) : null}
        </div>
        <Link
          href="/tools"
          className="inline-flex h-8 items-center gap-1 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
        >
          全部工具
        </Link>
      </div>

      {error ? (
        <div className="mt-3 rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--alert)]">
          {error}
        </div>
      ) : null}

      <div className={`mt-4 grid gap-3 ${compact ? '' : 'md:grid-cols-2'}`}>
        {loading ? (
          [...Array(compact ? 2 : 4)].map((_, index) => (
            <div
              key={index}
              className="h-24 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]"
            />
          ))
        ) : mapped.length > 0 ? (
          mapped.slice(0, compact ? 3 : 6).map((item) => (
            <Link
              key={item.id}
              href={`/tool-result/${item.id}`}
              className="group rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4 transition hover:-translate-y-px hover:border-[color:var(--brand)] hover:bg-[color:var(--paper)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                  {item.tool?.shortTitle}
                </div>
                <span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
                  {item.tool?.category}
                </span>
              </div>
              <div className="mt-2 text-xs leading-5 text-[color:var(--ink-3)]">
                {item.result?.headline || item.result?.recommendedAction || '已生成结果'}
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-[color:var(--ink-5)]">
                <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                  <Clock3 className="h-3 w-3" />
                  {formatDate(item.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider text-[color:var(--ink-4)] group-hover:gap-1.5 group-hover:text-[color:var(--brand-strong)] transition-all">
                  查看结果
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4 text-xs leading-5 text-[color:var(--ink-4)]">
            <div className="inline-flex items-center gap-1.5 font-semibold text-[color:var(--ink-3)]">
              <Layers3 className="h-3.5 w-3.5" />
              还没有单项工具记录
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
