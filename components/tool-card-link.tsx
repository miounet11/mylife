'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';

export default function ToolCardLink({
  href,
  toolSlug,
  page,
  category,
  className,
  children,
}: {
  href: string;
  toolSlug: string;
  page: string;
  category: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={() => {
        void trackClientEvent({
          eventName: 'tool_card_clicked',
          page,
          meta: {
            toolSlug,
            category,
            target: href,
          },
        });
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
