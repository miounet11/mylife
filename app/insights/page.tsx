import { ArrowRight, Sparkles } from 'lucide-react';
import AnalyticsPageView from '@/components/analytics-page-view';
import ContentCardLink from '@/components/content-card-link';
import ContentQuickAnalyzePanel from '@/components/content-quick-analyze-panel';
import NewsletterSignup from '@/components/newsletter-signup';
import PriorityDisclosure from '@/components/priority-disclosure';
import PublicEvidencePanel from '@/components/public-evidence-panel';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import {
  getCaseStudies,
  getEntityInsights,
  getKnowledgeArticles,
} from '@/lib/content-store';
import { entityTypeLabels, getEntityInsightTypes, type EntityInsightType } from '@/lib/content';
import {
  createCollectionPageSchema,
  createItemListSchema,
  createPublicContentMetadata,
} from '@/lib/public-content-seo';
import { getFeaturedTools } from '@/lib/tools';

export const metadata = createPublicContentMetadata({
  title: '行业与城市洞察 | 人生K线',
  description: '围绕行业、城市、组织节奏等具体场景建立高价值实体内容层，为搜索、传播与转化提供长期资产。',
  path: '/insights',
  type: 'website',
  languages: {
    'zh-CN': '/insights',
    'x-default': '/insights',
  },
});

export const dynamic = 'force-dynamic';

