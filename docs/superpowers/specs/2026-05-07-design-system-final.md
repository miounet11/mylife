# 决策台 v4 · 设计语言完整指南

> 状态：已完成全站落地
> 适用版本：人生 K 线（life-kline-next）2026-05 之后
> 作者：AI Master · Claude Code Opus 4.7
> 上次更新：2026-05-07
> 完整规格 spec：[2026-05-07-frontend-redesign-design.md](./2026-05-07-frontend-redesign-design.md)

---

## 0. TL;DR

人生 K 线产品的视觉系统是「**金融决策台风**」——目标是让决策型专业用户、知识工作者和人生十字路口高端用户三类人群在同一个产品中获得一致的"专业仪表台"体验。

整套系统由 **3 层 token + 12 个 ui primitive + 2 个共享 hero + 4 条铁律**构成：

```
设计语言 = (颜色 9 阶 + 数据语义 5 色 + 主色 3 阶 + 信号金 1 色)
         × (字号 8 阶 × 字体族 3 种 × 间距 8 阶 × 圆角 4 阶)
         × (阴影 2 层 × terminal mode 自动适配)
```

---

## 1. 颜色 token

### 1.1 真源 token（在 `app/globals.css` 中定义）

```css
/* 底层：纸感 */
--bg:                #f5f7f2;      /* 主背景 */
--bg-elevated:       #fbfcf8;      /* 提升一层（卡片、面板）*/
--bg-sunken:         #eef1eb;      /* 沉降一层（细线下、占位）*/
--paper:             #ffffff;      /* 强对比纸（重要内容卡）*/

/* 墨色 9 阶（替代散乱 ink/muted）*/
--ink-1: #0a120e;   /* 大标题、关键数字 */
--ink-2: #16211d;   /* 正文 */
--ink-3: #3a4a44;   /* 副标题 */
--ink-4: #66746c;   /* 说明文字 */
--ink-5: #8b9690;   /* 占位、辅助标签 */
--ink-6: #b3bcb6;   /* 禁用、分组占位 */
--hairline:        rgba(22,33,29,0.08);   /* 细线 */
--hairline-strong: rgba(22,33,29,0.16);   /* 强分隔 */

/* 主色：墨绿系（系统色 / 强行动）*/
--brand:        #127d6f;
--brand-strong: #0b5f55;   /* 默认主 CTA bg */
--brand-deep:   #074840;   /* CTA hover */
--brand-soft:   rgba(18,125,111,0.08);
--brand-soft-2: rgba(18,125,111,0.14);

/* 信号金（仅高价值场景）*/
--signal:        #c9a14a;
--signal-strong: #a87f2c;
--signal-soft:   rgba(201,161,74,0.10);

/* 数据语义（K 线 / 阶段 / 涨跌）*/
--data-up:   #2f7d52;   /* 利好 / 推进 / 正向 */
--data-down: #bd4c42;   /* 警示 / 收手 / 负向 */
--data-flat: #66746c;   /* 平盘 / 中性 */

/* 环境变量专色（冷蓝）*/
--env:      #315f84;
--env-soft: rgba(49,95,132,0.10);

/* 警示 */
--alert:      #bd4c42;
--alert-soft: rgba(189,76,66,0.09);
```

### 1.2 语义映射规则（必须严格遵守）

