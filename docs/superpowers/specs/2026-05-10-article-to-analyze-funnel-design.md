# 文章 → 测算转化漏斗 - A 阶段设计文档

**日期**：2026-05-10
**作者**：AI Master
**状态**：待审

---

## 背景

近 30 天 SEO 漏斗的数据真相：

| 事件 | 30 天计数 |
|---|---|
| `knowledge_article_viewed` | 124 |
| `content_card_clicked` | 30 |
| `content_quick_analyze_started` | 5 |
| **文章 → 测算转化率** | **0.024 (2.4%)** |

5 次转化全集中在 5 个 world-yi 主题文章。已发布 290 条文章里 270 条 30 天 0 曝光（死稿）。

文章本身内容 OK（前 8 条头部有持续流量），缺的是**用户读完文章直接进测算的入口**。当前文章页只在底部有一个静态 CTA，且无埋点反馈用户读到哪一步。

## 目标

把 `knowledge_article_viewed → content_quick_analyze_started` 转化率从 **2.4%** 提到 **8%+**，同时补全 scrollDepth/timeOnPage 埋点为后续阶段做基础。

## 成功标准（按优先级）

1. **核心**：A 阶段上线后 14 天内，文章页 quick_analyze 转化率
   - 保守目标 ≥ 6%
   - 拉伸目标 ≥ 10%
2. **观测**：scrollDepth 埋点 ≥ 95% 文章浏览记录有数据
3. **质量**：测算成功率不下降（避免引来 abort 流量影响 LLM 链路）
4. **副作用**：bounce rate（看一篇就走）下降 ≥ 5pp

## 不在范围

- B 阶段：文末个性化 CTA（独立 spec）
- C 阶段：主题预填深路径（独立 spec）
- 死稿下架 / 内容质量改造（GSC 反向选题的事）
- 注册/付费转化（属于另一漏斗）

## 三阶段总体路线

| 阶段 | 内容 | 时间 | 状态 |
|---|---|---|---|
| **A**（本 spec） | 加推荐位 + 补埋点 | 1-2 天 | **当前** |
| B | 文末个性化 CTA（按文章主题动态生成提问） | 3-5 天 | 待 A 14 天数据后启动 |
| C | 主题预填深路径（文章 → 预填测算 → 关联报告） | 5-7 天 | 待 B 完成后启动 |

---

## 架构

### 组件层

```
文章页 (knowledge / case / insight 三套路由)
  ├─ <ArticleScrollTracker />     滚动+session 埋点（全文章页挂载）
  ├─ <ArticleInlineCTA />         文中插入卡（第 3 个 section 后）
  └─ <ArticleStickyCTA />         移动底部 sticky / 桌面右下浮动
       ↓ 点击
       /analyze?from=knowledge_article:{slug}&surface=inline-card
       （已有路径，无改动）
```

### 数据流

```
1. 进入页面 → knowledge_article_viewed (existing)
2. 滚动 25/50/75/100% → article_scroll_depth (new)
3. inline CTA 入视口 → article_cta_impressed (new)
                    ⇒ Sticky CTA 淡出 200ms
4. 点击 inline → article_cta_clicked + content_quick_analyze_started + 跳 /analyze
5. 滚到 100% 仍未点 → Sticky CTA 重新淡入（最后机会）
6. 离开页面 → article_session_end (new)
   meta: { timeOnPage_ms, maxDepth, ctaImpressed, ctaClicked }
```

### 组件职责

| 组件 | 职责 | 依赖 |
|---|---|---|
| `<ArticleInlineCTA>` | 纯展示 UI + 点击埋点；按 `surfaceKey` prop 跳转 | 无 |
| `<ArticleStickyCTA>` | sticky 显示状态机；IntersectionObserver 监听 inline CTA | inline CTA 的 DOM ref |
| `<ArticleScrollTracker>` | scroll_depth 节流上报；beforeunload + visibilitychange 双路径上报 session_end | 无 |

### 文件结构

```
components/article/
├── article-inline-cta.tsx          NEW
├── article-sticky-cta.tsx          NEW
└── article-scroll-tracker.tsx      NEW

app/knowledge/[slug]/page.tsx       MOD  挂载 3 组件
app/cases/[slug]/page.tsx           MOD
app/insights/[type]/[slug]/page.tsx MOD

lib/article-cta.ts                  NEW  插入位置算法 + 文案配置
lib/seo/article-funnel.ts           NEW  反向 funnel 分析脚本

tests/lib/article-cta.test.ts       NEW
tests/lib/article-funnel.test.ts    NEW
```

---

## 关键实现细节

### 1. 插入位置算法（`lib/article-cta.ts:findInjectionPoint`）

- 输入：`ManagedContentEntry.sections` 数组（项目内 content_entries 表 sections 字段，schema 已定）
- 主路径：返回索引 2（即第 3 个 section 后），渲染时 inline CTA 插在 sections[2] 之后
- 边界：
  - `sections.length < 4` → 返回 -1，不插中间卡，仅显示 sticky
  - sections 总文本字符数 < 800 → 返回 -1，仅显示 sticky
  - 任意 section 含 `meta.inlineCtaSuppressed === true` 时跳过整个 inline 渲染（人工 override 用）
