#!/usr/bin/env bash
# Deploy LK Design System v1 to production.
# Local = dev workspace. Production = root@167.160.188.70:/home/life-kline-next
#
# IMPORTANT: Never bulk-sync lib/ — production has full SQLite/tools/email modules.
# Only sync NEW lib files via whitelist.
#
# Usage:
#   export SSHPASS='your-root-password'
#   bash scripts/deploy-design-system-v1.sh
# Optional SW cache bump (default OFF): BUMP_SW=1 bash scripts/deploy-design-system-v1.sh
#   (or true/yes) — runs scripts/bump-sw-cache.sh and deploys public/sw.js + offline.html.
#   Prefer: bash scripts/deploy-with-sw.sh
set -euo pipefail

# macOS exports HOST=<hostname>; never use it for SSH target.
PROD_HOST="${PROD_HOST:-root@167.160.188.70}"
REMOTE_DIR="${REMOTE_DIR:-/home/life-kline-next}"
LOCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DRY_RUN="${DRY_RUN:-0}"
# Optional: BUMP_SW=1|true|yes bumps public/sw.js CACHE_NAME before deploy (default OFF).
BUMP_SW="${BUMP_SW:-0}"

# shellcheck source=production-protected-paths.sh
source "$SCRIPT_DIR/production-protected-paths.sh"

should_bump_sw() {
  case "${BUMP_SW}" in
    1|true|TRUE|yes|YES|on|ON) return 0 ;;
    *) return 1 ;;
  esac
}

SW_BUMPED=0
SW_CACHE_NAME=""
if should_bump_sw; then
  echo "==> BUMP_SW=${BUMP_SW}: bumping service worker CACHE_NAME"
  bump_out="$(bash "$SCRIPT_DIR/bump-sw-cache.sh")"
  printf '%s\n' "$bump_out"
  SW_CACHE_NAME="$(printf '%s\n' "$bump_out" | tail -n1)"
  SW_BUMPED=1
  echo "SW bumped: CACHE_NAME=${SW_CACHE_NAME} (will deploy public/sw.js + offline.html)"
else
  echo "==> SW cache: not bumped (BUMP_SW unset/off; set BUMP_SW=1 to force re-cache for visitors)"
fi

if [[ -z "${SSHPASS:-}" ]]; then
  echo "ERROR: Set SSHPASS before running." >&2
  echo "  export SSHPASS='...'" >&2
  exit 1
fi

export SSHPASS

if ! SSHPASS_BIN="$(command -v sshpass)"; then
  echo "ERROR: sshpass not found. Install: brew install hudochenkov/sshpass/sshpass" >&2
  exit 1
fi

RSYNC_RSH="$SSHPASS_BIN -e ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30"
SSH_CMD=("$SSHPASS_BIN" -e ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30)

