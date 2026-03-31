import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { getManagedContentEntryBySlug } from '@/lib/content-store';
import { worldYiDomainSurfaces, type WorldYiDomainKey } from '@/lib/world-yi-surfaces';

export const dynamic = 'force-dynamic';

function getDomainSurface(domain: string) {
  return worldYiDomainSurfaces[domain as WorldYiDomainKey] || null;
}

export function generateMetadata({ params }: { params: { domain: string } }): Metadata {
  const surface = getDomainSurface(params.domain);
  if (!surface) {
    return {
      title: '世界易分科 | 人生K线',
    };
  }

  return {
    title: `${surface.title} | 人生K线`,
    description: surface.description,
  };
}

export default function WorldYiDomainDetailPage({ params }: { params: { domain: string } }) {
  const surface = getDomainSurface(params.domain);
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
          hint="先完成本分科主线阅读，再补案例和应用层，会更容易形成可执行判断。"
          actions={[
            { href: '/world-yi/domains', label: '回到六域总入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/applications', label: '生活应用入口' },
            { href: '/cases', label: '全部案例库' },
          ]}
          highlights={surface.doctrine.map((body) => ({ body }))}
        />

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            分科阅读路径
          </div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">
            先用知识文章固定判断框架，再用案例把这条主线压回现实。
          </h2>
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
                className="soft-card rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{entry.title}</h2>
                <p className="intro-copy mt-3">{entry.excerpt}</p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
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
              <div className="section-label">对应案例</div>
              <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">案例是这条主线的证据层，不是额外点缀。</h2>
            </div>
            <Link href="/cases" className="action-secondary">
              查看全部案例
              <ArrowRight className="h-4 w-4" />
            </Link>
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
                className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{entry.title}</h2>
                <p className="intro-copy mt-3">{entry.excerpt}</p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
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
