/**
 * 知识内容编排（内部模块）
 *
 * 注意：L0–L4、排序策略、运营/SEO 意图仅用于代码组织与推荐算法，
 * 禁止以「阶梯/漏斗/破除××」等元叙事出现在用户可见文案中。
 * 对用户只展示具体文章标题、术语说明与相关链接。
 */

export type KnowledgeLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export type KnowledgeNodeKind =
  | 'result'
  | 'term'
  | 'method'
  | 'topic'
  | 'verify'
  | 'track'
  | 'article';

export interface KnowledgeNode {
  id: string;
  level: KnowledgeLevel;
  kind: KnowledgeNodeKind;
  title: string;
  /** 一句话：学完你能回答什么 */
  promise: string;
  /** 为什么现在学（循循善诱） */
  whyNow: string;
  href: string;
  readMinutes: number;
  /** 关联报告概念 */
  terms?: string[];
  topicKey?: string;
}

export interface KnowledgeLevelMeta {
  level: KnowledgeLevel;
  title: string;
  subtitle: string;
  /** 学习阶段标签（对外友好，不碰迷信话术） */
  phaseLabel: string;
  description: string;
}

/** 五层阶梯元信息 */
export const KNOWLEDGE_LEVELS: KnowledgeLevelMeta[] = [
  // phaseLabel/description 仅内部调试用，默认不渲染给用户
  {
    level: 'L0',
    title: '本盘',
    subtitle: '',
    phaseLabel: 'internal',
    description: '',
  },
  {
    level: 'L1',
    title: '名词',
    subtitle: '',
    phaseLabel: 'internal',
    description: '',
  },
  {
    level: 'L2',
    title: '读法',
    subtitle: '',
    phaseLabel: 'internal',
    description: '',
  },
  {
    level: 'L3',
    title: '专题',
    subtitle: '',
    phaseLabel: 'internal',
    description: '',
  },
  {
    level: 'L4',
    title: '工具',
    subtitle: '',
    phaseLabel: 'internal',
    description: '',
  },
];

/** 核心术语 → 知识页（L1 主材） */
export const TERM_KNOWLEDGE: Record<
  string,
  { plain: string; promise: string; href: string; readMinutes: number }
> = {
  日主: {
    plain: '八字里代表「我」的字，看盘的起点',
    promise: '知道日主不是标签牢笼，而是资源气质的起点',
    href: '/knowledge/kb-day-master-plain',
    readMinutes: 6,
  },
  用神: {
    plain: '对你更有帮助的方向，做事顺着它更容易顺',
    promise: '会用用神做「趋利」取舍，而不是求神拜佛',
    href: '/knowledge/kb-yong-shen-guide',
    readMinutes: 8,
  },
  喜神: {
    plain: '辅助用神的有利因素，可一起加强',
    promise: '分清用神与喜神，避免什么都想要',
    href: '/knowledge/kb-yong-shen-guide',
    readMinutes: 5,
  },
  忌神: {
    plain: '容易消耗你的方向，大事上少硬碰',
    promise: '理解忌神不是诅咒，是高压时别梭哈',
    href: '/knowledge/kb-ji-shen-boundary',
    readMinutes: 6,
  },
  大运: {
    plain: '大约十年一段的人生节奏主题',
    promise: '会读当前十年主题，知道该攻还是该守',
    href: '/knowledge/kb-dayun-liunian',
    readMinutes: 7,
  },
  流年: {
    plain: '某一年的整体气候，叠加在大运上',
    promise: '会把「今年天气」叠到十年主题上看',
    href: '/knowledge/kb-dayun-liunian',
    readMinutes: 7,
  },
  格局: {
    plain: '命盘的整体类型标签，概括结构特征',
    promise: '知道格局好不好不如「适不适合现在的动作」',
    href: '/knowledge/kb-pattern-plain',
    readMinutes: 6,
  },
  人生K线: {
    plain: '把大运流年加权成一生高低曲线',
    promise: '会看高低点与当前落点，不再被单年吓到',
    href: '/knowledge/kb-life-kline-read',
    readMinutes: 8,
  },
  四柱: {
    plain: '年柱月柱日柱时柱，八个字的时间坐标',
    promise: '分清四柱各偏重什么，建立读盘坐标',
    href: '/knowledge/kb-four-pillars-map',
    readMinutes: 7,
  },
};

