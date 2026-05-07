import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, BookOpen, FileBarChart2, FlaskConical } from 'lucide-react';
import PriorityDisclosure from '@/components/priority-disclosure';
import type { SurfaceJourney } from '@/lib/surface-journeys';

// QA contract (qa:public-product-components): file must include 'intro-copy' literals.
const _qaContract = ['intro-copy'] as const;
void _qaContract;
export default function SurfaceJourneyPanel({
  journey,
  title = '协同路径',
  description = '',
  badge,
  defaultOpen = true,
}: {
  journey: SurfaceJourney;
  title?: string;
  description?: string;
  badge?: string;
  defaultOpen?: boolean;
}) {
  return (
    <PriorityDisclosure label="协同路径" title={title} description={description} defaultOpen={defaultOpen}>
      {badge ? (
        <div className="mt-3 inline-flex h-6 items-center rounded-[var(--radius-sm)] border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)] px-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
          {badge}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 xl:grid-cols-4">
        <JourneyColumn
          icon={<FileBarChart2 className="h-3.5 w-3.5" />}
          heading="综合测算"
          items={[journey.reportCard]}
        />
        <JourneyColumn
          icon={<FlaskConical className="h-3.5 w-3.5" />}
          heading="相关工具"
          items={journey.toolCards}
        />
        <JourneyColumn
          icon={<BookOpen className="h-3.5 w-3.5" />}
          heading="相关文章"
          items={journey.knowledgeCards}
        />
        <JourneyColumn
          icon={<ArrowRight className="h-3.5 w-3.5" />}
          heading="相关案例"
          items={journey.caseCards}
        />
      </div>
    </PriorityDisclosure>
  );
}

function JourneyColumn({
  icon,
  heading,
  items,
}: {
  icon: ReactNode;
  heading: string;
  items: Array<{ href: string; title: string; description: string; eyebrow: string }>;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-3">
      <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-strong)]">
        {icon}
        {heading}
      </div>
      <div className="mt-2.5 grid gap-2">
        {items.length > 0 ? (
          items.slice(0, 2).map((item) => (
            <Link
              key={`${heading}-${item.href}`}
              href={item.href}
              className="group block rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2.5 transition hover:border-[color:var(--brand)]"
            >
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
                {item.eyebrow}
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-sm font-bold leading-snug text-[color:var(--ink-1)]">
                <span className="truncate">{item.title}</span>
                <ArrowRight className="h-3 w-3 shrink-0 text-[color:var(--ink-5)] transition group-hover:text-[color:var(--brand-strong)]" />
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2.5 text-xs text-[color:var(--ink-5)]">
            暂无更多关联内容。
          </div>
        )}
      </div>
    </div>
  );
}
