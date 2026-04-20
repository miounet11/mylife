# Implementation Plan — Report Redesign V4

- Date: 2026-04-14
- Spec: `docs/superpowers/specs/2026-04-14-report-redesign-design.md`
- Scope: Restructure the existing `/result/[id]` experience first, reduce report-section repetition at the source, and ship the first visual/product upgrade without yet building the full public World-Yi archetype system.
- Out of scope for this plan: full public archetype SEO surfaces, full SBTI/MBTI taxonomy engine, large-scale OpenAgent content generation.

## Goal

Ship a first working Report V4 that:

1. gives the user a high-signal cockpit at the top of the result page,
2. separates long-form sections into distinct jobs,
3. reduces repeated wording between sections at the generation/view-model layer,
4. keeps current data sources and result-page flows working,
5. remains safe when some generated sections are sparse.

## Current code map

### Existing files to modify

- `app/result/[id]/page.tsx`
  - Current page orchestration.
  - Already computes many derived blocks: confidence, scenario views, monthly windows, yearly roadmap, decision playbook, validation, correction insight, K-line, state vector, premium services, guided paths.
  - This is where section order and most current result-page assembly live.

- `lib/report-v2.ts`
  - Already builds scenario views, monthly windows, confidence analysis, action suggestions, yearly roadmap, validation, correction, decision playbook, yearly trend snapshots, expert interpretation.
  - Best place to add new V4 view-model builders and anti-duplication shaping helpers.

- `lib/report-pipeline.ts`
  - Current report-generation/merge/finalization entrypoint.
  - Best place to add a first V4 report contract container under `analysis`, with backward-compatible fallback behavior.

- `lib/report-types.ts`
  - Existing report-oriented types; best place to define explicit V4 section types if needed for page and pipeline coordination.

- `lib/user-types.ts`
  - Canonical broad data model. Only touch if the stored analysis shape needs shared type coverage.

- `components/fortune-kline-chart.tsx`
  - Existing K-line chart. Can be visually upgraded or wrapped for V4 hero usage.

### Existing files to inspect while implementing

- `components/report-engine-panel.tsx`
  - Keep engine/version/audit block compatible with new layout.

- `components/next-step-guide.tsx`
  - Keep downstream action funnel aligned with the new action board.

- `components/report/*`
  - Existing report-specific component area; preferred location for new V4 result modules.

- `package.json`
  - Verification commands: `npm run lint`, `npm run test`, `npm run build`.

### New files to create

Create focused result-page modules under `components/report/`:

- `components/report/report-cockpit.tsx`
  - Top summary surface: one-line judgment, stage, type, confidence, top actions, avoidances, short period summaries.

- `components/report/report-blueprint-cards.tsx`
  - Compact structural explanation cards replacing repeated prose.

- `components/report/report-current-state.tsx`
  - “Current Operating System” section for stage diagnosis.

- `components/report/report-rhythm-timeline.tsx`
  - 12-month rhythm/timing surface using existing monthly windows.

- `components/report/report-scenario-panels.tsx`
  - Domain panels with one verdict + one reason + one action each.

- `components/report/report-action-board.tsx`
  - 7/30/90-day action board using decision playbook and action suggestions.

- `components/report/report-validation-panel.tsx`
  - Certainty boundaries, event verification, drift/correction framing.

Optional if needed after first pass:

- `components/report/report-personality-bridge.tsx`
  - Light native archetype + bridge label block. Only create if the first pass clearly benefits from a dedicated component.

## Data model direction

Use backward-compatible V4 section data under `analysis`, without requiring an immediate DB migration.

Target shape inside the result object:

```ts
analysis.v4Sections = {
  cockpit,
  lifeKLine,
  coreBlueprint,
  currentOperatingSystem,
  timeline12Months,
  scenarioPanels,
  actionBoard,
  validationLayer,
  personalityBridge,
}
```

For the first shipping pass, these sections can be computed at read/render time from existing fields plus small pipeline additions. Do not block the rollout on a storage migration.

## Implementation strategy

Build this in four slices, each independently testable.

