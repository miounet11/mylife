export type PortalEntry = {
  href: string;
  title: string;
  description: string;
  cta?: string;
};

export const TOOL_ENTRIES: PortalEntry[] = [
  {
    href: '/dimensions',
    title: '十维度深度研判',
    description: '运势节奏、工作行业、投资理财等十个高频问题入口，结论带可验证预测。',
    cta: '进入十维度',
  },
  {
    href: '/dimensions/fortune-rhythm',
    title: '运势节奏研判',
    description: '当前阶段、转折点与行动窗口（P0 推荐）。',
    cta: '开始研判',
  },
  {
    href: '/predictions',
    title: '预测回访',
    description: '查看即将到期与已到期预测，反馈命中情况。',
    cta: '去回访',
  },
  {
    href: '/events',
    title: '事件日历',
    description: '记录现实节点、标记应验，与报告预测闭环校准。',
    cta: '记事件',
  },
  {
    href: '/hehun',
    title: '合婚双盘',
    description: '双方填生日即可对盘；也可从报告/档案一键预填。日主·夫妻宫·用忌·大运同步。',
    cta: '双方生日对盘',
  },
  {
    href: '/teachers',
    title: '请老师',
    description: '按问题选老师：事业、财务、关系、地理、实践等，结合报告与记录作答。',
    cta: '选老师',
  },
  {
    href: '/chat',
    title: '继续对话',
    description: '绑定报告后持续追问；也可先从「请老师」进入对应老师。',
    cta: '去对话',
  },
  {
    href: '/expert-crm',
    title: '专业 CRM',
    description: '从业者本机客户脚本与待回访队列（面谈要点、承诺、回访日）。',
    cta: '打开 CRM',
  },
  {
    href: '/tools/timing-yearly-window',
    title: '2026 流年 / 年度主窗口',
    description: '看今年事业、关系、财富的主窗口与节奏，不必先填完整报告。',
    cta: '免费测年度窗口',
  },
  {
    href: '/tools/application-palmistry-reading',
    title: '手相结构观察',
    description: '上传手掌照片，获得结构层面的辅助观察（非医学诊断）。',
    cta: '上传手相照片',
  },
  {
    href: '/tools/daily-sign',
    title: '今日一签',
    description: '快速获得今日节律提示，适合作为日常复访入口。',
    cta: '抽今日一签',
  },
  {
    href: '/tools/fengshui-simulator',
    title: '商铺风水模拟器',
    description: '行业五行、大门方位、店名、色彩与开业择时的结构化分析（不说吉凶标签）。',
    cta: '开始模拟',
  },
  {
    href: '/tools/fengshui-space',
    title: '空间场模拟工作台',
    description: '热力·立体示意·风口控制台·户型图底板·时辰九星叠加，结构场可视化。',
    cta: '打开工作台',
  },
];

export const DOC_ENTRIES: PortalEntry[] = [
  {
    href: '/docs/birth-info',
    title: '出生信息怎么填',
    description: '公历/农历/四柱、时辰未知时的可信度边界说明。',
  },
  {
    href: '/docs/true-solar-time',
    title: '真太阳时说明',
    description: '为什么出生地点会影响时辰判断，以及边界情况如何处理。',
  },
  {
    href: '/docs/read-first-report',
    title: '报告读法',
    description: '5 分钟完成「结论 → 动作 → 验证」的阅读顺序。',
  },
];

export const DOC_CONTENT: Record<string, { title: string; sections: Array<[string, string]> }> = {
  'birth-info': {
    title: '出生信息怎么填',
    sections: [
      ['先选问题，再填出生信息', '问题类型决定报告侧重点。建议先确定事业、财运、婚恋或年度流年，再补齐出生时间与地点。'],
      ['时辰未知也可以继续', '勾选「时辰未知」后，系统会降低时柱权重，优先给出年/月/日结构判断，并在报告中标注可信度边界。'],
      ['出生地点影响真太阳时', '地点用于时区与真太阳时校正。在时辰边界附近，校正结果可能改变时柱归属。'],
    ],
  },
  'true-solar-time': {
    title: '真太阳时说明',
    sections: [
      ['什么是真太阳时', '真太阳时根据出生地经度，把钟表时间换算为当地太阳位置对应的时辰，用于四柱排盘。'],
      ['什么时候影响大', '在时辰交界（如 23:00 前后、各时辰边界）影响最明显；非边界时段通常不改变大结构。'],
      ['系统默认行为', '工作台默认开启真太阳时校正；报告中会标注校正依据，便于你判断可信度。'],
    ],
  },
  'read-first-report': {
    title: '第一份报告怎么读',
    sections: [
      ['第一屏：核心结论', '先确认报告是否回答了你的核心问题，再看阶段定位与当前得分。'],
      ['第二屏：下一步动作', '把判断落成 1–3 个可验证动作，不要一次消化全部术语。'],
      ['第三屏：验证反馈', '用事件日历记录现实节点，用结构追问拆细行动顺序。'],
    ],
  },
};

export const TOOL_CONTENT: Record<string, { title: string; description: string; analyzeIntent?: string }> = {
  'timing-yearly-window': {
    title: '2026 流年 / 年度主窗口',
    description: '聚焦今年事业、关系、财富的主窗口。完整版需出生信息生成结构化报告。',
    analyzeIntent: 'yearly',
  },
  'application-palmistry-reading': {
    title: '手相结构观察',
    description: '手相作为辅助观察维度，会与八字结构交叉校验。功能正在与生产环境同步。',
  },
  'daily-sign': {
    title: '今日一签',
    description: '每日节律提示，适合作为轻量复访入口。',
  },
};

export const COMMUNITY_CATEGORIES: PortalEntry[] = [
  { href: '/community/category/bazi', title: '八字命盘', description: '日主、用神、大运流年与财官结构讨论。', cta: '进入板块' },
  { href: '/community/category/ziwei', title: '紫微斗数', description: '命宫、四化与宫位角色匹配问题。', cta: '进入板块' },
  { href: '/community/category/liuyao', title: '六爻预测', description: '世应、动变与用神取舍类问题。', cta: '进入板块' },
  { href: '/community/category/world_yi', title: '世界易学说', description: '结构、时位、环境与动作的现代判断框架。', cta: '进入板块' },
  { href: '/community/category/fengshui', title: '风水堪舆', description: '家宅布局、朝向与环境层观察。', cta: '进入板块' },
  { href: '/community/category/geo', title: '海外华人命理', description: '迁移、跨文化与环境重匹配话题。', cta: '进入板块' },
];

export const WORLD_YI_DOMAINS: PortalEntry[] = [
  { href: '/learn/intro', title: '入门轨', description: '30 分钟建立判断底座：真太阳时、报告读法与世界易总论。', cta: '开始学习' },
  { href: '/learn/career', title: '事业轨', description: '角色匹配与阶段重排，用案例验证职业推进节奏。', cta: '进入事业轨' },
  { href: '/learn/wealth', title: '财富轨', description: '节奏、守财与扩张，避免把短期波动当长期结构。', cta: '进入财富轨' },
  { href: '/learn/relationship', title: '关系轨', description: '节奏、边界与修复，先看排序再看合不合。', cta: '进入关系轨' },
  { href: '/knowledge/world-yi-methodology', title: '六步判断法', description: '结构、时位、环境、动作、风险五维框架的系统说明。', cta: '阅读方法论' },
  { href: '/cases', title: '案例库', description: '用真实处境理解世界易如何把判断落成动作。', cta: '浏览案例' },
];