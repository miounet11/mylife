'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { EventTransportRecord } from '@/lib/event-view';

export default function ImportantEvents(props: {
  events?: EventTransportRecord[] | ReturnType<typeof import('@/lib/event-view').toEventViewModels>;
  source?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  const events = props.events || [];
  if (!events.length) {
    return (
      <section className="fb-card p-4">
        <h2 className="text-base font-bold text-[color:var(--ink-1)]">关键事件</h2>
        <p className="mt-2 text-[13px] text-[color:var(--ink-3)]">还没有记录验证事件。</p>
        <Link href="/events" className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[color:var(--brand)] hover:no-underline">
          去事件日历 <ArrowRight className="h-3 w-3" />
        </Link>
      </section>
    );
  }

  return (
    <section className="fb-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-[color:var(--ink-1)]">关键事件</h2>
        <span className="text-[11px] font-semibold text-[color:var(--ink-4)]">{events.length} 条</span>
      </div>
      <ul className="mt-3 space-y-2">
        {events.slice(0, 5).map((event, index) => {
          const item = event as { id?: string; title?: string; date?: string; status?: string };
          return (
            <li
              key={item.id || index}
              className="rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] px-3 py-2"
            >
              <div className="text-[13px] font-semibold text-[color:var(--ink-2)]">
                {item.title || '事件'}
              </div>
              <div className="mt-0.5 text-[11px] text-[color:var(--ink-4)]">
                {item.date || '日期待定'} · {item.status || '待验证'}
              </div>
            </li>
          );
        })}
      </ul>
      <Link href="/events" className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[color:var(--brand)] hover:no-underline">
        查看全部 <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}