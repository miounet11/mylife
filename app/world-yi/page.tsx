import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import VisualAssetFeature from '@/components/visual-asset-feature';
import { listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { getVisualAssetById } from '@/lib/visual-asset-library';
import { worldYiRoadmapSummary } from '@/lib/world-yi';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

export const metadata = createPublicContentMetadata({
  title: '世界易 v1.0.0.1 | 人生K线',
  description: '世界易是凯莉提出的现代高维判断学说，试图在 AI 时代重新统一世界、人与环境的解释秩序。',
  path: '/world-yi',
  type: 'website',
  languages: {
    'zh-CN': '/world-yi',
    'en-US': '/world-yi/en',
    'x-default': '/world-yi',
  },
});

export const dynamic = 'force-dynamic';

const attractionLayers = [
  '认知层：解释混乱，降低复杂度',
  '情绪层：安放焦虑、羞耻和无力感',
  '身份层：恢复人格高度与主体位置',
  '动作层：压缩成现实下一步',
  '语言层：形成可记忆的母语和口号',
  '社会层：形成共同体感和区分感',
];

const foundations = [
  '易学基础：负责变化、结构、时位、环境与进退',
  '心理基础：负责焦虑、羞耻、依恋、创伤与行动阻滞',
  '哲学基础：负责概念、价值、责任与命运边界',
  '宗教基础：负责仪式、归属、象征秩序与精神安放',
  '神学基础：负责苦难意义、召命感与终极解释',
];

const coreBranches = [
  {
    title: '财富分科',
    href: '/knowledge/world-yi-wealth-rhythm',
  },
  {
    title: '关系分科',
    href: '/knowledge/world-yi-relationship-order',
  },
  {
    title: '家庭与代际',
    href: '/knowledge/world-yi-family-generational-order',
  },
  {
    title: '家宅与空间',
    href: '/knowledge/world-yi-home-order',
  },
  {
    title: '择时体系',
    href: '/knowledge/world-yi-timing-selection',
  },
  {
    title: '版本与答疑',
    href: '/knowledge/world-yi-version-faq',
  },
];

const doctrineWall = [
  '十卷主书初版',
  '人生六域入口',
  '生活应用入口',
  '环境观察入口',
  '首批 120 篇矩阵',
  '全球华人与英文层',
  '结果页母语接管',
  '版本治理与 FAQ',
];

function getPublicationStageLabel(publicationMode: ReturnType<typeof getWorldYiPublicStats>['publicationMode']) {
  if (publicationMode === 'ongoing_publication') {
    return '持续更新中';
  }

  if (publicationMode === 'mixed_publication') {
    return '混合发布阶段';
  }

  return '基础公开已上线';
}

export default function WorldYiPage() {
  const worldYiStats = getWorldYiPublicStats();
  const worldYiArticles = listPublishedManagedContentEntriesByType('knowledge')
    .filter((entry) => entry.slug.startsWith('world-yi-') && !entry.slug.startsWith('world-yi-en-'))
    .slice(0, 10);
  const worldYiCases = listPublishedManagedContentEntriesByType('case')
    .filter((entry) => entry.slug.startsWith('world-yi-') && !entry.slug.startsWith('world-yi-en-'))
    .slice(0, 4);
  const worldYiInsights = listPublishedManagedContentEntriesByType('insight')
    .filter((entry) => entry.slug.startsWith('world-yi-'))
    .slice(0, 3);
  const publicationStageLabel = getPublicationStageLabel(worldYiStats.publicationMode);
  const worldYiMethodImage = getVisualAssetById('PWY01-002');
  const boundaryImage = getVisualAssetById('PWY01-007');
  const worldYiScaleCards = [
    { label: '当前公开总量', value: `${worldYiStats.publicContentCount} 篇` },
    { label: '当前发布阶段', value: publicationStageLabel },
    { label: '中文主路径', value: `${worldYiStats.mainKnowledgeCount + worldYiStats.mainCaseCount} 篇` },
    { label: '全球华人层', value: `${worldYiStats.globalKnowledgeCount + worldYiStats.globalCaseCount} 篇` },
    { label: 'English Layer', value: `${worldYiStats.englishKnowledgeCount + worldYiStats.englishCaseCount} 篇` },
    { label: '环境洞察', value: `${worldYiStats.publicInsightCount} 篇` },
    { label: '生活应用组', value: `${worldYiStats.applicationGroupCount} 组` },
    { label: '专题与路径', value: `${worldYiStats.globalTopicCount + worldYiStats.englishTrackCount} 组` },
    { label: '公开入口', value: `${worldYiStats.publicRouteCount} 个` },
  ];
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易 v1.0.0.1',
      description: '世界易是凯莉提出的现代高维判断学说，试图在 AI 时代重新统一世界、人与环境的解释秩序。',
      path: '/world-yi',
      keywords: ['世界易', '高维判断', '结构', '阶段', '环境', '动作'],
    }),
    createItemListSchema(
      '世界易知识主路径',
      worldYiArticles.slice(0, 8).map((entry, index) => ({
        name: entry.title,
        path: `/knowledge/${entry.slug}`,
        position: index + 1,
      })),
    ),
    createItemListSchema(
      '世界易案例入口',
      worldYiCases.map((entry, index) => ({
        name: entry.title,
        path: `/cases/${entry.slug}`,
        position: index + 1,
      })),
    ),
    createItemListSchema(
      '世界易环境洞察',
      worldYiInsights.map((entry, index) => ({
        name: entry.title,
        path: `/insights/${entry.subtype || 'industry'}/${entry.slug}`,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView
        eventName="knowledge_page_viewed"
        page="/world-yi"
        meta={{ surfaceKey: 'world_yi_page', version: worldYiRoadmapSummary.version, founder: worldYiRoadmapSummary.founder }}
      />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        {/* HERO 区 */}
        <section className="fb-card mb-3 overflow-hidden border-t-2 border-[color:var(--fb-blue)]">
          <div className="bg-[color:var(--fb-blue)] px-4 py-2.5 text-white text-[12px] font-bold uppercase tracking-[0.14em]">
            世界易 {worldYiRoadmapSummary.version} · 命理/易学门户
          </div>
          <div className="px-4 py-3">
            <h1 className="text-[22px] font-bold text-[color:var(--fb-ink-1)] leading-[1.2]">
              世界易
            </h1>
            <p className="mt-1 text-[13px] leading-[1.4] text-[color:var(--fb-ink-2)] max-w-[640px]">
              这是世界易体系的总入口，用来连接总论、主书、人生六域、全球传播路径和个人判断入口。
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">八字</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">紫微</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">六爻</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">奇门</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">择日</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <Link href="/knowledge/world-yi-v1-manifesto" className="inline-flex h-8 items-center gap-1.5 bg-[color:var(--fb-blue)] px-3 text-[12px] font-bold text-white hover:bg-[#365899]">
                先读世界易总论
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/world-yi/domains" className="inline-flex h-8 items-center gap-1.5 border border-[#bec3c9] bg-[#f5f6f7] px-3 text-[12px] font-bold text-[#1d2129] hover:bg-[#ebedf0]">看人生六域</Link>
              <Link href="/world-yi/book" className="inline-flex h-8 items-center gap-1.5 border border-[#bec3c9] bg-[#f5f6f7] px-3 text-[12px] font-bold text-[#1d2129] hover:bg-[#ebedf0]">看主书工程</Link>
              <Link href="/world-yi/global" className="inline-flex h-8 items-center gap-1.5 border border-[#bec3c9] bg-[#f5f6f7] px-3 text-[12px] font-bold text-[#1d2129] hover:bg-[#ebedf0]">看全球传播入口</Link>
              <Link href="/analyze" className="inline-flex h-8 items-center gap-1.5 border border-[#bec3c9] bg-[#f5f6f7] px-3 text-[12px] font-bold text-[#1d2129] hover:bg-[#ebedf0]">进入个人判断</Link>
            </div>
          </div>
        </section>

        {worldYiMethodImage ? (
          <div className="mt-10">
            <VisualAssetFeature asset={worldYiMethodImage} label="世界易方法总图" />
          </div>
        ) : null}

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Compass className="h-3.5 w-3.5" />
              六层引力模型
            </div>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">六层引力模型</h2>
            <div className="mt-5 grid gap-3">
              {attractionLayers.map((item) => (
                <div key={item} className="rounded-[var(--radius)] bg-[color:var(--paper)] p-4 text-sm font-semibold text-[color:var(--ink)]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Network className="h-3.5 w-3.5" />
              五大学理基础
            </div>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">五大学理基础</h2>
            <div className="mt-5 grid gap-3">
              {foundations.map((item) => (
                <div key={item} className="rounded-[var(--radius)] bg-[color:var(--paper)] p-4 text-sm font-semibold text-[color:var(--ink)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {boundaryImage ? (
          <div className="mt-10">
            <VisualAssetFeature asset={boundaryImage} label="安全边界图" reverse />
          </div>
        ) : null}

        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          <ContentCardLink
            href="/knowledge"
            page="/world-yi"
            meta={{ surfaceKey: 'world_yi_page_network', targetSurfaceKey: 'knowledge_page', contentType: 'knowledge', series: 'world-yi' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到知识层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">知识库</h2>
          </ContentCardLink>

          <ContentCardLink
            href="/cases"
            page="/world-yi"
            meta={{ surfaceKey: 'world_yi_page_network', targetSurfaceKey: 'cases_page', contentType: 'case', series: 'world-yi' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到证据层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">案例库</h2>
          </ContentCardLink>

          <ContentCardLink
            href="/insights"
            page="/world-yi"
            meta={{ surfaceKey: 'world_yi_page_network', targetSurfaceKey: 'insights_page', contentType: 'insight', series: 'world-yi' }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到环境层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">环境洞察</h2>
          </ContentCardLink>
        </section>

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <Network className="h-3.5 w-3.5" />
                当前公开规模
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">数据面板</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {worldYiScaleCards.map((item) => (
                <div key={item.label} className="rounded-[var(--radius-md)] bg-[color:var(--paper)] p-5 shadow-[0_10px_26px_rgba(23,32,51,0.05)]">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                  <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                <BookOpen className="h-3.5 w-3.5" />
                内容工程
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">内容分组</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {worldYiRoadmapSummary.tracks.map((item) => (
                <div key={item.key} className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-5">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">目标内容量</div>
                  <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{item.targetCount} 篇</div>
                  <div className="mt-2 text-sm text-[color:var(--ink)]">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="relative overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(244,237,226,0.92))] p-6 shadow-[0_24px_64px_rgba(34,33,30,0.07)] md:p-8">
            <div className="absolute -right-10 top-6 h-44 w-44 rounded-full bg-[rgba(178,149,93,0.12)] blur-3xl" />
            <div className="absolute left-6 bottom-0 h-32 w-32 rounded-full bg-[rgba(201,125,58,0.12)] blur-3xl" />

            <div className="relative grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  体系总部
                </div>
                <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">功能墙</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {doctrineWall.map((item) => (
                  <div key={item} className="rounded-[var(--radius)] bg-[color:var(--paper)] p-4 text-sm font-semibold text-[color:var(--ink)] shadow-[0_10px_24px_rgba(23,32,51,0.04)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">核心分科</div>
              <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">分科入口</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {coreBranches.map((item) => (
              <ContentCardLink
                key={item.href}
                href={item.href}
                page="/world-yi"
                meta={{
                  surfaceKey: 'world_yi_page',
                  targetSurfaceKey: item.href.replace('/knowledge/', 'knowledge_article:'),
                  contentType: 'knowledge',
                  series: 'world-yi',
                }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-lg font-bold text-[color:var(--ink)]">{item.title}</div>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  进入分科
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <ContentCardLink
            href="/world-yi/domains"
            page="/world-yi"
            meta={{
              surfaceKey: 'world_yi_page',
              targetSurfaceKey: 'world_yi_domains_page',
              contentType: 'knowledge',
              series: 'world-yi-domains',
            }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md block rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5 md:p-8"
          >
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Compass className="h-3.5 w-3.5" />
              人生六域
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="text-3xl font-black text-[color:var(--ink)]">Batch 02 已经开始进入事业、财富、关系、健康、家庭与迁移六条主线</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  进入人生六域入口
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {['事业', '财富', '关系', '健康', '家庭', '迁移'].map((item) => (
                  <div key={item} className="rounded-[var(--radius)] bg-[color:var(--paper)] p-4 text-sm font-semibold text-[color:var(--ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </ContentCardLink>
        </section>

        <section className="mt-10">
          <ContentCardLink
            href="/world-yi/book"
            page="/world-yi"
            meta={{
              surfaceKey: 'world_yi_page',
              targetSurfaceKey: 'world_yi_book_page',
              contentType: 'knowledge',
              series: 'world-yi-book',
            }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md block rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5 md:p-8"
          >
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <BookOpen className="h-3.5 w-3.5" />
              主书工程
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="text-3xl font-black text-[color:var(--ink)]">十卷主书</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  进入主书工程
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {['卷一：起论与立法', '卷二：世界观与引力', '卷三：概念与判断法', '卷四：财富事业扩张', '卷五：关系家庭代际', '卷六到卷十：环境应用传播治理'].map((item) => (
                  <div key={item} className="rounded-[var(--radius)] bg-[color:var(--paper)] p-4 text-sm font-semibold text-[color:var(--ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </ContentCardLink>
        </section>

        <section className="mt-10">
          <ContentCardLink
            href="/world-yi/matrix"
            page="/world-yi"
            meta={{
              surfaceKey: 'world_yi_page',
              targetSurfaceKey: 'world_yi_matrix_page',
              contentType: 'knowledge',
              series: 'world-yi-matrix',
            }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md block rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5 md:p-8"
          >
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Network className="h-3.5 w-3.5" />
              内容矩阵
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="text-3xl font-black text-[color:var(--ink)]">120 篇矩阵</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  进入首批 120 篇执行图
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {['Batch 01：母语定盘', 'Batch 02：六域起量', 'Batch 03：应用落地', 'Batch 04：全球华人', 'Batch 05：案例密集化', 'Batch 06：治理与传播'].map((item) => (
                  <div key={item} className="rounded-[var(--radius)] bg-[color:var(--paper)] p-4 text-sm font-semibold text-[color:var(--ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </ContentCardLink>
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">文章入口</div>
              <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">文章</h2>
            </div>
            <Link href="/knowledge" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">
              查看全部知识内容
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {worldYiArticles.map((article) => (
              <ContentCardLink
                key={article.slug}
                href={`/knowledge/${article.slug}`}
                page="/world-yi"
                meta={{
                  surfaceKey: 'world_yi_articles',
                  targetSurfaceKey: `knowledge_article:${article.slug}`,
                  contentType: 'knowledge',
                  slug: article.slug,
                  title: article.title,
                  category: article.category,
                  tags: article.tags,
                }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius-md)] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{article.category}</div>
                <h3 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{article.title}</h3>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  阅读全文
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">案例层</div>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">案例</h2>
            <div className="mt-5 space-y-3">
              {worldYiCases.map((item) => (
                <ContentCardLink
                  key={item.slug}
                  href={`/cases/${item.slug}`}
                  page="/world-yi"
                  meta={{
                    surfaceKey: 'world_yi_cases',
                    targetSurfaceKey: `case_article:${item.slug}`,
                    contentType: 'case',
                    slug: item.slug,
                    title: item.title,
                    tags: item.tags,
                  }}
                  className="block rounded-[var(--radius)] bg-[color:var(--paper)] p-4 transition hover:bg-[color:var(--paper)]"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                </ContentCardLink>
              ))}
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius-md)] p-6 md:p-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">观察层</div>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">观察</h2>
            <div className="mt-5 space-y-3">
              {worldYiInsights.map((item) => (
                <ContentCardLink
                  key={`${item.subtype || 'insight'}:${item.slug}`}
                  href={`/insights/${item.subtype || 'industry'}/${item.slug}`}
                  page="/world-yi"
                  meta={{
                    surfaceKey: 'world_yi_insights',
                    targetSurfaceKey: `insight_article:${item.subtype || 'industry'}:${item.slug}`,
                    contentType: 'insight',
                    slug: item.slug,
                    title: item.title,
                    tags: item.tags,
                  }}
                  className="block rounded-[var(--radius)] bg-[color:var(--paper)] p-4 transition hover:bg-[color:var(--paper)]"
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
