#!/usr/bin/env bash
# Shared helpers for R2 backup/restore. Source only.
set -euo pipefail

R2_BACKUP_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
R2_BACKUP_PROJECT_ROOT="$(cd "$R2_BACKUP_LIB_DIR/.." && pwd)"

load_r2_backup_env() {
  local env_file="${R2_BACKUP_ENV_FILE:-$R2_BACKUP_PROJECT_ROOT/.secrets/r2-backup.env}"
  if [[ ! -f "$env_file" ]]; then
    echo "ERROR: missing $env_file" >&2
    return 1
  fi
  # shellcheck disable=SC1090
  set -a
  source "$env_file"
  set +a

  : "${R2_BUCKET:?R2_BUCKET required}"
  : "${R2_ENDPOINT:?R2_ENDPOINT required}"
  : "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID required}"
  : "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY required}"
  : "${R2_SERVER_IP:=167.160.188.70}"
  : "${R2_PROJECT_NAME:=life-kline-next}"
  : "${R2_BACKUP_INTERVAL_DAYS:=3}"
  : "${R2_BACKUP_LOCAL_DIR:=/var/backups/life-kline-r2}"
  : "${R2_BACKUP_KEEP_LOCAL_DAYS:=14}"
}

ensure_rclone() {
  if command -v rclone >/dev/null 2>&1; then
    return 0
  fi

  if command -v apt-get >/dev/null 2>&1; then
    echo "==> Installing rclone via install.sh"
    curl -fsSL https://rclone.org/install.sh | bash >/dev/null
    command -v rclone >/dev/null 2>&1 && return 0
  fi

  local arch zip url tmp
  arch="$(uname -m)"
  case "$arch" in
    x86_64|amd64) zip="rclone-current-linux-amd64.zip" ;;
    aarch64|arm64) zip="rclone-current-linux-arm64.zip" ;;
    *)
      echo "ERROR: unsupported arch for auto rclone install: $arch" >&2
      return 1
      ;;
  esac

  command -v unzip >/dev/null 2>&1 || {
    echo "ERROR: unzip required to bootstrap rclone" >&2
    return 1
  }

  url="https://downloads.rclone.org/$zip"
  tmp="$(mktemp -d)"
  echo "==> Installing rclone to /usr/local/bin ($zip)"
  curl -fsSL "$url" -o "$tmp/rclone.zip"
  unzip -q "$tmp/rclone.zip" -d "$tmp"
  install -m 0755 "$tmp/rclone-"*/rclone /usr/local/bin/rclone
  rm -rf "$tmp"
  rclone version | head -1
}

rclone_remote_args() {
  printf '%s\n' \
    --s3-provider Cloudflare \
    --s3-access-key-id "$R2_ACCESS_KEY_ID" \
    --s3-secret-access-key "$R2_SECRET_ACCESS_KEY" \
    --s3-endpoint "$R2_ENDPOINT" \
    --s3-no-check-bucket
}

r2_remote_prefix_for_date() {
  local date_slug="$1"
  printf '%s/%s/%s' "$R2_SERVER_IP" "$R2_PROJECT_NAME" "$date_slug"
}

prune_local_backups() {
  local keep_days="$1"
  find "$R2_BACKUP_LOCAL_DIR" -mindepth 1 -maxdepth 1 -type d -mtime +"$keep_days" -print -exec rm -rf {} + 2>/dev/null || true
}

should_run_interval_backup() {
  local stamp_file="$R2_BACKUP_LOCAL_DIR/.last-successful-upload"
  local interval_days="$1"
  if [[ "${R2_BACKUP_FORCE:-0}" == "1" ]]; then
    return 0
  fi
  if [[ ! -f "$stamp_file" ]]; then
    return 0
  fi
  local last now elapsed_days
  last="$(cat "$stamp_file")"
  now="$(date +%s)"
  elapsed_days=$(( (now - last) / 86400 ))
  if (( elapsed_days >= interval_days )); then
    return 0
  fi
  echo "Skip backup: last success ${elapsed_days}d ago (< ${interval_days}d interval). Use R2_BACKUP_FORCE=1 to override."
  return 1
}

mark_interval_backup_success() {
  local stamp_file="$R2_BACKUP_LOCAL_DIR/.last-successful-upload"
  date +%s > "$stamp_file"
}