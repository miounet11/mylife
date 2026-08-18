'use client';

import { useMemo, useState } from 'react';
import {
  FEEDBACK_CATEGORIES,
  getFeedbackCategoryLabel,
  type SiteFeedbackRecord,
} from '@/lib/user-feedback-types';
import {
  classifyFeedbackSignal,
  feedbackSignalLabel,
  type FeedbackSignalKind,
} from '@/lib/feedback-signal';
import { formatInboxAge, type OpsInboxSnapshot } from '@/lib/ops-inbox-view';

type RecentErrorRow = {
  id: string;
  at?: string;
  route?: string | null;
  message?: string;
};

type Counts = Record<string, number>;

type ViewFilter =
  | 'all'
  | 'freeform'
  | 'calibration'
  | SiteFeedbackRecord['status'];

function signalTone(kind: FeedbackSignalKind): string {
  switch (kind) {
    case 'freeform':
      return 'bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]';
    case 'past_event':
      return 'bg-amber-50 text-amber-800';
    case 'accuracy':
      return 'bg-sky-50 text-sky-800';
    case 'birth_hour':
      return 'bg-slate-100 text-slate-700';
    case 'appearance':
      return 'bg-violet-50 text-violet-800';
    case 'empty_form':
      return 'bg-zinc-100 text-zinc-500';
    case 'smoke':
      return 'bg-zinc-100 text-zinc-500';
    case 'cohort':
      return 'bg-emerald-50 text-emerald-800';
    default:
      return 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)]';
  }
}

