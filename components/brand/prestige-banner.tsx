import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PRESTIGE_ASSETS, PRESTIGE_ICONS, type PrestigeIconKey } from '@/lib/brand/prestige';

const ACTION_CLASS =
  'mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] font-medium [&_a]:text-[#e8c76a] [&_a]:no-underline hover:[&_a]:text-[#f6e7b2] hover:[&_a]:underline';

/**
 * Gold-on-black award plate with real product type overlaid.
 * Art has no letters so Chinese / English stay exact.
 */
export function PrestigeBanner({
  variant = 'wide',
  compact = false,
  headingAs = 'h2',
  priority = false,
  eyebrow,
  title,
  description,
  seal,
  actions,
  className,
}: {
  variant?: 'wide' | 'vertical';
  compact?: boolean;
  headingAs?: 'h1' | 'h2' | 'p';
  priority?: boolean;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  seal?: string;
  actions?: ReactNode;
  className?: string;
}) {
  const art = variant === 'vertical' ? PRESTIGE_ASSETS.plateVertical : PRESTIGE_ASSETS.plateWide;
  const isVertical = variant === 'vertical';
  const Heading = headingAs;

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-xl)] border border-[#c9a227]/40 bg-black shadow-[0_16px_48px_rgba(0,0,0,0.28)]',
        isVertical
          ? 'aspect-[9/16] max-h-[720px]'
          : compact
            ? 'min-h-[140px]'
            : 'min-h-[176px] md:min-h-[200px]',
        className,
      )}
      aria-label={typeof title === 'string' ? title : '人生K线'}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art}
        alt=""
        width={isVertical ? 720 : 1280}
        height={isVertical ? 1280 : 720}
        className="absolute inset-0 h-full w-full object-cover"
        decoding={priority ? 'sync' : 'async'}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-0',
          isVertical
            ? 'bg-gradient-to-t from-black/75 via-black/25 to-black/10'
            : 'bg-gradient-to-r from-black/25 via-black/50 to-black/72',
        )}
        aria-hidden
      />
      <div
        className={cn(
          'relative z-10 flex h-full flex-col justify-end p-5 md:p-7',
          isVertical ? 'items-center text-center' : 'max-w-xl items-start text-left md:ml-auto',
        )}
      >
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#e8c76a]">
            {eyebrow}
          </p>
        ) : null}
        <Heading className="mt-1.5 font-serif text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[#f6e7b2] md:text-[28px]">
          {title}
        </Heading>
        {description ? (
          <p className="mt-2 text-[13px] leading-[1.6] text-[#f3e6c4]/80">{description}</p>
        ) : null}
        {seal ? (
          <p className="mt-3 inline-flex items-center rounded-full border border-[#c9a227]/50 px-3 py-1 text-[11px] font-semibold tracking-[0.08em] text-[#e8c76a]">
            {seal}
          </p>
        ) : null}
        {actions ? <div className={ACTION_CLASS}>{actions}</div> : null}
      </div>
    </section>
  );
}

export function PrestigeIconRow({
  keys = ['app', 'timing', 'seal'],
  locale,
  className,
}: {
  keys?: PrestigeIconKey[];
  locale?: string | null;
  className?: string;
}) {
  const en = `${locale || ''}`.toLowerCase().startsWith('en');
  return (
    <ul className={cn('grid grid-cols-3 gap-3', className)}>
      {keys.map((key) => {
        const item = PRESTIGE_ICONS[key];
        return (
          <li
            key={key}
            className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-[#c9a227]/25 bg-black/90 px-2 py-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.src} alt={item.alt} className="h-14 w-14 rounded-full object-cover" />
            <span className="text-[12px] font-semibold text-[#e8c76a]">
              {en ? item.labelEn : item.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function PrestigeMark({
  icon = 'seal',
  size = 18,
  className,
}: {
  icon?: PrestigeIconKey;
  size?: number;
  className?: string;
}) {
  const item = PRESTIGE_ICONS[icon];
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.src}
      alt=""
      width={size}
      height={size}
      className={cn('inline-block rounded-full object-cover', className)}
      style={{ width: size, height: size }}
      decoding="async"
    />
  );
}
