#!/usr/bin/env bash
# Patch production analytics event allowlists for dual-track product events.
# Run on production host from /home/life-kline-next (or via ssh remote bash).
set -euo pipefail
cd "${REMOTE_DIR:-/home/life-kline-next}"

python3 <<'PY'
from pathlib import Path

EXTRA = [
  "mass_report_viewed",
  "mass_decision_copied",
  "mass_decision_printed",
  "mass_revisit_marked",
  "mass_prediction_seed_shown",
  "mass_prediction_outcome",
  "mass_prediction_to_event",
  "mass_need_map_click",
  "hehun_page_viewed",
  "hehun_run",
  "hehun_prefill_used",
  "events_created",
  "events_feedback",
  "chat_message_sent",
  "chat_anchor_loaded",
  "timing_window_viewed",
  "expert_view_opened",
  "expert_handoff_copied",
  "expert_print_clicked",
  "expert_crm_saved",
  "expert_crm_script_copied",
  "expert_crm_desk_viewed",
  "expert_dayun_grid_viewed",
  "tool_entry_clicked",
  "portal_rail_clicked",
  "predictions_page_viewed",
  "hehun_workspace_viewed",
  "expert_crm_page_viewed",
]

def inject_union(text: str) -> str:
    if "mass_report_viewed" in text:
        return text
    # Insert before the closing of AnalyticsEventName union (before interface TrackEventInput)
    needle = "  | 'analyze_form_started';"
    if needle in text:
        block = "\n".join([f"  | '{e}'" for e in EXTRA])
        return text.replace(needle, needle + "\n" + block, 1)
    # fallback: before interface
    marker = "\ninterface TrackEventInput"
    if marker in text:
        block = "\n".join([f"  | '{e}'" for e in EXTRA]) + "\n"
        return text.replace(marker, "\n" + block + marker, 1)
    return text

def inject_allowed(text: str) -> str:
    if "mass_report_viewed" in text and "ALLOWED_EVENTS" in text:
        # still ensure all present
        pass
    marker = "  'report_past_event_saved_from_result',\n]);"
    if marker in text and "mass_report_viewed" not in text:
        block = ",\n".join([f"  '{e}'" for e in EXTRA])
        return text.replace(
            marker,
            "  'report_past_event_saved_from_result',\n" + block + ",\n]);",
            1,
        )
    if "mass_report_viewed" not in text:
        # try end of set before ]);
        idx = text.find("const ALLOWED_EVENTS")
        if idx >= 0:
            end = text.find("]);", idx)
            if end > 0:
                block = ",\n".join([f"  '{e}'" for e in EXTRA])
                text = text[:end] + ",\n" + block + text[end:]
    return text

p = Path("lib/analytics.ts")
if p.exists():
    raw = p.read_text(encoding="utf-8")
    new = inject_union(raw)
    if new != raw:
        p.write_text(new, encoding="utf-8")
        print("patched lib/analytics.ts event union")
    else:
        print("lib/analytics.ts already patched or pattern miss")

r = Path("app/api/analytics/track/route.ts")
if r.exists():
    raw = r.read_text(encoding="utf-8")
    new = inject_allowed(raw)
    if new != raw:
        r.write_text(new, encoding="utf-8")
        print("patched app/api/analytics/track/route.ts ALLOWED_EVENTS")
    else:
        print("track route already patched or pattern miss")
else:
    print("WARN: track route missing")
PY
