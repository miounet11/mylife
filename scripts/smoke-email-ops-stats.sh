#!/usr/bin/env bash
# Smoke email delivery ops stats API.
# Usage (local or prod):
#   export TIMING_EMAIL_CRON_TOKEN='…'
#   bash scripts/smoke-email-ops-stats.sh
set -euo pipefail
BASE="${EMAIL_OPS_SMOKE_BASE:-http://127.0.0.1:3000}"
TOKEN="${TIMING_EMAIL_CRON_TOKEN:-${DAILY_WINDOW_EMAIL_CRON_TOKEN:-}}"
if [[ -z "$TOKEN" ]]; then
  echo "ERROR: set TIMING_EMAIL_CRON_TOKEN" >&2
  exit 1
fi

OUT=/tmp/email-ops-stats-smoke.json
code=$(curl -sS -o "$OUT" -w "%{http_code}" \
  "${BASE}/api/admin/email-ops/stats?days=7" \
  -H "x-timing-email-cron-token: ${TOKEN}")
echo "HTTP $code"
head -c 600 "$OUT"; echo

if [[ "$code" != "200" ]]; then
  echo "ERROR: expected HTTP 200" >&2
  exit 1
fi
if ! grep -q '"success":true' "$OUT"; then
  echo "ERROR: success!=true" >&2
  exit 1
fi
if ! grep -q '"label":"delivery_stats"' "$OUT"; then
  echo "ERROR: missing delivery_stats label" >&2
  exit 1
fi
if grep -qE '"open_rate"|"openRate"' "$OUT"; then
  echo "ERROR: open-rate field must not appear" >&2
  exit 1
fi
if ! grep -q '"byCategory"' "$OUT"; then
  echo "ERROR: missing byCategory" >&2
  exit 1
fi
if ! grep -q '"dailyWindowLastRun"' "$OUT"; then
  echo "ERROR: missing dailyWindowLastRun" >&2
  exit 1
fi

# Unauthorized without token
unauth_code=$(curl -sS -o /tmp/email-ops-stats-unauth.json -w "%{http_code}" \
  "${BASE}/api/admin/email-ops/stats?days=7")
echo "UNAUTH HTTP $unauth_code"
if [[ "$unauth_code" != "401" ]]; then
  echo "ERROR: expected 401 without token" >&2
  exit 1
fi

echo "OK email-ops delivery stats"