# New lib modules introduced by design-system v1 (safe to add, not in prod git)
LIB_WHITELIST=(
  lib/content-seeds.ts
  lib/design-system.ts
  lib/community-categories.ts
  lib/personal-journey.ts
  lib/portal-nav.ts
  lib/portal-tools.ts
  lib/report-session-cache.ts
  lib/tool-history.ts
  lib/content-search.ts
  lib/content-article-view.ts
  lib/content-locale.ts
  lib/content-geo.ts
  lib/public-content-seo.ts
  lib/i18n/site-locale.ts
  lib/i18n/server-locale.ts
  lib/i18n/ui-messages.ts
  lib/i18n/funnel-copy.ts
  lib/i18n/result-metadata.ts
  lib/i18n/result-chrome.ts
  lib/i18n/public-report-seo.ts
  lib/i18n/zh-locale.ts
  components/report/result-locale-summary.tsx
  lib/tool-slug-aliases.ts
  lib/agentic-report/merge-agent-results.ts
  lib/bazi-analyzer.ts
  lib/kline-v6.ts
  lib/bazi-constants.ts
  lib/report-conclusions.ts
  lib/predictions/types.ts
  lib/predictions/extract.ts
  lib/predictions/store.ts
  lib/predictions/server-store.ts
  lib/predictions/due-reminder.ts
  lib/predictions/due-reminder-email-template.ts
  lib/predictions/dimension-source.ts
  lib/content-crosslinks.ts
  lib/content-enrichment.ts
  lib/content-seeds.ts
  lib/seo.ts
  lib/agentic-report/build-ground-truth.ts
  lib/agentic-report/prompt-injector.ts
  lib/agentic-report/report-quality.ts
  lib/agentic-report/create-agentic-context.ts
  lib/agentic-report/report-orchestrator.ts
  lib/fortune-context-builder.ts
  lib/kline-v6.ts
  lib/life-profile/types.ts
  lib/life-profile/store.ts
  lib/life-profile/server-store.ts
  lib/life-profile/recalibrate.ts
  lib/life-profile/calibration-status.ts
  lib/annual-review/build-review.ts
  lib/agentic-report/prompt-injector.ts
  lib/agentic-report/prompt-registry.ts
  lib/agentic-report/build-ground-truth.ts
  lib/agentic-report/create-agentic-context.ts
  lib/agentic-report/types.ts
  lib/fortune-context-builder.ts
  lib/profile-context-builder.ts
  lib/agentic-report/build-fallback-agent-results.ts
  lib/content-voice.ts
  lib/report-pro-view.ts
  lib/report-decision-sheet.ts
  lib/chat-report-anchor.ts
  lib/agent-prompt-system.ts
  lib/knowledge-ladder.ts
  lib/report-learning-path.ts
  lib/knowledge-base-meta.ts
  lib/learning-tracks.ts
  lib/content-seeds.ts
  lib/content-enrichment.ts
  lib/product-analytics.ts
  lib/product-analytics-events.ts
  lib/learning-tracks.ts
  lib/learning-track-steps-client.ts
  lib/dimensions/config.ts
  lib/dimensions/types.ts
  lib/dimensions/shared.ts
  lib/dimensions/engine-pack.ts
  lib/dimensions/run-dimension-advisor.ts
  lib/dimensions/prompt-registry.ts
  lib/dimensions/enhance-with-llm.ts
  lib/dimensions/recommendations.ts
  lib/dimensions/fortune-rhythm-advisor.ts
  lib/dimensions/career-industry-advisor.ts
  lib/dimensions/investment-rhythm-advisor.ts
  lib/dimensions/data/industries.ts
  lib/dimensions/data/asset-classes.ts
  lib/dimensions/data/body-systems.ts
  lib/dimensions/data/subjects.ts
  lib/dimensions/data/name-characters.ts
  lib/dimensions/health-advisor.ts
  lib/dimensions/marriage-advisor.ts
  lib/dimensions/study-career-advisor.ts
  lib/dimensions/naming-advisor.ts
  lib/dimensions/partnership-advisor.ts
  lib/dimensions/living-environment-advisor.ts
  lib/dimensions/timing-selection-advisor.ts
  lib/dimensions/data/partner-archetypes.ts
  lib/dimensions/data/directions-wuxing.ts
  lib/dimensions/data/daily-fortune.ts
)

