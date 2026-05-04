const Database = require('better-sqlite3');

const db = new Database('data/lifekline.db');

function readFlag(name) {
  const exact = process.argv.slice(2).find((arg) => arg === name);
  return !!exact;
}

const dryRun = !readFlag('--apply');

const mappings = db.prepare(`
  SELECT
    session_id AS guest_session_id,
    user_id AS verified_user_id,
    MIN(created_at) AS first_auth_at
  FROM analytics_events
  WHERE event_name = 'auth_verified'
    AND session_id LIKE 'guest_%'
    AND user_id LIKE 'user_%'
  GROUP BY session_id, user_id
  ORDER BY datetime(first_auth_at) DESC
`).all();

const preview = [];
let updatedRows = 0;

const updateStmt = db.prepare(`
  UPDATE analytics_events
  SET user_id = @verifiedUserId
  WHERE user_id = @guestSessionId
    AND datetime(created_at) <= datetime(@firstAuthAt)
`);

const countStmt = db.prepare(`
  SELECT COUNT(*) AS count
  FROM analytics_events
  WHERE user_id = ?
    AND datetime(created_at) <= datetime(?)
`);

if (!dryRun) {
  db.exec('BEGIN');
}

try {
  for (const mapping of mappings) {
    const countRow = countStmt.get(mapping.guest_session_id, mapping.first_auth_at);
    const count = countRow?.count || 0;
    if (count <= 0) {
      continue;
    }

    preview.push({
      guestSessionId: mapping.guest_session_id,
      verifiedUserId: mapping.verified_user_id,
      firstAuthAt: mapping.first_auth_at,
      affectedAnalyticsEvents: count,
    });

    if (!dryRun) {
      const result = updateStmt.run({
        guestSessionId: mapping.guest_session_id,
        verifiedUserId: mapping.verified_user_id,
        firstAuthAt: mapping.first_auth_at,
      });
      updatedRows += result.changes || 0;
    } else {
      updatedRows += count;
    }
  }

  if (!dryRun) {
    db.exec('COMMIT');
  }
} catch (error) {
  if (!dryRun) {
    db.exec('ROLLBACK');
  }
  throw error;
}

console.log(JSON.stringify({
  dryRun,
  mappings: mappings.length,
  updatedRows,
  preview: preview.slice(0, 20),
}, null, 2));
