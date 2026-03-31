import Link from 'next/link';
import { ArrowRight, FileText, Globe2, Layers3, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

export const metadata = {
  title: '世界易发布架构 | 人生K线',
  description: '说明世界易哪些内容已经公开、哪些仍停留在母文档层，以及当前是否进入持续发布状态。',
};

export const dynamic = 'force-dynamic';

const publishingLayers = [
  {
    title: '公开页面层',
    description: '直接面向用户发布，包括世界易总入口、主书入口、内容矩阵、人生六域、全球入口、英文入口、知识页和案例页。',
  },
  {
    title: '母文档层',
    description: '保存在 docs 里的 Charter、十卷主书、FAQ、完成度矩阵、执行批次。这些先作为体系宪法，不会全部原样暴露给用户。',
  },
  {
    title: '转译发布层',
    description: '母文档中的关键章节会继续被拆成知识页、案例页、专题页和结果页语言，逐步变成用户真正看到的内容。',
  },
];

const publicSurfaces = [
  {
    title: '世界易总入口',
    href: '/world-yi',
    description: '对外总入口，负责解释世界易是什么，以及如何进入主书、矩阵、六域、全球与英文层。',
  },
  {
    title: '主书工程',
    href: '/world-yi/book',
    description: '对外展示十卷初版的公开路径，但不等于把 docs 中的整卷原文直接暴露给用户。',
  },
  {
    title: '内容矩阵',
    href: '/world-yi/matrix',
    description: '展示从十卷主书映射到首批 120 篇，再走向 2000 篇的执行路径。',
  },
  {
    title: '人生六域',
    href: '/world-yi/domains',
    description: '把事业、财富、关系、健康、家庭、迁移做成主问题入口。',
  },
  {
    title: '全球华人路径',
    href: '/world-yi/global',
    description: '面向留回、双边生活、身份、照护、孩子教育和跨境创业等全球华人问题。',
  },
  {
    title: '英文路径',
    href: '/world-yi/en',
    description: '面向国际读者和英语用户的英文总入口与英文案例路径。',
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
          title={(
            <>
              这些内容会发布，
              <span className="font-serif text-[color:var(--accent-strong)]">但不会全部原样等于 docs 文稿。</span>
            </>
          )}
          description="世界易已经进入公开发布，但当前到底是“基础公开已上线”还是“专题持续更新中”，不能只靠文案判断。下面这页会直接展示当前运行态，再解释公开页面、母文档和转译发布三层各自负责什么。"
          hint="先看“当前运行态”，再决定去主书或矩阵入口，避免路径跳转过早。"
          actions={[
            { href: '/world-yi', label: '回到世界易总入口', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/book', label: '看主书工程' },
            { href: '/world-yi/matrix', label: '看内容矩阵' },
          ]}
          highlights={publishingLayers}
          highlightsColumns="grid-cols-1"
        />

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            当前运行态
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">世界易发布判定</div>
              <div className="mt-3 text-2xl font-black text-[color:var(--ink)]">{publicationStageLabel}</div>
              <p className="intro-copy mt-3">{publicationStageDescription}</p>
            </div>
            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">全站调度器状态</div>
              <div className="mt-3 text-2xl font-black text-[color:var(--ink)]">{schedulerLabel}</div>
              <p className="intro-copy mt-3">{schedulerDescription}</p>
              <div className="mt-4 text-xs leading-6 text-[color:var(--ink)]">
                全站今日已发布 {worldYiStats.schedulerPublishedToday} 条，草稿池 {worldYiStats.schedulerDraftReserveCount}/{worldYiStats.schedulerDraftReserveTarget}。
              </div>
            </div>
            <div className="soft-card rounded-[1.75rem] p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">世界易专题增发</div>
              <div className="mt-3 text-2xl font-black text-[color:var(--ink)]">{growthLabel}</div>
              <p className="intro-copy mt-3">{growthDescription}</p>
            </div>
          </div>
        </section>

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="section-label">
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
                <p className="intro-copy mt-3">{item.description}</p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
                  进入页面
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">
              <FileText className="h-3.5 w-3.5" />
              不会直接原样发布的层
            </div>
            <div className="intro-copy mt-4 space-y-3 text-[color:var(--ink)]">
              <p>十卷主书 docs 会继续保留为母文档，不会全部原样照搬成前台长页。</p>
              <p>执行批次、完成度矩阵、FAQ、版本文档会优先作为治理文档存在，再逐步转译成公开内容。</p>
              <p>真正面向用户时，会优先拆成更容易阅读的知识页、案例页、主题页和结果页语言。</p>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">
              <Sparkles className="h-3.5 w-3.5" />
              当前最合理的发布策略
            </div>
            <div className="intro-copy mt-4 space-y-3 text-[color:var(--ink)]">
              <p>主书负责定宪法，不负责承担全部前台阅读体验。</p>
              <p>知识页负责解释单个主题，案例页负责证明方法能落地，入口页负责把路径排清楚。</p>
              <p>如果当前仍以 seed 存量为主，下一步应该是把世界易专题纳入明确的持续发布队列，而不是继续只写“会持续发布”的宣言文案。</p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
