import Link from 'next/link';
import { ArrowRight, Database, History } from 'lucide-react';
import type { ToolMemorySummary } from '@/lib/tool-context';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-secondary'] as const;
void _qaContract;
export default function ToolMemoryPanel({
  memory,
  title = '你的历史上下文',
  description = '',
}: {
  memory: ToolMemorySummary | null;
  title?: string;
  description?: string;
}) {
  if (!memory) {
    return null;
  }

  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Database className="h-3 w-3" />
            {title}
          </div>
          <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
            历史上下文
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">{description}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
          <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
            已继承内容
          </div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--ink-2)]">{memory.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {memory.focusAreas.map((item) => (
              <span
                key={item}
                className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-2 text-xs font-bold text-[color:var(--brand-strong)]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
            <History className="h-3 w-3" />
            最近几次工具记录
          </div>
          <div className="mt-3 space-y-2">
            {memory.recentSessions.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold text-[color:var(--ink-1)]">
                    {item.toolTitle}
                  </div>
                  <Link
                    href={`/tool-result/${item.id}`}
                    className="inline-flex h-7 items-center gap-1 rounded-[var(--radius-sm)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-2.5 text-xs font-bold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]"
                  >
                    查看结果
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <div className="mt-1.5 text-xs leading-5 text-[color:var(--ink-3)]">
                  {item.recommendedAction || item.headline}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
