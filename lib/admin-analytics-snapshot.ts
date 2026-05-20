// v5-D51 60s TTL memoize：/admin/analytics SSR 聚合是站点最重的查询路径——
// analyticsOperations.getOverview() 单次跑 50+ SQLite 同步查询，加上本文件包的 4 处
// rawQuery 全表扫，配合 reportJourney/productExperience/upgradeCandidates 等聚合，
// 一次 SSR 在 5w+ 行 analytics_events 上稳定跑出 80s 级延迟。bot/RSC prefetch 触发时
// 会让主进程串行打满，触发 PM2 health-check 超时反复重启。底层数据由用户行为缓慢累积，
// 60s 缓存完全足够新鲜。参考 lib/world-yi-public-stats.ts:152 同款套路。

import { analyticsOperations, reportJourneyEventOperations } from '@/lib/database';
import { getProductExperienceAnalyticsSnapshot } from '@/lib/product-experience-analytics';
import { listRealUserReportUpgradeCandidates } from '@/lib/real-user-report-upgrades';

export type AdminAnalyticsRawRow = {
  event_name: string;
  page?: string | null;
  meta?: string | null;
  session_id?: string | null;
  created_at?: string | null;
};

export type AdminAnalyticsAggregateSnapshot = {
  overview: ReturnType<typeof analyticsOperations.getOverview>;
  reportJourney: ReturnType<typeof reportJourneyEventOperations.getAnalyticsSnapshot>;
  productExperience: ReturnType<typeof getProductExperienceAnalyticsSnapshot>;
  realUserUpgradeCandidates: ReturnType<typeof listRealUserReportUpgradeCandidates>;
  emailDeliveryRows: AdminAnalyticsRawRow[];
  attributedConversionRows: AdminAnalyticsRawRow[];
  interactionRows: AdminAnalyticsRawRow[];
  toolFunnelRows: AdminAnalyticsRawRow[];
  generatedAt: number;
};

let cachedSnapshot: { value: AdminAnalyticsAggregateSnapshot; expiresAt: number } | null = null;
const ADMIN_ANALYTICS_TTL_MS = 60_000;

export function getAdminAnalyticsAggregateSnapshot(): AdminAnalyticsAggregateSnapshot {
  const now = Date.now();
  if (cachedSnapshot && cachedSnapshot.expiresAt > now) {
    return cachedSnapshot.value;
  }

  const overview = analyticsOperations.getOverview();
  const reportJourney = reportJourneyEventOperations.getAnalyticsSnapshot(30);
  const productExperience = getProductExperienceAnalyticsSnapshot(30);
  const realUserUpgradeCandidates = listRealUserReportUpgradeCandidates(7, 8);

  const emailDeliveryRows = analyticsOperations.rawQuery(`
    SELECT event_name, page, meta, created_at
    FROM analytics_events
    WHERE event_name IN ('email_delivery_succeeded', 'email_delivery_failed')
      AND datetime(created_at) >= datetime('now', '-7 days')
    ORDER BY datetime(created_at) DESC
    LIMIT 100
  `) as AdminAnalyticsRawRow[];

  const attributedConversionRows = analyticsOperations.rawQuery(`
    SELECT event_name, page, meta, created_at
    FROM analytics_events
    WHERE event_name IN ('tool_run_started', 'premium_service_requested')
      AND datetime(created_at) >= datetime('now', '-30 days')
      AND json_extract(meta, '$.attribution.source') IS NOT NULL
    ORDER BY datetime(created_at) DESC
    LIMIT 200
  `) as AdminAnalyticsRawRow[];

  const interactionRows = analyticsOperations.rawQuery(`
    SELECT event_name, page, meta, session_id, created_at
    FROM analytics_events
    WHERE datetime(created_at) >= datetime('now', '-30 days')
      AND event_name IN (
        'knowledge_article_viewed',
        'case_article_viewed',
        'tool_detail_viewed',
        'content_card_clicked',
        'content_quick_analyze_started',
        'tool_run_started',
        'tool_run_completed',
        'tool_result_viewed',
        'result_cta_clicked',
        'premium_service_requested'
      )
    ORDER BY datetime(created_at) DESC
    LIMIT 4000
  `) as AdminAnalyticsRawRow[];

  const toolFunnelRows = analyticsOperations.rawQuery(`
    SELECT event_name, page, meta, created_at
    FROM analytics_events
    WHERE event_name IN ('tool_detail_viewed', 'tool_run_started', 'tool_result_viewed', 'premium_service_requested')
      AND datetime(created_at) >= datetime('now', '-30 days')
      AND json_extract(meta, '$.toolSlug') IS NOT NULL
    ORDER BY datetime(created_at) DESC
    LIMIT 1200
  `) as AdminAnalyticsRawRow[];

  const value: AdminAnalyticsAggregateSnapshot = {
    overview,
    reportJourney,
    productExperience,
    realUserUpgradeCandidates,
    emailDeliveryRows,
    attributedConversionRows,
    interactionRows,
    toolFunnelRows,
    generatedAt: now,
  };

  cachedSnapshot = { value, expiresAt: now + ADMIN_ANALYTICS_TTL_MS };
  return value;
}

export function invalidateAdminAnalyticsAggregateSnapshot() {
  cachedSnapshot = null;
}
