# Development Guide

本文档面向当前仓库开发，不描述已经废弃的旧项目结构。

## 1. 本地环境

### 安装

```bash
npm install
```

### 启动

```bash
npm run dev
```

### 检查

```bash
npm run lint
npm run test
npm run build
```

## 2. 代码结构

### `app/`

- 页面入口
- API 路由
- 管理后台页面

### `components/`

- 页面组件
- 报告组件
- 聊天组件
- 管理台组件

### `lib/`

- 数据库
- 命理引擎
- LLM 与 Agent 管线
- 邮件
- 内容系统
- 报告质量与升级重算
- 埋点与监控聚合

### `scripts/`

- PM2 守护进程入口

### `tests/`

- Jest 单元测试

## 3. 开发约定

### 页面与接口

- 用户界面逻辑尽量放在对应页面附近
- 复用逻辑移入 `lib/`
- 需要后台观测的功能，开发时同步补埋点

### 数据层

- 统一通过 `lib/database.ts` 管理 SQLite 结构与读写
- 新增表或字段时，必须考虑老库兼容
- `data/lifekline.db` 是运行状态，不作为普通改动提交

### 报告链路

涉及以下文件时，视为同一条主链：

- `app/api/analyze/route.ts`
- `lib/report-pipeline.ts`
- `lib/llm.ts`
- `lib/agentic-report/*`
- `lib/report-quality.ts`
- `lib/report-version-lineage.ts`

修改其中任意一段，至少要确认：

- API 返回未破坏
- 结果页能读取
- 报告质量字段未缺失
- 埋点仍然可用

### 聊天链路

涉及以下文件时，需要整体考虑：

- `app/api/chat/route.ts`
- `components/ai-assistant-chat.tsx`
- `components/chat-markdown.tsx`
- `lib/chat-context.ts`
- `lib/chat-intent.ts`

至少确认：

- 提问
- 编辑重提
- 重生成
- 删除
- Markdown 渲染
- 埋点与失败回退

## 4. 新功能开发清单

新增功能时，建议至少覆盖以下项目：

1. 页面或接口本身
2. SQLite 数据结构
3. 埋点事件
4. 管理后台可观测性
5. 测试
6. 文档

## 5. 埋点要求

需要记录的典型信息：

- 成功/失败
- 耗时
- 是否降级
- 用户触发动作
- 关键对象 ID
- 当前意图或场景

当前埋点集中在：

- `lib/analytics.ts`
- `app/api/analytics/track/route.ts`

## 6. 测试建议

### 至少执行

```bash
npm run lint
npm run build
```

### 推荐补测

```bash
npm run test
```

### 高风险改动

以下改动建议本地跑完整测试并做人工验证：

- 报告生成链路
- 聊天交互链路
- 邮件发送链路
- 数据库结构变更
- 管理后台聚合逻辑

## 7. 提交流程

推荐流程：

```bash
git status
npm run lint
npm run build
git add -A
git commit -m "feat(scope): message"
git push origin main
```

## 8. 文档维护要求

以下情况必须同步更新文档：

- 页面结构变更
- API 主链变更
- 报告生成逻辑变更
- 新增守护进程或 cron route
- 新增后台监控指标
- 删除旧功能或替换旧文档

当前有效主文档：

- [README.md](../README.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [OPERATIONS.md](./OPERATIONS.md)
