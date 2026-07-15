'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ExpertCrmNote } from '@/lib/expert-crm';
import {
  buildCrmFollowupScript,
  expertCrmStatusLabel,
  exportCrmCsv,
  isCrmOverdue,
  listDueCrmFollowups,
  listExpertCrmNotes,
  upsertExpertCrmNote,
} from '@/lib/expert-crm';
import { trackProductEvent } from '@/lib/product-analytics';

/** 独立页：待回访队列 + 全部客户脚本 */
export default function ExpertCrmDesk() {
  const [due, setDue] = useState<ExpertCrmNote[]>([]);
  const [all, setAll] = useState<ExpertCrmNote[]>([]);
  const [copiedId, setCopiedId] = useState('');

  function refresh() {
    setDue(listDueCrmFollowups(45));
    setAll(listExpertCrmNotes());
  }

  useEffect(() => {
    refresh();
    trackProductEvent('expert_crm_desk_viewed', {});
  }, []);

  async function copyScript(note: ExpertCrmNote) {
    const text = buildCrmFollowupScript(note);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(''), 2000);
    } catch {
      // ignore
    }
  }

  function markDone(note: ExpertCrmNote) {
    upsertExpertCrmNote({
      ...note,
      clientName: note.clientName,
      status: 'done',
    });
    refresh();
  }

  function markFollowup(note: ExpertCrmNote, days = 14) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    upsertExpertCrmNote({
      ...note,
      clientName: note.clientName,
      status: 'followup',
      nextFollowUp: d.toISOString().slice(0, 10),
    });
    refresh();
  }

  function downloadCsv() {
    const csv = exportCrmCsv(listExpertCrmNotes());
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-kline-crm-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-[#64748b]">
          数据保存在本机浏览器（不上云）。从专业报告页写入后，在此统一回访。
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadCsv}
            className="rounded-[8px] border border-[#cbd5e1] bg-white px-3 py-1.5 text-[12px] font-semibold"
          >
            导出 CSV
          </button>
          <Link
            href="/history"
            className="rounded-[8px] bg-[#0f172a] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-black"
          >
            打开报告历史
          </Link>
        </div>
      </div>

      <section className="rounded-[12px] border border-[#fde68a] bg-[#fffbeb] p-4">
        <h2 className="text-[14px] font-bold text-[#92400e]">
          待回访（45 天内 / 已逾期）· {due.length}
        </h2>
        {due.length === 0 ? (
          <p className="mt-2 text-[12px] text-[#a16207]">
            暂无待办。在报告专业版填写「客户脚本」并设置回访日即可出现在此。
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {due.map((n) => (
              <li
                key={n.id}
                className="rounded-[8px] border border-[#fde68a] bg-white px-3 py-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-bold text-[#0f172a]">
                      {n.clientName}
                      {isCrmOverdue(n) ? (
                        <span className="ml-2 rounded-full bg-[#fef2f2] px-2 py-0.5 text-[10px] font-bold text-[#b91c1c]">
                          已逾期
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#64748b]">
                      {n.nextFollowUp ? `回访日 ${n.nextFollowUp}` : '未设日期'} ·{' '}
                      {expertCrmStatusLabel(n.status)}
                      {n.tags.length ? ` · ${n.tags.join('、')}` : ''}
                    </div>
                    {n.commitments ? (
                      <p className="mt-1 text-[11px] text-[#475569]">承诺：{n.commitments}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {n.reportId ? (
                      <Link
                        href={`/result/${n.reportId}?view=expert`}
                        className="rounded-full bg-[color:var(--bg-sunken)] px-2.5 py-1 text-[10px] font-bold text-[color:var(--ink-2)]"
                      >
                        报告
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void copyScript(n)}
                      className="rounded-full bg-[#f8fafc] px-2.5 py-1 text-[10px] font-bold text-[#334155] ring-1 ring-[#e2e8f0]"
                    >
                      {copiedId === n.id ? '已复制' : '回访稿'}
                    </button>
                    <button
                      type="button"
                      onClick={() => markFollowup(n, 14)}
                      className="rounded-full bg-[#eff6ff] px-2.5 py-1 text-[10px] font-bold text-[#1d4ed8]"
                    >
                      +14天
                    </button>
                    <button
                      type="button"
                      onClick={() => markDone(n)}
                      className="rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[10px] font-bold text-[#047857]"
                    >
                      结案
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-[#e2e8f0] bg-white p-4">
        <h2 className="text-[14px] font-bold text-[#0f172a]">全部客户脚本 · {all.length}</h2>
        {all.length === 0 ? (
          <p className="mt-2 text-[12px] text-[#94a3b8]">库为空。打开任意报告专业版 → 客户脚本 → 保存。</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#f1f5f9]">
            {all.map((n) => (
              <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <div className="text-[13px] font-semibold text-[#0f172a]">{n.clientName}</div>
                  <div className="text-[11px] text-[#64748b]">
                    {expertCrmStatusLabel(n.status)}
                    {n.nextFollowUp ? ` · 回访 ${n.nextFollowUp}` : ''}
                    {n.reportId ? ` · ${n.reportId.slice(0, 10)}…` : ''}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {n.reportId ? (
                    <Link
                      href={`/result/${n.reportId}?view=expert#ex-crm`}
                      className="text-[11px] font-semibold text-[color:var(--ink-2)] hover:underline"
                    >
                      编辑
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void copyScript(n)}
                    className="text-[11px] font-semibold text-[#334155] hover:underline"
                  >
                    {copiedId === n.id ? '已复制' : '复制脚本'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
