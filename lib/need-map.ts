/**
 * 人生问题地图 · 需求字典
 * A=默认主路径必闭环  B=高频付费SKU  C=专业日用  D=边界外不承诺
 */

export type NeedTier = 'A' | 'B' | 'C' | 'D';
export type NeedStatus = 'covered' | 'partial' | 'building' | 'out_of_scope';

export interface NeedItem {
  id: string;
  tier: NeedTier;
  title: string;
  question: string;
  status: NeedStatus;
  /** 默认报告内锚点或站内路径 */
  href?: string;
  dimensionSlug?: string;
  topicKey?: string;
}

/** 议题 → 十维度深挖 */
export const TOPIC_TO_DIMENSION: Record<string, { slug: string; label: string }> = {
  career: { slug: 'career-industry', label: '工作行业深度研判' },
  wealth: { slug: 'investment', label: '投资理财节奏' },
  marriage: { slug: 'marriage', label: '谈婚论嫁深度研判' },
  health: { slug: 'health', label: '身体健康节奏' },
  overall: { slug: 'fortune-rhythm', label: '运势节奏' },
};

export const NEED_MAP: NeedItem[] = [
  {
    id: 'structure',
    tier: 'A',
    title: '我是谁',
    question: '结构、喜用忌、格局一句话',
    status: 'covered',
    href: '#pro-decision',
  },
  {
    id: 'stage',
    tier: 'A',
    title: '现在什么阶段',
    question: '本月/今年节奏与 K 线高低',
    status: 'covered',
    href: '#pro-time',
  },
  {
    id: 'action',
    tier: 'A',
    title: '现在怎么做',
    question: '最该做 / 最别做',
    status: 'covered',
    href: '#pro-action',
  },
  {
    id: 'career',
    tier: 'A',
    title: '事业行业',
    question: '适不适合、跳槽窗口',
    status: 'covered',
    href: '#pro-topics',
    topicKey: 'career',
    dimensionSlug: 'career-industry',
  },
  {
    id: 'wealth',
    tier: 'A',
    title: '财富节奏',
    question: '守/攻、不宜杠杆',
    status: 'covered',
    href: '#pro-topics',
    topicKey: 'wealth',
    dimensionSlug: 'investment',
  },
  {
    id: 'marriage',
    tier: 'A',
    title: '关系婚恋',
    question: '关系模式与窗口',
    status: 'partial',
    href: '#pro-topics',
    topicKey: 'marriage',
    dimensionSlug: 'marriage',
  },
  {
    id: 'health',
    tier: 'A',
    title: '身体节律',
    question: '调养窗口（非医疗）',
    status: 'covered',
    href: '#pro-topics',
    topicKey: 'health',
    dimensionSlug: 'health',
  },
  {
    id: 'verify',
    tier: 'A',
    title: '验证准不准',
    question: '预测回访与事件校准',
    status: 'covered',
    href: '/predictions',
  },
  {
    id: 'hehun',
    tier: 'B',
    title: '合婚合盘',
    question: '两个人合不合、怎么相处',
    status: 'covered',
    href: '/hehun',
  },
  {
    id: 'events',
    tier: 'A',
    title: '事件日历',
    question: '记录节点、校准预测',
    status: 'covered',
    href: '/events',
  },
  {
    id: 'timing',
    tier: 'B',
    title: '择日办事',
    question: '签约/搬家/领证哪天宜',
    status: 'covered',
    dimensionSlug: 'timing-selection',
    href: '/dimensions/timing-selection',
  },
  {
    id: 'naming',
    tier: 'B',
    title: '起名改名',
    question: '姓名是否补用神',
    status: 'partial',
    dimensionSlug: 'naming',
    href: '/dimensions/naming',
  },
  {
    id: 'move',
    tier: 'B',
    title: '搬家迁移',
    question: '方位与城市匹配',
    status: 'partial',
    dimensionSlug: 'living-environment',
    href: '/dimensions/living-environment',
  },
  {
    id: 'partner',
    tier: 'B',
    title: '合伙合作',
    question: '适合与谁合作',
    status: 'partial',
    dimensionSlug: 'partnership',
    href: '/dimensions/partnership',
  },
  {
    id: 'study',
    tier: 'B',
    title: '学业升学',
    question: '考试与专业方向',
    status: 'partial',
    dimensionSlug: 'study-career',
    href: '/dimensions/study-career',
  },
  {
    id: 'job-pack',
    tier: 'B',
    title: '跳槽决策包',
    question: '宜守宜动清单',
    status: 'covered',
    href: '#pro-packs',
  },
  {
    id: 'medical',
    tier: 'D',
    title: '医疗诊断',
    question: '治病、手术方案',
    status: 'out_of_scope',
  },
  {
    id: 'invest-promise',
    tier: 'D',
    title: '投资保本',
    question: '荐股、收益承诺',
    status: 'out_of_scope',
  },
  {
    id: 'legal',
    tier: 'D',
    title: '法律胜诉',
    question: '官司结果保证',
    status: 'out_of_scope',
  },
];

export function buildDimensionHref(slug: string, reportId?: string) {
  const q = reportId ? `?reportId=${encodeURIComponent(reportId)}` : '';
  return `/dimensions/${slug}${q}`;
}

export function buildTopicDeepLinks(reportId: string, topicKey: string) {
  const dim = TOPIC_TO_DIMENSION[topicKey];
  return {
    dimensionHref: dim ? buildDimensionHref(dim.slug, reportId) : null,
    dimensionLabel: dim?.label || '深度研判',
  };
}

export function needsByTier(tier: NeedTier) {
  return NEED_MAP.filter((n) => n.tier === tier);
}
