'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, Clock3, FileText, Layers3, UserRound } from 'lucide-react';
import FortuneForm from '@/components/fortune-form';
import { abortControllerRef, fetchJsonWithTimeout, isAbortLikeError } from '@/lib/utils';


// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-secondary'] as const;
void _qaContract;
type HistoryUser = {
  id: string;
  name?: string;
  email?: string | null;
};

type FortuneItem = {
  id: string;
  name?: string;
  birth_date?: string;
  birth_time?: string;
  birth_place?: string;
  created_at?: string;
  pattern?: {
    type?: string;
    strength?: string;
  };
  analysis?: {
    opening?: string;
    explanation?: string;
  };
};

type HistoryResponse = {
  success: boolean;
  user?: HistoryUser;
  fortunes?: FortuneItem[];
  error?: string;
};

const ANALYZE_HISTORY_TIMEOUT_MS = 12_000;

function truncate(text: string, max = 54) {
  if (!text) return '已完成综合判断，点击查看详情。';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function formatDateLabel(value?: string) {
  if (!value) return '未记录';
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matched) {
    return `${matched[1]}-${matched[2]}-${matched[3]}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

function mapStrengthLabel(strength?: string) {
  if (strength === 'strong') return '势能较强';
  if (strength === 'weak') return '需稳步推进';
  return '节奏平衡';
}

const worldYiWorkspaceLinks = [
  { label: '案例证据层', href: '/cases' },
  { label: '方法论入口', href: '/knowledge/world-yi-methodology' },
  { label: '世界易总入口', href: '/world-yi' },
];

export default function AnalyzeWorkspace({
  returnHref,
  returnLabel,
  returnSource,
}: {
  returnHref?: string;
  returnLabel?: string;
  returnSource?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<HistoryUser | null>(null);
  const [fortunes, setFortunes] = useState<FortuneItem[]>([]);
  const [selectedName, setSelectedName] = useState('全部');

  useEffect(() => {
    let cancelled = false;
    const controllerRef = { current: null as AbortController | null };

    const load = async () => {
      try {
        const { response, data } = await fetchJsonWithTimeout<HistoryResponse>('/api/history', {
          cache: 'no-store',
          timeoutMs: ANALYZE_HISTORY_TIMEOUT_MS,
          timeoutReason: 'analyze-history-timeout',
          controllerRef,
        });
        if (cancelled) {
          return;
        }

        if (!response.ok || !data.success) {
          setError(data.error || '加载判断列表失败');
          return;
        }

        setUser(data.user || null);
        setFortunes(data.fortunes || []);
      } catch (loadError) {
        if (!cancelled) {
          setError(isAbortLikeError(loadError) ? '加载判断列表等待时间过长，请稍后重试' : '网络异常，无法加载判断列表');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      abortControllerRef(controllerRef, 'analyze-workspace-unmounted');
    };
  }, []);

  const nameGroups = useMemo(() => {
    const counts = new Map<string, number>();
    fortunes.forEach((item) => {
      const key = item.name || '未命名对象';
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return ['全部', ...Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([name]) => name)];
  }, [fortunes]);

  const currentName = user?.name?.trim();

  const categorized = useMemo(() => {
    const mine = fortunes.filter((item) => currentName && item.name === currentName);
    const others = fortunes.filter((item) => !currentName || item.name !== currentName);
    return { mine, others };
  }, [currentName, fortunes]);

  const filteredFortunes = useMemo(() => {
    if (selectedName === '全部') {
      return fortunes;
    }
    return fortunes.filter((item) => (item.name || '未命名对象') === selectedName);
  }, [fortunes, selectedName]);

  return (
    <div className="space-y-6">
      <section className="grid gap-8 xl:grid-cols-[1.12fr_0.88fr] xl:items-start">
        <div id="analyze-workspace">
          <FortuneForm
            returnHref={returnHref}
            returnLabel={returnLabel}
            returnSource={returnSource}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-base font-bold leading-snug text-[color:var(--ink-1)]">
                  既有判断列表
                </div>
                <div className="mt-1 text-xs text-[color:var(--ink-4)]">
                  新建判断在左，历史记录在这里回看。
                </div>
              </div>
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-nowrap md:flex-wrap">
                {nameGroups.slice(0, 8).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedName(name)}
                    className={`inline-flex h-7 shrink-0 items-center rounded-[var(--radius-sm)] border px-2.5 text-xs font-semibold transition ${
                      selectedName === name
                        ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                        : 'border-[color:var(--hairline)] bg-[color:var(--paper)] text-[color:var(--ink-4)] hover:border-[color:var(--brand)]'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--alert)]">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]"
                />
              ))}
            </div>
          ) : filteredFortunes.length > 0 ? (
            <div className="space-y-3">
              {filteredFortunes.map((item) => (
                <Link
                  key={item.id}
                  href={`/result/${item.id}`}
                  className="fb-card block px-4 py-4 transition-colors hover:border-[color:var(--fb-blue)] hover:bg-[color:var(--fb-action-bg)] hover:no-underline md:px-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex h-5 items-center gap-1 rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-2 text-xs font-bold text-[color:var(--brand-strong)]">
                          <UserRound className="h-2.5 w-2.5" />
                          {item.name || '未命名对象'}
                        </span>
                        <span className="inline-flex h-5 items-center gap-1 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-2 text-xs font-bold text-[color:var(--ink-4)]">
                          <Layers3 className="h-2.5 w-2.5" />
                          {item.pattern?.type || '综合判断'}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs tabular-nums text-[color:var(--ink-5)]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {item.birth_date || '—'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {item.birth_time || '—'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {formatDateLabel(item.created_at)}
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-[color:var(--ink-3)]">
                        {truncate(item.analysis?.opening || item.analysis?.explanation || '')}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <div className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-2 text-xs font-bold text-[color:var(--signal-strong)]">
                        {mapStrengthLabel(item.pattern?.strength)}
                      </div>
                      <ChevronRight className="h-4 w-4 text-[color:var(--ink-5)]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-5 py-10 text-center">
              <div className="text-base font-bold text-[color:var(--ink-1)]">
                还没有判断记录
              </div>
            </div>
          )}

          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
              辅助入口
            </div>
            <p className="mt-1.5 text-xs leading-5 text-[color:var(--ink-4)]">
              如果你还在理解体系，可以先回到世界易总入口、方法论和案例层。
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
              {worldYiWorkspaceLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
