'use client';

import { useMemo, useState } from 'react';
import {
  EARTHLY_BRANCHES,
  EDU_CITY_LONGITUDES,
  HEAVENLY_STEMS,
  HOUR_BRANCH_OPTIONS,
  buildEduZiweiChart,
  eduInputFromSolarWithTrueSolar,
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
  const [useTrueSolar, setUseTrueSolar] = useState(false);
  const [longitude, setLongitude] = useState<string>('');
  const [cityId, setCityId] = useState<string | null>(null);
  const [chart, setChart] = useState<EduZiweiChart | null>(null);
  const [lunarLabel, setLunarLabel] = useState('');
  const [trueSolarSummary, setTrueSolarSummary] = useState<string>('');
  const [trueSolarSkipped, setTrueSolarSkipped] = useState<string>('');

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
            trueSolar: 'Use true solar time',
            longitude: 'Longitude (°E)',
            longitudeHint: 'Optional; default timezone UTC+8. Empty = skip correction.',
            cityPicks: 'Quick cities',
            trueSolarApplied: 'True solar',
            trueSolarSkip: 'True solar skipped',
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
            trueSolar: '使用真太阳时',
            longitude: '经度（°E）',
            longitudeHint: '可选；默认时区 UTC+8。留空则不修正。',
            cityPicks: '快捷城市',
            trueSolarApplied: '真太阳时',
            trueSolarSkip: '未应用真太阳时',
          },
    [en],
  );

  const pickCity = (id: string, lon: number) => {
    setCityId(id);
    if (Number.isFinite(lon)) {
      setLongitude(String(lon));
      setUseTrueSolar(true);
    } else {
      // overseas / manual
      setLongitude('');
      setUseTrueSolar(true);
    }
  };

  const onRun = () => {
    if (mode === 'solar') {
      const lonNum = longitude.trim() === '' ? undefined : Number(longitude);
      const conv = eduInputFromSolarWithTrueSolar({
        year: solarYear,
        month: solarMonth,
        day: solarDay,
        hour: solarHour,
        longitude: lonNum,
        timezone: 8,
        useTrueSolar,
      });
      setLunarLabel(conv.lunarLabel);
      setTrueSolarSkipped(conv.trueSolarSkipped || '');
      if (conv.trueSolar) {
        const sign = conv.trueSolar.correctionMinutes >= 0 ? '+' : '';
        const clock = `${String(conv.trueSolar.hour).padStart(2, '0')}:${String(conv.trueSolar.minute).padStart(2, '0')}`;
        setTrueSolarSummary(
          `${sign}${conv.trueSolar.correctionMinutes.toFixed(1)} min · ${clock}`,
        );
      } else {
        setTrueSolarSummary('');
      }
      const built = buildEduZiweiChart(conv);
      const solarSource = conv.trueSolar
        ? `${conv.civilLabel} → true solar ${String(conv.trueSolar.hour).padStart(2, '0')}:${String(conv.trueSolar.minute).padStart(2, '0')}`
        : conv.civilLabel;
      setChart({
        ...built,
        source: {
          solar: solarSource,
          lunarLabel: conv.lunarLabel,
        },
      });
      return;
    }
    setLunarLabel('');
    setTrueSolarSummary('');
    setTrueSolarSkipped('');
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
        <div className="space-y-3">
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

          <div className="rounded-[8px] border border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]/30 px-3 py-2.5 space-y-2.5">
            <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[color:var(--ink-2)]">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-[color:var(--hairline)]"
                checked={useTrueSolar}
                onChange={(e) => setUseTrueSolar(e.target.checked)}
              />
              <span className="font-medium">{copy.trueSolar}</span>
            </label>

            {useTrueSolar ? (
              <>
                <div>
                  <div className="mb-1.5 text-[11px] text-[color:var(--ink-5)]">{copy.cityPicks}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {EDU_CITY_LONGITUDES.map((c) => {
                      const active = cityId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => pickCity(c.id, c.longitude)}
                          className={`rounded-full border px-2.5 py-0.5 text-[11px] ${
                            active
                              ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft,rgba(59,89,152,0.08))] text-[color:var(--ink-1)]'
                              : 'border-[color:var(--hairline)] text-[color:var(--ink-3)] hover:border-[color:var(--brand)]/40'
                          }`}
                        >
                          {en ? c.en : c.zh}
                          {Number.isFinite(c.longitude) ? (
                            <span className="ml-1 font-mono text-[10px] text-[color:var(--ink-5)]">
                              {c.longitude}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="block text-[12px] text-[color:var(--ink-5)]">
                  {copy.longitude}
                  <input
                    type="number"
                    step="0.1"
                    className="mt-1 w-full max-w-xs rounded-[6px] border border-[color:var(--hairline)] bg-white px-2 py-1.5 text-[13px] font-mono"
                    value={longitude}
                    placeholder="120"
                    onChange={(e) => {
                      setLongitude(e.target.value);
                      setCityId(null);
                    }}
                  />
                  <span className="mt-1 block text-[11px] text-[color:var(--ink-5)]">
                    {copy.longitudeHint}
                  </span>
                </label>
              </>
            ) : null}
          </div>
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
      {trueSolarSummary ? (
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-[color:var(--brand)]/30 bg-[color:var(--brand-soft,rgba(59,89,152,0.06))] px-2.5 py-0.5 text-[12px] text-[color:var(--ink-2)]">
            {copy.trueSolarApplied} · {trueSolarSummary}
          </span>
        </div>
      ) : null}
      {trueSolarSkipped ? (
        <p className="text-[11px] text-[color:var(--ink-5)]">
          {copy.trueSolarSkip}：{trueSolarSkipped}
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
