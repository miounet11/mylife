/**
 * Repair fortunes where stored birth_time drifted from calculationIdentity.clockBirthTime.
 *
 * Policy: chart identity (locked at analyze) is source of truth for pillars.
 * - Normalize HH:mm:ss → HH:mm
 * - If identity clock differs from stored birth_time, set birth_time = identity clock
 *   (does NOT recompute pillars — those already match identity fingerprint)
 *
 *   npx tsx scripts/repair-chart-identity-drift.ts --dry-run
 *   npx tsx scripts/repair-chart-identity-drift.ts --apply
 */

import Database from 'better-sqlite3';
import path from 'node:path';

function normalizeClockTime(value?: string | null): string {
  const raw = `${value || ''}`.trim();
  if (!raw) return '';
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!m) return raw;
  return `${String(Number(m[1])).padStart(2, '0')}:${m[2]}`;
}

function main() {
  const apply = process.argv.includes('--apply');
  const dbPath =
    process.env.LIFEKLINE_DB ||
    path.join(process.cwd(), 'data', 'lifekline.db');
  const db = new Database(dbPath);
  const rows = db
    .prepare(
      `SELECT id, user_id, birth_date, birth_time, birth_place, analysis
       FROM fortunes
       WHERE deleted_at IS NULL OR deleted_at = ''`,
    )
    .all() as Array<{
    id: string;
    user_id: string;
    birth_date: string;
    birth_time: string;
    birth_place: string;
    analysis: string;
  }>;

  let scanned = 0;
  let mismatched = 0;
  let fixed = 0;
  const samples: Array<Record<string, string>> = [];

  const updateFortune = db.prepare(
    `UPDATE fortunes SET birth_time = ?, updated_at = ? WHERE id = ?`,
  );
  const updateUser = db.prepare(
    `UPDATE users SET birth_time = ?, updated_at = ? WHERE id = ? AND birth_time IS NOT NULL`,
  );

  for (const row of rows) {
    scanned += 1;
    let analysis: Record<string, unknown> = {};
    try {
      analysis = JSON.parse(row.analysis || '{}');
    } catch {
      continue;
    }
    const signals = (analysis.contextSignals || {}) as Record<string, unknown>;
    const identity = (signals.calculationIdentity || analysis.calculationIdentity) as
      | Record<string, unknown>
      | undefined;
    if (!identity?.clockBirthTime) continue;

    const stored = normalizeClockTime(row.birth_time);
    const clock = normalizeClockTime(String(identity.clockBirthTime));
    if (!stored || !clock || stored === clock) continue;

    mismatched += 1;
    if (samples.length < 25) {
      samples.push({
        id: row.id,
        stored: row.birth_time,
        clock,
        date: row.birth_date,
        place: row.birth_place || '',
      });
    }

    if (!apply) continue;

    const now = new Date().toISOString();
    updateFortune.run(clock, now, row.id);
    // Keep primary user row aligned when same clock was wrong there too
    try {
      updateUser.run(clock, now, row.user_id);
    } catch {
      // users table shape may differ
    }
    fixed += 1;
  }

  console.log(
    JSON.stringify(
      {
        phase: apply ? 'apply' : 'dry-run',
        dbPath,
        scanned,
        mismatched,
        fixed,
        samples,
        guidance:
          'Identity clock is source of truth. Re-run analyze only if user wants pillars for a *different* stored time.',
      },
      null,
      2,
    ),
  );
  db.close();
}

main();
