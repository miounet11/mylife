import Link from 'next/link';
import { BellRing, BookOpenText, RefreshCcw, ScrollText, Sparkles } from 'lucide-react';
import NewsletterManager from '@/components/newsletter-manager';
import NewsletterSignup from '@/components/newsletter-signup';
import PriorityDisclosure from '@/components/priority-disclosure';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';
import { emailSubscriptionOperations, fortuneOperations, reportMonthlyDigestRunOperations, reportUpgradeJobOperations, userLifecycleEmailRunOperations } from '@/lib/database';
import { describeReportDeliveryStage } from '@/lib/report-quality';
import { getAuthSession } from '@/lib/auth';
import { getCurrentUserId } from '@/lib/user-utils';

export const metadata = {
  title: '邮件更新与订阅管理 | 人生K线',
  description: '管理知识文章、公开案例、产品更新等邮件订阅状态，可查询、恢复或退订。',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    source?: string;
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const source = resolvedSearchParams.source?.trim() || '';
  const analyzeHref = source ? `/analyze?source=${encodeURIComponent(source)}` : '/analyze';
  const session = await getAuthSession();
  const sessionUserId = await getCurrentUserId();
  const currentUserId = session.user?.id || sessionUserId || null;
  const currentEmail = session.user?.email || null;
  const hasSessionContext = !!currentUserId;
  const subscription = currentEmail ? emailSubscriptionOperations.getByEmail(currentEmail) : null;
  const reports = currentUserId ? fortuneOperations.getByUserId(currentUserId).slice(0, 3) : [];
  const upgradeJobs = currentUserId ? reportUpgradeJobOperations.listByUserId(currentUserId, 12) : [];
  const digestRuns = currentUserId || currentEmail
    ? reportMonthlyDigestRunOperations.listByUserOrEmail({
        userId: currentUserId,
        email: currentEmail,
        limit: 6,
      })
    : [];
  const lifecycleRuns = currentUserId || currentEmail
    ? userLifecycleEmailRunOperations.listRecentByUserOrEmail({
        userId: currentUserId,
        email: currentEmail,
        limit: 6,
      })
    : [];
  const latestDigest = digestRuns[0];
  const activeUpgradeCount = upgradeJobs.filter((item) => ['pending', 'running', 'retry'].includes(item.status)).length;
  const completedUpgradeCount = upgradeJobs.filter((item) => item.status === 'completed').length;
  const reportCards = reports.map((report) => ({
    report,
    upgradeJob: upgradeJobs.find((item) => item.reportId === report.id),
    latestDigest: digestRuns.find((item) => item.reportId === report.id),
  }));

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="updates_page_viewed"
        page="/updates"
        meta={{
          authenticated: session.authenticated,
          hasEmail: !!session.user?.email,
          hasSubscription: !!subscription,
          reportCount: reports.length,
          source: source || 'updates_page',
        }}
      />
      <SiteHeader ctaHref={analyzeHref} ctaLabel="开始分析" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <BellRing className="h-3 w-3" />
              邮件与留存
            </div>
            <h1 className="mt-2 text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
              更新中心
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">
              管理订阅状态、报告补全提醒、月度复盘投递与生命周期邮件。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={hasSessionContext ? '#my-updates-center' : '/login?next=%2Fupdates'}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
            >
              {hasSessionContext ? '查看我的更新' : '先登录查看'}
            </Link>
            <Link
              href={analyzeHref}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              开始分析
            </Link>
            <Link
              href="/docs/updates-subscription"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              <BookOpenText className="h-4 w-4" />
              使用方法
            </Link>
          </div>
        </section>

        <section className="mt-6">
          <div id="my-updates-center" className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <BellRing className="h-3 w-3" />
              我的更新中心
            </div>
            <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)] md:text-2xl">
              我的更新
            </h2>

            {hasSessionContext ? (
              <div className="mt-5 space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatusMetric
                    label="当前登录邮箱"
                    value={currentEmail || '未绑定'}
                    helper={subscription?.status === 'active' ? '已激活' : '未激活'}
                    tone="neutral"
                  />
                  <StatusMetric
                    label="活跃内容补全"
                    value={`${activeUpgradeCount}`}
                    helper="进行中"
                    tone={activeUpgradeCount > 0 ? 'accent' : 'neutral'}
                  />
                  <StatusMetric
                    label="补全已完成"
                    value={`${completedUpgradeCount}`}
                    helper="已完成"
                    tone={completedUpgradeCount > 0 ? 'success' : 'neutral'}
                  />
                  <StatusMetric
                    label="最近月度更新"
                    value={latestDigest?.cycleKey || '暂无'}
                    helper={latestDigest ? mapDigestStatus(latestDigest.status) : '暂无'}
                    tone={latestDigest?.status === 'sent' ? 'success' : latestDigest?.status === 'error' ? 'warning' : 'neutral'}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius)] p-4 md:p-5">
                    <div className="flex items-center gap-3">
                      <RefreshCcw className="h-5 w-5 text-[color:var(--accent-strong)]" />
                      <div className="font-semibold text-[color:var(--ink)]">我的报告更新</div>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {reportCards.length > 0 ? reportCards.map(({ report, upgradeJob, latestDigest: reportDigest }) => (
                        <div key={report.id} className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs font-semibold text-[color:var(--ink)]">{report.name || '我的报告'}</div>
                              <div className="mt-1 text-xs text-[color:var(--muted)]">
                                {`可信度 ${report.analysis?.qualityAudit?.overallScore || '--'} · ${describeReportDeliveryStage(report.analysis?.qualityAudit?.deliveryTier).label}`}
                              </div>
                            </div>
                            <Link
                              href={`/result/${report.id}`}
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
                            >
                              查看报告
                            </Link>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm text-[color:var(--muted)]">
                            <div>{upgradeJob ? `内容补全：${mapUpgradeStatus(upgradeJob.status)}` : '内容补全：当前没有排队中的补全任务'}</div>
                            <div>{reportDigest ? `月度更新：${reportDigest.cycleKey} · ${mapDigestStatus(reportDigest.status)}` : '月度更新：当前还没有生成记录'}</div>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-4 text-sm text-[color:var(--muted)]">
                          暂无报告
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius)] p-4 md:p-5">
                    <div className="flex items-center gap-3">
                      <ScrollText className="h-5 w-5 text-[color:var(--warm)]" />
                      <div className="font-semibold text-[color:var(--ink)]">最近提醒记录</div>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {digestRuns.length > 0 ? digestRuns.map((item) => (
                        <div key={item.id} className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold text-[color:var(--ink)]">{item.cycleKey}</div>
                          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapDigestTone(item.status)}`}>
                              {mapDigestStatus(item.status)}
                          </div>
                          </div>
                          <div className="mt-2 text-sm text-[color:var(--muted)]">
                            {item.reportId ? `关联报告：${item.reportId}` : '当前未记录关联报告'}
                          </div>
                          <div className="mt-1 text-sm text-[color:var(--muted)]">
                            {item.reason || '已记录'}
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-4 text-sm text-[color:var(--muted)]">
                          暂无记录
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-4 text-sm text-[color:var(--muted)]">邮箱与订阅</div>
                  </div>
                </div>

                <PriorityDisclosure
                  label="生命周期提醒"
                  title="注册、报告和召回提醒记录"
                  description="不是用户进入更新页的第一任务，默认收起。"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {lifecycleRuns.length > 0 ? lifecycleRuns.map((item) => (
                      <div key={item.id} className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-[color:var(--ink)]">{mapLifecycleStageLabel(item.stageKey)}</div>
                          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapDigestTone(item.status)}`}>
                            {mapLifecycleStatusLabel(item.status)}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-[color:var(--muted)]">
                          {item.reportId ? `关联报告：${item.reportId}` : '未绑定具体报告'}
                        </div>
                        <div className="mt-1 text-sm text-[color:var(--muted)]">
                          {item.reason || '已记录'}
                        </div>
                      </div>
                    )) : (
                      <div className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-4 text-sm text-[color:var(--muted)]">
                        暂无生命周期提醒记录
                      </div>
                    )}
                  </div>
                </PriorityDisclosure>
              </div>
            ) : (
              <div className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] px-5 py-5">
                <div className="text-sm font-semibold text-[color:var(--ink)]">登录后可查看自己的更新中心</div>
                <div className="mt-4">
                  <Link
                    href="/login?next=%2Fupdates"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
                  >
                    前往登录
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-8">
          <PriorityDisclosure
            label="邮箱与订阅"
            title="订阅、恢复或退订邮件"
            description="放在更新状态之后，避免抢占已登录用户的更新中心。"
          >
            <div className="space-y-5">
              <NewsletterManager />
              <NewsletterSignup
                source={source || 'updates_page'}
                title="订阅更新"
                description="把知识、案例和产品更新接回邮箱，方便你在报告生成后继续收到后续内容。"
              />
            </div>
          </PriorityDisclosure>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function StatusMetric({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: 'neutral' | 'accent' | 'success' | 'warning';
}) {
  return (
    <div className={`rounded-[var(--radius)] px-4 py-5 ${mapMetricTone(tone)}`}>
      <div className="text-xs tracking-[0.18em]">{label}</div>
      <div className="mt-2 break-all text-2xl font-black">{value}</div>
      <div className="mt-2 text-xs leading-6 opacity-85">{helper}</div>
    </div>
  );
}

