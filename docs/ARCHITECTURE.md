# Architecture

本文档只描述当前仓库已经落地并仍在使用的架构。

## 1. 总体架构

系统由四层组成：

1. 前台产品层  
   `app/*` 与 `components/*`
2. 业务与引擎层  
   `lib/*`
3. 数据与任务层  
   SQLite + PM2 daemon + cron route
4. 经营与监控层  
   管理后台、埋点、模型健康、接口健康、邮件队列

## 2. 前台产品层

### 主要页面

- `/`
- `/analyze`
- `/result/[id]`
- `/chat`
- `/events`
- `/history`
- `/profile`
- `/updates`
- `/knowledge`
- `/cases`
- `/insights`

### 管理页面

- `/admin/analytics`
- `/admin/content`
- `/admin/premium-services`

## 3. 报告生成架构

### 3.1 主入口

`app/api/analyze/route.ts`

职责：

- 校验输入
- 控制速率
- 处理流式进度
- 调用报告生成管线
- 落库
- 埋点
- 自动排入升级重算队列

### 3.2 报告生成管线

`lib/report-pipeline.ts`

链路：

1. `lib/fortune-engine.ts`
   - 生成四柱、五行、十神、格局、运势与基础建议
2. `lib/llm.ts`
   - 对结构草案与正文进行增强
3. `lib/agentic-report/*`
   - 并发运行多个专业 Agent
   - 生成职业、关系、健康、策略、时空上下文、人生 K 线等补强结果
4. `mergeLLMResult`
   - 合并引擎、LLM、Agent、天地人上下文与人生 K 线
5. `lib/report-quality.ts`
   - 给结果打质量分、等级与交付层级
6. `lib/report-version-lineage.ts`
   - 标记报告版本、引擎构建信息和升级来源

### 3.3 结果数据

结果会落到 `fortunes` 表，并在 `analysis` 字段中保存：

- `pipelineVersion`
- `engineBuilds`
- `reasoningMode`
- `qualityAudit`
- `agentResults`
- `contextSignals`
- `enhancementNotes`

## 4. 聊天架构

### 4.1 主入口

`app/api/chat/route.ts`

支持：

- 直接提问
- 编辑已发消息并重提
- 对回答重生成
- 删除消息
- 加载上下文

### 4.2 上下文构建

- `lib/chat-context.ts`
- `lib/chat-intent.ts`

输入：

- 当前报告
- 已保存事件
- 当前意图
- 选中的报告或事件

输出：

- 可供 LLM 使用的上下文摘要
- 适配 UI 的对话上下文信息

### 4.3 降级机制

当 LLM 不可用时：

- 聊天不会直接报错
- 会回退到规则化 fallback 回答
- 同时记录 `fallbackReason`、耗时、成功/失败埋点

## 5. 事件与验证闭环

### 事件系统

`app/api/events/route.ts`

支持：

- 创建事件
- 编辑事件
- 删除事件
- 从结果页沉淀事件
- 从聊天沉淀事件

### 验证闭环

`lib/report-feedback-loop.ts`

目标：

- 回收命理判断是否命中
- 标记偏差原因
- 形成后续纠偏与经营反馈

## 6. 邮件与订阅架构

### 邮件发送

- `mail.ts`
- `lib/email.ts`

### 邮件队列与重试

- `lib/email-delivery-jobs.ts`
- `app/api/admin/email/retry/cron/route.ts`
- `scripts/email-retry-daemon.js`

### 使用场景

- 邮箱验证码
- 订阅确认
- 专项服务回执
- 专项服务状态更新
- 报告升级提醒
- 月度更新

## 7. 升级重算与月度更新

### 升级重算

- `lib/report-upgrade-jobs.ts`
- `app/api/admin/report-upgrade/cron/route.ts`
- `scripts/report-upgrade-daemon.js`

### 月度更新

- `lib/report-monthly-digest.ts`
- `app/api/admin/report-monthly-digest/cron/route.ts`
- `scripts/report-monthly-digest-daemon.js`

## 8. 内容系统

### 内容类型

- knowledge
- cases
- insights

### 后台与自动化

- `lib/content-radar.ts`
- `lib/content-generation.ts`
- `lib/content-ops.ts`
- `scripts/content-radar-daemon.js`
- `scripts/content-scheduler-daemon.js`

### 文档

- [content-automation-system-v1.md](./content-automation-system-v1.md)
- [content-distribution-playbook-v1.md](./content-distribution-playbook-v1.md)
- [social-content-skill-stack-v1.md](./social-content-skill-stack-v1.md)

## 9. 监控与经营后台

### 埋点

- `lib/analytics.ts`
- `app/api/analytics/track/route.ts`

### 聚合

- `lib/database.ts`
- `lib/admin-analytics-insights.ts`

### 当前可观测内容

- 分析/报告/聊天/事件漏斗
- 推理模式与版本结构
- 模型健康、熔断与故障热点
- 接口健康、失败热点、降级比例
- 邮件投递与重试队列
- 验证积压与偏差原因
- 专项服务跟进状态

## 10. 数据存储

主要使用 SQLite。

核心表包括：

- `users`
- `fortunes`
- `events`
- `questions`
- `analytics_events`
- `content_entries`
- `content_signals`
- `report_upgrade_jobs`
- `report_monthly_digest_runs`
- `email_delivery_jobs`
- `premium_service_requests`

聚合与映射均集中在 `lib/database.ts`。
