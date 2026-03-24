import { buildDeterministicFallbackNarrative, resolveAnalyzeAgentKeys } from '@/lib/report-pipeline';

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

  it('builds a focused fallback narrative when llm enhancement is unavailable', () => {
    const narrative = buildDeterministicFallbackNarrative({
      basic: {
        dayMaster: '丙',
        pillars: [],
      },
      fiveElements: {
        wood: { strength: 20, quality: 'medium', description: '木中等' },
        fire: { strength: 28, quality: 'strong', description: '火旺' },
        earth: { strength: 18, quality: 'medium', description: '土中等' },
        metal: { strength: 16, quality: 'medium', description: '金中等' },
        water: { strength: 18, quality: 'medium', description: '水中等' },
      },
      tenGods: {
        self: '丙',
        output: [],
        input: [],
        control: [],
        controlled: [],
      },
      pattern: {
        type: '身弱格',
        strength: 'medium',
        quality: 'good',
        description: '日主偏弱，宜先扶身再谈放大。',
      },
      fortune: {
        currentDaYun: '甲午大运',
        currentLiuNian: '丙午流年',
        interaction: '大运和流年火势抬头，适合先试探再放大。',
        nextYear: '明年继续偏暖',
      },
      advice: {
        career: {
          general: '先稳节奏。',
          specific: ['先收敛战线，只推进一个最关键项目'],
          timing: '农历四月到六月',
          avoid: ['不要同时开三条新战线'],
          direction: '南方',
          colors: ['红色'],
        },
        wealth: {
          general: '先控风险。',
          specific: ['先做小额验证，再决定是否追加'],
          timing: '午月',
          direction: '南方',
          colors: ['红色'],
          avoid: ['避免情绪化追加投入'],
        },
        marriage: {
          general: '先看互动质量。',
          specific: ['先减少高压对话'],
          timing: '夏季',
          direction: '南方',
          colors: ['红色'],
        },
        health: {
          general: '先减负。',
          specific: ['先把睡眠和作息拉回稳定区间'],
          timing: '近期',
          directions: ['南方'],
          colors: ['红色'],
          avoid: ['避免持续熬夜'],
        },
        colors: ['红色'],
        directions: ['南方'],
        timing: ['午月更顺'],
        yongShen: ['火'],
        jiShen: ['水'],
        xiShen: ['木'],
      },
      evidence: {
        statistics: {
          totalSamples: 1,
          similarCases: 1,
          successRate: 1,
          averageIncome: '0',
          averageAge: 30,
        },
        celebrities: [],
        similarCases: [],
      },
      analysis: {
        opening: '当前更适合先聚焦主线。',
        summary: '',
        explanation: '旧版说明',
      },
    }, {
      coreSummary: '日主偏弱，先扶身再放大更稳。',
      strategySummary: '先收敛战线，再把资源压到一个最有把握的方向。',
      temporalSummary: '火旺窗口更有利，但不要因为窗口变好就一次性压满。',
    });

    expect(narrative.summary).toContain('身弱格');
    expect(narrative.summary).toContain('甲午大运');
    expect(narrative.explanation).toContain('主判断：');
    expect(narrative.explanation).toContain('判断依据：');
    expect(narrative.explanation).toContain('现在先做：');
    expect(narrative.explanation).toContain('风险提醒：');
    expect(narrative.explanation).toContain('先收敛战线，只推进一个最关键项目');
  });
});
