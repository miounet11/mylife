export const fetchCache = 'force-no-store';
export const revalidate = 0;

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarClock, Compass, Globe2, Layers3, ShieldCheck, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import PersonalGrowthPanel from '@/components/personal-growth-panel';
import PriorityDisclosure from '@/components/priority-disclosure';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import SurfaceJourneyPanel from '@/components/surface-journey-panel';
import ToolCardLink from '@/components/tool-card-link';
import UpdatesStatusPanel from '@/components/updates-status-panel';
import { getFeaturedCaseStudies } from '@/lib/content-store';
import { getAuthSession } from '@/lib/auth';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { getCurrentUserId } from '@/lib/user-utils';
import { listFeaturedKnowledgeEditorialEntries } from '@/lib/knowledge-editorial';
import { buildPersonalGrowthHub } from '@/lib/personal-growth-hub';
import { createPublicContentMetadata } from '@/lib/public-content-seo';
import { buildPersonalizedJourney } from '@/lib/surface-journeys';
import { getPriorityGrowthTools, getToolGrowthProfile } from '@/lib/tools';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import {
  productActivationPath,
  productPurposePaths,
  productTrustSignals,
} from '@/lib/product-experience';

const FortuneForm = dynamic(() => import('@/components/fortune-form'), {
  loading: () => <FormSkeleton />,
});

export const metadata = {
  ...createPublicContentMetadata({
    title: '人生K线 | 看清你的结构、阶段、环境与下一步动作',
    description: '基于真太阳时校正与世界易判断框架，输出结构、阶段、环境和行动建议，帮助用户在复杂现实里重建判断秩序。',
    path: '/',
    type: 'website',
    languages: {
      'zh-CN': '/',
      'en-US': '/world-yi/en',
      'x-default': '/',
    },
  }),
  keywords: ['真太阳时', '世界易', '判断系统', '人生决策', '结构分析', '阶段判断'],
};

const iconMap = {
  birth: CalendarClock,
  overview: Compass,
  deepen: Sparkles,
  tool: ShieldCheck,
  validate: ShieldCheck,
  learn: BookOpen,
  system: Globe2,
  visual: Layers3,
} as const;

