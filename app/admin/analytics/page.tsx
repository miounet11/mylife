import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { buildAdminActionItems, buildAdminOperatingInsight } from '@/lib/admin-analytics-insights';
import { requireAdminUser } from '@/lib/auth';
import { analyticsOperations } from '@/lib/database';

export const dynamic = 'force-dynamic';

const statLabels: Array<{ key: keyof ReturnType<typeof analyticsOperations.getOverview>['totals']; label: string; helper: string }> = [
  { key: 'total_analyses', label: '累计分析', helper: '已生成的命理报告' },
  { key: 'analyses_last_7d', label: '近 7 日分析', helper: '最近一周新增报告' },
  { key: 'public_reports', label: '公开报告', helper: '已开启分享的结果页' },
  { key: 'chat_messages', label: '聊天消息', helper: '用户发出的聊天问题' },
  { key: 'active_subscribers', label: '活跃订阅', helper: '当前有效订阅邮箱' },
  { key: 'total_events', label: '事件记录', helper: '用户沉淀的关键人生事件' },
  { key: 'result_report_linked_events', label: '报告关联事件', helper: '直接和某份报告绑定的事件数量' },
  { key: 'chat_sourced_events', label: '聊天沉淀事件', helper: '由 AI 对话直接转成的事件数量' },
  { key: 'validation_accurate', label: '验证准确', helper: '已被用户确认准确的判断' },
  { key: 'validation_drift', label: '验证偏差', helper: '已出现偏差、需要纠偏的判断' },
  { key: 'validation_pending', label: '待验证', helper: '尚未回收结果的事件' },
  { key: 'total_tracked_events', label: '埋点总数', helper: '系统累计记录的关键行为' },
  { key: 'tracked_events_last_7d', label: '近 7 日埋点', helper: '最近一周关键行为总量' },
];

