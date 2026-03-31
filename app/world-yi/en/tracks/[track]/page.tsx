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
import { worldYiEnglishTrackSurfaces, type WorldYiEnglishTrackKey } from '@/lib/world-yi-global-surfaces';

export const dynamic = 'force-dynamic';

function getSurface(track: string) {
  return worldYiEnglishTrackSurfaces[track as WorldYiEnglishTrackKey] || null;
}

export function generateMetadata({ params }: { params: { track: string } }): Metadata {
  const surface = getSurface(params.track);
  return {
    title: surface ? `${surface.title} | Life Kline` : 'World Yi English Track | Life Kline',
    description: surface?.description || 'World Yi English track page',
  };
}

export default function WorldYiEnglishTrackDetailPage({ params }: { params: { track: string } }) {
  const surface = getSurface(params.track);
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

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="section-label">
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
              <div className="section-label">Cases</div>
              <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">Cases keep English World Yi grounded in real decisions.</h2>
            </div>
            <Link href="/world-yi/en/cases" className="action-secondary">
              Browse English cases
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
