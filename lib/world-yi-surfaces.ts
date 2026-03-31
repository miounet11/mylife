export type WorldYiDomainKey =
  | 'career'
  | 'wealth'
  | 'relationship'
  | 'health'
  | 'family'
  | 'migration';

export interface WorldYiDomainSurface {
  key: WorldYiDomainKey;
  title: string;
  shortTitle: string;
  summary: string;
  headline: string;
  description: string;
  doctrine: string[];
  knowledgeSlugs: string[];
  caseSlugs: string[];
}

export const worldYiDomainSurfaces: Record<WorldYiDomainKey, WorldYiDomainSurface> = {
  career: {
    key: 'career',
    title: '世界易事业分科',
    shortTitle: '事业',
    summary: '先看角色密度、承压方式和推进节奏，而不是先被职业名字带跑。',
    headline: '事业问题不是“做哪行”这么简单，而是你适合怎样推进、承压和扩张。',
    description: '世界易把事业判断拉回结构、阶段、环境和动作。真正重要的不是你羡慕什么岗位，而是你的角色适配、阶段窗口、组织压力和能承受的推进速度。',
    doctrine: [
      '先看角色适配，再看职位光环',
      '先看阶段窗口，再看冲动换岗',
      '必须把组织环境与城市压力带进来',
      '最后回到现实动作与验证节点',
    ],
    knowledgeSlugs: [
      'world-yi-career-role-fit',
      'world-yi-career-stage-reset',
      'world-yi-era-cognition',
      'world-yi-methodology',
    ],
    caseSlugs: [
      'world-yi-case-career-role-fit',
      'world-yi-case-career-promotion-freeze',
      'world-yi-case-burnout-manager',
      'world-yi-case-overseas-career-reset',
    ],
  },
  wealth: {
    key: 'wealth',
    title: '世界易财富分科',
    shortTitle: '财富',
    summary: '先看赚钱方式、保留能力和扩张时机，而不是只看收入数字。',
    headline: '财富问题真正难的，不是赚不赚得到，而是你能不能守住、放大并躲开错误扩张。',
    description: '世界易把财富判断分成进入方式、保留结构、扩张节奏和风险识别四层。财富好坏不是一条线，而是一套长期纪律。',
    doctrine: [
      '先看进入方式，再看金额大小',
      '先看保留能力，再看短期波动',
      '先看扩张节奏，再看欲望放大',
      '必须识别财富泄漏点',
    ],
    knowledgeSlugs: [
      'world-yi-wealth-rhythm',
      'world-yi-wealth-retention-discipline',
      'world-yi-judgment-crisis',
      'world-yi-methodology',
    ],
    caseSlugs: [
      'world-yi-case-wealth-expansion',
      'world-yi-case-wealth-leakage',
      'world-yi-case-cashflow-fragility',
      'world-yi-case-cross-border-founder',
    ],
  },
  relationship: {
    key: 'relationship',
    title: '世界易关系分科',
    shortTitle: '关系',
    summary: '先看边界、节奏和消耗结构，而不是只问合不合。',
    headline: '关系问题往往不是一句合不合，而是结构是否匹配、阶段是否对、环境是否在挤压。',
    description: '世界易把关系拉回边界、阶段、环境和动作。真正高质量的关系判断，不是上来就给你结论，而是先解释消耗从哪里来、关系为什么卡住、现在该如何推进或止损。',
    doctrine: [
      '先看边界，再看情绪拉扯',
      '先看阶段，再看一时热度',
      '环境压力会放大关系问题',
      '最后回到推进、观察或收手',
    ],
    knowledgeSlugs: [
      'world-yi-relationship-order',
      'world-yi-relationship-pacing-order',
      'world-yi-relationship-conflict-repair',
      'world-yi-family-generational-order',
    ],
    caseSlugs: [
      'world-yi-case-relationship-boundary',
      'world-yi-case-relationship-pacing-reset',
      'world-yi-case-bicultural-marriage',
      'world-yi-case-marriage-migration',
    ],
  },
  health: {
    key: 'health',
    title: '世界易健康分科',
    shortTitle: '健康',
    summary: '先看恢复窗口、长期透支和环境密度，而不是等崩溃以后才回头。',
    headline: '健康问题很多时候不是突然坏掉，而是恢复秩序长期失衡之后的结果。',
    description: '世界易不把健康理解成单点惊吓，而是看身心压力、恢复时间、空间环境和责任负荷如何一起作用。健康判断首先是恢复秩序判断。',
    doctrine: [
      '先看恢复秩序，再看症状恐慌',
      '长期透支比单次波动更关键',
      '环境密度会直接影响恢复速度',
      '先减负，再谈高强度推进',
    ],
    knowledgeSlugs: [
      'world-yi-health-recovery-order',
      'world-yi-health-boundary',
      'world-yi-environment-method',
    ],
    caseSlugs: [
      'world-yi-case-health-overload-cycle',
      'world-yi-case-burnout-manager',
      'world-yi-case-overseas-eldercare',
    ],
  },
  family: {
    key: 'family',
    title: '世界易家庭分科',
    shortTitle: '家庭',
    summary: '先看责任排序、代际压力和家庭恢复位，而不是只靠最能扛的人继续扛。',
    headline: '家庭问题最怕所有责任都压在一个人身上，却没有人先把顺序排出来。',
    description: '世界易把家庭判断拉回责任排序、代际互动、照护压力和恢复位。家庭不是抽象温情，而是一套必须被安排清楚的现实结构。',
    doctrine: [
      '先排责任顺序，再谈情感期待',
      '代际压力必须被看见',
      '家宅和照护环境会改变家庭张力',
      '真正的修复从重新分工开始',
    ],
    knowledgeSlugs: [
      'world-yi-family-generational-order',
      'world-yi-family-role-rebalance',
      'world-yi-home-recovery-system',
      'world-yi-home-order',
    ],
    caseSlugs: [
      'world-yi-case-family-duty',
      'world-yi-case-family-role-rebalance',
      'world-yi-case-eldercare-decision',
      'world-yi-case-global-family-balance',
    ],
  },
  migration: {
    key: 'migration',
    title: '世界易迁移分科',
    shortTitle: '迁移',
    summary: '先看阶段、身份成本和环境匹配，而不是把地图当答案。',
    headline: '迁移问题真正难的，不是去哪，而是你的阶段、身份和环境承载度能不能撑住这次移动。',
    description: '世界易把迁移判断从“留还是回”升级成阶段、城市、身份、现金流、家庭责任和未来路径的综合判断。地图不是答案，匹配才是。',
    doctrine: [
      '先看阶段，再看地图',
      '身份成本必须纳入判断',
      '城市、家庭和现金流一起看',
      '迁移不是逃离，而是重配环境',
    ],
    knowledgeSlugs: [
      'world-yi-migration-stage-logic',
      'world-yi-migration-environment-fit',
      'world-yi-overseas-chinese',
      'world-yi-global-chinese-decision-map',
    ],
    caseSlugs: [
      'world-yi-case-return-or-stay',
      'world-yi-case-migration-fit',
      'world-yi-case-dual-city-fatigue',
      'world-yi-case-global-school-choice',
    ],
  },
};

