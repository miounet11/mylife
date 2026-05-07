import { ArrowRight, BookOpenText, LibraryBig, Sparkles, Wand2 } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { getManagedContentEntryBySlug } from '@/lib/content-store';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import { worldYiApplicationSurface } from '@/lib/world-yi-surfaces';

export const metadata = createPublicContentMetadata({
  title: '世界易生活应用 | 人生K线',
  description: worldYiApplicationSurface.description,
  path: '/world-yi/applications',
  type: 'website',
  languages: {
    'zh-CN': '/world-yi/applications',
    'x-default': '/world-yi/applications',
  },
});

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
  const knowledgeEntries = groups.flatMap((group) => group.knowledgeEntries);
  const caseEntries = groups.flatMap((group) => group.caseEntries);
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易生活应用',
      description: worldYiApplicationSurface.description,
      path: '/world-yi/applications',
      keywords: ['世界易', '生活应用', '起名', '择时', '寻物', '家宅'],
    }),
    createItemListSchema(
      '世界易应用知识',
      knowledgeEntries.map((entry, index) => ({
        name: entry.title,
        path: `/knowledge/${entry.slug}`,
        position: index + 1,
      })),
    ),
    createItemListSchema(
      '世界易应用案例',
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
          description="把世界易从概念层往现实动作里落，围绕起名、择时、寻物、家宅等高频生活问题，建立能直接使用的应用路径。"
          hint="如果你还没有个人底盘，先完成一次分析；如果你已经有结果，这里适合继续把判断转成具体动作。"
          actions={[
            { href: '/world-yi', label: '回到世界易总入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/domains', label: '六域总入口' },
            { href: '/analyze', label: '进入分析' },
          ]}
          highlights={worldYiApplicationSurface.doctrine.slice(0, 4).map((body) => ({ body }))}
        />

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-3">
            <ContentCardLink
              href="/world-yi/domains"
              page="/world-yi/applications"
              meta={{ surfaceKey: 'world_yi_applications_page_network', targetSurfaceKey: 'world_yi_domains_page', contentType: 'knowledge', series: 'world-yi-applications' }}
              className="rounded-[1.75rem] bg-white/82 p-6 transition hover:bg-white"
            >
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <BookOpenText className="h-3.5 w-3.5" />
                回到六域
              </div>
              <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">人生六域</h2>
            </ContentCardLink>
            <ContentCardLink
              href="/world-yi/book"
              page="/world-yi/applications"
              meta={{ surfaceKey: 'world_yi_applications_page_network', targetSurfaceKey: 'world_yi_book_page', contentType: 'knowledge', series: 'world-yi-book' }}
              className="rounded-[1.75rem] bg-white/82 p-6 transition hover:bg-white"
            >
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <LibraryBig className="h-3.5 w-3.5" />
                回到主书
              </div>
              <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">主书工程</h2>
            </ContentCardLink>
            <ContentCardLink
              href="/world-yi/insights"
              page="/world-yi/applications"
              meta={{ surfaceKey: 'world_yi_applications_page_network', targetSurfaceKey: 'world_yi_insights_page', contentType: 'insight', series: 'world-yi-insights' }}
              className="rounded-[1.75rem] bg-white/82 p-6 transition hover:bg-white"
            >
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <Sparkles className="h-3.5 w-3.5" />
                补环境层
              </div>
              <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">环境洞察</h2>
            </ContentCardLink>
          </div>
        </section>

        <section className="mt-10 space-y-8">
          {groups.map((group) => (
            <section key={group.title} className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
              <div className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr]">
                <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  {group.title}
                </div>
                <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">{group.title}</h2>
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
