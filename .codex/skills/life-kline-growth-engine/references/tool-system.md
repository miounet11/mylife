# Tool System

Use this reference when changing tool catalog behavior.

## Core behavior

- All 120 tools are generated from `lib/tools.ts`
- Tool definitions include hook, free layer, paid layer, cases, next-tool chain, FAQ, objection handling, and premium outcomes
- Featured high-value tools also carry editorial fields:
  - `featuredBadge`
  - `signaturePromise`
  - `decisionLens`
  - `premiumWhyNow`

## Key rendering surfaces

- `app/tools/[slug]/page.tsx`
- `app/tool-result/[sessionId]/page.tsx`
- `app/tools/page.tsx`
- `app/tools/category/[category]/page.tsx`

## Supporting components

- `components/tool-runner.tsx`
- `components/tool-memory-panel.tsx`
- `components/tool-case-stories-panel.tsx`
- `components/tool-journey-panel.tsx`
- `components/tool-conversion-panel.tsx`
- `components/tool-premium-depth-panel.tsx`
- `components/tool-premium-request-panel.tsx`
- `components/tool-editorial-panel.tsx`

## Guardrails

- add metadata, not duplicated page logic
- keep next-tool flows in metadata where possible
- keep results tied to user context
