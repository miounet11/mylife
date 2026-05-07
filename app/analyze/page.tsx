export const fetchCache = 'force-no-store';
export const revalidate = 0;

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import AnalyticsPageView from '@/components/analytics-page-view';
import AnalyzeWorkspace from '@/components/analyze-workspace';
import PriorityDisclosure from '@/components/priority-disclosure';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import UpdatesStatusPanel from '@/components/updates-status-panel';
import VisualAssetFeature from '@/components/visual-asset-feature';
import { getAuthSession } from '@/lib/auth';
import { getCurrentUserId } from '@/lib/user-utils';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';
import { getToolDefinition } from '@/lib/tools';
import { getVisualAssetById } from '@/lib/visual-asset-library';
import {
  analyzeOutcomeCards,
  productBenchmarkSignals,
  productReasoningTraceSteps,
} from '@/lib/product-experience';

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
  const currentUserId = await getCurrentUserId();
  const activeUserId = session.user?.id || currentUserId || null;
  const initialSummary = activeUserId
    ? buildUpdatesSummary({
        userId: activeUserId,
        email: session.user?.email,
      })
    : null;
  const firstReportImage = getVisualAssetById('PWY01-003');
  const birthTimeImage = getVisualAssetById('MY05-002') || getVisualAssetById('PWY01-009');
  const baziStructureImage = getVisualAssetById('MY05-001');

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="analyze_page_viewed" page="/analyze" meta={{ surfaceKey: 'workspace', source: source || null, toolSlug: toolSlug || null }} />
      <SiteHeader ctaHref="#analyze-workspace" ctaLabel="开始填写" />

      <main className="page-frame py-3 pb-16 md:py-5 md:pb-20">
        <section className="mb-2 md:mb-3">
          <div className="hidden section-label md:inline-flex">
            <Sparkles className="h-3.5 w-3.5" />
            填写出生信息
          </div>
          <div className="grid gap-2 md:mt-2 lg:grid-cols-[minmax(0,0.9fr)_minmax(260px,0.36fr)] lg:items-end">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-black leading-tight text-[color:var(--ink)] md:text-5xl">
                填出生信息，
                <span className="text-[color:var(--accent-strong)]">生成第一份判断报告</span>
              </h1>
            </div>
            <div className="hidden workspace-panel-muted p-3 lg:block">
              <Link href="/docs/birth-info" className="text-sm font-bold text-[color:var(--accent-strong)]">
                填写 tips
              </Link>
              {returnTool ? (
                <div className="mt-2 rounded-lg bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[color:var(--accent-strong)]">
                  完成后回到：{returnTool.shortTitle}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <div id="analyze-workspace" className="scroll-mt-28">
          <AnalyzeWorkspace
            returnHref={returnTool ? `/tools/${returnTool.slug}` : undefined}
            returnLabel={returnTool ? `回到${returnTool.shortTitle}` : undefined}
            returnSource={source || undefined}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/docs/birth-info" className="action-secondary min-h-0 px-3 py-2 text-xs">
            出生信息
          </Link>
          <Link href="/docs/true-solar-time" className="action-secondary min-h-0 px-3 py-2 text-xs">
            真太阳时
          </Link>
          <Link href="/docs/read-first-report" className="action-secondary min-h-0 px-3 py-2 text-xs">
            报告读法
          </Link>
        </div>

        <PriorityDisclosure
          label="提交后"
          title="结果内容和辅助入口"
          description="先完成录入；报告、案例、工具和方法论在这里展开。"
          className="mt-6"
        >
          <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="workspace-panel p-5 md:p-6">
              <div className="section-label">提交后得到什么</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ...analyzeOutcomeCards,
                  { label: '公开案例', value: `${worldYiStats.publicCaseCount} 篇` },
                  { label: '知识入口', value: `${worldYiStats.publicKnowledgeCount} 篇` },
                ].map((item) => (
                  <div key={item.label} className="metric-tile">
                    <div className="text-xs font-semibold text-[color:var(--muted)]">{item.label}</div>
                    <div className="mt-2 text-lg font-bold text-[color:var(--ink)]">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="workspace-panel-muted p-5 md:p-6">
              <div className="section-label">辅助入口</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {analyzePowerLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="action-secondary px-4 py-3 text-sm font-semibold text-[color:var(--ink)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="workspace-panel p-5 md:p-6">
              <div className="section-label">可追溯推理链路</div>
              <h2 className="mt-3 text-2xl font-black text-[color:var(--ink)]">不是直接给结论，而是保留每一步判断来源</h2>
              <div className="mt-5 grid gap-3">
                {productReasoningTraceSteps.map((step, index) => (
                  <div key={step.key} className="rounded-[1.25rem] border border-[color:var(--line)] bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-xs font-black text-[color:var(--accent-strong)]">
                        {index + 1}
                      </div>
                      <div className="text-sm font-bold text-[color:var(--ink)]">{step.title}</div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{step.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="workspace-panel-muted p-5 md:p-6">
              <div className="section-label">验证型报告定位</div>
              <h2 className="mt-3 text-2xl font-black text-[color:var(--ink)]">用事件和选项判断压缩泛泛而谈</h2>
              <div className="mt-5 grid gap-3">
                {productBenchmarkSignals.map((item) => (
                  <div key={item.label} className="metric-tile bg-white/80">
                    <div className="text-xs font-semibold text-[color:var(--muted)]">{item.label}</div>
                    <div className="mt-2 text-sm font-bold leading-6 text-[color:var(--ink)]">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PriorityDisclosure>

        <section className="mt-8">
          <ProductSurfaceRolePanel
            surface="analyze"
            title="这个页面只负责生成第一份报告"
            compact
          />
        </section>

        <section className="mt-8">
          <UpdatesStatusPanel
            title="已有进度"
            description="如果你之前已经生成过报告、开启过升级或收到过月度提醒，这里会把最近状态接回当前分析流程。"
            initialAuthenticated={initialAuthenticated}
            initialSummary={initialSummary}
            compact
          />
        </section>

        <section className="mt-10">
          <PriorityDisclosure
            label="填写说明与后续入口"
            title="需要解释时再展开"
            description="图片说明、方法论和专项工具都不再默认占据录入页主流程。"
          >
            <div className="space-y-5">
              {birthTimeImage ? (
                <VisualAssetFeature asset={birthTimeImage} label="填写信息说明图" />
              ) : null}

              {baziStructureImage ? (
                <VisualAssetFeature asset={baziStructureImage} label="四柱八字结构图" reverse />
              ) : null}

              {firstReportImage ? (
                <VisualAssetFeature asset={firstReportImage} label="第一份报告路径图" reverse />
              ) : null}

              <div className="workspace-panel p-5 md:p-6">
                <div className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
                  <div>
                    <div className="section-label">后续入口</div>
                    <h2 className="mt-4 text-2xl font-black text-[color:var(--ink)]">报告完成后再拆专项问题</h2>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {['事业与财富', '关系与家庭', '恢复与健康', '迁移与出国'].map((item) => (
                      <Link key={item} href="/tools" className="action-secondary p-4 text-sm font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--accent)]">
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PriorityDisclosure>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
