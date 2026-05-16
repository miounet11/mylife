import { analyzeFortune } from '@/lib/fortune-engine';
import { buildDeterministicFallbackNarrative, finalizeReportForDelivery, resolveAnalyzeAgentKeys, shouldDeferReportLlmForSource, shouldRunAnalyzeAgentic } from '@/lib/report-pipeline';

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

  it('runs live analyze agentic execution when agent-scope provider health is healthy (v5-D2)', () => {
    expect(shouldRunAnalyzeAgentic({
      source: 'analyze',
      llmUsed: true,
      deferredByProviderHealth: false,
      agentScopeHealthDeferred: false,
      agentScopeSnapshotsConservative: false,
    })).toBe(true);
  });

  it('still defers analyze agentic when agent scope is unhealthy', () => {
    expect(shouldRunAnalyzeAgentic({
      source: 'analyze',
      llmUsed: true,
      deferredByProviderHealth: false,
      agentScopeHealthDeferred: true,
      agentScopeSnapshotsConservative: false,
    })).toBe(false);
  });

  it('keeps upgrade agentic enabled when provider health allows it', () => {
    expect(shouldRunAnalyzeAgentic({
      source: 'upgrade',
      llmUsed: false,
      deferredByProviderHealth: false,
      agentScopeHealthDeferred: false,
      agentScopeSnapshotsConservative: false,
    })).toBe(true);
  });

  it('keeps upgrade agentic disabled when agent scope has no runnable models', () => {
    expect(shouldRunAnalyzeAgentic({
      source: 'upgrade',
      llmUsed: false,
      deferredByProviderHealth: false,
      agentScopeHealthDeferred: true,
      agentScopeSnapshotsConservative: true,
    })).toBe(false);
  });

  it('hard-defers first analyze LLM when report scope is conservatively unhealthy', () => {
    expect(shouldDeferReportLlmForSource({
      source: 'analyze',
      providerHealthDeferred: false,
      reportScopeSnapshotsConservative: true,
      hasRunnableModels: true,
    })).toBe(true);
  });

  it('defers upgrade LLM probes when provider health is already weak', () => {
    expect(shouldDeferReportLlmForSource({
      source: 'upgrade',
      providerHealthDeferred: true,
      reportScopeSnapshotsConservative: false,
      hasRunnableModels: true,
    })).toBe(true);
  });

  it('defers upgrade LLM probes when report scope is conservatively unhealthy', () => {
    expect(shouldDeferReportLlmForSource({
      source: 'upgrade',
      providerHealthDeferred: false,
      reportScopeSnapshotsConservative: true,
      hasRunnableModels: true,
    })).toBe(true);
  });

  it('allows upgrade LLM only when report providers are healthy and runnable', () => {
    expect(shouldDeferReportLlmForSource({
      source: 'upgrade',
      providerHealthDeferred: false,
      reportScopeSnapshotsConservative: false,
      hasRunnableModels: true,
    })).toBe(false);
  });

  it('defers upgrade LLM when no report models are runnable', () => {
    expect(shouldDeferReportLlmForSource({
      source: 'upgrade',
      providerHealthDeferred: false,
      reportScopeSnapshotsConservative: false,
      hasRunnableModels: false,
    })).toBe(true);
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

    expect(narrative.summary).toContain('你不是乱');
    expect(narrative.summary).toContain('身弱格');
    expect(narrative.summary).toContain('甲午大运');
    expect(narrative.opening.length).toBeGreaterThan(0);
    expect(narrative.explanation).toContain('世界易判断：');
    expect(narrative.explanation).toContain('已发生的印证：');
    expect(narrative.explanation).toContain('主判断：');
    expect(narrative.explanation).toContain('判断依据：');
    expect(narrative.explanation).toContain('接下来会怎么走：');
    expect(narrative.explanation).toContain('现在先做：');
    expect(narrative.explanation).toContain('风险提醒：');
    expect(narrative.explanation).toContain('先收敛战线，只推进一个最关键项目');
  });

  it('strips placeholder leaks and template tail from focused narrative output', () => {
    const narrative = buildDeterministicFallbackNarrative({
      basic: {
        dayMaster: '辛',
        pillars: [],
      },
      fiveElements: {
        wood: { strength: 12, quality: 'weak', description: '木弱' },
        fire: { strength: 28, quality: 'strong', description: '火旺' },
        earth: { strength: 20, quality: 'medium', description: '土中等' },
        metal: { strength: 24, quality: 'strong', description: '金旺' },
        water: { strength: 16, quality: 'medium', description: '水中等' },
      },
      tenGods: {
        self: '辛',
        output: [],
        input: [],
        control: [],
        controlled: [],
      },
      pattern: {
        type: '身旺格',
        strength: 'strong',
        quality: 'good',
        description: '身旺，宜用火木收敛金气。',
      },
      fortune: {
        currentDaYun: '丙午大运',
        currentLiuNian: '丁未流年',
        interaction: '这份命盘的落地效果会被 macro_cycle 和 geography 放大。涉及土过重的环境或动作，要留出缓冲。',
        nextYear: '明年仍有火土窗口。',
      },
      advice: {
        career: {
          general: '先收敛方向。',
          specific: ['先把资源压到一个主航道'],
          timing: '2027-2027',
          avoid: ['不要同时开两条重资产线'],
          direction: '南方',
          colors: ['红色'],
        },
        wealth: {
          general: '先保留现金流。',
          specific: ['先做轻量验证'],
          timing: '午月',
          direction: '南方',
          colors: ['红色'],
          avoid: ['避免冲动追加'],
        },
        marriage: {
          general: '先稳沟通。',
          specific: ['先减少情绪化对话'],
          timing: '夏季',
          direction: '南方',
          colors: ['红色'],
          avoid: ['不要逼迫对方马上表态'],
        },
        health: {
          general: '先稳作息。',
          specific: ['先把睡眠拉回稳定区间'],
          timing: '近期',
          directions: ['南方'],
          colors: ['红色'],
          avoid: ['避免长期熬夜'],
        },
        colors: ['红色'],
        directions: ['南方'],
        timing: ['午月'],
        yongShen: ['火'],
        jiShen: ['金'],
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
        opening: '细观您的八字，格局清正。命局主轴围绕身旺格展开。',
        summary: '',
        explanation: '当前最优策略不是同时做很多事，而是围绕2027-2027阶段排序动作。天时外部参照中性，结合macro_cycle、solar_terms做解释增强即可。',
      },
    }, {
      openingOverride: '您好，测试用户。从您的八字来看，格局清正。',
      summaryOverride: '当前先收敛主线，不要分散推进。',
      explanationOverride: '身旺但火木为用，当前大运可发力。天时外部参照中性，结合macro_cycle、solar_terms做解释增强即可。',
      strategySummary: '先把资源压到一个主航道，不要同时开两条重资产线。',
      temporalSummary: '2027-2027窗口可推进，但不要因为窗口转暖就一次压满。',
    });

    expect(narrative.opening).not.toContain('格局清正');
    expect(narrative.opening.length).toBeGreaterThan(0);
    expect(narrative.summary).not.toContain('macro_cycle');
    expect(narrative.explanation).not.toContain('solar_terms');
    expect(narrative.explanation).not.toContain('2036-2036');
    expect(narrative.explanation).toContain('2027年前后');
    expect(narrative.explanation).not.toContain('现在先做：现在更适合先做：');
    expect(narrative.explanation).not.toContain('风险提醒：先别做：先别做：');
  });

  it('finalizes first-delivery reports into cleaned user-facing output', () => {
    const finalized = finalizeReportForDelivery({
      basic: {
        dayMaster: '辛',
        pillars: [],
      },
      fiveElements: {
        wood: { strength: 12, quality: 'weak', description: '木弱' },
        fire: { strength: 28, quality: 'strong', description: '火旺' },
        earth: { strength: 20, quality: 'medium', description: '土中等' },
        metal: { strength: 24, quality: 'strong', description: '金旺' },
        water: { strength: 16, quality: 'medium', description: '水中等' },
      },
      tenGods: {
        self: '辛',
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
        currentDaYun: '丁未大运（18-27岁）',
        currentLiuNian: '丙午流年',
        interaction: '天时外部参照中性，结合macro_cycle、solar_terms做解释增强即可。',
        nextYear: '命局主轴围绕身弱格展开。',
      },
      advice: {
        career: {
          general: '事业与财富动作要同时服从命局用神。',
          specific: ['现在更适合先做：先把资源压到一个主航道'],
          timing: '重点窗口放在2027-2027',
          avoid: ['先别做：不要同时开两条重资产线'],
          direction: '南方',
          colors: ['红色'],
        },
        wealth: {
          general: '正财得用，财运以正职工作为主。',
          specific: ['先做轻量验证'],
          timing: '午月',
          direction: '西方',
          colors: ['黄色'],
          avoid: ['避免情绪化追加'],
        },
        marriage: {
          general: '关系板块更看阶段节奏和现实协同。 人和外部参照偏强，可把relationship、family_role作为顺势放大的辅助信号。',
          specific: ['先在2028-2030对应阶段做观察和校准，再推进关键关系决定'],
          timing: '夏季',
          direction: '南方',
          colors: ['红色'],
          avoid: [],
        },
        health: {
          general: '健康不是单独板块，而是决定你能否承接好运窗口的底盘能力。',
          specific: ['先按2016-2018的节奏做恢复和负荷管理'],
          timing: '近期',
          directions: ['东南方'],
          colors: ['红色'],
          avoid: ['高压阶段最容易用透支换效率'],
        },
        colors: ['红色'],
        directions: ['南方'],
        timing: ['近期运势上升'],
        yongShen: ['土'],
        jiShen: ['水'],
        xiShen: ['金'],
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
        opening: '您好，测试用户。从您的八字来看，格局清正。',
        summary: '',
        explanation: '当前最优策略不是同时做很多事，而是围绕2027-2027阶段排序动作。天时外部参照中性，结合macro_cycle、solar_terms做解释增强即可。',
        llmUsed: true,
        verify: {
          consistencyScore: 90,
          verdict: 'WARN',
          failedRules: [],
        },
        orchestration: {
          totalLlmCalls: 0,
          successRate: 0,
          succeeded: [],
          failed: [],
        },
      },
    } as any);

    expect(finalized.analysis.summary).toContain('你不是乱');
    expect(finalized.analysis.explanation).toContain('世界易判断：');
    expect(finalized.analysis.explanation).toContain('已发生的印证：');
    expect(finalized.analysis.explanation).toContain('接下来会怎么走：');
    expect(finalized.analysis.judgmentBlocks?.pastValidation?.headline).toBeTruthy();
    expect(finalized.analysis.judgmentBlocks?.presentDiagnosis?.headline).toBeTruthy();
    expect(finalized.analysis.judgmentBlocks?.futureGuidance?.headline).toBeTruthy();
    expect((finalized.analysis.judgmentBlocks?.futureGuidance?.evidence || []).length).toBeGreaterThan(0);
    expect((finalized.analysis.pastEventTemplates || []).length).toBeGreaterThan(0);
    expect(finalized.analysis.pastEventTemplates?.[0]?.title).toBeTruthy();
    expect(finalized.analysis.pastEventTemplates?.some((item) => item.confidenceLabel === 'high')).toBe(true);
    expect(finalized.analysis.explanation).not.toContain('macro_cycle');
    expect(finalized.analysis.explanation).not.toContain('2027-2027');
    expect(finalized.analysis.qualityAudit?.overallScore).toBeGreaterThan(0);
  });

  it('preserves deterministic engine evidence through final delivery cleanup', () => {
    const base = analyzeFortune('张三', new Date(1990, 5, 15), '14:30', '北京', 8, 'male');
    const finalized = finalizeReportForDelivery(base);
    const evidence = finalized.analysis?.contextSignals?.engineEvidence as any;

    expect(evidence).toBeDefined();
    expect(evidence.version).toBe('engine-evidence-v2');
    expect(evidence.calculationProfile.birthPlace).toBe('北京');
    expect(evidence.scoringBreakdown.fiveElements).toHaveLength(5);
    expect(evidence.fiveElementRanking).toHaveLength(5);
    expect(evidence.measurementResults.map((item: any) => item.id)).toEqual([
      'pillars',
      'five-elements',
      'day-master-strength',
      'pattern',
      'ten-gods',
      'yong-shen',
      'shen-sha',
      'dayun',
      'kline',
      'domain-advice',
    ]);
    expect(evidence.measurementResults.find((item: any) => item.id === 'domain-advice')?.actions.length).toBeGreaterThan(0);
    expect(finalized.analysis?.enhancementNotes?.join('')).toContain('LLM 仅做表达修饰');
  });

  it('does not double-wrap explanation when sections already exist', () => {
    const finalized = finalizeReportForDelivery({
      basic: {
        dayMaster: '辛',
        pillars: [],
      },
      fiveElements: {},
      tenGods: {},
      pattern: {
        type: '身弱格',
        description: '日主偏弱。',
      },
      fortune: {
        currentDaYun: '丁未大运',
        currentLiuNian: '丙午流年',
        interaction: '当前阶段宜守成。',
        nextYear: '明年继续稳步推进。',
      },
      advice: {
        career: {
          general: '先稳节奏。',
          specific: ['先做一个关键动作'],
          timing: '下半年',
          avoid: ['不要硬冲'],
        },
        wealth: {
          general: '先控风险。',
          specific: ['先做轻量验证'],
          timing: '下半年',
          avoid: ['避免重仓'],
        },
        marriage: {
          general: '先稳沟通。',
          specific: ['先观察'],
          timing: '夏季',
        },
        health: {
          general: '先稳作息。',
          specific: ['先补睡眠'],
          timing: '近期',
          avoid: ['避免透支'],
        },
        colors: [],
        directions: [],
        timing: [],
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
        opening: '先稳住主线。',
        summary: '当前先稳住主线，再按窗口推进。',
        explanation: '世界易判断：先看结构，再看阶段，再决定动作\n\n主判断：先稳住主线\n\n判断依据：结构已经明确\n\n现在先做：先做一个关键动作\n\n风险提醒：不要硬冲',
        llmUsed: false,
        orchestration: {
          totalLlmCalls: 0,
          successRate: 0,
          succeeded: [],
          failed: [],
        },
      },
    } as any);

    expect(finalized.analysis.explanation.match(/世界易判断：/g)?.length || 0).toBe(1);
  });

  it('switches failed verification reports into conservative delivery mode', () => {
    const finalized = finalizeReportForDelivery({
      basic: {
        dayMaster: '壬',
        pillars: [],
      },
      fiveElements: {},
      tenGods: {},
      pattern: {
        type: '身弱格',
        description: '日主偏弱。',
      },
      fortune: {
        currentDaYun: '辛酉大运',
        currentLiuNian: '甲辰流年',
        interaction: '当前阶段波动较大。',
        nextYear: '明年仍有变量。',
      },
      advice: {
        career: {
          general: '先收敛。',
          specific: ['直接跳槽', '同时开两条线'],
          timing: '三个月内定方向',
          avoid: ['不要迟疑'],
        },
        wealth: {
          general: '先控风险。',
          specific: ['尽快做大额配置'],
          timing: '本季度内完成',
          avoid: ['不要错过窗口'],
        },
        marriage: {
          general: '尽快推进。',
          specific: ['立刻确定关系'],
          timing: '立刻推进',
        },
        health: {
          general: '先稳住。',
          specific: ['快速恢复后马上重启'],
          timing: '下周前',
          avoid: ['不要停下来'],
        },
        colors: [],
        directions: [],
        timing: ['立刻推进'],
      },
      evidence: {
        statistics: { totalSamples: 1, similarCases: 1, successRate: 1, averageIncome: '0', averageAge: 30 },
        celebrities: [],
        similarCases: [],
      },
      analysis: {
        opening: '当前窗口已经到了。',
        summary: '现在就该做决定。',
        explanation: '原始解释文本。',
        llmUsed: true,
        verify: {
          consistencyScore: 58,
          verdict: 'FAIL',
          failedRules: ['best_window_alignment', 'liunian_alignment'],
        },
        qualityAudit: {
          status: 'retry',
          deliveryTier: 'basic',
        },
        orchestration: {
          totalLlmCalls: 5,
          successRate: 0.2,
          succeeded: ['a'],
          failed: ['b', 'c'],
        },
      },
    } as any);

    expect(finalized.analysis.reliabilityGuard?.status).toBe('conservative');
    expect(finalized.analysis.reliabilityGuard?.conservativeDelivery).toBe(true);
    expect(finalized.analysis.reliabilityGuard?.summary).toContain('保守交付');
    expect(finalized.analysis.explanation).toContain('先看稳定结构');
    expect(finalized.advice.career.timing).toContain('保守节奏');
    expect(finalized.advice.timing?.[0]).toContain('保守节奏');
  });

  it('keeps strong reports in passed reliability mode', () => {
    const finalized = finalizeReportForDelivery({
      basic: {
        dayMaster: '甲',
        pillars: [{}, {}, {}, {}],
      },
      fiveElements: {
        wood: { strength: 25, quality: 'good', description: '木稳' },
        fire: { strength: 22, quality: 'good', description: '火稳' },
        earth: { strength: 18, quality: 'medium', description: '土中' },
        metal: { strength: 16, quality: 'medium', description: '金中' },
        water: { strength: 19, quality: 'medium', description: '水中' },
      },
      tenGods: {},
      pattern: {
        type: '身和格',
        description: '结构平衡。',
      },
      fortune: {
        currentDaYun: '甲午大运',
        currentLiuNian: '乙巳流年',
        interaction: '当前结构适合稳中推进。',
        nextYear: '下一阶段仍有承接。',
      },
      advice: {
        career: { general: '先稳住主线。', specific: ['先做一个关键动作'], timing: '下半年', avoid: ['不要分散'] },
        wealth: { general: '先控风险。', specific: ['先做小额验证'], timing: '下半年', avoid: ['不要重仓'] },
        marriage: { general: '先稳沟通。', specific: ['先观察'], timing: '夏季' },
        health: { general: '先稳作息。', specific: ['先补睡眠'], timing: '近期', avoid: ['不要透支'] },
        colors: [],
        directions: [],
        timing: [],
      },
      evidence: {
        statistics: { totalSamples: 1, similarCases: 1, successRate: 1, averageIncome: '0', averageAge: 30 },
        celebrities: [],
        similarCases: [],
      },
      analysis: {
        opening: '当前先稳住主线。',
        summary: '先稳主线，再按窗口推进。',
        explanation: '世界易判断：先看结构，再看阶段，再决定动作\n\n主判断：先稳主线\n\n判断依据：结构与时机基本一致\n\n现在先做：先做一个关键动作\n\n风险提醒：不要分散',
        llmUsed: true,
        verify: {
          consistencyScore: 96,
          verdict: 'PASS',
          failedRules: [],
        },
        orchestration: {
          totalLlmCalls: 6,
          successRate: 0.86,
          succeeded: ['a', 'b', 'c'],
          failed: [],
        },
      },
    } as any);

    expect(finalized.analysis.reliabilityGuard?.status).toBe('passed');
    expect(finalized.analysis.reliabilityGuard?.conservativeDelivery).toBe(false);
    expect(finalized.analysis.summary).not.toContain('保守交付');
    expect(finalized.analysis.explanation).toContain('世界易判断：');
  });
});