export default function InsightsPage() {
  const insightTypes = getEntityInsightTypes();
  const insights = getEntityInsights();
  const insightSignals = insights.slice(0, 18)
    .flatMap((item) => [item.title, item.name, ...item.tags])
    .filter((signal): signal is string => typeof signal === 'string' && signal.length > 0)
    .map((signal) => signal.toLowerCase());
  const matchesInsightSignal = (text: string) => {
    const lowered = text.toLowerCase();
    return insightSignals.some((signal) => lowered.includes(signal));
  };
  const insightsByType = insightTypes.reduce<Record<EntityInsightType, typeof insights>>((accumulator, type) => {
    accumulator[type] = insights.filter((item) => item.type === type);
    return accumulator;
  }, {} as Record<EntityInsightType, typeof insights>);
  const toolItems = getFeaturedTools(12)
    .filter((tool) => matchesInsightSignal([tool.title, tool.shortTitle, tool.themeLabel, ...tool.hookKeywords].join(' ')))
    .slice(0, 3);
  const knowledgeItems = getKnowledgeArticles()
    .filter((item) => matchesInsightSignal([item.title, item.excerpt, item.category, ...item.tags].join(' ')))
    .slice(0, 2);
  const caseItems = getCaseStudies()
    .filter((item) => matchesInsightSignal([item.title, item.excerpt, item.scenario, ...item.tags].join(' ')))
    .slice(0, 2);
  const schemas = [
    createCollectionPageSchema({
      headline: '行业与城市洞察',
      description: '围绕行业、城市、组织节奏等具体场景建立高价值实体内容层，为搜索、传播与转化提供长期资产。',
      path: '/insights',
      keywords: ['行业洞察', '城市洞察', '组织洞察', '环境节奏'],
    }),
    createItemListSchema(
      '实体洞察内容',
      insights.slice(0, 15).map((item, index) => ({
        name: item.title,
        path: `/insights/${item.type}/${item.slug}`,
        position: index + 1,
      })),
    ),
  ].filter(Boolean);

  return (
    <div className="page-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }} />
      <AnalyticsPageView eventName="insights_page_viewed" page="/insights" meta={{ surfaceKey: 'insights_page', contentType: 'insight' }} />
      <SiteHeader ctaHref="/analyze" ctaLabel="开始分析" />

      <main className="page-frame py-4 pb-16 md:py-6 md:pb-20">
        {/* HERO 区 */}
        <section className="fb-card mb-3 overflow-hidden border-t-2 border-[color:var(--fb-blue)]">
          <div className="bg-[color:var(--fb-blue)] px-4 py-2.5 text-white text-[12px] font-bold uppercase tracking-[0.14em]">
            行业与城市洞察 · 命理/易学门户
          </div>
          <div className="px-4 py-3">
            <h1 className="text-[22px] font-bold text-[color:var(--fb-ink-1)] leading-[1.2]">
              真正能长期做大的站点，要把工具、结果和实体内容连起来。
            </h1>
            <p className="mt-1 text-[13px] leading-[1.4] text-[color:var(--fb-ink-2)] max-w-[640px]">
              这里把行业、城市和组织节奏做成可索引、可内链、可持续扩展的内容页，服务搜索意图，也服务结果页后的继续阅读。
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2 text-[11px]">
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">八字</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">紫微</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">六爻</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">奇门</span>
              <span className="rounded-[2px] border border-[#dddfe2] bg-[#f5f6f7] px-1.5 py-0.5 text-[#1d2129] font-semibold">择日</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <ContentCardLink
                href="/world-yi/insights"
                page="/insights"
                meta={{ surfaceKey: 'insights_page', targetSurfaceKey: 'world_yi_insights_page', contentType: 'insight', series: 'world-yi-insights' }}
                className="inline-flex h-8 items-center gap-1.5 bg-[color:var(--fb-blue)] px-3 text-[12px] font-bold text-white hover:bg-[#365899]"
              >
                进入环境主轴
                <ArrowRight className="h-3.5 w-3.5" />
              </ContentCardLink>
              <ContentCardLink
                href="/analyze"
                page="/insights"
                meta={{ surfaceKey: 'insights_page', targetSurfaceKey: 'analyze_page', contentType: 'insight' }}
                className="inline-flex h-8 items-center gap-1.5 border border-[#bec3c9] bg-[#f5f6f7] px-3 text-[12px] font-bold text-[#1d2129] hover:bg-[#ebedf0]"
              >
                开始分析
              </ContentCardLink>
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-8">
          {insightTypes.map((type) => (
            <TypeSection key={type} type={type} items={insightsByType[type]} />
          ))}
        </section>

        <section className="mt-8">
          <PriorityDisclosure
            label="环境主轴"
            title="世界易环境观"
            description="洞察列表优先，系统主轴默认收起。"
          >
          <ContentCardLink
            href="/world-yi/insights"
            page="/insights"
            meta={{
              surfaceKey: 'insights_page',
              targetSurfaceKey: 'world_yi_insights_page',
              contentType: 'insight',
              series: 'world-yi-insights',
              version: 'v1.0.0.1',
            }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md block rounded-[var(--radius)] p-5 transition hover:-translate-y-0.5"
          >
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
              <Sparkles className="h-3.5 w-3.5" />
              世界易环境观
            </div>
            <div className="mt-4 grid gap-5 lg:grid-cols-[1.02fr_0.98fr]">
              <div>
                <h2 className="text-3xl font-black text-[color:var(--ink)]">环境主轴</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-5 inline-flex items-center gap-2">
                  进入世界易环境洞察
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {['天时', '地利', '人和', '环境会放大代价或优势'].map((item) => (
                  <div key={item} className="rounded-[var(--radius)] bg-[color:var(--paper)] p-4 text-sm font-semibold text-[color:var(--ink)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </ContentCardLink>
          </PriorityDisclosure>
        </section>

        <PublicEvidencePanel
          page="/insights"
          title="把环境洞察接到工具、知识和案例证据"
          description="洞察页不该只是环境描述。它应该继续把用户带到具体工具、知识原理和真实案例，让环境判断能落回个人决策与动作。"
          surfaceKey="insights_page_evidence"
          toolItems={toolItems}
          knowledgeItems={knowledgeItems}
          caseItems={caseItems}
        />

        <section className="mt-8">
          <PriorityDisclosure
            label="更多入口"
            title="知识、案例和环境主轴"
            description="补充入口放到洞察列表之后。"
          >
            <div className="grid gap-3 lg:grid-cols-3">
              <ContentCardLink
                href="/knowledge"
                page="/insights"
                meta={{ surfaceKey: 'insights_page_network', targetSurfaceKey: 'knowledge_page', contentType: 'knowledge' }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius)] p-4 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到原理层</div>
                <h2 className="mt-3 text-xl font-bold text-[color:var(--ink)]">知识库</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-4 inline-flex items-center gap-2">
                  查看知识库
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>

              <ContentCardLink
                href="/cases"
                page="/insights"
                meta={{ surfaceKey: 'insights_page_network', targetSurfaceKey: 'cases_page', contentType: 'case' }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius)] p-4 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到证据层</div>
                <h2 className="mt-3 text-xl font-bold text-[color:var(--ink)]">案例库</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-4 inline-flex items-center gap-2">
                  查看案例库
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>

              <ContentCardLink
                href="/world-yi/insights"
                page="/insights"
                meta={{ surfaceKey: 'insights_page_network', targetSurfaceKey: 'world_yi_insights_page', contentType: 'insight', series: 'world-yi-insights' }}
                className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius)] p-4 transition hover:-translate-y-0.5"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">回到母路径</div>
                <h2 className="mt-3 text-xl font-bold text-[color:var(--ink)]">环境主轴</h2>
                <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-4 inline-flex items-center gap-2">
                  进入环境主轴
                  <ArrowRight className="h-4 w-4" />
                </div>
              </ContentCardLink>
            </div>
          </PriorityDisclosure>
        </section>

        <section className="mt-8">
          <ContentQuickAnalyzePanel
            sourceLabel="洞察页转化"
            sourceKey="insights_page"
            contentMeta={{ contentType: 'insight', surfaceKey: 'insights_page' }}
            title="看完行业或城市节奏，直接测自己的时间窗口"
            description="先确认外部环境，再把出生信息带进个人分析，看看你和当前城市、行业或组织节奏是否匹配。"
          />
        </section>

        <section className="mt-8">
          <PriorityDisclosure
            label="订阅"
            title="订阅行业与城市洞察"
            description="订阅入口默认收起，不抢阅读列表。"
          >
            <NewsletterSignup
              source="insights_page"
              title="订阅行业与城市洞察"
              description="适合持续跟踪城市、行业和组织变化的人，把环境判断保持在最新状态。"
            />
          </PriorityDisclosure>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function TypeSection({ type, items }: { type: EntityInsightType; items: ReturnType<typeof getEntityInsights> }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">{entityTypeLabels[type]}</div>
          <h2 className="mt-2 text-2xl font-black text-[color:var(--ink)]">{entityTypeLabels[type]}内容</h2>
        </div>
        <div className="text-sm text-[color:var(--muted)]">{items.length} 篇</div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <ContentCardLink
            key={item.slug}
            href={`/insights/${item.type}/${item.slug}`}
            page="/insights"
            meta={{
              surfaceKey: 'insights_page',
              contentType: 'insight',
              subtype: item.type,
              slug: item.slug,
              title: item.title,
              name: item.name,
              category: entityTypeLabels[type],
              tags: item.tags,
            }}
            className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] backdrop-blur-md rounded-[var(--radius)] p-4 transition hover:-translate-y-0.5"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.name}</div>
            <h3 className="mt-3 text-xl font-bold leading-snug text-[color:var(--ink)]">{item.title}</h3>
            <div className="text-xs font-bold text-[color:var(--brand-strong)] mt-4 inline-flex items-center gap-2">
              查看洞察
              <ArrowRight className="h-4 w-4" />
            </div>
          </ContentCardLink>
        ))}
      </div>
    </section>
  );
}
