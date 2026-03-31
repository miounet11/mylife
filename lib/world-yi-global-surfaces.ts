export type WorldYiGlobalTopicKey =
  | 'identity'
  | 'career'
  | 'family'
  | 'education';

export interface WorldYiGlobalTopicSurface {
  key: WorldYiGlobalTopicKey;
  title: string;
  summary: string;
  headline: string;
  description: string;
  doctrine: string[];
  knowledgeSlugs: string[];
  caseSlugs: string[];
}

export type WorldYiEnglishTrackKey =
  | 'foundation'
  | 'global-life'
  | 'wealth'
  | 'relationships';

export interface WorldYiEnglishTrackSurface {
  key: WorldYiEnglishTrackKey;
  title: string;
  summary: string;
  headline: string;
  description: string;
  doctrine: string[];
  knowledgeSlugs: string[];
  caseSlugs: string[];
}

export const worldYiGlobalTopicSurfaces: Record<WorldYiGlobalTopicKey, WorldYiGlobalTopicSurface> = {
  identity: {
    key: 'identity',
    title: '全球华人身份专题',
    summary: '不只讨论文化认同，而是讨论迁移之后的人如何在双边压力里重新站稳。',
    headline: '海外身份问题真正难的，不是选边站，而是如何在多重语境里继续保持判断力。',
    description: '世界易把海外身份理解成结构、阶段、环境与叙事的复合问题。它不只问你属于哪里，而是问你现在用什么秩序承接自己的多重现实。',
    doctrine: [
      '身份不是标签，而是长期运行方式',
      '双边生活会放大阶段错读',
      '文化焦虑常常连着职业和家庭焦虑',
      '先稳判断，再谈归属叙事',
    ],
    knowledgeSlugs: [
      'world-yi-overseas-chinese',
      'world-yi-cross-cultural-identity',
      'world-yi-global-chinese-decision-map',
    ],
    caseSlugs: [
      'world-yi-case-return-or-stay',
      'world-yi-case-dual-city-fatigue',
      'world-yi-case-global-family-balance',
    ],
  },
  career: {
    key: 'career',
    title: '全球华人职业专题',
    summary: '处理海外职业重启、跨境创业、身份断层与环境放大器失效。',
    headline: '海外职业真正难的，不只是重新找工作，而是旧能力在新环境里突然失去放大器。',
    description: '世界易把海外职业看成环境重置后的结构重译工程。职业断层、跨境创业、身份成本和现金流压力必须一起看，不能只给励志答案。',
    doctrine: [
      '职业重启不等于从零做人',
      '先找回可翻译能力，再谈扩张',
      '窗口不等于结构成熟',
      '海外创业最怕多线同时压满',
    ],
    knowledgeSlugs: [
      'world-yi-overseas-career-reset',
      'world-yi-environment-method',
      'world-yi-judgment-crisis',
    ],
    caseSlugs: [
      'world-yi-case-overseas-career-reset',
      'world-yi-case-cross-border-founder',
      'world-yi-case-migration-fit',
    ],
  },
  family: {
    key: 'family',
    title: '全球华人家庭专题',
    summary: '处理跨文化婚姻、代际照护、双边家庭责任与长期翻译成本。',
    headline: '全球家庭问题真正痛的，不是忙，而是所有现实线都在同时压来，却没有先后顺序。',
    description: '世界易把海外家庭问题拉回责任排序、翻译成本、照护系统和生活重心。不是谁更爱家人，而是谁在长期代替整个系统承担无形成本。',
    doctrine: [
      '翻译成本如果不重分配，关系会越来越累',
      '照护不能永远靠紧急状态维持',
      '家庭排序必须进入系统，不靠内疚硬扛',
      '先稳不可逆层，再处理可延后层',
    ],
    knowledgeSlugs: [
      'world-yi-bicultural-marriage',
      'world-yi-overseas-eldercare',
      'world-yi-family-generational-order',
    ],
    caseSlugs: [
      'world-yi-case-bicultural-marriage',
      'world-yi-case-overseas-eldercare',
      'world-yi-case-global-family-balance',
    ],
  },
  education: {
    key: 'education',
    title: '全球华人教育专题',
    summary: '孩子语言、学校路径、身份传承和家庭生活路线必须一起判断。',
    headline: '教育问题表面像学校选择，底层却常常是家庭未来几年生活路线的选择。',
    description: '世界易不把全球育儿问题缩成学校排名，而是把语言、身份、居住、现金流和陪伴结构一起放回同一张图里。',
    doctrine: [
      '先排家庭路线，再排学校',
      '语言问题常常连着身份问题',
      '教育焦虑很多时候是在代替迁移焦虑',
      '孩子路径必须和家庭承载度一起看',
    ],
    knowledgeSlugs: [
      'world-yi-global-child-education',
      'world-yi-cross-cultural-identity',
      'world-yi-global-chinese-decision-map',
    ],
    caseSlugs: [
      'world-yi-case-child-language-identity',
      'world-yi-case-global-school-choice',
      'world-yi-case-naming-identity-balance',
    ],
  },
};

