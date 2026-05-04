---
name: life-kline-visual-asset-factory
description: Use when planning, generating, reviewing, correcting, storing, or publishing Life Kline / World Yi visual assets, including gpt-image-2 batches, brand reference pads, structured image manifests, visual asset DB schemas, content-page image binding, and Mingli/Yixue educational image libraries.
---

# Life Kline Visual Asset Factory

Use this skill for:

- gpt-image-2 image batch planning or production
- Life Kline / World Yi visual style consistency
- brand pad and reference-image design
- image manifest, prompt, QA, correction, and publication workflows
- visual asset database/schema planning
- binding images to `content_entries.meta.visualAssets`
- Mingli/Yixue visual education assets: five elements, yin-yang, bagua, stems/branches, bazi, liunian taisui, Kangxi dictionary, naming, feng shui, qimen, physiognomy/palmistry cultural diagrams

## Core Rule

Do not generate one-off images without a structured asset record.

The production system follows a Symphony-style workflow model:

- repo-owned workflow contract
- typed runtime config
- bounded concurrency
- per-asset failure isolation
- retry with backoff
- server-side storage
- structured batch snapshot
- human review before publication

Every image must have:

- stable id
- module / library key
- prompt
- size / ratio / quality
- brand pack or pad reference
- simplified and traditional overlay copy when relevant
- alt text
- target routes
- QA status
- correction status

## Provider Defaults

- Image base URL: `VISUAL_ASSET_API_BASE_URL`, default `https://www.gemiai.top/v1`
- Image API key: `VISUAL_ASSET_API_KEY`; never write secrets into repo files
- Default image model: `gpt-image-2`
- Core/hero/brand-pad image model: `gpt-image-2-pro`
- Narrative/article base URL: `API_BASE_URL`, default `https://ttqq.inping.com/v1`
- Narrative/article key: `OPENAI_API_KEY` or `API_KEY`
- Narrative/article model: `VISUAL_ASSET_NARRATIVE_MODEL`, default `CONTENT_GENERATION_MODEL` / `grok-420-fast`
- API surface for both channels: OpenAI-compatible `/v1/chat/completions`

## Required References

Read only what is needed:

- Overall product/world-yi visual plan: `docs/gpt-image-2-product-world-yi-visual-plan.md`
- Mingli/Yixue 1000-image library: `docs/gpt-image-2-mingli-yixue-visual-library-1000.md`
- Production, DB, QA, correction pipeline: `docs/gpt-image-2-visual-asset-production-pipeline.md`
- Content binding behavior: `lib/content-store.ts`
- DB table conventions: `lib/database.ts`

## Workflow

1. Identify scope:
   - brand pads
   - product/world-yi explanation images
   - structured doctrine images
   - social propagation images
   - Mingli/Yixue education images
   - content-page covers
   - DB / admin / pipeline implementation

2. Build or update a manifest before generation:
   - store planned assets under `data/visual-assets/manifests/` or a documented path
   - use ids from the relevant plan, e.g. `A01`, `S03-01`, `P01-01`, `MY03-001`
   - do not invent conflicting ids

3. Run through the workflow orchestrator when executing production:
   - workflow contract: `data/visual-assets/workflows/visual-production-v1.json`
   - full run: `npm run visual:run -- --manifest=data/visual-assets/manifests/brand-pads-v1.json`
   - regenerate: `npm run visual:run -- --manifest=data/visual-assets/manifests/brand-pads-v1.json --reset`
   - stage-only run: `npm run visual:run -- --manifest=... --stages=images,narratives`
   - status snapshot: `npm run visual:status -- --batch=brand-pads-v1`

4. Use brand pads:
   - first create or reference the brand pad set from the production pipeline
   - keep the visual language: modern Eastern judgment system, warm parchment, ink black, jade teal, cinnabar, muted gold
   - include Life Kline / World Yi / `www.life-kline.com` as overlay metadata, not generated small text unless explicitly requested

5. Generate or plan prompts:
   - compose prompts from structured fields
   - generate readable Chinese titles, labels, CTA, and brand/domain directly inside the image
   - do not rely on SVG/HTML overlays for core text
   - keep brand/domain as a compact 4-7% signature
   - use rich diagrams, cards, arrows, timelines, symbolic objects, and useful details
   - generate or update the per-image narrative article after the asset is imported

6. QA every asset:
   - check brand drift, text artifacts, knowledge errors, fear tone, determinism, crop risk, sensitive-topic risk
   - assign error codes from the production pipeline
   - never approve sensitive topics without boundary review

7. Correct failures:
   - update prompt and version
   - keep rejected outputs for analysis
   - after 3 failed correction rounds, mark for human review

8. Bind approved assets:
   - use `content_entries.meta.visualAssets` for knowledge/case/insight assets
   - use page config or static manifest for route-level assets
   - annual assets must include year metadata

## Safety Boundaries

- No deterministic fate claims.
- No fear-based Tai Sui, Ben Ming Nian, relationship, wealth, or health claims.
- No real-person face, palm, body, or bone reading.
- Physiognomy, palmistry, and bone-reading images must be abstract cultural education diagrams only.
- Feng shui images explain spatial order and movement; they do not replace safety, legal, architecture, or health advice.
- Naming images must not imply a name changes destiny; use structure, semantics, sound, and usage context.

## Validation

For docs/manifest changes:

```bash
rg -n "visualAssets|visual_assets|MY03-001|BRAND-BASE" docs data lib app
```

For implementation changes:

```bash
npm run test -- --runInBand tests/lib/content-store.test.ts
npm run build
```
