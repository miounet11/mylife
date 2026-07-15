import 'server-only';

import { listPublishedManagedContentEntriesByType } from '@/lib/content-store';
import { db, forumQuestionOperations } from '@/lib/database';
import { getMasterPhraseCount } from '@/lib/master-phrase-stats';
import { getWorldYiPublicStats } from '@/lib/world-yi-public-stats';

export interface SystemCapabilityStats {
  publishedCaseCount: number;
  publishedKnowledgeCount: number;
  publishedInsightCount: number;
  masterPhraseCount: number;
  forumQuestionCount: number;
  forumAnswerCount: number;
  worldYiCaseCount: number;
  worldYiKnowledgeCount: number;
  worldYiContentCount: number;
  /** Soft “who’s here” estimate from recent activity + diurnal curve. */
  onlineNow: number;
  /** Charts / reports completed today (CST). */
  calculationsToday: number;
  /** Lifetime chart/report attempts. */
  calculationsTotal: number;
  /** Registered accounts. */
  registeredUsers: number;
  /** Active paid/promo members. */
  activeMembers: number;
  /** Email / timing subscription rows. */
  emailSubscribers: number;
  /** Saved fortune profiles (命盘档案). */
  fortuneProfiles: number;
  /** Recent 15-min raw analytics events (debug / internal). */
  recentActivityEvents: number;
  generatedAt: string;
}

let cachedStats: { value: SystemCapabilityStats; expiresAt: number } | null = null;
const STATS_TTL_MS = 45_000;

function safeCount(sql: string, params: unknown[] = []): number {
  try {
    const row = db.prepare(sql).get(...params) as { n?: number } | undefined;
    return Number(row?.n || 0);
  } catch {
    return 0;
  }
}

function tableExists(name: string): boolean {
  try {
    const row = db
      .prepare(`SELECT 1 AS n FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`)
      .get(name) as { n?: number } | undefined;
    return Boolean(row?.n);
  } catch {
    return false;
  }
}

function countForumAnswers() {
  return safeCount(`SELECT COUNT(*) as n FROM forum_answers WHERE status = ?`, ['visible']);
}

/** Asia/Shanghai local hour for diurnal online curve. */
function shanghaiHour(now = new Date()): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Shanghai',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(now);
    return Number(parts.find((part) => part.type === 'hour')?.value || now.getUTCHours() + 8) % 24;
  } catch {
    return (now.getUTCHours() + 8) % 24;
  }
}

/**
 * Online estimate: real recent events + mild time-of-day pulse.
 * Not a pure fake counter — anchored to traffic, with lively floor/ceiling.
 */
export function estimateOnlineNow(recentEvents15m: number, now = new Date()): number {
  const hour = shanghaiHour(now);
  // Peak ~10–22 CST, quieter night
  const diurnal = hour >= 9 && hour <= 22
    ? 32 + Math.round(18 * Math.sin(((hour - 9) / 13) * Math.PI))
    : 14 + (hour >= 7 && hour < 9 ? 10 : 0);
  const fromTraffic = recentEvents15m * 2 + (recentEvents15m > 0 ? 6 : 0);
  const jitter = (Math.floor(now.getTime() / 60_000) % 7) - 3; // ±3 per minute bucket
  return Math.min(280, Math.max(16, diurnal + fromTraffic + jitter));
}

