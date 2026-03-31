export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Bot, ScrollText, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import SurfaceJourneyPanel from '@/components/surface-journey-panel';
import ToolBundlePanel from '@/components/tool-bundle-panel';
import ToolCaseStoriesPanel from '@/components/tool-case-stories-panel';
import ToolConversionPanel from '@/components/tool-conversion-panel';
import ToolEditorialPanel from '@/components/tool-editorial-panel';
import ToolJourneyPanel from '@/components/tool-journey-panel';
import ToolMemoryPanel from '@/components/tool-memory-panel';
import ToolPremiumDepthPanel from '@/components/tool-premium-depth-panel';
import ToolPremiumRequestPanel from '@/components/tool-premium-request-panel';
import ToolRecommendations from '@/components/tool-recommendations';
import { summarizeToolSessions } from '@/lib/tool-context';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { buildJourneyForTool } from '@/lib/surface-journeys';
import { buildToolPremiumOffer, getToolBundleForSlug, getToolDefinition } from '@/lib/tools';
import { getCurrentUserId } from '@/lib/user-utils';

export default async function ToolResultPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const currentUserId = await getCurrentUserId();
  const session = toolSessionOperations.getById(sessionId);
  if (!session || !currentUserId || session.userId !== currentUserId) {
    notFound();
  }

  const tool = getToolDefinition(session.toolSlug);
  if (!tool) {
    notFound();
  }

  const report = session.reportId ? fortuneOperations.getById(session.reportId) : null;
  const recentSessions = toolSessionOperations.listByUser(currentUserId, 6);
  const memory = summarizeToolSessions(recentSessions, report, 6);
  const result = (session.result || {}) as Record<string, unknown>;
  const premiumOffer = buildToolPremiumOffer(tool);
  const bundle = getToolBundleForSlug(tool.slug);
  const journey = buildJourneyForTool(tool);

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="tool_result_viewed"
        page={`/tool-result/${session.id}`}
        meta={{ toolSlug: tool.slug, category: tool.category, reportId: session.reportId || null }}
      />
      <SiteHeader ctaHref="/tools" ctaLabel="更多工具" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              {tool.title}
            </div>
            <h1 className="text-4xl font-black leading-tight text-[color:var(--ink)] md:text-5xl">
              {String(result.headline || `${tool.shortTitle}结果已生成`)}
            </h1>
            <p className="intro-copy">{String(result.summary || tool.valuePromise)}</p>
            <div className="intro-panel">优先动作：继续深问，或回到综合判断。</div>
            <div className="space-y-2">
              <div className="action-guide">快速操作</div>
              <div className="action-strip flex flex-wrap gap-3">
                <Link
                  href={report ? `/chat?reportId=${encodeURIComponent(report.id)}&intent=${encodeURIComponent(tool.chatIntent || '')}` : '/chat'}
                  className="action-primary action-main"
                >
                  <Bot className="mr-1 h-4 w-4" />
                  继续深问
                </Link>
                <Link href={report ? `/result/${report.id}` : '/profile'} className="action-secondary">返回综合判断</Link>
                <Link href="/tools" className="action-secondary">继续做别的工具</Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ResultCard title="当前建议" value={String(result.recommendedAction || '先回到一个真实问题场景，不要把所有问题混在一起问。')} />
            <ResultCard title="风险提醒" value={String(result.riskReminder || '短周期结果要结合长期结构，不要当成唯一依据。')} />
            <ResultCard title="结果层级" value={String(result.confidenceLabel || '基础结构判断')} />
            <ResultCard title="为什么推荐你做它" value={String(result.whyItMatches || '它和你当前报告主轴更接近。')} />
          </div>
        </section>

        <section className="mt-10 grid gap-8 xl:grid-cols-[1fr_1fr]">
          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">
              <ScrollText className="h-3.5 w-3.5" />
              免费结果摘要
            </div>
            <div className="mt-5 grid gap-3">
              {Array.isArray(result.evidence) ? (result.evidence as string[]).map((item) => (
                <div key={item} className="rounded-[1.25rem] bg-white/82 p-4 text-xs leading-6 text-[color:var(--ink)]">
                  {item}
                </div>
              )) : null}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              下一步承接
            </div>
            <div className="mt-5 grid gap-3">
              {Array.isArray(result.premiumPreview) ? (result.premiumPreview as string[]).map((item) => (
                <div key={item} className="rounded-[1.25rem] bg-white/82 p-4 text-xs leading-6 text-[color:var(--ink)]">
                  {item}
                </div>
              )) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={report ? `/chat?reportId=${encodeURIComponent(report.id)}&intent=${encodeURIComponent(tool.chatIntent || '')}` : '/chat'}
                className="action-primary"
              >
                <Bot className="mr-2 h-4 w-4" />
                继续深问
              </Link>
              <Link href={report ? `/result/${report.id}` : '/profile'} className="action-secondary">
                返回综合判断
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/tools" className="action-secondary">继续做别的工具</Link>
            </div>
          </div>
        </section>

        {memory ? (
          <section className="mt-10">
            <ToolMemoryPanel
              memory={memory}
              title="这次结果已写入你的长期上下文"
              description="后续工具会直接继承这些记录。"
            />
          </section>
        ) : null}

        {tool.featuredBadge ? (
          <section className="mt-10">
            <ToolEditorialPanel tool={tool} />
          </section>
        ) : null}

        <section className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tool.freeInsights.map((item) => (
            <div key={item} className="soft-card rounded-[1.5rem] p-5">
              <div className="text-sm font-semibold text-[color:var(--ink)]">这次免费已回答</div>
              <div className="intro-copy mt-3">{item}</div>
            </div>
          ))}
          {tool.premiumModules.map((item) => (
            <div key={item} className="rounded-[1.5rem] border border-dashed border-[color:var(--accent)] bg-[color:var(--accent-soft)]/60 p-5">
              <div className="text-sm font-semibold text-[color:var(--accent-strong)]">继续付费可展开</div>
              <div className="mt-3 text-xs leading-6 text-[color:var(--ink)]">{item}</div>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <ToolJourneyPanel
            tool={tool}
            title="接下来最值得继续测什么"
            description="沿着主问题、窗口、动作三步继续下钻。"
          />
        </section>

        <section className="mt-10">
          <ToolCaseStoriesPanel
            tool={tool}
            title="类似用户是怎么继续往下测的"
            description="用案例快速看清后续链路怎么承接。"
          />
        </section>

        <section className="mt-10">
          <ToolConversionPanel tool={tool} />
        </section>

        <section className="mt-10">
          <SurfaceJourneyPanel
            journey={journey}
            title="这次结果已经和主测算、工具、内容全部串起来"
            description="回到综合报告、继续下钻工具，或直接读相关文章与案例。"
          />
        </section>

        <section className="mt-10">
          <ToolPremiumDepthPanel tool={tool} offer={premiumOffer} reportId={report?.id} />
        </section>

        <section className="mt-10">
          <ToolPremiumRequestPanel tool={tool} reportId={report?.id} page={`/tool-result/${session.id}`} />
        </section>

        {bundle ? (
          <section className="mt-10">
            <ToolBundlePanel bundle={bundle} page={`/tool-result/${session.id}`} />
          </section>
        ) : null}

        <section className="mt-10">
          <ToolRecommendations
            report={report}
            page={`/tool-result/${session.id}`}
            title="继续下钻"
            description="一个看主问题，一个看窗口，一个看动作。"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ResultCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="soft-card rounded-[1.75rem] p-5">
      <div className="text-sm tracking-[0.18em] text-[color:var(--muted)]">{title}</div>
      <div className="mt-3 text-sm leading-6 text-[color:var(--ink)]">{value}</div>
    </div>
  );
}
