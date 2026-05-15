'use client';

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import {
  buildArticleAnalyzeHref,
  buildArticleAnalyzeStartMeta,
  type ArticleAnalyzePosition,
  type ArticleContentType,
} from '@/lib/article-cta';

interface ArticleAnalyzeLinkProps extends Omit<ComponentProps<typeof Link>, 'href' | 'onClick'> {
  surfaceKey: string;
  slug: string;
  contentType: ArticleContentType;
  position: ArticleAnalyzePosition;
  sourceLabel: string;
  extraMeta?: Record<string, unknown>;
  children: ReactNode;
  href?: string;
}

export default function ArticleAnalyzeLink({
  surfaceKey,
  slug,
  contentType,
  position,
  sourceLabel,
  extraMeta,
  children,
  href,
  ...props
}: ArticleAnalyzeLinkProps) {
  const targetHref = href || buildArticleAnalyzeHref(surfaceKey, position);

  return (
    <Link
      {...props}
      href={targetHref}
      onClick={() => {
        void trackClientEvent({
          eventName: 'content_quick_analyze_started',
          page: window.location.pathname,
          meta: buildArticleAnalyzeStartMeta({
            surfaceKey,
            slug,
            contentType,
            position,
            sourceLabel,
            extraMeta,
          }),
        });
      }}
    >
      {children}
    </Link>
  );
}