1. Add V4 types and section builders.
2. Assemble V4 view-model data in the result page while preserving current page behavior.
3. Add new V4 report components and switch page layout to the new cockpit-first structure.
4. Add first anti-duplication shaping in the pipeline and verify fallback behavior.

---

## Slice 1 — Add V4 section types and builders

### Task 1.1 — Define focused V4 section types

Files:
- `lib/report-types.ts`

- [ ] **Step 1: Read the full existing `lib/report-types.ts` and confirm whether V4 section interfaces belong there rather than `user-types.ts`.**

Run:
```bash
sed -n '1,260p' /home/life-kline-next/lib/report-types.ts
```

Expected: existing report-oriented interfaces are present and this file is the best place for new V4 interfaces.

- [ ] **Step 2: Add explicit V4 section interfaces to `lib/report-types.ts`.**

Add interfaces for:
- `ReportCockpitSection`
- `ReportLifeKLineSection`
- `ReportBlueprintSection`
- `ReportCurrentStateSection`
- `ReportTimelineSection`
- `ReportScenarioPanelSection`
- `ReportActionBoardSection`
- `ReportValidationSection`
- `ReportPersonalityBridgeSection`
- `ReportV4Sections`

Requirements:
- keep fields narrow and render-friendly,
- prefer strings and arrays already supported by current result data,
- include optional fields for sparse-data fallback,
- do not invent database-only requirements.

- [ ] **Step 3: Run TypeScript-aware lint/build check on the file.**

Run:
```bash
npm run lint -- --file lib/report-types.ts
```

Expected: no lint/type issues caused by the new interfaces.

### Task 1.2 — Build V4 section-view helpers in `lib/report-v2.ts`

Files:
- `lib/report-v2.ts`
- `lib/report-types.ts`

- [ ] **Step 1: Read the end of `lib/report-v2.ts` to find the helper/export pattern.**

Run:
```bash
sed -n '1,980p' /home/life-kline-next/lib/report-v2.ts
```

Expected: helper style and export placement are clear.

- [ ] **Step 2: Add V4 builder functions to `lib/report-v2.ts`.**

Add pure builders that accept already-derived data and return render-ready sections:
- `buildReportCockpitSection(...)`
- `buildReportLifeKLineSection(...)`
- `buildReportBlueprintSection(...)`
- `buildReportCurrentStateSection(...)`
- `buildReportTimelineSection(...)`
- `buildReportScenarioPanelSection(...)`
- `buildReportActionBoardSection(...)`
- `buildReportValidationSection(...)`
- `buildReportPersonalityBridgeSection(...)`
- `buildReportV4Sections(...)`

Builder rules:
- cockpit must produce concise labels/cards rather than long text,
- blueprint must reuse structural facts already present instead of rewriting long paragraphs,
- timeline must derive directly from `monthlyWindows`,
- action board must prefer `decisionPlaybook` and fall back to `actionSuggestions`,
- validation must derive from `confidence`, `validationInsights`, and `correctionInsight`,
- personality bridge must stay light and clearly framed as a bridge label, not a deterministic MBTI claim.

- [ ] **Step 3: Add one internal helper for anti-repetition shaping in the V4 builders.**

Implement a small helper such as `compactUniqueLines(values, limit)` or equivalent that:
- trims whitespace,
- removes empty items,
- de-duplicates near-identical lines,
- preserves original order,
- caps the output length.

Use it in cockpit, blueprint, action, and validation builders.

- [ ] **Step 4: Run a focused lint check on `lib/report-v2.ts`.**

Run:
```bash
npm run lint -- --file lib/report-v2.ts
```

Expected: no lint errors.

---

## Slice 2 — Assemble V4 data in the result page without breaking current flows

### Task 2.1 — Add V4 section assembly to `app/result/[id]/page.tsx`

Files:
- `app/result/[id]/page.tsx`
- `lib/report-v2.ts`
- `lib/report-types.ts`

- [ ] **Step 1: Extend imports in `app/result/[id]/page.tsx` for the new V4 builders.**

Import the exact new builder functions from `lib/report-v2.ts`.

- [ ] **Step 2: Build `reportV4Sections` alongside the existing derived data.**

