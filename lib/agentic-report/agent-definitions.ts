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
