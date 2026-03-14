'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPremiumServiceLabel, type PremiumServiceKey } from '@/lib/report-premium-services';
import type { PremiumServiceRequestRecord } from '@/lib/user-types';

type StatusFilter = PremiumServiceRequestRecord['status'] | 'all';
type PriorityValue = NonNullable<PremiumServiceRequestRecord['priority']>;
type DraftState = {
  status: PremiumServiceRequestRecord['status'];
  priority: PriorityValue;
  adminNote: string;
  notifyUser: boolean;
};

interface SummaryState {
  countsByStatus: Record<PremiumServiceRequestRecord['status'], number>;
  totalOpen: number;
  totalHandled: number;
}

interface PremiumServicesResponse {
  success: boolean;
  error?: string;
  data?: PremiumServiceRequestRecord[];
  summary?: SummaryState;
}

const emptySummary: SummaryState = {
  countsByStatus: {
    new: 0,
    contacted: 0,
    in_progress: 0,
    delivered: 0,
    closed: 0,
    cancelled: 0,
  },
  totalOpen: 0,
  totalHandled: 0,
};

async function fetchPremiumServiceRequests(status: StatusFilter, serviceKey: PremiumServiceKey | 'all') {
  const searchParams = new URLSearchParams({
    status,
    serviceKey,
    limit: '80',
  });
  const response = await fetch(`/api/admin/premium-services?${searchParams.toString()}`, {
    cache: 'no-store',
  });
  const data = await response.json() as PremiumServicesResponse;

  return {
    ok: response.ok,
    data,
  };
}

