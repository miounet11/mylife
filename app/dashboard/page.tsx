export const fetchCache = 'force-no-store';
export const revalidate = 0;

import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  BellRing,
  BookOpen,
  Calendar,
  Compass,
  FileBarChart2,
  History,
  LayoutDashboard,
  MessageSquareText,
  ServerCog,
  Sparkles,
  Wrench,
} from 'lucide-react';

import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';

import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Inline } from '@/components/ui/inline';
import { Lede } from '@/components/ui/lede';
import { Stack } from '@/components/ui/stack';
import { Stat } from '@/components/ui/stat';
import { Tag } from '@/components/ui/tag';

import { getAuthSession } from '@/lib/auth';
import { getCurrentUserId } from '@/lib/user-utils';
import { fortuneOperations, eventOperations, toolSessionOperations } from '@/lib/database';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';
import { productActivationPath, productPurposePaths, productTrustSignals } from '@/lib/product-experience';

const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'grok-420-fast';
const FALLBACK_CHAIN = process.env.MODEL_FALLBACK_CHAIN || 'auto,gpt-5.2';
const REPORT_VERSION = 'v3';

const iconMap = {
  birth: Calendar,
  overview: Compass,
  deepen: Sparkles,
  tool: Wrench,
  validate: BellRing,
  learn: BookOpen,
  system: ServerCog,
  visual: FileBarChart2,
} as const;

function formatRelative(iso?: string | Date | null): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  return d.toISOString().slice(0, 10);
}

