[根目录](../CLAUDE.md) > **app**

# app

`app/` 是当前 Next.js 15 App Router 入口层，负责页面、管理后台与 API 路由。

## 当前主要页面

- `/`
- `/analyze`
- `/result/[id]`
- `/chat`
- `/events`
- `/history`
- `/profile`
- `/profile/create`
- `/updates`
- `/knowledge`
- `/cases`
- `/insights`
- `/login`
- `/admin/analytics`
- `/admin/content`
- `/admin/premium-services`

## 当前主要 API

- `/api/analyze`
- `/api/chat`
- `/api/events`
- `/api/history`
- `/api/newsletter`
- `/api/premium-services`
- `/api/fortune/[id]`
- `/api/profile/[id]`
- `/api/auth/request-code`
- `/api/auth/verify`
- `/api/auth/session`
- `/api/analytics/track`
- `/api/updates/summary`
- `/api/admin/analytics/overview`
- `/api/admin/content/*`
- `/api/admin/email/*`
- `/api/admin/report-upgrade/cron`
- `/api/admin/report-monthly-digest/cron`
- `/api/admin/report-feedback-sync`
- `/api/admin/premium-services`

## 开发注意事项

- 用户主链路优先看：`/` -> `/analyze` -> `/result/[id]` -> `/chat` / `/events`
- 结果页、聊天页、事件页的改动通常需要同步检查埋点和后台监控
- 修改 API 时，优先确认是否需要补 `trackServerEvent`
- 管理后台页面变更时，通常要同步看 `lib/database.ts` 聚合是否匹配

## 高风险文件

- `app/api/analyze/route.ts`
- `app/api/chat/route.ts`
- `app/result/[id]/page.tsx`
- `app/admin/analytics/page.tsx`

## 参考文档

- [README](../README.md)
- [系统架构](../docs/ARCHITECTURE.md)
- [开发指南](../docs/DEVELOPMENT.md)
- [运维指南](../docs/OPERATIONS.md)
