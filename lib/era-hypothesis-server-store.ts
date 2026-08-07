/**
 * Server persistence for era hypothesis revisit scores (cross-device).
 * Self-contained SQLite table — does not require production database.ts patches.
 */

import 'server-only';

import type { EraHypothesisOutcome, EraHypothesisScore } from '@/lib/era-hypothesis-store';

type ScoreRow = {
  id: string;
  user_id: string;
  hypothesis_id: string;
  outcome: string;
  note: string | null;
  scored_at: string | null;
  updated_at: string;
};

let schemaReady = false;

function getDb(): {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    all: (...args: unknown[]) => unknown[];
    get: (...args: unknown[]) => unknown;
    run: (...args: unknown[]) => unknown;
  };
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/lib/database') as { db?: typeof import('@/lib/database').db };
    return (mod.db as never) || null;
  } catch {
    return null;
  }
}

function ensureSchema() {
  if (schemaReady) return;
  const db = getDb();
  if (!db?.exec) return;
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS era_hypothesis_scores (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        hypothesis_id TEXT NOT NULL,
        outcome TEXT NOT NULL DEFAULT 'pending',
        note TEXT,
        scored_at TEXT,
        updated_at TEXT DEFAULT (datetime('now')),
        UNIQUE(user_id, hypothesis_id)
      );
      CREATE INDEX IF NOT EXISTS idx_era_hypothesis_scores_user
        ON era_hypothesis_scores(user_id, datetime(updated_at) DESC);
    `);
    schemaReady = true;
  } catch (error) {
    console.error('[era-hypothesis-server-store] ensureSchema failed:', error);
  }
}

function mapRow(row: ScoreRow): EraHypothesisScore {
  return {
    hypothesisId: row.hypothesis_id,
    outcome: (row.outcome as EraHypothesisOutcome) || 'pending',
    note: row.note || undefined,
    scoredAt: row.scored_at || undefined,
    updatedAt: row.updated_at,
  };
}

export function listEraHypothesisScoresForUser(userId: string): EraHypothesisScore[] {
  if (!userId) return [];
  ensureSchema();
  const db = getDb();
  if (!db?.prepare) return [];
  try {
    const rows = db
      .prepare(
        `SELECT * FROM era_hypothesis_scores WHERE user_id = ? ORDER BY datetime(updated_at) DESC`,
      )
      .all(userId) as ScoreRow[];
    return (rows || []).map(mapRow);
  } catch {
    return [];
  }
}

export function upsertEraHypothesisScoresForUser(
  userId: string,
  scores: EraHypothesisScore[],
): number {
  if (!userId || !scores.length) return 0;
  ensureSchema();
  const db = getDb();
  if (!db?.prepare) return 0;

  let saved = 0;
  try {
    const stmt = db.prepare(`
      INSERT INTO era_hypothesis_scores (
        id, user_id, hypothesis_id, outcome, note, scored_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, hypothesis_id) DO UPDATE SET
        outcome = excluded.outcome,
        note = excluded.note,
        scored_at = COALESCE(era_hypothesis_scores.scored_at, excluded.scored_at),
        updated_at = excluded.updated_at
      WHERE excluded.updated_at >= era_hypothesis_scores.updated_at
         OR era_hypothesis_scores.updated_at IS NULL
    `);

    for (const score of scores) {
      const hypothesisId = `${score.hypothesisId || ''}`.trim();
      if (!hypothesisId) continue;
      const outcome = score.outcome || 'pending';
      if (!['hit', 'partial', 'miss', 'pending'].includes(outcome)) continue;
      const updatedAt = score.updatedAt || new Date().toISOString();
      const scoredAt = score.scoredAt || (outcome !== 'pending' ? updatedAt : null);
      const id = `era_${userId}_${hypothesisId}`.slice(0, 120);
      stmt.run(
        id,
        userId,
        hypothesisId,
        outcome,
        score.note || null,
        scoredAt,
        updatedAt,
      );
      saved += 1;
    }
  } catch (error) {
    console.error('[era-hypothesis-server-store] upsert failed:', error);
  }
  return saved;
}

export function deleteEraHypothesisScoreForUser(userId: string, hypothesisId: string): boolean {
  if (!userId || !hypothesisId) return false;
  ensureSchema();
  const db = getDb();
  if (!db?.prepare) return false;
  try {
    db.prepare(`DELETE FROM era_hypothesis_scores WHERE user_id = ? AND hypothesis_id = ?`).run(
      userId,
      hypothesisId,
    );
    return true;
  } catch {
    return false;
  }
}
