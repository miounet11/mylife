# Life Kline V3 Agent Report Upgrade Plan

## 1. 目标

这次升级不是继续堆一层“更长的文案”，而是把当前报告生产链路升级为真正的 V3 体系：

`确定性命理引擎 -> 并发专业 Agent -> Review -> Repair -> Verify -> 版本化报告 -> 可升级重算`

核心目标只有四个：

1. 引擎结论成为唯一 Ground Truth，LLM 不能覆盖底层事实。
2. 报告内容从“单次补全文案”升级为“多专家并发补强后的完整报告”。
3. 人生 K 线从展示附属物升级为整份报告的主轴对象。
4. 每份报告必须可追踪版本、可升级、可验证、可解释。

---

## 2. 当前现状与核心问题

### 2.1 当前仓库已经具备的基础

当前项目并不是从零开始，已经有可复用资产：

- `lib/fortune-engine.ts`
  - 能生成四柱、十神、用神、格局、大运、神煞、K 线基础数据。
- `lib/report-pipeline.ts`
  - 已有 `reportVersion`、`engineBuilds`、`generatedFrom`、`upgradedFromVersion` 等版本字段。
- `lib/llm.ts`
  - 已支持一次 LLM 深度解析，但仍属于单次调用模式。
- `app/api/analyze/route.ts`
  - 当前分析入口已经接入版本化报告生成。
- `app/api/fortune/[id]/route.ts`
  - 已支持升级重算。
- `app/result/[id]/page.tsx`
  - 已有结果聚合层和引擎版本展示面板。
- `lib/report-v2.ts`
  - 已有大量展示派生能力，如 scenario views、monthly windows、playbook、roadmap。

### 2.2 当前真正的问题

用户指出的问题是准确的。现在的报告质量瓶颈不是前端块不够多，而是生产链路还停留在：

`fortune-engine + optional single LLM enhancement + report-v2 display derivation`

这导致四个问题：

1. 没有真正的并发 Agent 编排。
2. 没有 reviewer / repair / verify 闭环。
3. K 线与 narrative 没有形成单一事实源。
4. LLM 强化不是“专家协同生产”，而是“单次润色式补写”。

结论：当前版本已经具备“版本化报告”和“升级重算”的雏形，但还不是用户期待的“世界级报告引擎”。

---

## 3. 参考 `/home/mylifek` 的关键结论

这次升级不是照搬，但 `/home/mylifek` 已经验证了几个关键方向是对的。

### 3.1 已确认的设计原则

来自以下参考：

- `/home/mylifek/docs/SUBAGENTS_GUIDE.md`
- `/home/mylifek/docs/v3_engine_alignment_spec.md`
- `/home/mylifek/docs/v3_manus_mechanisms_and_architecture.md`
- `/home/mylifek/MASTER_IMPROVEMENT_PLAN.md`
- `/home/mylifek/server/agentPrompts.js`
- `/home/mylifek/server/prompt.js`
- `/home/mylifek/server/promptModuleInjector.js`
- `/home/mylifek/server/llmService.js`
- `/home/mylifek/server/engine/manus/prompts/reviewerPrompts.js`
- `/home/mylifek/server/engine/manus/README.md`

### 3.2 必须吸收的经验

1. **Engine Ground Truth 不可被 Agent 覆盖**
   - 日主强弱
   - 用神 / 忌神
   - 十神映射
   - 大运起点与阶段
   - K 线 anchor points / score / 趋势

2. **Prompt 必须做模块化注入**
   - 基础系统提示
   - 引擎计算出的硬事实
   - 十神对照表
   - K 线锚点与阶段窗口
   - 风格约束
   - 约束重跑指令

3. **Reviewer 必须是低温、结构化、规则优先**
   - reviewer 不是写内容，而是找冲突、给修复计划、产出 patch。
   - `/home/mylifek/server/engine/manus/prompts/reviewerPrompts.js` 已经把 `conflicts / repair_plan / patches / consistency_score` 结构定义清楚。

4. **闭环必须预算受控**
   - `MAX_REPAIR_ROUNDS = 1`
   - `MAX_RERUN_AGENTS = 2`
   - `MAX_EXTRA_LLM_CALLS = 3`
   - `LOOP_BUDGET_MS = 4500`

