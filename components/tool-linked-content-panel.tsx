import { ArrowRight, BookOpenText, LibraryBig, Orbit } from 'lucide-react';
import ContentCardLink from '@/components/content-card-link';
import ToolCardLink from '@/components/tool-card-link';
import { getCaseStudyBySlug, getKnowledgeArticleBySlug } from '@/lib/content-store';
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
  const nextTools = tool.nextToolSlugs
    .map((slug) => getToolDefinition(slug))
    .filter((item): item is NonNullable<typeof item> => !!item)
    .slice(0, 3);

  if (knowledgeItems.length === 0 && caseItems.length === 0 && nextTools.length === 0) {
    return null;
  }

  return (
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="section-label">
        <Orbit className="h-3.5 w-3.5" />
        精品联动路径
      </div>
      <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">别让这次测算停在当前页</h2>
      <p className="mt-3 max-w-3xl text-xs leading-6 text-[color:var(--muted)]">
        真正的高质量工具，不是做完一次就结束，而是继续把你带到原理、案例和下一个判断，逐步把问题拆干净。
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-white/82 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <BookOpenText className="h-4 w-4" />
            先补原理
          </div>
          <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
            先理解这个主题的判断逻辑，用户更容易信任结果，也更愿意继续深测。
          </p>
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
                <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.excerpt}</div>
              </ContentCardLink>
            )) : (
              <div className="rounded-[1.25rem] bg-slate-50 p-4 text-xs leading-6 text-[color:var(--muted)]">
                这个工具暂时还缺相关文章，后续会继续补齐方法论承接。
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-white/82 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <LibraryBig className="h-4 w-4" />
            再看案例
          </div>
          <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
            看别人怎么把这个问题落到现实动作，用户会更容易进入“这也和我有关”的状态。
          </p>
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
                <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.excerpt}</div>
              </ContentCardLink>
            )) : (
              <div className="rounded-[1.25rem] bg-slate-50 p-4 text-xs leading-6 text-[color:var(--muted)]">
                这个工具暂时还缺对应案例，后续会继续补齐真实故事承接。
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-[color:var(--line)] bg-white/82 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
            <ArrowRight className="h-4 w-4" />
            然后继续测
          </div>
          <p className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
            先把当前问题做窄，再补窗口、风险和动作，连续测算比一次性判断更有价值。
          </p>
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
                <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.freeValueLine}</div>
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
                <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">回到主测算，把当前结果带进更完整判断</div>
                <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">当单项问题已经有方向，下一步应回到综合结构确认阶段与环境。</div>
              </ToolCardLink>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