# Intentional UI paths — re-applied after hash-restore (must not revert to production git)
DESIGN_SYSTEM_UI_PATHS=(
  middleware.ts
  app/page.tsx
  app/analyze/page.tsx
  app/globals.css
  components/analyze/analyze-workspace.tsx
  components/analyze/portal-rail.tsx
  components/layout/app-page.tsx
  components/layout/focus-hero.tsx
  components/layout/portal-layout.tsx
  components/layout/section-header.tsx
  components/layout/alert-banner.tsx
  components/retention-resume-panel.tsx
  lib/portal-nav.ts
  lib/portal-tools.ts
  components/site-header.tsx
  components/dimensions/dimension-grid.tsx
  components/dimensions/dimension-report-shell.tsx
  components/dimensions/dimension-page-body.tsx
  components/dimensions/dimension-recommendations.tsx
  components/dimensions/dimension-recommendations-panel.tsx
  components/dimensions/related-dimensions-panel.tsx
  components/dimensions/dimensions-showcase.tsx
  components/content/content-action-rail.tsx
  components/content/content-list-pagination.tsx
  components/content/content-locale-filter.tsx
  components/content/journey-strip.tsx
  components/predictions/predictions-list-page.tsx
  components/predictions/predictions-panel.tsx
  # NOTE: do NOT force re-apply protected result shell paths from local stubs:
  # app/result/[id]/page.tsx and components/report/report-page-extras.tsx stay prod-git.
  # 大众报告内容展示（content-voice / 循循善诱）
  components/report-pro/pro-overview-card.tsx
  components/report-pro/pro-topic-grid.tsx
  components/report-pro/pro-action-bar.tsx
  components/report-pro/pro-beginner-guide.tsx
  components/report-pro/pro-time-scores.tsx
  components/report-pro/pro-outlook-pair.tsx
  components/report-pro/pro-elements-card.tsx
  components/report-pro/pro-risk-alerts.tsx
  components/report-pro/pro-decision-sheet.tsx
  components/report-pro/pro-report-shell.tsx
  components/report-pro/pro-learning-path.tsx
  components/report-pro/pro-term-tip.tsx
  app/learn/page.tsx
  components/annual-review/annual-review-card.tsx
  components/annual-review/annual-review-page-body.tsx
  app/profile/page.tsx
  app/dimensions/page.tsx
  app/dimensions/[slug]/page.tsx
  app/api/dimensions/[slug]/route.ts
  app/predictions/page.tsx
  app/annual-review/page.tsx
  app/tools/page.tsx
  app/tools/category/[category]/page.tsx
  app/knowledge/page.tsx
  app/knowledge/[slug]/page.tsx
  app/cases/page.tsx
  app/cases/[slug]/page.tsx
  app/insights/[type]/[slug]/page.tsx
  app/layout.tsx
  app/sitemap.ts
  app/page.tsx
  app/analyze/page.tsx
  app/api/report/route.ts
  components/seo/json-ld.tsx
)

rsync_to() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[dry-run] rsync $*"
    return 0
  fi
  rsync -az -e "$RSYNC_RSH" "$@"
}

rsync_to_retry() {
  local attempt max="${RSYNC_RETRIES:-3}"
  for attempt in $(seq 1 "$max"); do
    if rsync_to "$@"; then
      return 0
    fi
    echo "WARN: rsync failed (attempt $attempt/$max), retrying in 3s..." >&2
    sleep 3
  done
  return 1
}

ssh_retry() {
  local attempt max="${SSH_RETRIES:-3}"
  for attempt in $(seq 1 "$max"); do
    if "${SSH_CMD[@]}" "$@"; then
      return 0
    fi
    echo "WARN: ssh failed (attempt $attempt/$max), retrying in 3s..." >&2
    sleep 3
  done
  return 1
}

# newline-separated paths for remote hash-restore exclusion
DESIGN_SYSTEM_UI_EXCLUDE="$(printf '%s\n' "${DESIGN_SYSTEM_UI_PATHS[@]}")"

echo "==> Preflight: local build"
cd "$LOCAL_DIR"
npm run build

echo "==> Preflight: SSH to $PROD_HOST"
REMOTE_NAME="$("${SSH_CMD[@]}" "$PROD_HOST" 'hostname' 2>/dev/null || true)"
if [[ -z "$REMOTE_NAME" ]]; then
  echo "ERROR: SSH failed. Check SSHPASS or wait if fail2ban blocked your IP." >&2
  exit 1
fi
echo "connected: $REMOTE_NAME"

echo "==> Recover lib/ on server (restore from git, keep database.ts patches)"
if [[ "$DRY_RUN" != "1" ]]; then
  "${SSH_CMD[@]}" "$PROD_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
cp lib/database.ts /tmp/database.ts.deploy-backup
for f in $(git ls-tree --name-only HEAD lib/); do
  if [[ "$f" == "lib/database.ts" ]]; then
    continue
  fi
  git checkout HEAD -- "$f"
done
mv /tmp/database.ts.deploy-backup lib/database.ts
echo "lib/ restored from git (database.ts preserved)"
REMOTE
fi

echo "==> Sync app/ (pages, API routes, globals.css, sitemap)"
rsync_to \
  "$LOCAL_DIR/app/" \
  "$PROD_HOST:$REMOTE_DIR/app/"

echo "==> Sync components/"
rsync_to \
  "$LOCAL_DIR/components/" \
  "$PROD_HOST:$REMOTE_DIR/components/"

