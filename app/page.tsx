export const fetchCache = 'force-no-store';
export const revalidate = 0;

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock4, Sparkles } from 'lucide-react';

import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import HomeLeftRail from '@/components/home/left-rail';
import HomeRightRail from '@/components/home/right-rail';
import HomeSampleAndFaq from '@/components/home/sample-and-faq';
import PersonalGrowthPanel from '@/components/personal-growth-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import TodayCardStrip from '@/components/today-card-strip';
import ToolCardLink from '@/components/tool-card-link';
import { getFeaturedCaseStudies } from '@/lib/content-store';
import { getAuthSession } from '@/lib/auth';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { getCurrentUserId } from '@/lib/user-utils';
import { listFeaturedKnowledgeEditorialEntries } from '@/lib/knowledge-editorial';
import { buildPersonalGrowthHub } from '@/lib/personal-growth-hub';
import { createPublicContentMetadata } from '@/lib/public-content-seo';
import { getPriorityGrowthTools, getToolGrowthProfile } from '@/lib/tools';
import { buildTodayCardMemoized } from '@/lib/today-card';

const FortuneForm = dynamic(() => import('@/components/fortune-form'), {
  loading: () => <FormSkeleton />,
});

export const metadata = {
  ...createPublicContentMetadata({
    title: '世界易学说 · 命理门户 | 八字 / 紫微 / 六爻 / 奇门 / 择日',
    description:
      '基于真太阳时校正与世界易判断框架的命理门户：一键排盘获取结构、阶段、行动建议，连通八字 / 紫微 / 六爻 / 奇门 / 择日工具与全球易学资料。',
    path: '/',
    type: 'website',
    languages: {
      'zh-CN': '/',
      'en-US': '/world-yi/en',
      'x-default': '/',
    },
  }),
  keywords: [
    '世界易学说',
    '命理门户',
    '生辰八字',
    '紫微斗数',
    '六爻',
    '奇门遁甲',
    '择日',
    '真太阳时',
    '命盘分析',
    '人生K线',
  ],
};

