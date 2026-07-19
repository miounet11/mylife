#!/usr/bin/env bash
# Smoke daily-window email cron (dry-run).
# Usage (on prod):
#   export TIMING_EMAIL_CRON_TOKEN='…'
#   bash scripts/smoke-daily-window-email.sh
set -euo pipefail
BASE="${DAILY_WINDOW_SMOKE_BASE:-http://127.0.0.1:3000}"
TOKEN="${TIMING_EMAIL_CRON_TOKEN:-${DAILY_WINDOW_EMAIL_CRON_TOKEN:-}}"
if [[ -z "$TOKEN" ]]; then
  echo "ERROR: set TIMING_EMAIL_CRON_TOKEN" >&2
  exit 1
fi
code=$(curl -sS -o /tmp/daily-window-smoke.json -w "%{http_code}" -X POST \
  "${BASE}/api/admin/daily-window/email/cron?dryRun=1" \
  -H "x-timing-email-cron-token: ${TOKEN}")
echo "HTTP $code"
head -c 400 /tmp/daily-window-smoke.json; echo
if [[ "$code" != "200" ]]; then
  exit 1
fi
if ! grep -q '"success":true' /tmp/daily-window-smoke.json; then
  echo "ERROR: success!=true" >&2
  exit 1
fi
echo "OK daily-window dryRun"
