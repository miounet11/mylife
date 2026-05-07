import Link from 'next/link';
import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-border-y border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] py-4 md:py-6';
import { isPublicKnowledgeEntry, listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';

export const metadata = createPublicContentMetadata({
  title: '世界易全球传播 | 人生K线',
  description: '面向海外华人和跨文化读者的世界易入口，重点讨论迁移、身份、环境与 AI 时代的高维判断。',
  path: '/world-yi/global',
  type: 'website',
  languages: {
    'zh-CN': '/world-yi/global',
    'en-US': '/world-yi/en',
    'x-default': '/world-yi/global',
  },
});

export const dynamic = 'force-dynamic';

const globalThemes = ['迁移', '身份', '家庭', '事业'];

export default function WorldYiGlobalPage() {
  const globalEntries = listPublishedManagedContentEntriesByType('knowledge')
    .filter((entry) => isPublicKnowledgeEntry(entry) && [
      'world-yi-overseas-chinese',
      'world-yi-global-chinese-decision-map',
      'world-yi-cross-cultural-identity',
      'world-yi-overseas-career-reset',
      'world-yi-bicultural-marriage',
      'world-yi-overseas-eldercare',
      'world-yi-global-child-education',
      'world-yi-era-cognition',
      'world-yi-judgment-crisis',
      'world-yi-environment-method',
      'world-yi-family-generational-order',
    ].includes(entry.slug))
    .slice(0, 8);
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
      headline: '世界易全球传播',
      description: '面向海外华人和跨文化读者的世界易入口，重点讨论迁移、身份、环境与 AI 时代的高维判断。',
      path: '/world-yi/global',
      keywords: ['海外华人', '跨文化', '迁移', '身份', '全球传播'],
    }),
    createItemListSchema(
      '全球传播知识主线',
      globalEntries.map((entry, index) => ({
        name: entry.title,
        path: `/knowledge/${entry.slug}`,
        position: index + 1,
      })),
    ),
    createItemListSchema(
      '全球传播案例主线',
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
        eventName="knowledge_page_viewed"
        page="/world-yi/global"
        meta={{ surfaceKey: 'world_yi_global_page', contentType: 'knowledge', series: 'world-yi-global' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Globe2 className="h-3.5 w-3.5" />
              世界易全球传播
            </>
          )}
          title="全球华人"
          description="把迁移、身份、跨文化家庭与海外发展放进同一条判断路径里，帮助全球华人用更完整的结构看长期选择。"
          hint="如果你的问题和迁移、留学、海外定居或跨文化关系有关，可以从这里进入；如果要先看个人底盘，先去分析入口。"
          actions={[
            { href: '/world-yi/global/topics', label: '看全球专题网络', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/global/cases', label: '看全球案例路径' },
            { href: '/world-yi/en', label: 'English Gateway' },
            { href: '/world-yi', label: '回到世界易总入口' },
          ]}
          highlights={globalThemes.map((body) => ({ body }))}
          highlightsColumns="grid-cols-1"
        />

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[2rem] p-6 md:p-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Sparkles className="h-3.5 w-3.5" />
            全球入口
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ['结构'],
              ['环境'],
              ['动作'],
            ].map(([title]) => (
              <div key={title} className="rounded-[1.5rem] bg-white/80 p-5">
                <div className="text-lg font-bold text-[color:var(--ink)]">{title}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          <ContentCardLink
            href="/world-yi"
            page="/world-yi/global"
            meta={{ surfaceKey: 'world_yi_global_page_network', targetSurfaceKey: 'world_yi_page', contentType: 'knowledge', series: 'world-yi' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到母入口</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">世界易总入口</h2>
          </ContentCardLink>

          <ContentCardLink
            href="/cases"
            page="/world-yi/global"
            meta={{ surfaceKey: 'world_yi_global_page_network', targetSurfaceKey: 'cases_page', contentType: 'case', series: 'world-yi-global' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到案例库</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">公开案例库</h2>
          </ContentCardLink>

          <ContentCardLink
            href="/world-yi/en"
            page="/world-yi/global"
            meta={{ surfaceKey: 'world_yi_global_page_network', targetSurfaceKey: 'world_yi_en_page', contentType: 'knowledge', series: 'world-yi-en' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">切到英文层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">English Gateway</h2>
          </ContentCardLink>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">相关阅读</div>
              <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">相关阅读</h2>
            </div>
            <Link href="/world-yi/global/topics" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">
              查看全部全球专题
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {globalEntries.map((entry) => (
              <ContentCardLink
                key={entry.slug}
                href={`/knowledge/${entry.slug}`}
                page="/world-yi/global"
                meta={{
                  surfaceKey: 'world_yi_global_page',
                  targetSurfaceKey: `knowledge_article:${entry.slug}`,
                  contentType: 'knowledge',
                  slug: entry.slug,
                  title: entry.title,
                  category: entry.category,
                  tags: entry.tags,
                  series: 'world-yi-global',
                }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{entry.title}</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  继续阅读
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">全球案例层</div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">全球案例层</h2>
              <Link href="/world-yi/global/cases" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] mt-5">
                进入全球案例入口
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {globalCases.slice(0, 4).map((item) => (
                <ContentCardLink
                  key={item.slug}
                  href={`/cases/${item.slug}`}
                  page="/world-yi/global"
                  meta={{
                    surfaceKey: 'world_yi_global_page',
                    targetSurfaceKey: `case_article:${item.slug}`,
                    contentType: 'case',
                    slug: item.slug,
                    title: item.title,
                    tags: item.tags,
                    series: 'world-yi-global',
                  }}
                  className="rounded-[1.5rem] bg-white/80 p-5 transition hover:-translate-y-0.5"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                </ContentCardLink>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