5. **首屏不应被闭环阻塞**
   - 先产出首版报告主体。
   - 再在后台完成 review / repair / verify。
   - 最终结果写回数据库并在前端增量呈现。

---

## 4. V3 的总体架构

### 4.1 新的 canonical pipeline

V3 统一为：

`Engine Facts`
-> `Context Signal Engine`
-> `Prompt Context Builder`
-> `Parallel Specialist Agents`
-> `Consensus Reviewer`
-> `Repair Executor`
-> `Verify Engine`
-> `Report Composer`
-> `Versioned Persistence`
-> `Upgradeable Delivery`

### 4.2 分层原则

整份报告必须分成四层：

#### A. `engine`

确定性真相层，只能来自算法：

- `constitution`
- `pillars`
- `tenGodsTable`
- `pattern`
- `dayun`
- `shenSha`
- `kline`
- `timeWindows`
- `derivedFacts`

#### B. `context`

天地人上下文层，负责把“个人命局”放进“当下时空环境”中解释：

- `solarTerms`
- `lichunBoundary`
- `macroCycles`
- `nationalCycle`
- `industryCycle`
- `geoClimate`
- `spatialFactors`
- `temporalFrame`

这一层不改命盘事实，只负责回答“同一命局在什么时空条件下更适合怎样落地”。

#### C. `agents`

并发专家解释层，只能解释、展开、建议、叙事，不能改写 `engine`。

#### D. `loop`

闭环治理层：

- `conflicts`
- `repairPlan`
- `patches`
- `rerunResults`
- `verify`
- `auditTrail`

---

## 5. Ground Truth 规范

V3 先要统一一个不可变输入对象，建议新增：

`lib/agentic-report/types.ts`

建议核心结构：

```ts
export interface EngineGroundTruth {
  version: string;
  generatedAt: string;
  constitution: {
    dayMaster: string;
    strength: 'strong' | 'weak' | 'follow' | 'balanced';
    patternType: string;
    yongShen: string[];
    xiShen: string[];
    jiShen: string[];
    seasonContext: string;
  };
  pillars: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  tenGodsTable: Array<{
    pillar: 'year' | 'month' | 'day' | 'hour';
    stem: string;
    branch: string;
    stemShiShen?: string;
    hiddenShiShen?: string[];
  }>;
  dayun: {
    startAge: number;
    direction: 'forward' | 'backward';
    currentDayun?: string;
    currentRange?: string;
    windows: Array<{
      label: string;
      startAge: number;
      endAge: number;
      ganZhi: string;
      quality?: string;
    }>;
  };
  shenSha: {
    list: Array<{ name: string; pillar?: string; impact: 'positive' | 'negative' | 'neutral' }>;
  };
  kline: {
    version: string;
    points: Array<{
      year: number;
      age: number;
      score: number;
      open?: number;
      close?: number;
      high?: number;
      low?: number;
      career?: number;
      wealth?: number;
      marriage?: number;
      health?: number;
      reason: string;
    }>;
    anchorPoints: Array<{
      year: number;
      age: number;
      score: number;
      type: 'peak' | 'trough' | 'turning' | 'stable';
      reason: string;
    }>;
  };
  timeWindows: {
    career: Array<{ startYear: number; endYear: number; label: string; score: number }>;
    wealth: Array<{ startYear: number; endYear: number; label: string; score: number }>;
    relationship: Array<{ startYear: number; endYear: number; label: string; score: number }>;
    health: Array<{ startYear: number; endYear: number; label: string; score: number }>;
  };
}
```

### 5.1 明确禁止 Agent 覆盖的字段

以下字段只能引用，不能改写：

- `constitution.strength`
- `constitution.yongShen / jiShen`
- `tenGodsTable`
- `dayun.windows`
- `kline.points`
- `kline.anchorPoints`

任何 Agent 如果与这些字段冲突，默认判定 Agent 错，不做“折中解释”。

### 5.2 天时地利人和 Context Signal Pack

V3 需要新增一个独立的上下文对象：

`lib/agentic-report/build-context-signals.ts`

建议结构：

