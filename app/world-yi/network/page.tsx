import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, Globe2, Layers3, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { worldYiRoadmapSummary } from '@/lib/world-yi';
import { worldYiDomainSurfaces, worldYiApplicationSurface } from '@/lib/world-yi-surfaces';
import { worldYiEnglishTrackSurfaces, worldYiGlobalTopicSurfaces } from '@/lib/world-yi-global-surfaces';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';
import { createPublicContentMetadata } from '@/lib/public-content-seo';

export const metadata = createPublicContentMetadata({
  title: '世界易专题地图 | 人生K线',
  description: '把世界易的主书、矩阵、六域、应用、全球华人、英文层与环境洞察统一到一张可下钻的专题地图里。',
  path: '/world-yi/network',
  type: 'website',
  languages: {
    'zh-CN': '/world-yi/network',
    'x-default': '/world-yi/network',
  },
});

export const dynamic = 'force-dynamic';

const controlLayers = [
  {
    title: '主书工程',
    href: '/world-yi/book',
    icon: BookOpen,
  },
  {
    title: '内容矩阵',
    href: '/world-yi/matrix',
    icon: Layers3,
  },
  {
    title: '发布架构',
    href: '/world-yi/publish',
    icon: Network,
  },
];

export default function WorldYiNetworkPage() {
  const worldYiStats = getWorldYiPublicStats();
  const domains = Object.values(worldYiDomainSurfaces);
  const globalTopics = Object.values(worldYiGlobalTopicSurfaces);
  const englishTracks = Object.values(worldYiEnglishTrackSurfaces);

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/world-yi/network"
        meta={{ surfaceKey: 'world_yi_network_page', contentType: 'knowledge', series: 'world-yi-network' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="进入判断" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Network className="h-3.5 w-3.5" />
              世界易专题地图
            </>
          )}
          title="世界易网络"
          description="把主书、六域、生活应用、全球华人与英文层入口汇到一张总地图里，方便你按主题继续下钻，而不是在零散页面里来回找。"
          hint="适合已经理解部分体系、想快速定位下一层入口的人；如果你更想先得到自己的结果，直接进入判断。"
          actions={[
            { href: '/world-yi', label: '回到世界易总入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/knowledge/topics', label: '通用专题地图' },
            { href: '/analyze', label: '进入判断' },
          ]}
          highlights={[
            { title: `${worldYiStats.publicContentCount} 篇`, body: '公开总量' },
            { title: `${worldYiStats.publicKnowledgeCount} 篇`, body: '知识' },
            { title: `${worldYiStats.publicCaseCount} 篇`, body: '案例' },
            { title: `${worldYiStats.publicInsightCount} 篇`, body: '洞察' },
            { title: `${worldYiRoadmapSummary.targetArticleCount} 篇`, body: '内容目标' },
            { title: `${domains.length} 条`, body: '六域' },
            { title: `${worldYiStats.applicationGroupCount} 组`, body: '应用' },
            { title: `${globalTopics.length} 组`, body: '全球' },
            { title: `${englishTracks.length} 条`, body: 'English' },
            { title: `${worldYiStats.publicRouteCount} 个`, body: '入口' },
          ]}
        />

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {controlLayers.map((item) => {
            const Icon = item.icon;
            return (
              <ContentCardLink
                key={item.href}
                href={item.href}
                page="/world-yi/network"
                meta={{
                  surfaceKey: 'world_yi_network_page',
                  targetSurfaceKey: item.href.replace('/', '').replaceAll('/', '_'),
                  contentType: 'knowledge',
                  series: 'world-yi-network',
                }}
                className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-[color:var(--ink)]">{item.title}</h2>
              </ContentCardLink>
            );
          })}
        </section>

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="section-label">
            <Compass className="h-3.5 w-3.5" />
            六域分科图
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {domains.map((domain) => (
              <ContentCardLink
                key={domain.key}
                href={`/world-yi/domains/${domain.key}`}
                page="/world-yi/network"
                meta={{
                  surfaceKey: 'world_yi_network_page',
                  targetSurfaceKey: `world_yi_domain:${domain.key}`,
                  contentType: 'knowledge',
                  series: 'world-yi-domains',
                }}
                className="rounded-[1.75rem] bg-white/82 p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{domain.shortTitle}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{domain.title}</h2>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <section className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              生活应用图
            </div>
            <div className="mt-5 grid gap-4">
              {worldYiApplicationSurface.groups.map((group) => (
                <ContentCardLink
                  key={group.title}
                  href="/world-yi/applications"
                  page="/world-yi/network"
                  meta={{
                    surfaceKey: 'world_yi_network_page',
                    targetSurfaceKey: 'world_yi_applications_page',
                    contentType: 'knowledge',
                    series: 'world-yi-applications',
                    topicName: group.title,
                  }}
                  className="rounded-[1.5rem] bg-white/82 p-5 transition hover:-translate-y-0.5"
                >
                  <div className="text-lg font-bold text-[color:var(--ink)]">{group.title}</div>
                </ContentCardLink>
              ))}
          </div>
          </section>

          <section className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">
              <Globe2 className="h-3.5 w-3.5" />
              全球与英文图
            </div>
            <div className="mt-5 grid gap-4">
              <ContentCardLink
                href="/world-yi/global/topics"
                page="/world-yi/network"
                meta={{
                  surfaceKey: 'world_yi_network_page',
                  targetSurfaceKey: 'world_yi_global_topics_page',
                  contentType: 'knowledge',
                  series: 'world-yi-global',
                }}
                className="rounded-[1.5rem] bg-white/82 p-5 transition hover:-translate-y-0.5"
              >
                <div className="text-lg font-bold text-[color:var(--ink)]">全球华人专题网络</div>
              </ContentCardLink>
              <ContentCardLink
                href="/world-yi/en/tracks"
                page="/world-yi/network"
                meta={{
                  surfaceKey: 'world_yi_network_page',
                  targetSurfaceKey: 'world_yi_en_tracks_page',
                  contentType: 'knowledge',
                  series: 'world-yi-en',
                }}
                className="rounded-[1.5rem] bg-white/82 p-5 transition hover:-translate-y-0.5"
              >
                <div className="text-lg font-bold text-[color:var(--ink)]">English Track Network</div>
              </ContentCardLink>
            </div>
          </section>
        </section>

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            环境观察图
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ['城市观察'],
              ['行业观察'],
              ['组织观察'],
            ].map(([title]) => (
              <ContentCardLink
                key={title}
                href="/world-yi/insights"
                page="/world-yi/network"
                meta={{
                  surfaceKey: 'world_yi_network_page',
                  targetSurfaceKey: 'world_yi_insights_page',
                  contentType: 'insight',
                  series: 'world-yi-insights',
                  topicName: title,
                }}
                className="rounded-[1.5rem] bg-white/82 p-5 transition hover:-translate-y-0.5"
              >
                <div className="text-lg font-bold text-[color:var(--ink)]">{title}</div>
              </ContentCardLink>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
