export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, BookOpenText, Bot, LockKeyhole, ScrollText, Sparkles, Target, FileQuestion, Layers, Wrench, BookOpen } from 'lucide-react';
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
import ReportAnchorRail, { type ReportAnchorRailItem } from '@/components/report/report-anchor-rail';
import ReportMetaSidebar from '@/components/report/report-meta-sidebar';
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

  // v5-D60 timeline 锚点
  const railItems: ReportAnchorRailItem[] = [
    { id: 'tr-cockpit', label: '结果总览', icon: Sparkles },
    { id: 'tr-summary', label: '免费摘要', icon: ScrollText },
    { id: 'tr-next', label: '下一步承接', icon: Target },
    { id: 'tr-growth', label: '深测路径', icon: LockKeyhole },
    { id: 'tr-deep', label: '更多结果层', icon: Layers },
    { id: 'tr-tools', label: '继续下钻', icon: Wrench },
    { id: 'tr-doc', label: '使用方法', icon: BookOpen },
  ];

  const sessionGeneratedAt = (session as { createdAt?: string }).createdAt
    || (session as { updatedAt?: string }).updatedAt
    || null;
  const qualityLabel = quality?.grade ? `质量 ${quality.grade}` : null;
  const qualityScore = typeof quality?.score === 'number' ? quality.score : null;

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="tool_result_viewed"
        page={`/tool-result/${session.id}`}
        meta={{ toolSlug: tool.slug, category: tool.category, reportId: session.reportId || null, source: entrySource || null }}
      />
      <SiteHeader ctaHref="/tools" ctaLabel="更多工具" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
          <ReportAnchorRail items={railItems} title="工具结果" />

          <div className="min-w-0 flex-1 lg:max-w-[680px] space-y-2">
            <section
              id="tr-cockpit"
              className="fb-card scroll-mt-header border-t-2 border-t-[color:var(--brand-strong)] p-4 md:p-5"
            >
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <Sparkles className="h-3.5 w-3.5" />
                {tool.title}
              </div>
              <h1 className="mt-2 text-[22px] md:text-[26px] font-bold leading-[1.34] text-[color:var(--ink-1)]">
                {String(result.headline || `${tool.shortTitle}结果已生成`)}
              </h1>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <ResultCard title="当前建议" value={String(result.recommendedAction || '先回到一个真实问题场景，不要把所有问题混在一起问。')} />
                <ResultCard title="风险提醒" value={String(result.riskReminder || '短周期结果要结合长期结构，不要当成唯一依据。')} />
                <ResultCard title="结果层级" value={String(result.confidenceLabel || '基础结构判断')} />
                <ResultCard title="匹配依据" value={String(result.whyItMatches || '它和你当前报告主轴更接近。')} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={toolChatHref}
                  className="fb-btn fb-btn-primary inline-flex items-center justify-center gap-1.5"
                >
                  <Bot className="h-4 w-4" />
                  继续深问
                </Link>
                <Link href={reportHref} className="fb-btn inline-flex items-center justify-center gap-1.5">返回综合判断</Link>
                <Link href="/tools" className="fb-btn inline-flex items-center justify-center gap-1.5">继续做别的工具</Link>
                <Link href="/docs/use-tools" className="fb-btn inline-flex items-center justify-center gap-1.5">
                  <BookOpenText className="h-4 w-4" />
                  使用方法
                </Link>
              </div>
            </section>

            <section
              id="tr-summary"
              className="fb-card scroll-mt-header border-t-2 border-t-[color:var(--brand-strong)] p-4 md:p-5"
            >
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <ScrollText className="h-3.5 w-3.5" />
                免费结果摘要
              </div>
              {typeof result.summary === 'string' && result.summary.trim() ? (
                <p className="mt-3 text-[14px] leading-[1.65] text-[color:var(--ink-2)]">
                  {result.summary.trim()}
                </p>
              ) : null}
              <div className="mt-3 grid gap-2">
                {Array.isArray(result.evidence) ? (result.evidence as string[]).map((item) => (
                  <div key={item} className="rounded-[3px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3 text-[13px] leading-[1.5] text-[color:var(--ink-1)]">
                    {item}
                  </div>
                )) : null}
              </div>
              {!(typeof result.summary === 'string' && result.summary.trim())
                && !(Array.isArray(result.evidence) && (result.evidence as string[]).length) ? (
                <p className="mt-3 text-[13px] leading-[1.5] text-[color:var(--ink-4)]">
                  本次结果以驾驶舱卡片为主；可点击「继续深问」把判断拆成可执行动作。
                </p>
              ) : null}
            </section>

            <section
              id="tr-next"
              className="fb-card scroll-mt-header border-t-2 border-t-[color:var(--brand-strong)] p-4 md:p-5"
            >
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <Sparkles className="h-3.5 w-3.5" />
                下一步承接
              </div>
              <div className="mt-3 grid gap-2">
                {Array.isArray(result.premiumPreview) ? (result.premiumPreview as string[]).map((item) => (
                  <div key={item} className="rounded-[3px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3 text-[13px] leading-[1.5] text-[color:var(--ink-1)]">
                    {item}
                  </div>
                )) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={toolChatHref}
                  className="fb-btn fb-btn-primary inline-flex items-center justify-center gap-1.5"
                >
                  <Bot className="h-4 w-4" />
                  继续深问
                </Link>
                <Link href={reportHref} className="fb-btn inline-flex items-center justify-center gap-1.5">
                  返回综合判断
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/tools" className="fb-btn inline-flex items-center justify-center gap-1.5">继续做别的工具</Link>
              </div>
            </section>

            {growthProfile ? (
              <section id="tr-growth" className="scroll-mt-header grid gap-3 xl:grid-cols-[1fr_0.95fr]">
                <div className="fb-card border-t-2 border-t-[color:var(--brand-strong)] p-4 md:p-5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                    <LockKeyhole className="h-3.5 w-3.5" />
                    免费结果之后
                  </div>
                  <h2 className="mt-2 text-[18px] md:text-[20px] font-bold leading-[1.34] text-[color:var(--ink-1)]">
                    这次免费测算先保存，再决定是否进入深测
                  </h2>
                  <p className="mt-2 text-[13px] leading-[1.5] text-[color:var(--ink-3)]">
                    {growthProfile.heroSubtitle}
                  </p>
                  <div className="mt-3 grid gap-2 md:grid-cols-3">
                    {growthProfile.upgradeBullets.map((item) => (
                      <div key={item} className="rounded-[3px] border border-dashed border-[color:var(--brand)] bg-[color:var(--brand-soft)] px-3 py-2 text-[12px] leading-[1.5] text-[color:var(--ink-1)]">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={toolChatHref} className="fb-btn fb-btn-primary inline-flex items-center justify-center gap-1.5">
                      <Bot className="h-4 w-4" />
                      继续深问深测边界
                    </Link>
                    <Link href={`/tools/${tool.slug}#faq`} className="fb-btn inline-flex items-center justify-center gap-1.5">
                      查看常见问题
                      <ArrowRight className="h-4 w-4" />
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
              title="工具结果必须接回长期判断闭环"
              description="一次工具结果只解决一个细分问题，读完后要继续深问、返回综合报告或进入一个下一工具，不能在这里断掉。"
              compact
            />

            <section id="tr-deep" className="scroll-mt-header">
              <PriorityDisclosure
                label="更多结果层"
                title="深度解释、质检、历史上下文和升级入口"
                description="读完当前建议后再展开这些内容，避免结果页一开始就变成运营面板。"
                defaultOpen
              >
                <div className="space-y-3">
                  {deepDiveSections.length > 0 ? (
                    <div className="fb-card p-4 md:p-5">
                      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                        <Sparkles className="h-3.5 w-3.5" />
                        深度解释
                      </div>
                      <div className="mt-3 grid gap-2 md:grid-cols-3">
                        {deepDiveSections.map((section: { heading: string; body: string }) => (
                          <div key={section.heading} className="rounded-[3px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3">
                            <div className="text-[13px] font-bold text-[color:var(--ink-1)]">{section.heading}</div>
                            <div className="mt-2 text-[12px] leading-[1.5] text-[color:var(--ink-4)]">{section.body}</div>
                          </div>
                        ))}
                      </div>
                      {llmEnhancement.conversionBridge ? (
                        <div className="mt-3 rounded-[3px] border border-[color:var(--hairline)] bg-[color:var(--brand-soft)] px-3 py-2 text-[13px] leading-[1.5] text-[color:var(--ink-1)]">
                          {String(llmEnhancement.conversionBridge)}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {quality || conversion ? (
                    <div className="grid gap-2 md:grid-cols-2">
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

                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {tool.freeInsights.map((item) => (
                      <div key={item} className="fb-card p-3">
                        <div className="text-[13px] font-bold text-[color:var(--ink-1)]">这次免费已回答</div>
                        <div className="mt-2 text-[13px] leading-[1.5] text-[color:var(--ink-4)]">{item}</div>
                      </div>
                    ))}
                    {tool.premiumModules.map((item) => (
                      <div key={item} className="rounded-[3px] border border-dashed border-[color:var(--brand)] bg-[color:var(--brand-soft)] p-3">
                        <div className="text-[13px] font-bold text-[color:var(--brand-strong)]">继续付费可展开</div>
                        <div className="mt-2 text-[12px] leading-[1.5] text-[color:var(--ink-1)]">{item}</div>
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
                  <div id="tr-tools" className="scroll-mt-header">
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
                </div>
              </PriorityDisclosure>
            </section>
          </div>

          <ReportMetaSidebar
            reportId={session.id}
            isPublic={false}
            generatedAt={sessionGeneratedAt}
            qualityLabel={qualityLabel}
            qualityScore={qualityScore}
            reportVersion={null}
            modelChainLabel={null}
            title="工具会话"
            extra={[
              { label: '工具', value: tool.shortTitle || tool.title },
              { label: '类别', value: tool.category || '通用' },
              ...(report ? [{ label: '关联报告', value: report.name || report.id.slice(0, 8) }] : []),
              ...(conversion?.tier ? [{ label: '承接强度', value: String(conversion.tier) }] : []),
            ]}
          >
            <section className="fb-card p-3">
              <div className="text-[13px] font-bold text-[color:var(--ink-1)] mb-2">快速跳转</div>
              <div className="flex flex-col gap-1.5 text-[13px]">
                <Link href={reportHref} className="text-[color:var(--brand-strong)] hover:underline">
                  ← 返回综合判断
                </Link>
                <Link href="/tools" className="text-[color:var(--brand-strong)] hover:underline">
                  浏览全部工具
                </Link>
                {bundle ? (
                  <Link href={`/tools/${tool.slug}`} className="text-[color:var(--brand-strong)] hover:underline">
                    查看工具详情
                  </Link>
                ) : null}
              </div>
            </section>
            <section className="fb-card p-3">
              <div className="text-[13px] font-bold text-[color:var(--ink-1)] mb-1">
                <FileQuestion className="inline h-3.5 w-3.5 text-[color:var(--brand-strong)] mr-1" />
                免费 vs 深测
              </div>
              <p className="text-[12px] leading-[1.5] text-[color:var(--ink-4)]">
                免费结果只回答一个核心问题，深测会展开多场景对比、长期窗口和动作清单。
              </p>
            </section>
          </ReportMetaSidebar>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function ResultCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="fb-card p-3">
      <div className="text-xs tracking-[0.14em] uppercase text-[color:var(--ink-4)]">{title}</div>
      <div className="mt-2 text-[13px] leading-[1.5] text-[color:var(--ink-1)]">{value}</div>
    </div>
  );
}
