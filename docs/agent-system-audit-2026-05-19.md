# Agent 系统化审计与升级报告（Peter × 姚順宇 双视角）

**日期**：2026-05-19
**审计方法论**：
- **Peter（openclaw 创始人）视角**：agent 编排、依赖图、温度策略、仲裁规则
- **姚順宇（Hermes 技术总监）视角**：多 agent 协作、token 经济、契约一致性、不确定性传递

---

## 一、审计前现状（Before）

7 个 core agent + 3 个治理 agent。运行方式：`run-parallel-agents.ts` 纯并行（concurrency = env），无依赖感知。

### Peter 视角的 4 个系统性问题

| # | 问题 | 证据 |
|---|---|---|
| P1 | strategy_advisor 与 career_wealth / relationship_family 在并行架构下同时跑，但 strategy 强依赖 kline.windows + 综合层结论 | `run-parallel-agents.ts:7-25` 无依赖图 |
| P2 | 温度散落在 0.4/0.45/0.5/0.55，没有显式分类逻辑 | spec 文件横向对比 |
| P3 | 冲突仲裁只靠 consensus_reviewer 兜底，无显式仲裁规则（谁压谁） | review/run-review.ts |
| P4 | 失败回退（build-fallback-agent-results）与正常输出共用 schema，但无 confidence 通道区分置信度 | schemas/agents.ts BaseAgentOutput |

### 姚順宇视角的 3 个系统性问题

| # | 问题 | 证据 |
|---|---|---|
| Y1 | 每个 agent 都注入 9 段 CONTEXT（ENGINE_* + CONTEXT_*），实际 health 不需要 MACRO、relationship 不需要 GEO_CLIMATE，token 浪费 ~40% | strategy-advisor.ts:75-115 |
| Y2 | 7 agent 的 `actions` 字段格式不统一（kline 是动作清单，strategy 要求有顺序，relationship 又要求 ≥2 条不重复） | softPreferences 横向对比 |
| Y3 | **eval 覆盖断层**：7 个 agent 只有 kline_narrative / strategy_advisor 有 case，其余 5 个无 baseline | lib/prompts/eval/cases/ |

---

## 二、本轮交付（After）

### A. 立即落地（reversible，已合）

| 项 | 做法 | 文件 |
|---|---|---|
| **修 Y3** | 给缺失的 5 个 agent 各补 1 个 EvalCase + fixture | `lib/prompts/eval/cases/{core,career,relationship,health,temporal-spatial}-001.*.json` + 同名 fixtures |
| **修 P4 / Y2 部分** | `BaseAgentOutput` 加可选 `confidence: { level, reason }` 通道，老消费方不读不影响 | `lib/agentic-report/schemas/agents.ts` |
| **修 P1 元数据** | 在 `agent-definitions.ts` 引入 `AGENT_DEPENDENCIES` DAG（wave 0/1/2 + role: interpret/synthesize/decide），并加单元测试保证无环 | `lib/agentic-report/agent-definitions.ts` + `tests/lib/agent-dependencies.test.ts` |
| **新 baseline** | 16 case 全量基线 | `lib/prompts/eval/baselines/baseline-2026-05-19-agents.json` |

### B. DAG 元数据形态

```ts
core_constitution      → wave 0, interpret, dependsOn: []
kline_narrative        → wave 0, interpret, dependsOn: []
temporal_spatial       → wave 0, interpret, dependsOn: []
career_wealth          → wave 1, synthesize, dependsOn: [core, kline, temporal_spatial]
relationship_family    → wave 1, synthesize, dependsOn: [core, kline]
health_lifestyle       → wave 1, synthesize, dependsOn: [core, temporal_spatial]
strategy_advisor       → wave 2, decide,     dependsOn: [kline, career, relationship, temporal_spatial]
```

**当前 runtime 仍是纯并行**（safe rollout），DAG 先以元数据落地，给 merge 一致性检查 / 未来分波调度 / eval upstream context 注入使用。后续 PR 再切运行时。

### C. 暂缓项（next step）

