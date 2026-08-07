'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AlmanacDayPanel from '@/components/almanac/almanac-day-panel';
import AlmanacLensPanel from '@/components/almanac/almanac-lens-panel';
import { LightBirthBridge } from '@/components/conversion/light-birth-bridge';
import type { AlmanacDayPack, AlmanacMonthCell, PersonalDayOverlay } from '@/lib/almanac/types';
import { trackProductEvent } from '@/lib/product-analytics';

type MonthPayload = {
  success: boolean;
  year: number;
  month: number;
  cells: AlmanacMonthCell[];
  selected: AlmanacDayPack | null;
  personal: PersonalDayOverlay | null;
  chart?: { dayMaster?: string; yongShen?: string[]; source?: string } | null;
};

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default function AlmanacApp({
  initialYear,
  initialMonth,
  initialDate,
  /** When true, day clicks navigate to /almanac/YYYY-MM-DD (SEO URLs) */
  navigateOnSelect = true,
}: {
  initialYear: number;
  initialMonth: number;
  initialDate: string;
  navigateOnSelect?: boolean;
}) {
  const router = useRouter();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [cells, setCells] = useState<AlmanacMonthCell[]>([]);
  const [pack, setPack] = useState<AlmanacDayPack | null>(null);
  const [personal, setPersonal] = useState<PersonalDayOverlay | null>(null);
  const [chartSource, setChartSource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (y: number, m: number, date: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `/api/almanac?year=${y}&month=${m}&date=${encodeURIComponent(date)}`,
        { cache: 'no-store' },
      );
      const data = (await res.json()) as MonthPayload;
      if (!res.ok || !data.success) {
        setError('加载万年历失败，请稍后重试');
        return;
      }
      setCells(data.cells || []);
      setPack(data.selected);
      setPersonal(data.personal);
      setChartSource(data.chart?.source || '');
      setYear(data.year);
      setMonth(data.month);
      setSelectedDate(date);
    } catch {
      setError('网络异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(initialYear, initialMonth, initialDate);
    trackProductEvent('almanac_page_viewed', {
      year: initialYear,
      month: initialMonth,
      date: initialDate,
    });
  }, [initialYear, initialMonth, initialDate, load]);

  const onSelect = (date: string, inMonth: boolean) => {
    trackProductEvent('almanac_day_selected', { date });
    if (navigateOnSelect) {
      router.push(`/almanac/${date}`);
      return;
    }
    setSelectedDate(date);
    if (!inMonth) {
      const [y, m] = date.split('-').map(Number);
      setYear(y);
      setMonth(m);
      void load(y, m, date);
    } else {
      void load(year, month, date);
    }
  };

  const onNav = (delta: number) => {
    const next = shiftMonth(year, month, delta);
    const date = `${next.year}-${String(next.month).padStart(2, '0')}-01`;
    if (navigateOnSelect) {
      router.push(`/almanac/${date}`);
      return;
    }
    setYear(next.year);
    setMonth(next.month);
    setSelectedDate(date);
    void load(next.year, next.month, date);
  };

  const monthLabel = useMemo(() => `${year}年${month}月`, [year, month]);
  const hasChart = Boolean(personal);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[color:var(--hairline)] bg-white p-3 md:p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onNav(-1)}
            className="h-9 rounded-full border border-[color:var(--hairline)] px-3 text-[12px] font-semibold text-[color:var(--ink-2)]"
          >
            上月
          </button>
          <h2 className="text-[16px] font-bold text-[color:var(--ink-1)]">{monthLabel}</h2>
          <button
            type="button"
            onClick={() => onNav(1)}
            className="h-9 rounded-full border border-[color:var(--hairline)] px-3 text-[12px] font-semibold text-[color:var(--ink-2)]"
          >
            下月
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[color:var(--ink-5)]">
          {WEEK.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        {loading && !cells.length ? (
          <p className="py-8 text-center text-[13px] text-[color:var(--ink-4)]">加载日历…</p>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const selected = cell.date === selectedDate;
              return (
                <button
                  key={cell.date + String(cell.inMonth)}
                  type="button"
                  onClick={() => onSelect(cell.date, cell.inMonth)}
                  className={`min-h-[68px] rounded-xl border p-1.5 text-left transition ${
                    selected
                      ? 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] shadow-sm'
                      : 'border-[color:var(--hairline)] bg-[color:var(--paper)] hover:border-[color:var(--brand)]/50'
                  } ${cell.inMonth ? '' : 'opacity-40'}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[14px] font-bold ${
                        cell.isToday ? 'text-[color:var(--brand)]' : 'text-[color:var(--ink-1)]'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {cell.hasJieQi ? (
                      <span className="rounded bg-[color:var(--brand)]/10 px-1 text-[9px] font-bold text-[color:var(--brand-strong)]">
                        节
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-[color:var(--ink-5)]">
                    {cell.dayGanZhi}
                  </div>
                  <div className="truncate text-[9px] text-[color:var(--ink-4)]">
                    {cell.yiPreview || '—'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {error ? <p className="mt-2 text-[12px] text-amber-800">{error}</p> : null}
        <p className="mt-2 text-[11px] text-[color:var(--ink-5)]">
          点击日期打开独立页（可分享 SEO 地址）
        </p>
      </section>

      {!hasChart ? (
        <LightBirthBridge
          source="almanac"
          page={`/almanac/${selectedDate}`}
          title="绑定生辰，解锁「我的每日黄历」"
          description="像星座日运一样每天可回看：日主叠流日、匹配星级、较顺时辰，以及 AI 固定镜头解读。"
        />
      ) : (
        <p className="text-[12px] text-[color:var(--ink-4)]">
          已接入命盘（{chartSource || 'engine'}）· 日主 {personal?.dayMaster}
          {personal?.yongShen?.length ? ` · 用神 ${personal.yongShen.join('')}` : ''}。
          <Link
            href="/profile/foundation?source=almanac"
            className="ml-1 text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            完善底座
          </Link>
        </p>
      )}

      {pack ? (
        <>
          <AlmanacDayPanel pack={pack} personal={personal} showCanonical />
          <AlmanacLensPanel date={pack.date} hasChart={hasChart} />
        </>
      ) : null}

      <section className="rounded-xl border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
        <strong className="text-[color:var(--ink-2)]">每日回看建议</strong>
        {' — '}
        早晨打开「今日」看总览镜头；晚间用事件日历记一件验证。通书是天气，结构是你的船。
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href="/almanac" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            回到今日
          </Link>
          <Link
            href="/dimensions/timing-selection"
            className="text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            择时办事
          </Link>
          <Link
            href="/analyze?source=almanac"
            className="text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            完整报告
          </Link>
        </div>
      </section>
    </div>
  );
}