After the current derived values are available (`scenarioViews`, `monthlyWindows`, `confidence`, `decisionPlaybook`, `actionSuggestions`, `validationInsights`, `correctionInsight`, `stateVector`, `expertInterpretation`), add one assembly call:

```ts
const reportV4Sections = buildReportV4Sections({ ... })
```

Use only current page-available values. Do not fetch new sources.

- [ ] **Step 3: Keep the old derived values in place for the first pass.**

Do not remove current values yet. The new layout will still need some existing panels and fallback content while V4 is introduced.

- [ ] **Step 4: Add the assembled `reportV4Sections` into the page render path.**

Pass only the relevant section pieces to each new component instead of passing the whole result object everywhere.

- [ ] **Step 5: Run a focused lint check on the result page.**

Run:
```bash
npm run lint -- --file app/result/[id]/page.tsx
```

Expected: imports and new assembly logic pass lint.

### Task 2.2 — Add minimal pipeline support for V4 section ownership metadata

Files:
- `lib/report-pipeline.ts`
- possibly `lib/report-types.ts` or `lib/user-types.ts` only if required for compile success

- [ ] **Step 1: Read the merge/finalize section of `lib/report-pipeline.ts` around where `analysis` is normalized.**

Run:
```bash
sed -n '304,520p' /home/life-kline-next/lib/report-pipeline.ts
```

Expected: clear place to add backward-compatible `analysis.v4` or `analysis.sectionOwnership` metadata.

- [ ] **Step 2: Add a lightweight V4 report-contract container in the finalized analysis payload.**

Add a small structure such as:
- `analysis.sectionOwnership`
- `analysis.v4ContractVersion = 'v1'`
- `analysis.v4OwnedConcepts = { cockpit: [...], blueprint: [...], ... }`

Requirements:
- do not require regeneration of all historical rows,
- keep all fields optional,
- ensure historical reports still render.

- [ ] **Step 3: Add one shaping pass that reduces repeated advice fragments before delivery.**

Apply a light normalization only where safe, for example:
- trim repeated identical advice lines,
- avoid duplicating the same sentence across adjacent fields,
- preserve meaning and current output compatibility.

Do not rewrite the whole narrative engine in this slice.

- [ ] **Step 4: Run a focused lint check on `lib/report-pipeline.ts`.**

Run:
```bash
npm run lint -- --file lib/report-pipeline.ts
```

Expected: no lint errors.

---

## Slice 3 — Build the new V4 result modules

### Task 3.1 — Build `ReportCockpit`

Files:
- `components/report/report-cockpit.tsx`
- optionally `app/result/[id]/page.tsx`

Aesthetic direction:
- bold product UI,
- premium dashboard feel,
- strong information hierarchy,
- avoid generic “AI gradient hero” aesthetics,
- keep visual language compatible with current site tokens.

- [ ] **Step 1: Create `components/report/report-cockpit.tsx`.**

Implement a component that renders:
- one-line judgment,
- stage badge,
- identity/archetype badge,
- confidence badge,
- top actions,
- avoidances,
- short period summary cards.

Rules:
- concise content only,
- no long paragraphs,
- no extra fetches,
- responsive two-column layout on desktop,
- preserve readability on narrow screens.

- [ ] **Step 2: Add a visually distinctive but restrained surface treatment.**

Use existing classes/tokens where possible.
Add:
- a strong title block,
- compact chips/badges,
- a memorable layout break (for example asymmetric summary + card grid),
- no dependence on external assets or new fonts.

- [ ] **Step 3: Render `ReportCockpit` in `app/result/[id]/page.tsx` above the current main-body sections.**

Expected placement: immediately after top hero/summary area and before deeper report modules.

- [ ] **Step 4: Run a focused lint check.**

Run:
```bash
npm run lint -- --file components/report/report-cockpit.tsx --file app/result/[id]/page.tsx
```

Expected: pass.

### Task 3.2 — Build `ReportBlueprintCards` and `ReportCurrentState`

Files:
- `components/report/report-blueprint-cards.tsx`
- `components/report/report-current-state.tsx`
- `app/result/[id]/page.tsx`

