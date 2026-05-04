export const fetchCache = 'force-no-store';
export const revalidate = 0;

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarClock, Compass, Globe2, Layers3, Network, ShieldCheck, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import PersonalGrowthPanel from '@/components/personal-growth-panel';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import SurfaceJourneyPanel from '@/components/surface-journey-panel';
import UpdatesStatusPanel from '@/components/updates-status-panel';
import VisualAssetFeature from '@/components/visual-asset-feature';
import {
  getFeaturedCaseStudies,
  getFeaturedEntityInsights,
} from '@/lib/content-store';
import { getAuthSession } from '@/lib/auth';
import { getEntityTypeLabel } from '@/lib/content';
import { fortuneOperations, toolSessionOperations } from '@/lib/database';
import { getCurrentUserId } from '@/lib/user-utils';
import { listFeaturedKnowledgeEditorialEntries, listFeaturedKnowledgeTopicHubs } from '@/lib/knowledge-editorial';
import { buildPersonalGrowthHub } from '@/lib/personal-growth-hub';
import { createPublicContentMetadata } from '@/lib/public-content-seo';
import { buildPersonalizedJourney } from '@/lib/surface-journeys';
import { buildUpdatesSummary } from '@/lib/updates-summary';
import { getVisualAssetById } from '@/lib/visual-asset-library';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';
import {
  productActivationPath,
  productExperiencePrinciples,
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
  const worldYiStats = getWorldYiPublicStats();
  const featuredArticles = listFeaturedKnowledgeEditorialEntries(2);
  const featuredTopicHubs = listFeaturedKnowledgeTopicHubs(2);
  const featuredCases = getFeaturedCaseStudies(2);
  const featuredInsights = getFeaturedEntityInsights(3);
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
  const systemScaleCards = [
    { label: '公开内容', value: `${worldYiStats.publicContentCount} 篇` },
    { label: '知识主干', value: `${worldYiStats.publicKnowledgeCount} 篇` },
    { label: '真实案例', value: `${worldYiStats.publicCaseCount} 篇` },
    { label: '公开入口', value: `${worldYiStats.publicRouteCount} 个` },
  ];
  const productUniverseImage = getVisualAssetById('PWY01-001');
  const contentSystemImage = getVisualAssetById('PWY01-006');

  return (
    <div className="page-shell">
      <AnalyticsPageView eventName="home_page_viewed" page="/" meta={{ surfaceKey: 'landing' }} />
      <SiteHeader ctaHref="#analysis-form" ctaLabel="立即开始" />

      <main>
        <section className="page-frame py-8 md:py-12" id="analysis-form">
          <div className="grid gap-8 xl:grid-cols-[0.82fr_1.18fr] xl:items-start">
            <div className="space-y-6">
              <div className="section-label">
                <Sparkles className="h-3.5 w-3.5" />
                首页直接测算
              </div>

              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-black leading-tight text-[color:var(--ink)] md:text-6xl">
                  输入生辰，
                  <span className="font-serif text-[color:var(--accent-strong)]">先生成你的判断底盘</span>
                </h1>
                <p className="hero-description">
                  首页首屏直接完成出生时间、地点和真太阳时校准。系统会先给出结构、阶段、环境与下一步动作，再把你带向深入报告、单项工具和学习内容。
                </p>
              </div>

              <div className="space-y-3">
                <div className="action-guide">推荐路径</div>
                <div className="flex flex-wrap gap-3">
                  <Link href="#analysis-form" className="action-primary action-main">
                    先开始测算
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                  <Link href="/knowledge/topics" className="action-secondary">
                    不测算，先学习
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {productTrustSignals.slice(0, 3).map((label) => (
                  <div key={label} className="product-chip tracking-[0.12em] text-[color:var(--muted)]">
                    {label}
                  </div>
                ))}
              </div>

              <div className="glass-panel rounded-[1.5rem] p-5">
                <div className="action-guide">结果路径</div>
                <div className="mt-4 grid gap-3">
                  {productActivationPath.slice(0, 3).map((step, index) => {
                    const Icon = iconMap[step.icon];
                    return (
                      <Link key={step.title} href={step.href} className="soft-card rounded-[1.25rem] p-4 transition hover:border-[color:var(--accent)]">
                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold tracking-[0.18em] text-[color:var(--muted)]">0{index + 1}</div>
                            <div className="mt-1 text-base font-semibold text-[color:var(--ink)]">{step.title}</div>
                            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{step.description}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-[1.75rem] p-4 md:p-5">
              <div>
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="section-label">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      立即进入判断
                    </div>
                    <h2 className="mt-3 text-2xl font-black text-[color:var(--ink)] md:text-4xl">填完必要信息，直接进入结果页</h2>
                  </div>
                  <div className="rounded-full bg-[color:var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-strong)]">
                    首屏完成
                  </div>
                </div>

                <FortuneForm returnSource="home_direct" />
              </div>
            </div>
          </div>
        </section>

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
                  <p className="intro-copy mt-2">优先展示能帮助用户理解报告、验证案例和继续学习的公开内容。</p>
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

        <section className="page-frame py-6 md:py-8">
          <SurfaceJourneyPanel
            journey={personalizedJourney.journey}
            title={personalizedJourney.heading}
            description="按你当前所处阶段，把公开内容、工具和行动入口重新排成一条更顺的下一步路径。"
          />
        </section>

        <section className="page-frame py-6 md:py-10">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="section-label">系统入口</div>
              <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)] md:text-5xl">不要乱点，先按目的进入</h2>
              <p className="hero-description mt-3">
                如果还没有测算，先测算；如果已经有报告，再按学习、工具、体系、图片说明继续深入。
              </p>
            </div>
            <Link href="/world-yi" className="action-secondary shrink-0">
              世界易总入口
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {productPurposePaths.slice(1).map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <Link key={item.title} href={item.href} className="soft-card rounded-[1.5rem] p-5 transition hover:border-[color:var(--accent)]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-[color:var(--ink)]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{item.description}</p>
                  <div className="action-guide mt-5 inline-flex items-center gap-2">
                    {item.action}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="page-frame py-6 md:py-8">
          <div className="glass-panel rounded-[1.75rem] p-5 md:p-6">
            <div className="section-label">产品交互原则</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {productExperiencePrinciples.map((item) => (
                <div key={item.key} className="rounded-[1.2rem] border border-[color:var(--line)] bg-white/72 p-4">
                  <h3 className="text-base font-bold text-[color:var(--ink)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="page-frame py-6 md:py-10">
          <div className="grid gap-5 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
            <div className="glass-panel rounded-[1.75rem] p-5 md:p-6">
              <div className="section-label">
                <Layers3 className="h-3.5 w-3.5" />
                内容体系
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">
                内容不是入口堆叠，而是一条用户路径
              </h2>
              <p className="intro-copy mt-3">
                测算负责给出个人底盘；知识负责解释为什么；工具负责拆具体问题；图片负责传播和快速理解。
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {systemScaleCards.map((item) => (
                  <div key={item.label} className="rounded-[1.25rem] bg-white/80 p-4">
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                    <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/knowledge/topics" className="action-primary">
                  看学习专题
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/tools" className="action-secondary">按问题找工具</Link>
                <Link href="/visual-assets" className="action-secondary">看图片说明</Link>
              </div>
            </div>

            {productUniverseImage ? (
              <VisualAssetFeature asset={productUniverseImage} label="产品说明图" />
            ) : contentSystemImage ? (
              <VisualAssetFeature asset={contentSystemImage} label="内容体系图" />
            ) : null}
          </div>
        </section>

        <section className="page-frame py-6 pb-16 md:py-10 md:pb-20">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="space-y-5">
              <div className="section-label">内容证据</div>
              <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-5xl">
                用少量内容继续验证
              </h2>
              <p className="intro-copy">
                首页只保留少量代表内容。完整学习、案例和洞察都从系统入口进入，避免用户在首页被大量卡片打散。
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/knowledge/topics" className="action-primary">
                  进入学习专题
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/cases" className="action-secondary">看案例库</Link>
              </div>
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
                  className="soft-card rounded-[1.5rem] p-5 transition hover:border-[color:var(--accent)]"
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
                  className="soft-card rounded-[1.5rem] p-5 transition hover:border-[color:var(--accent)]"
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
                  className="glass-panel rounded-[1.5rem] p-5 transition hover:border-[color:var(--accent)]"
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
            {featuredInsights.slice(0, 3).map((item) => (
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
                className="glass-panel rounded-[1.5rem] p-5 transition hover:border-[color:var(--accent)]"
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
