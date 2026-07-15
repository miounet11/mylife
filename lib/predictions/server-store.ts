import 'server-only';

import type { Prediction, PredictionOutcome } from './types';

type PredictionRow = {
  id: string;
  user_id: string;
  report_id: string;
  birth_signature: string;
  category: string;
  statement: string;
  confidence: number;
  due_date: string;
  window_label: string | null;
  evidence: string | null;
  verify_checklist: string | null;
  outcome: string | null;
  user_feedback: string | null;
  created_at: string;
  updated_at: string;
};

function getOperations() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { predictionOperations } = require('@/lib/database') as {
      predictionOperations?: {
        listByUserId: (userId: string) => Prediction[];
        upsertMany: (userId: string, predictions: Prediction[]) => void;
        updateOutcome: (
          userId: string,
          id: string,
          outcome: PredictionOutcome,
          feedback?: string,
        ) => Prediction | null;
      };
    };
    return predictionOperations || null;
  } catch {
    return null;
  }
}

function mapRow(row: PredictionRow): Prediction {
  let checklist: string[] = [];
  try {
    const parsed = JSON.parse(row.verify_checklist || '[]');
    checklist = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    checklist = [];
  }

  return {
    id: row.id,
    reportId: row.report_id,
    birthSignature: row.birth_signature || '',
    category: row.category as Prediction['category'],
    statement: row.statement,
    confidence: row.confidence,
    dueDate: row.due_date,
    window: row.window_label || undefined,
    evidence: row.evidence || '',
    verifyChecklist: checklist,
    outcome: (row.outcome as PredictionOutcome | null) || 'pending',
    userFeedback: row.user_feedback || undefined,
    createdAt: row.created_at,
  };
}

export function listPredictionsForUser(userId: string): Prediction[] {
  const ops = getOperations();
  if (!ops) return [];
  return ops.listByUserId(userId);
}

export function upsertPredictionsForUser(userId: string, predictions: Prediction[]): number {
  const ops = getOperations();
  if (!ops || !predictions.length) return 0;
  ops.upsertMany(userId, predictions);
  return predictions.length;
}

export function updatePredictionOutcomeForUser(
  userId: string,
  id: string,
  outcome: PredictionOutcome,
  feedback?: string,
): Prediction | null {
  const ops = getOperations();
  if (!ops) return null;
  return ops.updateOutcome(userId, id, outcome, feedback);
}

export { mapRow };