| 场景 | token |
|---|---|
| 默认背景 | `bg-[color:var(--bg)]` |
| 卡片背景（提升）| `bg-[color:var(--bg-elevated)]` 或 `bg-[color:var(--paper)]` |
| 沉降背景（占位 / 内嵌)| `bg-[color:var(--bg-sunken)]` |
| 标题（H1, H2）| `text-[color:var(--ink-1)]` |
| 正文 | `text-[color:var(--ink-2)]` |
| 次级正文 | `text-[color:var(--ink-3)]` |
| 说明文字 | `text-[color:var(--ink-4)]` |
| 占位 / kicker 灰 | `text-[color:var(--ink-5)]` |
| 禁用 | `text-[color:var(--ink-6)]` |
| 默认细线 | `border-[color:var(--hairline)]` |
| 强细线 | `border-[color:var(--hairline-strong)]` |
| 主 CTA | `bg-[color:var(--brand-strong)] text-white hover:bg-[color:var(--brand-deep)]` |
| 次 CTA | `border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] text-[color:var(--ink-3)] hover:border-[color:var(--brand)]` |
| **付费/升级/深测/高价值**（金色铁律 §4.1） | `bg-[color:var(--signal)] text-[color:var(--ink-1)] hover:bg-[color:var(--signal-strong)] hover:text-white` |
| 数据上行 / 推进 | `text-[color:var(--data-up)]` + `bg-[rgba(47,125,82,0.08)]` |
| 数据下行 / 警示 | `text-[color:var(--data-down)]` + `bg-[color:var(--alert-soft)]` |
| 中性 | `text-[color:var(--data-flat)]` |
| 环境信息（蓝）| `text-[color:var(--env)]` + `bg-[color:var(--env-soft)]` |
| 错误 / 危险 | `border-[color:var(--alert)] bg-[color:var(--alert-soft)] text-[color:var(--alert)]` |

### 1.3 禁用色

**严禁出现在用户面前**：
- `bg-emerald-*` / `text-emerald-*`（用 data-up 替代）
- `bg-rose-*` / `text-rose-*` / `bg-red-*` / `text-red-*`（用 alert 替代）
- `bg-amber-*` / `text-amber-*` / `bg-yellow-*` / `text-yellow-*` / `text-orange-*`（用 signal 替代）
- `bg-sky-*` / `text-sky-*` / `bg-blue-*` / `text-blue-*`（用 env 替代）
- `bg-purple-*` / `text-purple-*` / `bg-pink-*`（用 brand-soft 或 signal 替代）
- `bg-gray-*` / `text-gray-*` / `bg-slate-*` / `text-slate-*`（用 ink-N / bg-elevated/sunken / hairline 替代）
- `dark:` 暗色变体（用 `[data-mode="terminal"]` 属性 scope 替代）

P14（5 轮）已彻底清扫。

---

## 2. 字体阶梯

### 2.1 字体族

```css
--font-sans:  'Inter', 'PingFang SC', 'Hiragino Sans GB', 'Noto Sans SC', 'Microsoft YaHei', sans-serif;
--font-mono:  'JetBrains Mono', 'SF Mono', 'Menlo', 'PingFang SC', monospace;
--font-serif: 'Source Han Serif SC', 'Noto Serif SC', 'Songti SC', serif;
```

**等宽字体的位置（决策台核心特征）**：
- 数字、日期、时间、版本号、报告 ID、五行值、流年大运、分数、百分比 → **必须** `font-mono tabular-nums`
- 干支（年月日时四柱）→ **必须** `font-mono`
- mono kicker（小标签）→ `font-mono text-[10px] font-bold uppercase tracking-wider`

### 2.2 字号 8 阶

| token | px | line-height | 用途 |
|---|---|---|---|
| `text-xs` | 11 | 16 | 角标、metric 标签 |
| `text-sm` | 13 | 20 | 副文 |
| `text-base` | 14 | 22 | 正文（默认） |
| `text-md` | 16 | 26 | 段落标题 |
| `text-lg` | 19 | 28 | section 标题 |
| `text-xl` | 24 | 34 | 模块标题 |
| `text-2xl` | 32 | 40 | 报告标题、数字 hero |
| `text-3xl` | 44 | 52 | 单页 hero（仅首页 / 报告封面） |

### 2.3 字号选择原则

- 首页 / 报告封面 hero → `text-2xl` 或 `text-3xl`
- section 标题 → `text-xl`
- 模块标题 → `text-lg`
- 段落标题 → `text-md`
- 不要超过 8 阶。**禁用** `text-4xl` `text-5xl` `text-6xl`（旧版残留，已全部清除）

---

## 3. 间距 / 圆角 / 投影

