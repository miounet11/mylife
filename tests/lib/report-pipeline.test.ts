import { resolveAnalyzeAgentKeys } from '@/lib/report-pipeline';

describe('report pipeline analyze agent keys', () => {
  it('uses full deterministic expert coverage when agentic llm path is deferred', () => {
    expect(resolveAnalyzeAgentKeys({
      llmUsed: false,
      shouldRunAgentic: false,
    })).toEqual([
      'core_constitution',
      'kline_narrative',
      'career_wealth',
      'relationship_family',
      'health_lifestyle',
      'strategy_advisor',
      'temporal_spatial_advisor',
    ]);
  });

  it('keeps the compact live llm fallback set when agentic execution remains enabled', () => {
    expect(resolveAnalyzeAgentKeys({
      llmUsed: false,
      shouldRunAgentic: true,
    })).toEqual([
      'kline_narrative',
      'strategy_advisor',
    ]);
  });
});
