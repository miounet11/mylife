export type AttributionSourceFamily =
  | 'lifecycle_report_followup'
  | 'lifecycle_tool_interest'
  | 'knowledge_article'
  | 'case_article'
  | 'tool_detail'
  | 'updates_page'
  | 'direct'
  | 'unknown';

function stripInternalFollowupPrefixes(rawSource: string): string {
  let normalized = rawSource.trim();

  while (normalized.startsWith('result_report_followup:') || normalized.startsWith('tool_result_followup:')) {
    normalized = normalized.replace(/^(result_report_followup|tool_result_followup):/, '').trim();
  }

  return normalized;
}

export function normalizeAttributionSource(rawSource?: string | null): string {
  const normalized = stripInternalFollowupPrefixes(`${rawSource || ''}`);
  return normalized || 'direct';
}

export function getAttributionSourceFamily(rawSource?: string | null): AttributionSourceFamily {
  const normalized = normalizeAttributionSource(rawSource);

  if (normalized === 'direct') {
    return 'direct';
  }
  if (normalized.startsWith('lifecycle_report_followup:')) {
    return 'lifecycle_report_followup';
  }
  if (normalized.startsWith('lifecycle_tool_interest:')) {
    return 'lifecycle_tool_interest';
  }
  if (normalized.startsWith('knowledge_article:')) {
    return 'knowledge_article';
  }
  if (normalized.startsWith('case_article:')) {
    return 'case_article';
  }
  if (normalized.startsWith('tool_detail')) {
    return 'tool_detail';
  }
  if (normalized === 'updates_page') {
    return 'updates_page';
  }

  return 'unknown';
}

function formatLeafLabel(normalizedSource: string): string {
  if (normalizedSource === 'direct') {
    return '直接访问';
  }
  if (normalizedSource.startsWith('knowledge_article:')) {
    return `知识文章 · ${normalizedSource.replace('knowledge_article:', '').trim()}`;
  }
  if (normalizedSource.startsWith('case_article:')) {
    return `案例文章 · ${normalizedSource.replace('case_article:', '').trim()}`;
  }
  if (normalizedSource.startsWith('tool_detail:')) {
    return `工具详情页 · ${formatLeafLabel(normalizedSource.replace(/^tool_detail:/, '').trim() || 'direct')}`;
  }
  if (normalizedSource === 'tool_detail') {
    return '工具详情页';
  }
  if (normalizedSource === 'updates_page') {
    return '更新中心';
  }

  return normalizedSource;
}

export function formatAttributionSourceLabel(rawSource?: string | null): string {
  const normalized = normalizeAttributionSource(rawSource);

  if (normalized.startsWith('lifecycle_report_followup:')) {
    const nested = normalized.replace(/^lifecycle_report_followup:/, '').trim();
    return nested ? `报告召回 · ${formatLeafLabel(nested)}` : '报告召回';
  }
  if (normalized === 'lifecycle_report_followup') {
    return '报告召回';
  }
  if (normalized.startsWith('lifecycle_tool_interest:')) {
    const nested = normalized.replace(/^lifecycle_tool_interest:/, '').trim();
    return nested ? `工具召回 · ${formatLeafLabel(nested)}` : '工具召回';
  }
  if (normalized === 'lifecycle_tool_interest') {
    return '工具召回';
  }

  return formatLeafLabel(normalized);
}
