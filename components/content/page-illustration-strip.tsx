import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import { resolvePageIllustrations } from '@/lib/page-illustrations/resolve';
import { ContentFigureBlock } from '@/components/content/content-figure';

type Props = {
  /** Catalog surface key, e.g. teachers/hub */
  surface: string;
  title?: string;
  limit?: number;
  /** compact = single row hero only */
  compact?: boolean;
  className?: string;
};

/**
 * Mount curated page illustrations for a product surface.
 * Falls back to nothing when no ready assets (no empty boxes).
 */
export function PageIllustrationStrip({
  surface,
  title = '图解',
  limit = 2,
  compact = false,
  className = '',
}: Props) {
  const figures = resolvePageIllustrations(surface, { limit });
  if (!figures.length) return null;

  if (compact && figures[0]?.src) {
    const fig = figures[0];
    return (
      <figure
        className={`overflow-hidden rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] ${className}`}
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
          <div className="mt-0.5 text-[13px] font-semibold text-[color:var(--ink-1)]">
            {fig.title}
          </div>
          {fig.caption ? (
            <p className="mt-0.5 text-[12px] leading-[1.45] text-[color:var(--ink-4)]">
              {fig.caption}
            </p>
          ) : null}
        </figcaption>
      </figure>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--ink-5)]">
        {title}
      </div>
      <div className={`grid gap-3 ${figures.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {figures.map((figure, index) => (
          <ContentFigureBlock key={figure.id} figure={figure} index={index} compact />
        ))}
      </div>
    </div>
  );
}
