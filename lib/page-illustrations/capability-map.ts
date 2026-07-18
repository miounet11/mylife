/**
 * Map product surfaces → illustration surface keys for capability diagrams.
 * Teachers / dimensions / tools share the same educational diagram language:
 * 能解决什么 · 典型问题 · 输出形态
 */

import type { TeacherId } from '@/lib/teachers';

/** Gallery / chat primary teachers (P0 + geo/practice). */
export const CAPABILITY_TEACHER_IDS = [
  'overview',
  'career',
  'wealth',
  'relationship',
  'timing',
  'health',
  'practice',
  'geo',
] as const;

export type CapabilityTeacherId = (typeof CAPABILITY_TEACHER_IDS)[number];

export function isCapabilityTeacherId(id: string): id is CapabilityTeacherId {
  return (CAPABILITY_TEACHER_IDS as readonly string[]).includes(id);
}

/** Catalog surface for a teacher capability diagram. */
export function teacherCapabilitySurface(teacherId: string): string {
  const id = isCapabilityTeacherId(teacherId) ? teacherId : 'overview';
  return `teachers/${id}`;
}

/** Chat opening surface (teacher-specific with fallbacks). */
export function chatOpeningSurface(teacherId?: string | null): string {
  if (teacherId && isCapabilityTeacherId(teacherId)) {
    return `chat/teacher/${teacherId}`;
  }
  if (teacherId) return `teachers/${teacherId}`;
  return 'chat/opening';
}

/**
 * Dimension slug → illustration surface.
 * Falls back to dimensions/hub map when no dedicated figure.
 */
export function dimensionCapabilitySurface(slug: string): string {
  const map: Record<string, string> = {
    'fortune-rhythm': 'dimensions/fortune-rhythm',
    'career-industry': 'dimensions/career-industry',
    investment: 'dimensions/investment',
    naming: 'dimensions/naming',
    health: 'dimensions/health',
    'study-career': 'dimensions/career-industry',
    marriage: 'dimensions/marriage',
    partnership: 'dimensions/partnership',
    'living-environment': 'dimensions/living-environment',
    'timing-selection': 'dimensions/timing-selection',
  };
  return map[slug] || 'dimensions/hub';
}

/** Tool category key → illustration surface. */
export function toolCategoryCapabilitySurface(category: string): string {
  return `tools/category/${category}`;
}

/** Tool detail: prefer category explainer, then tools hub. */
export function toolDetailCapabilitySurface(category?: string | null): string {
  if (category) return `tools/category/${category}`;
  return 'tools/hub';
}

/** Copy blocks for teacher capability panels (UI text next to diagram). */
export const TEACHER_CAPABILITY_COPY: Record<
  CapabilityTeacherId,
  { solves: string[]; problems: string[]; outputs: string[] }
> = {
  overview: {
    solves: ['从整份报告抽出当下主线', '排出 30 天优先顺序', '知道该转请哪位老师'],
    problems: ['不知道先做什么', '信息太多抓不住重点', '方向模糊、动作散'],
    outputs: ['主线结论', '优先清单', '转介路径'],
  },
  career: {
    solves: ['岗位/行业匹配节奏', '深耕·转换·稳住三选一', '跳槽与推进窗口'],
    problems: ['该不该转行/跳槽', '什么时候动更稳', '怕错过窗口或动错方向'],
    outputs: ['阶段判断', '窗口条件', '7/30 天动作'],
  },
  wealth: {
    solves: ['收支与现金流节奏', '杠杆与试探边界', '半年宜守宜试'],
    problems: ['现金吃紧还是乱加杠杆', '该不该小步变现', '哪些钱的动作要谨慎'],
    outputs: ['纪律框架', '风险边界', '节奏建议（非投资建议）'],
  },
  relationship: {
    solves: ['关系节奏与边界', '沟通优先事项', '相处对齐点'],
    problems: ['关系推进还是先收束', '边界不清反复消耗', '双人节奏对不齐'],
    outputs: ['边界建议', '沟通顺序', '可验证小动作'],
  },
  timing: {
    solves: ['本月本季推进/收束', '动作先后次序', '窗口与忌宜'],
    problems: ['什么时候推、什么时候守', '多件事谁先谁后', '怕踩节奏雷区'],
    outputs: ['时间窗', '先后次序', '避坑信号'],
  },
  health: {
    solves: ['身心负荷与恢复节奏', '作息与阶段匹配', '何时宜减负'],
    problems: ['长期过载不知如何收', '节律乱、恢复差', '什么时候该停一停'],
    outputs: ['节律判断', '恢复优先级', '生活方式参考（非医疗）'],
  },
  practice: {
    solves: ['把判断落成动作', '事件回访与校准', '下一步复盘'],
    problems: ['知道该做但动不了', '做过但不知对不对', '缺闭环验证'],
    outputs: ['动作清单', '验证节点', '复盘结论'],
  },
  geo: {
    solves: ['城市/环境匹配观察', '迁移择城结构层', '居家与角色密度'],
    problems: ['该不该迁', '城市成本是否可承受', '环境是否匹配发挥方式'],
    outputs: ['环境层判断', '成本对照', '可逆小步验证'],
  },
};

export function teacherCapabilityTitle(teacherId: TeacherId | string): string {
  const names: Record<string, string> = {
    overview: '总览老师能帮你什么',
    career: '事业老师能帮你什么',
    wealth: '财务老师能帮你什么',
    relationship: '关系老师能帮你什么',
    timing: '时机老师能帮你什么',
    health: '节律老师能帮你什么',
    practice: '实践老师能帮你什么',
    geo: '地理老师能帮你什么',
  };
  return names[teacherId] || '老师能帮你什么';
}
