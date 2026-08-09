/**
 * Export report samples flagged "偏差较大" from site_feedback for ops review.
 */

import { db } from '@/lib/database';
import { fortuneOperations } from '@/lib/database';
import { classifyFeedbackSignal, parseCalibrationMeta } from '@/lib/feedback-signal';

export type AccuracyBadSample = {
  feedbackId: string;
  reportId: string | null;
  level: string | null;
  message: string;
  pageUrl: string | null;
  userId: string | null;
  createdAt: string;
  status: string;
  report?: {
    id: string;
    name?: string | null;
    intent?: string | null;
    createdAt?: string | null;
    dayMaster?: string | null;
    pattern?: string | null;
    currentDaYun?: string | null;
    calibrationScore?: number | null;
    accuracyRating?: unknown;
    opening?: string | null;
    summary?: string | null;
  } | null;
};

export type AccuracyEvalExport = {
  generatedAt: string;
  count: number;
  withReport: number;
  samples: AccuracyBadSample[];
};

function parseJson(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  try {
    return JSON.parse(String(value)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function exportAccuracyBadSamples(options?: {
  limit?: number;
  windowDays?: number;
  includePartial?: boolean;
}): AccuracyEvalExport {
  const limit = Math.max(1, Math.min(100, options?.limit || 40));
  const windowDays = Math.max(1, Math.min(90, options?.windowDays || 30));
  const includePartial = options?.includePartial === true;

  const sinceRow = db
    .prepare(`SELECT datetime('now', ?) AS s`)
    .get(`-${windowDays} days`) as { s?: string };
  const since = sinceRow?.s || null;

  const rows = db
    .prepare(
      `
      SELECT id, category, message, page_url, user_id, status, created_at
      FROM site_feedback
      WHERE datetime(created_at) >= datetime(?)
        AND (
          message LIKE '%报告准确度反馈%'
          OR message LIKE '%偏差较大%'
          OR message LIKE '%部分准%'
          OR message LIKE '%整体较准%'
        )
      ORDER BY datetime(created_at) DESC
      LIMIT ?
    `,
    )
    .all(since || '1970-01-01', limit * 3) as Array<{
    id: string;
    category: string;
    message: string;
    page_url: string | null;
    user_id: string | null;
    status: string;
    created_at: string;
  }>;

  const samples: AccuracyBadSample[] = [];

  for (const row of rows) {
    const kind = classifyFeedbackSignal(row.message);
    if (kind !== 'accuracy' && !/报告准确度反馈|偏差较大|部分准|整体较准/.test(row.message)) {
      continue;
    }
    const meta = parseCalibrationMeta(row.message);
    const isBad = meta.level === 'bad' || /偏差较大/.test(row.message);
    const isPartial = meta.level === 'partial' || /部分准/.test(row.message);
    if (!isBad && !(includePartial && isPartial)) continue;

    let report: AccuracyBadSample['report'] = null;
    const reportId = meta.reportId;
    if (reportId) {
      try {
        const getById = (fortuneOperations as { getById?: (id: string) => any }).getById;
        const f = typeof getById === 'function' ? getById(reportId) : null;
        if (f) {
          const analysis = f.analysis || parseJson(f.analysis);
          const engine = f.engineResult || f.engine_result || analysis?.engineResult || {};
          report = {
            id: f.id || reportId,
            name: f.name || null,
            intent: f.intent || analysis?.intent || null,
            createdAt: f.createdAt || f.created_at || null,
            dayMaster: engine?.dayMaster || analysis?.dayMaster || null,
            pattern: engine?.pattern?.type || analysis?.pattern || null,
            currentDaYun: engine?.fortune?.currentDaYun || analysis?.currentDaYun || null,
            calibrationScore:
              typeof analysis?.calibrationScore === 'number' ? analysis.calibrationScore : null,
            accuracyRating: analysis?.userAccuracyRating || null,
            opening: analysis?.opening || analysis?.summary?.slice?.(0, 200) || null,
            summary:
              typeof analysis?.summary === 'string'
                ? analysis.summary.slice(0, 400)
                : null,
          };
        }
      } catch {
        report = null;
      }
    }

    samples.push({
      feedbackId: row.id,
      reportId,
      level: meta.level || (isBad ? 'bad' : isPartial ? 'partial' : null),
      message: row.message,
      pageUrl: row.page_url,
      userId: row.user_id,
      createdAt: row.created_at,
      status: row.status,
      report,
    });

    if (samples.length >= limit) break;
  }

  return {
    generatedAt: new Date().toISOString(),
    count: samples.length,
    withReport: samples.filter((s) => s.report).length,
    samples,
  };
}
