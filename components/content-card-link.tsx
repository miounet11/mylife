'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { trackClientEvent } from '@/lib/analytics-client';
import { appendSourceToHref } from '@/lib/source-url';

export default function ContentCardLink({
  href,
  className,
  children,
  page,
  meta,
  source,
  ctaStrategyKey,
  sourceFamily,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  page?: string;
  meta?: Record<string, unknown>;
  source?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  const resolvedHref = appendSourceToHref(href, source);
  const baseClassName = 'block cursor-pointer transition-colors hover:no-underline';
  const fbSurfaceClassName = 'fb-card hover:border-[color:var(--fb-blue)] hover:bg-[color:var(--fb-action-bg)]';
  const resolvedClassName = className
    ? `${className} ${baseClassName} ${fbSurfaceClassName}`
    : `${baseClassName} ${fbSurfaceClassName} p-3`;
  return (
    <Link
      href={resolvedHref}
      className={resolvedClassName}
      onClick={() => {
        void trackClientEvent({
          eventName: 'content_card_clicked',
          page,
          meta: {
            ...meta,
            source: source || null,
            target: resolvedHref,
            ctaStrategyKey: ctaStrategyKey || null,
            sourceFamily: sourceFamily || null,
          },
        });
      }}
    >
      <div className="overflow-hidden">{children}</div>
    </Link>
  );
}
