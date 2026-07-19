#!/usr/bin/env bash
# Smoke prediction-due email cron (limit=1) + last-run write.
# Safe: only processes up to 1 recipient; skips if already sent for campaign.
# Usage (local or prod):
#   export PREDICTION_EMAIL_CRON_TOKEN='…'   # or TIMING_EMAIL_CRON_TOKEN
#   bash scripts/smoke-prediction-due-email.sh
set -euo pipefail
BASE="${PREDICTION_EMAIL_SMOKE_BASE:-${OPS_INTERNAL_ORIGIN:-http://127.0.0.1:3000}}"
TOKEN="${PREDICTION_EMAIL_CRON_TOKEN:-${TIMING_EMAIL_CRON_TOKEN:-}}"
if [[ -z "$TOKEN" ]]; then
  echo "ERROR: set PREDICTION_EMAIL_CRON_TOKEN or TIMING_EMAIL_CRON_TOKEN" >&2
  exit 1
fi

code=$(curl -sS -o /tmp/prediction-due-smoke.json -w "%{http_code}" -X POST \
  "${BASE}/api/admin/predictions/email/cron?limit=1" \
  -H "x-prediction-email-cron-token: ${TOKEN}" \
  -H "content-type: application/json")
echo "HTTP $code"
head -c 500 /tmp/prediction-due-smoke.json; echo
if [[ "$code" != "200" ]]; then
  exit 1
fi
if ! grep -q '"success":true' /tmp/prediction-due-smoke.json; then
  echo "ERROR: success!=true" >&2
  exit 1
fi
if grep -qi 'is not a function' /tmp/prediction-due-smoke.json; then
  echo "ERROR: missing sender function still present" >&2
  exit 1
fi
echo "OK prediction-due cron (no is-not-a-function)"

# last-run should exist after write
if [[ -f data/ops/prediction-due-email-last-run.json ]]; then
  echo "last-run file present"
  head -c 300 data/ops/prediction-due-email-last-run.json; echo
elif [[ -f /tmp/life-kline-prediction-due-email-last-run.json ]]; then
  echo "last-run file present (/tmp)"
  head -c 300 /tmp/life-kline-prediction-due-email-last-run.json; echo
else
  if grep -q 'lastRunPath' /tmp/prediction-due-smoke.json; then
    echo "OK lastRunPath in response"
  else
    echo "WARN: last-run file not found on disk (may still be ok if path null)"
  fi
fi
echo "OK prediction-due-email smoke"
