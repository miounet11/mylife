---
name: page-illustrations
description: >
  Batch-generate, store, and mount Life K-Line page/report explanatory illustrations
  (Imagine or gpt-image-2), optimize for web, publish under public/images or R2, and
  wire ContentFigure / report citations. Use when the user asks for 页面配图, 批量配图,
  报告插图, R2 images, gpt-image-2, page illustrations, or runs /page-illustrations.
---

# Page Illustrations — Life K-Line

Production path truth: `root@167.160.188.70:/home/life-kline-next`.  
Public serve path (default): `/images/page-illustrations/<file>.webp|png`.  
Existing pack path: `/images/visual-assets/...` (do not overwrite).

## Product constraints (never violate)

- **No superstition marketing**: no crystal balls, “改运必成”, horror fate imagery.
- **Linear/editorial**: paper bg, ink blue `#3b5998`, calm diagrams, readable Chinese labels.
- **Teachers**: 「××老师」 tone if people appear; prefer abstract diagrams over stock fortune-tellers.
- **Report-safe**: figures must support 结构/时序/行动/风险/验证 — not entertainment art.

## Architecture

```
catalog (TS)  →  generate (5-way)  →  optimize (webp)  →  public/ or R2
                      ↓
              manifest.json  →  PageIllustration / ContentFigure / report cite
```

| Layer | Path |
|-------|------|
| Catalog + resolver | `lib/page-illustrations/` |
| UI | `components/content/content-figure.tsx`, `page-illustration-strip.tsx` |
| Static assets | `public/images/page-illustrations/` |
| Manifest | `public/images/page-illustrations/manifest.json` |
| Batch scripts | `scripts/page-illustrations/` |
| This skill | `.grok/skills/page-illustrations/` |

## Generation backends

### A · inping Images API (**preferred**, production batch)

Gateway: `https://ttqq.inping.com` (OpenAI-compatible `/v1/images/generations`).

| Model | Use when | Speed |
|-------|----------|--------|
| **`gpt-image-2`** | Complex explainers, multi-panel diagrams, report figures, Chinese labels | slower, higher quality |
| **`z-image-turbo`** | Icons, simple chips, small 1:1 assets, draft thumbs | ~**20×** faster |

**Auth (never commit):**

```bash
export PAGE_ILLUST_API_BASE='https://ttqq.inping.com'
export PAGE_ILLUST_API_KEY='sk-…'   # terminal / prod .secrets only
# optional:
export PAGE_ILLUST_MODEL_COMPLEX=gpt-image-2
export PAGE_ILLUST_MODEL_TURBO=z-image-turbo
```

Prod secret file (not in git): `/home/life-kline-next/.secrets/page-illustrations.env`  
Template: `scripts/page-illustrations/env.example`

**Batch (5 concurrent):**

```bash
# auto-route: complex → gpt-image-2, simple/1:1 → z-image-turbo
node scripts/page-illustrations/generate.mjs --concurrency 5 --limit 20

# force model
node scripts/page-illustrations/generate.mjs --model gpt-image-2 --only PI-REPORT-READ-01
node scripts/page-illustrations/generate.mjs --model z-image-turbo --limit 5

# regenerate even if ready
node scripts/page-illustrations/generate.mjs --force --concurrency 5
```

- Always request `response_format: "b64_json"` (URL may be cluster-internal and unusable from laptop).
- Output: `public/images/page-illustrations/raw/*.png`
- Then: `node scripts/page-illustrations/optimize.mjs` → jpg/webp in parent folder
- Catalog field `complexity: 'complex' | 'simple'` (optional) steers routing; default heuristic: full explainers → complex.

Legacy alias: `generate-openai.mjs` → prefer `generate.mjs`.

### B · Grok Imagine (agent session)

Use tool `image_gen` when iterating interactively (no inping key in session).

- Aspect: `16:9` explainer, `3:2` report inline, `1:1` icon.
- **5 concurrent** max per wave; copy into `public/images/page-illustrations/`.