export const worldYiApplicationSurface = {
  title: '世界易生活应用',
  headline: '起名、寻物、择时、家宅这些问题，也要回到现代人的判断秩序里。',
  description: '世界易不把生活应用写成神秘技巧合集，而是把它们重新拉回结构、环境、阶段和使用场景。应用越日常，越需要避免乱用术语。',
  doctrine: [
    '应用不等于玄感，先回到问题结构',
    '起名先看长期使用场景',
    '寻物先看环境与路径复原',
    '择时先看动作成熟度与阶段',
    '家宅先看恢复质量与关系密度',
    '每个应用都要回到可验证动作',
  ],
  groups: [
    {
      title: '起名与语言系统',
      description: '名字不是标签，而是长期使用的能量入口、社会接口和身份叙事。',
      knowledgeSlugs: [
        'world-yi-naming-system',
        'world-yi-name-identity-interface',
        'world-yi-product-language',
      ],
      caseSlugs: [
        'world-yi-case-name-child',
        'world-yi-case-naming-identity-balance',
      ],
    },
    {
      title: '寻物与路径复原',
      description: '寻物不是靠神秘感，而是通过环境、动线、情绪和注意力复原路径。',
      knowledgeSlugs: [
        'world-yi-lost-and-found',
        'world-yi-lost-item-recovery-path',
        'world-yi-case-method',
      ],
      caseSlugs: [
        'world-yi-case-lost-document',
      ],
    },
    {
      title: '择时与动作窗口',
      description: '择时不是选一个吉日就完事，而是看动作强度、阶段成熟度与风险容忍。',
      knowledgeSlugs: [
        'world-yi-timing-selection',
        'world-yi-daily-application-discipline',
      ],
      caseSlugs: [
        'world-yi-case-wealth-expansion',
      ],
    },
    {
      title: '家宅与恢复系统',
      description: '家宅不是装饰问题，而是休息质量、关系密度和日常恢复能力的问题。',
      knowledgeSlugs: [
        'world-yi-home-order',
        'world-yi-home-recovery-system',
      ],
      caseSlugs: [
        'world-yi-case-house-relocation',
      ],
    },
  ],
} as const;
