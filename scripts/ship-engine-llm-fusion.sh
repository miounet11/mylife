#!/usr/bin/env bash
# Ship engine+LLM fusion files to production (tar/scp), build, restart, smoke.
# Requires: export SSHPASS='…' in the terminal session.
# Does NOT overwrite protected prod paths (tools.ts, database.ts, etc.).
# After extract, optionally patches tools.ts via patch-tools-engine-summary-production.py

set -euo pipefail
export PATH="/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${SSHPASS:-}" ]]; then
  echo "ERROR: set SSHPASS in this terminal first: export SSHPASS='…'" >&2
  exit 1
fi

SSH=(sshpass -e ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no -o ConnectTimeout=30 -p 22 root@167.160.188.70)
SCP=(sshpass -e scp -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o PubkeyAuthentication=no -P 22)

FILES=(
  # Ground truth fusion
  lib/ground-truth/hard-contract.ts
  lib/ground-truth/preserve-tokens.ts
  lib/ground-truth/pack.ts
  lib/ground-truth/projections.ts
  lib/ground-truth/tool-projector.ts
  lib/ground-truth/index.ts
  lib/tool-run-summary.ts

  # Chat EFC
  lib/chat-context.ts
  lib/chat-intent.ts
  lib/chat-report-anchor.ts
  lib/chat-teacher-runtime.ts

  # Agentic pipeline
  lib/agentic-report/build-ground-truth.ts
  lib/agentic-report/create-agentic-context.ts
  lib/agentic-report/prompt-injector.ts
  lib/agentic-report/prompt-registry.ts
  lib/agentic-report/prompts/agents.ts
  lib/agentic-report/build-fallback-agent-results.ts
  lib/agentic-report/run-agentic-pipeline.ts
  lib/agentic-report/types.ts
  lib/agentic-report/review/run-review.ts
  lib/agentic-report/review/run-repair.ts
  lib/agentic-report/review/run-verify.ts

  # Report / LLM / identity
  lib/report-pipeline.ts
  lib/llm.ts
  lib/agent-prompt-system.ts
  lib/calculation-identity.ts
  lib/fortune-context-builder.ts
  lib/advice-timing-filter.ts
  lib/timing-anchor-vocab.ts

  # Dimensions
  lib/dimensions/engine-pack.ts
  lib/dimensions/enhance-with-llm.ts

  # Email CTA
  lib/predictions/due-reminder-email-template.ts

  # Prod tools patch helper
  scripts/patch-tools-engine-summary-production.py
  scripts/ship-engine-llm-fusion.sh
)

# Validate
missing=0
for f in "${FILES[@]}"; do
  if [[ ! -e "$f" ]]; then
    echo "MISSING $f" >&2
    missing=1
  fi
done
if [[ "$missing" -ne 0 ]]; then
  exit 2
fi

TGZ=/tmp/lk-engine-llm-fusion.tgz
tar czf "$TGZ" "${FILES[@]}"
echo "PACKED $(wc -c < "$TGZ") bytes → $TGZ"
ls -la "$TGZ"

echo "=== SCP ==="
"${SCP[@]}" "$TGZ" root@167.160.188.70:/tmp/lk-engine-llm-fusion.tgz

echo "=== EXTRACT ==="
"${SSH[@]}" 'cd /home/life-kline-next && tar xzf /tmp/lk-engine-llm-fusion.tgz && echo EXTRACT_OK && ls -la lib/ground-truth | head -20'

echo "=== PATCH tools.ts (engine summary) ==="
"${SSH[@]}" 'cd /home/life-kline-next && python3 scripts/patch-tools-engine-summary-production.py || true'

echo "=== BUILD (long) ==="
"${SSH[@]}" 'cd /home/life-kline-next && npm run build' || {
  echo "BUILD failed" >&2
  exit 3
}

echo "=== PM2 RESTART ==="
"${SSH[@]}" 'cd /home/life-kline-next && pm2 restart life-kline-next --update-env || (fuser -k 3000/tcp 2>/dev/null; sleep 1; pm2 restart life-kline-next --update-env)'

echo "=== SMOKE ==="
"${SSH[@]}" 'sleep 4
for p in / /analyze /tools /dimensions /chat /teachers; do
  code=$(curl -s -o /tmp/p.html -w "%{http_code}" --max-time 20 "http://127.0.0.1:3000$p" || echo ERR)
  echo "$p $code"
done
echo BUILD_ID=$(cat /home/life-kline-next/.next/BUILD_ID 2>/dev/null || echo none)
pm2 describe life-kline-next 2>/dev/null | head -20'

echo "SHIP_ENGINE_LLM_FUSION_DONE"
