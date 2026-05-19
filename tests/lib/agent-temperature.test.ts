/**
 * P2 温度按 role 归档：
 *   interpret (wave 0) → 0.4（解释引擎真值，要稳）
 *   synthesize (wave 1) → 0.5（合成多层信息，需要表达力）
 *   decide (wave 2) → 0.45（决策层，介于稳与犀利之间）
 */
import { dumpPrompt } from '@/lib/prompts';
import { AGENT_DEPENDENCIES, CORE_AGENT_KEYS } from '@/lib/agentic-report/agent-definitions';
import '@/lib/prompts/agentic/core-constitution';
import '@/lib/prompts/agentic/kline-narrative';
import '@/lib/prompts/agentic/career-wealth';
import '@/lib/prompts/agentic/relationship-family';
import '@/lib/prompts/agentic/health-lifestyle';
import '@/lib/prompts/agentic/strategy-advisor';
import '@/lib/prompts/agentic/temporal-spatial-advisor';

const ID_MAP: Record<string, string> = {
  core_constitution: 'agentic.core_constitution',
  kline_narrative: 'agentic.kline_narrative',
  career_wealth: 'agentic.career_wealth',
  relationship_family: 'agentic.relationship_family',
  health_lifestyle: 'agentic.health_lifestyle',
  strategy_advisor: 'agentic.strategy_advisor',
  temporal_spatial_advisor: 'agentic.temporal_spatial_advisor',
};

const EXPECTED: Record<'interpret' | 'synthesize' | 'decide', number> = {
  interpret: 0.4,
  synthesize: 0.5,
  decide: 0.45,
};

describe('agent temperature 按 role 归档', () => {
  for (const key of CORE_AGENT_KEYS) {
    const role = AGENT_DEPENDENCIES[key].role;
    const expected = EXPECTED[role];
    it(`${key} (${role}) 的 temperature 应为 ${expected}`, () => {
      const spec = dumpPrompt(ID_MAP[key] as any);
      expect(spec?.temperature).toBe(expected);
    });
  }
});
