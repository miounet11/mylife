'use client';

import { useMemo, useState } from 'react';
import {
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  HOUR_BRANCH_OPTIONS,
  buildEduZiweiChart,
  eduInputFromSolar,
  type EduZiweiChart,
} from '@/lib/ziwei/edu-chart';

export function ZiweiEduClient({ locale = 'zh-CN' }: { locale?: string }) {
  const en = locale.toLowerCase().startsWith('en');
  const [mode, setMode] = useState<'lunar' | 'solar'>('solar');
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(15);
  const [hour, setHour] = useState(0);
  const [yearBranch, setYearBranch] = useState(0);
  const [yearStem, setYearStem] = useState(0);
  const [solarYear, setSolarYear] = useState(1990);
  const [solarMonth, setSolarMonth] = useState(5);
  const [solarDay, setSolarDay] = useState(15);
  const [solarHour, setSolarHour] = useState(12);
  const [chart, setChart] = useState<EduZiweiChart | null>(null);
  const [lunarLabel, setLunarLabel] = useState('');

  const copy = useMemo(
    () =>
      en
        ? {
            modeSolar: 'Solar date',
            modeLunar: 'Lunar fields',
            month: 'Lunar month',
            day: 'Lunar day',
            hour: 'Hour branch',
            yearB: 'Year branch (ju)',
            yearS: 'Year stem (sihua)',
            solarY: 'Year',
            solarM: 'Month',
            solarD: 'Day',
            solarH: 'Hour (0–23)',
            run: 'Build educational chart',
            ming: 'Life palace',
            shen: 'Body palace',
            ju: 'Bureau (approx.)',
            ziwei: 'Ziwei',
            sihua: 'Year sihua',
            empty: 'Fill birth fields, then build.',
            note: 'Structure literacy only — not a full professional chart.',
            converted: 'Converted lunar',
          }
        : {
            modeSolar: '公历输入',
            modeLunar: '农历字段',
            month: '农历月',
            day: '农历日',
            hour: '时辰',
            yearB: '年支（示意局）',
            yearS: '年干（生年四化）',
            solarY: '年',
            solarM: '月',
            solarD: '日',
            solarH: '时 (0–23)',
            run: '生成教育盘',
            ming: '命宫',
            shen: '身宫',
            ju: '五行局（示意）',
            ziwei: '紫微星',
            sihua: '生年四化',
            empty: '填写出生信息后生成。',
            note: '仅结构识读；非完整专业排盘。',
            converted: '换算农历',
          },
    [en],
  );

  const onRun = () => {
    if (mode === 'solar') {
      const conv = eduInputFromSolar({
        year: solarYear,
        month: solarMonth,
        day: solarDay,
        hour: solarHour,
      });
      setLunarLabel(conv.lunarLabel);
      const built = buildEduZiweiChart(conv);
      setChart({
        ...built,
        source: {
          solar: `${solarYear}-${solarMonth}-${solarDay} ${solarHour}:00`,
          lunarLabel: conv.lunarLabel,
        },
      });
      return;
    }
    setLunarLabel('');
    setChart(
      buildEduZiweiChart({
        lunarMonth: month,
        lunarDay: day,
        hourBranch: hour,
        yearBranch,
        yearStem,
      }),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('solar')}
          className={`rounded-full border px-3 py-1 text-[12px] ${
            mode === 'solar'
              ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft,rgba(59,89,152,0.08))] text-[color:var(--ink-1)]'
              : 'border-[color:var(--hairline)] text-[color:var(--ink-3)]'
          }`}
        >
          {copy.modeSolar}
        </button>
        <button
          type="button"
          onClick={() => setMode('lunar')}
          className={`rounded-full border px-3 py-1 text-[12px] ${
            mode === 'lunar'
              ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft,rgba(59,89,152,0.08))] text-[color:var(--ink-1)]'
              : 'border-[color:var(--hairline)] text-[color:var(--ink-3)]'
          }`}
        >
          {copy.modeLunar}
        </button>
      </div>

      {mode === 'solar' ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <label className="block text-[12px] text-[color:var(--ink-5)]">
            {copy.solarY}
            <input
              type="number"
              className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px]"
              value={solarYear}
              min={1920}
              max={2035}
              onChange={(e) => setSolarYear(Number(e.target.value))}
            />
          </label>
          <label className="block text-[12px] text-[color:var(--ink-5)]">
            {copy.solarM}
            <input
              type="number"
              className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px]"
              value={solarMonth}
              min={1}
              max={12}
              onChange={(e) => setSolarMonth(Number(e.target.value))}
            />
          </label>
          <label className="block text-[12px] text-[color:var(--ink-5)]">
            {copy.solarD}
            <input
              type="number"
              className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px]"
              value={solarDay}
              min={1}
              max={31}
              onChange={(e) => setSolarDay(Number(e.target.value))}
            />
          </label>
          <label className="block text-[12px] text-[color:var(--ink-5)]">
            {copy.solarH}
            <input
              type="number"
              className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px]"
              value={solarHour}
              min={0}
              max={23}
              onChange={(e) => setSolarHour(Number(e.target.value))}
            />
          </label>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <label className="block text-[12px] text-[color:var(--ink-5)]">
            {copy.month}
            <select
              className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px]"
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
              className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px]"
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
              className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px]"
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
            {copy.yearS}
            <select
              className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px]"
              value={yearStem}
              onChange={(e) => setYearStem(Number(e.target.value))}
            >
              {HEAVENLY_STEMS.map((s, i) => (
                <option key={s} value={i}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] text-[color:var(--ink-5)]">
            {copy.yearB}
            <select
              className="mt-1 w-full rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px]"
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
      )}

      <button
        type="button"
        onClick={onRun}
        className="inline-flex h-9 items-center rounded-[6px] bg-[color:var(--brand-strong)] px-4 text-[13px] font-semibold text-white hover:opacity-90"
      >
        {copy.run}
      </button>
      <p className="text-[12px] text-[color:var(--ink-5)]">{copy.empty}</p>
      {lunarLabel ? (
        <p className="text-[12px] text-[color:var(--ink-3)]">
          {copy.converted}：{lunarLabel}
        </p>
      ) : null}

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
            {chart.yearStemLabel ? (
              <span className="rounded-full border border-[color:var(--hairline)] px-2.5 py-0.5">
                {chart.yearStemLabel}
                {en ? ' year stem' : '年干'}
              </span>
            ) : null}
          </div>

          {chart.sihua?.length ? (
            <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2">
              <div className="text-[11px] font-medium text-[color:var(--ink-5)]">{copy.sihua}</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {chart.sihua.map((s) => (
                  <span
                    key={s.kind}
                    className="rounded-[4px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-2 py-0.5 text-[12px] text-[color:var(--ink-2)]"
                  >
                    {s.star}
                    {s.kind}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

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
                        key={s.name}
                        className="rounded-[4px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/50 px-1.5 py-0.5 text-[11px] text-[color:var(--ink-2)]"
                      >
                        {s.name}
                        {s.sihua ? (
                          <span className="ml-0.5 text-[10px] text-[color:var(--brand-strong,#3b5998)]">
                            {s.sihua}
                          </span>
                        ) : null}
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
