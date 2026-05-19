import {
  AGENT_DEPENDENCIES,
  CORE_AGENT_KEYS,
  getAgentExecutionWaves,
} from '@/lib/agentic-report/agent-definitions';

describe('agent dependency DAG', () => {
  it('每个 agent 都有依赖元数据', () => {
    for (const key of CORE_AGENT_KEYS) {
      expect(AGENT_DEPENDENCIES[key]).toBeDefined();
    }
  });

  it('dependsOn 只能指向 wave 编号更低的 agent（无环、无逆向）', () => {
    for (const key of CORE_AGENT_KEYS) {
      const meta = AGENT_DEPENDENCIES[key];
      for (const dep of meta.dependsOn) {
        expect(AGENT_DEPENDENCIES[dep].wave).toBeLessThan(meta.wave);
      }
    }
  });

  it('wave 0 全部为 interpret 角色，wave 2 包含 decide 角色', () => {
    const waves = getAgentExecutionWaves();
    for (const k of waves[0]) {
      expect(AGENT_DEPENDENCIES[k].role).toBe('interpret');
    }
    expect(waves[2].some((k) => AGENT_DEPENDENCIES[k].role === 'decide')).toBe(true);
  });

  it('strategy_advisor 必须依赖 kline_narrative（决策必须看 K 线窗口）', () => {
    expect(AGENT_DEPENDENCIES.strategy_advisor.dependsOn).toContain('kline_narrative');
  });
});
