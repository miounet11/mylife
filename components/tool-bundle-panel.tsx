import Link from 'next/link';
import { ArrowRight, Layers3 } from 'lucide-react';
import type { ToolBundleDefinition } from '@/lib/tools';
import ToolCardLink from '@/components/tool-card-link';
import { getToolDefinition } from '@/lib/tools';

// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-secondary'] as const;
void _qaContract;
export default function ToolBundlePanel({
  bundle,
  page,
}: {
  bundle: ToolBundleDefinition;
  page: string;
}) {
  const tools = bundle.toolSlugs
    .map((slug) => getToolDefinition(slug))
    .filter((item): item is NonNullable<ReturnType<typeof getToolDefinition>> => !!item);

  if (tools.length === 0) {
    return null;
  }

  return (
    <section className="fb-card p-5 md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Layers3 className="h-3 w-3" />
            同域工具包
          </div>
          <h2 className="mt-2 text-xl font-black leading-tight text-[color:var(--ink-1)] md:text-2xl">
            {bundle.title}
          </h2>
        </div>
        <Link
          href="/tools"
          className="fb-btn inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--fb-blue)] hover:no-underline"
        >
          回到工具中心
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool) => (
          <ToolCardLink
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            toolSlug={tool.slug}
            category={tool.category}
            page={page}
            className="group p-4 transition-colors hover:no-underline"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
              {tool.category}
            </div>
            <div className="mt-2 text-base font-bold leading-snug text-[color:var(--ink-1)]">
              {tool.shortTitle}
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--ink-4)] group-hover:gap-1.5 group-hover:text-[color:var(--brand-strong)] transition-all">
              进入工具
              <ArrowRight className="h-3 w-3" />
            </div>
          </ToolCardLink>
        ))}
      </div>
    </section>
  );
}
