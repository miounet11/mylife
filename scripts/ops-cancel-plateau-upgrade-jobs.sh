#!/usr/bin/env bash
# Cancel stuck upgrade jobs that will never leave 83–94 TARGET_NOT_REACHED plateau.
# Run on production: bash scripts/ops-cancel-plateau-upgrade-jobs.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB="${DATABASE_PATH:-$ROOT/data/lifekline.db}"
if [[ ! -f "$DB" ]]; then
  echo "ERROR: no db at $DB" >&2
  exit 1
fi

echo "DB=$DB"
sqlite3 "$DB" <<'SQL'
SELECT status, COUNT(*) c, ROUND(AVG(best_score),1) avg_best
FROM report_upgrade_jobs
GROUP BY status;
SQL

echo "==> cancel retry/pending stuck at best_score 80-94 with TARGET/plateau errors"
sqlite3 "$DB" <<'SQL'
UPDATE report_upgrade_jobs
SET status = 'cancelled',
    last_error = 'OPS_CANCEL_PLATEAU_V6Q2',
    updated_at = datetime('now'),
    meta = json_set(COALESCE(meta, '{}'), '$.plateau', 1, '$.plateauReason', 'OPS_CANCEL_PLATEAU_V6Q2', '$.opsCancelledAt', datetime('now'))
WHERE status IN ('retry', 'pending')
  AND COALESCE(best_score, 0) >= 80
  AND COALESCE(best_score, 0) < 95
  AND (
    last_error LIKE '%TARGET_NOT_REACHED%'
    OR last_error LIKE '%QUALITY_PLATEAU%'
    OR last_error LIKE '%一致性%'
    OR attempts >= 2
  );
SELECT changes() AS cancelled_rows;
SELECT status, COUNT(*) c FROM report_upgrade_jobs GROUP BY status;
SQL
echo "OK"
