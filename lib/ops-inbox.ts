/**
 * Unified ops inbox: site feedback + client errors + generation calibration.
 */

import { classifyFeedbackSignal } from '@/lib/feedback-signal';
import { summarizeClientErrors } from '@/lib/client-error-log';
import { listSiteFeedback } from '@/lib/user-feedback-store';
import { summarizeCohortJudgments } from '@/lib/cohort-lenses/ops-log';
import type { OpsInboxSnapshot } from '@/lib/ops-inbox-view';

export type { OpsInboxSnapshot } from '@/lib/ops-inbox-view';
export { formatInboxAge } from '@/lib/ops-inbox-view';

export function buildOpsInboxSnapshot(): OpsInboxSnapshot {
  const items = listSiteFeedback({ limit: 200, status: 'all' });
  const now = Date.now();
  const byKind: Record<string, number> = {};
  let lastAt: string | null = null;
  let lastFreeformAt: string | null = null;
  let lastFreeformPreview: string | null = null;
  let last24h = 0;
  let last7d = 0;
  let unread = 0;
  let freeformNew = 0;

  for (const item of items) {
    const kind = classifyFeedbackSignal(item.message);
    byKind[kind] = (byKind[kind] || 0) + 1;
    if (item.status === 'new') unread += 1;
    if (item.status === 'new' && kind === 'freeform') freeformNew += 1;
    if (item.createdAt && (!lastAt || item.createdAt > lastAt)) lastAt = item.createdAt;
    const at = Date.parse(item.createdAt || '') || 0;
    if (at >= now - 86400000) last24h += 1;
    if (at >= now - 7 * 86400000) last7d += 1;
    if (kind === 'freeform' && item.createdAt && (!lastFreeformAt || item.createdAt > lastFreeformAt)) {
      lastFreeformAt = item.createdAt;
      lastFreeformPreview = item.message.replace(/\s+/g, ' ').slice(0, 80);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    feedback: {
      total: items.length,
      unread,
      lastAt,
      lastFreeformAt,
      lastFreeformPreview,
      last24h,
      last7d,
      freeformNew,
      byKind,
    },
    errors: summarizeClientErrors({ days: 7, limit: 200 }),
    cohort: summarizeCohortJudgments(7),
  };
}