export default function AdminFeedbackClient({
  initialItems,
  initialCounts,
  inbox,
  recentErrors = [],
}: {
  initialItems: SiteFeedbackRecord[];
  initialCounts: Counts;
  inbox?: OpsInboxSnapshot;
  recentErrors?: RecentErrorRow[];
}) {
  const [items, setItems] = useState(initialItems);
  const [counts, setCounts] = useState(initialCounts);
  const [filter, setFilter] = useState<ViewFilter>('new');
  const [busyId, setBusyId] = useState<string | null>(null);

  const kindStats = useMemo(() => {
    const stats: Record<FeedbackSignalKind, number> = {
      freeform: 0,
      birth_hour: 0,
      accuracy: 0,
      past_event: 0,
      appearance: 0,
      empty_form: 0,
      smoke: 0,
      cohort: 0,
    };
    for (const item of items) {
      stats[classifyFeedbackSignal(item.message)] += 1;
    }
    return stats;
  }, [items]);

  const insights = useMemo(() => {
    const freeform = items.filter((i) => classifyFeedbackSignal(i.message) === 'freeform');
    const pastDenies = items.filter((i) => classifyFeedbackSignal(i.message) === 'past_event');
    const accuracyBad = items.filter(
      (i) =>
        classifyFeedbackSignal(i.message) === 'accuracy' && /偏差较大/.test(i.message),
    );
    const chatIssues = freeform.filter((i) => /chat|对话|读取|验证码|邮箱|出错/.test(
      `${i.message} ${i.pageUrl || ''}`,
    ));
    const themes: Record<string, number> = {};
    for (const i of pastDenies) {
      for (const t of ['事业', '钱财', '关系', '透支', '现金流', '岗位'] as const) {
        if (i.message.includes(t)) themes[t] = (themes[t] || 0) + 1;
      }
    }
    return {
      freeformCount: freeform.length,
      pastDenyCount: pastDenies.length,
      accuracyBadCount: accuracyBad.length,
      chatIssueCount: chatIssues.length,
      themes,
      topFreeform: freeform
        .filter((i) => i.status === 'new')
        .slice(0, 5)
        .map((i) => ({
          id: i.id,
          message: i.message.slice(0, 120),
          pageUrl: i.pageUrl,
          createdAt: i.createdAt,
        })),
    };
  }, [items]);

  const visible = useMemo(() => {
    let list = items;
    if (filter === 'freeform') {
      list = items.filter((i) => classifyFeedbackSignal(i.message) === 'freeform');
    } else if (filter === 'calibration') {
      list = items.filter((i) => classifyFeedbackSignal(i.message) !== 'freeform');
    } else if (filter !== 'all') {
      list = items.filter((i) => i.status === filter);
    }
    // freeform first within mixed views
    return [...list].sort((a, b) => {
      const ak = classifyFeedbackSignal(a.message) === 'freeform' ? 0 : 1;
      const bk = classifyFeedbackSignal(b.message) === 'freeform' ? 0 : 1;
      if (ak !== bk) return ak - bk;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
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

  const bulkIgnoreCalibration = async () => {
    const targets = items.filter(
      (i) =>
        i.status === 'new' &&
        classifyFeedbackSignal(i.message) !== 'freeform' &&
        classifyFeedbackSignal(i.message) !== 'smoke',
    );
    if (targets.length === 0) {
      alert('没有可归档的校准信号');
      return;
    }
    if (
      !confirm(
        `将 ${targets.length} 条「时辰/准确度/过去节点」校准信号标为 ignored？\n（不删数据；用户留言不受影响）`,
      )
    ) {
      return;
    }
    setBusyId('bulk');
    try {
      for (const item of targets) {
        const res = await fetch('/api/admin/feedback', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: item.id, status: 'ignored' }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setItems((prev) => prev.map((row) => (row.id === item.id ? data.item : row)));
        }
      }
      // recompute status counts from items after loop
      setCounts((prev) => {
        const next = { ...prev };
        for (const item of targets) {
          next[item.status] = Math.max(0, (next[item.status] || 0) - 1);
          next.ignored = (next.ignored || 0) + 1;
        }
        return next;
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : '批量失败');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {inbox ? (
        <section className="rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand)]">
            Inbox pulse
          </div>
          <h2 className="mt-1 text-[15px] font-black text-[color:var(--ink-1)]">
            不是没有信号：校准在进、报错在进，真实留言最近一次在
            {inbox.feedback.lastFreeformAt
              ? ` ${formatInboxAge(inbox.feedback.lastFreeformAt)}`
              : ' —'}
          </h2>
          <p className="mt-1 text-[12px] leading-5 text-[color:var(--ink-3)]">
            未读 {inbox.feedback.unread} 条里，待回的用户留言 {inbox.feedback.freeformNew} 条。
            前端报错近 24h {inbox.errors.last24h} 条
            {inbox.errors.groups[0]
              ? `，最多是「${inbox.errors.groups[0].label}」×${inbox.errors.groups[0].count}`
              : ''}
            。世代校准近 24h {inbox.cohort.last24h} 次判断。
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase text-[color:var(--ink-4)]">上次真实留言</div>
              <div className="mt-0.5 text-[14px] font-bold text-[color:var(--ink-1)]">
                {formatInboxAge(inbox.feedback.lastFreeformAt)}
              </div>
              {inbox.feedback.lastFreeformPreview ? (
                <p className="mt-1 line-clamp-2 text-[11px] text-[color:var(--ink-3)]">
                  {inbox.feedback.lastFreeformPreview}
                </p>
              ) : null}
            </div>
            <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase text-[color:var(--ink-4)]">反馈 24h / 7d</div>
              <div className="mt-0.5 text-xl font-black tabular-nums text-[color:var(--ink-1)]">
                {inbox.feedback.last24h}
                <span className="ml-1 text-[13px] font-semibold text-[color:var(--ink-4)]">
                  / {inbox.feedback.last7d}
                </span>
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase text-[color:var(--ink-4)]">前端报错 24h</div>
              <div className="mt-0.5 text-xl font-black tabular-nums text-[color:var(--ink-1)]">
                {inbox.errors.last24h}
              </div>
              <p className="mt-1 text-[11px] text-[color:var(--ink-4)]">
                近 7 天 {inbox.errors.total} · {formatInboxAge(inbox.errors.lastAt)}
              </p>
            </div>
            <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase text-[color:var(--ink-4)]">世代校准 24h</div>
              <div className="mt-0.5 text-xl font-black tabular-nums text-[color:var(--ink-1)]">
                {inbox.cohort.last24h}
              </div>
              <p className="mt-1 text-[11px] text-[color:var(--ink-4)]">
                像我 {inbox.cohort.byVerdict.like || 0} · 不像 {inbox.cohort.byVerdict.unlike || 0}
              </p>
            </div>
          </div>
          {inbox.errors.groups.length > 0 ? (
            <div className="mt-3 border-t border-[color:var(--hairline)] pt-3">
              <div className="text-[11px] font-bold text-[color:var(--ink-4)]">前端报错分组（近 7 天）</div>
              <ul className="mt-2 divide-y divide-[color:var(--hairline)]">
                {inbox.errors.groups.map((group) => (
                  <li key={group.key} className="flex flex-wrap items-baseline justify-between gap-2 py-1.5 text-[12px]">
                    <span className="text-[color:var(--ink-2)]">{group.label}</span>
                    <span className="tabular-nums text-[color:var(--ink-4)]">
                      ×{group.count}
                      {group.sampleRoute ? ` · ${group.sampleRoute}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {recentErrors.length > 0 ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-[12px] font-semibold text-[color:var(--ink-3)]">
                最近 {recentErrors.length} 条前端报错明细
              </summary>
              <ul className="mt-2 max-h-56 space-y-1.5 overflow-auto font-mono text-[11px] leading-5 text-[color:var(--ink-4)]">
                {recentErrors.slice(0, 20).map((row) => (
                  <li key={row.id}>
                    {row.at?.slice(0, 19)} · {row.route || '—'} · {(row.message || '').slice(0, 120)}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
      ) : null}

      {/* High-level analysis */}
      <section className="rounded-[var(--radius-lg)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand)]">
              Feedback Intelligence
            </div>
            <h2 className="mt-1 text-[15px] font-black text-[color:var(--ink-1)]">
              高纬度分析 · 信号 vs 真实留言
            </h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-5 text-[color:var(--ink-3)]">
              多数条目来自报告页「校准」交互（时辰 / 准确度 / 过去节点），不是用户主动留言。
              优先处理「用户留言」与对话/登录类问题。
            </p>
          </div>
          <button
            type="button"
            disabled={busyId === 'bulk'}
            onClick={() => void bulkIgnoreCalibration()}
            className="rounded-[var(--radius)] border border-[color:var(--hairline)] px-3 py-2 text-[12px] font-semibold text-[color:var(--ink-3)] hover:bg-[color:var(--bg-sunken)] disabled:opacity-40"
          >
            归档校准信号
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {(
            [
              { kind: 'freeform' as const, label: '用户留言' },
              { kind: 'past_event' as const, label: '过去节点否认' },
              { kind: 'accuracy' as const, label: '准确度评分' },
              { kind: 'birth_hour' as const, label: '时辰校准' },
              { kind: 'appearance' as const, label: '外貌生活校准' },
              { kind: 'empty_form' as const, label: '空报错模板' },
              { kind: 'cohort' as const, label: '世代校准' },
              { kind: 'smoke' as const, label: '冒烟测试' },
            ] as const
          ).map((row) => (
            <div
              key={row.kind}
              className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5"
            >
              <div className="text-[10px] font-bold uppercase text-[color:var(--ink-4)]">
                {row.label}
              </div>
              <div className="mt-0.5 text-xl font-black tabular-nums text-[color:var(--ink-1)]">
                {kindStats[row.kind]}
              </div>
            </div>
          ))}
        </div>

        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-[12px] leading-5 text-[color:var(--ink-3)]">
          <li>
            <strong className="text-[color:var(--ink-1)]">产品真问题（优先）</strong>：
            用户留言 {insights.freeformCount} 条
            {insights.chatIssueCount > 0
              ? ` · 其中对话/登录相关约 ${insights.chatIssueCount} 条`
              : ''}
            。
          </li>
          <li>
            <strong className="text-[color:var(--ink-1)]">过去节点误伤</strong>：
            {insights.pastDenyCount} 次「未发生」——说明 past-event 模板仍偏绝对；已改为全软表述 + 每报告最多 2 条。
            {Object.keys(insights.themes).length
              ? ` 主题：${Object.entries(insights.themes)
                  .sort((a, b) => b[1] - a[1])
                  .map(([k, v]) => `${k}×${v}`)
                  .join(' · ')}`
              : ''}
          </li>
          <li>
            <strong className="text-[color:var(--ink-1)]">准确度</strong>：
            「偏差较大」{insights.accuracyBadCount} 次；校准回写已修正为只记评分、不再误伤全部节点模板。{' '}
            <a href="/admin/accuracy-eval" className="font-semibold text-[color:var(--brand)] hover:underline">
              打开偏差样本评测 →
            </a>
          </li>
          <li>
            <strong className="text-[color:var(--ink-1)]">时辰</strong>：
            「确定」不再写「应降低时柱权重」；不确定才降权。
          </li>
        </ul>

        {insights.topFreeform.length > 0 ? (
          <div className="mt-4 rounded-[var(--radius)] border border-dashed border-[color:var(--hairline-strong)] bg-[color:var(--bg-sunken)]/60 p-3">
            <div className="text-[11px] font-bold uppercase text-[color:var(--ink-4)]">
              待处理用户留言
            </div>
            <ul className="mt-2 space-y-2">
              {insights.topFreeform.map((row) => (
                <li key={row.id} className="text-[12px] text-[color:var(--ink-2)]">
                  <span className="font-semibold">{row.message}</span>
                  {row.pageUrl ? (
                    <span className="mt-0.5 block truncate font-mono text-[10px] text-[color:var(--ink-4)]">
                      {row.pageUrl}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-[12px] text-[color:var(--ink-4)]">
            当前没有未处理的用户自由留言。未读条目多半是校准信号，请切到「未读」或「校准信号」。
          </p>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { key: 'freeform' as const, label: '用户留言', value: kindStats.freeform },
          {
            key: 'calibration' as const,
            label: '校准信号',
            value:
              kindStats.birth_hour +
              kindStats.accuracy +
              kindStats.past_event +
              kindStats.appearance +
              kindStats.empty_form +
              kindStats.smoke,
          },
          { key: 'all' as const, label: '全部', value: counts.total || items.length },
          { key: 'new' as const, label: '未读', value: counts.new || 0 },
          { key: 'done' as const, label: '已处理', value: counts.done || 0 },
          { key: 'ignored' as const, label: '忽略', value: counts.ignored || 0 },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-[var(--radius)] border px-3 py-3 text-left transition ${
              filter === item.key
                ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)]'
                : 'border-[color:var(--hairline)] bg-[color:var(--paper)] hover:bg-[color:var(--bg-sunken)]'
            }`}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--ink-4)]">
              {item.label}
            </div>
            <div className="mt-1 text-xl font-black tabular-nums text-[color:var(--ink-1)]">
              {item.value}
            </div>
          </button>
        ))}
      </div>

      <div className="fb-card overflow-hidden">
        <div className="border-b border-[color:var(--hairline)] px-4 py-3 text-sm font-semibold text-[color:var(--ink-2)]">
          列表（{visible.length}）· 类型：
          {FEEDBACK_CATEGORIES.map((c) => c.label).join(' / ')}
        </div>
        <ul className="divide-y divide-[color:var(--hairline)]">
          {visible.length === 0 ? (
            <li className="px-4 py-10 text-center text-sm text-[color:var(--ink-4)]">
              {filter === 'freeform'
              ? '没有用户自由留言。校准和报错在上面的脉搏里，或切到「未读」。'
              : '这个筛选下没有条目。'}
            </li>
          ) : (
            visible.map((item) => {
              const kind = classifyFeedbackSignal(item.message);
              return (
                <li key={item.id} className="px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-[var(--radius-sm)] px-2 py-0.5 text-[11px] font-bold ${signalTone(kind)}`}
                        >
                          {feedbackSignalLabel(kind)}
                        </span>
                        <span className="rounded-[var(--radius-sm)] bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--ink-3)]">
                          {getFeedbackCategoryLabel(item.category)}
                        </span>
                        <span className="text-[11px] font-mono text-[color:var(--ink-4)]">
                          {item.status}
                        </span>
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
                  {item.reportId ? (
                    <p className="mt-1.5 text-[12px] font-medium text-[color:var(--ink-3)]">
                      报告 ID：{' '}
                      <a
                        href={`/result/${encodeURIComponent(item.reportId)}`}
                        className="font-mono text-[color:var(--brand)] hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.reportId}
                      </a>
                    </p>
                  ) : null}
                  {item.contextJson ? (
                    <pre className="mt-1.5 max-h-24 overflow-auto rounded bg-[color:var(--bg-sunken)] p-2 text-[10px] leading-4 text-[color:var(--ink-4)]">
                      {item.contextJson}
                    </pre>
                  ) : null}
                  <div className="mt-2 font-mono text-[10px] text-[color:var(--ink-5)]">
                    {item.id}
                    {item.userId ? ` · user ${item.userId}` : ' · anonymous'}
                    {item.clientIp ? ` · ${item.clientIp}` : ''}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
