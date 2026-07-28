import type { FoundationLayerId } from '@/lib/life-foundation/types';

/** 层元信息（固定展示顺序） */
export const FOUNDATION_LAYER_META: Record<
  FoundationLayerId,
  { title: string; subtitle: string; weight: number; order: number }
> = {
  birth: {
    title: '生辰八字',
    subtitle: '引擎硬输入：年月日时、地点、性别与准确度',
    weight: 0.3,
    order: 1,
  },
  astro: {
    title: '星座与生肖',
    subtitle: '太阳星座、生肖由生日推导；上升/月亮可自填',
    weight: 0.1,
    order: 2,
  },
  body: {
    title: '面相 · 手相',
    subtitle: '体貌结构观测，与命盘交叉（非医学诊断）',
    weight: 0.15,
    order: 3,
  },
  life_qa: {
    title: '生活问答',
    subtitle: '职业、目标、关系、财务、健康、居住等固定参数',
    weight: 0.25,
    order: 4,
  },
  interact: {
    title: '互动校准',
    subtitle: '事件记录、对话补全、私有文档 — 让判断可回测',
    weight: 0.12,
    order: 5,
  },
  tools: {
    title: '工具信号',
    subtitle: '起名、空间场、合婚、十维度等使用痕迹',
    weight: 0.08,
    order: 6,
  },
};

export type FoundationToolDef = {
  slug: string;
  title: string;
  layerId: FoundationLayerId;
  itemId: string;
  href: string;
};

export const FOUNDATION_SIGNAL_TOOLS: FoundationToolDef[] = [
  { slug: 'physiognomy', title: '面相观察', layerId: 'body', itemId: 'face', href: '/tools/physiognomy' },
  { slug: 'palmistry', title: '手相观察', layerId: 'body', itemId: 'palm', href: '/tools/palmistry' },
  { slug: 'naming-lab', title: '起名工坊', layerId: 'tools', itemId: 'naming', href: '/tools/naming' },
  { slug: 'naming', title: '起名工坊', layerId: 'tools', itemId: 'naming', href: '/tools/naming' },
  { slug: 'fengshui-space', title: '空间场', layerId: 'tools', itemId: 'space', href: '/tools/fengshui-space' },
  { slug: 'hehun', title: '合婚双盘', layerId: 'tools', itemId: 'hehun', href: '/hehun' },
  { slug: 'zodiac', title: '星座星盘', layerId: 'astro', itemId: 'zodiac_tool', href: '/tools/zodiac' },
];

export function gradeFromOverall(overall: number): {
  grade: 'empty' | 'starter' | 'building' | 'solid' | 'rich';
  gradeLabel: string;
} {
  if (overall >= 85) return { grade: 'rich', gradeLabel: '数据底座较完整' };
  if (overall >= 65) return { grade: 'solid', gradeLabel: '核心参数已立' };
  if (overall >= 40) return { grade: 'building', gradeLabel: '底座搭建中' };
  if (overall >= 15) return { grade: 'starter', gradeLabel: '已有起点' };
  return { grade: 'empty', gradeLabel: '尚未建立' };
}
