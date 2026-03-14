import Link from 'next/link';
import { BellRing, RefreshCcw, ScrollText } from 'lucide-react';
import NewsletterManager from '@/components/newsletter-manager';
import NewsletterSignup from '@/components/newsletter-signup';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';
import { emailSubscriptionOperations, fortuneOperations, reportMonthlyDigestRunOperations, reportUpgradeJobOperations } from '@/lib/database';
import { getAuthSession } from '@/lib/auth';

export const metadata = {
  title: '邮件更新与订阅管理 | 人生K线',
  description: '管理知识文章、公开案例、产品更新等邮件订阅状态，可查询、恢复或退订。',
};

export default async function UpdatesPage() {
  const session = await getAuthSession();
  const currentUserId = session.user?.id || null;
  const currentEmail = session.user?.email || null;
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
        }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-5">
            <div className="section-label">邮件与留存</div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              公开内容要长期积累，
              <span className="font-serif text-[color:var(--accent-strong)]">订阅也必须可控。</span>
            </h1>
            <p className="text-base leading-8 text-[color:var(--muted)]">
              这里不只管理邮件订阅，也把用户自己的报告升级、月度更新和关键提醒集中到同一个页面，不必只靠邮箱回收信息。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {['查询订阅状态', '恢复内容更新', '一键退订邮件'].map((item) => (
              <div key={item} className="soft-card rounded-[1.5rem] p-5 text-sm leading-7 text-[color:var(--ink)]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">
              <BellRing className="h-3.5 w-3.5" />
              我的更新中心
            </div>
            <h2 className="mt-4 text-2xl font-black text-[color:var(--ink)] md:text-3xl">站内也能看到自己的报告更新，不必只靠邮件回收</h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--muted)]">
              如果你已经登录，这里会直接展示当前订阅状态、报告升级进度和最近一次月度更新。没有登录时，仍可使用下方的邮箱查询与订阅管理。
            </p>

            {session.authenticated && session.user ? (
              <div className="mt-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <StatusMetric
                    label="当前登录邮箱"
                    value={session.user.email || '未绑定'}
                    helper={subscription?.status === 'active' ? '邮件订阅已激活' : '当前未发现激活订阅'}
                    tone="neutral"
                  />
                  <StatusMetric
                    label="活跃升级任务"
                    value={`${activeUpgradeCount}`}
                    helper="后台仍在增强或排队中的报告"
                    tone={activeUpgradeCount > 0 ? 'accent' : 'neutral'}
                  />
                  <StatusMetric
                    label="升级已完成"
                    value={`${completedUpgradeCount}`}
                    helper="已经完成重算增强的报告"
                    tone={completedUpgradeCount > 0 ? 'success' : 'neutral'}
                  />
                  <StatusMetric
                    label="最近月度更新"
                    value={latestDigest?.cycleKey || '暂无'}
                    helper={latestDigest ? mapDigestStatus(latestDigest.status) : '还没有月度更新记录'}
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
                              <div className="text-sm font-semibold text-[color:var(--ink)]">{report.name || '我的报告'}</div>
                              <div className="mt-1 text-xs text-[color:var(--muted)]">
                                {`报告 ${report.reportVersion || 'v1'} · 质量 ${report.analysis?.qualityAudit?.overallScore || '--'} / ${report.analysis?.qualityAudit?.grade || 'B'}`}
                              </div>
                            </div>
                            <Link
                              href={`/result/${report.id}`}
                              className="rounded-full border border-[color:var(--line)] px-3 py-1 text-xs font-semibold text-[color:var(--ink)]"
                            >
                              查看报告
                            </Link>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm leading-7 text-[color:var(--muted)]">
                            <div>{upgradeJob ? `升级任务：${mapUpgradeStatus(upgradeJob.status)}` : '升级任务：当前没有排队中的增强任务'}</div>
                            <div>{reportDigest ? `月度更新：${reportDigest.cycleKey} · ${mapDigestStatus(reportDigest.status)}` : '月度更新：当前还没有生成记录'}</div>
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-[1.4rem] bg-white px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                          当前账号下还没有已保存报告。先去生成一份分析，后续这里会显示升级任务和月度更新。
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
                            <div className="text-sm font-semibold text-[color:var(--ink)]">{item.cycleKey}</div>
                            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapDigestTone(item.status)}`}>
                              {mapDigestStatus(item.status)}
                            </div>
                          </div>
                          <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                            {item.reportId ? `关联报告：${item.reportId}` : '当前未记录关联报告'}
                          </div>
                          <div className="mt-1 text-xs leading-6 text-[color:var(--muted)]">
                            {item.reason || '已记录'}
                          </div>
                        </div>
                      )) : (
                        <div className="rounded-[1.4rem] bg-white px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                          还没有月度更新或提醒记录。等报告进入月度更新周期后，这里会直接显示最近一次发送状态。
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-[1.4rem] bg-slate-50 px-4 py-4 text-sm leading-7 text-[color:var(--muted)]">
                      如果你希望持续收到报告升级完成、月度窗口变化和关键节点提醒，最重要的是保持当前邮箱可用，并让这份报告继续维持订阅状态。
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-[color:var(--line)] bg-white/80 px-5 py-5">
                <div className="text-sm font-semibold text-[color:var(--ink)]">登录后可查看自己的更新中心</div>
                <div className="mt-2 text-sm leading-7 text-[color:var(--muted)]">
                  登录后，这里会自动展示你的报告升级进度、最近月度更新和当前订阅状态。
                </div>
                <div className="mt-4">
                  <Link
                    href="/login?next=%2Fupdates"
                    className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-3 text-sm font-semibold text-white"
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
            source="updates_page"
            title="直接订阅高价值更新"
            description="如果你只是想接收知识文章、案例和产品迭代通知，也可以直接在这里完成订阅。"
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
      <div className="mt-2 text-sm leading-7 opacity-85">{helper}</div>
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

function mapDigestTone(status?: string) {
  if (status === 'sent') return 'bg-emerald-50 text-emerald-700';
  if (status === 'error') return 'bg-rose-50 text-rose-700';
  if (status === 'skipped') return 'bg-amber-50 text-amber-700';
  return 'bg-slate-100 text-slate-700';
}