export default async function HomePage() {
  const featuredArticles = listFeaturedKnowledgeEditorialEntries(2);
  const featuredCases = getFeaturedCaseStudies(2);
  const session = await getAuthSession();
  const currentUserId = await getCurrentUserId();
  const activeUserId = session.user?.id || currentUserId || null;
  const initialReports = activeUserId ? fortuneOperations.getByUserId(activeUserId) : [];
  const initialToolSessions = activeUserId ? toolSessionOperations.listByUser(activeUserId, 10) : [];
  const hasPersonalHistory = initialReports.length > 0 || initialToolSessions.length > 0;
  const priorityGrowthTools = getPriorityGrowthTools();
  const personalGrowthHub = buildPersonalGrowthHub({
    reports: initialReports as any,
    toolSessions: initialToolSessions as any,
  });

  // v5-D37/D39 今日一签条带：SSR 预算所有档案的今日卡，前端只切 active
  const todayStripItems = initialReports
    .map((f) => {
      const card = buildTodayCardMemoized(f as any);
      return card ? { fortune: f, card } : null;
    })
    .filter(
      (x): x is { fortune: typeof initialReports[number]; card: NonNullable<ReturnType<typeof buildTodayCardMemoized>> } =>
        !!x
    );

  const leftRailReports = initialReports.slice(0, 8).map((r) => ({
    id: r.id,
    name: r.name,
    relation: (r as any).relation,
    relationLabel: (r as any).relationLabel,
  }));

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="home_page_viewed" page="/" meta={{ surfaceKey: 'landing' }} />
      <SiteHeader ctaHref="#analysis-form" ctaLabel="立即开始" />

      {/* ─────────────────────────────────────────────
         v5-D60 三栏门户首页：左 sticky 导航 / 中流 News Feed / 右 sticky trending
         ───────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-[1180px] px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
          <HomeLeftRail
            reports={leftRailReports}
            hasPersonalHistory={hasPersonalHistory}
          />

          {/* 中流 News Feed */}
          <div className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-[540px]">
            {/* 段 0：HERO + 表单（FB Composer 风） */}
            <section
              id="analysis-form"
              className="fb-card scroll-mt-24 overflow-hidden"
            >
              <div className="border-b border-[color:var(--fb-border-strong)] bg-white px-4 py-3">
                <div className="fb-section-title flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[color:var(--fb-blue)]" />
                  世界易学说 · 命理门户
                </div>
                <h1 className="mt-1.5 text-[22px] font-bold leading-[1.25] text-[color:var(--fb-ink-1)]">
                  一处看清你的<span className="text-[color:var(--fb-blue-deep)]">结构、阶段与下一步</span>
                </h1>
                <p className="mt-2 text-[14px] leading-[1.55] text-[color:var(--fb-ink-2)]">
                  输入出生时间和地点，先得到一页可读的结构、阶段与行动判断；
                  再决定要不要追问、记录事件或调用八字 / 紫微 / 六爻 / 奇门 / 择日工具。
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[color:var(--fb-ink-2)]">
                  <Link
                    href="/docs/quick-start"
                    className="inline-flex items-center gap-1 font-semibold text-[color:var(--fb-blue-link)] hover:underline"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    使用方法
                  </Link>
                  <Link
                    href="/docs/birth-info"
                    className="inline-flex items-center gap-1 font-semibold text-[color:var(--fb-blue-link)] hover:underline"
                  >
                    <Clock4 className="h-3.5 w-3.5" />
                    填写 tips
                  </Link>
                </div>
              </div>
              <div className="px-4 py-4">
                <FortuneForm returnSource="home_direct" />
              </div>
            </section>

            {/* 段 1：今日一签条带 */}
            {todayStripItems.length > 0 && (
              <section
                id="today-strip"
                className="fb-card overflow-hidden"
              >
                <div className="border-b border-[color:var(--fb-border)] bg-[color:var(--fb-action-bg)] px-3 py-2">
                  <div className="fb-section-title">今日一签 · 多档案</div>
                </div>
                <div className="px-3 py-3">
                  <TodayCardStrip items={todayStripItems as any} page="/" />
                </div>
              </section>
            )}

            {/* 段 2：示例预览 + FAQ（单列内嵌两卡） */}
            <HomeSampleAndFaq />

            {/* 段 3：高意图工具 */}
            {priorityGrowthTools.length > 0 && (
              <section
                id="priority-tools"
                className="fb-card overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-[color:var(--fb-border)] bg-[color:var(--fb-action-bg)] px-3 py-2">
                  <div className="fb-section-title">免费高意图工具</div>
                  <Link
                    href="/tools"
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:underline"
                  >
                    全部工具
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="px-4 py-3">
                  <h2 className="mb-2 text-[16px] font-bold leading-snug text-[color:var(--fb-ink-1)]">
                    不想先填完整报告？直接做这两个测试
                  </h2>
                  <div className="grid gap-2 sm:grid-cols-2">
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
                          className="group block rounded-[3px] border border-[color:var(--fb-border)] bg-white p-3 hover:border-[color:var(--fb-blue)] hover:no-underline"
                        >
                          <div className="text-[11px] font-semibold text-[color:var(--fb-ink-3)]">
                            {growthProfile?.heroEyebrow || tool.themeLabel}
                          </div>
                          <h3 className="mt-1 text-[14px] font-bold leading-tight text-[color:var(--fb-ink-1)]">
                            {tool.shortTitle}
                          </h3>
                          <p className="mt-1 line-clamp-3 text-[12px] leading-[1.5] text-[color:var(--fb-ink-3)]">
                            {growthProfile?.heroSubtitle || tool.description}
                          </p>
                          <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[color:var(--fb-blue-link)] group-hover:underline">
                            {growthProfile?.primaryCtaLabel || '开始免费测算'}
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </ToolCardLink>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* 段 4：三栏内容入口（知识 / 案例 / 系统）— 在中流内仍保留为三个独立卡 */}
            <section id="content-trio" className="flex flex-col gap-2">
              {/* 知识 */}
              <article className="fb-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-[color:var(--fb-border)] bg-[color:var(--fb-action-bg)] px-3 py-2">
                  <div className="fb-section-title">知识</div>
                  <Link
                    href="/knowledge"
                    className="text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:underline"
                  >
                    全部
                  </Link>
                </div>
                <ul className="flex flex-col">
                  {featuredArticles.map((item, idx) => (
                    <li
                      key={item.entry.slug}
                      className={idx > 0 ? 'border-t border-[color:var(--fb-border)]' : ''}
                    >
                      <ContentCardLink
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
                        className="block px-4 py-2 hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
                      >
                        <div className="text-[11px] font-semibold text-[color:var(--fb-ink-3)]">
                          {item.topicName || item.entry.category}
                        </div>
                        <div className="mt-0.5 text-[13px] font-bold leading-[1.4] text-[color:var(--fb-ink-1)]">
                          {item.entry.title}
                        </div>
                      </ContentCardLink>
                    </li>
                  ))}
                </ul>
              </article>

              {/* 案例 */}
              <article className="fb-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-[color:var(--fb-border)] bg-[color:var(--fb-action-bg)] px-3 py-2">
                  <div className="fb-section-title">案例</div>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/reports"
                      className="text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:underline"
                    >
                      公开结果
                    </Link>
                    <Link
                      href="/cases"
                      className="text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:underline"
                    >
                      全部
                    </Link>
                  </div>
                </div>
                <ul className="flex flex-col">
                  {featuredCases.map((item, idx) => (
                    <li
                      key={item.slug}
                      className={idx > 0 ? 'border-t border-[color:var(--fb-border)]' : ''}
                    >
                      <ContentCardLink
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
                        className="block px-4 py-2 hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
                      >
                        <div className="text-[11px] font-semibold text-[color:var(--fb-ink-3)]">
                          {item.scenario}
                        </div>
                        <div className="mt-0.5 text-[13px] font-bold leading-[1.4] text-[color:var(--fb-ink-1)]">
                          {item.title}
                        </div>
                      </ContentCardLink>
                    </li>
                  ))}
                </ul>
              </article>

              {/* 系统 */}
              <article className="fb-card overflow-hidden">
                <div className="flex items-center justify-between border-b border-[color:var(--fb-border)] bg-[color:var(--fb-action-bg)] px-3 py-2">
                  <div className="fb-section-title">系统</div>
                  <Link
                    href="/world-yi"
                    className="text-[12px] font-semibold text-[color:var(--fb-blue-link)] hover:underline"
                  >
                    全部
                  </Link>
                </div>
                <ul className="flex flex-col">
                  <li>
                    <Link
                      href="/world-yi"
                      className="block px-4 py-2 hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
                    >
                      <div className="text-[11px] font-semibold text-[color:var(--fb-ink-3)]">
                        World Yi
                      </div>
                      <div className="mt-0.5 text-[13px] font-bold leading-[1.4] text-[color:var(--fb-ink-1)]">
                        世界易系统总览：把判断、阶段、行动组织成现代框架
                      </div>
                    </Link>
                  </li>
                  <li className="border-t border-[color:var(--fb-border)]">
                    <Link
                      href="/insights"
                      className="block px-4 py-2 hover:bg-[color:var(--fb-action-bg)] hover:no-underline"
                    >
                      <div className="text-[11px] font-semibold text-[color:var(--fb-ink-3)]">
                        Insights
                      </div>
                      <div className="mt-0.5 text-[13px] font-bold leading-[1.4] text-[color:var(--fb-ink-1)]">
                        系统洞察：判断系统在不同决策场景中的工作方式
                      </div>
                    </Link>
                  </li>
                </ul>
              </article>
            </section>

            {/* 段 5：个人增长（条件渲染） */}
            {hasPersonalHistory && (
              <section className="fb-card overflow-hidden">
                <div className="border-b border-[color:var(--fb-border)] bg-[color:var(--fb-action-bg)] px-3 py-2">
                  <div className="fb-section-title">个人增长</div>
                </div>
                <div className="px-3 py-3">
                  <PersonalGrowthPanel summary={personalGrowthHub} page="/" />
                </div>
              </section>
            )}

            {/* 移动端：右栏在中流尾部继续渲染（lg:hidden） */}
            <div className="lg:hidden">
              <HomeRightRail
                featuredArticles={featuredArticles}
                featuredCases={featuredCases}
              />
            </div>
          </div>

          {/* 桌面右栏 sticky */}
          <div className="hidden lg:block">
            <HomeRightRail
              featuredArticles={featuredArticles}
              featuredCases={featuredCases}
            />
          </div>
        </div>

        <div className="h-8" />
      </main>

      <SiteFooter />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="rounded-[3px] border border-[color:var(--fb-border)] bg-white px-3 py-3">
      <div className="space-y-3">
        <div className="h-px animate-pulse bg-[color:var(--fb-action-bg)]" />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="h-[88px] animate-pulse rounded-[3px] bg-[color:var(--fb-action-bg)]" />
          <div className="h-[88px] animate-pulse rounded-[3px] bg-[color:var(--fb-action-bg)]" />
        </div>
        <div className="h-[60px] animate-pulse rounded-[3px] bg-[color:var(--fb-action-bg)]" />
        <div className="h-10 animate-pulse rounded-[3px] bg-[color:var(--fb-action-bg)]" />
      </div>
    </div>
  );
}
