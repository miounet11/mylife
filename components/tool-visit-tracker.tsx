'use client';

import { useEffect } from 'react';
import { recordToolVisit } from '@/lib/tool-history';
import { recordJourneyVisit } from '@/lib/personal-journey';

export default function ToolVisitTracker({ href, title }: { href: string; title: string }) {
  useEffect(() => {
    recordToolVisit({ href, title });
    recordJourneyVisit({ href, title, kind: 'tool' });
  }, [href, title]);

  return null;
}