export default async function HomePage() {
  const featuredArticles = listFeaturedKnowledgeEditorialEntries(2);
  const featuredCases = getFeaturedCaseStudies(2);
  const session = await getAuthSession();
  const initialAuthenticated = !!session.authenticated && !!session.user?.id;
  const currentUserId = await getCurrentUserId();
  const activeUserId = session.user?.id || currentUserId || null;
  const initialReports = activeUserId ? fortuneOperations.getByUserId(activeUserId) : [];
  const initialToolSessions = activeUserId ? toolSessionOperations.listByUser(activeUserId, 10) : [];
  const hasPersonalHistory = initialReports.length > 0 || initialToolSessions.length > 0;
  const shouldRenderPersonalGrowthPanel = hasPersonalHistory;
  const initialSummary = activeUserId
    ? buildUpdatesSummary({
        userId: activeUserId,
        email: session.user?.email,
      })
    : null;
  const personalizedJourney = buildPersonalizedJourney({
    reports: initialReports as any,
    toolSessions: initialToolSessions as any,
  });
  const priorityGrowthTools = getPriorityGrowthTools();
  const personalGrowthHub = buildPersonalGrowthHub({
    reports: initialReports as any,
    toolSessions: initialToolSessions as any,
  });

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="home_page_viewed" page="/" meta={{ surfaceKey: 'landing' }} />
      <SiteHeader ctaHref="#analysis-form" ctaLabel="立即开始" />

      <main>
        <section className="page-frame py-3 md:py-5" id="analysis-form">
          <div className="mb-2 flex flex-col gap-2 md:mb-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <div className="hidden section-label md:inline-flex">
                <Sparkles className="h-3.5 w-3.5" />
                填写出生信息
              </div>
              <h1 className="text-2xl font-black leading-tight text-[color:var(--ink)] md:mt-2 md:text-5xl">
                填出生信息，生成
                <span className="text-[color:var(--accent-strong)]">人生结构总览</span>
              </h1>
              <p className="mt-1 text-sm leading-6 text-[color:var(--muted)] md:mt-2 md:text-base">
                输入出生时间和地点，先得到一页可读的结构、阶段与下一步判断。
              </p>
            </div>
            <div className="hidden flex-wrap gap-2 md:flex md:justify-end">
              {productTrustSignals.slice(0, 3).map((label) => (
                <div key={label} className="signal-pill">
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="workspace-panel border-[rgba(18,125,111,0.28)] p-1.5 shadow-[0_14px_36px_rgba(11,95,85,0.10)] md:p-3">
            <FortuneForm returnSource="home_direct" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/docs/quick-start" className="action-secondary min-h-0 px-3 py-2 text-xs">
              使用方法
            </Link>
            <Link href="/docs/birth-info" className="action-secondary min-h-0 px-3 py-2 text-xs">
              填写 tips
            </Link>
          </div>

          <PriorityDisclosure
            label="生成后"
            title="再看报告、追问和工具"
            description="这些路径不占用首屏，填完信息后再选择。"
            className="mt-4"
          >
            <div className="grid gap-3 md:grid-cols-3">
              {productActivationPath.slice(0, 3).map((step, index) => {
                const Icon = iconMap[step.icon];
                return (
                  <Link key={step.title} href={step.href} className="interactive-card rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="route-index">0{index + 1}</div>
                      <Icon className="h-4 w-4 text-[color:var(--accent-strong)]" />
                    </div>
                    <div className="mt-3 text-base font-semibold text-[color:var(--ink)]">{step.title}</div>
                  </Link>
                );
              })}
            </div>
          </PriorityDisclosure>
        </section>

        {priorityGrowthTools.length > 0 ? (
          <section className="page-frame pb-4 md:pb-6">
            <div className="rounded-[2rem] border border-[color:var(--accent)] bg-[color:var(--accent-soft)]/70 p-5 md:p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div className="max-w-3xl">
                  <div className="section-label">
                    <Sparkles className="h-3.5 w-3.5" />
                    免费高意图工具
                  </div>
                  <h2 className="mt-3 text-2xl font-black leading-tight text-[color:var(--ink)] md:text-3xl">
                    不想先填完整报告，也可以直接做这两个测试
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">
                    年度窗口和手相上传先给免费结构结果，再接回综合判断、继续深问和深测承接。
                  </p>
                </div>
                <Link href="/tools" className="action-secondary shrink-0">
                  查看全部工具
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {priorityGrowthTools.map((tool) => {
                  const growthProfile = getToolGrowthProfile(tool.slug);
                  return (
                    <ToolCardLink
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      toolSlug={tool.slug}
                      category={tool.category}
                      page="/"
                      source={`home_priority_growth:${tool.slug}`}
                      className="block rounded-[1.5rem] border border-[color:var(--accent)] bg-white/86 p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className="text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
                        {growthProfile?.heroEyebrow || tool.themeLabel}
                      </div>
                      <h3 className="mt-3 text-2xl font-black leading-tight text-[color:var(--ink)]">
                        {tool.shortTitle}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-[color:var(--muted)]">
                        {growthProfile?.heroSubtitle || tool.description}
                      </p>
                      <div className="action-guide mt-4 inline-flex items-center gap-2">
                        {growthProfile?.primaryCtaLabel || '开始免费测算'}
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </ToolCardLink>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        <section className="page-frame pb-4 md:pb-6">
          <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
            <UpdatesStatusPanel
              title="最近记录与更新"
              description="如果你不是第一次来，这里会接住之前的报告、升级和提醒状态，方便你直接续上。"
              initialAuthenticated={initialAuthenticated}
              initialSummary={initialSummary}
              compact
            />

            <div className="soft-card rounded-[1.75rem] p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="section-label">新内容</div>
                  <h2 className="mt-3 text-2xl font-black text-[color:var(--ink)]">最近值得看的内容</h2>
                </div>
                <Link href="/knowledge" className="action-secondary shrink-0">
                  全部知识
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {featuredArticles.map((item) => (
                  <ContentCardLink
                    key={item.entry.slug}
                    href={`/knowledge/${item.entry.slug}`}
                    page="/"
                    meta={{
                      surfaceKey: 'home_latest_learning',
                      contentType: 'knowledge',
                      slug: item.entry.slug,
                      title: item.entry.title,
                      category: item.entry.category,
                      tags: item.entry.tags,
                      topicName: item.topicName,
                      synthesisType: item.synthesisType,
                      editorialTier: item.editorialTier,
                    }}
                    className="rounded-[1.25rem] bg-white/80 p-4 transition hover:bg-white"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">
                      {item.topicName || item.entry.category}
                    </div>
                    <div className="mt-2 text-base font-bold text-[color:var(--ink)]">{item.entry.title}</div>
                  </ContentCardLink>
                ))}

                {featuredCases.map((item) => (
                  <ContentCardLink
                    key={item.slug}
                    href={`/cases/${item.slug}`}
                    page="/"
                    meta={{
                      surfaceKey: 'home_latest_learning',
                      contentType: 'case',
                      slug: item.slug,
                      title: item.title,
                      category: item.scenario,
                      tags: item.tags,
                    }}
                    className="rounded-[1.25rem] bg-white/80 p-4 transition hover:bg-white"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.scenario}</div>
                    <div className="mt-2 text-base font-bold text-[color:var(--ink)]">{item.title}</div>
                  </ContentCardLink>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="page-frame py-6 md:py-8">
          <ProductSurfaceRolePanel
            surface="home"
            title="首页只承担第一步：让用户快速开始"
            description="首屏直接给出生辰输入和最短路径，学习、工具、世界易、图片说明全部作为后续分流，避免新用户一进来就失去方向。"
            compact
          />
        </section>

        {shouldRenderPersonalGrowthPanel ? (
          <section className="page-frame py-6 md:py-8">
            <PersonalGrowthPanel summary={personalGrowthHub} page="/" />
          </section>
        ) : null}

        <section className="page-frame space-y-4 py-6 pb-16 md:py-8 md:pb-20">
          <PriorityDisclosure
            label="更多路径"
            title="暂时不填写时，再打开这些入口"
            description="这些是补充路径，不再占用首页主视线。"
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {productPurposePaths.slice(1).map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <Link key={item.title} href={item.href} className="interactive-card p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-[color:var(--muted)]" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-[color:var(--ink)]">{item.title}</h3>
                    <div className="action-guide mt-5">{item.action}</div>
                  </Link>
                );
              })}
            </div>
          </PriorityDisclosure>

          <SurfaceJourneyPanel
            journey={personalizedJourney.journey}
            title={personalizedJourney.heading}
            description="按你当前所处阶段，把公开内容、工具和行动入口重新排成一条更顺的下一步路径。"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-4xl rounded-[1.75rem] bg-white/80 p-6 shadow-[0_10px_28px_rgba(23,32,51,0.06)]">
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-12 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-20 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-14 animate-pulse rounded-full bg-slate-300" />
      </div>
    </div>
  );
}