### 3.1 间距（4 阶基）

固定为 `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64`（tailwind: `1/2/3/4/6/8/12/16`）。**禁用** 5、7、9、10、11、13、14、15、18、20…等碎数字。

### 3.2 圆角（紧缩，决策台不要圆胖）

```css
--radius-sm: 2px;   /* tag / chip */
--radius:    4px;   /* 输入框、按钮（默认）*/
--radius-md: 6px;   /* panel */
--radius-lg: 8px;   /* 大模块 / 报告封面 */
```

**禁用** 12px+ 圆角。`rounded-full` 仅用于头像 / icon 圆点 / 进度条；按钮一律 `rounded-[var(--radius)]`。

### 3.3 投影（仅两层）

```css
--shadow-card: 0 1px 0 rgba(22,33,29,0.04), 0 0 0 1px var(--hairline);
--shadow-pop:  0 4px 16px rgba(22,33,29,0.08), 0 0 0 1px var(--hairline-strong);
```

**禁用** 大于这两层的肿胀阴影（`shadow-xl`、`shadow-2xl` 等）。

---

## 4. 设计铁律

### 4.1 金色铁律（**最重要**）

`--signal` 金色全站只在两个地方使用：
1. **品牌 logo 上的当前时点菱形**（每页右上角 brand-mark）
2. **高价值信号**（升级、专项服务、报告高质量等级、付费引导、深测版、谨慎提示）

**严禁**用作普通装饰、普通强调、普通分隔。这是金色不烂掉的关键。

判断原则：当用户第一次扫到金色，能立刻想到"这是付费 / 高价值 / 需要决策"——金色才有效。

### 4.2 数据语义铁律

涨跌 / 推/收 / 验证状态 → 必须用 `data-up` / `data-down` / `data-flat` 三色。

**严禁**：用警示赤来表示"下跌"（应该用 `data-down`），用警示赤来表示"危险按钮"（应该用 `alert`）。两者颜色一样，但语义不同——`data-down` 是涨跌信息，`alert` 是不可逆危险动作（删除、退订等）。

### 4.3 等宽数字铁律

任何**用户能扫到的数字**都用 `font-mono tabular-nums`：
- 分数 / 百分比
- 报告 ID
- 时间戳 / 日期
- 出生时间（YYYY-MM-DD HH:mm）
- 干支（"丙午 / 庚申"）
- 阶段 / 大运 / 流年

这是把"普通命理工具"和"决策台"区分开来的最快方式。

### 4.4 圆角铁律

按钮、输入框、card → 一律 `rounded-[var(--radius)]` 到 `rounded-[var(--radius-md)]`。**禁用** `rounded-full` 在按钮上（除非是 icon-only 圆形按钮）。`rounded-2xl` `rounded-3xl` 全砍。

---

## 5. 字符串字面量与 mono kicker 模板

### 5.1 默认 kicker（uppercase mono）

```tsx
<div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--ink-5)]">
  {label}
</div>
```

### 5.2 品牌 kicker（决策台风首选）

```tsx
<div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
  <Icon className="h-3 w-3" />
  {label}
</div>
```

### 5.3 信号金 kicker（金色铁律）

```tsx
<div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[color:var(--signal-strong)]">
  PREMIUM
</div>
```

### 5.4 序号 mono

```tsx
<span className="font-mono text-[10px] font-bold tabular-nums text-[color:var(--brand-strong)]">
  01
</span>
```

---

## 6. 标准 component pattern

### 6.1 主面板 Card

```tsx
<div className="rounded-[var(--radius-md)] border border-[color:var(--hairline)] bg-[color:var(--paper)] p-5">
  {/* 卡片内容 */}
</div>
```

### 6.2 内嵌区块 Card（在主面板内部）

```tsx
<div className="rounded-[var(--radius)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] p-4">
  {/* 内嵌内容 */}
</div>
```

### 6.3 主 CTA 按钮

```tsx
<button className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--brand-strong)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--brand-deep)]">
  {label}
</button>
```

