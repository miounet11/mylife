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
    journeyFunnel,
    pageViewBreakdown,
    ctaBreakdown,
    analyzeOptionBreakdown,
    reasoningModeBreakdown,
    chatActionBreakdown,
    modelHealthBreakdown = [],
  } = overview;
  const validatedTotal = totals.validation_accurate + totals.validation_drift;
  const validationAccuracyRate = validatedTotal > 0 ? Math.round((totals.validation_accurate / validatedTotal) * 100) : 0;
  const driftRate = validatedTotal > 0 ? Math.round((totals.validation_drift / validatedTotal) * 100) : 0;
  const operatingInsight = buildAdminOperatingInsight({
    totals,
    pendingValidationBuckets,
    driftReasonBreakdown,
    reportVersionBreakdown,
    journeyFunnel,
    reasoningModeBreakdown,
    chatActionBreakdown,
  });
  const actionItems = buildAdminActionItems({
    totals,
    pendingValidationBuckets,
    driftReasonBreakdown,
    reportVersionBreakdown,
    journeyFunnel,
    reasoningModeBreakdown,
    chatActionBreakdown,
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
            <div className="text-sm font-semibold text-[color:var(--muted)]">核心漏斗</div>
            <div className="mt-5 grid gap-3">
              {journeyFunnel.length > 0 ? journeyFunnel.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有漏斗数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">近 7 日关键行为</div>
            <div className="mt-5 grid gap-3">
              {eventsLast7d.length > 0 ? eventsLast7d.map((item) => (
                <div key={item.eventName} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapAnalyticsEventLabel(item.eventName)}</div>
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
            <div className="text-sm font-semibold text-[color:var(--muted)]">页面访问结构</div>
            <div className="mt-5 grid gap-3">
              {pageViewBreakdown.length > 0 ? pageViewBreakdown.map((item) => (
                <div key={item.page} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapPageLabel(item.page)}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有页面访问数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">分析入口偏好</div>
            <div className="mt-5 grid gap-3">
              {analyzeOptionBreakdown.length > 0 ? analyzeOptionBreakdown.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有分析入口偏好数据。
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
            <div className="text-sm font-semibold text-[color:var(--muted)]">推理层覆盖</div>
            <div className="mt-5 grid gap-3">
              {reasoningModeBreakdown.length > 0 ? reasoningModeBreakdown.map((item) => (
                <div key={item.mode} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapReasoningModeLabel(item.mode)}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有推理层覆盖数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">模型健康与熔断</div>
            <div className="mt-5 grid gap-3">
              {modelHealthBreakdown.length > 0 ? modelHealthBreakdown.map((item) => (
                <div key={item.model} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.model}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        {Object.keys(item.scopes || {}).length > 0
                          ? Object.entries(item.scopes).map(([scope, count]) => `${scope} ${count}`).join(' / ')
                          : '当前无请求范围数据'}
                      </div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapModelStateTone(item.currentState)}`}>
                      {mapModelStateLabel(item.currentState)}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>请求 {item.attempts}</div>
                    <div>成功率 {item.successRate}%</div>
                    <div>平均延迟 {item.avgLatencyMs}ms</div>
                    <div>{item.reopenAt ? `重试时间 ${item.reopenAt}` : '当前可正常调度'}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有模型健康数据，等模型调用累积后这里会显示成功率、延迟和熔断状态。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">聊天动作结构</div>
            <div className="mt-5 grid gap-3">
              {chatActionBreakdown.length > 0 ? chatActionBreakdown.map((item) => (
                <div key={item.action} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有聊天动作结构数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">结果页 CTA 表现</div>
            <div className="mt-5 grid gap-3">
              {ctaBreakdown.length > 0 ? ctaBreakdown.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有结果页 CTA 数据。
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
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapAnalyticsEventLabel(item.eventName)}</div>
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

function mapAnalyticsEventLabel(eventName: string) {
  const labels: Record<string, string> = {
    home_page_viewed: '首页访问',
    analyze_page_viewed: '分析页访问',
    chat_page_viewed: '聊天页访问',
    events_page_viewed: '事件页访问',
    knowledge_page_viewed: '知识库访问',
    knowledge_article_viewed: '知识文章访问',
    cases_page_viewed: '案例库访问',
    case_article_viewed: '案例文章访问',
    insights_page_viewed: '洞察中心访问',
    insight_article_viewed: '洞察文章访问',
    content_card_clicked: '内容卡片点击',
    content_quick_analyze_started: '内容页发起测算',
    analyze_submitted: '提交测算',
    report_generated: '生成报告',
    report_viewed: '打开结果页',
    report_upgrade_requested: '升级重算',
    result_cta_clicked: '结果页 CTA',
    auth_code_requested: '请求验证码',
    auth_verified: '完成邮箱验证',
    newsletter_subscribed: '邮件订阅',
    chat_message_sent: '聊天动作',
    chat_context_loaded: '加载聊天上下文',
    chat_followup_clicked: '点击追问',
    chat_event_saved: '聊天转事件',
    event_created: '创建事件',
    report_event_saved_from_result: '结果页转事件',
    event_feedback_recorded: '记录验证反馈',
    event_updated: '更新事件',
    event_deleted: '删除事件',
    llm_model_attempt: '模型请求',
    llm_model_circuit_changed: '模型熔断状态变化',
  };
  return labels[eventName] || eventName;
}

function mapPageLabel(page: string) {
  if (page === '/') return '首页';
  if (page === '/analyze') return '分析页';
  if (page === '/chat') return '聊天页';
  if (page === '/events') return '事件页';
  if (page === '/knowledge') return '知识库';
  if (page === '/cases') return '案例库';
  if (page === '/insights') return '洞察中心';
  if (page.startsWith('/knowledge/')) return '知识文章';
  if (page.startsWith('/cases/')) return '案例文章';
  if (page.startsWith('/insights/')) return '洞察文章';
  if (page.startsWith('/result/')) return '结果页';
  return page;
}

function mapReasoningModeLabel(mode: string) {
  if (mode === 'parallel-agents') return '并发 Agent';
  if (mode === 'deterministic-expert') return 'Deterministic 专家层';
  if (mode === 'engine') return '基础引擎';
  return mode;
}

function mapModelStateLabel(state: string) {
  if (state === 'open') return '熔断中';
  if (state === 'half-open') return '半开探测';
  if (state === 'degraded') return '降级排序';
  return '正常';
}

function mapModelStateTone(state: string) {
  if (state === 'open') return 'bg-rose-50 text-rose-700';
  if (state === 'half-open') return 'bg-amber-50 text-amber-700';
  if (state === 'degraded') return 'bg-sky-50 text-sky-700';
  return 'bg-emerald-50 text-emerald-700';
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
