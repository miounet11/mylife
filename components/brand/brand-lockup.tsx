'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { BrandMark } from '@/components/ui/brand-mark';
import { useLocale } from '@/components/i18n/locale-provider';
import { cn } from '@/lib/utils';

/**
 * Canonical site lockup: BrandMark + wordmark + LIFE KLINE sublabel.
 * Replaces the serif-K plate in the header for brand consistency.
 */
export function BrandLockup({
  href = '/',
  size = 28,
  className,
  showSublabel = true,
}: {
  href?: string;
  size?: number;
  className?: string;
  showSublabel?: boolean;
}) {
  const { t, locale } = useLocale();
  const brandName = t('brandName') || '人生K线';

  const brandMain =
    locale === 'en' ? (
      <>
        Life <span className="font-serif">K</span>-Line
      </>
    ) : (
      <span className="whitespace-nowrap">{brandName}</span>
    );

  return (
    <Link
      href={href}
      aria-label={t('brandAria')}
      className={cn(
        'flex shrink-0 items-center gap-2.5 text-[color:var(--ink-1)] hover:opacity-90 hover:no-underline',
        className,
      )}
    >
      <span
        className="inline-flex shrink-0 items-center justify-center rounded-[8px] bg-[color:var(--brand-strong,#0b5f55)] p-1.5 shadow-sm"
        style={
          {
            // Invert mark onto teal plate (paper pillars + gold signal)
            ['--brand-deep']: '#f5f7f2',
            ['--brand-strong']: '#f5f7f2',
            ['--signal']: '#c9a14a',
          } as CSSProperties
        }
        aria-hidden
      >
        <BrandMark size={size} withSignal withBaseline ariaLabel="" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[14px] font-semibold tracking-[-0.02em]">{brandMain}</span>
        {showSublabel ? (
          <span
            className="mt-0.5 text-[10px] font-medium uppercase text-[color:var(--brand)]"
            style={{ letterSpacing: '0.14em' }}
          >
            LIFE KLINE
          </span>
        ) : null}
      </span>
    </Link>
  );
}
