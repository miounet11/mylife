/**
 * Map landing source query → intent + preferred dimension slugs for hub UI.
 */

import type { DimensionSlug } from '@/lib/dimensions/types';

export type FunnelIntent = 'career' | 'wealth' | 'relationship' | 'yearly' | 'general';

export function parseSourceIntent(source: string | null | undefined): FunnelIntent {
  const s = `${source || ''}`.toLowerCase();
  // Prefer explicit workbench intent tags first
  if (/analyze_intent_career|intent[_=]career/.test(s)) return 'career';
  if (/analyze_intent_wealth|intent[_=]wealth/.test(s)) return 'wealth';
  if (/analyze_intent_relationship|intent[_=]relationship/.test(s)) return 'relationship';
  if (/analyze_intent_yearly|intent[_=]yearly/.test(s)) return 'yearly';
  // Avoid bare "work" (matches home_workspace)
  if (/career|job|事业|行业|岗位|跳槽|study-career/.test(s)) return 'career';
  if (/wealth|money|finance|投资|理财|财运/.test(s)) return 'wealth';
  if (/relation|marriage|love|婚恋|情感|合婚|hehun/.test(s)) return 'relationship';
  if (/yearly|annual|timing|流年|大运|择时|fortune-rhythm/.test(s)) return 'yearly';
  return 'general';
}

export const INTENT_LABEL: Record<FunnelIntent, string> = {
  career: '事业发展',
  wealth: '财运规划',
  relationship: '婚恋关系',
  yearly: '年度流年',
  general: '场景研判',
};

export const INTENT_HINT: Record<FunnelIntent, string> = {
  career: '你从「事业发展」进入。可先看工作行业与学业事业，再按需展开其他维度。',
  wealth: '你从「财运规划」进入。可先看投资理财与运势节奏，再对照行动窗口。',
  relationship: '你从「婚恋关系」进入。可先看谈婚论嫁与人际合作，再回到结构判断。',
  yearly: '你从「年度流年」进入。可先看运势节奏与择时办事，再落到具体场景。',
  general: '先选一个具体问题进入。结论可回到预测回访对照。',
};

/** Preferred dimension order boost for each intent */
export const INTENT_PRIORITY_SLUGS: Record<FunnelIntent, DimensionSlug[]> = {
  career: ['career-industry', 'study-career', 'partnership', 'fortune-rhythm'],
  wealth: ['investment', 'fortune-rhythm', 'career-industry', 'timing-selection'],
  relationship: ['marriage', 'partnership', 'fortune-rhythm', 'living-environment'],
  yearly: ['fortune-rhythm', 'timing-selection', 'career-industry', 'investment'],
  general: [],
};

export function intentPrimaryCta(intent: FunnelIntent): { href: string; label: string } {
  const map: Record<FunnelIntent, { href: string; label: string }> = {
    career: { href: '/dimensions/career-industry', label: '进入工作行业' },
    wealth: { href: '/dimensions/investment', label: '进入投资理财' },
    relationship: { href: '/dimensions/marriage', label: '进入谈婚论嫁' },
    yearly: { href: '/dimensions/fortune-rhythm', label: '进入运势节奏' },
    general: { href: '/dimensions/fortune-rhythm', label: '从运势节奏开始' },
  };
  return map[intent];
}
