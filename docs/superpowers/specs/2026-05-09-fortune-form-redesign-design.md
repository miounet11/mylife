# 首页出生信息表单重设计（方案 A+）

> 状态：design 已确认，进入实施
> 日期：2026-05-09
> 作者：AI Master
> 范围：`components/fortune-form.tsx`（1062 行）+ 首页表单区重构 + 弹窗视觉对齐
> 节奏：3 阶段渐进，每阶段可独立 commit / 部署
> 关联规格：
> - `docs/superpowers/specs/2026-05-07-design-system-final.md`（token 真源）
> - `docs/superpowers/specs/2026-05-07-frontend-redesign-design.md`（v4 决策台设计语言）

---

## 1. 决策摘要

| 维度 | 决定 |
|---|---|
| 主战场字段 | 出生时间 / 出生地点 / 性别（3 个必填） |
| 行内高频开关 | 时辰未知（时间卡内）/ 按北京时间（地点卡内） |
| Disclosure 折叠 | 姓名 / 真太阳时设置 / 默会信息 / 判断主题 |
| 布局形态 | 单栏 720px 全屏焦点（Hero + 表单合一），删除右侧边栏 |
| 填写节奏 | 时间确认 → 自动开地点弹窗，**但可中断、可记忆、草稿用户跳过** |
| 视觉基调 | 决策台 v4 token 原样使用；关键值等宽字体；已确认态只动边框/字重 |
| 移动端 CTA | sticky footer + safe-area-inset-bottom |
| 代码架构 | `components/fortune-form/` 目录化 + 兼容入口 |
| 迁移策略 | 3 阶段，每阶段独立部署 |

---

## 2. 信息架构

### 2.1 主战场（不折叠）

| 字段 | 交互 | 视觉 |
|---|---|---|
| 出生时间 | 点击打开 `BirthTimeModal` | 大字号按钮态，mono 字体显示值；行内 chip：`时辰未知` |
| 出生地点 | 点击打开 `BirthPlaceModal` | 大字号按钮态，mono 字体显示值；行内 chip：`按北京时间` |
| 性别 | pill 切换（radiogroup） | 紧凑 pill，选中态 `bg-[color:var(--ink-1)] text-white` |

### 2.2 反馈区（CTA 之上，从上到下）

1. **工具页回流提示**（`returnHref` 存在）— Eyebrow 下方、主卡上方，信号金边框
2. **草稿恢复提示**（`readAnalyzeDraft()` 命中）— H1 下一条蓝色窄条 + "清空重填"次按钮
3. **邮箱已验证提示** — CTA 上方、错误下方，`--data-up` 边框
4. **错误提示** — CTA 正上方 8px，`role="alert"`
5. **CTA** — 移动端 sticky footer，桌面端静态

### 2.3 Disclosure（可选，默认收起）

- 命主姓名（input）
- 真太阳时 / 夏令时 / 早晚子时（chip 切换）
- 默会信息（TacitKnowledgeComposer）
- 判断主题选择（caseTypes chip）
- 草稿命中时**默认展开**（保持与之前的一致性）

### 2.4 从主表单移除

- ❌ 右侧"录入完成度"边栏 → 合并到顶部进度线
- ❌ 右侧"当前摘要"边栏 → 信息已在主卡上
- ❌ "公历/农历/四柱"冗余切换 → 弹窗内已有 tab
- ❌ "独立入口/当前时刻起局"（`InstantPaipanCard`）→ **保留代码但从首页移除**，迁到 `/tools` 或首页更下方独立章节

---

## 3. 视觉规范

### 3.1 关键值 mono 字体

出生时间、出生地点的已填值用 `font-mono tracking-[0.01em]`，未填时用 sans。
理由：数字参数感，Bloomberg 终端风。

### 3.2 状态三态（data-state）

```tsx
// 大字号入口卡片
<button
  data-state={confirmed ? 'confirmed' : value ? 'pending' : 'empty'}
  className="
    group w-full rounded-md border px-4 md:px-5 py-4 md:py-5 text-left
    bg-[color:var(--paper)] transition-all duration-150 active:translate-y-px
    border-[color:var(--hairline)] text-[color:var(--ink-2)]
    hover:border-[color:var(--ink-3)] hover:text-[color:var(--ink-1)]
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand)]/35
    data-[state=pending]:border-[color:var(--signal)] data-[state=pending]:text-[color:var(--ink-1)]
    data-[state=confirmed]:border-[color:var(--brand)] data-[state=confirmed]:text-[color:var(--ink-1)]
  "
>
  <div className="text-[11px] tracking-[0.08em] uppercase text-[color:var(--ink-4)]">出生时间</div>
  <div className="mt-1 font-mono text-[22px] md:text-[26px] leading-[1.15] tracking-[0.01em]">
    {value || '请选择'}
  </div>
</button>
```

### 3.3 顶部进度线

