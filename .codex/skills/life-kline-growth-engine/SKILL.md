---
name: life-kline-growth-engine
description: Use when working on the life-kline-next growth system that connects the core analysis report, 120 single-purpose tools, tool memory, premium conversion, knowledge articles, case studies, and auto-generated cross-surface journeys. Covers productization, cross-linking, persistence, and content-to-tool/report orchestration.
---

# Life Kline Growth Engine

Use this skill when the task touches any of these:

- report -> tool -> article -> case cross-linking
- the 120-tool center, tool detail/result pages, or tool recommendations
- persistent user tool history and context inheritance
- premium conversion on tool/report pages
- journey orchestration across homepage, profile, history, report, tool, knowledge, and case surfaces
- automatic content journey enrichment on save/publish

## What Exists

- 120 tools are config-driven from `lib/tools.ts`
- tool runs persist in `tool_sessions` and feed later context
- cross-surface journey logic lives in `lib/surface-journeys.ts`
- content entries auto-enrich journey metadata in `lib/content-store.ts`
- core UI surfaces already render journey panels and tool conversion panels

## First Checks

1. Read `lib/tools.ts` if the task changes tool definitions, sequencing, premium copy, or featured tools.
2. Read `lib/surface-journeys.ts` if the task changes cross-linking or recommendation paths.
3. Read `lib/content-store.ts` if the task changes content save/publish behavior or auto journey metadata.
4. Read the page/component that renders the affected surface before editing.

## Edit Rules

- Keep the 120 tools config-driven. Do not fork into 120 separate implementations.
- Prefer improving shared metadata and shared rendering over page-by-page duplication.
- If a content/report/tool surface should recommend another surface, route that through `lib/surface-journeys.ts` when possible.
- If a content item needs report/tool linkage, prefer automatic metadata enrichment first; only add manual overrides when automation would clearly fail.
- Do not remove user-context persistence. Tool history must remain available to later tool runs, chat, and report flows.

## Key Files

- `lib/tools.ts`
- `lib/tool-context.ts`
- `lib/content-store.ts`
- `lib/surface-journeys.ts`
- `app/result/[id]/page.tsx`
- `app/tools/[slug]/page.tsx`
- `app/tool-result/[sessionId]/page.tsx`
- `app/knowledge/[slug]/page.tsx`
- `app/cases/[slug]/page.tsx`
- `app/page.tsx`
- `app/profile/page.tsx`
- `app/history/page.tsx`

## Validation

Run the smallest relevant test set first, then lint, then build.

Common commands:

```bash
npm run test -- --runInBand tests/lib/tools.test.ts tests/app/api/tools-run-route.test.ts tests/lib/sitemap-tools.test.ts
npm run test -- --runInBand tests/lib/content-store.test.ts tests/lib/knowledge-publication-ops.test.ts
npm run lint
npm run build
```

## References

- Tool/product system: `references/tool-system.md`
- Journey orchestration: `references/journey-system.md`
- Content auto-linking: `references/content-auto-linking.md`
