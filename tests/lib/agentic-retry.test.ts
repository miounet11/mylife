jest.mock('@/lib/agentic-report/llm-client', () => ({
  callJsonLLM: jest.fn(),
}));

import { runAgenticPipeline } from '@/lib/agentic-report/run-agentic-pipeline';
import { callJsonLLM } from '@/lib/agentic-report/llm-client';

const mockedCallJsonLLM = callJsonLLM as jest.MockedFunction<typeof callJsonLLM>;

const birthDate = new Date(Date.UTC(1991, 7, 12));

const report = {
  basic: {
    dayMaster: '丙',
    pillars: [
      {
        celestialStem: '辛',
        earthlyBranch: '未',
        hiddenStems: ['己', '丁', '乙'],
        nayin: '路旁土',
        fiveElements: { main: 'metal', hidden: ['earth', 'fire', 'wood'], strength: 0.5 },
        relationships: { combination: [], clash: [], penalty: [], harm: [] },
      },
      {
        celestialStem: '丙',
        earthlyBranch: '申',
        hiddenStems: ['庚', '壬', '戊'],
        nayin: '山下火',
        fiveElements: { main: 'fire', hidden: ['metal', 'water', 'earth'], strength: 0.5 },
        relationships: { combination: [], clash: [], penalty: [], harm: [] },
      },
      {
        celestialStem: '丙',
        earthlyBranch: '子',
        hiddenStems: ['癸'],
        nayin: '涧下水',
        fiveElements: { main: 'fire', hidden: ['water'], strength: 0.5 },
        relationships: { combination: [], clash: [], penalty: [], harm: [] },
      },
      {
        celestialStem: '癸',
        earthlyBranch: '巳',
        hiddenStems: ['丙', '庚', '戊'],
        nayin: '长流水',
        fiveElements: { main: 'water', hidden: ['fire', 'metal', 'earth'], strength: 0.5 },
        relationships: { combination: [], clash: [], penalty: [], harm: [] },
      },
    ],
  },
  pattern: {
    type: '身弱格',
    strength: 'weak',
    quality: 'good',
    description: '日主偏弱。',
  },
  advice: {
    yongShen: ['土'],
    xiShen: ['木', '火'],
    jiShen: ['金'],
    career: {
      general: '先稳住节奏。',
      specific: ['先排序'],
      timing: '2026-2028',
      avoid: ['避免激进'],
      direction: '东',
      colors: ['红'],
    },
    wealth: {
      general: '先控风险。',
      specific: ['分段配置'],
      timing: '2027',
      direction: '南',
      colors: ['黄'],
      avoid: ['避免重仓'],
    },
    marriage: {
      general: '关系更看节奏。',
      specific: ['先观察'],
      timing: '2027',
      direction: '东南',
      colors: ['粉'],
    },
    health: {
      general: '重视恢复力。',
      specific: ['规律作息'],
      timing: '换季',
      directions: ['东'],
      colors: ['绿'],
      avoid: ['避免透支'],
    },
    colors: ['红'],
    directions: ['东'],
    timing: ['2026-2028'],
  },
  tenGods: {
    self: '丙',
    output: [],
    input: ['正财'],
    control: ['正官'],
    controlled: [],
  },
  fortune: {
    currentDaYun: '癸巳大运',
    currentLiuNian: '丙午',
    interaction: '当前偏稳。',
    nextYear: '继续推进。',
  },
  klineData: [
    { year: 2026, career: 60, wealth: 60, marriage: 62, health: 58 },
    { year: 2027, career: 78, wealth: 74, marriage: 70, health: 68 },
    { year: 2028, career: 73, wealth: 70, marriage: 68, health: 64 },
  ],
  dayun: {
    currentDayun: {
      index: 2,
      startAge: 29,
      endAge: 38,
      startYear: 2020,
      endYear: 2029,
      gan: '癸',
      zhi: '巳',
      ganZhi: '癸巳',
      ganWuxing: '水',
      zhiWuxing: '火',
      yongShenMatch: 'neutral' as const,
      quality: 'neutral' as const,
      description: '平稳之运。',
      isCurrent: true,
    },
    dayuns: [],
  },
  shenSha: {
    list: [],
    auspicious: [],
    inauspicious: [],
    summary: '',
  },
};

describe('agentic retry', () => {
  beforeEach(() => {
    mockedCallJsonLLM.mockReset();
  });

  it('reruns priority agents once before falling back', async () => {
    mockedCallJsonLLM
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        summary: '命局主轴已在二次尝试中恢复。',
        highlights: ['恢复成功'],
        risks: [],
        actions: ['继续合并'],
        citations: [],
        windows: [{ label: '2026-2028阶段', score: 78, advice: '继续推进。' }],
      } as never);

    const progressEvents: string[] = [];
    const result = await runAgenticPipeline({
      enabled: true,
      agentKeys: ['core_constitution'],
      groundTruth: {
        birthDate,
        report,
      },
      context: {
        birthDate,
        birthPlace: '北京',
        currentPlace: '上海',
        report: {
          advice: report.advice,
          fortune: report.fortune,
        },
      },
      onProgress: async (event) => {
        progressEvents.push(`${event.type}:${event.agentKey}`);
      },
    });

    expect(mockedCallJsonLLM).toHaveBeenCalledTimes(2);
    expect(result.orchestration.rerunAgents).toContain('core_constitution');
    expect(result.orchestration.succeeded).toContain('core_constitution');
    expect(result.orchestration.agentSources.core_constitution).toBe('llm');
    expect(progressEvents).toContain('agent-retry:core_constitution');
  });
});