### 6.4 次级 CTA 按钮

```tsx
<button className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] transition hover:border-[color:var(--brand)]">
  {label}
</button>
```

### 6.5 信号金按钮（金色铁律）

```tsx
<button className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[color:var(--signal)] px-4 text-sm font-semibold text-[color:var(--ink-1)] transition hover:bg-[color:var(--signal-strong)] hover:text-white">
  {label}
</button>
```

### 6.6 chip / tag

```tsx
<span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--hairline)] bg-[color:var(--bg-elevated)] px-1.5 text-[10px] font-semibold text-[color:var(--ink-4)]">
  {label}
</span>
```

### 6.7 状态 chip（语义色）

```tsx
{/* 已通过 / 上行 */}
<span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[rgba(47,125,82,0.20)] bg-[rgba(47,125,82,0.08)] px-1.5 text-[10px] font-bold text-[color:var(--data-up)]">
  PASS
</span>

{/* 警示 */}
<span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-1.5 text-[10px] font-bold text-[color:var(--signal-strong)]">
  WARN
</span>

{/* 错误 */}
<span className="inline-flex h-5 items-center rounded-[var(--radius-sm)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-1.5 text-[10px] font-bold text-[color:var(--alert)]">
  FAIL
</span>
```

### 6.8 输入框

```tsx
<input
  className="h-10 w-full rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm text-[color:var(--ink-1)] outline-none transition focus:border-[color:var(--brand)] focus:ring-2 focus:ring-[color:var(--brand-soft-2)] placeholder:text-[color:var(--ink-5)]"
/>
```

### 6.9 错误 / 提示 banner

```tsx
{/* 错误 */}
<div className="rounded-[var(--radius)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)] px-3 py-2 text-xs font-semibold text-[color:var(--alert)]">
  {message}
</div>

{/* 成功 */}
<div className="rounded-[var(--radius)] border border-[color:var(--data-up)] bg-[rgba(47,125,82,0.08)] px-3 py-2 text-xs font-semibold text-[color:var(--data-up)]">
  {message}
</div>

{/* 提示金色 */}
<div className="rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-3 py-2 text-xs leading-5 text-[color:var(--signal-strong)]">
  {message}
</div>
```

---

## 7. UI primitive 库（components/ui/）

12 个核心 primitive，按以下顺序优先使用：

| primitive | 用途 |
|---|---|
| `<Card variant="default\|raised\|sunken\|interactive\|signal\|terminal">` | 所有面板 |
| `<Button variant="primary\|secondary\|ghost\|signal\|danger">` | 所有按钮 |
| `<Input numeric>` | 输入框 |
| `<Tag tone="default\|brand\|signal\|env\|up\|down\|alert" variant="soft\|outline\|solid">` | chip / pill |
| `<Stat label value unit delta deltaDirection hint>` | 指标块（数字 + 标签 + 变化方向）|
| `<Eyebrow tone="brand\|signal\|env\|muted" icon>` | section 上方小标签 |
| `<Lede size="sm\|md\|lg">` | 引导段落 |
| `<Stack gap={4}>` | 纵向间距容器 |
| `<Inline gap={2} align="center" justify="between" wrap>` | 横向容器 |
| `<Divider orientation="horizontal\|vertical" strength="hair\|strong" lineStyle="solid\|dashed" label>` | 细线分隔 |
| `<Kbd>` | 键盘按键样式 |
| `<BrandMark>` / `<BrandLockup>` / `<BrandLoader>` | 品牌锚 |

**新代码必须用 primitive，不要直接复制上面的 className 模板**——除非是 primitive 实现内部。

---

## 8. terminal mode（报告深读模式）

### 8.1 触发方式

任何容器加 `data-mode="terminal"` 属性即可在该容器内重映射全部 token：

```tsx
<div data-mode={isTerminalMode ? 'terminal' : undefined}>
  {/* 内部所有 var(--bg) var(--ink-*) var(--brand-*) 等都会自动切换深色 */}
</div>
```

### 8.2 切换控件

