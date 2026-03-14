import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { buildAdminActionItems, buildAdminOperatingInsight } from '@/lib/admin-analytics-insights';
import { requireAdminUser } from '@/lib/auth';
import { analyticsOperations } from '@/lib/database';
import { getMailDebugConfig, verifyMailConnection } from '@/mail';

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
    llmFailureHotspots = [],
    routeHealthBreakdown = [],
    requestFailureHotspots = [],
    emailRetryQueue,
    recentEmailRetryJobs = [],
    premiumServiceStatus,
    recentPremiumRequests = [],
    funnelDiagnostics = [],
    systemHealth,
  } = overview;
  const emailDeliveryRows = analyticsOperations.rawQuery(`
    SELECT event_name, page, meta, created_at
    FROM analytics_events
    WHERE event_name IN ('email_delivery_succeeded', 'email_delivery_failed')
      AND datetime(created_at) >= datetime('now', '-7 days')
    ORDER BY datetime(created_at) DESC
    LIMIT 100
  `) as Array<{
    event_name: string;
    page?: string | null;
    meta?: string | null;
    created_at?: string | null;
  }>;
  const emailHealth = await Promise.race([
    verifyMailConnection()
      .then((result) => ({
        status: 'ok' as const,
        config: result.config,
      }))
      .catch((error) => ({
        status: 'error' as const,
        config: getMailDebugConfig(),
        error: error instanceof Error ? error.message : 'unknown',
      })),
    new Promise<{
      status: 'timeout';
      config: ReturnType<typeof getMailDebugConfig>;
      error: string;
    }>((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'timeout',
          config: getMailDebugConfig(),
          error: '邮件健康探测超时',
        });
      }, 5000);
    }),
  ]);
  const emailDeliverySummary = emailDeliveryRows.reduce<{
    success: number;
    failed: number;
    channels: Record<string, { channel: string; success: number; failed: number }>;
  }>((accumulator, row) => {
    const meta = parseMeta(row.meta);
    const channel = typeof meta.channel === 'string' ? meta.channel : 'unknown';
    if (!accumulator.channels[channel]) {
      accumulator.channels[channel] = {
        channel,
        success: 0,
        failed: 0,
      };
    }

    if (row.event_name === 'email_delivery_succeeded') {
      accumulator.success += 1;
      accumulator.channels[channel].success += 1;
    } else {
      accumulator.failed += 1;
      accumulator.channels[channel].failed += 1;
    }

    return accumulator;
  }, {
    success: 0,
    failed: 0,
    channels: {},
  });
  const emailChannelBreakdown = Object.values(emailDeliverySummary.channels)
    .sort((left, right) => right.failed + right.success - (left.failed + left.success));
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
          <div className="glass-panel rounded-[2rem] p-6 xl:col-span-2">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-[color:var(--muted)]">系统状态总览</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(systemHealth?.severity || 'neutral')}`}>
                    {mapHealthLabel(systemHealth?.severity || 'neutral')}
                  </div>
                  <div className="text-xs text-[color:var(--muted)]">
                    {systemHealth?.updatedAt ? `最近埋点：${systemHealth.updatedAt}` : '最近埋点时间暂不可用'}
                  </div>
                </div>
                <div className="mt-4 text-2xl font-black text-[color:var(--ink)]">{systemHealth?.title || '等待更多监控数据'}</div>
                <div className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                  {systemHealth?.summary || '当埋点、模型请求和反馈数据继续积累后，这里会自动给出更明确的系统判断。'}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:w-[28rem]">
                {(systemHealth?.cards || []).map((item) => (
                  <div key={item.key} className={`rounded-[1.4rem] px-4 py-4 ${mapHealthCardTone(item.tone)}`}>
                    <div className="text-xs tracking-[0.18em]">{item.label}</div>
                    <div className="mt-2 text-3xl font-black">{item.value}</div>
                    <div className="mt-2 text-xs leading-6 opacity-80">{item.helper}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] bg-rose-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">当前主要卡点</div>
                <div className="mt-3 grid gap-3">
                  {systemHealth?.blockers?.length ? systemHealth.blockers.map((item) => (
                    <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-7 text-rose-700">
                      {item}
                    </div>
                  )) : (
                    <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">
                      当前没有明显硬阻塞。
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-emerald-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">健康信号</div>
                <div className="mt-3 grid gap-3">
                  {systemHealth?.healthySignals?.length ? systemHealth.healthySignals.map((item) => (
                    <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-7 text-emerald-700">
                      {item}
                    </div>
                  )) : (
                    <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm leading-7 text-[color:var(--muted)]">
                      当前还没有足够的正向稳定性样本。
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

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
                    <div>
                      {item.currentState === 'open' || item.currentState === 'half-open'
                        ? `已持续 ${item.openDurationMinutes || 0} 分钟`
                        : item.reopenAt
                          ? `重试时间 ${item.reopenAt}`
                          : '当前可正常调度'}
                    </div>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {item.reopenOverdue
                      ? '已超过设定重试时间但仍未恢复，优先排查供应商和网络链路。'
                      : item.reopenAt
                        ? `下一次恢复探测时间：${item.reopenAt}`
                        : item.lastStateChangedAt
                          ? `最近状态变化：${item.lastStateChangedAt}`
                          : '当前没有额外的熔断状态信息。'}
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
            <div className="text-sm font-semibold text-[color:var(--muted)]">当前故障热点</div>
            <div className="mt-5 grid gap-3">
              {llmFailureHotspots.length > 0 ? llmFailureHotspots.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">{`${item.model} · ${item.scope}`}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-rose-700">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{`${item.avgLatencyMs}ms`}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {item.lastSeenAt ? `最近一次：${item.lastSeenAt}` : '最近一次时间未记录'}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前没有明显的模型失败热点。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">接口健康</div>
            <div className="mt-5 grid gap-3">
              {routeHealthBreakdown.length > 0 ? routeHealthBreakdown.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.successRate < 85 ? 'warning' : 'healthy')}`}>
                      {`${item.successRate}%`}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>{`成功 ${item.success}`}</div>
                    <div>{`失败 ${item.failed}`}</div>
                    <div>{`降级 ${item.fallbackCount}`}</div>
                    <div>{`均耗时 ${item.avgDurationMs}ms`}</div>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {item.lastSeenAt ? `最近一次：${item.lastSeenAt}，最高耗时 ${item.maxDurationMs}ms` : `最高耗时 ${item.maxDurationMs}ms`}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有接口健康样本。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">业务失败热点</div>
            <div className="mt-5 grid gap-3">
              {requestFailureHotspots.length > 0 ? requestFailureHotspots.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">{`${item.route} · ${item.action}`}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-rose-700">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.lastSeenAt || '时间未记录'}</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有接口失败热点记录。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">邮件系统状态</div>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--ink)]">SMTP 健康探测</div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">
                      {`${emailHealth.config.host}:${emailHealth.config.port} · 发件 ${emailHealth.config.from} · 认证 ${emailHealth.config.authUser}`}
                    </div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    emailHealth.status === 'ok'
                      ? 'bg-emerald-50 text-emerald-700'
                      : emailHealth.status === 'timeout'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                  }`}>
                    {emailHealth.status === 'ok' ? '连接正常' : emailHealth.status === 'timeout' ? '探测超时' : '连接失败'}
                  </div>
                </div>
                <div className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                  {emailHealth.status === 'ok'
                    ? '当前 SMTP 认证和连接均正常，验证码、订阅确认和升级提醒可以继续投递。'
                    : emailHealth.error || '邮件探测失败'}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] bg-emerald-50 px-4 py-5 text-emerald-700">
                  <div className="text-xs tracking-[0.18em]">近 7 日发送成功</div>
                  <div className="mt-2 text-3xl font-black">{emailDeliverySummary.success}</div>
                </div>
                <div className="rounded-[1.4rem] bg-rose-50 px-4 py-5 text-rose-700">
                  <div className="text-xs tracking-[0.18em]">近 7 日发送失败</div>
                  <div className="mt-2 text-3xl font-black">{emailDeliverySummary.failed}</div>
                </div>
              </div>

              <div className="grid gap-3">
                {emailChannelBreakdown.length > 0 ? emailChannelBreakdown.map((item) => (
                  <div key={item.channel} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{mapEmailChannelLabel(item.channel)}</div>
                      <div className="text-xs text-[color:var(--muted)]">{`成功 ${item.success} / 失败 ${item.failed}`}</div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                    近 7 日还没有邮件投递记录。
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                {emailDeliveryRows.filter((item) => item.event_name === 'email_delivery_failed').slice(0, 5).map((item, index) => {
                  const meta = parseMeta(item.meta);
                  return (
                    <div key={`${item.created_at || 'unknown'}-${index}`} className="rounded-[1.4rem] bg-rose-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-rose-700">{mapEmailChannelLabel(typeof meta.channel === 'string' ? meta.channel : 'unknown')}</div>
                        <div className="text-xs text-rose-600">{item.created_at || '-'}</div>
                      </div>
                      <div className="mt-2 text-sm leading-7 text-rose-700">{typeof meta.reason === 'string' ? meta.reason : '未记录失败原因'}</div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-5">
                <QueueMetric label="待重试" value={emailRetryQueue?.pending || 0} tone="text-amber-700 bg-amber-50" />
                <QueueMetric label="执行中" value={emailRetryQueue?.running || 0} tone="text-sky-700 bg-sky-50" />
                <QueueMetric label="已送达" value={emailRetryQueue?.sent || 0} tone="text-emerald-700 bg-emerald-50" />
                <QueueMetric label="最终失败" value={emailRetryQueue?.failed || 0} tone="text-rose-700 bg-rose-50" />
                <QueueMetric label="已取消" value={emailRetryQueue?.cancelled || 0} tone="text-slate-700 bg-slate-50" />
              </div>

              <div className="grid gap-3">
                {recentEmailRetryJobs.length > 0 ? recentEmailRetryJobs.map((item) => (
                  <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{mapEmailChannelLabel(item.kind)}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">{item.id}</div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapEmailRetryStatusTone(item.status)}`}>
                        {mapEmailRetryStatusLabel(item.status)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {`尝试 ${item.attempts || 0} / ${item.maxAttempts || 0}`}
                      {item.lastError ? ` · ${item.lastError}` : ''}
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                    当前还没有邮件重试队列记录。
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">用户转化卡点</div>
            <div className="mt-5 grid gap-3">
              {funnelDiagnostics.length > 0 ? funnelDiagnostics.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.severity || 'neutral')}`}>
                      {`${item.conversionRate}%`}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs text-[color:var(--muted)]">
                    <div>{`前一步 ${item.from}`}</div>
                    <div>{`到达 ${item.to}`}</div>
                    <div>{`流失 ${item.dropOff}`}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                  当前还没有足够的用户转化数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">专项服务与用户跟进</div>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                <QueueMetric label="新提交" value={premiumServiceStatus?.new || 0} tone="text-amber-700 bg-amber-50" />
                <QueueMetric label="已跟进" value={premiumServiceStatus?.contacted || 0} tone="text-sky-700 bg-sky-50" />
                <QueueMetric label="处理中" value={premiumServiceStatus?.in_progress || 0} tone="text-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]" />
                <QueueMetric label="已交付" value={premiumServiceStatus?.delivered || 0} tone="text-emerald-700 bg-emerald-50" />
                <QueueMetric label="已结束" value={premiumServiceStatus?.closed || 0} tone="text-slate-700 bg-slate-50" />
                <QueueMetric label="已取消" value={premiumServiceStatus?.cancelled || 0} tone="text-rose-700 bg-rose-50" />
              </div>

              <div className="grid gap-3">
                {recentPremiumRequests.length > 0 ? recentPremiumRequests.map((item) => (
                  <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{mapPremiumServiceLabel(item.serviceKey)}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">{item.contactValue || '未留联系方式'}</div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapPremiumStatusTone(item.status)}`}>
                        {mapPremiumStatusLabel(item.status)}
                      </div>
                    </div>
                    <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                      {`${item.intake?.question || '未填写问题'}`}
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                    当前还没有专项需求记录。
                  </div>
                )}
              </div>
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

function mapPremiumServiceLabel(serviceKey: string) {
  if (serviceKey === 'event-simulation') return '事件推演';
  if (serviceKey === 'event-verdict') return '断事专项';
  if (serviceKey === 'event-review') return '事件剖析';
  if (serviceKey === 'meihua-enhancement') return '摇卦 / 梅花易';
  return serviceKey;
}

function mapAnalyticsEventLabel(eventName: string) {
  const labels: Record<string, string> = {
    home_page_viewed: '首页访问',
    analyze_page_viewed: '分析页访问',
    chat_page_viewed: '聊天页访问',
    events_page_viewed: '事件页访问',
    profile_page_viewed: '档案页访问',
    history_page_viewed: '历史页访问',
    updates_page_viewed: '更新页访问',
    knowledge_page_viewed: '知识库访问',
    knowledge_article_viewed: '知识文章访问',
    cases_page_viewed: '案例库访问',
    case_article_viewed: '案例文章访问',
    insights_page_viewed: '洞察中心访问',
    insight_article_viewed: '洞察文章访问',
    content_card_clicked: '内容卡片点击',
    content_quick_analyze_started: '内容页发起测算',
    analyze_submitted: '提交测算',
    analyze_completed: '测算完成',
    analyze_failed: '测算失败',
    report_generated: '生成报告',
    report_feedback_synced: '反馈回写报告',
    report_monthly_digest_sent: '月度更新发送',
    report_viewed: '打开结果页',
    report_upgrade_requested: '升级重算',
    result_cta_clicked: '结果页 CTA',
    auth_code_requested: '请求验证码',
    auth_verified: '完成邮箱验证',
    newsletter_subscribed: '邮件订阅',
    email_delivery_succeeded: '邮件发送成功',
    email_delivery_failed: '邮件发送失败',
    email_retry_enqueued: '邮件重试入队',
    email_retry_processed: '邮件重试处理',
    chat_message_sent: '聊天动作',
    chat_completed: '聊天接口完成',
    chat_failed: '聊天接口失败',
    chat_context_loaded: '加载聊天上下文',
    chat_followup_clicked: '点击追问',
    chat_event_saved: '聊天转事件',
    premium_service_requested: '专项需求提交',
    premium_service_status_updated: '专项需求跟进',
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
  if (page === '/profile') return '档案页';
  if (page === '/updates') return '更新页';
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

function mapHealthLabel(severity: string) {
  if (severity === 'critical') return '高风险';
  if (severity === 'warning') return '需处理';
  if (severity === 'healthy') return '健康';
  return '观察中';
}

function mapHealthTone(severity: string) {
  if (severity === 'critical') return 'bg-rose-50 text-rose-700';
  if (severity === 'warning') return 'bg-amber-50 text-amber-700';
  if (severity === 'healthy') return 'bg-emerald-50 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
}

function mapHealthCardTone(severity: string) {
  if (severity === 'critical') return 'bg-rose-50 text-rose-700';
  if (severity === 'warning') return 'bg-amber-50 text-amber-700';
  if (severity === 'healthy') return 'bg-emerald-50 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
}

function mapEmailRetryStatusLabel(status: string) {
  if (status === 'pending') return '待重试';
  if (status === 'running') return '执行中';
  if (status === 'sent') return '已送达';
  if (status === 'cancelled') return '已取消';
  return '最终失败';
}

function mapEmailRetryStatusTone(status: string) {
  if (status === 'pending') return 'bg-amber-50 text-amber-700';
  if (status === 'running') return 'bg-sky-50 text-sky-700';
  if (status === 'sent') return 'bg-emerald-50 text-emerald-700';
  if (status === 'cancelled') return 'bg-slate-100 text-slate-700';
  return 'bg-rose-50 text-rose-700';
}

function mapPremiumStatusLabel(status: string) {
  if (status === 'contacted') return '已跟进';
  if (status === 'in_progress') return '处理中';
  if (status === 'delivered') return '已交付';
  if (status === 'closed') return '已结束';
  if (status === 'cancelled') return '已取消';
  return '新提交';
}

function mapPremiumStatusTone(status: string) {
  if (status === 'contacted') return 'bg-sky-50 text-sky-700';
  if (status === 'in_progress') return 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]';
  if (status === 'delivered') return 'bg-emerald-50 text-emerald-700';
  if (status === 'closed') return 'bg-slate-100 text-slate-700';
  if (status === 'cancelled') return 'bg-rose-50 text-rose-700';
  return 'bg-amber-50 text-amber-700';
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

function parseMeta(meta: string | null | undefined) {
  if (!meta) {
    return {};
  }

  try {
    return JSON.parse(meta) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function mapEmailChannelLabel(channel: string) {
  if (channel === 'auth_code') return '登录验证码';
  if (channel === 'newsletter_confirmation') return '订阅确认';
  if (channel === 'premium_service_request_receipt') return '专项提交回执';
  if (channel === 'premium_service_admin_alert') return '专项后台提醒';
  if (channel === 'premium_service_status_update') return '专项状态更新';
  if (channel === 'report_upgrade_ready') return '报告升级提醒';
  if (channel === 'monthly_digest') return '月度更新';
  return channel;
}
