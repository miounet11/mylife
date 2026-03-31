---
name: life-kline-surface-journeys
description: Use when connecting report pages, tool pages, homepage, profile, history, knowledge articles, and cases through shared journey recommendations in life-kline-next.
---

# Life Kline Surface Journeys

Use this skill for:

- adding cross-surface recommendations
- changing journey scoring or fallback logic
- wiring a new surface into the report/tool/article/case ecosystem

## Workflow

1. Prefer `lib/surface-journeys.ts` over local ad hoc recommenders.
2. Render via `components/surface-journey-panel.tsx` or `components/personal-journey-hub.tsx`.
3. Keep report, tool, article, and case links all present unless the surface has a clear reason not to.

## Read

- `../life-kline-growth-engine/references/journey-system.md`
