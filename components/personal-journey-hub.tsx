'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Wrench } from 'lucide-react';
import { LEARNING_TRACKS } from '@/lib/learning-tracks';
import { readPersonalJourney, type JourneyEntry } from '@/lib/personal-journey';

const DEFAULT_TRACKS = LEARNING_TRACKS.slice(1, 4);

export default function PersonalJourneyHub({
  title,
  description,
}: {
  title?: string;
  description?: string;
  page?: string;
}) {
  const [journey, setJourney] = useState<JourneyEntry[]>([]);

  useEffect(() => {
    setJourney(readPersonalJourney());
  }, []);

  return (
    <section className="fb-card p-4">
      <h2 className="text-base font-bold text-[color:var(--ink-1)]">{title}</h2>
      {description ? <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">{description}</p> : null}

      {journey.length ? (
        <div className="mt-3 space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink-4)]">最近路径</div>
          {journey.map((entry) => (
            <Link
              key={entry.href}
              href={entry.href}
              className="block rounded-[var(--radius-sm)] border border-[color:var(--hairline)] px-3 py-2 text-[12px] font-semibold text-[color:var(--ink-2)] hover:border-[color:var(--brand-soft-2)] hover:no-underline"
            >
              {entry.title}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--ink-4)]">推荐学习轨</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {DEFAULT_TRACKS.map((track) => (
            <Link
              key={track.key}
              href={`/learn/${track.key}`}
              className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-3 hover:border-[color:var(--brand)] hover:no-underline"
            >
              <BookOpen className="h-3.5 w-3.5 text-[color:var(--brand)]" />
              <div className="mt-1.5 text-[12px] font-bold text-[color:var(--ink-1)]">{track.title}</div>
              <p className="mt-0.5 text-[11px] text-[color:var(--ink-4)]">{track.subtitle}</p>
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/tools"
        className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[color:var(--brand)] hover:no-underline"
      >
        <Wrench className="h-3.5 w-3.5" />
        浏览工具中心
      </Link>
    </section>
  );
}