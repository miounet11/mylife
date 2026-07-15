/**
 * Lightweight admin ops snapshot.
 * Performance: single memoized batch of COUNT/LIMIT queries (60s TTL).
 * Only call behind requireAdminUser / admin API gates.
 */

import { db } from '@/lib/database';

const TTL_MS = 60_000;

type CacheEntry<T> = { value: T; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();

function memoize<T>(key: string, build: () => T): T {
  const now = Date.now();
  const hit = cache.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > now) return hit.value;
  const value = build();
  cache.set(key, { value, expiresAt: now + TTL_MS });
  return value;
}

export function invalidateAdminOpsDashboardCache() {
  cache.clear();
}

function safeGet<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): T {
  try {
    return (db.prepare(sql).get(...params) || {}) as T;
  } catch {
    return {} as T;
  }
}

function safeAll<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): T[] {
  try {
    const rows = db.prepare(sql).all(...params);
    return Array.isArray(rows) ? (rows as T[]) : [];
  } catch {
    return [];
  }
}

function num(row: Record<string, unknown> | undefined, key = 'c') {
  const value = row?.[key];
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export type AdminOpsDashboardSnapshot = {
  generatedAt: string;
  users: {
    total: number;
    guests: number;
    registered: number;
    admins: number;
    withEmail: number;
    new24h: number;
    new7d: number;
    guestNew24h: number;
  };
  email: {
    subscriptions: number;
    subscriptions24h: number;
    verifiedUsers: number;
  };
  fortunes: {
    total: number;
    d24h: number;
    d7d: number;
    guests24h: number;
    byIntent7d: Array<{ intent: string; c: number }>;
  };
  tools: {
    sessionsTotal: number;
    sessions24h: number;
    sessions7d: number;
    topTools7d: Array<{ tool_slug: string; c: number }>;
  };
  analytics: {
    events24h: number;
    events7d: number;
    sessions24h: number;
    topEvents24h: Array<{ event_name: string; c: number }>;
    llmAttempts24h: number;
    llmFail24h: number;
  };
  recent: {
    registeredUsers: Array<{
      id: string;
      email: string | null;
      name: string | null;
      role: string | null;
      created_at: string;
    }>;
    guestUsers: Array<{
      id: string;
      name: string | null;
      created_at: string;
    }>;
    fortunes: Array<{
      id: string;
      user_id: string;
      name: string | null;
      intent: string | null;
      created_at: string;
    }>;
    toolSessions: Array<{
      id: string;
      user_id: string;
      tool_slug: string;
      report_id: string | null;
      status: string | null;
      created_at: string;
    }>;
  };
};

export function getAdminOpsDashboardSnapshot(): AdminOpsDashboardSnapshot {
  return memoize('admin-ops-dashboard-v1', () => {
    const usersTotal = num(safeGet(`SELECT COUNT(*) AS c FROM users`));
    const guests = num(
      safeGet(`SELECT COUNT(*) AS c FROM users WHERE id LIKE 'guest_%' OR email IS NULL OR trim(email) = ''`),
    );
    const withEmail = num(
      safeGet(`SELECT COUNT(*) AS c FROM users WHERE email IS NOT NULL AND trim(email) != ''`),
    );
    const admins = num(
      safeGet(`SELECT COUNT(*) AS c FROM users WHERE role = 'admin'`),
    );
    const new24h = num(
      safeGet(`SELECT COUNT(*) AS c FROM users WHERE datetime(created_at) >= datetime('now', '-1 day')`),
    );
    const new7d = num(
      safeGet(`SELECT COUNT(*) AS c FROM users WHERE datetime(created_at) >= datetime('now', '-7 days')`),
    );
    const guestNew24h = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM users
         WHERE (id LIKE 'guest_%' OR email IS NULL OR trim(email) = '')
           AND datetime(created_at) >= datetime('now', '-1 day')`,
      ),
    );
    const verifiedUsers = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM users
         WHERE email IS NOT NULL AND trim(email) != ''
           AND (email_verified = 1 OR email_verified = '1' OR email_verified = true)`,
      ),
    );

    const subscriptions = num(safeGet(`SELECT COUNT(*) AS c FROM email_subscriptions`));
    const subscriptions24h = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM email_subscriptions
         WHERE datetime(created_at) >= datetime('now', '-1 day')`,
      ),
    );

    const fortunesTotal = num(
      safeGet(`SELECT COUNT(*) AS c FROM fortunes WHERE deleted_at IS NULL OR deleted_at = ''`),
    );
    const fortunes24h = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM fortunes
         WHERE (deleted_at IS NULL OR deleted_at = '')
           AND datetime(created_at) >= datetime('now', '-1 day')`,
      ),
    );
    const fortunes7d = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM fortunes
         WHERE (deleted_at IS NULL OR deleted_at = '')
           AND datetime(created_at) >= datetime('now', '-7 days')`,
      ),
    );
    const fortunesGuests24h = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM fortunes
         WHERE (deleted_at IS NULL OR deleted_at = '')
           AND datetime(created_at) >= datetime('now', '-1 day')
           AND user_id LIKE 'guest_%'`,
      ),
    );
    const byIntent7d = safeAll<{ intent: string; c: number }>(
      `SELECT COALESCE(NULLIF(intent, ''), '(empty)') AS intent, COUNT(*) AS c
       FROM fortunes
       WHERE (deleted_at IS NULL OR deleted_at = '')
         AND datetime(created_at) >= datetime('now', '-7 days')
       GROUP BY 1
       ORDER BY c DESC
       LIMIT 8`,
    );

    const toolTotal = num(safeGet(`SELECT COUNT(*) AS c FROM tool_sessions`));
    const tool24h = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM tool_sessions
         WHERE datetime(replace(substr(created_at,1,19),'T',' ')) >= datetime('now', '-1 day')
            OR datetime(created_at) >= datetime('now', '-1 day')`,
      ),
    );
    // simpler ISO-friendly count for tools
    const tool24hAlt = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM tool_sessions
         WHERE created_at >= datetime('now', '-1 day')
            OR created_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')`,
      ),
    );
    const tool7d = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM tool_sessions
         WHERE created_at >= datetime('now', '-7 days')
            OR created_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days')`,
      ),
    );
    const topTools7d = safeAll<{ tool_slug: string; c: number }>(
      `SELECT tool_slug, COUNT(*) AS c FROM tool_sessions
       WHERE created_at >= datetime('now', '-7 days')
          OR created_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-7 days')
       GROUP BY tool_slug
       ORDER BY c DESC
       LIMIT 8`,
    );

    const events24h = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM analytics_events
         WHERE datetime(created_at) >= datetime('now', '-1 day')`,
      ),
    );
    const events7d = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM analytics_events
         WHERE datetime(created_at) >= datetime('now', '-7 days')`,
      ),
    );
    const sessions24h = num(
      safeGet(
        `SELECT COUNT(DISTINCT session_id) AS c FROM analytics_events
         WHERE datetime(created_at) >= datetime('now', '-1 day')
           AND session_id IS NOT NULL AND session_id != ''`,
      ),
    );
    const topEvents24h = safeAll<{ event_name: string; c: number }>(
      `SELECT event_name, COUNT(*) AS c FROM analytics_events
       WHERE datetime(created_at) >= datetime('now', '-1 day')
       GROUP BY event_name
       ORDER BY c DESC
       LIMIT 12`,
    );

    // LLM: count rows; fail via meta like success false when possible without full scan of all time
    const llmAttempts24h = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM analytics_events
         WHERE event_name = 'llm_model_attempt'
           AND datetime(created_at) >= datetime('now', '-1 day')`,
      ),
    );
    const llmFail24h = num(
      safeGet(
        `SELECT COUNT(*) AS c FROM analytics_events
         WHERE event_name = 'llm_model_attempt'
           AND datetime(created_at) >= datetime('now', '-1 day')
           AND (
             meta LIKE '%"success":false%'
             OR meta LIKE '%"success": false%'
             OR meta LIKE '%"success":0%'
             OR meta LIKE '%"success": 0%'
           )`,
      ),
    );

    const registeredUsers = safeAll(
      `SELECT id, email, name, role, created_at
       FROM users
       WHERE email IS NOT NULL AND trim(email) != ''
       ORDER BY datetime(created_at) DESC
       LIMIT 20`,
    ) as AdminOpsDashboardSnapshot['recent']['registeredUsers'];

    const guestUsers = safeAll(
      `SELECT id, name, created_at
       FROM users
       WHERE id LIKE 'guest_%' OR email IS NULL OR trim(email) = ''
       ORDER BY datetime(created_at) DESC
       LIMIT 20`,
    ) as AdminOpsDashboardSnapshot['recent']['guestUsers'];

    const recentFortunes = safeAll(
      `SELECT id, user_id, name, intent, created_at
       FROM fortunes
       WHERE deleted_at IS NULL OR deleted_at = ''
       ORDER BY datetime(created_at) DESC
       LIMIT 20`,
    ) as AdminOpsDashboardSnapshot['recent']['fortunes'];

    const recentTools = safeAll(
      `SELECT id, user_id, tool_slug, report_id, status, created_at
       FROM tool_sessions
       ORDER BY created_at DESC
       LIMIT 15`,
    ) as AdminOpsDashboardSnapshot['recent']['toolSessions'];

    return {
      generatedAt: new Date().toISOString(),
      users: {
        total: usersTotal,
        guests,
        registered: Math.max(0, usersTotal - guests),
        admins,
        withEmail,
        new24h,
        new7d,
        guestNew24h,
      },
      email: {
        subscriptions,
        subscriptions24h,
        verifiedUsers,
      },
      fortunes: {
        total: fortunesTotal,
        d24h: fortunes24h,
        d7d: fortunes7d,
        guests24h: fortunesGuests24h,
        byIntent7d: byIntent7d.map((r) => ({ intent: String(r.intent || ''), c: num(r, 'c') })),
      },
      tools: {
        sessionsTotal: toolTotal,
        sessions24h: Math.max(tool24h, tool24hAlt),
        sessions7d: tool7d,
        topTools7d: topTools7d.map((r) => ({ tool_slug: String(r.tool_slug || ''), c: num(r, 'c') })),
      },
      analytics: {
        events24h,
        events7d,
        sessions24h,
        topEvents24h: topEvents24h.map((r) => ({
          event_name: String(r.event_name || ''),
          c: num(r, 'c'),
        })),
        llmAttempts24h,
        llmFail24h,
      },
      recent: {
        registeredUsers,
        guestUsers,
        fortunes: recentFortunes,
        toolSessions: recentTools,
      },
    };
  });
}

export type AdminUserListItem = {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  email_verified: unknown;
  created_at: string;
  fortune_count: number;
  tool_count: number;
  kind: 'guest' | 'registered' | 'admin';
};

export function listAdminUsers(params: {
  q?: string;
  kind?: 'all' | 'guest' | 'registered' | 'admin';
  limit?: number;
  offset?: number;
}): { total: number; items: AdminUserListItem[] } {
  const limit = Math.min(100, Math.max(1, params.limit || 30));
  const offset = Math.max(0, params.offset || 0);
  const kind = params.kind || 'all';
  const q = `${params.q || ''}`.trim();

  const where: string[] = [];
  const bind: unknown[] = [];

  if (kind === 'guest') {
    where.push(`(u.id LIKE 'guest_%' OR u.email IS NULL OR trim(COALESCE(u.email,'')) = '')`);
  } else if (kind === 'registered') {
    where.push(`(u.email IS NOT NULL AND trim(u.email) != '' AND COALESCE(u.role,'user') != 'admin')`);
  } else if (kind === 'admin') {
    where.push(`u.role = 'admin'`);
  }

  if (q) {
    where.push(`(u.email LIKE ? OR u.name LIKE ? OR u.id LIKE ?)`);
    const like = `%${q}%`;
    bind.push(like, like, like);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = num(
    safeGet(
      `SELECT COUNT(*) AS c FROM users u ${whereSql}`,
      bind,
    ),
  );

  // Correlated counts limited by page size only (not full join of all fortunes).
  const items = safeAll(
    `SELECT
        u.id,
        u.email,
        u.name,
        u.role,
        u.email_verified,
        u.created_at,
        (
          SELECT COUNT(*) FROM fortunes f
          WHERE f.user_id = u.id AND (f.deleted_at IS NULL OR f.deleted_at = '')
        ) AS fortune_count,
        (
          SELECT COUNT(*) FROM tool_sessions t WHERE t.user_id = u.id
        ) AS tool_count
     FROM users u
     ${whereSql}
     ORDER BY datetime(u.created_at) DESC
     LIMIT ? OFFSET ?`,
    [...bind, limit, offset],
  ).map((row) => {
    const id = String(row.id || '');
    const email = row.email == null ? null : String(row.email);
    const role = row.role == null ? null : String(row.role);
    const isGuest = id.startsWith('guest_') || !email;
    const itemKind: AdminUserListItem['kind'] =
      role === 'admin' ? 'admin' : isGuest ? 'guest' : 'registered';
    return {
      id,
      email,
      name: row.name == null ? null : String(row.name),
      role,
      email_verified: row.email_verified,
      created_at: String(row.created_at || ''),
      fortune_count: num(row, 'fortune_count'),
      tool_count: num(row, 'tool_count'),
      kind: itemKind,
    };
  });

  return { total, items };
}
