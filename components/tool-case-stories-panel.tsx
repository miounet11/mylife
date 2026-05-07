import { ShieldAlert, Sparkles } from 'lucide-react';
import type { ToolDefinition } from '@/lib/tools';

export default function ToolCaseStoriesPanel({
  tool,
  title = '案例',
  description: _description = '',
}: {
  tool: ToolDefinition;
  title?: string;
  description?: string;
}) {
  if (!tool.caseStories.length) {
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
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">工具案例</h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        {tool.caseStories.map((story) => (
          <article key={story.title} className="rounded-[1.6rem] border border-[color:var(--line)] bg-white/82 p-5">
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{story.persona}</div>
            <h3 className="mt-3 text-xl font-bold text-[color:var(--ink)]">{story.title}</h3>
            <div className="mt-4 space-y-3 text-sm text-[color:var(--ink)]">
              <p>{story.scenario}</p>
              <p>{story.action}</p>
              <p>{story.outcome}</p>
            </div>
            <div className="mt-4 rounded-[1.2rem] bg-[color:var(--accent-soft)] px-4 py-3 text-sm text-[color:var(--accent-strong)]">
              {story.payoff}
            </div>
          </article>
        ))}
      </div>

      {tool.category === 'health' ? (
        <div className="mt-5 flex items-start gap-3 rounded-[1.4rem] border border-amber-200 bg-amber-50/90 p-4 text-xs leading-6 text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          仅作辅助参考
        </div>
      ) : null}
    </section>
  );
}
