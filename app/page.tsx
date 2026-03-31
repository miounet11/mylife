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
    title: '先看个人结构',
    description: '先定位主结构和主轴问题，快速看清卡点。',
    icon: Compass,
  },
  {
    title: '再看当前阶段',
    description: '结合大运流年，判断当前是推进、观察还是收缩。',
    icon: CalendarClock,
  },
  {
    title: '最后给出行动建议',
    description: '给可执行动作，不停留在抽象好坏。',
    icon: ShieldCheck,
  },
];

const worldYiDoctrinePoints = [
  {
    title: '十卷主书初版',
    description: '总论到应用的十卷母本，持续迭代。',
    icon: BookOpen,
  },
  {
    title: '人生六域',
    description: '六大主线已独立入口，按问题直达。',
    icon: Compass,
  },
  {
    title: '全球与英文层',
    description: '覆盖全球华人和英文读者场景。',
    icon: Globe2,
  },
  {
    title: '内容矩阵',
    description: '首批 120 篇已上线，持续扩展。',
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
      <AnalyticsPageView eventName="home_page_viewed" page="/" meta={{ surface: 'landing' }} />
      <SiteHeader ctaHref="#analysis-form" ctaLabel="立即开始" />

      <main>
        <section className="page-frame py-10 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-8">
              <div className="section-label">
                <Sparkles className="h-3.5 w-3.5" />
                更快理解价值，更快进入分析
              </div>

              <div className="space-y-5">
                <h1 className="max-w-4xl text-4xl font-black leading-tight text-[color:var(--ink)] md:text-6xl">
                  用一次判断，
                  <span className="font-serif text-[color:var(--accent-strong)]">把现在最卡的问题做窄。</span>
                </h1>
                <p className="intro-copy">
                  先看结构，再看阶段，再落到动作。你不需要先懂术语，只需要把关键出生信息填对。
                </p>
              </div>

              <div className="space-y-2">
                <div className="action-guide">快速操作</div>
                <div className="action-strip flex flex-col gap-3 sm:flex-row">
                  <Link href="#analysis-form" className="action-primary action-main">
                    立即开始判断
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                  <Link href="/tools" className="action-secondary">
                    先看工具中心
                  </Link>
                  <Link href="/cases" className="action-secondary">
                    先看真实案例
                  </Link>
                </div>
              </div>

              <div className="intro-panel">
                先完成一次判断，再决定是否进入工具或案例，会更快得到可执行答案。
              </div>

              <div className="flex flex-wrap gap-2">
                {proofItems.map((item) => (
                  <div key={item.label} className="product-chip tracking-[0.12em] text-[color:var(--muted)]">
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-6 md:p-8">
              <div className="space-y-6">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">30 秒看懂这次判断值不值</div>
                  <div className="mt-1 text-2xl font-bold text-[color:var(--ink)]">你会拿到一份可执行、可复盘的结果</div>
                </div>

                <div className="grid gap-3">
                  {[
                    ['01', '先看主矛盾', '先告诉你这件事到底卡在结构、阶段还是环境。'],
                    ['02', '再看窗口', '明确当前更适合推进、观察还是先止损。'],
                    ['03', '最后给动作', '给你一条最小可执行动作，不让结论停在抽象层。'],
                  ].map(([index, title, description]) => (
                    <div key={index} className="soft-card rounded-[1.5rem] p-5">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-bold text-[color:var(--accent-strong)]">
                          {index}
                        </div>
                        <div>
                          <div className="text-base font-semibold text-[color:var(--ink)]">{title}</div>
                          <div className="intro-copy mt-1">{description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[1.4rem] bg-[color:var(--accent-soft)] px-4 py-4 text-xs leading-6 text-[color:var(--accent-strong)]">
                  免费先拿方向，后续再按你的问题进入单项工具和深测升级，不需要一次把所有问题问完。
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-frame pb-2 md:pb-4">
          <UpdatesStatusPanel
            title="如果你已经来过，这里直接继续"
            description="登录后直接看到最近报告、升级进度和月度更新。"
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
            description={personalizedJourney.description}
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
                  <p className="intro-copy mt-3">{step.description}</p>
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
                  <p className="intro-copy mt-4">{item.description}</p>
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
          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <div className="section-label">
                  <Sparkles className="h-3.5 w-3.5" />
                  世界易 v1.0.0.1
                </div>
                <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">
                  从工业时代到 AI 时代，
                  <span className="font-serif text-[color:var(--accent-strong)]">人更需要一套高维判断语言。</span>
                </h2>
                <p className="intro-copy mt-4">世界易把世界、人和环境重新放进同一套判断语言里。</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/world-yi" className="action-secondary">
                    进入世界易总入口
                  </Link>
                  <Link href="/knowledge/world-yi-v1-manifesto" className="action-secondary">
                    读世界易总论
                  </Link>
                  <Link href="/knowledge/world-yi-era-cognition" className="action-secondary">
                    读时代认知
                  </Link>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  ['你不是乱', '世界易先告诉你：你是有结构的。'],
                  ['你不是倒霉', '很多痛苦不是命差，而是处在某个阶段。'],
                  ['你不是没路', '真正的问题往往是进退顺序错了。'],
                  ['你可以重建判断', 'AI 时代最稀缺的不是信息，而是判断秩序。'],
                ].map(([title, description]) => (
                  <div key={title} className="soft-card rounded-[1.5rem] p-5">
                    <div className="text-base font-bold text-[color:var(--ink)]">{title}</div>
                    <div className="intro-copy mt-2">{description}</div>
                  </div>
                ))}
              </div>
            </div>
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
                    这已经不是一个单点判断工具，
                    <span className="font-serif text-[color:var(--accent-strong)]">而是一套正在进入网页、内容和产品的判断体系。</span>
                  </h2>
                <p className="intro-copy">现在看到的不只是入口，而是一套已经落到工具、内容和案例里的判断系统。</p>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {worldYiScaleCards.map((item) => (
                    <div key={item.label} className="rounded-[1.25rem] bg-white/80 p-4 shadow-[0_10px_24px_rgba(23,32,51,0.04)]">
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                      <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {worldYiPowerLinks.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="rounded-[1.2rem] bg-white/80 px-4 py-4 text-sm font-semibold text-[color:var(--ink)] transition hover:-translate-y-0.5 hover:bg-white"
                      >
                        <span className="inline-flex items-center gap-2">
                          {item.label}
                          <ArrowRight className="h-4 w-4 text-[color:var(--accent-strong)]" />
                        </span>
                      </Link>
                    ))}
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
                        <p className="intro-copy mt-3">{item.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="page-frame py-10 md:py-16" id="analysis-form">
          <div className="mx-auto max-w-5xl space-y-5">
            <div className="text-center">
              <div className="section-label">
                <ShieldCheck className="h-3.5 w-3.5" />
                快速填写
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-5xl">填完必要信息，直接进入结果页</h2>
              <p className="intro-copy mt-3">只保留影响判断质量的必要字段。</p>
            </div>

            <FortuneForm />
          </div>
        </section>

        <section className="page-frame py-6 pb-16 md:py-10 md:pb-20">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="space-y-5">
              <div className="section-label">继续了解</div>
              <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-5xl">
                看几个真实案例和常见问题，
                <span className="font-serif text-[color:var(--accent-strong)]">再开始也不晚。</span>
              </h2>
              <p className="intro-copy">先看案例和常见问题，再决定是否开始。</p>
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
                  <p className="intro-copy mt-2">{item.excerpt}</p>
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
                  <p className="intro-copy mt-2">{item.entry.excerpt}</p>
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
                    自动精选专题
                  </div>
                  <div className="mt-3 text-xl font-bold text-[color:var(--ink)]">{hub.topicName}</div>
                  <p className="intro-copy mt-2">{`这一专题已形成 ${hub.entryCount} 篇互链内容，可直接顺着读下去。`}</p>
                  <div className="mt-4 space-y-3">
                    {hub.entries.slice(0, 2).map((item) => (
                      <div
                        key={item.entry.slug}
                        className="block rounded-[1.25rem] bg-white/70 p-4"
                      >
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.entry.title}</div>
                        <div className="intro-copy mt-2">{item.entry.excerpt}</div>
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
                <p className="intro-copy mt-2">{item.excerpt}</p>
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
