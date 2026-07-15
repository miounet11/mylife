#!/usr/bin/env bash
# Backup production code + SQLite to Cloudflare R2.
# Remote layout: <ip>/<project>/<YYYY-MM-DD>/
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=scripts/r2-backup-lib.sh
source "$SCRIPT_DIR/r2-backup-lib.sh"

load_r2_backup_env
ensure_rclone

PROJECT_DIR="${PROJECT_DIR:-/home/life-kline-next}"
DB_PATH="${DB_PATH:-$PROJECT_DIR/data/lifekline.db}"
DATE_SLUG="$(date -u +%Y-%m-%d)"
STAGING_DIR="$R2_BACKUP_LOCAL_DIR/$DATE_SLUG"
REMOTE_PREFIX="$(r2_remote_prefix_for_date "$DATE_SLUG")"

mkdir -p "$STAGING_DIR" "$R2_BACKUP_LOCAL_DIR"

if ! should_run_interval_backup "$R2_BACKUP_INTERVAL_DAYS"; then
  exit 0
fi

echo "==> R2 backup start: $REMOTE_PREFIX"

if [[ ! -f "$DB_PATH" ]]; then
  echo "ERROR: database not found: $DB_PATH" >&2
  exit 1
fi

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "ERROR: sqlite3 required for online backup" >&2
  exit 1
fi

echo "==> SQLite online backup"
sqlite3 "$DB_PATH" ".backup '$STAGING_DIR/lifekline.db'"

echo "==> Code archive (exclude node_modules/.next)"
tar -C "$PROJECT_DIR" -czf "$STAGING_DIR/code.tar.gz" \
  --exclude='./node_modules' \
  --exclude='./.next' \
  --exclude='./.next-*' \
  --exclude='./.git/objects' \
  app components lib scripts ecosystem.config.js package.json package-lock.json \
  next.config.js postcss.config.js tailwind.config.js tsconfig.json middleware.ts \
  2>/dev/null || tar -C "$PROJECT_DIR" -czf "$STAGING_DIR/code.tar.gz" \
  --exclude='./node_modules' \
  --exclude='./.next' \
  app components lib scripts ecosystem.config.js package.json package-lock.json \
  next.config.js postcss.config.js middleware.ts

if [[ -f "$PROJECT_DIR/.env.local" ]]; then
  cp "$PROJECT_DIR/.env.local" "$STAGING_DIR/env.local"
  chmod 600 "$STAGING_DIR/env.local"
fi

BUILD_ID=""
if [[ -f "$PROJECT_DIR/.next/BUILD_ID" ]]; then
  BUILD_ID="$(tr -d '\n' < "$PROJECT_DIR/.next/BUILD_ID")"
fi

GIT_SHA="unknown"
GIT_DIRTY="unknown"
if [[ -d "$PROJECT_DIR/.git" ]]; then
  GIT_SHA="$(git -C "$PROJECT_DIR" rev-parse --short HEAD 2>/dev/null || echo unknown)"
  if git -C "$PROJECT_DIR" diff --quiet 2>/dev/null && git -C "$PROJECT_DIR" diff --cached --quiet 2>/dev/null; then
    GIT_DIRTY="false"
  else
    GIT_DIRTY="true"
  fi
fi

PM2_APPS="[]"
if command -v pm2 >/dev/null 2>&1; then
  PM2_APPS="$(pm2 jlist 2>/dev/null | python3 -c 'import json,sys; apps=json.load(sys.stdin); print(json.dumps([a.get("name") for a in apps if a.get("pm2_env",{}).get("status")=="online"]))' 2>/dev/null || echo '[]')"
fi

DB_BYTES="$(wc -c < "$STAGING_DIR/lifekline.db" | tr -d ' ')"
CODE_BYTES="$(wc -c < "$STAGING_DIR/code.tar.gz" | tr -d ' ')"

cat > "$STAGING_DIR/manifest.json" <<EOF
{
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "dateSlug": "$DATE_SLUG",
  "serverIp": "$R2_SERVER_IP",
  "projectName": "$R2_PROJECT_NAME",
  "remotePrefix": "$REMOTE_PREFIX",
  "buildId": "$BUILD_ID",
  "gitSha": "$GIT_SHA",
  "gitDirty": $GIT_DIRTY,
  "dbBytes": $DB_BYTES,
  "codeBytes": $CODE_BYTES,
  "hasEnvLocal": $( [[ -f "$STAGING_DIR/env.local" ]] && echo true || echo false ),
  "pm2Online": $PM2_APPS,
  "restoreHint": "bash scripts/restore-from-r2.sh --date $DATE_SLUG"
}
EOF

echo "==> Ensure bucket exists: $R2_BUCKET"
# shellcheck disable=SC2046
rclone mkdir ":s3:$R2_BUCKET" $(rclone_remote_args) 2>/dev/null || true

echo "==> Upload to R2: s3://$R2_BUCKET/$REMOTE_PREFIX/"
# shellcheck disable=SC2046
rclone copy "$STAGING_DIR" ":s3:$R2_BUCKET/$REMOTE_PREFIX" $(rclone_remote_args) --progress --stats-one-line

mark_interval_backup_success
prune_local_backups "$R2_BACKUP_KEEP_LOCAL_DAYS"

echo "==> R2 backup complete: $REMOTE_PREFIX"
ls -lh "$STAGING_DIR"