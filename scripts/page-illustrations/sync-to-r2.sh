#!/usr/bin/env bash
# Optional: mirror page illustrations to R2.
# Default backup bucket is NOT a public CDN — only run if you have a public prefix/domain.
# On prod: source .secrets/r2-backup.env (or dedicated public R2 env).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="${ROOT}/public/images/page-illustrations"
PREFIX="${PAGE_ILLUST_R2_PREFIX:-page-illustrations}"

if [[ ! -d "$SRC" ]]; then
  echo "missing $SRC"
  exit 1
fi

if [[ -z "${R2_BUCKET:-}" || -z "${R2_ENDPOINT:-}" ]]; then
  echo "R2_BUCKET / R2_ENDPOINT not set. Primary publish is still public/ on the app server."
  echo "See .grok/skills/page-illustrations/SKILL.md"
  exit 0
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI required for R2 sync"
  exit 1
fi

export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:-}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:-}"
export AWS_DEFAULT_REGION="${R2_REGION:-auto}"

aws s3 sync "$SRC" "s3://${R2_BUCKET}/${PREFIX}/" \
  --endpoint-url "$R2_ENDPOINT" \
  --exclude "raw/*" \
  --exclude ".*"

echo "synced to s3://${R2_BUCKET}/${PREFIX}/"
echo "If public URL exists, set src to https://…/${PREFIX}/<file> in catalog/manifest."
