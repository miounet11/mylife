import type { CoreAgentKey } from '@/lib/agentic-report/agent-definitions';
import type { StructuredAgenticContext } from '@/lib/agentic-report/types';
import { buildPrompt, getPrompt } from '@/lib/prompts';
// 触发新 spec 注册（已全量迁移到 lib/prompts/agentic/*）
import '@/lib/prompts/agentic/core-constitution';
import '@/lib/prompts/agentic/kline-narrative';
import '@/lib/prompts/agentic/career-wealth';
import '@/lib/prompts/agentic/relationship-family';
import '@/lib/prompts/agentic/health-lifestyle';
import '@/lib/prompts/agentic/strategy-advisor';
import '@/lib/prompts/agentic/temporal-spatial-advisor';

const PROMPT_ID_MAP: Record<CoreAgentKey, Parameters<typeof getPrompt>[0]> = {
  core_constitution: 'agentic.core_constitution',
  kline_narrative: 'agentic.kline_narrative',
  career_wealth: 'agentic.career_wealth',
  relationship_family: 'agentic.relationship_family',
  health_lifestyle: 'agentic.health_lifestyle',
  strategy_advisor: 'agentic.strategy_advisor',
  temporal_spatial_advisor: 'agentic.temporal_spatial_advisor',
};

export function buildAgentPrompt(agentKey: CoreAgentKey, context: StructuredAgenticContext) {
  const newId = PROMPT_ID_MAP[agentKey];
  if (!newId || !getPrompt(newId)) {
    throw new Error(`[buildAgentPrompt] missing registered prompt for ${agentKey} → ${newId}`);
  }
  const built = buildPrompt(newId, context);
  return {
    system: built.system,
    user: built.user,
    temperature: built.temperature,
  };
}