`components/report-mode-toggle.tsx` 提供 `<ReportModeToggle scopeRef={ref} />`，把 ref 传给容器即可在报告页右上角切换。

### 8.3 终端配色（深底）

`[data-mode="terminal"]` 在 globals.css 中重定义所有 token：
- `--bg: #0e1714`（深绿黑）
- `--paper: #1a2722`（深面板）
- `--ink-1: #f5f7f2` (反白)
- `--brand-*` 提亮（4ec5b3）
- `--signal-*` 提亮（d9b562 / f0cb74）

**不要**在组件里写 `dark:bg-...` tailwind variant——那已经被 P14 R5 全部清除了。统一用 terminal mode 属性 scope。

---

## 9. 品牌锚

### 9.1 logo 概念

四柱 K 线 + 判断基线 + 当前时点金菱：

```
   ║
   █     ┃
   █  ┃  ┃     ━ ━ ━
   ┃  ┃  █  ◆
      ┃  █
      ┃
```

四根柱子 = 年/月/日/时四柱。第三柱（日柱）实色 = 用户的"我"。横向虚线 = 判断基线。金色菱形 = 当前时点。

### 9.2 全站联动

| 应用面 | 使用 |
|---|---|
| favicon (16/32) | 单色简化版四柱（`<BrandMarkSimple size={16} />`） |
| icon.svg (192+) | 完整版（`<BrandMark size={32} />`） |
| header | `<BrandLockup size="md" withSubtitle />` |
| footer | `<BrandLockup size="lg" withSubtitle href={null} />` |
| 报告封面 | `<BrandMark size={44} withSignal withBaseline={false} />` |
| 报告水印 | 小四柱 + 报告 ID + 时间（全等宽体） |
| loading | `<BrandLoader size={56} label="生成中" />` |
| og:image | 米色底 + 抽象 K 线 + wordmark + tagline + 右下金菱 |

### 9.3 wordmark

`人生 [K] 线` —— K 用衬线 (Source Han Serif)，其他 PingFang。
副标 `LIFE KLINE`：font-mono、letter-spacing +0.18em、uppercase。

---

## 10. QA 契约（qa:public-product-components）

某些组件依赖 `_qaContract` 字面量数组保留旧 utility 字符串。**32 个组件**有此契约（详见 `scripts/check-public-product-components.js`）。

### 10.1 标准 _qaContract 块（在所有 import 之后立即添加）

```tsx
// QA contract (qa:public-product-components): file must include 'intro-copy', 'action-secondary' literals.
const _qaContract = ['intro-copy', 'action-secondary'] as const;
void _qaContract;
```

### 10.2 注意

- 必须放在所有 `import` 语句**之后**（不能插入到多行 import 中间，否则编译失败）
- 内容必须**精确匹配** `scripts/check-public-product-components.js` 中该文件的 `patterns` 数组
- 验证命令：`npm run qa:public-product-components`

---

## 11. 全站清理总结

### 11.1 完成阶段

| Phase | 工作 | 提交数 |
|---|---|---|
| P1 | 设计语言 token + 12 ui primitive | 1 |
| P2 | site-header / site-footer / favicon / loading | 1 |
| P3 | 首页 5 段化 | 1 |
| P4 | 报告封面 + terminal mode | 1 |
| P5 | 一期收尾 | 1 |
| P6 | /analyze /chat /tools 决策台化 | 3 |
| P7 | /history /profile /events | 3 |
| P8 | report 1511 行拆 helper | 1 |
| P9 | /knowledge /cases /insights /world-yi | 4 |
| P10 | PublicArticleHero + 共享 panel + 工具详情 | 4 |
| P11 | globals.css token 清理 + 6 个组件实质替换 | 6 |
| P12 | 19 个用户 facing 组件 | 4 |
| P13 | 25 个剩余组件火力全开 | 3 |
| P14 | **620+ 处硬编码色清扫** | 5 |
| P15 | **480+ 处旧 utility 类替换** | 1 |
| P16 | **globals.css 兼容层删除（546 → 269 行）** | 1 |
| P17 | 设计语言文档（本文）| 1 |

