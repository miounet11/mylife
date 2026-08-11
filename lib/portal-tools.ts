import type { PortalEntry } from '@/lib/portal-nav';

export type ToolCategoryKey =
  | 'career'
  | 'wealth'
  | 'relationship'
  | 'family'
  | 'health'
  | 'migration'
  | 'application';

export const TOOL_CATEGORY_META: Record<ToolCategoryKey, { title: string; description: string }> = {
  career: { title: '事业专项工具', description: '聚焦角色匹配、阶段重排与职业节奏验证。' },
  wealth: { title: '财富专项工具', description: '节奏、守财与扩张窗口的快速判断入口。' },
  relationship: { title: '关系专项工具', description: '关系排序、节奏与边界相关的结构观察。' },
  family: { title: '家庭专项工具', description: '代际分工、家宅环境与家庭排序判断。' },
  health: { title: '健康专项工具', description: '恢复节奏与系统边界观察（非医学诊断）。' },
  migration: { title: '迁移专项工具', description: '留回决策、城市匹配与环境重排。' },
  application: { title: '应用专项工具', description: '择时、起名、寻物等生活判断工具。' },
};

/**
 * Tools hub product groups — "what kind of tool is this"
 * (orthogonal to life-domain categories career/wealth/…).
 */
export type ToolHubGroupKey =
  | 'quick'
  | 'structure'
  | 'relationship'
  | 'naming_face'
  | 'space'
  | 'daily'
  | 'verify'
  | 'consult';

export type ToolHubGroup = {
  key: ToolHubGroupKey;
  title: string;
  description: string;
  tools: PortalEntry[];
};

/** Best-match intent chips on /tools — one click to the strongest entry. */
export type ToolIntentMatch = {
  id: string;
  label: string;
  hint: string;
  href: string;
};

export const TOOL_INTENT_MATCHES: ToolIntentMatch[] = [
  {
    id: 'yearly',
    label: '看今年运势',
    hint: '年度主窗口',
    href: '/tools/timing-yearly-window?source=tools_intent_yearly',
  },
  {
    id: 'career',
    label: '事业 / 跳槽',
    hint: '事业结构报告',
    href: '/analyze?intent=career&source=tools_intent_career',
  },
  {
    id: 'wealth',
    label: '财运节奏',
    hint: '财富结构报告',
    href: '/analyze?intent=wealth&source=tools_intent_wealth',
  },
  {
    id: 'marriage',
    label: '婚恋合婚',
    hint: '合婚双盘',
    href: '/hehun?source=tools_intent_marriage',
  },
  {
    id: 'naming',
    label: '起名改名',
    hint: '起名工坊',
    href: '/tools/naming?source=tools_intent_naming',
  },
  {
    id: 'daily',
    label: '今日宜忌',
    hint: '黄历 · 日运',
    href: '/almanac?source=tools_intent_daily',
  },
  {
    id: 'fengshui',
    label: '家 / 店风水',
    hint: '空间场工作台',
    href: '/tools/fengshui-space?source=tools_intent_fengshui',
  },
  {
    id: 'full',
    label: '完整命盘',
    hint: '免费结构报告',
    href: '/analyze?source=tools_intent_full',
  },
];

