'use client';

import Link from 'next/link';
import type { ToolCategoryKey } from '@/lib/portal-tools';
import { LEARNING_TRACKS } from '@/lib/learning-tracks';

const TRACK_BY_KEY = new Map(LEARNING_TRACKS.map((track) => [track.key, track]));

const CATEGORY_TRACK: Partial<Record<ToolCategoryKey, string>> = {
  career: 'career',
  wealth: 'wealth',
  relationship: 'relationship',
  family: 'family',
  health: 'health',
  migration: 'migration',
  application: 'application',
};

export default function ToolRecommendations({ category }: { category?: ToolCategoryKey }) {
  const trackKey = category ? CATEGORY_TRACK[category] : 'intro';
  const track = trackKey ? TRACK_BY_KEY.get(trackKey as 'career') : LEARNING_TRACKS[0];
  if (!track) return null;

  const steps = track.steps
    .filter((step) => step.kind === 'knowledge' || step.kind === 'case')
    .slice(0, 3);

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[12px] font-medium text-[color:var(--ink-5)]">{track.title}推荐阅读</h2>
        <Link
          href={`/learn/${track.key}`}
          className="text-[12px] text-[color:var(--ink-3)] underline-offset-2 hover:text-[color:var(--ink-1)] hover:underline"
        >
          完整专题
        </Link>
      </div>
      <ul className="mt-1 divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
        {steps.map((step) => (
          <li key={step.key}>
            <Link
              href={step.href}
              className="block py-2.5 text-[13px] text-[color:var(--ink-1)] underline-offset-2 hover:underline"
            >
              {step.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
