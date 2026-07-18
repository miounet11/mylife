# Surface → illustration map (priority)

## Inventory (2026-07-18 expansion)

| Status | Count | Notes |
|--------|------:|-------|
| Shipped ready (Wave A) | 10 | gpt-image-2 explainers |
| Wave B complex pending | 18 | hubs + report sections |
| Wave C simple icons | 10 | z-image-turbo 1:1 |
| **Catalog total** | **38** | |
| Optional later | ~12–20 | knowledge article templates, tool-category chips, world-yi |

**Rough need to “full product coverage”:** ~50–55 unique assets; this wave brings us to **38**. Remaining gap mainly SEO content auto-figures + niche tools.

## Surface map

| Priority | Surface key | Page / use | Status |
|----------|-------------|------------|--------|
| P0 | `home/workspace` | `/` analyze workspace | mounted + art |
| P0 | `docs/hub` | `/docs` | mounted (Wave B art) |
| P0 | `docs/read-first-report` | 如何读报告 | art shared |
| P0 | `report/cover` | 报告封面/导读 | art |
| P0 | `report/timing` | 大运流年 | art |
| P0 | `report/decision` | 结论动作风险 | mounted |
| P0 | `chat/opening` | 顾问开场 | art |
| P0 | `teachers/hub` | 请老师 | mounted |
| P1 | `tools/hub` | `/tools` | mounted |
| P1 | `events/validation` | 事件验证 | mounted |
| P1 | `predictions/revisit` | `/predictions` | mounted (Wave B) |
| P1 | `dimensions/hub` | `/dimensions` | mounted |
| P1 | `hehun/hub` | `/hehun` | mounted (Wave B) |
| P1 | `learn/hub` | `/learn` | mounted (Wave B) |
| P1 | `membership/hub` | `/membership` | art only (mount optional) |
| P1 | `profile/hub` | `/profile` | art only |
| P1 | `boundary/not-fatalism` | 非宿命边界 | art |
| P1 | `report/kline` `report/action` `report/risk` | report chapters | cite keys |
| P2 | `knowledge/*` `cases/*` | content | content-illustrations |

Report cite keys: `cover`, `reading-path`, `dayun`, `yongshen`, `decision-loop`, `validation`, `boundary`, `structure`, `timing`.

## Gen settings (this wave)

- concurrency **2** (lower load / more stable)
- complex → `gpt-image-2` (~50–70s each)
- simple → `z-image-turbo`
- ETA ~28 pending: ~15–25 min complex + ~3–5 min turbo
