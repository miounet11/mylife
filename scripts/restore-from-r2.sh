#!/usr/bin/env bash
# Download and optionally restore a backup from Cloudflare R2.
#
# Usage:
#   bash scripts/restore-from-r2.sh --list
#   bash scripts/restore-from-r2.sh --date 2026-07-08
#   bash scripts/restore-from-r2.sh --date 2026-07-08 --apply
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# shellcheck source=scripts/r2-backup-lib.sh
source "$SCRIPT_DIR/r2-backup-lib.sh"

load_r2_backup_env
ensure_rclone

PROJECT_DIR="${PROJECT_DIR:-/home/life-kline-next}"
DATE_SLUG=""
APPLY=0
LIST_ONLY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --date) DATE_SLUG="$2"; shift 2 ;;
    --apply) APPLY=1; shift ;;
    --list) LIST_ONLY=1; shift ;;
    -h|--help)
      sed -n '1,12p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

REMOTE_ROOT="$R2_SERVER_IP/$R2_PROJECT_NAME"
RESTORE_DIR="${R2_BACKUP_LOCAL_DIR}/restore"

if [[ "$LIST_ONLY" == "1" ]]; then
  echo "==> Backups under s3://$R2_BUCKET/$REMOTE_ROOT/"
  # shellcheck disable=SC2046
  rclone lsf ":s3:$R2_BUCKET/$REMOTE_ROOT/" $(rclone_remote_args) --dirs-only | sort
  exit 0
fi

if [[ -z "$DATE_SLUG" ]]; then
  echo "==> Latest backup date:"
  # shellcheck disable=SC2046
  DATE_SLUG="$(rclone lsf ":s3:$R2_BUCKET/$REMOTE_ROOT/" $(rclone_remote_args) --dirs-only | sed 's:/$::' | sort | tail -1)"
  if [[ -z "$DATE_SLUG" ]]; then
    echo "ERROR: no backups found" >&2
    exit 1
  fi
  echo "$DATE_SLUG"
fi

REMOTE_PREFIX="$(r2_remote_prefix_for_date "$DATE_SLUG")"
TARGET_DIR="$RESTORE_DIR/$DATE_SLUG"
mkdir -p "$TARGET_DIR"

echo "==> Download s3://$R2_BUCKET/$REMOTE_PREFIX/ -> $TARGET_DIR"
# shellcheck disable=SC2046
rclone copy ":s3:$R2_BUCKET/$REMOTE_PREFIX" "$TARGET_DIR" $(rclone_remote_args) --progress --stats-one-line

if [[ ! -f "$TARGET_DIR/lifekline.db" ]]; then
  echo "ERROR: lifekline.db missing in backup" >&2
  exit 1
fi

echo "==> Manifest"
cat "$TARGET_DIR/manifest.json" 2>/dev/null || echo "(no manifest)"

if [[ "$APPLY" != "1" ]]; then
  cat <<EOF

Download only (dry). To apply on this host:
  1. Stop app: pm2 stop life-kline-next
  2. Backup current DB: cp $PROJECT_DIR/data/lifekline.db{,.before-restore}
  3. Restore DB: cp $TARGET_DIR/lifekline.db $PROJECT_DIR/data/lifekline.db
  4. Optional code: tar -C $PROJECT_DIR -xzf $TARGET_DIR/code.tar.gz
  5. Optional env: cp $TARGET_DIR/env.local $PROJECT_DIR/.env.local
  6. Deploy: cd $PROJECT_DIR && npm run deploy
  7. Smoke: npm run ops:post-deploy-smoke

Or rerun: bash scripts/restore-from-r2.sh --date $DATE_SLUG --apply
EOF
  exit 0
fi

echo "==> APPLY restore (database + optional code/env)"
read -r -p "Type RESTORE-$DATE_SLUG to continue: " confirm
if [[ "$confirm" != "RESTORE-$DATE_SLUG" ]]; then
  echo "Aborted."
  exit 1
fi

if command -v pm2 >/dev/null 2>&1; then
  pm2 stop life-kline-next || true
fi

mkdir -p "$PROJECT_DIR/data"
if [[ -f "$PROJECT_DIR/data/lifekline.db" ]]; then
  cp "$PROJECT_DIR/data/lifekline.db" "$PROJECT_DIR/data/lifekline.db.before-restore-$(date +%Y%m%d-%H%M%S)"
fi
cp "$TARGET_DIR/lifekline.db" "$PROJECT_DIR/data/lifekline.db"
chmod 644 "$PROJECT_DIR/data/lifekline.db"

if [[ -f "$TARGET_DIR/code.tar.gz" ]]; then
  tar -C "$PROJECT_DIR" -xzf "$TARGET_DIR/code.tar.gz"
fi

if [[ -f "$TARGET_DIR/env.local" ]]; then
  cp "$TARGET_DIR/env.local" "$PROJECT_DIR/.env.local"
  chmod 600 "$PROJECT_DIR/.env.local"
fi

if command -v pm2 >/dev/null 2>&1; then
  cd "$PROJECT_DIR"
  ALLOW_PARTIAL_PM2_TARGETS=1 npm run deploy || pm2 reload life-kline-next --update-env
fi

echo "==> Restore applied from $DATE_SLUG"