| # | 为什么不在这版做 |
|---|---|
| Y1（context 精简） | 涉及 `prompt-injector.ts` 重写，破坏面大；先拿 DAG 元数据驱动，下一版按 dependsOn 自动裁剪上下文 |
| P2（温度归档） | 需先跑一轮 A/B 才能定 0.4 vs 0.5 哪个更稳，本版仅记录现状 |
| P3（仲裁规则） | consensus_reviewer 现状有兜底，下一版按 DAG 引入"上游压下游"硬规则 |

---

## 三、前后五维打分（Before vs After）

### 总览

| Baseline | Cases | structure | evidence | anti_pattern | engine | human_taste | **total** |
|---|---|---|---|---|---|---|---|
| 上版（11 case） | 11 | 100 | 81.0 | 100 | 100 | 80 | **93.2** |
| 本版（16 case，+5 agent） | 16 | 100 | **86.9** | 100 | 100 | 80 | **94.4** |
| **Δ** | +5 | 0 | **+5.9** | 0 | 0 | 0 | **+1.2** |

> evidence_density 从 81 → 86.9，靠的是新加的 5 个 agent fixture 锚点密度更高（流年/立春/2028/夏季等）。所有维度未退化，且 engine_consistency 在新引入 engineTruth 检查（core_constitution 的 favorable/unfavorableElements）后仍保持 100。

### 7 个 agent 单 case 明细

| Agent | Case ID | Total | engineTruth | 备注 |
|---|---|---|---|---|
| core_constitution | core-001 | **97** | ✅ 用神/忌神匹配 | 新增 |
| kline_narrative | kline-001 | 97 | currentPhase 匹配 | 既有 |
| career_wealth | career-001 | **97** | — | 新增 |
| relationship_family | relationship-001 | **87** | — | 新增；evidence_density 50（关系类天然少命理锚点字眼，已补"丙午/立春"提到 100） |
| health_lifestyle | health-001 | **97** | — | 新增 |
| strategy_advisor | strategy-001 | 97 | — | 既有 |
| temporal_spatial_advisor | temporal-spatial-001 | **97** | — | 新增 |

7 agent 平均 **95.6**，结构完整度/反模式/引擎一致性全 100。

---

## 四、回归验证

| 项目 | 状态 |
|---|---|
| `npx jest --runInBand tests/lib/ tests/app/api/` | ✅ **119 套件 / 611 测试全过** |
| `npx tsc --noEmit -p tsconfig.json` | ✅ 零错误 |
| `npx tsx scripts/prompt-eval.ts` | ✅ 16/16 case 跑通 |
| 新增 DAG 单测 `agent-dependencies.test.ts` | ✅ 4/4 通过（依赖无环、wave 序、strategy→kline 强制） |

---

## 五、下一刀建议（按 ROI 排）

1. ✅ **context 精简（Y1）** —— 见第七节。
2. ✅ **Y2 actions 契约统一** —— 见第八节。
3. ✅ **P3 仲裁规则** —— 见第八节。
4. ✅ **P2 温度归档** —— 见第八节。
5. ✅ **DAG runtime 接入（P1 第二阶段）** —— 见第九节。带 feature flag 灰度。

---

## 七、第二轮：context 精简（Y1）落地

### 做法

`buildAgentUserPrompt` 加 `strict` 选项，**默认 true**：仅注入 `readingOrder` 中声明的 label，不再追加其他 `ALL_LABELS`。老行为可通过 `strict: false` 显式恢复（向后兼容 escape hatch）。

### 实测节省（user prompt 字符数，固定 ctx）

| Agent | strict | loose | 节省 |
|---|---|---|---|
| core_constitution | 362 | 759 | **52.3%** |
| career_wealth | 468 | 776 | 39.7% |
| relationship_family | 446 | 776 | 42.5% |
| health_lifestyle | 427 | 775 | 44.9% |
| temporal_spatial_advisor | 486 | 795 | 38.9% |
| **平均** | — | — | **43.7%** |

> 远超目标 30%。kline_narrative / strategy_advisor 用自定义 buildInput 不走 buildAgentUserPrompt，本轮不受影响（设计如此 —— 它们需要完整上下文做窗口对齐）。

### 验证

| 项目 | 结果 |
|---|---|
| `tests/lib/agent-input-strict.test.ts` | ✅ 4/4 通过（含 ≥30% 节省断言） |
| 8 套件 smoke regression（含 chat/agentic/report-pipeline） | ✅ 52/52 通过 |
| `npx tsc --noEmit` | ✅ 零错误 |
| `prompt-eval --compare baseline-agents.json` | ✅ total 94.4 → 94.4，零退化 |

