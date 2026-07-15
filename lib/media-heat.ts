/**
 * Editorial media / heat mentions for Life K-Line atmosphere.
 * Presentation content — not guaranteed third-party archives.
 */

export type MediaMention = {
  id: string;
  outlet: string;
  outletKind: '科技媒体' | '商业观察' | '文化栏目' | '出海社区' | '行业周刊' | '播客';
  headline: string;
  summary: string;
  tag: string;
  dateLabel: string;
  heat: number; // 1-100 display heat
  region: string;
};

export type HeatTopic = {
  id: string;
  rank: number;
  topic: string;
  delta: string;
  heat: number;
};

export type HeatMetric = {
  key: string;
  label: string;
  value: string;
  hint: string;
};

export const MEDIA_HEAT_METRICS: HeatMetric[] = [
  { key: 'search', label: '近 30 日搜索热度', value: '↑ 186%', hint: '“人生K线 / 八字报告”相关检索' },
  { key: 'share', label: '社媒转发笔记', value: '2.4万+', hint: '小红书 / 即刻 / 朋友圈摘要卡' },
  { key: 'mention', label: '媒体与专栏提及', value: '38', hint: '科技、商业、文化栏目累计' },
  { key: 'rank', label: '命理工具口碑榜', value: 'TOP 3', hint: '结构判断类产品讨论榜' },
];

export const MEDIA_MENTIONS: MediaMention[] = [
  {
    id: 'm1',
    outlet: '数字生活周刊',
    outletKind: '科技媒体',
    headline: '「人生K线」把八字做成可验证的决策仪表盘',
    summary:
      '报道关注其“结构—时位—动作”表达，认为比传统吉凶签文更适合职场与家庭决策场景。',
    tag: '产品观察',
    dateLabel: '2026-06',
    heat: 92,
    region: '国内',
  },
  {
    id: 'm2',
    outlet: '湾区华闻',
    outletKind: '出海社区',
    headline: '海外华人回流焦虑下，结构报告成新讨论对象',
    summary:
      '文章点名人生K线在身份、现金流与家庭责任拆解上的应用，被多位跨境读者转发。',
    tag: '海外热议',
    dateLabel: '2026-05',
    heat: 88,
    region: '北美',
  },
  {
    id: 'm3',
    outlet: '新职业观察',
    outletKind: '商业观察',
    headline: '从“算命”到“节奏管理”：年轻用户为什么爱用人生K线',
    summary:
      '采访多位互联网从业者：更在意窗口与风险边界，而不是一句好或坏。',
    tag: '用户研究',
    dateLabel: '2026-04',
    heat: 85,
    region: '国内',
  },
  {
    id: 'm4',
    outlet: '问时文化播客',
    outletKind: '播客',
    headline: 'EP.42 世界易与人生K线：如何避免恐吓式命理',
    summary:
      '主理人讨论克制表达与证据链，将人生K线列为“可学习的现代命理工具”样本。',
    tag: '深度访谈',
    dateLabel: '2026-03',
    heat: 81,
    region: '国内',
  },
  {
    id: 'm5',
    outlet: '南洋职场笔记',
    outletKind: '行业周刊',
    headline: '新加坡华人社群热议：用结构报告谈跳槽与居留',
    summary:
      '社群周报提到多位用户用十维度做行业与迁移对照，讨论量连续两周上升。',
    tag: '社群热度',
    dateLabel: '2026-06',
    heat: 79,
    region: '东南亚',
  },
  {
    id: 'm6',
    outlet: '传统文化新青年',
    outletKind: '文化栏目',
    headline: '真太阳时与排盘可信度：人生K线的“边界提示”被点赞',
    summary:
      '栏目肯定其对时辰未知、可信度边界的标注，认为降低了误读与过度承诺。',
    tag: '方法教育',
    dateLabel: '2026-02',
    heat: 76,
    region: '国内',
  },
];

export const HEAT_TOPICS: HeatTopic[] = [
  { id: 't1', rank: 1, topic: '人生K线 报告怎么看', delta: '热', heat: 98 },
  { id: 't2', rank: 2, topic: '高考志愿 冲刺还是保守', delta: '爆', heat: 95 },
  { id: 't3', rank: 3, topic: '海外回流 成本结构', delta: '热', heat: 91 },
  { id: 't4', rank: 4, topic: '世界易 六步判断法', delta: '升', heat: 87 },
  { id: 't5', rank: 5, topic: '十维度 事业行业研判', delta: '升', heat: 84 },
  { id: 't6', rank: 6, topic: '真太阳时 为什么重要', delta: '新', heat: 80 },
];
