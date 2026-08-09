# Life K-Line · Experience Kernel (Platform Foundation)

Benchmarked against [xai-org/grok-build](https://github.com/xai-org/grok-build): shared runtime, durable sessions, skills, progressive delivery, verify loops.

## Product laws

1. **FAST PATH never waits for PERFECT PATH** — T0 engine shell &lt;1s, T1 readable 3–12s, T2 depth async.
2. **NARRATIVE never overwrites ENGINE FACTS** — pillars / 用神 / 大运 locked as ground truth.
3. **DIALOGUE always anchors to REPORT STATE** — or explicitly says no chart is bound.
4. **ONE CHAT CLIENT** — `/chat` → `ChatPageClient` → `AIAssistantChat` only (`chat-workspace` is redirect stub).
5. **ONE K-LINE EXIT** — `generateLifeKlineV6` only; no Math.sin synthetic yearly legacy.
6. **PRODUCT BAR = usable deep ≥83** — expert S/95 is aspirational; delivery/stop uses ≥83.

## Runtime map

```
Surfaces: Chat · Result · Teachers · Email · Report-upgrader
                │
         Experience Kernel (leader)
    Truth · Draft · Depth · Dialogue · Quality · Delivery · Memory
                │
    Engine GT · Agent DAG · Skill registry · Session ledger
```

## Delivery tiers (SLA)

| Tier | Target | Payload |
|------|--------|---------|
| T0 Instant | &lt;800ms | Cockpit / pillars / SVG frames (no LLM) |
| T1 Readable | 3–12s | Opening, summary, **sevenDayActions**, judgment blocks |
| T2 Deep | 20–90s async | Multi-agent sections |
| T3 Plateau | stop ≥83 | Usable deep — no thrash |

## Event protocol (NDJSON)

Analyze: `stage` → `complete` | `error` (header `x-analyze-stream: 1`)  
Chat: `start` → `delta*` → `final` | `error` (header `x-chat-stream: 1`)  
Quality receipt: derived from `qualityAudit` + `upgradeJob` + `verify`.

## Skills

Teachers and dimension coaches are **skills** (`lib/skills/*`): id, capability mode, context slots, starters.  
Internal agentic agents stay off the user surface.

## Quality receipt

Every delivered report version exposes: score, grade, tier, readiness, trust/caution points, seven-day actions presence, plateau stop reason.

## Implementation entrypoints

| Module | Path |
|--------|------|
| Kernel types + helpers | `lib/experience-kernel/` |
| Skill registry | `lib/skills/registry.ts` |
| Quality receipt UI | `components/report/report-quality-receipt.tsx` |
| Analyze stream client | `components/analyze/analyze-workspace.tsx` |
| Chat stream | `app/api/chat/route.ts` + `components/ai-assistant-chat.tsx` |

Do not overwrite prod-owned: `lib/database.ts`, `lib/tools.ts`, `lib/content-store.ts`, `lib/email.ts`, `lib/user-utils.ts`.