```ts
export interface ContextSignalPack {
  version: string;
  generatedAt: string;
  temporal: {
    currentDate: string;
    currentYear: number;
    currentMonth: number;
    currentSolarTerm?: string;
    nextSolarTerm?: string;
    isBeforeLichun: boolean;
    currentLunarYear?: string;
    currentLiuNian?: string;
    currentDaYun?: string;
    currentPhaseLabel?: string;
  };
  macroCycles: {
    nationalCycle?: {
      label: string;
      direction: 'supportive' | 'neutral' | 'pressured';
      reason: string;
    };
    economicCycle?: {
      label: string;
      direction: 'expansion' | 'transition' | 'contraction';
      reason: string;
    };
    industryCycle?: Array<{
      industry: string;
      direction: 'up' | 'flat' | 'down';
      confidence: number;
      reason: string;
    }>;
  };
  geoClimate: {
    birthPlace?: string;
    currentPlace?: string;
    targetPlaces?: string[];
    climateBias?: string[];
    geographyPreference?: string[];
    cityEnergyTags?: string[];
  };
  spatialFactors: {
    favorableDirections: string[];
    unfavorableDirections: string[];
    movementAdvice?: string[];
    environmentAdvice?: string[];
  };
  humanFactors: {
    lifeStage: 'early' | 'rising' | 'prime' | 'transition' | 'later';
    relationshipFocus?: string;
    familyRolePressure?: string[];
    collaborationMode?: string[];
  };
}
```

### 5.3 这层上下文解决什么问题

这层不是装饰，而是解决当前方案缺失的五个维度：

1. `天时`
   - 当前流年、流月、节气、立春边界是否改变判断口径。

2. `地利`
   - 出生地、常住地、迁移方向、气候环境、城市属性是否与命局喜忌匹配。

3. `人和`
   - 当前人生阶段、角色压力、合作结构、家庭约束是否影响同一策略的适用性。

4. `大势`
   - 国运、政策周期、经济周期、行业周期是否支持某类事业和财富动作。

5. `空间时间`
   - 同一命盘不只回答“你是什么结构”，还要回答“你此刻在哪里、处于什么周期、最适合做什么动作”。

---

## 6. Agent 体系设计

V3 不建议一开始就上 10 个以上用户可见 Agent。先做 7 个核心专家 Agent + 3 个治理模块。

### 6.1 用户可见的 7 个并发 Agent

#### 1. `core_constitution`

职责：

- 解释命局底盘
- 输出性格、优势、风险、主基调
- 给出“这是什么命”的核心答案

输入重点：

- constitution
- pillars
- tenGodsTable
- pattern
- shenSha

禁止：

- 不允许重判日主强弱
- 不允许重新发明用神

#### 2. `kline_narrative`

职责：

- 把人生 K 线讲透
- 输出峰值、低谷、拐点、阶段主题
- 每个关键窗口给出成因和建议

输入重点：

- kline.points
- kline.anchorPoints
- dayun.windows
- timeWindows

这是 V3 的核心 Agent，不再把 K 线当配图说明。

#### 3. `career_wealth`

职责：

- 事业路径
- 财富获取方式
- 风险偏好和资金管理
- 决策窗口

输入重点：

- constitution.yongShen / jiShen
- kline career / wealth 维度
- dayun windows

输出必须和 K 线窗口对齐。

#### 4. `relationship_family`

职责：

- 婚恋关系
- 家庭互动
- 合作关系边界
- 关系修复方式

输入重点：

- tenGods
- pillars relationships
- marriage / family windows
- kline relationship dimension

#### 5. `health_lifestyle`

职责：

- 体质倾向
- 压力阶段
- 作息与生活方式建议
- 健康风险提醒

输入重点：

- constitution
- shenSha
- kline health dimension
- stress windows

#### 6. `strategy_advisor`

职责：

- 把前面五个 Agent 收束成可执行决策
- 输出未来 1-3 年行动建议
- 形成用户可直接理解的“下一步”

输入重点：

- 前五个 Agent 摘要
- 当前大运 / 流年
- 未来 36 个月窗口

#### 7. `temporal_spatial_advisor`

职责：

- 把天时地利人和转化成可执行落地建议
- 解释“为什么同一命局在不同城市、行业、阶段的结果会不同”
- 输出迁移、布局、行业选择、节奏选择的优先级

输入重点：

- `ContextSignalPack`
- `constitution`
- `kline.windows`
- `currentDayun / currentLiuNian`

这个 Agent 负责把大流年、立春、国运、行业运、产业运、地理位置运、气候、空间、时间全部真正接入报告。

### 6.2 治理型 3 个 Agent / 模块

