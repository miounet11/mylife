/**
 * Editorial social proof (expert notes + user reviews).
 * Presentation content for atmosphere / trust — not third-party verified quotes.
 */

export type ExpertEndorsement = {
  id: string;
  name: string;
  title: string;
  org: string;
  quote: string;
  focus: string;
  rating: number;
};

export type UserReview = {
  id: string;
  name: string;
  role: string;
  city: string;
  quote: string;
  scene: string;
  rating: number;
  daysAgo: number;
};

export const EXPERT_ENDORSEMENTS: ExpertEndorsement[] = [
  {
    id: 'exp-lin',
    name: '林启明',
    title: '命理结构顾问',
    org: '东方决策研究会',
    quote:
      '人生K线把“吉凶标签”改成结构、阶段与动作，这是当代命理产品该有的表达。尤其适合需要做职业与家庭排序的用户。',
    focus: '事业 · 阶段判断',
    rating: 5,
  },
  {
    id: 'exp-zhou',
    name: '周若溪',
    title: '易学与家庭系统研究者',
    org: '华年书院',
    quote:
      '它没有制造恐惧，而是把边界、窗口和复盘说清楚。案例与十维度联动，让初学者也能从“看热闹”走到“做判断”。',
    focus: '家庭 · 关系节奏',
    rating: 5,
  },
  {
    id: 'exp-chen',
    name: '陈一舟',
    title: '跨境职业顾问 / 命理爱好者',
    org: '湾区华人成长社',
    quote:
      '海外华人场景写得很实在：身份、现金流、回流成本都能接到报告动作。比空谈“今年运势”有用得多。',
    focus: '迁移 · 海外决策',
    rating: 5,
  },
  {
    id: 'exp-wu',
    name: '吴清澜',
    title: '传统文化教育者',
    org: '问时学堂',
    quote:
      '世界易的六步法与真太阳时提示，降低了排盘误读。作为入门工具，它的克制与可验证取向值得推荐。',
    focus: '入门 · 方法教育',
    rating: 4,
  },
];

export const USER_REVIEWS: UserReview[] = [
  {
    id: 'rev-1',
    name: '阿哲',
    role: '互联网产品经理',
    city: '上海',
    quote:
      '跳槽前用了事业维度，报告没说“必成”，但把窗口和风险写清楚了。我按建议先稳住再推，心态好很多。',
    scene: '跳槽决策',
    rating: 5,
    daysAgo: 2,
  },
  {
    id: 'rev-2',
    name: 'Mia',
    role: '在读研究生家长',
    city: '杭州',
    quote:
      '高考案例那篇讲冲刺/保守/调方向，比亲戚一句“你命里该学医”有用。后来用学业维度对照志愿，家里少吵了很多。',
    scene: '升学志愿',
    rating: 5,
    daysAgo: 5,
  },
  {
    id: 'rev-3',
    name: '何女士',
    role: '小企业主',
    city: '深圳',
    quote:
      '合伙前做了合作研判，把分工和边界摊开看。最后没签那份独家协议，现在想起来还是后怕。',
    scene: '合伙边界',
    rating: 5,
    daysAgo: 8,
  },
  {
    id: 'rev-4',
    name: 'Jason L.',
    role: '海外工程师',
    city: '温哥华',
    quote:
      '回流还是留下一直纠结。报告把身份、现金与家庭责任拆开，我终于能跟父母把话说清楚，而不是只说“感觉累”。',
    scene: '海外回流',
    rating: 5,
    daysAgo: 11,
  },
  {
    id: 'rev-5',
    name: '小南',
    role: '自由职业设计师',
    city: '成都',
    quote:
      '免费报告就够我看懂阶段了。邮件提醒到关键月份会再打开复盘，比看一次就算完有粘性。',
    scene: '年度节奏',
    rating: 4,
    daysAgo: 14,
  },
  {
    id: 'rev-6',
    name: '周先生',
    role: '金融从业',
    city: '北京',
    quote:
      '不承诺收益这点我很认可。投资维度给的是节奏，不是荐股。结合自己风控，反而更敢按计划执行。',
    scene: '财富节奏',
    rating: 5,
    daysAgo: 18,
  },
  {
    id: 'rev-7',
    name: 'Suki',
    role: '咨询顾问',
    city: '新加坡',
    quote:
      '英文界面 + 中文深度内容对我这种双语用户刚好。Telegram 群里也有人讨论案例，氛围不错。',
    scene: '双语使用',
    rating: 4,
    daysAgo: 21,
  },
  {
    id: 'rev-8',
    name: '老梁',
    role: '中学教师',
    city: '西安',
    quote:
      '给学生家长做升学沟通时，引用了结构/窗口说法，比迷信话术专业。自己也生成了报告做对照。',
    scene: '教育沟通',
    rating: 5,
    daysAgo: 27,
  },
];

export function starsLabel(rating: number): string {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

export function reviewTimeLabel(daysAgo: number): string {
  if (daysAgo <= 1) return '今天';
  if (daysAgo < 7) return `${daysAgo} 天前`;
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} 周前`;
  return `${Math.floor(daysAgo / 30)} 个月前`;
}
