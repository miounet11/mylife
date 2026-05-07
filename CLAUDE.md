# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 项目：life-kline-next（人生K线图，命理 SaaS 主仓库）
> 框架：Next.js 15 App Router + React 19 + TypeScript + better-sqlite3
> 生产入口：https://www.life-kline.com，PM2 多进程托管

---

## 1. 常用命令

### 开发与质量

```bash
npm install                # 同步 package-lock.json；postinstall 会准备 open-agent SDK
npm run dev                # Next.js 本地开发服（默认 3000 端口）
npm run dev:clean          # 清掉 .next 缓存后再启（卡住时用）
npm run lint               # next lint，全仓 eslint
npm run test               # 一次性跑 Jest
npm run test:watch         # 监听模式
npm run build              # 调用 scripts/build-with-static-retention.js（保留 .next/static 防止旧页面 404）
npm run start              # 生产模式（需要 build 产物）
```

### 跑单个测试

测试根目录是 `tests/` 与 `lib/`，匹配 `**/__tests__/**/*.test.ts` 与 `**/tests/**/*.test.ts`。

```bash
npx jest tests/lib/chat-context.test.ts                    # 单文件
npx jest -t "should handle fallback"                        # 按用例名
npx jest --testPathPattern report-                          # 按路径模式
```

注意：`jest.config.js` 把 `diagnostics: false`，TS 类型错误不会让测试失败，只看运行时断言。

### 质量门禁脚本（QA）

`package.json` 里以 `qa:*` 开头的脚本是上线前的硬性 gate：

```bash
npm run qa:tools-runtime              # 校验 tools 目录工具运行时一致
npm run qa:public-surfaces            # 校验公共界面 labels / heroes / world-yi / 产品组件
npm run qa:admin-surfaces             # 校验后台产品组件
npm run qa:public-surface-labels      # 单独校验文案
npm run qa:public-surface-heroes      # 单独校验首屏
```

加新页面或 hero 时基本一定会触发其中一个，按报错信息回去补 manifest/component 注册。

### 系统健康与运营观测

```bash
npm run system:health                                # /api/admin/system/health 快照
npm run system:requests                              # 最近请求窗口
npm run system:retro -- 1440 --save                  # 24h 报告复盘，落盘到 data/runtime
npm run system:upgrade-compare -- --days=7 --save    # 升级行为三窗口对比（pre / initialPost / current）
npm run system:site-quality -- --save                # 站点质量治理快照（兼容/稳定/交互/效率四维）
npm run system:report-eval                           # 报告需求评估
npm run knowledge:status                             # 知识获取状态
npm run growth:status / wave2:status / global:status # 公共增长三波次状态
npm run email:lifecycle                              # 触发用户生命周期邮件循环
```

`system:upgrade-compare` 输出按 `Focus signals → Improving / Worsening` 排版，不要把 `perReportViewRate`、`llmAttemptPerCompletedRate` 当作转化率读，它们以事件次数为分母可超过 100%。

### 内容系统脚本

`growth:*` / `autoresearch:*` / `publication:*` / `visual:*` 是内容生成、晋升、视觉资产生产的全套子命令，详见 `package.json` 与 `docs/content-automation-system-v1.md`。

### PM2

```bash
pm2 startOrReload ecosystem.config.js                # 启动主应用 + 全部后台 worker
ENABLE_BACKGROUND_WORKERS=0 pm2 startOrReload ...    # 仅主应用，排障用
pm2 status / pm2 logs life-kline-next
```

参见 `docs/OPERATIONS.md`。

---

## 2. 架构总览（Big Picture）

### 2.1 报告生成主链（牵一发而动全身）

下面这条链是产品的核心，改动其中任何一个文件都要把整条链当作同一组件考虑：

```
app/api/analyze/route.ts
   └── lib/report-pipeline.ts
         ├── lib/fortune-engine.ts        # 四柱/五行/十神/格局/运势/基础建议（确定性）
         ├── lib/llm.ts                   # 结构化与正文增强
         ├── lib/agentic-report/*         # 并发多 Agent：职业、关系、健康、策略、时空、人生K线
         ├── mergeLLMResult               # 合并 engine + LLM + agent + 上下文
         ├── lib/report-quality.ts        # 质量分 / 等级 / 交付层级
         └── lib/report-version-lineage.ts # 版本、引擎构建、升级来源
```

落盘到 `fortunes` 表的 `analysis` JSON 字段（含 `pipelineVersion`）。`analyze` 路由还负责速率控制、流式进度、埋点、自动入升级重算队列。当前主报告版本是 `v3`。

