import Link from 'next/link';
import { ArrowRight, Sparkles, Wand2 } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { getManagedContentEntryBySlug } from '@/lib/content-store';
import { worldYiApplicationSurface } from '@/lib/world-yi-surfaces';

export const metadata = {
  title: '世界易生活应用 | 人生K线',
  description: worldYiApplicationSurface.description,
};

export const dynamic = 'force-dynamic';

export default function WorldYiApplicationsPage() {
  const groups = worldYiApplicationSurface.groups.map((group) => ({
    ...group,
    knowledgeEntries: group.knowledgeSlugs
      .map((slug) => getManagedContentEntryBySlug('knowledge', slug))
      .filter((entry): entry is NonNullable<typeof entry> => !!entry),
    caseEntries: group.caseSlugs
      .map((slug) => getManagedContentEntryBySlug('case', slug))
      .filter((entry): entry is NonNullable<typeof entry> => !!entry),
  }));

  return (
    <div className="page-shell">
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/world-yi/applications"
        meta={{ surfaceKey: 'world_yi_applications_page', contentType: 'knowledge', series: 'world-yi-applications' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="进入判断" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Wand2 className="h-3.5 w-3.5" />
              世界易生活应用
            </>
          )}
          title={worldYiApplicationSurface.headline}
          description={worldYiApplicationSurface.description}
          hint="先选一个应用组阅读，再看案例，最后进入分析。"
          actions={[
            { href: '/world-yi', label: '回到世界易总入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/domains', label: '六域总入口' },
            { href: '/analyze', label: '进入分析' },
          ]}
          highlights={worldYiApplicationSurface.doctrine.map((body) => ({ body }))}
        />

        <section className="mt-10 space-y-8">
          {groups.map((group) => (
            <section key={group.title} className="glass-panel rounded-[2rem] p-6 md:p-8">
              <div className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr]">
                <div>
                <div className="section-label">
                  <Sparkles className="h-3.5 w-3.5" />
                  {group.title}
                </div>
                <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">{group.title}</h2>
                  <p className="intro-copy mt-4">{group.description}</p>
              </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {group.knowledgeEntries.map((entry) => (
                    <ContentCardLink
                      key={entry.slug}
                      href={`/knowledge/${entry.slug}`}
                      page="/world-yi/applications"
                      meta={{
                        surfaceKey: 'world_yi_applications_page',
                        targetSurfaceKey: `knowledge_article:${entry.slug}`,
                        contentType: 'knowledge',
                        slug: entry.slug,
                        title: entry.title,
                        category: entry.category,
                        tags: entry.tags,
                        series: 'world-yi-applications',
                      }}
                      className="rounded-[1.6rem] bg-white/82 p-5 transition hover:-translate-y-0.5"
                    >
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                      <h3 className="mt-3 text-xl font-bold text-[color:var(--ink)]">{entry.title}</h3>
                      <p className="intro-copy mt-3">{entry.excerpt}</p>
                    </ContentCardLink>
                  ))}
                  {group.caseEntries.map((entry) => (
                    <ContentCardLink
                      key={entry.slug}
                      href={`/cases/${entry.slug}`}
                      page="/world-yi/applications"
                      meta={{
                        surfaceKey: 'world_yi_applications_page',
                        targetSurfaceKey: `case_article:${entry.slug}`,
                        contentType: 'case',
                        slug: entry.slug,
                        title: entry.title,
                        category: entry.category,
                        tags: entry.tags,
                        series: 'world-yi-applications',
                      }}
                      className="rounded-[1.6rem] bg-[rgba(255,255,255,0.72)] p-5 transition hover:-translate-y-0.5"
                    >
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                      <h3 className="mt-3 text-xl font-bold text-[color:var(--ink)]">{entry.title}</h3>
                      <p className="intro-copy mt-3">{entry.excerpt}</p>
                    </ContentCardLink>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
