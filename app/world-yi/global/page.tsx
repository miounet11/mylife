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
  title: '世界易全球传播 | 人生K线',
  description: '面向海外华人和跨文化读者的世界易入口，重点讨论迁移、身份、环境与 AI 时代的高维判断。',
  path: '/world-yi/global',
  type: 'website',
});

export const dynamic = 'force-dynamic';

const globalThemes = [
  '海外华人最关心的，不只是信不信，而是这套体系能不能解释跨文化生活里的真实张力。',
  '世界易适合全球传播，不是因为它更神秘，而是因为它能把结构、阶段、环境与动作翻译成现代语言。',
  'AI 时代的全球华人，需要的不只是更多答案，而是能处理迁移、身份、家庭、事业与环境切换的判断框架。',
];

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
          title={(
            <>
              面向海外华人和跨文化读者的，
              <span className="font-serif text-[color:var(--accent-strong)]">高维判断入口。</span>
            </>
          )}
          description="世界易不把迁移、身份、家庭、城市和行业看成分散问题，而把它们放进同一套结构、阶段、环境与动作系统里。对于海外华人，这比传统单点解释更接近真实生活。"
          hint="建议优先进入“全球专题网络”或“全球案例路径”，不要同时展开多条阅读线。"
          actions={[
            { href: '/world-yi/global/topics', label: '看全球专题网络', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/global/cases', label: '看全球案例路径' },
            { href: '/world-yi/en', label: 'English Gateway' },
            { href: '/world-yi', label: '回到世界易总入口' },
          ]}
          highlights={globalThemes.map((body) => ({ body }))}
          highlightsColumns="grid-cols-1"
        />

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            适合全球传播的三个原因
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ['它先处理结构', '比起只给文化术语，世界易先把“你是什么结构”讲清。'],
              ['它把环境带进来', '地点、行业、家庭、身份切换都进入判断，不再只讲个人。'],
              ['它回到动作', '不是停在解释上，而是告诉你在这个阶段怎么进退。'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-[1.5rem] bg-white/80 p-5">
                <div className="text-lg font-bold text-[color:var(--ink)]">{title}</div>
                <div className="intro-copy mt-3">{description}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-3">
          <ContentCardLink
            href="/world-yi"
            page="/world-yi/global"
            meta={{ surfaceKey: 'world_yi_global_page_network', targetSurfaceKey: 'world_yi_page', contentType: 'knowledge', series: 'world-yi' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到母入口</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">全球层不是孤立分支</h2>
            <p className="intro-copy mt-3">
              海外华人与跨文化议题最终仍要回到世界易总入口，才能和方法、六域、环境层并成一套完整判断。
            </p>
          </ContentCardLink>

          <ContentCardLink
            href="/cases"
            page="/world-yi/global"
            meta={{ surfaceKey: 'world_yi_global_page_network', targetSurfaceKey: 'cases_page', contentType: 'case', series: 'world-yi-global' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到案例库</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">全球路径之外，补更多公开案例</h2>
            <p className="intro-copy mt-3">
              如果用户还没准备进入全球专题层，公开案例库会是更容易理解的入口，也能反向承接回全球传播主线。
            </p>
          </ContentCardLink>

          <ContentCardLink
            href="/world-yi/en"
            page="/world-yi/global"
            meta={{ surfaceKey: 'world_yi_global_page_network', targetSurfaceKey: 'world_yi_en_page', contentType: 'knowledge', series: 'world-yi-en' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">切到英文层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">跨文化路径继续进入英文入口</h2>
            <p className="intro-copy mt-3">
              对很多海外读者来说，全球华人入口和英文入口本来就应该互相可达，而不是各自孤立。
            </p>
          </ContentCardLink>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="section-label">相关阅读</div>
              <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">先从判断地图、身份、职业重启、照护与全球育儿这些主线读起</h2>
            </div>
            <Link href="/world-yi/global/topics" className="action-secondary">
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
                className="soft-card rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{entry.category}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{entry.title}</h2>
                <p className="intro-copy mt-3">{entry.excerpt}</p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
                  继续阅读
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="section-label">全球案例层</div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">全球华人的真实难点，不是一句“留还是回”，而是多条现实线同时压来</h2>
              <p className="intro-copy mt-4">
                世界易的全球案例，不是展示神秘判断，而是把身份、家庭、现金流、孩子教育、创业扩张和文化切换一起拉回同一套结构里。
              </p>
              <Link href="/world-yi/global/cases" className="action-secondary mt-5">
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
                  <p className="intro-copy mt-3">{item.excerpt}</p>
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
