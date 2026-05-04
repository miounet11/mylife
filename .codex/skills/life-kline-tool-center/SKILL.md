---
name: life-kline-tool-center
description: Use when changing the 120-tool catalog, tool page productization, premium conversion hooks, tool memory, or tool recommendation sequencing in life-kline-next.
---

# Life Kline Tool Center

Use this skill for:

- tool definition changes in `lib/tools.ts`
- tool detail/result page product upgrades
- free vs paid layer refinement
- tool case stories, journeys, objections, FAQs, and premium modules
- tool-result persistence or user-linked tool memory

## Workflow

1. Update tool metadata first.
2. Route execution changes through `lib/tool-run-orchestrator.ts`.
3. Keep tool workflow policy in `data/workflows/tool-run-v1.json`.
4. Preserve deterministic fallback before enabling or changing LLM enhancement.
5. Keep auto QA and conversion scoring in the shared orchestrator, not per-tool pages.
6. Reuse shared rendering components.
7. Preserve persistence and context inheritance.
8. Validate with tool tests, lint, and build.

## Read

- `../life-kline-growth-engine/references/tool-system.md`
- `../../../../lib/tool-run-orchestrator.ts`
- `../../../../data/workflows/tool-run-v1.json`
