[根目录](../CLAUDE.md) > **app**

# app/ - Next.js 应用路由模块

> 模块职责：Next.js 15 App Router 页面与布局管理
> 最后更新：2026-02-24 22:18:52

---

## 变更记录 (Changelog)

### 2026-02-24
- ✅ 初始化模块文档
- ✅ 识别所有页面路由与布局

---

## 模块职责

`app/` 目录是 Next.js 15 App Router 的核心，负责：
- **页面路由**：基于文件系统的路由定义
- **布局管理**：全局与嵌套布局组件
- **元数据管理**：SEO 优化与社交分享
- **服务端渲染**：React Server Components
- **API 路由**：后端接口实现（见 `api/` 子模块）

---

## 入口与启动

### 根布局 (Root Layout)
**文件**：`layout.tsx`

```typescript
// 全局布局，包含 HTML 结构与字体加载
export default function RootLayout({ children })
```

**关键特性**：
- 设置 `lang="zh-CN"` 中文语言
- 加载 Google Fonts（Noto Serif SC + Inter）
- 全局样式：Tailwind CSS 基础类
- 元数据：SEO 标题与描述

### 全局样式
**文件**：`globals.css`
- Tailwind CSS 指令
- 自定义 CSS 变量
- 全局样式重置

---

## 对外接口（页面路由）

### 1. 首页 `/`
**文件**：`page.tsx`

**功能**：
- Hero Section：项目介绍与 CTA
- 信任信号展示：真太阳时、分钟级、五行生克、AI 赋能
- 命理表单：用户输入入口
- 功能模块展示：排盘、用神、AI 咨询
- Footer：导航与版权信息

**关键组件**：
- `<FortuneForm />` - 动态加载的命理表单
- `<FeatureCard />` - 功能卡片展示

**元数据**：
```typescript
title: '人生K线 | 权威八字命理分析引擎'
description: '基于天文历法与传统命理学，提供精准的命运轨迹与决策参考'
```

---

### 2. 命理排盘页 `/analyze`
**文件**：`analyze/page.tsx`

**功能**：
- 完整的命理分析表单
- 真太阳时计算与展示
- 城市选择器（全球城市支持）
- 提交后跳转到结果页

**数据流**：
```
用户输入 → POST /api/analyze → 生成报告 → 跳转 /result/[id]
```

---

### 3. 分析结果页 `/result/[id]`
**文件**：`result/[id]/page.tsx`

**功能**：
- 展示完整的命理分析报告
- 四柱排盘可视化
- 五行分析图表
- 十神配置展示
- 格局判断与解析
- 个性化建议（事业、财富、婚姻、健康）
- 数据支撑与名人案例

**数据获取**：
```typescript
// 服务端获取数据
const fortune = fortuneOperations.getById(params.id)
```

---

### 4. AI 咨询页 `/chat`
**文件**：`chat/page.tsx`

**功能**：
- AI 助手对话界面
- 持续对话上下文管理
- 命理知识问答
- 个性化建议生成

**API 调用**：
```
POST /api/chat
```

---

### 5. 日历择吉页 `/events`
**文件**：`events/page.tsx`

**功能**：
- 重要事件管理
- 吉日查询
- 事件提醒设置
- 命理分析关联

**组件**：
- `<EventCalendar />` - 日历视图
- `<ImportantEvents />` - 事件列表

---

### 6. 用户档案页 `/profile`
**文件**：`profile/page.tsx`

**功能**：
- 用户基本信息展示
- 命理档案管理
- 历史记录查看
- 偏好设置

**子路由**：
- `/profile/create` - 创建新档案

---

### 7. 历史记录页 `/history`
**文件**：`history/page.tsx`

**功能**：
- 查看所有历史分析记录
- 快速访问历史报告
- 删除或导出记录

---

## 关键依赖与配置

### 依赖项
```json
{
  "next": "^15.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

### Next.js 配置
**文件**：`../next.config.js`

```javascript
{
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: { remotePatterns: [...] },
  experimental: { optimizePackageImports: ['lucide-react'] }
}
```

### TypeScript 配置
**文件**：`../tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "jsx": "preserve",
    "paths": { "@/*": ["./*"] }
  }
}
```

---

## 数据模型

### 页面 Props 类型

```typescript
// 动态路由参数
type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

// 布局 Props
type LayoutProps = {
  children: React.ReactNode
}
```

---

## 测试与质量

### 当前状态
- ⚠️ 单元测试：未实现
- ⚠️ E2E 测试：未实现
- ✅ 手动测试：核心流程已验证

### 测试建议
1. **页面渲染测试**：验证所有页面正常渲染
2. **路由导航测试**：验证页面间跳转
3. **表单提交测试**：验证数据提交流程
4. **SEO 测试**：验证元数据正确性

---

## 常见问题 (FAQ)

### Q: 如何添加新页面？
A: 在 `app/` 下创建新目录，添加 `page.tsx` 文件。Next.js 会自动识别为路由。

### Q: 如何设置页面元数据？
A: 导出 `metadata` 对象或 `generateMetadata` 函数。

```typescript
export const metadata: Metadata = {
  title: '页面标题',
  description: '页面描述'
}
```

### Q: 服务端组件 vs 客户端组件？
A: 默认是服务端组件。需要使用 Hooks 或浏览器 API 时，添加 `'use client'` 指令。

### Q: 如何优化页面加载性能？
A:
- 使用动态导入 `next/dynamic`
- 启用图片优化 `next/image`
- 实现增量静态生成 ISR
- 使用 React Suspense

---

## 相关文件清单

```
app/
├── layout.tsx              # 根布局
├── page.tsx                # 首页
├── globals.css             # 全局样式
├── loading.tsx             # 全局加载状态
├── error.tsx               # 全局错误边界
├── sitemap.ts              # 站点地图生成
├── robots.ts               # robots.txt 生成
├── analyze/
│   └── page.tsx            # 命理排盘页
├── result/
│   └── [id]/
│       └── page.tsx        # 分析结果页
├── chat/
│   └── page.tsx            # AI 咨询页
├── events/
│   └── page.tsx            # 日历择吉页
├── profile/
│   ├── page.tsx            # 用户档案页
│   └── create/
│       └── page.tsx        # 创建档案页
├── history/
│   └── page.tsx            # 历史记录页
└── api/                    # API 路由（见 api/CLAUDE.md）
```

---

**下一步建议**：
1. 查看 [API 模块文档](./api/CLAUDE.md) 了解后端接口
2. 查看 [组件模块文档](../components/CLAUDE.md) 了解 UI 组件
3. 实现页面级单元测试
4. 优化 SEO 元数据
