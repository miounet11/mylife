export const fetchCache = 'force-no-store';
export const revalidate = 0;

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';
import AnalyzeWorkspace from '@/components/analyze-workspace';
import PublicSurfaceHero from '@/components/public-surface-hero';
import UpdatesStatusPanel from '@/components/updates-status-panel';
import { getAuthSession } from '@/lib/auth';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import { worldYiRoadmapSummary } from '@/lib/world-yi';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';
import { getToolDefinition } from '@/lib/tools';

export const metadata = {
  title: '开始判断 | 人生K线',
  description: '用世界易的判断框架录入出生信息，先看结构、阶段与环境，再进入你的个人结果页。',
  robots: {
    index: false,
    follow: false,
  },
};

const analyzePowerLinks = [
  { label: '公开案例库', href: '/cases' },
  { label: '工具中心', href: '/tools' },
  { label: '知识体系入口', href: '/knowledge' },
  { label: '世界易总入口', href: '/world-yi' },
];

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
  const initialSummary = initialAuthenticated && session.user?.id
    ? buildUpdatesSummary({
        userId: session.user.id,
        email: session.user.email,
      })
    : null;

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="analyze_page_viewed" page="/analyze" meta={{ surfaceKey: 'workspace' }} />
      <SiteHeader ctaHref="#analyze-workspace" ctaLabel="开始填写" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <PublicSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              世界易分析入口
            </>
          )}
          title="开始判断"
          description="先录入出生信息，再按结构、阶段、环境与动作的顺序进入个人结果页。这里是整站最核心的判断入口。"
          hint={returnTool
            ? `你刚才想运行“${returnTool.shortTitle}”。先完成综合判断，结果生成后会提示你回到这个工具继续跑。`
            : '如果你已经从案例、知识或工具页进入，这里会承接之前的预填信息，继续完成正式判断。'}
          actions={[
            <Link key="jump-form" href="#analyze-workspace" className="action-primary action-main">
              立即开始填写
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>,
            <Link key="cases" href="/cases" className="action-secondary">先看案例</Link>,
          ]}
          highlights={[
            { body: '结构定位' },
            { body: '时间校准' },
            { body: '结果可执行' },
            { body: '默认私密' },
          ]}
        />

        <section className="mb-8 mt-8">
          <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="soft-card rounded-[1.75rem] p-6">
              <div className="section-label">结果面板</div>
              <h2 className="mt-4 text-2xl font-black text-[color:var(--ink)] md:text-3xl">结果面板</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { label: '分析顺序', value: '结构 → 阶段 → 环境 → 动作' },
                  { label: '时间基准', value: '真太阳时优先' },
                  { label: '当前公开案例', value: `${worldYiStats.publicCaseCount} 篇` },
                  { label: '公开知识入口', value: `${worldYiStats.publicKnowledgeCount} 篇` },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.25rem] bg-white/82 p-4">
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                    <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="soft-card rounded-[1.75rem] p-6">
              <div className="section-label">辅助入口</div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {analyzePowerLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="action-secondary rounded-[1.25rem] px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <UpdatesStatusPanel
          title="已有进度"
          description="如果你之前已经生成过报告、开启过升级或收到过月度提醒，这里会把最近状态接回当前分析流程。"
          initialAuthenticated={initialAuthenticated}
          initialSummary={initialSummary}
        />

        <div id="analyze-workspace">
          <AnalyzeWorkspace
            returnHref={returnTool ? `/tools/${returnTool.slug}` : undefined}
            returnLabel={returnTool ? `回到${returnTool.shortTitle}` : undefined}
            returnSource={source || undefined}
          />
        </div>

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
            <div>
              <div className="section-label">后续入口</div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">工具入口</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {['事业与财富', '关系与家庭', '恢复与健康', '迁移与出国'].map((item) => (
                <Link key={item} href="/tools" className="action-secondary rounded-[1.25rem] p-4 text-sm font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5">
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
