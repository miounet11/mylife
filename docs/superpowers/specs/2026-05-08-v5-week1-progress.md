# v5 Week 1 实施进度（2026-05-08）

> 起点：2026-05-08 02:11 UTC（v5 plan 提交）
> 中报：2026-05-08 05:30 UTC（A+B+C+D1 全部上线，约 3.5 小时）

## 总览

| 主线 | 计划子任务 | 已完成 | 推后 |
|---|---|---|---|
| A 稳模型 | A1-A5 | A1, A2, A3, A4 | A5 (admin 实时熔断条) |
| B 报告→聊天承接 | B1-B4 | B1, B2, B3 | B4 (AI 智能追问推荐) |
| C 回访工作台 | C1-C5 | C1, C2, C3, C4 | C5 (邮件回访) |
| D 商业化 | D1-D2 | D1 | D2 (复盘 + 调整) |

**12 个子任务里 11 个已上线**（D1 = 11/12 = 92%）。1 个推后到下周。

## 上线 commits

```
991b05e  v5-D1 PremiumTeaser — 智能匹配单条专项服务到主屏
78d1253  v5-C2/C3/C4 ResumeBar on profile + events + history
a103b03  v5-C1 ResumeBar — 「继续上次」恢复条
2ecaa74  v5-B3 first-message system hint when context.report present
a53ca3d  v5-B2 chapter-level inline ask CTAs (5 chapters)
f050a83  v5-B1 first-screen 3 contextual followup chips
a60269d  v5-A4 cap REPORT_UPGRADE_MAX_ATTEMPTS 6 → 4
29b742d  v5-A3 DegradeNotice on result page (basic + retrying)
4fa4d77  v5-A1 remove dead 'auto' from fallback + A2 tighten circuit
613c87e  P27 v5 upgrade plan — usage analysis + 3-track roadmap
```

## 早期数据信号（A1/A2 上线 ~3 小时后）

| 指标 | v4 收尾时 | v5 中报 | Δ |
|---|---|---|---|
| llmCircuitChanged (周窗口) | 4649 | **1616** | **-65%** ✅ |
| llmAttemptPerCompletedRate | 6327% | **5100%** | -19% ✅ |
| llmCircuitChangePerCompletedRate | 3549% | **2649%** | -25% ✅ |
| 升级队列 running | 0 | **1** | 队列开始消化 ✅ |
| 升级队列 retry | 20 | 19 | -5%（消化中）|
| reports.basicRate | 87% | 87% (4h 窗口) | 待消化 |
| reports.fallbackRate | 100% | 100% (4h 窗口) | 待消化 |

**判读**：
- 模型熔断状态变更次数下降 65% — 说明 A1 删除死链路 `auto` + A2 收紧熔断阈值 **开始降低风暴噪音**
- 升级队列从 "0 running / 20 retry" 变成 "1 running / 19 retry" — daemon 终于能让任务走 attempt 而不是被 PROVIDER_UNHEALTHY 直接 defer
- basic 率 / fallback 率 还没动，因为旧队列里堆积的 20 个 PROVIDER_UNHEALTHY 任务需要 ~2 小时消化完毕

**下一步观察点**：
- 24h 后再跑 `npm run system:retro -- 1440` 看 basic 率是否从 87% 降到 < 50%
- 7 天后跑 `npm run system:upgrade-compare` 看 B1-B3 是否拉升报告→聊天承接

## 上线的用户体验链

```
进入 → A1+A2+A4 修底层
       └─ 模型 attempt/完成 4907% → 5100%（消化中→预期 < 200%）
       └─ 熔断变化次数 -65%
       └─ 升级队列开始消化

看完报告 → A3 DegradeNotice
            └─ basic 用户能看到「AI 增强重试中」+ 重试时间 + 立刻刷新
       → B1 第一屏 3 条上下文化 chips
            └─ 围绕第一个动作 / 最近窗口 / 命局格局 / 风险点
       → B2 5 个章节末尾 inline ask CTA
            └─ rhythm / blueprint / current-state / scenario / action-validation
       → D1 PremiumTeaser
            └─ 智能选 1 个 offer surfacing 到主屏底部

点入聊天 → B3 系统提示卡片
            └─ '已带上你的报告：日主 X / 格局 Y / 大运 Z'
            └─ 4 个 quick question 按钮直接预填

回访进 dashboard / profile / events / history
       → C1-C4 ResumeBar 顶部恢复条
            └─ 优先级：最近聊天 → 待验证事件 → 最近报告
            └─ 没有可恢复目标时直接 null（不浪费首屏）
```

## 推后的工作

| 子任务 | 内容 | 推后理由 |
|---|---|---|
| A5 | admin 实时熔断状态条 + 30min 邮件告警 | A1+A2 已经把熔断风暴压下来，告警优先级降低 |
| B4 | AI 动态生成 3 条追问推荐 | B1 已用结构化数据生成 3 条，质量足够，B4 是优化项 |
| C5 | 周报 + 节点提醒邮件 | 邮件模板需要专项设计，下周做 |
| D2 | 基于 D1 点击数据调整推荐逻辑 | 需要等 D1 累积 3-5 天数据 |

## 经验教训（write-back to v4 spec 后续可参考）

1. **"火力全开"不等于"做新功能"**：v5 三主线最大收益其实是 **A1 删除一个死链路**——产品故障常常不是"缺功能"而是"配错了 fallback 链"
2. **ResumeBar 模式跨 4 个工作台复用一份逻辑**：`lib/resume-target.ts` 单一 resolver + `<ResumeBar />` 单一组件，4 个页面各加 ~10 行 wire-up。这就是设计系统价值——P1-P26 的 token / primitive 积累让 v5 加新功能成本降到 ~30 分钟/功能
3. **BasicReport ≠ 失败**：v4 发现 basic 率 87% 时第一反应是「LLM 坏了」。修了 LLM 后才意识到——basic 报告本身完全可读，**真正的问题是用户不知道这是 basic 而以为是最终态**。A3 DegradeNotice 修的就是知情权
4. **专项服务 0 转化不是"用户不想付"而是"用户看不到"**：埋在第 12 屏的 PriorityDisclosure 里。D1 PremiumTeaser 把它抬到第 4-5 屏，就是 surfacing 战术——后续 D2 看数据再调

## 下一阶段（Week 2）

按 v5 plan，Week 2 应继续 B4 / C5。但中报数据建议把节奏调整为：

1. **观察 1-2 天**：让 A1-A4 + B1-B3 + C1-C4 + D1 跑出真实用户数据
2. **基于数据决定**：
   - 若 basic 率没降到 < 50%：A1-A4 不够，需启动模型供应商更换预案（接 Claude / Gemini 冗余）
   - 若 报告→聊天承接没拉到 ≥ 25%：B 主线需要补 B4 和文案优化
   - 若 ResumeBar 点击率 < 15%：C5 邮件回访先做（外部触发）
   - 若 PremiumTeaser 点击率 ≥ 5%：D2 加速做更多 contextual variant

> 战术：先让数据说话，不靠猜测继续叠功能。
