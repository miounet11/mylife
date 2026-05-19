# 提示词系统化重构 + Agent 系统审计 — 最终汇总报告

**日期**：2026-05-19
**视角**：Peter（openclaw 创始人）× 姚順宇（Hermes 技术总监）
**交付**：4 轮可回滚改造 · 全量零退化

---

## 一、4 轮总览

| 轮次 | 主题 | 关键产出 | 风险 |
|---|---|---|---|
| 1 | Prompt registry + eval 框架 | PromptSpec 统一入口、五段式（HARD/SOFT/ANTI_PATTERNS）、16 case baseline | 全保留 legacy 回退分支 |
| 2 | Context 精简（Y1） | `buildAgentUserPrompt(strict=true)`，user prompt 平均 **-43.7%** | escape hatch `strict:false` |
| 3 | actions 契约（Y2）/ DAG 仲裁（P3）/ 温度归档（P2） | ACTIONS_CONTRACT、conflict_dag_window_mismatch、role→temperature | 纯增量，老消费方不破坏 |
| 4 | DAG runtime 接入（P1 二阶段） | wave 分波调度 + feature flag `AGENT_DAG_SCHEDULER` | 默认关闭，零行为变化 |

---

## 二、Before vs After 五维打分

### 全量 baseline（16 case）

| Baseline | structure | evidence | anti_pattern | engine | human_taste | **total** |
|---|---|---|---|---|---|---|
| 初版（4 case，第一轮） | 100 | — | 100 | 100 | 80 | **97.0** |
| 11 case（agent 扩 case 前） | 100 | 81.0 | 100 | 100 | 80 | **93.2** |
| **本版 16 case（4 轮完）** | **100** | **86.9** | **100** | **100** | **80** | **94.4** |
| Δ vs 11 case | 0 | **+5.9** | 0 | 0 | 0 | **+1.2** |

> evidence_density 提升来自 5 个新 agent fixture 锚点密度（流年/立春/2028/夏季）。human_taste 仍固定 80（未接 LLM judge，下一刀）。

### 7 个 agent 单 case

| Agent | role | wave | temperature | total | engineTruth |
|---|---|---|---|---|---|
| core_constitution | interpret | 0 | 0.4 | 97 | ✅ |
| kline_narrative | interpret | 0 | 0.4 | 97 | ✅ |
| temporal_spatial_advisor | interpret | 0 | 0.4 | 97 | — |
| career_wealth | synthesize | 1 | 0.5 | 97 | — |
| relationship_family | synthesize | 1 | 0.5 | 87 | — |
| health_lifestyle | synthesize | 1 | 0.5 | 97 | — |
| strategy_advisor | decide | 2 | 0.45 | 97 | — |

**7 agent 均分 95.6**，结构/反模式/引擎一致性全 100。

---

## 三、7 大系统性问题（4 轮闭环）

| # | 问题 | 状态 | 落地 |
|---|---|---|---|
| P1 | 无依赖图 | ✅ | DAG 元数据 + runtime（flag 灰度） |
| P2 | 温度散落 | ✅ | role→{0.4,0.5,0.45} 归档 |
| P3 | 仅 consensus 兜底 | ✅ | conflict_dag_window_mismatch DAG 硬规则 |
| P4 | 无 confidence 通道 | ✅ | BaseAgentOutput.confidence 可选 |
| Y1 | context 全量注入 | ✅ | strict=true，-43.7% |
| Y2 | actions 措辞不统一 | ✅ | ACTIONS_CONTRACT 共享常量 |
| Y3 | eval 覆盖断层 | ✅ | 5 agent 各补 1 case + fixture |

---

## 四、回归验证（最终一跑）

| 项目 | 结果 |
|---|---|
| `npx jest --runInBand tests/lib/ tests/app/api/` | ✅ **124 套件 / 637 测试全过** |
| `npx tsx scripts/prompt-eval.ts --compare baseline-agents.json` | ✅ total 94.4 → 94.4（**零退化**） |
| 五维 diff | 100/86.9/100/100/80 全部 0.0 |
| 新增 6 套测试套（22+ case） | agent-dependencies / agent-input-strict / agent-actions-contract / agent-dag-arbitration / agent-temperature / agent-dag-runtime 全过 |

---

## 五、交付清单（git diff --stat HEAD）

### 修改（核心）

```
app/api/chat/route.ts                      +61/-?    registry 接入 + legacy 兜底
lib/agentic-report/agent-definitions.ts    +36       AGENT_DEPENDENCIES DAG
lib/agentic-report/prompts/agents.ts       +122/-?   spec 拆分迁移
lib/agentic-report/review/run-review.ts    +105      DAG 仲裁规则
lib/agentic-report/run-parallel-agents.ts  +52       runDagAgents + flag 路由
lib/agentic-report/schemas/agents.ts       +11       confidence 可选通道
lib/chat-intent.ts                         +27       registry 接入
lib/env.ts                                 +10       isAgentDagSchedulerEnabled
lib/llm.ts                                 +44       prompt 入口收敛
```

### 新增

```
lib/prompts/                                          PromptSpec registry + 7 个 agent spec + shared
lib/prompts/eval/cases/                               16 个 case
lib/prompts/eval/fixtures/                            对应 fixture
lib/prompts/eval/baselines/baseline-2026-05-19-agents.json
scripts/prompt-eval.ts                                eval 跑器
scripts/measure-prompt-size.ts                        prompt 字符量化
tests/lib/agent-dependencies.test.ts                  DAG 元数据无环
tests/lib/agent-input-strict.test.ts                  strict 节省 ≥30%
tests/lib/agent-actions-contract.test.ts              ACTIONS_CONTRACT 全覆盖
tests/lib/agent-dag-arbitration.test.ts               DAG 仲裁三 case
tests/lib/agent-temperature.test.ts                   role→temperature 7 case
tests/lib/agent-dag-runtime.test.ts                   wave 顺序 + flag 路由
docs/prompt-refactor-report-2026-05-19.md             第一轮报告
docs/agent-system-audit-2026-05-19.md                 4 轮分轮详细报告
docs/final-summary-2026-05-19.md                      本文件
```

### 删除（同期清理）

13 个 `fix-*.js` / `test-*.js` 仓库根目录散落脚本 + `.env.example` + `ecosystem.config.js.bak` + `image.png`，**-1045 行**。

**净变化**：+384 / -1045（不含 lib/prompts/ 新增 registry，约 +2000 行结构化 spec）。

---

## 六、灰度路径与回滚

```
AGENT_DAG_SCHEDULER=0 (默认)  ← 当前 prod 行为
  → dev=1
  → staging=1（24h 看 P50/P95/P99）
  → prod 5% (用户 hash 分流)
  → 25% → 50% → 100%
  → 一周稳定后删 runFlatParallel
```

**回滚成本**：单环境变量切回 0，**无代码回滚**。

---

## 七、下一刀候选（按 ROI）

1. **human_taste 接 LLM judge** —— 把固定 80 变成可演进维度。
2. **DAG runtime staging 灰度** —— 跑 24h 看延迟分布与 conflict_dag_window_mismatch 触发率。
3. **`npm run prompts:eval` 接入 CI** —— PR 自动跑 16 case，total 退化 >0.5 阻断。
4. **lib/world-yi-doctrine.ts 清理** —— 先解耦 lib/llm.ts，再删旧文件。
5. **buildInput-style agent（kline / strategy）走 strict 共享路径** —— 把第二轮节省扩到剩余 2 个 agent。

—— 完
