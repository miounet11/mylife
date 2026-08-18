/**
 * Server-side generation-calibration judgment ledger (JSONL).
 * Admin inbox reads this; does not flood site_feedback.
 */

import fs from 'fs';
import path from 'path';
import type { CohortJudgment, CohortRegion, CohortVerdict } from './types';

export type CohortOpsEntry = {
  at: string;
  reportId?: string | null;
  birthYear?: number | null;
  cohortKey?: string | null;
  region?: CohortRegion | null;
  claimId: string;
  lensId: string;
  verdict: CohortVerdict;
  forkId?: string | null;
};

function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function logPath(day = dayKey()) {
  return path.join(process.cwd(), 'data', 'ops', 'cohort-judgments', `${day}.jsonl`);
}

export function appendCohortJudgmentLog(entry: Omit<CohortOpsEntry, 'at'> & { at?: string }): void {
  const full: CohortOpsEntry = {
    at: entry.at || new Date().toISOString(),
    reportId: entry.reportId || null,
    birthYear: entry.birthYear ?? null,
    cohortKey: entry.cohortKey || null,
    region: entry.region || null,
    claimId: entry.claimId,
    lensId: entry.lensId,
    verdict: entry.verdict,
    forkId: entry.forkId || null,
  };
  try {
    const file = logPath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, `${JSON.stringify(full)}\n`, 'utf8');
  } catch (error) {
    console.error('[cohort-ops-log] append failed', error);
  }
}

export function appendCohortJudgmentsLog(
  judgments: CohortJudgment[],
  meta: {
    reportId?: string | null;
    birthYear?: number | null;
    cohortKey?: string | null;
    region?: CohortRegion | null;
  },
): void {
  for (const item of judgments) {
    appendCohortJudgmentLog({
      reportId: meta.reportId,
      birthYear: meta.birthYear,
      cohortKey: meta.cohortKey,
      region: meta.region,
      claimId: item.claimId,
      lensId: item.lensId,
      verdict: item.verdict,
      forkId: item.forkId,
      at: item.judgedAt,
    });
  }
}

export type CohortOpsSummary = {
  total: number;
  last24h: number;
  lastAt: string | null;
  byVerdict: Record<string, number>;
  byLens: Array<{ lensId: string; count: number }>;
};

export function summarizeCohortJudgments(days = 7): CohortOpsSummary {
  const byVerdict: Record<string, number> = {
    like: 0,
    partial: 0,
    unlike: 0,
    unsure: 0,
  };
  const lensCounts = new Map<string, number>();
  let total = 0;
  let last24h = 0;
  let lastAt: string | null = null;
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  for (let i = 0; i < Math.max(1, Math.min(14, days)); i += 1) {
    const d = new Date(Date.now() - i * 86400000);
    const file = logPath(dayKey(d));
    if (!fs.existsSync(file)) continue;
    try {
      const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const row = JSON.parse(line) as CohortOpsEntry;
          total += 1;
          const at = Date.parse(row.at || '') || 0;
          if (row.at && (!lastAt || row.at > lastAt)) lastAt = row.at;
          if (at >= cutoff) last24h += 1;
          const verdict = `${row.verdict || 'unsure'}`;
          byVerdict[verdict] = (byVerdict[verdict] || 0) + 1;
          const lensId = `${row.lensId || 'unknown'}`;
          lensCounts.set(lensId, (lensCounts.get(lensId) || 0) + 1);
        } catch {
          // skip
        }
      }
    } catch {
      // skip day
    }
  }

  return {
    total,
    last24h,
    lastAt,
    byVerdict,
    byLens: [...lensCounts.entries()]
      .map(([lensId, count]) => ({ lensId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7),
  };
}
