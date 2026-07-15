'use client';

import { useEffect } from 'react';
import { recordJourneyVisit } from '@/lib/personal-journey';

export default function ContentVisitTracker({
  href,
  title,
  kind = 'article',
}: {
  href: string;
  title: string;
  kind?: 'article' | 'report' | 'tool';
}) {
  useEffect(() => {
    recordJourneyVisit({ href, title, kind });
  }, [href, title, kind]);

  return null;
}