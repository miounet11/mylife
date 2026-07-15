'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { trackClientEvent } from '@/lib/analytics-client';

/**
 * Shared CTA link used on result / profile / cockpit surfaces.
 * Must call trackClientEvent — CustomEvent-only dispatch has no listeners in this app.
 */
export default function ResultCtaLink({
  href,
  page,
  target,
  className,
  children,
  meta,
}: {
  href: string;
  page: string;
  target: string;
  className?: string;
  children: ReactNode;
  meta?: Record<string, unknown>;
}) {
  const onClick = () => {
    const eventMeta = {
      target,
      ...meta,
    };

    void trackClientEvent({
      eventName: 'result_cta_clicked' as never,
      page,
      meta: eventMeta,
    });

    if (target.includes('chat') || href.startsWith('/chat')) {
      void trackClientEvent({
        eventName: 'result_chat_started' as never,
        page,
        meta: eventMeta,
      });
    }
  };

  if (href.startsWith('#')) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
