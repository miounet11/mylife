import type { ReportJourneyEventRecord } from '@/lib/user-types';

export type ReportJourneyFunnelRow = {
  key: string;
  label: string;
  count: number;
  share: number;
};

export type ReportJourneyCategoryRow = {
  category: string;
  count: number;
  share: number;
};

export type ReportJourneyToolRow = {
  toolSlug: string;
  count: number;
  share: number;
};

export interface ReportJourneyAnalyticsSnapshot {
  totalEvents: number;
  uniqueReports: number;
  uniqueUsers: number;
  funnel: ReportJourneyFunnelRow[];
  categories: ReportJourneyCategoryRow[];
  tools: ReportJourneyToolRow[];
  latestEvents: ReportJourneyEventRecord[];
}

const layerLabels: Record<string, string> = {
  'first-report': '首报总览',
  'deep-report': '深入报告',
  'category-report': '专项细分',
  'event-validation': '事件验证',
};

function roundPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value);
}

function countByKey<T extends string>(values: T[]) {
  const counts = new Map<T, number>();
  values.forEach((value) => {
    counts.set(value, (counts.get(value) || 0) + 1);
  });
  return counts;
}

function mapCounts<T extends string>(
  counts: Map<T, number>,
  total: number,
  mapRow: (key: T, count: number, share: number) => ReportJourneyFunnelRow | ReportJourneyCategoryRow | ReportJourneyToolRow
) {
  return Array.from(counts.entries())
    .map(([key, count]) => mapRow(key, count, total > 0 ? roundPercent((count / total) * 100) : 0))
    .sort((left, right) => right.count - left.count);
}

export function buildReportJourneyAnalyticsSnapshot(
  events: ReportJourneyEventRecord[]
): ReportJourneyAnalyticsSnapshot {
  const normalized = (events || []).filter((event) => event.reportId && event.userId);
  const totalEvents = normalized.length;
  const uniqueReports = new Set(normalized.map((event) => event.reportId)).size;
  const uniqueUsers = new Set(normalized.map((event) => event.userId)).size;
  const layerCounts = countByKey(normalized.map((event) => event.layerKey || 'unknown'));
  const categoryCounts = countByKey(
    normalized.map((event) => event.category || '').filter(Boolean)
  );
  const toolCounts = countByKey(
    normalized.map((event) => event.toolSlug || '').filter(Boolean)
  );

  return {
    totalEvents,
    uniqueReports,
    uniqueUsers,
    funnel: mapCounts(layerCounts, totalEvents, (key, count, share) => ({
      key,
      label: layerLabels[key] || key,
      count,
      share,
    })) as ReportJourneyFunnelRow[],
    categories: mapCounts(categoryCounts, totalEvents, (category, count, share) => ({
      category,
      count,
      share,
    })) as ReportJourneyCategoryRow[],
    tools: mapCounts(toolCounts, totalEvents, (toolSlug, count, share) => ({
      toolSlug,
      count,
      share,
    })) as ReportJourneyToolRow[],
    latestEvents: normalized.slice(0, 12),
  };
}
