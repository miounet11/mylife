# 前端重设计：人生 K 线 · 决策台版（v4）

> 状态：design 已确认，进入实施
> 日期：2026-05-07
> 范围：设计语言层 + 品牌锚 + 组件库收束 + 信息架构 + 关键页面重构
> 节奏：原地一次到位，分 5 个 phase 落地，每 phase 可独立部署

---

## 1. 决策摘要

| 维度 | 决定 |
|---|---|
| 气质 | 金融决策台（Bloomberg × 滴天髓） |
| 服务用户 | 决策型专业者 / 含量高知识工作者 / 人生十字路口高端用户（三者并重） |
| 主色系 | 保留墨绿 `#127d6f` + 米色底；新增信号金 `#c9a14a`、强化警示赤、冷蓝 |
| 上线方式 | 原地重构，feature flag 不引入；分 phase commit |
| 字体 | Inter + PingFang（中文）+ JetBrains Mono（数字/干支）+ Source Han Serif（关键字） |
| 圆角 | 紧缩到 ≤ 8px（决策台不要圆胖） |
| 投影 | 仅两层（card / pop），删除当前 16px+ 肿胀阴影 |
| 报告深读模式 | 保留（terminal mode，仅作用于报告主区） |

---

## 2. 设计语言层

### 2.1 色彩 token

```css
:root {
  /* 底层：纸感 */
  --bg:                #f5f7f2;
  --bg-elevated:       #fbfcf8;
  --bg-sunken:         #eef1eb;
  --paper:             #ffffff;

  /* 墨色 9 阶 */
  --ink-1:             #0a120e;        /* 大标题、关键数字 */
  --ink-2:             #16211d;        /* 正文 */
  --ink-3:             #3a4a44;        /* 副标题 */
  --ink-4:             #66746c;        /* 说明文字 */
  --ink-5:             #8b9690;        /* 占位、辅助标签 */
  --ink-6:             #b3bcb6;        /* 禁用 */
  --hairline:          rgba(22, 33, 29, 0.08);
  --hairline-strong:   rgba(22, 33, 29, 0.16);

  /* 主色：墨绿系 */
  --brand:             #127d6f;
  --brand-strong:      #0b5f55;
  --brand-deep:        #074840;
  --brand-soft:        rgba(18, 125, 111, 0.08);
  --brand-soft-2:      rgba(18, 125, 111, 0.14);

  /* 信号金（NEW）：高价值信号 / 付费 / 升级 / 当前时点 */
  --signal:            #c9a14a;
  --signal-strong:     #a87f2c;
  --signal-soft:       rgba(201, 161, 74, 0.10);

  /* 数据语义（K 线 / 阶段判断） */
  --data-up:           #2f7d52;
  --data-down:         #bd4c42;
  --data-flat:         #66746c;

  /* 环境变量专色 */
  --env:               #315f84;
  --env-soft:          rgba(49, 95, 132, 0.10);

  /* 警示 */
  --alert:             #bd4c42;
  --alert-soft:        rgba(189, 76, 66, 0.09);

  /* 投影（仅两层） */
  --shadow-card:       0 1px 0 rgba(22,33,29,0.04), 0 0 0 1px var(--hairline);
  --shadow-pop:        0 4px 16px rgba(22,33,29,0.08), 0 0 0 1px var(--hairline-strong);

  /* 字体 */
  --font-sans:  'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
  --font-mono:  'JetBrains Mono', 'SF Mono', 'Menlo', 'PingFang SC', monospace;
  --font-serif: 'Source Han Serif SC', 'Noto Serif SC', 'Songti SC', serif;
}

/* 报告深读模式 */
[data-mode="terminal"] {
  --bg:                #0e1714;
  --bg-elevated:       #16221d;
  --paper:             #1a2722;
  --ink-1:             #f5f7f2;
  --ink-2:             #d8dfd9;
  --ink-3:             #9ba8a2;
  --ink-4:             #6d7d76;
  --hairline:          rgba(245, 247, 242, 0.10);
  --hairline-strong:   rgba(245, 247, 242, 0.18);
  --brand-deep:        #4ec5b3;
  --signal:            #d9b562;
  --data-up:           #6cd092;
  --data-down:         #e57569;
}
```

