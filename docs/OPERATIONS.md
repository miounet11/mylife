# Operations Guide

本文档描述当前仓库的部署、运行和运维方式。

## 1. 生产运行方式

生产环境使用 PM2 管理多个进程：

- `life-kline-next`
- `life-kline-radar`
- `life-kline-scheduler`
- `life-kline-report-upgrader`
- `life-kline-monthly-digest`
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

### 查看状态

```bash
pm2 status
```

### 查看日志

```bash
pm2 logs life-kline-next --lines 100 --nostream
pm2 logs life-kline-report-upgrader --lines 100 --nostream
pm2 logs life-kline-email-retry --lines 100 --nostream
```

## 3. 发布流程

建议使用以下顺序：

```bash
git pull
npm install
npm run lint
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
- `DEFAULT_MODEL`
- `MODEL_FALLBACK_CHAIN`

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

### 报告升级与月度更新

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
2. 模型健康与熔断
3. 当前故障热点
4. 接口健康
5. `pm2 logs life-kline-next`

重点判断：

- 是否 LLM 全部失败
- 是否测算成功但降级到引擎输出
- 是否升级重算队列积压

### 用户说“聊天失效”

先看：

1. `/admin/analytics` 的接口健康与业务失败热点
2. `chat_completed` / `chat_failed` 埋点
3. `pm2 logs life-kline-next`

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
