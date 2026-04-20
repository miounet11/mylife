export const fetchCache = 'force-no-store';
export const revalidate = 0;

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarClock, Compass, Globe2, Layers3, Network, ShieldCheck, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentLocaleBadge from '@/components/content-locale-badge';
import PersonalGrowthPanel from '@/components/personal-growth-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import SurfaceJourneyPanel from '@/components/surface-journey-panel';
import UpdatesStatusPanel from '@/components/updates-status-panel';
import {
  getFeaturedCaseStudies,
  getFeaturedEntityInsights,
  isPublicKnowledgeEntry,
  listPublishedManagedContentEntriesByType,
} from '@/lib/content-store';
import { getAuthSession } from '@/lib/auth';
import { getEntityTypeLabel } from '@/lib/content';
import { getContentLocalePresentation, getLocaleAnchorId, type ContentLocaleGroupKey } from '@/lib/content-locale';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { listFeaturedKnowledgeEditorialEntries, listFeaturedKnowledgeTopicHubs } from '@/lib/knowledge-editorial';
import { buildPersonalGrowthHub } from '@/lib/personal-growth-hub';
import { createPublicContentMetadata } from '@/lib/public-content-seo';
import { buildPersonalizedJourney } from '@/lib/surface-journeys';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

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

const proofItems = [
  { label: '真太阳时修正' },
  { label: '结构 + 阶段 + 动作' },
  { label: '默认私密，可选分享' },
];

const journeySteps = [
  {
    title: '结构',
    icon: Compass,
  },
  {
    title: '阶段',
    icon: CalendarClock,
  },
  {
    title: '动作',
    icon: ShieldCheck,
  },
];

const worldYiDoctrinePoints = [
  {
    title: '十卷主书初版',
    icon: BookOpen,
  },
  {
    title: '人生六域',
    icon: Compass,
  },
  {
    title: '全球与英文层',
    icon: Globe2,
  },
  {
    title: '内容矩阵',
    icon: Layers3,
  },
];

const worldYiPowerLinks = [
  { label: '单项工具中心', href: '/tools' },
  { label: '世界易总入口', href: '/world-yi' },
  { label: '十卷主书工程', href: '/world-yi/book' },
  { label: '人生六域入口', href: '/world-yi/domains' },
  { label: '全球华人路径', href: '/world-yi/global' },
  { label: '首批 120 篇矩阵', href: '/world-yi/matrix' },
  { label: '发布架构', href: '/world-yi/publish' },
];

