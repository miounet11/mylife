import type { DimensionDefinition, DimensionPriority, DimensionSlug } from './types';

export const DIMENSIONS: DimensionDefinition[] = [
  {
    slug: 'fortune-rhythm',
    order: 1,
    title: '运势节奏',
    question: '我现在处在什么阶段？下一个转折点何时？',
    description: '基于人生 K 线锚点、大运交接与流年节奏，给出阶段判断与行动窗口。',
    icon: '〰️',
    maturity: 'mvp',
    priority: 'p0',
    engineTags: ['kline', 'dayun', 'anchors'],
    relatedIntent: 'yearly',
  },
  {
    slug: 'career-industry',
    order: 2,
    title: '工作行业',
    question: '我适合什么行业/岗位？什么时候适合跳槽？',
    description: '用神、十神与大运窗口叠加行业五行库，给出适配行业与转换节奏。',
    icon: '💼',
    maturity: 'mvp',
    priority: 'p0',
    engineTags: ['yongShen', 'shiShen', 'industries'],
    relatedIntent: 'career',
  },
  {
    slug: 'investment',
    order: 3,
    title: '投资理财',
    question: '我的资金节奏偏激进还是保守？今年宜进宜守？',
    description: '财星、比劫与运势窗口映射资产类型，输出节奏建议（非投资建议）。',
    icon: '📈',
    maturity: 'mvp',
    priority: 'p0',
    engineTags: ['wealth', 'asset-classes', 'kline'],
    relatedIntent: 'wealth',
    disclaimer: '仅供节奏参考，不构成投资建议或收益承诺。',
  },
  {
    slug: 'naming',
    order: 4,
    title: '起名 / 改名',
    question: '这个名字五行是否补用神？改名方向如何？',
    description: '用神匹配 + 字音字义结构，评估姓名对命盘的补充度。',
    icon: '✍️',
    maturity: 'mvp',
    priority: 'p1',
    engineTags: ['yongShen', 'wuxing'],
    relatedIntent: 'yearly',
    disclaimer: '姓名五行评估仅供参考，不承诺任何具体结果。',
  },
  {
    slug: 'health',
    order: 5,
    title: '身体健康',
    question: '哪些系统易偏弱？何时宜体检/调养？',
    description: '五行生理衰减与日主对应，给出体质倾向与养生节奏（非医学诊断）。',
    icon: '🌿',
    maturity: 'mvp',
    priority: 'p1',
    engineTags: ['wuxing', 'health-decay'],
    disclaimer: '生活方式参考，不能替代医疗诊断与治疗。',
    relatedIntent: 'yearly',
  },
  {
    slug: 'study-career',
    order: 6,
    title: '学业事业',
    question: '升学/考试方向？职业瓶颈如何突破？',
    description: '印星食伤与流年文昌，匹配学科五行与备考节奏。',
    icon: '📚',
    maturity: 'mvp',
    priority: 'p1',
    engineTags: ['yinStar', 'shiShang', 'subjects'],
    relatedIntent: 'career',
  },
  {
    slug: 'marriage',
    order: 7,
    title: '谈婚论嫁',
    question: '何时遇正缘？婚期窗口？关系节奏如何？',
    description: '夫妻宫、桃花与合冲结构，输出关系节奏与沟通画像。',
    icon: '💞',
    maturity: 'mvp',
    priority: 'p1',
    engineTags: ['spousePalace', 'peachBlossom'],
    relatedIntent: 'relationship',
  },
  {
    slug: 'partnership',
    order: 8,
    title: '人际合作',
    question: '适合与什么人合作？合伙风险在哪？',
    description: '比劫官杀与日主刚柔，给出合作者画像与分工建议。',
    icon: '🤝',
    maturity: 'mvp',
    priority: 'p2',
    engineTags: ['biJie', 'guanSha'],
    relatedIntent: 'career',
  },
  {
    slug: 'living-environment',
    order: 9,
    title: '居家环境',
    question: '方位与摆设如何补用神？何时宜搬家？',
    description: '方位五行与用神方向，给出环境调整与搬迁择时参考。',
    icon: '🏠',
    maturity: 'mvp',
    priority: 'p2',
    engineTags: ['directions', 'yongShen'],
    relatedIntent: 'yearly',
    disclaimer: '环境建议不构成建筑或装修专业意见。',
  },
  {
    slug: 'timing-selection',
    order: 10,
    title: '择时办事',
    question: '签约、出行、手术、搬家哪天更合适？',
    description: '流日干支与用神匹配评分，输出择日清单与忌讳提醒。',
    icon: '📅',
    maturity: 'mvp',
    priority: 'p2',
    engineTags: ['dailyGanZhi', 'huangli'],
    relatedIntent: 'yearly',
    disclaimer: '医疗事项请以医生建议为第一优先。',
  },
];

export const DIMENSION_BY_SLUG: Record<DimensionSlug, DimensionDefinition> = Object.fromEntries(
  DIMENSIONS.map((item) => [item.slug, item]),
) as Record<DimensionSlug, DimensionDefinition>;

export const MVP_DIMENSION_SLUGS: DimensionSlug[] = DIMENSIONS.filter((item) => item.maturity === 'mvp').map(
  (item) => item.slug,
);

export const PRIORITY_ORDER: Record<DimensionPriority, number> = {
  p0: 0,
  p1: 1,
  p2: 2,
};

export function getDimension(slug: string): DimensionDefinition | null {
  return DIMENSION_BY_SLUG[slug as DimensionSlug] || null;
}

export function listDimensionsSorted(): DimensionDefinition[] {
  return [...DIMENSIONS].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.order - b.order;
  });
}

export function listDimensionsByPriority(priority: DimensionPriority): DimensionDefinition[] {
  return listDimensionsSorted().filter((item) => item.priority === priority);
}
