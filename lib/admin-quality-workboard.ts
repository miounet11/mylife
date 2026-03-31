import { isPublicKnowledgeEntry, listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import { analyticsOperations } from '@/lib/database';
import { toKnowledgeEditorialCandidate } from '@/lib/knowledge-editorial';
import { listToolDefinitions } from '@/lib/tools';

export interface ContentPriorityFixItem {
  slug: string;
  title: string;
  contentType: 'knowledge' | 'case';
  pagePath: string;
  baseQuality: number;
  views: number;
  linkageScore: number;
  bounceRate: number;
  qualityScore: number;
  priorityScore: number;
  action: string;
  reason: string;
}

export interface ToolPriorityFixItem {
  slug: string;
  title: string;
  pagePath: string;
  baseQuality: number;
  detailViews: number;
  startCtaClicks: number;
  runStarts: number;
  runFailures: number;
  ctaStartRate: number;
  ctaToRunRate: number;
  runFailureRate: number;
  runRate: number;
  premiumRate: number;
  bounceRate: number;
  qualityScore: number;
  priorityScore: number;
  action: string;
  reason: string;
}

export interface ToolJourneyGapItem {
  slug: string;
  title: string;
  pagePath: string;
  detailViews: number;
  startCtaRate: number;
  ctaToRunRate: number;
  runFailureRate: number;
  premiumRate: number;
  gapType: 'start_cta' | 'cta_to_run' | 'run_failure' | 'result_to_premium';
  priorityScore: number;
  action: string;
  reason: string;
}

export interface BouncePriorityItem {
  page: string;
  views: number;
  engagedCount: number;
  bouncedCount: number;
  bounceRate: number;
  action: string;
}

export interface AdminQualityWorkboard {
  prioritizedContentFixes: ContentPriorityFixItem[];
  prioritizedToolFixes: ToolPriorityFixItem[];
  prioritizedToolJourneyGaps: ToolJourneyGapItem[];
  prioritizedBouncePages: BouncePriorityItem[];
}

export function getAdminQualityWorkboard(): AdminQualityWorkboard {
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

  const publicKnowledgeEntries = listPublishedManagedContentEntriesByType('knowledge').filter((entry) => isPublicKnowledgeEntry(entry));
  const publicCaseEntries = listPublishedManagedContentEntriesByType('case');

  const prioritizedContentFixes = [
    ...publicKnowledgeEntries.map((entry) => {
      const behavior = contentInteractionBuckets[entry.slug];
      const editorial = toKnowledgeEditorialCandidate(entry);
      const sessionCount = behavior?.sessions.size || 0;
      const bounceRate = sessionCount > 0 ? Math.round(((sessionCount - (behavior?.engagedSessions.size || 0)) / sessionCount) * 100) : 100;
      const linkageScore = (behavior?.quickStarts || 0) * 5 + (behavior?.toolRuns || 0) * 8 + (behavior?.premiumRequests || 0) * 12 + (behavior?.clicks || 0) * 2;
      const qualityScore = Math.round(editorial.editorialScore * 0.7 + Math.min(30, linkageScore) - bounceRate * 0.15);
      const item = {
        slug: entry.slug,
        title: entry.title,
        contentType: 'knowledge' as const,
        pagePath: `/knowledge/${entry.slug}`,
        baseQuality: Math.round(editorial.editorialScore),
        views: behavior?.views || 0,
        linkageScore,
        bounceRate,
        qualityScore,
      };
      const priorityScore = Math.round(
        Math.max(0, 72 - item.qualityScore) * 1.8
        + Math.min(45, item.bounceRate * 0.35)
        + Math.min(32, item.views * 0.7)
        + Math.max(0, 14 - item.linkageScore) * 1.6,
      );
      return {
        ...item,
        priorityScore,
        action: buildContentPriorityAction(item),
        reason: buildContentPriorityReason(item),
      };
    }),
    ...publicCaseEntries.map((entry) => {
      const behavior = contentInteractionBuckets[entry.slug];
      const meta = entry.meta as Record<string, unknown> | undefined;
      const relationScore = (Array.isArray(meta?.relatedToolSlugs) ? meta.relatedToolSlugs.length : 0) * 4
        + (Array.isArray(meta?.relatedKnowledgeSlugs) ? meta.relatedKnowledgeSlugs.length : 0) * 3
        + (Array.isArray(meta?.relatedCaseSlugs) ? meta.relatedCaseSlugs.length : 0) * 3;
      const sessionCount = behavior?.sessions.size || 0;
      const bounceRate = sessionCount > 0 ? Math.round(((sessionCount - (behavior?.engagedSessions.size || 0)) / sessionCount) * 100) : 100;
      const linkageScore = (behavior?.quickStarts || 0) * 5 + (behavior?.toolRuns || 0) * 8 + (behavior?.premiumRequests || 0) * 12 + (behavior?.clicks || 0) * 2;
      const baseQuality = Math.min(100, (entry.sections?.length || 0) * 8 + (entry.tags?.length || 0) * 2 + relationScore + (entry.featured ? 10 : 0));
      const qualityScore = Math.round(baseQuality * 0.7 + Math.min(30, linkageScore) - bounceRate * 0.15);
      const item = {
        slug: entry.slug,
        title: entry.title,
        contentType: 'case' as const,
        pagePath: `/cases/${entry.slug}`,
        baseQuality,
        views: behavior?.views || 0,
        linkageScore,
        bounceRate,
        qualityScore,
      };
      const priorityScore = Math.round(
        Math.max(0, 72 - item.qualityScore) * 1.8
        + Math.min(45, item.bounceRate * 0.35)
        + Math.min(32, item.views * 0.7)
        + Math.max(0, 14 - item.linkageScore) * 1.6,
      );
      return {
        ...item,
        priorityScore,
        action: buildContentPriorityAction(item),
        reason: buildContentPriorityReason(item),
      };
    }),
  ]
    .sort((left, right) => right.priorityScore - left.priorityScore || right.views - left.views)
    .slice(0, 10);

  const prioritizedToolFixes = listToolDefinitions()
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
      const item = {
        slug: tool.slug,
        title: tool.shortTitle,
        pagePath: `/tools/${tool.slug}`,
        baseQuality,
        detailViews: behavior?.detailViews || 0,
        startCtaClicks: behavior?.startCtaClicks || 0,
        runStarts: behavior?.runStarts || 0,
        runFailures: behavior?.runFailures || 0,
        ctaStartRate,
        ctaToRunRate,
        runFailureRate,
        runRate,
        premiumRate,
        bounceRate,
        qualityScore,
      };
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
        priorityScore,
        action: buildToolPriorityAction(item),
        reason: buildToolPriorityReason(item),
      };
    })
    .sort((left, right) => right.priorityScore - left.priorityScore || right.detailViews - left.detailViews)
    .slice(0, 10);

  const prioritizedToolJourneyGaps = listToolDefinitions()
    .map((tool) => {
      const behavior = toolInteractionBuckets[tool.slug];
      const detailViews = behavior?.detailViews || 0;
      const startCtaRate = detailViews > 0 ? Math.round(((behavior?.startCtaClicks || 0) / detailViews) * 100) : 0;
      const ctaToRunRate = (behavior?.startCtaClicks || 0) > 0 ? Math.round(((behavior?.runStarts || 0) / (behavior?.startCtaClicks || 1)) * 100) : 0;
      const runFailureRate = (behavior?.runStarts || 0) > 0 ? Math.round(((behavior?.runFailures || 0) / (behavior?.runStarts || 1)) * 100) : 0;
      const premiumRate = (behavior?.resultViews || 0) > 0 ? Math.round(((behavior?.premiumRequests || 0) / (behavior?.resultViews || 1)) * 100) : 0;
      const gapCandidates: Array<{ gapType: ToolJourneyGapItem['gapType']; score: number }> = [
        { gapType: 'start_cta', score: Math.max(0, 22 - startCtaRate) * 2.2 },
        { gapType: 'cta_to_run', score: Math.max(0, 70 - ctaToRunRate) * 1.6 },
        { gapType: 'run_failure', score: Math.max(0, runFailureRate - 8) * 2.0 },
        { gapType: 'result_to_premium', score: Math.max(0, 10 - premiumRate) * 1.8 },
      ];
      const primaryGap = gapCandidates.sort((left, right) => right.score - left.score)[0];
      const priorityScore = Math.round(
        Math.min(40, detailViews * 0.9)
        + (primaryGap?.score || 0)
      );
      return {
        slug: tool.slug,
        title: tool.shortTitle,
        pagePath: `/tools/${tool.slug}`,
        detailViews,
        startCtaRate,
        ctaToRunRate,
        runFailureRate,
        premiumRate,
        gapType: primaryGap?.gapType || 'start_cta',
        priorityScore,
      };
    })
    .filter((item) => item.detailViews >= 1)
    .sort((left, right) => right.priorityScore - left.priorityScore || right.detailViews - left.detailViews)
    .slice(0, 10)
    .map((item) => ({
      ...item,
      action: buildToolJourneyGapAction(item),
      reason: buildToolJourneyGapReason(item),
    }));

  const prioritizedBouncePages = Object.values(pageEngagementBuckets)
    .map((item) => {
      const sessionCount = item.sessions.size;
      const engagedCount = item.engagedSessions.size;
      const bouncedCount = Math.max(0, sessionCount - engagedCount);
      const bounceRate = sessionCount > 0 ? Math.round((bouncedCount / sessionCount) * 100) : 0;
      return {
        page: item.page,
        views: item.views,
        engagedCount,
        bouncedCount,
        bounceRate,
        action: buildBouncePriorityAction(item.page, bounceRate, item.views),
      };
    })
    .filter((item) => item.views > 0)
    .sort((left, right) => (right.bounceRate * 0.7 + right.views) - (left.bounceRate * 0.7 + left.views))
    .slice(0, 8);

  return {
    prioritizedContentFixes,
    prioritizedToolFixes,
    prioritizedToolJourneyGaps,
    prioritizedBouncePages,
  };
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
  return '这是有一定流量基础的工具，优先做标题、案例顺序和升级文案的精修。';
}

