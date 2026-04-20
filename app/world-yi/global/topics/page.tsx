import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import { worldYiGlobalTopicSurfaces } from '@/lib/world-yi-global-surfaces';

export const metadata = createPublicContentMetadata({
  title: '世界易全球华人专题 | 人生K线',
  description: '把海外身份、职业重启、家庭照护和全球育儿拆成可下钻的世界易专题网络。',
  path: '/world-yi/global/topics',
  type: 'website',
  languages: {
    'zh-CN': '/world-yi/global/topics',
    'en-US': '/world-yi/en/tracks',
    'x-default': '/world-yi/global/topics',
  },
});

export const dynamic = 'force-dynamic';

export default function WorldYiGlobalTopicsPage() {
  const topics = Object.values(worldYiGlobalTopicSurfaces);
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易全球华人专题',
      description: '把海外身份、职业重启、家庭照护和全球育儿拆成可下钻的世界易专题网络。',
      path: '/world-yi/global/topics',
      keywords: ['世界易', '全球华人', '专题', '身份', '职业', '家庭', '教育'],
    }),
    createItemListSchema(
      '世界易全球专题',
      topics.map((topic, index) => ({
        name: topic.title,
        path: `/world-yi/global/topics/${topic.key}`,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/world-yi/global/topics"
        meta={{ surfaceKey: 'world_yi_global_topics_page', contentType: 'knowledge', series: 'world-yi-global' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="进入判断" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Globe2 className="h-3.5 w-3.5" />
              世界易全球华人专题
            </>
          )}
          title="全球专题"
          description="把海外身份、职业重启、家庭照护和教育选择拆成几条可以继续下钻的专题路径，方便你按真实处境进入。"
          hint="如果你面对的是跨国迁移或跨文化家庭问题，先从相近专题进入；如果你还缺个人底盘，先去分析入口。"
          actions={[
            { href: '/world-yi/global', label: '回到全球入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/global/cases', label: '全球案例层' },
          ]}
          highlights={[
            { body: '身份' },
            { body: '职业' },
            { body: '家庭' },
            { body: '教育' },
          ]}
        />

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <ContentCardLink
            href="/world-yi/global"
            page="/world-yi/global/topics"
            meta={{ surfaceKey: 'world_yi_global_topics_page_network', targetSurfaceKey: 'world_yi_global_page', contentType: 'knowledge', series: 'world-yi-global' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">Global gateway</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">Back to global entry</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/global/cases"
            page="/world-yi/global/topics"
            meta={{ surfaceKey: 'world_yi_global_topics_page_network', targetSurfaceKey: 'world_yi_global_cases_page', contentType: 'case', series: 'world-yi-global' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">Case layer</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">Browse global cases</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/en"
            page="/world-yi/global/topics"
            meta={{ surfaceKey: 'world_yi_global_topics_page_network', targetSurfaceKey: 'world_yi_en_page', contentType: 'knowledge', locale: 'en', series: 'world-yi-en' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">English layer</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">English gateway</h2>
          </ContentCardLink>
        </section>

        <section className="mt-10">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            四大专题
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {topics.map((topic) => (
              <ContentCardLink
                key={topic.key}
                href={`/world-yi/global/topics/${topic.key}`}
                page="/world-yi/global/topics"
                meta={{
                  surfaceKey: 'world_yi_global_topics_page',
                  targetSurfaceKey: `world_yi_global_topic:${topic.key}`,
                  contentType: 'knowledge',
                  series: 'world-yi-global',
                }}
                className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <h2 className="text-2xl font-bold text-[color:var(--ink)]">{topic.title}</h2>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
                  进入专题
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
