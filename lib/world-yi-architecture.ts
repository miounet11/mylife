/**
 * World Yi v2 knowledge architecture.
 * School identity: this era rereads historical meaning-systems.
 * Organizer: 结构 → 时位 → 环境 → 动作 → 风险 → 复盘.
 * Instantiation: 八字/易学 is one engine, shown in parallel with the World Yi reading.
 */

export type WorldYiArchLayerId = 'identity' | 'organizer' | 'libraries' | 'era' | 'instantiation' | 'applications';

export type WorldYiArchNode = {
  id: WorldYiArchLayerId;
  name: string;
  role: string;
  href: string;
  children: Array<{ label: string; href: string; note: string }>;
};

export const WORLD_YI_MOTHER_TONGUE = [
  '我不是乱，我是有结构的。',
  '我不是倒霉，我是处在某个阶段。',
  '我不是没路，我是进退顺序错了。',
  '我不是只能等命运，我可以重建判断。',
] as const;

export const WORLD_YI_LIBRARIES = [
  { id: 'yixue', name: '易学', takes: '变易、时位、动态结构', refuse: '不做成封闭注疏宗派' },
  { id: 'xuan', name: '玄学 / 命理', takes: '日主、用神、十神作为结构语言的一种实例', refuse: '不另开一家算命店' },
  { id: 'psych', name: '心理学', takes: '误判、重复、冻结、知行分裂', refuse: '不冒充诊疗' },
  { id: 'phil', name: '哲学', takes: '概念边界、不自相矛盾', refuse: '不做成学院空话' },
  { id: 'reli', name: '宗教学', takes: '意义、仪式、象征、共同体', refuse: '不新建宗教' },
  { id: 'theo', name: '神学', takes: '苦难、限制、超越', refuse: '不写成信条' },
  { id: 'astro', name: '星座 / 天时', takes: '时代与心情作为环境层', refuse: '不用过宫断个人暴富破产' },
] as const;

export const WORLD_YI_ARCHITECTURE: WorldYiArchNode[] = [
  {
    id: 'identity',
    name: '身份',
    role: '当代解释学：用此刻的社会、认知、环境变化，重读历史上的意义系统。',
    href: '/knowledge/world-yi-v1-manifesto',
    children: [
      { label: 'v1 总论', href: '/knowledge/world-yi-v1-manifesto', note: '从吉凶标签到判断底座' },
      { label: '人文学基座', href: '/knowledge/world-yi-humanities-synthesis', note: '宗教/心理/哲学/神学如何进入' },
      { label: '吸引力模型', href: '/knowledge/world-yi-attraction-model', note: '意义、主体、秩序、文化' },
    ],
  },
  {
    id: 'organizer',
    name: '组织法',
    role: '结构 → 时位 → 环境 → 动作 → 风险 → 复盘。读任何传统都先过这六层。',
    href: '/knowledge/world-yi-methodology',
    children: [
      { label: '六步判断法', href: '/knowledge/world-yi-methodology', note: '像不像，不是好不好' },
      { label: '六步图解', href: '/visual-assets/world-yi-six-step-method', note: '定问题到标风险' },
      { label: '定义与处境', href: '/world-yi/logic', note: '公共定义 + 处境对照' },
    ],
  },
  {
    id: 'libraries',
    name: '历史库',
    role: '易、玄、神、心、星、哲。各取有效部分，各有拒绝句。',
    href: '/knowledge/world-yi-humanities-synthesis',
    children: WORLD_YI_LIBRARIES.map((item) => ({
      label: item.name,
      href: '/knowledge/world-yi-humanities-synthesis',
      note: item.takes,
    })),
  },
  {
    id: 'era',
    name: '时代环境',
    role: '社会压力、认知负荷、城市与天时。是环境层，不是命运开关。',
    href: '/world-yi/era-timing',
    children: [
      { label: '时代天时', href: '/world-yi/era-timing', note: '外行星 / 土木 / 火逆' },
      { label: '城市主题', href: '/world-yi/cities', note: '空间环境压力测试' },
    ],
  },
  {
    id: 'instantiation',
    name: '实例化',
    role: '八字引擎给出日主与用神；世界易引擎把它译成发挥、阶段、硬约束与 30 天动作。两套并行，不互相改写。',
    href: '/analyze',
    children: [
      { label: '结构报告', href: '/analyze', note: '易学事实 + 世界易读法' },
      { label: '用神表述纪律', href: '/engines', note: '扶抑主用神，调候单列' },
    ],
  },
  {
    id: 'applications',
    name: '应用',
    role: '六域与十维度是同一组织法落到具体问题，不是第二套理论。',
    href: '/world-yi/domains',
    children: [
      { label: '人生六域', href: '/world-yi/domains', note: '事业财富关系健康家庭迁移' },
      { label: '十维度', href: '/dimensions', note: '问题入口，不是平行学派' },
    ],
  },
];
