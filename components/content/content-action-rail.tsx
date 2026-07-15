import Link from 'next/link';
import { ArrowRight, BookOpen, Layers3, Wrench } from 'lucide-react';
import type { ContentCrosslinks, CrosslinkItem } from '@/lib/content-crosslinks';

function LinkCard({ item, tone = 'default' }: { item: CrosslinkItem; tone?: 'default' | 'brand' }) {
  return (
    <Link
      href={item.href}
      className={`group block rounded-[var(--radius)] border p-3 transition hover:no-underline ${
        tone === 'brand'
          ? 'border-[color:var(--brand)]/25 bg-[color:var(--brand-soft)]/40 hover:border-[color:var(--brand)]'
          : 'border-[color:var(--hairline)] bg-white hover:border-[color:var(--brand)]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.icon ? <span className="text-base leading-none">{item.icon}</span> : null}
            <h3 className="text-[13px] font-bold text-[color:var(--ink-1)]">{item.title}</h3>
            {item.badge ? (
              <span className="rounded-full border border-[color:var(--hairline)] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--ink-4)]">
                {item.badge}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[12px] leading-[1.45] text-[color:var(--ink-3)]">{item.description}</p>
        </div>
        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--brand)] transition group-hover:translate-x-0.5" />
      </div>
      <span className="mt-2 inline-block text-[12px] font-bold text-[color:var(--brand)]">
        {item.cta || '进入'} →
      </span>
    </Link>
  );
}

/** SEO / content pages: connect articles to dimensions, tools, and full report. */
export default function ContentActionRail({
  crosslinks,
  title = '读完之后可以怎么做',
  description = '把内容接到可执行的场景研判与工具，而不是只停留在阅读。',
}: {
  crosslinks: ContentCrosslinks;
  title?: string;
  description?: string;
}) {
  return (
    <section className="fb-card space-y-4 border-t-2 border-[color:var(--brand)] p-4 md:p-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="lk-section-eyebrow">功能联动</div>
          <h2 className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">{title}</h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-[1.5] text-[color:var(--ink-3)]">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={crosslinks.analyzeHref} className="fb-btn fb-btn-primary h-8 px-3 text-[12px] hover:no-underline">
            {crosslinks.primaryLabel}
          </Link>
          <Link href="/dimensions" className="fb-btn h-8 px-3 text-[12px] hover:no-underline">
            十维度中心
          </Link>
        </div>
      </div>

      {crosslinks.dimensions.length ? (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-[color:var(--ink-2)]">
            <Layers3 className="h-3.5 w-3.5 text-[color:var(--brand)]" />
            相关十维度研判
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {crosslinks.dimensions.map((item) => (
              <LinkCard key={item.href} item={item} tone="brand" />
            ))}
          </div>
        </div>
      ) : null}

      {crosslinks.tools.length ? (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-[color:var(--ink-2)]">
            <Wrench className="h-3.5 w-3.5 text-[color:var(--brand)]" />
            相关工具
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {crosslinks.tools.map((item) => (
              <LinkCard key={item.href} item={item} />
            ))}
          </div>
        </div>
      ) : null}

      {crosslinks.content.length ? (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-[color:var(--ink-2)]">
            <BookOpen className="h-3.5 w-3.5 text-[color:var(--brand)]" />
            继续阅读
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {crosslinks.content.map((item) => (
              <LinkCard key={item.href} item={item} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
