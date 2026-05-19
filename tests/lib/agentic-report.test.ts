import { buildContextSignals } from '@/lib/agentic-report/build-context-signals';
import { buildFallbackAgentResults } from '@/lib/agentic-report/build-fallback-agent-results';
import { buildEngineGroundTruth } from '@/lib/agentic-report/build-ground-truth';
import { runAgenticPipeline } from '@/lib/agentic-report/run-agentic-pipeline';
import { runReview } from '@/lib/agentic-report/review/run-review';
import { runVerify } from '@/lib/agentic-report/review/run-verify';
import { deriveReportReasoningMode } from '@/lib/report-reasoning-mode';

const birthDate = new Date(Date.UTC(1990, 5, 15));

const report = {
  basic: {
    dayMaster: '甲',
    pillars: [
      {
        celestialStem: '庚',
        earthlyBranch: '午',
        hiddenStems: ['丁', '己'],
        nayin: '路旁土',
        fiveElements: { main: 'metal', hidden: ['fire', 'earth'], strength: 0.4 },
        relationships: { combination: [], clash: [], penalty: [], harm: [] },
      },
      {
        celestialStem: '壬',
        earthlyBranch: '申',
        hiddenStems: ['庚', '壬', '戊'],
        nayin: '剑锋金',
        fiveElements: { main: 'water', hidden: ['metal', 'water', 'earth'], strength: 0.6 },
        relationships: { combination: [], clash: ['寅'], penalty: [], harm: [] },
      },
      {
        celestialStem: '甲',
        earthlyBranch: '子',
        hiddenStems: ['癸'],
        nayin: '海中金',
        fiveElements: { main: 'wood', hidden: ['water'], strength: 0.7 },
        relationships: { combination: ['丑'], clash: ['午'], penalty: [], harm: [] },
      },
      {
        celestialStem: '丙',
        earthlyBranch: '寅',
        hiddenStems: ['甲', '丙', '戊'],
        nayin: '炉中火',
        fiveElements: { main: 'fire', hidden: ['wood', 'fire', 'earth'], strength: 0.5 },
        relationships: { combination: ['亥'], clash: ['申'], penalty: [], harm: [] },
      },
    ],
  },
  pattern: {
    type: '身弱格',
    strength: 'weak',
    quality: 'medium',
    description: '日主偏弱，宜取印比帮扶。',
  },
  fortune: {
    currentDaYun: '乙亥大运',
    currentLiuNian: '丙午',
    interaction: '当前偏吉，适合稳中求进。',
    nextYear: '顺着窗口继续推进。',
  },
  advice: {
    yongShen: ['水', '木'],
    xiShen: ['火'],
    jiShen: ['金', '土'],
    career: {
      general: '事业先积累资源后发力。',
      specific: ['优先进入成长环境'],
      timing: '2027-2029',
      avoid: ['避免盲目扩张'],
      direction: '东方',
      colors: ['青色'],
    },
    wealth: {
      general: '财富以稳健配置为主。',
      specific: ['先控风险'],
      timing: '2028-2030',
      direction: '北方',
      colors: ['黑色'],
      avoid: ['避免重仓单点机会'],
    },
    marriage: {
      general: '关系更看节奏与互动质量。',
      specific: ['先观察再推进'],
      timing: '2027-2028',
      direction: '东南',
      colors: ['绿色'],
    },
    health: {
      general: '健康重在恢复力管理。',
      specific: ['规律作息'],
      timing: '换季阶段',
      directions: ['东南'],
      colors: ['青色'],
      avoid: ['避免长期透支'],
    },
    colors: ['青色', '黑色'],
    directions: ['东方', '北方'],
    timing: ['2027-2029'],
  },
  tenGods: {
    self: '比肩',
    output: ['正印'],
    input: ['偏财'],
    control: ['正官'],
    controlled: ['食神'],
  },
  klineData: [
    { year: 2026, career: 76, wealth: 68, marriage: 62, health: 64 },
    { year: 2027, career: 82, wealth: 73, marriage: 66, health: 68 },
    { year: 2028, career: 61, wealth: 56, marriage: 59, health: 60 },
    { year: 2029, career: 88, wealth: 81, marriage: 70, health: 72 },
    { year: 2030, career: 79, wealth: 75, marriage: 67, health: 70 },
  ],
  dayun: {
    startAge: 6,
    currentDayunYear: 2,
    currentDayun: {
      index: 3,
      startAge: 36,
      endAge: 45,
      startYear: 2026,
      endYear: 2035,
      gan: '乙',
      zhi: '亥',
      ganZhi: '乙亥',
      ganWuxing: '木',
      zhiWuxing: '水',
      yongShenMatch: 'good' as const,
      quality: 'good' as const,
      description: '当前大运偏利成长与资源积累。',
      isCurrent: true,
    },
    dayuns: [
      {
        index: 3,
        startAge: 36,
        endAge: 45,
        startYear: 2026,
        endYear: 2035,
        gan: '乙',
        zhi: '亥',
        ganZhi: '乙亥',
        ganWuxing: '木',
        zhiWuxing: '水',
        yongShenMatch: 'good' as const,
        quality: 'good' as const,
        description: '当前大运偏利成长与资源积累。',
        isCurrent: true,
      },
    ],
  },
  shenSha: {
    list: [{ name: '天乙贵人', pillar: 'day' as const, type: 'auspicious' as const, description: '贵人助力增强。' }],
    auspicious: ['天乙贵人'],
    inauspicious: [],
    summary: '吉神偏强，可在关键窗口放大助力。',
  },
};

