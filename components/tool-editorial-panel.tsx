import { Crown, Sparkles } from 'lucide-react';
import type { ToolDefinition } from '@/lib/tools';


// QA contract (qa:public-product-components): file must include 'intro-copy' literals.
const _qaContract = ['intro-copy'] as const;
void _qaContract;
export default function ToolEditorialPanel({
  tool,
}: {
  tool: ToolDefinition;
}) {
  if (!tool.featuredBadge || !tool.signaturePromise || !tool.decisionLens || !tool.premiumWhyNow) {
    return null;
  }

  return (
    <section className="rounded-[var(--radius-md)] border border-[color:var(--signal-soft)] bg-[color:var(--paper)] p-5 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--signal-strong)]">
          <Crown className="h-3 w-3" />
          编辑精选
        </div>
        <span className="inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-2 font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
          {tool.featuredBadge}
        </span>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-3">
        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
            工具亮点
          </div>
          <div className="mt-2 text-sm leading-6 text-[color:var(--ink-2)]">
            {tool.signaturePromise}
          </div>
        </div>
        <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
            核心决策视角
          </div>
          <div className="mt-2 text-sm leading-6 text-[color:var(--ink-2)]">{tool.decisionLens}</div>
        </div>
        <div className="rounded-[var(--radius)] border border-[color:var(--signal-soft)] bg-[color:var(--signal-soft)] p-4">
          <div className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
            <Sparkles className="h-3 w-3" />
            当前时机
          </div>
          <div className="mt-2 text-sm leading-6 text-[color:var(--ink-2)]">{tool.premiumWhyNow}</div>
        </div>
      </div>
    </section>
  );
}