- 基线：`h-px bg-[color:var(--hairline)]`
- 激活段：`absolute h-px bg-[color:var(--brand)]` + `transition-all duration-200 ease-out`
- 刻度：`text-[11px] tracking-[0.08em] uppercase`
- `< 360px` 退化为 `Step X/3` + 纯进度条，隐藏刻度文案
- a11y：`role="progressbar"` + `aria-valuenow/min/max`

### 3.4 性别 pill

```tsx
<div role="radiogroup" aria-label="性别"
  className="inline-flex rounded-md border border-[color:var(--hairline)] bg-[color:var(--paper)] p-1">
  <button role="radio" aria-checked={value==='male'}
    className="min-w-[72px] rounded-sm px-3 py-2 text-[13px] text-[color:var(--ink-4)]
      transition-colors hover:text-[color:var(--ink-1)]
      data-[active=true]:bg-[color:var(--ink-1)] data-[active=true]:text-white">男</button>
  <button role="radio" ...>女</button>
</div>
```

### 3.5 反模式（禁止）

- ❌ 玻璃拟态 / 渐变 / backdrop-blur（决策台不用）
- ❌ glow / 霓虹 hover
- ❌ emoji 装饰 / 彩色插画抢主信息
- ❌ 动效超 200ms 或复杂位移
- ❌ 圆角 > 8px

---

## 4. 组件架构

### 4.1 目录结构

```
components/
├── fortune-form.tsx                  ← 兼容层：export { default } from './fortune-form/index'
└── fortune-form/
    ├── index.tsx                     ← 容器（默认导出，≤ 300 行）
    ├── fortune-form-hero.tsx         ← Eyebrow/H1/Lede/Tags
    ├── entry-progress-bar.tsx        ← 进度线 + 刻度 / < 360px 退化
    ├── birth-time-card.tsx           ← 大字号入口 + 内嵌「时辰未知」chip
    ├── birth-place-card.tsx          ← 大字号入口 + 内嵌「按北京时间」chip
    ├── gender-picker.tsx             ← radiogroup
    ├── submit-button.tsx             ← CTA + 错误（role="alert"）+ sticky
    ├── advanced-options-disclosure.tsx  ← 折叠区
    ├── form-banners.tsx              ← returnHref / 草稿恢复 / 邮箱提示
    └── types.ts                      ← 共享 interface
```

`app/page.tsx` 的 `@/components/fortune-form` import 路径保持兼容。

### 4.2 状态归属

全部 `useState` 留在容器 `fortune-form/index.tsx`，子组件全部受控。

| 状态 | 归属 | 备注 |
|---|---|---|
| `infoData` | 容器 | 核心源数据 |
| `locationState` | 容器 | 弹窗协调 |
| `loading/loadingComplete/serverStage/loadingSummary` | 容器 | 提交生命周期 |
| `error` | 容器 | 统一错误出口 |
| `showDatetime/showAddress` | 容器 | 领着走联动 |
| `showTacitComposer` | 容器 | Disclosure 内的折叠 |
| `timeConfirmed/locationConfirmed` | 容器 | 步骤编排信号 |
| `hasAutoOpenedPlace` | **新增，容器** | 防重复自动弹 |
| `sessionState` | 容器 | 邮箱提示依赖 |

### 4.3 "领着走"协调（容器 useEffect）

```ts
useEffect(() => {
  // 仅在首次时间确认后触发，且未有草稿带入地点
  if (timeConfirmed
      && !locationConfirmed
      && !hasAutoOpenedPlace
      && !hasDraftLocation) {
    const t = window.setTimeout(() => setShowAddress(true), 220);
    setHasAutoOpenedPlace(true);
    return () => window.clearTimeout(t);
  }
}, [timeConfirmed, locationConfirmed, hasAutoOpenedPlace, hasDraftLocation]);
```

关键：
- **草稿恢复用户**：`readAnalyzeDraft()` 命中时初始化 `hasAutoOpenedPlace=true`，直接跳过自动流
- **延迟 220ms**：给时间弹窗关闭动画留空间
- **移动端键盘**：通过 `visualViewport` 探测，若键盘可见则延迟到 blur 后

### 4.4 `lib/paipan-form` 扩展

新增纯逻辑函数：

```ts
export function buildProgressSegments(info: PaipanInfoData, location: FormLocationState,
  flags: { timeConfirmed: boolean; locationConfirmed: boolean }): ProgressSegment[];
```

其他函数（`formatBirthLabel` / `getAnalyzeEntryProgress` 等）已存在，保持不动。

---

## 5. 边缘场景处理

| 场景 | 处理 |
|---|---|
| 草稿恢复 | H1 下蓝色窄条 + 清空重填；`hasAutoOpenedPlace=true` 跳过领着走 |
| `unknowhour===1` | 时间卡 label = "时辰未知（仅日期）"；确认标签 = "已确认：时辰未知"；进度判定已完成 |
| `bjtime===1` | 地点卡右上显示 "北京时间" badge；不强制精确城市 |
| 已验证邮箱 | 提示卡放 CTA 上方、错误下方 |
| `returnHref` 回流 | 金色边框提示卡，Eyebrow 下方、主卡上方 |
| `loading===true` | 保留页骨架，全按钮 disabled，CTA 内 spinner |
| 微信回退重进 | 路由变化时强制关闭所有 modal + 解锁 body |
| 大字模式（200%） | pill 容器 `flex-wrap gap-2`；主卡 `min-h-14` 防抖动 |

