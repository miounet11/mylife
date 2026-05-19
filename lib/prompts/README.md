# lib/prompts

提示词中央仓库。按"角色—任务—输入—约束—输出"五段式管理所有送给 LLM 的提示词。

## 目录

```
lib/prompts/
  README.md              本文件
  types.ts               PromptSpec / PromptModule / EvalCase 类型
  registry.ts            id → PromptSpec 注册表，所有运行时引用都走这里
  shared/
    world-yi.ts          世界易判断方法 / 反模式 / 风格校准（从 lib/world-yi-doctrine.ts 迁移）
  analyze/
    structure.system.ts  P1 测算·结构化草案 system（占位）
    structure.user.ts    P2 测算·结构化草案 user（占位）
    narrative.system.ts  P3 测算·叙事补强 system（占位）
    narrative.user.ts    P4 测算·叙事补强 user（占位）
  agentic/
    core-constitution.ts        七路专家 P5 拆开后逐个落位（占位）
    kline-narrative.ts
    career-wealth.ts
    relationship-family.ts
    health-lifestyle.ts
    strategy-advisor.ts
    temporal-spatial-advisor.ts
  chat/
    main.system.ts       P7 Chat 主 system（占位）
    intents/             P8 六个 intent 子 prompt（占位）
  eval/
    cases/               golden set（每条 .json：输入 + 期望片段 + 反模式）
    scorers.ts           5 维评分器：completeness / evidence / anti_pattern / engine_consistency / taste
```

## 迁移原则

1. **小步可回滚**：每次只迁一个 prompt，迁完跑 `npm run prompts:eval` 看分数移动。
2. **registry 是唯一入口**：业务代码不再直接拼字符串，全部 `getPrompt(id)` 拿规范化对象。
3. **保留 legacy 出口**：未迁移完之前，老的 `buildXxxPrompt` 函数继续工作。
4. **每个 PromptSpec 必须带 version 字段**：迁移即 bump，方便 diff。

## 5 维评分

| 维度 | 权重 | 计算 |
|---|---|---|
| structure_completeness | 0.2 | 必填字段命中率 |
| evidence_density | 0.2 | 带证据判断 / 总判断 |
| anti_pattern_hit | 0.15 | 命中黑名单次数（取反） |
| engine_consistency | 0.3 | 与 fortune-engine 真值的字段一致率 |
| human_taste | 0.15 | 盲评 1-5（可选，默认走 LLM judge） |
