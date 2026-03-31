import Link from 'next/link';
import { ArrowRight, BookOpen, LibraryBig, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';

export const metadata = {
  title: '世界易主书工程 | 人生K线',
  description: '世界易主书工程入口，展示已完成卷次、扩写方向和从总论到应用的阅读顺序。',
};

export const dynamic = 'force-dynamic';

const publishedVolumes = [
  {
    volume: '卷一',
    title: '起论与立法',
    description: '解释世界易为什么成立、边界在哪里、为什么由凯莉作为创始叙事起点。',
    href: '/knowledge/world-yi-v1-manifesto',
  },
  {
    volume: '卷二',
    title: '世界观、人观与高维引力',
    description: '进入 AI 时代认知、六层引力模型和世界易的人观、意义观。',
    href: '/knowledge/world-yi-attraction-model',
  },
  {
    volume: '卷三',
    title: '核心概念体系与判断法',
    description: '固定结构、时位、环境、动作、风险、复盘这套世界易总式。',
    href: '/knowledge/world-yi-methodology',
  },
  {
    volume: '卷四',
    title: '财富、事业与扩张',
    description: '把赚钱方式、守财能力、事业推进和扩张风险正式纳入主书正文逻辑。',
    href: '/knowledge/world-yi-wealth-rhythm',
  },
  {
    volume: '卷五',
    title: '关系、家庭与代际',
    description: '把关系节奏、伴侣选择、家庭排序、代际责任和孩子问题放进同一卷。',
    href: '/knowledge/world-yi-family-generational-order',
  },
  {
    volume: '卷六',
    title: '迁移、家宅与环境',
    description: '把迁移、城市、家宅、空间与技术条件正式放进环境主轴。',
    href: '/knowledge/world-yi-migration-stage-logic',
  },
  {
    volume: '卷七',
    title: '择时、起名、寻物与生活应用',
    description: '把择时、起名、寻物和日常应用重新翻译成现代判断语言。',
    href: '/knowledge/world-yi-daily-application-discipline',
  },
  {
    volume: '卷八',
    title: '宗教学、心理学、哲学与神学的汇流',
    description: '让世界易拥有意义秩序、概念边界与苦难解释的人文学底盘。',
    href: '/knowledge/world-yi-humanities-synthesis',
  },
  {
    volume: '卷九',
    title: '案例总法与站内产品化表达',
    description: '说明案例、结果页、知识页和站内路径为什么是学说成立的证据层。',
    href: '/knowledge/world-yi-product-language',
  },
  {
    volume: '卷十',
    title: '版本、FAQ 与世界易未来升级',
    description: '解释版本化、边界、FAQ 和世界易未来如何持续升级。',
    href: '/knowledge/world-yi-version-governance',
  },
];

export default function WorldYiBookPage() {
  return (
    <div className="page-shell">
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
          title={(
            <>
              世界易不是单篇文章，
              <span className="font-serif text-[color:var(--accent-strong)]">而是在持续成书。</span>
            </>
          )}
          description="这条路径展示世界易十卷初版已经写到哪里、每一卷解决什么问题，以及从总论、方法到财富、关系、环境、应用、传播和版本治理如何长成一整套学说。"
          hint="首次阅读建议先看总论卷，再按卷次顺序向后阅读。"
          actions={[
            { href: '/world-yi', label: '回到世界易总入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/matrix', label: '看首批 120 篇' },
            { href: '/analyze', label: '开始分析' },
          ]}
          highlights={[
            { body: '卷一到卷十初版正文已建立。' },
            { body: '主书主干已经从总论写到版本治理。' },
            { body: '知识文章正在反向为主书各卷提供材料池。' },
            { body: '最终目标不是一篇爆文，而是 10w+ 主书母本。' },
          ]}
        />

        <section className="mt-10">
          <div className="section-label">
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
                className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.volume}</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{item.title}</h2>
                <p className="intro-copy mt-3">{item.description}</p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
                  进入本卷主题
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            当前判断
          </div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">世界易主书初版已经完成，下一步是继续加厚，不是再补主干</h2>
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
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
