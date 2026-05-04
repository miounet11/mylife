# Operations Guide

本文档描述当前仓库的部署、运行和运维方式。

## 1. 生产运行方式

生产环境使用 PM2 管理多个进程：

- `life-kline-next`
- `life-kline-radar`
- `life-kline-scheduler`
- `life-kline-report-upgrader`
- `life-kline-monthly-digest`
- `life-kline-user-lifecycle-email`
- `life-kline-email-retry`

配置文件：

- [ecosystem.config.js](../ecosystem.config.js)

## 2. 常用命令

### 构建

```bash
npm run build
```

### 本地启动生产包

```bash
npm run start
```

### PM2 重载

```bash
pm2 startOrReload ecosystem.config.js
```

默认会启动主应用和后台 worker。只有在排障时明确需要只跑主应用，才使用：

```bash
ENABLE_BACKGROUND_WORKERS=0 pm2 startOrReload ecosystem.config.js
```

### 查看状态

```bash
pm2 status
npm run knowledge:status
npm run system:health
npm run system:retro -- 1440 --save
npm run system:upgrade-compare -- --days=7 --save
npm run system:site-quality -- --save
npm run email:lifecycle
```

升级行为三窗口监控：

- `preUpgrade`: 基线日前一个窗口
- `initialPostUpgrade`: 基线日后的第一个窗口
- `current`: 当前最近一个窗口
- 对比重点：`pre -> initial` 看升级首波影响，`initial -> current` 看近期承接是否继续改善或回落
- 输出会先给 `Focus signals`，用于快速定位当前该先看主链路、承接链路、交付层级，还是商业化转化
- 每组 comparison 会按方向拆出 `Improving/Worsening metrics` 和 `Improving/Worsening rates`，方便先看改善项与恶化项，再决定是否细读完整 delta
- `fallbackRate` 以 `analyze_completed` 事件次数为分母，用来观察完成测算里的 fallback 占比，不再混用去重 session 口径
- `chat/tool/premium/report-event` 这类 `perReportViewRate` 是按事件次数计算的互动强度指标，可能超过 `100%`，不要按单次转化率解读
- `llmAttemptPerCompletedRate` / `llmCircuitChangePerCompletedRate` 也是按 `analyze_completed` 事件次数计算的事件强度指标，可能超过 `100%`；它们反映每次完成测算背后的模型重试与熔断抖动，不是用户转化率

站点质量治理快照：

- `npm run system:site-quality -- --save`
- 这个命令会把以下证据收成一份固定快照：
  - `analytics overview` 里的系统健康、周使用、近 14 天日趋势、最近 3 天 vs 前 3 天行为变化
  - `report retro` 的真实报告、fallback、页面埋点和活跃会话
  - `admin-quality-workboard` 的高优先级工具/内容/跳出页修复队列
  - `open-agent` 的 site governor / ops triage / report reliability 快照
- 目标不是做一份漂亮汇报，而是把兼容性、稳定性、交互逻辑、开发效率四个维度压成同一套固定评估器，方便按回合比较改动前后效果
- 快照文件默认写到 `data/runtime/site-quality-governor.snapshot.json`

### 查看日志

```bash
pm2 logs life-kline-next --lines 100 --nostream
pm2 logs life-kline-knowledge --lines 100 --nostream
pm2 logs life-kline-report-upgrader --lines 100 --nostream
pm2 logs life-kline-user-lifecycle-email --lines 100 --nostream
pm2 logs life-kline-email-retry --lines 100 --nostream
```

测算复盘快照：

```bash
npm run system:retro -- 1440 --save
npm run system:retro -- 10080 --save
```

最近窗口请求与故障：

```bash
npm run system:requests -- 60
```

知识采集健康接口：

```bash
curl -H "x-knowledge-cron-token: $KNOWLEDGE_ACQUISITION_CRON_TOKEN" \
  http://127.0.0.1:3000/api/admin/knowledge/sources/cron
```

知识运行快照接口：

```bash
curl -H "x-knowledge-cron-token: $KNOWLEDGE_ACQUISITION_CRON_TOKEN" \
  http://127.0.0.1:3000/api/admin/knowledge/health
```

经营总览聚合接口：

```bash
curl --cookie "your-admin-session" \
  http://127.0.0.1:3000/api/admin/analytics/overview
```

返回值已包含 `knowledgeOps`，可直接查看知识引擎发布队列、专题枢纽和采集运行状态。

统一系统健康接口：

```bash
curl -H "x-system-health-token: $SYSTEM_HEALTH_TOKEN" \
  http://127.0.0.1:3000/api/admin/system/health
```