echo "==> Restore production-critical paths (${#PRODUCTION_PROTECTED_PATHS[@]} paths — never keep local stubs)"
if [[ "$DRY_RUN" != "1" ]]; then
  CHECKOUT_ARGS=""
  for p in "${PRODUCTION_PROTECTED_PATHS[@]}"; do
    CHECKOUT_ARGS+=" $(printf '%q' "$p")"
  done
  "${SSH_CMD[@]}" "$PROD_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<REMOTE
set -euo pipefail
cd "\$REMOTE_DIR"
restored=0
for path in$CHECKOUT_ARGS; do
  if git cat-file -e "HEAD:\$path" 2>/dev/null; then
    git checkout HEAD -- "\$path" 2>/dev/null || true
    restored=\$((restored + 1))
  fi
done
echo "production-critical paths restored from git (\$restored files)"
REMOTE
fi

echo "==> Restore hash-mismatched app/components (local stubs with similar line counts)"
if [[ "$DRY_RUN" != "1" ]]; then
  printf '%s' "$DESIGN_SYSTEM_UI_EXCLUDE" | ssh_retry "$PROD_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
cat > /tmp/hash-restore-exclude.txt
python3 <<'PY' > /tmp/hash-restore-list.txt
import os, subprocess, hashlib
exclude = set()
with open("/tmp/hash-restore-exclude.txt", "r", encoding="utf-8") as fh:
    exclude = {line.strip() for line in fh if line.strip()}
tracked = [
    line for line in subprocess.check_output(["git", "ls-files", "app", "components"], text=True).splitlines()
    if line.endswith((".tsx", ".ts", ".css"))
]
for rel in tracked:
    if rel in exclude:
        continue
    if not os.path.isfile(rel):
        continue
    disk = open(rel, "rb").read()
    try:
        git = subprocess.check_output(["git", "show", f"HEAD:{rel}"], stderr=subprocess.DEVNULL)
    except subprocess.CalledProcessError:
        continue
    if hashlib.sha256(disk).digest() != hashlib.sha256(git).digest():
        print(rel)
PY
count=$(wc -l < /tmp/hash-restore-list.txt | tr -d ' ')
if [[ "$count" -gt 0 ]]; then
  xargs git checkout HEAD -- < /tmp/hash-restore-list.txt 2>/dev/null || true
  echo "hash-restore: $count file(s)"
else
  echo "hash-restore: none"
fi
REMOTE
fi

echo "==> Re-apply intentional design-system UI paths (${#DESIGN_SYSTEM_UI_PATHS[@]} files)"
for rel in "${DESIGN_SYSTEM_UI_PATHS[@]}"; do
  if [[ -f "$LOCAL_DIR/$rel" ]]; then
    rsync_to_retry "$LOCAL_DIR/$rel" "$PROD_HOST:$REMOTE_DIR/$rel" || {
      echo "ERROR: failed to sync $rel after retries." >&2
      exit 1
    }
  else
    echo "WARN: missing $rel — skip"
  fi
done

echo "==> Ensure whitelisted lib/ parent directories exist on server"
if [[ "$DRY_RUN" != "1" ]]; then
  "${SSH_CMD[@]}" "$PROD_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
mkdir -p lib/predictions lib/life-profile lib/annual-review lib/dimensions/data
REMOTE
fi

echo "==> Sync whitelisted new lib/ modules only"
lib_sync_failed=0
for rel in "${LIB_WHITELIST[@]}"; do
  if [[ -f "$LOCAL_DIR/$rel" ]]; then
    if ! rsync_to_retry "$LOCAL_DIR/$rel" "$PROD_HOST:$REMOTE_DIR/$rel"; then
      echo "WARN: failed to sync $rel — continuing (UI already applied)" >&2
      lib_sync_failed=1
    fi
  else
    echo "WARN: missing $rel — skip"
  fi
done
if [[ "$lib_sync_failed" == "1" ]]; then
  echo "WARN: one or more lib whitelist syncs failed; remote build will still run." >&2
fi

echo "==> Restore production build config (never overwrite next/postcss from local)"
if [[ "$DRY_RUN" != "1" ]]; then
  "${SSH_CMD[@]}" "$PROD_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"
