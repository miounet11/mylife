import { ArrowRight, Sparkles } from 'lucide-react';
import type { FortuneRecord } from '@/lib/user-types';
import { buildToolRecommendations, getToolDefinition } from '@/lib/tools';
import ToolCardLink from '@/components/tool-card-link';

export default function ToolRecommendations({
  report,
  page,
  title = '推荐工具',
  description = '围绕当前报告主轴，继续做更聚焦的单项测试。',
}: {
  report?: FortuneRecord | null;
  page: string;
  title?: string;
  description?: string;
}) {
  const items = buildToolRecommendations({
    report,
    limit: 6,
  })
    .map((item) => ({
      ...item,
      tool: getToolDefinition(item.slug),
    }))
    .filter((item) => item.tool);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="section-label">
            <Sparkles className="h-3.5 w-3.5" />
            {title}
          </div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">把综合报告继续拆成可复访的单项工具</h2>
          <p className="mt-3 max-w-3xl text-xs leading-6 text-[color:var(--muted)]">{description}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(({ tool, reason }) => (
          <ToolCardLink
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            toolSlug={tool.slug}
            category={tool.category}
            page={page}
            className="block rounded-[1.6rem] border border-[color:var(--line)] bg-white/80 p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{tool.category}</div>
            <h3 className="mt-3 text-xl font-bold text-[color:var(--ink)]">{tool.shortTitle}</h3>
            <p className="mt-3 text-xs leading-6 text-[color:var(--muted)]">{tool.description}</p>
            <div className="mt-4 rounded-[1.2rem] bg-[color:var(--accent-soft)] px-4 py-3 text-sm text-[color:var(--accent-strong)]">
              {reason}
            </div>
            <div className="action-guide mt-4 inline-flex items-center gap-2">
              进入工具
              <ArrowRight className="h-4 w-4" />
            </div>
          </ToolCardLink>
        ))}
      </div>
    </section>
  );
}