### 2.2 字号阶梯（8 阶）

| token | px | line-height | 用途 |
|---|---|---|---|
| text-xs | 11 | 16 | 角标、metric 标签 |
| text-sm | 13 | 20 | 副文 |
| text-base | 14 | 22 | 正文（dashboard 默认） |
| text-md | 16 | 26 | 段落标题 |
| text-lg | 19 | 28 | section 标题 |
| text-xl | 24 | 34 | 模块标题 |
| text-2xl | 32 | 40 | 报告标题、数字 hero |
| text-3xl | 44 | 52 | 单页 hero（仅首页 / 报告封面） |

### 2.3 间距 / 圆角

间距固定为 `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`，禁用其他数值。

| 圆角 token | px |
|---|---|
| radius-sm | 2 |
| radius | 4（默认） |
| radius-md | 6 |
| radius-lg | 8 |

### 2.4 数字 / 干支约定

所有数字、干支、时间、报告 ID、五行值、流年大运 → `font-mono`。这是 dashboard 感最大的开关。

---

## 3. 品牌锚

### 3.1 logo 概念：四柱 K 线

```
   ║
   █     ┃
   █  ┃  ┃     ━ ━ ━
   ┃  ┃  █  ◆
      ┃  █
      ┃
```

四根柱（年/月/日/时）+ 判断基线 + 金菱（当前时点）。第三柱（日柱）实色，代表"我"。

### 3.2 wordmark

`人生 [K] 线`，K 用衬线（Source Han Serif），其他汉字 PingFang。
副标 `LIFE KLINE` 全大写、letter-spacing +0.18em，font-mono。

### 3.3 金色铁律

`--signal` 金色全站只在两个地方使用：
1. logo 上的当前时点菱形
2. 高价值信号（升级、专项服务、报告高质量等级、付费引导）

不得用作普通装饰、普通强调、普通分隔。这是金色不烂掉的关键。

### 3.4 联动应用矩阵

| 面 | 处理 |
|---|---|
| favicon (16/32) | 单色简化版四柱（█ ┃ █ ┃） |
| icon.svg (192+) | 完整 logo + 金菱 |
| og:image | 米底 + 抽象 K 线 + wordmark + tagline + 右下金菱 |
| 报告水印 | 左下角，小四柱 + 报告 ID + 时间（全等宽体） |
| loading 动画 | 四柱依次升起 → 横线掠过 → 金菱落定（~1.4s loop） |
| 报告封面 | 大 wordmark + K 线背景 + 用户名 + 出生时间 |
| email 顶 | 单色四柱 24px + wordmark |
| PWA splash | 大金菱居中 + wordmark |

---

## 4. 组件库收束（40 → 12 primitive）

### 4.1 合并表

| 旧（删除） | 新 |
|---|---|
| glass-panel / soft-card / static-card / product-panel / product-panel-strong / product-subtle / workspace-panel / workspace-panel-muted / interactive-card / surface-hero-rail / priority-disclosure / metric-tile / hero-stat | `<Card variant="default|raised|sunken|interactive">` |
| action-primary / action-secondary / action-main | `<Button variant="primary|secondary|ghost|signal">` |
| signal-pill / product-chip | `<Tag tone="default|brand|signal|env|alert">` |
| section-label / product-kicker | `<Eyebrow>` |
| intro-copy / intro-panel / hero-description / hero-hint | `<Lede>` |

### 4.2 新 primitive 清单（components/ui/）

```
brand-mark.tsx
brand-lockup.tsx
card.tsx
button.tsx
tag.tsx
stat.tsx
stack.tsx
inline.tsx
eyebrow.tsx
lede.tsx
divider.tsx
kbd.tsx
```

---

## 5. 信息架构

