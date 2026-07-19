#!/usr/bin/env bash
# Bump public/sw.js CACHE_NAME from lk-shell-vN → lk-shell-v(N+1).
# Run manually after UI ships that change the service worker (precache list,
# fetch rules, or offline shell). Do NOT wire into every deploy automatically —
# forced bumps surprise returning visitors with a full shell re-cache.
#
# Usage:
#   bash scripts/bump-sw-cache.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SW_FILE="${SW_FILE:-$ROOT/public/sw.js}"

if [[ ! -f "$SW_FILE" ]]; then
  echo "ERROR: service worker not found: $SW_FILE" >&2
  exit 1
fi

if ! grep -qE "const CACHE_NAME = 'lk-shell-v[0-9]+';" "$SW_FILE"; then
  echo "ERROR: could not find CACHE_NAME = 'lk-shell-vN' in $SW_FILE" >&2
  exit 1
fi

current="$(
  sed -nE "s/.*const CACHE_NAME = '(lk-shell-v[0-9]+)';.*/\1/p" "$SW_FILE" | head -n1
)"

if [[ -z "$current" ]]; then
  echo "ERROR: failed to parse CACHE_NAME from $SW_FILE" >&2
  exit 1
fi

n="${current#lk-shell-v}"
if ! [[ "$n" =~ ^[0-9]+$ ]]; then
  echo "ERROR: unexpected CACHE_NAME format: $current" >&2
  exit 1
fi

next_n=$((n + 1))
next="lk-shell-v${next_n}"

# macOS / BSD sed needs -i '' ; GNU sed accepts -i alone. Prefer portable tmp rewrite.
tmp="$(mktemp)"
sed -E "s/const CACHE_NAME = 'lk-shell-v[0-9]+';/const CACHE_NAME = '${next}';/" \
  "$SW_FILE" >"$tmp"
mv "$tmp" "$SW_FILE"

# Verify write
verify="$(
  sed -nE "s/.*const CACHE_NAME = '(lk-shell-v[0-9]+)';.*/\1/p" "$SW_FILE" | head -n1
)"
if [[ "$verify" != "$next" ]]; then
  echo "ERROR: bump failed (got '$verify', expected '$next')" >&2
  exit 1
fi

echo "CACHE_NAME: $current → $next"
echo "$next"
