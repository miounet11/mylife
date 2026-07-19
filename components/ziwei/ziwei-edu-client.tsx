'use client';

import { useMemo, useState } from 'react';
import {
  EARTHLY_BRANCHES,
  HOUR_BRANCH_OPTIONS,
  buildEduZiweiChart,
  type EduZiweiChart,
} from '@/lib/ziwei/edu-chart';

export function ZiweiEduClient({ locale = 'zh-CN' }: { locale?: string }) {
  const en = locale.toLowerCase().startsWith('en');
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(15);
  const [hour, setHour] = useState(0);
  const [yearBranch, setYearBranch] = useState(0);
  const [chart, setChart] = useState<EduZiweiChart | null>(null);

  const copy = useMemo(
    () =>
      en
        ? {
            month: 'Lunar month',
            day: 'Lunar day',
            hour: 'Hour branch',
            year: 'Year branch (ju hint)',
            run: 'Build educational chart',
            ming: 'Life palace',
            shen: 'Body palace',
            ju: 'Element bureau (approx.)',
            ziwei: 'Ziwei star',
            empty: 'Enter lunar month / day / hour, then build.',
            note: 'Structure literacy only — not a full professional chart.',
          }
        : {
            month: '农历月',
            day: '农历日',
            hour: '时辰',
            year: '年支（示意局数）',
            run: '生成教育盘',
            ming: '命宫',
            shen: '身宫',
            ju: '五行局（示意）',
            ziwei: '紫微星',
            empty: '填写农历月、日、时辰后生成。',
            note: '仅结构识读；非完整专业排盘。',
          },
    [en],
  );

  const onRun = () => {
    setChart(
      buildEduZiweiChart({
        lunarMonth: month,
        lunarDay: day,
        hourBranch: hour,
        yearBranch,
      }),
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        <label className="block text-[12px] text-[color:var(--ink-5)]">
          {copy.month}
          <select
            className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px] text-[color:var(--ink-1)]"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12px] text-[color:var(--ink-5)]">
          {copy.day}
          <select
            className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px] text-[color:var(--ink-1)]"
            value={day}
            onChange={(e) => setDay(Number(e.target.value))}
          >
            {Array.from({ length: 30 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12px] text-[color:var(--ink-5)]">
          {copy.hour}
          <select
            className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px] text-[color:var(--ink-1)]"
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
          >
            {HOUR_BRANCH_OPTIONS.map((o) => (
              <option key={o.index} value={o.index}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[12px] text-[color:var(--ink-5)]">
          {copy.year}
          <select
            className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px] text-[color:var(--ink-1)]"
            value={yearBranch}
            onChange={(e) => setYearBranch(Number(e.target.value))}
          >
            {EARTHLY_BRANCHES.map((b, i) => (
              <option key={b} value={i}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={onRun}
        className="inline-flex h-9 items-center rounded-[6px] bg-[color:var(--brand-strong)] px-4 text-[13px] font-semibold text-white hover:opacity-90"
      >
        {copy.run}
      </button>
      <p className="text-[12px] text-[color:var(--ink-5)]">{copy.empty}</p>

      {chart ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 text-[12px] text-[color:var(--ink-3)]">
            <span className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-2.5 py-0.5">
              {copy.ming} · {EARTHLY_BRANCHES[chart.mingBranchIndex]}
            </span>
            <span className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-2.5 py-0.5">
              {copy.shen} · {EARTHLY_BRANCHES[chart.shenBranchIndex]}
            </span>
            <span className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-2.5 py-0.5">
              {copy.ju} · {chart.ju.name}
            </span>
            <span className="rounded-full border border-[color:var(--brand)]/25 bg-[color:var(--brand-soft,rgba(59,89,152,0.06))] px-2.5 py-0.5">
              {copy.ziwei} · {EARTHLY_BRANCHES[chart.ziweiBranchIndex]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {chart.palaces.map((p) => (
              <div
                key={p.name}
                className={`rounded-[8px] border px-2.5 py-2 ${
                  p.isMing
                    ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft,rgba(59,89,152,0.06))]'
                    : 'border-[color:var(--hairline)] bg-[color:var(--paper)]'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[12px] font-semibold text-[color:var(--ink-1)]">{p.name}</span>
                  <span className="font-mono text-[11px] text-[color:var(--ink-5)]">{p.branch}</span>
                </div>
                {p.isShen ? (
                  <div className="mt-0.5 text-[10px] text-[color:var(--ink-4)]">
                    {en ? 'Body' : '身宫'}
                  </div>
                ) : null}
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {p.stars.length ? (
                    p.stars.map((s) => (
                      <span
                        key={s}
                        className="rounded-[4px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-1.5 py-0.5 text-[11px] text-[color:var(--ink-2)]"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-[color:var(--ink-4)]">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-[11px] leading-[1.5] text-[color:var(--ink-5)]">{chart.disclaimer}</p>
          <p className="text-[11px] text-[color:var(--ink-5)]">{copy.note}</p>
        </div>
      ) : null}
    </div>
  );
}
