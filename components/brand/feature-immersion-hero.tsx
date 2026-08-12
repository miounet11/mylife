import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import {
  ACCENT_CHIP_CLASS,
  getImmersionSurface,
  immersionArtJpg,
  immersionArtSrc,
  type ImmersionOverlay,
  type ImmersionSurfaceKey,
} from '@/lib/brand/immersion-surfaces';

/**
 * Immersive feature hero: 16:9 media band + eyebrow/title/desc/actions.
 * Gives each hub a distinct "room" while keeping Linear editorial calm.
 */
export function FeatureImmersionHero({
  surfaceKey,
  eyebrow,
  title,
  description,
  actions,
  footer,
  priority = false,
  className,
  compact = false,
  overlay: overlayOverride,
}: {
  surfaceKey: ImmersionSurfaceKey;
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  /** LCP: home / analyze only */
  priority?: boolean;
  className?: string;
  /** Tighter media height on dense hubs */
  compact?: boolean;
  overlay?: ImmersionOverlay;
}) {
  const surface = getImmersionSurface(surfaceKey);
  const overlay = overlayOverride ?? surface.overlay;
  const isDeep = overlay === 'deep-ink';
  const webp = immersionArtSrc(surface.artId, true);
  const jpg = immersionArtJpg(surface.artId);
  const label = eyebrow ?? surface.eyebrow;

  return (
    <header className={cn('mb-6 space-y-0', className)}>
      <div
        className={cn(
          'relative overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--hairline)] ring-1',
          ACCENT_CHIP_CLASS[surface.accent].includes('text-') ? '' : '',
          isDeep ? 'bg-[color:var(--ink-1)]' : 'bg-[color:var(--bg-sunken,#f5f7f2)]',
          compact ? 'aspect-[21/9] min-h-[120px] max-h-[200px]' : 'aspect-[16/9] min-h-[140px] max-h-[280px] md:max-h-[320px]',
        )}
      >
        <picture>
          <source srcSet={webp} type="image/webp" />
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand assets; picture+webp fallback */}
          <img
            src={jpg}
            alt={surface.alt}
            width={1280}
            height={720}
            decoding={priority ? 'sync' : 'async'}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            className={cn(
              'absolute inset-0 h-full w-full object-cover',
              isDeep ? 'opacity-90' : 'opacity-95',
            )}
          />
        </picture>

        {/* Gradient scrim for deep-ink title-on-media option; light keeps art clean */}
        {isDeep ? (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
            aria-hidden
          />
        ) : (
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--paper)]/25 via-transparent to-transparent"
            aria-hidden
          />
        )}

        {/* Accent chip on media corner */}
        <div className="absolute left-3 top-3 md:left-4 md:top-4">
          <span
            className={cn(
              'inline-flex items-center rounded-full border border-white/40 bg-white/85 px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] backdrop-blur-sm',
              ACCENT_CHIP_CLASS[surface.accent],
            )}
          >
            {label}
          </span>
        </div>
      </div>

      <div className="border-b border-[color:var(--hairline)] pb-5 pt-4">
        <div
          className={cn(
            'text-[12px] font-semibold uppercase tracking-[0.12em]',
            ACCENT_CHIP_CLASS[surface.accent],
          )}
        >
          {label}
        </div>
        <h1 className="mt-1 text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-[color:var(--ink-1)] md:text-[26px]">
          {title}
        </h1>
        {description ? (
          <div className="mt-2.5 max-w-2xl text-[15px] leading-[1.65] text-[color:var(--ink-3)]">
            {description}
          </div>
        ) : null}
        {actions ? (
          <div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px]">{actions}</div>
        ) : null}
        {footer ? (
          <div className="mt-3 text-[13px] leading-[1.55] text-[color:var(--ink-4)]">{footer}</div>
        ) : null}
      </div>
    </header>
  );
}

/** Compact media-only band (when page already has its own title). */
export function ImmersionMediaBand({
  surfaceKey,
  priority = false,
  compact = true,
  className,
}: {
  surfaceKey: ImmersionSurfaceKey;
  priority?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const surface = getImmersionSurface(surfaceKey);
  const webp = immersionArtSrc(surface.artId, true);
  const jpg = immersionArtJpg(surface.artId);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--hairline)]',
        compact
          ? 'aspect-[21/9] min-h-[100px] max-h-[180px]'
          : 'aspect-[16/9] min-h-[140px] max-h-[280px]',
        className,
      )}
    >
      <picture>
        <source srcSet={webp} type="image/webp" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={jpg}
          alt={surface.alt}
          width={1280}
          height={720}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
    </div>
  );
}

