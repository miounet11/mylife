import Link from 'next/link';
import { BellRing, RefreshCcw, ScrollText, Sparkles } from 'lucide-react';
import NewsletterManager from '@/components/newsletter-manager';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicSurfaceHero from '@/components/public-surface-hero';
import { emailSubscriptionOperations, fortuneOperations, reportMonthlyDigestRunOperations, reportUpgradeJobOperations, userLifecycleEmailRunOperations } from '@/lib/database';
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

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <PublicSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              邮件与留存
            </>
          )}
          title="更新中心"
          description="这里负责查看订阅、报告升级和后续提醒，让结果不是一次性页面，而是可以持续回访。"
          hint="如果你还没有生成过报告，先完成一次分析，再回来开启更有上下文的更新。"
          actions={[
            <Link key="my-updates" href={hasSessionContext ? '#my-updates-center' : '/login?next=%2Fupdates'} className="action-primary action-main">
              {hasSessionContext ? '查看我的更新' : '先登录查看'}
            </Link>,
            <Link key="analyze" href={analyzeHref} className="action-secondary">开始分析</Link>,
          ]}
          highlights={[
            { body: '查询订阅状态' },
            { body: '恢复内容更新' },
            { body: '一键退订邮件' },
          ]}
          highlightsColumns="md:grid-cols-3"
        />

        <section className="mt-10">
          <div id="my-updates-center" className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">
              <BellRing className="h-3.5 w-3.5" />
              我的更新中心
            </div>
            <h2 className="mt-4 text-2xl font-black text-[color:var(--ink)] md:text-3xl">我的更新</h2>

            {hasSessionContext ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatusMetric
                    label="当前登录邮箱"
                    value={currentEmail || '未绑定'}
                    helper={subscription?.status === 'active' ? '已激活' : '未激活'}
                    tone="neutral"
                  />
                  <StatusMetric
                    label="活跃升级任务"
                    value={`${activeUpgradeCount}`}
                    helper="进行中"
                    tone={activeUpgradeCount > 0 ? 'accent' : 'neutral'}
                  />
                  <StatusMetric
                    label="升级已完成"
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
                  <div className="soft-card rounded-[1.75rem] p-6">
                    <div className="flex items-center gap-3">
                      <RefreshCcw className="h-5 w-5 text-[color:var(--accent-strong)]" />
                      <div className="font-semibold text-[color:var(--ink)]">我的报告更新</div>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {reportCards.length > 0 ? reportCards.map(({ report, upgradeJob, latestDigest: reportDigest }) => (
                        <div key={report.id} className="rounded-[1.4rem] bg-white px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs font-semibold text-[color:var(--ink)]">{report.name || '我的报告'}</div>
                              <div className="mt-1 text-xs text-[color:var(--muted)]">
                                {`报告 ${report.reportVersion || 'v1'} · 质量 ${report.analysis?.qualityAudit?.overallScore || '--'} / ${report.analysis?.qualityAudit?.grade || 'B'}`}
                              </div>
                            </div>
                            <Link
                              href={`/result/${report.id}`}
                              className="action-secondary"
                            >
                              查看报告
                            </Link>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm text-[color:var(--muted)]">
                            <div>{upgradeJob ? `升级任务：${mapUpgradeStatus(upgradeJob.status)}` : '升级任务：当前没有排队中的增强任务'}</div>
                            <div>{reportDigest ? `月度更新：${reportDigest.cycleKey} · ${mapDigestStatus(reportDigest.status)}` : '月度更新：当前还没有生成记录'}</div>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-[1.4rem] bg-white px-4 py-4 text-sm text-[color:var(--muted)]">
                          暂无报告
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="soft-card rounded-[1.75rem] p-6">
                    <div className="flex items-center gap-3">
                      <ScrollText className="h-5 w-5 text-[color:var(--warm)]" />
                      <div className="font-semibold text-[color:var(--ink)]">最近提醒记录</div>
                    </div>
                    <div className="mt-4 grid gap-3">
                      {digestRuns.length > 0 ? digestRuns.map((item) => (
                        <div key={item.id} className="rounded-[1.4rem] bg-white px-4 py-4">
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
                        <div className="rounded-[1.4rem] bg-white px-4 py-4 text-sm text-[color:var(--muted)]">
                          暂无记录
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-[1.4rem] bg-slate-50 px-4 py-4 text-sm text-[color:var(--muted)]">邮箱与订阅</div>
                  </div>
                </div>

                <div className="soft-card rounded-[1.75rem] p-6">
                  <div className="flex items-center gap-3">
                    <BellRing className="h-5 w-5 text-[color:var(--accent-strong)]" />
                    <div className="font-semibold text-[color:var(--ink)]">生命周期提醒</div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {lifecycleRuns.length > 0 ? lifecycleRuns.map((item) => (
                      <div key={item.id} className="rounded-[1.4rem] bg-white px-4 py-4">
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
                      <div className="rounded-[1.4rem] bg-white px-4 py-4 text-sm text-[color:var(--muted)]">
                        暂无生命周期提醒记录
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-white/80 px-5 py-5">
                <div className="text-sm font-semibold text-[color:var(--ink)]">登录后可查看自己的更新中心</div>
                <div className="mt-4">
                  <Link
                    href="/login?next=%2Fupdates"
                    className="action-primary"
                  >
                    前往登录
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <NewsletterManager />
        </section>

        <section className="mt-12">
          <NewsletterSignup
            source={source || 'updates_page'}
            title="订阅更新"
            description="把知识、案例和产品更新接回邮箱，方便你在报告生成后继续收到后续内容。"
          />
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
    <div className={`rounded-[1.4rem] px-4 py-5 ${mapMetricTone(tone)}`}>
      <div className="text-xs tracking-[0.18em]">{label}</div>
      <div className="mt-2 break-all text-2xl font-black">{value}</div>
      <div className="mt-2 text-xs leading-6 opacity-85">{helper}</div>
    </div>
  );
}

function mapMetricTone(tone: 'neutral' | 'accent' | 'success' | 'warning') {
  if (tone === 'accent') return 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]';
  if (tone === 'success') return 'bg-emerald-50 text-emerald-700';
  if (tone === 'warning') return 'bg-amber-50 text-amber-700';
  return 'bg-white text-[color:var(--ink)]';
}

function mapUpgradeStatus(status?: string) {
  if (status === 'running') return '增强进行中';
  if (status === 'pending' || status === 'retry') return '排队等待增强';
  if (status === 'completed') return '增强已完成';
  if (status === 'failed') return '增强已暂停';
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
  if (status === 'sent') return 'bg-emerald-50 text-emerald-700';
  if (status === 'error') return 'bg-rose-50 text-rose-700';
  if (status === 'skipped') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}
