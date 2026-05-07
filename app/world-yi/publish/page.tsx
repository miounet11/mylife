import { ArrowRight, FileText, Globe2, Layers3, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { createCollectionPageSchema, createItemListSchema, createPublicContentMetadata } from '@/lib/public-content-seo';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

export const metadata = createPublicContentMetadata({
  title: '世界易发布架构 | 人生K线',
  description: '说明世界易哪些内容已经公开、哪些仍停留在母文档层，以及当前是否进入持续发布状态。',
  path: '/world-yi/publish',
  type: 'website',
  languages: {
    'zh-CN': '/world-yi/publish',
    'x-default': '/world-yi/publish',
  },
});

export const dynamic = 'force-dynamic';

const publishingLayers = [
  {
    title: '公开页面层',
  },
  {
    title: '母文档层',
  },
  {
    title: '转译发布层',
  },
];

const publicSurfaces = [
  {
    title: '世界易总入口',
    href: '/world-yi',
  },
  {
    title: '主书工程',
    href: '/world-yi/book',
  },
  {
    title: '内容矩阵',
    href: '/world-yi/matrix',
  },
  {
    title: '人生六域',
    href: '/world-yi/domains',
  },
  {
    title: '全球华人路径',
    href: '/world-yi/global',
  },
  {
    title: '英文路径',
    href: '/world-yi/en',
  },
];

function formatTimestamp(value?: string | null) {
  if (!value) {
    return '暂无记录';
  }

  return value.replace('T', ' ').slice(0, 16);
}

export default function WorldYiPublishPage() {
  const worldYiStats = getWorldYiPublicStats();
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易发布架构',
      description: '说明世界易哪些内容已经公开、哪些仍停留在母文档层，以及当前是否进入持续发布状态。',
      path: '/world-yi/publish',
      keywords: ['世界易', '发布架构', '公开页面', '调度器', '内容矩阵'],
    }),
    createItemListSchema(
      '世界易公开发布层',
      publicSurfaces.map((item, index) => ({
        name: item.title,
        path: item.href,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);
  const publicationStageLabel = worldYiStats.publicationMode === 'ongoing_publication'
    ? '专题持续更新中'
    : worldYiStats.publicationMode === 'mixed_publication'
      ? '公开存量 + 零散增发'
      : '基础公开已上线';
  const publicationStageDescription = worldYiStats.publicationMode === 'ongoing_publication'
    ? `世界易当前已有 ${worldYiStats.nonSeedContentCount} 篇非 seed 内容进入公开层，最近一次专题更新时间为 ${formatTimestamp(worldYiStats.lastNonSeedContentUpdatedAt)}。`
    : worldYiStats.publicationMode === 'mixed_publication'
      ? `世界易已经不止 seed 存量，但最近一次专题增发距离现在较远，最近一次非 seed 更新时间为 ${formatTimestamp(worldYiStats.lastNonSeedContentUpdatedAt)}。`
      : `当前 ${worldYiStats.publicContentCount} 篇世界易公开内容全部来自首批 seed 存量，最近一次整体更新时间为 ${formatTimestamp(worldYiStats.lastContentUpdatedAt)}，还没有进入稳定专题增发。`;
  const schedulerLabel = worldYiStats.schedulerActive ? '调度器在线' : '调度器需复核';
  const schedulerDescription = worldYiStats.schedulerActive
    ? `最近一次调度发生在 ${formatTimestamp(worldYiStats.lastSchedulerRunAt)}，下一发布窗口为 ${worldYiStats.schedulerNextPublishSlotLabel || '待计算'}。`
    : `最近一次调度记录为 ${formatTimestamp(worldYiStats.lastSchedulerRunAt)}，如果这不是预期状态，需要检查 cron 与 token。`;
  const growthLabel = worldYiStats.recentWorldYiPublishedCount7d > 0
    ? `近 7 天世界易新增公开 ${worldYiStats.recentWorldYiPublishedCount7d} 篇`
    : '近 7 天世界易未新增公开';
  const growthDescription = worldYiStats.recentWorldYiPublishedTitle
    ? `最近一次世界易新增公开是“${worldYiStats.recentWorldYiPublishedTitle}”，发生在 ${formatTimestamp(worldYiStats.recentWorldYiPublishedAt)}。`
    : worldYiStats.recentSchedulerPublishedTitle
      ? `最近一次全站自动发布是“${worldYiStats.recentSchedulerPublishedTitle}”，发生在 ${formatTimestamp(worldYiStats.recentSchedulerPublishedAt)}；但这条记录不属于世界易专题公开增发。`
      : '当前没有拿到世界易专题最近公开增发记录，不能把调度器活跃直接等同于世界易持续发布。';

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/world-yi/publish"
        meta={{ surfaceKey: 'world_yi_publish_page', contentType: 'knowledge', series: 'world-yi-publish' }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <WorldYiSurfaceHero
          label={(
            <>
              <Layers3 className="h-3.5 w-3.5" />
              世界易发布架构
            </>
          )}
          title="发布架构"
          description="这里说明世界易哪些层已经进入公开发布、哪些还停留在母文档与转译层，帮助你看清内容是怎么走到用户面的。"
          hint="适合需要判断发布节奏和公开成熟度的人；如果你只是想直接使用结果，回到分析入口更快。"
          actions={[
            { href: '/world-yi', label: '回到世界易总入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/book', label: '看主书工程' },
            { href: '/world-yi/matrix', label: '看内容矩阵' },
          ]}
          highlights={publishingLayers.map((item) => ({ body: item.title }))}
          highlightsColumns="grid-cols-1"
        />

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[2rem] p-6 md:p-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Sparkles className="h-3.5 w-3.5" />
            当前运行态
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">世界易发布判定</div>
              <div className="mt-3 text-2xl font-black text-[color:var(--ink)]">{publicationStageLabel}</div>
              <div className="mt-3 text-sm text-[color:var(--ink)]">{publicationStageDescription}</div>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">全站调度器状态</div>
              <div className="mt-3 text-2xl font-black text-[color:var(--ink)]">{schedulerLabel}</div>
              <div className="mt-3 text-sm text-[color:var(--ink)]">{schedulerDescription}</div>
              <div className="mt-4 text-xs leading-6 text-[color:var(--ink)]">
                全站今日已发布 {worldYiStats.schedulerPublishedToday} 条，草稿池 {worldYiStats.schedulerDraftReserveCount}/{worldYiStats.schedulerDraftReserveTarget}。
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[1.75rem] p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">世界易专题增发</div>
              <div className="mt-3 text-2xl font-black text-[color:var(--ink)]">{growthLabel}</div>
              <div className="mt-3 text-sm text-[color:var(--ink)]">{growthDescription}</div>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[2rem] p-6 md:p-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Globe2 className="h-3.5 w-3.5" />
            会公开发布的层
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {publicSurfaces.map((item) => (
              <ContentCardLink
                key={item.href}
                href={item.href}
                page="/world-yi/publish"
                meta={{
                  surfaceKey: 'world_yi_publish_page',
                  targetSurfaceKey: item.href === '/world-yi' ? 'world_yi_page' : item.href.replace(/\//g, '_').replace(/^_/, ''),
                  contentType: 'knowledge',
                  series: 'world-yi-publish',
                }}
                className="rounded-[1.75rem] bg-white/80 p-6 transition hover:-translate-y-0.5"
              >
                <h2 className="text-2xl font-bold text-[color:var(--ink)]">{item.title}</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  进入页面
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[2rem] p-6 md:p-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <FileText className="h-3.5 w-3.5" />
              不会直接原样发布的层
            </div>
            <div className="mt-4 grid gap-3 text-sm text-[color:var(--ink)]">
              {['十卷主书 docs', '执行批次 / FAQ / 版本文档', '知识页 / 案例页 / 主题页 / 结果页'].map((item) => (
                <div key={item} className="rounded-[1.2rem] bg-white/80 px-4 py-4 font-semibold">{item}</div>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[2rem] p-6 md:p-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Sparkles className="h-3.5 w-3.5" />
              当前最合理的发布策略
            </div>
            <div className="mt-4 grid gap-3 text-sm text-[color:var(--ink)]">
              {['主书', '知识页', '案例页', '入口页', '持续发布队列'].map((item) => (
                <div key={item} className="rounded-[1.2rem] bg-white/80 px-4 py-4 font-semibold">{item}</div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
