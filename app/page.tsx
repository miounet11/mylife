export const fetchCache = 'force-no-store';
export const revalidate = 0;

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, BookOpen, BookOpenText, Clock4, Compass, Sparkles } from 'lucide-react';

import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import PersonalGrowthPanel from '@/components/personal-growth-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import ToolCardLink from '@/components/tool-card-link';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Inline } from '@/components/ui/inline';
import { Lede } from '@/components/ui/lede';
import { Stack } from '@/components/ui/stack';
import { Stat } from '@/components/ui/stat';
import { Tag } from '@/components/ui/tag';
import { getFeaturedCaseStudies } from '@/lib/content-store';
import { getAuthSession } from '@/lib/auth';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { getCurrentUserId } from '@/lib/user-utils';
import { listFeaturedKnowledgeEditorialEntries } from '@/lib/knowledge-editorial';
import { buildPersonalGrowthHub } from '@/lib/personal-growth-hub';
import { createPublicContentMetadata } from '@/lib/public-content-seo';
import { getPriorityGrowthTools, getToolGrowthProfile } from '@/lib/tools';
import { productTrustSignals } from '@/lib/product-experience';

const FortuneForm = dynamic(() => import('@/components/fortune-form'), {
  loading: () => <FormSkeleton />,
});

export const metadata = {
  ...createPublicContentMetadata({
    title: '人生K线 | 看清你的结构、阶段、环境与下一步动作',
    description:
      '基于真太阳时校正与世界易判断框架，输出结构、阶段、环境和行动建议，帮助用户在复杂现实里重建判断秩序。',
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

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="home_page_viewed" page="/" meta={{ surfaceKey: 'landing' }} />
      <SiteHeader ctaHref="#analysis-form" ctaLabel="立即开始" />

      <main>
        {/* ─────────────────────────────────────────────
           段 1：HERO + 表单（决策台风入口）
           ───────────────────────────────────────────── */}
        <section className="page-frame pt-6 md:pt-10 scroll-mt-32" id="analysis-form">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
            <Stack gap={4}>
              <Eyebrow icon={<Sparkles className="h-3 w-3" />}>
                判断系统 · 决策台版本
              </Eyebrow>
              <h1 className="text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
                看清你的<span className="text-[color:var(--brand-strong)]">结构、阶段、环境</span>
                <br className="hidden md:block" />
                与下一步动作
              </h1>
              <Lede size="lg">
                输入出生时间和地点，先得到一页可读的结构、阶段与下一步判断；
                再决定是否进一步追问、记录事件或获取深度报告。
              </Lede>

              <Inline gap={2} wrap>
                {productTrustSignals.slice(0, 3).map((label) => (
                  <Tag key={label} tone="brand" variant="soft">
                    {label}
                  </Tag>
                ))}
              </Inline>

              <Inline gap={3} wrap className="pt-1">
                <Link
                  href="/docs/quick-start"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ink-3)] hover:text-[color:var(--brand-strong)]"
                >
                  <BookOpen className="h-4 w-4" />
                  使用方法
                </Link>
                <Link
                  href="/docs/birth-info"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[color:var(--ink-3)] hover:text-[color:var(--brand-strong)]"
                >
                  <Clock4 className="h-4 w-4" />
                  填写 tips
                </Link>
              </Inline>
            </Stack>

            <FortuneForm returnSource="home_direct" />
          </div>
        </section>

        {/* ─────────────────────────────────────────────
           段 2：价值证明（4 个 stat 横排，决策台核心）
           ───────────────────────────────────────────── */}
        <section className="page-frame mt-10 md:mt-14">
          <Card variant="default" padding="lg" className="bg-[color:var(--bg-elevated)]">
            <Eyebrow tone="muted" className="mb-4">
              判断系统的当前状态
            </Eyebrow>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              <Stat
                label="主报告版本"
                value="v3"
                hint="多 Agent 并发链路"
                size="lg"
              />
              <Stat
                label="模型 fallback"
                value="2 层"
                hint="grok-420-fast → gpt-5.2"
                size="lg"
              />
              <Stat
                label="时间精度"
                value="真太阳"
                hint="经纬度 + 节气分钟级"
                size="lg"
              />
              <Stat
                label="话术库"
                value="600+"
                hint="基于滴天髓·三命通会"
                size="lg"
              />
            </div>
          </Card>
        </section>

        {/* ─────────────────────────────────────────────
           段 3：高意图工具（仅在有时显示，金色铁律）
           ───────────────────────────────────────────── */}
        {priorityGrowthTools.length > 0 && (
          <section className="page-frame mt-10 md:mt-14">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <Eyebrow tone="signal" icon={<Sparkles className="h-3 w-3" />}>
                  免费高意图工具
                </Eyebrow>
                <h2 className="mt-2 text-xl font-black text-[color:var(--ink-1)] md:text-2xl">
                  不想先填完整报告？直接做这两个测试
                </h2>
              </div>
              <Link
                href="/tools"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[color:var(--brand-strong)] hover:text-[color:var(--brand-deep)]"
              >
                全部工具
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
                    className="group block rounded-[var(--radius-md)] border border-[color:var(--signal)] bg-[color:var(--paper)] p-5 transition hover:-translate-y-px hover:shadow-[var(--shadow-pop)]"
                  >
                    <Eyebrow tone="signal" className="mb-3">
                      {growthProfile?.heroEyebrow || tool.themeLabel}
                    </Eyebrow>
                    <h3 className="text-lg font-black leading-tight text-[color:var(--ink-1)]">
                      {tool.shortTitle}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[color:var(--ink-4)]">
                      {growthProfile?.heroSubtitle || tool.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[color:var(--signal-strong)] group-hover:gap-2 transition-all">
                      {growthProfile?.primaryCtaLabel || '开始免费测算'}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </ToolCardLink>
                );
              })}
            </div>
          </section>
        )}

        {/* ─────────────────────────────────────────────
           段 4：三栏内容入口（知识 / 案例 / 系统）
           ───────────────────────────────────────────── */}
        <section className="page-frame mt-10 md:mt-14">
          <div className="grid gap-4 md:grid-cols-3">
            {/* 知识 */}
            <Card variant="default" padding="lg">
              <Inline justify="between" align="center" className="mb-4">
                <Eyebrow>知识</Eyebrow>
                <Link
                  href="/knowledge"
                  className="text-xs font-semibold text-[color:var(--ink-4)] hover:text-[color:var(--brand-strong)]"
                >
                  全部 →
                </Link>
              </Inline>
              <Stack gap={3}>
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
                    className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 hover:border-[color:var(--brand)]"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                      {item.topicName || item.entry.category}
                    </div>
                    <div className="mt-1 text-sm font-bold leading-snug text-[color:var(--ink-2)]">
                      {item.entry.title}
                    </div>
                  </ContentCardLink>
                ))}
              </Stack>
            </Card>

            {/* 案例 */}
            <Card variant="default" padding="lg">
              <Inline justify="between" align="center" className="mb-4">
                <Eyebrow>案例</Eyebrow>
                <Link
                  href="/cases"
                  className="text-xs font-semibold text-[color:var(--ink-4)] hover:text-[color:var(--brand-strong)]"
                >
                  全部 →
                </Link>
              </Inline>
              <Stack gap={3}>
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
                    className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 hover:border-[color:var(--brand)]"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                      {item.scenario}
                    </div>
                    <div className="mt-1 text-sm font-bold leading-snug text-[color:var(--ink-2)]">
                      {item.title}
                    </div>
                  </ContentCardLink>
                ))}
              </Stack>
            </Card>

            {/* 系统 */}
            <Card variant="default" padding="lg">
              <Inline justify="between" align="center" className="mb-4">
                <Eyebrow>系统</Eyebrow>
                <Link
                  href="/world-yi"
                  className="text-xs font-semibold text-[color:var(--ink-4)] hover:text-[color:var(--brand-strong)]"
                >
                  全部 →
                </Link>
              </Inline>
              <Stack gap={3}>
                <Link
                  href="/world-yi"
                  className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 hover:border-[color:var(--brand)]"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                    World Yi
                  </div>
                  <div className="mt-1 text-sm font-bold leading-snug text-[color:var(--ink-2)]">
                    世界易系统总览：把判断、阶段、行动组织成一套现代框架
                  </div>
                </Link>
                <Link
                  href="/insights"
                  className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 hover:border-[color:var(--brand)]"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                    Insights
                  </div>
                  <div className="mt-1 text-sm font-bold leading-snug text-[color:var(--ink-2)]">
                    系统洞察：判断系统在不同决策场景中的工作方式
                  </div>
                </Link>
              </Stack>
            </Card>
          </div>
        </section>

        {/* ─────────────────────────────────────────────
           段 5：个人增长（条件渲染）
           ───────────────────────────────────────────── */}
        {hasPersonalHistory && (
          <section className="page-frame mt-10 md:mt-14">
            <PersonalGrowthPanel summary={personalGrowthHub} page="/" />
          </section>
        )}

        <div className="h-12 md:h-16" />
      </main>

      <SiteFooter />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-5">
      <div className="space-y-3">
        <div className="h-10 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
        <div className="h-10 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
        <div className="h-10 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
        <div className="h-16 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
        <div className="h-11 animate-pulse rounded-[var(--radius)] bg-[color:var(--bg-sunken)]" />
      </div>
    </div>
  );
}
