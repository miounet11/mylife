# life-kline-next

`life-kline-next` 是 `life-kline.com` 当前生产仓库。

这是一个基于 Next.js 15 App Router、TypeScript 和 SQLite 的命理产品平台，当前已经包含以下主链能力：

- 首页与分析页一体化快速测算入口
- 版本化结果页与可升级重算报告
- 命理引擎 + LLM 增强 + 并发 Agent 报告链路
- 聊天、事件沉淀、验证闭环、月度更新
- 邮箱验证码、订阅与专项服务闭环
- 内容系统、内容雷达、自动排期发布
- 经营后台、模型健康监控、接口健康监控、邮件重试队列

## 当前状态

- 运行框架：Next.js 15 + React 19 + TypeScript
- 数据存储：SQLite（`data/lifekline.db`）
- 进程管理：PM2
- 生产入口：`https://www.life-kline.com`
- 当前默认模型链：`grok-420-fast -> gpt-5.2 -> auto`
- 当前主报告版本：`v3`

## 核心页面

- `/`：首页，包含品牌内容与测算入口
- `/analyze`：完整测算页
- `/result/[id]`：结果页、报告引擎展示、升级重算、专项服务入口
- `/chat`：对话、编辑、删除、重生成、事件导入
- `/events`：事件管理与验证闭环
- `/history`：报告历史
- `/profile`：用户档案
- `/updates`：版本更新与订阅价值传达
- `/knowledge`、`/cases`、`/insights`：内容体系
- `/admin/analytics`：经营后台与健康监控
- `/admin/content`：内容后台
- `/admin/premium-services`：专项服务后台

## 核心能力概览

### 报告链路

1. `fortune-engine` 生成确定性命理底座
2. `lib/llm.ts` 负责结构化与正文增强
3. `lib/agentic-report/*` 并发运行多 Agent
4. `lib/report-pipeline.ts` 合并结果并写入版本信息、质量审计、上下文信号
5. `app/api/analyze/route.ts` 落库、埋点、升级排队、返回结果

### 用户闭环

1. 用户提交测算
2. 生成报告并进入结果页
3. 进入聊天或沉淀事件
4. 回填事件验证结果
5. 进入月度更新、邮件订阅、专项服务或升级重算

### 运营闭环

1. 内容雷达抓取热点
2. 内容调度器生成/发布内容
3. 前台内容触发测算入口与转化埋点
4. 后台统一查看漏斗、模型状态、接口健康、邮件投递与用户跟进

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

### 质量检查

```bash
npm run lint
npm run test
npm run build
```

### 生产运行

```bash
npm run build
npm run start
```

如果使用 PM2，请参考 [docs/OPERATIONS.md](./docs/OPERATIONS.md)。

## 目录结构

```text
app/          页面与 API 路由
components/   前端组件
lib/          核心业务逻辑、数据库、引擎、服务
data/         SQLite 本地数据
scripts/      守护进程脚本
tests/        Jest 测试
docs/         当前有效项目文档
```

## 当前有效文档

- [docs/README.md](./docs/README.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)
- [docs/OPERATIONS.md](./docs/OPERATIONS.md)
- [docs/content-automation-system-v1.md](./docs/content-automation-system-v1.md)
- [docs/content-distribution-playbook-v1.md](./docs/content-distribution-playbook-v1.md)
- [docs/social-content-skill-stack-v1.md](./docs/social-content-skill-stack-v1.md)
- [docs/v2-report-quality-subscription-strategy.md](./docs/v2-report-quality-subscription-strategy.md)
- [CHANGELOG.md](./CHANGELOG.md)

## 注意事项

- `data/lifekline.db*` 属于本地运行状态，不应作为常规代码改动提交。
- 环境变量请放到 `.env.local`，不要提交凭据。
- 当前仓库里 `AGENTS.md`、`CLAUDE.md` 属于协作指令文件，不属于产品说明文档。
