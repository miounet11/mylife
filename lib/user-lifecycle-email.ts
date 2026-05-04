import { trackServerEvent } from '@/lib/analytics';
import {
  analyticsOperations,
  eventOperations,
  fortuneOperations,
  questionOperations,
  toolSessionOperations,
  userLifecycleEmailRunOperations,
  userOperations,
} from '@/lib/database';
import { getAppBaseUrl } from '@/lib/env';
import { deliverMailWithRetry, isEmailDeliveryConfigured, sendUserLifecycleEmail } from '@/lib/email';
import { queueEmailDeliveryJob } from '@/lib/email-delivery-jobs';
import { backfillEmailSubscriptionsFromUsers } from '@/lib/subscription-backfill';
import { formatLocalDateKey, generateId } from '@/lib/utils';
import type { FortuneRecord } from '@/lib/user-types';
import { buildChatHref } from '@/lib/chat-entry';
import { buildSourceCtaStrategy } from '@/lib/source-context';
import { getToolDefinition, type ToolDefinition } from '@/lib/tools';

type LifecycleTrigger = 'cron' | 'manual';

type LifecycleStageDefinition = {
  key: string;
  label: string;
  minHoursSinceUserCreated?: number;
  minHoursSinceReportCreated?: number;
  inactiveDays?: number;
};

type LifecycleCandidate = {
  stage: LifecycleStageDefinition;
  userId: string;
  email: string;
  name: string;
  report?: FortuneRecord | null;
  reasons: string[];
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  intro: string;
  detail: string;
  previewText: string;
  subject: string;
  bullets: string[];
  meta?: Record<string, unknown>;
};

type LifecycleBehaviorContext = {
  lastSource?: string | null;
  lastPage?: string | null;
  lastDeviceType?: string | null;
  lastToolSlug?: string | null;
  lastActivityAt?: string | null;
  recentReportToChatRate?: number | null;
  recentToolToRunRate?: number | null;
  recentAuthVerifyRate?: number | null;
};

const STAGES: LifecycleStageDefinition[] = [
  {
    key: 'signup_day1_no_report',
    label: '注册后首次价值提醒',
    minHoursSinceUserCreated: 24,
  },
  {
    key: 'report_day2_no_followup',
    label: '报告后继续行动提醒',
    minHoursSinceReportCreated: 48,
  },
  {
    key: 'tool_interest_day1_no_run',
    label: '工具兴趣回流提醒',
  },
  {
    key: 'inactive_day7_reactivation',
    label: '7 天未活跃召回',
    inactiveDays: 7,
  },
];

function getHoursSince(timestamp?: string | null, now = new Date()) {
  if (!timestamp) return null;
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return null;
  return (now.getTime() - parsed.getTime()) / (1000 * 60 * 60);
}

function getDaysSince(timestamp?: string | null, now = new Date()) {
  const hours = getHoursSince(timestamp, now);
  return hours === null ? null : hours / 24;
}

function getCurrentLifecycleWeekKey(now = new Date()) {
  const day = new Date(now);
  const weekday = day.getDay() || 7;
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - weekday + 1);
  return formatLocalDateKey(day);
}

function getLastUserActivityAt(userId: string) {
  const rows = analyticsOperations.rawQuery(`
    SELECT created_at
    FROM analytics_events
    WHERE user_id = ?
      AND event_name NOT IN ('email_delivery_succeeded', 'email_delivery_failed', 'email_retry_enqueued', 'email_retry_processed')
    ORDER BY datetime(created_at) DESC
    LIMIT 1
  `, [userId]) as Array<{ created_at?: string | null }>;

  return rows[0]?.created_at || null;
}

