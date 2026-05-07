export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bot, Layers3, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
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
import ToolLinkedContentPanel from '@/components/tool-linked-content-panel';
import ToolMemoryPanel from '@/components/tool-memory-panel';
import ToolPremiumDepthPanel from '@/components/tool-premium-depth-panel';
import ToolPremiumRequestPanel from '@/components/tool-premium-request-panel';
import ToolRecommendations from '@/components/tool-recommendations';
import ResultCtaLink from '@/components/result-cta-link';
import ToolRunner from '@/components/tool-runner';
import { getAuthSession } from '@/lib/auth';
import { buildChatHref } from '@/lib/chat-entry';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { buildSourceCtaStrategy, buildSourceJourneyCopy, getSourceContext } from '@/lib/source-context';
import { getCurrentUserId } from '@/lib/user-utils';
import { buildJourneyForTool } from '@/lib/surface-journeys';
import {
  createBreadcrumbSchema,
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { summarizeToolSessions } from '@/lib/tool-context';
import { buildToolPremiumOffer, getToolBundleForSlug, getToolDefinition, getToolGrowthProfile } from '@/lib/tools';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolDefinition(slug);
  if (!tool) {
    return createPublicContentMetadata({
      title: '单项工具 | 人生K线',
      description: '围绕具体问题组织的单项工具页。',
      path: `/tools/${slug}`,
      type: 'website',
    });
  }

  const growthProfile = getToolGrowthProfile(tool.slug);

  return createPublicContentMetadata({
    title: growthProfile?.seoTitle || `${tool.title} | 人生K线工具中心`,
    description: growthProfile?.seoDescription || `${tool.description}。适合：${tool.targetUser}。`,
    path: `/tools/${tool.slug}`,
    type: 'website',
    keywords: growthProfile?.keywords || [tool.title, tool.shortTitle, ...tool.hookKeywords],
    answerSummary: growthProfile?.heroSubtitle,
    searchIntents: growthProfile?.geoQuestions,
    entityKeywords: growthProfile?.keywords,
  });
}

