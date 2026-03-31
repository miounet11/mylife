import SiteFooter from '@/components/site-footer';
import SiteHeader from '@/components/site-header';
import { buildAdminActionItems, buildAdminOperatingInsight } from '@/lib/admin-analytics-insights';
import { getAdminQualityWorkboard } from '@/lib/admin-quality-workboard';
import { requireAdminUser } from '@/lib/auth';
import { isPublicKnowledgeEntry, listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import { analyticsOperations } from '@/lib/database';
import { toKnowledgeEditorialCandidate } from '@/lib/knowledge-editorial';
import { listToolDefinitions } from '@/lib/tools';
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
    systemHealth,
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
  const operatingInsight = buildAdminOperatingInsight({
    totals,
    pendingValidationBuckets,
    driftReasonBreakdown,
    reportVersionBreakdown,
    journeyFunnel,
    reasoningModeBreakdown,
    chatActionBreakdown,
  });
  const actionItems = buildAdminActionItems({
    totals,
    pendingValidationBuckets,
    driftReasonBreakdown,
    reportVersionBreakdown,
    journeyFunnel,
    reasoningModeBreakdown,
    chatActionBreakdown,
  });
  const dailyOpsRows = analyticsOperations.rawQuery(`
    WITH RECURSIVE days(day) AS (
      SELECT date('now')
      UNION ALL
      SELECT date(day, '-1 day')
      FROM days
      WHERE day > date('now', '-13 days')
    ),
    event_daily AS (
      SELECT
        date(created_at) AS day,
        COUNT(*) AS total_events,
        SUM(CASE WHEN event_name = 'home_page_viewed' THEN 1 ELSE 0 END) AS home_views,
        SUM(CASE WHEN event_name = 'analyze_submitted' THEN 1 ELSE 0 END) AS analyze_submitted,
        SUM(CASE WHEN event_name = 'analyze_completed' THEN 1 ELSE 0 END) AS analyze_completed,
        SUM(CASE WHEN event_name = 'chat_message_sent' THEN 1 ELSE 0 END) AS chat_messages,
        SUM(CASE WHEN event_name = 'tool_detail_viewed' THEN 1 ELSE 0 END) AS tool_detail_views,
        SUM(CASE WHEN event_name = 'tool_run_started' THEN 1 ELSE 0 END) AS tool_run_started,
        SUM(CASE WHEN event_name = 'premium_service_requested' THEN 1 ELSE 0 END) AS premium_requested,
        SUM(CASE WHEN event_name = 'auth_code_requested' THEN 1 ELSE 0 END) AS auth_code_requested,
        SUM(CASE WHEN event_name = 'auth_verified' THEN 1 ELSE 0 END) AS auth_verified
      FROM analytics_events
      WHERE datetime(created_at) >= datetime('now', '-14 days')
      GROUP BY date(created_at)
    ),
    user_daily AS (
      SELECT
        date(created_at) AS day,
        COUNT(*) AS users_created,
        SUM(CASE WHEN email IS NOT NULL AND trim(email) <> '' THEN 1 ELSE 0 END) AS users_with_email,
        SUM(CASE WHEN email_verified = 1 AND email IS NOT NULL AND trim(email) <> '' THEN 1 ELSE 0 END) AS users_verified
      FROM users
      WHERE datetime(created_at) >= datetime('now', '-14 days')
      GROUP BY date(created_at)
    ),
    report_daily AS (
      SELECT
        date(created_at) AS day,
        COUNT(*) AS reports_created
      FROM fortunes
      WHERE datetime(created_at) >= datetime('now', '-14 days')
      GROUP BY date(created_at)
    )
    SELECT
      days.day AS day,
      COALESCE(event_daily.total_events, 0) AS total_events,
      COALESCE(event_daily.home_views, 0) AS home_views,
      COALESCE(event_daily.analyze_submitted, 0) AS analyze_submitted,
      COALESCE(event_daily.analyze_completed, 0) AS analyze_completed,
      COALESCE(event_daily.chat_messages, 0) AS chat_messages,
      COALESCE(event_daily.tool_detail_views, 0) AS tool_detail_views,
      COALESCE(event_daily.tool_run_started, 0) AS tool_run_started,
      COALESCE(event_daily.premium_requested, 0) AS premium_requested,
      COALESCE(event_daily.auth_code_requested, 0) AS auth_code_requested,
      COALESCE(event_daily.auth_verified, 0) AS auth_verified,
      COALESCE(user_daily.users_created, 0) AS users_created,
      COALESCE(user_daily.users_with_email, 0) AS users_with_email,
      COALESCE(user_daily.users_verified, 0) AS users_verified,
      COALESCE(report_daily.reports_created, 0) AS reports_created
    FROM days
    LEFT JOIN event_daily ON event_daily.day = days.day
    LEFT JOIN user_daily ON user_daily.day = days.day
    LEFT JOIN report_daily ON report_daily.day = days.day
    ORDER BY days.day DESC
  `) as Array<{
    day: string;
    total_events: number;
    home_views: number;
    analyze_submitted: number;
    analyze_completed: number;
    chat_messages: number;
    tool_detail_views: number;
    tool_run_started: number;
    premium_requested: number;
    auth_code_requested: number;
    auth_verified: number;
    users_created: number;
    users_with_email: number;
    users_verified: number;
    reports_created: number;
  }>;
  const last7DailyOps = dailyOpsRows.slice(0, 7);
  const dailyOpsSummary = summarizeDailyOps(last7DailyOps);
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
            <div className="section-label">经营后台</div>
            <h1 className="text-4xl font-black text-[color:var(--ink)] md:text-5xl">
              产品不是上线就结束，
              <span className="font-serif text-[color:var(--accent-strong)]">必须能看到真实漏斗与真实行为。</span>
            </h1>
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              现在它不只看流量，还要看引擎是否被现实验证。分析、聊天、事件、验证偏差，必须出现在同一个后台视图里。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statLabels.map((item) => (
              <div key={item.key} className="soft-card rounded-[1.5rem] p-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">{item.label}</div>
                <div className="mt-2 text-2xl font-black text-[color:var(--ink)]">{totals[item.key]}</div>
                <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.helper}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-[color:var(--muted)]">最近 7 天运营实况</div>
              <div className="mt-1 text-2xl font-black text-[color:var(--ink)]">每日数据库与注册趋势</div>
              <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                覆盖每日事件总量、分析链路、聊天、工具使用和注册验证，不用再手工查库。
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:w-[30rem]">
              <div className="rounded-[1.2rem] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                最近 7 天事件：{dailyOpsSummary.totalEvents}
              </div>
              <div className="rounded-[1.2rem] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                分析完成率：{dailyOpsSummary.analyzeSuccessRate}%
              </div>
              <div className="rounded-[1.2rem] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                注册验证率：{dailyOpsSummary.authVerifyRate}%
              </div>
              <div className="rounded-[1.2rem] bg-white/80 px-4 py-3 text-sm text-[color:var(--ink)]">
                工具开跑率：{dailyOpsSummary.toolRunRate}%
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs font-semibold tracking-[0.16em] text-[color:var(--muted)]">
                  <th className="px-3 py-2">日期</th>
                  <th className="px-3 py-2">事件</th>
                  <th className="px-3 py-2">分析</th>
                  <th className="px-3 py-2">聊天</th>
                  <th className="px-3 py-2">工具详情/开跑</th>
                  <th className="px-3 py-2">注册（请求/验证）</th>
                  <th className="px-3 py-2">用户新增</th>
                </tr>
              </thead>
              <tbody>
                {dailyOpsRows.length > 0 ? dailyOpsRows.map((item) => (
                  <tr key={item.day} className="rounded-[1.1rem] bg-white/82 text-sm text-[color:var(--ink)]">
                    <td className="px-3 py-3 font-semibold">{item.day}</td>
                    <td className="px-3 py-3">{item.total_events}</td>
                    <td className="px-3 py-3">{`${item.analyze_submitted}/${item.analyze_completed}`}</td>
                    <td className="px-3 py-3">{item.chat_messages}</td>
                    <td className="px-3 py-3">{`${item.tool_detail_views}/${item.tool_run_started}`}</td>
                    <td className="px-3 py-3">{`${item.auth_code_requested}/${item.auth_verified}`}</td>
                    <td className="px-3 py-3">{`${item.users_created}（已验证 ${item.users_verified}）`}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-3 py-4 text-sm text-[color:var(--muted)]" colSpan={7}>
                      暂无最近几天的数据。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <div className="glass-panel rounded-[2rem] p-6 xl:col-span-2">
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
                <div className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
                  {systemHealth?.summary || '当埋点、模型请求和反馈数据继续积累后，这里会自动给出更明确的系统判断。'}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:w-[28rem]">
                {(systemHealth?.cards || []).map((item) => (
                  <div key={item.key} className={`rounded-[1.4rem] px-4 py-4 ${mapHealthCardTone(item.tone)}`}>
                    <div className="text-xs tracking-[0.18em]">{item.label}</div>
                    <div className="mt-2 text-3xl font-black">{item.value}</div>
                    <div className="mt-2 text-xs leading-6 opacity-80">{item.helper}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] bg-rose-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">当前主要卡点</div>
                <div className="mt-3 grid gap-3">
                  {systemHealth?.blockers?.length ? systemHealth.blockers.map((item) => (
                    <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 text-xs leading-6 text-rose-700">
                      {item}
                    </div>
                  )) : (
                    <div className="rounded-2xl bg-white/80 px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">
                      当前没有明显硬阻塞。
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-emerald-50/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">健康信号</div>
                <div className="mt-3 grid gap-3">
                  {systemHealth?.healthySignals?.length ? systemHealth.healthySignals.map((item) => (
                    <div key={item} className="rounded-2xl bg-white/80 px-4 py-3 text-xs leading-6 text-emerald-700">
                      {item}
                    </div>
                  )) : (
                    <div className="rounded-2xl bg-white/80 px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">
                      当前还没有足够的正向稳定性样本。
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">当前经营判断</div>
            <div className="mt-4 rounded-[1.5rem] bg-white/80 px-4 py-5">
              <div className="text-2xl font-black text-[color:var(--ink)]">{operatingInsight.headline}</div>
              <div className="mt-3 text-xs leading-6 text-[color:var(--muted)]">{operatingInsight.summary}</div>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">优先事项</div>
                <div className="mt-3 grid gap-3">
                  {operatingInsight.priorities.length > 0 ? operatingInsight.priorities.map((item) => (
                    <div key={item} className="rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                      {item}
                    </div>
                  )) : (
                    <div className="rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">当前没有额外优先事项。</div>
                  )}
                </div>
              </div>
              <div className="rounded-[1.5rem] bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">当前风险</div>
                <div className="mt-3 grid gap-3">
                  {operatingInsight.risks.length > 0 ? operatingInsight.risks.map((item) => (
                    <div key={item} className="rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                      {item}
                    </div>
                  )) : (
                    <div className="rounded-2xl bg-white px-4 py-3 text-xs leading-6 text-[color:var(--muted)]">当前没有明显结构性风险。</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">本周执行动作</div>
            <div className="mt-5 grid gap-3">
              {actionItems.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapActionTone(item.tone)}`}>
                      {mapActionToneLabel(item.tone)}
                    </div>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">验证闭环概览</div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {[
                { label: '准确', value: totals.validation_accurate, tone: 'text-emerald-700 bg-emerald-50' },
                { label: '偏差', value: totals.validation_drift, tone: 'text-rose-700 bg-rose-50' },
                { label: '待验证', value: totals.validation_pending, tone: 'text-slate-700 bg-slate-50' },
              ].map((item) => (
                <div key={item.label} className={`rounded-[1.4rem] px-4 py-5 ${item.tone}`}>
                  <div className="text-xs tracking-[0.18em]">{item.label}</div>
                  <div className="mt-2 text-3xl font-black">{item.value}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.4rem] bg-white/80 px-4 py-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">验证命中率</div>
                <div className="mt-2 text-3xl font-black text-emerald-700">{validationAccuracyRate}%</div>
                <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">只统计已经回收验证结果的事件。</div>
              </div>
              <div className="rounded-[1.4rem] bg-white/80 px-4 py-5">
                <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">偏差率</div>
                <div className="mt-2 text-3xl font-black text-rose-700">{driftRate}%</div>
                <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">偏差并不等于报告失效，更常见是时机和执行跑偏。</div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">核心漏斗</div>
            <div className="mt-5 grid gap-3">
              {journeyFunnel.length > 0 ? journeyFunnel.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有漏斗数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">近 7 日关键行为</div>
            <div className="mt-5 grid gap-3">
              {eventsLast7d.length > 0 ? eventsLast7d.map((item) => (
                <div key={item.eventName} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapAnalyticsEventLabel(item.eventName)}</div>
                    <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有近 7 日埋点数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">页面访问结构</div>
            <div className="mt-5 grid gap-3">
              {pageViewBreakdown.length > 0 ? pageViewBreakdown.map((item) => (
                <div key={item.page} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapPageLabel(item.page)}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有页面访问数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">分析入口偏好</div>
            <div className="mt-5 grid gap-3">
              {analyzeOptionBreakdown.length > 0 ? analyzeOptionBreakdown.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有分析入口偏好数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">事件来源验证拆解</div>
            <div className="mt-5 grid gap-3">
              {sourceBreakdown.length > 0 ? sourceBreakdown.map((item) => (
                <div key={item.source} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有事件来源验证数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">推理层覆盖</div>
            <div className="mt-5 grid gap-3">
              {reasoningModeBreakdown.length > 0 ? reasoningModeBreakdown.map((item) => (
                <div key={item.mode} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapReasoningModeLabel(item.mode)}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有推理层覆盖数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">模型健康与熔断</div>
            <div className="mt-5 grid gap-3">
              {modelHealthBreakdown.length > 0 ? modelHealthBreakdown.map((item) => (
                <div key={item.model} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
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
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有模型健康数据，等模型调用累积后这里会显示成功率、延迟和熔断状态。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">当前故障热点</div>
            <div className="mt-5 grid gap-3">
              {llmFailureHotspots.length > 0 ? llmFailureHotspots.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {item.lastSeenAt ? `最近一次：${item.lastSeenAt}` : '最近一次时间未记录'}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前没有明显的模型失败热点。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">接口健康</div>
            <div className="mt-5 grid gap-3">
              {routeHealthBreakdown.length > 0 ? routeHealthBreakdown.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {item.lastSeenAt ? `最近一次：${item.lastSeenAt}，最高耗时 ${item.maxDurationMs}ms` : `最高耗时 ${item.maxDurationMs}ms`}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有接口健康样本。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">业务失败热点</div>
            <div className="mt-5 grid gap-3">
              {requestFailureHotspots.length > 0 ? requestFailureHotspots.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有接口失败热点记录。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">邮件系统状态</div>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                <div className="mt-3 text-xs leading-6 text-[color:var(--muted)]">
                  {emailHealth.status === 'ok'
                    ? '当前 SMTP 认证和连接均正常，验证码、订阅确认和升级提醒可以继续投递。'
                    : emailHealth.error || '邮件探测失败'}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.4rem] bg-emerald-50 px-4 py-5 text-emerald-700">
                  <div className="text-xs tracking-[0.18em]">近 7 日发送成功</div>
                  <div className="mt-2 text-3xl font-black">{emailDeliverySummary.success}</div>
                </div>
                <div className="rounded-[1.4rem] bg-rose-50 px-4 py-5 text-rose-700">
                  <div className="text-xs tracking-[0.18em]">近 7 日发送失败</div>
                  <div className="mt-2 text-3xl font-black">{emailDeliverySummary.failed}</div>
                </div>
              </div>

              <div className="grid gap-3">
                {emailChannelBreakdown.length > 0 ? emailChannelBreakdown.map((item) => (
                  <div key={item.channel} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{mapEmailChannelLabel(item.channel)}</div>
                      <div className="text-xs text-[color:var(--muted)]">{`成功 ${item.success} / 失败 ${item.failed}`}</div>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                    近 7 日还没有邮件投递记录。
                  </div>
                )}
              </div>

              <div className="grid gap-3">
                {emailDeliveryRows.filter((item) => item.event_name === 'email_delivery_failed').slice(0, 5).map((item, index) => {
                  const meta = parseMeta(item.meta);
                  return (
                    <div key={`${item.created_at || 'unknown'}-${index}`} className="rounded-[1.4rem] bg-rose-50 px-4 py-4">
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
                <QueueMetric label="已取消" value={emailRetryQueue?.cancelled || 0} tone="text-slate-700 bg-slate-50" />
              </div>

              <div className="grid gap-3">
                {recentEmailRetryJobs.length > 0 ? recentEmailRetryJobs.map((item) => (
                  <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                    当前还没有邮件重试队列记录。
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">用户转化卡点</div>
            <div className="mt-5 grid gap-3">
              {funnelDiagnostics.length > 0 ? funnelDiagnostics.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有足够的用户转化数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">归因转化热点</div>
            <div className="mt-5 grid gap-3">
              {attributedConversionBreakdown.length > 0 ? attributedConversionBreakdown.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[color:var(--ink)]">工具运行 {item.toolRuns}</div>
                    <div className="rounded-2xl bg-[color:var(--accent-soft)] px-4 py-3 text-[color:var(--accent-strong)]">专项提交 {item.premiumRequests}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有足够的归因转化数据。等用户从文章、案例、个人升级面板继续进入工具和专项后，这里会开始显示真实热点。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[color:var(--muted)]">今日优先修复内容</div>
                <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                  按质量缺口、真实 PV、跳出率和联动弱点综合排序，不是单看低分。
                </div>
              </div>
              <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                Top 10
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {prioritizedContentFixes.length > 0 ? prioritizedContentFixes.map((item, index) => (
                <div key={`priority-content-${item.contentType}-${item.slug}`} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                      <div className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">PV {item.views}</div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">跳出 {item.bounceRate}%</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
                    {item.action}
                  </div>
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.reason}</div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有足够的内容质量样本。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[color:var(--muted)]">今日优先修复工具</div>
                <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                  优先修高流量但开跑弱、结果后付费弱、详情页高跳出的工具，不把精力浪费在没流量的角落。
                </div>
              </div>
              <div className="rounded-full bg-[color:var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
                Top 10
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {prioritizedToolFixes.length > 0 ? prioritizedToolFixes.map((item, index) => (
                <div key={`priority-tool-${item.slug}`} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                      <div className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">PV {item.detailViews}</div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">首屏点击 {item.ctaStartRate}%</div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">开跑 {item.runRate}%</div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">点击到开跑 {item.ctaToRunRate}%</div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">失败 {item.runFailureRate}%</div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">专项 {item.premiumRate}%</div>
                    </div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
                    {item.action}
                  </div>
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.reason}</div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有足够的工具质量样本。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">内容质量预警</div>
            <div className="mt-5 grid gap-3">
              {contentQualityBreakdown.length > 0 ? contentQualityBreakdown.map((item) => (
                <div key={`${item.contentType}-${item.slug}`} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {diagnoseContentQuality(item)}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有足够的内容质量数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">工具质量预警</div>
            <div className="mt-5 grid gap-3">
              {toolQualityBreakdown.length > 0 ? toolQualityBreakdown.map((item) => (
                <div key={item.slug} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {diagnoseToolQuality(item)}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有足够的工具质量数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">高跳出页面</div>
            <div className="mt-5 grid gap-3">
              {bounceBreakdown.length > 0 ? bounceBreakdown.map((item) => (
                <div key={item.page} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {diagnoseBouncePage(item)}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有足够的页面跳出数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">专项服务与用户跟进</div>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
                <QueueMetric label="新提交" value={premiumServiceStatus?.new || 0} tone="text-amber-700 bg-amber-50" />
                <QueueMetric label="已跟进" value={premiumServiceStatus?.contacted || 0} tone="text-sky-700 bg-sky-50" />
                <QueueMetric label="处理中" value={premiumServiceStatus?.in_progress || 0} tone="text-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]" />
                <QueueMetric label="已交付" value={premiumServiceStatus?.delivered || 0} tone="text-emerald-700 bg-emerald-50" />
                <QueueMetric label="已结束" value={premiumServiceStatus?.closed || 0} tone="text-slate-700 bg-slate-50" />
                <QueueMetric label="已取消" value={premiumServiceStatus?.cancelled || 0} tone="text-rose-700 bg-rose-50" />
              </div>

              <div className="grid gap-3">
                {recentPremiumRequests.length > 0 ? recentPremiumRequests.map((item) => (
                  <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[color:var(--ink)]">{mapPremiumServiceLabel(item.serviceKey)}</div>
                        <div className="mt-1 text-xs text-[color:var(--muted)]">{item.contactValue || '未留联系方式'}</div>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-xs font-semibold ${mapPremiumStatusTone(item.status)}`}>
                        {mapPremiumStatusLabel(item.status)}
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                      {`${item.intake?.question || '未填写问题'}`}
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                    当前还没有专项需求记录。
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">聊天动作结构</div>
            <div className="mt-5 grid gap-3">
              {chatActionBreakdown.length > 0 ? chatActionBreakdown.map((item) => (
                <div key={item.action} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有聊天动作结构数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">结果页 CTA 表现</div>
            <div className="mt-5 grid gap-3">
              {ctaBreakdown.length > 0 ? ctaBreakdown.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有结果页 CTA 数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">工具成交漏斗</div>
            <div className="mt-5 grid gap-3">
              {toolFunnelBreakdown.length > 0 ? toolFunnelBreakdown.map((item) => (
                <div key={item.toolSlug} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[color:var(--ink)]">详情到开跑 {item.viewToRunRate}%</div>
                    <div className="rounded-2xl bg-[color:var(--accent-soft)] px-4 py-3 text-[color:var(--accent-strong)]">结果到专项 {item.resultToPremiumRate}%</div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有足够的工具成交漏斗数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">工具漏斗断点工单</div>
            <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
              直接显示当前工具链路最先该修的断点类型，不再手动猜是首屏问题还是运行问题。
            </div>
            <div className="mt-5 grid gap-3">
              {toolJourneyGapBreakdown.length > 0 ? toolJourneyGapBreakdown.map((item, index) => (
                <div key={`tool-gap-${item.slug}`} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                  <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">{item.action}</div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有足够的工具漏斗断点样本。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6 xl:col-span-2">
            <div className="text-sm font-semibold text-[color:var(--muted)]">统一工具修复队列</div>
            <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
              把“质量缺口”和“漏斗断点”合并排序，优先修高流量高损失工具。
            </div>
            <div className="mt-5 grid gap-3">
              {unifiedToolRepairQueue.length > 0 ? unifiedToolRepairQueue.map((item, index) => (
                <div key={`unified-tool-fix-${item.slug}`} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                      <div className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">质量优先级 {item.priorityScore}</div>
                      <div className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">断点优先级 {item.gapPriorityScore}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-5 text-xs text-[color:var(--muted)]">
                    <div>PV {item.detailViews}</div>
                    <div>首屏点击 {item.ctaStartRate}%</div>
                    <div>点击到开跑 {item.ctaToRunRate}%</div>
                    <div>开跑 {item.runRate}%</div>
                    <div>专项 {item.premiumRate}%</div>
                  </div>
                  <div className="mt-3 rounded-2xl bg-[color:var(--accent-soft)] px-4 py-3 text-xs leading-6 text-[color:var(--accent-strong)]">
                    {item.action}
                  </div>
                  <div className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-6 text-[color:var(--ink)]">
                    {item.gapAction}
                  </div>
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {item.gapType ? `主断点：${mapGapTypeLabel(item.gapType)}` : '当前无明确断点，按质量建议优先修包装与承接。'}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有足够的统一修复样本。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">工具首屏链路健康</div>
            <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
              看“详情曝光 → 点击开始 → 实际开跑 → 运行失败”的真实断点，优先修高流量链路。
            </div>
            <div className="mt-5 grid gap-3">
              {toolJourneyHealthRows.length > 0 ? toolJourneyHealthRows.map((item) => (
                <div key={`tool-journey-${item.slug}`} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[color:var(--ink)]">详情到开始 {item.ctaStartRate}%</div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-[color:var(--ink)]">开始到开跑 {item.ctaToRunRate}%</div>
                    <div className="rounded-2xl bg-[color:var(--accent-soft)] px-4 py-3 text-[color:var(--accent-strong)]">结果到专项 {item.premiumRate}%</div>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {diagnoseToolJourneyHealth(item)}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有足够的工具首屏链路样本。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">偏差原因分布</div>
            <div className="mt-5 grid gap-3">
              {driftReasonBreakdown.length > 0 ? driftReasonBreakdown.map((item) => (
                <div key={item.key} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.label}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-rose-700">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">
                    {item.examples.length > 0 ? `样本事件：${item.examples.join('、')}` : '当前分类下还没有代表性样本。'}
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有已记录的偏差原因，等用户持续回填后这里会显示最常见的偏差模式。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">待验证回收队列</div>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <QueueMetric label="已过期待验证" value={pendingValidationBuckets.overdue} tone="text-rose-700 bg-rose-50" />
                <QueueMetric label="未来待发生" value={pendingValidationBuckets.upcoming} tone="text-slate-700 bg-slate-50" />
                <QueueMetric label="偏差待备注" value={pendingValidationBuckets.driftNeedsNotes} tone="text-amber-700 bg-amber-50" />
                <QueueMetric label="偏差待纠偏" value={pendingValidationBuckets.driftReadyForCorrection} tone="text-[color:var(--accent-strong)] bg-[color:var(--accent-soft)]" />
              </div>

              <div className="grid gap-3">
                {followupQueue.length > 0 ? followupQueue.map((item) => (
                  <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
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
                    <div className="mt-2 text-xs leading-6 text-[color:var(--muted)]">{item.reason}</div>
                  </div>
                )) : (
                  <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                    当前没有需要优先回收或纠偏的事件队列。
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">报告版本结构</div>
            <div className="mt-5 grid gap-3">
              {reportVersionBreakdown.length > 0 ? reportVersionBreakdown.map((item) => (
                <div key={item.version} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{item.version}</div>
                    <div className="text-right">
                      <div className="text-lg font-black text-[color:var(--accent-strong)]">{item.count}</div>
                      <div className="text-xs text-[color:var(--muted)]">{item.share}%</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有报告版本数据。
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-sm font-semibold text-[color:var(--muted)]">最近埋点明细</div>
            <div className="mt-5 grid gap-3">
              {recentEvents.length > 0 ? recentEvents.map((item) => (
                <div key={item.id} className="rounded-[1.4rem] bg-white/80 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-[color:var(--ink)]">{mapAnalyticsEventLabel(item.eventName)}</div>
                    <div className="text-xs text-[color:var(--muted)]">{item.createdAt || '-'}</div>
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--muted)]">{item.page || '未记录页面'}</div>
                </div>
              )) : (
                <div className="rounded-[1.4rem] bg-white/80 px-4 py-4 text-xs leading-6 text-[color:var(--muted)]">
                  当前还没有最近埋点明细。
                </div>
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
  return 'bg-slate-100 text-slate-700';
}

function mapHealthCardTone(severity: string) {
  if (severity === 'critical') return 'bg-rose-50 text-rose-700';
  if (severity === 'warning') return 'bg-amber-50 text-amber-700';
  if (severity === 'healthy') return 'bg-emerald-50 text-emerald-700';
  return 'bg-slate-100 text-slate-700';
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
  if (status === 'cancelled') return 'bg-slate-100 text-slate-700';
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
  if (status === 'closed') return 'bg-slate-100 text-slate-700';
  if (status === 'cancelled') return 'bg-rose-50 text-rose-700';
  return 'bg-amber-50 text-amber-700';
}

function QueueMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-[1.4rem] px-4 py-5 ${tone}`}>
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
      return 'bg-slate-100 text-slate-700';
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
  total_events: number;
  analyze_submitted: number;
  analyze_completed: number;
  tool_detail_views: number;
  tool_run_started: number;
  auth_code_requested: number;
  auth_verified: number;
}>) {
  const totals = rows.reduce((accumulator, item) => ({
    totalEvents: accumulator.totalEvents + (item.total_events || 0),
    analyzeSubmitted: accumulator.analyzeSubmitted + (item.analyze_submitted || 0),
    analyzeCompleted: accumulator.analyzeCompleted + (item.analyze_completed || 0),
    toolDetailViews: accumulator.toolDetailViews + (item.tool_detail_views || 0),
    toolRunStarted: accumulator.toolRunStarted + (item.tool_run_started || 0),
    authRequested: accumulator.authRequested + (item.auth_code_requested || 0),
    authVerified: accumulator.authVerified + (item.auth_verified || 0),
  }), {
    totalEvents: 0,
    analyzeSubmitted: 0,
    analyzeCompleted: 0,
    toolDetailViews: 0,
    toolRunStarted: 0,
    authRequested: 0,
    authVerified: 0,
  });

  return {
    ...totals,
    analyzeSuccessRate: totals.analyzeSubmitted > 0 ? Math.round((totals.analyzeCompleted / totals.analyzeSubmitted) * 100) : 0,
    authVerifyRate: totals.authRequested > 0 ? Math.round((totals.authVerified / totals.authRequested) * 100) : 0,
    toolRunRate: totals.toolDetailViews > 0 ? Math.round((totals.toolRunStarted / totals.toolDetailViews) * 100) : 0,
  };
}
