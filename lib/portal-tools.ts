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
    { href: '/dimensions/living-environment', title: '居家环境研判', description: '方位摆设与搬迁窗口参考。', cta: '开始研判' },
    { href: '/analyze?source=tool_category_migration', title: '迁移匹配报告', description: '留回决策与环境成本结构。', cta: '生成报告' },
    { href: '/insights/city/world-yi-vancouver', title: '温哥华城市观察', description: '海外华人环境层样例。', cta: '阅读洞察' },
    { href: '/knowledge/world-yi-migration-stage-logic', title: '世界易迁移观', description: '迁移不是换地图，是重匹配。', cta: '阅读' },
  ],
  application: [
    { href: '/dimensions/timing-selection', title: '择时办事研判', description: '流日评分 + 宜忌日期清单。', cta: '开始研判' },
    { href: '/dimensions/naming', title: '起名 / 改名研判', description: '姓名五行与用神补益评估。', cta: '开始研判' },
    { href: '/dimensions/fortune-rhythm', title: '运势节奏研判', description: '当前阶段、转折点与行动窗口。', cta: '开始研判' },
    { href: '/events', title: '事件日历', description: '记录节点、应验反馈，校准下一轮判断。', cta: '记事件' },
    { href: '/chat', title: '结构追问', description: '绑定报告持续追问，锚定真值。', cta: '去追问' },
    { href: '/expert-crm', title: '专业 CRM', description: '本机客户脚本与待回访（开业用）。', cta: '打开 CRM' },
    { href: '/tools/timing-yearly-window', title: '2026 择时窗口', description: '年度主窗口与节奏提示。', cta: '免费测试' },
    { href: '/tools/fengshui-simulator', title: '商铺风水模拟器', description: '行业五行、方位匹配、色彩与开业择时结构化分析。', cta: '开始模拟' },
    { href: '/tools/fengshui-space', title: '空间场模拟工作台', description: '热力·立体·风口控制台·上传户型图，结构场可视化。', cta: '打开工作台' },
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