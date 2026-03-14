[根目录](../CLAUDE.md) > **lib**

# lib

`lib/` 是当前仓库的核心业务层，所有重要逻辑都集中在这里。

## 核心模块

### 报告生成

- `fortune-engine.ts`
- `report-pipeline.ts`
- `llm.ts`
- `report-quality.ts`
- `report-version-lineage.ts`
- `report-reasoning-mode.ts`

### Agent 系统

- `agentic-report/*`

### 聊天与上下文

- `chat-context.ts`
- `chat-intent.ts`

### 数据与聚合

- `database.ts`
- `analytics.ts`
- `admin-analytics-insights.ts`

### 邮件与订阅

- `email.ts`
- `email-delivery-jobs.ts`
- `report-monthly-digest.ts`
- `subscription-backfill.ts`

### 报告闭环

- `report-feedback-loop.ts`
- `report-premium-services.ts`
- `report-upgrade-jobs.ts`

### 内容系统

- `content-generation.ts`
- `content-ops.ts`
- `content-radar.ts`
- `updates-summary.ts`

## 开发注意事项

- `database.ts` 是当前 SQLite 单一事实源，新增表/字段先做兼容处理
- 报告链路改动不要只改单点，至少联动看：
  - `report-pipeline.ts`
  - `llm.ts`
  - `agentic-report/*`
  - `user-types.ts`
  - `app/api/analyze/route.ts`
- 聊天逻辑改动至少联动看：
  - `chat-context.ts`
  - `chat-intent.ts`
  - `app/api/chat/route.ts`
  - `components/ai-assistant-chat.tsx`
- 任何需要运营判断的问题，优先补埋点，再补后台聚合

## 当前最重要的稳定性风险

1. 模型供应链失败率
2. 熔断恢复与降级交付
3. 报告升级队列与邮件重试队列是否积压

## 参考文档

- [系统架构](../docs/ARCHITECTURE.md)
- [开发指南](../docs/DEVELOPMENT.md)
- [运维指南](../docs/OPERATIONS.md)
