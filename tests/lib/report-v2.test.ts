import {
  buildConfidenceAnalysis,
  buildDecisionPlaybook,
  buildExpertInterpretation,
  buildReportCorrectionInsight,
  buildMonthlyWindows,
  buildReportValidationInsights,
  buildScenarioViews,
  buildYearlyTrendSnapshots,
  buildYearlyRoadmap,
} from '@/lib/report-v2';

const baseResult = {
  basic: {
    dayMaster: '甲',
    pillars: [
      { relationships: { combination: ['子'], clash: [], penalty: [], harm: [] } },
      { relationships: { combination: [], clash: ['午'], penalty: [], harm: [] } },
      { relationships: { combination: [], clash: [], penalty: [], harm: [] } },
      { relationships: { combination: [], clash: ['卯'], penalty: ['酉'], harm: [] } },
    ],
  },
  pattern: {
    type: '身弱格',
    description: '日主偏弱，宜取印比帮扶。',
  },
  advice: {
    yongShen: ['水', '木'],
    xiShen: ['火'],
    jiShen: ['金', '土'],
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
  },
  fiveElements: {
    wood: { strength: 28 },
    fire: { strength: 18 },
    earth: { strength: 10 },
    metal: { strength: 8 },
    water: { strength: 36 },
  },
  fortune: {
    currentDaYun: '乙亥大运',
    currentLiuNian: '丙午流年',
    interaction: '当前行运偏吉，适合稳中求进。',
  },
  klineData: [
    { year: 2026, career: 78, wealth: 69, marriage: 61, health: 64 },
    { year: 2027, career: 81, wealth: 72, marriage: 63, health: 66 },
    { year: 2028, career: 84, wealth: 75, marriage: 66, health: 67 },
  ],
  dayun: {
    currentDayun: {
      quality: 'good' as const,
      ganZhi: '乙亥',
    },
  },
  shenSha: {
    list: [{ name: '天乙贵人' }],
  },
};

describe('report-v2 helpers', () => {
  it('builds scenario views for all major tracks', () => {
    const scenarios = buildScenarioViews(baseResult);
    expect(scenarios).toHaveLength(5);
    expect(scenarios[0].key).toBe('overall');
    expect(scenarios.find((item) => item.key === 'career')?.focus.length).toBeGreaterThan(0);
  });

  it('builds deterministic 12-month windows', () => {
    const startDate = new Date(Date.UTC(2026, 2, 12));
    const first = buildMonthlyWindows(baseResult, startDate);
    const second = buildMonthlyWindows(baseResult, startDate);

    expect(first).toHaveLength(12);
    expect(first[0].key).toBe('2026-03');
    expect(first[0].score).toBe(second[0].score);
    expect(first[11].key).toBe('2027-02');
  });

  it('builds confidence analysis with stable and sensitive areas', () => {
    const confidence = buildConfidenceAnalysis(baseResult);
    expect(confidence.overallScore).toBeGreaterThanOrEqual(45);
    expect(confidence.stablePoints.length).toBeGreaterThan(0);
    expect(confidence.sensitivePoints.length).toBeGreaterThan(0);
    expect(['low', 'medium', 'high']).toContain(confidence.birthTimeSensitivity.level);
  });

  it('builds a deterministic yearly roadmap', () => {
    const startDate = new Date(Date.UTC(2026, 2, 12));
    const first = buildYearlyRoadmap(baseResult, startDate);
    const second = buildYearlyRoadmap(baseResult, startDate);

    expect(first).toHaveLength(4);
    expect(first[0].timeline).toBe('2026.03 - 2026.05');
    expect(first[0].score).toBe(second[0].score);
    expect(first[0].actions.length).toBeGreaterThan(0);
  });

  it('builds a ranked decision playbook', () => {
    const windows = buildMonthlyWindows(baseResult, new Date(Date.UTC(2026, 2, 12)));
    const playbook = buildDecisionPlaybook(
      {
        ...baseResult,
        scenarioViews: buildScenarioViews(baseResult),
        monthlyWindows: windows,
      },
      new Date(Date.UTC(2026, 2, 12))
    );

    expect(playbook).toHaveLength(4);
    expect(playbook[0]?.priority).toBe('P1');
    expect(playbook[0]?.title).toContain('操作剧本');
    expect(playbook[0]?.whyNow).toContain('参考窗口');
  });

  it('builds yearly trend snapshots for the next three years', () => {
    const snapshots = buildYearlyTrendSnapshots(baseResult);

    expect(snapshots).toHaveLength(3);
    expect(snapshots[0]?.year).toBe(2026);
    expect(snapshots[0]?.dominantTrack).toBeTruthy();
    expect(snapshots[0]?.advice).toContain('不宜硬推');
  });

  it('builds expert interpretation blocks', () => {
    const confidence = buildConfidenceAnalysis(baseResult);
    const interpretation = buildExpertInterpretation({
      ...baseResult,
      scenarioViews: buildScenarioViews(baseResult),
      monthlyWindows: buildMonthlyWindows(baseResult, new Date(Date.UTC(2026, 2, 12))),
      confidence,
    });

    expect(interpretation).toHaveLength(4);
    expect(interpretation[0]?.title).toBe('结构原点');
    expect(interpretation[1]?.headline).toContain('决定了这几年更该怎么走');
    expect(interpretation[3]?.tags.length).toBeGreaterThan(0);
  });

  it('builds validation insights from linked events', () => {
    const insights = buildReportValidationInsights([
      { title: '事件A', userFeedback: { wasAccurate: true } },
      { title: '事件B', userFeedback: { wasAccurate: false, userNotes: '时机判断偏早' } },
      { title: '事件C', userFeedback: {} },
    ]);

    expect(insights.totalLinkedEvents).toBe(3);
    expect(insights.accurateCount).toBe(1);
    expect(insights.driftCount).toBe(1);
    expect(insights.pendingCount).toBe(1);
    expect(insights.lessons.length).toBeGreaterThan(0);
  });

  it('builds correction insight from validation and confidence', () => {
    const validation = buildReportValidationInsights([
      { title: '事件A', userFeedback: { wasAccurate: false } },
      { title: '事件B', userFeedback: { wasAccurate: false, userNotes: '时间点抓早了' } },
    ]);
    const confidence = buildConfidenceAnalysis(baseResult);
    const scenarios = buildScenarioViews(baseResult);
    const windows = buildMonthlyWindows(baseResult, new Date(Date.UTC(2026, 2, 12)));
    const correction = buildReportCorrectionInsight({
      validationInsights: validation,
      confidence,
      scenarioViews: scenarios,
      monthlyWindows: windows,
    });

    expect(correction.level).toBe('action');
    expect(correction.fixes.length).toBeGreaterThan(0);
    expect(correction.checkpoints.length).toBeGreaterThan(0);
  });
});
