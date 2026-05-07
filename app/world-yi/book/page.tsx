import { ArrowRight, BookOpen, LibraryBig, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';

export const metadata = createPublicContentMetadata({
  title: '世界易主书工程 | 人生K线',
  description: '世界易主书工程入口，展示已完成卷次、扩写方向和从总论到应用的阅读顺序。',
  path: '/world-yi/book',
  type: 'website',
  languages: {
    'zh-CN': '/world-yi/book',
    'x-default': '/world-yi/book',
  },
});

export const dynamic = 'force-dynamic';

const publishedVolumes = [
  {
    volume: '卷一',
    title: '起论与立法',
    href: '/knowledge/world-yi-v1-manifesto',
  },
  {
    volume: '卷二',
    title: '世界观、人观与高维引力',
    href: '/knowledge/world-yi-attraction-model',
  },
  {
    volume: '卷三',
    title: '核心概念体系与判断法',
    href: '/knowledge/world-yi-methodology',
  },
  {
    volume: '卷四',
    title: '财富、事业与扩张',
    href: '/knowledge/world-yi-wealth-rhythm',
  },
  {
    volume: '卷五',
    title: '关系、家庭与代际',
    href: '/knowledge/world-yi-family-generational-order',
  },
  {
    volume: '卷六',
    title: '迁移、家宅与环境',
    href: '/knowledge/world-yi-migration-stage-logic',
  },
  {
    volume: '卷七',
    title: '择时、起名、寻物与生活应用',
    href: '/knowledge/world-yi-daily-application-discipline',
  },
  {
    volume: '卷八',
    title: '宗教学、心理学、哲学与神学的汇流',
    href: '/knowledge/world-yi-humanities-synthesis',
  },
  {
    volume: '卷九',
    title: '案例总法与站内产品化表达',
    href: '/knowledge/world-yi-product-language',
  },
  {
    volume: '卷十',
    title: '版本、FAQ 与世界易未来升级',
    href: '/knowledge/world-yi-version-governance',
  },
];

export default function WorldYiBookPage() {
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易主书工程',
      description: '世界易主书工程入口，展示已完成卷次、扩写方向和从总论到应用的阅读顺序。',
      path: '/world-yi/book',
      keywords: ['世界易', '主书工程', '十卷主书', '总论', '应用'],
    }),
    createItemListSchema(
      '世界易主书卷次',
      publishedVolumes.map((item, index) => ({
        name: `${item.volume} ${item.title}`,
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
        page="/world-yi/book"
        meta={{ surfaceKey: 'world_yi_book_page', contentType: 'knowledge', series: 'world-yi-book' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <BookOpen className="h-3.5 w-3.5" />
              世界易主书工程
            </>
          )}
          title="主书工程"
          description="这里整理世界易从总论、方法到应用的主书卷次，方便你按一条连续主线理解整套判断系统。"
          hint="如果你是第一次接触世界易，建议先从总入口或个人分析开始；如果你在补体系，再按卷次往下读。"
          actions={[
            { href: '/world-yi', label: '回到世界易总入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/matrix', label: '看首批 120 篇' },
            { href: '/analyze', label: '开始分析' },
          ]}
          highlights={[
            { body: '卷一到卷十' },
            { body: '总论到治理' },
            { body: '知识材料池' },
            { body: '主书母本' },
          ]}
        />

        <section className="mt-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <LibraryBig className="h-3.5 w-3.5" />
            已完成卷次
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {publishedVolumes.map((item) => (
              <ContentCardLink
                key={item.volume}
                href={item.href}
                page="/world-yi/book"
                meta={{
                  surfaceKey: 'world_yi_book_page',
                  targetSurfaceKey: item.href.replace('/knowledge/', 'knowledge_article:'),
                  contentType: 'knowledge',
                  series: 'world-yi-book',
                }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.volume}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{item.title}</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  进入本卷主题
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Network className="h-3.5 w-3.5" />
              工程联动
            </div>
            <div className="mt-5 grid gap-3">
              {[
                { title: '内容矩阵', href: '/world-yi/matrix', target: 'world_yi_matrix_page', series: 'world-yi-matrix' },
                { title: '人生六域', href: '/world-yi/domains', target: 'world_yi_domains_page', series: 'world-yi-domains' },
                { title: '环境洞察', href: '/world-yi/insights', target: 'world_yi_insights_page', series: 'world-yi-insights' },
              ].map((item) => (
                <ContentCardLink
                  key={item.href}
                  href={item.href}
                  page="/world-yi/book"
                  meta={{ surfaceKey: 'world_yi_book_page_network', targetSurfaceKey: item.target, contentType: 'knowledge', series: item.series }}
                  className="block rounded-[1.25rem] bg-white/80 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                </ContentCardLink>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Sparkles className="h-3.5 w-3.5" />
              当前判断
            </div>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">下一步</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                '继续扩写卷内细分章节',
                '继续补全球华人与英文层案例',
                '继续把书稿语言写进结果页和详情页',
                '继续把 2000 篇内容矩阵挂回主书十卷',
              ].map((item) => (
                <div key={item} className="rounded-[1.25rem] bg-white/80 p-4 text-sm font-semibold text-[color:var(--ink)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
