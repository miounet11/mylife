import { notFound } from 'next/navigation';
import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-border-y border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] py-4 md:py-6';
import { getManagedContentEntryBySlug } from '@/lib/content-store';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import { worldYiGlobalTopicSurfaces, type WorldYiGlobalTopicKey } from '@/lib/world-yi-global-surfaces';

export const dynamic = 'force-dynamic';

function getSurface(topic: string) {
  return worldYiGlobalTopicSurfaces[topic as WorldYiGlobalTopicKey] || null;
}

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const surface = getSurface(topic);
  if (!surface) {
    return createPublicContentMetadata({
      title: '世界易全球专题 | 人生K线',
      description: '世界易全球华人专题页。',
      path: `/world-yi/global/topics/${topic}`,
      type: 'website',
      languages: {
        'zh-CN': `/world-yi/global/topics/${topic}`,
        'x-default': `/world-yi/global/topics/${topic}`,
      },
    });
  }

  return createPublicContentMetadata({
    title: `${surface.title} | 人生K线`,
    description: surface.description,
    path: `/world-yi/global/topics/${surface.key}`,
    type: 'website',
    languages: {
      'zh-CN': `/world-yi/global/topics/${surface.key}`,
      'en-US': '/world-yi/en/tracks',
      'x-default': `/world-yi/global/topics/${surface.key}`,
    },
  });
}

export default async function WorldYiGlobalTopicDetailPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const surface = getSurface(topic);
  if (!surface) {
    notFound();
  }

  const knowledgeEntries = surface.knowledgeSlugs
    .map((slug) => getManagedContentEntryBySlug('knowledge', slug))
    .filter((entry): entry is NonNullable<typeof entry> => !!entry);
  const caseEntries = surface.caseSlugs
    .map((slug) => getManagedContentEntryBySlug('case', slug))
    .filter((entry): entry is NonNullable<typeof entry> => !!entry);
  const schemas = [
    createCollectionPageSchema({
      headline: surface.title,
      description: surface.description,
      path: `/world-yi/global/topics/${surface.key}`,
      keywords: ['世界易', surface.title, '全球华人', '专题', '案例'],
    }),
    createItemListSchema(
      `${surface.title}知识`,
      knowledgeEntries.map((entry, index) => ({
        name: entry.title,
        path: `/knowledge/${entry.slug}`,
        position: index + 1,
      })),
    ),
    createItemListSchema(
      `${surface.title}案例`,
      caseEntries.map((entry, index) => ({
        name: entry.title,
        path: `/cases/${entry.slug}`,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
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

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <ContentCardLink
            href="/world-yi/global/topics"
            page={`/world-yi/global/topics/${surface.key}`}
            meta={{ surfaceKey: `world_yi_global_topic_${surface.key}_network`, targetSurfaceKey: 'world_yi_global_topics_page', contentType: 'knowledge', series: 'world-yi-global' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">专题索引</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">回到全球专题</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/global/cases"
            page={`/world-yi/global/topics/${surface.key}`}
            meta={{ surfaceKey: `world_yi_global_topic_${surface.key}_network`, targetSurfaceKey: 'world_yi_global_cases_page', contentType: 'case', series: 'world-yi-global' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">案例层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">查看全球案例</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/en"
            page={`/world-yi/global/topics/${surface.key}`}
            meta={{ surfaceKey: `world_yi_global_topic_${surface.key}_network`, targetSurfaceKey: 'world_yi_en_page', contentType: 'knowledge', locale: 'en', series: 'world-yi-en' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">英文层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">English gateway</h2>
          </ContentCardLink>
        </section>

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[2rem] p-6 md:p-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
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
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{entry.title}</h2>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">对应案例</div>
          <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">对应案例</h2>
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
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{entry.title}</h2>
              </ContentCardLink>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
