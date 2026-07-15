/**
 * 大众路径：报告回访节奏（本机）
 */

const STORAGE_KEY = 'lk_report_visits_v1';

export interface ReportVisitRecord {
  reportId: string;
  firstVisitedAt: string;
  lastVisitedAt: string;
  visitCount: number;
  /** 用户标记「已完成 30 天回访」 */
  lastReviewAt?: string;
}

function readMap(): Record<string, ReportVisitRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ReportVisitRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, ReportVisitRecord>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function markReportVisited(reportId: string, at = new Date()): ReportVisitRecord {
  const map = readMap();
  const now = at.toISOString();
  const prev = map[reportId];
  const next: ReportVisitRecord = prev
    ? {
        ...prev,
        lastVisitedAt: now,
        visitCount: (prev.visitCount || 1) + 1,
      }
    : {
        reportId,
        firstVisitedAt: now,
        lastVisitedAt: now,
        visitCount: 1,
      };
  map[reportId] = next;
  writeMap(map);
  return next;
}

export function markReportReviewed(reportId: string, at = new Date()): ReportVisitRecord {
  const map = readMap();
  const base = map[reportId] || markReportVisited(reportId, at);
  const next = { ...base, lastReviewAt: at.toISOString(), lastVisitedAt: at.toISOString() };
  map[reportId] = next;
  writeMap(map);
  return next;
}

export function getReportVisit(reportId: string): ReportVisitRecord | null {
  return readMap()[reportId] || null;
}

export function daysSince(iso?: string, reference = new Date()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  const ms = reference.getTime() - t;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export type RevisitUrgency = 'due' | 'soon' | 'fresh';

export function computeRevisitState(
  reportId: string,
  opts?: { revisitHint?: string; reference?: Date }
): {
  visit: ReportVisitRecord | null;
  daysSinceVisit: number | null;
  daysSinceReview: number | null;
  urgency: RevisitUrgency;
  headline: string;
  body: string;
} {
  const visit = getReportVisit(reportId);
  const ref = opts?.reference || new Date();
  const sinceVisit = daysSince(visit?.lastVisitedAt, ref);
  const sinceReview = daysSince(visit?.lastReviewAt || visit?.firstVisitedAt, ref);

  let urgency: RevisitUrgency = 'fresh';
  if (sinceReview != null && sinceReview >= 30) urgency = 'due';
  else if (sinceReview != null && sinceReview >= 21) urgency = 'soon';
  else if (sinceVisit != null && sinceVisit >= 30) urgency = 'due';
  else if (sinceVisit != null && sinceVisit >= 21) urgency = 'soon';

  const headline =
    urgency === 'due'
      ? '该回来对照了（约 30 天周期）'
      : urgency === 'soon'
        ? '回访窗口临近'
        : '建议 30 天后带着现实反馈再看';

  const body =
    urgency === 'due'
      ? `距上次对照约 ${sinceReview ?? sinceVisit ?? 30} 天。用预测回访打分 + 事件本记结果，系统会越来越贴近你。`
      : urgency === 'soon'
        ? `再过约 ${Math.max(1, 30 - (sinceReview ?? sinceVisit ?? 0))} 天建议做一次完整对照。${opts?.revisitHint || ''}`
        : opts?.revisitHint || '把「现在最该做」执行起来，到期在预测页与事件本闭环。';

  return {
    visit,
    daysSinceVisit: sinceVisit,
    daysSinceReview: sinceReview,
    urgency,
    headline,
    body,
  };
}
