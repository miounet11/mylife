import Link from 'next/link';
import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { isPublicKnowledgeEntry, listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';

export const metadata = createPublicContentMetadata({
  title: 'World Yi English Gateway | Life Kline',
  description: 'An English-facing gateway to World Yi, a modern decision framework that connects structure, timing, environment, and action.',
  path: '/world-yi/en',
  type: 'website',
  locale: 'en-US',
  languages: {
    'zh-CN': '/world-yi',
    'en-US': '/world-yi/en',
    'x-default': '/world-yi/en',
  },
});

export const dynamic = 'force-dynamic';

const pillars = [
  {
    title: 'You are not random. You have structure.',
    body: 'World Yi starts by clarifying how a person tends to carry pressure, make choices, and spend energy.',
  },
  {
    title: 'You are not simply unlucky. You are in a stage.',
    body: 'Many painful periods are not final verdicts. They are stage-specific conditions that require different pacing.',
  },
  {
    title: 'Environment matters as much as intention.',
    body: 'City, industry, family obligations, and technology conditions can all change the real cost of the same decision.',
  },
  {
    title: 'The goal is judgment, not fatalism.',
    body: 'World Yi does not ask people to surrender their lives. It helps them rebuild decision order.',
  },
];

const englishTopicTracks = [
  {
    title: 'Wealth and expansion',
    description: 'How earning, retaining, scaling, and financial timing should be read as different layers.',
    href: '/knowledge/world-yi-en-wealth-pattern',
  },
  {
    title: 'Relationships and environment',
    description: 'Why pace, boundaries, migration pressure, and work density change relational cost.',
    href: '/knowledge/world-yi-en-relationship-environment',
  },
];

export default function WorldYiEnglishPage() {
  const englishEntries = listPublishedManagedContentEntriesByType('knowledge')
    .filter((entry) => isPublicKnowledgeEntry(entry) && [
      'world-yi-en-introduction',
      'world-yi-en-judgment-language',
      'world-yi-en-global-life',
      'world-yi-en-wealth-pattern',
      'world-yi-en-relationship-environment',
    ].includes(entry.slug))
    .slice(0, 6);
  const englishCases = listPublishedManagedContentEntriesByType('case')
    .filter((entry) => [
      'world-yi-en-case-career-timing',
      'world-yi-en-case-global-return',
      'world-yi-en-case-burnout',
      'world-yi-en-case-relationship-pacing',
      'world-yi-en-case-naming-across-cultures',
    ].includes(entry.slug))
    .slice(0, 5);
  const schemas = [
    createCollectionPageSchema({
      headline: 'World Yi English Gateway',
      description: 'An English-facing gateway to World Yi, a modern decision framework that connects structure, timing, environment, and action.',
      path: '/world-yi/en',
      keywords: ['World Yi', 'English gateway', 'structure', 'timing', 'environment', 'action'],
    }),
    createItemListSchema(
      'English Reading Path',
      englishEntries.map((entry, index) => ({
        name: entry.title,
        path: `/knowledge/${entry.slug}`,
        position: index + 1,
      })),
    ),
    createItemListSchema(
      'English Cases',
      englishCases.map((entry, index) => ({
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
        page="/world-yi/en"
        meta={{ surfaceKey: 'world_yi_en_page', contentType: 'knowledge', locale: 'en', series: 'world-yi-en' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="Start Analysis" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Globe2 className="h-3.5 w-3.5" />
              World Yi English Gateway
            </>
          )}
          title={(
            <>
              A modern decision language
              <span className="font-serif text-[color:var(--accent-strong)]"> for the AI era.</span>
            </>
          )}
          description="World Yi is not a simplified mysticism product. It is a structured framework that connects classical change-thinking with timing, environment, technology, migration pressure, and real-world action."
          hint="Recommended first path: English Tracks → Cases → Start Analysis."
          actionLabel="Quick Actions"
          actions={[
            { href: '/world-yi/en/tracks', label: 'English Tracks', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/en/cases', label: 'English Cases' },
            { href: '/analyze', label: 'Start Analysis' },
          ]}
          highlights={pillars}
        />

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Sparkles className="h-3.5 w-3.5" />
            Why it matters now
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ['Industrial era rewarded execution.', 'Information era rewarded access and filtering.'],
              ['AI era rewards judgment.', 'The rarest skill is no longer collecting answers, but ordering them.'],
              ['World Yi rebuilds order.', 'It asks: what is your structure, what stage are you in, what environment are you facing, and what should you do next?'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-[var(--radius-md)] bg-white/80 p-5">
                <div className="text-lg font-bold text-[color:var(--ink)]">{title}</div>
                <div className="mt-3 text-sm font-semibold text-[color:var(--ink)]">{description}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">English Reading Path</div>
            <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">Start with the introduction, then move into method, global life, wealth, and relationships</h2>
          </div>
          <div className="mt-4">
            <Link href="/world-yi/en/tracks" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">
              Browse all English tracks
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {englishEntries.map((entry) => (
              <ContentCardLink
                key={entry.slug}
                href={`/knowledge/${entry.slug}`}
                page="/world-yi/en"
                meta={{
                  surfaceKey: 'world_yi_en_page',
                  targetSurfaceKey: `knowledge_article:${entry.slug}`,
                  contentType: 'knowledge',
                  slug: entry.slug,
                  title: entry.title,
                  category: entry.category,
                  tags: entry.tags,
                  locale: 'en',
                  series: 'world-yi-en',
                }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{entry.title}</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  Read article
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">English Topic Tracks</div>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">Topic Tracks</h2>
            <div className="mt-5 grid gap-4">
              {englishTopicTracks.map((item) => (
                <ContentCardLink
                  key={item.href}
                  href={item.href}
                  page="/world-yi/en"
                  meta={{
                    surfaceKey: 'world_yi_en_page',
                    targetSurfaceKey: item.href.replace('/knowledge/', 'knowledge_article:'),
                    contentType: 'knowledge',
                    locale: 'en',
                    series: 'world-yi-en',
                  }}
                  className="rounded-[var(--radius-md)] bg-white/80 p-5 transition hover:-translate-y-0.5"
                >
                  <div className="text-lg font-bold text-[color:var(--ink)]">{item.title}</div>
                  <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-4 inline-flex items-center gap-2">
                    Read track
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </ContentCardLink>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">English Cases</div>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">Cases</h2>
            <div className="mt-5 space-y-4">
              {englishCases.slice(0, 4).map((entry) => (
                <ContentCardLink
                  key={entry.slug}
                  href={`/cases/${entry.slug}`}
                  page="/world-yi/en"
                  meta={{
                    surfaceKey: 'world_yi_en_page',
                    targetSurfaceKey: `case_article:${entry.slug}`,
                    contentType: 'case',
                    slug: entry.slug,
                    title: entry.title,
                    tags: entry.tags,
                    locale: 'en',
                    series: 'world-yi-en',
                  }}
                  className="block rounded-[var(--radius-md)] bg-white/80 p-5 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{entry.title}</div>
                </ContentCardLink>
              ))}
            </div>
              <Link href="/world-yi/en/cases" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] mt-5">
                Browse all English cases
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/world-yi/en/tracks" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] mt-3">
                Open English track network
                <ArrowRight className="h-4 w-4" />
              </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          <ContentCardLink
            href="/world-yi"
            page="/world-yi/en"
            meta={{ surfaceKey: 'world_yi_en_page_network', targetSurfaceKey: 'world_yi_page', contentType: 'knowledge', series: 'world-yi' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">Back to Core</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">Core System</h2>
          </ContentCardLink>

          <ContentCardLink
            href="/cases"
            page="/world-yi/en"
            meta={{ surfaceKey: 'world_yi_en_page_network', targetSurfaceKey: 'cases_page', contentType: 'case', series: 'world-yi-en' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">Back to Proof</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">Public Cases</h2>
          </ContentCardLink>

          <ContentCardLink
            href="/world-yi/global"
            page="/world-yi/en"
            meta={{ surfaceKey: 'world_yi_en_page_network', targetSurfaceKey: 'world_yi_global_page', contentType: 'knowledge', series: 'world-yi-global' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">Cross to Global</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">Global Layer</h2>
          </ContentCardLink>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