- 输出：单值 `{ injectAfterIndex: number }`

### 2. Sticky CTA 显示逻辑

状态机：

```
hidden → visible    (滚动 ≥ 200px)
visible → fading-out (inline CTA 进入视口)
fading-out → visible (滚到 100% 时，inline 已离开视口)
```

- 移动端（≤ 768px）：底部 fixed bar，高度 56px
- 桌面端：右下浮动卡片，260×88px
- 关闭按钮：本会话不再出现（sessionStorage 标记，不持久化）

### 3. 埋点节流

- `scroll_depth` 用 Set 记录已发的里程碑（25/50/75/100），每个只发一次
- `session_end` 在 `beforeunload` + `visibilitychange='hidden'` 双路径上报（避免移动端切后台丢失）
- `timeOnPage` 用 `performance.now()` 减页面初始化时间（抗系统时间漂移）

### 4. 文案配置

```ts
// lib/article-cta.ts
export const ARTICLE_CTA_COPY = {
  knowledge: {
    inline: {
      headline: '你是不是也这样？',
      subline: '30 秒拿到属于你的判断',
      button: '现在测一下',
    },
    sticky: { headline: '想知道你自己的版本？', button: '开始测算' },
  },
  case: {
    inline: {
      headline: '你的命局是这种结构吗？',
      subline: '30 秒看你的真实版本',
      button: '看我的判断',
    },
    sticky: { headline: '看你自己的命局判断', button: '现在开始' },
  },
  insight: {
    inline: {
      headline: '这个洞察对你成立吗？',
      subline: '30 秒检验一下你自己',
      button: '验证一下',
    },
    sticky: { headline: '检验是否对你成立', button: '开始测算' },
  },
};
```

### 5. Feature Flag

- 环境变量：`NEXT_PUBLIC_ARTICLE_CTA_V1`（默认 `0`）
- 灰度开关：上线 reload，出问题 5 秒回滚
- A 阶段验收 14 天后改为默认 `1`

### 6. BOT 数据隔离

复用 v5-A8 的 `BOT_PRED`（默认表单 1990-01-01 12:00 北京）：
- 客户端组件不做过滤（避免业务逻辑泄漏）
- `lib/seo/article-funnel.ts` 读 analytics_events 时套 BOT_PRED 过滤

---

## 测试策略

| 测试 | 类型 | 验证 |
|---|---|---|
| `article-cta.test.ts` | 单元 | findInjectionPoint 在不同 sections 数下的行为；ARTICLE_CTA_COPY 完整性 |
| `article-funnel.test.ts` | 单元 | 给定 mock events 计算 view→impressed→clicked→started 转化率正确 |
| 手工测试 | E2E | 移动 / 桌面在 3 类内容页 CTA 显隐时机；BOT_PRED 不污染 funnel |

**不写的测试**：

- IntersectionObserver/scroll 行为（jsdom 限制 + 太脆）— 由手工测试和生产 funnel 数据兜底
- React 组件快照（项目无此惯例）

---

## 验收和回滚

### 验收（A 阶段）

A 阶段灰度上线 + reload 后：

1. 跑 `npm run lint && npm run test && npm run build`
2. 手工跑 `/knowledge/world-yi-methodology` 页面：移动 + 桌面，验证 sticky/inline 显隐
3. 触发一次完整 view → cta_impressed → cta_clicked → analyze_submitted 流程，确认埋点全到位
4. 14 天后跑 `npm run seo:article-funnel`：观察转化率是否达标 6%

### 回滚

```bash
pm2 set life-kline-next:NEXT_PUBLIC_ARTICLE_CTA_V1 0
pm2 reload life-kline-next
```

---

## 风险

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| sticky CTA 在移动端覆盖关键内容 | 中 | 用户体验下降 | 关闭按钮 + sessionStorage 记忆 |
| 埋点上报失败导致 funnel 数据稀疏 | 低 | 分析失准 | 双路径上报 + 容错 |
| 文章 < 800 字仍弹中间卡显得突兀 | 中 | bounce rate 上升 | sections < 4 / 字数 < 800 不插 |
| 灰度开关意外失效 | 低 | 全量上线无兜底 | feature flag 默认 0；上线前手动 grep 验证 |

---

## 后续阶段（仅记录，不在本 spec 范围）

### B 阶段：文末个性化 CTA（待 A 14 天数据后启动）

- 文末按文章主题动态生成 3 个提问按钮（如《奇门决策地图》→「应先守还是进」「是否切赛道」「出去或回来」）
- 点中带预设问题进测算
- 需要：基于文章 tags 的提问模板系统 + 报告 prompt 接受 `contextHint`

### C 阶段：主题预填深路径（待 B 完成后启动）

- 测算表单按文章主题预填倾向（如 wealth-rhythm 文章 → 表单默认勾选「财富节奏」）
- 测算结果与文章关联（profile 页可看「源自《xxx》文章的测算」）
- 需要：测算路径接受 `topic` 参数 + 报告生成考虑主题倾向 + profile 页关联展示
