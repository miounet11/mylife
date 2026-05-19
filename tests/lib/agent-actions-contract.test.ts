/**
 * 验证 7 个 agent 的 system prompt 都引用了 ACTIONS_CONTRACT 统一契约。
 * actions 字段格式过去各异：career 要"先后关系"、relationship 要"不重复"、
 * temporal_spatial 要"何时/在哪里"。本测试钉死所有 agent 共享同一基础契约。
 */
import { buildPrompt } from '@/lib/prompts';
import { ACTIONS_CONTRACT } from '@/lib/prompts/shared/world-yi';
import { CORE_AGENT_KEYS } from '@/lib/agentic-report/agent-definitions';
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

function fakeCtx(): any {
  return {
    engine: {
      constitution: { dayMaster: '丙', strength: 'weak', yongShen: ['水'], jiShen: ['火'] },
      tenGodsTable: {},
      dayun: { current: '甲辰', windows: [] },
      kline: { anchorPoints: [], windows: [] },
    },
    context: {
      temporal: {},
      macroCycles: {},
      geoClimate: {},
      spatialFactors: {},
      humanFactors: {},
      worldState: {},
    },
  };
}

describe('actions contract is shared across all 7 agents', () => {
  it('ACTIONS_CONTRACT 自身格式：含动词起手、≥2 条、先后关系、时间锚关键词', () => {
    expect(ACTIONS_CONTRACT).toContain('动词起手');
    expect(ACTIONS_CONTRACT).toContain('至少 2 条');
    expect(ACTIONS_CONTRACT).toContain('先后关系');
    expect(ACTIONS_CONTRACT).toContain('时间锚');
  });

  for (const key of CORE_AGENT_KEYS) {
    it(`${key} 的 system prompt 包含 ACTIONS_CONTRACT 关键标记`, () => {
      const built = buildPrompt(ID_MAP[key] as any, fakeCtx());
      expect(built.system).toContain('actions 字段统一契约');
      // 关键约束都应在 system 里出现
      expect(built.system).toContain('动词起手');
      expect(built.system).toContain('先后关系');
    });
  }
});