#### 1. `consensus_reviewer`

输出：

- `conflicts`
- `repairPlan`
- `patches`
- `consistencyScore`

#### 2. `repair_executor`

执行：

- 应用 patch
- 十神自动纠错
- 约束重跑最多 2 个 Agent

#### 3. `verify_engine`

最终校验：

- K 线趋势一致性
- 五行一致性
- 十神准确性
- 时间窗口一致性
- 报告结构完整性

---

## 7. Prompt 设计升级

### 7.1 当前 `lib/llm.ts` 的问题

当前只有一个大 prompt，问题很明显：

1. 输入对象过大但没有分层。
2. 没有 immutable facts / mutable narrative 的边界。
3. 没有 agent 专业分工。
4. 没有 reviewer / rerun / style normalization prompt。
5. 仍是“整份报告一次性生成”，命中率与一致性不可控。
6. 没有把节气、立春、地理气候、行业周期这类时空上下文做成标准化注入。

### 7.2 V3 Prompt Pack 原则

建议新增目录：

```txt
lib/agentic-report/
  prompts/
    system/
    agents/
    review/
    rerun/
    style/
```

每个 Agent Prompt 都必须由 4 段组成：

1. `system expertise`
2. `engine immutable facts`
3. `agent-specific task`
4. `output schema`

### 7.3 Prompt 注入方式

借鉴 `/home/mylifek/server/promptModuleInjector.js` 的思路，但在当前仓库中做成真正可用实现：

- `injectConstitution()`
- `injectShiShenTable()`
- `injectKlineAnchors()`
- `injectDayunWindows()`
- `injectShenShaContext()`
- `injectSolarTermContext()`
- `injectLichunBoundary()`
- `injectNationalCycle()`
- `injectIndustryCycle()`
- `injectGeoClimateContext()`
- `injectSpatialAdviceFrame()`
- `injectToneGuide()`
- `injectRerunConstraints()`

### 7.4 温度分层

建议固定配置：

- `core_constitution`: `0.45`
- `kline_narrative`: `0.55`
- `career_wealth`: `0.55`
- `relationship_family`: `0.55`
- `health_lifestyle`: `0.45`
- `strategy_advisor`: `0.5`
- `consensus_reviewer`: `0.2 ~ 0.3`
- `style_normalizer`: `0.35`

原则：写报告的 Agent 可以适度有表现力，审查和修复必须低温。

---

## 8. Review / Repair / Verify 闭环

### 8.1 Conflict types

V3 第一阶段先落地 11 类冲突，基本覆盖核心问题：

1. `STRENGTH_MISMATCH`
2. `ELEMENT_MISMATCH`
3. `SHISHEN_INCONSISTENCY`
4. `KLINE_TREND_MISMATCH`
5. `TIMING_CONFLICT`
6. `RISK_APPETITE_MISMATCH`
7. `PIPELINE_INCONSISTENCY`
8. `STYLE_INCONSISTENCY`
9. `TEMPORAL_CONTEXT_MISMATCH`
10. `GEO_ENVIRONMENT_MISMATCH`
11. `MACRO_CYCLE_MISMATCH`

### 8.2 Repair action types

按成本排序：

1. `APPLY_PATCH`
2. `AUTO_CORRECT_SHISHEN`
3. `NORMALIZE_STYLE`
4. `RERUN_AGENT`

### 8.3 Verify rules

第一阶段必须落地以下规则：

1. `verifyScoreBounds`
   - K 线分数必须在合理边界内。

2. `verifyAnchorTrendConsistency`
   - 低谷年份不能写成大吉。
   - 峰值年份不能写成全面低迷。

3. `verifyElementConsistency`
   - 行业、方位、颜色建议不能和喜用神冲突。

4. `verifyShiShenAccuracy`
   - 十神名称必须与日主和阴阳规则一致。

5. `verifyPipelineConsistency`
   - 报告中的时间窗口、行动建议、K 线锚点必须彼此对应。

6. `verifySectionCompleteness`
   - 报告必须包含核心区块，不能只返回零碎文本。

7. `verifyTemporalContextConsistency`
   - 立春前后、节气切换、当前流年引用必须一致，不能把时间边界说乱。

8. `verifyGeoClimateConsistency`
   - 地理方位、城市环境、气候建议不能和命局喜忌及空间建议冲突。