export default async function HomePage() {
  const worldYiStats = getWorldYiPublicStats();
  const featuredArticles = listFeaturedKnowledgeEditorialEntries(2);
  const featuredTopicHubs = listFeaturedKnowledgeTopicHubs(2);
  const featuredCases = getFeaturedCaseStudies(2);
  const featuredInsights = getFeaturedEntityInsights(3);
  const localePathTargets = [
    {
      key: 'en' as ContentLocaleGroupKey,
      title: 'English Readers',
      description: 'For global professionals, overseas-born Chinese, and English-speaking readers exploring Bazi with a practical lens.',
      knowledgeHref: `/knowledge#${getLocaleAnchorId('en')}`,
      casesHref: `/cases#${getLocaleAnchorId('en')}`,
    },
    {
      key: 'zh-Hant' as ContentLocaleGroupKey,
      title: '繁體中文讀者',
      description: '面向台灣、香港與偏好繁體中文閱讀的用戶，優先看到更自然的語感與情境。',
      knowledgeHref: `/knowledge#${getLocaleAnchorId('zh-Hant')}`,
      casesHref: `/cases#${getLocaleAnchorId('zh-Hant')}`,
    },
    {
      key: 'zh-Hans' as ContentLocaleGroupKey,
      title: '简体中文读者',
      description: '面向中国大陆、海外华人和偏好简体中文阅读的用户，先看最核心的知识与案例。',
      knowledgeHref: `/knowledge#${getLocaleAnchorId('zh-Hans')}`,
      casesHref: `/cases#${getLocaleAnchorId('zh-Hans')}`,
    },
  ];
  const localeSpotlights = [...listPublishedManagedContentEntriesByType('knowledge').filter((entry) => isPublicKnowledgeEntry(entry)), ...listPublishedManagedContentEntriesByType('case')]
    .reduce<Record<ContentLocaleGroupKey, { title: string; href: string; locale: string; market: string; typeLabel: string } | null>>((accumulator, entry) => {
      const locale = typeof entry.meta?.locale === 'string' ? entry.meta.locale : '';
      const market = typeof entry.meta?.market === 'string' ? entry.meta.market : '';
      const presentation = getContentLocalePresentation(locale, market);
      if (accumulator[presentation.groupKey]) {
        return accumulator;
      }

      accumulator[presentation.groupKey] = {
        title: entry.title,
        href: entry.contentType === 'knowledge' ? `/knowledge/${entry.slug}` : `/cases/${entry.slug}`,
        locale,
        market,
        typeLabel: entry.contentType === 'knowledge' ? '知识入口' : '案例入口',
      };
      return accumulator;
    }, { en: null, 'zh-Hant': null, 'zh-Hans': null });
  const session = await getAuthSession();
  const initialAuthenticated = !!session.authenticated && !!session.user?.id;
  const initialReports = initialAuthenticated && session.user?.id ? fortuneOperations.getByUserId(session.user.id) : [];
  const initialToolSessions = initialAuthenticated && session.user?.id ? toolSessionOperations.listByUser(session.user.id, 10) : [];
  const hasPersonalHistory = initialReports.length > 0 || initialToolSessions.length > 0;
  const shouldRenderPersonalGrowthPanel = initialAuthenticated && hasPersonalHistory;
  const initialSummary = initialAuthenticated && session.user?.id
    ? buildUpdatesSummary({
        userId: session.user.id,
        email: session.user.email,
      })
    : null;
  const personalizedJourney = buildPersonalizedJourney({
    reports: initialReports as any,
    toolSessions: initialToolSessions as any,
  });
  const personalGrowthHub = buildPersonalGrowthHub({
    reports: initialReports as any,
    toolSessions: initialToolSessions as any,
  });
  const worldYiScaleCards = [
    { label: '当前公开总量', value: `${worldYiStats.publicContentCount} 篇` },
    { label: '知识主干', value: `${worldYiStats.publicKnowledgeCount} 篇` },
    { label: '案例层', value: `${worldYiStats.publicCaseCount} 篇` },
    { label: '环境洞察', value: `${worldYiStats.publicInsightCount} 篇` },
    { label: '全球与英文', value: `${worldYiStats.globalTopicCount + worldYiStats.englishTrackCount} 组入口` },
    { label: '公开入口', value: `${worldYiStats.publicRouteCount} 个` },
  ];

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="home_page_viewed" page="/" meta={{ surfaceKey: 'landing' }} />
      <SiteHeader ctaHref="#analysis-form" ctaLabel="立即开始" />

      <main>
        <section className="page-frame py-10 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="space-y-6">
              <div className="section-label">
                <Sparkles className="h-3.5 w-3.5" />
                个人分析
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black leading-tight text-[color:var(--ink)] md:text-6xl">
                  结构、阶段、环境、
                  <span className="font-serif text-[color:var(--accent-strong)]">下一步动作</span>
                </h1>
                <p className="hero-description">
                  先用出生信息建立个人底盘，再把结果落到现实问题上。首页应该直接把你带向判断，而不是让你先在一堆内容块里迷路。
                </p>
              </div>

              <div className="space-y-3">
                <div className="action-guide">现在开始</div>
                <div className="flex flex-wrap gap-3">
                  <Link href="#analysis-form" className="action-primary action-main">
                    开始一次判断
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                  <Link href="/cases" className="action-secondary">
                    先看真实案例
                  </Link>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6 md:p-8">
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">本次输出</div>
                  <div className="mt-1 text-2xl font-bold text-[color:var(--ink)]">结构、阶段、动作</div>
                </div>

                <div className="grid gap-3">
                {[
                  ['01', '结构'],
                  ['02', '阶段'],
                  ['03', '动作'],
                ].map(([index, title]) => (
                    <div key={index} className="soft-card rounded-[1.5rem] p-5">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-bold text-[color:var(--accent-strong)]">
                          {index}
                        </div>
                        <div>
                          <div className="text-base font-semibold text-[color:var(--ink)]">{title}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {proofItems.map((item) => (
                    <div key={item.label} className="product-chip tracking-[0.12em] text-[color:var(--muted)]">
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-frame pb-2 md:pb-4" id="analysis-form">
          <div className="mx-auto max-w-5xl space-y-5">
            <div className="text-center">
              <div className="section-label">
                <ShieldCheck className="h-3.5 w-3.5" />
                立即进入判断
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-5xl">填完必要信息，直接进入结果页</h2>
            </div>

            <FortuneForm />
          </div>
        </section>

        <section className="page-frame pb-2 md:pb-4">
          <UpdatesStatusPanel
            title="最近记录"
            description="如果你不是第一次来，这里会接住之前的报告、升级和提醒状态，方便你直接续上。"
            initialAuthenticated={initialAuthenticated}
            initialSummary={initialSummary}
          />
        </section>

        {shouldRenderPersonalGrowthPanel ? (
          <section className="page-frame py-6 md:py-8">
            <PersonalGrowthPanel summary={personalGrowthHub} page="/" />
          </section>
        ) : null}

        <section className="page-frame py-6 md:py-8">
          <SurfaceJourneyPanel
            journey={personalizedJourney.journey}
            title={personalizedJourney.heading}
            description="按你当前所处阶段，把公开内容、工具和行动入口重新排成一条更顺的下一步路径。"
          />
        </section>

        <section className="page-frame py-6 md:py-10">
          <div className="grid gap-5 md:grid-cols-3">
            {journeySteps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="soft-card rounded-[1.75rem] p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                  <Icon className="h-5 w-5" />
                </div>
                  <h2 className="mt-5 text-xl font-bold text-[color:var(--ink)]">{step.title}</h2>
                </div>
              );
            })}
          </div>
        </section>

        <section className="page-frame py-6 md:py-10">
          <div className="grid gap-4 md:grid-cols-3">
            {localePathTargets.map((item) => {
              const spotlight = localeSpotlights[item.key];
              return (
                <div key={item.key} className="soft-card rounded-[1.75rem] p-6">
                  <div className="section-label">{item.title}</div>
                  {spotlight ? (
                    <Link href={spotlight.href} className="mt-5 block rounded-[1.25rem] bg-white/70 p-4 transition hover:bg-white">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
                        <span>{spotlight.typeLabel}</span>
                        <ContentLocaleBadge locale={spotlight.locale} market={spotlight.market} compact />
                      </div>
                      <div className="mt-2 text-sm font-semibold text-[color:var(--ink)]">{spotlight.title}</div>
                    </Link>
                  ) : null}
                  <div className="action-guide mt-5">快速操作</div>
                  <div className="action-strip mt-2 flex flex-wrap gap-3">
                    <Link href={item.knowledgeHref} className="action-secondary">知识内容</Link>
                    <Link href={item.casesHref} className="action-secondary">案例内容</Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="page-frame py-6 md:py-10">
          <div className="relative overflow-hidden rounded-[2.2rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(246,239,228,0.92))] p-6 shadow-[0_22px_60px_rgba(34,33,30,0.08)] md:p-8">
            <div className="absolute -right-14 top-8 h-44 w-44 rounded-full bg-[rgba(178,149,93,0.14)] blur-3xl" />
            <div className="absolute left-0 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[rgba(201,125,58,0.12)] blur-3xl" />

            <div className="relative">
              <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="space-y-5">
                  <div className="section-label">
                    <Sparkles className="h-3.5 w-3.5" />
                    世界易系统层
                  </div>
                  <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-5xl">
                    世界易
                    <span className="font-serif text-[color:var(--accent-strong)]"> 系统入口</span>
                  </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {worldYiScaleCards.slice(0, 4).map((item) => (
                    <div key={item.label} className="rounded-[1.25rem] bg-white/80 p-4 shadow-[0_10px_24px_rgba(23,32,51,0.04)]">
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                      <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="action-guide">延伸入口</div>
                  <div className="action-strip mt-2 flex flex-wrap gap-3">
                    {worldYiPowerLinks.slice(0, 4).map((item) => (
                      <Link key={item.href} href={item.href} className="action-secondary">
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {worldYiDoctrinePoints.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-[1.75rem] bg-white/82 p-5 shadow-[0_12px_30px_rgba(23,32,51,0.05)]">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="mt-4 text-xl font-bold text-[color:var(--ink)]">{item.title}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>


        <section className="page-frame py-6 pb-16 md:py-10 md:pb-20">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="space-y-5">
              <div className="section-label">继续了解</div>
              <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-5xl">
                案例、知识、洞察
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {featuredCases.map((item) => (
                <ContentCardLink
                  key={item.slug}
                  href={`/cases/${item.slug}`}
                  page="/"
                  meta={{
                    surfaceKey: 'home_featured_content',
                    contentType: 'case',
                    slug: item.slug,
                    title: item.title,
                    category: item.scenario,
                    tags: item.tags,
                  }}
                  className="soft-card rounded-[1.75rem] p-5 transition hover:-translate-y-0.5"
                >
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.scenario}</div>
                  <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">{item.title}</div>
                </ContentCardLink>
              ))}

              {featuredArticles.map((item) => (
                <ContentCardLink
                  key={item.entry.slug}
                  href={`/knowledge/${item.entry.slug}`}
                  page="/"
                  meta={{
                    surfaceKey: 'home_featured_content',
                    contentType: 'knowledge',
                    slug: item.entry.slug,
                    title: item.entry.title,
                    category: item.entry.category,
                    tags: item.entry.tags,
                    topicName: item.topicName,
                    synthesisType: item.synthesisType,
                    editorialTier: item.editorialTier,
                  }}
                  className="soft-card rounded-[1.75rem] p-5 transition hover:-translate-y-0.5"
                >
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">
                    {item.topicName || item.entry.category}
                  </div>
                  <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">{item.entry.title}</div>
                </ContentCardLink>
              ))}
            </div>
          </div>

          {featuredTopicHubs.length > 0 && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {featuredTopicHubs.map((hub) => (
                <ContentCardLink
                  key={hub.topicKey}
                  href={`/knowledge/topics/${hub.topicSlug}`}
                  page="/"
                  meta={{
                    surfaceKey: 'home_featured_topic_hubs',
                    targetSurfaceKey: `knowledge_topic:${hub.topicSlug}`,
                    contentType: 'knowledge',
                    topicName: hub.topicName,
                  }}
                  className="glass-panel rounded-[1.75rem] p-5 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-[color:var(--muted)]">
                    <Network className="h-3.5 w-3.5" />
                    专题
                  </div>
                  <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">{hub.topicName}</div>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">{hub.entryCount} 篇</p>
                  <div className="mt-4 space-y-3">
                    {hub.entries.slice(0, 2).map((item) => (
                      <div
                        key={item.entry.slug}
                        className="block rounded-[1.25rem] bg-white/70 p-4"
                      >
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.entry.title}</div>
                      </div>
                    ))}
                  </div>
                </ContentCardLink>
              ))}
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {featuredInsights.map((item) => (
              <ContentCardLink
                key={`${item.type}-${item.slug}`}
                href={`/insights/${item.type}/${item.slug}`}
                page="/"
                meta={{
                  surfaceKey: 'home_featured_content',
                  contentType: 'insight',
                  subtype: item.type,
                  slug: item.slug,
                  title: item.title,
                  name: item.name,
                  category: getEntityTypeLabel(item.type),
                  tags: item.tags,
                }}
                className="glass-panel rounded-[1.75rem] p-5 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{getEntityTypeLabel(item.type)}</div>
                <div className="mt-3 text-lg font-bold text-[color:var(--ink)]">{item.title}</div>
              </ContentCardLink>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-4xl rounded-[2.25rem] bg-white/80 p-6 shadow-[0_20px_48px_rgba(23,32,51,0.08)]">
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
