import Link from 'next/link';
import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { mapCtaSourceFamilyLabel, mapCtaStrategyLabel } from '@/lib/cta-strategy';
import { buildAdminActionItems, buildAdminOperatingInsight, type AdminAnalyticsSnapshot } from '@/lib/admin-analytics-insights';
import { getAdminQualityWorkboard } from '@/lib/admin-quality-workboard';
import { requireAdminUser } from '@/lib/auth';
import { isPublicKnowledgeEntry, listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import { analyticsOperations, reportJourneyEventOperations } from '@/lib/database';
import { toKnowledgeEditorialCandidate } from '@/lib/knowledge-editorial';
import { getProductExperienceAnalyticsSnapshot } from '@/lib/product-experience-analytics';
import { listRealUserReportUpgradeCandidates } from '@/lib/real-user-report-upgrades';
import { formatAttributionSourceLabel } from '@/lib/source-attribution';
import { listToolDefinitions } from '@/lib/tools';
import { formatDateTime } from '@/lib/utils';
import { getMailDebugConfig, verifyMailConnection } from '@/mail';

export const dynamic = 'force-dynamic';

const statLabels: Array<{ key: keyof ReturnType<typeof analyticsOperations.getOverview>['totals']; label: string; helper: string }> = [
  { key: 'total_analyses', label: '累计分析', helper: '已生成的命理报告' },
  { key: 'analyses_last_7d', label: '近 7 日分析', helper: '最近一周新增报告' },
  { key: 'public_reports', label: '公开报告', helper: '已开启分享的结果页' },
  { key: 'chat_messages', label: '聊天消息', helper: '用户发出的聊天问题' },
  { key: 'active_subscribers', label: '活跃订阅', helper: '当前有效订阅邮箱' },
  { key: 'total_events', label: '事件记录', helper: '用户沉淀的关键人生事件' },
  { key: 'result_report_linked_events', label: '报告关联事件', helper: '直接和某份报告绑定的事件数量' },
  { key: 'chat_sourced_events', label: '聊天沉淀事件', helper: '由 AI 对话直接转成的事件数量' },
  { key: 'validation_accurate', label: '验证准确', helper: '已被用户确认准确的判断' },
  { key: 'validation_drift', label: '验证偏差', helper: '已出现偏差、需要纠偏的判断' },
  { key: 'validation_pending', label: '待验证', helper: '尚未回收结果的事件' },
  { key: 'total_tracked_events', label: '埋点总数', helper: '系统累计记录的关键行为' },
  { key: 'tracked_events_last_7d', label: '近 7 日埋点', helper: '最近一周关键行为总量' },
];

export default async function AdminAnalyticsPage() {
  await requireAdminUser('/admin/analytics');
  const overview = analyticsOperations.getOverview();
  const reportJourney = reportJourneyEventOperations.getAnalyticsSnapshot(30);
  const productExperience = getProductExperienceAnalyticsSnapshot(30);
  const realUserUpgradeCandidates = listRealUserReportUpgradeCandidates(7, 8);
  const {
    totals,
    eventsLast7d,
    recentEvents,
    sourceBreakdown,
    driftReasonBreakdown,
    pendingValidationBuckets,
    followupQueue,
    reportVersionBreakdown,
    journeyFunnel,
    pageViewBreakdown,
    ctaBreakdown,
    analyzeOptionBreakdown,
    reasoningModeBreakdown,
    chatActionBreakdown,
    modelHealthBreakdown = [],
    llmFailureHotspots = [],
    routeHealthBreakdown = [],
    requestFailureHotspots = [],
    emailRetryQueue,
    recentEmailRetryJobs = [],
    premiumServiceStatus,
    recentPremiumRequests = [],
    funnelDiagnostics = [],
    userRegistrationSummary,
    weeklyUserGrowth = [],
    weeklyProductUsage = [],
    weeklyDeviceMix = [],
    weeklySourceTrend = [],
    sourceFunnel = [],
    sourceDeviceFunnel = [],
    deviceMeasurementSummary,
    deviceFunnelBreakdown = [],
    dailyProductUsage = [],
    sessionStrength30d,
    identityContinuity,
    lifecycleRecall,
    recentBehaviorShift,
    recentSourceShift = [],
    systemHealth,
    ctaStrategyBreakdown = [],
  } = overview;
  const emailDeliveryRows = analyticsOperations.rawQuery(`
    SELECT event_name, page, meta, created_at
    FROM analytics_events
    WHERE event_name IN ('email_delivery_succeeded', 'email_delivery_failed')
      AND datetime(created_at) >= datetime('now', '-7 days')
    ORDER BY datetime(created_at) DESC
    LIMIT 100
  `) as Array<{
    event_name: string;
    page?: string | null;
    meta?: string | null;
    created_at?: string | null;
  }>;
  const attributedConversionRows = analyticsOperations.rawQuery(`
    SELECT event_name, page, meta, created_at
    FROM analytics_events
    WHERE event_name IN ('tool_run_started', 'premium_service_requested')
      AND datetime(created_at) >= datetime('now', '-30 days')
      AND json_extract(meta, '$.attribution.source') IS NOT NULL
    ORDER BY datetime(created_at) DESC
    LIMIT 200
  `) as Array<{
    event_name: string;
    page?: string | null;
    meta?: string | null;
    created_at?: string | null;
  }>;
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
  `) as Array<{
    event_name: string;
    page?: string | null;
    meta?: string | null;
    session_id?: string | null;
    created_at?: string | null;
  }>;
  const toolFunnelRows = analyticsOperations.rawQuery(`
    SELECT event_name, page, meta, created_at
    FROM analytics_events
    WHERE event_name IN ('tool_detail_viewed', 'tool_run_started', 'tool_result_viewed', 'premium_service_requested')
      AND datetime(created_at) >= datetime('now', '-30 days')
      AND json_extract(meta, '$.toolSlug') IS NOT NULL
    ORDER BY datetime(created_at) DESC
    LIMIT 1200
  `) as Array<{
    event_name: string;
    page?: string | null;
    meta?: string | null;
    created_at?: string | null;
  }>;
  const emailHealth = await Promise.race([
    verifyMailConnection()
      .then((result) => ({
        status: 'ok' as const,
        config: result.config,
      }))
      .catch((error) => ({
        status: 'error' as const,
        config: getMailDebugConfig(),
        error: error instanceof Error ? error.message : 'unknown',
      })),
    new Promise<{
      status: 'timeout';
      config: ReturnType<typeof getMailDebugConfig>;
      error: string;
    }>((resolve) => {
      setTimeout(() => {
        resolve({
          status: 'timeout',
          config: getMailDebugConfig(),
          error: '邮件健康探测超时',
        });
      }, 5000);
    }),
  ]);
  const emailDeliverySummary = emailDeliveryRows.reduce<{
    success: number;
    failed: number;
    channels: Record<string, { channel: string; success: number; failed: number }>;
  }>((accumulator, row) => {
    const meta = parseMeta(row.meta);
    const channel = typeof meta.channel === 'string' ? meta.channel : 'unknown';
    if (!accumulator.channels[channel]) {
      accumulator.channels[channel] = {
        channel,
        success: 0,
        failed: 0,
      };
    }

    if (row.event_name === 'email_delivery_succeeded') {
      accumulator.success += 1;
      accumulator.channels[channel].success += 1;
    } else {
      accumulator.failed += 1;
      accumulator.channels[channel].failed += 1;
    }

    return accumulator;
  }, {
    success: 0,
    failed: 0,
    channels: {},
  });
  const emailChannelBreakdown = Object.values(emailDeliverySummary.channels)
    .sort((left, right) => right.failed + right.success - (left.failed + left.success));
  const validatedTotal = totals.validation_accurate + totals.validation_drift;
  const validationAccuracyRate = validatedTotal > 0 ? Math.round((totals.validation_accurate / validatedTotal) * 100) : 0;
  const driftRate = validatedTotal > 0 ? Math.round((totals.validation_drift / validatedTotal) * 100) : 0;
  const attributedConversionBreakdown = Object.values(attributedConversionRows.reduce<Record<string, {
    key: string;
    source: string;
    target: string;
    toolRuns: number;
    premiumRequests: number;
    latestAt?: string | null;
  }>>((accumulator, row) => {
    const meta = parseMeta(row.meta);
    const attribution = meta.attribution && typeof meta.attribution === 'object' ? meta.attribution as Record<string, unknown> : {};
    const source = typeof attribution.source === 'string' ? attribution.source : 'unknown';
    const target = typeof attribution.target === 'string' ? attribution.target : 'unknown';
    const key = `${source}:${target}`;
    if (!accumulator[key]) {
      accumulator[key] = {
        key,
        source,
        target,
        toolRuns: 0,
        premiumRequests: 0,
        latestAt: row.created_at || null,
      };
    }
    if (row.event_name === 'tool_run_started') {
      accumulator[key].toolRuns += 1;
    }
    if (row.event_name === 'premium_service_requested') {
      accumulator[key].premiumRequests += 1;
    }
    accumulator[key].latestAt = row.created_at || accumulator[key].latestAt;
    return accumulator;
  }, {}))
    .sort((left, right) => (right.toolRuns + right.premiumRequests) - (left.toolRuns + left.premiumRequests))
    .slice(0, 8);
  const chatReturnRows = analyticsOperations.rawQuery(`
    SELECT event_name, page, meta, session_id, created_at
    FROM analytics_events
    WHERE datetime(created_at) >= datetime('now', '-30 days')
      AND event_name IN ('result_cta_clicked', 'chat_page_viewed', 'chat_completed', 'chat_event_saved')
    ORDER BY datetime(created_at) DESC
    LIMIT 3000
  `) as Array<{
    event_name: string;
    page?: string | null;
    meta?: string | null;
    session_id?: string | null;
    created_at?: string | null;
  }>;
  const chatReturnBreakdown = Object.values(chatReturnRows.reduce<Record<string, {
    key: string;
    source: string;
    ctaClicks: number;
    chatPageViews: number;
    chatCompleted: number;
    chatEventsSaved: number;
    latestAt?: string | null;
  }>>((accumulator, row) => {
    const meta = parseMeta(row.meta);
    const source = typeof meta.source === 'string'
      ? meta.source
      : (row.event_name === 'chat_page_viewed' && typeof meta.source === 'string' ? meta.source : 'unknown');
    if (!source || source === 'unknown') {
      return accumulator;
    }

    if (!accumulator[source]) {
      accumulator[source] = {
        key: source,
        source,
        ctaClicks: 0,
        chatPageViews: 0,
        chatCompleted: 0,
        chatEventsSaved: 0,
        latestAt: row.created_at || null,
      };
    }

    if (row.event_name === 'result_cta_clicked') {
      accumulator[source].ctaClicks += 1;
    }
    if (row.event_name === 'chat_page_viewed') {
      accumulator[source].chatPageViews += 1;
    }
    if (row.event_name === 'chat_completed') {
      accumulator[source].chatCompleted += 1;
    }
    if (row.event_name === 'chat_event_saved') {
      accumulator[source].chatEventsSaved += 1;
    }
    accumulator[source].latestAt = row.created_at || accumulator[source].latestAt;
    return accumulator;
  }, {}))
    .map((item) => ({
      ...item,
      ctaToChatRate: item.ctaClicks > 0 ? Math.round((item.chatPageViews / item.ctaClicks) * 100) : 0,
      chatCompletionRate: item.chatPageViews > 0 ? Math.round((item.chatCompleted / item.chatPageViews) * 100) : 0,
      chatToEventRate: item.chatCompleted > 0 ? Math.round((item.chatEventsSaved / item.chatCompleted) * 100) : 0,
    }))
    .sort((left, right) => right.chatCompleted - left.chatCompleted || right.chatPageViews - left.chatPageViews)
    .slice(0, 10);
  const toolFunnelBreakdown = Object.values(toolFunnelRows.reduce<Record<string, {
    toolSlug: string;
    detailViews: number;
    runStarts: number;
    resultViews: number;
    premiumRequests: number;
    latestAt?: string | null;
  }>>((accumulator, row) => {
    const meta = parseMeta(row.meta);
    const toolSlug = typeof meta.toolSlug === 'string' ? meta.toolSlug : '';
    if (!toolSlug) {
      return accumulator;
    }
    if (!accumulator[toolSlug]) {
      accumulator[toolSlug] = {
        toolSlug,
        detailViews: 0,
        runStarts: 0,
        resultViews: 0,
        premiumRequests: 0,
        latestAt: row.created_at || null,
      };
    }

    if (row.event_name === 'tool_detail_viewed') {
      accumulator[toolSlug].detailViews += 1;
    }
    if (row.event_name === 'tool_run_started') {
      accumulator[toolSlug].runStarts += 1;
    }
    if (row.event_name === 'tool_result_viewed') {
      accumulator[toolSlug].resultViews += 1;
    }
    if (row.event_name === 'premium_service_requested') {
      accumulator[toolSlug].premiumRequests += 1;
    }
    accumulator[toolSlug].latestAt = row.created_at || accumulator[toolSlug].latestAt;
    return accumulator;
  }, {}))
    .map((item) => ({
      ...item,
      viewToRunRate: item.detailViews > 0 ? Math.round((item.runStarts / item.detailViews) * 100) : 0,
      resultToPremiumRate: item.resultViews > 0 ? Math.round((item.premiumRequests / item.resultViews) * 100) : 0,
    }))
    .sort((left, right) => right.runStarts - left.runStarts || right.premiumRequests - left.premiumRequests)
    .slice(0, 10);
  const pageEngagementBuckets = interactionRows.reduce<Record<string, {
    page: string;
    views: number;
    engagedSessions: Set<string>;
    sessions: Set<string>;
  }>>((accumulator, row) => {
    const page = row.page || '';
    const sessionId = row.session_id || `anonymous:${row.created_at || ''}`;
    if (!page) {
      return accumulator;
    }
    if (!accumulator[page]) {
      accumulator[page] = {
        page,
        views: 0,
        engagedSessions: new Set<string>(),
        sessions: new Set<string>(),
      };
    }
    accumulator[page].sessions.add(sessionId);
    if (row.event_name.endsWith('_viewed')) {
      accumulator[page].views += 1;
    }
    if ([
      'content_card_clicked',
      'content_quick_analyze_started',
      'tool_run_started',
      'tool_result_viewed',
      'result_cta_clicked',
      'premium_service_requested',
    ].includes(row.event_name)) {
      accumulator[page].engagedSessions.add(sessionId);
    }
    return accumulator;
  }, {});
  const bounceBreakdownRows = Object.values(pageEngagementBuckets)
    .map((item) => {
      const sessionCount = item.sessions.size;
      const engagedCount = item.engagedSessions.size;
      const bouncedCount = Math.max(0, sessionCount - engagedCount);
      return {
        page: item.page,
        views: item.views,
        sessionCount,
        engagedCount,
        bouncedCount,
        bounceRate: sessionCount > 0 ? Math.round((bouncedCount / sessionCount) * 100) : 0,
      };
    })
    .filter((item) => item.views > 0)
    .sort((left, right) => right.bounceRate - left.bounceRate || right.views - left.views);
  const contentInteractionBuckets = interactionRows.reduce<Record<string, {
    slug: string;
    page: string;
    views: number;
    clicks: number;
    quickStarts: number;
    toolRuns: number;
    premiumRequests: number;
    sessions: Set<string>;
    engagedSessions: Set<string>;
  }>>((accumulator, row) => {
    const page = row.page || '';
    const slug = page.startsWith('/knowledge/')
      ? page.replace('/knowledge/', '')
      : page.startsWith('/cases/')
        ? page.replace('/cases/', '')
        : '';
    if (!slug) {
      return accumulator;
    }
    const sessionId = row.session_id || `anonymous:${row.created_at || ''}`;
    if (!accumulator[slug]) {
      accumulator[slug] = {
        slug,
        page,
        views: 0,
        clicks: 0,
        quickStarts: 0,
        toolRuns: 0,
        premiumRequests: 0,
        sessions: new Set<string>(),
        engagedSessions: new Set<string>(),
      };
    }
    accumulator[slug].sessions.add(sessionId);
    if (row.event_name === 'knowledge_article_viewed' || row.event_name === 'case_article_viewed') {
      accumulator[slug].views += 1;
    }
    if (row.event_name === 'content_card_clicked') {
      accumulator[slug].clicks += 1;
      accumulator[slug].engagedSessions.add(sessionId);
    }
    if (row.event_name === 'content_quick_analyze_started') {
      accumulator[slug].quickStarts += 1;
      accumulator[slug].engagedSessions.add(sessionId);
    }
    if (row.event_name === 'tool_run_started') {
      const meta = parseMeta(row.meta);
      const attribution = meta.attribution && typeof meta.attribution === 'object' ? meta.attribution as Record<string, unknown> : {};
      if (typeof attribution.page === 'string' && attribution.page === page) {
        accumulator[slug].toolRuns += 1;
        accumulator[slug].engagedSessions.add(sessionId);
      }
    }
    if (row.event_name === 'premium_service_requested') {
      const meta = parseMeta(row.meta);
      const attribution = meta.attribution && typeof meta.attribution === 'object' ? meta.attribution as Record<string, unknown> : {};
      if (typeof attribution.page === 'string' && attribution.page === page) {
        accumulator[slug].premiumRequests += 1;
        accumulator[slug].engagedSessions.add(sessionId);
      }
    }
    return accumulator;
  }, {});
  const publicKnowledgeEntries = listPublishedManagedContentEntriesByType('knowledge').filter((entry) => isPublicKnowledgeEntry(entry));
  const publicCaseEntries = listPublishedManagedContentEntriesByType('case');
  const contentQualityRows = [
    ...publicKnowledgeEntries.map((entry) => {
      const behavior = contentInteractionBuckets[entry.slug];
      const editorial = toKnowledgeEditorialCandidate(entry);
      const sessionCount = behavior?.sessions.size || 0;
      const bounceRate = sessionCount > 0 ? Math.round(((sessionCount - (behavior?.engagedSessions.size || 0)) / sessionCount) * 100) : 100;
      const linkageScore = (behavior?.quickStarts || 0) * 5 + (behavior?.toolRuns || 0) * 8 + (behavior?.premiumRequests || 0) * 12 + (behavior?.clicks || 0) * 2;
      const qualityScore = Math.round(editorial.editorialScore * 0.7 + Math.min(30, linkageScore) - bounceRate * 0.15);
      return {
        slug: entry.slug,
        title: entry.title,
        contentType: 'knowledge',
        baseQuality: Math.round(editorial.editorialScore),
        views: behavior?.views || 0,
        linkageScore,
        bounceRate,
        qualityScore,
      };
    }),
    ...publicCaseEntries.map((entry) => {
      const behavior = contentInteractionBuckets[entry.slug];
      const meta = entry.meta as Record<string, unknown> | undefined;
      const relationScore = (Array.isArray(meta?.relatedToolSlugs) ? meta?.relatedToolSlugs.length : 0) * 4
        + (Array.isArray(meta?.relatedKnowledgeSlugs) ? meta?.relatedKnowledgeSlugs.length : 0) * 3
        + (Array.isArray(meta?.relatedCaseSlugs) ? meta?.relatedCaseSlugs.length : 0) * 3;
      const baseQuality = Math.min(100, (entry.sections?.length || 0) * 8 + (entry.tags?.length || 0) * 2 + relationScore + (entry.featured ? 10 : 0));
      const sessionCount = behavior?.sessions.size || 0;
      const bounceRate = sessionCount > 0 ? Math.round(((sessionCount - (behavior?.engagedSessions.size || 0)) / sessionCount) * 100) : 100;
      const linkageScore = (behavior?.quickStarts || 0) * 5 + (behavior?.toolRuns || 0) * 8 + (behavior?.premiumRequests || 0) * 12 + (behavior?.clicks || 0) * 2;
      const qualityScore = Math.round(baseQuality * 0.7 + Math.min(30, linkageScore) - bounceRate * 0.15);
      return {
        slug: entry.slug,
        title: entry.title,
        contentType: 'case',
        baseQuality,
        views: behavior?.views || 0,
        linkageScore,
        bounceRate,
        qualityScore,
      };
    }),
  ]
    .sort((left, right) => left.qualityScore - right.qualityScore || right.views - left.views);
  const toolInteractionBuckets = interactionRows.reduce<Record<string, {
    toolSlug: string;
    detailViews: number;
    startCtaClicks: number;
    chatCtaClicks: number;
    runStarts: number;
    runFailures: number;
    resultViews: number;
    premiumRequests: number;
    sessions: Set<string>;
    engagedSessions: Set<string>;
  }>>((accumulator, row) => {
    const meta = parseMeta(row.meta);
    const toolSlug = typeof meta.toolSlug === 'string'
      ? meta.toolSlug
      : (row.page?.startsWith('/tools/') ? row.page.replace('/tools/', '') : '');
    if (!toolSlug) {
      return accumulator;
    }
    const sessionId = row.session_id || `anonymous:${row.created_at || ''}`;
    if (!accumulator[toolSlug]) {
      accumulator[toolSlug] = {
        toolSlug,
        detailViews: 0,
        startCtaClicks: 0,
        chatCtaClicks: 0,
        runStarts: 0,
        runFailures: 0,
        resultViews: 0,
        premiumRequests: 0,
        sessions: new Set<string>(),
        engagedSessions: new Set<string>(),
      };
    }
    accumulator[toolSlug].sessions.add(sessionId);
    if (row.event_name === 'tool_detail_viewed') {
      accumulator[toolSlug].detailViews += 1;
    }
    if (row.event_name === 'tool_run_started') {
      accumulator[toolSlug].runStarts += 1;
      accumulator[toolSlug].engagedSessions.add(sessionId);
    }
    if (row.event_name === 'result_cta_clicked') {
      const target = typeof meta.target === 'string' ? meta.target : '';
      if (target === 'tool_detail_primary_start') {
        accumulator[toolSlug].startCtaClicks += 1;
        accumulator[toolSlug].engagedSessions.add(sessionId);
      }
      if (target === 'tool_detail_primary_chat' || target === 'tool_detail_runner_tip_chat') {
        accumulator[toolSlug].chatCtaClicks += 1;
        accumulator[toolSlug].engagedSessions.add(sessionId);
      }
      if (target === 'tool_run_failed' || target === 'tool_run_network_error') {
        accumulator[toolSlug].runFailures += 1;
        accumulator[toolSlug].engagedSessions.add(sessionId);
      }
    }
    if (row.event_name === 'tool_result_viewed') {
      accumulator[toolSlug].resultViews += 1;
      accumulator[toolSlug].engagedSessions.add(sessionId);
    }
    if (row.event_name === 'premium_service_requested' && typeof meta.toolSlug === 'string') {
      accumulator[toolSlug].premiumRequests += 1;
      accumulator[toolSlug].engagedSessions.add(sessionId);
    }
    return accumulator;
  }, {});
  const toolQualityRows = listToolDefinitions()
    .map((tool) => {
      const behavior = toolInteractionBuckets[tool.slug];
      const packagingScore = [
        tool.hook,
        tool.freeValueLine,
        tool.paidValueLine,
        ...tool.caseStories.map((item) => item.title),
        ...tool.premiumOutcomes,
        ...tool.objectionAnswers.map((item) => item.objection),
        ...tool.faqItems.map((item) => item.question),
      ].filter(Boolean).length;
      const baseQuality = Math.min(100, 35 + packagingScore * 3 + (tool.featuredBadge ? 10 : 0) + (tool.nextToolSlugs.length * 2));
      const sessionCount = behavior?.sessions.size || 0;
      const bounceRate = sessionCount > 0 ? Math.round(((sessionCount - (behavior?.engagedSessions.size || 0)) / sessionCount) * 100) : 100;
      const runRate = behavior?.detailViews ? Math.round((behavior.runStarts / behavior.detailViews) * 100) : 0;
      const ctaStartRate = behavior?.detailViews ? Math.round((behavior.startCtaClicks / behavior.detailViews) * 100) : 0;
      const ctaToRunRate = behavior?.startCtaClicks ? Math.round((behavior.runStarts / behavior.startCtaClicks) * 100) : 0;
      const runFailureRate = behavior?.runStarts ? Math.round((behavior.runFailures / behavior.runStarts) * 100) : 0;
      const premiumRate = behavior?.resultViews ? Math.round((behavior.premiumRequests / behavior.resultViews) * 100) : 0;
      const linkageScore = Math.min(30, runRate * 0.2 + premiumRate * 0.7 + ctaStartRate * 0.1);
      const qualityScore = Math.round(baseQuality * 0.7 + linkageScore - bounceRate * 0.15 - runFailureRate * 0.3);
      return {
        slug: tool.slug,
        title: tool.shortTitle,
        baseQuality,
        detailViews: behavior?.detailViews || 0,
        startCtaClicks: behavior?.startCtaClicks || 0,
        chatCtaClicks: behavior?.chatCtaClicks || 0,
        runStarts: behavior?.runStarts || 0,
        runRate,
        ctaStartRate,
        ctaToRunRate,
        runFailures: behavior?.runFailures || 0,
        runFailureRate,
        premiumRate,
        bounceRate,
        qualityScore,
      };
    })
    .sort((left, right) => left.qualityScore - right.qualityScore || right.detailViews - left.detailViews);
  const bounceBreakdown = bounceBreakdownRows.slice(0, 10);
  const contentQualityBreakdown = contentQualityRows.slice(0, 12);
  const toolQualityBreakdown = toolQualityRows.slice(0, 12);
  const toolJourneyHealthRows = toolQualityRows
    .filter((item) => item.detailViews >= 10)
    .sort((left, right) => right.detailViews - left.detailViews)
    .slice(0, 12);
  const prioritizedContentFixes = contentQualityRows
    .map((item) => {
      const priorityScore = Math.round(
        Math.max(0, 72 - item.qualityScore) * 1.8
        + Math.min(45, item.bounceRate * 0.35)
        + Math.min(32, item.views * 0.7)
        + Math.max(0, 14 - item.linkageScore) * 1.6,
      );
      return {
        ...item,
        pagePath: item.contentType === 'knowledge' ? `/knowledge/${item.slug}` : `/cases/${item.slug}`,
        priorityScore,
        action: buildContentPriorityAction(item),
        reason: buildContentPriorityReason(item),
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore || right.views - left.views)
    .slice(0, 10);
  const prioritizedToolFixes = toolQualityRows
    .map((item) => {
      const priorityScore = Math.round(
        Math.max(0, 75 - item.qualityScore) * 1.7
        + Math.min(45, item.bounceRate * 0.35)
        + Math.min(34, item.detailViews * 0.75)
        + Math.max(0, 24 - item.runRate) * 1.3
        + Math.max(0, 22 - item.ctaStartRate) * 1.1
        + Math.max(0, 70 - item.ctaToRunRate) * 0.6
        + Math.max(0, 10 - item.premiumRate) * 1.6
        + Math.min(30, item.runFailureRate * 1.8),
      );
      return {
        ...item,
        pagePath: `/tools/${item.slug}`,
        priorityScore,
        action: buildToolPriorityAction(item),
        reason: buildToolPriorityReason(item),
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore || right.detailViews - left.detailViews)
    .slice(0, 10);
  const adminInsightSnapshot = {
    totals,
    pendingValidationBuckets,
    driftReasonBreakdown,
    reportVersionBreakdown,
    journeyFunnel,
    reasoningModeBreakdown,
    chatActionBreakdown,
    deviceMeasurementSummary,
    deviceFunnelBreakdown,
    recentBehaviorShift,
    lifecycleRecall,
    sourceFunnel,
    sourceDeviceFunnel,
  } as AdminAnalyticsSnapshot;
  const operatingInsight = buildAdminOperatingInsight(adminInsightSnapshot);
  const actionItems = buildAdminActionItems(adminInsightSnapshot);
  const last7DailyOps = dailyProductUsage.slice(0, 7);
  const dailyOpsSummary = summarizeDailyOps(last7DailyOps);
  const recentWeeklyDeviceMix = weeklyDeviceMix.filter((item) => item.productEvents > 0 || item.verifiedUsers > 0 || item.sessions > 0).slice(0, 15);
  const visibleDeviceFunnelBreakdown = deviceFunnelBreakdown.slice(0, 5);
  const visibleDeviceBehaviorShift = (recentBehaviorShift?.byDevice || []).slice(0, 5);
  const visibleWeeklySourceTrend = weeklySourceTrend.slice(0, 20);
  const visibleRecentSourceShift = recentSourceShift
    .filter((item) => item.sampleState !== 'sparse')
    .slice(0, 6);
  const qualityWorkboard = getAdminQualityWorkboard();
  const toolJourneyGapBreakdown = qualityWorkboard.prioritizedToolJourneyGaps.slice(0, 10);
  const unifiedToolRepairQueue = qualityWorkboard.prioritizedToolFixes
    .map((item) => {
      const gap = toolJourneyGapBreakdown.find((gapItem) => gapItem.slug === item.slug);
      const combinedPriority = Math.round(
        item.priorityScore * 0.65 + (gap?.priorityScore || 0) * 0.35
      );
      return {
        ...item,
        gapType: gap?.gapType || null,
        gapPriorityScore: gap?.priorityScore || 0,
        gapAction: gap?.action || '当前没有明显链路断点，优先按质量建议精修首屏与结果页。',
        combinedPriority,
      };
    })
    .sort((left, right) => right.combinedPriority - left.combinedPriority || right.detailViews - left.detailViews)
    .slice(0, 10);

  return (
    <div className="page-shell">
      <SiteHeader ctaHref="/admin/content" ctaLabel="内容后台" />

      <main className="page-frame py-10 pb-16 md:py-16 md:pb-20">
        <section className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="space-y-5">
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              产品不是上线就结束，
              <span className="font-serif text-[color:var(--accent-strong)]">必须能看到真实漏斗与真实行为。</span>
            </h1>
            <div className="action-guide">主动作</div>
            <div className="action-strip flex flex-col gap-3 sm:flex-row">
              <a href="#system-health-overview" className="action-primary">
                先看系统状态
              </a>
              <a href="#daily-ops-table" className="action-secondary">
                查看近 7 天运营实况
              </a>
              <Link href="/admin/content" className="action-secondary">
                转到内容后台
              </Link>
            </div>
            <div className="intro-copy max-w-3xl">
              把流量、分析、聊天、事件验证和失败热点放进同一张经营视图，直接看到该修什么、该放大什么。
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statLabels.map((item) => (
              <div key={item.key} className="soft-card rounded-[var(--radius-md)] p-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{totals[item.key]}</div>
                <div className="mt-2 intro-copy">{item.helper}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="product-experience-path-dashboard" className="mt-10 glass-panel rounded-[var(--radius-md)] p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-[color:var(--muted)]">产品体验路径看板</div>
              <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">每个页面是否完成自己的产品任务</div>
              <div className="mt-2 intro-copy">
                基于近 {productExperience.days} 天 `analytics_events`，把页面角色、成功指标和真实动作放到同一张表，避免只看 PV 不知道哪里断。
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-4 lg:w-[34rem]">
              <div className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                浏览 {productExperience.totals.views}
              </div>
              <div className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                主动作 {productExperience.totals.primaryActions}
              </div>
              <div className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                总动作 {productExperience.totals.totalActions}
              </div>
              <div className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                健康 {productExperience.totals.healthy}/{productExperience.totals.surfaces}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {productExperience.rows.map((item) => (
              <div key={item.surface} className="rounded-[var(--radius-md)] bg-white/76 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.surface}</div>
                    <div className="mt-1 text-lg font-black text-[color:var(--ink)]">{item.label}</div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.health)}`}>
                    {mapHealthLabel(item.health)}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-3 py-3">
                    <div className="text-[11px] tracking-[0.16em] text-[color:var(--muted)]">浏览</div>
                    <div className="mt-1 text-xl font-black text-[color:var(--ink)]">{item.views}</div>
                  </div>
                  <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-3 py-3">
                    <div className="text-[11px] tracking-[0.16em] text-[color:var(--muted)]">主动作</div>
                    <div className="mt-1 text-xl font-black text-[color:var(--ink)]">{item.primaryActions}</div>
                  </div>
                  <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-3 py-3">
                    <div className="text-[11px] tracking-[0.16em] text-[color:var(--muted)]">后续</div>
                    <div className="mt-1 text-xl font-black text-[color:var(--ink)]">{item.nextStepActions}</div>
                  </div>
                  <div className="rounded-[var(--radius)] bg-[color:var(--accent-soft)] px-3 py-3">
                    <div className="text-[11px] tracking-[0.16em] text-[color:var(--accent-strong)]">转化</div>
                    <div className="mt-1 text-xl font-black text-[color:var(--accent-strong)]">{item.conversionRate}%</div>
                  </div>
                </div>

                <div className="mt-4 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  <span className="font-semibold text-[color:var(--ink)]">成功指标：</span>
                  {item.successMetric}
                </div>
                <div className="mt-3 rounded-[var(--radius)] bg-white px-4 py-4 text-xs leading-6 text-[color:var(--ink)]">
                  <span className="font-semibold text-[color:var(--accent-strong)]">下一步：</span>
                  {item.action}
                </div>
                <div className="mt-3 text-xs text-[color:var(--muted)]">
                  最近信号：{formatStableTimestamp(item.latestAt)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="real-user-report-upgrade-priority" className="mt-10 glass-panel rounded-[var(--radius-md)] p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-[color:var(--muted)]">真实用户升级优先级</div>
              <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">先修已被真实用户看过的 basic / LLM 失败报告</div>
              <div className="mt-2 intro-copy">
                近 7 天真实查看样本会自动进入报告升级候选池，优先级按已查看、basic、未用 LLM、低质量分综合排序。
              </div>
            </div>
            <MetricBadge value={realUserUpgradeCandidates.length} label="候选" />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {realUserUpgradeCandidates.length > 0 ? realUserUpgradeCandidates.map((item) => (
              <Link
                key={item.report.id}
                href={`/result/${item.report.id}`}
                className="rounded-[var(--radius-md)] bg-white/78 p-5 transition hover:bg-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-black text-[color:var(--ink)]">{item.report.name}</div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">{item.report.id}</div>
                  </div>
                  <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                    {item.priorityScore} 分
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-3 py-3">
                    <div className="text-[11px] tracking-[0.16em] text-[color:var(--muted)]">查看</div>
                    <div className="mt-1 text-lg font-black text-[color:var(--ink)]">{item.viewedCount}</div>
                  </div>
                  <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-3 py-3">
                    <div className="text-[11px] tracking-[0.16em] text-[color:var(--muted)]">质量</div>
                    <div className="mt-1 text-lg font-black text-[color:var(--ink)]">
                      {item.report.analysis?.qualityAudit?.grade || 'C'} / {item.report.analysis?.qualityAudit?.overallScore || 0}
                    </div>
                  </div>
                  <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-3 py-3">
                    <div className="text-[11px] tracking-[0.16em] text-[color:var(--muted)]">层级</div>
                    <div className="mt-1 text-lg font-black text-[color:var(--ink)]">
                      {item.report.analysis?.qualityAudit?.deliveryTier || 'basic'}
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs leading-6 text-[color:var(--muted)]">
                  {item.reasons.join(' · ')}
                </div>
                <div className="mt-2 text-xs text-[color:var(--muted)]">
                  最近查看：{formatStableTimestamp(item.latestViewedAt)}
                </div>
              </Link>
            )) : (
              <CompactEmptyState title="暂无真实用户升级候选" detail="近 7 天没有已查看且需要升级的真实报告，或候选已经达到目标质量。" />
            )}
          </div>
        </section>

        <section id="daily-ops-table" className="mt-10 glass-panel rounded-[var(--radius-md)] p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-[color:var(--muted)]">增长与使用强度</div>
              <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">注册质量、周使用趋势与每次访问深度</div>
              <div className="mt-2 intro-copy">
                把新增用户、验证质量、近 7 周产品使用和近 14 天日趋势放到同一层。这里的“每台”目前按访问会话代理统计，因为 `sessions` 表还没有真实设备样本。
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:w-[34rem]">
              <div className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                近 7 天产品事件：{dailyOpsSummary.totalProductEvents}
              </div>
              <div className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                每会话事件数：{sessionStrength30d?.eventsPerSession || 0}
              </div>
              <div className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                验证用户占比：{userRegistrationSummary?.verificationRate || 0}%
              </div>
              <div className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                近 7 天新增用户：{dailyOpsSummary.totalNewUsers}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <div className="rounded-[var(--radius-md)] bg-white/82 p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">总用户</div>
              <div className="mt-2 text-3xl font-black text-[color:var(--ink)]">{userRegistrationSummary?.totalUsers || 0}</div>
              <div className="mt-2 intro-copy">
                已验证 {userRegistrationSummary?.verifiedUsers || 0}，游客/未验证 {userRegistrationSummary?.guestUsers || 0}
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] bg-white/82 p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">近 30 天会话</div>
              <div className="mt-2 text-3xl font-black text-[color:var(--ink)]">{sessionStrength30d?.sessions || 0}</div>
              <div className="mt-2 intro-copy">
                活跃键 {sessionStrength30d?.activeKeys || 0}，每活跃键 {sessionStrength30d?.eventsPerActiveKey || 0} 个核心行为
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] bg-white/82 p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">近 30 天核心事件</div>
              <div className="mt-2 text-3xl font-black text-[color:var(--ink)]">{sessionStrength30d?.coreEvents || 0}</div>
              <div className="mt-2 intro-copy">
                已过滤 LLM 重试、邮件投递和同步噪音，只保留更接近用户真实使用的行为。
              </div>
            </div>
            <div className="rounded-[var(--radius-md)] bg-white/82 p-5">
              <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">会话口径说明</div>
              <div className="mt-2 text-lg font-black text-[color:var(--ink)]">
                {sessionStrength30d?.usingSessionProxy ? '按 session_id 代理' : '已接真实会话表'}
              </div>
              <div className="mt-2 intro-copy">
                当前 `sessions` 表记录数 {sessionStrength30d?.sessionTableCount || 0}，所以“每台/每次访问”暂按 `analytics_events.session_id` 统计。
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-[var(--radius-md)] bg-white/72 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">身份连续性</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">看游客行为是否正确并入已验证用户</div>
                </div>
                <MetricBadge value={identityContinuity?.authGuestMappings || 0} label="映射" />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                  <div className="text-xs tracking-[0.16em] text-[color:var(--muted)]">guest analytics</div>
                  <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{identityContinuity?.guestAnalyticsEvents || 0}</div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">当前仍挂在 guest 身份上的行为总量。</div>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                  <div className="text-xs tracking-[0.16em] text-[color:var(--muted)]">可回填</div>
                  <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{identityContinuity?.recoverableGuestAnalyticsEvents || 0}</div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">
                    {`已有 auth_verified 映射，可安全修复 ${identityContinuity?.recoverableRate || 0}% 的 guest analytics。`}
                  </div>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                  <div className="text-xs tracking-[0.16em] text-[color:var(--muted)]">孤儿 guest analytics</div>
                  <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{identityContinuity?.orphanGuestAnalyticsEvents || 0}</div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">已经找不到对应用户的 guest 行为，不能直接归因到注册用户。</div>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                  <div className="text-xs tracking-[0.16em] text-[color:var(--muted)]">其他孤儿记录</div>
                  <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">
                    {(identityContinuity?.orphanGuestToolSessions || 0)
                      + (identityContinuity?.orphanGuestSessions || 0)
                      + (identityContinuity?.orphanGuestPremiumRequests || 0)
                      + (identityContinuity?.orphanGuestUpgradeJobs || 0)}
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">
                    {`工具 ${identityContinuity?.orphanGuestToolSessions || 0} · 会话 ${identityContinuity?.orphanGuestSessions || 0} · 专项 ${identityContinuity?.orphanGuestPremiumRequests || 0} · 升级 ${identityContinuity?.orphanGuestUpgradeJobs || 0}`}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">最近 7 周新增用户</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">区分游客与已验证用户</div>
                </div>
                <MetricBadge value={weeklyUserGrowth.length} label="周" />
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[color:var(--muted)]">
                      <th className="px-3 py-2">周</th>
                      <th className="px-3 py-2">新增</th>
                      <th className="px-3 py-2">游客/未验证</th>
                      <th className="px-3 py-2">已验证</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyUserGrowth.length > 0 ? weeklyUserGrowth.map((item) => (
                      <tr key={item.weekStart} className="rounded-[var(--radius)] bg-white/82 text-sm text-[color:var(--ink)]">
                        <td className="px-3 py-3 font-semibold">{item.weekLabel}</td>
                        <td className="px-3 py-3">{item.newUsers}</td>
                        <td className="px-3 py-3">{item.guestNewUsers}</td>
                        <td className="px-3 py-3">{item.verifiedNewUsers}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-3 py-4 text-sm text-[color:var(--muted)]" colSpan={4}>
                          暂无近几周用户增长数据。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">最近 7 周产品使用</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">看活跃、深度和关键动作</div>
                </div>
                <MetricBadge value={weeklyProductUsage.length} label="周" />
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[color:var(--muted)]">
                      <th className="px-3 py-2">周</th>
                      <th className="px-3 py-2">事件</th>
                      <th className="px-3 py-2">活跃键/会话</th>
                      <th className="px-3 py-2">每会话</th>
                      <th className="px-3 py-2">分析/报告</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyProductUsage.length > 0 ? weeklyProductUsage.map((item) => (
                      <tr key={item.weekStart} className="rounded-[var(--radius)] bg-white/82 text-sm text-[color:var(--ink)]">
                        <td className="px-3 py-3 font-semibold">{item.weekLabel}</td>
                        <td className="px-3 py-3">{item.productEvents}</td>
                        <td className="px-3 py-3">{`${item.activeKeys}/${item.sessions}`}</td>
                        <td className="px-3 py-3">{item.eventsPerSession}</td>
                        <td className="px-3 py-3">{`${item.analyzeCompleted}/${item.reportViews}`}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-3 py-4 text-sm text-[color:var(--muted)]" colSpan={5}>
                          暂无近几周产品使用数据。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">最近 7 周设备分布</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">看哪一端在带来使用和验证注册</div>
                </div>
                <MetricBadge value={recentWeeklyDeviceMix.length} label="行" />
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[color:var(--muted)]">
                      <th className="px-3 py-2">周</th>
                      <th className="px-3 py-2">设备</th>
                      <th className="px-3 py-2">产品事件</th>
                      <th className="px-3 py-2">会话</th>
                      <th className="px-3 py-2">已验证注册</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentWeeklyDeviceMix.length > 0 ? recentWeeklyDeviceMix.map((item) => (
                      <tr key={`${item.weekStart}:${item.deviceType}`} className="rounded-[var(--radius)] bg-white/82 text-sm text-[color:var(--ink)]">
                        <td className="px-3 py-3 font-semibold">{item.weekLabel}</td>
                        <td className="px-3 py-3">{mapDeviceTypeLabel(item.deviceType)}</td>
                        <td className="px-3 py-3">{item.productEvents}</td>
                        <td className="px-3 py-3">{item.sessions}</td>
                        <td className="px-3 py-3">{item.verifiedUsers}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-3 py-4 text-sm text-[color:var(--muted)]" colSpan={5}>
                          当前设备维度样本还不够，随着新埋点进入后这里会显示移动端、桌面端与其他设备的周趋势。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-[var(--radius-md)] bg-white/72 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">设备测量质量</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">先确认设备样本够不够支撑判断</div>
                </div>
                <MetricBadge value={deviceMeasurementSummary?.currentWindow?.coverageRate || 0} label="%覆盖" />
              </div>
              <div className="mt-3 intro-copy">
                {deviceMeasurementSummary?.note || '设备埋点还在持续累积，覆盖率上来后再用它做更细的设备经营判断。'}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                  <div className="text-xs tracking-[0.16em] text-[color:var(--muted)]">最近 3 天设备事件覆盖</div>
                  <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">
                    {`${deviceMeasurementSummary?.currentWindow?.knownDeviceEvents || 0}/${deviceMeasurementSummary?.currentWindow?.totalEvents || 0}`}
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">
                    覆盖率 {deviceMeasurementSummary?.currentWindow?.coverageRate || 0}%。
                  </div>
                </div>
                <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                  <div className="text-xs tracking-[0.16em] text-[color:var(--muted)]">最近 3 天设备会话覆盖</div>
                  <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">
                    {`${deviceMeasurementSummary?.currentWindow?.knownDeviceSessions || 0}/${deviceMeasurementSummary?.currentWindow?.sessions || 0}`}
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">
                    覆盖率 {deviceMeasurementSummary?.currentWindow?.sessionCoverageRate || 0}%。
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {(deviceMeasurementSummary?.weeklyCoverage || []).length ? deviceMeasurementSummary.weeklyCoverage.map((item) => (
                  <div key={item.deviceType} className="rounded-[var(--radius-md)] bg-white/85 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{mapDeviceTypeLabel(item.deviceType)}</div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapSampleTone(item.sampleState)}`}>
                        {mapSampleLabel(item.sampleState)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {`近 7 周有数据周数 ${item.weeksWithData}，会话 ${item.sessions}，产品事件 ${item.productEvents}，已验证注册 ${item.verifiedUsers}。`}
                    </div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无设备覆盖质量样本" detail="设备埋点还在进入历史窗口，等更多真实流量到来后这里会更稳定。" />
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] bg-white/72 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">设备漏斗诊断</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">看哪端的结果页、工具页或注册链路最弱</div>
                </div>
                <MetricBadge value={visibleDeviceFunnelBreakdown.length} label="设备" />
              </div>
              <div className="mt-4 grid gap-3">
                {visibleDeviceFunnelBreakdown.length ? visibleDeviceFunnelBreakdown.map((item) => (
                  <div key={item.deviceType} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{mapDeviceTypeLabel(item.deviceType)}</div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapSampleTone(item.sampleState)}`}>
                        {mapSampleLabel(item.sampleState)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                      {`结果页到聊天 ${item.reportToChatSessions}/${item.reportSessions} = ${item.reportToChatRate}% · 结果页到事件 ${item.reportToEventSessions}/${item.reportSessions} = ${item.reportToEventRate}% · 工具详情到开跑 ${item.toolToRunSessions}/${item.toolDetailSessions} = ${item.toolToRunRate}% · 请求验证码到完成验证 ${item.authVerifiedSessions}/${item.authRequestSessions} = ${item.authVerifyRate}%。`}
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">{item.qualityNote}</div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无设备漏斗样本" detail="设备样本还不够，先继续观察并让更多新流量进入这个统计窗口。" />
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[color:var(--muted)]">最近 14 天日趋势</div>
                <div className="mt-1 text-xl font-black text-[color:var(--ink)]">把使用、注册和验证码请求放进同一行</div>
              </div>
              <MetricBadge value={dailyProductUsage.length} label="天" />
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[color:var(--muted)]">
                    <th className="px-3 py-2">日期</th>
                    <th className="px-3 py-2">产品事件</th>
                    <th className="px-3 py-2">活跃键/会话</th>
                    <th className="px-3 py-2">分析/报告/聊天</th>
                    <th className="px-3 py-2">新增用户</th>
                    <th className="px-3 py-2">验证码请求/使用</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyProductUsage.length > 0 ? dailyProductUsage.map((item) => (
                    <tr key={item.day} className="rounded-[var(--radius)] bg-white/82 text-sm text-[color:var(--ink)]">
                      <td className="px-3 py-3 font-semibold">{item.day}</td>
                      <td className="px-3 py-3">{item.productEvents}</td>
                      <td className="px-3 py-3">{`${item.activeKeys}/${item.sessions}`}</td>
                      <td className="px-3 py-3">{`${item.analyzeCompleted}/${item.reportViews}/${item.chatMessages}`}</td>
                      <td className="px-3 py-3">{`${item.newUsers}（验 ${item.verifiedNewUsers} / 游 ${item.guestNewUsers}）`}</td>
                      <td className="px-3 py-3">{`${item.authCodeRequests}/${item.authCodeUsed}`}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="px-3 py-4 text-sm text-[color:var(--muted)]" colSpan={6}>
                        暂无最近两周的日趋势数据。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 rounded-[var(--radius-md)] bg-white/72 p-5 md:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-[color:var(--muted)]">最近几天行为变化</div>
                <div className="mt-1 text-xl font-black text-[color:var(--ink)]">
                  {recentBehaviorShift?.window?.compareLabel || '最近 3 天 vs 前 3 天'}
                </div>
                <div className="mt-2 intro-copy">
                  {recentBehaviorShift?.window
                    ? `${recentBehaviorShift.window.currentStart} 到 ${recentBehaviorShift.window.currentEnd}（不含结束日）对比 ${recentBehaviorShift.window.previousStart} 到 ${recentBehaviorShift.window.previousEnd}。`
                    : '按完整自然日对比最近和上一段行为变化。'}
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-[30rem]">
                {(recentBehaviorShift?.keyMetrics || []).slice(0, 4).map((item) => (
                  <div key={item.key} className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3">
                    <div className="text-xs tracking-[0.16em] text-[color:var(--muted)]">{item.label}</div>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div className="text-2xl font-black text-[color:var(--ink)]">{item.currentValue}</div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapTrendTone(item.direction)}`}>
                        {formatTrendDelta(item.delta, item.pctChange)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[var(--radius-md)] bg-rose-50/65 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">最近下滑点</div>
                <div className="mt-3 grid gap-3">
                  {recentBehaviorShift?.warnings?.length ? recentBehaviorShift.warnings.map((item) => (
                    <div key={item} className="rounded-[var(--radius)] bg-white/85 px-4 py-3 text-xs leading-6 text-rose-700">
                      {item}
                    </div>
                  )) : (
                    <CompactEmptyState title="暂无明显下滑" detail="最近几天暂时没有看到很突出的短周期回落。" />
                  )}
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] bg-emerald-50/65 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">最近变好点</div>
                <div className="mt-3 grid gap-3">
                  {recentBehaviorShift?.signals?.length ? recentBehaviorShift.signals.map((item) => (
                    <div key={item} className="rounded-[var(--radius)] bg-white/85 px-4 py-3 text-xs leading-6 text-emerald-700">
                      {item}
                    </div>
                  )) : (
                    <CompactEmptyState title="暂无明显改善" detail="最近几天还没有形成很明确的正向短周期信号。" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[color:var(--muted)]">变化最大的行为</div>
                  <MetricBadge value={recentBehaviorShift?.topChanges?.length || 0} label="行为" />
                </div>
                <div className="mt-4 grid gap-3">
                  {recentBehaviorShift?.topChanges?.length ? recentBehaviorShift.topChanges.map((item) => (
                    <div key={item.eventName} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{mapAnalyticsEventLabel(item.eventName)}</div>
                        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapTrendTone(item.direction)}`}>
                          {formatTrendDelta(item.delta, item.pctChange)}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-[color:var(--muted)]">
                        最近 {item.currentCount}，前段 {item.previousCount}
                      </div>
                    </div>
                  )) : (
                    <CompactEmptyState title="暂无变化样本" detail="当前还没有足够的行为变化样本。" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[color:var(--muted)]">关键链路变化</div>
                  <MetricBadge value={recentBehaviorShift?.funnel?.length || 0} label="链路" />
                </div>
                <div className="mt-4 grid gap-3">
                  {recentBehaviorShift?.funnel?.length ? recentBehaviorShift.funnel.map((item) => (
                    <div key={item.key} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapTrendTone(item.direction)}`}>
                          {item.rateDelta > 0 ? `+${item.rateDelta}pt` : `${item.rateDelta}pt`}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-[color:var(--muted)]">
                        最近 {item.currentValue}/{item.currentBase} = {item.currentRate}% ，前段 {item.previousValue}/{item.previousBase} = {item.previousRate}%
                      </div>
                    </div>
                  )) : (
                    <CompactEmptyState title="暂无链路变化样本" detail="等关键会话链路样本更多后再看。" />
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[color:var(--muted)]">最近几天来源变化</div>
                <MetricBadge value={visibleRecentSourceShift.length} label="来源" />
              </div>
              <div className="mt-4 grid gap-3">
                {visibleRecentSourceShift.length ? visibleRecentSourceShift.map((item) => (
                  <div key={item.source} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{formatAttributionSourceLabel(item.source)}</div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapTrendTone(item.direction)}`}>
                        {formatSourceShiftDelta(item)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                      {`最近 analyze ${item.current.analyzeSessions}，前段 ${item.previous.analyzeSessions}；结果页 ${item.current.reportViewSessions} vs ${item.previous.reportViewSessions}；结果页到聊天 ${item.current.viewToChatRate}% vs ${item.previous.viewToChatRate}%；结果页到工具 ${item.current.viewToToolRunRate}% vs ${item.previous.viewToToolRunRate}%。`}
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {item.sampleState === 'enough'
                        ? '来源样本已够，可以直接判断这条 GEO / SEO 来源的短周期趋势。'
                        : '来源样本偏低，先看方向，再继续积累。'}
                    </div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无来源变化样本" detail="近几天来源样本还不够，等更多真实来源进入后，这里会直接告诉你是哪类入口在涨或在掉。" />
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[color:var(--muted)]">最近几天设备变化</div>
                <MetricBadge value={visibleDeviceBehaviorShift.length} label="设备" />
              </div>
              <div className="mt-4 grid gap-3">
                {visibleDeviceBehaviorShift.length ? visibleDeviceBehaviorShift.map((item) => (
                  <div key={item.deviceType} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{mapDeviceTypeLabel(item.deviceType)}</div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapTrendTone(item.direction)}`}>
                        {formatDeviceShiftDelta(item)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                      {`最近产品事件 ${item.current.productEvents}，前段 ${item.previous.productEvents}；结果页到聊天 ${item.current.reportToChatRate}% vs ${item.previous.reportToChatRate}%；工具到开跑 ${item.current.toolToRunRate}% vs ${item.previous.toolToRunRate}%；验证码完成 ${item.current.authVerifyRate}% vs ${item.previous.authVerifyRate}%。`}
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {item.sampleState === 'enough'
                        ? '样本已够，可以直接按这端判断趋势。'
                        : item.sampleState === 'low'
                          ? '样本偏低，先看方向，再继续积累。'
                          : '样本太少，暂时只当信号，不当结论。'}
                    </div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无设备变化样本" detail="新设备埋点样本再多一点后，这里会更明确告诉你最近是哪端在变。" />
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-[var(--radius-md)] bg-white/72 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">来源主漏斗</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">看哪类来源真正把人带到报告后的下一步</div>
                </div>
                <MetricBadge value={sourceFunnel.length} label="来源" />
              </div>
              <div className="mt-4 grid gap-3">
                {sourceFunnel.length ? sourceFunnel.slice(0, 6).map((item) => (
                  <div key={`source-funnel:${item.source}`} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{formatAttributionSourceLabel(item.source)}</div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.viewToChatRate >= 35 ? 'healthy' : item.viewToChatRate >= 15 ? 'warning' : 'critical')}`}>
                        {`${item.viewToChatRate}% 聊天`}
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                      {`analyze ${item.analyzeSessions} -> report ${item.reportsGenerated}（${item.analyzeToReportRate}%） -> view ${item.reportViewSessions}（${item.reportToViewRate}%） -> chat ${item.chatSessions}（${item.viewToChatRate}%） -> tool run ${item.toolRunSessions}（${item.viewToToolRunRate}%）。`}
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {`最近动作：${formatStableTimestamp(item.latestAt)}`}
                    </div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无来源主漏斗样本" detail="近 30 天来源链路样本还不够，后续会在这里直接显示哪条来源最能带来真实使用。" />
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] bg-white/72 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">最近 7 周来源趋势</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">看 GEO / SEO 来源是持续增长，还是只带来一次性访问</div>
                </div>
                <MetricBadge value={visibleWeeklySourceTrend.length} label="行" />
              </div>
              <div className="mt-4 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--hairline)]">
                <table className="min-w-full divide-y divide-[color:var(--hairline)] text-left">
                  <thead className="bg-[color:var(--bg-elevated)] text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    <tr>
                      <th className="px-3 py-2">周</th>
                      <th className="px-3 py-2">来源</th>
                      <th className="px-3 py-2">分析/结果</th>
                      <th className="px-3 py-2">聊天/工具</th>
                      <th className="px-3 py-2">率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleWeeklySourceTrend.length ? visibleWeeklySourceTrend.map((item) => (
                      <tr key={`${item.weekStart}:${item.source}`} className="rounded-[var(--radius)] bg-white/82 text-sm text-[color:var(--ink)]">
                        <td className="px-3 py-3 font-semibold">{item.weekLabel}</td>
                        <td className="px-3 py-3">{formatAttributionSourceLabel(item.source)}</td>
                        <td className="px-3 py-3">{`${item.analyzeSessions}/${item.reportViewSessions}`}</td>
                        <td className="px-3 py-3">{`${item.chatSessions}/${item.toolRunSessions}`}</td>
                        <td className="px-3 py-3">{`${item.reportToViewRate}% -> ${item.viewToChatRate}%`}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td className="px-3 py-4 text-sm text-[color:var(--muted)]" colSpan={5}>
                          暂无最近 7 周来源趋势数据。
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] bg-white/72 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">来源 CTA 策略表现</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">看哪类来源话术真正把用户带进聊天和下一步</div>
                </div>
                <MetricBadge value={ctaStrategyBreakdown.length} label="策略" />
              </div>
              <div className="mt-4 grid gap-3">
                {ctaStrategyBreakdown.length ? ctaStrategyBreakdown.map((item) => (
                  <div key={item.key} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{mapCtaStrategyLabel(item.strategyKey)}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">{mapCtaSourceFamilyLabel(item.sourceFamily)}</div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.chatCompletionRate >= 50 ? 'healthy' : item.chatCompletionRate >= 25 ? 'warning' : 'critical')}`}>
                        {`${item.chatCompletionRate}% 完成`}
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                      {`CTA ${item.clicks} -> 聊天页 ${item.chatPageViews}（${item.clickToChatRate}%） -> 完成 ${item.chatCompleted}（${item.chatCompletionRate}%）；工具卡 ${item.toolCardClicks}；内容卡 ${item.contentCardClicks}。`}
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">{`最近动作：${formatStableTimestamp(item.latestAt)}`}</div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无策略表现样本" detail="等来源差异化 CTA 再积累一些真实点击后，这里会直接显示哪套承接话术最有效。" />
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] bg-white/72 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">来源 × 设备漏斗</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">看哪条来源在具体设备端最容易掉下去</div>
                </div>
                <MetricBadge value={sourceDeviceFunnel.length} label="组合" />
              </div>
              <div className="mt-4 grid gap-3">
                {sourceDeviceFunnel.length ? sourceDeviceFunnel.slice(0, 6).map((item) => (
                  <div key={`source-device-funnel:${item.source}:${item.deviceType}`} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{`${formatAttributionSourceLabel(item.source)} · ${mapDeviceTypeLabel(item.deviceType)}`}</div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.viewToChatRate >= 35 ? 'healthy' : item.viewToChatRate >= 15 ? 'warning' : 'critical')}`}>
                        {`${item.viewToChatRate}% 聊天`}
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                      {`analyze ${item.analyzeSessions} -> report ${item.reportsGenerated}（${item.analyzeToReportRate}%） -> view ${item.reportViewSessions}（${item.reportToViewRate}%） -> chat ${item.chatSessions}（${item.viewToChatRate}%） -> tool run ${item.toolRunSessions}（${item.viewToToolRunRate}%）。`}
                    </div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无来源与设备组合样本" detail="等更多真实来源流量进入后，这里会直接告诉你哪条来源在移动端或桌面端最弱。" />
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] bg-white/72 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">生命周期召回｜报告后追问</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">看提醒邮件有没有把用户真正带回聊天</div>
                </div>
                <MetricBadge value={lifecycleRecall?.reportFollowup?.length || 0} label="报告" />
              </div>
              <div className="mt-4 grid gap-3">
                {lifecycleRecall?.reportFollowup?.length ? lifecycleRecall.reportFollowup.map((item) => (
                  <div key={item.key} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">
                        {`报告 ${item.reportId.slice(0, 12)}`}
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.chatCompletionRate >= 60 ? 'healthy' : item.chatCompletionRate >= 30 ? 'warning' : 'critical')}`}>
                        {`${item.chatCompleted}/${item.chatPageViews} 完成`}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {`已发送 ${item.sent}，聊天页 ${item.chatPageViews}（${item.chatPageViewRate}%），完成 ${item.chatCompleted}（${item.chatCompletionRate}%），沉淀事件 ${item.chatEventsSaved}（${item.chatToEventRate}%）。`}
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {`最近动作：${formatStableTimestamp(item.latestAt)}`}
                    </div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无报告追问召回样本" detail="等生命周期邮件继续发出并回流后，这里会显示从提醒到聊天完成的真实效果。" />
                )}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] bg-white/72 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">生命周期召回｜工具兴趣回流</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">看工具提醒有没有把浏览兴趣变成实际开跑</div>
                </div>
                <MetricBadge value={lifecycleRecall?.toolInterest?.length || 0} label="工具" />
              </div>
              <div className="mt-4 grid gap-3">
                {lifecycleRecall?.toolInterest?.length ? lifecycleRecall.toolInterest.map((item) => (
                  <div key={item.key} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">
                        {getToolDisplayTitle(item.toolSlug)}
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.sentToRunRate >= 35 ? 'healthy' : item.sentToRunRate >= 15 ? 'warning' : 'critical')}`}>
                        {`${item.runStarts}/${item.sent} 开跑`}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {`已发送 ${item.sent}，详情访问 ${item.detailViews}，开跑 ${item.runStarts}（sent->run ${item.sentToRunRate}% / detail->run ${item.detailToRunRate}%），结果页 ${item.resultViews}（${item.runToResultRate}%）。`}
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {`最近动作：${formatStableTimestamp(item.latestAt)}`}
                    </div>
                </div>
              )) : (
                  <CompactEmptyState title="暂无工具兴趣回流样本" detail="等工具兴趣提醒进一步触发和回流后，这里会显示从提醒到开跑的真实效果。" />
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-[var(--radius-md)] bg-white/72 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">生命周期召回｜报告按来源/设备</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">看哪类入口和哪一端更容易把用户带回聊天</div>
                </div>
                <MetricBadge value={(lifecycleRecall?.reportFollowupBySource?.length || 0) + (lifecycleRecall?.reportFollowupByDevice?.length || 0)} label="分组" />
              </div>
              <div className="mt-4 grid gap-3">
                {(lifecycleRecall?.reportFollowupBySource?.length || 0) > 0 ? lifecycleRecall!.reportFollowupBySource!.slice(0, 4).map((item) => (
                  <div key={`report-source:${item.source}`} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{mapLifecycleSourceLabel(item.source)}</div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.chatCompletionRate >= 60 ? 'healthy' : item.chatCompletionRate >= 30 ? 'warning' : 'critical')}`}>
                        {`${item.chatCompleted}/${item.chatPageViews} 完成`}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {`已发送 ${item.sent}，聊天页 ${item.chatPageViews}（${item.chatPageViewRate}%），完成 ${item.chatCompletionRate}% ，沉淀事件 ${item.chatToEventRate}%。`}
                    </div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无报告召回来路分组样本" detail="需要继续积累邮件召回样本，才能看清哪类内容来源更适合带回聊天。" />
                )}
                {(lifecycleRecall?.reportFollowupByDevice?.length || 0) > 0 ? lifecycleRecall!.reportFollowupByDevice!.slice(0, 4).map((item) => (
                  <div key={`report-device:${item.deviceType}`} className="rounded-[var(--radius-md)] bg-white/85 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{mapDeviceTypeLabel(item.deviceType)}</div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.chatCompletionRate >= 60 ? 'healthy' : item.chatCompletionRate >= 30 ? 'warning' : 'critical')}`}>
                        {`${item.chatCompletionRate}% 完成`}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {`发送 ${item.sent}，聊天页 ${item.chatPageViewRate}% ，完成 ${item.chatCompletionRate}% ，沉淀事件 ${item.chatToEventRate}%。`}
                    </div>
                  </div>
                )) : null}
              </div>
            </div>

            <div className="rounded-[var(--radius-md)] bg-white/72 p-5 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--muted)]">生命周期召回｜工具按来源/设备</div>
                  <div className="mt-1 text-xl font-black text-[color:var(--ink)]">看哪类入口和哪一端更容易把兴趣带回真实开跑</div>
                </div>
                <MetricBadge value={(lifecycleRecall?.toolInterestBySource?.length || 0) + (lifecycleRecall?.toolInterestByDevice?.length || 0)} label="分组" />
              </div>
              <div className="mt-4 grid gap-3">
                {(lifecycleRecall?.toolInterestBySource?.length || 0) > 0 ? lifecycleRecall!.toolInterestBySource!.slice(0, 4).map((item) => (
                  <div key={`tool-source:${item.source}`} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{mapLifecycleSourceLabel(item.source)}</div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.sentToRunRate >= 35 ? 'healthy' : item.sentToRunRate >= 15 ? 'warning' : 'critical')}`}>
                        {`${item.runStarts}/${item.sent} 开跑`}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {`已发送 ${item.sent}，详情访问 ${item.detailViews}，sent->run ${item.sentToRunRate}% ，run->result ${item.runToResultRate}%。`}
                    </div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无工具召回来路分组样本" detail="继续积累工具召回样本后，这里会看清哪类内容来源更能带回真实开跑。" />
                )}
                {(lifecycleRecall?.toolInterestByDevice?.length || 0) > 0 ? lifecycleRecall!.toolInterestByDevice!.slice(0, 4).map((item) => (
                  <div key={`tool-device:${item.deviceType}`} className="rounded-[var(--radius-md)] bg-white/85 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{mapDeviceTypeLabel(item.deviceType)}</div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.sentToRunRate >= 35 ? 'healthy' : item.sentToRunRate >= 15 ? 'warning' : 'critical')}`}>
                        {`${item.sentToRunRate}% 开跑`}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {`发送 ${item.sent}，详情访问 ${item.detailViews}，开跑 ${item.sentToRunRate}% ，结果 ${item.runToResultRate}%。`}
                    </div>
                  </div>
                )) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div id="system-health-overview" className="glass-panel rounded-[var(--radius-md)] p-6 xl:col-span-2">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-[color:var(--muted)]">系统状态总览</div>
                <div className="mt-3 flex items-center gap-3">
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(systemHealth?.severity || 'neutral')}`}>
                    {mapHealthLabel(systemHealth?.severity || 'neutral')}
                  </div>
                  <div className="text-xs text-[color:var(--muted)]">
                    {systemHealth?.updatedAt ? `最近埋点：${systemHealth.updatedAt}` : '最近埋点时间暂不可用'}
                  </div>
                </div>
                <div className="mt-4 text-2xl font-black text-[color:var(--ink)]">{systemHealth?.title || '等待更多监控数据'}</div>
                <div className="mt-3 intro-copy">
                  {systemHealth?.summary || '当埋点、模型请求和反馈数据继续积累后，这里会自动给出更明确的系统判断。'}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:w-[28rem]">
                {(systemHealth?.cards || []).map((item) => (
                  <div key={item.key} className={`rounded-[var(--radius-md)] px-4 py-4 ${mapHealthCardTone(item.tone)}`}>
                    <div className="text-xs tracking-[0.18em]">{item.label}</div>
                    <div className="mt-2 text-3xl font-black">{item.value}</div>
                    <div className="mt-2 intro-copy opacity-80">{item.helper}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[var(--radius-md)] bg-rose-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">当前主要卡点</div>
                <div className="mt-3 grid gap-3">
                  {systemHealth?.blockers?.length ? systemHealth.blockers.map((item) => (
                    <div key={item} className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-xs leading-6 text-rose-700">
                      {item}
                    </div>
                  )) : (
                    <CompactEmptyState title="暂无硬阻塞" detail="当前没有明显需要立刻处理的系统阻塞点。" />
                  )}
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] bg-emerald-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">健康信号</div>
                <div className="mt-3 grid gap-3">
                  {systemHealth?.healthySignals?.length ? systemHealth.healthySignals.map((item) => (
                    <div key={item} className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-xs leading-6 text-emerald-700">
                      {item}
                    </div>
                  )) : (
                    <CompactEmptyState title="暂无健康信号样本" detail="等正向稳定性样本更多后，这里再展示健康信号。" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">当前经营判断</div>
              <MetricBadge value={operatingInsight.priorities.length + operatingInsight.risks.length} label="判断项" />
            </div>
            <div className="mt-4 rounded-[var(--radius-md)] bg-white/80 px-4 py-5">
              <div className="text-2xl font-black text-[color:var(--ink)]">{operatingInsight.headline}</div>
              <div className="mt-3 intro-copy">{operatingInsight.summary}</div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">优先事项</div>
                <div className="mt-3 grid gap-3">
                  {operatingInsight.priorities.length > 0 ? operatingInsight.priorities.map((item) => (
                    <div key={item} className="rounded-[var(--radius)] bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                      {item}
                    </div>
                  )) : (
                    <CompactEmptyState title="暂无额外优先事项" detail="当前经营判断没有新增优先项。" />
                  )}
                </div>
              </div>
              <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">当前风险</div>
                <div className="mt-3 grid gap-3">
                  {operatingInsight.risks.length > 0 ? operatingInsight.risks.map((item) => (
                    <div key={item} className="rounded-[var(--radius)] bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                      {item}
                    </div>
                  )) : (
                    <CompactEmptyState title="暂无结构性风险" detail="当前没有明显需要额外标记的系统性风险。" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">本周执行动作</div>
              <MetricBadge value={actionItems.length} label="动作" />
            </div>
            <div className="mt-5 grid gap-3">
              {actionItems.map((item) => (
                <div key={item.key} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapActionTone(item.tone)}`}>
                      {mapActionToneLabel(item.tone)}
                    </div>
                  </div>
                  <div className="mt-2 intro-copy">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">验证闭环概览</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { label: '准确', value: totals.validation_accurate, tone: 'text-emerald-700 bg-emerald-50' },
                { label: '偏差', value: totals.validation_drift, tone: 'text-rose-700 bg-rose-50' },
                { label: '待验证', value: totals.validation_pending, tone: 'text-[color:var(--ink-3)] bg-[color:var(--bg-elevated)]' },
              ].map((item) => (
                <div key={item.label} className={`rounded-[var(--radius-md)] px-4 py-5 ${item.tone}`}>
                  <div className="text-xs tracking-[0.18em]">{item.label}</div>
                  <div className="mt-2 text-3xl font-black">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[var(--radius-md)] bg-white/80 px-4 py-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">验证命中率</div>
                <div className="mt-2 text-3xl font-black text-emerald-700">{validationAccuracyRate}%</div>
                <div className="mt-2 intro-copy">只统计已经回收验证结果的事件。</div>
              </div>
              <div className="rounded-[var(--radius-md)] bg-white/80 px-4 py-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">偏差率</div>
                <div className="mt-2 text-3xl font-black text-rose-700">{driftRate}%</div>
                <div className="mt-2 intro-copy">偏差并不等于报告失效，更常见是时机和执行跑偏。</div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">核心漏斗</div>
              <MetricBadge value={journeyFunnel.length} label="步骤" />
            </div>
            <div className="mt-5 grid gap-3">
              {journeyFunnel.length > 0 ? journeyFunnel.map((item) => (
                <div key={item.key} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无核心漏斗" detail="等结果页、聊天和事件沉淀链路继续积累后再看。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6 xl:col-span-2">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold text-[color:var(--muted)]">报告分层旅程漏斗</div>
                <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">首报 → 深报 → 专项 → 验证的真实点击路径</div>
                <div className="mt-2 intro-copy">
                  基于 `report_journey_events` 近 30 天样本，专门观察用户从第一份报告继续深入、进入专项工具和回到验证层的路径。
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 lg:w-[28rem]">
                <div className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                  事件 {reportJourney.totalEvents}
                </div>
                <div className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                  报告 {reportJourney.uniqueReports}
                </div>
                <div className="rounded-[var(--radius)] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                  用户 {reportJourney.uniqueUsers}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[var(--radius-md)] bg-white/72 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[color:var(--muted)]">分层漏斗</div>
                  <MetricBadge value={reportJourney.funnel.length} label="层" />
                </div>
                <div className="mt-4 grid gap-3">
                  {reportJourney.funnel.length > 0 ? reportJourney.funnel.map((item) => (
                    <div key={item.key} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                          <div className="mt-1 text-xs text-[color:var(--muted)]">{mapReportJourneyLayerAdvice(item.key)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                          <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <CompactEmptyState title="暂无报告分层旅程样本" detail="结果页分层路径被点击后，这里会显示首报、深报、专项和验证的真实走向。" />
                  )}
                </div>
              </div>

              <div className="grid gap-5">
                <div className="rounded-[var(--radius-md)] bg-white/72 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--muted)]">热门专项方向</div>
                    <MetricBadge value={reportJourney.categories.length} label="类" />
                  </div>
                  <div className="mt-4 grid gap-3">
                    {reportJourney.categories.length > 0 ? reportJourney.categories.slice(0, 5).map((item) => (
                      <div key={item.category} className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-[color:var(--ink)]">{mapReportJourneyCategoryLabel(item.category)}</div>
                          <div className="text-xs text-[color:var(--muted)]">{`${item.count} / ${item.share}%`}</div>
                        </div>
                      </div>
                    )) : (
                      <CompactEmptyState title="暂无专项方向" detail="用户点击专项推荐后，这里会显示事业、财富、关系等方向偏好。" />
                    )}
                  </div>
                </div>

                <div className="rounded-[var(--radius-md)] bg-white/72 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--muted)]">热门承接工具</div>
                    <MetricBadge value={reportJourney.tools.length} label="工具" />
                  </div>
                  <div className="mt-4 grid gap-3">
                    {reportJourney.tools.length > 0 ? reportJourney.tools.slice(0, 5).map((item) => (
                      <div key={item.toolSlug} className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-[color:var(--ink)]">{getToolDisplayTitle(item.toolSlug)}</div>
                            <div className="mt-1 text-xs text-[color:var(--muted)]">{item.toolSlug}</div>
                          </div>
                          <div className="text-xs text-[color:var(--muted)]">{`${item.count} / ${item.share}%`}</div>
                        </div>
                      </div>
                    )) : (
                      <CompactEmptyState title="暂无承接工具" detail="专项工具点击累积后，这里会显示最能承接报告用户的工具。" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[var(--radius-md)] bg-white/72 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-[color:var(--muted)]">最近分层点击</div>
                <MetricBadge value={reportJourney.latestEvents.length} label="条" />
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {reportJourney.latestEvents.length > 0 ? reportJourney.latestEvents.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{mapReportJourneyActionLabel(item.actionTarget)}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          {`${item.reportId.slice(0, 12)} · ${item.layerKey || 'unknown'}`}
                        </div>
                      </div>
                      <div className="text-right text-xs text-[color:var(--muted)]">
                        {formatStableTimestamp(item.createdAt)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                      {[
                        item.category ? mapReportJourneyCategoryLabel(item.category) : null,
                        item.toolSlug ? getToolDisplayTitle(item.toolSlug) : null,
                        item.source || null,
                      ].filter(Boolean).join(' · ') || '未记录额外上下文'}
                    </div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无最近分层点击" detail="当用户点击结果页分层路径、专项推荐或验证入口后，这里会显示最近动作。" />
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">近 7 日关键行为</div>
              <MetricBadge value={eventsLast7d.length} label="事件类" />
            </div>
            <div className="mt-5 grid gap-3">
              {eventsLast7d.length > 0 ? eventsLast7d.map((item) => (
                <div key={item.eventName} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapAnalyticsEventLabel(item.eventName)}</div>
                    <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无近 7 日关键行为" detail="等关键埋点继续回流后，这里再显示近期高频行为。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">页面访问结构</div>
              <MetricBadge value={pageViewBreakdown.length} label="页面" />
            </div>
            <div className="mt-5 grid gap-3">
              {pageViewBreakdown.length > 0 ? pageViewBreakdown.map((item) => (
                <div key={item.page} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapPageLabel(item.page)}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无页面访问结构" detail="有了页面浏览样本后，这里再看流量主要落在哪些页面。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">分析入口偏好</div>
              <MetricBadge value={analyzeOptionBreakdown.length} label="入口" />
            </div>
            <div className="mt-5 grid gap-3">
              {analyzeOptionBreakdown.length > 0 ? analyzeOptionBreakdown.map((item) => (
                <div key={item.key} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无入口偏好数据" detail="等用户在多个分析入口间形成选择后再判断。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">事件来源验证拆解</div>
              <MetricBadge value={sourceBreakdown.length} label="来源" />
            </div>
            <div className="mt-5 grid gap-3">
              {sourceBreakdown.length > 0 ? sourceBreakdown.map((item) => (
                <div key={item.source} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapSourceLabel(item.source)}</div>
                    <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.total}</div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>准确 {item.accurate}</div>
                    <div>偏差 {item.drift}</div>
                    <div>待验证 {item.pending}</div>
                    <div>命中率 {item.accuracyRate}%</div>
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无来源验证拆解" detail="等更多事件完成验证闭环后再比较不同沉淀来源。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">推理层覆盖</div>
              <MetricBadge value={reasoningModeBreakdown.length} label="模式" />
            </div>
            <div className="mt-5 grid gap-3">
              {reasoningModeBreakdown.length > 0 ? reasoningModeBreakdown.map((item) => (
                <div key={item.mode} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapReasoningModeLabel(item.mode)}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无推理层覆盖" detail="等多种推理模式开始稳定调用后再看覆盖结构。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">模型健康与熔断</div>
              <MetricBadge value={modelHealthBreakdown.length} label="模型" />
            </div>
            <div className="mt-5 grid gap-3">
              {modelHealthBreakdown.length > 0 ? modelHealthBreakdown.map((item) => (
                <div key={item.model} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.model}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        {Object.keys(item.scopes || {}).length > 0
                          ? Object.entries(item.scopes).map(([scope, count]) => `${scope} ${count}`).join(' / ')
                          : '当前无请求范围数据'}
                      </div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapModelStateTone(item.currentState)}`}>
                      {mapModelStateLabel(item.currentState)}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>请求 {item.attempts}</div>
                    <div>成功率 {item.successRate}%</div>
                    <div>平均延迟 {item.avgLatencyMs}ms</div>
                    <div>
                      {item.currentState === 'open' || item.currentState === 'half-open'
                        ? `已持续 ${item.openDurationMinutes || 0} 分钟`
                        : item.reopenAt
                          ? `重试时间 ${item.reopenAt}`
                          : '当前可正常调度'}
                    </div>
                  </div>
                  <div className="mt-2 intro-copy">
                    {item.reopenOverdue
                      ? '已超过设定重试时间但仍未恢复，优先排查供应商和网络链路。'
                      : item.reopenAt
                        ? `下一次恢复探测时间：${item.reopenAt}`
                        : item.lastStateChangedAt
                          ? `最近状态变化：${item.lastStateChangedAt}`
                          : '当前没有额外的熔断状态信息。'}
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无模型健康数据" detail="等模型请求累积后，这里再看成功率、延迟和熔断状态。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">当前故障热点</div>
              <MetricBadge value={llmFailureHotspots.length} label="热点" />
            </div>
            <div className="mt-5 grid gap-3">
              {llmFailureHotspots.length > 0 ? llmFailureHotspots.map((item) => (
                <div key={item.key} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">{`${item.model} · ${item.scope}`}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-rose-700">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{`${item.avgLatencyMs}ms`}</div>
                    </div>
                  </div>
                  <div className="mt-2 intro-copy">
                    {item.lastSeenAt ? `最近一次：${item.lastSeenAt}` : '最近一次时间未记录'}
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无模型失败热点" detail="当前没有明显集中故障，可继续观察。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">接口健康</div>
              <MetricBadge value={routeHealthBreakdown.length} label="接口" />
            </div>
            <div className="mt-5 grid gap-3">
              {routeHealthBreakdown.length > 0 ? routeHealthBreakdown.map((item) => (
                <div key={item.key} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.successRate < 85 ? 'warning' : 'healthy')}`}>
                      {`${item.successRate}%`}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>{`成功 ${item.success}`}</div>
                    <div>{`失败 ${item.failed}`}</div>
                    <div>{`降级 ${item.fallbackCount}`}</div>
                    <div>{`均耗时 ${item.avgDurationMs}ms`}</div>
                  </div>
                  <div className="mt-2 intro-copy">
                    {item.lastSeenAt ? `最近一次：${item.lastSeenAt}，最高耗时 ${item.maxDurationMs}ms` : `最高耗时 ${item.maxDurationMs}ms`}
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无接口健康样本" detail="等接口请求再多一些，这里再看成功率和耗时。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">业务失败热点</div>
              <MetricBadge value={requestFailureHotspots.length} label="热点" />
            </div>
            <div className="mt-5 grid gap-3">
              {requestFailureHotspots.length > 0 ? requestFailureHotspots.map((item) => (
                <div key={item.key} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">{`${item.route} · ${item.action}`}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-rose-700">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.lastSeenAt || '时间未记录'}</div>
                    </div>
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无业务失败热点" detail="当前没有集中的业务失败记录。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">邮件系统状态</div>
              <MetricBadge value={emailDeliverySummary.success + emailDeliverySummary.failed} label="近 7 日投递" />
            </div>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-[color:var(--ink)]">SMTP 健康探测</div>
                    <div className="mt-1 text-xs text-[color:var(--muted)]">
                      {`${emailHealth.config.host}:${emailHealth.config.port} · 发件 ${emailHealth.config.from} · 认证 ${emailHealth.config.authUser}`}
                    </div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    emailHealth.status === 'ok'
                      ? 'bg-emerald-50 text-emerald-700'
                      : emailHealth.status === 'timeout'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                  }`}>
                    {emailHealth.status === 'ok' ? '连接正常' : emailHealth.status === 'timeout' ? '探测超时' : '连接失败'}
                  </div>
                </div>
                <div className="mt-3 intro-copy">
                  {emailHealth.status === 'ok'
                    ? '当前 SMTP 认证和连接均正常，验证码、订阅确认和升级提醒可以继续投递。'
                    : emailHealth.error || '邮件探测失败'}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] bg-emerald-50 px-4 py-5 text-emerald-700">
                  <div className="text-xs tracking-[0.18em]">近 7 日发送成功</div>
                  <div className="mt-2 text-3xl font-black">{emailDeliverySummary.success}</div>
                </div>
                <div className="rounded-[var(--radius-md)] bg-rose-50 px-4 py-5 text-rose-700">
                  <div className="text-xs tracking-[0.18em]">近 7 日发送失败</div>
                  <div className="mt-2 text-3xl font-black">{emailDeliverySummary.failed}</div>
                </div>
              </div>

              <div className="grid gap-3">
                {emailChannelBreakdown.length > 0 ? emailChannelBreakdown.map((item) => (
                  <div key={item.channel} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{mapEmailChannelLabel(item.channel)}</div>
                      <div className="text-xs text-[color:var(--muted)]">{`成功 ${item.success} / 失败 ${item.failed}`}</div>
                    </div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无邮件投递记录" detail="近 7 日还没有邮件发送或失败记录。" />
                )}
              </div>

              <div className="grid gap-3">
                {emailDeliveryRows.filter((item) => item.event_name === 'email_delivery_failed').slice(0, 5).map((item, index) => {
                  const meta = parseMeta(item.meta);
                  return (
                    <div key={`${item.created_at || 'unknown'}-${index}`} className="rounded-[var(--radius-md)] bg-rose-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-rose-700">{mapEmailChannelLabel(typeof meta.channel === 'string' ? meta.channel : 'unknown')}</div>
                        <div className="text-xs text-rose-600">{item.created_at || '-'}</div>
                      </div>
                      <div className="mt-2 text-xs leading-6 text-rose-700">{typeof meta.reason === 'string' ? meta.reason : '未记录失败原因'}</div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-5">
                <QueueMetric label="待重试" value={emailRetryQueue?.pending || 0} tone="text-amber-700 bg-amber-50" />
                <QueueMetric label="执行中" value={emailRetryQueue?.running || 0} tone="text-sky-700 bg-sky-50" />
                <QueueMetric label="已送达" value={emailRetryQueue?.sent || 0} tone="text-emerald-700 bg-emerald-50" />
                <QueueMetric label="最终失败" value={emailRetryQueue?.failed || 0} tone="text-rose-700 bg-rose-50" />
                <QueueMetric label="已取消" value={emailRetryQueue?.cancelled || 0} tone="text-[color:var(--ink-3)] bg-[color:var(--bg-elevated)]" />
              </div>

              <div className="grid gap-3">
                {recentEmailRetryJobs.length > 0 ? recentEmailRetryJobs.map((item) => (
                  <div key={item.id} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{mapEmailChannelLabel(item.kind)}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">{item.id}</div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapEmailRetryStatusTone(item.status)}`}>
                        {mapEmailRetryStatusLabel(item.status)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-[color:var(--muted)]">
                      {`尝试 ${item.attempts || 0} / ${item.maxAttempts || 0}`}
                      {item.lastError ? ` · ${item.lastError}` : ''}
                    </div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无邮件重试记录" detail="当前没有进入重试队列的邮件任务。" />
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">用户转化卡点</div>
              <MetricBadge value={funnelDiagnostics.length} label="断点" />
            </div>
            <div className="mt-5 grid gap-3">
              {funnelDiagnostics.length > 0 ? funnelDiagnostics.map((item) => (
                <div key={item.key} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.severity || 'neutral')}`}>
                      {`${item.conversionRate}%`}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3 text-xs text-[color:var(--muted)]">
                    <div>{`前一步 ${item.from}`}</div>
                    <div>{`到达 ${item.to}`}</div>
                    <div>{`流失 ${item.dropOff}`}</div>
                  </div>
                </div>
              )) : (
                  <CompactEmptyState title="暂无用户转化卡点" detail="等用户链路样本足够后，再定位主要流失点。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">归因转化热点</div>
              <MetricBadge value={attributedConversionBreakdown.length} label="热点" />
            </div>
            <div className="mt-5 grid gap-3">
              {attributedConversionBreakdown.length > 0 ? attributedConversionBreakdown.map((item) => (
                <div key={item.key} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.source}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">{item.target}</div>
                    </div>
                    <div className="text-xs text-[color:var(--muted)]">
                      {item.latestAt ? `最近一次 ${item.latestAt}` : '最近时间未知'}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
                    <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-[color:var(--ink)]">工具运行 {item.toolRuns}</div>
                    <div className="rounded-[var(--radius)] bg-[color:var(--accent-soft)] px-4 py-3 text-[color:var(--accent-strong)]">专项提交 {item.premiumRequests}</div>
                  </div>
                </div>
              )) : (
                  <CompactEmptyState title="暂无归因转化热点" detail="等内容和升级面板继续承接到工具与专项后，再看真实归因。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[color:var(--muted)]">回流承接效果</div>
                <div className="mt-2 intro-copy">
                  直接看不同入口把用户带到聊天页、完成聊天、沉淀事件的真实效果，而不是只看 CTA 点击。
                </div>
              </div>
              <MetricBadge value={chatReturnBreakdown.length} label="来源" />
            </div>
            <div className="mt-5 grid gap-3">
              {chatReturnBreakdown.length > 0 ? chatReturnBreakdown.map((item) => (
                <div key={`chat-return-${item.key}`} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.source}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        {item.latestAt ? `最近一次 ${item.latestAt}` : '最近时间未知'}
                      </div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.chatCompletionRate >= 60 ? 'healthy' : item.chatCompletionRate >= 30 ? 'warning' : 'critical')}`}>
                      聊天完成率 {item.chatCompletionRate}%
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>CTA {item.ctaClicks}</div>
                    <div>到聊天页 {item.chatPageViews}</div>
                    <div>完成聊天 {item.chatCompleted}</div>
                    <div>沉淀事件 {item.chatEventsSaved}</div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
                    <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-[color:var(--ink)]">点击到聊天 {item.ctaToChatRate}%</div>
                    <div className="rounded-[var(--radius)] bg-[color:var(--accent-soft)] px-4 py-3 text-[color:var(--accent-strong)]">聊天完成 {item.chatCompletionRate}%</div>
                    <div className="rounded-[var(--radius)] bg-emerald-50 px-4 py-3 text-emerald-700">聊天到事件 {item.chatToEventRate}%</div>
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无回流承接效果样本" detail="等更多入口统一接入后，这里直接看哪些来源真的把用户带回聊天和事件沉淀。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[color:var(--muted)]">今日优先修复内容</div>
                <div className="mt-2 intro-copy">
                  按质量缺口、真实 PV、跳出率和联动弱点综合排序，不是单看低分。
                </div>
              </div>
              <MetricBadge value={prioritizedContentFixes.length} label="项" />
            </div>
            <div className="mt-5 grid gap-3">
              {prioritizedContentFixes.length > 0 ? prioritizedContentFixes.map((item, index) => (
                <div key={`priority-content-${item.contentType}-${item.slug}`} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{`#${index + 1} · ${item.contentType}`}</div>
                      <div className="mt-1 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <a href={item.pagePath} className="mt-1 inline-flex text-xs text-[color:var(--accent-strong)] underline-offset-4 hover:underline">
                        {item.pagePath}
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className={`rounded-full px-3 py-1 font-semibold ${mapHealthTone(item.priorityScore >= 120 ? 'critical' : item.priorityScore >= 90 ? 'warning' : 'healthy')}`}>
                        优先级 {item.priorityScore}
                      </div>
                      <div className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 font-semibold text-[color:var(--ink-3)]">PV {item.views}</div>
                      <div className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 font-semibold text-[color:var(--ink-3)]">跳出 {item.bounceRate}%</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-[var(--radius)] bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
                    {item.action}
                  </div>
                  <div className="mt-2 intro-copy">{item.reason}</div>
                </div>
              )) : (
                <CompactEmptyState title="暂无内容修复样本" detail="等内容访问、跳出和联动样本再多一些后再排序。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[color:var(--muted)]">今日优先修复工具</div>
                <div className="mt-2 intro-copy">
                  优先修高流量但开跑弱、结果后付费弱、详情页高跳出的工具，不把精力浪费在没流量的角落。
                </div>
              </div>
              <MetricBadge value={prioritizedToolFixes.length} label="项" />
            </div>
            <div className="mt-5 grid gap-3">
              {prioritizedToolFixes.length > 0 ? prioritizedToolFixes.map((item, index) => (
                <div key={`priority-tool-${item.slug}`} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{`#${index + 1} · tool`}</div>
                      <div className="mt-1 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <a href={item.pagePath} className="mt-1 inline-flex text-xs text-[color:var(--accent-strong)] underline-offset-4 hover:underline">
                        {item.pagePath}
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className={`rounded-full px-3 py-1 font-semibold ${mapHealthTone(item.priorityScore >= 120 ? 'critical' : item.priorityScore >= 90 ? 'warning' : 'healthy')}`}>
                        优先级 {item.priorityScore}
                      </div>
                      <div className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 font-semibold text-[color:var(--ink-3)]">PV {item.detailViews}</div>
                      <div className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 font-semibold text-[color:var(--ink-3)]">首屏点击 {item.ctaStartRate}%</div>
                      <div className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 font-semibold text-[color:var(--ink-3)]">开跑 {item.runRate}%</div>
                      <div className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 font-semibold text-[color:var(--ink-3)]">点击到开跑 {item.ctaToRunRate}%</div>
                      <div className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 font-semibold text-[color:var(--ink-3)]">失败 {item.runFailureRate}%</div>
                      <div className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 font-semibold text-[color:var(--ink-3)]">专项 {item.premiumRate}%</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-[var(--radius)] bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
                    {item.action}
                  </div>
                  <div className="mt-2 intro-copy">{item.reason}</div>
                </div>
              )) : (
                <CompactEmptyState title="暂无工具修复样本" detail="等工具曝光和开跑样本更多后再给优先清单。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">内容质量预警</div>
              <MetricBadge value={contentQualityBreakdown.length} label="页面" />
            </div>
            <div className="mt-5 grid gap-3">
              {contentQualityBreakdown.length > 0 ? contentQualityBreakdown.map((item) => (
                <div key={`${item.contentType}-${item.slug}`} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">{`${item.contentType} · ${item.slug}`}</div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.qualityScore < 50 ? 'critical' : item.qualityScore < 70 ? 'warning' : 'healthy')}`}>
                      质量 {item.qualityScore}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>基础分 {item.baseQuality}</div>
                    <div>PV {item.views}</div>
                    <div>联动 {item.linkageScore}</div>
                    <div>跳出 {item.bounceRate}%</div>
                  </div>
                  <div className="mt-2 intro-copy">
                    {diagnoseContentQuality(item)}
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无内容质量预警" detail="等内容质量样本足够后，这里再提示低质量页面。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">工具质量预警</div>
              <MetricBadge value={toolQualityBreakdown.length} label="工具" />
            </div>
            <div className="mt-5 grid gap-3">
              {toolQualityBreakdown.length > 0 ? toolQualityBreakdown.map((item) => (
                <div key={item.slug} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">{item.slug}</div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.qualityScore < 50 ? 'critical' : item.qualityScore < 70 ? 'warning' : 'healthy')}`}>
                      质量 {item.qualityScore}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>基础分 {item.baseQuality}</div>
                    <div>PV {item.detailViews}</div>
                    <div>首屏点击 {item.ctaStartRate}%</div>
                    <div>开跑率 {item.runRate}%</div>
                    <div>跳出 {item.bounceRate}%</div>
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">{`点击到开跑 ${item.ctaToRunRate}% · 运行失败 ${item.runFailureRate}% · 结果到专项 ${item.premiumRate}%`}</div>
                  <div className="mt-2 intro-copy">
                    {diagnoseToolQuality(item)}
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无工具质量预警" detail="等工具质量样本足够后，这里再提示高风险工具。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">高跳出页面</div>
              <MetricBadge value={bounceBreakdown.length} label="页面" />
            </div>
            <div className="mt-5 grid gap-3">
              {bounceBreakdown.length > 0 ? bounceBreakdown.map((item) => (
                <div key={item.page} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapPageLabel(item.page)}</div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.bounceRate >= 80 ? 'critical' : item.bounceRate >= 60 ? 'warning' : 'healthy')}`}>
                      跳出 {item.bounceRate}%
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>页面 {item.page}</div>
                    <div>PV {item.views}</div>
                    <div>有效会话 {item.engagedCount}</div>
                    <div>跳出会话 {item.bouncedCount}</div>
                  </div>
                  <div className="mt-2 intro-copy">
                    {diagnoseBouncePage(item)}
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无页面跳出预警" detail="等页面访问样本累积后，这里再看高跳出页面。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">专项服务与用户跟进</div>
              <MetricBadge value={recentPremiumRequests.length} label="最新需求" />
            </div>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                <QueueMetric label="新提交" value={premiumServiceStatus?.new || 0} tone="text-amber-700 bg-amber-50" />
                <QueueMetric label="已跟进" value={premiumServiceStatus?.contacted || 0} tone="text-sky-700 bg-sky-50" />
                <QueueMetric label="处理中" value={premiumServiceStatus?.in_progress || 0} tone="text-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]" />
                <QueueMetric label="已交付" value={premiumServiceStatus?.delivered || 0} tone="text-emerald-700 bg-emerald-50" />
                <QueueMetric label="已结束" value={premiumServiceStatus?.closed || 0} tone="text-[color:var(--ink-3)] bg-[color:var(--bg-elevated)]" />
                <QueueMetric label="已取消" value={premiumServiceStatus?.cancelled || 0} tone="text-rose-700 bg-rose-50" />
              </div>

              <div className="grid gap-3">
                {recentPremiumRequests.length > 0 ? recentPremiumRequests.map((item) => (
                  <div key={item.id} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{mapPremiumServiceLabel(item.serviceKey)}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">{item.contactValue || '未留联系方式'}</div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapPremiumStatusTone(item.status)}`}>
                        {mapPremiumStatusLabel(item.status)}
                      </div>
                    </div>
                    <div className="mt-2 intro-copy">
                      {`${item.intake?.question || '未填写问题'}`}
                    </div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无专项需求记录" detail="当前还没有用户提交专项服务需求。" />
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">聊天动作结构</div>
              <MetricBadge value={chatActionBreakdown.length} label="动作" />
            </div>
            <div className="mt-5 grid gap-3">
              {chatActionBreakdown.length > 0 ? chatActionBreakdown.map((item) => (
                <div key={item.action} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无聊天动作结构" detail="等聊天交互样本继续积累后再看动作分布。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">结果页 CTA 表现</div>
              <MetricBadge value={ctaBreakdown.length} label="CTA" />
            </div>
            <div className="mt-5 grid gap-3">
              {ctaBreakdown.length > 0 ? ctaBreakdown.map((item) => (
                <div key={item.key} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无结果页 CTA 数据" detail="等结果页点击样本积累后再看 CTA 表现。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">工具成交漏斗</div>
              <MetricBadge value={toolFunnelBreakdown.length} label="工具" />
            </div>
            <div className="mt-5 grid gap-3">
              {toolFunnelBreakdown.length > 0 ? toolFunnelBreakdown.map((item) => (
                <div key={item.toolSlug} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.toolSlug}</div>
                    <div className="text-xs text-[color:var(--muted)]">
                      {item.latestAt ? `最近一次 ${item.latestAt}` : '最近时间未知'}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>详情 {item.detailViews}</div>
                    <div>开跑 {item.runStarts}</div>
                    <div>结果 {item.resultViews}</div>
                    <div>专项 {item.premiumRequests}</div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
                    <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-[color:var(--ink)]">详情到开跑 {item.viewToRunRate}%</div>
                    <div className="rounded-[var(--radius)] bg-[color:var(--accent-soft)] px-4 py-3 text-[color:var(--accent-strong)]">结果到专项 {item.resultToPremiumRate}%</div>
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无工具成交漏斗" detail="等工具详情、结果和专项链路更完整后再看成交漏斗。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">工具漏斗断点工单</div>
              <MetricBadge value={toolJourneyGapBreakdown.length} label="工单" />
            </div>
            <div className="mt-2 intro-copy">
              直接显示当前工具链路最先该修的断点类型，不再手动猜是首屏问题还是运行问题。
            </div>
            <div className="mt-5 grid gap-3">
              {toolJourneyGapBreakdown.length > 0 ? toolJourneyGapBreakdown.map((item, index) => (
                <div key={`tool-gap-${item.slug}`} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{`#${index + 1} · ${mapGapTypeLabel(item.gapType)}`}</div>
                      <div className="mt-1 text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <a href={item.pagePath} className="mt-1 inline-flex text-xs text-[color:var(--accent-strong)] underline-offset-4 hover:underline">
                        {item.pagePath}
                      </a>
                    </div>
                    <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                      优先级 {item.priorityScore}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>PV {item.detailViews}</div>
                    <div>首屏点击 {item.startCtaRate}%</div>
                    <div>点击到开跑 {item.ctaToRunRate}%</div>
                    <div>失败 {item.runFailureRate}%</div>
                  </div>
                  <div className="mt-3 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">{item.action}</div>
                </div>
              )) : (
                <CompactEmptyState title="暂无工具断点工单" detail="等工具漏斗样本足够后再定位主断点。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6 xl:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">统一工具修复队列</div>
              <MetricBadge value={unifiedToolRepairQueue.length} label="工具" />
            </div>
            <div className="mt-2 intro-copy">
              把“质量缺口”和“漏斗断点”合并排序，优先修高流量高损失工具。
            </div>
            <div className="mt-5 grid gap-3">
              {unifiedToolRepairQueue.length > 0 ? unifiedToolRepairQueue.map((item, index) => (
                <div key={`unified-tool-fix-${item.slug}`} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{`#${index + 1} · tool`}</div>
                      <div className="mt-1 text-base font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <a href={item.pagePath} className="mt-1 inline-flex text-xs text-[color:var(--accent-strong)] underline-offset-4 hover:underline">
                        {item.pagePath}
                      </a>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className={`rounded-full px-3 py-1 font-semibold ${mapHealthTone(item.combinedPriority >= 120 ? 'critical' : item.combinedPriority >= 90 ? 'warning' : 'healthy')}`}>
                        综合优先级 {item.combinedPriority}
                      </div>
                      <div className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 font-semibold text-[color:var(--ink-3)]">质量优先级 {item.priorityScore}</div>
                      <div className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 font-semibold text-[color:var(--ink-3)]">断点优先级 {item.gapPriorityScore}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-5 text-xs text-[color:var(--muted)]">
                    <div>PV {item.detailViews}</div>
                    <div>首屏点击 {item.ctaStartRate}%</div>
                    <div>点击到开跑 {item.ctaToRunRate}%</div>
                    <div>开跑 {item.runRate}%</div>
                    <div>专项 {item.premiumRate}%</div>
                  </div>
                  <div className="mt-3 rounded-[var(--radius)] bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
                    {item.action}
                  </div>
                  <div className="mt-2 rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                    {item.gapAction}
                  </div>
                  <div className="mt-2 intro-copy">
                    {item.gapType ? `主断点：${mapGapTypeLabel(item.gapType)}` : '当前无明确断点，按质量建议优先修包装与承接。'}
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无统一修复队列" detail="当前还没有足够样本来合并质量缺口和漏斗断点。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">工具首屏链路健康</div>
              <MetricBadge value={toolJourneyHealthRows.length} label="工具" />
            </div>
            <div className="mt-2 intro-copy">
              看“详情曝光 → 点击开始 → 实际开跑 → 运行失败”的真实断点，优先修高流量链路。
            </div>
            <div className="mt-5 grid gap-3">
              {toolJourneyHealthRows.length > 0 ? toolJourneyHealthRows.map((item) => (
                <div key={`tool-journey-${item.slug}`} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">{item.slug}</div>
                    </div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapHealthTone(item.runFailureRate >= 20 ? 'critical' : item.runFailureRate >= 10 ? 'warning' : 'healthy')}`}>
                      失败率 {item.runFailureRate}%
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-4 text-xs text-[color:var(--muted)]">
                    <div>详情 PV {item.detailViews}</div>
                    <div>开始点击 {item.startCtaClicks}</div>
                    <div>实际开跑 {item.runStarts}</div>
                    <div>失败 {item.runFailures}</div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
                    <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-[color:var(--ink)]">详情到开始 {item.ctaStartRate}%</div>
                    <div className="rounded-[var(--radius)] bg-[color:var(--bg-elevated)] px-4 py-3 text-[color:var(--ink)]">开始到开跑 {item.ctaToRunRate}%</div>
                    <div className="rounded-[var(--radius)] bg-[color:var(--accent-soft)] px-4 py-3 text-[color:var(--accent-strong)]">结果到专项 {item.premiumRate}%</div>
                  </div>
                  <div className="mt-2 intro-copy">
                    {diagnoseToolJourneyHealth(item)}
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无工具首屏链路样本" detail="等工具首屏到开跑链路样本更多后再判断。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">偏差原因分布</div>
              <MetricBadge value={driftReasonBreakdown.length} label="原因" />
            </div>
            <div className="mt-5 grid gap-3">
              {driftReasonBreakdown.length > 0 ? driftReasonBreakdown.map((item) => (
                <div key={item.key} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-rose-700">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                  <div className="mt-2 intro-copy">
                    {item.examples.length > 0 ? `样本事件：${item.examples.join('、')}` : '当前分类下还没有代表性样本。'}
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无偏差原因分布" detail="等用户持续回填偏差事件后再看常见模式。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">待验证回收队列</div>
              <MetricBadge value={followupQueue.length} label="事件" />
            </div>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <QueueMetric label="已过期待验证" value={pendingValidationBuckets.overdue} tone="text-rose-700 bg-rose-50" />
                <QueueMetric label="未来待发生" value={pendingValidationBuckets.upcoming} tone="text-[color:var(--ink-3)] bg-[color:var(--bg-elevated)]" />
                <QueueMetric label="偏差待备注" value={pendingValidationBuckets.driftNeedsNotes} tone="text-amber-700 bg-amber-50" />
                <QueueMetric label="偏差待纠偏" value={pendingValidationBuckets.driftReadyForCorrection} tone="text-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]" />
              </div>

              <div className="grid gap-3">
                {followupQueue.length > 0 ? followupQueue.map((item) => (
                  <div key={item.id} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">
                          {item.date} · {mapSourceLabel(item.source)} · {item.status === 'drift' ? '已偏差' : '待验证'}
                        </div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === 'drift' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {item.action}
                      </div>
                    </div>
                    <div className="mt-2 intro-copy">{item.reason}</div>
                  </div>
                )) : (
                  <CompactEmptyState title="暂无待回收队列" detail="当前没有需要优先追踪或纠偏的事件。" />
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">报告版本结构</div>
              <MetricBadge value={reportVersionBreakdown.length} label="版本" />
            </div>
            <div className="mt-5 grid gap-3">
              {reportVersionBreakdown.length > 0 ? reportVersionBreakdown.map((item) => (
                <div key={item.version} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.version}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <CompactEmptyState title="暂无报告版本结构" detail="等报告版本样本积累后再看版本占比。" />
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[var(--radius-md)] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[color:var(--muted)]">最近埋点明细</div>
              <MetricBadge value={recentEvents.length} label="事件" />
            </div>
            <div className="mt-5 grid gap-3">
              {recentEvents.length > 0 ? recentEvents.map((item) => (
                <div key={item.id} className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapAnalyticsEventLabel(item.eventName)}</div>
                    <div className="text-xs text-[color:var(--muted)]">{item.createdAt || '-'}</div>
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">{item.page || '未记录页面'}</div>
                </div>
              )) : (
                <CompactEmptyState title="暂无最近埋点明细" detail="等埋点继续写入后，这里再显示最新事件明细。" />
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function mapSourceLabel(source: string) {
  if (source === 'result_report') return '结果页沉淀';
  if (source === 'chat_message') return '聊天沉淀';
  return '手动创建';
}

function mapLifecycleSourceLabel(source: string) {
  return formatAttributionSourceLabel(source);
}

function mapReportJourneyLayerAdvice(layerKey: string) {
  if (layerKey === 'first-report') return '用户仍在首报总览层，需要首屏结论和下一步足够清晰。';
  if (layerKey === 'deep-report') return '用户愿意继续看证据层，重点优化结构解释和阶段窗口。';
  if (layerKey === 'category-report') return '用户已进入专项选择，重点看工具承接和开跑率。';
  if (layerKey === 'event-validation') return '用户回到验证闭环，重点看纠偏与复盘是否可执行。';
  return '未知分层动作，需要检查埋点 meta 或工作流配置。';
}

function mapReportJourneyCategoryLabel(category: string) {
  if (category === 'career') return '事业专项';
  if (category === 'wealth') return '财富专项';
  if (category === 'relationship') return '关系专项';
  if (category === 'health') return '健康专项';
  if (category === 'family') return '家庭专项';
  if (category === 'migration') return '迁移专项';
  if (category === 'timing') return '时机专项';
  if (category === 'application') return '应用专项';
  return category;
}

function mapReportJourneyActionLabel(actionTarget: string) {
  if (actionTarget === 'report_journey_deep_report') return '继续看深入报告';
  if (actionTarget === 'report_journey_deep_report_basic') return '查看稳定版深度解释';
  if (actionTarget === 'report_journey_validation') return '处理报告纠偏';
  if (actionTarget === 'report_journey_primary_category') return '进入首选专项';
  if (actionTarget === 'report_journey_secondary_category') return '进入备选专项';
  if (actionTarget.startsWith('report_journey_layer_')) return '点击分层阅读卡片';
  return actionTarget;
}

function CompactEmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-white/80 px-4 py-4">
      <div className="text-sm font-semibold text-[color:var(--ink)]">{title}</div>
      <div className="mt-2 text-xs text-[color:var(--muted)]">{detail}</div>
    </div>
  );
}

function MetricBadge({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-full bg-[color:var(--bg-elevated)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
      {value} {label}
    </div>
  );
}

function formatStableTimestamp(value?: string | null) {
  if (!value) {
    return '--';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return formatDateTime(parsed);
}

function getToolDisplayTitle(toolSlug: string) {
  const tool = listToolDefinitions().find((item) => item.slug === toolSlug);
  return tool?.shortTitle || tool?.title || toolSlug;
}

function mapPremiumServiceLabel(serviceKey: string) {
  if (serviceKey === 'event-simulation') return '事件推演';
  if (serviceKey === 'event-verdict') return '断事专项';
  if (serviceKey === 'event-review') return '事件剖析';
  if (serviceKey === 'meihua-enhancement') return '摇卦 / 梅花易';
  return serviceKey;
}

function mapAnalyticsEventLabel(eventName: string) {
  const labels: Record<string, string> = {
    home_page_viewed: '首页访问',
    analyze_page_viewed: '分析页访问',
    chat_page_viewed: '聊天页访问',
    events_page_viewed: '事件页访问',
    profile_page_viewed: '档案页访问',
    history_page_viewed: '历史页访问',
    updates_page_viewed: '更新页访问',
    knowledge_page_viewed: '知识库访问',
    knowledge_article_viewed: '知识文章访问',
    cases_page_viewed: '案例库访问',
    case_article_viewed: '案例文章访问',
    insights_page_viewed: '洞察中心访问',
    insight_article_viewed: '洞察文章访问',
    content_card_clicked: '内容卡片点击',
    content_quick_analyze_started: '内容页发起测算',
    analyze_submitted: '提交测算',
    analyze_completed: '测算完成',
    analyze_failed: '测算失败',
    report_generated: '生成报告',
    report_feedback_synced: '反馈回写报告',
    report_monthly_digest_sent: '月度更新发送',
    report_viewed: '打开结果页',
    report_upgrade_requested: '升级重算',
    result_cta_clicked: '结果页 CTA',
    auth_code_requested: '请求验证码',
    auth_verified: '完成邮箱验证',
    newsletter_subscribed: '邮件订阅',
    email_delivery_succeeded: '邮件发送成功',
    email_delivery_failed: '邮件发送失败',
    email_retry_enqueued: '邮件重试入队',
    email_retry_processed: '邮件重试处理',
    chat_message_sent: '聊天动作',
    chat_completed: '聊天接口完成',
    chat_failed: '聊天接口失败',
    chat_context_loaded: '加载聊天上下文',
    chat_followup_clicked: '点击追问',
    chat_event_saved: '聊天转事件',
    premium_service_requested: '专项需求提交',
    premium_service_status_updated: '专项需求跟进',
    event_created: '创建事件',
    report_event_saved_from_result: '结果页转事件',
    report_past_event_saved_from_result: '结果页确认过去事件',
    event_feedback_recorded: '记录验证反馈',
    event_updated: '更新事件',
    event_deleted: '删除事件',
    llm_model_attempt: '模型请求',
    llm_model_circuit_changed: '模型熔断状态变化',
  };
  return labels[eventName] || eventName;
}

function mapPageLabel(page: string) {
  if (page === '/') return '首页';
  if (page === '/analyze') return '分析页';
  if (page === '/chat') return '聊天页';
  if (page === '/events') return '事件页';
  if (page === '/profile') return '档案页';
  if (page === '/updates') return '更新页';
  if (page === '/knowledge') return '知识库';
  if (page === '/cases') return '案例库';
  if (page === '/insights') return '洞察中心';
  if (page.startsWith('/knowledge/')) return '知识文章';
  if (page.startsWith('/cases/')) return '案例文章';
  if (page.startsWith('/insights/')) return '洞察文章';
  if (page.startsWith('/tools/')) return '工具详情';
  if (page.startsWith('/result/')) return '结果页';
  return page;
}

function mapReasoningModeLabel(mode: string) {
  if (mode === 'parallel-agents') return '并发 Agent';
  if (mode === 'deterministic-expert') return 'Deterministic 专家层';
  if (mode === 'engine') return '基础引擎';
  return mode;
}

function mapModelStateLabel(state: string) {
  if (state === 'open') return '熔断中';
  if (state === 'half-open') return '半开探测';
  if (state === 'degraded') return '降级排序';
  return '正常';
}

function mapModelStateTone(state: string) {
  if (state === 'open') return 'bg-rose-50 text-rose-700';
  if (state === 'half-open') return 'bg-amber-50 text-amber-700';
  if (state === 'degraded') return 'bg-sky-50 text-sky-700';
  return 'bg-emerald-50 text-emerald-700';
}

function mapHealthLabel(severity: string) {
  if (severity === 'critical') return '高风险';
  if (severity === 'warning') return '需处理';
  if (severity === 'healthy') return '健康';
  return '观察中';
}

function mapHealthTone(severity: string) {
  if (severity === 'critical') return 'bg-rose-50 text-rose-700';
  if (severity === 'warning') return 'bg-amber-50 text-amber-700';
  if (severity === 'healthy') return 'bg-emerald-50 text-emerald-700';
  return 'bg-[color:var(--bg-elevated)] text-[color:var(--ink-3)]';
}

function mapHealthCardTone(severity: string) {
  if (severity === 'critical') return 'bg-rose-50 text-rose-700';
  if (severity === 'warning') return 'bg-amber-50 text-amber-700';
  if (severity === 'healthy') return 'bg-emerald-50 text-emerald-700';
  return 'bg-[color:var(--bg-elevated)] text-[color:var(--ink-3)]';
}

function mapTrendTone(direction: string) {
  if (direction === 'up') return 'bg-emerald-50 text-emerald-700';
  if (direction === 'down') return 'bg-rose-50 text-rose-700';
  return 'bg-[color:var(--bg-elevated)] text-[color:var(--ink-3)]';
}

function mapSampleLabel(sampleState: string) {
  if (sampleState === 'enough') return '样本可用';
  if (sampleState === 'low') return '样本偏低';
  return '样本稀薄';
}

function mapSampleTone(sampleState: string) {
  if (sampleState === 'enough') return 'bg-emerald-50 text-emerald-700';
  if (sampleState === 'low') return 'bg-amber-50 text-amber-700';
  return 'bg-[color:var(--bg-elevated)] text-[color:var(--ink-3)]';
}

function mapDeviceTypeLabel(deviceType: string) {
  if (deviceType === 'mobile') return '移动端';
  if (deviceType === 'desktop') return '桌面端';
  if (deviceType === 'tablet') return '平板';
  if (deviceType === 'bot') return '爬虫 / 机器人';
  return '未知';
}

function formatTrendDelta(delta: number, pctChange?: number | null) {
  const signedDelta = delta > 0 ? `+${delta}` : `${delta}`;
  if (pctChange === null || pctChange === undefined) {
    return signedDelta;
  }
  const signedPct = pctChange > 0 ? `+${pctChange}%` : `${pctChange}%`;
  return `${signedDelta} / ${signedPct}`;
}

function formatDeviceShiftDelta(item: {
  productEventsDelta: number;
  reportToChatRateDelta: number;
  toolToRunRateDelta: number;
  authVerifyRateDelta: number;
}) {
  const parts: string[] = [];
  if (item.productEventsDelta !== 0) {
    parts.push(`事件 ${item.productEventsDelta > 0 ? '+' : ''}${item.productEventsDelta}`);
  }
  if (item.reportToChatRateDelta !== 0) {
    parts.push(`聊转 ${item.reportToChatRateDelta > 0 ? '+' : ''}${item.reportToChatRateDelta}pt`);
  }
  if (item.toolToRunRateDelta !== 0) {
    parts.push(`工具 ${item.toolToRunRateDelta > 0 ? '+' : ''}${item.toolToRunRateDelta}pt`);
  }
  if (item.authVerifyRateDelta !== 0) {
    parts.push(`验证 ${item.authVerifyRateDelta > 0 ? '+' : ''}${item.authVerifyRateDelta}pt`);
  }
  return parts.join(' · ') || '无明显变化';
}

function formatSourceShiftDelta(item: {
  analyzeSessionsDelta: number;
  reportViewSessionsDelta: number;
  viewToChatRateDelta: number;
  viewToToolRunRateDelta: number;
}) {
  const parts: string[] = [];
  if (item.analyzeSessionsDelta !== 0) {
    parts.push(`分析 ${item.analyzeSessionsDelta > 0 ? '+' : ''}${item.analyzeSessionsDelta}`);
  }
  if (item.reportViewSessionsDelta !== 0) {
    parts.push(`结果 ${item.reportViewSessionsDelta > 0 ? '+' : ''}${item.reportViewSessionsDelta}`);
  }
  if (item.viewToChatRateDelta !== 0) {
    parts.push(`聊天 ${item.viewToChatRateDelta > 0 ? '+' : ''}${item.viewToChatRateDelta}pt`);
  }
  if (item.viewToToolRunRateDelta !== 0) {
    parts.push(`工具 ${item.viewToToolRunRateDelta > 0 ? '+' : ''}${item.viewToToolRunRateDelta}pt`);
  }
  return parts.join(' · ') || '无明显变化';
}

function mapEmailRetryStatusLabel(status: string) {
  if (status === 'pending') return '待重试';
  if (status === 'running') return '执行中';
  if (status === 'sent') return '已送达';
  if (status === 'cancelled') return '已取消';
  return '最终失败';
}

function mapEmailRetryStatusTone(status: string) {
  if (status === 'pending') return 'bg-amber-50 text-amber-700';
  if (status === 'running') return 'bg-sky-50 text-sky-700';
  if (status === 'sent') return 'bg-emerald-50 text-emerald-700';
  if (status === 'cancelled') return 'bg-[color:var(--bg-elevated)] text-[color:var(--ink-3)]';
  return 'bg-rose-50 text-rose-700';
}

function mapPremiumStatusLabel(status: string) {
  if (status === 'contacted') return '已跟进';
  if (status === 'in_progress') return '处理中';
  if (status === 'delivered') return '已交付';
  if (status === 'closed') return '已结束';
  if (status === 'cancelled') return '已取消';
  return '新提交';
}

function mapPremiumStatusTone(status: string) {
  if (status === 'contacted') return 'bg-sky-50 text-sky-700';
  if (status === 'in_progress') return 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]';
  if (status === 'delivered') return 'bg-emerald-50 text-emerald-700';
  if (status === 'closed') return 'bg-[color:var(--bg-elevated)] text-[color:var(--ink-3)]';
  if (status === 'cancelled') return 'bg-rose-50 text-rose-700';
  return 'bg-amber-50 text-amber-700';
}

function QueueMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-[var(--radius-md)] px-4 py-5 ${tone}`}>
      <div className="text-xs tracking-[0.18em]">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

function mapActionTone(tone: 'accent' | 'warning' | 'success' | 'neutral') {
  switch (tone) {
    case 'accent':
      return 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]';
    case 'warning':
      return 'bg-amber-50 text-amber-700';
    case 'success':
      return 'bg-emerald-50 text-emerald-700';
    default:
      return 'bg-[color:var(--bg-elevated)] text-[color:var(--ink-3)]';
  }
}

function mapActionToneLabel(tone: 'accent' | 'warning' | 'success' | 'neutral') {
  switch (tone) {
    case 'accent':
      return '推进';
    case 'warning':
      return '优先';
    case 'success':
      return '健康';
    default:
      return '观察';
  }
}

function mapGapTypeLabel(gapType: 'start_cta' | 'cta_to_run' | 'run_failure' | 'result_to_premium') {
  if (gapType === 'start_cta') return '首屏点击断层';
  if (gapType === 'cta_to_run') return '点击到开跑断层';
  if (gapType === 'run_failure') return '运行失败断层';
  return '结果到专项断层';
}

function diagnoseContentQuality(item: {
  baseQuality: number;
  linkageScore: number;
  bounceRate: number;
  views: number;
  contentType: string;
}) {
  if (item.baseQuality < 60) {
    return item.contentType === 'knowledge'
      ? '优先补内容骨架：扩章节结构、补概念密度、补关联工具与相关文章。现在先天质量不够，行为数据再多也难转化。'
      : '优先补案例质量：把场景、动作、结果和收益写实，不要只停在故事梗概。当前案例本身承接力不够。';
  }
  if (item.bounceRate >= 75) {
    return '优先降跳出：重写首屏摘要、把 CTA 前置，并明确“读完这篇下一步该测哪个工具”。现在用户看完就走。';
  }
  if (item.linkageScore < 12) {
    return '优先补联动：增加工具入口、快速测算承接和专项升级说明。内容本身还行，但没有把用户顺利带到后续动作。';
  }
  if (item.views < 20) {
    return '优先补曝光：这篇内容的质量基础已够，但真实流量样本太少，先提高首页、专题和相关卡片曝光。';
  }
  return '当前更适合继续微调标题、摘要和 CTA 文案，而不是大改主体结构。';
}

function diagnoseToolQuality(item: {
  baseQuality: number;
  ctaStartRate: number;
  ctaToRunRate: number;
  runRate: number;
  runFailureRate: number;
  premiumRate: number;
  bounceRate: number;
  detailViews: number;
}) {
  if (item.baseQuality < 65) {
    return '优先补工具包装：重写 hook、免费价值、付费点、案例、异议处理和 FAQ。当前产品包装还不够精品。';
  }
  if (item.ctaStartRate < 18) {
    return '优先补首屏点击：现在很多用户只浏览不点击，首屏触发和免费承诺需要更直接。';
  }
  if (item.ctaToRunRate < 70) {
    return '优先补点击后承接：用户点了开始但没跑起来，说明输入成本或信任提示仍有阻力。';
  }
  if (item.runRate < 20) {
    return '优先补详情页到开跑承接：首屏承诺不够强，运行前提示太弱，用户看完没有理由立即开始。';
  }
  if (item.runFailureRate >= 15) {
    return '优先降运行失败：接口异常或前置拦截正在直接吞掉高意向用户。';
  }
  if (item.premiumRate < 8) {
    return '优先补结果页到付费承接：免费结果和专项价值之间还没有形成明显落差，付费点不够具体。';
  }
  if (item.bounceRate >= 70) {
    return '优先降跳出：把主 CTA 前置，减少页面前半段的解释阻力，让用户更快进入运行。';
  }
  if (item.detailViews < 20) {
    return '优先补曝光与分发，不是先改工具本体。当前样本太少，先让更多相关页面把流量导进来。';
  }
  return '当前工具质量已进入可优化区，优先微调免费结果和专项文案颗粒度。';
}

function diagnoseToolJourneyHealth(item: {
  detailViews: number;
  ctaStartRate: number;
  ctaToRunRate: number;
  runFailureRate: number;
  premiumRate: number;
}) {
  if (item.ctaStartRate < 18) {
    return '首屏点击开始偏低：优先重写触发场景、免费价值和首屏主 CTA，减少用户“先看看”的停留。';
  }
  if (item.ctaToRunRate < 70) {
    return '点击后开跑转化偏低：检查表单文案与默认阻力，确保用户点开始后能快速提交。';
  }
  if (item.runFailureRate >= 15) {
    return '运行失败率偏高：优先排查接口失败与登录拦截提示，避免用户被动流失。';
  }
  if (item.premiumRate < 8) {
    return '链路前段正常但后段付费弱：补强结果页“免费结论 vs 深测差异”的具体落差。';
  }
  return '这条首屏链路整体健康，适合做文案和案例顺序的细节优化。';
}

function diagnoseBouncePage(item: {
  page: string;
  bounceRate: number;
  views: number;
}) {
  if (item.page.startsWith('/knowledge/') || item.page.startsWith('/cases/')) {
    return item.bounceRate >= 80
      ? '这是内容页高跳出，优先重写首屏摘要并把主工具承接前置。'
      : '这是内容页中高跳出，优先补相关推荐密度和快速测算入口。';
  }
  if (item.page.startsWith('/tools/')) {
    return item.bounceRate >= 80
      ? '这是工具页高跳出，优先强化首屏 hook、价值承诺和“立即开始”按钮。'
      : '这是工具页中高跳出，优先优化运行前提示与案例化信任。';
  }
  if (item.page === '/' || item.page === '/history' || item.page === '/profile') {
    return '这是关键导流页高跳出，优先检查首屏个人化承接是否足够直接，避免让用户还要自己找下一步。';
  }
  if (item.views < 20) {
    return '当前样本不大，先继续观察，再决定是否大改页面结构。';
  }
  return '优先检查首屏信息密度、CTA 位置和下一步路径是否过深。';
}

function buildContentPriorityAction(item: {
  baseQuality: number;
  linkageScore: number;
  bounceRate: number;
  views: number;
  contentType: string;
}) {
  if (item.baseQuality < 60) {
    return item.contentType === 'knowledge'
      ? '先重做这篇知识页的产品骨架：首屏 hook、核心判断、关联工具、案例证据、付费升级点一次补齐。'
      : '先把案例页写成可成交资产：补用户背景、动作链、可验证结果、实际收益，再把关联工具和下一步放到首屏。';
  }
  if (item.bounceRate >= 75) {
    return '先降跳出：首屏直接讲用户会失去什么、现在就该测什么，并把主工具入口和快速测算按钮前置。';
  }
  if (item.linkageScore < 12) {
    return '先补联动：增加 2 到 3 个强相关工具入口、结果页去向和案例穿插，不要让内容停在阅读层。';
  }
  if (item.views >= 30) {
    return '这是高曝光内容，优先微调标题、摘要和 CTA，尽快把现有流量转成测算与专项提交。';
  }
  return '先扩分发位：把它挂到首页、专题页和相关文章流里，再观察优化后的真实行为。';
}

function buildContentPriorityReason(item: {
  qualityScore: number;
  baseQuality: number;
  linkageScore: number;
  bounceRate: number;
  views: number;
}) {
  const reasons: string[] = [];
  if (item.qualityScore < 60) {
    reasons.push(`当前综合质量仅 ${item.qualityScore}`);
  }
  if (item.baseQuality < 60) {
    reasons.push(`内容骨架分只有 ${item.baseQuality}`);
  }
  if (item.bounceRate >= 75) {
    reasons.push(`跳出率 ${item.bounceRate}% 偏高`);
  }
  if (item.linkageScore < 12) {
    reasons.push(`联动分只有 ${item.linkageScore}`);
  }
  if (item.views >= 25) {
    reasons.push(`且已有 ${item.views} PV，修完能立刻吃到收益`);
  }
  return reasons.join('，') || '这页已经有一定样本，适合做精细化优化。';
}

function buildToolPriorityAction(item: {
  baseQuality: number;
  ctaStartRate: number;
  ctaToRunRate: number;
  runRate: number;
  runFailureRate: number;
  premiumRate: number;
  bounceRate: number;
  detailViews: number;
}) {
  if (item.baseQuality < 65) {
    return '先重做工具包装：改首屏 hook、免费结果承诺、付费差异、案例证明、FAQ 和异议处理，把精品感补出来。';
  }
  if (item.ctaStartRate < 18) {
    return '先补“详情页到点击开始”承接：把触发场景和免费收益放在首屏，不要让用户先读一大段解释。';
  }
  if (item.ctaToRunRate < 70) {
    return '先补“点击开始到实际开跑”承接：简化输入阻力，明确提交后立刻能拿到什么结果。';
  }
  if (item.runRate < 20) {
    return '先补“详情页到开跑”承接：把立即开始按钮、输入收益、完成后能拿到的结果前置，减少解释区阻力。';
  }
  if (item.runFailureRate >= 15) {
    return '先降运行失败：排查接口失败与登录拦截提示，把失败页改成可恢复动作，不让用户直接流失。';
  }
  if (item.premiumRate < 8) {
    return '先补“结果页到付费”承接：明确免费只能判断方向，付费才给策略、风险窗口和个性化行动清单。';
  }
  if (item.bounceRate >= 70) {
    return '先降跳出：删掉前半段弱解释，把案例、信任感和启动 CTA 放到首屏附近。';
  }
  return '这是有一定流量基础的工具，优先做标题、案例顺序和升级文案的 A/B 式微调。';
}

function buildToolPriorityReason(item: {
  qualityScore: number;
  baseQuality: number;
  ctaStartRate: number;
  ctaToRunRate: number;
  runRate: number;
  runFailureRate: number;
  premiumRate: number;
  bounceRate: number;
  detailViews: number;
}) {
  const reasons: string[] = [];
  if (item.qualityScore < 65) {
    reasons.push(`当前综合质量仅 ${item.qualityScore}`);
  }
  if (item.runRate < 20) {
    reasons.push(`开跑率只有 ${item.runRate}%`);
  }
  if (item.ctaStartRate < 18) {
    reasons.push(`详情到点击开始仅 ${item.ctaStartRate}%`);
  }
  if (item.ctaToRunRate < 70) {
    reasons.push(`点击开始到开跑仅 ${item.ctaToRunRate}%`);
  }
  if (item.runFailureRate >= 15) {
    reasons.push(`运行失败率 ${item.runFailureRate}% 偏高`);
  }
  if (item.premiumRate < 8) {
    reasons.push(`结果到专项仅 ${item.premiumRate}%`);
  }
  if (item.bounceRate >= 70) {
    reasons.push(`跳出率 ${item.bounceRate}% 偏高`);
  }
  if (item.detailViews >= 20) {
    reasons.push(`且已有 ${item.detailViews} PV，修完能直接影响转化`);
  }
  return reasons.join('，') || '这款工具已有样本，适合继续精修成交链路。';
}

function parseMeta(meta: string | null | undefined) {
  if (!meta) {
    return {};
  }

  try {
    return JSON.parse(meta) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function mapEmailChannelLabel(channel: string) {
  if (channel === 'auth_code') return '登录验证码';
  if (channel === 'newsletter_confirmation') return '订阅确认';
  if (channel === 'report_ready') return '报告生成通知';
  if (channel === 'premium_service_request_receipt') return '专项提交回执';
  if (channel === 'premium_service_admin_alert') return '专项后台提醒';
  if (channel === 'premium_service_status_update') return '专项状态更新';
  if (channel === 'report_upgrade_ready') return '报告升级提醒';
  if (channel === 'monthly_digest') return '月度更新';
  return channel;
}

function summarizeDailyOps(rows: Array<{
  productEvents: number;
  analyzeCompleted: number;
  reportViews: number;
  sessions: number;
  newUsers: number;
  verifiedNewUsers: number;
  authCodeRequests: number;
  authCodeUsed: number;
}>) {
  const totals = rows.reduce((accumulator, item) => ({
    totalProductEvents: accumulator.totalProductEvents + (item.productEvents || 0),
    analyzeCompleted: accumulator.analyzeCompleted + (item.analyzeCompleted || 0),
    reportViews: accumulator.reportViews + (item.reportViews || 0),
    sessions: accumulator.sessions + (item.sessions || 0),
    totalNewUsers: accumulator.totalNewUsers + (item.newUsers || 0),
    verifiedNewUsers: accumulator.verifiedNewUsers + (item.verifiedNewUsers || 0),
    authRequested: accumulator.authRequested + (item.authCodeRequests || 0),
    authVerified: accumulator.authVerified + (item.authCodeUsed || 0),
  }), {
    totalProductEvents: 0,
    analyzeCompleted: 0,
    reportViews: 0,
    sessions: 0,
    totalNewUsers: 0,
    verifiedNewUsers: 0,
    authRequested: 0,
    authVerified: 0,
  });

  return {
    ...totals,
    analyzeSuccessRate: totals.reportViews > 0 ? Math.round((totals.analyzeCompleted / totals.reportViews) * 100) : 0,
    authVerifyRate: totals.authRequested > 0 ? Math.round((totals.authVerified / totals.authRequested) * 100) : 0,
    sessionIntensity: totals.sessions > 0 ? Number((totals.totalProductEvents / totals.sessions).toFixed(2)) : 0,
    registrationQualityRate: totals.totalNewUsers > 0 ? Math.round((totals.verifiedNewUsers / totals.totalNewUsers) * 100) : 0,
  };
}