### 5.1 首页（5 段）

1. **Hero 表单**：大字钩 + FortuneForm + 三个信任标签（真太阳时 / 节气精度 / 600+ 话术）
2. **价值证明**：横向 4 个 stat（已分析报告数 / 升级版本 / 模型链 / 平均生成耗时）
3. **三栏入口**：知识体系 / 案例 / 工具中心，各置顶 2 个
4. **个人增长**（条件渲染：仅已登录且有历史）
5. **Footer**

砍掉：6 个 Surface Panel、PriorityDisclosure（移到 `/dashboard`）、ProductSurfaceRolePanel、SurfaceJourneyPanel 大块、Updates 状态条（仅订阅时显示）。

### 5.2 报告页（1511 行 → 9 组件）

```
app/result/[id]/page.tsx                ← 容器，<200 行
components/report/
├── report-cover.tsx                    封面 + 用户身份 + 报告版本
├── report-kline-deck.tsx               K 线主图 + 阶段标记（升级 hero 区）
├── report-structure-panel.tsx          结构（四柱 / 五行 / 十神）
├── report-stage-panel.tsx              阶段（大运 / 流年 / 当前）
├── report-environment-panel.tsx        环境变量
├── report-actions-panel.tsx            行动建议
├── report-upgrade-rail.tsx             升级 / 专项服务（金色 rail）
├── report-event-loop.tsx               事件沉淀闭环
└── report-mode-toggle.tsx              terminal mode 切换
```

### 5.3 工作台 `/analyze`

改造为左主区（输入 + 当前历史）+ 右副区（最近报告 + 模型状态 mini）双栏 dashboard。

---

## 6. 落地节奏（5 个 phase）

| Phase | 范围 | 估时 | 验收 |
|---|---|---|---|
| **P1 设计语言基建** | globals.css 重写 / 字体引入 / brand-mark + brand-lockup / 12 ui primitive | 1d | npm run lint / build pass，组件 storybook-like 演示页可访问 |
| **P2 站点骨架** | site-header / site-footer / favicon / og 模板 / loading 动画 | 0.5d | 所有页面 header/footer 视觉新版，favicon 全平台已切 |
| **P3 首页重构** | `/` 5 段化、FortuneForm 视觉重做、信任区 | 1d | 首页核心转化路径不变（form 提交 → /result）|
| **P4 报告页拆分** | 1511 → 9 组件 / terminal mode / K 线主图升级 | 2d | 报告页所有数据点保持等价，新增 terminal toggle 可用 |
| **P5 全站收尾** | grep 替换旧 utility / 巨型组件命名重构 / lint 清理 | 1d | npm run qa:public-surfaces / qa:admin-surfaces pass |

每个 phase 独立 commit，可独立部署。

---

## 7. 验收门禁

每个 phase 收尾必须过：
- `npm run lint`
- `npm run test`
- `npm run build`
- 视觉巡检：首页 / 报告页 / 工作台 / 后台

P5 收尾还要过：
- `npm run qa:public-surfaces`
- `npm run qa:admin-surfaces`

---

## 8. 不在本次范围

- 业务逻辑改动（报告链 / LLM / 数据库 schema 一律不动）
- 后台管理页面视觉（仅做最小程度的 token 替换，不重新设计）
- 国际化版本视觉（`/world-yi/en` 沿用新 token，不单独设计）
- 移动端 dashboard 模式（terminal mode 在窄屏自动降级为常规模式）

---

## 9. 风险与回退

- **风险 1**：原地重构期间老页面引用的 utility 被删，runtime crash → 通过 phase 顺序保证：P1 时新旧 utility **并存**，P5 才删旧的
- **风险 2**：JetBrains Mono 在中文 fallback 不优雅 → 保留 PingFang 作为 mono 链的中文 fallback
- **风险 3**：terminal mode 切换破坏报告 SEO → 仅 client-side toggle，SSR 默认 light
- **回退**：每个 phase 独立 commit，任意一段可 `git revert <hash>` 回退