### 2.2 LLM 模型与熔断

- 模型 fallback 链由环境变量驱动：`DEFAULT_MODEL` → `MODEL_FALLBACK_CHAIN`（生产链：`grok-420-fast → gpt-5.2 → auto`）。
- `lib/llm-provider-configs.ts` 管理 provider（image/article 两种用途），`lib/llm-provider-health.ts` 维护健康窗口（默认 30min）。
- 熔断阈值由 `LLM_CIRCUIT_*` 系列环境变量控制：连续失败 4 次或失败率 70% 触发 OPEN，恢复需要连续 2 次成功，冷却 8-9 分钟。
- 报告链使用独立的 `REPORT_MODEL_FALLBACK_CHAIN` / `REPORT_NARRATIVE_MODEL_FALLBACK_CHAIN`，与内容生成 `CONTENT_GENERATION_MODEL_FALLBACK_CHAIN` 隔离。

### 2.3 数据访问分层

- `lib/database.ts`（约 24 万字符）是 SQLite 单例 + schema + 所有低层读写的入口，新增表/字段都从这里加，且必须保留对老库的兼容。
- `lib/repositories/`（base / user / fortune / event）封装了仓储模式，新业务读写优先放这里。
- `lib/services/`（fortune-analyzer.service.ts / pillar-calculator.service.ts + analyzers/ generators/）是业务服务层。
- `lib/content-store.ts`、`lib/content-ops.ts`、`lib/knowledge-base-store.ts` 是内容/知识系统的状态机。

### 2.4 PM2 多进程架构

`ecosystem.config.js` 定义 7 个进程，`life-kline-next` 是主应用，其余都是后台 daemon：

| 进程 | 脚本 | 职责 |
|---|---|---|
| life-kline-next | `next start` | 主应用 |
| life-kline-radar | `scripts/content-radar-daemon.js` | 抓热点 |
| life-kline-scheduler | `scripts/content-scheduler-daemon.js` | 内容自动排期 |
| life-kline-report-upgrader | `scripts/report-upgrade-daemon.js` | 老报告升级重算 |
| life-kline-monthly-digest | `scripts/report-monthly-digest-daemon.js` | 月度更新 |
| life-kline-user-lifecycle-email | `scripts/user-lifecycle-email-daemon.js` | 生命周期邮件 |
| life-kline-email-retry | `scripts/email-retry-daemon.js` | 邮件重试队列 |

每个 daemon 通过 `*_CRON_TOKEN` 调用主应用的 `/api/admin/.../cron` 端点，token 在 `ecosystem.config.js` 里硬编码（生产环境中需要重新生成）。

### 2.5 安全 middleware

`middleware.ts` 注入 CSP / HSTS / X-Frame-Options 等头部，`matcher` 排除了 `/api`、`/_next`、`*.*` 静态资源。修改 CSP 时注意 `script-src` 已放开 `unsafe-eval` 与 `unsafe-inline`（GTM 需要）。

### 2.6 内容与运营闭环

```
内容雷达 (content-radar) → 调度器 (content-scheduler) → 内容生成 (content-generation)
   → 前台落地 (knowledge/cases/insights/world-yi) → 转化埋点 → 后台漏斗 (admin/analytics)
```

`world-yi` 是知识体系子产品（见 `docs/world-yi-*`），`growth:*`、`autoresearch:*`、`publication:*` 三套脚本驱动其发布流。

---

## 3. 关键约定

### 3.1 路径别名

`tsconfig.json` 设了 `@/* → ./*`，跨目录 import 一律用 `@/lib/...` 而不是相对路径。Jest 也按此映射。

### 3.2 命名

- 组件文件 `kebab-case.tsx`；React 组件名 `PascalCase`；函数/变量 `camelCase`。
- API 路由按 Next.js 约定 `app/api/.../route.ts`。
- 类型集中在 `lib/user-types.ts` 与各 `*.types.ts` / `lib/services/types.ts`。

### 3.3 客户端 vs 服务端

- Server Component 是默认；用了 hook / 浏览器 API 才标 `'use client'`。
- 包含 SQLite 调用的模块只能在服务端运行；`server-only` 包已在依赖里。

### 3.4 数据库迁移

- 不要写独立 migration 文件，schema 演进逻辑都写在 `lib/database.ts` 的初始化路径里，自动检测列是否存在再 ALTER。
- `data/lifekline.db*` 是本地运行态，不进 git（`.gitignore` 已忽略）。
- 仓库里 `fix-*.js`（fix-db.js、fix-analysis-db.js 等）是历史一次性修复脚本，新问题不要往里加，写新的临时脚本或在 `database.ts` 初始化里处理。

