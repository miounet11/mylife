import type { ExpertPrintSheet } from '@/lib/expert-print-sheet';

/**
 * 打印时优先展示的一页排盘纸；屏上亦可见摘要。
 */
export default function ExpertPrintSheetView({ sheet }: { sheet: ExpertPrintSheet }) {
  return (
    <section
      id="ex-print-sheet"
      className="expert-print-sheet scroll-mt-header rounded-[10px] border-2 border-[#0f172a] bg-white p-5 md:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#e2e8f0] pb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6d28d9]">
            {sheet.brandLine}
          </div>
          <h2 className="mt-1 text-[18px] font-black text-[#0f172a] md:text-[20px]">{sheet.title}</h2>
          <p className="mt-0.5 text-[11px] text-[#64748b]">{sheet.subtitle}</p>
        </div>
        <div className="rounded-full border border-[#c4b5fd] bg-[#f5f3ff] px-2.5 py-1 text-[10px] font-bold text-[#6d28d9]">
          {sheet.knowledgeStamp}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {sheet.metaRows.map((r) => (
          <div key={r.label} className="rounded-[8px] bg-[#f8fafc] px-2.5 py-2">
            <div className="text-[10px] font-semibold text-[#94a3b8]">{r.label}</div>
            <div className="mt-0.5 text-[13px] font-bold text-[#0f172a]">{r.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-center text-[12px]">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]">
              <th className="px-2 py-2">柱</th>
              {sheet.pillars.map((p) => (
                <th key={p.label} className="px-2 py-2">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#f1f5f9]">
              <td className="px-2 py-2 text-left text-[11px] text-[#94a3b8]">干支</td>
              {sheet.pillars.map((p) => (
                <td key={p.ganZhi} className="px-2 py-2 font-serif text-[18px] font-black text-[#0f172a]">
                  {p.ganZhi}
                </td>
              ))}
            </tr>
            <tr className="border-b border-[#f1f5f9]">
              <td className="px-2 py-2 text-left text-[11px] text-[#94a3b8]">十神</td>
              {sheet.pillars.map((p) => (
                <td key={`${p.label}-tg`} className="px-2 py-2 text-[11px] text-[#475569]">
                  {p.tenGod || '—'}
                </td>
              ))}
            </tr>
            <tr>
              <td className="px-2 py-2 text-left text-[11px] text-[#94a3b8]">长生</td>
              {sheet.pillars.map((p) => (
                <td key={`${p.label}-cs`} className="px-2 py-2 text-[11px] text-[#6d28d9]">
                  {p.changSheng || '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-[8px] border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2">
          <div className="text-[10px] font-bold text-[#047857]">用神</div>
          <div className="mt-0.5 text-[14px] font-bold text-[#14532d]">{sheet.yongJi.yong}</div>
        </div>
        <div className="rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
          <div className="text-[10px] font-bold text-[#64748b]">喜神</div>
          <div className="mt-0.5 text-[14px] font-bold text-[#334155]">{sheet.yongJi.xi}</div>
        </div>
        <div className="rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2">
          <div className="text-[10px] font-bold text-[#b91c1c]">忌神</div>
          <div className="mt-0.5 text-[14px] font-bold text-[#7f1d1d]">{sheet.yongJi.ji}</div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 rounded-[8px] border border-[#e2e8f0] bg-[#fafafa] px-3 py-2.5 text-[12px] leading-[1.6] text-[#334155]">
        <div>
          <span className="font-bold text-[#0f172a]">大运 · </span>
          {sheet.dayunLine}
        </div>
        <div>
          <span className="font-bold text-[#0f172a]">岁运 · </span>
          {sheet.suiyunLine}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-[11px] font-bold text-[#0f172a]">要点</div>
        <ul className="mt-1 space-y-1">
          {sheet.keyNotes.map((n) => (
            <li key={n} className="text-[11px] leading-[1.55] text-[#475569]">
              · {n}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 rounded-[8px] border border-[#c4b5fd] bg-[#f5f3ff] px-3 py-2.5">
        <div className="text-[10px] font-bold text-[#6d28d9]">对客一句话</div>
        <p className="mt-1 text-[12px] leading-[1.65] text-[#1e1b4b]">{sheet.clientOneLiner}</p>
      </div>

      <p className="mt-4 border-t border-[#e2e8f0] pt-2 text-[9px] text-[#94a3b8]">{sheet.footer}</p>
    </section>
  );
}
