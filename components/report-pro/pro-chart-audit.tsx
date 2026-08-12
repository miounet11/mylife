import Link from 'next/link';
import type { ChartAuditPack } from '@/lib/chart-audit';

export default function ProChartAudit({ audit }: { audit: ChartAuditPack }) {
  return (
    <section
      id="pro-chart-audit"
      className="scroll-mt-header border-y border-[color:var(--hairline)] py-4"
    >
      <div className="text-[11px] font-medium text-[color:var(--ink-5)]">排盘核对</div>
      <h2 className="mt-0.5 text-[14px] font-semibold text-[color:var(--ink-1)]">{audit.headline}</h2>
      <p className="mt-1.5 max-w-2xl text-[12px] leading-[1.6] text-[color:var(--ink-3)]">{audit.why}</p>
      <p className="mt-1 text-[12px] text-[color:var(--ink-5)]">{audit.jieqiLine}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[28rem] text-left text-[12px]">
          <thead>
            <tr className="text-[11px] text-[color:var(--ink-5)]">
              <th className="py-1 pr-3 font-medium">算法选择</th>
              <th className="py-1 pr-3 font-medium">四柱</th>
              <th className="py-1 font-medium">说明</th>
            </tr>
          </thead>
          <tbody>
            {audit.variants.map((v) => (
              <tr
                key={v.key}
                className={
                  v.matchesStored
                    ? 'text-[color:var(--brand-strong)]'
                    : 'text-[color:var(--ink-2)]'
                }
              >
                <td className="py-1 pr-3 align-top">{v.label}</td>
                <td className="py-1 pr-3 align-top font-mono">{v.fingerprint || '—'}</td>
                <td className="py-1 align-top text-[color:var(--ink-5)]">
                  {v.matchesStored ? '与当前盘相同 · ' : ''}
                  {v.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
        <Link
          href={audit.recomputeHref}
          className="text-[color:var(--brand-strong)] underline-offset-2 hover:underline"
        >
          用填写时辰重算
        </Link>
        {audit.storedFingerprint ? (
          <span className="text-[color:var(--ink-5)]">盘上 {audit.storedFingerprint}</span>
        ) : null}
      </div>
    </section>
  );
}
