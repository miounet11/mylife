import Link from 'next/link';
import { ArrowRight, BookOpen, Compass, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import WorldYiSurfaceHero from '@/components/world-yi-surface-hero';
import { listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { worldYiRoadmapSummary } from '@/lib/world-yi';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

export const metadata = createPublicContentMetadata({
  title: '世界易 v1.0.0.1 | 人生K线',
  description: '世界易是凯莉提出的现代高维判断学说，试图在 AI 时代重新统一世界、人与环境的解释秩序。',
  path: '/world-yi',
  type: 'website',
});

export const dynamic = 'force-dynamic';

const motherPropositions = [
  {
    title: '你不是乱，你是有结构',
    description: '世界易先帮助你从混乱事件里退一步，看见你真正的稳定运行方式。',
  },
  {
    title: '你不是倒霉，你是处在某个阶段',
    description: '很多卡住不是整个人生都坏了，而是当前阶段的位置关系没有看清。',
  },
  {
    title: '你不是只能硬扛，你要看环境是否匹配',
    description: '城市、行业、家庭、关系和技术条件，会直接改变同一个人的推进成本。',
  },
  {
    title: '世界易不替你决定，它帮你重建判断',
    description: '它不给你宿命标签，而是把结构、时位、环境与动作重新排成秩序。',
  },
];

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
    description: '从赚钱方式、守财能力、现金流纪律到扩张时机，补上财富主线。',
    href: '/knowledge/world-yi-wealth-rhythm',
  },
  {
    title: '关系分科',
    description: '把关系从“合不合”拉回节奏、边界、消耗结构与环境压力。',
    href: '/knowledge/world-yi-relationship-order',
  },
  {
    title: '家庭与代际',
    description: '处理伴侣、孩子、父母与工作交叠后的责任排序难题。',
    href: '/knowledge/world-yi-family-generational-order',
  },
  {
    title: '家宅与空间',
    description: '把家宅从神秘布置转回空间动线、恢复质量和关系密度。',
    href: '/knowledge/world-yi-home-order',
  },
  {
    title: '择时体系',
    description: '让择时回到阶段成熟度、动作强度和环境窗口，而不是单点迷信。',
    href: '/knowledge/world-yi-timing-selection',
  },
  {
    title: '版本与答疑',
    description: '公开解释世界易是什么、边界在哪里、为什么必须版本化。',
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
  const worldYiScaleCards = [
    { label: '当前公开总量', value: `${worldYiStats.publicContentCount} 篇`, detail: '知识、案例与洞察已经并网公开。' },
    { label: '当前发布阶段', value: publicationStageLabel, detail: worldYiStats.publicationMode === 'seeded_publication' ? '当前仍以首批 seed 公共内容为主。' : '世界易内容已经不止一次性存量公开。' },
    { label: '中文主路径', value: `${worldYiStats.mainKnowledgeCount + worldYiStats.mainCaseCount} 篇`, detail: '总论、方法、六域与应用已经形成主干。' },
    { label: '全球华人层', value: `${worldYiStats.globalKnowledgeCount + worldYiStats.globalCaseCount} 篇`, detail: '迁移、身份、家庭与教育已经独立成层。' },
    { label: 'English Layer', value: `${worldYiStats.englishKnowledgeCount + worldYiStats.englishCaseCount} 篇`, detail: '英文知识与案例已经开始单独成路。' },
    { label: '环境洞察', value: `${worldYiStats.publicInsightCount} 篇`, detail: '城市、行业、组织开始进入同一套判断框架。' },
    { label: '生活应用组', value: `${worldYiStats.applicationGroupCount} 组`, detail: '起名、寻物、择时、家宅都已列入应用层。' },
    { label: '专题与路径', value: `${worldYiStats.globalTopicCount + worldYiStats.englishTrackCount} 组`, detail: '全球华人专题与英文路径已经成导航。' },
    { label: '公开入口', value: `${worldYiStats.publicRouteCount} 个`, detail: '世界易已形成站内独立公共网络。' },
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
        <WorldYiSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              世界易 {worldYiRoadmapSummary.version}
            </>
          )}
          title={(
            <>
              在 AI 时代，
              <span className="font-serif text-[color:var(--accent-strong)]">重新统一世界、人与环境的判断秩序。</span>
            </>
          )}
          description="世界易由凯莉提出，不是旧命题的内容升级，而是一套试图把易学、时代变化、科技环境、心理结构与现实动作统一起来的现代高维判断学说。"
          hint="首次阅读建议：总论 → 六域 → 个人分析，避免一次打开过多分支。"
          actions={[
            { href: '/knowledge/world-yi-v1-manifesto', label: '先读世界易总论', primary: true, icon: <ArrowRight className="ml-1 h-4 w-4" /> },
            { href: '/world-yi/domains', label: '看人生六域' },
            { href: '/world-yi/book', label: '看主书工程' },
            { href: '/world-yi/global', label: '看全球传播入口' },
            { href: '/analyze', label: '进入个人判断' },
          ]}
          highlights={motherPropositions}
        />

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">
              <Compass className="h-3.5 w-3.5" />
              六层引力模型
            </div>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">为什么用户会喜欢、记住并传播世界易</h2>
            <p className="intro-copy mt-4">
              世界易不只研究判断如何成立，也研究一套思想为什么能真正进入人的认知、情绪、身份与行动。
            </p>
            <div className="mt-5 grid gap-3">
              {attractionLayers.map((item) => (
                <div key={item} className="rounded-[1.25rem] bg-white/80 p-4 text-sm font-semibold text-[color:var(--ink)]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">
              <Network className="h-3.5 w-3.5" />
              五大学理基础
            </div>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">为什么世界易不是拼盘，而是统一翻译系统</h2>
            <p className="intro-copy mt-4">
              它以易学为骨架，把心理学、哲学、宗教与神学都变成解释资源层，最后统一回结构、时位、环境与动作。
            </p>
            <div className="mt-5 grid gap-3">
              {foundations.map((item) => (
                <div key={item} className="rounded-[1.25rem] bg-white/80 p-4 text-sm font-semibold text-[color:var(--ink)]">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          <ContentCardLink
            href="/knowledge"
            page="/world-yi"
            meta={{ surfaceKey: 'world_yi_page_network', targetSurfaceKey: 'knowledge_page', contentType: 'knowledge', series: 'world-yi' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到知识层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">先沿知识库继续展开主路径</h2>
            <p className="intro-copy mt-3">
              世界易总入口负责统一判断秩序，下一步最自然的延伸是进入知识库，把主书、方法和六域逐篇读清。
            </p>
          </ContentCardLink>

          <ContentCardLink
            href="/cases"
            page="/world-yi"
            meta={{ surfaceKey: 'world_yi_page_network', targetSurfaceKey: 'cases_page', contentType: 'case', series: 'world-yi' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到证据层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">再去案例库看这套体系怎样落地</h2>
            <p className="intro-copy mt-3">
              如果没有案例层，世界易很容易被误读成概念。案例库会把结构、阶段、环境和动作放回真实人生问题。
            </p>
          </ContentCardLink>

          <ContentCardLink
            href="/insights"
            page="/world-yi"
            meta={{ surfaceKey: 'world_yi_page_network', targetSurfaceKey: 'insights_page', contentType: 'insight', series: 'world-yi' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到环境层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">最后把判断放进城市、行业与组织</h2>
            <p className="intro-copy mt-3">
              世界易不是只解释个人，还解释环境。洞察中心是把这套母系统继续推向外部现实世界的地方。
            </p>
          </ContentCardLink>
        </section>

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.86fr_1.14fr]">
            <div>
              <div className="section-label">
                <Network className="h-3.5 w-3.5" />
                当前公开规模
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">用户现在看到的，已经不是一句学说名，而是一套有体量的公共系统。</h2>
              <p className="intro-copy mt-4">
                世界易必须让用户一眼看见它已经有多少知识、案例、洞察、专题和入口，否则再强的概念也会被误判成一篇包装文案。
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {worldYiScaleCards.map((item) => (
                <div key={item.label} className="rounded-[1.5rem] bg-white/82 p-5 shadow-[0_10px_26px_rgba(23,32,51,0.05)]">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                  <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{item.value}</div>
                  <p className="intro-copy mt-3">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <div className="section-label">
                <BookOpen className="h-3.5 w-3.5" />
                内容工程
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">从主书、知识、案例到城市行业观察，构成一个可持续扩写的内容宇宙</h2>
            <p className="intro-copy mt-4">
              当前世界易已经进入站内知识库、案例、洞察与结果页表达。它不是单篇热文，而是一个版本化学说工程；至于现在是基础公开阶段还是持续增发阶段，会在发布页里按真实运行态展示。
            </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {worldYiRoadmapSummary.tracks.map((item) => (
                <div key={item.key} className="soft-card rounded-[1.5rem] p-5">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">目标内容量</div>
                  <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{item.targetCount} 篇</div>
                  <div className="intro-copy mt-2">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="relative overflow-hidden rounded-[2.2rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(244,237,226,0.92))] p-6 shadow-[0_24px_64px_rgba(34,33,30,0.07)] md:p-8">
            <div className="absolute -right-10 top-6 h-44 w-44 rounded-full bg-[rgba(178,149,93,0.12)] blur-3xl" />
            <div className="absolute left-6 bottom-0 h-32 w-32 rounded-full bg-[rgba(201,125,58,0.12)] blur-3xl" />

            <div className="relative grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="section-label">
                  <Sparkles className="h-3.5 w-3.5" />
                  体系总部
                </div>
                <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">
                  世界易现在不是一个专区，
                  <span className="font-serif text-[color:var(--accent-strong)]">而是正在接管整个站点解释力的母系统。</span>
                </h2>
                <p className="intro-copy mt-4">
                  它已经同时具备主书、六域、全球华人、英文层、案例库、内容矩阵和版本治理。后面所有继续发布的内容，都会不断回挂这套母系统，而不是再各写各的。
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {doctrineWall.map((item) => (
                  <div key={item} className="rounded-[1.3rem] bg-white/80 p-4 text-sm font-semibold text-[color:var(--ink)] shadow-[0_10px_24px_rgba(23,32,51,0.04)]">
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
              <div className="section-label">核心分科</div>
              <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">世界易已经不只停在总论，开始进入财富、关系、家庭、家宅与择时</h2>
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
                className="soft-card rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-lg font-bold text-[color:var(--ink)]">{item.title}</div>
                <p className="intro-copy mt-3">{item.description}</p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
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
            className="glass-panel block rounded-[2rem] p-6 transition hover:-translate-y-0.5 md:p-8"
          >
            <div className="section-label">
              <Compass className="h-3.5 w-3.5" />
              人生六域
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="text-3xl font-black text-[color:var(--ink)]">Batch 02 已经开始进入事业、财富、关系、健康、家庭与迁移六条主线</h2>
                <p className="intro-copy mt-4">
                  世界易不是只写总论，它正在把用户最常见的主问题拆成可持续扩写的六条内容主线，每一条都要求同时有知识、案例和结果页语言。
                </p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
                  进入人生六域入口
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {['事业', '财富', '关系', '健康', '家庭', '迁移'].map((item) => (
                  <div key={item} className="rounded-[1.25rem] bg-white/75 p-4 text-sm font-semibold text-[color:var(--ink)]">
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
            className="glass-panel block rounded-[2rem] p-6 transition hover:-translate-y-0.5 md:p-8"
          >
            <div className="section-label">
              <BookOpen className="h-3.5 w-3.5" />
              主书工程
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="text-3xl font-black text-[color:var(--ink)]">世界易十卷初版已经成书，开始形成真正可持续扩写的主书母本</h2>
                <p className="intro-copy mt-4">
                  现在不是只靠概念撑着，而是在持续成书。卷一到卷十初版正文已经落下，接下来是继续把案例、分科和产品表达往这十卷上加厚。
                </p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
                  进入主书工程
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {['卷一：起论与立法', '卷二：世界观与引力', '卷三：概念与判断法', '卷四：财富事业扩张', '卷五：关系家庭代际', '卷六到卷十：环境应用传播治理'].map((item) => (
                  <div key={item} className="rounded-[1.25rem] bg-white/75 p-4 text-sm font-semibold text-[color:var(--ink)]">
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
            className="glass-panel block rounded-[2rem] p-6 transition hover:-translate-y-0.5 md:p-8"
          >
            <div className="section-label">
              <Network className="h-3.5 w-3.5" />
              内容矩阵
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_1fr]">
              <div>
                <h2 className="text-3xl font-black text-[color:var(--ink)]">世界易已经不是只在写书，而是在把十卷映射成首批 120 篇执行批次</h2>
                <p className="intro-copy mt-4">
                  主书负责定宪法，矩阵负责占领现实问题。现在已经把母语、六域、应用、全球、案例和治理拆成可直接开工的六个批次。
                </p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
                  进入首批 120 篇执行图
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {['Batch 01：母语定盘', 'Batch 02：六域起量', 'Batch 03：应用落地', 'Batch 04：全球华人', 'Batch 05：案例密集化', 'Batch 06：治理与传播'].map((item) => (
                  <div key={item} className="rounded-[1.25rem] bg-white/75 p-4 text-sm font-semibold text-[color:var(--ink)]">
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
              <div className="section-label">阅读路径</div>
              <h2 className="mt-3 text-3xl font-black text-[color:var(--ink)]">先从总论进入，再往方法、时代、应用和案例推进</h2>
            </div>
            <Link href="/knowledge" className="action-secondary">
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
                className="soft-card rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{article.category}</div>
                <h3 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{article.title}</h3>
                <p className="intro-copy mt-3">{article.excerpt}</p>
                <div className="action-guide mt-5 inline-flex items-center gap-2">
                  阅读全文
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-2">
          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">案例层</div>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">世界易不是只讲概念，还要进入真实问题</h2>
            <div className="mt-5 space-y-3">
              {worldYiCases.map((item) => (
                <ContentCardLink
                  key={item.slug}
                  href={`/cases/${item.slug}`}
                  page="/world-yi"
                  meta={{
                    surfaceKey: 'world_yi_cases',
                    targetSurfaceKey: `case:${item.slug}`,
                    contentType: 'case',
                    slug: item.slug,
                    title: item.title,
                    tags: item.tags,
                  }}
                  className="block rounded-[1.25rem] bg-white/80 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                  <div className="intro-copy mt-2">{item.excerpt}</div>
                </ContentCardLink>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 md:p-8">
            <div className="section-label">观察层</div>
            <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">城市、行业与组织，也必须被放进同一套判断结构里</h2>
            <div className="mt-5 space-y-3">
              {worldYiInsights.map((item) => (
                <ContentCardLink
                  key={`${item.subtype || 'insight'}:${item.slug}`}
                  href={`/insights/${item.subtype || 'industry'}/${item.slug}`}
                  page="/world-yi"
                  meta={{
                    surfaceKey: 'world_yi_insights',
                    targetSurfaceKey: `insight:${item.slug}`,
                    contentType: 'insight',
                    slug: item.slug,
                    title: item.title,
                    tags: item.tags,
                  }}
                  className="block rounded-[1.25rem] bg-white/80 p-4 transition hover:bg-white"
                >
                  <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                  <div className="intro-copy mt-2">{item.excerpt}</div>
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
