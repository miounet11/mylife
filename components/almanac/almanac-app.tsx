'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AlmanacLensPanel from '@/components/almanac/almanac-lens-panel';
import AlmanacSkinViews from '@/components/almanac/almanac-skin-views';
import { LightBirthBridge } from '@/components/conversion/light-birth-bridge';
import type { AlmanacDayPack, AlmanacMonthCell, PersonalDayOverlay } from '@/lib/almanac/types';
import { ALMANAC_REGIONS, getAlmanacRegion, type AlmanacRegionId } from '@/lib/almanac/regions';
import { ALMANAC_SKINS, getAlmanacSkin, type AlmanacSkinId } from '@/lib/almanac/skins';
import { almanacUiCopy } from '@/lib/i18n/almanac-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';
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

const SKIN_KEY = 'lk_almanac_skin_v2';
const REGION_KEY = 'lk_almanac_region_v1';

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export default function AlmanacApp({
  initialYear,
  initialMonth,
  initialDate,
  navigateOnSelect = true,
  initialSkin,
  initialRegion,
  locale = 'zh-CN',
  /** When false, only month grid + controls (no day sheet). */
  showDayDetail = true,
  /** Day page already SSR-renders tear sheet; hide client tear to avoid double. */
  suppressDefaultTear = false,
}: {
  initialYear: number;
  initialMonth: number;
  initialDate: string;
  navigateOnSelect?: boolean;
  initialSkin?: string;
  initialRegion?: string;
  locale?: SiteLocale;
  showDayDetail?: boolean;
  suppressDefaultTear?: boolean;
}) {
  const router = useRouter();
  const copy = useMemo(() => almanacUiCopy(locale), [locale]);
  const weekChars = copy.weekdays.split('');
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [cells, setCells] = useState<AlmanacMonthCell[]>([]);
  const [pack, setPack] = useState<AlmanacDayPack | null>(null);
  const [personal, setPersonal] = useState<PersonalDayOverlay | null>(null);
  const [chartSource, setChartSource] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [skinId, setSkinId] = useState<AlmanacSkinId>(
    (getAlmanacSkin(initialSkin || 'tear').id as AlmanacSkinId) || 'tear',
  );
  const [regionId, setRegionId] = useState<AlmanacRegionId>(
    (getAlmanacRegion(initialRegion).id as AlmanacRegionId) || 'cn',
  );

  useEffect(() => {
    try {
      const s = localStorage.getItem(SKIN_KEY) as AlmanacSkinId | null;
      const r = localStorage.getItem(REGION_KEY) as AlmanacRegionId | null;
      if (s && ALMANAC_SKINS.some((x) => x.id === s) && !initialSkin) setSkinId(s);
      if (r && ALMANAC_REGIONS.some((x) => x.id === r) && !initialRegion) setRegionId(r);
    } catch {
      // ignore
    }
  }, [initialSkin, initialRegion]);

  const region = useMemo(() => getAlmanacRegion(regionId), [regionId]);
  const skin = useMemo(() => getAlmanacSkin(skinId), [skinId]);
  const traditional = skinId === 'tear';

  const load = useCallback(
    async (y: number, m: number, date: string) => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `/api/almanac?year=${y}&month=${m}&date=${encodeURIComponent(date)}`,
          { cache: 'no-store' },
        );
        const data = (await res.json()) as MonthPayload;
        if (!res.ok || !data.success) {
          setError(copy.loadFail);
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
        setError(copy.networkFail);
      } finally {
        setLoading(false);
      }
    },
    [copy.loadFail, copy.networkFail],
  );

  useEffect(() => {
    void load(initialYear, initialMonth, initialDate);
    trackProductEvent('almanac_page_viewed', {
      year: initialYear,
      month: initialMonth,
      date: initialDate,
      skin: skinId,
      region: regionId,
    });
  }, [initialYear, initialMonth, initialDate, load]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSelect = (date: string, inMonth: boolean) => {
    trackProductEvent('almanac_day_selected', { date, skin: skinId, region: regionId });
    if (navigateOnSelect) {
      router.push(`/almanac/${date}?skin=${skinId}&region=${regionId}`);
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
      router.push(`/almanac/${date}?skin=${skinId}&region=${regionId}`);
      return;
    }
    setYear(next.year);
    setMonth(next.month);
    setSelectedDate(date);
    void load(next.year, next.month, date);
  };

  const changeSkin = (id: AlmanacSkinId) => {
    setSkinId(id);
    try {
      localStorage.setItem(SKIN_KEY, id);
    } catch {
      // ignore
    }
    trackProductEvent('almanac_skin_changed', { skin: id, region: regionId });
  };

  const changeRegion = (id: AlmanacRegionId) => {
    setRegionId(id);
    try {
      localStorage.setItem(REGION_KEY, id);
    } catch {
      // ignore
    }
    trackProductEvent('almanac_region_changed', { region: id, skin: skinId });
  };

  const monthLabel = useMemo(() => copy.monthLabel(year, month), [copy, year, month]);
  const hasChart = Boolean(personal);

  const shell = traditional
    ? 'border-[#8b4513]/30 bg-[#faf6eb] shadow-[0_4px_20px_rgba(80,40,20,0.08)]'
    : 'border-[color:var(--hairline)] bg-white shadow-sm';
  const ink = traditional ? 'text-[#1c1410]' : 'text-[color:var(--ink-1)]';
  const muted = traditional ? 'text-[#5c4a3a]' : 'text-[color:var(--ink-5)]';
  const accent = traditional ? 'text-[#9b1b1b]' : 'text-[color:var(--brand)]';
  const accentBg = traditional ? 'bg-[#9b1b1b] text-[#faf6eb]' : 'bg-[color:var(--brand)] text-white';
  const softBg = traditional ? 'bg-[#f3e2d8]' : 'bg-[color:var(--brand-soft)]';
  const hair = traditional ? 'border-[#c4a574]/50' : 'border-[color:var(--hairline)]';
  const serif = traditional
    ? { fontFamily: '"Songti SC","Noto Serif SC","Source Han Serif SC","STSong",serif' }
    : undefined;

  return (
    <div className="space-y-4" style={serif}>
      {/* 紧凑工具条：展示 + 地区 */}
      <section className={`rounded-sm border-2 ${shell} p-3 sm:p-3.5`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[11px] font-bold tracking-[0.14em] ${accent}`}>{copy.skinTitle}</span>
          <div className="flex flex-wrap gap-1">
            {ALMANAC_SKINS.map((s) => {
              const on = s.id === skinId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => changeSkin(s.id)}
                  className={`rounded-sm border px-2.5 py-1 text-[11px] font-semibold transition ${
                    on
                      ? accentBg + ' border-transparent'
                      : traditional
                        ? 'border-[#c4a574]/60 bg-[#fffdf7] text-[#5c4a3a] hover:border-[#9b1b1b]'
                        : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)] hover:border-[color:var(--brand)]'
                  }`}
                >
                  {locale === 'en' ? s.labelEn : s.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className={`mt-2.5 flex flex-wrap items-center gap-2 border-t pt-2.5 ${hair}`}>
          <span className={`text-[11px] font-bold tracking-[0.14em] ${accent}`}>{copy.regionTitle}</span>
          <div className="flex flex-wrap gap-1">
            {ALMANAC_REGIONS.map((r) => {
              const on = r.id === regionId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => changeRegion(r.id)}
                  className={`rounded-sm border px-2 py-0.5 text-[11px] font-semibold transition ${
                    on
                      ? traditional
                        ? 'border-[#9b1b1b] bg-[#f3e2d8] text-[#9b1b1b]'
                        : 'border-[color:var(--brand)] bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
                      : traditional
                        ? 'border-transparent text-[#5c4a3a] hover:bg-[#fffdf7]'
                        : 'border-transparent text-[color:var(--ink-4)] hover:bg-[color:var(--bg-sunken)]'
                  }`}
                >
                  <span className="opacity-70">{r.flag}</span> {locale === 'en' ? r.labelEn : r.label}
                </button>
              );
            })}
          </div>
        </div>
        <p className={`mt-2 text-[11px] leading-relaxed ${muted}`}>
          {locale === 'en' ? region.blurbEn : region.blurb}
          {' · '}
          {copy.current}：{locale === 'en' ? skin.labelEn : skin.label}
        </p>
      </section>

      {/* 主舞台：当日通书（先看日，再选月） */}
      {showDayDetail && !(suppressDefaultTear && skinId === 'tear') ? (
        loading && !pack ? (
          <p className={`py-10 text-center text-[13px] ${muted}`}>{copy.loading}</p>
        ) : pack ? (
          <AlmanacSkinViews
            skin={skinId}
            pack={pack}
            personal={personal}
            region={region}
            locale={locale}
          />
        ) : null
      ) : null}
      {error ? <p className="text-[12px] text-amber-900">{error}</p> : null}

      {showDayDetail && !hasChart ? (
        <LightBirthBridge
          source="almanac"
          page={`/almanac/${selectedDate}`}
          title={copy.bindTitle}
          description={copy.bindDesc}
        />
      ) : hasChart ? (
        <p className={`text-[12px] ${muted}`}>
          {copy.chartLinked(
            chartSource || 'engine',
            personal?.dayMaster || '',
            personal?.yongShen?.join('') || '',
          )}
          <Link
            href="/profile/foundation?source=almanac"
            className={`ml-1 underline-offset-2 hover:underline ${accent}`}
          >
            {copy.foundation}
          </Link>
        </p>
      ) : null}

      {/* 月历选日 — 传统格 */}
      <section className={`rounded-sm border-2 ${shell} p-3 md:p-4`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onNav(-1)}
            className={`h-9 min-w-[4.5rem] rounded-sm border px-3 text-[12px] font-semibold ${
              traditional
                ? 'border-[#c4a574]/70 bg-[#fffdf7] text-[#5c4a3a]'
                : 'border-[color:var(--hairline)] text-[color:var(--ink-2)]'
            }`}
          >
            {copy.prevMonth}
          </button>
          <h2 className={`text-[17px] font-bold tracking-wide ${ink}`}>{monthLabel}</h2>
          <button
            type="button"
            onClick={() => onNav(1)}
            className={`h-9 min-w-[4.5rem] rounded-sm border px-3 text-[12px] font-semibold ${
              traditional
                ? 'border-[#c4a574]/70 bg-[#fffdf7] text-[#5c4a3a]'
                : 'border-[color:var(--hairline)] text-[color:var(--ink-2)]'
            }`}
          >
            {copy.nextMonth}
          </button>
        </div>

        <div
          className={`grid grid-cols-7 gap-px border ${hair} text-center text-[11px] font-bold ${
            traditional ? 'bg-[#9b1b1b] text-[#faf6eb]' : 'bg-[color:var(--bg-sunken)] text-[color:var(--ink-5)]'
          }`}
        >
          {weekChars.map((w, i) => (
            <div key={`${w}-${i}`} className={`py-1.5 ${traditional ? '' : ''}`}>
              {w}
            </div>
          ))}
        </div>

        {loading && !cells.length ? (
          <p className={`py-8 text-center text-[13px] ${muted}`}>{copy.loading}</p>
        ) : (
          <div className={`grid grid-cols-7 gap-px border border-t-0 ${hair} ${traditional ? 'bg-[#e8dcc8]' : 'bg-[color:var(--hairline)]'}`}>
            {cells.map((cell) => {
              const selected = cell.date === selectedDate;
              return (
                <button
                  key={cell.date + String(cell.inMonth)}
                  type="button"
                  onClick={() => onSelect(cell.date, cell.inMonth)}
                  className={`min-h-[72px] p-1.5 text-left transition ${
                    selected
                      ? traditional
                        ? 'bg-[#f3e2d8] ring-2 ring-inset ring-[#9b1b1b]'
                        : 'bg-[color:var(--brand-soft)] ring-2 ring-inset ring-[color:var(--brand)]'
                      : traditional
                        ? 'bg-[#faf6eb] hover:bg-[#fffdf7]'
                        : 'bg-[color:var(--paper)] hover:bg-white'
                  } ${cell.inMonth ? '' : 'opacity-35'}`}
                >
                  <div className="flex items-start justify-between gap-0.5">
                    <span
                      className={`text-[15px] font-bold leading-none ${
                        cell.isToday
                          ? traditional
                            ? 'text-[#9b1b1b]'
                            : 'text-[color:var(--brand)]'
                          : traditional
                            ? 'text-[#1c1410]'
                            : 'text-[color:var(--ink-1)]'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {cell.hasJieQi ? (
                      <span
                        className={`rounded-sm px-1 text-[9px] font-bold ${
                          traditional ? 'bg-[#9b1b1b] text-[#faf6eb]' : softBg + ' text-[color:var(--brand-strong)]'
                        }`}
                      >
                        {copy.jie}
                      </span>
                    ) : null}
                  </div>
                  <div className={`mt-1 truncate text-[10px] ${muted}`}>{cell.dayGanZhi}</div>
                  <div
                    className={`mt-0.5 line-clamp-2 text-[9px] leading-snug ${
                      traditional ? 'text-[#9b1b1b]/80' : 'text-[color:var(--ink-4)]'
                    }`}
                  >
                    {cell.yiPreview || '—'}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <p className={`mt-2 text-[11px] ${muted}`}>{copy.dayUrlHint}</p>
      </section>

      {pack ? <AlmanacLensPanel date={pack.date} hasChart={hasChart} locale={locale} /> : null}

      <section
        className={`rounded-sm border border-dashed px-4 py-3 text-[12px] leading-relaxed ${
          traditional
            ? 'border-[#c4a574]/60 bg-[#f3efe3] text-[#5c4a3a]'
            : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-4)]'
        }`}
      >
        <strong className={traditional ? 'text-[#1c1410]' : 'text-[color:var(--ink-2)]'}>
          {copy.footerTitle}
        </strong>
        {' — '}
        {copy.footerBody}
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href="/almanac" className={`underline-offset-2 hover:underline ${accent}`}>
            {copy.backToday}
          </Link>
          <Link href="/world-yi/era-timing" className={`underline-offset-2 hover:underline ${accent}`}>
            {copy.eraTiming}
          </Link>
          <Link href="/analyze?source=almanac" className={`underline-offset-2 hover:underline ${accent}`}>
            {copy.fullReport}
          </Link>
        </div>
      </section>
    </div>
  );
}
