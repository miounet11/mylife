[根目录](../CLAUDE.md) > **components**

# components

`components/` 是当前前端组件层，包含结果页、聊天、表单、后台与内容系统组件。

## 关键组件分组

### 测算与输入

- `fortune-form.tsx`
- `fortune-progress.tsx`

### 结果页

- `report-engine-panel.tsx`
- `report-event-capture.tsx`
- `report-premium-services.tsx`
- `report-subscription-panel.tsx`
- `next-step-guide.tsx`

### 聊天

- `ai-assistant-chat.tsx`
- `chat-markdown.tsx`

### 后台

- `admin-premium-service-console.tsx`
- `updates-status-panel.tsx`
- `updates-status-panel-with-query.tsx`

## 开发注意事项

- 聊天组件改动要同步检查 `app/api/chat/route.ts`
- 结果页组件改动要同步检查 `app/result/[id]/page.tsx` 与报告 schema
- 表单组件改动要同步检查 `app/api/analyze/route.ts`
- 展示监控或后台数据的组件不要自行造字段，先对齐后端聚合返回

## 当前重点

- 保持首页与分析入口的低干扰快速填写体验
- 保持结果页与主站视觉一致，不做孤立页面
- 聊天体验优先保证尾部滚动、Markdown 兼容、编辑/删除/重生成闭环
- 结果页优先保证内容密度、升级入口、事件沉淀和专项服务闭环

## 参考文档

- [README](../README.md)
- [系统架构](../docs/ARCHITECTURE.md)
- [开发指南](../docs/DEVELOPMENT.md)
