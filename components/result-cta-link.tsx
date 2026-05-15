'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { trackClientEvent } from '@/lib/analytics-client';
import { trackReportJourneyEvent } from '@/lib/report-journey-client';

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
    const reportId = typeof meta?.reportId === 'string' ? meta.reportId : '';
    const workflowId = typeof meta?.workflowId === 'string' ? meta.workflowId : '';
    const layerKey = typeof meta?.layerKey === 'string' ? meta.layerKey : '';
    const category = typeof meta?.category === 'string' ? meta.category : '';
    const toolSlug = typeof meta?.toolSlug === 'string' ? meta.toolSlug : '';
    const source = typeof meta?.source === 'string' ? meta.source : '';

    const eventMeta = {
      target,
      ...meta,
    };

    void trackClientEvent({
      eventName: 'result_cta_clicked',
      page,
      meta: eventMeta,
    });

    if (target.includes('chat') || href.startsWith('/chat')) {
      void trackClientEvent({
        eventName: 'result_chat_started',
        page,
        meta: eventMeta,
      });
    }

    if (reportId && workflowId) {
      void trackReportJourneyEvent({
        reportId,
        workflowId,
        layerKey,
        actionTarget: target,
        category,
        toolSlug,
        source,
        href,
        meta: {
          page,
          ...meta,
        },
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
