import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { resolveReportIllustrations } from '@/lib/page-illustrations/resolve';

type Props = {
  /** Cite keys e.g. cover, dayun, yongshen, decision-loop, boundary, validation */
  keys?: string[];
  /** Free-text section name → mapped to keys via resolver */
  section?: string;
  title?: string;
  limit?: number;
  className?: string;
};

/**
 * Educational figure injected into report chapters by cite key.
 * Only renders when a ready static asset exists (no empty boxes).
 * Never invents 用神 labels beyond generic educational diagrams.
 */
export function ReportIllustrationCite({
  keys,
  section,
  title = '图解',
  limit = 1,
  className = '',
}: Props) {
  const figures = resolveReportIllustrations({ keys, section, limit });
  const fig = figures[0];
  if (!fig?.src) return null;

  return (
    <figure
      className={`overflow-hidden rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] ${className}`}
      data-report-illust={fig.id}
    >
      <div className="relative aspect-[16/9] w-full">
        <Image
          src={fig.src}
          alt={fig.alt || fig.title}
          fill
          sizes="(min-width: 768px) 720px, 100vw"
          className="object-cover"
          loading="lazy"
        />
      </div>
      <figcaption className="px-3 py-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[color:var(--ink-5)]">
          <ImageIcon className="h-3 w-3" />
          {title}
        </div>
        <div className="mt-0.5 text-[13px] font-semibold text-[color:var(--ink-1)]">{fig.title}</div>
        {fig.caption ? (
          <p className="mt-0.5 text-[12px] leading-[1.45] text-[color:var(--ink-4)]">{fig.caption}</p>
        ) : null}
      </figcaption>
    </figure>
  );
}