export default function AdminPremiumServiceConsole() {
  const [requests, setRequests] = useState<PremiumServiceRequestRecord[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [summary, setSummary] = useState<SummaryState>(emptySummary);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [serviceFilter, setServiceFilter] = useState<PremiumServiceKey | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRequests = async (nextStatus = statusFilter, nextService = serviceFilter) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetchPremiumServiceRequests(nextStatus, nextService);
      const data = response.data;
      if (!response.ok || !data.success) {
        setError(data.error || '加载专项需求失败');
        return;
      }

      const nextRequests = (data.data || []) as PremiumServiceRequestRecord[];
      setRequests(nextRequests);
      setSummary((data.summary || emptySummary) as SummaryState);
      setDrafts((current) => {
        const next = { ...current };
        for (const item of nextRequests) {
          next[item.id] = next[item.id] || {
            status: item.status,
            priority: (item.priority || 'normal') as PriorityValue,
            adminNote: `${((item.meta || {}) as Record<string, unknown>).adminNote || ''}`,
            notifyUser: false,
          };
        }
        return next;
      });
    } catch {
      setError('网络异常，无法加载专项需求');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await fetchPremiumServiceRequests(statusFilter, serviceFilter);
        const data = response.data;
        if (cancelled) {
          return;
        }
        if (!response.ok || !data.success) {
          setError(data.error || '加载专项需求失败');
          return;
        }

        const nextRequests = (data.data || []) as PremiumServiceRequestRecord[];
        setRequests(nextRequests);
        setSummary((data.summary || emptySummary) as SummaryState);
        setDrafts((current) => {
          const next = { ...current };
          for (const item of nextRequests) {
            next[item.id] = next[item.id] || {
              status: item.status,
              priority: (item.priority || 'normal') as PriorityValue,
              adminNote: `${((item.meta || {}) as Record<string, unknown>).adminNote || ''}`,
              notifyUser: false,
            };
          }
          return next;
        });
      } catch {
        if (!cancelled) {
          setError('网络异常，无法加载专项需求');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [statusFilter, serviceFilter]);

  const updateDraft = (id: string, next: Partial<DraftState>) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] || {
          status: 'new',
          priority: 'normal',
          adminNote: '',
          notifyUser: false,
        }),
        ...next,
      },
    }));
  };

  const saveRequest = async (item: PremiumServiceRequestRecord) => {
    const draft = drafts[item.id];
    if (!draft) {
      return;
    }

    setSavingId(item.id);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/premium-services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: draft.status,
          priority: draft.priority,
          adminNote: draft.adminNote,
          notifyUser: draft.notifyUser,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '更新失败');
        return;
      }

      setMessage(`需求单 ${item.id} 已更新`);
      setDrafts((current) => ({
        ...current,
        [item.id]: {
          ...draft,
          notifyUser: false,
        },
      }));
      await loadRequests();
    } catch {
      setError('网络异常，更新失败');
    } finally {
      setSavingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: '待处理', value: summary.countsByStatus.new, tone: 'bg-amber-50 text-amber-800' },
          { label: '处理中', value: summary.countsByStatus.in_progress, tone: 'bg-sky-50 text-sky-700' },
          { label: '当前打开', value: summary.totalOpen, tone: 'bg-white text-[color:var(--ink)]' },
          { label: '已处理完成', value: summary.totalHandled, tone: 'bg-emerald-50 text-emerald-700' },
        ].map((item) => (
          <div key={item.label} className={`rounded-[1.5rem] px-5 py-5 ${item.tone}`}>
            <div className="text-xs tracking-[0.18em]">{item.label}</div>
            <div className="mt-2 text-3xl font-black">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-[2rem] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-semibold text-[color:var(--ink)]">专项需求跟进台</div>
            <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
              这里统一处理结果页提交的事件推演、断事、事件剖析和卦象增强需求。
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--ink)]"
            >
              <option value="all">全部状态</option>
              <option value="new">新提交</option>
              <option value="contacted">已跟进</option>
              <option value="in_progress">处理中</option>
              <option value="delivered">已交付</option>
              <option value="closed">已结束</option>
              <option value="cancelled">已取消</option>
            </select>

            <select
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value as PremiumServiceKey | 'all')}
              className="rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--ink)]"
            >
              <option value="all">全部专项</option>
              <option value="event-simulation">事件推演</option>
              <option value="event-verdict">断事专项</option>
              <option value="event-review">事件剖析</option>
              <option value="meihua-enhancement">摇卦 / 梅花易</option>
            </select>

            <button
              type="button"
              onClick={() => loadRequests()}
              className="rounded-full border border-[color:var(--line)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
            >
              刷新列表
            </button>
          </div>
        </div>

        {message ? <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}
        {error ? <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-4">
          {loading ? (
            <div className="rounded-[1.5rem] bg-slate-50 px-4 py-5 text-sm text-[color:var(--muted)]">正在加载专项需求...</div>
          ) : requests.length === 0 ? (
            <div className="rounded-[1.5rem] bg-slate-50 px-4 py-5 text-sm text-[color:var(--muted)]">当前筛选条件下还没有专项需求。</div>
          ) : requests.map((item) => {
            const draft = drafts[item.id] || {
              status: item.status,
              priority: (item.priority || 'normal') as PriorityValue,
              adminNote: '',
              notifyUser: false,
            };

            return (
              <div key={item.id} className="soft-card rounded-[1.75rem] p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                        {getPremiumServiceLabel(item.serviceKey)}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mapStatusClass(item.status)}`}>
                        {mapStatusLabel(item.status)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
                        {mapPriorityLabel(item.priority)}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-[color:var(--muted)]">
                      {item.id} · {formatDateTime(item.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm">
                    {item.reportId ? (
                      <Link
                        href={`/result/${encodeURIComponent(item.reportId)}`}
                        className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-semibold text-[color:var(--ink)]"
                      >
                        查看报告
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-3">
                    <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">用户问题</div>
                      <div className="mt-2 text-sm leading-7 text-[color:var(--ink)]">
                        {`${item.intake?.question || '未填写问题'}`}
                      </div>
                    </div>

                    <div className="rounded-[1.4rem] bg-slate-50 px-4 py-4">
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">联系方式</div>
                      <div className="mt-2 grid gap-2 text-sm leading-7 text-[color:var(--ink)]">
                        <div>称呼：{item.contactName || '未填写'}</div>
                        <div>联系：{item.contactValue || '未填写'}</div>
                        <div>偏好：{`${item.intake?.preferredContact || '未填写'}`}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select
                        value={draft.status}
                        onChange={(event) => updateDraft(item.id, { status: event.target.value as PremiumServiceRequestRecord['status'] })}
                        className="rounded-[1.2rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--ink)]"
                      >
                        <option value="new">新提交</option>
                        <option value="contacted">已跟进</option>
                        <option value="in_progress">处理中</option>
                        <option value="delivered">已交付</option>
                        <option value="closed">已结束</option>
                        <option value="cancelled">已取消</option>
                      </select>

                      <select
                        value={draft.priority}
                        onChange={(event) => updateDraft(item.id, { priority: event.target.value as PriorityValue })}
                        className="rounded-[1.2rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[color:var(--ink)]"
                      >
                        <option value="normal">普通优先级</option>
                        <option value="high">高优先级</option>
                        <option value="urgent">紧急优先级</option>
                      </select>
                    </div>

                    <textarea
                      value={draft.adminNote}
                      onChange={(event) => updateDraft(item.id, { adminNote: event.target.value })}
                      placeholder="写下这次跟进说明、判断重点或下一步动作"
                      className="min-h-[120px] w-full rounded-[1.4rem] border border-[color:var(--line)] bg-white px-4 py-3 text-sm leading-7 text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
                    />

                    <label className="flex items-center gap-3 rounded-[1.2rem] bg-slate-50 px-4 py-3 text-sm text-[color:var(--ink)]">
                      <input
                        type="checkbox"
                        checked={draft.notifyUser}
                        onChange={(event) => updateDraft(item.id, { notifyUser: event.target.checked })}
                      />
                      同步给用户发送一封状态更新邮件
                    </label>

                    <button
                      type="button"
                      disabled={savingId === item.id}
                      onClick={() => saveRequest(item)}
                      className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {savingId === item.id ? '保存中...' : '保存跟进结果'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function mapStatusLabel(status: PremiumServiceRequestRecord['status']) {
  switch (status) {
    case 'contacted':
      return '已跟进';
    case 'in_progress':
      return '处理中';
    case 'delivered':
      return '已交付';
    case 'closed':
      return '已结束';
    case 'cancelled':
      return '已取消';
    default:
      return '新提交';
  }
}

function mapStatusClass(status: PremiumServiceRequestRecord['status']) {
  switch (status) {
    case 'contacted':
      return 'bg-sky-50 text-sky-700';
    case 'in_progress':
      return 'bg-amber-50 text-amber-800';
    case 'delivered':
      return 'bg-emerald-50 text-emerald-700';
    case 'closed':
      return 'bg-slate-100 text-slate-700';
    case 'cancelled':
      return 'bg-rose-50 text-rose-700';
    default:
      return 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]';
  }
}

function mapPriorityLabel(priority?: PremiumServiceRequestRecord['priority']) {
  switch (priority) {
    case 'urgent':
      return '紧急';
    case 'high':
      return '高优先级';
    default:
      return '普通优先级';
  }
}

function formatDateTime(value?: string) {
  if (!value) {
    return '刚刚';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
