import { ArrowRight, BookOpenText, LibraryBig, Orbit, Sparkles } from 'lucide-react';
import ContentCardLink from '@/components/content-card-link';
import ToolCardLink from '@/components/tool-card-link';
import { createContentSignalMatcher } from '@/lib/content';
import { getCaseStudyBySlug, getEntityInsights, getKnowledgeArticleBySlug } from '@/lib/content-store';
import { getToolDefinition, type ToolDefinition } from '@/lib/tools';

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

  return (
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="section-label">
        <Orbit className="h-3.5 w-3.5" />
        精品联动路径
      </div>
      <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">联动入口</h2>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-white/82 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <BookOpenText className="h-4 w-4" />
            相关文章
          </div>
          <div className="mt-4 grid gap-3">
            {knowledgeItems.length > 0 ? knowledgeItems.map((item) => (
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
                className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.category}</div>
                <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
              </ContentCardLink>
            )) : (
              <div className="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-[color:var(--ink)]">
                暂无相关文章
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-white/82 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <LibraryBig className="h-4 w-4" />
            相关案例
          </div>
          <div className="mt-4 grid gap-3">
            {caseItems.length > 0 ? caseItems.map((item) => (
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
                className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.scenario}</div>
                <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
              </ContentCardLink>
            )) : (
              <div className="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-[color:var(--ink)]">
                暂无对应案例
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-white/82 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <Sparkles className="h-4 w-4" />
            相关洞察
          </div>
          <div className="mt-4 grid gap-3">
            {insightItems.length > 0 ? insightItems.map((item) => (
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
                className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.name}</div>
                <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
              </ContentCardLink>
            )) : (
              <div className="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-[color:var(--ink)]">
                暂无相关洞察
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-white/82 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <ArrowRight className="h-4 w-4" />
            相关工具
          </div>
          <div className="mt-4 grid gap-3">
            {nextTools.length > 0 ? nextTools.map((item) => (
              <ToolCardLink
                key={item.slug}
                href={`/tools/${item.slug}?from=${encodeURIComponent(tool.slug)}`}
                toolSlug={item.slug}
                category={item.category}
                page={page}
                className="block rounded-[1.25rem] bg-[color:var(--accent-soft)]/70 p-4 transition hover:bg-[color:var(--accent-soft)]"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.themeLabel}</div>
                <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{item.shortTitle}</div>
              </ToolCardLink>
            )) : (
              <ToolCardLink
                href="/analyze"
                toolSlug={tool.slug}
                category={tool.category}
                page={page}
                className="block rounded-[1.25rem] bg-[color:var(--accent-soft)]/70 p-4 transition hover:bg-[color:var(--accent-soft)]"
              >
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">综合测算</div>
                <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">回到主测算</div>
              </ToolCardLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
