import { ArrowRight, BookOpen, Compass, FileQuestion, Globe2, Layers3, Network, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentLocaleBadge from '@/components/content-locale-badge';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import PriorityDisclosure from '@/components/priority-disclosure';
import ProductSurfaceRolePanel from '@/components/product-surface-role-panel';
import PublicEvidencePanel from '@/components/public-evidence-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import VisualAssetCard from '@/components/visual-asset-card';
import VisualAssetFeature from '@/components/visual-asset-feature';
import { getCaseStudies, getEntityInsights, isPublicKnowledgeEntry, listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import { getContentLocalePresentation, getLocaleAnchorId, type ContentLocaleGroupKey } from '@/lib/content-locale';
import { listKnowledgeTopicHubs } from '@/lib/knowledge-network-feed';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { getFeaturedTools } from '@/lib/tools';
import { getVisualAssetById } from '@/lib/visual-asset-library';
import { worldYiRoadmapSummary } from '@/lib/world-yi';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

export function generateMetadata() {
  return createPublicContentMetadata({
    title: '世界易知识库 | 人生K线',
    description: '围绕真太阳时、结构判断、结果阅读和决策应用建立长期可积累的现代判断知识库。',
    path: '/knowledge',
    type: 'website',
    languages: {
      'zh-CN': '/knowledge',
      'en-US': '/world-yi/en',
      'x-default': '/knowledge',
    },
  });
}

export const revalidate = 3600;

const worldYiKnowledgePowerLinks = [
  { title: '十卷主书', href: '/world-yi/book', icon: BookOpen },
  { title: '人生六域', href: '/world-yi/domains', icon: Compass },
  { title: '全球华人', href: '/world-yi/global', icon: Globe2 },
  { title: '发布架构', href: '/world-yi/publish', icon: Layers3 },
];

export default function KnowledgePage() {
  const worldYiStats = getWorldYiPublicStats();
  const mingliMapImage = getVisualAssetById('MY01-001') || getVisualAssetById('PWY01-008');
  const fiveElementsImage = getVisualAssetById('MY03-001') || getVisualAssetById('PWY01-008');
  const visualArticleImage = getVisualAssetById('PWY01-012');
  const taiSuiImage = getVisualAssetById('MY06-002') || getVisualAssetById('PWY01-010');
  const benMingNianImage = getVisualAssetById('MY06-003') || getVisualAssetById('PWY01-011');
  const localeGroups = new Map<ContentLocaleGroupKey, {
    groupLabel: string;
    groupDescription: string;
    sortOrder: number;
    entries: ReturnType<typeof listPublishedManagedContentEntriesByType>;
  }>();
  const knowledgeEntries = listPublishedManagedContentEntriesByType('knowledge')
    .filter((entry) => isPublicKnowledgeEntry(entry));

  knowledgeEntries.forEach((entry) => {
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

  const groupedKnowledgeEntries = [...localeGroups.entries()]
    .sort((left, right) => left[1].sortOrder - right[1].sortOrder)
    .map(([groupKey, group]) => ({ groupKey, ...group }));
  const topicHubs = listKnowledgeTopicHubs({ limit: 4 });
  const knowledgeSignals = [
    ...topicHubs.flatMap((hub) => [hub.topicName, ...hub.relatedTopicNames]),
    ...knowledgeEntries.slice(0, 16).flatMap((entry) => [entry.title, entry.category || '', ...entry.tags]),
  ].filter((signal): signal is string => typeof signal === 'string' && signal.length > 0)
    .map((signal) => signal.toLowerCase());
  const matchesKnowledgeSignal = (text: string) => {
    const lowered = text.toLowerCase();
    return knowledgeSignals.some((signal) => lowered.includes(signal));
  };
  const toolItems = getFeaturedTools(12)
    .filter((tool) => matchesKnowledgeSignal([tool.title, tool.shortTitle, tool.themeLabel, ...tool.hookKeywords].join(' ')))
    .slice(0, 3);
  const caseItems = getCaseStudies()
    .filter((item) => matchesKnowledgeSignal([item.title, item.excerpt, item.scenario, ...item.tags].join(' ')))
    .slice(0, 2);
  const insightItems = getEntityInsights()
    .filter((item) => matchesKnowledgeSignal([item.title, item.excerpt, item.name, ...item.tags].join(' ')))
    .slice(0, 2);
  const schemas = [
    createCollectionPageSchema({
      headline: '世界易知识库',
      description: '围绕真太阳时、结构判断、结果阅读和决策应用建立长期可积累的现代判断知识库。',
      path: '/knowledge',
      keywords: ['真太阳时', '结构判断', '报告阅读', '决策应用'],
    }),
    createItemListSchema(
      '知识库重点阅读',
      knowledgeEntries.slice(0, 10).map((entry, index) => ({
        name: entry.title,
        path: `/knowledge/${entry.slug}`,
        position: index + 1,
      })),
    ),
    createItemListSchema(
      '知识专题地图',
      topicHubs.map((hub, index) => ({
        name: hub.topicName,
        path: `/knowledge/topics/${hub.topicSlug}`,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView eventName="knowledge_page_viewed" page="/knowledge" meta={{ surfaceKey: 'knowledge_page', contentType: 'knowledge' }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-6 pb-16 md:py-8 md:pb-20">
        <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <BookOpen className="h-3 w-3" />
              知识库
            </div>
            <h1 className="mt-2 text-2xl font-black leading-[1.15] tracking-tight text-[color:var(--ink-1)] md:text-3xl">
              系统化阅读 · <span className="text-[color:var(--brand-strong)]">真太阳时与世界易</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--ink-3)]">
              围绕真太阳时校正、结构判断、报告阅读和决策应用建立的可积累知识体系。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ContentCardLink
              href="/docs"
              page="/knowledge"
              meta={{ surfaceKey: 'knowledge_page', targetSurfaceKey: 'docs_index', contentType: 'docs' }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              <FileQuestion className="h-4 w-4" />
              Docs
            </ContentCardLink>
            <ContentCardLink
              href="/knowledge/topics"
              page="/knowledge"
              meta={{ surfaceKey: 'knowledge_page', targetSurfaceKey: 'knowledge_topics_page', contentType: 'knowledge' }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--brand-deep)]"
            >
              专题地图
              <ArrowRight className="h-4 w-4" />
            </ContentCardLink>
            <ContentCardLink
              href="/analyze"
              page="/knowledge"
              meta={{ surfaceKey: 'knowledge_page', targetSurfaceKey: 'analyze_page', contentType: 'knowledge' }}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
            >
              回到分析入口
            </ContentCardLink>
          </div>
        </section>

        <section className="mt-6 space-y-5">
          <div className="flex flex-wrap gap-2">
            {groupedKnowledgeEntries.map((group) => (
              <a
                key={group.groupKey}
                href={`#${getLocaleAnchorId(group.groupKey)}`}
                className="inline-flex h-7 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-2.5 text-xs font-semibold text-[color:var(--ink-2)] hover:border-[color:var(--brand)]"
              >
                {group.groupLabel}
                <span className="font-mono tabular-nums text-[10px] text-[color:var(--ink-5)]">
                  {group.entries.length}
                </span>
              </a>
            ))}
          </div>

          <div className="space-y-8">
            {groupedKnowledgeEntries.map((group) => (
              <section key={group.groupKey} id={getLocaleAnchorId(group.groupKey)} className="space-y-4 scroll-mt-24">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                  <BookOpen className="h-3.5 w-3.5" />
                  {group.groupLabel}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {group.entries.map((article) => {
                    const locale = typeof article.meta?.locale === 'string' ? article.meta.locale : '';
                    const market = typeof article.meta?.market === 'string' ? article.meta.market : '';

                    return (
                      <ContentCardLink
                        key={article.slug}
                        href={`/knowledge/${article.slug}`}
                        page="/knowledge"
                        meta={{
                          surfaceKey: `knowledge_page:${group.groupKey}`,
                          contentType: 'knowledge',
                          slug: article.slug,
                          title: article.title,
                          category: article.category,
                          tags: article.tags,
                          locale,
                          market,
                        }}
                        className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] rounded-[var(--radius)] p-4 transition hover:-translate-y-0.5"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.18em] text-[color:var(--muted)]">
                          <BookOpen className="h-3.5 w-3.5" />
                          <span>{article.category}</span>
                          <ContentLocaleBadge locale={locale} market={market} compact />
                        </div>
                        <h2 className="mt-3 text-xl font-bold leading-snug text-[color:var(--ink)]">{article.title}</h2>
                        <div className="mt-2 text-xs text-[color:var(--muted)]">{market || '多语言用户'}</div>
                        <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-4 inline-flex items-center gap-2">
                          阅读全文
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

        {topicHubs.length > 0 ? (
          <section className="mt-8">
            <PriorityDisclosure
              label="专题路径"
              title="按专题连续阅读"
              description="文章列表优先；需要系统阅读时再展开专题地图。"
            >
              <div className="grid gap-3 md:grid-cols-2">
                {topicHubs.map((hub) => (
                  <ContentCardLink
                    key={hub.topicKey}
                    href={`/knowledge/topics/${hub.topicSlug}`}
                    page="/knowledge"
                    meta={{
                      surfaceKey: 'knowledge_topic_hubs',
                      targetSurfaceKey: `knowledge_topic:${hub.topicSlug}`,
                      contentType: 'knowledge',
                      topicName: hub.topicName,
                    }}
                    className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius)] p-4 transition hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-[color:var(--muted)]">
                      <Network className="h-3.5 w-3.5" />
                      {hub.entryCount} 篇
                    </div>
                    <h2 className="mt-3 text-xl font-bold text-[color:var(--ink)]">{hub.topicName}</h2>
                    {hub.relatedTopicNames.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {hub.relatedTopicNames.slice(0, 4).map((item) => (
                          <span key={item} className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </ContentCardLink>
                ))}
              </div>
            </PriorityDisclosure>
          </section>
        ) : null}

        <section className="mt-12">
          <ContentQuickAnalyzePanel
            sourceLabel="知识内容转化"
            sourceKey="knowledge_page"
            contentMeta={{ contentType: 'knowledge', surfaceKey: 'knowledge_page' }}
            title="个人分析"
            description="看完方法和案例后，直接进入正式分析，把抽象方法落回你自己的节奏、环境和行动问题。"
          />
        </section>

        <section className="mt-10 space-y-4">
          <ProductSurfaceRolePanel
            surface="knowledge"
            title="知识库先帮用户建立读法，再把问题接回个人判断"
            compact
          />

          <PriorityDisclosure
            label="世界易系统"
            title="方法论、数据面板和世界易入口"
            description="这些内容只服务深度理解，不默认挡在阅读列表前面。"
          >
            <div className="space-y-5">
              {mingliMapImage ? (
                <VisualAssetFeature asset={mingliMapImage} label="命理易学总览图" />
              ) : null}

              <ContentCardLink
                href="/world-yi"
                page="/knowledge"
                meta={{ surfaceKey: 'knowledge_page', targetSurfaceKey: 'world_yi_page', contentType: 'knowledge', series: 'world-yi', version: 'v1.0.0.1' }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] block p-6 transition hover:-translate-y-0.5"
              >
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  世界易 v1.0.0.1
                </div>
                <div className="mt-4 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                  <div>
                    <h2 className="text-2xl font-black text-[color:var(--ink)]">主入口</h2>
                    <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                      进入世界易总入口
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {['时代认知与版本观', '方法论与现代翻译', '人生六域', '生活应用与海外传播'].map((item) => (
                      <div key={item} className="rounded-[var(--radius)] bg-[color:var(--paper)] p-4 text-sm font-semibold text-[color:var(--ink)]">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </ContentCardLink>

              <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6 md:p-8">
                <div className="grid gap-8 lg:grid-cols-[0.94fr_1.06fr]">
                  <div className="space-y-5">
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                      <Layers3 className="h-3.5 w-3.5" />
                      世界易知识系统层
                    </div>
                    <h2 className="text-2xl font-black text-[color:var(--ink)]">数据面板</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: '当前公开世界易内容', value: `${worldYiStats.publicKnowledgeCount + worldYiStats.publicCaseCount} 篇` },
                        { label: '中文主路径知识', value: `${worldYiStats.mainKnowledgeCount} 篇` },
                        { label: '全球华人知识', value: `${worldYiStats.globalKnowledgeCount} 篇` },
                        { label: '英文知识入口', value: `${worldYiStats.englishKnowledgeCount} 篇` },
                        { label: '案例证据层', value: `${worldYiStats.publicCaseCount} 篇` },
                        { label: '目标内容宇宙', value: `${worldYiRoadmapSummary.targetArticleCount} 篇` },
                      ].map((item) => (
                        <div key={item.label} className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-4 py-3">
                          <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                          <div className="mt-2 text-xl font-bold text-[color:var(--ink)]">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {worldYiKnowledgePowerLinks.map((item) => {
                      const Icon = item.icon;

                      return (
                        <ContentCardLink
                          key={item.href}
                          href={item.href}
                          page="/knowledge"
                          meta={{
                            surfaceKey: 'knowledge_page_world_yi_system',
                            targetSurfaceKey: item.href.replace('/', '').replaceAll('/', '_'),
                            contentType: 'knowledge',
                            series: 'world-yi',
                            version: worldYiRoadmapSummary.version,
                          }}
                          className="rounded-[var(--radius-md)] bg-[color:var(--paper)] p-5 transition hover:-translate-y-0.5"
                        >
                          <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="mt-4 text-xl font-bold text-[color:var(--ink)]">{item.title}</div>
                          <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                            进入路径
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </ContentCardLink>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </PriorityDisclosure>

          {(taiSuiImage || benMingNianImage || fiveElementsImage || visualArticleImage) ? (
            <PriorityDisclosure
              label="图片说明"
              title="传播图和基础结构图"
              description="图片解释不是知识库 P0，默认收起。"
            >
              <div className="space-y-5">
                {(taiSuiImage || benMingNianImage) ? (
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">传播图入口</div>
                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                      {[taiSuiImage, benMingNianImage].filter(Boolean).map((asset) => (
                        <VisualAssetCard key={asset!.id} asset={asset!} />
                      ))}
                    </div>
                  </div>
                ) : null}

                {fiveElementsImage ? (
                  <VisualAssetFeature asset={fiveElementsImage} label="五行基础结构图" reverse />
                ) : null}

                {visualArticleImage ? (
                  <VisualAssetFeature asset={visualArticleImage} label="图片文章说明图" reverse />
                ) : null}
              </div>
            </PriorityDisclosure>
          ) : null}
        </section>

        <PublicEvidencePanel
          page="/knowledge"
          title="把知识层接到工具、案例和环境洞察"
          description="只看原理还不够。知识库应该继续接到具体工具、真实案例和环境洞察，既帮助用户继续判断，也让搜索与问答引擎更容易理解这个站点的完整能力图谱。"
          surfaceKey="knowledge_page_evidence"
          toolItems={toolItems}
          caseItems={caseItems}
          insightItems={insightItems}
        />

        <section className="mt-12">
          <PriorityDisclosure
            label="更多入口"
            title="案例、洞察与订阅"
            description="阅读列表之后再提供补充入口，不抢主阅读任务。"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <ContentCardLink
                href="/knowledge/topics"
                page="/knowledge"
                meta={{ surfaceKey: 'knowledge_page_network', targetSurfaceKey: 'knowledge_topics_page', contentType: 'knowledge' }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">专题</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">专题地图</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  进入专题地图
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>

              <ContentCardLink
                href="/cases"
                page="/knowledge"
                meta={{ surfaceKey: 'knowledge_page_network', targetSurfaceKey: 'cases_page', contentType: 'case' }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">案例</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">案例库</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  查看案例库
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>

              <ContentCardLink
                href="/insights"
                page="/knowledge"
                meta={{ surfaceKey: 'knowledge_page_network', targetSurfaceKey: 'insights_page', contentType: 'insight' }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-6 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">洞察</div>
                <h2 className="mt-3 text-2xl font-bold text-[color:var(--ink)]">洞察中心</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  进入洞察中心
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            </div>

            <div className="mt-6">
              <NewsletterSignup
                source="knowledge_page"
                title="订阅更新"
                description="接收知识文章、专题扩写和方法更新，方便你持续跟进这套判断系统的公开内容。"
              />
            </div>
          </PriorityDisclosure>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
