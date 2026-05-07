import { notFound } from 'next/navigation';
import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { getManagedContentEntryBySlug } from '@/lib/content-store';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import { worldYiEnglishTrackSurfaces, type WorldYiEnglishTrackKey } from '@/lib/world-yi-global-surfaces';

export const dynamic = 'force-dynamic';

function getSurface(track: string) {
  return worldYiEnglishTrackSurfaces[track as WorldYiEnglishTrackKey] || null;
}

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  const surface = getSurface(track);
  if (!surface) {
    return createPublicContentMetadata({
      title: 'World Yi English Track | Life Kline',
      description: 'World Yi English track page.',
      path: `/world-yi/en/tracks/${track}`,
      type: 'website',
      locale: 'en-US',
      languages: {
        'en-US': `/world-yi/en/tracks/${track}`,
        'x-default': `/world-yi/en/tracks/${track}`,
      },
    });
  }

  return createPublicContentMetadata({
    title: `${surface.title} | Life Kline`,
    description: surface.description,
    path: `/world-yi/en/tracks/${surface.key}`,
    type: 'website',
    locale: 'en-US',
    languages: {
      'zh-CN': '/world-yi/global/topics',
      'en-US': `/world-yi/en/tracks/${surface.key}`,
      'x-default': `/world-yi/en/tracks/${surface.key}`,
    },
  });
}

export default async function WorldYiEnglishTrackDetailPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  const surface = getSurface(track);
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
      path: `/world-yi/en/tracks/${surface.key}`,
      keywords: ['World Yi', surface.title, 'English', 'track', 'cases'],
    }),
    createItemListSchema(
      `${surface.title} Articles`,
      knowledgeEntries.map((entry, index) => ({
        name: entry.title,
        path: `/knowledge/${entry.slug}`,
        position: index + 1,
      })),
    ),
    createItemListSchema(
      `${surface.title} Cases`,
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
        page={`/world-yi/en/tracks/${surface.key}`}
        meta={{ surfaceKey: `world_yi_en_track_${surface.key}`, contentType: 'knowledge', locale: 'en', series: 'world-yi-en' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="Start Analysis" />

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
          hint="Recommended flow: core article → related case → personal analysis."
          actionLabel="Quick Actions"
          actions={[
            { href: '/world-yi/en/tracks', label: 'Back to English Tracks', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/en/cases', label: 'English Cases' },
            { href: '/analyze', label: 'Start Analysis' },
          ]}
          highlights={surface.doctrine.map((body) => ({ body }))}
        />

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <ContentCardLink
            href="/world-yi/en/tracks"
            page={`/world-yi/en/tracks/${surface.key}`}
            meta={{ surfaceKey: `world_yi_en_track_${surface.key}_network`, targetSurfaceKey: 'world_yi_en_tracks_page', contentType: 'knowledge', locale: 'en', series: 'world-yi-en' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">Track index</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">All English tracks</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/en/cases"
            page={`/world-yi/en/tracks/${surface.key}`}
            meta={{ surfaceKey: `world_yi_en_track_${surface.key}_network`, targetSurfaceKey: 'world_yi_en_cases_page', contentType: 'case', locale: 'en', series: 'world-yi-en' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">Case layer</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">English cases</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/global"
            page={`/world-yi/en/tracks/${surface.key}`}
            meta={{ surfaceKey: `world_yi_en_track_${surface.key}_network`, targetSurfaceKey: 'world_yi_global_page', contentType: 'knowledge', series: 'world-yi-global' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">Chinese global layer</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">Global Chinese path</h2>
          </ContentCardLink>
        </section>

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Sparkles className="h-3.5 w-3.5" />
            Core Articles
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {knowledgeEntries.map((entry) => (
              <ContentCardLink
                key={entry.slug}
                href={`/knowledge/${entry.slug}`}
                page={`/world-yi/en/tracks/${surface.key}`}
                meta={{
                  surfaceKey: `world_yi_en_track_${surface.key}`,
                  targetSurfaceKey: `knowledge_article:${entry.slug}`,
                  contentType: 'knowledge',
                  locale: 'en',
                  series: 'world-yi-en',
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
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">Cases</div>
          <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">Cases</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {caseEntries.map((entry) => (
              <ContentCardLink
                key={entry.slug}
                href={`/cases/${entry.slug}`}
                page={`/world-yi/en/tracks/${surface.key}`}
                meta={{
                  surfaceKey: `world_yi_en_track_${surface.key}`,
                  targetSurfaceKey: `case_article:${entry.slug}`,
                  contentType: 'case',
                  locale: 'en',
                  series: 'world-yi-en',
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