export const metadata = {
  title: '我的工作台 | 人生K线',
  description: '统一查看你的报告、事件、订阅、模型与系统状态。',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DashboardPage() {
  const session = await getAuthSession();
  const sessionUserId = await getCurrentUserId();
  const userId = session.user?.id || sessionUserId || null;
  const authenticated = !!session.authenticated && !!session.user?.id;

  const reports = userId ? fortuneOperations.getByUserId(userId) : [];
  const recentReports = reports.slice(0, 4);
  const totalReports = reports.length;
  const events = userId ? eventOperations.getByUserId(userId) : [];
  const totalEvents = events.length;
  const validatedEvents = events.filter((e: any) => e.userFeedback?.wasAccurate === true).length;
  const driftEvents = events.filter((e: any) => e.userFeedback?.wasAccurate === false).length;
  const pendingEvents = events.filter((e: any) => e.userFeedback?.wasAccurate === undefined).length;

  const toolSessions = userId ? toolSessionOperations.listByUser(userId, 5) : [];
  const totalTools = toolSessions.length;

  const updatesSummary = userId
    ? buildUpdatesSummary({ userId, email: session.user?.email })
    : null;
  const subscriptionActive = updatesSummary?.subscription?.status === 'active';
  const latestDigest = updatesSummary?.latestDigest;

  const worldYiStats = getWorldYiPublicStats();

  const latestReport = reports[0];
  const latestReportHref = latestReport ? `/result/${latestReport.id}` : '/analyze';

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="dashboard_page_viewed" page="/dashboard" meta={{ surfaceKey: 'dashboard' }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="新建判断" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        {/* HERO */}
        <section className="mb-6 md:mb-8">
          <Inline justify="between" align="end" wrap className="gap-4">
            <Stack gap={3}>
              <Eyebrow icon={<LayoutDashboard className="h-3 w-3" />}>
                我的工作台 · DASHBOARD
              </Eyebrow>
              <h1 className="text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
                {authenticated ? '继续推进，' : '欢迎，先生成第一份报告'}
                <span className="text-[color:var(--brand-strong)]">
                  {authenticated ? `${session.user?.email || ''}` : ''}
                </span>
              </h1>
              <Lede>
                这里把你的报告、事件、工具历史、订阅状态、模型链路和系统信号收在一个面板，无需跨页跳转。
              </Lede>
            </Stack>
            <Inline gap={2} wrap justify="end">
              <Link
                href="/analyze"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
              >
                新建判断
                <ArrowRight className="h-4 w-4" />
              </Link>
              {latestReport ? (
                <Link
                  href={latestReportHref}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                >
                  打开最新报告
                </Link>
              ) : null}
              <Link
                href="/chat"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
              >
                <MessageSquareText className="h-4 w-4" />
                结构追问
              </Link>
            </Inline>
          </Inline>
        </section>

        {/* 个人状态 4-Stat */}
        <Card variant="default" padding="lg" className="mb-6 bg-[color:var(--bg-elevated)]">
          <Eyebrow tone="muted" className="mb-4">个人状态</Eyebrow>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="历史报告" value={String(totalReports)} size="md" hint="可恢复的判断底盘" />
            <Stat
              label="事件验证"
              value={`${validatedEvents}/${totalEvents}`}
              size="md"
              deltaDirection={validatedEvents > 0 ? 'up' : 'flat'}
              hint={`待验证 ${pendingEvents} · 偏差 ${driftEvents}`}
            />
            <Stat label="工具记录" value={String(totalTools)} size="md" hint="单项工具复访" />
            <Stat
              label="订阅状态"
              value={subscriptionActive ? '已激活' : '未激活'}
              size="md"
              hint={updatesSummary?.email || '尚未绑定邮箱'}
            />
          </div>
        </Card>

        {/* 双栏：左 = 报告/事件/工具最近活动 / 右 = 模型 + 订阅 + 系统能力 */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
          <Stack gap={4}>
            {/* 最近报告 */}
            <Card variant="default" padding="lg">
              <Inline justify="between" align="center" className="mb-4">
                <Eyebrow icon={<FileBarChart2 className="h-3 w-3" />}>最近报告</Eyebrow>
                <Link
                  href="/history"
                  className="text-xs font-semibold text-[color:var(--ink-4)] hover:text-[color:var(--brand-strong)]"
                >
                  全部 ({totalReports}) →
                </Link>
              </Inline>
              {recentReports.length === 0 ? (
                <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-4 text-xs leading-5 text-[color:var(--ink-4)]">
                  还没有报告。先去
                  <Link href="/analyze" className="mx-1 font-bold text-[color:var(--brand-strong)] hover:text-[color:var(--brand-deep)]">
                    判断工作台
                  </Link>
                  生成第一份。
                </div>
              ) : (
                <Stack gap={2}>
                  {recentReports.map((r: any) => {
                    const qualityScore = r.analysis?.qualityAudit?.overallScore;
                    const qualityGrade = r.analysis?.qualityAudit?.grade;
                    const driftLevel = r.analysis?.feedbackLoop?.correctionInsight?.level;
                    return (
                      <Link
                        key={r.id}
                        href={`/result/${r.id}`}
                        className="group block rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4 transition hover:-translate-y-px hover:border-[color:var(--brand)] hover:bg-[color:var(--paper)]"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                              {r.name || '未命名'}
                            </span>
                            <Tag tone="default" variant="outline" size="xs">
                              <span className="font-mono">{r.reportVersion || 'v1'}</span>
                            </Tag>
                            {qualityScore ? (
                              <Tag tone="brand" variant="soft" size="xs">
                                <span className="font-mono tabular-nums">
                                  {qualityScore}/{qualityGrade || 'B'}
                                </span>
                              </Tag>
                            ) : null}
                            {driftLevel === 'action' ? (
                              <Tag tone="down" variant="soft" size="xs">
                                待纠偏
                              </Tag>
                            ) : driftLevel === 'watch' ? (
                              <Tag tone="signal" variant="soft" size="xs">
                                待验证
                              </Tag>
                            ) : null}
                          </div>
                          <span className="font-mono text-[10px] tabular-nums text-[color:var(--ink-5)] group-hover:text-[color:var(--brand-strong)]">
                            {r.birthDate || '—'}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </Stack>
              )}
            </Card>

            {/* 事件验证回顾 */}
            <Card variant="default" padding="lg">
              <Inline justify="between" align="center" className="mb-4">
                <Eyebrow icon={<Bell className="h-3 w-3" />}>事件验证</Eyebrow>
                <Link
                  href="/events"
                  className="text-xs font-semibold text-[color:var(--ink-4)] hover:text-[color:var(--brand-strong)]"
                >
                  事件中心 →
                </Link>
              </Inline>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="已验证" value={String(validatedEvents)} size="sm" deltaDirection="up" />
                <Stat label="待验证" value={String(pendingEvents)} size="sm" deltaDirection="flat" />
                <Stat label="待纠偏" value={String(driftEvents)} size="sm" deltaDirection={driftEvents > 0 ? 'down' : 'flat'} />
              </div>
              {pendingEvents > 0 || driftEvents > 0 ? (
                <div className="mt-3 rounded-[var(--radius-sm)] border border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)] px-3 py-2 text-xs leading-5 text-[color:var(--signal-strong)]">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider">
                    NEXT
                  </span>
                  <div className="mt-0.5 text-[color:var(--ink-2)]">
                    回到事件中心补回 {pendingEvents} 条待验证{driftEvents > 0 ? `，并纠偏 ${driftEvents} 条偏差样本` : ''}。
                  </div>
                </div>
              ) : null}
            </Card>

            {/* 推荐路径（被首页砍掉的内容现在收纳在这里）*/}
            <Card variant="default" padding="lg">
              <Inline justify="between" align="center" className="mb-4">
                <Eyebrow icon={<Compass className="h-3 w-3" />}>推荐路径</Eyebrow>
                <Link
                  href="/world-yi"
                  className="text-xs font-semibold text-[color:var(--ink-4)] hover:text-[color:var(--brand-strong)]"
                >
                  世界易系统 →
                </Link>
              </Inline>
              <Stack gap={2}>
                {productPurposePaths.slice(0, 4).map((item) => {
                  const Icon = iconMap[item.icon] || Sparkles;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="group flex items-start gap-3 rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3 transition hover:border-[color:var(--brand)] hover:bg-[color:var(--paper)]"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                          {item.title}
                        </div>
                        <div className="mt-0.5 text-xs text-[color:var(--ink-4)]">{item.action}</div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--ink-5)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--brand-strong)]" />
                    </Link>
                  );
                })}
              </Stack>
            </Card>
          </Stack>

          {/* 右栏 sticky */}
          <Stack gap={4} className="lg:sticky lg:top-32">
            {/* 模型与引擎状态 */}
            <Card variant="default" padding="md">
              <Inline justify="between" align="start" className="mb-3">
                <Eyebrow icon={<ServerCog className="h-3 w-3" />}>判断引擎</Eyebrow>
                <Tag tone="up" size="xs" variant="soft">
                  RUNNING
                </Tag>
              </Inline>
              <Stack gap={3}>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                    主模型
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-[color:var(--ink-1)]">
                    {DEFAULT_MODEL}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                    Fallback 链
                  </div>
                  <div className="mt-1 font-mono text-xs text-[color:var(--ink-3)] break-all">
                    {FALLBACK_CHAIN}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Stat label="报告版本" value={REPORT_VERSION} size="sm" />
                  <div className="h-8 w-px bg-[color:var(--hairline)]" />
                  <Stat label="时间精度" value="真太阳" size="sm" />
                </div>
              </Stack>
            </Card>

            {/* 订阅状态 */}
            <Card variant={subscriptionActive ? 'default' : 'sunken'} padding="md">
              <Inline justify="between" align="center" className="mb-3">
                <Eyebrow tone={subscriptionActive ? 'brand' : 'muted'} icon={<BellRing className="h-3 w-3" />}>
                  订阅状态
                </Eyebrow>
                <Tag tone={subscriptionActive ? 'up' : 'default'} variant="soft" size="xs">
                  {subscriptionActive ? 'ACTIVE' : 'INACTIVE'}
                </Tag>
              </Inline>
              <Stack gap={2}>
                <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2">
                  <span className="font-mono text-[10px] text-[color:var(--ink-5)]">EMAIL</span>
                  <div className="mt-0.5 font-mono text-xs text-[color:var(--ink-2)]">
                    {updatesSummary?.email || '未绑定'}
                  </div>
                </div>
                {latestDigest ? (
                  <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2">
                    <span className="font-mono text-[10px] text-[color:var(--ink-5)]">LATEST DIGEST</span>
                    <div className="mt-0.5 font-mono text-xs tabular-nums text-[color:var(--ink-2)]">
                      {latestDigest.cycleKey} · {latestDigest.status}
                    </div>
                  </div>
                ) : null}
                <Link
                  href="/updates"
                  className="mt-1 inline-flex h-8 w-full items-center justify-between rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
                >
                  管理订阅
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Stack>
            </Card>

            {/* 系统能力 */}
            <Card variant="sunken" padding="md">
              <Eyebrow tone="muted" className="mb-3">系统能力</Eyebrow>
              <Stack gap={2}>
                <Inline justify="between" align="baseline">
                  <span className="text-xs text-[color:var(--ink-4)]">公开案例库</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-[color:var(--ink-2)]">
                    {worldYiStats.publicCaseCount}
                  </span>
                </Inline>
                <Inline justify="between" align="baseline">
                  <span className="text-xs text-[color:var(--ink-4)]">知识入口</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-[color:var(--ink-2)]">
                    {worldYiStats.publicKnowledgeCount}
                  </span>
                </Inline>
                <Inline justify="between" align="baseline">
                  <span className="text-xs text-[color:var(--ink-4)]">大师话术库</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-[color:var(--ink-2)]">
                    600+
                  </span>
                </Inline>
                <Inline justify="between" align="baseline">
                  <span className="text-xs text-[color:var(--ink-4)]">主报告版本</span>
                  <span className="font-mono text-sm font-bold tabular-nums text-[color:var(--brand-strong)]">
                    {REPORT_VERSION}
                  </span>
                </Inline>
              </Stack>
            </Card>

            {/* 信任标签（首页砍下来的）*/}
            <Card variant="default" padding="md">
              <Eyebrow icon={<Sparkles className="h-3 w-3" />} className="mb-3">
                判断系统标签
              </Eyebrow>
              <div className="flex flex-wrap gap-1.5">
                {productTrustSignals.map((label) => (
                  <Tag key={label} tone="brand" variant="soft" size="sm">
                    {label}
                  </Tag>
                ))}
              </div>
            </Card>

            {/* 主链路深入路径（首页砍下来的）*/}
            <Card variant="default" padding="md">
              <Eyebrow icon={<History className="h-3 w-3" />} className="mb-3">
                完整激活路径
              </Eyebrow>
              <Stack gap={1}>
                {productActivationPath.map((step, index) => {
                  const Icon = iconMap[step.icon] || Sparkles;
                  return (
                    <Link
                      key={step.title}
                      href={step.href}
                      className="group flex items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 transition hover:bg-[color:var(--bg-sunken)]"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] font-mono text-[10px] font-black tabular-nums text-[color:var(--brand-strong)]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <Icon className="h-3 w-3 shrink-0 text-[color:var(--brand-strong)]" />
                      <span className="flex-1 text-xs leading-5 text-[color:var(--ink-2)]">
                        {step.title}
                      </span>
                      <ArrowRight className="h-3 w-3 shrink-0 text-[color:var(--ink-5)] group-hover:text-[color:var(--brand-strong)]" />
                    </Link>
                  );
                })}
              </Stack>
            </Card>
          </Stack>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
