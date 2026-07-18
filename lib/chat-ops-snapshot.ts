/**
 * Lightweight chat ops snapshot for admin (opening funnel + feedback + efc + structure).
 * Separates raw page_viewed noise from engaged sessions (JS client events).
 */

import { db } from '@/lib/database';

export type ChatOpsSnapshot = {
  windowHours: number;
  since: string;
  generatedAt: string;
  events: Record<string, number>;
  feedback: Record<string, number>;
  openingFunnel: {
    shown: number;
    starterClicked: number;
    topicChip: number;
    greetingSwiped: number;
    starterRate: number | null;
    /** shown → message_sent (same window, not session-joined) */
    messageFromOpeningRate: number | null;
  };
  chatVolume: {
    messageSent: number;
    completed: number;
    /** Raw page views (often SEO/bot inflated) */
    pageViewed: number;
    /**
     * page_viewed whose session_id also fired opening / starter / message
     * in the same window (human-ish engagement proxy).
     */
    pageViewedEngaged: number;
    /** 1 - engaged/raw, null if no raw */
    pageNoiseRate: number | null;
  };
  efcFlags: number;
  structure: {
    scored: number;
    rich: number;
    thin: number;
    repaired: number;
    richRate: number | null;
    thinRate: number | null;
    repairRate: number | null;
    avgFilled: number | null;
  };
  feedbackQuality: {
    helpful: number;
    notHelpful: number;
    empty: number;
    total: number;
    helpfulRate: number | null;
  };
  /** Top sources on chat_opening_shown */
  topOpeningSources: Array<{ source: string; count: number }>;
  /** Top sources on chat_starter_clicked */
  topStarterSources: Array<{ source: string; count: number }>;
};

/**
 * created_at is stored as `YYYY-MM-DD HH:MM:SS` text (SQLite CURRENT_TIMESTAMP style).
 * Prefer lexical compare against the same format for reliability; fall back to datetime().
 * Also accept ISO-8601 and millisecond unix strings if present in older rows.
 */
function sinceClause(): string {
  return `(
    created_at >= ?
    OR datetime(created_at) >= datetime(?)
    OR (
      typeof(created_at) = 'text'
      AND length(created_at) >= 12
      AND created_at GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]*'
      AND CAST(substr(created_at, 1, 13) AS INTEGER) >= CAST(strftime('%s', ?) AS INTEGER) * 1000
    )
  )`;
}

function countEvent(name: string, sinceSql: string): number {
  try {
    const row = db
      .prepare(
        `SELECT COUNT(*) AS c FROM analytics_events
         WHERE event_name = ? AND ${sinceClause()}`,
      )
      .get(name, sinceSql, sinceSql, sinceSql) as { c?: number } | undefined;
    return Number(row?.c || 0);
  } catch {
    return 0;
  }
}

function countEngagedPageViews(sinceSql: string): number {
  try {
    const row = db
      .prepare(
        `SELECT COUNT(*) AS c
         FROM analytics_events e
         WHERE e.event_name = 'chat_page_viewed'
           AND (
             e.created_at >= ?
             OR datetime(e.created_at) >= datetime(?)
           )
           AND e.session_id IS NOT NULL
           AND TRIM(e.session_id) != ''
           AND EXISTS (
             SELECT 1 FROM analytics_events x
             WHERE x.session_id = e.session_id
               AND (
                 x.created_at >= ?
                 OR datetime(x.created_at) >= datetime(?)
               )
               AND x.event_name IN (
                 'chat_opening_shown',
                 'chat_starter_clicked',
                 'chat_message_sent',
                 'chat_topic_chip',
                 'chat_structure_scored'
               )
           )`,
      )
      .get(sinceSql, sinceSql, sinceSql, sinceSql) as { c?: number } | undefined;
    return Number(row?.c || 0);
  } catch {
    return 0;
  }
}

function topMetaSource(eventName: string, sinceSql: string, limit = 8): Array<{ source: string; count: number }> {
  try {
    const rows = db
      .prepare(
        `SELECT
           COALESCE(
             NULLIF(TRIM(json_extract(meta, '$.source')), ''),
             NULLIF(TRIM(json_extract(meta, '$.sourceFamily')), ''),
             'unknown'
           ) AS source,
           COUNT(*) AS c
         FROM analytics_events
         WHERE event_name = ?
           AND (created_at >= ? OR datetime(created_at) >= datetime(?))
         GROUP BY 1
         ORDER BY c DESC
         LIMIT ?`,
      )
      .all(eventName, sinceSql, sinceSql, limit) as Array<{ source: string; c: number }>;
    return rows.map((r) => ({ source: `${r.source || 'unknown'}`.slice(0, 80), count: Number(r.c || 0) }));
  } catch {
    return [];
  }
}

