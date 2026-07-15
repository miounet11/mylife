'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ExpertCrmNote, ExpertCrmStatus } from '@/lib/expert-crm';
import {
  buildCrmFollowupScript,
  expertCrmStatusLabel,
  exportCrmCsv,
  getExpertCrmForReport,
  isCrmOverdue,
  listDueCrmFollowups,
  listExpertCrmNotes,
  upsertExpertCrmNote,
} from '@/lib/expert-crm';
import { trackProductEvent } from '@/lib/product-analytics';

const STATUSES: ExpertCrmStatus[] = ['lead', 'active', 'followup', 'done', 'paused'];

export default function ExpertCrmPanel({
  reportId,
  defaultName,
  dayMaster,
  dayun,
  doThis,
}: {
  reportId?: string;
  defaultName?: string;
  dayMaster?: string;
  dayun?: string;
  doThis?: string;
}) {
  const [note, setNote] = useState<ExpertCrmNote | null>(null);
  const [allCount, setAllCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);
  const [duePreview, setDuePreview] = useState<ExpertCrmNote[]>([]);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    clientName: defaultName || '',
    status: 'active' as ExpertCrmStatus,
    tags: '',
    sessionNotes: '',
    commitments: '',
    nextFollowUp: '',
    channel: '面谈',
  });

  useEffect(() => {
    if (!reportId) return;
    const existing = getExpertCrmForReport(reportId);
    if (existing) {
      setNote(existing);
      setForm({
        clientName: existing.clientName,
        status: existing.status,
        tags: existing.tags.join(','),
        sessionNotes: existing.sessionNotes,
        commitments: existing.commitments,
        nextFollowUp: existing.nextFollowUp || '',
        channel: existing.channel || '面谈',
      });
    } else {
      setForm((f) => ({ ...f, clientName: defaultName || f.clientName }));
    }
    setAllCount(listExpertCrmNotes().length);
    const due = listDueCrmFollowups(30);
    setDueCount(due.length);
    setDuePreview(due.slice(0, 3));
  }, [reportId, defaultName]);

  function save() {
    if (!form.clientName.trim()) return;
    const next = upsertExpertCrmNote({
      id: note?.id,
      reportId,
      clientName: form.clientName.trim(),
      status: form.status,
      tags: form.tags
        .split(/[,，\s]+/)
        .map((s) => s.trim())
        .filter(Boolean),
      sessionNotes: form.sessionNotes,
      commitments: form.commitments,
      nextFollowUp: form.nextFollowUp || undefined,
      channel: form.channel,
    });
    setNote(next);
    setAllCount(listExpertCrmNotes().length);
    const due = listDueCrmFollowups(30);
    setDueCount(due.length);
    setDuePreview(due.slice(0, 3));
    setSaved(true);
    trackProductEvent('expert_crm_saved', {
      reportId: reportId || '',
      status: form.status,
    });
    setTimeout(() => setSaved(false), 1800);
  }

  async function copyScript() {
    const target =
      note ||
      ({
        id: 'draft',
        clientName: form.clientName || '案主',
        status: form.status,
        tags: [],
        sessionNotes: form.sessionNotes,
        commitments: form.commitments,
        nextFollowUp: form.nextFollowUp || undefined,
        createdAt: '',
        updatedAt: '',
      } as ExpertCrmNote);
    const text = buildCrmFollowupScript(target, { dayMaster, dayun, doThis });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      trackProductEvent('expert_crm_script_copied', { reportId: reportId || '' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
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
    <section
      id="ex-crm"
      className="scroll-mt-header no-print rounded-[10px] border border-[#0f172a] bg-white p-4 md:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[14px] font-bold text-[#0f172a]">客户脚本 · 轻量 CRM</h2>
          <p className="mt-0.5 text-[11px] text-[#64748b]">
            本机保存面谈要点与回访日（不上云）· 库 {allCount} 条
            {dueCount ? ` · 待回访 ${dueCount}` : ''}
            {reportId ? ' · 已绑定本报告' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/expert-crm"
            className="rounded-[8px] border border-[#fbbf24] bg-[#fffbeb] px-3 py-1.5 text-[11px] font-semibold text-[#92400e]"
          >
            待回访台{dueCount ? ` (${dueCount})` : ''}
          </Link>
          <button
            type="button"
            onClick={copyScript}
            className="rounded-[8px] border border-[#cbd5e1] bg-white px-3 py-1.5 text-[11px] font-semibold"
          >
            {copied ? '已复制回访稿' : '复制回访脚本'}
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            className="rounded-[8px] border border-[#cbd5e1] bg-white px-3 py-1.5 text-[11px] font-semibold"
          >
            导出 CSV
          </button>
        </div>
      </div>

      {duePreview.length > 0 ? (
        <div className="mt-3 rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2">
          <div className="text-[11px] font-bold text-[#92400e]">近期待回访</div>
          <ul className="mt-1 space-y-1">
            {duePreview.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-[#78350f]">
                <span>
                  {d.clientName}
                  {d.nextFollowUp ? ` · ${d.nextFollowUp}` : ''}
                  {isCrmOverdue(d) ? ' · 逾期' : ''}
                </span>
                {d.reportId ? (
                  <Link href={`/result/${d.reportId}?view=expert#ex-crm`} className="font-semibold hover:underline">
                    打开
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="block text-[11px] font-semibold text-[#64748b]">
          客户称呼
          <input
            className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
            value={form.clientName}
            onChange={(e) => setForm({ ...form, clientName: e.target.value })}
            placeholder="案主姓名 / 昵称"
          />
        </label>
        <label className="block text-[11px] font-semibold text-[#64748b]">
          状态
          <select
            className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as ExpertCrmStatus })}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {expertCrmStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] font-semibold text-[#64748b]">
          标签（逗号分隔）
          <input
            className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="事业, 婚配, VIP"
          />
        </label>
        <label className="block text-[11px] font-semibold text-[#64748b]">
          下次回访
          <input
            type="date"
            className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-2 py-2 text-[13px]"
            value={form.nextFollowUp}
            onChange={(e) => setForm({ ...form, nextFollowUp: e.target.value })}
          />
        </label>
      </div>

      <label className="mt-2 block text-[11px] font-semibold text-[#64748b]">
        本次面谈要点
        <textarea
          className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
          rows={3}
          value={form.sessionNotes}
          onChange={(e) => setForm({ ...form, sessionNotes: e.target.value })}
          placeholder="案主主诉、你强调的结构点、异议…"
        />
      </label>
      <label className="mt-2 block text-[11px] font-semibold text-[#64748b]">
        案主行动承诺（30 天可验证）
        <textarea
          className="mt-1 w-full rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[13px]"
          rows={2}
          value={form.commitments}
          onChange={(e) => setForm({ ...form, commitments: e.target.value })}
          placeholder="例如：完成一次岗位复盘并记入事件本"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={save}
          className="inline-flex h-10 items-center rounded-[8px] bg-[#0f172a] px-4 text-[13px] font-semibold text-white hover:bg-black"
        >
          {saved ? '已保存' : '保存客户脚本'}
        </button>
        {note?.updatedAt ? (
          <span className="text-[10px] text-[#94a3b8]">
            上次更新 {note.updatedAt.slice(0, 16).replace('T', ' ')} · {expertCrmStatusLabel(note.status)}
          </span>
        ) : null}
      </div>
    </section>
  );
}
