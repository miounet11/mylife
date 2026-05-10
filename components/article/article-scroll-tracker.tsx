'use client';

import { useEffect, useRef } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';

interface ArticleScrollTrackerProps {
  surfaceKey: string;
  slug: string;
  contentType: 'knowledge' | 'case' | 'insight';
}

const DEPTH_MILESTONES = [25, 50, 75, 100];

export default function ArticleScrollTracker({ surfaceKey, slug, contentType }: ArticleScrollTrackerProps) {
  const sentDepths = useRef<Set<number>>(new Set());
  const startedAt = useRef<number>(typeof performance !== 'undefined' ? performance.now() : 0);
  const maxDepth = useRef<number>(0);
  const ctaImpressed = useRef<boolean>(false);
  const ctaClicked = useRef<boolean>(false);

  useEffect(() => {
    const onCtaImpressed = () => {
      ctaImpressed.current = true;
    };
    const onCtaClicked = () => {
      ctaClicked.current = true;
    };
    window.addEventListener('article-cta-impressed', onCtaImpressed);
    window.addEventListener('article-cta-clicked', onCtaClicked);

    let scrollTimer: ReturnType<typeof setTimeout> | null = null;

    const computeDepth = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const viewportHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollable = docHeight - viewportHeight;
      if (scrollable <= 0) return 100;
      return Math.min(100, Math.round(((scrollTop + viewportHeight) / docHeight) * 100));
    };

    const onScroll = () => {
      if (scrollTimer) return;
      scrollTimer = setTimeout(() => {
        scrollTimer = null;
        const depth = computeDepth();
        if (depth > maxDepth.current) maxDepth.current = depth;

        for (const milestone of DEPTH_MILESTONES) {
          if (depth >= milestone && !sentDepths.current.has(milestone)) {
            sentDepths.current.add(milestone);
            void trackClientEvent({
              eventName: 'article_scroll_depth',
              page: window.location.pathname,
              meta: { surfaceKey, slug, contentType, depth: milestone },
            });
          }
        }
      }, 200);
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const reportSessionEnd = () => {
      const timeOnPage_ms = Math.round(performance.now() - startedAt.current);
      void trackClientEvent({
        eventName: 'article_session_end',
        page: window.location.pathname,
        meta: {
          surfaceKey,
          slug,
          contentType,
          timeOnPage_ms,
          maxDepth: maxDepth.current,
          ctaImpressed: ctaImpressed.current,
          ctaClicked: ctaClicked.current,
        },
      });
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') reportSessionEnd();
    };

    window.addEventListener('beforeunload', reportSessionEnd);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('article-cta-impressed', onCtaImpressed);
      window.removeEventListener('article-cta-clicked', onCtaClicked);
      window.removeEventListener('beforeunload', reportSessionEnd);
      document.removeEventListener('visibilitychange', onVisibility);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [surfaceKey, slug, contentType]);

  return null;
}
