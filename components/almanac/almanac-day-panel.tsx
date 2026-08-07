import Link from 'next/link';
import type { AlmanacDayPack, PersonalDayOverlay } from '@/lib/almanac/types';

function Stars({ n }: { n: number }) {
  return (
    <span className="tracking-tight text-[color:var(--brand)]" aria-label={`${n}星`}>
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
}: {
  pack: AlmanacDayPack;
  personal?: PersonalDayOverlay | null;
  showCanonical?: boolean;
}) {
  const stanceLabel =
    personal?.stance === 'push' ? '可推进' : personal?.stance === 'conserve' ? '宜守成' : '稳节奏';

  return (
    <div className="space-y-4" data-almanac-day={pack.date}>
      {/* Hero — zodiac-site style */}
      <header className="overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-gradient-to-br from-[color:var(--brand-soft)]/50 via-white to-[color:var(--paper)] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--brand-strong)]">
              {personal ? '我的个人黄历' : '通书黄历'}
            </p>
            <h2 className="mt-1 text-[22px] font-black tracking-tight text-[color:var(--ink-1)] md:text-[26px]">
              {pack.date}
              <span className="ml-2 text-[15px] font-semibold text-[color:var(--ink-4)]">
                {pack.weekdayLabel}
              </span>
            </h2>
            <p className="mt-1 text-[14px] text-[color:var(--ink-3)]">
              农历{pack.lunar.lunarText}
              {pack.lunar.yearGanZhi ? ` · ${pack.lunar.yearGanZhi}年` : ''}
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
                流日{pack.lunar.dayGanZhi}
                {pack.nayin ? ` · ${pack.nayin}` : ''}。公共通书如下；绑定生辰后可看专属星级与时辰。
              </p>
            )}
          </div>

          {personal ? (
            <div className="w-full max-w-[160px] rounded-2xl border border-[color:var(--hairline)] bg-white p-4 text-center shadow-sm">
              <div className="text-[11px] text-[color:var(--ink-5)]">今日匹配</div>
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
                日主 {personal.dayMaster}
                {personal.dayMasterElement ? `·${personal.dayMasterElement}` : ''}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-2 border-t border-[color:var(--hairline)] pt-4 text-[12px] text-[color:var(--ink-3)] sm:grid-cols-3">
          <div>
            <span className="text-[color:var(--ink-5)]">日柱</span> {pack.lunar.dayGanZhi || '—'}
          </div>
          <div>
            <span className="text-[color:var(--ink-5)]">建除 · 宿</span> {pack.zhiXing || '—'}
            {pack.xiu ? ` · ${pack.xiu}` : ''}
          </div>
          <div>
            <span className="text-[color:var(--ink-5)]">冲煞</span> {pack.chong || '—'}
            {pack.sha ? ` · 煞${pack.sha}` : ''}
          </div>
        </div>

        {showCanonical ? (
          <p className="mt-3 text-[11px] text-[color:var(--ink-5)]">
            本页地址：
            <Link href={`/almanac/${pack.date}`} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
              /almanac/{pack.date}
            </Link>
            （可分享、可收录）
          </p>
        ) : null}
      </header>

      {personal ? (
        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <h3 className="text-[13px] font-bold text-emerald-900">今日可借力</h3>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-emerald-950/80">
              {(personal.favors.length ? personal.favors : ['保持轻推进与验证']).map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
            <h3 className="text-[13px] font-bold text-amber-950">今日宜注意</h3>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-amber-950/80">
              {(personal.watchouts.length ? personal.watchouts : ['避免一次押注式决定']).map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[color:var(--ink-1)]">通书 · 宜</h3>
          <div className="mt-2">
            <TagList items={pack.yi} tone="good" />
          </div>
        </div>
        <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[color:var(--ink-1)]">通书 · 忌</h3>
          <div className="mt-2">
            <TagList items={pack.ji} tone="bad" />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
        <h3 className="text-[13px] font-bold text-[color:var(--ink-1)]">吉神 · 凶煞 · 方位</h3>
        <div className="mt-2 grid gap-3 text-[12px] sm:grid-cols-3">
          <div>
            <div className="text-[color:var(--ink-5)]">吉神</div>
            <div className="mt-1 text-[color:var(--ink-3)]">{pack.jiShen.join('、') || '—'}</div>
          </div>
          <div>
            <div className="text-[color:var(--ink-5)]">凶煞</div>
            <div className="mt-1 text-[color:var(--ink-3)]">{pack.xiongSha.join('、') || '—'}</div>
          </div>
          <div>
            <div className="text-[color:var(--ink-5)]">喜 / 福 / 财</div>
            <div className="mt-1 text-[color:var(--ink-3)]">
              {pack.positions.xi || '—'} / {pack.positions.fu || '—'} / {pack.positions.cai || '—'}
            </div>
          </div>
        </div>
        {pack.pengZu.length ? (
          <p className="mt-3 text-[11px] text-[color:var(--ink-5)]">彭祖百忌：{pack.pengZu.join('；')}</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-[13px] font-bold text-[color:var(--ink-1)]">十二时辰</h3>
            <p className="mt-0.5 text-[11px] text-[color:var(--ink-5)]">
              黄道 / 黑道为通书；右侧为你的结构排序（有命盘时）
            </p>
          </div>
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {pack.hours.map((h) => {
            const personalHour = personal?.hours.find((x) => x.ganZhi === h.ganZhi);
            const luckLabel =
              h.luck === 'auspicious' ? '黄道' : h.luck === 'inauspicious' ? '黑道' : '平';
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
                    <span className="font-bold text-[color:var(--ink-3)]">{personalHour.personalScore}</span>
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
