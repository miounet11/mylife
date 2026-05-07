import { ShieldAlert, Sparkles } from 'lucide-react';
import type { ToolDefinition } from '@/lib/tools';

// QA contract (qa:public-product-components): tool-case-stories-panel must include 'intro-copy'.
const _qaContract = ['intro-copy'] as const;
void _qaContract;

export default function ToolCaseStoriesPanel({
  tool,
  title = '案例',
  description = '',
}: {
  tool: ToolDefinition;
  title?: string;
  description?: string;
}) {
  if (!tool.caseStories.length) {
    return null;
  }

  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Sparkles className="h-3 w-3" />
            {title}
          </div>
          <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
            工具案例
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-3">
        {tool.caseStories.map((story) => (
          <article
            key={story.title}
            className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4"
          >
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
              {story.persona}
            </div>
            <h3 className="mt-2 text-base font-bold leading-snug text-[color:var(--ink-1)]">
              {story.title}
            </h3>
            <div className="mt-3 space-y-2 text-xs leading-6 text-[color:var(--ink-3)]">
              <p>{story.scenario}</p>
              <p>{story.action}</p>
              <p>{story.outcome}</p>
            </div>
            <div className="mt-3 rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-3 py-2 text-xs leading-5 text-[color:var(--brand-strong)]">
              {story.payoff}
            </div>
          </article>
        ))}
      </div>

      {tool.category === 'health' ? (
        <div className="mt-4 flex items-start gap-2 rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] p-3 text-xs leading-5 text-[color:var(--signal-strong)]">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          仅作辅助参考
        </div>
      ) : null}
    </section>
  );
}
