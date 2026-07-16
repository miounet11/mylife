'use client';

import Link from 'next/link';
import { trackClientEvent } from '@/lib/analytics-client';
import { trackProductEvent } from '@/lib/product-analytics';
import { cn } from '@/lib/utils';

/**
 * Tracked link into a free tool / hehun — dual-writes product + analytics.
 */
export default function ToolEntryLink({
  href,
  title,
  description,
  source,
  className,
  titleClassName,
  descClassName,
  children,
}: {
  href: string;
  title?: string;
  description?: string;
  source: string;
  className?: string;
  titleClassName?: string;
  descClassName?: string;
  children?: React.ReactNode;
}) {
  const toolSlug = href.startsWith('/tools/')
    ? href.replace(/^\/tools\//, '').split('?')[0]
    : href.startsWith('/hehun')
      ? 'hehun'
      : href.split('?')[0];

  const withSource = (() => {
    if (!source) return href;
    const sep = href.includes('?') ? '&' : '?';
    if (href.includes('source=')) return href;
    return `${href}${sep}source=${encodeURIComponent(source)}`;
  })();

  const onClick = () => {
    void trackClientEvent({
      eventName: 'tool_entry_clicked',
      page: typeof window !== 'undefined' ? window.location.pathname : '/tools',
      meta: {
        toolSlug,
        href: withSource,
        source,
        title: title || toolSlug,
      },
    });
    trackProductEvent('tool_entry_clicked', {
      toolSlug,
      href: withSource,
      source,
      title: title || toolSlug,
    });
  };

  if (children) {
    return (
      <Link href={withSource} onClick={onClick} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={withSource}
      onClick={onClick}
      className={cn(
        'group flex flex-col gap-0.5 py-2.5 no-underline hover:no-underline sm:flex-row sm:items-baseline sm:justify-between sm:gap-4',
        className,
      )}
    >
      <span
        className={cn(
          'text-[13px] font-medium text-[color:var(--ink-1)] group-hover:underline',
          titleClassName,
        )}
      >
        {title}
      </span>
      {description ? (
        <span
          className={cn(
            'min-w-0 text-[12px] text-[color:var(--ink-5)] sm:max-w-[55%] sm:truncate sm:text-right',
            descClassName,
          )}
        >
          {description}
        </span>
      ) : null}
    </Link>
  );
}
