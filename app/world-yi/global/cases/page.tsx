import Link from 'next/link';
import { ArrowRight, Globe2, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { listPublishedManagedContentEntriesByType } from '@/lib/content-store';

export const metadata = {
  title: '世界易全球案例 | 人生K线',
  description: '面向海外华人和跨文化用户的世界易案例路径，重点处理留回判断、家庭排序、跨境创业与孩子身份教育。',
};

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

  return (
    <div className="page-shell">
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
          title={(
            <>
              面向全球华人的，
              <span className="font-serif text-[color:var(--accent-strong)]">多线现实判断案例。</span>
            </>
          )}
          description="这些案例不只讨论留回、城市和工作，还把父母照护、孩子教育、跨境创业、身份切换和现金流压力一起拉回同一套世界易结构。"
          hint="建议先选择一个与你最接近的案例，再进入分析页验证个人路径。"
          actions={[
            { href: '/analyze', label: '开始分析', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/global', label: '回到全球入口' },
            { href: '/world-yi/en', label: 'English Gateway' },
          ]}
          highlights={[
            { body: '留回问题通常只是表面，真正难的是阶段和责任排序。' },
            { body: '海外家庭最怕多条现实线同时压来，却没有先后顺序。' },
            { body: '跨境创业最危险的是把短期窗口误认成长期结构。' },
            { body: '孩子语言和教育问题，常常连着父母自己的身份焦虑。' },
          ]}
        />

        <section className="mt-10">
          <div className="section-label">
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
