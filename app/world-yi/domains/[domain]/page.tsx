import { notFound } from 'next/navigation';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { getManagedContentEntryBySlug } from '@/lib/content-store';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import { worldYiDomainSurfaces, type WorldYiDomainKey } from '@/lib/world-yi-surfaces';

export const dynamic = 'force-dynamic';

function getDomainSurface(domain: string) {
  return worldYiDomainSurfaces[domain as WorldYiDomainKey] || null;
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const surface = getDomainSurface(domain);
  if (!surface) {
    return createPublicContentMetadata({
      title: '世界易分科 | 人生K线',
      description: '世界易人生分科入口。',
      path: `/world-yi/domains/${domain}`,
      type: 'website',
      languages: {
        'zh-CN': `/world-yi/domains/${domain}`,
        'x-default': `/world-yi/domains/${domain}`,
      },
    });
  }

  return createPublicContentMetadata({
    title: `${surface.title} | 人生K线`,
    description: surface.description,
    path: `/world-yi/domains/${surface.key}`,
    type: 'website',
    languages: {
      'zh-CN': `/world-yi/domains/${surface.key}`,
      'x-default': `/world-yi/domains/${surface.key}`,
    },
  });
}

export default async function WorldYiDomainDetailPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const surface = getDomainSurface(domain);
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
      path: `/world-yi/domains/${surface.key}`,
      keywords: ['世界易', surface.title, '人生六域', '知识', '案例'],
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
        page={`/world-yi/domains/${surface.key}`}
        meta={{ surfaceKey: `world_yi_domain_${surface.key}`, contentType: 'knowledge', series: 'world-yi-domains' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="进入判断" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Compass className="h-3.5 w-3.5" />
              {surface.title}
            </>
          )}
          title={surface.headline}
          description={surface.description}
          hint="先顺着这条分科主线读知识与案例，再决定是否回到个人分析，把公共路径转成你自己的判断。"
          actions={[
            { href: '/world-yi/domains', label: '回到六域总入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/applications', label: '生活应用入口' },
            { href: '/cases', label: '全部案例库' },
          ]}
          highlights={surface.doctrine.slice(0, 4).map((body) => ({ body }))}
        />

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <ContentCardLink
            href="/world-yi/domains"
            page={`/world-yi/domains/${surface.key}`}
            meta={{ surfaceKey: `world_yi_domain_${surface.key}_network`, targetSurfaceKey: 'world_yi_domains_page', contentType: 'knowledge', series: 'world-yi-domains' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">总入口</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">回到人生六域</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/book"
            page={`/world-yi/domains/${surface.key}`}
            meta={{ surfaceKey: `world_yi_domain_${surface.key}_network`, targetSurfaceKey: 'world_yi_book_page', contentType: 'knowledge', series: 'world-yi-book' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">主书母线</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">主书工程</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/applications"
            page={`/world-yi/domains/${surface.key}`}
            meta={{ surfaceKey: `world_yi_domain_${surface.key}_network`, targetSurfaceKey: 'world_yi_applications_page', contentType: 'knowledge', series: 'world-yi-applications' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">动作层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">生活应用入口</h2>
          </ContentCardLink>
        </section>

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Sparkles className="h-3.5 w-3.5" />
            分科阅读路径
          </div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">知识</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {knowledgeEntries.map((entry) => (
              <ContentCardLink
                key={entry.slug}
                href={`/knowledge/${entry.slug}`}
                page={`/world-yi/domains/${surface.key}`}
                meta={{
                  surfaceKey: `world_yi_domain_${surface.key}`,
                  targetSurfaceKey: `knowledge_article:${entry.slug}`,
                  contentType: 'knowledge',
                  slug: entry.slug,
                  title: entry.title,
                  category: entry.category,
                  tags: entry.tags,
                  series: 'world-yi-domains',
                }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{entry.title}</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  阅读知识主线
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">对应案例</div>
              <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">案例</h2>
            </div>
            <ContentCardLink
              href="/cases"
              page={`/world-yi/domains/${surface.key}`}
              meta={{ surfaceKey: `world_yi_domain_${surface.key}_network`, targetSurfaceKey: 'cases_page', contentType: 'case', series: 'world-yi-domains' }}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
            >
              查看全部案例
              <ArrowRight className="h-4 w-4" />
            </ContentCardLink>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {caseEntries.map((entry) => (
              <ContentCardLink
                key={entry.slug}
                href={`/cases/${entry.slug}`}
                page={`/world-yi/domains/${surface.key}`}
                meta={{
                  surfaceKey: `world_yi_domain_${surface.key}`,
                  targetSurfaceKey: `case_article:${entry.slug}`,
                  contentType: 'case',
                  slug: entry.slug,
                  title: entry.title,
                  category: entry.category,
                  tags: entry.tags,
                  series: 'world-yi-domains',
                }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{entry.title}</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  查看案例
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
