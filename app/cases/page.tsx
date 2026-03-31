import Link from 'next/link';
import { ArrowRight, Compass, Globe2, Layers3, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentLocaleBadge from '@/components/content-locale-badge';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import PublicSurfaceHero from '@/components/public-surface-hero';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import { getContentLocalePresentation, getLocaleAnchorId, type ContentLocaleGroupKey } from '@/lib/content-locale';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { worldYiExecutionBatches, worldYiRoadmapSummary } from '@/lib/world-yi';

export const metadata = createPublicContentMetadata({
  title: '公开案例库 | 人生K线',
  description: '通过升学、事业、婚恋等真实场景案例，解释这套判断系统到底解决什么问题。',
  path: '/cases',
  type: 'website',
});

export const dynamic = 'force-dynamic';

const worldYiCasePowerLinks = [
  {
    title: '人生六域案例',
    description: '把事业、财富、关系、健康、家庭、迁移全部做成可复用证据层。',
    href: '/world-yi/domains',
    icon: Compass,
  },
  {
    title: '全球华人案例',
    description: '海外身份、婚姻、孩子教育、养老与留回判断开始独立成层。',
    href: '/world-yi/global/cases',
    icon: Globe2,
  },
  {
    title: '英文案例路径',
    description: '让世界易不只在中文语境成立，也能服务英文阅读和海外用户。',
    href: '/world-yi/en/cases',
    icon: Layers3,
  },
];

export default function CasesPage() {
  const localeGroups = new Map<ContentLocaleGroupKey, {
    groupLabel: string;
    groupDescription: string;
    sortOrder: number;
    entries: ReturnType<typeof listPublishedManagedContentEntriesByType>;
  }>();
  const caseEntries = listPublishedManagedContentEntriesByType('case');
  caseEntries.forEach((entry) => {
    const locale = typeof entry.meta?.locale === 'string' ? entry.meta.locale : '';
    const market = typeof entry.meta?.market === 'string' ? entry.meta.market : '';
    const presentation = getContentLocalePresentation(locale, market);
    const group = localeGroups.get(presentation.groupKey);
    if (group) {
      group.entries.push(entry);
      return;
    }

    localeGroups.set(presentation.groupKey, {
      groupLabel: presentation.groupLabel,
      groupDescription: presentation.groupDescription,
      sortOrder: presentation.sortOrder,
      entries: [entry],
    });
  });
  const groupedCaseEntries = [...localeGroups.entries()]
    .sort((left, right) => left[1].sortOrder - right[1].sortOrder)
    .map(([groupKey, group]) => ({
      groupKey,
      ...group,
    }));
  const worldYiCaseEntries = caseEntries.filter((entry) => entry.slug.startsWith('world-yi-'));
  const worldYiCaseMainCount = worldYiCaseEntries
    .filter((entry) => entry.meta?.series === 'world-yi')
    .length;
  const worldYiCaseGlobalCount = worldYiCaseEntries
    .filter((entry) => entry.meta?.series === 'world-yi-global')
    .length;
  const worldYiCaseEnglishCount = worldYiCaseEntries
    .filter((entry) => entry.meta?.series === 'world-yi-en')
    .length;
  const worldYiKnowledgeCount = listPublishedManagedContentEntriesByType('knowledge')
    .filter((entry) => entry.slug.startsWith('world-yi-'))
    .length;
  const caseDensityTarget = worldYiExecutionBatches.find((batch) => batch.phase === 'Batch 05')?.targetCount || 100;
  const schemas = [
    createCollectionPageSchema({
      headline: '公开案例库',
      description: '通过升学、事业、婚恋等真实场景案例，解释这套判断系统到底解决什么问题。',
      path: '/cases',
      keywords: ['升学案例', '职业案例', '关系案例', '世界易案例'],
    }),
    createItemListSchema(
      '案例库重点案例',
      caseEntries.slice(0, 12).map((entry, index) => ({
        name: entry.title,
        path: `/cases/${entry.slug}`,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView eventName="cases_page_viewed" page="/cases" meta={{ surfaceKey: 'cases_page', contentType: 'case' }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <PublicSurfaceHero
          label={(
            <>
              <Sparkles className="h-3.5 w-3.5" />
              场景化案例
            </>
          )}
          title={(
            <>
              用户不是来学术语，
              <span className="font-serif text-[color:var(--accent-strong)]">而是来解决具体问题。</span>
            </>
          )}
          description="案例页把产品价值翻译成真实情境，既适合新用户理解，也适合持续扩展成高质量的内容资产。"
          hint="第一次阅读案例，优先看与你当前问题最接近的场景，再进入分析页落地。"
          actions={[
            <Link key="analyze" href="/analyze" className="action-primary action-main">
              开始分析
              <ArrowRight className="h-4 w-4" />
            </Link>,
            <Link key="global-cases" href="/world-yi/global/cases" className="action-secondary">看全球案例</Link>,
          ]}
          highlights={[
            { body: '升学与焦虑判断' },
            { body: '职业换岗与时机窗口' },
            { body: '关系推进与风险节奏' },
          ]}
          highlightsColumns="md:grid-cols-3"
        />

        <section className="mt-8">
          <div className="grid gap-4 lg:grid-cols-2">
            <ContentCardLink
              href="/world-yi"
              page="/cases"
              meta={{
                surfaceKey: 'cases_page',
                targetSurfaceKey: 'world_yi_page',
                contentType: 'case',
                series: 'world-yi',
                version: 'v1.0.0.1',
              }}
              className="glass-panel block rounded-[2rem] p-6 transition hover:-translate-y-0.5"
            >
              <div className="section-label">
                <Sparkles className="h-3.5 w-3.5" />
                世界易案例观
              </div>
              <div className="mt-4 grid gap-5">
                <div>
                  <h2 className="text-3xl font-black text-[color:var(--ink)]">案例不是做玄感表演，而是把结构、阶段、环境和动作讲清楚</h2>
                  <p className="intro-copy mt-4">
                    世界易看案例，不把它当成玄感展示，而当成判断秩序的现实落地。真正好的案例，不只是说发生了什么，而是说明为什么会这样、现在该怎么做、什么风险该先避。
                  </p>
                  <div className="action-guide mt-5 inline-flex items-center gap-2">
                    进入世界易总入口
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {['先看结构', '再看时位', '必须带环境', '最后回到动作'].map((item) => (
                    <div key={item} className="rounded-[1.25rem] bg-white/75 p-4 text-sm font-semibold text-[color:var(--ink)]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </ContentCardLink>

            <ContentCardLink
              href="/world-yi/matrix"
              page="/cases"
              meta={{
                surfaceKey: 'cases_page',
                targetSurfaceKey: 'world_yi_matrix_page',
                contentType: 'case',
                series: 'world-yi-matrix',
              }}
              className="glass-panel block rounded-[2rem] p-6 transition hover:-translate-y-0.5"
            >
              <div className="section-label">
                <Sparkles className="h-3.5 w-3.5" />
                Batch 05
              </div>
              <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)]">案例库正在从少量样本，进入世界易首批 100 篇案例密集化阶段</h2>
              <p className="intro-copy mt-4">
                接下来世界易会按事业、财富、关系、健康、家庭、迁移和生活应用分层扩案例。案例页不再只是展示，而是世界易证据层的核心入口。
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {['事业案例', '财富案例', '关系案例', '家庭案例', '迁移案例', '应用案例'].map((item) => (
                  <div key={item} className="rounded-[1.25rem] bg-white/75 p-4 text-sm font-semibold text-[color:var(--ink)]">
                    {item}
                  </div>
                ))}
              </div>
              <div className="action-guide mt-5 inline-flex items-center gap-2">
                查看内容矩阵
                <ArrowRight className="h-4 w-4" />
              </div>
            </ContentCardLink>
          </div>
        </section>

        <section className="mt-10">
          <div className="relative overflow-hidden rounded-[2.2rem] border border-[color:var(--line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(244,237,226,0.92))] p-6 shadow-[0_22px_60px_rgba(34,33,30,0.08)] md:p-8">
            <div className="absolute -right-12 top-8 h-40 w-40 rounded-full bg-[rgba(178,149,93,0.14)] blur-3xl" />
            <div className="absolute left-2 bottom-0 h-32 w-32 rounded-full bg-[rgba(201,125,58,0.12)] blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-5">
                <div className="section-label">
                  <Layers3 className="h-3.5 w-3.5" />
                  世界易证据层
                </div>
                <h2 className="text-3xl font-black text-[color:var(--ink)] md:text-4xl">
                  案例库正在从“能看看”升级成
                  <span className="font-serif text-[color:var(--accent-strong)]">世界易的公开证据网络。</span>
                </h2>
                <p className="intro-copy">
                  用户最终信任的，不是概念，而是反复出现的判断秩序。世界易案例页要持续证明三件事：先看结构，再看阶段，必须带环境，最后落到动作与验证。
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: '当前公开世界易案例', value: `${worldYiCaseEntries.length} 篇` },
                    { label: '中文主路径案例', value: `${worldYiCaseMainCount} 篇` },
                    { label: '全球华人案例', value: `${worldYiCaseGlobalCount} 篇` },
                    { label: '英文案例入口', value: `${worldYiCaseEnglishCount} 篇` },
                    { label: '世界易公开知识支撑', value: `${worldYiKnowledgeCount} 篇` },
                    { label: 'Batch 05 密度目标', value: `${caseDensityTarget} 篇` },
                    { label: '案例库最终目标', value: `${worldYiRoadmapSummary.tracks.find((track) => track.key === 'cases')?.targetCount || 420} 篇` },
                    { label: '世界易内容宇宙', value: `${worldYiRoadmapSummary.targetArticleCount} 篇` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-[1.25rem] bg-white/82 p-4 shadow-[0_10px_24px_rgba(23,32,51,0.04)]">
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                      <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {worldYiCasePowerLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <ContentCardLink
                        key={item.href}
                        href={item.href}
                        page="/cases"
                        meta={{
                          surfaceKey: 'cases_page_world_yi_evidence',
                          targetSurfaceKey: item.href.replace('/', '').replaceAll('/', '_'),
                          contentType: 'case',
                          series: 'world-yi',
                          version: worldYiRoadmapSummary.version,
                        }}
                        className="rounded-[1.6rem] bg-white/84 p-5 transition hover:-translate-y-0.5"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="mt-4 text-lg font-bold text-[color:var(--ink)]">{item.title}</div>
                        <p className="intro-copy mt-3">{item.description}</p>
                        <div className="action-guide mt-5 inline-flex items-center gap-2">
                          进入案例层
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </ContentCardLink>
                    );
                  })}
                </div>

                <div className="rounded-[1.75rem] bg-white/78 p-5">
                  <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">案例纪律</div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {[
                      '先解释结构，不先下好坏结论',
                      '必须交代用户所处阶段',
                      '必须把环境变量说出来',
                      '最后回到一个现实动作',
                    ].map((item) => (
                      <div key={item} className="rounded-[1.2rem] bg-slate-50 px-4 py-4 text-sm font-semibold text-[color:var(--ink)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-5">
          <div className="flex flex-wrap gap-3">
            {groupedCaseEntries.map((group) => (
              <a
                key={group.groupKey}
                href={`#${getLocaleAnchorId(group.groupKey)}`}
                className="product-chip"
              >
                {group.groupLabel}
                <span className="text-xs text-[color:var(--muted)]">{group.entries.length} 篇</span>
              </a>
            ))}
          </div>

          <div className="space-y-8">
            {groupedCaseEntries.map((group) => (
              <section key={group.groupKey} id={getLocaleAnchorId(group.groupKey)} className="space-y-4 scroll-mt-24">
                <div className="space-y-2">
                  <div className="section-label">{group.groupLabel}</div>
                  <p className="intro-copy">{group.groupDescription}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {group.entries.map((item) => {
                    const locale = typeof item.meta?.locale === 'string' ? item.meta.locale : '';
                    const market = typeof item.meta?.market === 'string' ? item.meta.market : '';

                    return (
                      <ContentCardLink
                        key={item.slug}
                        href={`/cases/${item.slug}`}
                        page="/cases"
                        meta={{
                          surfaceKey: `cases_page:${group.groupKey}`,
                          contentType: 'case',
                          slug: item.slug,
                          title: item.title,
                          category: item.category,
                          tags: item.tags,
                          locale,
                          market,
                        }}
                        className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.18em] text-[color:var(--muted)]">
                          <span>{item.category}</span>
                          <ContentLocaleBadge locale={locale} market={market} compact />
                        </div>
                        <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">{item.title}</h2>
                        <p className="intro-copy mt-3">{item.excerpt}</p>
                        <div className="mt-3 text-xs text-[color:var(--muted)]">{market || '多语言用户'}</div>
                        <div className="action-guide mt-5 inline-flex items-center gap-2">
                          查看案例
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </ContentCardLink>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          <ContentCardLink
            href="/knowledge"
            page="/cases"
            meta={{ surfaceKey: 'cases_page_network', targetSurfaceKey: 'knowledge_page', contentType: 'knowledge' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到方法层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">案例之后，回知识库补方法</h2>
            <p className="intro-copy mt-3">案例负责证明有效，知识库负责解释为什么这样判断。</p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              进入知识库
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>

          <ContentCardLink
            href="/insights"
            page="/cases"
            meta={{ surfaceKey: 'cases_page_network', targetSurfaceKey: 'insights_page', contentType: 'insight' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到环境层</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">案例之后，看外部环境变化</h2>
            <p className="intro-copy mt-3">同样的结构，放到不同环境里，推进成本会完全不同。</p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              进入洞察中心
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>

          <ContentCardLink
            href="/world-yi"
            page="/cases"
            meta={{ surfaceKey: 'cases_page_network', targetSurfaceKey: 'world_yi_page', contentType: 'case', series: 'world-yi' }}
            className="glass-panel rounded-[1.75rem] p-6 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到母系统</div>
            <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">案例只是证据层，不是终点</h2>
            <p className="intro-copy mt-3">要看清为什么这样分析，还是要回到世界易总入口。</p>
            <div className="action-guide mt-5 inline-flex items-center gap-2">
              回到世界易
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>
        </section>

        <section className="mt-12">
          <ContentQuickAnalyzePanel
            sourceLabel="案例页转化"
            sourceKey="cases_page"
            contentMeta={{ contentType: 'case', surfaceKey: 'cases_page' }}
            title="案例看完，马上看自己的结构和阶段"
            description="案例看完，直接带着生日进入分析。"
          />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