9. `verifyMacroCycleAlignment`
   - 行业策略、职业建议、扩张收缩动作必须和当前宏观周期标签一致。

### 8.4 闭环预算

建议直接采用保守预算：

```ts
export const LOOP_LIMITS = {
  maxRepairRounds: 1,
  maxRerunAgents: 2,
  maxExtraLlmCalls: 3,
  loopBudgetMs: 4500,
  reviewScoreThreshold: 80,
};
```

---

## 9. 人生 K 线的“完美使用”方案

这是 V3 最重要的升级点。

### 9.1 当前问题

当前 K 线有数据，但没有真正统领报告：

- 引擎生成了一组趋势数据。
- `report-v2.ts` 又在展示层衍生一组场景和窗口。
- narrative 文案没有强制对齐 K 线 anchor。
- 宏观时空条件没有叠加到 K 线上，导致“趋势”只有个人层，没有环境层。

所以用户会感觉“图是图，报告是报告”。

### 9.2 V3 的 K 线角色

人生 K 线必须成为四件事的统一来源：

1. 阶段节奏判断
2. 年份高低点解释
3. 决策窗口排序
4. 报告页面主结构导航

但 V3 里的 K 线不再是纯个人曲线，而是：

`个人命局趋势 x 当前时空环境修正 x 宏观周期适配`

### 9.3 K 线对象升级

建议把 `klineData` 扩充成两层：

```ts
{
  points: [...],        // 全量逐年数据
  anchors: [...],       // 峰值/低谷/拐点
  phases: [...],        // 阶段总结，如 24-33 岁上行期
  windows: [...],       // 未来 12/24/36 个月重要窗口
  overlays: {
    temporal: [...],    // 节气/立春/流月修正
    macro: [...],       // 国运/经济周期/行业周期修正
    geographic: [...],  // 区域/气候/方位修正
  },
  dimensions: {
    career: [...],
    wealth: [...],
    relationship: [...],
    health: [...],
  }
}
```

### 9.4 页面呈现策略

结果页不再只是显示一张折线图，而是围绕 K 线做五层呈现：

1. `总览 K 线`
   - 一生走势 + 关键锚点

2. `阶段拆解`
   - 当前 10 年在哪个阶段
   - 为什么上行 / 下行 / 震荡

3. `重点年份`
   - 峰值年 / 低谷年 / 转折年
   - 每个年份对应 narrative 原因

4. `行动窗口`
   - 未来 12 个月 / 36 个月最值得抓的时间段

5. `时空修正层`
   - 为什么今年同样是上行，但更适合南方、沿海、火木属性行业。
   - 为什么某些窗口虽然个人分数高，但受行业或宏观周期压制，需要改打法。

### 9.5 强约束

任何 Agent 输出中涉及年份、阶段、上行、回撤、机会、风险时，必须引用：

- `anchor year`
- `phase label`
- `window score`

没有对齐 K 线窗口的建议，不允许进入最终报告。

---

## 10. 报告数据结构升级

当前数据库里已有 `analysis`、`klineData`、`reportVersion`，V3 继续扩充，不推翻现有结构。

建议报告记录增加：

```ts
analysis: {
  reportVersion: 'v4-agentic',
  pipelineVersion: 'v4',
  generatedFrom: 'analyze' | 'upgrade',
  upgradedFromVersion?: string,
  llmUsed: boolean,
  agenticUsed: boolean,
  engineBuilds: {
    core: string,
    llm: string,
    kline: string,
    report: string,
    reviewer: string,
    prompts: string,
  },
  orchestration: {
    mode: 'single-llm' | 'parallel-agents',
    agentsRun: string[],
    rerunAgents: string[],
    totalLlmCalls: number,
    durationMs: number,
  },
  verify: {
    consistencyScore: number,
    verdict: 'PASS' | 'WARN' | 'FAIL',
    failedRules: string[],
  },
  contextUsed: {
    solarTerm: boolean,
    lichunBoundary: boolean,
    nationalCycle: boolean,
    industryCycle: boolean,
    geoClimate: boolean,
    spatialFactors: boolean,
  },
  enhancementNotes: string[],
}

contextSignals: {
  temporal?: unknown,
  macroCycles?: unknown,
  geoClimate?: unknown,
  spatialFactors?: unknown,
  humanFactors?: unknown,
}

agentResults: {
  coreConstitution?: unknown,
  klineNarrative?: unknown,
  careerWealth?: unknown,
  relationshipFamily?: unknown,
  healthLifestyle?: unknown,
  strategyAdvisor?: unknown,
  temporalSpatialAdvisor?: unknown,
}

loop: {
  conflicts: unknown[],
  repairPlan?: unknown,
  patches?: unknown,
  rerunResults?: unknown,
  auditTrail?: unknown[],
}
```