function parseLifecycleMeta(value?: string | null) {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function mapLifecycleDeviceLabel(deviceType?: string | null) {
  if (deviceType === 'mobile') return '移动端';
  if (deviceType === 'desktop') return '桌面端';
  if (deviceType === 'tablet') return '平板';
  return '当前这端';
}

function getRecentLifecycleBehaviorContext(userId: string): LifecycleBehaviorContext {
  const rows = analyticsOperations.rawQuery(`
    SELECT event_name, page, meta, created_at
    FROM analytics_events
    WHERE user_id = ?
      AND event_name NOT IN ('email_delivery_succeeded', 'email_delivery_failed', 'email_retry_enqueued', 'email_retry_processed')
    ORDER BY datetime(created_at) DESC
    LIMIT 60
  `, [userId]) as Array<{
    event_name: string;
    page?: string | null;
    meta?: string | null;
    created_at?: string | null;
  }>;

  if (!rows.length) {
    return {};
  }

  let lastSource = '';
  let lastPage = '';
  let lastDeviceType = '';
  let lastToolSlug = '';
  let lastActivityAt = rows[0]?.created_at || null;
  let reportViews = 0;
  let chatCompleted = 0;
  let toolDetailViews = 0;
  let toolRuns = 0;
  let authRequested = 0;
  let authVerified = 0;

  for (const row of rows) {
    const meta = parseLifecycleMeta(row.meta);
    const source = typeof meta.source === 'string' ? meta.source.trim() : '';
    const deviceType = typeof meta.deviceType === 'string' ? meta.deviceType.trim() : '';
    const toolSlug = typeof meta.toolSlug === 'string' ? meta.toolSlug.trim() : '';

    if (!lastSource && source) {
      lastSource = source;
    }
    if (!lastPage && row.page) {
      lastPage = row.page;
    }
    if (!lastDeviceType && deviceType) {
      lastDeviceType = deviceType;
    }
    if (!lastToolSlug && toolSlug) {
      lastToolSlug = toolSlug;
    }

    if (row.event_name === 'report_viewed') reportViews += 1;
    if (row.event_name === 'chat_completed') chatCompleted += 1;
    if (row.event_name === 'tool_detail_viewed') toolDetailViews += 1;
    if (row.event_name === 'tool_run_started') toolRuns += 1;
    if (row.event_name === 'auth_code_requested') authRequested += 1;
    if (row.event_name === 'auth_verified') authVerified += 1;
  }

  return {
    lastSource: lastSource || null,
    lastPage: lastPage || null,
    lastDeviceType: lastDeviceType || null,
    lastToolSlug: lastToolSlug || null,
    lastActivityAt,
    recentReportToChatRate: reportViews > 0 ? Math.round((chatCompleted / reportViews) * 100) : null,
    recentToolToRunRate: toolDetailViews > 0 ? Math.round((toolRuns / toolDetailViews) * 100) : null,
    recentAuthVerifyRate: authRequested > 0 ? Math.round((authVerified / authRequested) * 100) : null,
  };
}

function getReportFollowupSummary(userId: string, reportId: string) {
  const chatRows = questionOperations.getByUserId(userId, 200);
  const reportChatCount = chatRows.filter((row) => row.category === 'chat_user' && row.analysis?.reportId === reportId).length;
  const toolRuns = toolSessionOperations.listByUser(userId, 50).filter((item) => item.reportId === reportId);
  const linkedEvents = eventOperations.getByUserId(userId).filter((event) => {
    const linkedReportId = (event.fortuneAnalysis as { reportId?: string } | undefined)?.reportId;
    return linkedReportId === reportId;
  });

  return {
    reportChatCount,
    toolRunCount: toolRuns.length,
    linkedEventCount: linkedEvents.length,
  };
}

function getLatestUnrunToolInterest(userId: string) {
  const toolRows = analyticsOperations.rawQuery(`
    SELECT page, meta, created_at
    FROM analytics_events
    WHERE user_id = ?
      AND event_name = 'tool_detail_viewed'
    ORDER BY datetime(created_at) DESC
    LIMIT 50
  `, [userId]) as Array<{
    page?: string | null;
    meta?: string | null;
    created_at?: string | null;
  }>;
  const runRows = toolSessionOperations.listByUser(userId, 100);
  const runSlugs = new Set(runRows.map((item) => item.toolSlug).filter(Boolean));

  for (const row of toolRows) {
    const meta = parseLifecycleMeta(row.meta);
    const metaSlug = typeof meta.toolSlug === 'string' ? meta.toolSlug : '';
    const pageSlug = typeof row.page === 'string' && row.page.startsWith('/tools/')
      ? row.page.split('/tools/')[1]?.split(/[?#]/)[0] || ''
      : '';
    const toolSlug = `${metaSlug || pageSlug}`.trim();
    if (!toolSlug || runSlugs.has(toolSlug)) {
      continue;
    }

    const tool = getToolDefinition(toolSlug);
    if (!tool) {
      continue;
    }

    return {
      tool,
      viewedAt: row.created_at || null,
    };
  }

  return null;
}

function hasFirstReport(userId: string) {
  return fortuneOperations.getByUserId(userId)[0] || null;
}

function buildSignupNoReportCandidate(params: {
  userId: string;
  email: string;
  name: string;
  createdAt?: string | null;
  now: Date;
}) {
  const hoursSinceUserCreated = getHoursSince(params.createdAt, params.now);
  if (hoursSinceUserCreated === null || hoursSinceUserCreated < 24) {
    return null;
  }

  const report = hasFirstReport(params.userId);
  if (report) {
    return null;
  }

  return {
    stage: STAGES[0],
    userId: params.userId,
    email: params.email,
    name: params.name,
    report: null,
    reasons: ['verified_signup_without_first_report'],
    primaryCtaLabel: '生成第一份报告',
    primaryCtaHref: '/analyze',
    secondaryCtaLabel: '管理提醒',
    secondaryCtaHref: '/updates',
    intro: '你已经完成邮箱登录，但还没有拿到第一份专属报告。',
    detail: '当前最大的流失点不是注册，而是注册后没有走到第一次“看见结果”的时刻。先完成一次分析，后续的聊天、事件验证和月度提醒才有意义。',
    previewText: '你已经登录成功，但还没有生成第一份专属报告。',
    subject: '把第一份专属报告先跑出来',
    bullets: [
      '输入生日后即可得到结果页，不需要先理解全部方法论。',
      '有了结果页之后，才能继续 AI 追问、事件存档和月度更新。',
      '如果你是从文章或案例页进入的，现在最值得做的是把它落到自己身上。',
    ],
    meta: {
      hoursSinceUserCreated: Math.round(hoursSinceUserCreated),
    },
  } satisfies LifecycleCandidate;
}

function buildReportNoFollowupCandidate(params: {
  userId: string;
  email: string;
  name: string;
  now: Date;
  behavior: LifecycleBehaviorContext;
}) {
  const report = hasFirstReport(params.userId);
  if (!report) {
    return null;
  }

  const hoursSinceReportCreated = getHoursSince(report.createdAt, params.now);
  if (hoursSinceReportCreated === null || hoursSinceReportCreated < 48) {
    return null;
  }

  const followup = getReportFollowupSummary(params.userId, report.id);
  if (followup.reportChatCount > 0 || followup.toolRunCount > 0 || followup.linkedEventCount > 0) {
    return null;
  }

  const source = params.behavior.lastSource
    ? `lifecycle_report_followup:${params.behavior.lastSource}`
    : 'lifecycle_report_followup';
  const sourceCtaStrategy = buildSourceCtaStrategy(source);
  const deviceLabel = mapLifecycleDeviceLabel(params.behavior.lastDeviceType);
  const reportToChatRate = params.behavior.recentReportToChatRate;
  return {
    stage: STAGES[1],
    userId: params.userId,
    email: params.email,
    name: report.name || params.name,
    report,
    reasons: ['report_without_followup_action'],
    primaryCtaLabel: '继续围绕这份报告追问',
    primaryCtaHref: buildChatHref({
      reportId: report.id,
      question: '请围绕我这份已经生成的报告，按结构、阶段、环境、动作四层继续拆解：我现在最该先推进什么，为什么，最需要防什么偏差？',
      source,
      ctaStrategyKey: sourceCtaStrategy.strategyKey,
      sourceFamily: sourceCtaStrategy.sourceFamily,
    }),
    secondaryCtaLabel: '回到结果页',
    secondaryCtaHref: `/result/${encodeURIComponent(report.id)}?source=${encodeURIComponent(source)}`,
    intro: `${deviceLabel}上这份报告已经生成，但还没有形成后续动作。`,
    detail: reportToChatRate !== null && reportToChatRate < 35
      ? `最近真实行为里，结果页后的继续追问承接仍然偏弱，尤其在${deviceLabel}更容易停在“看过了”。现在最值得做的是直接围绕这份报告问一个最卡的问题，把结论推进成下一步动作。`
      : '单看结果页很容易停在“看过了”，但真正带来留存的，是继续问、继续验证、继续把结论落成事件和工具动作。',
    previewText: '你的报告已经生成，但还没有形成聊天、工具或事件上的后续动作。',
    subject: reportToChatRate !== null && reportToChatRate < 35
      ? `${deviceLabel}上的这份报告还差一步，别停在只看结果`
      : '这份报告还差一步，别停在只看结果',
    bullets: [
      '从结果页继续问一个最卡你的问题，通常比重新测一次更有价值。',
      '把过去已发生的节点存成事件，后续准确度和方法才会越来越可用。',
      '如果你当时只看了摘要，现在适合重新回到结果页看行动建议和下一个窗口。',
    ],
    meta: {
      reportId: report.id,
      hoursSinceReportCreated: Math.round(hoursSinceReportCreated),
      lastSource: params.behavior.lastSource || null,
      lastDeviceType: params.behavior.lastDeviceType || null,
      recentReportToChatRate: reportToChatRate,
    },
  } satisfies LifecycleCandidate;
}

function buildToolInterestNoRunCandidate(params: {
  userId: string;
  email: string;
  name: string;
  now: Date;
  behavior: LifecycleBehaviorContext;
}) {
  const report = hasFirstReport(params.userId);
  if (!report) {
    return null;
  }

  const interest = getLatestUnrunToolInterest(params.userId);
  if (!interest) {
    return null;
  }

  const hoursSinceViewed = getHoursSince(interest.viewedAt, params.now);
  if (hoursSinceViewed === null || hoursSinceViewed < 24 || hoursSinceViewed > 24 * 21) {
    return null;
  }

  const tool = interest.tool as ToolDefinition;
  const source = `lifecycle_tool_interest:${params.behavior.lastSource || tool.slug}`;
  const sourceCtaStrategy = buildSourceCtaStrategy(source);
  const deviceLabel = mapLifecycleDeviceLabel(params.behavior.lastDeviceType);
  const toolRunRate = params.behavior.recentToolToRunRate;
  const sourceParams = new URLSearchParams({
    source,
  });
  const toolHref = `/tools/${encodeURIComponent(tool.slug)}?${sourceParams.toString()}`;

  return {
    stage: {
      ...STAGES[2],
      key: `${STAGES[2].key}:${tool.slug}`,
    },
    userId: params.userId,
    email: params.email,
    name: report.name || params.name,
    report,
    reasons: ['tool_detail_viewed_without_run'],
    primaryCtaLabel: `继续跑${tool.shortTitle}`,
    primaryCtaHref: toolHref,
    secondaryCtaLabel: '先围绕报告追问',
    secondaryCtaHref: buildChatHref({
      reportId: report.id,
      intent: tool.chatIntent || tool.slug,
      question: `我之前看过“${tool.shortTitle}”，但还没有真正开始。请结合我的报告判断：这个工具现在最适合解决什么问题，开跑前我应该先想清楚什么？`,
      source: `lifecycle_tool_interest_secondary:${params.behavior.lastSource || tool.slug}`,
      ctaStrategyKey: sourceCtaStrategy.strategyKey,
      sourceFamily: sourceCtaStrategy.sourceFamily,
    }),
    intro: `你最近在${deviceLabel}看过“${tool.shortTitle}”，但还没有真正开始。`,
    detail: toolRunRate !== null && toolRunRate < 35
      ? `最近真实行为里，工具详情到开跑在${deviceLabel}仍有明显摩擦。你已经有报告底盘，现在最值得做的是回到上次感兴趣的工具，把它跑完并拿到一个可执行结论。`
      : '最近数据里，工具浏览在上升，但很多用户停在“看过工具介绍”没有进入实际测算。你已经有报告底盘，现在最值得做的是回到上次感兴趣的工具，把它跑完并拿到一个可执行结论。',
    previewText: `你最近看过“${tool.shortTitle}”，但还没有开始运行。`,
    subject: `继续完成上次感兴趣的${tool.shortTitle}`,
    bullets: [
      `这个工具优先解决：${tool.valuePromise}`,
      `适合当下触发点：${tool.triggerMoment}`,
      '跑完后会沉淀到工具历史，后续聊天和报告回看都能继续继承这次上下文。',
    ],
    meta: {
      reportId: report.id,
      toolSlug: tool.slug,
      viewedAt: interest.viewedAt,
      hoursSinceViewed: Math.round(hoursSinceViewed),
      lastSource: params.behavior.lastSource || null,
      lastDeviceType: params.behavior.lastDeviceType || null,
      recentToolToRunRate: toolRunRate,
    },
  } satisfies LifecycleCandidate;
}

function buildInactiveReactivationCandidate(params: {
  userId: string;
  email: string;
  name: string;
  now: Date;
  behavior: LifecycleBehaviorContext;
}) {
  const lastActivityAt = getLastUserActivityAt(params.userId);
  const inactiveDays = getDaysSince(lastActivityAt, params.now);
  if (inactiveDays === null || inactiveDays < 7) {
    return null;
  }

  const report = hasFirstReport(params.userId);
  const weekKey = getCurrentLifecycleWeekKey(params.now);
  const deviceLabel = mapLifecycleDeviceLabel(params.behavior.lastDeviceType);
  const source = `lifecycle_reactivation:${params.behavior.lastSource || 'updates'}`;

  if (report) {
    return {
      stage: {
        ...STAGES[3],
        key: `${STAGES[3].key}:${weekKey}`,
      },
      userId: params.userId,
      email: params.email,
      name: report.name || params.name,
      report,
      reasons: ['inactive_with_report'],
      primaryCtaLabel: '回看我的报告',
      primaryCtaHref: `/result/${encodeURIComponent(report.id)}?source=${encodeURIComponent(source)}`,
      secondaryCtaLabel: '进入更新中心',
      secondaryCtaHref: `/updates?source=${encodeURIComponent(source)}`,
      intro: `这几天你还没有在${deviceLabel}回来继续使用。`,
      detail: '最近真实趋势里，用户不是没进站，而是进来后没有继续走到聊天和回访。你已经有底盘报告，现在最值得做的是回来完成一次有上下文的回看。',
      previewText: '你已经有报告，但最近 7 天没有继续回访。',
      subject: '回来看一眼你的报告，别让判断断在半路',
      bullets: [
        '优先重看结果页里的下一步动作，再决定是否进入 AI 追问。',
        '如果有过去节点已经应验，顺手补成事件，会直接提升后续判断价值。',
        '更新中心里可以看到最近提醒、订阅和后续节律，不必只靠邮箱记忆。',
      ],
      meta: {
        reportId: report.id,
        inactiveDays: Math.floor(inactiveDays),
        lastActivityAt,
        lastSource: params.behavior.lastSource || null,
        lastDeviceType: params.behavior.lastDeviceType || null,
      },
    } satisfies LifecycleCandidate;
  }

  return {
    stage: {
      ...STAGES[3],
      key: `${STAGES[3].key}:${weekKey}`,
    },
    userId: params.userId,
    email: params.email,
    name: params.name,
    report: null,
    reasons: ['inactive_without_report'],
    primaryCtaLabel: '重新开始分析',
    primaryCtaHref: `/analyze?source=${encodeURIComponent(source)}`,
    secondaryCtaLabel: '进入更新中心',
    secondaryCtaHref: `/updates?source=${encodeURIComponent(source)}`,
    intro: `这几天你还没有在${deviceLabel}继续使用。`,
    detail: '如果上次只是浏览了内容但没有完成分析，现在最值得回来的动作仍然是先完成第一份结果。没有个人底盘，后续提醒很难真正帮助你。',
    previewText: '最近 7 天你还没有继续使用，建议回来完成第一次分析。',
    subject: '回来继续一步，把第一次分析真正做完',
    bullets: [
      '第一次报告会把后续聊天、月度更新和事件验证都串起来。',
      '如果你是从 GEO/SEO 内容进入的，现在适合把理解落到自己身上。',
    ],
    meta: {
      inactiveDays: Math.floor(inactiveDays),
      lastActivityAt,
      lastSource: params.behavior.lastSource || null,
      lastDeviceType: params.behavior.lastDeviceType || null,
    },
  } satisfies LifecycleCandidate;
}

function buildLifecycleCandidates(params: {
  userId: string;
  email: string;
  name: string;
  createdAt?: string | null;
  now: Date;
}) {
  const behavior = getRecentLifecycleBehaviorContext(params.userId);
  return [
    buildSignupNoReportCandidate(params),
    buildReportNoFollowupCandidate({ ...params, behavior }),
    buildToolInterestNoRunCandidate({ ...params, behavior }),
    buildInactiveReactivationCandidate({ ...params, behavior }),
  ].filter((item): item is LifecycleCandidate => !!item);
}

async function deliverLifecycleCandidate(candidate: LifecycleCandidate) {
  const page = candidate.report ? `/result/${candidate.report.id}` : '/updates';
  const baseUrl = getAppBaseUrl().replace(/\/$/, '');
  const primaryCtaHref = candidate.primaryCtaHref.startsWith('http')
    ? candidate.primaryCtaHref
    : `${baseUrl}${candidate.primaryCtaHref}`;
  const secondaryCtaHref = candidate.secondaryCtaHref
    ? candidate.secondaryCtaHref.startsWith('http')
      ? candidate.secondaryCtaHref
      : `${baseUrl}${candidate.secondaryCtaHref}`
    : undefined;

  try {
    const deliveryResult = await deliverMailWithRetry(() => sendUserLifecycleEmail({
      email: candidate.email,
      name: candidate.name,
      stageKey: candidate.stage.key,
      stageLabel: candidate.stage.label,
      subject: candidate.subject,
      previewText: candidate.previewText,
      intro: candidate.intro,
      detail: candidate.detail,
      primaryCtaLabel: candidate.primaryCtaLabel,
      primaryCtaHref,
      secondaryCtaLabel: candidate.secondaryCtaLabel,
      secondaryCtaHref,
      bullets: candidate.bullets,
      reportId: candidate.report?.id,
    }));

    if (deliveryResult?.success) {
      userLifecycleEmailRunOperations.create({
        id: `lifecycle_${generateId()}`,
        stageKey: candidate.stage.key,
        email: candidate.email,
        userId: candidate.userId,
        reportId: candidate.report?.id,
        status: 'sent',
        reason: 'sent',
        meta: candidate.meta || {},
      });
      trackServerEvent({
        userId: candidate.userId,
        sessionId: candidate.userId,
        eventName: 'email_delivery_succeeded',
        page,
        meta: {
          channel: 'user_lifecycle',
          stageKey: candidate.stage.key,
          reportId: candidate.report?.id || null,
          emailDomain: candidate.email.split('@')[1] || '',
        },
      });
      return { status: 'sent' as const };
    }

    queueEmailDeliveryJob({
      kind: 'user_lifecycle',
      to: [candidate.email],
      payload: {
        email: candidate.email,
        name: candidate.name,
        stageKey: candidate.stage.key,
        stageLabel: candidate.stage.label,
        subject: candidate.subject,
        previewText: candidate.previewText,
        intro: candidate.intro,
        detail: candidate.detail,
        primaryCtaLabel: candidate.primaryCtaLabel,
        primaryCtaHref,
        secondaryCtaLabel: candidate.secondaryCtaLabel,
        secondaryCtaHref,
        bullets: candidate.bullets,
        reportId: candidate.report?.id || null,
      },
      meta: {
        userId: candidate.userId,
        reportId: candidate.report?.id || null,
        stageKey: candidate.stage.key,
      },
    });

    userLifecycleEmailRunOperations.create({
      id: `lifecycle_${generateId()}`,
      stageKey: candidate.stage.key,
      email: candidate.email,
      userId: candidate.userId,
      reportId: candidate.report?.id,
      status: 'error',
      reason: deliveryResult?.message || 'queued_for_retry',
      meta: candidate.meta || {},
    });
    trackServerEvent({
      userId: candidate.userId,
      sessionId: candidate.userId,
      eventName: 'email_delivery_failed',
      page,
      meta: {
        channel: 'user_lifecycle',
        stageKey: candidate.stage.key,
        reportId: candidate.report?.id || null,
        emailDomain: candidate.email.split('@')[1] || '',
        reason: deliveryResult?.message || 'queued_for_retry',
      },
    });
    return { status: 'error' as const };
  } catch (error) {
    queueEmailDeliveryJob({
      kind: 'user_lifecycle',
      to: [candidate.email],
      payload: {
        email: candidate.email,
        name: candidate.name,
        stageKey: candidate.stage.key,
        stageLabel: candidate.stage.label,
        subject: candidate.subject,
        previewText: candidate.previewText,
        intro: candidate.intro,
        detail: candidate.detail,
        primaryCtaLabel: candidate.primaryCtaLabel,
        primaryCtaHref,
        secondaryCtaLabel: candidate.secondaryCtaLabel,
        secondaryCtaHref,
        bullets: candidate.bullets,
        reportId: candidate.report?.id || null,
      },
      meta: {
        userId: candidate.userId,
        reportId: candidate.report?.id || null,
        stageKey: candidate.stage.key,
      },
    });
    userLifecycleEmailRunOperations.create({
      id: `lifecycle_${generateId()}`,
      stageKey: candidate.stage.key,
      email: candidate.email,
      userId: candidate.userId,
      reportId: candidate.report?.id,
      status: 'error',
      reason: error instanceof Error ? error.message : 'queued_for_retry',
      meta: candidate.meta || {},
    });
    trackServerEvent({
      userId: candidate.userId,
      sessionId: candidate.userId,
      eventName: 'email_delivery_failed',
      page,
      meta: {
        channel: 'user_lifecycle',
        stageKey: candidate.stage.key,
        reportId: candidate.report?.id || null,
        emailDomain: candidate.email.split('@')[1] || '',
        reason: error instanceof Error ? error.message : 'queued_for_retry',
      },
    });
    return { status: 'error' as const };
  }
}

export async function runUserLifecycleEmailCycle(params?: {
  trigger?: LifecycleTrigger;
  batchSize?: number;
  now?: Date;
}) {
  const trigger = params?.trigger || 'cron';
  const now = params?.now || new Date();
  const batchSize = Math.max(1, params?.batchSize || 25);

  if (!isEmailDeliveryConfigured()) {
    return {
      success: false,
      trigger,
      sentCount: 0,
      skippedCount: 0,
      errorCount: 0,
      reason: 'email_not_configured',
      details: [],
    };
  }

  const backfill = backfillEmailSubscriptionsFromUsers();
  const users = userOperations.listWithEmail(Math.max(batchSize * 6, 150)) as Array<{
    id: string;
    email?: string | null;
    name?: string | null;
    createdAt?: string | null;
    created_at?: string | null;
    emailVerified?: boolean | number | null;
    email_verified?: number | null;
  }>;

  let sentCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const details: Array<{ email: string; stageKey?: string; status: 'sent' | 'skipped' | 'error'; reason: string }> = [];

  for (const user of users) {
    if (sentCount >= batchSize) {
      break;
    }

    const email = `${user.email || ''}`.trim().toLowerCase();
    const emailVerified = user.emailVerified === true || user.emailVerified === 1 || user.email_verified === 1;
    if (!email || !emailVerified) {
      skippedCount += 1;
      details.push({ email: email || '(empty)', status: 'skipped', reason: 'unverified_or_missing_email' });
      continue;
    }

    const candidates = buildLifecycleCandidates({
      userId: user.id,
      email,
      name: user.name || '用户',
      createdAt: user.createdAt || user.created_at || null,
      now,
    });

    if (candidates.length === 0) {
      skippedCount += 1;
      details.push({ email, status: 'skipped', reason: 'no_matching_stage' });
      continue;
    }

    const candidate = candidates.find((item) => {
      const existing = userLifecycleEmailRunOperations.getByStageAndEmail(item.stage.key, email);
      return existing?.status !== 'sent' && existing?.status !== 'error';
    });

    if (!candidate) {
      skippedCount += 1;
      details.push({ email, stageKey: candidates[0]?.stage.key, status: 'skipped', reason: 'already_processed' });
      continue;
    }

    const result = await deliverLifecycleCandidate(candidate);
    if (result.status === 'sent') {
      sentCount += 1;
      details.push({ email, stageKey: candidate.stage.key, status: 'sent', reason: 'sent' });
    } else {
      errorCount += 1;
      details.push({ email, stageKey: candidate.stage.key, status: 'error', reason: 'queued_for_retry' });
    }
  }

  return {
    success: true,
    trigger,
    backfill,
    sentCount,
    skippedCount,
    errorCount,
    reason: sentCount > 0 ? 'sent' : 'no_deliveries',
    details,
  };
}
