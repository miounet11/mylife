import { normalizeAttributionSource } from '@/lib/source-attribution';

export const RETENTION_WORKBENCH_SOURCE_FAMILIES = ['profile_page', 'history_page', 'events_page'] as const;

export interface CtaStrategyBreakdownRow {
  key: string;
  strategyKey: string;
  sourceFamily: string;
  clicks: number;
  chatPageViews: number;
  chatCompleted: number;
  toolCardClicks: number;
  contentCardClicks: number;
  clickToChatRate: number;
  chatCompletionRate: number;
  latestAt?: string | null;
}

export function mapCtaStrategyLabel(strategyKey: string) {
  if (strategyKey === 'knowledge_to_self_judgment') return '知识内容 -> 个人判断';
  if (strategyKey === 'case_to_self_comparison') return '案例内容 -> 自我对照';
  if (strategyKey === 'tool_intent_to_run') return '工具意图 -> 直接开跑';
  if (strategyKey === 'lifecycle_recall_resume') return '召回入口 -> 继续上次';
  if (strategyKey === 'retention_workbench_resume') return '复访工作台 -> 接着使用';
  if (strategyKey === 'default') return '默认承接';
  return strategyKey || '未知策略';
}

export function mapCtaSourceFamilyLabel(sourceFamily: string) {
  if (sourceFamily === 'knowledge_article') return '知识文章来源';
  if (sourceFamily === 'case_article') return '案例来源';
  if (sourceFamily === 'tool_detail') return '工具详情来源';
  if (sourceFamily === 'profile_page') return '个人档案来源';
  if (sourceFamily === 'history_page') return '历史复盘来源';
  if (sourceFamily === 'events_page') return '事件工作台来源';
  if (sourceFamily === 'lifecycle_report_followup') return '报告召回来源';
  if (sourceFamily === 'lifecycle_tool_interest') return '工具召回来源';
  if (sourceFamily === 'updates_page') return '更新中心来源';
  if (sourceFamily === 'direct') return '直接访问';
  return sourceFamily || '未知来源族';
}

export function isRetentionWorkbenchSourceFamily(sourceFamily?: string | null): sourceFamily is typeof RETENTION_WORKBENCH_SOURCE_FAMILIES[number] {
  return RETENTION_WORKBENCH_SOURCE_FAMILIES.includes(`${sourceFamily || ''}` as typeof RETENTION_WORKBENCH_SOURCE_FAMILIES[number]);
}

export function deriveCtaSourceFamily(rawSource?: string | null): string {
  const source = normalizeAttributionSource(rawSource);

  if (source === 'direct') {
    return 'direct';
  }

  if (source.startsWith('lifecycle_report_followup:')) {
    const nested = source.replace(/^lifecycle_report_followup:/, '').trim();
    if (nested.startsWith('knowledge_article:')) return 'knowledge_article';
    if (nested.startsWith('case_article:')) return 'case_article';
    return 'lifecycle_report_followup';
  }

  if (source.startsWith('lifecycle_tool_interest:')) {
    const nested = source.replace(/^lifecycle_tool_interest:/, '').trim();
    if (nested.startsWith('knowledge_article:')) return 'knowledge_article';
    if (nested.startsWith('case_article:')) return 'case_article';
    return 'lifecycle_tool_interest';
  }

  if (source.startsWith('knowledge_article:')) {
    return 'knowledge_article';
  }
  if (source.startsWith('case_article:')) {
    return 'case_article';
  }
  if (source.startsWith('tool_detail')) {
    return 'tool_detail';
  }
  if (source === 'updates_page') {
    return 'updates_page';
  }
  if (source === 'profile_page' || source.startsWith('profile_')) {
    return 'profile_page';
  }
  if (source === 'history_page' || source.startsWith('history_')) {
    return 'history_page';
  }
  if (source === 'events_page' || source.startsWith('events_') || source.startsWith('important_events_')) {
    return 'events_page';
  }

  return 'unknown';
}

export function resolveCtaSourceFamilyFromMeta(meta: Record<string, unknown>) {
  const directFamily = typeof meta.sourceFamily === 'string' ? meta.sourceFamily.trim() : '';
  if (directFamily) {
    return directFamily;
  }

  const attribution = meta.attribution && typeof meta.attribution === 'object'
    ? meta.attribution as Record<string, unknown>
    : {};
  const source = typeof meta.source === 'string'
    ? meta.source
    : typeof attribution.source === 'string'
      ? attribution.source
      : '';

  return deriveCtaSourceFamily(source);
}

export function compareWeakCtaStrategies(
  left: Pick<CtaStrategyBreakdownRow, 'clicks' | 'chatPageViews' | 'chatCompleted' | 'clickToChatRate' | 'chatCompletionRate'>,
  right: Pick<CtaStrategyBreakdownRow, 'clicks' | 'chatPageViews' | 'chatCompleted' | 'clickToChatRate' | 'chatCompletionRate'>,
) {
  const leftWeakness = Math.min(left.clickToChatRate, left.chatCompletionRate);
  const rightWeakness = Math.min(right.clickToChatRate, right.chatCompletionRate);
  return leftWeakness - rightWeakness
    || left.chatCompletionRate - right.chatCompletionRate
    || left.clickToChatRate - right.clickToChatRate
    || right.clicks - left.clicks
    || right.chatPageViews - left.chatPageViews
    || right.chatCompleted - left.chatCompleted;
}

export function compareStrongCtaStrategies(
  left: Pick<CtaStrategyBreakdownRow, 'clicks' | 'chatPageViews' | 'chatCompleted' | 'clickToChatRate' | 'chatCompletionRate'>,
  right: Pick<CtaStrategyBreakdownRow, 'clicks' | 'chatPageViews' | 'chatCompleted' | 'clickToChatRate' | 'chatCompletionRate'>,
) {
  return right.chatCompleted - left.chatCompleted
    || right.chatCompletionRate - left.chatCompletionRate
    || right.clickToChatRate - left.clickToChatRate
    || right.clicks - left.clicks
    || right.chatPageViews - left.chatPageViews;
}