---

## 6. 移动端

| 断点 | 处理 |
|---|---|
| `< 360px` | 进度线退化为 `Step X/3` + 纯进度条 |
| `< 768px` | CTA sticky footer + `pb-[max(12px,env(safe-area-inset-bottom))]`；主容器 `pb-24` 防遮挡 |
| `< 768px` | 主值字号 `text-[20px]`；md+ `text-[26px]` |
| `< 768px` | 主卡 `p-4`；md+ `p-6` |
| Modal 打开 | body lock（overflow:hidden + touch-action:none）+ `overscroll-contain` |
| input 聚焦 | 字号 ≥ 16px（防 iOS Safari 缩放）|
| `BirthTimeModal`（859 行）| `dynamic import({ ssr:false })` + idle 预加载 |

---

## 7. a11y 清单

- `role="progressbar"` + `aria-valuenow/min/max` 在进度线
- 时间/地点大卡用 `button` + `aria-haspopup="dialog"` + `aria-label` 含当前值
- Modal focus trap、ESC 关闭、关闭后焦点回触发按钮
- 性别 pill = `role="radiogroup"` + `role="radio"` + 方向键切换
- 错误提示 `role="alert"` + `aria-describedby` 关联字段
- 自动聚焦首错项

---

## 8. 迁移策略（3 阶段）

### 阶段 1 · 无行为变更拆壳

**目标**：搭目录结构 + 提纯展示组件，功能零变化。

- 建 `components/fortune-form/` 目录
- 从 1062 行原件中原样提取：
  - `fortune-form-hero.tsx`（当前 Eyebrow/H1/Lede 块）
  - `entry-progress-bar.tsx`（从右侧边栏提取进度逻辑，先不换位）
  - `gender-picker.tsx`
  - `submit-button.tsx`（含错误提示）
- 容器 `index.tsx` 引用子组件
- 原 `components/fortune-form.tsx` 改为兼容层：`export { default } from './fortune-form/index'`
- 跑 `npm run test && npm run lint`，验证首页截图无差异

**验收**：视觉 0 变化，测试全绿，app/page.tsx 无需改动。

### 阶段 2 · 主卡 + 协调 + 视觉

**目标**：视觉切到 A+，实现领着走，删右侧边栏。

- 提 `birth-time-card.tsx` / `birth-place-card.tsx`，含行内 chip（时辰未知、按北京时间）
- 应用新视觉规范（mono 字体、data-state、hairline 边框）
- 顶部进度线替换右侧边栏，双边栏 `<div className="hidden space-y-3 xl:sticky...">` 直接删除
- 容器加 `hasAutoOpenedPlace` state 和领着走 useEffect
- 新增 `lib/paipan-form.ts` 的 `buildProgressSegments`
- 首页下方的 `InstantPaipanCard` 整块从 `FortuneForm` 移除
- 手测：填时间后 220ms 自动弹地点；草稿命中不弹

**验收**：视觉切新版，3 核心字段可提交；桌面/移动端均可用。

### 阶段 3 · 折叠区 + 移动端 + a11y

**目标**：完成剩余所有升级。

- 提 `advanced-options-disclosure.tsx`（姓名 / 真太阳时 / 默会信息 / 判断主题）
- 提 `form-banners.tsx`（returnHref / 草稿恢复 / 邮箱验证）
- 移动端 sticky CTA footer + safe-area
- `< 360px` 进度线退化
- `BirthTimeModal` 改 `dynamic import`
- 全 a11y 属性补齐
- Modal 打开时 body lock + overscroll 处理

**验收**：a11y 审计通过（Lighthouse），iPhone SE / iPad 横屏 / Android Chrome 手测通过。

---

## 9. 验收标准

- [ ] 首页 `/` 与 `/analyze` 可完整提交报告
- [ ] 草稿恢复流程正确（不自动弹地点）
- [ ] `returnHref` 回流用户提示正确
- [ ] `npm run lint && npm run test && npm run build` 全绿
- [ ] `npm run qa:public-surfaces` 通过
- [ ] 容器文件 ≤ 300 行，各子组件 ≤ 200 行
- [ ] iPhone SE（375px）/ iPad 横屏 / Android Chrome 手测通过
- [ ] 键盘弹起不遮挡 CTA
- [ ] Lighthouse a11y ≥ 95

---

## 10. 非目标（YAGNI）

- ❌ 不改 `BirthTimeModal` / `BirthPlaceModal` 内部业务逻辑（只对齐视觉 token）
- ❌ 不引入新 CSS 变量
- ❌ 不做表单的 wizard 化
- ❌ 不改提交后的报告页
- ❌ 不改 API contract
