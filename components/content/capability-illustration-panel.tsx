import Image from 'next/image';
import { ImageIcon } from 'lucide-react';
import {
  resolvePageIllustrationEntries,
  resolvePageIllustrations,
} from '@/lib/page-illustrations/resolve';
import { buildImageObjectJsonLd } from '@/lib/page-illustrations/seo';
import { publicSrc, type PageIllustLocale } from '@/lib/page-illustrations/catalog';
import {
  TEACHER_CAPABILITY_COPY,
  isCapabilityTeacherId,
  teacherCapabilityTitle,
  type CapabilityTeacherId,
} from '@/lib/page-illustrations/capability-map';

type Props = {
  /** Catalog surface, e.g. teachers/career or chat/teacher/career */
  surface: string;
  /** Optional teacher id for structured capability copy */
  teacherId?: string | null;
  title?: string;
  locale?: PageIllustLocale;
  /** @deprecated prefer variant */
  compact?: boolean;
  className?: string;
  priority?: boolean;
  /** Show text capability columns when teacherId is known */
  showCopy?: boolean;
  /**
   * default — full figure for hubs/detail pages
   * chat — dense strip: short image height + chip rows (messenger shell)
   */
  variant?: 'default' | 'chat';
  /** Hide outer title block (when parent already shows teacher name) */
  hideHeader?: boolean;
};

/**
 * Capability diagram + optional 「能解决 / 典型问题 / 输出」 copy.
 * Used on chat opening, teachers gallery highlight, dimension/tool subpages.
 */
export function CapabilityIllustrationPanel({
  surface,
  teacherId,
  title,
  locale,
  compact = true,
  className = '',
  priority = false,
  showCopy = true,
  variant = 'default',
  hideHeader = false,
}: Props) {
  const isChat = variant === 'chat';
  const figures = resolvePageIllustrations(surface, { limit: 1, locale });
  const entries = resolvePageIllustrationEntries(surface, { limit: 1, locale });
  const fig = figures[0];
  const entry = entries[0];

  const capId =
    teacherId && isCapabilityTeacherId(teacherId)
      ? (teacherId as CapabilityTeacherId)
      : null;
  const copy = capId ? TEACHER_CAPABILITY_COPY[capId] : null;
  const heading =
    title ||
    (capId ? teacherCapabilityTitle(capId) : fig?.title) ||
    '能力图解';

  if (!fig?.src && !copy) return null;

  const jsonLd =
    entry && fig?.src
      ? buildImageObjectJsonLd({
          id: entry.id,
          title: entry.title,
          caption: entry.caption,
          alt: entry.alt,
          src: publicSrc(entry),
          width: entry.width,
          height: entry.height,
          locale: entry.locale || locale || 'zh-CN',
        })
      : null;

  // --- Chat dense layout: image band + chip groups ---
  if (isChat) {
    return (
      <section className={`bg-[color:var(--paper)] ${className}`}>
        {jsonLd ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        ) : null}

        <div className="flex flex-col sm:flex-row sm:items-stretch">
          {fig?.src ? (
            <figure
              className="relative w-full shrink-0 bg-[color:var(--bg-sunken)] sm:w-[42%] sm:max-w-[280px]"
              itemScope
              itemType="https://schema.org/ImageObject"
            >
              <div className="relative h-[5.75rem] w-full sm:h-full sm:min-h-[7.5rem]">
                <Image
                  src={fig.src}
                  alt={fig.alt || fig.title}
                  fill
                  sizes="(min-width: 640px) 280px, 100vw"
                  className="object-cover object-center"
                  loading={priority ? 'eager' : 'lazy'}
                  priority={priority}
                  itemProp="contentUrl"
                />
              </div>
              <meta itemProp="name" content={fig.title} />
            </figure>
          ) : null}

          {showCopy && copy ? (
            <div className="min-w-0 flex-1 divide-y divide-[color:var(--hairline)] sm:divide-y-0 sm:divide-x sm:grid sm:grid-cols-3">
              {(
                [
                  ['能解决', copy.solves],
                  ['典型问题', copy.problems],
                  ['你会得到', copy.outputs],
                ] as const
              ).map(([label, items]) => (
                <div key={label} className="px-2.5 py-2">
                  <div className="text-[10px] font-semibold tracking-[0.04em] text-[color:var(--ink-5)]">
                    {label}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {items.map((item) => (
                      <span
                        key={item}
                        className="inline-flex max-w-full rounded-[4px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/60 px-1.5 py-0.5 text-[11px] leading-[1.35] text-[color:var(--ink-3)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : fig?.caption ? (
            <p className="flex-1 px-3 py-2 text-[11px] leading-[1.45] text-[color:var(--ink-5)]">
              {fig.caption}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  // --- Default page layout ---
  return (
    <section
      className={`overflow-hidden rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--paper)] ${className}`}
    >
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}

      {!hideHeader ? (
        <div className="border-b border-[color:var(--hairline)] px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[color:var(--ink-5)]">
            <ImageIcon className="h-3 w-3" />
            能力图解
          </div>
          <h2 className="mt-0.5 text-[13px] font-semibold tracking-[-0.01em] text-[color:var(--ink-1)]">
            {heading}
          </h2>
        </div>
      ) : null}

      {fig?.src ? (
        <figure
          className="relative w-full bg-[color:var(--bg-sunken)]"
          itemScope
          itemType="https://schema.org/ImageObject"
        >
          <div className={`relative w-full ${compact ? 'aspect-[16/9]' : 'aspect-[16/9]'}`}>
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
          {fig.caption ? (
            <figcaption className="px-3 py-1.5 text-[11px] leading-[1.45] text-[color:var(--ink-5)]">
              {fig.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {showCopy && copy ? (
        <div className="grid gap-0 border-t border-[color:var(--hairline)] sm:grid-cols-3">
          {(
            [
              ['能解决', copy.solves],
              ['典型问题', copy.problems],
              ['你会得到', copy.outputs],
            ] as const
          ).map(([label, items], idx) => (
            <div
              key={label}
              className={`px-3 py-2.5 ${
                idx > 0 ? 'border-t border-[color:var(--hairline)] sm:border-t-0 sm:border-l' : ''
              }`}
            >
              <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-[color:var(--ink-5)]">
                {label}
              </div>
              <ul className="mt-1 space-y-0.5">
                {items.map((item) => (
                  <li
                    key={item}
                    className="text-[12px] leading-[1.45] text-[color:var(--ink-3)]"
                  >
                    · {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
