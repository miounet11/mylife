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
const SKIN_KEY = 'lk_almanac_skin_v1';
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
}: {
  initialYear: number;
  initialMonth: number;
  initialDate: string;
  navigateOnSelect?: boolean;
  initialSkin?: string;
  initialRegion?: string;
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
  const [skinId, setSkinId] = useState<AlmanacSkinId>(
    (getAlmanacSkin(initialSkin).id as AlmanacSkinId) || 'modern',
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

  const monthLabel = useMemo(() => `${year}年${month}月`, [year, month]);
  const hasChart = Boolean(personal);

  return (
    <div className="space-y-5">
      {/* Region switcher — global landing */}
      <section className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand)]">
              地区 / 传统侧重
            </p>
            <h2 className="mt-1 text-[15px] font-bold text-[color:var(--ink-1)]">
              同一天，不同文化怎么读
            </h2>
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[color:var(--ink-4)]">
              {region.blurb}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {ALMANAC_REGIONS.map((r) => {
            const on = r.id === regionId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => changeRegion(r.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                  on
                    ? 'border-[color:var(--brand)] bg-[color:var(--brand)] text-white'
                    : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)] hover:border-[color:var(--brand)]'
                }`}
              >
                <span className="opacity-80">{r.flag}</span> {r.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Skin switcher */}
      <section className="rounded-2xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
        <p className="text-[11px] font-bold text-[color:var(--ink-5)]">日历展示形态（参考传统撕页 + 现代站）</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {ALMANAC_SKINS.map((s) => {
            const on = s.id === skinId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => changeSkin(s.id)}
                className={`rounded-xl border p-3 text-left transition ${
                  on
                    ? 'border-[color:var(--brand)] bg-white shadow-sm ring-1 ring-[color:var(--brand)]/30'
                    : 'border-[color:var(--hairline)] bg-white/70 hover:border-[color:var(--brand)]/40'
                }`}
              >
                <div className="text-[13px] font-bold text-[color:var(--ink-1)]">{s.label}</div>
                <div className="mt-0.5 text-[10px] font-semibold text-[color:var(--brand)]">{s.preview}</div>
                <div className="mt-1 text-[11px] leading-snug text-[color:var(--ink-5)]">{s.description}</div>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-[color:var(--ink-5)]">
          当前：{skin.label} · {region.label}
        </p>
      </section>

      {/* Month grid */}
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
          每日独立地址 /almanac/YYYY-MM-DD · 可分享收录
        </p>
      </section>

      {!hasChart ? (
        <LightBirthBridge
          source="almanac"
          page={`/almanac/${selectedDate}`}
          title="绑定生辰，解锁「我的每日黄历」"
          description="引擎取日主与用神，叠通书流日；撕页/个人日运/全球对照等视图均可显示你的匹配分。"
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
          <AlmanacSkinViews skin={skinId} pack={pack} personal={personal} region={region} />
          <AlmanacLensPanel date={pack.date} hasChart={hasChart} />
        </>
      ) : null}

      <section className="rounded-xl border border-dashed border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] p-4 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
        <strong className="text-[color:var(--ink-2)]">落地页说明</strong>
        {' — '}
        撕页样式致敬传统挂历信息密度（宜忌、十二时辰格、冲煞、胎神、吉神方位等）；
        日本侧重六曜、北美侧重星座叙述、华人区保留完整通书。潮汐/地方彩票等未收录。
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href="/almanac" className="text-[color:var(--brand)] underline-offset-2 hover:underline">
            回到今日
          </Link>
          <Link
            href="/world-yi/era-timing"
            className="text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            时代天时
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
