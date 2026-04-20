# World Yi Autonomous Runtime

## Goal

This runtime replaces scattered daemon-style CLI loops with one single autonomous control path.

The target is not “run more scripts”.
The target is:

1. automatically discover new demand and hot signals
2. automatically expand knowledge, case, and insight inventory
3. automatically schedule draft replenishment and publication
4. automatically monitor content quality and conversion gaps
5. automatically keep report delivery and follow-up channels improving

## New Control Plane

Primary control route:

- `POST /api/admin/system/autonomous/cron`

Manual admin route:

- `GET /api/admin/system/autonomous`
- `POST /api/admin/system/autonomous`

Recommended deployment mode:

- one external scheduler
- one token
- one route
- internal orchestration decides what should run, what should skip, and what should retry

This avoids keeping multiple CLI daemons alive just to poll internal APIs.

## Internal Phase Order

Every autonomous cycle runs in this order:

1. knowledge acquisition
   - refresh knowledge sources
   - extend synthesis inputs
   - preserve lock protection to avoid overlapping runs
2. OpenAgent content analysis
   - reads runtime evidence, decision ledger, cycle ledger, policy state
   - produces lane contracts, queue overrides, blocked-pattern suppression hints, and bounded policy signals
   - feeds the next generation plan instead of acting only as a tail-end reviewer
3. content scheduler
   - replenish draft reserve if needed
   - force weak-lane replenishment even when total draft reserve is still above floor
   - publish only inside allowed windows
   - refresh radar if stale
4. OpenAgent report reliability review
   - refreshes report feedback loop + report retro snapshot
   - reviews recent real reports, verify verdicts, reliability guard outcomes, and viewed basic-tier samples
   - in `full` mode, auto-executes OpenAgent priority actions by queueing upgrade / recompute targets and targeted feedback sync before the upgrade batch runs
5. report upgrade batch
   - consumes the auto-queued priority reports from the reliability review and continues improving already-generated user reports
6. monthly digest
   - optional, env controlled
   - sends report-driven follow-up touches
7. email retry
   - optional, env controlled
   - clears failed delivery backlog
8. OpenAgent autonomy review
   - optional, env controlled
   - reads the real runtime files and returns the highest-value automation upgrades
9. OpenAgent ops triage
   - optional, env controlled
   - reads current runtime evidence and returns structured alerts, policy diffs, and recommended actions for the admin panel and the next control decision

## Monitoring Surfaces

The runtime snapshot exposes five monitoring layers:

1. publication mechanism
   - lane coverage
   - queue reserve
   - next publish slots
   - weakest growth metrics
2. content ops
   - generation queue
   - publish candidates
   - radar performance
   - scheduler readiness
   - latest candidate decision ledger summary
3. quality workboard
   - top content fixes
   - top tool fixes
   - bounce-risk pages
4. runtime state
   - knowledge lock and snapshot
   - digest enabled state
   - email retry enabled state
5. OpenAgent review state
   - latest content analysis snapshot
   - latest report reliability snapshot
   - latest ops triage snapshot
   - latest review snapshot
   - structured backlog items
   - backlog focus keys for lane reserve / publish quality gate / decision ledger
   - persisted autonomy policy override derived from backlog focus
   - recent autonomous cycle ledger

## Quality Gates

The runtime is not allowed to blindly expand content volume.

Quality is controlled through:

- publication readiness checks before public publish
- multi-factor publish gate combining structure, lane gap, source credibility, and historical conversion
- scheduler publish windows and daily caps
- report reliability guard and quality audit
- admin quality workboard priority queues
- post-publication analytics-driven reprioritization

The rule is:

- if quality is weak, fix first
- if reserve is low, generate first
- if publish window is open and a strong draft exists, publish
- if one lane is under-covered, fill that lane before broad expansion
- if OpenAgent backlog is emphasizing lane reserve or publish quality, scheduler weights must change in the same cycle

Current implementation detail:

- OpenAgent review writes backlog items
- backlog items derive a persisted `autonomy policy override`
- scheduler and publish gate read that policy before ranking, generating, or publishing
- scheduler validation/live runs persist candidate-level `publish / hold / revise / blocked` evidence into `data/runtime/world-yi-content-decision-ledger.json`
- OpenAgent content analysis persists a structured planning snapshot into `data/runtime/world-yi-open-agent-content-analysis.snapshot.json`
- report feedback loop refresh writes back linked-event validation and correction insights into recent reports before reliability review
- report retro runtime snapshot persists into `data/runtime/report-retro.snapshot.json`
- OpenAgent report reliability review persists a structured runtime review snapshot into `data/runtime/world-yi-open-agent-report-reliability.snapshot.json`
- OpenAgent ops triage persists a structured runtime triage snapshot into `data/runtime/world-yi-open-agent-ops-triage.snapshot.json`
- active `policySignals` from the latest OpenAgent content analysis are auto-applied as a bounded runtime overlay on top of the persisted autonomy policy
- active `blockedPatterns` now support machine-executable field/glob matching such as `source:knowledge-synthesis:*:book-path` and are enforced in both generation queue filtering and draft prefiltering
- autonomous snapshot now exposes latest blocked reasons, held candidates, revise candidates, and publish rationale
- generation queue can now be front-loaded by OpenAgent lane contracts and queue overrides before automation runs
- OpenAgent prompt phases (`analyze`, `report-reliability`, `triage`, `validate`, `review`) now auto-retry transient transport / 429 / 5xx failures before falling back to the last successful snapshot

