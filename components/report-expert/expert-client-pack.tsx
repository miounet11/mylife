'use client';

import { useState } from 'react';
import type { ExpertClientPack } from '@/lib/report-expert-client-pack';
import KnowledgeBaseStamp from '@/components/knowledge-base-stamp';

/** 专业版对客话术 / 交付包 */
export default function ExpertClientPackPanel({ pack }: { pack: ExpertClientPack }) {
  const [copied, setCopied] = useState<'all' | 'plain' | null>(null);

  async function copy(text: string, which: 'all' | 'plain') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <section
      id="ex-client-pack"
      className="scroll-mt-header rounded-[10px] border border-[#0f172a] bg-white p-4 md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-bold text-[#0f172a] md:text-[15px]">
            ⑳ 对客交付包 · 话术与解释
          </h2>
          <p className="mt-0.5 text-[11px] text-[#64748b]">
            开业可用：3 分钟口播 · 案主白话版 · 异议应答 · 合规边界 · {pack.knowledgeStamp}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <button
            type="button"
            onClick={() => copy(pack.clientPlain, 'plain')}
            className="rounded-[8px] border border-[#cbd5e1] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#334155] hover:bg-[#f8fafc]"
          >
            {copied === 'plain' ? '已复制白话' : '复制案主版'}
          </button>
          <button
            type="button"
            onClick={() => copy(pack.copyAll, 'all')}
            className="rounded-[8px] bg-[#0f172a] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-black"
          >
            {copied === 'all' ? '已复制全文' : '复制全部话术'}
          </button>
        </div>
      </div>

      <div className="mt-3">
        <KnowledgeBaseStamp variant="banner" />
      </div>

      <div className="mt-4 rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] p-3">
        <div className="text-[11px] font-bold text-[#64748b]">开场</div>
        <p className="mt-1 text-[12px] leading-[1.7] text-[#334155]">{pack.opening}</p>
      </div>

      <div className="mt-3 space-y-2">
        <div className="text-[12px] font-bold text-[#0f172a]">3 分钟口播结构</div>
        {pack.scriptBeats.map((b) => (
          <div key={b.beat} className="rounded-[8px] border border-[#e2e8f0] p-3">
            <div className="text-[11px] font-bold text-[#6d28d9]">{b.beat}</div>
            <p className="mt-1 text-[12px] leading-[1.7] text-[#334155]">{b.line}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[8px] border border-[#bbf7d0] bg-[#f0fdf4] p-3">
          <div className="text-[12px] font-bold text-[#047857]">案主白话版（可转发）</div>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-[11px] leading-[1.65] text-[#14532d]">
            {pack.clientPlain}
          </pre>
        </div>
        <div className="rounded-[8px] border border-[#e2e8f0] p-3">
          <div className="text-[12px] font-bold text-[#0f172a]">专业底稿（自留）</div>
          <ul className="mt-2 space-y-1.5">
            {pack.proNotes.map((n) => (
              <li key={n} className="text-[11px] leading-[1.55] text-[#475569]">
                · {n}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-[12px] font-bold text-[#0f172a]">异议应答</div>
        <div className="mt-2 space-y-2">
          {pack.objections.map((o) => (
            <div key={o.concern} className="rounded-[8px] border border-[#fde68a] bg-[#fffbeb] p-3">
              <div className="text-[11px] font-bold text-[#92400e]">Q: {o.concern}</div>
              <p className="mt-1 text-[11px] leading-[1.6] text-[#78350f]">A: {o.reply}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[8px] border border-[#e2e8f0] p-3">
        <div className="text-[12px] font-bold text-[#0f172a]">收束行动</div>
        <ol className="mt-2 space-y-1">
          {pack.closingActions.map((a, i) => (
            <li key={a} className="text-[12px] text-[#334155]">
              {i + 1}. {a}
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[10px] leading-[1.5] text-[#94a3b8]">{pack.disclaimer}</p>
      </div>
    </section>
  );
}