export const worldYiEnglishTrackSurfaces: Record<WorldYiEnglishTrackKey, WorldYiEnglishTrackSurface> = {
  foundation: {
    key: 'foundation',
    title: 'World Yi English Foundation',
    summary: 'The English-facing philosophical and methodological entry into World Yi.',
    headline: 'Before users trust a case, they need a usable decision vocabulary.',
    description: 'This track translates World Yi into clear English without flattening it into generic self-help. It is the entry point for readers who need structure, timing, environment, and action as a coherent language.',
    doctrine: [
      'Structure before labels',
      'Stage before emotional panic',
      'Environment before motivational fantasy',
      'Action before abstraction',
    ],
    knowledgeSlugs: [
      'world-yi-en-introduction',
      'world-yi-en-judgment-language',
    ],
    caseSlugs: [
      'world-yi-en-case-career-timing',
    ],
  },
  'global-life': {
    key: 'global-life',
    title: 'World Yi Global Life Track',
    summary: 'For migration, bicultural identity, and cross-border living pressure.',
    headline: 'Global life questions are rarely just geography questions.',
    description: 'This track is for readers dealing with migration, bicultural identity, family transition, and cross-border decision pressure. It shows why World Yi treats environment and stage as central, not secondary.',
    doctrine: [
      'Global life is a stage question',
      'Migration pressure changes relational cost',
      'Identity fatigue is often an environment signal',
      'Do not confuse movement with direction',
    ],
    knowledgeSlugs: [
      'world-yi-en-global-life',
      'world-yi-en-introduction',
    ],
    caseSlugs: [
      'world-yi-en-case-global-return',
      'world-yi-en-case-naming-across-cultures',
    ],
  },
  wealth: {
    key: 'wealth',
    title: 'World Yi Wealth Track',
    summary: 'For readers who need a layered language for earning, retaining, and scaling.',
    headline: 'Money questions get clearer when earning, retention, and expansion are separated.',
    description: 'This track turns wealth into a layered reading of entry pattern, retention, pressure tolerance, and timing. It is especially useful for readers who know income is not the whole story.',
    doctrine: [
      'Income is not the same as durable wealth',
      'Expansion without timing becomes pressure',
      'Retention is its own discipline',
      'Wealth questions must return to order',
    ],
    knowledgeSlugs: [
      'world-yi-en-wealth-pattern',
      'world-yi-en-judgment-language',
    ],
    caseSlugs: [
      'world-yi-en-case-career-timing',
      'world-yi-en-case-burnout',
    ],
  },
  relationships: {
    key: 'relationships',
    title: 'World Yi Relationship Track',
    summary: 'For readers who need a non-fatalistic way to read pace, boundaries, and environment.',
    headline: 'Relationship questions get stronger when pace and environment are put back into the picture.',
    description: 'This track is for readers who are tired of compatibility slogans. It focuses on pace, boundaries, migration pressure, emotional cost, and realistic action.',
    doctrine: [
      'Compatibility is too small a question',
      'Pace often matters more than intensity',
      'Environment alters emotional cost',
      'The point is action, not fatalism',
    ],
    knowledgeSlugs: [
      'world-yi-en-relationship-environment',
      'world-yi-en-judgment-language',
    ],
    caseSlugs: [
      'world-yi-en-case-relationship-pacing',
      'world-yi-en-case-naming-across-cultures',
    ],
  },
};
