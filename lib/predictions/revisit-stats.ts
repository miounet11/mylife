/**
 * Pure summarizer for prediction revisit / outcome rows.
 * Never invents rates — empty or unresolved input yields zero counts.
 */

export type PredictionRevisitStats = {
  /** 已回访（有明确结果）条数；不含 pending */
  predictionCount: number;
  /** 命中 / accurate / fulfilled */
  hitCount: number;
  partialCount?: number;
  missCount?: number;
};

export type PredictionRevisitRow = {
  status?: string;
  outcome?: string;
  score?: number;
  result?: string;
};

type RevisitBucket = 'hit' | 'partial' | 'miss' | 'pending';

/**
 * Classify a free-form status/outcome/result label into a revisit bucket.
 * Order matters: check miss/partial before hit so 「未命中」「部分命中」 are not misread as 命中.
 */
export function classifyPredictionRevisitLabel(raw: unknown): RevisitBucket {
  const label = `${raw ?? ''}`.trim().toLowerCase();
  if (!label) return 'pending';

  // Explicit miss (before 命中 substring)
  if (
    label === 'miss' ||
    label === 'missed' ||
    label === 'unfulfilled' ||
    label.includes('未命中') ||
    label.includes('不中') ||
    label === 'drift' ||
    label === 'fail' ||
    label === 'failed'
  ) {
    return 'miss';
  }

  // Partial
  if (
    label === 'partial' ||
    label.includes('部分') ||
    label.includes('partial')
  ) {
    return 'partial';
  }

  // Hit / accurate
  if (
    label === 'hit' ||
    label === 'fulfilled' ||
    label === 'accurate' ||
    label === 'success' ||
    label.includes('命中') ||
    label.includes('准确') ||
    label.includes('应验')
  ) {
    return 'hit';
  }

  // Still open
  if (
    label === 'pending' ||
    label === 'open' ||
    label.includes('待') ||
    label.includes('未验证') ||
    label.includes('pending')
  ) {
    return 'pending';
  }

  return 'pending';
}

function classifyRow(row: PredictionRevisitRow): RevisitBucket {
  // Prefer explicit textual outcome fields over score
  const fromOutcome = classifyPredictionRevisitLabel(row.outcome);
  if (fromOutcome !== 'pending') return fromOutcome;

  const fromStatus = classifyPredictionRevisitLabel(row.status);
  if (fromStatus !== 'pending') return fromStatus;

  const fromResult = classifyPredictionRevisitLabel(row.result);
  if (fromResult !== 'pending') return fromResult;

  // Optional numeric score fallback (0–1 or 0–100)
  if (row.score != null && Number.isFinite(Number(row.score))) {
    const n = Number(row.score);
    const ratio = n > 1 ? n / 100 : n;
    if (ratio >= 0.7) return 'hit';
    if (ratio >= 0.4) return 'partial';
    if (ratio >= 0) return 'miss';
  }

  return 'pending';
}

/**
 * Summarize revisit outcomes from prediction-like rows.
 * `predictionCount` = resolved revisits only (hit + partial + miss).
 */
export function summarizePredictionRevisits(
  rows: Array<PredictionRevisitRow | null | undefined> | null | undefined,
): PredictionRevisitStats {
  let hitCount = 0;
  let partialCount = 0;
  let missCount = 0;

  if (!Array.isArray(rows) || rows.length === 0) {
    return { predictionCount: 0, hitCount: 0, partialCount: 0, missCount: 0 };
  }

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const bucket = classifyRow(row);
    if (bucket === 'hit') hitCount += 1;
    else if (bucket === 'partial') partialCount += 1;
    else if (bucket === 'miss') missCount += 1;
  }

  return {
    predictionCount: hitCount + partialCount + missCount,
    hitCount,
    partialCount,
    missCount,
  };
}