- [ ] **Step 1: Create `report-blueprint-cards.tsx`.**

Render compact cards for:
- structure type,
- strongest advantage,
- recurring risk,
- useful direction,
- unsuitable pattern.

Use existing result facts and expert interpretation tags/headlines where available.

- [ ] **Step 2: Create `report-current-state.tsx`.**

Render:
- current stage headline,
- current diagnosis summary,
- push/hold/adjust/recover stance,
- up to 3 evidence bullets,
- one immediate usage note.

- [ ] **Step 3: Insert both modules below the cockpit and before the lower-funnel components.**

The order should be:
1. cockpit,
2. K-line/timeline visual layer,
3. blueprint,
4. current state,
5. scenario/action/validation,
6. existing downstream components.

- [ ] **Step 4: Run a focused lint check.**

Run:
```bash
npm run lint -- --file components/report/report-blueprint-cards.tsx --file components/report/report-current-state.tsx --file app/result/[id]/page.tsx
```

Expected: pass.

### Task 3.3 — Build `ReportRhythmTimeline`

Files:
- `components/report/report-rhythm-timeline.tsx`
- `app/result/[id]/page.tsx`

- [ ] **Step 1: Create `report-rhythm-timeline.tsx`.**

Render the first 12 months using `monthlyWindows`:
- push,
- steady/prepare,
- caution,
- review/recalibration.

Implementation rule:
- use a rhythm-board layout, not literal enterprise Gantt chrome,
- surface month label, theme, status, and short reason,
- cap visible copy tightly.

- [ ] **Step 2: Add lightweight visual status coding.**

Use existing color tokens or nearby equivalents.
Avoid inaccessible low-contrast combinations.

- [ ] **Step 3: Place the timeline near the K-line visual layer.**

Either directly below the K-line or in the same visual block if the layout remains readable.

- [ ] **Step 4: Run a focused lint check.**

Run:
```bash
npm run lint -- --file components/report/report-rhythm-timeline.tsx --file app/result/[id]/page.tsx
```

Expected: pass.

### Task 3.4 — Upgrade or wrap the existing K-line hero

Files:
- `components/fortune-kline-chart.tsx`
- optionally a new wrapper under `components/report/`
- `app/result/[id]/page.tsx`

- [ ] **Step 1: Decide whether a wrapper is enough or the existing chart should be upgraded directly.**

Rule:
- if only labels/surrounding chrome need changing, create a wrapper,
- if the chart internals need meaningful styling updates, edit `fortune-kline-chart.tsx` directly.

- [ ] **Step 2: Implement the first hero-level K-line presentation.**

Required upgrades:
- stronger section framing,
- short long-arc explanation,
- clearer latest metrics,
- visually stronger relation to the new cockpit.

Do not change the underlying data model in this step.

- [ ] **Step 3: Run a focused lint check.**

Run:
```bash
npm run lint -- --file components/fortune-kline-chart.tsx --file app/result/[id]/page.tsx
```

Expected: pass.

### Task 3.5 — Build scenario/action/validation modules

Files:
- `components/report/report-scenario-panels.tsx`
- `components/report/report-action-board.tsx`
- `components/report/report-validation-panel.tsx`
- `app/result/[id]/page.tsx`

- [ ] **Step 1: Create `report-scenario-panels.tsx`.**

Render 3–4 domain panels max, preferring strongest and most decision-relevant domains.
Each panel must show:
- one verdict,
- one reason,
- one action.

Do not dump the full old scenario text blocks.

- [ ] **Step 2: Create `report-action-board.tsx`.**

Render:
- now / 30-day / 90-day structure,
- current priority items from `decisionPlaybook`,
- fallback to `actionSuggestions` when needed.

Use short action language, not essay-style prose.

- [ ] **Step 3: Create `report-validation-panel.tsx`.**

Render:
- confidence level,
- high-confidence points,
- sensitive points,
- correction summary if drift exists,
- event-verification prompts.

- [ ] **Step 4: Insert these modules into `app/result/[id]/page.tsx` before current lower-funnel blocks such as premium/subscription/next-step surfaces.**

- [ ] **Step 5: Run a focused lint check.**

