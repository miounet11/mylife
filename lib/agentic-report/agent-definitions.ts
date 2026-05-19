export const CORE_AGENT_KEYS = [
  'core_constitution',
  'kline_narrative',
  'career_wealth',
  'relationship_family',
  'health_lifestyle',
  'strategy_advisor',
  'temporal_spatial_advisor',
] as const;

export type CoreAgentKey = (typeof CORE_AGENT_KEYS)[number];

export const GOVERNANCE_KEYS = [
  'consensus_reviewer',
  'repair_executor',
  'verify_engine',
] as const;

/**
 * Agent 依赖图（peer review by Peter @ openclaw + 姚順宇 @ Hermes）。
 *
 * 当前 runtime（run-parallel-agents.ts）是纯并行，无依赖感知。
 * 这份元数据先以 DAG 形式落地，给：
 *   - merge 阶段做一致性检查（下游不能与上游窗口冲突）
 *   - 未来分波调度（wave 1: 解释型 → wave 2: 决策型）
 *   - eval 时把上游结果摘要作为可选 upstream context 注入下游
 *
 * 规则：dependsOn 只能指向 wave 编号更低的 agent。
 *   wave 0：纯解释型，只读引擎真值
 *   wave 1：综合型，可读 wave 0 摘要
 *   wave 2：决策型，可读 wave 0/1 摘要
 */
export const AGENT_DEPENDENCIES: Record<
  CoreAgentKey,
  { wave: 0 | 1 | 2; dependsOn: CoreAgentKey[]; role: 'interpret' | 'synthesize' | 'decide' }
> = {
  core_constitution: { wave: 0, dependsOn: [], role: 'interpret' },
  kline_narrative: { wave: 0, dependsOn: [], role: 'interpret' },
  temporal_spatial_advisor: { wave: 0, dependsOn: [], role: 'interpret' },
  career_wealth: { wave: 1, dependsOn: ['core_constitution', 'kline_narrative', 'temporal_spatial_advisor'], role: 'synthesize' },
  relationship_family: { wave: 1, dependsOn: ['core_constitution', 'kline_narrative'], role: 'synthesize' },
  health_lifestyle: { wave: 1, dependsOn: ['core_constitution', 'temporal_spatial_advisor'], role: 'synthesize' },
  strategy_advisor: { wave: 2, dependsOn: ['kline_narrative', 'career_wealth', 'relationship_family', 'temporal_spatial_advisor'], role: 'decide' },
};

/** 把 agents 按 wave 排序。runtime 暂未启用，但 merge / eval 可用。 */
export function getAgentExecutionWaves(): CoreAgentKey[][] {
  const waves: CoreAgentKey[][] = [[], [], []];
  for (const key of CORE_AGENT_KEYS) {
    waves[AGENT_DEPENDENCIES[key].wave].push(key);
  }
  return waves;
}
