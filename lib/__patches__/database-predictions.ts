/**
 * REFERENCE ONLY — not imported by the app build.
 *
 * Canonical source for production `predictionOperations` injected into
 * `lib/database.ts` on the server.
 *
 * Drift check: audit-production-drift.sh greps marker + fingerprint.
 * Deploy: scripts/patch-predictions-persistence-production.sh reads @patch-inject block.
 */

// @patch-inject-start
let predictionTableReady = false;
function ensurePredictionTable() {
  if (predictionTableReady) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS report_predictions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      report_id TEXT NOT NULL,
      birth_signature TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      statement TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 0.5,
      due_date TEXT NOT NULL,
      window_label TEXT,
      evidence TEXT,
      verify_checklist TEXT,
      outcome TEXT DEFAULT 'pending',
      user_feedback TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_report_predictions_user_id ON report_predictions(user_id);
    CREATE INDEX IF NOT EXISTS idx_report_predictions_report_id ON report_predictions(report_id);
  `);
  predictionTableReady = true;
}

function mapPredictionRow(row) {
  let verifyChecklist = [];
  try {
    const parsed = JSON.parse(row.verify_checklist || '[]');
    verifyChecklist = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    verifyChecklist = [];
  }
  return {
    id: row.id,
    reportId: row.report_id,
    birthSignature: row.birth_signature || '',
    category: row.category,
    statement: row.statement,
    confidence: row.confidence,
    dueDate: row.due_date,
    window: row.window_label || undefined,
    evidence: row.evidence || '',
    verifyChecklist,
    outcome: row.outcome || 'pending',
    userFeedback: row.user_feedback || undefined,
    createdAt: row.created_at,
  };
}

export const predictionOperations = {
  listByUserId(userId) {
    ensurePredictionTable();
    const rows = db.prepare(`
      SELECT * FROM report_predictions
      WHERE user_id = ?
      ORDER BY due_date ASC
    `).all(userId);
    return rows.map(mapPredictionRow);
  },

  upsertMany(userId, predictions) {
    ensurePredictionTable();
    const stmt = db.prepare(`
      INSERT INTO report_predictions (
        id, user_id, report_id, birth_signature, category, statement, confidence,
        due_date, window_label, evidence, verify_checklist, outcome, user_feedback, updated_at
      ) VALUES (
        @id, @user_id, @report_id, @birth_signature, @category, @statement, @confidence,
        @due_date, @window_label, @evidence, @verify_checklist, @outcome, @user_feedback, datetime('now')
      )
      ON CONFLICT(id) DO UPDATE SET
        report_id = excluded.report_id,
        birth_signature = excluded.birth_signature,
        category = excluded.category,
        statement = excluded.statement,
        confidence = excluded.confidence,
        due_date = excluded.due_date,
        window_label = excluded.window_label,
        evidence = excluded.evidence,
        verify_checklist = excluded.verify_checklist,
        outcome = CASE
          WHEN report_predictions.outcome IS NOT NULL
            AND report_predictions.outcome != 'pending'
            AND excluded.outcome = 'pending'
          THEN report_predictions.outcome
          ELSE excluded.outcome
        END,
        user_feedback = COALESCE(excluded.user_feedback, report_predictions.user_feedback),
        updated_at = datetime('now')
      WHERE report_predictions.user_id = @user_id
    `);

    const tx = db.transaction((items) => {
      for (const item of items) {
        stmt.run({
          id: item.id,
          user_id: userId,
          report_id: item.reportId,
          birth_signature: item.birthSignature || '',
          category: item.category,
          statement: item.statement,
          confidence: item.confidence,
          due_date: item.dueDate,
          window_label: item.window || null,
          evidence: item.evidence || null,
          verify_checklist: JSON.stringify(item.verifyChecklist || []),
          outcome: item.outcome || 'pending',
          user_feedback: item.userFeedback || null,
        });
      }
    });
    tx(predictions);
  },

  updateOutcome(userId, id, outcome, feedback) {
    ensurePredictionTable();
    const existing = db.prepare(`
      SELECT * FROM report_predictions WHERE id = ? AND user_id = ? LIMIT 1
    `).get(id, userId);
    if (!existing) return null;

    db.prepare(`
      UPDATE report_predictions
      SET outcome = ?, user_feedback = COALESCE(?, user_feedback), updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(outcome, feedback || null, id, userId);

    const row = db.prepare(`
      SELECT * FROM report_predictions WHERE id = ? AND user_id = ? LIMIT 1
    `).get(id, userId);
    return row ? mapPredictionRow(row) : null;
  },
};
// @patch-inject-end