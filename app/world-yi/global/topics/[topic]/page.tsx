import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { getManagedContentEntryBySlug } from '@/lib/content-store';
import { worldYiGlobalTopicSurfaces, type WorldYiGlobalTopicKey } from '@/lib/world-yi-global-surfaces';

export const dynamic = 'force-dynamic';

function getSurface(topic: string) {
  return worldYiGlobalTopicSurfaces[topic as WorldYiGlobalTopicKey] || null;
}

export function generateMetadata({ params }: { params: { topic: string } }): Metadata {
  const surface = getSurface(params.topic);
  return {
    title: surface ? `${surface.title} | 人生K线` : '世界易全球专题 | 人生K线',
    description: surface?.description || '世界易全球华人专题页',
  };
}

export default function WorldYiGlobalTopicDetailPage({ params }: { params: { topic: string } }) {
  const surface = getSurface(params.topic);
  if (!surface) {
    notFound();
  }

  const knowledgeEntries = surface.knowledgeSlugs
    .map((slug) => getManagedContentEntryBySlug('knowledge', slug))
    .filter((entry): entry is NonNullable<typeof entry> => !!entry);
  const caseEntries = surface.caseSlugs
    .map((slug) => getManagedContentEntryBySlug('case', slug))
    .filter((entry): entry is NonNullable<typeof entry> => !!entry);

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page={`/world-yi/global/topics/${surface.key}`}
        meta={{ surfaceKey: `world_yi_global_topic_${surface.key}`, contentType: 'knowledge', series: 'world-yi-global' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="进入判断" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Globe2 className="h-3.5 w-3.5" />
              {surface.title}
            </>
          )}
          title={surface.headline}
          description={surface.description}
          hint="本专题建议先读核心文章，再看案例，最后回到分析页做个人落地。"
          actions={[
            { href: '/world-yi/global/topics', label: '回到全球专题索引', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/global/cases', label: '全球案例页' },
            { href: '/analyze', label: '进入个人分析' },
          ]}
          highlights={surface.doctrine.map((body) => ({ body }))}
        />

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            核心文章
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {knowledgeEntries.map((entry) => (
              <ContentCardLink
                key={entry.slug}
                href={`/knowledge/${entry.slug}`}
                page={`/world-yi/global/topics/${surface.key}`}
                meta={{
                  surfaceKey: `world_yi_global_topic_${surface.key}`,
                  targetSurfaceKey: `knowledge_article:${entry.slug}`,
                  contentType: 'knowledge',
                  series: 'world-yi-global',
                }}
                className="soft-card rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{entry.title}</h2>
                <p className="intro-copy mt-3">{entry.excerpt}</p>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="section-label">对应案例</div>
              <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">这些专题必须由案例来支撑，而不是只停在概念解释。</h2>
            </div>
            <Link href="/world-yi/global/cases" className="action-secondary">
              查看全球案例
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {caseEntries.map((entry) => (
              <ContentCardLink
                key={entry.slug}
                href={`/cases/${entry.slug}`}
                page={`/world-yi/global/topics/${surface.key}`}
                meta={{
                  surfaceKey: `world_yi_global_topic_${surface.key}`,
                  targetSurfaceKey: `case_article:${entry.slug}`,
                  contentType: 'case',
                  series: 'world-yi-global',
                }}
                className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{entry.title}</h2>
                <p className="intro-copy mt-3">{entry.excerpt}</p>
              </ContentCardLink>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
