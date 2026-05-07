import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import { worldYiEnglishTrackSurfaces } from '@/lib/world-yi-global-surfaces';

export const metadata = createPublicContentMetadata({
  title: 'World Yi English Tracks | Life Kline',
  description: 'Track-based English entry points for World Yi: foundation, global life, wealth, and relationships.',
  path: '/world-yi/en/tracks',
  type: 'website',
  locale: 'en_US',
  languages: {
    'zh-CN': '/world-yi/global/topics',
    'en-US': '/world-yi/en/tracks',
    'x-default': '/world-yi/en/tracks',
  },
});

export const dynamic = 'force-dynamic';

export default function WorldYiEnglishTracksPage() {
  const tracks = Object.values(worldYiEnglishTrackSurfaces);
  const schemas = [
    createCollectionPageSchema({
      headline: 'World Yi English Tracks',
      description: 'Track-based English entry points for World Yi: foundation, global life, wealth, and relationships.',
      path: '/world-yi/en/tracks',
      keywords: ['World Yi', 'English tracks', 'foundation', 'global life', 'wealth', 'relationships'],
    }),
    createItemListSchema(
      'World Yi English Tracks',
      tracks.map((track, index) => ({
        name: track.title,
        path: `/world-yi/en/tracks/${track.key}`,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/world-yi/en/tracks"
        meta={{ surfaceKey: 'world_yi_en_tracks_page', contentType: 'knowledge', locale: 'en', series: 'world-yi-en' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="Start Analysis" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Globe2 className="h-3.5 w-3.5" />
              World Yi English Tracks
            </>
          )}
          title={(
            <>
              The English layer is no longer a single gateway,
              <span className="font-serif text-[color:var(--accent-strong)]"> but a reading network.</span>
            </>
          )}
          description="These tracks help English readers move through World Yi in a clearer order: foundation first, then global life, wealth, and relationships."
          hint="Start with one track first, then move to cases and analysis."
          actionLabel="Quick Actions"
          actions={[
            { href: '/world-yi/en', label: 'Back to English Gateway', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/en/cases', label: 'English Cases' },
            { href: '/analyze', label: 'Start Analysis' },
          ]}
          highlights={[
            { body: 'Foundation gives readers a usable vocabulary.' },
            { body: 'Global-life track handles migration and identity pressure.' },
            { body: 'Wealth track separates earning, retention, and timing.' },
            { body: 'Relationship track restores pace, boundaries, and environment.' },
          ]}
        />

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <ContentCardLink
            href="/world-yi/en"
            page="/world-yi/en/tracks"
            meta={{ surfaceKey: 'world_yi_en_tracks_page_network', targetSurfaceKey: 'world_yi_en_page', contentType: 'knowledge', locale: 'en', series: 'world-yi-en' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Globe2 className="h-3.5 w-3.5" />
              English gateway
            </div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">World Yi entry</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/en/cases"
            page="/world-yi/en/tracks"
            meta={{ surfaceKey: 'world_yi_en_tracks_page_network', targetSurfaceKey: 'world_yi_en_cases_page', contentType: 'case', locale: 'en', series: 'world-yi-en' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Sparkles className="h-3.5 w-3.5" />
              Case layer
            </div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">English cases</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/global"
            page="/world-yi/en/tracks"
            meta={{ surfaceKey: 'world_yi_en_tracks_page_network', targetSurfaceKey: 'world_yi_global_page', contentType: 'knowledge', series: 'world-yi-global' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Globe2 className="h-3.5 w-3.5" />
              Chinese global layer
            </div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">Global Chinese path</h2>
          </ContentCardLink>
        </section>

        <section className="mt-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Sparkles className="h-3.5 w-3.5" />
            Tracks
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {tracks.map((track) => (
              <ContentCardLink
                key={track.key}
                href={`/world-yi/en/tracks/${track.key}`}
                page="/world-yi/en/tracks"
                meta={{
                  surfaceKey: 'world_yi_en_tracks_page',
                  targetSurfaceKey: `world_yi_en_track:${track.key}`,
                  contentType: 'knowledge',
                  locale: 'en',
                  series: 'world-yi-en',
                }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
              >
                <h2 className="text-2xl font-bold text-[color:var(--ink)]">{track.title}</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  Open track
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