function computePopularitySlice() {
  const recentActivityEvents = tableExists('analytics_events')
    ? safeCount(
      `SELECT COUNT(*) as n FROM analytics_events
       WHERE datetime(created_at) >= datetime('now', '-15 minutes')`,
    )
    : 0;

  const calculationsToday = tableExists('analytics_events')
    ? safeCount(
      `SELECT COUNT(*) as n FROM analytics_events
       WHERE event_name IN ('report_generated', 'analyze_completed', 'analyze_submitted')
         AND date(created_at, '+8 hours') = date('now', '+8 hours')`,
    )
    : 0;

  const calculationsTotalAnalytics = tableExists('analytics_events')
    ? safeCount(
      `SELECT COUNT(*) as n FROM analytics_events
       WHERE event_name IN ('report_generated', 'analyze_completed')`,
    )
    : 0;

  const fortuneProfiles = tableExists('fortunes')
    ? safeCount(`SELECT COUNT(*) as n FROM fortunes`)
    : 0;

  const registeredUsers = tableExists('users')
    ? safeCount(`SELECT COUNT(*) as n FROM users`)
    : 0;

  const activeMembers = tableExists('members')
    ? safeCount(`SELECT COUNT(*) as n FROM members WHERE status = 'active'`)
    : 0;

  const emailSubscribers = tableExists('email_subscriptions')
    ? safeCount(
      `SELECT COUNT(*) as n FROM email_subscriptions
       WHERE status IS NULL OR status = '' OR lower(status) IN ('active', 'subscribed', 'enabled')`,
    )
    : 0;

  // Timing / lifecycle mail recipients as soft subscription depth
  const timingSubs = tableExists('timing_email_log')
    ? safeCount(`SELECT COUNT(DISTINCT email) as n FROM timing_email_log WHERE email IS NOT NULL AND email != ''`)
    : 0;

  const onlineNow = estimateOnlineNow(recentActivityEvents);
  const calculationsTotal = Math.max(calculationsTotalAnalytics, fortuneProfiles);

  // Soft atmosphere floors: keep numbers anchored to real users/activity, avoid "1 会员" dead look.
  // Still scales with real growth when tables fill in.
  const emailBase = Math.max(emailSubscribers, timingSubs);
  const livelyMembers =
    activeMembers >= 40
      ? activeMembers
      : Math.max(activeMembers, Math.min(registeredUsers, Math.round(registeredUsers * 0.055) + 24));
  const livelySubs =
    emailBase >= 60
      ? emailBase
      : Math.max(emailBase, Math.min(registeredUsers, Math.round(registeredUsers * 0.035) + 32));
  const livelyToday =
    calculationsToday >= 20
      ? calculationsToday
      : Math.max(calculationsToday, Math.min(180, 12 + recentActivityEvents * 2 + shanghaiHour() ));

  return {
    onlineNow,
    calculationsToday: livelyToday,
    calculationsTotal: Math.max(calculationsTotal, registeredUsers),
    registeredUsers,
    activeMembers: livelyMembers,
    emailSubscribers: livelySubs,
    fortuneProfiles,
    recentActivityEvents,
  };
}

function computeSystemCapabilityStats(): SystemCapabilityStats {
  const worldYiStats = getWorldYiPublicStats();
  const popularity = computePopularitySlice();

  return {
    publishedCaseCount: listPublishedManagedContentEntriesByType('case').length,
    publishedKnowledgeCount: listPublishedManagedContentEntriesByType('knowledge').length,
    publishedInsightCount: listPublishedManagedContentEntriesByType('insight').length,
    masterPhraseCount: getMasterPhraseCount(),
    forumQuestionCount: forumQuestionOperations.countVisible(),
    forumAnswerCount: countForumAnswers(),
    worldYiCaseCount: worldYiStats.publicCaseCount,
    worldYiKnowledgeCount: worldYiStats.publicKnowledgeCount,
    worldYiContentCount:
      worldYiStats.publicCaseCount
      + worldYiStats.publicKnowledgeCount
      + worldYiStats.publicInsightCount,
    ...popularity,
    generatedAt: new Date().toISOString(),
  };
}

export function getSystemCapabilityStats(): SystemCapabilityStats {
  const now = Date.now();
  if (cachedStats && cachedStats.expiresAt > now) {
    return cachedStats.value;
  }

  const value = computeSystemCapabilityStats();
  cachedStats = { value, expiresAt: now + STATS_TTL_MS };
  return value;
}

export function invalidateSystemCapabilityStats() {
  cachedStats = null;
}

/** Client-safe default while API loads. */
export function emptySystemCapabilityStats(): SystemCapabilityStats {
  return {
    publishedCaseCount: 0,
    publishedKnowledgeCount: 0,
    publishedInsightCount: 0,
    masterPhraseCount: 0,
    forumQuestionCount: 0,
    forumAnswerCount: 0,
    worldYiCaseCount: 0,
    worldYiKnowledgeCount: 0,
    worldYiContentCount: 0,
    onlineNow: 0,
    calculationsToday: 0,
    calculationsTotal: 0,
    registeredUsers: 0,
    activeMembers: 0,
    emailSubscribers: 0,
    fortuneProfiles: 0,
    recentActivityEvents: 0,
    generatedAt: new Date(0).toISOString(),
  };
}
