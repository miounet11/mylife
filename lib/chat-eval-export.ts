/**
 * Load desensitized chat eval cases from SQLite questions table.
 * Prefer feedback-rated rows; supports full recent export for ops review.
 */

import { db } from '@/lib/database';
import { buildChatEvalCase, type ChatEvalBucket, type ChatEvalCase } from '@/lib/chat-eval';

export type ChatEvalExportOptions = {
  limit?: number;
  /** Only rows with helpful / not_helpful / empty feedback */
  onlyFeedback?: boolean;
  /** Prefer not_helpful + empty first when true */
  prioritizeNegative?: boolean;
  windowHours?: number | null;
};

export type ChatEvalExportResult = {
  generatedAt: string;
  count: number;
  byBucket: Record<string, number>;
  byFeedback: Record<string, number>;
  cases: ChatEvalCase[];
};

function parseJson(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  try {
    return JSON.parse(String(value)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function feedbackRatingFromRow(
  analysis: Record<string, unknown>,
  userFeedbackCol: unknown,
): string | null {
  const fromAnalysis = (analysis.userFeedback as { rating?: string } | undefined)?.rating;
  if (fromAnalysis) return `${fromAnalysis}`;
  const col = parseJson(userFeedbackCol);
  if (col.rating) return `${col.rating}`;
  return null;
}

export function exportChatEvalCases(
  options: ChatEvalExportOptions = {},
): ChatEvalExportResult {
  const limit = Math.max(1, Math.min(500, Math.round(options.limit || 80)));
  const onlyFeedback = options.onlyFeedback !== false;
  const prioritizeNegative = options.prioritizeNegative !== false;
  const windowHours =
    options.windowHours == null
      ? null
      : Math.max(1, Math.min(720, Math.round(options.windowHours)));

  let sinceSql: string | null = null;
  if (windowHours != null) {
    const sinceRow = db
      .prepare(`SELECT datetime('now', ?) AS s`)
      .get(`-${windowHours} hours`) as { s?: string };
    sinceSql = sinceRow?.s || null;
  }

  const where: string[] = [`a.category = 'chat_assistant'`];
  const params: unknown[] = [];

  if (sinceSql) {
    where.push(`datetime(a.created_at) >= datetime(?)`);
    params.push(sinceSql);
  }

  if (onlyFeedback) {
    where.push(`(
      json_extract(a.analysis, '$.userFeedback.rating') IS NOT NULL
      OR (a.user_feedback IS NOT NULL AND a.user_feedback != '' AND a.user_feedback != 'null')
    )`);
  }

  const order = prioritizeNegative
    ? `ORDER BY
        CASE COALESCE(json_extract(a.analysis, '$.userFeedback.rating'), json_extract(a.user_feedback, '$.rating'), '')
          WHEN 'not_helpful' THEN 0
          WHEN 'empty' THEN 1
          WHEN 'helpful' THEN 2
          ELSE 3
        END,
        datetime(a.created_at) DESC`
    : `ORDER BY datetime(a.created_at) DESC`;

  const sql = `
    SELECT
      a.id AS id,
      a.question AS answer_text,
      a.analysis AS analysis_json,
      a.user_feedback AS user_feedback,
      a.created_at AS created_at,
      u.question AS user_question,
      u.analysis AS user_analysis
    FROM questions a
    LEFT JOIN questions u
      ON u.id = json_extract(a.analysis, '$.responseToQuestionId')
    WHERE ${where.join(' AND ')}
    ${order}
    LIMIT ?
  `;

  params.push(limit);

  let rows: Array<{
    id: string;
    answer_text: string;
    analysis_json: string | null;
    user_feedback: string | null;
    created_at: string | null;
    user_question: string | null;
    user_analysis: string | null;
  }> = [];

  try {
    rows = db.prepare(sql).all(...params) as typeof rows;
  } catch (error) {
    console.error('[chat-eval-export] query failed', error);
    rows = [];
  }

  const cases: ChatEvalCase[] = [];
  const byBucket: Record<string, number> = {};
  const byFeedback: Record<string, number> = {};

  for (const row of rows) {
    const analysis = parseJson(row.analysis_json);
    const answer =
      `${analysis.answer || row.answer_text || ''}`.trim() || `${row.answer_text || ''}`.trim();
    const question = `${row.user_question || ''}`.trim() || '(missing question)';
    const rating = feedbackRatingFromRow(analysis, row.user_feedback);

    const evalCase = buildChatEvalCase({
      id: row.id,
      question,
      answer,
      llmUsed:
        analysis.llmUsed === undefined || analysis.llmUsed === null
          ? null
          : !!analysis.llmUsed,
      fallbackReason: analysis.fallbackReason ? `${analysis.fallbackReason}` : null,
      reportId: analysis.reportId ? `${analysis.reportId}` : null,
      intent: analysis.intent ? `${analysis.intent}` : null,
      createdAt: row.created_at,
      feedbackRating: rating,
      structureFilled:
        analysis.structureFilled != null ? Number(analysis.structureFilled) : null,
      structureRich:
        analysis.structureRich === undefined || analysis.structureRich === null
          ? null
          : !!analysis.structureRich,
      efcOk:
        analysis.efcOk === undefined || analysis.efcOk === null ? null : !!analysis.efcOk,
    });

    cases.push(evalCase);
    byBucket[evalCase.bucket] = (byBucket[evalCase.bucket] || 0) + 1;
    const fbKey = rating || 'none';
    byFeedback[fbKey] = (byFeedback[fbKey] || 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    count: cases.length,
    byBucket,
    byFeedback,
    cases,
  };
}

export function chatEvalCasesToJsonl(cases: ChatEvalCase[]): string {
  return cases.map((c) => JSON.stringify(c)).join('\n') + (cases.length ? '\n' : '');
}

export function summarizeBuckets(byBucket: Record<string, number>): Array<{
  bucket: ChatEvalBucket | string;
  count: number;
}> {
  return Object.entries(byBucket)
    .map(([bucket, count]) => ({ bucket, count }))
    .sort((a, b) => b.count - a.count);
}
