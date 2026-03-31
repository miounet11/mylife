'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock3, Layers3, Sparkles } from 'lucide-react';
import { getToolDefinition } from '@/lib/tools';

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
  try {
    return new Date(value).toLocaleDateString('zh-CN');
  } catch {
    return value;
  }
}

export default function ToolHistoryPanel({
  compact = false,
  title = '工具历史',
  description = '最近做过的单项工具会沉淀在这里，方便继续复访。',
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

  const mapped = useMemo(() => items
    .map((item) => ({
      ...item,
      tool: getToolDefinition(item.toolSlug),
    }))
    .filter((item) => item.tool), [items]);

  return (
    <section className="glass-panel rounded-[2rem] p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            {title}
          </div>
          <p className="intro-copy mt-3">{description}</p>
        </div>
        <Link href="/tools" className="action-secondary">
          全部工具
        </Link>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className={`mt-5 grid gap-3 ${compact ? '' : 'md:grid-cols-2'}`}>
        {loading ? (
          [...Array(compact ? 2 : 4)].map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[1.5rem] bg-slate-200" />
          ))
        ) : mapped.length > 0 ? (
          mapped.slice(0, compact ? 3 : 6).map((item) => (
            <Link
              key={item.id}
              href={`/tool-result/${item.id}`}
              className="rounded-[1.5rem] border border-[color:var(--line)] bg-white/82 p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[color:var(--ink)]">{item.tool?.shortTitle}</div>
                <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                  {item.tool?.category}
                </span>
              </div>
              <div className="intro-copy mt-3">
                {item.result?.headline || item.result?.recommendedAction || '最近一次工具结果已生成，可继续复访。'}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-[color:var(--muted)]">
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  {formatDate(item.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[color:var(--accent-strong)]">
                  查看结果
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-[1.5rem] bg-slate-50 p-5 intro-copy">
            <div className="inline-flex items-center gap-2 font-semibold text-[color:var(--ink)]">
              <Layers3 className="h-4 w-4" />
              还没有单项工具记录
            </div>
            <div className="mt-2">先完成一次综合判断，再进入工具中心做更聚焦的单项测试。</div>
          </div>
        )}
      </div>
    </section>
  );
}
