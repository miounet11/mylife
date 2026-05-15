export const fetchCache = 'force-no-store';
export const revalidate = 0;

import Link from 'next/link';
import { ArrowRight, BookOpen, Clock4, FileText, Sparkles } from 'lucide-react';

import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';
import AnalyzeWorkspace from '@/components/analyze-workspace';
import UpdatesStatusPanel from '@/components/updates-status-panel';

import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Inline } from '@/components/ui/inline';
import { Lede } from '@/components/ui/lede';
import { Stack } from '@/components/ui/stack';
import { Tag } from '@/components/ui/tag';

import { getAuthSession } from '@/lib/auth';
import { getCurrentUserId } from '@/lib/user-utils';
import { fortuneOperations } from '@/lib/database';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';
import { getToolDefinition } from '@/lib/tools';
import {
  productBenchmarkSignals,
  productReasoningTraceSteps,
} from '@/lib/product-experience';

export const metadata = {
  title: '判断工作台 | 人生K线',
  description: '用世界易的判断框架录入出生信息，先看结构、阶段与环境，再进入你的个人结果页。',
  robots: {
    index: false,
    follow: false,
  },
};

function formatRelative(iso?: string | Date): string {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return '刚刚';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  return d.toISOString().slice(0, 10);
}

export default async function AnalyzeEntryPage({
  searchParams,
}: {
  searchParams?: Promise<{
    toolSlug?: string;
    source?: string;
  }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const toolSlug = resolvedSearchParams.toolSlug?.trim() || '';
  const source = resolvedSearchParams.source?.trim() || '';
  const returnTool = toolSlug ? getToolDefinition(toolSlug) : null;
  const worldYiStats = getWorldYiPublicStats();
  const session = await getAuthSession();
  const initialAuthenticated = !!session.authenticated && !!session.user?.id;
  const currentUserId = await getCurrentUserId();
  const activeUserId = session.user?.id || currentUserId || null;
  const initialSummary = activeUserId
    ? buildUpdatesSummary({
        userId: activeUserId,
        email: session.user?.email,
      })
    : null;

  const userReports = activeUserId ? fortuneOperations.getByUserId(activeUserId) : [];
  const recentReports = userReports.slice(0, 3);
  const totalUserReports = userReports.length;

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="analyze_page_viewed"
        page="/analyze"
        meta={{ surfaceKey: 'workspace', source: source || null, toolSlug: toolSlug || null }}
      />
      <SiteHeader ctaHref="#analyze-workspace" ctaLabel="开始填写" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        {/* HERO 区 */}
        <section className="mb-6 md:mb-8">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
            <Stack gap={3}>
              <Eyebrow icon={<Sparkles className="h-3 w-3" />}>判断工作台</Eyebrow>
              <h1 className="text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
                填出生信息，
                <span className="text-[color:var(--brand-strong)]">生成第一份判断报告</span>
              </h1>
              <Lede>
                用真太阳时校正与世界易判断框架，先得到结构、阶段与环境总览，再决定下一步路径。
              </Lede>
              {returnTool && (
                <Card variant="signal" padding="sm">
                  <Inline gap={2}>
                    <Tag tone="signal" variant="solid" size="sm">
                      回流路径
                    </Tag>
                    <span className="text-sm font-semibold text-[color:var(--ink-2)]">
                      完成后回到：{returnTool.shortTitle}
                    </span>
                  </Inline>
                </Card>
              )}
            </Stack>

            <Inline gap={2} wrap justify="end" className="lg:justify-end">
              <Link
                href="/docs/birth-info"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
              >
                <Clock4 className="h-3.5 w-3.5" />
                填写 tips
              </Link>
              <Link
                href="/docs/true-solar-time"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
              >
                <BookOpen className="h-3.5 w-3.5" />
                真太阳时
              </Link>
              <Link
                href="/docs/read-first-report"
                className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-xs font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
              >
                <FileText className="h-3.5 w-3.5" />
                报告读法
              </Link>
            </Inline>
          </div>
        </section>

        {/* 双栏 dashboard：左主区表单 / 右副区状态 */}
        <div
          id="analyze-workspace"
          className="scroll-mt-28 grid gap-5 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] lg:items-start"
        >
          {/* 左主区 */}
          <Card variant="raised" padding="md" className="border-[color:var(--brand-soft-2)]">
            <AnalyzeWorkspace
              returnHref={returnTool ? `/tools/${returnTool.slug}` : undefined}
              returnLabel={returnTool ? `回到${returnTool.shortTitle}` : undefined}
              returnSource={source || undefined}
            />
          </Card>

          {/* 右副区：最近报告 + 系统能力 */}
          <Stack gap={4} className="lg:sticky lg:top-32">
            {/* 最近报告 */}
            {totalUserReports > 0 && (
              <Card variant="default" padding="md">
                <Inline justify="between" align="center" className="mb-3">
                  <Eyebrow>最近报告</Eyebrow>
                  <Link
                    href="/history"
                    className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-4)] hover:text-[color:var(--brand-strong)]"
                  >
                    全部 ({totalUserReports}) →
                  </Link>
                </Inline>
                <Stack gap={2}>
                  {recentReports.map((report) => (
                    <Link
                      key={report.id}
                      href={`/result/${report.id}`}
                      className="group block border-l-2 border-[color:var(--hairline)] pl-3 py-1 hover:border-[color:var(--brand)]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold leading-snug text-[color:var(--ink-2)] truncate">
                          {report.name || '未命名'}
                        </span>
                        <Tag tone="brand" variant="soft" size="xs">
                          可继续阅读
                        </Tag>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[color:var(--ink-5)]">
                        <span className="font-mono tabular-nums">
                          {formatRelative((report as any).updatedAt || (report as any).createdAt)}
                        </span>
                        <span>·</span>
                        <span className="font-mono">{report.birthDate}</span>
                      </div>
                    </Link>
                  ))}
                </Stack>
              </Card>
            )}

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
              </Stack>
            </Card>
          </Stack>
        </div>

        {/* 已有进度（已登录） */}
        {initialAuthenticated && (
          <section className="mt-8">
            <UpdatesStatusPanel
              title="已有进度"
              description="如果你之前已经生成过报告、开启过升级或收到过月度提醒，这里会把最近状态接回当前分析流程。"
              initialAuthenticated={initialAuthenticated}
              initialSummary={initialSummary}
              compact
            />
          </section>
        )}

        {/* 判断依据（折叠到下方，不抢主流程） */}
        <section className="mt-10 md:mt-12">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card variant="default" padding="lg">
              <Eyebrow className="mb-3">判断依据</Eyebrow>
              <h2 className="text-lg font-black leading-tight text-[color:var(--ink-1)]">
                不是直接给结论，<br />
                而是说明判断从哪里来
              </h2>
              <Stack gap={3} className="mt-5">
                {productReasoningTraceSteps.map((step, index) => (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--brand-soft)] font-mono text-xs font-black text-[color:var(--brand-strong)]">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold leading-tight text-[color:var(--ink-2)]">
                        {step.title}
                      </div>
                      <div className="mt-1 text-xs leading-6 text-[color:var(--ink-4)]">
                        {step.description}
                      </div>
                    </div>
                  </div>
                ))}
              </Stack>
            </Card>

            <Card variant="default" padding="lg">
              <Eyebrow className="mb-3">验证型报告定位</Eyebrow>
              <h2 className="text-lg font-black leading-tight text-[color:var(--ink-1)]">
                用事件和选项判断，<br />
                压缩泛泛而谈
              </h2>
              <Stack gap={3} className="mt-5">
                {productBenchmarkSignals.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-3 py-2"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                      {item.label}
                    </div>
                    <div className="mt-1 text-sm font-bold leading-snug text-[color:var(--ink-2)]">
                      {item.value}
                    </div>
                  </div>
                ))}
              </Stack>
            </Card>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <Link
              href="/cases"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ink-3)] hover:text-[color:var(--brand-strong)]"
            >
              公开案例库 <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/tools"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ink-3)] hover:text-[color:var(--brand-strong)]"
            >
              工具中心 <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/world-yi"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ink-3)] hover:text-[color:var(--brand-strong)]"
            >
              世界易系统 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
