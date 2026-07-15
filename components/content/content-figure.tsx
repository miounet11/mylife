import Image from 'next/image';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import type { ContentFigure } from '@/lib/content-illustrations';
import { ContentDiagramSvg } from '@/components/content/content-diagram-svg';

type ContentFigureBlockProps = {
  figure: ContentFigure;
  index?: number;
  compact?: boolean;
};

export function ContentFigureBlock({ figure, index = 0, compact = false }: ContentFigureBlockProps) {
  const isDiagram = figure.kind === 'diagram' || !figure.src;
  const visualHref = figure.kind === 'library' && figure.slug
    ? `/visual-assets/${figure.slug}`
    : null;

  return (
    <figure
      className={
        compact
          ? 'overflow-hidden rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]'
          : 'overflow-hidden rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] shadow-[var(--shadow-sm)]'
      }
    >
      <div className="flex items-center justify-between gap-2 border-b border-[color:var(--hairline)] px-3 py-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
          <ImageIcon className="h-3 w-3" />
          图解 {index + 1}
          {figure.moduleLabel ? <span className="text-[color:var(--ink-5)]">· {figure.moduleLabel}</span> : null}
        </div>
        <span className="font-mono text-[10px] text-[color:var(--ink-5)]">{figure.role}</span>
      </div>

      <div className={compact ? 'bg-[color:var(--bg-sunken)]' : 'bg-[color:var(--bg-sunken)] p-2 md:p-3'}>
        {isDiagram && figure.diagramVariant ? (
          <ContentDiagramSvg
            variant={figure.diagramVariant}
            title={figure.title}
            className="w-full"
          />
        ) : figure.src ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-sm)]">
            <Image
              src={figure.src}
              alt={figure.alt || figure.title}
              fill
              sizes="(min-width: 1024px) 720px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>

      <figcaption className="space-y-1 px-3 py-3">
        <div className="text-[14px] font-bold leading-snug text-[color:var(--ink-1)]">{figure.title}</div>
        {figure.caption ? (
          <p className="text-[12px] leading-relaxed text-[color:var(--ink-3)]">{figure.caption}</p>
        ) : null}
        {visualHref ? (
          <Link
            href={visualHref}
            className="inline-flex pt-1 text-[12px] font-bold text-[color:var(--brand)] hover:no-underline"
          >
            查看完整视觉解读 →
          </Link>
        ) : null}
      </figcaption>
    </figure>
  );
}
