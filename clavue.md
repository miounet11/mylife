# clavue.md

This file provides guidance to Clavue (claude.ai/code) when working with code in this repository.

## Repository overview

- `life-kline-next` is the current production repository for `life-kline.com`.
- The app is built on Next.js 15 App Router, React 19, TypeScript, and SQLite.
- Core product capabilities span analysis/report generation, AI chat, event validation loops, premium-service flows, content publishing, and admin/health operations.
- `data/lifekline.db*` is runtime state, not normal source code. Treat database schema changes as compatibility-sensitive, and do not treat the DB files like ordinary edits.
- Repo guidance already exists in `README.md`, `AGENTS.md`, `CLAUDE.md`, and `docs/*`; keep this file focused on stable repo-wide commands and cross-cutting architecture.

## Common commands

### Core development

```bash
npm install
npm run dev
npm run dev:clean
npm run lint
npm run test
npm run test:watch
npm run test -- --runInBand tests/lib/report-pipeline.test.ts
npm run build
npm run start
```

- `npm run dev:clean` terminates stale Next processes on port 3000 before starting the dev server.
- `npm run build` runs `scripts/build-with-static-retention.js`, which does a clean Next build and then restores any missing static assets from the previous `.next/static` output.
- Jest is configured in `jest.config.js` with roots in `tests/` and `lib/`, so targeted runs should point at repo-relative test files.

### Useful ops and diagnostics

```bash
npm run knowledge:status
npm run system:health
npm run system:retro -- 1440 --save
npm run system:requests -- 60
npm run system:site-quality -- --save
pm2 startOrReload ecosystem.config.js
pm2 status
```

Use these when working on the knowledge pipeline, health monitoring, release verification, or PM2-managed workers.

## High-level architecture

### Product surface

- `app/` contains App Router pages plus API route handlers.
- `components/` contains user-facing UI, report/result surfaces, chat UI, admin panels, and content-system presentation components.
- `app/result/[id]/page.tsx` is a major integration surface: it pulls together report quality/version metadata, events, upgrade status, premium services, updates, validation, related content, and tool recommendations.

### Core business layer

- `lib/` is the main business layer.
- `lib/database.ts` is the SQLite single source of truth for persistence and many admin aggregations.
- `lib/env.ts` centralizes runtime flags, model/provider configuration, fallback chains, and worker-related configuration.
- Important subsystems in `lib/` include the deterministic fortune engine, LLM enhancement, agentic report generation, chat context/intent shaping, analytics, email delivery, report upgrades, lifecycle email, and content/knowledge automation.

### Analyze/report pipeline

The main report path is:

`app/api/analyze/route.ts`
→ request validation, rate limiting, optional progress streaming, and analytics
→ `lib/report-pipeline.ts`
→ deterministic base analysis from `lib/fortune-engine.ts`
→ LLM enhancement from `lib/llm.ts`
→ optional parallel specialist enrichment from `lib/agentic-report/*`
→ quality/version/reliability metadata
→ persistence in SQLite, analytics events, and upgrade queueing

This is the highest-impact pipeline in the repo. Changes here usually affect the API contract, stored report shape, result-page rendering, upgrade behavior, and observability.

### Chat pipeline

The main chat path is:

`app/api/chat/route.ts`
→ request validation and rate limiting
→ context assembly from `lib/chat-context.ts`
→ intent normalization/prompt shaping from `lib/chat-intent.ts`
→ model execution through provider-health and fallback logic
→ persistence of question/history state in SQLite

Chat is designed to degrade gracefully. If models are unavailable, the route falls back instead of hard failing, and records health/failure metadata.

### Content and operations pipeline

- Content/knowledge automation spans `lib/content-*.ts`, `lib/updates-summary.ts`, `app/api/admin/content/*`, `app/api/admin/knowledge/*`, and PM2-managed scripts in `scripts/`.
- Admin/health views depend on SQLite-backed aggregations in `lib/database.ts` and `lib/admin-analytics-insights.ts`.
- LLM reliability is not just prompt logic: `lib/llm-provider-health.ts`, fallback-chain helpers, and analytics events influence whether report/chat paths call live models or switch to conservative delivery.

### Persistence and background work

- SQLite in `data/lifekline.db` stores users, reports, events, questions, analytics, content-system records, job queues, premium-service requests, and tool sessions.
- Many admin APIs under `app/api/admin/*` are operational endpoints for health, cron-triggered jobs, content automation, report upgrades, and email retry flows rather than ordinary product APIs.
- Background work is split between route handlers, cron-style admin endpoints, and PM2-managed daemon scripts in `scripts/`.

## Operational architecture

Production uses PM2 with `ecosystem.config.js` to manage the main app plus worker families such as:

- main Next.js app
- content radar
- content generation
- content scheduler
- knowledge acquisition
- report upgrader
- user lifecycle email
- email retry

`docs/OPERATIONS.md` is the source of truth for operational commands, health endpoints, env vars, and troubleshooting order. If a change affects long-running jobs, cron tokens, email, or health reporting, verify both the route and the associated worker script.

## Change-impact guidance

### If you change the report chain

Check the full path, not just one file:

- `app/api/analyze/route.ts`
- `lib/report-pipeline.ts`
- `lib/llm.ts`
- `lib/agentic-report/*`
- `lib/user-types.ts`
- report quality/version fields
- `app/result/[id]/page.tsx` and result/report components

Report-chain edits commonly break consumers indirectly through missing fields, changed delivery tiers, provider-health gating, or altered analytics/upgrade behavior.

### If you change chat

Check the full chat loop:

- `app/api/chat/route.ts`
- `components/ai-assistant-chat.tsx`
- `components/chat-markdown.tsx`
- `lib/chat-context.ts`
- `lib/chat-intent.ts`
- `lib/llm-provider-health.ts`

At minimum, verify ask, edit/resubmit, regenerate, delete, Markdown rendering, and fallback behavior.

### If you change analytics, admin, or operations surfaces

- `trackServerEvent` usage matters for feature observability.
- Admin dashboards and health summaries depend on SQLite-backed aggregations in `lib/database.ts` and `lib/admin-analytics-insights.ts`.
- Schema changes should be made with existing local databases in mind.
- Worker-facing route changes should be checked against `ecosystem.config.js`, related `scripts/*.js`, and the relevant admin cron endpoint.

## Testing and verification notes

- Standard verification for code changes is `npm run lint`, `npm run test`, and `npm run build`, with deeper manual checks for report-chain, chat, database, email, content automation, and admin changes.
- For targeted Jest runs, invoke a specific file, e.g. `npm run test -- --runInBand tests/lib/report-pipeline.test.ts`.
- Existing tests cover core lib modules and selected route handlers under `tests/lib/*` and `tests/app/api/*`.
- Build behavior is intentionally permissive in `next.config.js` (`ignoreBuildErrors` and `ignoreDuringBuilds` are enabled), so passing `npm run build` does not replace targeted reading and testing.
