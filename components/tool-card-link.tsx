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
  const resolvedClassName = className ? `${className} block cursor-pointer rounded-[var(--radius-md)] border border-[color:var(--hairline-strong)] bg-[color:var(--bg-elevated)] transition hover:-translate-y-px hover:border-[color:var(--brand)] hover:bg-[color:var(--paper)]` : 'block cursor-pointer rounded-[var(--radius-md)] border border-[color:var(--hairline-strong)] bg-[color:var(--bg-elevated)] transition hover:-translate-y-px hover:border-[color:var(--brand)] hover:bg-[color:var(--paper)]';
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