function mapMetricTone(tone: 'neutral' | 'accent' | 'success' | 'warning') {
  if (tone === 'accent') return 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]';
  if (tone === 'success') return 'bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]';
  if (tone === 'warning') return 'bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]';
  return 'bg-[color:var(--paper)] text-[color:var(--ink)]';
}

function mapUpgradeStatus(status?: string) {
  if (status === 'running') return '补全进行中';
  if (status === 'pending' || status === 'retry') return '排队等待补全';
  if (status === 'completed') return '补全已完成';
  if (status === 'failed') return '补全已暂停';
  if (status === 'cancelled') return '任务已取消';
  return '暂无任务';
}

function mapDigestStatus(status?: string) {
  if (status === 'sent') return '已发送';
  if (status === 'error') return '发送失败';
  if (status === 'skipped') return '本轮跳过';
  return '暂无记录';
}

function mapLifecycleStatusLabel(status?: string) {
  if (status === 'sent') return '已发送';
  if (status === 'error') return '待重试';
  if (status === 'skipped') return '已跳过';
  return '未知';
}

function mapLifecycleStageLabel(stageKey?: string | null) {
  if (!stageKey) return '生命周期提醒';
  if (stageKey.startsWith('signup_day1_no_report')) return '注册后首个价值提醒';
  if (stageKey.startsWith('report_day2_no_followup')) return '报告后继续行动提醒';
  if (stageKey.startsWith('inactive_day7_reactivation')) return '7 天未活跃召回';
  return stageKey;
}

function mapDigestTone(status?: string) {
  if (status === 'sent') return 'bg-[rgba(47,125,82,0.08)] text-[color:var(--data-up)]';
  if (status === 'error') return 'bg-[color:var(--alert-soft)] text-[color:var(--alert)]';
  if (status === 'skipped') return 'bg-[color:var(--signal-soft)] text-[color:var(--signal-strong)]';
  return 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)]';
}
