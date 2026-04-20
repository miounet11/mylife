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
  const visibleColumnCount = [toolItems, knowledgeItems, caseItems, insightItems].filter((items) => !!items).length;
  const columnClassName = visibleColumnCount >= 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3';

  return (
    <section className="mt-10">
      <div className="glass-panel rounded-[2rem] p-6 md:p-8">
        <div className="section-label">
          <Sparkles className="h-3.5 w-3.5" />
          {sectionLabel}
        </div>
        <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">{title}</h2>
        <div className="intro-copy mt-3 max-w-3xl">{description}</div>

        <div className={`mt-6 grid gap-6 ${columnClassName}`}>
          {toolItems ? (
            <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-white/82 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <Compass className="h-4 w-4" />
                相关工具
              </div>
              <div className="mt-4 grid gap-3">
                {toolItems.length > 0 ? toolItems.map((tool) => (
                  <ToolCardLink
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    toolSlug={tool.slug}
                    category={tool.category}
                    page={page}
                    className="block rounded-[1.25rem] bg-[color:var(--accent-soft)]/70 p-4 transition hover:bg-[color:var(--accent-soft)]"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{tool.themeLabel}</div>
                    <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{tool.shortTitle}</div>
                  </ToolCardLink>
                )) : (
                  <div className="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-[color:var(--ink)]">暂无对应工具</div>
                )}
              </div>
            </div>
          ) : null}

          {knowledgeItems ? (
            <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-white/82 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
                <BookOpenText className="h-4 w-4" />
                相关知识
              </div>
              <div className="mt-4 grid gap-3">
                {knowledgeItems.length > 0 ? knowledgeItems.map((item) => (
                  <ContentCardLink
                    key={item.slug}
                    href={`/knowledge/${item.slug}`}
                    page={page}
                    meta={{ surfaceKey, targetSurfaceKey: `knowledge_article:${item.slug}`, contentType: 'knowledge' }}
                    className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.category}</div>
                    <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                  </ContentCardLink>
                )) : (
                  <div className="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-[color:var(--ink)]">暂无对应知识内容</div>
                )}
              </div>
            </div>
          ) : null}

          {caseItems ? (
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
                    meta={{ surfaceKey, targetSurfaceKey: `case_article:${item.slug}`, contentType: 'case' }}
                    className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.scenario}</div>
                    <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                  </ContentCardLink>
                )) : (
                  <div className="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-[color:var(--ink)]">暂无对应案例</div>
                )}
              </div>
            </div>
          ) : null}

          {insightItems ? (
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
                    meta={{ surfaceKey, targetSurfaceKey: `insight_article:${item.slug}`, contentType: 'insight' }}
                    className="block rounded-[1.25rem] bg-slate-50 p-4 transition hover:bg-white"
                  >
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.name}</div>
                    <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                  </ContentCardLink>
                )) : (
                  <div className="rounded-[1.25rem] bg-slate-50 p-4 text-sm text-[color:var(--ink)]">暂无对应洞察</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
