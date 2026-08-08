import Link from 'next/link';
import {
  AlmanacDayStripFrame,
  AstroEvidenceBarsFrame,
  AstroHourSparkFrame,
  AstroScoreRingFrame,
} from '@/components/astro/astro-data-frames';
import type { AstroDailyMatchPack } from '@/lib/astro/daily-match-types';
import { formatZhDate } from '@/lib/astro/daily-window';
import { pathForIdentity } from '@/lib/astro/daily-match-engine';
import type { AstroDailyIdentity } from '@/lib/astro/daily-match-types';

function Stars({ n }: { n: number }) {
  return (
    <span className="tracking-tight text-[color:var(--brand)]" aria-label={`${n} stars`}>
      {'★'.repeat(n)}
      <span className="text-[color:var(--ink-5)]">{'★'.repeat(Math.max(0, 5 - n))}</span>
    </span>
  );
}

function stanceLabel(s: string) {
  if (s === 'push') return '可推进';
  if (s === 'conserve') return '宜守成';
  return '稳节奏';
}

function sourceLabel(src?: string) {
  if (src === 'engine') return '引擎四柱';
  if (src === 'birth_noon') return '生日午时近似';
  if (src === 'cohort') return '队列模型（表达层）';
  return '—';
}

export default function AstroDailyMatchView({
  pack,
  breadcrumbs,
}: {
  pack: AstroDailyMatchPack;
  breadcrumbs?: Array<{ href: string; label: string }>;
}) {
  const zhDay = formatZhDate(pack.targetDate);
  const identityForPath: AstroDailyIdentity =
    pack.identity.kind === 'sign'
      ? { kind: 'sign', key: pack.identity.signKey! }
      : pack.identity.kind === 'zone'
        ? { kind: 'zone', id: pack.identity.zoneId || pack.identity.key }
        : pack.identity.kind === 'rising'
          ? { kind: 'rising', key: pack.identity.signKey! }
          : pack.identity.kind === 'element'
            ? { kind: 'element', slug: pack.identity.key }
            : pack.identity.kind === 'modality'
              ? { kind: 'modality', slug: pack.identity.key }
              : pack.identity.kind === 'shengxiao'
                ? { kind: 'shengxiao', slug: pack.identity.key }
                : { kind: 'birth', birthDate: pack.identity.key };

  const prevHref = pathForIdentity(identityForPath, pack.bridges.siblingDays.prev);
  const nextHref = pathForIdentity(identityForPath, pack.bridges.siblingDays.next);

  return (
    <div className="space-y-5" data-astro-daily={pack.targetDate} data-kind={pack.identity.kind}>
      {breadcrumbs?.length ? (
        <nav className="flex flex-wrap items-center gap-1.5 text-[12px] text-[color:var(--ink-4)]">
          {breadcrumbs.map((b, i) => (
            <span key={b.href} className="inline-flex items-center gap-1.5">
              {i > 0 ? <span className="text-[color:var(--ink-5)]">/</span> : null}
              <Link href={b.href} className="underline-offset-2 hover:underline">
                {b.label}
              </Link>
            </span>
          ))}
        </nav>
      ) : null}

      {/* Hero */}
      <header className="overflow-hidden rounded-2xl border border-[color:var(--hairline)] bg-gradient-to-br from-[color:var(--brand-soft)]/45 via-white to-[color:var(--paper)] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand)]">
              引擎匹配 · 通书 × {pack.identity.kind === 'birth' ? '结构' : '表达'}
            </p>
            <h1 className="mt-1 text-[22px] font-black tracking-tight text-[color:var(--ink-1)] md:text-[26px]">
              {pack.identity.title}
              <span className="mt-1 block text-[16px] font-semibold text-[color:var(--ink-3)] md:mt-0 md:ml-2 md:inline">
                {zhDay}运势
              </span>
            </h1>
            <p className="mt-1 text-[13px] text-[color:var(--ink-4)]">{pack.identity.subtitle}</p>
            <p className="mt-3 max-w-2xl text-[15px] font-medium leading-relaxed text-[color:var(--ink-2)]">
              {pack.narrative.moodLine}
            </p>
            <p className="mt-2 text-[12px] text-[color:var(--ink-5)]">{pack.narrative.headline}</p>
          </div>
          <div className="w-full max-w-[150px] rounded-2xl border border-[color:var(--hairline)] bg-white p-4 text-center shadow-sm">
            <div className="text-[11px] text-[color:var(--ink-5)]">综合匹配</div>
            <div className="mt-1 text-[36px] font-black leading-none text-[color:var(--brand)]">
              {pack.scores.composite}
            </div>
            <div className="mt-1">
              <Stars n={pack.scores.stars} />
            </div>
            <div className="mt-2 rounded-full bg-[color:var(--brand-soft)] px-2 py-1 text-[12px] font-bold text-[color:var(--brand-strong)]">
              {stanceLabel(pack.scores.stance)}
            </div>
            <div className="mt-2 text-[10px] text-[color:var(--ink-5)]">
              结构 {pack.scores.structure} · 表达 {pack.scores.expression}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-[color:var(--hairline)] pt-3 text-[11px]">
          <span className="rounded-full border border-[color:var(--hairline)] bg-white px-2.5 py-0.5">
            日柱 {pack.almanac.dayGanZhi}
          </span>
          <span className="rounded-full border border-[color:var(--hairline)] bg-white px-2.5 py-0.5">
            农历 {pack.almanac.lunarText}
          </span>
          {pack.natal?.dayPillar && pack.natal.dayPillar !== '—' ? (
            <span className="rounded-full border border-[color:var(--hairline)] bg-white px-2.5 py-0.5">
              本命日柱 {pack.natal.dayPillar}
            </span>
          ) : null}
          {pack.natal?.sun ? (
            <span className="rounded-full border border-[color:var(--hairline)] bg-white px-2.5 py-0.5">
              太阳 {pack.natal.sun.zh}
            </span>
          ) : null}
          {pack.natal?.zone ? (
            <span className="rounded-full border border-[color:var(--hairline)] bg-white px-2.5 py-0.5">
              {pack.natal.zone.title}
            </span>
          ) : null}
          <span className="rounded-full bg-[color:var(--bg-sunken)] px-2.5 py-0.5 text-[color:var(--ink-4)]">
            来源 · {sourceLabel(pack.natal?.source)}
          </span>
        </div>
      </header>

      <AstroScoreRingFrame
        title={`${pack.identity.title} · ${zhDay}`}
        eyebrow="MATCH · ENGINE"
        subtitle={pack.narrative.moodLine.slice(0, 48)}
        score={pack.scores.composite}
        leftLabel="结构分"
        leftValue={pack.scores.structure}
        rightLabel="表达分"
        rightValue={pack.scores.expression}
        stance={pack.scores.stance}
      />
      <AlmanacDayStripFrame
        title="通书公共层"
        dayGanZhi={pack.almanac.dayGanZhi}
        lunarText={pack.almanac.lunarText}
        yi={pack.almanac.yi}
        ji={pack.almanac.ji}
      />
      {pack.evidence.length ? (
        <AstroEvidenceBarsFrame
          title="证据权重"
          subtitle="正贡献偏绿 · 负贡献偏琥珀"
          items={pack.evidence.map((e) => ({ code: e.code, label: e.label, weight: e.weight }))}
        />
      ) : null}
      {(() => {
        const hours = [
          ...pack.narrative.topHours.map((h) => ({
            label: h.timeLabel || h.ganZhi,
            ganZhi: h.ganZhi,
            score: h.score,
          })),
          ...pack.narrative.avoidHours.map((h) => ({
            label: h.timeLabel || h.ganZhi,
            ganZhi: h.ganZhi,
            score: h.score,
          })),
        ];
        // de-dup by label keeping first
        const seen = new Set<string>();
        const uniq = hours.filter((h) => {
          const k = h.label + h.ganZhi;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        return uniq.length ? (
          <AstroHourSparkFrame title="时辰峰谷" subtitle="来自引擎时辰排序" hours={uniq} />
        ) : null;
      })()}

      {/* Evidence */}
      <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
        <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">证据链（引擎）</h2>
        <p className="mt-0.5 text-[11px] text-[color:var(--ink-5)]">每条均可回溯到通书或结构规则，非空泛运势文。</p>
        <ul className="mt-3 space-y-2">
          {pack.evidence.map((e) => (
            <li
              key={e.code + e.label}
              className="flex items-start justify-between gap-3 rounded-lg border border-[color:var(--hairline)] bg-[color:var(--paper)] px-3 py-2 text-[12px]"
            >
              <div>
                <span className="font-mono text-[10px] text-[color:var(--ink-5)]">{e.code}</span>
                <div className="mt-0.5 text-[color:var(--ink-2)]">{e.label}</div>
              </div>
              <span
                className={`shrink-0 tabular-nums font-semibold ${
                  e.weight > 0
                    ? 'text-emerald-700'
                    : e.weight < 0
                      ? 'text-amber-800'
                      : 'text-[color:var(--ink-5)]'
                }`}
              >
                {e.weight > 0 ? `+${e.weight}` : e.weight}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <section className="rounded-xl border border-emerald-100 bg-emerald-50/55 p-4">
          <h2 className="text-[13px] font-bold text-emerald-900">今日可借力</h2>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-emerald-950/90">
            {(pack.narrative.favors.length ? pack.narrative.favors : ['—']).map((f) => (
              <li key={f}>· {f}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-amber-100 bg-amber-50/65 p-4">
          <h2 className="text-[13px] font-bold text-amber-950">今日宜注意</h2>
          <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-amber-950/90">
            {(pack.narrative.watchouts.length ? pack.narrative.watchouts : ['—']).map((f) => (
              <li key={f}>· {f}</li>
            ))}
          </ul>
        </section>
      </div>

      {/* Hours */}
      <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
        <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">时辰排序</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-[11px] font-semibold text-emerald-800">较顺</div>
            <ul className="mt-1.5 space-y-1 text-[12px] text-[color:var(--ink-3)]">
              {(pack.narrative.topHours.length ? pack.narrative.topHours : []).map((h) => (
                <li key={h.ganZhi + h.timeLabel}>
                  <strong>{h.timeLabel || h.ganZhi}</strong> · {h.ganZhi} · {h.score}分 · {h.reason}
                </li>
              ))}
              {!pack.narrative.topHours.length ? <li className="text-[color:var(--ink-5)]">今日无明显高峰时</li> : null}
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-amber-900">慎用</div>
            <ul className="mt-1.5 space-y-1 text-[12px] text-[color:var(--ink-3)]">
              {(pack.narrative.avoidHours.length ? pack.narrative.avoidHours : []).map((h) => (
                <li key={h.ganZhi + 'a' + h.timeLabel}>
                  <strong>{h.timeLabel || h.ganZhi}</strong> · {h.ganZhi} · {h.score}分 · {h.reason}
                </li>
              ))}
              {!pack.narrative.avoidHours.length ? <li className="text-[color:var(--ink-5)]">今日无显著低谷时</li> : null}
            </ul>
          </div>
        </div>
      </section>

      {/* Tong-shu */}
      <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">通书摘要（公共层）</h2>
          <Link
            href={pack.bridges.almanac}
            className="text-[12px] font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
          >
            打开当日黄历 →
          </Link>
        </div>
        <div className="mt-3 grid gap-2 text-[12px] sm:grid-cols-2">
          <div>
            <span className="text-[color:var(--ink-5)]">宜 </span>
            {pack.almanac.yi.join('、') || '—'}
          </div>
          <div>
            <span className="text-[color:var(--ink-5)]">忌 </span>
            {pack.almanac.ji.join('、') || '—'}
          </div>
          <div>
            <span className="text-[color:var(--ink-5)]">冲煞 </span>
            冲{pack.almanac.chong || '—'} · 煞{pack.almanac.sha || '—'}
          </div>
          <div>
            <span className="text-[color:var(--ink-5)]">节气/星座日 </span>
            {pack.almanac.jieQi || '—'} · {pack.almanac.westernSign}
          </div>
        </div>
      </section>

      {/* Expression */}
      <section className="rounded-xl border border-[color:var(--hairline)] bg-[color:var(--paper)] p-4">
        <h2 className="text-[13px] font-bold text-[color:var(--ink-1)]">表达层解读</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--ink-3)]">
          {pack.narrative.expressionNote}
        </p>
        <p className="mt-3 text-[12px] leading-relaxed text-[color:var(--ink-4)]">
          <strong className="text-[color:var(--ink-2)]">世界易桥接：</strong>
          {pack.narrative.worldYiBridge}
        </p>
      </section>

      {/* CTA */}
      <section className="rounded-xl border border-[color:var(--brand)]/20 bg-[color:var(--brand-soft)]/25 p-4">
        <h2 className="text-[13px] font-bold text-[color:var(--brand-strong)]">下一步</h2>
        <div className="mt-2 flex flex-wrap gap-3 text-[13px]">
          <Link href={pack.bridges.analyze} className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline">
            完整结构报告
          </Link>
          <Link href={pack.bridges.foundation} className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline">
            完善数据底座
          </Link>
          <Link href={pack.bridges.almanac} className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline">
            万年历撕页
          </Link>
          {pack.bridges.worldYi[0] ? (
            <Link
              href={pack.bridges.worldYi[0]}
              className="font-semibold text-[color:var(--brand)] underline-offset-2 hover:underline"
            >
              世界易
            </Link>
          ) : null}
        </div>
      </section>

      {/* FAQ */}
      <section className="rounded-xl border border-[color:var(--hairline)] bg-white p-4">
        <h2 className="text-[13px] font-bold">常见问题</h2>
        <ul className="mt-3 space-y-3">
          {pack.seo.faqs.map((f) => (
            <li key={f.question}>
              <h3 className="text-[13px] font-semibold text-[color:var(--ink-2)]">{f.question}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-[color:var(--ink-4)]">{f.answer}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Nav */}
      <nav className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
        <Link href={prevHref} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
          ← 前一日
        </Link>
        <Link href={nextHref} className="text-[color:var(--brand)] underline-offset-2 hover:underline">
          后一日 →
        </Link>
      </nav>
      <div className="flex flex-wrap gap-2">
        {pack.bridges.siblings.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-full border border-[color:var(--hairline)] bg-white px-2.5 py-1 text-[11px] font-semibold text-[color:var(--ink-3)] no-underline hover:border-[color:var(--brand)]/40"
          >
            {s.label}
          </Link>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-[color:var(--ink-5)]">{pack.disclaimer}</p>
    </div>
  );
}