export const TOOL_HUB_GROUPS: ToolHubGroup[] = [
  {
    key: 'quick',
    title: '快速测（填生日即可）',
    description: '不必先出完整报告，单项主题即时判断。',
    tools: [
      {
        href: '/tools/timing-yearly-window',
        title: '2026 年度主窗口',
        description: '今年事业 / 关系 / 财富的推进与防守节奏。',
        cta: '免费测',
      },
      {
        href: '/tools/daily-sign',
        title: '今日一签',
        description: '短周期节律：推进 / 观察 / 收敛。',
        cta: '抽一签',
      },
      {
        href: '/hehun',
        title: '合婚双盘',
        description: '双方生日对盘，日主·夫妻宫·用忌同步。',
        cta: '对盘',
      },
      {
        href: '/tools/naming',
        title: '起名工坊',
        description: '生辰用神 · 康熙笔画 · 个人/改名/公司。',
        cta: '起名',
      },
    ],
  },
  {
    key: 'structure',
    title: '完整结构与场景深拆',
    description: '从整盘报告到十维度专项研判。',
    tools: [
      {
        href: '/analyze',
        title: '完整结构报告',
        description: '八字排盘 + 人生K线 + 阶段动作，免费生成。',
        cta: '去测算',
      },
      {
        href: '/dimensions',
        title: '十维度深度研判',
        description: '运势、事业、投资、婚恋等十个高频场景。',
        cta: '进入',
      },
      {
        href: '/dimensions/fortune-rhythm',
        title: '运势节奏研判',
        description: '当前阶段、转折点与行动窗口。',
        cta: '开始',
      },
      {
        href: '/dimensions/career-industry',
        title: '工作行业研判',
        description: '行业适配、岗位建议与转换窗口。',
        cta: '开始',
      },
      {
        href: '/profile/foundation',
        title: '人生数据底座',
        description: '生辰 · 星座 · 相学 · 问答信号，统一完整度。',
        cta: '完善',
      },
    ],
  },
  {
    key: 'relationship',
    title: '关系 · 合婚 · 家庭',
    description: '双盘对照与关系节奏专项。',
    tools: [
      {
        href: '/hehun',
        title: '合婚双盘',
        description: '双方填生日即可；可从报告预填。',
        cta: '对盘',
      },
      {
        href: '/dimensions/marriage',
        title: '谈婚论嫁研判',
        description: '关系窗口、夫妻宫与沟通节奏。',
        cta: '研判',
      },
      {
        href: '/dimensions/partnership',
        title: '人际合作研判',
        description: '合作者画像、分工与合伙风险。',
        cta: '研判',
      },
      {
        href: '/analyze?intent=relationship&source=tools_hub_rel',
        title: '关系结构报告',
        description: '关系排序、节奏与修复路径。',
        cta: '生成',
      },
    ],
  },
  {
    key: 'naming_face',
    title: '起名 · 面相 · 手相',
    description: '姓名补益与相学结构观察（非医学诊断）。',
    tools: [
      {
        href: '/tools/naming',
        title: '起名工坊',
        description: '用神 · 笔画 · 多场景方案。',
        cta: '起名',
      },
      {
        href: '/dimensions/naming',
        title: '起名 / 改名深度研判',
        description: '绑定命盘的姓名五行补益。',
        cta: '深度测名',
      },
      {
        href: '/tools/physiognomy',
        title: '面相观察',
        description: '上传面部照片，可选生辰交叉。',
        cta: '上传',
      },
      {
        href: '/tools/palmistry',
        title: '手相观察',
        description: '掌纹结构分 + 可授权脱敏线图。',
        cta: '上传',
      },
    ],
  },
  {
    key: 'space',
    title: '风水 · 空间场',
    description: '家宅与商铺环境层结构化分析。',
    tools: [
      {
        href: '/tools/fengshui-space',
        title: '空间场工作台',
        description: 'CAD · AI 美化 · 完整报表 · 人宅合参。',
        cta: '打开',
      },
      {
        href: '/tools/fengshui-simulator',
        title: '商铺风水模拟器',
        description: '行业五行、方位、色彩与开业择时。',
        cta: '模拟',
      },
      {
        href: '/dimensions/living-environment',
        title: '居家环境研判',
        description: '方位摆设与搬迁窗口参考。',
        cta: '研判',
      },
    ],
  },
  {
    key: 'daily',
    title: '日常节律',
    description: '黄历、星座、择时与每日轻量入口。',
    tools: [
      {
        href: '/almanac',
        title: '今日黄历 · 万年历',
        description: '宜忌、十二时辰；绑定生辰看个人日运。',
        cta: '看今天',
      },
      {
        href: '/astro',
        title: '星座百科',
        description: '十二星座 · 48 星区 · 上升。',
        cta: '打开',
      },
      {
        href: '/tools/zodiac',
        title: '星座 · 生肖推算',
        description: '由生日推导，可选月亮/上升写入底座。',
        cta: '推算',
      },
      {
        href: '/tools/daily-sign',
        title: '今日一签',
        description: '日常复访的轻量节奏提示。',
        cta: '抽签',
      },
      {
        href: '/dimensions/timing-selection',
        title: '择时办事研判',
        description: '流日评分 + 宜忌日期清单。',
        cta: '择时',
      },
      {
        href: '/tools/liuyao-cast',
        title: '六爻起卦',
        description: '一事一卦，结构观察（教育向）。',
        cta: '起卦',
      },
      {
        href: '/tools/ziwei-edu',
        title: '紫微斗数入门',
        description: '命宫与宫位角色的教育向排盘。',
        cta: '打开',
      },
    ],
  },
  {
    key: 'verify',
    title: '验证闭环',
    description: '记录现实节点，回测判断是否命中。',
    tools: [
      {
        href: '/predictions',
        title: '预测回访',
        description: '即将到期与已到期预测，反馈命中。',
        cta: '去回访',
      },
      {
        href: '/events',
        title: '事件日历',
        description: '记录节点、标记应验，校准下一轮。',
        cta: '记事件',
      },
      {
        href: '/annual-review',
        title: '年度复盘',
        description: '把一年的窗口与结果对齐复盘。',
        cta: '复盘',
      },
    ],
  },
  {
    key: 'consult',
    title: '老师与追问',
    description: '按问题选老师，或绑定报告持续追问。',
    tools: [
      {
        href: '/teachers',
        title: '请老师',
        description: '事业、财务、关系、地理等按问题分流。',
        cta: '选老师',
      },
      {
        href: '/chat?mode=opening&teacher=overview&source=tools_hub_consult',
        title: '结构追问',
        description: '绑定报告后持续追问，锚定真值。',
        cta: '去对话',
      },
      {
        href: '/expert-crm',
        title: '专业 CRM',
        description: '从业者本机客户脚本与待回访队列。',
        cta: '打开',
      },
    ],
  },
];

