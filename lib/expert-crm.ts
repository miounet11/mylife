/**
 * 专业版轻量 CRM：本机客户脚本 / 回访记录
 * 不依赖服务端，适合开业单机；有 reportId 时与报告绑定。
 */

export type ExpertCrmStatus = 'lead' | 'active' | 'followup' | 'done' | 'paused';

export interface ExpertCrmNote {
  id: string;
  reportId?: string;
  clientName: string;
  status: ExpertCrmStatus;
  tags: string[];
  /** 本次面谈要点 */
  sessionNotes: string;
  /** 给案主的行动承诺 */
  commitments: string;
  /** 下次回访日 YYYY-MM-DD */
  nextFollowUp?: string;
  phoneHint?: string;
  channel?: string;
  updatedAt: string;
  createdAt: string;
}

const STORAGE_KEY = 'lk_expert_crm_v1';

const STATUS_LABEL: Record<ExpertCrmStatus, string> = {
  lead: '线索',
  active: '服务中',
  followup: '待回访',
  done: '已结案',
  paused: '暂停',
};

export function expertCrmStatusLabel(s: ExpertCrmStatus) {
  return STATUS_LABEL[s] || s;
}

function readAll(): ExpertCrmNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExpertCrmNote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: ExpertCrmNote[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function listExpertCrmNotes(reportId?: string): ExpertCrmNote[] {
  const all = readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  if (!reportId) return all;
  return all.filter((n) => n.reportId === reportId);
}

/** 待回访：有 nextFollowUp 且状态非 done，按日期升序 */
export function listDueCrmFollowups(withinDays = 30, reference = new Date()): ExpertCrmNote[] {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + withinDays);
  const startKey = start.toISOString().slice(0, 10);
  const endKey = end.toISOString().slice(0, 10);

  return listExpertCrmNotes()
    .filter((n) => {
      if (n.status === 'done' || n.status === 'paused') return false;
      if (!n.nextFollowUp) return n.status === 'followup';
      return n.nextFollowUp <= endKey;
    })
    .sort((a, b) => {
      const da = a.nextFollowUp || '9999';
      const db = b.nextFollowUp || '9999';
      if (da !== db) return da.localeCompare(db);
      return b.updatedAt.localeCompare(a.updatedAt);
    })
    .map((n) => n);
}

export function isCrmOverdue(note: ExpertCrmNote, reference = new Date()): boolean {
  if (!note.nextFollowUp) return note.status === 'followup';
  const today = reference.toISOString().slice(0, 10);
  return note.nextFollowUp < today && note.status !== 'done';
}

export function getExpertCrmForReport(reportId: string): ExpertCrmNote | null {
  return listExpertCrmNotes(reportId)[0] || null;
}

export function upsertExpertCrmNote(
  input: Partial<ExpertCrmNote> & { clientName: string }
): ExpertCrmNote {
  const all = readAll();
  const now = new Date().toISOString();
  const existingIdx =
    input.id != null
      ? all.findIndex((n) => n.id === input.id)
      : input.reportId
        ? all.findIndex((n) => n.reportId === input.reportId)
        : -1;

  if (existingIdx >= 0) {
    const prev = all[existingIdx]!;
    const next: ExpertCrmNote = {
      ...prev,
      ...input,
      clientName: input.clientName || prev.clientName,
      tags: input.tags ?? prev.tags,
      status: input.status || prev.status,
      updatedAt: now,
    };
    all[existingIdx] = next;
    writeAll(all);
    return next;
  }

  const created: ExpertCrmNote = {
    id: `crm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    reportId: input.reportId,
    clientName: input.clientName,
    status: input.status || 'active',
    tags: input.tags || [],
    sessionNotes: input.sessionNotes || '',
    commitments: input.commitments || '',
    nextFollowUp: input.nextFollowUp,
    phoneHint: input.phoneHint,
    channel: input.channel,
    createdAt: now,
    updatedAt: now,
  };
  writeAll([created, ...all]);
  return created;
}

export function deleteExpertCrmNote(id: string) {
  writeAll(readAll().filter((n) => n.id !== id));
}

/** 一键生成回访话术草稿 */
export function buildCrmFollowupScript(note: ExpertCrmNote, context?: {
  dayMaster?: string;
  dayun?: string;
  doThis?: string;
}): string {
  const lines = [
    `【回访脚本 · ${note.clientName}】`,
    note.nextFollowUp ? `约定回访：${note.nextFollowUp}` : '',
    context?.dayMaster ? `结构：日主 ${context.dayMaster}${context.dayun ? ` · 运 ${context.dayun}` : ''}` : '',
    '',
    '1）先问结果：上次约定的行动完成了吗？',
    note.commitments ? `   上次承诺：${note.commitments}` : '',
    '2）对照现实：哪一条判断对了 / 偏了？',
    '3）本周只改一件事：',
    context?.doThis ? `   建议：${context.doThis}` : '   （结合最新报告「现在最该做」）',
    '4）预约下次：',
    note.nextFollowUp ? `   已定 ${note.nextFollowUp}` : '   建议 14–30 天后再对照',
    '',
    note.sessionNotes ? `面谈底稿：\n${note.sessionNotes}` : '',
  ].filter((x) => x !== undefined);
  return lines.join('\n').trim();
}

export function exportCrmCsv(notes: ExpertCrmNote[]): string {
  const header = ['id', 'clientName', 'status', 'tags', 'nextFollowUp', 'reportId', 'updatedAt'];
  const rows = notes.map((n) =>
    [
      n.id,
      csvEscape(n.clientName),
      n.status,
      csvEscape(n.tags.join('|')),
      n.nextFollowUp || '',
      n.reportId || '',
      n.updatedAt,
    ].join(',')
  );
  return [header.join(','), ...rows].join('\n');
}

function csvEscape(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