---

## 11. 升级重算策略

### 11.1 报告版本命名

建议后续版本明确分层：

- `reportVersion`
  - 报告最终格式版本，如 `v4-agentic`
- `engineBuilds.core`
  - 底层命理引擎版本
- `engineBuilds.kline`
  - K 线算法版本
- `engineBuilds.llm`
  - Agent 提示词与模型策略版本
- `engineBuilds.reviewer`
  - 审查规则版本
- `engineBuilds.prompts`
  - Prompt pack 版本

### 11.2 升级重算行为

当前 `PATCH /api/fortune/[id] { action: 'upgrade' }` 已存在，V3 只需要扩展语义：

- 重新提取 engine ground truth
- 重新构建 context signals
- 重新跑并发 agents
- 重新跑 review / repair / verify
- 写入新 `analysis.verify`
- 保留 `upgradedFromVersion`

### 11.3 用户可见信息

结果页必须清楚展示：

- 当前报告版本
- 本次使用的引擎版本
- 是否启用了并发 Agent
- 一致性评分
- 是否经过升级重算

这样用户看到的是“这份报告为什么更好”，而不是只看到更长的文案。

---

## 12. 技术落地路线

### Phase 1: Ground Truth 标准化

目标：

- 从 `lib/fortune-engine.ts` 输出统一的 `EngineGroundTruth`
- 统一 K 线对象
- 统一时间窗口对象

新增建议：

- `lib/agentic-report/types.ts`
- `lib/agentic-report/build-ground-truth.ts`
- `lib/agentic-report/build-kline-windows.ts`

### Phase 1.5: 天地人 Context Engine

目标：

- 把立春、节气、当前流年、人生阶段接入标准化 context
- 把国运、行业运、产业运做成可注入的宏观周期标签
- 把出生地、常驻地、目标城市、气候、方位做成地理环境信号

新增建议：

- `lib/agentic-report/build-context-signals.ts`
- `lib/agentic-report/context/solar-terms.ts`
- `lib/agentic-report/context/macro-cycles.ts`
- `lib/agentic-report/context/geo-climate.ts`
- `lib/agentic-report/context/spatial-factors.ts`

### Phase 2: Prompt Pack 与 Agent Schema

目标：

- 拆分当前单一 `lib/llm.ts`
- 建立每个 Agent 的输入输出 schema
- 建立 prompt 注入器

新增建议：

- `lib/agentic-report/prompts/agents/*.ts`
- `lib/agentic-report/prompts/review/*.ts`
- `lib/agentic-report/prompt-injector.ts`
- `lib/agentic-report/schemas/*.ts`

### Phase 3: Parallel Agent Orchestrator

目标：

- 让 7 个 Agent 并发运行
- 支持失败兜底与超时控制
- 聚合原始 agent results

新增建议：

- `lib/agentic-report/run-parallel-agents.ts`
- `lib/agentic-report/run-agent.ts`
- `lib/agentic-report/merge-agent-results.ts`

### Phase 4: Review / Repair / Verify

目标：

- 规则优先审查
- 低成本 patch
- 有预算的 selective rerun
- 最终一致性评分

新增建议：

- `lib/agentic-report/review/constants.ts`
- `lib/agentic-report/review/run-review.ts`
- `lib/agentic-report/review/run-repair.ts`
- `lib/agentic-report/review/run-verify.ts`

### Phase 5: Report Composer 与存储

目标：

- 用 `engine + agents + loop` 合成新报告对象
- 与当前数据库兼容
- 支持升级重算

修改建议：

- `lib/report-pipeline.ts`
- `app/api/analyze/route.ts`
- `app/api/fortune/[id]/route.ts`
- `lib/user-types.ts`
- `lib/database.ts`

### Phase 6: 结果页升级

目标：

- 展示 K 线主轴
- 展示一致性评分
- 展示升级重算记录
- 展示 agent 产出的更完整区块

