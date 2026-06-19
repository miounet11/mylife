'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import { appendSourceToHref } from '@/lib/source-url';

export default function ToolCardLink({
  href,
  toolSlug,
  page,
  category,
  className,
  children,
  source,
  ctaStrategyKey,
  sourceFamily,
}: {
  href: string;
  toolSlug: string;
  page: string;
  category: string;
  className?: string;
  children: ReactNode;
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
      onClick={() => {
        void trackClientEvent({
          eventName: 'tool_card_clicked',
          page,
          meta: {
            toolSlug,
            category,
            target: resolvedHref,
            source: source || null,
            ctaStrategyKey: ctaStrategyKey || null,
            sourceFamily: sourceFamily || null,
          },
        });
      }}
      className={resolvedClassName}
    >
      <div className="overflow-hidden">{children}</div>
    </Link>
  );
}
