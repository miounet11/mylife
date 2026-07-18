import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import {
  resolvePageIllustrationEntries,
  resolvePageIllustrations,
} from '@/lib/page-illustrations/resolve';
import { ContentFigureBlock } from '@/components/content/content-figure';
import { buildImageObjectJsonLd } from '@/lib/page-illustrations/seo';
import type { PageIllustLocale } from '@/lib/page-illustrations/catalog';
import { publicSrc } from '@/lib/page-illustrations/catalog';

type Props = {
  /** Catalog surface key, e.g. teachers/hub */
  surface: string;
  title?: string;
  limit?: number;
  /** compact = single row hero only */
  compact?: boolean;
  className?: string;
  /** Prefer locale-matched diagram (en / zh-Hant / zh-CN) */
  locale?: PageIllustLocale;
  /** When true (default), emit ImageObject JSON-LD for Google Image / GEO */
  seoJsonLd?: boolean;
  /** First image above the fold: skip lazy load for LCP when true */
  priority?: boolean;
};

/**
 * Mount curated page illustrations for a product surface.
 * Falls back to nothing when no ready assets (no empty boxes).
 * SEO: descriptive alt + figcaption + optional ImageObject JSON-LD.
 */
export function PageIllustrationStrip({
  surface,
  title = '图解',
  limit = 2,
  compact = false,
  className = '',
  locale,
  seoJsonLd = true,
  priority = false,
}: Props) {
  const figures = resolvePageIllustrations(surface, { limit, locale });
  const entries = resolvePageIllustrationEntries(surface, { limit, locale });
  if (!figures.length) return null;

  const jsonLd =
    seoJsonLd && entries[0]
      ? buildImageObjectJsonLd({
          id: entries[0].id,
          title: entries[0].title,
          caption: entries[0].caption,
          alt: entries[0].alt,
          src: publicSrc(entries[0]),
          width: entries[0].width,
          height: entries[0].height,
          locale: entries[0].locale || locale || 'zh-CN',
        })
      : null;

  if (compact && figures[0]?.src) {
    const fig = figures[0];
    return (
      <>
        {jsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        ) : null}
        <figure
          className={`overflow-hidden rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] ${className}`}
          itemScope
          itemType="https://schema.org/ImageObject"
        >
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={fig.src}
              alt={fig.alt || fig.title}
              fill
              sizes="(min-width: 768px) 720px, 100vw"
              className="object-cover"
              loading={priority ? 'eager' : 'lazy'}
              priority={priority}
              itemProp="contentUrl"
            />
          </div>
          <meta itemProp="name" content={fig.title} />
          {fig.caption ? <meta itemProp="caption" content={fig.caption} /> : null}
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
      </>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
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
