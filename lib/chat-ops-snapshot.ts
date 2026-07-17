/**
 * Lightweight chat ops snapshot for admin (opening funnel + feedback + efc issues).
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
  };
  chatVolume: {
    messageSent: number;
    completed: number;
    pageViewed: number;
  };
  efcFlags: number;
};

function countEvent(name: string, sinceSql: string): number {
  try {
    const row = db
      .prepare(
        `SELECT COUNT(*) AS c FROM analytics_events
         WHERE event_name = ? AND datetime(created_at) >= datetime(?)`,
      )
      .get(name, sinceSql) as { c?: number } | undefined;
    return Number(row?.c || 0);
  } catch {
    return 0;
  }
}

function feedbackBreakdown(sinceSql: string): Record<string, number> {
  try {
    const rows = db
      .prepare(
        `SELECT COALESCE(json_extract(meta, '$.rating'), 'unknown') AS r, COUNT(*) AS c
         FROM analytics_events
         WHERE event_name = 'chat_feedback'
           AND datetime(created_at) >= datetime(?)
         GROUP BY 1`,
      )
      .all(sinceSql) as Array<{ r: string; c: number }>;
    const out: Record<string, number> = {};
    for (const row of rows) out[`${row.r}`] = Number(row.c || 0);
    return out;
  } catch {
    return {};
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
  ] as const;

  const events: Record<string, number> = {};
  for (const n of names) {
    events[n] = countEvent(n, since);
  }

  const shown = events.chat_opening_shown || 0;
  const starter = events.chat_starter_clicked || 0;

  return {
    windowHours: hours,
    since,
    generatedAt: new Date().toISOString(),
    events,
    feedback: feedbackBreakdown(since),
    openingFunnel: {
      shown,
      starterClicked: starter,
      topicChip: events.chat_topic_chip || 0,
      greetingSwiped: events.chat_greeting_swiped || 0,
      starterRate: shown > 0 ? Math.round((starter / shown) * 1000) / 10 : null,
    },
    chatVolume: {
      messageSent: events.chat_message_sent || 0,
      completed: events.chat_completed || 0,
      pageViewed: events.chat_page_viewed || 0,
    },
    efcFlags: events.chat_efc_flagged || 0,
  };
}
