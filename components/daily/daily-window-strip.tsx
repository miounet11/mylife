import Link from 'next/link';
import { Eyebrow } from '@/components/ui/eyebrow';
import { dailyWindowChrome, getDailyWindowCopy } from '@/lib/daily/window-copy';
import { cn } from '@/lib/utils';

/**
 * Lightweight public habit strip: generic rhythm tip + CTAs.
 * No personal bazi / 日主 / 用神 without a real report context.
 */
export default function DailyWindowStrip({
  className,
  compact = false,
  source = 'daily_window_strip',
  locale,
}: {
  className?: string;
  compact?: boolean;
  /** Analytics / funnel source query on outbound links */
  source?: string;
  /** UI locale — English tips when `en` (?lang=en or /en/…) */
  locale?: string | null;
}) {
  const { text } = getDailyWindowCopy(new Date(), locale);
  const chrome = dailyWindowChrome(locale);
  const toolHref = `/tools/timing-yearly-window?source=${encodeURIComponent(source)}`;
  const updatesHref = `/updates?source=${encodeURIComponent(source)}`;

  return (
    <section
      aria-label={chrome.ariaLabel}
      className={cn(
        'rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)]',
        compact ? 'px-3.5 py-3' : 'px-4 py-3.5',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <Eyebrow tone="brand">{chrome.eyebrow}</Eyebrow>
          <p
            className={cn(
              'mt-1.5 max-w-2xl leading-[1.55] text-[color:var(--ink-2)]',
              compact ? 'text-[13px]' : 'text-[14px]',
            )}
          >
            {text}
          </p>
          <p className="mt-1 text-[12px] leading-[1.45] text-[color:var(--ink-4)]">
            {chrome.disclaimer}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5 text-[13px]">
          <Link
            href={toolHref}
            className="font-semibold text-[color:var(--brand)] hover:no-underline"
          >
            {chrome.ctaYear}
          </Link>
          <Link
            href={updatesHref}
            className="font-medium text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
          >
            {chrome.ctaSubscribe}
          </Link>
        </div>
      </div>
    </section>
  );
}
