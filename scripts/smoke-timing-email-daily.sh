#!/usr/bin/env bash
# Smoke timing email cron (mode=daily, limit=1) + last-run write.
# Safe: only processes up to 1 subscriber; skips if already sent today.
# Usage (on prod):
#   export TIMING_EMAIL_CRON_TOKEN='…'
#   bash scripts/smoke-timing-email-daily.sh
set -euo pipefail
BASE="${TIMING_EMAIL_SMOKE_BASE:-http://127.0.0.1:3000}"
TOKEN="${TIMING_EMAIL_CRON_TOKEN:-${DAILY_WINDOW_EMAIL_CRON_TOKEN:-}}"
if [[ -z "$TOKEN" ]]; then
  echo "ERROR: set TIMING_EMAIL_CRON_TOKEN" >&2
  exit 1
fi

code=$(curl -sS -o /tmp/timing-daily-smoke.json -w "%{http_code}" -X POST \
  "${BASE}/api/admin/timing/email/cron?mode=daily&limit=1" \
  -H "x-timing-email-cron-token: ${TOKEN}")
echo "HTTP $code"
head -c 500 /tmp/timing-daily-smoke.json; echo
if [[ "$code" != "200" ]]; then
  exit 1
fi
if ! grep -q '"success":true' /tmp/timing-daily-smoke.json; then
  echo "ERROR: success!=true" >&2
  exit 1
fi
if grep -qi 'is not a function' /tmp/timing-daily-smoke.json; then
  echo "ERROR: missing sender function still present" >&2
  exit 1
fi
echo "OK timing daily cron (no is-not-a-function)"

# last-run should exist after write
if [[ -f data/ops/timing-email-last-run.json ]]; then
  echo "last-run file present"
  head -c 300 data/ops/timing-email-last-run.json; echo
elif [[ -f /tmp/life-kline-timing-email-last-run.json ]]; then
  echo "last-run file present (/tmp)"
  head -c 300 /tmp/life-kline-timing-email-last-run.json; echo
else
  # may be written under app cwd only — check JSON field
  if grep -q 'lastRunPath' /tmp/timing-daily-smoke.json; then
    echo "OK lastRunPath in response"
  else
    echo "WARN: last-run file not found on disk (may still be ok if path null)"
  fi
fi
echo "OK timing-email-daily smoke"
