export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BookOpenText, Bot, LockKeyhole, ScrollText, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import NewsletterSignup from '@/components/newsletter-signup';
import PriorityDisclosure from '@/components/priority-disclosure';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
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
import { buildToolPremiumOffer, getToolBundleForSlug, getToolDefinition, getToolGrowthProfile } from '@/lib/tools';
import { getCurrentUserId } from '@/lib/user-utils';
import { buildChatHref } from '@/lib/chat-entry';
import { buildSourceCtaStrategy, buildSourceJourneyCopy, getSourceContext } from '@/lib/source-context';

export default async function ToolResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams?: Promise<{ source?: string }>;
}) {
  const { sessionId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const entrySource = resolvedSearchParams.source?.trim() || '';
  const sourceContext = getSourceContext(entrySource);
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
  const sessionMeta = (session.meta || {}) as Record<string, any>;
  const llmEnhancement = sessionMeta.llmEnhancement || {};
  const deepDiveSections = Array.isArray(llmEnhancement.deepDiveSections)
    ? llmEnhancement.deepDiveSections.filter((item: any) => item?.heading && item?.body).slice(0, 5)
    : [];
  const quality = sessionMeta.quality || null;
  const conversion = sessionMeta.conversion || null;
  const premiumOffer = buildToolPremiumOffer(tool);
  const growthProfile = getToolGrowthProfile(tool.slug);
  const bundle = getToolBundleForSlug(tool.slug);
  const journey = buildJourneyForTool(tool, { source: entrySource || null });
  const toolResultJourneyCopy = buildSourceJourneyCopy(entrySource, {
    title: '这次结果已经和主测算、工具、内容全部串起来',
    description: '回到综合报告、继续下钻工具，或直接读相关文章与案例。',
  });
  const toolFollowupQuestion = `请围绕“${tool.shortTitle}”这次结果继续深问，按结构、阶段、环境、动作四层拆解：这条建议为什么成立，我现在该先推进什么，最需要防什么误判？`;
  const toolChatSource = entrySource.startsWith('lifecycle_tool_interest')
    ? entrySource
    : entrySource
      ? `tool_result_followup:${entrySource}`
      : 'tool_result_followup';
  const sourceCtaStrategy = buildSourceCtaStrategy(entrySource || `tool_detail:${tool.slug}`);
  const toolChatHref = buildChatHref({
    reportId: report?.id || null,
    intent: tool.chatIntent || null,
    question: toolFollowupQuestion,
    source: toolChatSource,
    ctaStrategyKey: sourceCtaStrategy.strategyKey,
    sourceFamily: sourceCtaStrategy.sourceFamily,
  });
  const reportHref = report
    ? `/result/${encodeURIComponent(report.id)}${entrySource ? `?source=${encodeURIComponent(entrySource)}` : ''}`
    : '/profile';

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="tool_result_viewed"
        page={`/tool-result/${session.id}`}
        meta={{ toolSlug: tool.slug, category: tool.category, reportId: session.reportId || null, source: entrySource || null }}
      />
      <SiteHeader ctaHref="/tools" ctaLabel="更多工具" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              {tool.title}
            </div>
            <h1 className="text-4xl font-black leading-tight text-[color:var(--ink)] md:text-5xl">
              {String(result.headline || `${tool.shortTitle}结果已生成`)}
            </h1>
            <div className="space-y-2">
              <div className="action-guide">快速操作</div>
              <div className="action-strip flex flex-wrap gap-3">
                <Link
                  href={toolChatHref}
                  className="action-primary action-main"
                >
                  <Bot className="mr-1 h-4 w-4" />
                  继续深问
                </Link>
                <Link href={reportHref} className="action-secondary">返回综合判断</Link>
                <Link href="/tools" className="action-secondary">继续做别的工具</Link>
                <Link href="/docs/use-tools" className="action-secondary">
                  <BookOpenText className="h-4 w-4" />
                  使用方法
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ResultCard title="当前建议" value={String(result.recommendedAction || '先回到一个真实问题场景，不要把所有问题混在一起问。')} />
            <ResultCard title="风险提醒" value={String(result.riskReminder || '短周期结果要结合长期结构，不要当成唯一依据。')} />
            <ResultCard title="结果层级" value={String(result.confidenceLabel || '基础结构判断')} />
            <ResultCard title="匹配依据" value={String(result.whyItMatches || '它和你当前报告主轴更接近。')} />
          </div>
        </section>

        <section className="mt-8 grid gap-8 xl:grid-cols-[1fr_1fr]">
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
                href={toolChatHref}
                className="action-primary"
              >
                <Bot className="mr-2 h-4 w-4" />
                继续深问
              </Link>
              <Link href={reportHref} className="action-secondary">
                返回综合判断
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/tools" className="action-secondary">继续做别的工具</Link>
            </div>
          </div>
        </section>

        {growthProfile ? (
          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="glass-panel rounded-[2rem] p-6 md:p-8">
              <div className="section-label">
                <LockKeyhole className="h-3.5 w-3.5" />
                免费结果之后
              </div>
              <h2 className="mt-4 text-3xl font-black leading-tight text-[color:var(--ink)] md:text-4xl">
                这次免费测算先保存，再决定是否进入深测
              </h2>
              <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
                {growthProfile.heroSubtitle}
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {growthProfile.upgradeBullets.map((item) => (
                  <div key={item} className="rounded-[1.25rem] border border-dashed border-[color:var(--accent)] bg-[color:var(--accent-soft)]/60 px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href={toolChatHref} className="action-primary">
                  <Bot className="mr-2 h-4 w-4" />
                  继续深问深测边界
                </Link>
                <Link href={`/tools/${tool.slug}#faq`} className="action-secondary">
                  查看常见问题
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>

            <NewsletterSignup
              source={`tool_result_growth_${tool.slug}`}
              title="把这次结果发到邮箱，后面再复看"
              description=""
            />
          </section>
        ) : null}

        <ProductSurfaceRolePanel
          surface="toolResult"
          className="mt-8"
          title="工具结果必须接回长期判断闭环"
          description="一次工具结果只解决一个细分问题，读完后要继续深问、返回综合报告或进入一个下一工具，不能在这里断掉。"
          compact
        />

        <section className="mt-10">
          <PriorityDisclosure
            label="更多结果层"
            title="深度解释、质检、历史上下文和升级入口"
            description="读完当前建议后再展开这些内容，避免结果页一开始就变成运营面板。"
            defaultOpen
          >
            <div className="space-y-8">
              {deepDiveSections.length > 0 ? (
                <div className="workspace-panel p-6 md:p-8">
                  <div className="section-label">
                    <Sparkles className="h-3.5 w-3.5" />
                    深度解释
                  </div>
                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {deepDiveSections.map((section: { heading: string; body: string }) => (
                      <div key={section.heading} className="rounded-[1.5rem] bg-white/82 p-5">
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{section.heading}</div>
                        <div className="mt-3 text-xs leading-6 text-[color:var(--muted)]">{section.body}</div>
                      </div>
                    ))}
                  </div>
                  {llmEnhancement.conversionBridge ? (
                    <div className="mt-5 rounded-[1.5rem] border border-[color:var(--line)] bg-slate-50 px-5 py-4 text-sm leading-7 text-[color:var(--ink)]">
                      {String(llmEnhancement.conversionBridge)}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {quality || conversion ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {quality ? (
                    <ResultCard
                      title="自动质检"
                      value={`结果质量 ${String(quality.grade || 'B')}，评分 ${String(quality.score || 0)}。系统已检查行动建议、风险提醒、证据链和非决定论边界。`}
                    />
                  ) : null}
                  {conversion ? (
                    <ResultCard
                      title="承接强度"
                      value={`后续承接为 ${String(conversion.tier || 'medium')}，建议下一步：${String(conversion.nextBestAction || '继续深问')}。`}
                    />
                  ) : null}
                </div>
              ) : null}

              {memory ? (
                <ToolMemoryPanel
                  memory={memory}
                  title="这次结果已写入你的长期上下文"
                  description="后续工具会直接继承这些记录。"
                />
              ) : null}

              {tool.featuredBadge ? <ToolEditorialPanel tool={tool} /> : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
              </div>

              <ToolJourneyPanel
                tool={tool}
                title="接下来最值得继续测什么"
                description="沿着主问题、窗口、动作三步继续下钻。"
              />
              <ToolCaseStoriesPanel
                tool={tool}
                title="类似用户是怎么继续往下测的"
                description="用案例快速看清后续链路怎么承接。"
              />
              <ToolConversionPanel tool={tool} />
              <SurfaceJourneyPanel
                journey={journey}
                title={toolResultJourneyCopy.title}
                description={toolResultJourneyCopy.description}
                badge={entrySource ? `${sourceContext.guidanceLabel} · 来源已保留` : undefined}
              />
              <ToolPremiumDepthPanel
                tool={tool}
                offer={premiumOffer}
                reportId={report?.id}
                ctaStrategyKey={sourceCtaStrategy.strategyKey}
                sourceFamily={sourceCtaStrategy.sourceFamily}
              />
              <ToolPremiumRequestPanel tool={tool} reportId={report?.id} page={`/tool-result/${session.id}`} />
              {bundle ? <ToolBundlePanel bundle={bundle} page={`/tool-result/${session.id}`} /> : null}
              <ToolRecommendations
                report={report}
                page={`/tool-result/${session.id}`}
                title="继续下钻"
                description="一个看主问题，一个看窗口，一个看动作。"
                source={entrySource || `tool_result_followup:${tool.slug}`}
                ctaStrategyKey={sourceCtaStrategy.strategyKey}
                sourceFamily={sourceCtaStrategy.sourceFamily}
              />
            </div>
          </PriorityDisclosure>
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
