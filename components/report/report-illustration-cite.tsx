import Image from 'next/image';
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
 * Brand chrome: LIFE KLINE chip + teal hairline — immersive “room” for each chapter.
 * Only renders when a ready static asset exists (no empty boxes).
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
      className={`overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] shadow-sm ${className}`}
      data-report-illust={fig.id}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--hairline)] bg-[color:var(--bg-sunken,#f5f7f2)]/60 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-[5px] bg-[color:var(--brand-strong,#0b5f55)] text-[9px] font-black text-[#f5f7f2]"
            aria-hidden
          >
            K
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong,#0b5f55)]">
            Life Kline · {title}
          </span>
        </div>
        <span className="text-[10px] text-[color:var(--ink-5)]">结构示意</span>
      </div>
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
      <figcaption className="px-3 py-2.5">
        <div className="text-[13px] font-semibold text-[color:var(--ink-1)]">{fig.title}</div>
        {fig.caption ? (
          <p className="mt-0.5 text-[12px] leading-[1.45] text-[color:var(--ink-4)]">{fig.caption}</p>
        ) : null}
      </figcaption>
    </figure>
  );
}
