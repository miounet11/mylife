'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import { todayIsoLocal } from '@/lib/astro/daily-window';
import { lookupAstro } from '@/lib/astro/resolve';
import { currentIsoWeekId, isoWeekIdFromDate } from '@/lib/astro/iso-week';

export default function AstroLookup({ source = 'astro_hub' }: { source?: string }) {
  const [date, setDate] = useState('');
  const [hour, setHour] = useState<string>('');
  const [targetDay, setTargetDay] = useState(todayIsoLocal());
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const h = hour === '' ? null : Number(hour);
    return lookupAstro(date, h);
  }, [date, hour]);

  const onQuery = () => {
    setSubmitted(true);
    if (result?.sun) {
      void trackClientEvent({
        eventName: 'astro_lookup',
        page: '/astro',
        meta: {
          source,
          sign: result.sun.key,
          zone: result.zone?.id,
          hasHour: result.hour != null,
        },
      });
    }
  };

  return (
    <section className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand)]">
            快速查
          </p>
          <h2 className="mt-1 text-[17px] font-bold text-[color:var(--ink-1)]">
            生日 × 流日 → 引擎日运
          </h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[color:var(--ink-4)]">
            定位太阳/48星区/上升，并生成「出生日期 × 目标日」结构匹配页（通书 + 日主，非空泛运势文）。
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="text-[12px] text-[color:var(--ink-4)]">出生日期（公历）</span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setSubmitted(false);
            }}
            className="mt-1 w-full rounded-lg border border-[color:var(--hairline)] px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--ink-3)]"
          />
        </label>
        <label className="block">
          <span className="text-[12px] text-[color:var(--ink-4)]">看哪一天的运势</span>
          <input
            type="date"
            value={targetDay}
            onChange={(e) => {
              setTargetDay(e.target.value);
              setSubmitted(false);
            }}
            className="mt-1 w-full rounded-lg border border-[color:var(--hairline)] px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--ink-3)]"
          />
        </label>
        <label className="block">
          <span className="text-[12px] text-[color:var(--ink-4)]">出生时刻（可选）</span>
          <select
            value={hour}
            onChange={(e) => {
              setHour(e.target.value);
              setSubmitted(false);
            }}
            className="mt-1 w-full rounded-lg border border-[color:var(--hairline)] bg-white px-3 py-2.5 text-[14px] outline-none focus:border-[color:var(--ink-3)]"
          >
            <option value="">暂不填</option>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={String(h)}>
                {String(h).padStart(2, '0')}:00 左右
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            onClick={onQuery}
            className="h-[42px] w-full rounded-lg bg-[color:var(--brand)] px-4 text-[13px] font-semibold text-white"
          >
            查询并匹配
          </button>
        </div>
      </div>

      {submitted && result && (
        <div className="mt-4 space-y-3 border-t border-[color:var(--hairline)] pt-4">
          {result.sun ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href={`/astro/signs/${result.sun.key}`}
                className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 no-underline transition hover:border-[color:var(--brand)]/40"
              >
                <div className="text-[11px] text-[color:var(--ink-5)]">太阳星座</div>
                <div className="mt-1 text-[20px] font-black text-[color:var(--ink-1)]">
                  {result.sun.symbol} {result.sun.zh}
                </div>
                <div className="mt-1 text-[11px] text-[color:var(--ink-4)]">
                  {result.sun.element}象 · {result.sun.modality}
                </div>
              </Link>
              {result.zone ? (
                <Link
                  href={`/astro/zones/${result.zone.id}`}
                  className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 no-underline transition hover:border-[color:var(--brand)]/40"
                >
                  <div className="text-[11px] text-[color:var(--ink-5)]">48 星区</div>
                  <div className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">
                    {result.zone.title}
                  </div>
                  <div className="mt-1 text-[11px] text-[color:var(--ink-4)]">
                    第 {result.zone.index} 区 · {result.zone.start}–{result.zone.end}
                  </div>
                </Link>
              ) : (
                <div className="rounded-xl border border-dashed border-[color:var(--hairline)] p-3 text-[12px] text-[color:var(--ink-5)]">
                  星区未匹配
                </div>
              )}
              {result.risingApprox ? (
                <Link
                  href={`/astro/rising/${result.risingApprox.key}`}
                  className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3 no-underline transition hover:border-[color:var(--brand)]/40"
                >
                  <div className="text-[11px] text-[color:var(--ink-5)]">上升（粗算）</div>
                  <div className="mt-1 text-[16px] font-bold text-[color:var(--ink-1)]">
                    {result.risingApprox.zh}
                  </div>
                  <div className="mt-1 line-clamp-2 text-[11px] text-[color:var(--ink-4)]">
                    {result.risingApprox.firstImpression}
                  </div>
                </Link>
              ) : (
                <div className="rounded-xl border border-dashed border-[color:var(--hairline)] p-3 text-[12px] text-[color:var(--ink-5)]">
                  填写出生时刻可看上升粗算
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-amber-800">日期无法解析，请用 YYYY-MM-DD。</p>
          )}
          <p className="text-[11px] leading-relaxed text-[color:var(--ink-5)]">{result.disclaimer}</p>

          {date && targetDay && result.sun ? (
            <div className="rounded-xl border border-[color:var(--brand)]/25 bg-[color:var(--brand-soft)]/30 p-3">
              <div className="text-[12px] font-bold text-[color:var(--brand-strong)]">引擎日运 / 周运（结构化）</div>
              <div className="mt-2 flex flex-wrap gap-2 text-[12px]">
                <Link
                  href={`/astro/birth/${date}/day/${targetDay}`}
                  className="rounded-full bg-[color:var(--brand)] px-3 py-1.5 font-semibold text-white no-underline"
                >
                  出生×流日 完整匹配
                </Link>
                <Link
                  href={`/astro/birth/${date}/week/${isoWeekIdFromDate(targetDay) || currentIsoWeekId()}`}
                  className="rounded-full bg-[color:var(--brand)]/90 px-3 py-1.5 font-semibold text-white no-underline"
                >
                  个人周运（7日）
                </Link>
                <Link
                  href={`/astro/signs/${result.sun.key}/day/${targetDay}`}
                  className="rounded-full border border-[color:var(--hairline)] bg-white px-3 py-1.5 font-semibold text-[color:var(--ink-2)] no-underline"
                >
                  {result.sun.zh}·当日
                </Link>
                <Link
                  href={`/astro/signs/${result.sun.key}/week/${isoWeekIdFromDate(targetDay) || currentIsoWeekId()}`}
                  className="rounded-full border border-[color:var(--hairline)] bg-white px-3 py-1.5 font-semibold text-[color:var(--ink-2)] no-underline"
                >
                  {result.sun.zh}·本周
                </Link>
                {result.zone ? (
                  <Link
                    href={`/astro/zones/${result.zone.id}/day/${targetDay}`}
                    className="rounded-full border border-[color:var(--hairline)] bg-white px-3 py-1.5 font-semibold text-[color:var(--ink-2)] no-underline"
                  >
                    {result.zone.title}·当日
                  </Link>
                ) : null}
                <Link
                  href={`/astro/day/${targetDay}`}
                  className="rounded-full border border-[color:var(--hairline)] bg-white px-3 py-1.5 font-semibold text-[color:var(--ink-2)] no-underline"
                >
                  全日入口
                </Link>
                <Link
                  href={`/almanac/${targetDay}`}
                  className="rounded-full border border-[color:var(--hairline)] bg-white px-3 py-1.5 font-semibold text-[color:var(--ink-2)] no-underline"
                >
                  当日黄历
                </Link>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 text-[12px]">
            <Link
              href="/tools/zodiac"
              className="text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              写入人生数据底座
            </Link>
            <Link
              href="/world-yi"
              className="text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              对照世界易方法
            </Link>
            <Link
              href="/analyze?source=astro_lookup"
              className="text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              接到结构报告
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
