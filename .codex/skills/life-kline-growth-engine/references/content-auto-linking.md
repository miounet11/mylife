# Content Auto Linking

Use this reference when the task affects how articles/cases become connected to reports and tools.

## Core file

- `lib/content-store.ts`

## Important behavior

- `saveManagedContentEntry` enriches `meta` automatically before save
- automatic enrichment derives:
  - `relatedReportThemes`
  - `relatedToolSlugs`
  - `journeyAutomation`

## Priority order

1. explicit manual `meta` values stay respected
2. automatic enrichment fills missing relationship fields
3. if category inference is weak, fallback logic still assigns high-frequency tool links so the journey does not break

## Helper functions

- `normalizeManagedContentMeta`
- `getManagedContentJourneyMeta`
- internal journey enrichment logic in `lib/content-store.ts`

## Validation targets

- `tests/lib/content-store.test.ts`
- `tests/lib/knowledge-publication-ops.test.ts`

## Use this when

- new content save/publish flows are added
- generated articles or cases should automatically join the report/tool ecosystem
- journey metadata is missing, weak, or unstable