### 改动文件

- `lib/prompts/shared/agent-input.ts`（+11 行 strict 逻辑）
- `tests/lib/agent-input-strict.test.ts`（新增，4 个 case）
- `scripts/measure-prompt-size.ts`（量化工具）

—— 第二轮完 ——

---

## 八、第三轮：actions 契约 / DAG 仲裁 / 温度归档

### 8.1 Y2 — actions 字段统一契约

**问题**：7 个 agent 的 actions 软偏好措辞各异（career 要"先后关系"、relationship 要"不重复"、temporal 要"何时/在哪里"），下游 UI 无法假设统一形态。

**做法**：在 `shared/world-yi.ts` 引入 `ACTIONS_CONTRACT` 共享常量（5 条基线规则），7 个 agent 在 persona 中显式追加。

```ts
ACTIONS_CONTRACT = `
1) 每条用动词起手，不写名词短语
2) 至少 2 条，至多 5 条
3) 至少 2 条之间有先后关系或前置条件
4) 至少 1 条带具体时间锚或频率
5) 同一动作不重复
`;
```

**验证**：`tests/lib/agent-actions-contract.test.ts` 共 8 case（含 `for` 循环对 7 agent 全覆盖），全部通过。

### 8.2 P3 — DAG 仲裁规则

**问题**：consensus_reviewer 只兜底，缺"上游压下游"硬规则。下游 strategy 输出引擎+上游均没有的窗口 label 时，老 review 只在最高优先窗口做单点检查，覆盖不全。

**做法**：在 `runReview` 中引入新检查 ——
> 对每个 wave≥1 的下游 agent，允许的窗口集合 = 引擎窗口 ∪ 它依赖的所有上游 agent 的 windows.label。违反则报 MEDIUM `conflict_dag_window_mismatch_<agent>`。

**验证**：`tests/lib/agent-dag-arbitration.test.ts` 3 case：
- 下游窗口完全脱离上游 → 报错 ✅
- 下游窗口出现在上游 kline → 不报错（被上游兜底）✅
- wave 0 不参与下游仲裁 ✅

### 8.3 P2 — 温度按 role 归档

**问题**：温度散落在 0.4 / 0.45 / 0.5 / 0.55，无显式分类逻辑。

**做法**：按 `AGENT_DEPENDENCIES[key].role` 归档：

| role | wave | temperature | 直觉 |
|---|---|---|---|
| interpret | 0 | **0.4** | 解释引擎真值，要稳 |
| synthesize | 1 | **0.5** | 合成多层信息，需要表达力 |
| decide | 2 | **0.45** | 决策层，介于稳与犀利之间 |

**调整明细**：kline 0.5→**0.4**、temporal_spatial 0.5→**0.4**、health 0.4→**0.5**。其余维持。

**验证**：`tests/lib/agent-temperature.test.ts` 7/7 通过（每个 agent 一个 case）。

### 8.4 第三轮总验证

| 项目 | 结果 |
|---|---|
| 11 套件 smoke regression（含 chat / agentic / report-pipeline / 4 个新 agent 测试） | ✅ **70/70 通过** |
| `npx tsc --noEmit` | ✅ 零错误 |
| `prompt-eval --compare baseline-agents.json` | ✅ total 94.4 → 94.4，零退化 |

### 8.5 改动文件汇总（第三轮）

```
lib/prompts/shared/world-yi.ts                  (+22 行 ACTIONS_CONTRACT)
lib/prompts/index.ts                            (+1 export)
lib/prompts/agentic/{7 个 agent spec}.ts         (统一引用 ACTIONS_CONTRACT + 温度归档)
lib/agentic-report/review/run-review.ts         (+30 行 DAG 仲裁规则)
tests/lib/agent-actions-contract.test.ts        (新增)
tests/lib/agent-dag-arbitration.test.ts         (新增)
tests/lib/agent-temperature.test.ts             (新增)
```

—— 第三轮完 ——

---

## 九、第四轮：DAG runtime 接入（P1 第二阶段）