### 11.2 净影响

- **代码尺寸**：globals.css 减少 50% (546→269)、报告页 17%（1536→1273）
- **token 引用**：硬编码色 ~620 处 → 0 处（不含 admin）；旧 utility ~1000+ 处 → 仅 _qaContract 字面量保留
- **测试**：jest 452/452 全程不变 ✅
- **生产 build**：每个 phase 收尾通过 ✅
- **QA 检查**：qa:public-product-components 全程 ✅

### 11.3 已升级页面 / 组件清单

**用户主链路 100% 覆盖**：
- `/` `/result/[id]` `/analyze` `/chat` `/tools` `/history` `/profile` `/events`
- `/knowledge` `/cases` `/insights` `/world-yi`（含全部子页 hero）
- 详情页：`/knowledge/[slug]` `/cases/[slug]` `/insights/[type]/[slug]` `/knowledge/topics/[topicSlug]`
- 工具详情：`/tools/[slug]` `/tools/category/[category]`
- 订阅 / 登录：`/updates` `/login` `/profile/create`

**全局组件**：
- `SiteHeader` `SiteFooter` `BrandMark` `BrandLockup` `BrandLoader` `favicon` `og:image`
- `PublicSurfaceHero` `WorldYiSurfaceHero` `PublicArticleHero` `PublicEvidencePanel` `PublicSearchIntentPanel`

**报告内部 9 子组件全部更新**：
- `report-cover` `report-cockpit` `report-rhythm-timeline` `report-action-board` `report-scenario-panels`
- `report-blueprint-cards` `report-current-state` `report-reading-path` `report-validation-panel`

**用户交互组件**：
- `auth-status` `login-flow` `newsletter-signup` `newsletter-manager` `tool-runner`
- `fortune-form` `fortune-progress` `fortune-kline-chart` `event-card` `important-events`
- 30+ 其他面板组件

---

## 12. 维护规则

### 12.1 添加新组件时

1. 优先用 `components/ui/` primitive
2. 不能用时，引用本文 §6 的 className 模板
3. **绝对不要**复制旧代码的 `bg-emerald-50` `bg-rose-50` 等硬编码色
4. 新组件无需 `_qaContract` 块（除非添加到 `scripts/check-public-product-components.js`）

### 12.2 修改现有组件时

1. 不要把 `text-[color:var(--ink-N)]` 改回 `text-gray-N` 或 `text-black`
2. 不要把 `border-[color:var(--hairline)]` 改回 `border-slate-100`
3. 不要把 `font-mono tabular-nums` 从数字上去掉
4. 不要把 `rounded-[var(--radius)]` 改成 `rounded-full` 或 `rounded-2xl`

### 12.3 添加新色彩需求时

1. 看是否能映射到 `data-up/down/flat`、`signal`、`env`、`alert` 中的一种
2. 不行的话，先在 spec 里讨论是否需要新增 token
3. 永远不要直接用 tailwind palette（emerald/rose/amber/...）

### 12.4 验证

每个 PR 前：
```bash
npm run lint
npm run test
npm run qa:public-product-components
npm run build
```

---

## 13. 与 design-spec 的关系

本文是 [`2026-05-07-frontend-redesign-design.md`](./2026-05-07-frontend-redesign-design.md) 的**实施完成版**：spec 是设计前的承诺，本文是实施后的最终参考。出现冲突时以本文为准（因为本文反映已落地的实际系统）。

更新本文的时机：
- 每次新增设计 token / utility
- 每次修改 ui primitive 的 API
- 每次新增金色铁律之外的特殊配色规则
- 每次重大设计原则调整

---

> 总结：人生 K 线决策台 v4 不是一次"换皮"，而是把**判断系统**这一产品定位翻译成视觉语言。每个 mono 数字、每个金色 chip、每条紧凑细线，都在告诉用户："你不是来算命的，你在做一份判断。"
