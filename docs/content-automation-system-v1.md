# 内容自动化系统 V1

## 目标

建立一条可闭环的内容增长链路：

1. 采集用户在内容页上的真实偏好。
2. 根据点击、阅读、就近测算转化和当前内容覆盖度，识别缺口。
3. 自动生成下一轮优先内容。
4. 对达到质量阈值的内容自动发布，其余进入草稿库继续人工校对。

## 当前已上线能力

### 1. 内容行为埋点

已新增以下内容运营埋点：

- `knowledge_page_viewed`
- `knowledge_article_viewed`
- `cases_page_viewed`
- `case_article_viewed`
- `insights_page_viewed`
- `insight_article_viewed`
- `content_card_clicked`
- `content_quick_analyze_started`

这些事件会带上 `surfaceKey`、`contentType`、`slug`、`title`、`category`、`tags` 等信息。

### 2. 内容自动化分析

后台会基于最近 30 天的内容行为和当前内容库，输出：

- 高转化内容入口
- 主题覆盖缺口
- 下一轮优先扩张主题
- 自动发布候选草稿

### 3. 自动生成 / 自动发布

后台提供两种执行方式：

- 自动生成草稿
- 自动生成并发布

自动发布只会通过质量阈值的内容：

- LLM 实际成功返回
- 摘要、SEO 标题、SEO 描述完整
- 标签数足够
- sections 数量足够
- 每个 section 至少有 2 段正文

未达标内容会自动落回草稿状态。

## 当前主题簇

系统内置的内容扩张簇包括：

- 真太阳时与时间精度
- 报告解读与结果阅读
- 职业窗口与换岗节奏
- 关系推进与婚恋节奏
- 财富选择与风险控制
- 城市迁移与地理位置
- 行业周期与产业节奏
- 升学高考与教育选择
- 健康压力与身心平衡
- 组织变化与公司节奏

后续可以继续加入：

- 流年节点
- 国运与行业周期联动
- 地理 / 气候 / 时空参数
- 特定职业群体专题

## 运营建议

### 1. 内容节奏

- 每周至少执行 1 次自动生成草稿
- 每周至少执行 1 次自动发布
- 每周复盘一次高转化入口和低覆盖主题

### 2. 质量控制

- 自动发布优先用于知识型和洞察型内容
- 案例内容建议保留人工复核
- 同一主题连续自动发布不超过 2 篇，避免站点语义重复

### 3. 下一步升级

- 接入外部热点信号源，形成“站内行为 + 外部爆点”双引擎
- 把搜索词库、内链策略和 sitemap 优先级纳入自动化评分
- 增加内容更新而非只新增的自动化机制
- 让结果页和聊天页反推新的选题簇

---

## High-Concurrency World Yi v2 Orchestration & Scaling Runbook (v2 elevation)

**Goal**: Safely run 50-100 concurrent World Yi v2 content threads using dedicated `life-kline-content-worker-*` processes + the CHAT_API (ttqq.inping.com/v1) while keeping all user web instances (3000-3003) stable (<200ms p95, no maxSize explosions).

### Architecture
- **Queue**: DB-backed via `content_generation_jobs` table (special `meta.isWorldYiV2HighConc=true` + `worldYiV2`).
  - Submit from any agent/script: `enqueueWorldYiV2Task({tasks: [{topic, lane}], lane})` (see lib/content-generation-jobs.ts).
  - Workers claim via `claimNextWorldYiV2Task()` (atomic, stale-lock recovery, misroute protection).
  - Alternative (future extreme scale): file queue under `data/runtime/world-yi-v2-queue/`.
- **Generator/Orchestrator**: `scripts/high-concurrency-world-yi-generator.ts`
  - Features: CircuitBreaker (4 fails → 90s backoff), retry + full jitter, token-bucket rate limit (~25rps), adaptive concurrency limiter (backpressure on <65% success), v2 rubric self-scoring + revision loop (exact 7-dim weights + 82/65 gate from publication-program.json), full content-store v2 meta + `schedulePublishedAt`, DRY_RUN, structured logging, heavy cache staging via BoundedSizeCache, payload guards.
  - Modes: `--worker` (PM2 long-running queue poll + fallback seeds), `--enqueue`, ad-hoc `--count=N --concurrency=C`.
