'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { trackProductEvent } from '@/lib/product-analytics';
import { pickWeeklyCalibrationItems, type WeeklyCalibrationInput } from '@/lib/weekly-calibration';

/**
 * Weekly right/wrong: mark logged events that already passed.
 * Mirrors /api/events PATCH used by the events hub.
 */
export default function ProWeeklyLoop({
  reportId,
  events,
}: {
  reportId: string;
  events: WeeklyCalibrationInput[];
}) {
  const initial = useMemo(() => pickWeeklyCalibrationItems(events), [events]);
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState('');

  if (!items.length) return null;

  const mark = async (id: string, wasAccurate: boolean) => {
    if (busyId) return;
    setBusyId(id);
    setNote('');
    const feedback = {
      wasAccurate,
      userNotes: wasAccurate ? '周回访：准了' : '周回访：偏了',
      answeredAt: new Date().toISOString(),
    };
    setItems((prev) => prev.filter((x) => x.id !== id));
    trackProductEvent('events_feedback', {
      id,
      reportId,
      source: 'weekly_loop',
      wasAccurate: wasAccurate ? 'true' : 'false',
    });
    try {
      await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, userFeedback: feedback }),
      });
    } catch {
      setNote('网络不稳，已记在本页；稍后可到事件本再标一次。');
    } finally {
      setBusyId(null);
    }
  };

  if (!items.length) {
    return note ? (
      <p className="text-[12px] text-[color:var(--ink-5)]">{note}</p>
    ) : null;
  }

  return (
    <section
      id="pro-weekly-loop"
      className="scroll-mt-header border-y border-[color:var(--hairline)] py-4"
    >
      <div className="text-[11px] font-medium text-[color:var(--ink-5)]">本周回访</div>
      <h2 className="mt-0.5 text-[14px] font-semibold text-[color:var(--ink-1)]">
        你记过这些节点，后来准了吗？
      </h2>
      <ul className="mt-3 space-y-2.5">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[color:var(--ink-1)]">{item.title}</div>
              <div className="mt-0.5 text-[11px] text-[color:var(--ink-5)]">
                {item.date} · {item.daysAgo} 天前
              </div>
            </div>
            <div className="flex shrink-0 gap-3 text-[13px]">
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void mark(item.id, true)}
                className="text-[color:var(--brand-strong)] underline-offset-2 hover:underline disabled:opacity-50"
              >
                准了
              </button>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => void mark(item.id, false)}
                className="text-[color:var(--ink-3)] underline-offset-2 hover:underline disabled:opacity-50"
              >
                偏了
              </button>
            </div>
          </li>
        ))}
      </ul>
      {note ? <p className="mt-2 text-[12px] text-[color:var(--ink-5)]">{note}</p> : null}
      <p className="mt-2 text-[12px] text-[color:var(--ink-5)]">
        标完下一轮对话会按你的回访校准，不再空谈。
        <Link
          href={`/events?reportId=${encodeURIComponent(reportId)}`}
          className="ml-2 underline-offset-2 hover:underline"
        >
          打开事件本
        </Link>
      </p>
    </section>
  );
}