## Environment

Primary env vars:

```bash
AUTONOMOUS_GROWTH_CRON_TOKEN=replace_me
AUTONOMOUS_GROWTH_INTERVAL_MINUTES=15
AUTONOMOUS_GROWTH_ENABLE_MONTHLY_DIGEST=1
AUTONOMOUS_GROWTH_ENABLE_EMAIL_RETRY=1
```

Fallback behavior:

- if `AUTONOMOUS_GROWTH_CRON_TOKEN` is absent, the runtime falls back to existing scheduler/report tokens
- this keeps rollout simple in existing deployments

## Scheduler Setup

Recommended schedule:

- every 15 minutes call `POST /api/admin/system/autonomous/cron`

Recommended headers:

```text
x-autonomous-growth-cron-token: $AUTONOMOUS_GROWTH_CRON_TOKEN
```

Recommended deployment options:

- Vercel Cron
- Cloud Scheduler
- GitHub Actions scheduled request
- any hosted HTTP scheduler

Do not keep local daemon CLI processes as the primary production control path.

Validation mode:

- manual route accepts `POST /api/admin/system/autonomous` with body `{"mode":"validation"}`
- cron route accepts `POST /api/admin/system/autonomous/cron?mode=validation`
- validation mode skips heavy phases and returns scheduler preview + policy state for smoke checks

## OpenAgent SDK Mode

Reference:

- `https://github.com/codeany-ai/open-agent-sdk-typescript`

Why it fits:

- OpenAI-compatible model routing
- scheduled task hooks
- persistent session / memory patterns
- in-process agent orchestration without depending on terminal loops

Current responsibility split in OpenAgent mode:

1. planner agent
   - reorders lane priorities from snapshot signals
2. generation agent
   - expands draft candidates and补稿
3. quality agent
   - reviews weak content, tool gaps, and bounce issues
4. release agent
   - decides publish vs hold vs revise

Machine-actionable output contract for content analysis:

- `blockedPatterns`: use `field:glob` when possible, for example `source:knowledge-synthesis:*:book-path`, `key:diaspora-*`, `title:*书目阶梯*`
- `policySignals`: use bounded `key=value` assignments only, for example `publishGate.minScore=210`, `queueWeights.perLaneQuota=3`

Recommended env mapping:

```bash
OPEN_AGENT_RUNTIME_ENABLED=1
OPEN_AGENT_RUNTIME_MODEL=gpt-5.4
OPEN_AGENT_RUNTIME_MAX_RETRIES=2
OPEN_AGENT_RUNTIME_RETRY_DELAY_MS=1500
CONTENT_GENERATION_MODEL=grok-420-fast
API_BASE_URL=https://your-openai-compatible-endpoint/v1
OPENAI_API_KEY=your_key
```

Use OpenAgent as the in-process orchestration layer.
Keep this repository’s internal routes, scheduler rules, and quality gates as the operational backbone.

Validation commands:

```bash
npm run open-agent:prepare
npm run open-agent:analyze
npm run open-agent:report-reliability
npm run open-agent:triage
npm run open-agent:validate
npm run open-agent:review
```

Validation standard:

- `open-agent:validate` must finish 3 real rounds against the configured OpenAI-compatible LLM
- every round must actually read repository files through tools, not answer from guesswork
- `open-agent:report-reliability` must refresh the report retro snapshot and return non-empty structured alerts, priority reports, or actions for the current real-report pool, or cleanly reuse the last successful reliability snapshot after retries
- `open-agent:triage` must return non-empty structured alerts, actions, or policy diffs for the current runtime, or cleanly reuse the last successful triage snapshot after retries
- `open-agent:review` must return a non-empty autonomy review result for the current runtime
- successful review runs should persist structured backlog items for the next cycle
- persisted backlog must directly influence generation ordering, publish gating, and cycle ledger focus keys

## Upgrade Path

Phase 1 is now done:

- single autonomous control route exists
- autonomous snapshot exists
- existing loops are internally orchestrated
- docs are aligned to HTTP-triggered automation instead of daemon-first operation

Next recommended upgrades:

1. expose the autonomous snapshot in the admin automation panel
2. make weak-lane fixes self-prioritizing from quality workboard + publication mechanism
3. let OpenAgent suggestions read candidate decision ledger and focus on unresolved runtime bottlenecks instead of repeating already-finished infrastructure tasks
4. let OpenAgent suggestions feed scheduler weights and publish thresholds automatically after review quality checks

## Source Links

- `program.md`
- `lib/world-yi-autonomous-engine.ts`
- `app/api/admin/system/autonomous/route.ts`
- `app/api/admin/system/autonomous/cron/route.ts`
- `https://github.com/codeany-ai/open-agent-sdk-typescript`