- **Workers**: PM2 `life-kline-content-worker-1/2` (ecosystem.config.js). High mem allowance, no HTTP. Multiple can run in parallel safely sharing queue.
- **Stability**: `scripts/stability-monitor.js` only reloads `life-kline-next-web*`. Content workers are expected to be "heavy".
- **Integration**: After successful gate-pass persist, entry has `schedulePublishedAt` + rich v2 interconnection meta → picked by content-scheduler / growth lanes / publication mechanism. Can manually promote via existing `growth:*` and `publication:world-yi:*` flows.

### Quick Commands (English)
```bash
# 1. Dry-run test 8-12 threads (zero cost)
npm run world-yi:gen:test-8-12

# 2. Real 12-concurrency worker (recommended start)
npm run world-yi:gen:worker
# (or manually: DRY_RUN=0 node --import tsx scripts/high-concurrency-world-yi-generator.ts --worker --lane=main --concurrency=12)

# 3. Submit tasks from any agent / CLI (multi-agent safe)
npm run world-yi:gen:enqueue -- "易学v2核心决策原语|海外华人易学资本配置v2|AI时代易学范式"

# 4. Queue health
npm run world-yi:gen:status

# 5. Scale tests (dry first)
npm run world-yi:gen:test-30          # 30 pieces @ conc=14

# For 50-80+:
# - Increase workers in ecosystem (add worker-3/4 with different lanes)
# - Per-worker: CONTENT_GEN_CONCURRENCY=14-18
# - Feed queue ahead: multiple enqueue calls or backlog script
# - Watch: pm2 logs life-kline-content-worker-1 --lines 100
# - Health: npm run system:health | grep -i content
```

**Scaling ladder (start conservative on hardware)**:
- 8-12 concurrent: 1 worker, default settings (safe baseline)
- 25-35: 2 workers + conc=12-14 each + queue pre-fill
- 50-65: 3-4 workers, conc=14-16, raise rate limits if provider allows
- 80-100: 5-6 workers or multi-host, strong queue backlog, monitor circuit trips & quality pass rate. Use `DRY_RUN=1` first.

**Quality enforcement**: Every piece goes through draft → rubric LLM audit → revision (if needed) → re-audit. Only >=82 overall + no dim<65 get `featured` + published status immediately. Others saved as draft for human review.

**DRY_RUN safety**: Set `DRY_RUN=1` (or use the :dry npm script). No CHAT_API cost, no DB writes (except queue when enqueueing), full simulation of scoring + logging.

**Monitoring & Self-healing**:
- PM2 + stability-monitor for web tier.
- Generator emits structured `[metric]` logs (success rate, circuit state, queue depth, avg quality).
- Use `npm run system:health` + content scheduler views.
- On circuit open: generator backs off automatically.

**Integration with existing daemons**:
- Content-scheduler / knowledge-publication / growth-promote continue to work unchanged.
- High-conc generator now the preferred path for bulk v2 World Yi elevation (bypasses main LLM fallback chains).
- All heavy work (including future visual asset gen) should be dispatched to content-workers.

**Production checklist before 50+**:
1. 24h dry-run at target concurrency with real topic volume.
2. Verify quality pass rate >70% on v2 rubric.
3. Confirm web instances stay <70% heap / <180ms p95 via stability-monitor during run.
4. Pre-populate 100-200 queue items.
5. Have rollback (mark failed jobs, manual content purge).

This completes the Phase 1-3 isolation + high-concurrency goals of the stability plan for the v2 elevation campaign.

(Added 2026-05-31 as part of High-Concurrency Orchestration & Scaling Engineer mission)
