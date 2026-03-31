import Link from 'next/link';
import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { worldYiEnglishTrackSurfaces } from '@/lib/world-yi-global-surfaces';

export const metadata = {
  title: 'World Yi English Tracks | Life Kline',
  description: 'Track-based English entry points for World Yi: foundation, global life, wealth, and relationships.',
};

export const dynamic = 'force-dynamic';

export default function WorldYiEnglishTracksPage() {
  const tracks = Object.values(worldYiEnglishTrackSurfaces);

  return (
    <div className="page-shell">
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

        <section className="mt-10">
          <div className="section-label">
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
                className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <h2 className="text-2xl font-bold text-[color:var(--ink)]">{track.title}</h2>
                <p className="intro-copy mt-3">{track.summary}</p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
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
