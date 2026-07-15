'use client';

import { useMemo, useState } from 'react';
import {
  TIMING_EVENT_LABELS,
  buildTimingWindow,
  type TimingEventType,
} from '@/lib/timing-window';

const EVENTS = Object.keys(TIMING_EVENT_LABELS) as TimingEventType[];

export default function TimingWindowPanel({
  yongShen = [],
  xiShen = [],
  jiShen = [],
}: {
  yongShen?: string[];
  xiShen?: string[];
  jiShen?: string[];
}) {
  const [eventType, setEventType] = useState<TimingEventType>('general');
  const pack = useMemo(
    () =>
      buildTimingWindow({
        yongShen,
        xiShen,
        jiShen,
        eventType,
        days: 90,
      }),
    [yongShen, xiShen, jiShen, eventType]
  );

  return (
    <section className="rounded-[12px] border border-[#0f172a] bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-bold text-[#0f172a]">择日 2.0 · 90 天窗口</h2>
          <p className="mt-0.5 text-[11px] text-[#64748b]">
            用神 {yongShen.join('、') || '—'} · 忌 {jiShen.join('、') || '—'}
          </p>
        </div>
        <select
          className="rounded-[8px] border border-[#e2e8f0] px-2 py-1.5 text-[12px]"
          value={eventType}
          onChange={(e) => setEventType(e.target.value as TimingEventType)}
        >
          {EVENTS.map((k) => (
            <option key={k} value={k}>
              {TIMING_EVENT_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <DayList title="推荐吉日 Top10" items={pack.best} tone="good" />
        <DayList title="宜避开" items={pack.avoid} tone="risk" />
      </div>

      <ul className="mt-3 space-y-1">
        {pack.tips.map((t) => (
          <li key={t} className="text-[11px] text-[#475569]">
            · {t}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-[#94a3b8]">{pack.disclaimer}</p>
    </section>
  );
}

function DayList({
  title,
  items,
  tone,
}: {
  title: string;
  items: Array<{ date: string; ganZhi: string; score: number; label: string; reason: string }>;
  tone: 'good' | 'risk';
}) {
  return (
    <div
      className={`rounded-[8px] border p-3 ${
        tone === 'good' ? 'border-[#bbf7d0] bg-[#f0fdf4]' : 'border-[#fecaca] bg-[#fef2f2]'
      }`}
    >
      <div className={`text-[12px] font-bold ${tone === 'good' ? 'text-[#047857]' : 'text-[#b91c1c]'}`}>
        {title}
      </div>
      <ul className="mt-2 max-h-64 space-y-1.5 overflow-y-auto">
        {items.map((d) => (
          <li key={d.date} className="text-[11px] leading-[1.45] text-[#334155]">
            <span className="font-mono font-semibold">{d.date}</span> {d.ganZhi} · {d.label} · {d.score}分
            <span className="block text-[#64748b]">{d.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
