'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { trackClientEvent } from '@/lib/analytics-client';

export default function ContentCardLink({
  href,
  className,
  children,
  page,
  meta,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  page?: string;
  meta?: Record<string, unknown>;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        void trackClientEvent({
          eventName: 'content_card_clicked',
          page,
          meta,
        });
      }}
    >
      {children}
    </Link>
  );
}
