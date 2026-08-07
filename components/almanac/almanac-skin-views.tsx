'use client';

import type { AlmanacDayPack, PersonalDayOverlay } from '@/lib/almanac/types';
import type { AlmanacRegionProfile } from '@/lib/almanac/regions';
import { regionShows } from '@/lib/almanac/regions';
import type { AlmanacSkinId } from '@/lib/almanac/skins';
import AlmanacDayPanel from '@/components/almanac/almanac-day-panel';
import AlmanacTearSheet from '@/components/almanac/almanac-tear-sheet';
import type { SiteLocale } from '@/lib/i18n/site-locale';

function luckLabel(luck: string) {
  if (luck === 'auspicious') return { t: '吉', c: 'bg-emerald-500 text-white' };
  if (luck === 'inauspicious') return { t: '凶', c: 'bg-amber-600 text-white' };
  return { t: '中', c: 'bg-stone-400 text-white' };
}

/** Hours-first grid skin */
function HourGridView({
  pack,
  personal,
}: {
  pack: AlmanacDayPack;
  personal?: PersonalDayOverlay | null;
}) {
  return (
    <div className="space-y-4" data-almanac-skin="grid">
      <div className="rounded-2xl border border-[color:var(--hairline)] bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold text-[color:var(--brand)]">时辰宫格</p>
            <h3 className="text-[18px] font-black text-[color:var(--ink-1)]">
              {pack.date} · {pack.lunar.dayGanZhi}
            </h3>
          </div>
          {personal ? (
            <div className="text-right text-[12px] text-[color:var(--ink-4)]">
              匹配 {personal.score} · {personal.stance}
            </div>
          ) : null}
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {pack.hours.map((h) => {
            const L = luckLabel(h.luck);
            const ph = personal?.hours.find((x) => x.ganZhi === h.ganZhi);
            return (
              <li
                key={h.ganZhi + h.index}
                className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold">{h.ganZhi}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-black ${L.c}`}>{L.t}</span>
                </div>
                <div className="mt-1 text-[12px] text-[color:var(--ink-4)]">{h.timeLabel}</div>
                <div className="text-[11px] text-[color:var(--ink-5)]">{h.tianShen}</div>
                {ph ? (
                  <div className="mt-2 text-[11px] font-semibold text-[color:var(--brand-strong)]">
                    个人 {ph.personalScore} · {ph.label}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-[12px]">
          <strong>宜</strong> {pack.yi.join('、') || '—'}
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-[12px]">
          <strong>忌</strong> {pack.ji.join('、') || '—'}
        </div>
      </div>
    </div>
  );
}

/** Global multi-tradition compare */
function GlobalCompareView({
  pack,
  personal,
  region,
}: {
  pack: AlmanacDayPack;
  personal?: PersonalDayOverlay | null;
  region: AlmanacRegionProfile;
}) {
  return (
    <div className="space-y-3" data-almanac-skin="global">
      <p className="text-[12px] text-[color:var(--ink-4)]">
        地区侧重：{region.label} — {region.blurb}
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {regionShows(region, 'tongshu') || region.id === 'global' ? (
          <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
            <h3 className="text-[12px] font-bold text-[color:var(--brand)]">通书 / 通胜</h3>
            <p className="mt-2 text-[20px] font-black">{pack.lunar.dayGanZhi}</p>
            <p className="mt-1 text-[12px] text-[color:var(--ink-4)]">
              宜 {pack.yi.slice(0, 4).join('、') || '—'}
            </p>
            <p className="text-[12px] text-[color:var(--ink-4)]">
              忌 {pack.ji.slice(0, 3).join('、') || '—'}
            </p>
            <p className="mt-2 text-[11px] text-[color:var(--ink-5)]">
              冲{pack.chongShengXiao || pack.chong} · 煞{pack.sha}
            </p>
          </section>
        ) : null}

        {regionShows(region, 'liuyao') || region.id === 'global' || region.id === 'jp' ? (
          <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
            <h3 className="text-[12px] font-bold text-rose-700">六曜 · Rokuyō</h3>
            <p className="mt-2 text-[28px] font-black text-rose-900">{pack.liuYao || '—'}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
              日本民间日程常用标签（大安偏宜、佛灭偏慎等），作文化参考，不替代个人结构。
            </p>
            <p className="mt-2 text-[11px] text-[color:var(--ink-5)]">
              节气 {pack.jieQi || pack.nextJieQi || '—'}
            </p>
          </section>
        ) : null}

        {regionShows(region, 'western') || region.id === 'global' || region.id === 'us' ? (
          <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
            <h3 className="text-[12px] font-bold text-violet-700">星座日 · Sun sign</h3>
            <p className="mt-2 text-[22px] font-black text-violet-950">
              {pack.westernSign}
              <span className="ml-2 text-[13px] font-semibold text-violet-700/80">
                {pack.westernSignEn}
              </span>
            </p>
            {personal ? (
              <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
                {personal.moodLine}
              </p>
            ) : (
              <p className="mt-2 text-[12px] text-[color:var(--ink-4)]">
                绑定生辰后，这里会叠日主结构叙述（星座站式每日回看）。
              </p>
            )}
          </section>
        ) : null}
      </div>

      {(regionShows(region, 'hours') || region.id === 'global') && (
        <section className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-3">
          <h3 className="text-[12px] font-bold">时辰快览</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {pack.hours.map((h) => {
              const L = luckLabel(h.luck);
              return (
                <span
                  key={h.ganZhi + h.index}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${L.c}`}
                >
                  {h.ganZhi} {L.t}
                </span>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/** Personal-first (horoscope site) */
function PersonalFirstView({
  pack,
  personal,
}: {
  pack: AlmanacDayPack;
  personal?: PersonalDayOverlay | null;
}) {
  if (!personal) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--hairline)] bg-white p-6 text-center">
        <p className="text-[15px] font-bold text-[color:var(--ink-1)]">个人日运视图需要生辰</p>
        <p className="mt-2 text-[13px] text-[color:var(--ink-4)]">
          绑定后显示星级、mood 与时辰排序 — 像星座站一样每天回看。
        </p>
        <p className="mt-4 text-[12px] text-[color:var(--ink-5)]">
          今日通书：{pack.lunar.dayGanZhi} · 宜 {pack.yi[0] || '—'}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-4" data-almanac-skin="personal">
      <div className="rounded-2xl border border-[color:var(--brand)]/20 bg-gradient-to-b from-[color:var(--brand-soft)]/40 to-white p-6 text-center">
        <p className="text-[12px] font-bold tracking-[0.2em] text-[color:var(--brand)]">MY DAY</p>
        <p className="mt-2 text-[42px] font-black text-[color:var(--brand)]">{personal.score}</p>
        <p className="text-[18px] tracking-widest text-[color:var(--brand-strong)]">
          {'★'.repeat(personal.stars)}
          <span className="text-[color:var(--ink-5)]">{'★'.repeat(5 - personal.stars)}</span>
        </p>
        <p className="mx-auto mt-4 max-w-md text-[16px] font-medium leading-relaxed text-[color:var(--ink-2)]">
          {personal.moodLine}
        </p>
        <p className="mt-2 text-[12px] text-[color:var(--ink-5)]">
          日主 {personal.dayMaster} · 流日 {pack.lunar.dayGanZhi} · {pack.westernSign}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-emerald-50 p-4 text-[13px] leading-relaxed text-emerald-950">
          <div className="font-bold">Do more of</div>
          <ul className="mt-2 space-y-1">
            {personal.favors.slice(0, 4).map((f) => (
              <li key={f}>· {f}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-amber-50 p-4 text-[13px] leading-relaxed text-amber-950">
          <div className="font-bold">Go easy on</div>
          <ul className="mt-2 space-y-1">
            {personal.watchouts.slice(0, 4).map((f) => (
              <li key={f}>· {f}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function AlmanacSkinViews({
  skin,
  pack,
  personal,
  region,
  locale = 'zh-CN',
}: {
  skin: AlmanacSkinId;
  pack: AlmanacDayPack;
  personal?: PersonalDayOverlay | null;
  region: AlmanacRegionProfile;
  locale?: SiteLocale;
}) {
  if (skin === 'tear') return <AlmanacTearSheet pack={pack} personal={personal} />;
  if (skin === 'grid') return <HourGridView pack={pack} personal={personal} />;
  if (skin === 'global') return <GlobalCompareView pack={pack} personal={personal} region={region} />;
  if (skin === 'personal') return <PersonalFirstView pack={pack} personal={personal} />;
  return <AlmanacDayPanel pack={pack} personal={personal} showCanonical locale={locale} />;
}