修改建议：

- `app/result/[id]/page.tsx`
- `components/fortune-kline-chart.tsx`
- `components/report-engine-panel.tsx`
- 新增 `components/report/*`

---

## 13. 验收标准

V3 上线前，至少要满足以下标准：

### 内容质量

1. 报告必须比当前版本显著更完整，不再只有泛化总评。
2. 关键区块必须能给出阶段、年份、原因、建议四件事。
3. 人生 K 线必须被贯穿使用，而不是只作为图表展示。
4. 报告必须能够回答“什么时候、在哪里、顺着什么大势做什么事”。

### 一致性

1. 不允许出现喜用神与行业建议冲突。
2. 不允许出现低谷年写成大吉。
3. 不允许出现十神硬错误。
4. 不允许出现行动建议与时间窗口脱节。
5. 不允许出现节气、立春、流年边界的时间错位。
6. 不允许出现地理方位、气候建议与命局喜忌冲突。

### 工程完整性

1. 每份报告都有可读版本号。
2. 每份报告都可升级重算。
3. 每份报告都可看见一致性评分和 verdict。
4. 失败时必须优雅降级到 engine-only 或 partial-agent 模式。
5. 宏观上下文缺失时必须优雅降级，不能阻断个人报告生成。

### 性能

1. 首屏报告骨架不能被闭环完全阻塞。
2. 并发 agent 失败单点不能导致整单失败。
3. repair / verify 要有严格预算控制。

---

## 14. 风险与约束

### 14.1 当前最大风险

1. `lib/llm.ts` 仍是单次调用结构，需要拆分。
2. 当前 `klineData` 数据结构还不够标准化。
3. 当前结果页有大量 `report-v2.ts` 派生逻辑，迁移时要避免重复计算和事实漂移。
4. 如果直接把所有内容都交给 Agent 生成，会重新失去 deterministic control。
5. 国运、行业运、地理气候这类上下文如果没有明确 schema，很容易变成空泛形容词。

### 14.2 必须坚持的边界

1. 先标准化 engine facts，再做 agent 扩展。
2. 先做 rule-based verify，再做 reviewer LLM 补充。
3. 先让 K 线统一 narrative，再继续扩写更多栏目。
4. 任何“更会说”的能力都不能破坏事实一致性。

---

## 15. 对当前仓库的具体迁移建议

### 15.1 保留并增强

- 保留 `lib/fortune-engine.ts` 作为底层事实来源。
- 保留 `lib/report-pipeline.ts` 的版本化思路，但升级为 agentic pipeline。
- 保留 `app/api/fortune/[id]/route.ts` 的升级接口。
- 保留 `app/result/[id]/page.tsx` 的聚合入口。

### 15.2 逐步替换

- 用 `agentic-report` 目录替换当前单体 LLM 增强方式。
- 用 `engine ground truth` 替换散落在结果页里的二次推断。
- 用 `kline anchors + windows` 替换仅靠均值推导的展示派生。

### 15.3 不建议继续堆的方向

- 不建议继续直接在 `lib/llm.ts` 里把 prompt 写得越来越长。
- 不建议继续只在结果页增加块状 UI 来“假装更完整”。
- 不建议继续让 narrative 与 K 线分离。

---

## 16. 第一批开发优先级

如果本计划确认执行，建议按下面顺序推进，而不是同时散乱改动：

1. 标准化 `EngineGroundTruth`
2. 建立 `ContextSignalPack`
3. 把 `klineData` 升级为 `points + anchors + phases + windows + overlays`
4. 拆出 7 个核心 Agent prompt 和 schema
5. 实现并发 agent orchestrator
6. 实现 review / repair / verify
7. 升级报告存储结构
8. 升级结果页展示

---

## 17. 最终定义

V3 成功的标志，不是页面更花，也不是报告更长，而是：

- 同一个命盘，系统能先算出准确的命理事实；
- 再把天时地利人和、国运行业运、地理气候与空间时间条件注入进来；
- 再由多个专家并发把不同维度讲透；
- 再自动发现冲突、修正冲突、验证一致性；
- 最终把人生 K 线真正变成整份报告的主轴；
- 并且每份报告都知道自己是由哪个版本的引擎和哪套 Agent 生成的。

这才是下一阶段要做的“完整闭环产品”。