function buildToolPriorityReason(item: {
  qualityScore: number;
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

function buildToolJourneyGapAction(item: {
  gapType: ToolJourneyGapItem['gapType'];
}) {
  if (item.gapType === 'start_cta') {
    return '首屏点击开始偏低：重写触发场景、免费收益和首屏主 CTA，把“马上开始”放在第一屏。';
  }
  if (item.gapType === 'cta_to_run') {
    return '点击后开跑转化偏低：简化输入提示和提交阻力，降低用户从点击到提交的心理成本。';
  }
  if (item.gapType === 'run_failure') {
    return '运行失败偏高：优先排查接口失败、登录拦截与错误提示，把失败改成可恢复路径。';
  }
  return '结果到专项转化偏低：强化免费结论与深测差异，给出更具体的付费后收益。';
}

function buildToolJourneyGapReason(item: {
  detailViews: number;
  startCtaRate: number;
  ctaToRunRate: number;
  runFailureRate: number;
  premiumRate: number;
}) {
  return `详情PV ${item.detailViews}，开始点击 ${item.startCtaRate}% ，点击到开跑 ${item.ctaToRunRate}% ，失败 ${item.runFailureRate}% ，结果到专项 ${item.premiumRate}%`;
}

function buildBouncePriorityAction(page: string, bounceRate: number, views: number) {
  if (page.startsWith('/knowledge/') || page.startsWith('/cases/')) {
    return bounceRate >= 80
      ? '重写首屏摘要并把主工具承接前置。'
      : '补相关推荐密度和快速测算入口。';
  }
  if (page.startsWith('/tools/')) {
    return bounceRate >= 80
      ? '强化首屏 hook、价值承诺和“立即开始”按钮。'
      : '优化运行前提示与案例化信任。';
  }
  if (page === '/' || page === '/history' || page === '/profile') {
    return '检查首屏个人化承接和下一步路径是否太深。';
  }
  if (views < 20) {
    return '样本偏少，先观察再决定是否大改。';
  }
  return '检查首屏信息密度、CTA 位置和下一步路径。';
}

function parseMeta(meta: string | null | undefined) {
  if (!meta) {
    return {};
  }

  try {
    const parsed = JSON.parse(meta);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}
