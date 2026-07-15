import Link from 'next/link';
import type { DecisionPack } from '@/lib/decision-packs';

export default function ProDecisionPacks({ packs }: { packs: DecisionPack[] }) {
  if (!packs.length) return null;

  return (
    <section id="pro-packs" className="scroll-mt-header space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[14px] font-semibold text-[color:var(--ink-1)]">人生分叉决策包</h2>
        <span className="text-[11px] text-[color:var(--ink-5)]">跳槽 · 创业 · 搬家 · 大额 · 学业</span>
      </div>
      <ul className="divide-y divide-[color:var(--hairline)] border-t border-[color:var(--hairline)]">
        {packs.map((pack) => (
          <li key={pack.key} className="py-3.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-[color:var(--ink-1)]">{pack.title}</h3>
              <span className="text-[11px] text-[color:var(--ink-5)]">{pack.stance}</span>
            </div>
            <p className="mt-1.5 text-[12px] leading-[1.55] text-[color:var(--ink-2)]">{pack.oneLiner}</p>
            {pack.checklist.length ? (
              <ul className="mt-2 space-y-0.5">
                {pack.checklist.slice(0, 4).map((c) => (
                  <li key={c} className="text-[12px] leading-[1.5] text-[color:var(--ink-5)]">
                    · {c}
                  </li>
                ))}
              </ul>
            ) : null}
            {pack.windows.length ? (
              <p className="mt-1.5 text-[11px] text-[color:var(--ink-5)]">
                窗口：{pack.windows.join(' · ')}
              </p>
            ) : null}
            {pack.risks.length ? (
              <p className="mt-0.5 text-[11px] text-[color:var(--ink-5)]">
                风险：{pack.risks.slice(0, 2).join('；')}
              </p>
            ) : null}
            {pack.dimensionHref ? (
              <Link
                href={pack.dimensionHref}
                className="mt-2 inline-block text-[12px] text-[color:var(--ink-2)] underline-offset-2 hover:underline"
              >
                深度研判
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
