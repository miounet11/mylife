#!/usr/bin/env bash
# Deploy only git-changed files since last deploy tag (safer than full app/ sync).
# Requires a git repo locally. Falls back to design-system deploy if no git.
#
# Usage:
#   export SSHPASS='...'
#   bash scripts/deploy-changed.sh
#   SINCE_REF=HEAD~3 bash scripts/deploy-changed.sh
# After UI ship with SW changes: bash scripts/bump-sw-cache.sh (manual; not auto).
set -euo pipefail

LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SINCE_REF="${SINCE_REF:-HEAD}"

# shellcheck source=production-protected-paths.sh
source "$SCRIPT_DIR/production-protected-paths.sh"
PROD_HOST="${PROD_HOST:-root@167.160.188.70}"
REMOTE_DIR="${REMOTE_DIR:-/home/life-kline-next}"

if [[ -z "${SSHPASS:-}" ]]; then
  echo "ERROR: Set SSHPASS." >&2
  exit 1
fi

cd "$LOCAL_DIR"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "No local git repo — falling back to deploy-design-system-v1.sh"
  exec bash "$LOCAL_DIR/scripts/deploy-design-system-v1.sh"
fi

CHANGED=$(git diff --name-only "$SINCE_REF" -- app components lib 2>/dev/null || true)
if [[ -z "$CHANGED" ]]; then
  echo "No changes in app/components/lib since $SINCE_REF"
  exit 0
fi

echo "Changed files since $SINCE_REF:"
echo "$CHANGED"
echo ""
read -r -p "Deploy these files? [y/N] " ans
[[ "${ans:-}" == "y" || "${ans:-}" == "Y" ]] || exit 0

SSHPASS_BIN="$(command -v sshpass)"
RSYNC_RSH="$SSHPASS_BIN -e ssh -o StrictHostKeyChecking=no"

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  [[ -f "$LOCAL_DIR/$file" ]] || continue
  case "$file" in
    lib/database.ts|lib/tools.ts|lib/content-store.ts|lib/email.ts|lib/user-utils.ts|next.config.js|postcss.config.*|tailwind.config.*|package.json)
      echo "SKIP protected: $file"
      continue
      ;;
  esac
  for protected in "${PRODUCTION_PROTECTED_PATHS[@]}"; do
    if [[ "$file" == "$protected" ]]; then
      echo "SKIP production-critical: $file"
      continue 2
    fi
  done
  echo "==> $file"
  rsync -az -e "$RSYNC_RSH" "$LOCAL_DIR/$file" "$PROD_HOST:$REMOTE_DIR/$file"
done <<< "$CHANGED"

export SSHPASS
SSHPASS_BIN="$(command -v sshpass)"
"$SSHPASS_BIN" -e ssh -o StrictHostKeyChecking=no "$PROD_HOST" \
  "cd '$REMOTE_DIR' && ALLOW_PARTIAL_PM2_TARGETS=1 npm run deploy"

echo "Deploy complete."