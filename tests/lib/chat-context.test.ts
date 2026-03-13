import { buildChatEventDraft, buildChatExperienceContext } from '@/lib/chat-context';
import { buildReportActionSuggestions } from '@/lib/report-v2';

const report = {
  id: 'report_001',
  userId: 'user_001',
  name: '张三',
  birthDate: '1993-08-19',
  birthTime: '09:30',
  birthPlace: 'Shanghai',
  timezone: 8,
  gender: 'male' as const,
  bazi: {
    dayMaster: '甲',
    pillars: [
      { relationships: { combination: ['子'], clash: [], penalty: [], harm: [] } },
      { relationships: { combination: [], clash: ['午'], penalty: [], harm: [] } },
      { relationships: { combination: [], clash: [], penalty: [], harm: [] } },
      { relationships: { combination: [], clash: ['卯'], penalty: ['酉'], harm: [] } },
    ],
  },
  fiveElements: {
    wood: { strength: 28, quality: 'strong', description: '木势较旺' },
    fire: { strength: 18, quality: 'fair', description: '火势中等' },
    earth: { strength: 10, quality: 'weak', description: '土偏弱' },
    metal: { strength: 8, quality: 'weak', description: '金偏弱' },
    water: { strength: 36, quality: 'strong', description: '水较强' },
  },
  tenGods: {
    self: '比肩',
    output: ['偏印'],
    input: ['正财'],
    control: ['七杀'],
    controlled: ['食神'],
  },
  pattern: {
    type: '身弱格',
    strength: 'weak',
    quality: 'good',
    description: '日主偏弱，宜取印比帮扶。',
  },
  fortune: {
    currentDaYun: '乙亥大运',
    currentLiuNian: '丙午流年',
    interaction: '当前行运偏吉，适合稳中求进。',
    nextYear: '明年更适合调整结构',
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
  evidence: {
    statistics: {
      totalSamples: 1000,
      similarCases: 120,
      successRate: 72,
      averageIncome: '30w',
      averageAge: 33,
    },
    celebrities: [],
    similarCases: [],
  },
  analysis: {
    opening: '以月令定气势，以日元定立场。',
    explanation: '这份命局适合先稳结构，再抓阶段窗口。',
  },
  klineData: [
    { year: 2026, career: 78, wealth: 69, marriage: 61, health: 64 },
    { year: 2027, career: 81, wealth: 72, marriage: 63, health: 66 },
    { year: 2028, career: 84, wealth: 75, marriage: 66, health: 67 },
  ],
  dayun: {
    currentDayun: {
      index: 2,
      startAge: 28,
      endAge: 37,
      startYear: 2021,
      endYear: 2030,
      ganZhi: '乙亥',
      description: '木水帮身，适合稳步推进。',
      quality: 'good' as const,
      yongShenMatch: 'good' as const,
      isCurrent: true,
    },
    dayuns: [],
  },
  shenSha: {
    list: [{ name: '天乙贵人' }],
    auspicious: [],
    inauspicious: [],
    summary: '贵人信息较明显',
  },
  reportVersion: 'v2',
  isPublic: false,
};

const reportInput = {
  basic: report.bazi,
  fiveElements: report.fiveElements,
  tenGods: report.tenGods,
  pattern: report.pattern,
  fortune: report.fortune,
  advice: report.advice,
  evidence: report.evidence,
  analysis: report.analysis,
  klineData: report.klineData,
  dayun: report.dayun,
  shenSha: report.shenSha,
};

describe('chat-context helpers', () => {
  it('builds report-aware chat context', () => {
    const context = buildChatExperienceContext({
      report: report as any,
      events: [
        {
          id: 'evt_001',
          userId: 'user_001',
          type: 'career',
          title: '季度晋升评估',
          date: '2026-06-01',
          impact: 'positive',
          userFeedback: {
            wasAccurate: true,
          },
        },
      ],
      now: new Date(Date.UTC(2026, 2, 12)),
    });

    expect(context.report?.id).toBe('report_001');
    expect(context.summary).toContain('乙亥大运');
    expect(context.focusAreas.length).toBeGreaterThan(2);
    expect(context.suggestedPrompts.length).toBeGreaterThan(2);
    expect(context.suggestedEventDrafts.length).toBeGreaterThan(0);
    expect(context.validationSummary?.accurateCount).toBe(1);
    expect(context.summary).toContain('事件验证状态');
  });

  it('builds deterministic report action suggestions', () => {
    const first = buildReportActionSuggestions(reportInput, new Date(Date.UTC(2026, 2, 12)));
    const second = buildReportActionSuggestions(reportInput, new Date(Date.UTC(2026, 2, 12)));

    expect(first).toHaveLength(3);
    expect(first[0].title).toBe(second[0].title);
    expect(first[0].date).toMatch(/^2026-\d{2}-01$/);
  });

  it('builds a chat event draft from question and answer', () => {
    const context = buildChatExperienceContext({
      report: report as any,
      events: [],
      now: new Date(Date.UTC(2026, 2, 12)),
    });
    const draft = buildChatEventDraft({
      question: '结合 2026 年下半年，我该不该推进跳槽？',
      answer: '当前更适合先准备再推进，最佳窗口在下半年，注意不要情绪化决策。',
      context,
      now: new Date(Date.UTC(2026, 2, 12)),
    });

    expect(draft.type).toBe('career');
    expect(draft.title).toContain('跳槽');
    expect(draft.fortuneAnalysis.source).toBe('chat_message');
    expect(draft.description).toContain('问题：');
  });

  it('prioritizes focused drift event in chat context', () => {
    const context = buildChatExperienceContext({
      report: report as any,
      events: [
        {
          id: 'evt_drift',
          userId: 'user_001',
          type: 'career',
          title: '跳槽谈判失败',
          date: '2026-07-01',
          impact: 'negative',
          fortuneAnalysis: {
            reportId: 'report_001',
            reason: '窗口判断偏早',
          },
          userFeedback: {
            wasAccurate: false,
            userNotes: '实际节奏比预期慢',
          },
        },
      ],
      focusEventId: 'evt_drift',
      now: new Date(Date.UTC(2026, 2, 12)),
    });

    expect(context.focusedEvent?.id).toBe('evt_drift');
    expect(context.summary).toContain('重点纠偏事件');
    expect(context.suggestedPrompts[0]).toContain('纠偏');
    expect(context.correctionPrompts).toHaveLength(4);
    expect(context.correctionPrompts[0]?.question).toContain('跳槽谈判失败');
    expect(context.correctionPrompts[0]?.helper).toContain('窗口判断偏早');
  });
});
