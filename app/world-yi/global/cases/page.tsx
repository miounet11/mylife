import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';

export const metadata = createPublicContentMetadata({
  title: '世界易全球案例 | 人生K线',
  description: '面向海外华人和跨文化用户的世界易案例路径，重点处理留回判断、家庭排序、跨境创业与孩子身份教育。',
  path: '/world-yi/global/cases',
  type: 'website',
  languages: {
    'zh-CN': '/world-yi/global/cases',
    'en-US': '/world-yi/en/cases',
    'x-default': '/world-yi/global/cases',
  },
});

export const dynamic = 'force-dynamic';

export default function WorldYiGlobalCasesPage() {
  const globalCases = listPublishedManagedContentEntriesByType('case')
    .filter((entry) => [
      'world-yi-case-return-or-stay',
      'world-yi-case-global-family-balance',
      'world-yi-case-cross-border-founder',
      'world-yi-case-child-language-identity',
      'world-yi-case-overseas-career-reset',
      'world-yi-case-bicultural-marriage',
      'world-yi-case-overseas-eldercare',
      'world-yi-case-global-school-choice',
    ].includes(entry.slug))
    .slice(0, 8);
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易全球案例',
      description: '面向海外华人和跨文化用户的世界易案例路径，重点处理留回判断、家庭排序、跨境创业与孩子身份教育。',
      path: '/world-yi/global/cases',
      keywords: ['世界易', '全球案例', '海外华人', '跨境创业', '教育选择'],
    }),
    createItemListSchema(
      '世界易全球案例',
      globalCases.map((entry, index) => ({
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
        eventName="cases_page_viewed"
        page="/world-yi/global/cases"
        meta={{ surfaceKey: 'world_yi_global_cases_page', contentType: 'case', series: 'world-yi-global' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Globe2 className="h-3.5 w-3.5" />
              世界易全球案例
            </>
          )}
          title="全球案例"
          description="用真实全球案例去看留回、教育、跨境创业和家庭排序这些问题是怎么被拆解和判断的。"
          hint="适合先找与自己接近的处境建立判断感；如果准备直接看个人结果，就回到分析入口补齐出生信息。"
          actions={[
            { href: '/analyze', label: '开始分析', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/global', label: '回到全球入口' },
            { href: '/world-yi/en', label: 'English Gateway' },
          ]}
          highlights={[
            { body: '留回' },
            { body: '家庭' },
            { body: '跨境创业' },
            { body: '教育' },
          ]}
        />

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <ContentCardLink
            href="/world-yi/global"
            page="/world-yi/global/cases"
            meta={{ surfaceKey: 'world_yi_global_cases_page_network', targetSurfaceKey: 'world_yi_global_page', contentType: 'knowledge', series: 'world-yi-global' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">Global gateway</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">Back to global path</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/global/topics"
            page="/world-yi/global/cases"
            meta={{ surfaceKey: 'world_yi_global_cases_page_network', targetSurfaceKey: 'world_yi_global_topics_page', contentType: 'knowledge', series: 'world-yi-global' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">Knowledge layer</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">Browse global topics</h2>
          </ContentCardLink>
          <ContentCardLink
            href="/world-yi/en/cases"
            page="/world-yi/global/cases"
            meta={{ surfaceKey: 'world_yi_global_cases_page_network', targetSurfaceKey: 'world_yi_en_cases_page', contentType: 'case', locale: 'en', series: 'world-yi-en' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">English layer</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">See English cases</h2>
          </ContentCardLink>
        </section>

        <section className="mt-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Sparkles className="h-3.5 w-3.5" />
            全球案例路径
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {globalCases.map((entry) => (
              <ContentCardLink
                key={entry.slug}
                href={`/cases/${entry.slug}`}
                page="/world-yi/global/cases"
                meta={{
                  surfaceKey: 'world_yi_global_cases_page',
                  targetSurfaceKey: `case_article:${entry.slug}`,
                  contentType: 'case',
                  slug: entry.slug,
                  title: entry.title,
                  category: entry.category,
                  tags: entry.tags,
                  series: 'world-yi-global',
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
