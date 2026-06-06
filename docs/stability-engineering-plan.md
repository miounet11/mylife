# Highest-Dimension Engineering Plan: Production Stability & Content Elevation (2026-05-31)

## 1. Stability Root Cause (Highest Dimension View)

Current symptoms (recurring):
- Next.js web instances (3001-3003) hit 90-96% heap + event loop p95 from 300ms → 70s+ within minutes of heavy content work (publication, growth:promote, knowledge synthesis, LLM/agent calls).
- "Single item size exceeds maxSize" explosions in Next IncrementalCache / fetch cache.
- VIRT memory 10s of GB, swap pressure, high CPU, daemon upstream 502s via nginx 8080.
- Main 3000 (admin) more resilient but still affected under load.
- Trigger: Large objects (full agentic reports, world-yi decision ledgers, knowledge graphs, raw LLM outputs) materialized and cached on the same processes serving user traffic (knowledge/world-yi pages use ISR + heavy SSR).

Architectural sins:
- No resource isolation: User-facing SSR workers polluted by backend content generation/LLM.
- Unbounded caches: Next.js defaults + custom code happily store multi-MB+ objects without size/TTL discipline.
- Blocking paths: Heavy synchronous or long async work (SQLite full loads, JSON serialization of graphs, LLM) on the event loop.
- Shared mutable state (single SQLite) + frequent full snapshots during publish cycles.
- ISR on high-cardinality knowledge pages during bulk updates causes thundering herd of regenerations.

## 2. Engineering Principles for Fix (Highest Dimension)

1. **Separation of Concerns (Hard Isolation)**
   - User web tier (light SSR, cache hits, auth) vs. dedicated content-worker tier (heavy LLM, graph building, generation, promotion).
   - All cron / generation / heavy admin via workers only.

2. **Bounded Resources Everywhere**
   - Every cache (Next, custom, in-memory graphs) must have explicit maxSize + TTL + eviction + monitoring.
   - LLM responses: stream + summarize/reduce before any cross-process or cache boundary.
   - DB: Prefer incremental loads, projections, materialized views over full entry graphs in memory.

3. **Non-Blocking by Default + Backpressure**
   - Heavy work always queued (existing content scheduler + jobs table or lightweight queue).
   - Web workers never wait on LLM/agent results synchronously.

4. **Observability & Self-Healing**
   - Per-process metrics: heap used/total, eventLoopLag (p50/p95/p99), cache hit rates, active generation jobs.
   - PM2 + custom monitor: auto-reload worst instance on thresholds (before it poisons nginx upstream).
   - Circuit breakers on LLM and heavy paths.

5. **Data & Caching Architecture**
   - World Yi / knowledge: normalized + graph-friendly model (not monolithic JSON blobs).
   - ISR + on-demand revalidation only for changed slugs; never full rebuilds on web tier.
   - Long-lived heavy pages served from CDN / static + client hydration for interactivity.

6. **Content Generation as First-Class Scalable System**
   - High-concurrency (designed for 50-100 parallel with the new CHAT_API) but with strict queuing, rate limits, cost/quality controls, and dedicated workers.
   - Quality > volume: multi-pass critique/revision using the "auto" model + stronger rubrics.

## 3. Phased Implementation (Immediate → Medium)

**Phase 0 (Now - Containment)**
- **Nginx routing invariant (2026-06-04)**: `lifekline_web_upstream` → **3000 only**; **3004** = cron (`:8080` + `/api/admin/*`) only. Never route public `/` or SEO to 3004.
- Watchdogs: `user-tier-watchdog` (3000), `public-surface-watchdog` (nginx 443 `/` + `/analyze`), `cron-tier-watchdog` (3004 for daemons).
- Targeted PM2 reload discipline + simple heap/lag monitor script (scripts/stability-monitor.js).
- Quick wins in Next: force-dynamic or no-store for heaviest knowledge/world-yi aggregation paths during bulk updates; reduce ISR revalidate where harmful.
- In content generation paths: add payload size guards + summarization before any cache or response.

**Phase 1 (This week - Isolation)**
- Add 1-2 dedicated `life-kline-content-worker` processes in ecosystem.config.js (fork, high memory allowance, no HTTP port).
- Route all heavy generation/promote/knowledge synthesis through them (update daemons + internal API calls).
- Web instances become pure "render + light API" tier.

**Phase 2 (Architecture)**
- Introduce explicit cache abstraction with size caps (wrap Next unstable_cache + custom LRU with maxSize).
- Refactor world-yi decision ledger / publication snapshots to be streamed or chunked.
- Add /internal/metrics endpoint (or PM2 keymetrics) exposing the critical signals.
- Enhance the new CHAT_API usage with a proper high-concurrency pool (p-limit + backpressure + retry with jitter, dedicated for World Yi elevation).

**Phase 3 (World Yi Elevation - Parallel Thread)**
- See dedicated sub-agent thread (spawned) for ontology, prompts, bulk gen plan using the provided high-capacity key.
- Target: qualitative leap in Yixue体系 + 应用专题 depth, actionability, and interconnection with core reports.

**v2 High-Concurrency Orchestration Implementation (2026-05-31)**
- Full production implementation landed in `scripts/high-concurrency-world-yi-generator.ts`:
  - Advanced limiter + circuit breaker + retry-with-full-jitter + token-bucket rate limit + adaptive backpressure.
  - v2 rubric gate (exact weights from world-yi-publication-program.json): LLM self-scores 7 dimensions, revision loop until pass (overall≥82, all dims≥65).
  - Queue: DB-reuse via `content_generation_jobs` + helpers in `lib/content-generation-jobs.ts` (enqueueWorldYiV2Task / claimNextWorldYiV2Task). Safe for multiple agents.
  - Direct integration: `saveManagedContentEntry` + full v2 meta (worldYiLayer, coreJudgmentPrimitives, qualityRubricScores, schedulePublishedAt etc.).
  - Worker mode (`--worker`), DRY_RUN, structured logging, heavy cache staging, payload guards.
