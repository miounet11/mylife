import Link from 'next/link';
import type { WorldYiEngineReading } from '@/lib/world-yi-engine';

/**
 * Parallel 易学 facts + World Yi interpretive engine.
 * Does not replace the natal reading.
 */
export function ReportWorldYiDual({
  reading,
}: {
  reading: WorldYiEngineReading;
}) {
  const y = reading.yixue;
  const yixueRows = [
    { k: '日主', v: y.dayMaster || '—' },
    { k: '强弱', v: y.strengthDesc || y.strength || '—' },
    { k: '格局', v: y.pattern || '—' },
    { k: '用神', v: y.yongShen.join('、') || '—' },
    { k: '忌神', v: y.jiShen.join('、') || '—' },
    { k: '调候', v: y.tiaohuoNote || '本盘调候不显，不并入主用神' },
    { k: '大运', v: y.dayun || '—' },
    { k: '流年', v: y.liunian || '—' },
  ];

  return (
    <section
      id="world-yi-engine"
      className="scroll-mt-header rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-white p-4 md:p-5"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--brand)]">
            并行读法
          </p>
          <h2 className="mt-1 text-[16px] font-semibold text-[color:var(--ink-1)]">
            易学事实 · 世界易判断
          </h2>
          <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-[color:var(--ink-4)]">
            左边是日主与用神，右边是世界易引擎：用当代判断语言重读同一套结构。不互相改写。
          </p>
        </div>
        <Link
          href={reading.methodologyHref}
          className="text-[12px] font-medium text-[color:var(--brand)] underline-offset-2 hover:underline"
        >
          六步判断法 →
        </Link>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-[color:var(--hairline)] p-3.5">
          <p className="text-[12px] font-semibold text-[color:var(--ink-3)]">易学 · 结构事实</p>
          <dl className="mt-2 divide-y divide-[color:var(--hairline)]">
            {yixueRows.map((row) => (
              <div key={row.k} className="grid grid-cols-[52px_minmax(0,1fr)] gap-2 py-1.5">
                <dt className="text-[12px] text-[color:var(--ink-5)]">{row.k}</dt>
                <dd className="text-[13px] leading-[1.55] text-[color:var(--ink-1)]">{row.v}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="rounded-lg border border-[color:var(--brand-soft-2)] bg-[color:var(--brand-soft)]/40 p-3.5">
          <p className="text-[12px] font-semibold text-[color:var(--brand-strong)]">
            世界易引擎 · {reading.playType} · {reading.stage}期
          </p>
          <dl className="mt-2 space-y-2.5">
            {reading.layers.map((layer) => (
              <div key={layer.id}>
                <dt className="text-[12px] font-medium text-[color:var(--ink-3)]">
                  {layer.name} · {layer.headline}
                </dt>
                <dd className="mt-0.5 text-[13px] leading-[1.6] text-[color:var(--ink-2)]">{layer.body}</dd>
              </div>
            ))}
          </dl>
        </article>
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-[color:var(--ink-4)]">{reading.motherTongue}</p>
      <p className="mt-1 text-[11px] text-[color:var(--ink-5)]">{reading.refuse}</p>
    </section>
  );
}
