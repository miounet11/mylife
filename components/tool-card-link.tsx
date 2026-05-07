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
  const resolvedClassName = className ? `${className} interactive-card` : 'interactive-card';
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
      {children}
    </Link>
  );
}
