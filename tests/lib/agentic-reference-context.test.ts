import { describe, expect, test } from '@jest/globals';
import { buildContextSignals } from '@/lib/agentic-report/build-context-signals';
import { buildEngineGroundTruth } from '@/lib/agentic-report/build-ground-truth';
import { buildFallbackAgentResults } from '@/lib/agentic-report/build-fallback-agent-results';
import { buildPromptModules } from '@/lib/agentic-report/prompt-injector';

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
    dayuns: [],
  },
  shenSha: {
    list: [],
    auspicious: [],
    inauspicious: [],
    summary: '吉神偏强。',
  },
};

describe('agentic reference context integration', () => {
  test('injects reference intelligence into context and prompt modules', () => {
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
      referenceCorpus: {
        sourceDocuments: [
          {
            id: 'src_1',
            sourceType: 'site',
            platform: 'zhihu',
            sourceId: 'zhihu-search',
            canonicalUrl: 'https://www.zhihu.com/question/1',
            title: '真太阳时和城市迁移怎么看',
            author: null,
            publishedAt: '2026-03-12T00:00:00.000Z',
            language: 'zh-CN',
            summary: '围绕真太阳时、城市、迁移和节奏展开。',
            tags: ['真太阳时', '城市', '迁移'],
            rawMeta: {},
            rightsStatus: 'platform_restricted',
            licenseName: null,
            reusePolicy: null,
            contentHash: null,
            createdAt: '2026-03-12T00:00:00.000Z',
            updatedAt: '2026-03-12T00:00:00.000Z',
          },
        ],
      },
      now: new Date(Date.UTC(2026, 2, 12)),
    });

    expect(context.referenceIntelligence?.pack.authority.sourceCount).toBe(1);
    expect(context.referenceIntelligence?.overlay.timingHints.length).toBeGreaterThan(0);

    const modules = buildPromptModules({
      engine,
      context,
      report: {
        advice: report.advice,
        fortune: report.fortune,
      },
    });

    expect(modules.some((item) => item.label === 'REFERENCE_INTELLIGENCE')).toBe(true);
    expect(modules.some((item) => item.label === 'REFERENCE_OVERLAY')).toBe(true);
  });

  test('feeds reference hints into fallback agent outputs', () => {
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
      referenceCorpus: {
        sourceDocuments: [
          {
            id: 'src_1',
            sourceType: 'site',
            platform: 'zhihu',
            sourceId: 'zhihu-search',
            canonicalUrl: 'https://www.zhihu.com/question/2',
            title: '合作关系和办公环境如何影响判断',
            author: null,
            publishedAt: '2026-03-12T00:00:00.000Z',
            language: 'zh-CN',
            summary: '讨论合作、关系、办公环境和团队协同。',
            tags: ['合作', '关系', '办公环境'],
            rawMeta: {},
            rightsStatus: 'platform_restricted',
            licenseName: null,
            reusePolicy: null,
            contentHash: null,
            createdAt: '2026-03-12T00:00:00.000Z',
            updatedAt: '2026-03-12T00:00:00.000Z',
          },
        ],
      },
      now: new Date(Date.UTC(2026, 2, 12)),
    });

    const fallback = buildFallbackAgentResults({
      engine,
      context,
      report: {
        advice: report.advice,
        fortune: report.fortune,
      },
    });

    const temporalSpatial = fallback.temporal_spatial_advisor as { summary?: string; citations?: string[] };
    const relationship = fallback.relationship_family as { summary?: string; citations?: string[] };

    expect(temporalSpatial.summary).toContain('地利');
    expect(relationship.citations).toContain('reference.overlay.human');
  });
});
