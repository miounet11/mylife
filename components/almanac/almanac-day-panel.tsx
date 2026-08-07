import type { AlmanacDayPack } from '@/lib/almanac/types';
import type { PersonalDayOverlay } from '@/lib/almanac/types';

function TagList({ items, tone = 'default' }: { items: string[]; tone?: 'default' | 'good' | 'bad' }) {
  if (!items.length) return <span className="text-[12px] text-[color:var(--ink-5)]">—</span>;
  const cls =
    tone === 'good'
      ? 'border-[color:var(--brand)]/30 bg-[color:var(--brand-soft)] text-[color:var(--brand-strong)]'
      : tone === 'bad'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : 'border-[color:var(--hairline)] bg-[color:var(--bg-sunken)] text-[color:var(--ink-3)]';
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className={`rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function AlmanacDayPanel({
  pack,
  personal,
}: {
  pack: AlmanacDayPack;
  personal?: PersonalDayOverlay | null;
}) {
  return (
    <div className="space-y-4" data-almanac-day={pack.date}>
      <header className="rounded-xl border border-[color:var(--hairline)] bg-white p-4 md:p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand)]">
          通书黄历
        </p>
        <h2 className="mt-1 text-[18px] font-bold text-[color:var(--ink-1)]">
          {pack.date} · {pack.weekdayLabel}
        </h2>
        <p className="mt-1 text-[13px] text-[color:var(--ink-4)]">
          农历{pack.lunar.lunarText}
          {pack.lunar.yearGanZhi ? ` · ${pack.lunar.yearGanZhi}年` : ''}
          {pack.lunar.yearShengXiao ? `（${pack.lunar.yearShengXiao}）` : ''}
          {pack.jieQi ? ` · ${pack.jieQi}` : ''}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3 text-[12px] text-[color:var(--ink-3)]">
          <div>
            <span className="text-[color:var(--ink-5)]">日柱</span> {pack.lunar.dayGanZhi || '—'}
            {pack.nayin ? ` · ${pack.nayin}` : ''}
          </div>
          <div>
            <span className="text-[color:var(--ink-5)]">建除</span> {pack.zhiXing || '—'}
            {pack.xiu ? ` · ${pack.xiu}宿${pack.xiuLuck ? `（${pack.xiuLuck}）` : ''}` : ''}
          </div>
          <div>
            <span className="text-[color:var(--ink-5)]">冲煞</span> {pack.chong || '—'}
            {pack.sha ? ` · 煞${pack.sha}` : ''}
          </div>
        </div>
      </header>

      {personal ? (
        <section className="rounded-xl border border-[color:var(--brand)]/25 bg-[color:var(--brand-soft)]/40 p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-strong)]">
                我的今日结构
              </p>
              <h3 className="mt-1 text-[15px] font-bold text-[color:var(--ink-1)]">{personal.headline}</h3>
            </div>
            <div className="rounded-lg border border-[color:var(--hairline)] bg-white px-3 py-2 text-right">
              <div className="text-[10px] text-[color:var(--ink-5)]">结构匹配分</div>
              <div className="text-xl font-black text-[color:var(--brand)]">{personal.score}</div>
            </div>
          </div>
          {personal.favors.length ? (
            <div className="mt-3">
              <div className="text-[12px] font-semibold text-[color:var(--ink-2)]">可借力</div>
              <ul className="mt-1 space-y-1 text-[12px] leading-relaxed text-[color:var(--ink-3)]">
                {personal.favors.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {personal.watchouts.length ? (
            <div className="mt-3">
              <div className="text-[12px] font-semibold text-[color:var(--ink-2)]">宜注意</div>
              <ul className="mt-1 space-y-1 text-[12px] leading-relaxed text-[color:var(--ink-3)]">
                {personal.watchouts.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--ink-5)]">{personal.disclaimer}</p>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[color:var(--ink-1)]">宜</h3>
          <div className="mt-2">
            <TagList items={pack.yi} tone="good" />
          </div>
        </div>
        <div className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
          <h3 className="text-[13px] font-bold text-[color:var(--ink-1)]">忌</h3>
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
            <div className="text-[color:var(--ink-5)]">喜神 / 福神 / 财神</div>
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
        <h3 className="text-[13px] font-bold text-[color:var(--ink-1)]">十二时辰吉凶</h3>
        <p className="mt-1 text-[11px] text-[color:var(--ink-5)]">
          黄道时偏吉、黑道时偏慎；登录命盘后会叠加你的日主/用神排序。
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {pack.hours.map((h) => {
            const personalHour = personal?.hours.find((x) => x.ganZhi === h.ganZhi);
            const luckLabel =
              h.luck === 'auspicious' ? '黄道' : h.luck === 'inauspicious' ? '黑道' : '平';
            const border =
              h.luck === 'auspicious'
                ? 'border-[color:var(--brand)]/30'
                : h.luck === 'inauspicious'
                  ? 'border-amber-200'
                  : 'border-[color:var(--hairline)]';
            return (
              <li key={h.ganZhi + h.index} className={`rounded-lg border ${border} bg-[color:var(--bg-sunken)] px-3 py-2`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-[color:var(--ink-1)]">{h.ganZhi}</span>
                  <span className="text-[10px] text-[color:var(--ink-5)]">
                    {luckLabel}
                    {personalHour ? ` · ${personalHour.label}` : ''}
                  </span>
                </div>
                <div className="mt-0.5 text-[11px] text-[color:var(--ink-4)]">
                  {h.timeLabel} · {h.tianShen || '—'}
                </div>
                {personalHour ? (
                  <div className="mt-1 text-[10px] text-[color:var(--ink-5)]">
                    个人 {personalHour.personalScore} · {personalHour.reason}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
