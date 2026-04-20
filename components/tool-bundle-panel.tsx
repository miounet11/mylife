import Link from 'next/link';
import { ArrowRight, Layers3 } from 'lucide-react';
import type { ToolBundleDefinition } from '@/lib/tools';
import ToolCardLink from '@/components/tool-card-link';
import { getToolDefinition } from '@/lib/tools';

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
    <section className="glass-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="section-label">
            <Layers3 className="h-3.5 w-3.5" />
            同域工具包
          </div>
          <h2 className="mt-4 text-3xl font-black text-[color:var(--ink)] md:text-4xl">{bundle.title}</h2>
          <div className="intro-copy mt-4 rounded-[1.25rem] bg-[color:var(--accent-soft)] px-4 py-3 text-sm text-[color:var(--accent-strong)]">
            {bundle.valueHeadline}
          </div>
        </div>
        <Link href="/tools" className="action-secondary">
          回到工具中心
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool) => (
          <ToolCardLink
            key={tool.slug}
            href={`/tools/${tool.slug}`}
            toolSlug={tool.slug}
            category={tool.category}
            page={page}
            className="block rounded-[1.5rem] border border-[color:var(--line)] bg-white/82 p-4 transition hover:-translate-y-0.5 hover:border-[color:var(--accent)]"
          >
            <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{tool.category}</div>
            <div className="mt-3 text-lg font-bold text-[color:var(--ink)]">{tool.shortTitle}</div>
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