/** 方法层固定节点（L2） */
export const METHOD_NODES: KnowledgeNode[] = [
  {
    id: 'method-read-report',
    level: 'L2',
    kind: 'method',
    title: '如何阅读分析报告',
    promise: '报告各模块怎么读',
    whyNow: '',
    href: '/knowledge/how-to-read-bazi-report',
    readMinutes: 8,
  },
  {
    id: 'method-solar',
    level: 'L2',
    kind: 'method',
    title: '真太阳时与命盘',
    promise: '时辰与地点对排盘的影响',
    whyNow: '',
    href: '/knowledge/true-solar-time-guide',
    readMinutes: 6,
  },
  {
    id: 'method-world-yi',
    level: 'L2',
    kind: 'method',
    title: '世界易方法论：结构·时位·环境·动作·风险',
    promise: '把问题拆成结构、时间、环境、动作与风险',
    whyNow: '',
    href: '/knowledge/world-yi-methodology',
    readMinutes: 10,
  },
];

/** 议题 → 知识/学习轨 */
export const TOPIC_LEARNING: Record<
  string,
  { track: string; trackHref: string; articleHref: string; articleTitle: string; promise: string }
> = {
  career: {
    track: '事业轨',
    trackHref: '/learn/career',
    articleHref: '/knowledge/world-yi-career-role-fit',
    articleTitle: '世界易事业观：角色匹配与阶段',
    promise: '会判断现在是内部做深还是换环境',
  },
  wealth: {
    track: '财富轨',
    trackHref: '/learn/wealth',
    articleHref: '/knowledge/world-yi-wealth-rhythm',
    articleTitle: '世界易财富观：节奏与守财',
    promise: '会先看现金流与杠杆边界，再谈扩张',
  },
  marriage: {
    track: '关系轨',
    trackHref: '/learn/relationship',
    articleHref: '/knowledge/world-yi-relationship-order',
    articleTitle: '世界易关系观：节奏与边界',
    promise: '把「合不合」换成「节奏与边界是否对齐」',
  },
  health: {
    track: '健康轨',
    trackHref: '/learn/health',
    articleHref: '/knowledge/world-yi-health-boundary',
    articleTitle: '健康边界：生活节律而非诊断',
    promise: '用节律与负荷管理，不把命理当看病',
  },
};

/** 验证层节点（L4） */
export const VERIFY_NODES: KnowledgeNode[] = [
  {
    id: 'verify-events',
    level: 'L4',
    kind: 'verify',
    title: '事件本',
    promise: '记录关键节点与结果',
    whyNow: '',
    href: '/events',
    readMinutes: 5,
  },
  {
    id: 'verify-predictions',
    level: 'L4',
    kind: 'verify',
    title: '预测回访',
    promise: '到期对照与打分',
    whyNow: '',
    href: '/predictions',
    readMinutes: 5,
  },
  {
    id: 'verify-learn-map',
    level: 'L4',
    kind: 'track',
    title: '专题地图',
    promise: '事业、财富、关系等专题',
    whyNow: '',
    href: '/learn',
    readMinutes: 8,
  },
];

export function levelMeta(level: KnowledgeLevel): KnowledgeLevelMeta {
  return KNOWLEDGE_LEVELS.find((l) => l.level === level) || KNOWLEDGE_LEVELS[0]!;
}

export function termPlain(term: string): string {
  return TERM_KNOWLEDGE[term]?.plain || '';
}

export function termHref(term: string): string | undefined {
  return TERM_KNOWLEDGE[term]?.href;
}
