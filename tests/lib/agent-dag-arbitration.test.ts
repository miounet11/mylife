/**
 * 验证 P3 DAG 仲裁规则：下游 agent 的 windows.label 必须出现在
 * 引擎窗口 ∪ 其依赖的上游 agent 的 windows.label 中。违反则报 MEDIUM conflict。
 */
import { runReview } from '@/lib/agentic-report/review/run-review';

function makeCtx(): any {
  return {
    engine: {
      constitution: { dayMaster: '甲', strength: 'balanced', yongShen: ['水'], jiShen: ['火'] },
      tenGodsTable: {},
      dayun: { current: '甲辰', windows: [{ label: '甲辰大运', range: '2024-2034' }] },
      kline: {
        anchorPoints: [{ year: 2028, score: 70, label: '转折' }],
        windows: [{ label: '2028 春', score: 80 }],
      },
    },
    context: {
      temporal: { currentLiuNian: '丙午', currentSolarTerm: '立夏' },
      macroCycles: { industryCycle: [{ industry: 'AI', phase: 'up' }] },
      geoClimate: { currentPlace: '杭州', birthPlace: '杭州' },
      spatialFactors: { favorableDirections: ['东'] },
      humanFactors: { householdSummary: '' },
      worldState: {},
    },
  };
}

describe('runReview · P3 DAG 仲裁规则', () => {
  it('下游 strategy_advisor 输出引擎+上游均没有的窗口 label 时，应报 DAG mismatch', () => {
    const ctx = makeCtx();
    const agentResults: Record<string, unknown> = {
      core_constitution: { summary: 's', highlights: [], windows: [] },
      kline_narrative: { summary: '2028 春', highlights: [], windows: [{ label: '2028 春' }] },
      temporal_spatial_advisor: { summary: '立夏 杭州 东 AI 丙午', highlights: [], windows: [] },
      career_wealth: { summary: 'AI', highlights: [], windows: [] },
      relationship_family: { summary: 's', highlights: [], windows: [] },
      health_lifestyle: { summary: 's', highlights: [], windows: [] },
      strategy_advisor: {
        summary: '2028 春 丙午',
        highlights: [],
        // "2030 秋" 既不在引擎窗口，也不在上游 kline/career/relationship/temporal_spatial 的 windows 里
        windows: [{ label: '2030 秋' }],
      },
    };
    const result = runReview(ctx, agentResults);
    const ids = result.conflicts.map((c) => c.id);
    expect(ids).toContain('conflict_dag_window_mismatch_strategy_advisor');
  });

  it('当下游窗口出现在上游某个 agent 的 windows 中时，DAG 仲裁不报错（被上游兜底）', () => {
    const ctx = makeCtx();
    const agentResults: Record<string, unknown> = {
      core_constitution: { summary: 's', highlights: [], windows: [] },
      kline_narrative: {
        summary: '2030 秋 2028 春',
        highlights: [],
        // 上游 kline 已经声明了 "2030 秋"
        windows: [{ label: '2030 秋' }, { label: '2028 春' }],
      },
      temporal_spatial_advisor: { summary: '立夏 杭州 东 AI 丙午', highlights: [], windows: [] },
      career_wealth: { summary: 'AI', highlights: [], windows: [] },
      relationship_family: { summary: 's', highlights: [], windows: [] },
      health_lifestyle: { summary: 's', highlights: [], windows: [] },
      strategy_advisor: {
        summary: '2030 秋 2028 春 丙午',
        highlights: [],
        windows: [{ label: '2030 秋' }],
      },
    };
    const result = runReview(ctx, agentResults);
    const ids = result.conflicts.map((c) => c.id);
    expect(ids).not.toContain('conflict_dag_window_mismatch_strategy_advisor');
  });

  it('wave 0 agent 不参与 DAG 下游仲裁（没有 dependsOn）', () => {
    const ctx = makeCtx();
    const agentResults: Record<string, unknown> = {
      core_constitution: { summary: 's', highlights: [], windows: [{ label: '虚构窗口' }] },
      kline_narrative: { summary: '2028 春', highlights: [], windows: [{ label: '2028 春' }] },
      temporal_spatial_advisor: { summary: '立夏 杭州 东 AI 丙午', highlights: [], windows: [] },
      career_wealth: { summary: 'AI', highlights: [], windows: [] },
      relationship_family: { summary: 's', highlights: [], windows: [] },
      health_lifestyle: { summary: 's', highlights: [], windows: [] },
      strategy_advisor: { summary: '2028 春 丙午', highlights: [], windows: [{ label: '2028 春' }] },
    };
    const result = runReview(ctx, agentResults);
    const ids = result.conflicts.map((c) => c.id);
    // wave 0 的 core_constitution 不会触发 DAG 仲裁规则
    expect(ids).not.toContain('conflict_dag_window_mismatch_core_constitution');
  });
});