describe('agentic-report pipeline helpers', () => {
  it('builds structured engine ground truth with anchors and windows', () => {
    const engine = buildEngineGroundTruth({
      birthDate,
      report,
    });

    expect(engine.constitution.dayMaster).toBe('甲');
    expect(engine.kline.points.length).toBe(report.klineData.length);
    expect(engine.kline.anchorPoints.length).toBeGreaterThan(0);
    expect(engine.timeWindows.career.length).toBeGreaterThan(0);
    expect(engine.dayun.windows[0]?.ganZhi).toBe('乙亥');
  });

  it('builds context signals with temporal, macro and geo layers', () => {
    const engine = buildEngineGroundTruth({ birthDate, report });
    const context = buildContextSignals({
      birthDate,
      birthPlace: '北京',
      currentPlace: '上海',
      targetPlaces: ['深圳'],
      industries: ['科技', '教育'],
      engine,
      report: {
        advice: report.advice,
        fortune: {
          currentDaYun: '乙亥大运',
          currentLiuNian: '丙午',
          interaction: '偏吉',
          nextYear: '看窗口推进',
        },
      },
      now: new Date(Date.UTC(2026, 2, 12)),
    });

    expect(context.temporal.currentYear).toBe(2026);
    expect(context.macroCycles.industryCycle?.length).toBeGreaterThan(0);
    expect(context.geoClimate.cityEnergyTags?.length).toBeGreaterThan(0);
    expect(context.spatialFactors.favorableDirections.length).toBeGreaterThan(0);
  });

  it('sanitizes placeholder geo labels from context signals', () => {
    const engine = buildEngineGroundTruth({ birthDate, report });
    const context = buildContextSignals({
      birthDate,
      birthPlace: '未知地 北京时间 --',
      currentPlace: '未知地 北京时间 --',
      industries: ['科技'],
      engine,
      report: {
        advice: report.advice,
        fortune: report.fortune,
      },
      now: new Date(Date.UTC(2026, 2, 12)),
    });

    expect(context.geoClimate.birthPlace).toBeUndefined();
    expect(context.geoClimate.currentPlace).toBeUndefined();
  });

  it('builds deterministic fallback agent results and passes review/verify', () => {
    const engine = buildEngineGroundTruth({ birthDate, report });
    const context = buildContextSignals({
      birthDate,
      birthPlace: '北京',
      currentPlace: '上海',
      industries: ['科技'],
      engine,
      report: {
        advice: report.advice,
        fortune: {
          currentDaYun: '乙亥大运',
          currentLiuNian: '丙午',
          interaction: '偏吉',
          nextYear: '继续推进',
        },
      },
      now: new Date(Date.UTC(2026, 2, 12)),
    });

    const structured = { engine, context, report: { advice: report.advice, fortune: report.fortune } };
    const fallback = buildFallbackAgentResults(structured);
    const review = runReview(structured, fallback);
    const verify = runVerify(structured, fallback);

    expect(Object.keys(fallback)).toContain('temporal_spatial_advisor');
    expect(review.consistencyScore).toBeGreaterThanOrEqual(70);
    expect(verify.verdict).toMatch(/PASS|WARN/);
  });

  it('flags HIGH severity when kline peak/trough year is off-anchor (review v2 hard check)', () => {
    const engine = buildEngineGroundTruth({ birthDate, report });
    const context = buildContextSignals({
      birthDate,
      birthPlace: '北京',
      currentPlace: '上海',
      engine,
      report: {
        advice: report.advice,
        fortune: { currentDaYun: '乙亥大运', currentLiuNian: '丙午', interaction: '', nextYear: '' },
      },
      now: new Date(Date.UTC(2026, 2, 12)),
    });
    const structured = { engine, context, report: { advice: report.advice, fortune: report.fortune } };

    const validYear = engine.kline.anchorPoints[0]?.year ?? 2030;
    const offAnchorYear = validYear + 999;
    const offendingResults = {
      kline_narrative: {
        summary: '伪输出',
        peakYears: [{ year: offAnchorYear, label: '伪峰' }],
        troughYears: [],
        windows: [],
      },
    };
    const review = runReview(structured, offendingResults);
    const hit = review.conflicts.find((c) => c.id === 'conflict_kline_year_off_anchor');
    expect(hit).toBeDefined();
    expect(hit?.severity).toBe('HIGH');
  });

  it('builds fallback summaries from personalized engine signals instead of a fixed template', () => {
    const engine = buildEngineGroundTruth({ birthDate, report });
    const context = buildContextSignals({
      birthDate,
      birthPlace: '北京',
      currentPlace: '上海',
      industries: ['科技'],
      engine,
      report: {
        advice: report.advice,
        fortune: report.fortune,
      },
      now: new Date(Date.UTC(2026, 2, 12)),
    });

    const fallback = buildFallbackAgentResults({ engine, context, report: { advice: report.advice, fortune: report.fortune } });
    const strategy = fallback.strategy_advisor as { summary?: string; highlights?: string[] };
    const career = fallback.career_wealth as { summary?: string; highlights?: string[] };

    expect(strategy.summary).toContain('事业');
    expect(strategy.highlights).toContain('当前主线：事业');
    expect(career.summary).toContain('事业窗口更适合看');
  });

  it('returns fallback-based agentic pipeline output when disabled', async () => {
    const result = await runAgenticPipeline({
      enabled: false,
      groundTruth: {
        birthDate,
        report,
      },
      context: {
        birthDate,
        birthPlace: '北京',
        currentPlace: '上海',
        industries: ['科技'],
        report: {
          advice: report.advice,
          fortune: report.fortune,
        },
        now: new Date(Date.UTC(2026, 2, 12)),
      },
    });

    expect(result.enabled).toBe(false);
    expect(result.orchestration.mode).toBe('deterministic-expert');
    expect(result.orchestration.agentsRun.length).toBeGreaterThan(0);
    expect(result.agentResults).toHaveProperty('strategy_advisor');
    expect(result.verify.consistencyScore).toBeGreaterThan(0);
  });

  it('derives deterministic expert mode from fallback metadata', () => {
    const mode = deriveReportReasoningMode({
      orchestrationMode: 'single-llm',
      agentResults: {
        strategy_advisor: {
          summary: '围绕 2027-2029 排序动作',
        },
      },
      contextSignals: {
        temporal: {
          currentSolarTerm: '惊蛰',
        },
      },
    });

    expect(mode).toBe('deterministic-expert');
  });

  it('downgrades pseudo parallel mode when all agent calls failed', () => {
    const mode = deriveReportReasoningMode({
      reasoningMode: 'parallel-agents',
      orchestrationMode: 'parallel-agents',
      orchestrationSuccessRate: 0,
      successfulAgents: [],
      agenticUsed: false,
      agentResults: {
        strategy_advisor: {
          summary: '由 deterministic 专家层填充的结果',
        },
      },
      contextSignals: {
        temporal: {
          currentSolarTerm: '惊蛰',
        },
      },
    });

    expect(mode).toBe('deterministic-expert');
  });
});
