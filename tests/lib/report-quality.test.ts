import { buildReportQualityAudit } from '@/lib/report-quality';

const baseResult = {
  basic: {
    dayMaster: '甲',
    pillars: [{}, {}, {}, {}],
  },
  fiveElements: {
    wood: { strength: 28 },
    fire: { strength: 18 },
    earth: { strength: 10 },
    metal: { strength: 8 },
    water: { strength: 36 },
  },
  tenGods: {},
  pattern: {
    type: '身弱格',
    description: '日主偏弱，宜取印比帮扶。',
  },
  fortune: {
    currentDaYun: '乙亥大运',
    currentLiuNian: '丙午流年',
    interaction: '当前行运偏吉，适合稳中求进并逐步推进关键决策。',
    nextYear: '下一阶段更重视节奏控制。',
  },
  advice: {
    career: {
      general: '事业更适合先积累资源再发力。',
      specific: ['先建能力壁垒', '选择有成长曲线的环境'],
      timing: '下半年更适合主动争取',
      avoid: ['避免高压短线冲刺'],
    },
    wealth: {
      general: '财富以稳健配置为主。',
      specific: ['先控风险', '不宜重仓单点机会'],
      timing: '适合分段配置',
      avoid: ['避免情绪化投资'],
    },
    marriage: {
      general: '关系更看节奏和互动质量。',
      specific: ['先观察再推进'],
      timing: '更适合循序渐进',
    },
    health: {
      general: '健康重在恢复力管理。',
      specific: ['规律睡眠', '控制过劳'],
      timing: '换季时更要稳节奏',
      avoid: ['避免长期透支'],
    },
    colors: [],
    directions: [],
    timing: [],
  },
  evidence: {
    celebrities: [{ name: '示例人物' }],
    statistics: {},
    similarCases: [],
  },
  analysis: {
    opening: '细观此局，结构已明。',
    explanation: '这是一段足够长的解释文本，用于模拟已经完成深度增强的报告正文。'.repeat(20),
    llmUsed: true,
    verify: {
      consistencyScore: 96,
      verdict: 'PASS' as const,
      failedRules: [],
    },
    orchestration: {
      totalLlmCalls: 7,
      successRate: 0.86,
      succeeded: ['a', 'b', 'c', 'd', 'e', 'f'],
      failed: ['g'],
    },
  },
  klineData: [
    { year: 2026, career: 78, wealth: 69, marriage: 61, health: 64 },
    { year: 2027, career: 81, wealth: 72, marriage: 63, health: 66 },
    { year: 2028, career: 84, wealth: 75, marriage: 66, health: 67 },
  ],
  dayun: {
    currentDayun: {
      quality: 'good',
      ganZhi: '乙亥',
    },
    dayuns: [{ ganZhi: '乙亥' }],
  },
  shenSha: {
    list: [{ name: '天乙贵人' }],
  },
};

describe('report quality audit', () => {
  it('marks a fully enhanced report as ready', () => {
    const audit = buildReportQualityAudit(baseResult as any);

    expect(audit.status).toBe('ready');
    expect(audit.grade).toBe('S');
    expect(audit.overallScore).toBeGreaterThanOrEqual(80);
    expect(audit.dimensions).toHaveLength(5);
    expect(audit.deliveryTier).toBe('expert');
    expect(audit.targetAchieved).toBe(true);
  });

  it('recommends retry when llm enhancement is missing', () => {
    const audit = buildReportQualityAudit({
      ...baseResult,
      analysis: {
        ...baseResult.analysis,
        llmUsed: false,
        verify: {
          consistencyScore: 74,
          verdict: 'WARN' as const,
          failedRules: ['best_window_alignment'],
        },
        orchestration: {
          totalLlmCalls: 7,
          successRate: 0,
          succeeded: [],
          failed: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        },
      },
    } as any);

    expect(audit.status).toBe('retry');
    expect(audit.concerns.some((item) => item.includes('LLM'))).toBe(true);
    expect(audit.recommendedActions.some((item) => item.includes('重算'))).toBe(true);
    expect(audit.deliveryTier).toBe('basic');
    expect(audit.targetAchieved).toBe(false);
    expect(audit.blockingIssues.length).toBeGreaterThan(0);
  });
});
