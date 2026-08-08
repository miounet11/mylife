/**
 * Client-safe section catalog (no server/LLM imports).
 */

import { CORE_AGENT_KEYS, type CoreAgentKey } from '@/lib/agentic-report/agent-definitions';

export const SECTION_RERUN_CATALOG: Array<{
  key: CoreAgentKey;
  label: string;
  description: string;
}> = [
  { key: 'core_constitution', label: '命局结构', description: '日主强弱、格局与用神表达' },
  { key: 'kline_narrative', label: '人生节奏', description: 'K 线阶段与运势叙事' },
  { key: 'career_wealth', label: '事业财富', description: '事业/财运专章补强' },
  { key: 'relationship_family', label: '关系家庭', description: '婚恋与家庭专章' },
  { key: 'health_lifestyle', label: '健康生活', description: '作息与恢复节奏' },
  { key: 'strategy_advisor', label: '行动策略', description: '优先级与避坑' },
  { key: 'temporal_spatial_advisor', label: '天时地利', description: '窗口与空间建议' },
];

export function isCoreAgentKey(value: string): value is CoreAgentKey {
  return (CORE_AGENT_KEYS as readonly string[]).includes(value);
}

export function normalizeSectionKeys(raw: unknown): CoreAgentKey[] {
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
  const keys = list
    .map((x) => `${x || ''}`.trim())
    .filter(isCoreAgentKey);
  return [...new Set(keys)].slice(0, 3);
}