export default async function AdminAnalyticsPage() {
  await requireAdminUser('/admin/analytics');
  const overview = analyticsOperations.getOverview();
  const {
    totals,
    eventsLast7d,
    recentEvents,
    sourceBreakdown,
    driftReasonBreakdown,
    pendingValidationBuckets,
    followupQueue,
    reportVersionBreakdown,
  } = overview;
  const validatedTotal = totals.validation_accurate + totals.validation_drift;
  const validationAccuracyRate = validatedTotal > 0 ? Math.round((totals.validation_accurate / validatedTotal) * 100) : 0;
  const driftRate = validatedTotal > 0 ? Math.round((totals.validation_drift / validatedTotal) * 100) : 0;
  const operatingInsight = buildAdminOperatingInsight({
    totals,
    pendingValidationBuckets,
    driftReasonBreakdown,
    reportVersionBreakdown,
  });
  const actionItems = buildAdminActionItems({
    totals,
    pendingValidationBuckets,
    driftReasonBreakdown,
    reportVersionBreakdown,
  });

  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/admin/content" ctaLabel="内容后台" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-5">
            <div className="section-label">经营后台</div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              产品不是上线就结束，
              <span className="font-serif text-[color:var(--accent-strong)]">必须能看到真实漏斗与真实行为。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              现在它不只看流量，还要看引擎是否被现实验证。分析、聊天、事件、验证偏差，必须出现在同一个后台视图里。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statLabels.map((item) => (
              <div key={item.key} className="soft-card rounded-[1.5rem] p-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{totals[item.key]}</div>
                <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.helper}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">当前经营判断</div>
            <div className="mt-4 rounded-[1.5rem] bg-white/80 px-4 py-5">
              <div className="text-2xl font-black text-[color:var(--ink)]">{operatingInsight.headline}</div>
              <div className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{operatingInsight.summary}</div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">优先事项</div>
                <div className="mt-3 grid gap-3">
                  {operatingInsight.priorities.length > 0 ? operatingInsight.priorities.map((item) => (
                    <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-[color:var(--ink)]">
                      {item}
                    </div>
                  )) : (
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">当前没有额外优先事项。</div>
                  )}
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">当前风险</div>
                <div className="mt-3 grid gap-3">
                  {operatingInsight.risks.length > 0 ? operatingInsight.risks.map((item) => (
                    <div key={item} className="rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-[color:var(--ink)]">
                      {item}
                    </div>
                  )) : (
                    <div className="rounded-2xl bg-white px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">当前没有明显结构性风险。</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">本周执行动作</div>
            <div className="mt-5 grid gap-3">
              {actionItems.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapActionTone(item.tone)}`}>
                      {mapActionToneLabel(item.tone)}
                    </div>
                  </div>
                  <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">验证闭环概览</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { label: '准确', value: totals.validation_accurate, tone: 'text-emerald-700 bg-emerald-50' },
                { label: '偏差', value: totals.validation_drift, tone: 'text-rose-700 bg-rose-50' },
                { label: '待验证', value: totals.validation_pending, tone: 'text-slate-700 bg-slate-50' },
              ].map((item) => (
                <div key={item.label} className={`rounded-[1.4rem] px-4 py-5 ${item.tone}`}>
                  <div className="text-xs tracking-[0.18em]">{item.label}</div>
                  <div className="mt-2 text-3xl font-black">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.4rem] bg-white/80 px-4 py-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">验证命中率</div>
                <div className="mt-2 text-3xl font-black text-emerald-700">{validationAccuracyRate}%</div>
                <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">只统计已经回收验证结果的事件。</div>
              </div>
              <div className="rounded-[1.4rem] bg-white/80 px-4 py-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">偏差率</div>
                <div className="mt-2 text-3xl font-black text-rose-700">{driftRate}%</div>
                <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">偏差并不等于报告失效，更常见是时机和执行跑偏。</div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">近 7 日关键行为</div>
            <div className="mt-5 grid gap-3">
              {eventsLast7d.length > 0 ? eventsLast7d.map((item) => (
                <div key={item.eventName} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.eventName}</div>
                    <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有近 7 日埋点数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">事件来源验证拆解</div>
            <div className="mt-5 grid gap-3">
              {sourceBreakdown.length > 0 ? sourceBreakdown.map((item) => (
                <div key={item.source} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapSourceLabel(item.source)}</div>
                    <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.total}</div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>准确 {item.accurate}</div>
                    <div>偏差 {item.drift}</div>
                    <div>待验证 {item.pending}</div>
                    <div>命中率 {item.accuracyRate}%</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有事件来源验证数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">偏差原因分布</div>
            <div className="mt-5 grid gap-3">
              {driftReasonBreakdown.length > 0 ? driftReasonBreakdown.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-rose-700">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {item.examples.length > 0 ? `样本事件：${item.examples.join('、')}` : '当前分类下还没有代表性样本。'}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有已记录的偏差原因，等用户持续回填后这里会显示最常见的偏差模式。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">待验证回收队列</div>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <QueueMetric label="已过期待验证" value={pendingValidationBuckets.overdue} tone="text-rose-700 bg-rose-50" />
                <QueueMetric label="未来待发生" value={pendingValidationBuckets.upcoming} tone="text-slate-700 bg-slate-50" />
                <QueueMetric label="偏差待备注" value={pendingValidationBuckets.driftNeedsNotes} tone="text-amber-700 bg-amber-50" />
                <QueueMetric label="偏差待纠偏" value={pendingValidationBuckets.driftReadyForCorrection} tone="text-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]" />
              </div>

              <div className="grid gap-3">
                {followupQueue.length > 0 ? followupQueue.map((item) => (
                  <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          {item.date} · {mapSourceLabel(item.source)} · {item.status === 'drift' ? '已偏差' : '待验证'}
                        </div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === 'drift' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {item.action}
                      </div>
                    </div>
                    <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">{item.reason}</div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                    当前没有需要优先回收或纠偏的事件队列。
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">报告版本结构</div>
            <div className="mt-5 grid gap-3">
              {reportVersionBreakdown.length > 0 ? reportVersionBreakdown.map((item) => (
                <div key={item.version} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.version}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有报告版本数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">最近埋点明细</div>
            <div className="mt-5 grid gap-3">
              {recentEvents.length > 0 ? recentEvents.map((item) => (
                <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.eventName}</div>
                    <div className="text-xs text-[color:var(--muted)]">{item.createdAt || '-'}</div>
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">{item.page || '未记录页面'}</div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有最近埋点明细。
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function mapSourceLabel(source: string) {
  if (source === 'result_report') return '结果页沉淀';
  if (source === 'chat_message') return '聊天沉淀';
  return '手动创建';
}

function QueueMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-[1.4rem] px-4 py-5 ${tone}`}>
      <div className="text-xs tracking-[0.18em]">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

function mapActionTone(tone: 'accent' | 'warning' | 'success' | 'neutral') {
  switch (tone) {
    case 'accent':
      return 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]';
    case 'warning':
      return 'bg-amber-50 text-amber-700';
    case 'success':
      return 'bg-emerald-50 text-emerald-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function mapActionToneLabel(tone: 'accent' | 'warning' | 'success' | 'neutral') {
  switch (tone) {
    case 'accent':
      return '推进';
    case 'warning':
      return '优先';
    case 'success':
      return '健康';
    default:
      return '观察';
  }
}
