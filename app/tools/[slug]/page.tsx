export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bot, Layers3, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import PublicSurfaceHero from '@/components/public-surface-hero';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import SurfaceJourneyPanel from '@/components/surface-journey-panel';
import ToolBundlePanel from '@/components/tool-bundle-panel';
import ToolCaseStoriesPanel from '@/components/tool-case-stories-panel';
import ToolConversionPanel from '@/components/tool-conversion-panel';
import ToolEditorialPanel from '@/components/tool-editorial-panel';
import ToolJourneyPanel from '@/components/tool-journey-panel';
import ToolLinkedContentPanel from '@/components/tool-linked-content-panel';
import ToolMemoryPanel from '@/components/tool-memory-panel';
import ToolPremiumDepthPanel from '@/components/tool-premium-depth-panel';
import ToolPremiumRequestPanel from '@/components/tool-premium-request-panel';
import ToolRecommendations from '@/components/tool-recommendations';
import ResultCtaLink from '@/components/result-cta-link';
import ToolRunner from '@/components/tool-runner';
import { getAuthSession } from '@/lib/auth';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { buildJourneyForTool } from '@/lib/surface-journeys';
import { summarizeToolSessions } from '@/lib/tool-context';
import { buildToolPremiumOffer, getToolBundleForSlug, getToolDefinition } from '@/lib/tools';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolDefinition(slug);
  if (!tool) {
    return {
      title: '单项工具 | 人生K线',
    };
  }

  return {
    title: `${tool.title} | 人生K线工具中心`,
    description: `${tool.description}。适合：${tool.targetUser}。`,
  };
}

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolDefinition(slug);
  if (!tool) {
    notFound();
  }

  const session = await getAuthSession();
  const authenticated = !!session.authenticated && !!session.user?.id;
  const userId = authenticated && session.user?.id ? session.user.id : null;
  const report = userId ? fortuneOperations.getByUserId(userId)[0] || null : null;
  const recentSessions = userId ? toolSessionOperations.listByUser(userId, 5) : [];
  const memory = summarizeToolSessions(recentSessions, report, 5);
  const premiumOffer = buildToolPremiumOffer(tool);
  const bundle = getToolBundleForSlug(tool.slug);
  const journey = buildJourneyForTool(tool);

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="tool_detail_viewed"
        page={`/tools/${tool.slug}`}
        meta={{ toolSlug: tool.slug, category: tool.category }}
      />
      <SiteHeader ctaHref="/tools" ctaLabel="工具中心" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-4">
            <PublicSurfaceHero
              label={(
                <>
                  <Layers3 className="h-3.5 w-3.5" />
                  {tool.themeLabel}
                </>
              )}
              title={tool.title}
              description={tool.hook}
              hint="先跑免费版，再决定是否进入深测。"
              actions={[
                <ResultCtaLink
                  key="start"
                  href="#tool-runner"
                  page={`/tools/${tool.slug}`}
                  target="tool_detail_primary_start"
                  className="action-primary action-main"
                  meta={{ toolSlug: tool.slug, category: tool.category }}
                >
                  立即开始这个工具
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ResultCtaLink>,
                <ResultCtaLink
                  key="chat"
                  href={report ? `/chat?reportId=${encodeURIComponent(report.id)}&intent=${encodeURIComponent(tool.chatIntent || '')}` : '/chat'}
                  page={`/tools/${tool.slug}`}
                  target="tool_detail_primary_chat"
                  className="action-secondary"
                  meta={{ toolSlug: tool.slug, category: tool.category, chatIntent: tool.chatIntent || null }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    先去结构追问
                  </span>
                </ResultCtaLink>,
                <Link key="category" href={`/tools/category/${tool.category}`} className="action-secondary">返回该分类</Link>,
              ]}
              highlights={[
                { title: '适合人群', body: tool.targetUser },
                { title: '优先帮你', body: tool.valuePromise },
                { title: '当前触发', body: tool.triggerMoment },
                { title: '免费先拿', body: tool.freeValueLine },
              ]}
            />
            <div className="flex flex-wrap gap-2">
              {tool.hookKeywords.map((keyword) => (
                <span key={keyword} className="product-chip text-[color:var(--muted)]">
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel rounded-[2rem] p-6">
              <div className="section-label">
                <Sparkles className="h-3.5 w-3.5" />
                快速开始
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[1.25rem] bg-white/82 p-4 text-xs leading-6 text-[color:var(--ink)]">
                  当前触发：{tool.triggerMoment}
                </div>
                <div className="rounded-[1.25rem] bg-white/82 p-4 text-xs leading-6 text-[color:var(--ink)]">
                  免费先拿：{tool.freeValueLine}
                </div>
                <div className="rounded-[1.25rem] bg-[color:var(--accent-soft)] p-4 text-xs leading-6 text-[color:var(--accent-strong)]">
                  深测差异：{tool.paidValueLine}
                </div>
              </div>
              <div className="mt-4 rounded-[1.25rem] bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">
                深测差异：{tool.paidValueLine}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['错误问法', tool.wrongQuestion],
                ['正确问法', tool.rightQuestion],
              ].map(([title, description]) => (
                <div key={title} className="soft-card rounded-[1.75rem] p-5">
                  <div className="text-base font-bold text-[color:var(--ink)]">{title}</div>
                  <div className="intro-copy mt-2">{description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="tool-runner" className="mt-10 grid gap-8 xl:grid-cols-[1fr_1fr]">
          <ToolRunner toolSlug={tool.slug} reportId={report?.id} />

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              运行前提示
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.25rem] bg-white/82 p-4 text-xs leading-6 text-[color:var(--ink)]">
                免费版输出：{tool.freeOutputFields.join('、')}
              </div>
              <div className="rounded-[1.25rem] bg-white/82 p-4 text-xs leading-6 text-[color:var(--ink)]">
                深测会补：{tool.premiumOutputFields.join('、')}
              </div>
              <div className="action-guide pt-2">更多入口</div>
              <div className="action-strip flex flex-wrap gap-3 text-sm font-semibold">
                <ResultCtaLink
                  href={`/tools/category/${tool.category}`}
                  page={`/tools/${tool.slug}`}
                  target="tool_detail_runner_tip_category"
                  className="action-secondary"
                  meta={{ toolSlug: tool.slug, category: tool.category }}
                >
                  返回该分类
                </ResultCtaLink>
                <ResultCtaLink
                  href={report ? `/chat?reportId=${encodeURIComponent(report.id)}&intent=${encodeURIComponent(tool.chatIntent || '')}` : '/chat'}
                  page={`/tools/${tool.slug}`}
                  target="tool_detail_runner_tip_chat"
                  className="action-secondary"
                  meta={{ toolSlug: tool.slug, category: tool.category, chatIntent: tool.chatIntent || null }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    进入结构追问
                  </span>
                </ResultCtaLink>
                <ResultCtaLink
                  href="/analyze"
                  page={`/tools/${tool.slug}`}
                  target="tool_detail_runner_tip_analyze"
                  className="action-secondary"
                  meta={{ toolSlug: tool.slug, category: tool.category }}
                >
                  重新做综合判断
                </ResultCtaLink>
              </div>
            </div>
          </div>
        </section>

        {authenticated && memory ? (
          <section className="mt-10">
            <ToolMemoryPanel memory={memory} />
          </section>
        ) : null}

        {tool.featuredBadge ? (
          <section className="mt-10">
            <ToolEditorialPanel tool={tool} />
          </section>
        ) : null}

        <section className="mt-10">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {tool.freeInsights.slice(0, 2).map((item) => (
              <div key={item} className="soft-card rounded-[1.5rem] p-5">
                <div className="text-sm font-semibold text-[color:var(--ink)]">免费先看</div>
                <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item}</div>
              </div>
            ))}
            {tool.premiumModules.slice(0, 2).map((item) => (
              <div key={item} className="rounded-[1.5rem] border border-dashed border-[color:var(--accent)] bg-[color:var(--accent-soft)]/60 p-5">
                <div className="text-sm font-semibold text-[color:var(--accent-strong)]">深测再展开</div>
                <div className="mt-2 text-xs leading-6 text-[color:var(--ink)]">{item}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <ToolCaseStoriesPanel tool={tool} />
        </section>

        <section className="mt-10">
          <ToolConversionPanel tool={tool} />
        </section>

        <section className="mt-10">
          <ToolLinkedContentPanel tool={tool} page={`/tools/${tool.slug}`} />
        </section>

        <section className="mt-10">
          <ToolJourneyPanel tool={tool} />
        </section>

        <section className="mt-10">
          <SurfaceJourneyPanel
            journey={journey}
            title="做完这个工具，下一步继续放大"
            description="完成当前判断后，继续回到综合测算，或进入相关文章与案例，把结论落到真实动作。"
          />
        </section>

        <section className="mt-10">
          <ToolPremiumDepthPanel tool={tool} offer={premiumOffer} reportId={report?.id} />
        </section>

        <section className="mt-10">
          <ToolPremiumRequestPanel tool={tool} reportId={report?.id} page={`/tools/${tool.slug}`} />
        </section>

        {bundle ? (
          <section className="mt-10">
            <ToolBundlePanel bundle={bundle} page={`/tools/${tool.slug}`} />
          </section>
        ) : null}

        <section className="mt-10">
          <ToolRecommendations
            report={report}
            page={`/tools/${tool.slug}`}
            title="下一步推荐"
            description="先把当前问题做窄，再沿着阶段窗口和高频应用继续下钻。"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