Run:
```bash
npm run lint -- --file components/report/report-scenario-panels.tsx --file components/report/report-action-board.tsx --file components/report/report-validation-panel.tsx --file app/result/[id]/page.tsx
```

Expected: pass.

---

## Slice 4 — Final cleanup, fallback safety, and verification

### Task 4.1 — Remove obvious duplicated copy from the page assembly layer

Files:
- `app/result/[id]/page.tsx`
- possibly `lib/report-v2.ts`

- [ ] **Step 1: Review which old blocks have become redundant after V4 modules render.**

Candidates:
- duplicated top-summary bullets,
- repeated stage summary text,
- repeated action phrases reused in multiple hero-like surfaces.

- [ ] **Step 2: Delete only the redundant page-level restatements.**

Rules:
- keep engine-quality and downstream funnel panels,
- keep event capture and premium surfaces,
- do not delete data derivations still used elsewhere.

- [ ] **Step 3: Run a focused lint check on `app/result/[id]/page.tsx`.**

Run:
```bash
npm run lint -- --file app/result/[id]/page.tsx
```

Expected: pass.

### Task 4.2 — Verify sparse-data fallback behavior

Files:
- `app/result/[id]/page.tsx`
- new report components
- `lib/report-v2.ts`

- [ ] **Step 1: Manually inspect each new component for missing-data guards.**

Each component must tolerate:
- empty arrays,
- absent confidence,
- absent personality bridge,
- limited monthly windows,
- missing action suggestions,
- partial validation info.

- [ ] **Step 2: Add conditional rendering where needed.**

Examples:
- hide a badge if the value is absent,
- render only top 2 scenario cards if data is weak,
- show a short empty-state line instead of breaking layout.

- [ ] **Step 3: Run lint after guards are added.**

Run:
```bash
npm run lint -- --file components/report/report-cockpit.tsx --file components/report/report-blueprint-cards.tsx --file components/report/report-current-state.tsx --file components/report/report-rhythm-timeline.tsx --file components/report/report-scenario-panels.tsx --file components/report/report-action-board.tsx --file components/report/report-validation-panel.tsx --file app/result/[id]/page.tsx --file lib/report-v2.ts
```

Expected: pass.

### Task 4.3 — Full-project verification for this change set

Files:
- entire repo

- [ ] **Step 1: Run project lint.**

Run:
```bash
npm run lint
```

Expected: pass with no new errors introduced by the report V4 changes.

- [ ] **Step 2: Run unit/integration tests.**

Run:
```bash
npm run test -- --runInBand
```

Expected: existing suite passes, or failures are unrelated and documented before claiming completion.

- [ ] **Step 3: Run production build.**

Run:
```bash
npm run build
```

Expected: Next.js production build succeeds.

- [ ] **Step 4: Manually inspect the result page in the browser/dev server.**

Run if needed:
```bash
npm run dev
```

Manual checks:
- top screen is understandable in ~30 seconds,
- cockpit is visually distinct from the rest of the page,
- K-line and rhythm timeline feel connected,
- scenario/action/validation blocks do not repeat the same paragraph logic,
- lower-funnel panels still appear and work.

### Task 4.4 — Request code review before merging or branch-finalization

- [ ] **Step 1: Invoke the code-review workflow after implementation and verification succeed.**

Use the available code-review skill or agent before any merge/PR step.

Expected: review catches regressions in page structure, data compatibility, and visual coherence.

---

## Notes for the implementing engineer

- Prefer reading and reusing existing derived values instead of creating new business logic branches.
- Do not attempt a full rewrite of the report-generation narrative in one pass.
- Do not make private result pages indexable.
- Do not ship a strong MBTI equivalence claim; keep the personality bridge explicitly soft.
- Keep the result page visually bolder, but still aligned with current site styling and tokens.
- If historical reports lack new V4 metadata, compute the V4 sections from existing values at render time.

## Completion definition

This plan is complete when:
- the result page has a cockpit-first V4 layout,
- the main report modules have clearly different jobs,
- repeated content is visibly reduced,
- existing result-page flows still work,
- lint, test, and build verification have all been run successfully.