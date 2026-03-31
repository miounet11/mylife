import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { listPublishedManagedContentEntriesByType } from '@/lib/content-store';

export const metadata = {
  title: 'World Yi English Cases | Life Kline',
  description: 'English-facing World Yi case studies that connect pattern, stage, environment, and action to real decision scenarios.',
};

export const dynamic = 'force-dynamic';

export default function WorldYiEnglishCasesPage() {
  const englishCases = listPublishedManagedContentEntriesByType('case')
    .filter((entry) => [
      'world-yi-en-case-career-timing',
      'world-yi-en-case-global-return',
      'world-yi-en-case-burnout',
      'world-yi-en-case-relationship-pacing',
      'world-yi-en-case-naming-across-cultures',
    ].includes(entry.slug))
    .slice(0, 6);

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="cases_page_viewed"
        page="/world-yi/en/cases"
        meta={{ surfaceKey: 'world_yi_en_cases_page', contentType: 'case', locale: 'en', series: 'world-yi-en' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="Start Analysis" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              World Yi English Cases
            </>
          )}
          title={(
            <>
              From theory to
              <span className="font-serif text-[color:var(--accent-strong)]"> real-life decision cases.</span>
            </>
          )}
          description="These cases are not prediction theater. They show how World Yi reads a situation through pattern, stage, environment, action, and risk, then turns that reading back into usable decision order."
          hint="Recommended path: choose one case, then move into analysis."
          actionLabel="Quick Actions"
          actions={[
            { href: '/world-yi/en', label: 'Back to English Gateway', primary: true, icon: <ArrowRight className="ml-2 h-4 w-4" /> },
            { href: '/analyze', label: 'Start Your Analysis' },
          ]}
          highlights={[
            { body: 'Cases clarify what the real question is.' },
            { body: 'Cases show why timing often matters more than labels.' },
            { body: 'Cases reveal how environment changes decision cost.' },
            { body: 'Cases return abstract insight back to action.' },
          ]}
        />

        <section className="mt-10">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {englishCases.map((item) => (
              <ContentCardLink
                key={item.slug}
                href={`/cases/${item.slug}`}
                page="/world-yi/en/cases"
                meta={{
                  surfaceKey: 'world_yi_en_cases_page',
                  targetSurfaceKey: `case_article:${item.slug}`,
                  contentType: 'case',
                  slug: item.slug,
                  title: item.title,
                  category: item.category,
                  tags: item.tags,
                  locale: 'en',
                  series: 'world-yi-en',
                }}
                className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.category}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{item.title}</h2>
                <p className="intro-copy mt-3">{item.excerpt}</p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
                  Read case
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
