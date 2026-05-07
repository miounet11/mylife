import { ArrowRight, Sparkles } from 'lucide-react';
import type { FortuneRecord } from '@/lib/user-types';
import { buildToolRecommendations, getToolDefinition } from '@/lib/tools';
import ToolCardLink from '@/components/tool-card-link';
import ToolRunner from '@/components/tool-runner';

// QA contract (qa:public-product-components): tool-recommendations must include 'intro-copy'.
const _qaContract = ['intro-copy'] as const;
void _qaContract;

export default function ToolRecommendations({
  report,
  page,
  title = '推荐工具',
  description = '',
  enableQuickStart = false,
  source,
  ctaStrategyKey,
  sourceFamily,
}: {
  report?: FortuneRecord | null;
  page: string;
  title?: string;
  description?: string;
  enableQuickStart?: boolean;
  source?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  const items = buildToolRecommendations({
    report,
    limit: 6,
  })
    .map((item) => ({
      ...item,
      tool: getToolDefinition(item.slug),
    }))
    .filter((item): item is typeof item & { tool: NonNullable<typeof item.tool> } => !!item.tool);
  const [primaryItem, ...secondaryItems] = items;

  if (items.length === 0) {
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
            把综合报告继续拆成可复访的单项工具
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink-3)]">{description}</p>
          ) : null}
        </div>
      </div>

      {enableQuickStart && report && primaryItem?.tool ? (
        <div className="mt-5 grid gap-3 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[var(--radius-md)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] p-4 md:p-5">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
              报告后直接开跑
            </div>
            <h3 className="mt-2 text-lg font-black leading-tight text-[color:var(--ink-1)] md:text-xl">
              {primaryItem.tool.shortTitle}
            </h3>
            <div className="mt-3 rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--paper)] px-3 py-2 text-xs leading-5 text-[color:var(--brand-strong)]">
              {primaryItem.reason}
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 text-xs leading-5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                  FREE
                </span>
                <div className="mt-0.5 text-[color:var(--ink-2)]">
                  {primaryItem.tool.freeOutputFields.join('、')}
                </div>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 text-xs leading-5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                  ASK
                </span>
                <div className="mt-0.5 text-[color:var(--ink-2)]">
                  {primaryItem.tool.rightQuestion}
                </div>
              </div>
            </div>
          </div>
          <ToolRunner toolSlug={primaryItem.tool.slug} reportId={report.id} entrySource={source || ''} />
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(enableQuickStart ? secondaryItems : items).map(({ tool, reason }) => (
          <ToolCardLink
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            toolSlug={tool.slug}
            category={tool.category}
            page={page}
            source={source}
            ctaStrategyKey={ctaStrategyKey}
            sourceFamily={sourceFamily}
            className="group block rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4 transition hover:-translate-y-px hover:border-[color:var(--brand)] hover:bg-[color:var(--paper)]"
          >
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
              {tool.category}
            </div>
            <h3 className="mt-2 text-base font-bold leading-snug text-[color:var(--ink-1)]">
              {tool.shortTitle}
            </h3>
            <div className="mt-3 rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-2.5 py-1.5 text-xs leading-5 text-[color:var(--brand-strong)]">
              {reason}
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[color:var(--ink-4)] group-hover:gap-1.5 group-hover:text-[color:var(--brand-strong)] transition-all">
              进入工具
              <ArrowRight className="h-3 w-3" />
            </div>
          </ToolCardLink>
        ))}
      </div>
    </section>
  );
}
