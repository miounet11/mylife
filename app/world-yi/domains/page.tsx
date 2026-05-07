import Link from 'next/link';
import { ArrowRight, Compass, LibraryBig, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';

export const metadata = createPublicContentMetadata({
  title: '世界易人生六域 | 人生K线',
  description: '世界易的人生六域入口，围绕事业、财富、关系、健康、家庭、迁移建立可持续扩写的主问题路径。',
  path: '/world-yi/domains',
  type: 'website',
  languages: {
    'zh-CN': '/world-yi/domains',
    'x-default': '/world-yi/domains',
  },
});

export const dynamic = 'force-dynamic';

const domains = [
  {
    title: '事业',
    href: '/knowledge/world-yi-career-role-fit',
    hubHref: '/world-yi/domains/career',
  },
  {
    title: '财富',
    href: '/knowledge/world-yi-wealth-rhythm',
    hubHref: '/world-yi/domains/wealth',
  },
  {
    title: '关系',
    href: '/knowledge/world-yi-relationship-order',
    hubHref: '/world-yi/domains/relationship',
  },
  {
    title: '健康',
    href: '/knowledge/world-yi-health-recovery-order',
    hubHref: '/world-yi/domains/health',
  },
  {
    title: '家庭',
    href: '/knowledge/world-yi-family-generational-order',
    hubHref: '/world-yi/domains/family',
  },
  {
    title: '迁移',
    href: '/knowledge/world-yi-migration-stage-logic',
    hubHref: '/world-yi/domains/migration',
  },
];

export default function WorldYiDomainsPage() {
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易人生六域',
      description: '世界易的人生六域入口，围绕事业、财富、关系、健康、家庭、迁移建立可持续扩写的主问题路径。',
      path: '/world-yi/domains',
      keywords: ['世界易', '人生六域', '事业', '财富', '关系', '健康', '家庭', '迁移'],
    }),
    createItemListSchema(
      '世界易人生六域列表',
      domains.map((item, index) => ({
        name: item.title,
        path: item.href,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/world-yi/domains"
        meta={{ surfaceKey: 'world_yi_domains_page', contentType: 'knowledge', series: 'world-yi-domains' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Compass className="h-3.5 w-3.5" />
              世界易人生六域
            </>
          )}
          title="人生六域"
          description="把事业、财富、关系、健康、家庭、迁移六条问题线拆开，让你先确认自己现在最需要进入哪一个判断场景。"
          hint="如果你已经知道卡点在哪一域，就直接进入对应分科页；如果还不确定，先做综合分析会更稳。"
          actions={[
            { href: '/world-yi', label: '回到世界易总入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/matrix', label: '看执行矩阵' },
            { href: '/world-yi/applications', label: '看生活应用' },
          ]}
          highlights={[
            { body: '事业' },
            { body: '财富' },
            { body: '关系' },
            { body: '健康' },
          ]}
        />

        <section className="mt-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Sparkles className="h-3.5 w-3.5" />
            六域入口
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {domains.map((item) => (
              <ContentCardLink
                key={item.href}
                href={item.href}
                page="/world-yi/domains"
                meta={{
                  surfaceKey: 'world_yi_domains_page',
                  targetSurfaceKey: item.href.replace('/knowledge/', 'knowledge_article:'),
                  contentType: 'knowledge',
                  series: 'world-yi-domains',
                }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <h2 className="text-2xl font-bold text-[color:var(--ink)]">{item.title}</h2>
            <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5">快速操作</div>
            <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-2 mt-2 flex flex-wrap gap-3 text-sm font-semibold">
                  <span className="inline-flex items-center gap-2">
                    进入知识主线
                    <ArrowRight className="h-4 w-4" />
                  </span>
                  <Link href={item.hubHref} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">进入分科页</Link>
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[2rem] p-6 md:p-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <LibraryBig className="h-3.5 w-3.5" />
              结构联动
            </div>
            <div className="mt-5 grid gap-3">
              {[
                { title: '主书工程', href: '/world-yi/book', target: 'world_yi_book_page', series: 'world-yi-book' },
                { title: '内容矩阵', href: '/world-yi/matrix', target: 'world_yi_matrix_page', series: 'world-yi-matrix' },
                { title: '环境洞察', href: '/world-yi/insights', target: 'world_yi_insights_page', series: 'world-yi-insights' },
              ].map((item) => (
                <ContentCardLink
                  key={item.href}
                  href={item.href}
                  page="/world-yi/domains"
                  meta={{ surfaceKey: 'world_yi_domains_page_network', targetSurfaceKey: item.target, contentType: 'knowledge', series: item.series }}
                  className="block rounded-[1.25rem] bg-white/80 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                </ContentCardLink>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[2rem] p-6 md:p-8">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  生活应用层
                </div>
                <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">应用入口</h2>
                <Link href="/world-yi/applications" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)] mt-5">
                  进入生活应用入口
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {['起名系统', '寻物复原', '择时窗口', '家宅恢复'].map((item) => (
                  <div key={item} className="rounded-[1.25rem] bg-white/80 p-4 text-sm font-semibold text-[color:var(--ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
