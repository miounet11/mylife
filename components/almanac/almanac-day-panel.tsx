import Link from 'next/link';
import { EngineLockStrip } from '@/components/engine-surface/engine-lock-strip';
import type { AlmanacDayPack, PersonalDayOverlay } from '@/lib/almanac/types';
import {
  almanacDayPanelCopy,
  translateYiJiList,
} from '@/lib/i18n/almanac-copy';
import type { SiteLocale } from '@/lib/i18n/site-locale';

function Stars({ n }: { n: number }) {
  return (
    <span className="tracking-tight text-[color:var(--brand)]" aria-label={`${n}`}>
      {'★'.repeat(n)}
      <span className="text-[color:var(--ink-5)]">{'★'.repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

function TagList({ items, tone = 'default' }: { items: string[]; tone?: 'default' | 'good' | 'bad' }) {
  if (!items.length) return <span className="text-[12px] text-[color:var(--ink-5)]">—</span>;
  const cls =
    tone === 'good'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : tone === 'bad'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)]';
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className={`rounded-full border px-2.5 py-0.5 text-[11px] ${cls}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function AlmanacDayPanel({
  pack,
  personal,
  showCanonical = true,
  locale = 'zh-CN',
}: {
  pack: AlmanacDayPack;
  personal?: PersonalDayOverlay | null;
  showCanonical?: boolean;
  locale?: SiteLocale;
}) {
  const copy = almanacDayPanelCopy(locale);
  const yi = translateYiJiList(pack.yi, locale);
  const ji = translateYiJiList(pack.ji, locale);
  const stanceLabel =
    personal?.stance === 'push'
      ? copy.stancePush
      : personal?.stance === 'conserve'
        ? copy.stanceConserve
        : copy.stanceSteady;

  return (
    <div className="space-y-4" data-almanac-day={pack.date} data-locale={locale}>
      {personal ? (
        <EngineLockStrip
          surface="almanac"
          facts={[
            { label: copy.dayMaster, value: personal.dayMaster, mono: true },
            { label: locale === 'en' ? 'Favorable' : '用神', value: (personal.yongShen || []).join(locale === 'en' ? ', ' : '、') },
          ]}
        />
      ) : null}
      <header className="overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-gradient-to-br from-[color:var(--brand-soft)]/50 via-white to-[color:var(--paper)] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--brand-strong)]">
              {personal ? copy.personalTitle : copy.publicTongshu}
            </p>
            <h1 className="mt-1 text-[22px] font-black tracking-tight text-[color:var(--ink-1)] md:text-[26px]">
              {pack.date}
              <span className="ml-2 text-[15px] font-semibold text-[color:var(--ink-4)]">
                {locale === 'en' ? pack.weekdayEn : pack.weekdayLabel}
              </span>
            </h1>
            <p className="mt-1 text-[14px] text-[color:var(--ink-3)]">
              {copy.lunar}
              {pack.lunar.lunarText}
              {pack.lunar.yearGanZhi ? ` · ${pack.lunar.yearGanZhi}` : ''}
              {pack.lunar.yearShengXiao ? `（${pack.lunar.yearShengXiao}）` : ''}
              {pack.jieQi ? (
                <span className="ml-2 rounded-full bg-[color:var(--brand)] px-2 py-0.5 text-[11px] font-semibold text-white">
                  {pack.jieQi}
                </span>
              ) : null}
            </p>
            {personal?.moodLine ? (
              <p className="mt-3 max-w-xl text-[15px] font-medium leading-relaxed text-[color:var(--ink-2)]">
                {personal.moodLine}
              </p>
            ) : (
              <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[color:var(--ink-4)]">
                {locale === 'en'
                  ? `Flow day ${pack.lunar.dayGanZhi}${pack.nayin ? ` · ${pack.nayin}` : ''}. ${copy.bindHint}`
                  : `流日${pack.lunar.dayGanZhi}${pack.nayin ? ` · ${pack.nayin}` : ''}。${copy.bindHint}`}
              </p>
            )}
          </div>

          {personal ? (
            <div className="w-full max-w-[160px] rounded-2xl border border-[color:var(--hairline)] bg-white p-4 text-center shadow-sm">
              <div className="text-[11px] text-[color:var(--ink-5)]">{copy.match}</div>
              <div className="mt-1 text-[36px] font-black leading-none text-[color:var(--brand)]">
                {personal.score}
              </div>
              <div className="mt-1">
                <Stars n={personal.stars} />
              </div>
              <div className="mt-2 rounded-full bg-[color:var(--brand-soft)] px-2 py-1 text-[12px] font-bold text-[color:var(--brand-strong)]">
                {stanceLabel}
              </div>
              <div className="mt-2 text-[11px] text-[color:var(--ink-5)]">
                {copy.dayMaster} {personal.dayMaster}
                {personal.dayMasterElement ? `·${personal.dayMasterElement}` : ''}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-2 border-t border-[color:var(--hairline)] pt-4 text-[12px] text-[color:var(--ink-3)] sm:grid-cols-3">
          <div>
            <span className="text-[color:var(--ink-5)]">{copy.dayPillar}</span> {pack.lunar.dayGanZhi || '—'}
          </div>
          <div>
            <span className="text-[color:var(--ink-5)]">{copy.zhiXingXiu}</span> {pack.zhiXing || '—'}
            {pack.xiu ? ` · ${pack.xiu}` : ''}
          </div>
          <div>
            <span className="text-[color:var(--ink-5)]">{copy.chongSha}</span> {pack.chong || '—'}
            {pack.sha ? ` · ${pack.sha}` : ''}
          </div>
        </div>

        <div className="mt-3 grid gap-2 text-[11px] text-[color:var(--ink-4)] sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-[color:var(--ink-5)]">{copy.tai}</span> {pack.positions.tai || '—'}
          </div>
          <div>
            <span className="text-[color:var(--ink-5)]">{copy.liuYao}</span> {pack.liuYao || '—'}
          </div>
          <div>
            <span className="text-[color:var(--ink-5)]">{copy.nineStar}</span> {pack.nineStar || '—'}
          </div>
          <div>
            <span className="text-[color:var(--ink-5)]">{copy.western}</span>{' '}
            {locale === 'en' ? pack.westernSignEn : pack.westernSign}
          </div>
          {(pack.season || pack.hou || pack.wuHou) && (
            <div className="sm:col-span-2">
              <span className="text-[color:var(--ink-5)]">{copy.season}</span>{' '}
              {[pack.season, pack.hou, pack.wuHou].filter(Boolean).join(' · ')}
            </div>
          )}
          {(pack.yearNaYin || pack.monthNaYin) && (
            <div className="sm:col-span-2">
              <span className="text-[color:var(--ink-5)]">NaYin</span>{' '}
              {[pack.yearNaYin, pack.monthNaYin, pack.nayin].filter(Boolean).join(' / ')}
            </div>
          )}
        </div>

        {showCanonical ? (
          <p className="mt-3 text-[11px] text-[color:var(--ink-5)]">
            {copy.pageUrl}
            <Link href={`/almanac/${pack.date}`} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
              /almanac/{pack.date}
            </Link>
            {copy.shareSeo}
          </p>
        ) : null}
      </header>

      {personal ? (
        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <h2 className="text-[13px] font-bold text-emerald-900">{copy.favors}</h2>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-emerald-950/80">
              {(personal.favors.length ? personal.favors : ['—']).map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
            <h2 className="text-[13px] font-bold text-amber-950">{copy.watchouts}</h2>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-amber-950/80">
              {(personal.watchouts.length ? personal.watchouts : ['—']).map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
          <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">{copy.yi}</h2>
          <div className="mt-2">
            <TagList items={yi} tone="good" />
          </div>
        </div>
        <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
          <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">{copy.ji}</h2>
          <div className="mt-2">
            <TagList items={ji} tone="bad" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
        <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">{copy.deities}</h2>
        <div className="mt-2 grid gap-3 text-[12px] sm:grid-cols-3">
          <div>
            <div className="text-[color:var(--ink-5)]">{copy.jiShen}</div>
            <div className="mt-1 text-[color:var(--ink-3)]">{pack.jiShen.join(locale === 'en' ? ', ' : '、') || '—'}</div>
          </div>
          <div>
            <div className="text-[color:var(--ink-5)]">{copy.xiongSha}</div>
            <div className="mt-1 text-[color:var(--ink-3)]">{pack.xiongSha.join(locale === 'en' ? ', ' : '、') || '—'}</div>
          </div>
          <div>
            <div className="text-[color:var(--ink-5)]">{copy.directions}</div>
            <div className="mt-1 text-[color:var(--ink-3)]">
              {pack.positions.xi || '—'} / {pack.positions.fu || '—'} / {pack.positions.cai || '—'}
            </div>
          </div>
        </div>
        {pack.pengZu.length ? (
          <p className="mt-3 text-[11px] text-[color:var(--ink-5)]">
            {copy.pengZu}：{pack.pengZu.join(locale === 'en' ? '; ' : '；')}
          </p>
        ) : null}
        {pack.xiuSong ? (
          <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--ink-5)]">{pack.xiuSong}</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">{copy.hours}</h2>
            <p className="mt-0.5 text-[11px] text-[color:var(--ink-5)]">{copy.hoursHint}</p>
          </div>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {pack.hours.map((h) => {
            const personalHour = personal?.hours.find((x) => x.ganZhi === h.ganZhi);
            const luckLabel =
              h.luck === 'auspicious'
                ? copy.huangdao
                : h.luck === 'inauspicious'
                  ? copy.heidao
                  : copy.mid;
            const border =
              personalHour && personalHour.personalScore >= 68
                ? 'border-emerald-300 bg-emerald-50/50'
                : personalHour && personalHour.personalScore <= 38
                  ? 'border-amber-200 bg-amber-50/40'
                  : h.luck === 'auspicious'
                    ? 'border-[color:var(--brand)]/25 bg-[color:var(--brand-soft)]/30'
                    : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)]';
            return (
              <li key={h.ganZhi + h.index} className={`rounded-xl border px-3 py-2.5 ${border}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[14px] font-bold text-[color:var(--ink-1)]">{h.ganZhi}</span>
                  <span className="text-[10px] font-semibold text-[color:var(--ink-5)]">
                    {luckLabel}
                    {personalHour ? ` · ${personalHour.label}` : ''}
                  </span>
                </div>
                <div className="mt-0.5 text-[12px] text-[color:var(--ink-4)]">
                  {h.timeLabel}
                  {h.tianShen ? ` · ${h.tianShen}` : ''}
                </div>
                {personalHour ? (
                  <div className="mt-1 flex items-center justify-between text-[10px] text-[color:var(--ink-5)]">
                    <span>{personalHour.reason}</span>
                    <span className="font-bold text-[color:var(--ink-3)]">
                      {copy.personal} {personalHour.personalScore}
                    </span>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {personal ? (
        <p className="text-[11px] leading-relaxed text-[color:var(--ink-5)]">{personal.disclaimer}</p>
      ) : null}
    </div>
  );
}
