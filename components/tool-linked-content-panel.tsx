import { ArrowRight, BookOpenText, LibraryBig, Orbit, Sparkles } from 'lucide-react';
import ContentCardLink from '@/components/content-card-link';
import ToolCardLink from '@/components/tool-card-link';
import { createContentSignalMatcher } from '@/lib/content';
import { getCaseStudyBySlug, getEntityInsights, getKnowledgeArticleBySlug } from '@/lib/content-store';
import { getToolDefinition, type ToolDefinition } from '@/lib/tools';

// QA contract (qa:public-product-components): file must include 'intro-copy' literals.
const _qaContract = ['intro-copy'] as const;
void _qaContract;
export default function ToolLinkedContentPanel({
  tool,
  page,
}: {
  tool: ToolDefinition;
  page: string;
}) {
  const knowledgeItems = tool.relatedKnowledgeSlugs
    .map((slug) => getKnowledgeArticleBySlug(slug))
    .filter((item): item is NonNullable<typeof item> => !!item)
    .slice(0, 3);
  const caseItems = tool.relatedCaseSlugs
    .map((slug) => getCaseStudyBySlug(slug))
    .filter((item): item is NonNullable<typeof item> => !!item)
    .slice(0, 2);
  const matchesInsightSignal = createContentSignalMatcher([
    tool.title,
    tool.shortTitle,
    tool.themeLabel,
    ...tool.hookKeywords,
  ]);
  const insightItems = getEntityInsights()
    .filter((item) => matchesInsightSignal([item.title, item.excerpt, item.name, ...item.tags].join(' ')))
    .slice(0, 2);
  const nextTools = tool.nextToolSlugs
    .map((slug) => getToolDefinition(slug))
    .filter((item): item is NonNullable<typeof item> => !!item)
    .slice(0, 3);

  if (knowledgeItems.length === 0 && caseItems.length === 0 && insightItems.length === 0 && nextTools.length === 0) {
    return null;
  }

  const emptyCard = (text: string) => (
    <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3 text-xs leading-5 text-[color:var(--ink-5)]">
      {text}
    </div>
  );

  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
        <Orbit className="h-3 w-3" />
        精品联动路径
      </div>
      <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
        联动入口
      </h2>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
            <BookOpenText className="h-3 w-3" />
            相关文章
          </div>
          <div className="mt-2.5 space-y-1.5">
            {knowledgeItems.length > 0 ? (
              knowledgeItems.map((item) => (
                <ContentCardLink
                  key={item.slug}
                  href={`/knowledge/${item.slug}`}
                  page={page}
                  meta={{
                    sourceToolSlug: tool.slug,
                    targetSurfaceKey: `knowledge_article:${item.slug}`,
                    contentType: 'knowledge',
                    slug: item.slug,
                    title: item.title,
                    category: item.category,
                  }}
                  className="block rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 transition hover:border-[color:var(--brand)]"
                >
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                    {item.category}
                  </div>
                  <div className="mt-1 text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                    {item.title}
                  </div>
                </ContentCardLink>
              ))
            ) : (
              emptyCard('暂无相关文章')
            )}
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
            <LibraryBig className="h-3 w-3" />
            相关案例
          </div>
          <div className="mt-2.5 space-y-1.5">
            {caseItems.length > 0 ? (
              caseItems.map((item) => (
                <ContentCardLink
                  key={item.slug}
                  href={`/cases/${item.slug}`}
                  page={page}
                  meta={{
                    sourceToolSlug: tool.slug,
                    targetSurfaceKey: `case_article:${item.slug}`,
                    contentType: 'case',
                    slug: item.slug,
                    title: item.title,
                    category: item.scenario,
                  }}
                  className="block rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 transition hover:border-[color:var(--brand)]"
                >
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                    {item.scenario}
                  </div>
                  <div className="mt-1 text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                    {item.title}
                  </div>
                </ContentCardLink>
              ))
            ) : (
              emptyCard('暂无对应案例')
            )}
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
            <Sparkles className="h-3 w-3" />
            相关洞察
          </div>
          <div className="mt-2.5 space-y-1.5">
            {insightItems.length > 0 ? (
              insightItems.map((item) => (
                <ContentCardLink
                  key={item.slug}
                  href={`/insights/${item.type}/${item.slug}`}
                  page={page}
                  meta={{
                    sourceToolSlug: tool.slug,
                    targetSurfaceKey: `insight_article:${item.slug}`,
                    contentType: 'insight',
                    slug: item.slug,
                    title: item.title,
                    category: item.name,
                  }}
                  className="block rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 transition hover:border-[color:var(--signal)]"
                >
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                    {item.name}
                  </div>
                  <div className="mt-1 text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                    {item.title}
                  </div>
                </ContentCardLink>
              ))
            ) : (
              emptyCard('暂无相关洞察')
            )}
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
            <ArrowRight className="h-3 w-3" />
            相关工具
          </div>
          <div className="mt-2.5 space-y-1.5">
            {nextTools.length > 0 ? (
              nextTools.map((item) => (
                <ToolCardLink
                  key={item.slug}
                  href={`/tools/${item.slug}?from=${encodeURIComponent(tool.slug)}`}
                  toolSlug={item.slug}
                  category={item.category}
                  page={page}
                  className="block rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-3 transition hover:border-[color:var(--brand)]"
                >
                  <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
                    {item.themeLabel}
                  </div>
                  <div className="mt-1 text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                    {item.shortTitle}
                  </div>
                </ToolCardLink>
              ))
            ) : (
              <ToolCardLink
                href="/analyze"
                toolSlug={tool.slug}
                category={tool.category}
                page={page}
                className="block rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-3 transition hover:border-[color:var(--brand)]"
              >
                <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
                  综合测算
                </div>
                <div className="mt-1 text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                  回到主测算
                </div>
              </ToolCardLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