const CATEGORY_TOOLS: Record<ToolCategoryKey, PortalEntry[]> = {
  career: [
    { href: '/dimensions/partnership', title: '人际合作研判', description: '合作者画像、分工建议与合伙风险。', cta: '开始研判' },
    { href: '/dimensions/career-industry', title: '工作行业深度研判', description: '行业适配 Top3、岗位建议与转换窗口。', cta: '开始研判' },
    { href: '/analyze?intent=career&source=tool_category_career', title: '事业结构报告', description: '完整事业节奏与角色匹配判断。', cta: '生成报告' },
    { href: '/tools/timing-yearly-window', title: '2026 年度主窗口', description: '看今年事业推进的主窗口。', cta: '免费测试' },
    { href: '/events', title: '事件验证', description: '记录职业节点，回测判断。', cta: '记录事件' },
  ],
  wealth: [
    { href: '/dimensions/investment', title: '投资理财节奏', description: '资金风格、资产匹配与今年进退节奏（非投资建议）。', cta: '开始研判' },
    { href: '/analyze?intent=wealth&source=tool_category_wealth', title: '财富结构报告', description: '财富节奏、守财与扩张判断。', cta: '生成报告' },
    { href: '/tools/timing-yearly-window', title: '2026 流年窗口', description: '年度财富节奏快速观察。', cta: '免费测试' },
    { href: '/knowledge/world-yi-wealth-rhythm', title: '世界易财富观', description: '理解财富进入与留存系统。', cta: '阅读' },
  ],
  relationship: [
    { href: '/dimensions/marriage', title: '谈婚论嫁深度研判', description: '关系窗口、夫妻宫与沟通节奏。', cta: '开始研判' },
    { href: '/hehun', title: '合婚双盘', description: '日主·夫妻宫·用忌·大运同步，带入本盘对照。', cta: '合婚对照' },
    { href: '/analyze?intent=relationship&source=tool_category_relationship', title: '关系结构报告', description: '关系排序、节奏与修复路径。', cta: '生成报告' },
    { href: '/tools/daily-sign', title: '今日一签', description: '轻量关系节律提示。', cta: '抽一签' },
    { href: '/cases/world-yi-case-family-duty', title: '家庭排序案例', description: '理解冲突中的排序问题。', cta: '阅读案例' },
  ],
  family: [
    { href: '/analyze?intent=relationship&source=tool_category_family', title: '家庭结构报告', description: '代际责任与家庭分工判断。', cta: '生成报告' },
    { href: '/knowledge/world-yi-family-generational-order', title: '世界易家庭观', description: '代际排序与现代家庭难点。', cta: '阅读' },
    { href: '/events', title: '家庭事件记录', description: '记录家庭关键节点。', cta: '记录事件' },
  ],
  health: [
    { href: '/dimensions/health', title: '身体健康节奏', description: '体质倾向、调养窗口（非医学诊断）。', cta: '开始研判' },
    { href: '/analyze?intent=yearly&source=tool_category_health', title: '年度健康节奏', description: '系统层面的恢复与节奏观察。', cta: '生成报告' },
    { href: '/knowledge/world-yi-health-boundary', title: '健康边界', description: '命理观察不替代医疗判断。', cta: '阅读' },
    { href: '/tools/daily-sign', title: '今日节律', description: '每日轻量状态提示。', cta: '抽一签' },
  ],
  migration: [
    { href: '/world-yi/cities', title: '世界易城市主题', description: '城市是环境层压力测试，不是吉凶名单。', cta: '打开城市卡' },
    { href: '/dimensions/living-environment', title: '居家环境研判', description: '方位摆设与搬迁窗口参考。', cta: '开始研判' },
    { href: '/analyze?source=tool_category_migration', title: '迁移匹配报告', description: '留回决策与环境成本结构。', cta: '生成报告' },
    { href: '/insights/city/world-yi-vancouver', title: '温哥华城市观察', description: '海外华人环境层样例。', cta: '阅读洞察' },
    { href: '/knowledge/world-yi-migration-stage-logic', title: '世界易迁移观', description: '迁移不是换地图，是重匹配。', cta: '阅读' },
  ],
  application: [
    { href: '/almanac', title: '万年历黄历', description: '每日宜忌、时辰吉凶；绑定生辰看个人日运。', cta: '打开万年历' },
    { href: '/world-yi/era-timing', title: '时代天时', description: '宏观星象与技术阶段：拐点、压力、摩擦窗口。', cta: '打开' },
    { href: '/profile/foundation', title: '人生数据底座', description: '八字 · 星座 · 相学 · 问答 · 工具信号统一完整度。', cta: '完善参数' },
    { href: '/astro', title: '星座百科', description: '十二星座 · 48星区 · 上升；关联世界易与黄历。', cta: '打开' },
    { href: '/tools/zodiac', title: '星座 · 生肖工具', description: '太阳星座与生肖推导，月亮/上升写入底座。', cta: '推算' },
    { href: '/tools/naming', title: '起名工坊', description: '生辰用神 · 康熙笔画 · 个人/改名/公司/产品。', cta: '开始起名' },
    { href: '/tools/physiognomy', title: '面相观察', description: '上传面部照片，可选生辰交叉，私有存图。', cta: '上传面相' },
    { href: '/tools/palmistry', title: '手相观察', description: '上传掌纹照片，结构分 + 可授权脱敏线图。', cta: '上传手相' },
    { href: '/tools/fengshui-space', title: '空间场工作台', description: 'CAD · AI 美化 · 完整报表 · 人宅合参。', cta: '打开' },
    { href: '/dimensions/timing-selection', title: '择时办事研判', description: '流日评分 + 宜忌日期清单。', cta: '开始研判' },
    { href: '/dimensions/naming', title: '起名 / 改名研判', description: '姓名五行与用神补益深度研判（绑定命盘）。', cta: '深度测名' },
    { href: '/dimensions/fortune-rhythm', title: '运势节奏研判', description: '当前阶段、转折点与行动窗口。', cta: '开始研判' },
    { href: '/events', title: '事件日历', description: '记录节点、应验反馈，校准下一轮判断。', cta: '记事件' },
    { href: '/chat', title: '结构追问', description: '绑定报告持续追问，锚定真值。', cta: '去追问' },
    { href: '/tools/fengshui-simulator', title: '商铺风水模拟器', description: '行业五行、方位匹配、色彩与开业择时。', cta: '开始模拟' },
    { href: '/knowledge/world-yi-timing-selection', title: '世界易择时观', description: '择时服务于动作顺序。', cta: '阅读' },
    { href: '/knowledge/world-yi-naming-system', title: '世界易起名观', description: '姓名作为环境层补充。', cta: '阅读' },
  ],
};

export function getToolCategory(key: string): ToolCategoryKey | null {
  return key in TOOL_CATEGORY_META ? (key as ToolCategoryKey) : null;
}

export function getToolsForCategory(key: ToolCategoryKey): PortalEntry[] {
  return CATEGORY_TOOLS[key] || [];
}