### 3.5 测试

- 30+ 个测试集中在 `tests/lib/`，主要覆盖 `lib/` 下的纯逻辑模块（chat-context、report-v2、knowledge-*、content-ops、rate-limit、profile-page 等）。
- `ts-jest` 关闭了类型诊断，所以测试只验证运行时行为；类型问题靠 `npm run lint` 和 IDE 兜底。
- 加新测试时按 `tests/lib/<模块名>.test.ts` 放置即可被自动发现。

---

## 4. 环境变量

`.env.example` 列出全部生产用变量，主要分组：

- **Auth / Email**：`AUTH_SHOW_CODE`、`ADMIN_EMAILS`、`MAIL_SMTP_*`、`MAIL_FROM*`、`RESEND_API_KEY`（fallback）
- **LLM 主链**：`DEFAULT_MODEL`、`MODEL_FALLBACK_CHAIN`、`API_BASE_URL`、`OPENAI_API_KEY`
- **LLM 熔断**：`LLM_HEALTH_WINDOW_MINUTES`、`LLM_CIRCUIT_*`
- **视觉资产**：`VISUAL_ASSET_API_BASE_URL`、`VISUAL_ASSET_DEFAULT_MODEL`（gpt-image-2）、`VISUAL_ASSET_*_MODEL`
- **内容系统**：`CONTENT_RADAR_*`、`CONTENT_SCHEDULER_*`、`CONTENT_GENERATION_*`、`KNOWLEDGE_ACQUISITION_*`、`KNOWLEDGE_SYNTHESIS_*`
- **GA**：`NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`、`GA4_API_SECRET`
- **公网入口**：`NEXT_PUBLIC_APP_URL`

本地用 `.env.local`（不进 git），生产由 `ecosystem.config.js` 的 `env` 块直接注入。

---

## 5. 模块索引

| 路径 | 内容 | 进一步文档 |
|---|---|---|
| `app/` | 页面与 API 路由（含 admin、world-yi、tools、knowledge、cases、insights、updates、profile） | `app/CLAUDE.md` |
| `app/api/` | 后端 API（admin、analytics、analyze、auth、chat、events、enhancements、fortune、history、journey、newsletter、premium-services、profile、reminders、report-journey、runtime、tools、updates） | `app/api/CLAUDE.md` |
| `components/` | UI 组件，`components/report/` 是报告专用，`components/ui/` 是基础 primitive | `components/CLAUDE.md` |
| `lib/` | 业务核心；136+ 文件 | `lib/CLAUDE.md` |
| `lib/repositories/` | 仓储模式（base / user / fortune / event） | - |
| `lib/services/` | 服务层（fortune-analyzer、pillar-calculator + analyzers/ generators/） | - |
| `lib/agentic-report/` | 并发 Agent 报告链 | - |
| `scripts/` | PM2 daemon 与一次性 CLI（npm scripts 大多指向这里） | - |
| `tests/lib/` | Jest 测试 | - |
| `data/` | SQLite + runtime 状态（git 忽略） | - |
| `docs/` | 当前有效产品/架构/运营文档（`ARCHITECTURE.md` / `DEVELOPMENT.md` / `OPERATIONS.md` 是真源） | - |

---

## 6. 协作文件优先级

仓库里有多份协作指令：

- `AGENTS.md` — 简洁版仓库指南（结构、命令、风格、测试、提交）
- `CLAUDE.md` — 本文，给 Claude Code 看
- `clavue.md` / `bbc.md` / `jiancha.md` / `CODEX_REPORT_RETRO.md` — 历史 / 其他 Agent 的临时笔记

冲突时以 `docs/` 下的正式文档为准；`README.md` 是入口；本文是扎实的开发上下文索引。

---

## 7. 修改前的快速 checklist

1. 是否动到报告主链（§2.1）？动了的话同步检查 fortune-engine / llm / agentic-report / report-pipeline / quality / lineage。
2. 是否新加表/列？去 `lib/database.ts` 初始化路径加兼容逻辑，**不要**新建独立 migration。
3. 是否动到公开界面或后台组件？跑 `npm run qa:public-surfaces` 与 `npm run qa:admin-surfaces`。
4. 是否动到 LLM 调用？检查 fallback 链与熔断配置是否需要同步。
5. 是否动到环境变量？同步更新 `.env.example` 和 `ecosystem.config.js`。
6. 提交前：`npm run lint && npm run test && npm run build`。
