import { ArrowRight, BookOpenText, Compass, Globe2, Layers3, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentLocaleBadge from '@/components/content-locale-badge';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import PriorityDisclosure from '@/components/priority-disclosure';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import PublicEvidencePanel from '@/components/public-evidence-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { getEntityInsights, getKnowledgeArticles, listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import { getContentLocalePresentation, getLocaleAnchorId, type ContentLocaleGroupKey } from '@/lib/content-locale';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { getFeaturedTools } from '@/lib/tools';
import { worldYiExecutionBatches, worldYiRoadmapSummary } from '@/lib/world-yi';

export const metadata = createPublicContentMetadata({
  title: '公开案例库 | 人生K线',
  description: '通过升学、事业、婚恋等真实场景案例，解释这套判断系统到底解决什么问题。',
  path: '/cases',
  type: 'website',
  languages: {
    'zh-CN': '/cases',
    'en-US': '/world-yi/en/cases',
    'x-default': '/cases',
  },
});

export const dynamic = 'force-dynamic';

const worldYiCasePowerLinks = [
  { title: '人生六域案例', href: '/world-yi/domains', icon: Compass },
  { title: '全球华人案例', href: '/world-yi/global/cases', icon: Globe2 },
  { title: '英文案例路径', href: '/world-yi/en/cases', icon: Layers3 },
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
    .map(([groupKey, group]) => ({ groupKey, ...group }));
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
  const caseSignals = caseEntries.slice(0, 18)
    .flatMap((entry) => [entry.title, entry.category || '', ...entry.tags])
    .filter((signal): signal is string => typeof signal === 'string' && signal.length > 0)
    .map((signal) => signal.toLowerCase());
  const matchesCaseSignal = (text: string) => {
    const lowered = text.toLowerCase();
    return caseSignals.some((signal) => lowered.includes(signal));
  };
  const toolItems = getFeaturedTools(12)
    .filter((tool) => matchesCaseSignal([tool.title, tool.shortTitle, tool.themeLabel, ...tool.hookKeywords].join(' ')))
    .slice(0, 3);
  const knowledgeItems = getKnowledgeArticles()
    .filter((item) => matchesCaseSignal([item.title, item.excerpt, item.category, ...item.tags].join(' ')))
    .slice(0, 2);
  const insightItems = getEntityInsights()
    .filter((item) => matchesCaseSignal([item.title, item.excerpt, item.name, ...item.tags].join(' ')))
    .slice(0, 2);
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

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Layers3 className="h-3 w-3" />
              场景化案例
            </div>
            <h1 className="mt-2 text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
              先找和你相近的<span className="text-[color:var(--brand-strong)]">真实场景</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">
              升学、事业、婚恋、迁移——通过真实判断案例理解系统能解决什么问题。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ContentCardLink
              href="/analyze"
              page="/cases"
              meta={{ surfaceKey: 'cases_page', targetSurfaceKey: 'analyze_page', contentType: 'case' }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
            >
              开始分析
              <ArrowRight className="h-4 w-4" />
            </ContentCardLink>
            <ContentCardLink
              href="/world-yi/global/cases"
              page="/cases"
              meta={{ surfaceKey: 'cases_page', targetSurfaceKey: 'world_yi_global_cases', contentType: 'case' }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              看全球案例
            </ContentCardLink>
            <ContentCardLink
              href="/docs/read-first-report"
              page="/cases"
              meta={{ surfaceKey: 'cases_page', targetSurfaceKey: 'docs_read_first_report', contentType: 'docs' }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              <BookOpenText className="h-4 w-4" />
              使用方法
            </ContentCardLink>
          </div>
        </section>

        <section className="mt-6 space-y-5">
          <div className="flex flex-wrap gap-3">
            {groupedCaseEntries.map((group) => (
              <a
                key={group.groupKey}
                href={`#${getLocaleAnchorId(group.groupKey)}`}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-2 py-0.5 text-xs font-semibold text-[color:var(--ink-2)]"
              >
                {group.groupLabel}
                <span className="text-xs text-[color:var(--muted)]">{group.entries.length} 篇</span>
              </a>
            ))}
          </div>

          <div className="space-y-8">
            {groupedCaseEntries.map((group) => (
              <section key={group.groupKey} id={getLocaleAnchorId(group.groupKey)} className="space-y-4 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">{group.groupLabel}</div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                        className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-xl p-4 transition hover:-translate-y-0.5"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.18em] text-[color:var(--muted)]">
                          <span>{item.category}</span>
                          <ContentLocaleBadge locale={locale} market={market} compact />
                        </div>
                        <h2 className="mt-3 text-xl font-bold leading-snug text-[color:var(--ink)]">{item.title}</h2>
                        <div className="mt-2 text-xs text-[color:var(--muted)]">{market || '多语言用户'}</div>
                        <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-4 inline-flex items-center gap-2">
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

        <section className="mt-12">
          <ContentQuickAnalyzePanel
            sourceLabel="案例页转化"
            sourceKey="cases_page"
            contentMeta={{ contentType: 'case', surfaceKey: 'cases_page' }}
            title="个人分析"
            description="看完公开案例后，直接把自己的出生信息带进正式分析入口，判断你是否也处在相近结构里。"
          />
        </section>

        <section className="mt-10 space-y-4">
          <ProductSurfaceRolePanel
            surface="cases"
            title="案例库先降低理解门槛，再把用户带回自己的问题"
            compact
          />

          <PriorityDisclosure
            label="案例系统说明"
            title="案例观、分类和数据面板"
            description="这些是证据和方法层，不默认挡在案例列表前面。"
          >
            <div className="space-y-5">
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
                  className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] block p-6 transition hover:-translate-y-0.5"
                >
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    世界易案例观
                  </div>
                  <div className="mt-4 grid gap-5">
                    <div>
                      <h2 className="text-2xl font-black text-[color:var(--ink)]">案例维度</h2>
                      <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
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
                  className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] block p-6 transition hover:-translate-y-0.5"
                >
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Batch 05
                  </div>
                  <h2 className="mt-4 text-2xl font-black text-[color:var(--ink)]">案例分类</h2>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {['事业案例', '财富案例', '关系案例', '家庭案例', '迁移案例', '应用案例'].map((item) => (
                      <div key={item} className="rounded-[1.25rem] bg-white/75 p-4 text-sm font-semibold text-[color:var(--ink)]">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                    查看内容矩阵
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </ContentCardLink>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6 md:p-8">
                <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                      <Layers3 className="h-3.5 w-3.5" />
                      世界易证据层
                    </div>
                    <h2 className="text-2xl font-black text-[color:var(--ink)]">数据面板</h2>
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
                        <div key={item.label} className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-4 py-3">
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
                            <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
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
                          <div key={item} className="rounded-[1.2rem] bg-[color:var(--bg-elevated)] px-4 py-4 text-sm font-semibold text-[color:var(--ink)]">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PriorityDisclosure>
        </section>

        <PublicEvidencePanel
          page="/cases"
          title="把案例层接到工具、知识和环境洞察"
          description="案例不该只是让人看看就走。它应该继续接到相关工具、原理解释和环境洞察，让用户能从“别人发生了什么”走到“我该怎么判断”。"
          surfaceKey="cases_page_evidence"
          toolItems={toolItems}
          knowledgeItems={knowledgeItems}
          insightItems={insightItems}
        />

        <section className="mt-12">
          <PriorityDisclosure
            label="更多入口"
            title="知识、洞察和世界易"
            description="补充入口放在案例列表之后，不抢主阅读任务。"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <ContentCardLink
                href="/knowledge"
                page="/cases"
                meta={{ surfaceKey: 'cases_page_network', targetSurfaceKey: 'knowledge_page', contentType: 'knowledge' }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">知识</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">知识库</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  进入知识库
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>

              <ContentCardLink
                href="/insights"
                page="/cases"
                meta={{ surfaceKey: 'cases_page_network', targetSurfaceKey: 'insights_page', contentType: 'insight' }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">洞察</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">洞察中心</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  进入洞察中心
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>

              <ContentCardLink
                href="/world-yi"
                page="/cases"
                meta={{ surfaceKey: 'cases_page_network', targetSurfaceKey: 'world_yi_page', contentType: 'case', series: 'world-yi' }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">世界易</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">世界易</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  回到世界易
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            </div>
          </PriorityDisclosure>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
