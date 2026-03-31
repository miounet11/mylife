---
name: life-kline-content-auto-linking
description: Use when changing how saved or generated content automatically maps to report themes, tools, related articles, and related cases in life-kline-next.
---

# Life Kline Content Auto Linking

Use this skill for:

- content save/publish pipeline changes
- automatic relationship metadata generation
- ensuring generated content joins the report/tool/content ecosystem without manual ops

## Workflow

1. Inspect `lib/content-store.ts` first.
2. Preserve existing manual meta and enrich missing journey fields automatically.
3. Add or update tests that prove auto-linking survives save and publication paths.

## Read

- `../life-kline-growth-engine/references/content-auto-linking.md`