如果未单独设置 `SYSTEM_HEALTH_TOKEN`，接口会回退接受知识/内容 cron token。

## 3. 发布流程

建议使用以下顺序：

```bash
git pull
npm install
npm run lint
npm run test
npm run system:site-quality -- --save
npm run build
pm2 startOrReload ecosystem.config.js
pm2 status
```

如果构建通过但页面异常，优先检查：

- `.env.local`
- PM2 环境变量
- Next.js 构建输出
- PM2 error log

## 4. 关键环境变量

### LLM

- `API_BASE_URL`
- `OPENAI_API_KEY`
- `API_KEY`
- `DEFAULT_MODEL`：默认 `grok-420-fast`
- `OPEN_AGENT_RUNTIME_MODEL`：默认 `grok-420-fast`
- `CONTENT_GENERATION_MODEL`：默认 `grok-420-fast`
- `MODEL_FALLBACK_CHAIN`：默认 `auto`
- `REPORT_MODEL_FALLBACK_CHAIN`：默认 `auto`
- `REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN`：默认 `auto`
- `CONTENT_GENERATION_MODEL_FALLBACK_CHAIN`：默认 `auto`

### 模型健康与熔断

- `LLM_HEALTH_WINDOW_MINUTES`
- `LLM_CIRCUIT_OPEN_MIN_ATTEMPTS`
- `LLM_CIRCUIT_OPEN_FAILURE_RATE`
- `LLM_CIRCUIT_DEGRADE_FAILURE_RATE`
- `LLM_CIRCUIT_RECOVER_FAILURE_RATE`
- `LLM_CIRCUIT_OPEN_CONSECUTIVE_FAILURES`
- `LLM_CIRCUIT_RECOVERY_SUCCESS_STREAK`
- `LLM_CIRCUIT_OPEN_COOLDOWN_MINUTES`

### 邮件

- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_SECURE`
- `MAIL_USER`
- `MAIL_PASS`
- `MAIL_FROM`
- `ADMIN_EMAILS`

### 内容系统

- `CONTENT_RADAR_CRON_TOKEN`
- `CONTENT_RADAR_RUN_URL`
- `CONTENT_RADAR_INTERVAL_MS`
- `CONTENT_RADAR_AUTO_GENERATE`
- `CONTENT_RADAR_AUTO_PUBLISH`
- `CONTENT_SCHEDULER_CRON_TOKEN`
- `CONTENT_SCHEDULER_RUN_URL`
- `CONTENT_SCHEDULER_INTERVAL_MS`
- `KNOWLEDGE_ACQUISITION_CRON_TOKEN`
- `KNOWLEDGE_ACQUISITION_RUN_URL`
- `KNOWLEDGE_ACQUISITION_INTERVAL_MS`
- `KNOWLEDGE_ACQUISITION_REQUEST_TIMEOUT_MS`
- `KNOWLEDGE_ACQUISITION_STARTUP_DELAY_MS`
- `KNOWLEDGE_ACQUISITION_RETRY_DELAY_MS`
- `KNOWLEDGE_ACQUISITION_LOCK_TTL_MS`
- `KNOWLEDGE_ACQUISITION_REFRESH_RADAR`
- `KNOWLEDGE_ACQUISITION_CORE_LIMIT`
- `KNOWLEDGE_ACQUISITION_MAX_DOMAINS_PER_RUN`
- `KNOWLEDGE_ACQUISITION_SIGNAL_MIN_SCORE`
- `KNOWLEDGE_ACQUISITION_SIGNAL_PROMOTION_LIMIT`
- `KNOWLEDGE_ACQUISITION_RADAR_LIMIT_PER_SOURCE`
- `KNOWLEDGE_ACQUISITION_FOCUS_DOMAINS`
- `KNOWLEDGE_SYNTHESIS_AUTO_PUBLISH`
- `KNOWLEDGE_SYNTHESIS_PUBLISH_THRESHOLD`
- `KNOWLEDGE_SYNTHESIS_ALLOWED_TYPES`
- `KNOWLEDGE_SYNTHESIS_PUBLISH_BATCH_SIZE`
- `SYSTEM_HEALTH_RUN_URL`
- `SYSTEM_HEALTH_TOKEN`
- `SYSTEM_HEALTH_REQUEST_TIMEOUT_MS`

当前默认建议：

- `KNOWLEDGE_SYNTHESIS_AUTO_PUBLISH=1`
- `KNOWLEDGE_SYNTHESIS_ALLOWED_TYPES=topic-overview,concept-glossary,book-path,book-ladder`
- `KNOWLEDGE_SYNTHESIS_PUBLISH_BATCH_SIZE=4`

### 报告升级与月度更新

- `REPORT_MONTHLY_DIGEST_CRON_TOKEN`
- `REPORT_MONTHLY_DIGEST_RUN_URL`
- `REPORT_MONTHLY_DIGEST_INTERVAL_MS`
- `USER_LIFECYCLE_EMAIL_CRON_TOKEN`
- `USER_LIFECYCLE_EMAIL_RUN_URL`
- `USER_LIFECYCLE_EMAIL_INTERVAL_MS`
- `USER_LIFECYCLE_EMAIL_BATCH_SIZE`
- `AUTONOMOUS_GROWTH_ENABLE_USER_LIFECYCLE_EMAIL`

- `REPORT_UPGRADE_CRON_TOKEN`
- `REPORT_UPGRADE_RUN_URL`
- `REPORT_UPGRADE_INTERVAL_MS`
- `REPORT_UPGRADE_BATCH_SIZE`
- `REPORT_MONTHLY_DIGEST_CRON_TOKEN`
- `REPORT_MONTHLY_DIGEST_RUN_URL`

### 邮件重试

- `EMAIL_RETRY_CRON_TOKEN`
- `EMAIL_RETRY_RUN_URL`
- `EMAIL_RETRY_INTERVAL_MS`
- `EMAIL_RETRY_BATCH_SIZE`
- `EMAIL_RETRY_MAX_ATTEMPTS`
- `EMAIL_RETRY_BASE_DELAY_MS`

## 5. 守护进程职责

### `life-kline-next`

- 主站服务
- 页面与 API
- 管理后台

### `life-kline-radar`

- 内容雷达扫描
- 热点内容信号采集

### `life-kline-scheduler`

- 内容草稿生成
- 发布排期执行

### `life-kline-knowledge`

- 知识核心源自动入库
- 高优先级领域 backlog 轮转执行
- 热点 signal 自动晋升为知识源文档
- 运行状态快照写入 `data/runtime/knowledge-acquisition.snapshot.json`
- 并发执行时自动拒绝重复 run，避免重入踩库
- 若进程异常退出导致锁残留，会在 `KNOWLEDGE_ACQUISITION_LOCK_TTL_MS` 后自动回收僵尸锁

### `life-kline-report-upgrader`

- 报告升级重算队列处理

### `life-kline-monthly-digest`

- 月度更新投递

### `life-kline-email-retry`

- 邮件失败重试

## 6. 线上排障顺序

### 用户说“测算太快/结果不对”

先看：

1. `/admin/analytics`
2. `npm run system:retro -- 1440 --save`
2. 模型健康与熔断
3. 当前故障热点
4. 接口健康
5. `pm2 logs life-kline-next`

重点判断：

- 是否 LLM 全部失败
- 是否测算成功但降级到引擎输出
- 是否升级重算队列积压
- 最近 24h 的真实报告名单是否足够，是否混入了测试样本
- 被真实用户查看的报告里，是否仍大量停留在 `basic`

### 用户说“聊天失效”

先看：

1. `/admin/analytics` 的接口健康与业务失败热点
2. `chat_completed` / `chat_failed` 埋点
3. `pm2 logs life-kline-next`

## 7. 报告复盘与升级

固定看这份文档：

- [report-retro-upgrade-playbook-v1.md](./report-retro-upgrade-playbook-v1.md)

固定执行这条命令：

```bash
npm run system:retro -- 1440 --save
```

用途：

- 提取最近窗口内的真实测算样本名单
- 区分真实样本和测试样本
- 判断 fallback、basic、llm 命中率
- 给下一轮升级和重算排优先级

### 用户说“邮箱没收到”

先看：

1. `/admin/analytics` 的邮件系统状态
2. `email_delivery_failed`
3. `email_retry_queue`
4. `pm2 logs life-kline-email-retry`

## 7. 管理后台当前重点看板

### `/admin/analytics`

重点区域：

- 系统状态总览
- 模型健康与熔断
- 当前故障热点
- 接口健康
- 业务失败热点
- 用户转化卡点
- 邮件系统状态
- 专项服务与用户跟进

## 8. 数据与备份

- SQLite 文件：`data/lifekline.db`
- 属于运行态数据
- 变更数据库结构时要兼容已有文件
- 正常代码提交不要把数据库文件一起提交

## 9. 当前已知主风险

截至当前版本，主风险不是页面渲染，而是：

1. LLM 供应链不稳定
2. 熔断恢复期间的降级交付质量
3. 结果页到专项服务、订阅、验证回收的转化偏低

这三类问题可以通过当前后台直接观测。
