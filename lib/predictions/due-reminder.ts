import type { Prediction, PredictionCategory } from './types';
import { parseDimensionSlugFromReportId } from './dimension-source';

export const PREDICTION_DUE_UPCOMING_DAYS = 7;
export const PREDICTION_DUE_OVERDUE_LOOKBACK_DAYS = 14;

export type DueReminderItem = {
  id: string;
  userId: string;
  reportId: string;
  statement: string;
  dueDate: string;
  window?: string;
  category: PredictionCategory;
  email: string;
  userName?: string | null;
  /** Optional ten-dimension slug for deeper CTA */
  dimensionSlug?: string | null;
};

export type DueReminderBucket = 'upcoming' | 'overdue';

export function classifyDueReminderItem(
  dueDate: string,
  reference = new Date(),
): DueReminderBucket | null {
  const due = new Date(`${dueDate}T23:59:59`);
  if (Number.isNaN(due.getTime())) return null;

  const today = new Date(reference);
  today.setHours(0, 0, 0, 0);
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);

  if (diffDays >= 0 && diffDays <= PREDICTION_DUE_UPCOMING_DAYS) {
    return 'upcoming';
  }
  if (diffDays < 0 && diffDays >= -PREDICTION_DUE_OVERDUE_LOOKBACK_DAYS) {
    return 'overdue';
  }
  return null;
}

export function groupDueRemindersByEmail(items: DueReminderItem[]) {
  const grouped = new Map<string, DueReminderItem[]>();
  for (const item of items) {
    const email = item.email.trim().toLowerCase();
    if (!email.includes('@')) continue;
    const bucket = grouped.get(email) || [];
    bucket.push(item);
    grouped.set(email, bucket);
  }
  return grouped;
}

export function toDueReminderCampaign(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `prediction-due-${y}-${m}-${d}`;
}

export function mapPredictionToDueReminder(
  row: {
    id: string;
    user_id: string;
    report_id: string;
    statement: string;
    due_date: string;
    window_label?: string | null;
    category: string;
    email: string;
    name?: string | null;
    dimension_slug?: string | null;
  },
): DueReminderItem {
  return {
    id: row.id,
    userId: row.user_id,
    reportId: row.report_id,
    statement: row.statement,
    dueDate: row.due_date,
    dimensionSlug: row.dimension_slug || parseDimensionSlugFromReportId(row.report_id) || undefined,
    window: row.window_label || undefined,
    category: row.category as PredictionCategory,
    email: row.email,
    userName: row.name || null,
  };
}