import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowRight, BookOpen, FileBarChart2, FlaskConical } from 'lucide-react';
import PriorityDisclosure from '@/components/priority-disclosure';
import type { SurfaceJourney } from '@/lib/surface-journeys';

export default function SurfaceJourneyPanel({
  journey,
  title = '协同路径',
  description: _description = '',
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
    <PriorityDisclosure label="协同路径" title={title} defaultOpen={defaultOpen}>
      <div>
        {badge ? (
          <div className="mt-3 inline-flex rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
            {badge}
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-4">
        <JourneyColumn
          icon={<FileBarChart2 className="h-4 w-4" />}
          heading="综合测算"
          items={[journey.reportCard]}
        />
        <JourneyColumn
          icon={<FlaskConical className="h-4 w-4" />}
          heading="相关工具"
          items={journey.toolCards}
        />
        <JourneyColumn
          icon={<BookOpen className="h-4 w-4" />}
          heading="相关文章"
          items={journey.knowledgeCards}
        />
        <JourneyColumn
          icon={<ArrowRight className="h-4 w-4" />}
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
    <div className="rounded-[1.25rem] border border-[color:var(--line)] bg-white/72 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ink)]">
        {icon}
        {heading}
      </div>
      <div className="mt-3 grid gap-2.5">
        {items.length > 0 ? items.slice(0, 2).map((item) => (
          <Link key={`${heading}-${item.href}`} href={item.href} className="interactive-card rounded-[1rem] px-3.5 py-3">
            <div className="text-[10px] tracking-[0.16em] text-[color:var(--muted)]">{item.eyebrow}</div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm font-semibold text-[color:var(--ink)]">
              <span>{item.title}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[color:var(--muted)]" />
            </div>
            <div className="mt-2 text-[10px] font-semibold text-[color:var(--accent-strong)]">点击进入</div>
          </Link>
        )) : (
          <div className="static-card rounded-[1rem] px-3.5 py-3 text-sm text-[color:var(--muted)]">
            暂无更多关联内容。
          </div>
        )}
      </div>
    </div>
  );
}
