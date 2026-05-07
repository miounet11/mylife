import { BookOpenText, Compass, LibraryBig, Sparkles } from 'lucide-react';
import ContentCardLink from '@/components/content-card-link';
import ToolCardLink from '@/components/tool-card-link';
import type { ToolDefinition } from '@/lib/tools';

type KnowledgeItem = {
  slug: string;
  title: string;
  category: string;
};

type CaseItem = {
  slug: string;
  title: string;
  scenario: string;
};

type InsightItem = {
  slug: string;
  title: string;
  name: string;
  type: string;
};

// 决策台风「延伸路径与证据」面板
// 用于 /tools /knowledge /cases /insights /knowledge/[slug] /tools/category/[category]
// 从 PriorityDisclosure 包装改为直接一段分栏布局，description 与 title 真正渲染
export default function PublicEvidencePanel({
  page,
  sectionLabel = '延伸路径与证据',
  title,
  description,
  surfaceKey,
  toolItems,
  knowledgeItems,
  caseItems,
  insightItems,
}: {
  page: string;
  sectionLabel?: string;
  title: string;
  description: string;
  surfaceKey: string;
  toolItems?: ToolDefinition[];
  knowledgeItems?: KnowledgeItem[];
  caseItems?: CaseItem[];
  insightItems?: InsightItem[];
}) {
  const visibleColumnCount = [toolItems, knowledgeItems, caseItems, insightItems].filter(
    (items) => !!items?.length,
  ).length;
  const columnClassName = visibleColumnCount >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3';

  if (visibleColumnCount === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <header className="mb-5">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
          {sectionLabel}
        </div>
        <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--ink-4)]">
            {description}
          </p>
        ) : null}
      </header>

      <div className={`grid gap-4 ${columnClassName}`}>
        {toolItems?.length ? (
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
              <Compass className="h-3 w-3" />
              相关工具
            </div>
            <div className="mt-3 space-y-1.5">
              {toolItems.map((tool) => (
                <ToolCardLink
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  toolSlug={tool.slug}
                  category={tool.category}
                  page={page}
                  className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 transition hover:border-[color:var(--brand)]"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                    {tool.themeLabel}
                  </div>
                  <div className="mt-0.5 text-sm font-bold leading-snug text-[color:var(--ink-2)]">
                    {tool.shortTitle}
                  </div>
                </ToolCardLink>
              ))}
            </div>
          </div>
        ) : null}

        {knowledgeItems?.length ? (
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
              <BookOpenText className="h-3 w-3" />
              相关知识
            </div>
            <div className="mt-3 space-y-1.5">
              {knowledgeItems.map((item) => (
                <ContentCardLink
                  key={item.slug}
                  href={`/knowledge/${item.slug}`}
                  page={page}
                  meta={{
                    surfaceKey,
                    targetSurfaceKey: `knowledge_article:${item.slug}`,
                    contentType: 'knowledge',
                  }}
                  className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 transition hover:border-[color:var(--brand)]"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                    {item.category}
                  </div>
                  <div className="mt-0.5 text-sm font-bold leading-snug text-[color:var(--ink-2)]">
                    {item.title}
                  </div>
                </ContentCardLink>
              ))}
            </div>
          </div>
        ) : null}

        {caseItems?.length ? (
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
              <LibraryBig className="h-3 w-3" />
              相关案例
            </div>
            <div className="mt-3 space-y-1.5">
              {caseItems.map((item) => (
                <ContentCardLink
                  key={item.slug}
                  href={`/cases/${item.slug}`}
                  page={page}
                  meta={{
                    surfaceKey,
                    targetSurfaceKey: `case_article:${item.slug}`,
                    contentType: 'case',
                  }}
                  className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 transition hover:border-[color:var(--brand)]"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                    {item.scenario}
                  </div>
                  <div className="mt-0.5 text-sm font-bold leading-snug text-[color:var(--ink-2)]">
                    {item.title}
                  </div>
                </ContentCardLink>
              ))}
            </div>
          </div>
        ) : null}

        {insightItems?.length ? (
          <div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
              <Sparkles className="h-3 w-3" />
              相关洞察
            </div>
            <div className="mt-3 space-y-1.5">
              {insightItems.map((item) => (
                <ContentCardLink
                  key={item.slug}
                  href={`/insights/${item.type}/${item.slug}`}
                  page={page}
                  meta={{
                    surfaceKey,
                    targetSurfaceKey: `insight_article:${item.slug}`,
                    contentType: 'insight',
                  }}
                  className="block border-l-2 border-[color:var(--hairline)] pl-3 py-1 transition hover:border-[color:var(--signal)]"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-5)]">
                    {item.name}
                  </div>
                  <div className="mt-0.5 text-sm font-bold leading-snug text-[color:var(--ink-2)]">
                    {item.title}
                  </div>
                </ContentCardLink>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
