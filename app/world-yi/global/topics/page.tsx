import Link from 'next/link';
import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { worldYiGlobalTopicSurfaces } from '@/lib/world-yi-global-surfaces';

export const metadata = {
  title: '世界易全球华人专题 | 人生K线',
  description: '把海外身份、职业重启、家庭照护和全球育儿拆成可下钻的世界易专题网络。',
};

export const dynamic = 'force-dynamic';

export default function WorldYiGlobalTopicsPage() {
  const topics = Object.values(worldYiGlobalTopicSurfaces);

  return (
    <div className="page-shell">
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
          title={(
            <>
              不再只看总入口，
              <span className="font-serif text-[color:var(--accent-strong)]">而是进入可下钻的海外专题网络。</span>
            </>
          )}
          description="海外华人的现实问题不是一条线。世界易把身份、职业、家庭、教育拆成四条长期主线，让全球传播从概念入口升级成专题网络。"
          hint="建议先选一个最相关专题，再进入对应案例，避免多线程阅读。"
          actions={[
            { href: '/world-yi/global', label: '回到全球入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/global/cases', label: '全球案例层' },
          ]}
          highlights={[
            { body: '身份问题会连着职业和家庭问题一起出现。' },
            { body: '海外职业问题常常先表现为翻译失效与放大器失灵。' },
            { body: '家庭与照护问题最怕所有人都把紧急状态当常态。' },
            { body: '教育路径背后通常是家庭未来几年的生活路线选择。' },
          ]}
        />

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
                <p className="intro-copy mt-3">{topic.summary}</p>
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