function feedbackBreakdown(sinceSql: string): Record<string, number> {
  try {
    const rows = db
      .prepare(
        `SELECT COALESCE(json_extract(meta, '$.rating'), 'unknown') AS r, COUNT(*) AS c
         FROM analytics_events
         WHERE event_name = 'chat_feedback'
           AND (created_at >= ? OR datetime(created_at) >= datetime(?))
         GROUP BY 1`,
      )
      .all(sinceSql, sinceSql) as Array<{ r: string; c: number }>;
    const out: Record<string, number> = {};
    for (const row of rows) out[`${row.r}`] = Number(row.c || 0);
    return out;
  } catch {
    return {};
  }
}

function structureBreakdown(sinceSql: string): ChatOpsSnapshot['structure'] {
  try {
    const row = db
      .prepare(
        `SELECT
           COUNT(*) AS scored,
           SUM(CASE WHEN json_extract(meta, '$.isRich') IN (1, '1', 'true', true) THEN 1 ELSE 0 END) AS rich,
           SUM(CASE WHEN json_extract(meta, '$.isThin') IN (1, '1', 'true', true) THEN 1 ELSE 0 END) AS thin,
           SUM(CASE WHEN json_extract(meta, '$.repaired') IN (1, '1', 'true', true) THEN 1 ELSE 0 END) AS repaired,
           AVG(CAST(json_extract(meta, '$.filled') AS REAL)) AS avgFilled
         FROM analytics_events
         WHERE event_name = 'chat_structure_scored'
           AND (created_at >= ? OR datetime(created_at) >= datetime(?))`,
      )
      .get(sinceSql, sinceSql) as {
        scored?: number;
        rich?: number;
        thin?: number;
        repaired?: number;
        avgFilled?: number | null;
      };

    const scored = Number(row?.scored || 0);
    const rich = Number(row?.rich || 0);
    const thin = Number(row?.thin || 0);
    const repaired = Number(row?.repaired || 0);
    const avgFilled =
      row?.avgFilled != null && Number.isFinite(Number(row.avgFilled))
        ? Math.round(Number(row.avgFilled) * 10) / 10
        : null;

    return {
      scored,
      rich,
      thin,
      repaired,
      richRate: scored > 0 ? Math.round((rich / scored) * 1000) / 10 : null,
      thinRate: scored > 0 ? Math.round((thin / scored) * 1000) / 10 : null,
      repairRate: scored > 0 ? Math.round((repaired / scored) * 1000) / 10 : null,
      avgFilled,
    };
  } catch {
    return {
      scored: 0,
      rich: 0,
      thin: 0,
      repaired: 0,
      richRate: null,
      thinRate: null,
      repairRate: null,
      avgFilled: null,
    };
  }
}

export function getChatOpsSnapshot(windowHours = 24): ChatOpsSnapshot {
  const hours = Math.max(1, Math.min(168, Math.round(windowHours)));
  const sinceRow = db
    .prepare(`SELECT datetime('now', ?) AS s`)
    .get(`-${hours} hours`) as { s?: string };
  const since = sinceRow?.s || '';

  const names = [
    'chat_opening_shown',
    'chat_starter_clicked',
    'chat_topic_chip',
    'chat_greeting_swiped',
    'chat_message_sent',
    'chat_completed',
    'chat_page_viewed',
    'chat_feedback',
    'chat_efc_flagged',
    'chat_structure_scored',
  ] as const;

  const events: Record<string, number> = {};
  for (const n of names) {
    events[n] = countEvent(n, since);
  }

  const shown = events.chat_opening_shown || 0;
  const starter = events.chat_starter_clicked || 0;
  const messageSent = events.chat_message_sent || 0;
  const pageViewed = events.chat_page_viewed || 0;
  const pageViewedEngaged = countEngagedPageViews(since);
  const feedback = feedbackBreakdown(since);
  const helpful = Number(feedback.helpful || 0);
  const notHelpful = Number(feedback.not_helpful || 0);
  const empty = Number(feedback.empty || 0);
  const feedbackTotal = helpful + notHelpful + empty;

  return {
    windowHours: hours,
    since,
    generatedAt: new Date().toISOString(),
    events,
    feedback,
    openingFunnel: {
      shown,
      starterClicked: starter,
      topicChip: events.chat_topic_chip || 0,
      greetingSwiped: events.chat_greeting_swiped || 0,
      starterRate: shown > 0 ? Math.round((starter / shown) * 1000) / 10 : null,
      messageFromOpeningRate:
        shown > 0 ? Math.round((Math.min(messageSent, shown) / shown) * 1000) / 10 : null,
    },
    chatVolume: {
      messageSent,
      completed: events.chat_completed || 0,
      pageViewed,
      pageViewedEngaged,
      pageNoiseRate:
        pageViewed > 0
          ? Math.round((1 - pageViewedEngaged / pageViewed) * 1000) / 10
          : null,
    },
    efcFlags: events.chat_efc_flagged || 0,
    structure: structureBreakdown(since),
    feedbackQuality: {
      helpful,
      notHelpful,
      empty,
      total: feedbackTotal,
      helpfulRate:
        feedbackTotal > 0 ? Math.round((helpful / feedbackTotal) * 1000) / 10 : null,
    },
    topOpeningSources: topMetaSource('chat_opening_shown', since),
    topStarterSources: topMetaSource('chat_starter_clicked', since),
  };
}
