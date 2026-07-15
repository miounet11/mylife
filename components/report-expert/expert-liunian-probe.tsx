'use client';

import { useMemo, useState } from 'react';
import { probeLiunianYear } from '@/lib/bazi-pro-tools';

export default function ExpertLiunianProbe({
  dayMaster,
  dayPillarGanZhi,
  currentDayunGanZhi,
  yongShen,
  jiShen,
  birthYear,
}: {
  dayMaster: string;
  dayPillarGanZhi: string;
  currentDayunGanZhi: string;
  yongShen: string[];
  jiShen: string[];
  birthYear: number;
}) {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);

  const probe = useMemo(
    () =>
      probeLiunianYear({
        year,
        dayMaster,
        dayPillarGanZhi,
        currentDayunGanZhi,
        yongShen,
        jiShen,
      }),
    [year, dayMaster, dayPillarGanZhi, currentDayunGanZhi, yongShen, jiShen]
  );

  const minY = Math.max(1900, birthYear - 1);
  const maxY = thisYear + 40;

  return (
    <section id="ex-probe" className="scroll-mt-header rounded-[10px] border border-[#0f172a] bg-white p-4 md:p-5">
      <h2 className="text-[14px] font-bold text-[#0f172a] md:text-[15px]">⑬ 自选流年点盘</h2>
      <p className="mt-1 text-[11px] text-[#64748b]">
        任选公历年，查看年柱干支、日主十二长生、是否落空亡、与现行大运关系（年柱按立春近似用公历年，精细交节请自核）。
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-[12px] font-semibold text-[#334155]">
          公历年
          <input
            type="number"
            min={minY}
            max={maxY}
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || thisYear)}
            className="mt-1 block w-28 rounded-[8px] border border-[#cbd5e1] px-3 py-2 font-mono text-[14px] outline-none focus:border-[#0f172a]"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {[thisYear - 1, thisYear, thisYear + 1, thisYear + 2, thisYear + 5, thisYear + 10].map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(y)}
              className={`h-9 rounded-[8px] border px-2.5 text-[12px] font-semibold ${
                year === y
                  ? 'border-[#0f172a] bg-[#0f172a] text-white'
                  : 'border-[#e2e8f0] bg-white text-[#475569] hover:border-[#0f172a]'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ProbeTile label="流年干支" value={probe.ganZhi} large />
        <ProbeTile label="日主长生" value={probe.dayMasterChangSheng} />
        <ProbeTile label="空亡" value={probe.isKongWang ? '是 · 落空' : '否'} warn={probe.isKongWang} />
        <ProbeTile label="与大运" value={probe.vsDayun} />
      </div>

      <ul className="mt-4 space-y-1.5 rounded-[8px] bg-[#f8fafc] px-3 py-3">
        {probe.notes.map((n) => (
          <li key={n} className="text-[12px] leading-[1.55] text-[#334155]">
            · {n}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProbeTile({
  label,
  value,
  large,
  warn,
}: {
  label: string;
  value: string;
  large?: boolean;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-[8px] border px-3 py-2.5 ${
        warn ? 'border-[#fca5a5] bg-[#fef2f2]' : 'border-[#e2e8f0] bg-[#f8fafc]'
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">{label}</div>
      <div
        className={`mt-1 font-bold ${large ? 'font-serif text-[24px]' : 'text-[15px]'} ${
          warn ? 'text-[#b91c1c]' : 'text-[#0f172a]'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
