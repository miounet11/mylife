#!/usr/bin/env bash
# Design-system deploy with service worker cache bump (BUMP_SW=1).
# Forces lk-shell-vN → vN+1 so returning visitors re-cache the shell.
# Only use after intentional SW / offline-shell changes.
#
# Usage:
#   export SSHPASS='...'
#   bash scripts/deploy-with-sw.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
export BUMP_SW=1
exec bash "$SCRIPT_DIR/deploy-design-system-v1.sh" "$@"