export default async function ToolDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ source?: string; reportId?: string; ready?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const tool = getToolDefinition(slug);
  if (!tool) {
    notFound();
  }

  const session = await getAuthSession();
  const authenticated = !!session.authenticated && !!session.user?.id;
  const currentUserId = await getCurrentUserId();
  const userId = session.user?.id || currentUserId || null;
  const requestedReportId = resolvedSearchParams.reportId?.trim() || '';
  const requestedReport = requestedReportId ? fortuneOperations.getById(requestedReportId) : null;
  const latestReport = userId ? fortuneOperations.getByUserId(userId)[0] || null : null;
  const report = requestedReport && userId && requestedReport.userId === userId
    ? requestedReport
    : latestReport;
  const recentSessions = userId ? toolSessionOperations.listByUser(userId, 5) : [];
  const memory = summarizeToolSessions(recentSessions, report, 5);
  const premiumOffer = buildToolPremiumOffer(tool);
  const growthProfile = getToolGrowthProfile(tool.slug);
  const bundle = getToolBundleForSlug(tool.slug);
  const entrySource = resolvedSearchParams.source?.trim() || '';
  const sourceContext = getSourceContext(entrySource);
  const sourceCtaStrategy = buildSourceCtaStrategy(entrySource || `tool_detail:${tool.slug}`);
  const journey = buildJourneyForTool(tool, { source: entrySource || null });
  const imageUploadChatHref = tool.chatIntent === 'palmistry-reading'
    ? buildChatHref({
      intent: 'palmistry-reading',
      question: '请基于我上传的手相照片，只按可见掌纹、掌丘、手型和照片质量做相学文化观察，并说明哪些地方不能判断。',
      source: entrySource || `tool_detail:${tool.slug}`,
      ctaStrategyKey: sourceCtaStrategy.strategyKey,
      sourceFamily: sourceCtaStrategy.sourceFamily,
    })
    : tool.chatIntent === 'home-layout-diagnosis'
      ? buildChatHref({
        intent: 'home-layout-diagnosis',
        question: '请基于我上传的户型图，只按可见结构做户型问题诊断，并给出低成本调整优先级。',
        source: entrySource || `tool_detail:${tool.slug}`,
        ctaStrategyKey: sourceCtaStrategy.strategyKey,
        sourceFamily: sourceCtaStrategy.sourceFamily,
      })
      : '';
  const imageUploadPrimaryLabel = tool.chatIntent === 'palmistry-reading'
    ? '上传手相照片开始'
    : tool.chatIntent === 'home-layout-diagnosis'
      ? '上传户型图开始'
      : '';
  const toolJourneyCopy = buildSourceJourneyCopy(entrySource, {
    title: '下一步',
    description: '先完成当前单项判断，再顺着相关内容、升级服务和后续动作，把问题继续往下拆。',
  });
  const analyzeSource = entrySource ? `tool_detail:${entrySource}` : 'tool_detail';
  const analyzeEntryHref = `/analyze?intent=${encodeURIComponent(tool.chatIntent || tool.slug)}&toolSlug=${encodeURIComponent(tool.slug)}&source=${encodeURIComponent(analyzeSource)}`;
  const returningFromAnalyze = resolvedSearchParams.ready === '1' && !!report;
  const toolChatQuestion = `请围绕“${tool.shortTitle}”继续拆解：如果把这个问题落到我自己身上，现在更该推进、观察还是收手，先看哪一层，下一步最值得先做什么？`;
  const toolRunnerChatHref = buildChatHref({
    reportId: report?.id,
    intent: tool.chatIntent || tool.slug,
    question: toolChatQuestion,
    source: 'tool_detail_runner_tip_chat',
    ctaStrategyKey: sourceCtaStrategy.strategyKey,
    sourceFamily: sourceCtaStrategy.sourceFamily,
  });
  const runnerExamples = Array.from(new Set([
    tool.rightQuestion,
    tool.promptHint,
    `结合我的综合报告，先判断${tool.shortTitle}现在更偏推进、观察还是收缩。`,
  ].filter(Boolean)));
  const schemas = [
    createCollectionPageSchema({
      headline: tool.title,
      description: `${tool.description}。适合：${tool.targetUser}。`,
      path: `/tools/${tool.slug}`,
      keywords: [tool.title, tool.shortTitle, ...tool.hookKeywords],
    }),
    createBreadcrumbSchema([
      { name: '首页', path: '/' },
      { name: '工具中心', path: '/tools' },
      { name: growthProfile?.heroEyebrow || tool.title, path: `/tools/${tool.slug}` },
    ]),
    createItemListSchema(
      `${tool.title}常见问题`,
      tool.faqItems.map((item, index) => ({
        name: item.question,
        path: `/tools/${tool.slug}#faq`,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView
        eventName="tool_detail_viewed"
        page={`/tools/${tool.slug}`}
        meta={{ toolSlug: tool.slug, category: tool.category, source: entrySource || 'direct' }}
      />
      <SiteHeader ctaHref="/tools" ctaLabel="工具中心" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Layers3 className="h-3 w-3" />
              {growthProfile?.heroEyebrow || tool.themeLabel}
            </div>
            {growthProfile ? (
              <div className="mt-3 inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
                {growthProfile.stageLabel}
              </div>
            ) : null}
            <h1 className="mt-3 text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
              {growthProfile?.seoTitle.replace(/ \| 人生K线工具$/, '') || tool.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--ink-3)] md:text-base md:leading-7">
              {growthProfile?.heroSubtitle || tool.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(growthProfile?.keywords || tool.hookKeywords).map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2 text-[11px] font-semibold text-[color:var(--ink-4)]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ResultCtaLink
              href={imageUploadChatHref || (report ? '#tool-runner' : analyzeEntryHref)}
              page={`/tools/${tool.slug}`}
              target="tool_detail_primary_start"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
              meta={{ toolSlug: tool.slug, category: tool.category, source: imageUploadChatHref ? 'tool_detail_image_upload_chat' : report ? 'tool_detail_runner' : 'tool_detail_analyze_gate' }}
            >
              {growthProfile?.primaryCtaLabel || imageUploadPrimaryLabel || (report ? sourceCtaStrategy.toolPrimaryLabel : '先生成综合报告再开始')}
              <ArrowRight className="h-4 w-4" />
            </ResultCtaLink>
            <Link
              href={`/tools/category/${tool.category}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              返回该分类
            </Link>
            <Link
              href="/docs/use-tools"
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              使用方法
            </Link>
          </div>
        </section>

        {growthProfile ? (
          <section className="mt-6 grid gap-3 md:grid-cols-3">
            {growthProfile.freeValueBullets.map((item, index) => (
              <div
                key={item}
                className="rounded-[var(--radius-md)] border border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)] p-4"
              >
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
                  FREE VALUE {String(index + 1).padStart(2, '0')}
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--ink-2)]">{item}</p>
              </div>
            ))}
          </section>
        ) : null}

        <section id="tool-runner" className="mt-6 grid gap-8 xl:grid-cols-[1fr_1fr]">
          {imageUploadChatHref ? (
            <div className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[color:var(--paper)] p-5">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <Bot className="h-3.5 w-3.5" />
                图片上传入口
              </div>
              <h2 className="mt-3 text-2xl font-black text-[color:var(--ink)]">直接上传图片测算</h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                这个工具不需要先生成综合报告。进入聊天页后，系统会自动切到对应图片类型，并按当前专项边界处理上传内容。
              </p>
              <div className="mt-5 grid gap-3">
                <ResultCtaLink
                  href={imageUploadChatHref}
                  page={`/tools/${tool.slug}`}
                  target="tool_detail_image_upload_panel"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]"
                  meta={{ toolSlug: tool.slug, category: tool.category, chatIntent: tool.chatIntent || null }}
                >
                  {imageUploadPrimaryLabel || '上传图片测算'}
                  <ArrowRight className="h-4 w-4" />
                </ResultCtaLink>
                <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] rounded-[var(--radius)] px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">
                  手相只做可见掌纹、掌丘、手型和照片质量的相学文化观察；户型只做可见结构、动线、采光、收纳和形势问题诊断。
                </div>
              </div>
            </div>
          ) : (
            <ToolRunner
              toolSlug={tool.slug}
              reportId={report?.id}
              promptHint={tool.promptHint}
              signaturePromise={tool.signaturePromise}
              decisionLens={tool.decisionLens}
              examples={runnerExamples}
              analyzeHref={analyzeEntryHref}
              hasReport={!!report}
              entrySource={entrySource}
            />
          )}

          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6">
            {growthProfile ? (
              <div className="mb-5 rounded-[var(--radius-md)] border border-[color:var(--accent)] bg-[color:var(--accent-soft)]/70 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">冷启动转化路径</div>
                <div className="mt-3 grid gap-2 text-xs leading-6 text-[color:var(--ink)]">
                  <div>1. 免费测算先给结构判断和一个动作。</div>
                  <div>2. 结果页引导保存邮箱、历史记录和深测报告。</div>
                  <div>3. 通过 FAQ / 案例 / 社交问题回流到同一个工具。</div>
                </div>
              </div>
            ) : null}
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Sparkles className="h-3.5 w-3.5" />
              运行前确认
            </div>
            <div className="mt-4 grid gap-3">
              {returningFromAnalyze ? (
                <div className="rounded-[var(--radius)] border border-[rgba(47,125,82,0.20)] bg-[rgba(47,125,82,0.08)]/85 p-4 text-xs leading-6 text-[color:var(--data-up)]">
                  综合报告已经接回当前工具，可以直接运行。
                </div>
              ) : null}
              {entrySource ? (
                <div className="rounded-[var(--radius)] border border-[color:var(--accent)] bg-[color:var(--accent-soft)]/60 p-4 text-xs leading-6 text-[color:var(--accent-strong)]">
                  {`${sourceContext.guidanceLabel}：${sourceContext.toolHeadline}`}
                </div>
              ) : null}
              {!report && !imageUploadChatHref ? (
                <div className="rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)]/80 p-4 text-xs leading-6 text-[color:var(--signal-strong)]">
                  这个工具会读取你的综合报告来判断结构与阶段。先完成一次综合判断，再回来运行。
                </div>
              ) : null}
              {imageUploadChatHref ? (
                <div className="rounded-[var(--radius)] border border-[color:var(--accent)] bg-[color:var(--accent-soft)]/70 p-4 text-xs leading-6 text-[color:var(--accent-strong)]">
                  这个工具支持直接上传图片测算。点击“上传图片测算”会进入聊天页，并自动切到对应图片类型。
                </div>
              ) : null}
              <div className="rounded-[var(--radius)] bg-[color:var(--paper)] p-4 text-xs leading-6 text-[color:var(--ink)]">
                当前触发：{tool.triggerMoment}
              </div>
              <div className="rounded-[var(--radius)] bg-[color:var(--paper)] p-4 text-xs leading-6 text-[color:var(--ink)]">
                免费版输出：{tool.freeOutputFields.join('、')}
              </div>
              <div className="rounded-[var(--radius)] bg-[color:var(--paper)] p-4 text-xs leading-6 text-[color:var(--ink)]">
                深测会补：{tool.premiumOutputFields.join('、')}
              </div>
              <div className="text-xs font-bold text-[color:var(--brand-strong)] pt-2">更多入口</div>
              <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-2 flex flex-wrap gap-3 text-sm font-semibold">
                <ResultCtaLink
                  href={`/tools/category/${tool.category}`}
                  page={`/tools/${tool.slug}`}
                  target="tool_detail_runner_tip_category"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
                  meta={{ toolSlug: tool.slug, category: tool.category }}
                >
                  返回该分类
                </ResultCtaLink>
                <ResultCtaLink
                  href={imageUploadChatHref || toolRunnerChatHref}
                  page={`/tools/${tool.slug}`}
                  target="tool_detail_runner_tip_chat"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
                  meta={{ toolSlug: tool.slug, category: tool.category, chatIntent: tool.chatIntent || null }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    {imageUploadChatHref ? '上传图片测算' : '进入结构追问'}
                  </span>
                </ResultCtaLink>
                <ResultCtaLink
                  href="/analyze"
                  page={`/tools/${tool.slug}`}
                  target="tool_detail_runner_tip_analyze"
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
                  meta={{ toolSlug: tool.slug, category: tool.category }}
                >
                  重新做综合判断
                </ResultCtaLink>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <PriorityDisclosure
            label="问法说明"
            title="适合人群、错误问法和正确问法"
            description={entrySource ? sourceContext.toolDescription : '需要确认这个工具是否匹配当前问题时再展开。'}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['适合人群', tool.targetUser],
                ['优先帮你', tool.valuePromise],
                ['正确问法', tool.rightQuestion],
              ].map(([title, description]) => (
                <div key={title} className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
                  <div className="text-base font-bold text-[color:var(--ink)]">{title}</div>
                  <div className="mt-2 text-sm leading-6 text-[color:var(--ink)]">{description}</div>
                </div>
              ))}
            </div>
          </PriorityDisclosure>
        </section>

        <ProductSurfaceRolePanel
          surface="toolDetail"
          className="mt-8"
          title="工具详情页先判断是否适合运行"
          description="用户进入工具页时，最重要的是确认当前问题是否匹配、是否已有综合报告上下文，然后只运行一个工具。"
          compact
        />

        <section className="mt-10 space-y-4">
          <PriorityDisclosure
            label="更多内容"
            title="案例、FAQ、推荐和升级入口"
            description="这些内容在运行工具之后才有价值，默认收起。"
            defaultOpen
          >
            <div className="space-y-8">
              {authenticated && memory ? <ToolMemoryPanel memory={memory} /> : null}
              {tool.featuredBadge ? <ToolEditorialPanel tool={tool} /> : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {tool.freeInsights.slice(0, 2).map((item) => (
                  <div key={item} className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">免费先看</div>
                    <div className="mt-2 text-sm leading-6 text-[color:var(--ink)]">{item}</div>
                  </div>
                ))}
                {tool.premiumModules.slice(0, 2).map((item) => (
                  <div key={item} className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--accent)] bg-[color:var(--accent-soft)]/60 p-5">
                    <div className="text-sm font-semibold text-[color:var(--accent-strong)]">深测再展开</div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--ink)]">{item}</div>
                  </div>
                ))}
              </div>

              {growthProfile ? (
                <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">GEO 问答与社交分发</div>
                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <div>
                      <h2 className="text-2xl font-black text-[color:var(--ink)]">搜索和 AI 回答页要覆盖的问题</h2>
                      <div className="mt-4 grid gap-3">
                        {growthProfile.geoQuestions.map((item) => (
                          <div key={item} className="rounded-[var(--radius)] bg-[color:var(--paper)] px-4 py-4 text-sm leading-7 text-[color:var(--ink)]">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-[color:var(--ink)]">社交内容只导向一次免费测算</h2>
                      <div className="mt-4 grid gap-3">
                        {growthProfile.socialHooks.map((item) => (
                          <div key={item} className="rounded-[var(--radius)] border border-[color:var(--line)] bg-[color:var(--bg-elevated)] px-4 py-4 text-sm leading-7 text-[color:var(--ink)]">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              <ToolCaseStoriesPanel tool={tool} />
              <ToolConversionPanel tool={tool} />
              <ToolLinkedContentPanel tool={tool} page={`/tools/${tool.slug}`} />

              <div id="faq" className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  常见问题
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {tool.faqItems.slice(0, 4).map((item) => (
                    <div key={item.question} className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
                      <div className="text-base font-bold text-[color:var(--ink)]">{item.question}</div>
                      <div className="mt-2 text-sm leading-6 text-[color:var(--ink)]">{item.answer}</div>
                    </div>
                  ))}
                </div>
              </div>

              <ToolJourneyPanel tool={tool} />
              <SurfaceJourneyPanel
                journey={journey}
                title={toolJourneyCopy.title}
                description={toolJourneyCopy.description}
                badge={entrySource ? `${sourceContext.guidanceLabel} · 来源已保留` : undefined}
              />
              {growthProfile ? (
                <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">升级路径</div>
                  <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">
                    免费结果之后，优先转深测报告和留资复访
                  </h2>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {growthProfile.upgradeBullets.map((item) => (
                      <div key={item} className="rounded-[var(--radius)] border border-dashed border-[color:var(--accent)] bg-[color:var(--accent-soft)]/60 px-4 py-4 text-sm leading-7 text-[color:var(--ink)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
              <ToolPremiumDepthPanel
                tool={tool}
                offer={premiumOffer}
                reportId={report?.id}
                ctaStrategyKey={sourceCtaStrategy.strategyKey}
                sourceFamily={sourceCtaStrategy.sourceFamily}
              />
              <ToolPremiumRequestPanel tool={tool} reportId={report?.id} page={`/tools/${tool.slug}`} />
              {bundle ? <ToolBundlePanel bundle={bundle} page={`/tools/${tool.slug}`} /> : null}
              <ToolRecommendations
                report={report}
                page={`/tools/${tool.slug}`}
                title="下一步推荐"
                description="结合你当前的工具结果和已有报告，优先推荐最适合继续推进的关联工具与阅读路径。"
                source={entrySource || `tool_detail:${tool.slug}`}
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
