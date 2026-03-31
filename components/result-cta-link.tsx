'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { trackClientEvent } from '@/lib/analytics-client';

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
    void trackClientEvent({
      eventName: 'result_cta_clicked',
      page,
      meta: {
        target,
        ...meta,
      },
    });
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
