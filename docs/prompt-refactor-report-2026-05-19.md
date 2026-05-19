# Prompt 系统化重构 · 前后对比与五维打分报告

**日期**：2026-05-19
**作者**：Clavue（claude-opus-4-7-medium） · 以李继刚提示词工程视角主导
**方法论**：五段式（Persona / Task / Input / Constraints / Output）+ HARD/SOFT/ANTI 三层分离 + 5 维评分（structure_completeness 0.20 / evidence_density 0.20 / anti_pattern_hit 0.15 / engine_consistency 0.30 / human_taste 0.15）

---

## 一、改造范围（What we did）

| 域 | Spec 数 | 入口文件 |
|---|---|---|
| analyze | 2 | `lib/prompts/analyze/{structure,narrative}.ts` |
| agentic | 7 | `lib/prompts/agentic/{core-constitution,kline-narrative,career-wealth,relationship-family,health-lifestyle,strategy-advisor,temporal-spatial-advisor}.ts` |
| chat | 7 | `lib/prompts/chat/{main,intents}.ts`（main + 6 intent） |
| 共享 | — | `lib/prompts/shared/{world-yi,agent-input}.ts` |
| 评分 | — | `lib/prompts/eval/scorers.ts` |
| 工具 | — | `scripts/prompt-eval.ts`（`npm run prompts:eval`） |

**注册中心**：`lib/prompts/registry.ts`，唯一 `PromptSpec → string` 翻译入口。
**业务调用**：统一 `buildPrompt(id, input)`，全部 spec 带 `version: 'v2-2026-05-19'`。
**Legacy 兜底**：chat-intent.ts 通过 `require` 动态引入 registry，未命中走旧路径；agentic 已全量切到 registry 并清理 dead code（移除 `AGENT_TASKS` 122 行）。

---

## 二、五维打分（Before vs After）

### 基线对比

| Baseline | Cases | structure | evidence | anti_pattern | engine | human_taste | **total** |
|---|---|---|---|---|---|---|---|
| 初始（4 case：analyze+agentic） | 4 | 100 | 100 | 100 | 100 | 80 | **97.0** |
| 扩充（11 case：+ chat 域 7 个） | 11 | 100 | 81 | 100 | 100 | 80 | **93.2** |

> evidence_density 从 100 → 81 不是退化，而是 chat 域两个图像分析场景（手相 / 户型）天然缺少"大运/流年/年份"这类命理锚点关键词，评分器启发式对它们苛刻。real-world quality 反而比基线更全面，因为引入了更难的样本。

### 单 case 明细（11 个，按 promptId 排序）

| Case | Prompt | Total | 备注 |
|---|---|---|---|
| sample-001 | analyze.structure | 97.0 | |
| narrative-001 | analyze.narrative | 97.0 | |
| kline-001 | agentic.kline_narrative | 97.0 | |
| strategy-001 | agentic.strategy_advisor | 97.0 | |
| chat-main-001 | chat.main | 97.0 | |
| chat-meihua-001 | chat.intent.meihua_enhancement | 97.0 | |
| chat-event-sim-001 | chat.intent.event_simulation | 93.7 | |
| chat-event-verdict-001 | chat.intent.event_verdict | 92.0 | |
| chat-palmistry-001 | chat.intent.palmistry_reading | 87.0 | 图像类，命理锚点天然少 |
| chat-home-layout-001 | chat.intent.home_layout_diagnosis | 85.6 | 图像类，命理锚点天然少 |
| chat-event-review-001 | chat.intent.event_review | 85.0 | mustInclude 偏严 |

---

## 三、改造前后结构变化（典型样本：chat.main）

### Before（旧 `app/api/chat/route.ts` 内联 11 行）

```ts
const baseSystem = [
  '你是 Life Kline V5 的命理对话顾问。',
  '...11 条混合杂糅 join("\n")...',
  // 报告引用 + 4 步框架 + 多模态边界（手相/户型/文书/面相）
  // 始终注入，不论是否上传图片
].join('\n');
```

**问题**：
1. 多模态安全块**始终注入**，普通文本对话也被污染。
2. HARD/SOFT/ANTI 没分层，评分器无法单独度量。
3. 写在 route 里，复用、版本化、A/B 全做不了。

### After（`lib/prompts/chat/main.ts`）

```ts
export const CHAT_MAIN_SPEC: PromptSpec<ChatMainInput> = {
  id: 'chat.main',
  version: 'v2-2026-05-19',
  persona: PERSONA,                 // 身份 + JUDGMENT_METHOD + STYLE_CALIBRATION
  task: TASK,                       // 一句话目标
  buildInput,                       // 按需注入多模态分支
  hardConstraints: HARD_CONSTRAINTS, // 违反即失败 5 条
  softPreferences: SOFT_PREFERENCES, // 评分项 4 条
  antiPatterns: ANTI_PATTERN_LIST,   // 具体负例 6 条
  outputSchemaDoc: '回答为自然语言...',
  temperature: 0.7,
};
```

`buildInput` 条件触发：

```ts
if (input.hasPalmistry)  safetyBlocks.push(SAFETY_PALMISTRY);
if (input.hasHomeLayout) safetyBlocks.push(SAFETY_HOME_LAYOUT);
if (input.hasDocument)   safetyBlocks.push(SAFETY_DOCUMENT);
if (input.hasFaceOrHandwriting) safetyBlocks.push(SAFETY_FACE_HANDWRITING);
```

**收益**：
- 普通对话 prompt 长度 −38%（实测：旧 1683 字 → 新 1041 字，不含 contextSummary）。
- HARD/SOFT/ANTI 三层分离，scorer 可单独度量 anti_pattern_hit。
- chat.main 单测得分 97。

---

## 四、回归验证

| 项目 | 状态 |
|---|---|
| `npx jest --runInBand`（chat + agentic + report-pipeline 6 套件） | ✅ 44/44 通过 |
| `npx tsc --noEmit` | ✅ 零错误 |
| `npx tsx scripts/prompt-eval.ts` | ✅ 11/11 case 跑通 |
| Legacy 回退路径 | ✅ 保留（chat-intent.ts 动态 require，route.ts 兜底 join） |

---

## 五、清理项

- ✂️ 删除 `lib/agentic-report/prompts/agents.ts` 中的 `AGENT_TASKS`（122 → 35 行，−87 行 dead code），全 7 个 agent 强制走 registry。
- ⏳ `lib/world-yi-doctrine.ts` 旧 BRIEF/DELIVERY 仍被 `lib/llm.ts` 引用，需先解耦 llm.ts 再删（下一刀）。

---

## 六、新基线落盘

- `lib/prompts/eval/baselines/baseline-2026-05-19.json`（4 case 基线，保留作历史对照）
- `lib/prompts/eval/baselines/baseline-2026-05-19-full.json`（11 case 全量基线，作为后续 PR 的对比锚点）

后续提示词调整必须跑：

```bash
npx tsx scripts/prompt-eval.ts --compare lib/prompts/eval/baselines/baseline-2026-05-19-full.json
```

total 跌幅 > 2 或任一单维度跌幅 > 5 → 不准合并。

---

## 七、未完成项（移交清单）

1. `lib/world-yi-doctrine.ts` 与 `lib/llm.ts` 解耦后才能删旧文件。
2. chat 域 EvalCase 目前 fixture 是手写示例，建议接入 LLM judge 升级 `human_taste` 维度（目前固定 80）。
3. `npm run prompts:eval` 已注册但未接入 CI，下一步进 GitHub Actions 跑全量 eval 拦截回归。

—— 完
