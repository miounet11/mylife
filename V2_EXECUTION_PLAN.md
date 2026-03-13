# 人生K线 V2 执行计划

## 1. 执行目标

本计划用于把 [V2_PRD.md](/home/life-kline-next/V2_PRD.md) 直接转成开发行动。

原则：

- 先做底层闭环，再做重体验升级
- 先做可复用能力，再做页面扩张
- 每个阶段都必须可上线、可验证、可复盘

## 2. 执行分期

### Phase 0：基础设施与一致性底座

目标：

- 固化结果 schema
- 增加版本标识
- 建立分析埋点
- 建立经营概览

任务：

1. 为 `fortunes` 增加 `report_version`
2. 建立 `analytics_events` 表
3. 新增 `analyticsOperations`
4. 新增 `lib/analytics.ts`
5. 在关键链路接入埋点：
   - analyze
   - auth request-code
   - auth verify
   - newsletter subscribe
   - chat
   - events
   - result page view
6. 新增 `/api/admin/analytics/overview`
7. 新增 `/admin/analytics`

交付文件：

- [lib/database.ts](/home/life-kline-next/lib/database.ts)
- [lib/user-types.ts](/home/life-kline-next/lib/user-types.ts)
- [lib/analytics.ts](/home/life-kline-next/lib/analytics.ts)
- [app/api/admin/analytics/overview/route.ts](/home/life-kline-next/app/api/admin/analytics/overview/route.ts)
- [app/admin/analytics/page.tsx](/home/life-kline-next/app/admin/analytics/page.tsx)

### Phase 1：结果页 V2

目标：

- 让结果页成为世界级核心页

任务：

1. 增加场景视图切换
2. 增加月度窗口模块
3. 增加可信度模块
4. 增加时辰敏感度模块
5. 增加行动面板
6. 增加订阅承接模块

主要文件：

- [components/trust-report.tsx](/home/life-kline-next/components/trust-report.tsx)
- [app/result/[id]/page.tsx](/home/life-kline-next/app/result/[id]/page.tsx)

### Phase 2：AI 与事件闭环

目标：

- 把结果转成长期使用

任务：

1. Chat 带入报告上下文
2. AI 输出推荐追问
3. AI 结论转事件 / 提醒
4. 事件应验反馈
5. 提醒偏好管理

主要文件：

- [app/api/chat/route.ts](/home/life-kline-next/app/api/chat/route.ts)
- [app/api/events/route.ts](/home/life-kline-next/app/api/events/route.ts)
- [app/events/page.tsx](/home/life-kline-next/app/events/page.tsx)

### Phase 3：增长与经营

目标：

- 建立增长飞轮与经营后台

任务：

1. 邮件链路升级
2. 内容推荐升级
3. 经营后台扩展
4. 转化漏斗与内容表现

## 3. 本轮直接执行范围

本轮直接执行 Phase 0，不等待。

### 3.1 立即落地项

- `report_version`
- `analytics_events`
- `server analytics helper`
- `admin analytics overview`
- `result page view tracking`

### 3.2 暂不在本轮落地项

- 月度窗口
- 时辰敏感度
- Chat 上下文化
- 提醒系统深度升级

## 4. 首批埋点事件定义

- `analyze_submitted`
- `report_generated`
- `report_viewed`
- `auth_code_requested`
- `auth_verified`
- `newsletter_subscribed`
- `chat_message_sent`
- `event_created`
- `event_updated`
- `event_deleted`

## 5. 首版经营后台卡片

- 累计分析数
- 近 7 日分析数
- 公开报告数
- 聊天消息数
- 活跃订阅数
- 事件记录数
- 埋点事件总数
- 最近 7 日关键行为分布

## 6. 开发顺序

1. 数据库 schema 扩展
2. 类型更新
3. analytics helper
4. API 链路接入埋点
5. 管理后台概览
6. 测试、构建、发布

## 7. 风险控制

- 所有新增字段必须向后兼容
- 所有埋点失败不能阻塞主业务
- 所有管理页面必须管理员权限保护
- 结果页浏览埋点需要轻量，不影响加载

## 8. 本轮完成定义

满足以下条件即视为本轮完成：

- 新生成报告自动写入 `report_version`
- 关键行为可写入 `analytics_events`
- 管理员可在后台看到概览数据
- 测试、lint、类型检查、构建通过
- PM2 发布成功