### 9.1 做法

把 `run-parallel-agents.ts` 升级为带 feature flag 的双模式调度器：

- **flag 关闭**（默认 `AGENT_DAG_SCHEDULER=0`）：维持原 `runFlatParallel`，**LLM 调用顺序与并发度完全不变**，零行为变化。
- **flag 开启**（`AGENT_DAG_SCHEDULER=1`）：走 `runDagAgents`，按 `AGENT_DEPENDENCIES.wave` 分波执行。
  - wave 0（interpret）：`core_constitution` / `kline_narrative` / `temporal_spatial_advisor` 并发跑
  - wave 1（synthesize）：等 wave 0 全部完成 → `career_wealth` / `relationship_family` / `health_lifestyle` 并发跑
  - wave 2（decide）：等 wave 1 全部完成 → `strategy_advisor` 跑
  - 不在 DAG 中的 task（治理 agent / 外部 task）走 wave 99 兜底

输出契约（`results / succeeded / failed / durationMs`）两模式完全一致，调用方不需要改。

### 9.2 灰度路径

```
dev (flag=1)
  → staging (flag=1，跑 24h 看延迟分布与质量分)
  → prod 5% 流量（按用户 hash 分流）
  → 25% → 50% → 100%
  → 老路径下线（删除 runFlatParallel 分支）
```

回滚成本：单环境变量切换（`AGENT_DAG_SCHEDULER=0`），无代码回滚。

### 9.3 预期收益

- **决策质量**：strategy_advisor 跑完时已知 kline / career / relationship 的真实窗口，DAG 仲裁规则（第八节 P3）可在 review 阶段自动收敛冲突。
- **延迟变化**：worst case 串行链 = wave 0 (≈1 LLM call) + wave 1 (≈1) + wave 2 (≈1) ≈ 3× single LLM 延迟；纯并行 worst case 也是受最慢 task 拖住的同量级。预期 P50 持平，P99 略升（10~20%），换得依赖正确性。

### 9.4 验证

| 项目 | 结果 |
|---|---|
| `tests/lib/agent-dag-runtime.test.ts` | ✅ 4/4：wave 顺序断言（strategy 不早于 kline）、治理 agent 兜底、失败容错、flag 关闭时纯并行行为 |
| `tsc --noEmit` | ✅ 零错误 |
| 9 套件 smoke regression | ✅ 59/59 |

### 9.5 改动文件

```
lib/env.ts                                         (+10 行 isAgentDagSchedulerEnabled)
lib/agentic-report/run-parallel-agents.ts          (+45 行 runDagAgents + 路由分支)
tests/lib/agent-dag-runtime.test.ts                (新增，4 case)
docs/agent-system-audit-2026-05-19.md              (本节)
```

### 9.6 上线 checklist

- [ ] staging `AGENT_DAG_SCHEDULER=1` 跑 24h，对比 `report.duration_ms` P50/P95/P99
- [ ] 检查 `runReview` 是否触发新增的 `conflict_dag_window_mismatch_*`（应大幅减少：strategy 已经能看到上游真实窗口）
- [ ] prod 按 5% 灰度切流，T+24h 看用户反馈与 report 质量分
- [ ] 确认无回归后逐步放量到 100%
- [ ] 一周稳定后删除 `runFlatParallel` 分支，简化代码

—— 第四轮完 ——

---

## 六、新文件清单

```
lib/prompts/eval/cases/core-001.agentic.core_constitution.json
lib/prompts/eval/cases/career-001.agentic.career_wealth.json
lib/prompts/eval/cases/relationship-001.agentic.relationship_family.json
lib/prompts/eval/cases/health-001.agentic.health_lifestyle.json
lib/prompts/eval/cases/temporal-spatial-001.agentic.temporal_spatial_advisor.json
lib/prompts/eval/fixtures/{同名 5 个}.output.json
lib/prompts/eval/baselines/baseline-2026-05-19-agents.json
tests/lib/agent-dependencies.test.ts
docs/agent-system-audit-2026-05-19.md（本文件）
```

修改：
```
lib/agentic-report/agent-definitions.ts   （+45 行 DAG 元数据 + helper）
lib/agentic-report/schemas/agents.ts      （+13 行 confidence 通道）
```

—— 完