### Style prompt suffix (append to every prompt)

```
Editorial product diagram for Life K-Line (人生K线), Chinese decision-support app.
Clean Linear UI aesthetic, soft paper background, muted ink blue accents, geometric
diagrams, minimal icons, high readability, no crystal ball, no horror, no superstition
marketing slogans, no watermark, no low-quality stock photo look. 16:9 unless specified.
```

## Catalog entry schema

```ts
{
  id: 'PI-REPORT-READ-01',
  surfaces: ['docs/read-first-report', 'report/cover'],
  role: 'structure',          // cover | structure | timing | action | risk | summary
  title: '第一份报告怎么读',
  caption: '先结论与窗口，再展开结构',
  alt: '...',
  filename: 'report-reading-path.webp',
  aspectRatio: '16:9',
  prompt: '...',              // without style suffix
  reportCiteKeys: ['cover', 'reading-path'],  // optional report injection
  tags: ['报告', '阅读'],
}
```

## Optimize for web

```bash
# Prefer sharp / cwebp if available
node scripts/page-illustrations/optimize.mjs
# Targets: max width 1600, webp quality ~82, keep png fallback when needed
```

## Publish

### Primary (recommended): static on app server

```bash
# From local after generate+optimize
tar czf /tmp/lk-illust.tgz -C public/images page-illustrations
# scp + extract on prod under /home/life-kline-next/public/images/
```

Or include in design-system deploy tarball.

### Secondary: R2 mirror (ops backup / CDN if public bucket exists)

Backup credentials live only on prod: `.secrets/r2-backup.env` (bucket `xiangmubeifen` is **backup**, not public CDN by default).

If a **public** R2/custom domain is configured later:

```bash
# On prod, with PUBLIC_R2_* env
bash scripts/page-illustrations/sync-to-r2.sh
```

Manifest field `src` may be:

- `/images/page-illustrations/foo.webp` (local public)
- `https://cdn.example.com/page-illustrations/foo.webp` (public R2)

Never put secrets in catalog or commits.

## Mount on pages

```tsx
import { PageIllustrationStrip } from '@/components/content/page-illustration-strip';

// Docs / tools / teachers
<PageIllustrationStrip surface="docs/read-first-report" />

// Report sections
import { resolveReportIllustrations } from '@/lib/page-illustrations/resolve';
const figs = resolveReportIllustrations({ section: 'timing', pattern: '...' });
```

Content articles already use `resolveContentIllustrations` + `ContentFigureBlock` — new assets can be added to `CONTENT_ILLUSTRATION_CATALOG` **or** page-illustrations catalog with dual registration.

## Report / 测算 citation

1. Tag catalog entries with `reportCiteKeys`.
2. Report shell / agent chapters call `resolveReportIllustrations({ keys: ['dayun', 'yongshen'] })`.
3. Prefer **static educational** diagrams over user-specific generated faces (privacy).
4. Never invent 用神 in image labels that contradict EFC ground truth; use generic “用神/喜忌示意”.

## 5-way concurrency playbook

1. Load pending entries from catalog (`status != ready` or missing file).
2. Wave of **5** generations (Imagine or OpenAI).
3. Optimize wave → write manifest.
4. Next wave until done.
5. Deploy public assets + rebuild if Next needs static copy.
6. Smoke: open 3 pages, verify `<img>` 200 and LCP not destroyed (lazy load).

## Checklist before ship

- [ ] Style constraints satisfied (no superstition spam)
- [ ] Files under `public/images/page-illustrations/`
- [ ] `manifest.json` updated with width/height/src
- [ ] Catalog `ready: true` for shipped ids
- [ ] Pages load with `loading=lazy` except hero
- [ ] Prod extract OK; smoke key routes
- [ ] Optional R2 mirror only if public URL configured

## Related

- `lib/content-illustrations.ts` — article auto figures
- `components/content/content-figure.tsx` — figure chrome
- `references/style-bible.md` — visual rules
- `references/surface-map.md` — page → illustration map
