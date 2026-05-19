// v5-D39 多档案：关系工具
//
// 设计原则：
//   - relation 是可选的；老档案 NULL = 视作 self
//   - 前端 chip 提供 7 个常用值，第 8 个"其它"允许用户填 relation_label
//   - 排序：self 永远第一，其它按创建时间 desc
//   - 不做强枚举（DB 层不约束），不限制用户随时改

import type { FortuneRecord } from './user-types';

export type RelationKey =
  | 'self'
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'friend'
  | 'colleague'
  | 'other';

export interface RelationOption {
  key: RelationKey;
  label: string;
  /** 头像色块背景色（CSS 变量或 hex） */
  badgeBg: string;
  /** 头像色块文字色 */
  badgeFg: string;
}

export const RELATION_OPTIONS: RelationOption[] = [
  { key: 'self',      label: '自己',  badgeBg: '#C49B4A', badgeFg: '#FFFFFF' },
  { key: 'spouse',    label: '伴侣',  badgeBg: '#E11D48', badgeFg: '#FFFFFF' },
  { key: 'child',     label: '孩子',  badgeBg: '#16A34A', badgeFg: '#FFFFFF' },
  { key: 'parent',    label: '父母',  badgeBg: '#7C3AED', badgeFg: '#FFFFFF' },
  { key: 'sibling',   label: '兄弟姐妹', badgeBg: '#0891B2', badgeFg: '#FFFFFF' },
  { key: 'friend',    label: '朋友',  badgeBg: '#F59E0B', badgeFg: '#FFFFFF' },
  { key: 'colleague', label: '同事',  badgeBg: '#475569', badgeFg: '#FFFFFF' },
  { key: 'other',     label: '其它',  badgeBg: '#6B7280', badgeFg: '#FFFFFF' },
];

const RELATION_LABEL_MAP: Record<string, string> = RELATION_OPTIONS.reduce(
  (acc, o) => ({ ...acc, [o.key]: o.label }),
  {}
);

/**
 * 把 fortune.relation 规范化为 RelationKey；空 / 未知 → 'self'
 */
export function normalizeRelation(raw: string | null | undefined): RelationKey {
  if (!raw) return 'self';
  const trimmed = String(raw).trim().toLowerCase();
  if (!trimmed) return 'self';
  const found = RELATION_OPTIONS.find((o) => o.key === trimmed);
  return (found?.key ?? 'other') as RelationKey;
}

/**
 * 取展示标签（优先 relation_label，其次按 relation key 翻译）
 */
export function describeRelation(
  fortune: Pick<FortuneRecord, 'relation' | 'relationLabel' | 'name'>
): string {
  if (fortune.relationLabel && fortune.relationLabel.trim()) {
    return fortune.relationLabel.trim();
  }
  const key = normalizeRelation(fortune.relation);
  if (key === 'self') return fortune.name || '自己';
  return RELATION_LABEL_MAP[key] || '其它';
}

/**
 * 头像颜色（取首字 + 关系色）
 */
export function getRelationBadge(
  fortune: Pick<FortuneRecord, 'relation' | 'name' | 'relationLabel'>
): { initial: string; bg: string; fg: string } {
  const key = normalizeRelation(fortune.relation);
  const opt = RELATION_OPTIONS.find((o) => o.key === key) || RELATION_OPTIONS[0];
  const display = describeRelation(fortune);
  const initial = (display || '?').slice(0, 1);
  return { initial, bg: opt.badgeBg, fg: opt.badgeFg };
}

/**
 * 校验 relation 字符串能否进 DB
 * 严格白名单 + relation_label 长度限制（防滥用）
 */
export function sanitizeRelationInput(input: {
  relation?: string | null;
  relationLabel?: string | null;
}): { relation: string | null; relationLabel: string | null } {
  let relation: string | null = null;
  if (input.relation) {
    const k = String(input.relation).trim().toLowerCase();
    if (RELATION_OPTIONS.find((o) => o.key === k)) {
      relation = k;
    }
  }
  let relationLabel: string | null = null;
  if (input.relationLabel) {
    const v = String(input.relationLabel).trim();
    if (v.length > 0 && v.length <= 20) {
      relationLabel = v;
    }
  }
  return { relation, relationLabel };
}