git checkout HEAD -- next.config.js postcss.config.js tailwind.config.js 2>/dev/null || true
rm -f postcss.config.mjs
REMOTE
fi

if [[ "$SW_BUMPED" == "1" ]]; then
  echo "==> Sync service worker shell (CACHE_NAME=${SW_CACHE_NAME})"
  for sw_rel in public/sw.js public/offline.html; do
    if [[ -f "$LOCAL_DIR/$sw_rel" ]]; then
      rsync_to_retry "$LOCAL_DIR/$sw_rel" "$PROD_HOST:$REMOTE_DIR/$sw_rel" || {
        echo "ERROR: failed to sync $sw_rel after SW bump." >&2
        exit 1
      }
    else
      echo "WARN: missing $sw_rel — skip"
    fi
  done
fi

echo "==> Sync post-deploy smoke scripts"
for smoke_script in post-deploy-smoke.js smoke-predictions-auth-e2e.js smoke-dimensions-e2e.js smoke-prediction-due-email-cron.js patch-from-source.py; do
  if [[ -f "$LOCAL_DIR/scripts/$smoke_script" ]]; then
    rsync_to_retry "$LOCAL_DIR/scripts/$smoke_script" "$PROD_HOST:$REMOTE_DIR/scripts/$smoke_script" || {
      echo "WARN: failed to sync $smoke_script" >&2
    }
  fi
done

echo "==> Patch production-only tool paths (summary + slug aliases + daily-sign)"
if [[ "$DRY_RUN" != "1" ]]; then
  bash "$SCRIPT_DIR/patch-tool-result-production.sh" || echo "WARN: tool-result patch failed" >&2
  bash "$SCRIPT_DIR/patch-tools-slug-aliases-production.sh" || echo "WARN: tools slug alias patch failed" >&2
  bash "$SCRIPT_DIR/patch-tools-daily-sign-production.sh" || echo "WARN: daily-sign patch failed" >&2
  bash "$SCRIPT_DIR/patch-public-question-fallback-production.sh" || echo "WARN: public-question fallback patch failed" >&2
  bash "$SCRIPT_DIR/patch-predictions-persistence-production.sh" || echo "WARN: predictions persistence patch failed" >&2
  # life profile must inject before prediction block, after predictions patch is applied
  bash "$SCRIPT_DIR/patch-life-profile-persistence-production.sh" || echo "WARN: life profile persistence patch failed" >&2
  bash "$SCRIPT_DIR/patch-prediction-due-email-production.sh" || echo "WARN: prediction due email patch failed" >&2
  bash "$SCRIPT_DIR/deploy-prediction-due-email-cron.sh" || echo "WARN: prediction due email daemon deploy failed" >&2
fi

echo "==> Remote build + PM2 reload"
if [[ "$DRY_RUN" == "1" ]]; then
  echo "[dry-run] would run: cd $REMOTE_DIR && ALLOW_PARTIAL_PM2_TARGETS=1 npm run deploy"
  exit 0
fi

ssh_retry "$PROD_HOST" "REMOTE_DIR='$REMOTE_DIR' bash -s" <<'REMOTE'
set -euo pipefail
cd "$REMOTE_DIR"

if [[ ! -f lib/database.ts ]]; then
  echo "ERROR: lib/database.ts missing on server." >&2
  exit 1
fi

echo "==> Build and reload PM2"
ALLOW_PARTIAL_PM2_TARGETS=1 npm run deploy

echo "==> Purge nginx HTML cache"
rm -rf /var/cache/nginx/lifekline/* 2>/dev/null || true
nginx -s reload 2>/dev/null || true

echo "==> Post-deploy smoke (tail)"
npm run ops:post-deploy-smoke 2>&1 | tail -30 || true
REMOTE

echo ""
echo "Deploy complete. Verify on https://www.life-kline.com:"
echo "  /dimensions  /dimensions/fortune-rhythm  /predictions  /annual-review"
echo "  /analyze  /result/<id>  /knowledge  /history"
if [[ "$SW_BUMPED" == "1" ]]; then
  echo "  SW cache bumped → CACHE_NAME=${SW_CACHE_NAME} (public/sw.js deployed)"
else
  echo "  SW cache not bumped (default; use BUMP_SW=1 or scripts/deploy-with-sw.sh)"
fi