- PM2: 2 dedicated content-workers configured (can add more). Stability monitor explicitly skips them.
- Scaling commands (see package.json):
  - Start: `npm run world-yi:gen:worker`
  - Test 8-12: `npm run world-yi:gen:test-8-12`
  - 30+: `npm run world-yi:gen:test-30` (then remove DRY_RUN)
  - Enqueue from agents: `npm run world-yi:gen:enqueue -- "易学v2新专题A|易学v2新专题B"`
  - Queue health: `npm run world-yi:gen:status`
- For 50-80+: Run 4-6 workers (forks), increase per-worker CONCURRENCY to 12-18, feed queue ahead of time. Monitor via stability + system:health.
- All heavy work off web instances — achieved.

## 4. Success Metrics
- Event loop p95 on web instances < 200ms even during active content campaigns.
- No more "maxSize" errors or swap pressure from Next processes.
- Health "content" service never shows > few hours since last publish.
- World Yi content volume + quality scores (internal rubric + user engagement + report lift) reach new tier.
- Can safely run 30-80 concurrent generations via the new API without destabilizing user experience.

## 5. Risks & Mitigations
- Over-isolation complexity → start with 1 worker, simple job table.
- 100-thread ambition on current hardware → design for elastic (queue depth, worker count auto-tune based on load), respect endpoint limits.
- Quality regression in bulk gen → mandatory critique loop + human review gates for flagship pieces.

This is the engineering north star. We execute incrementally but always with these principles.

## 6. Operator Runbook (Production Stability Hardening - 2026-05-31)

**Core Principle**: Heavy generation (World Yi v2, knowledge synthesis, growth promote, publication runs, agentic bulk, high-concurrency gen) **MUST NEVER** run on web instances (life-kline-next, life-kline-next-web*). Use dedicated `life-kline-content-worker-*` only.

### Quick Health & Metrics
```bash
npm run system:health                  # includes new process + caches sections (heap, pressure, worker flag)
pm2 logs life-kline-stability-monitor --lines 50
pm2 show life-kline-next-web1          # memory / uptime
pm2 show life-kline-content-worker-1
curl -H "x-system-health-token: $(grep -o 'HEALTH.*' .env.local 2>/dev/null || echo '')" http://127.0.0.1:3000/api/admin/system/health | python3 -c '
import sys, json; d=json.load(sys.stdin); 
p=d.get("snapshot",{}).get("process",{}); 
c=d.get("snapshot",{}).get("caches",{}); 
print("HEAP%:", p.get("heapPercent"), "RSS_MB:", p.get("rssMB"), "ContentWorker:", p.get("isContentWorker"));
print("Cache pressures:", c.get("pressure"));
'
```

### Reload / Self-Heal (manual)
```bash
# Targeted (least impact)
pm2 reload life-kline-next-web2 --update-env
# All web (use when lag >5s or heap>85%)
pm2 reload life-kline-next life-kline-next-web1 life-kline-next-web2 life-kline-next-web3 --update-env
# Full recovery (last resort)
pm2 restart life-kline-stability-monitor
```

### Running Heavy Work (Coordination with Content Agents)
ALWAYS route to content workers:
```bash
# Preferred: exec on worker context (larger heap, IS_CONTENT_WORKER=1 flag set)
pm2 start "node --import tsx scripts/high-concurrency-world-yi-generator.ts --lane=main --count=20 --concurrency=10" --name temp-wy-gen-1 --cwd /home/life-kline-next -i 0 --max-memory-restart 3500M --node-args="--max-old-space-size=3500 --expose-gc"

# Or update ecosystem + reload specific worker, then run script in that env (advanced)
pm2 reload life-kline-content-worker-1

# All standard growth / publication / knowledge scripts:
npm run growth:promote
npm run publication:world-yi:run
npm run autoresearch:...
# (These now benefit from DB light projections + app caches even if invoked from shell)
```

Monitor during run:
- stability-monitor should NOT reload workers (it filters web* only)
- Watch `npm run system:health` every 2min; content severity must recover < few hours publish lag.

### Cache / Memory Guard Verification
- In logs: look for BoundedSizeCache evictions or "pressure" in health.
- If "maxSize" still appears: set CONTENT_BULK_MODE=1 (env on web replicas) + reload web only.
- DB win: listManagedContentEntriesLight() used in scheduler/overview paths.

### Next.js / Page Tuning
- Heavy knowledge/world-yi hubs: respect CONTENT_BULK_MODE=1 → force-dynamic (avoids ISR cache bloat).
- ISR on /knowledge/[slug] safe at 1h for normal traffic.

### Rollback / Emergency
- Disable bounded caches: comment the .set calls (last resort, will reintroduce bloat).
- Reduce content workers to 0 in ecosystem + restart PM2.
- Revert web node_args if GC causes issues (rare).

**Verification after changes**:
```bash
npm run lint && npm run test -- --testPathPattern="content-ops|system-ops" --silent
npm run build 2>&1 | tail -20
pm2 startOrReload ecosystem.config.js --update-env
sleep 25 && npm run system:health
```

All fixes prioritize: (1) user-facing web stability, (2) zero data loss, (3) minimal code surface.
See also: CLAUDE.md §2.4 (PM2), §7 checklist, docs/OPERATIONS.md

