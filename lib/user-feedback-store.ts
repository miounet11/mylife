/**
 * Anonymous site feedback / bug reports (server-only).
 */

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  getFeedbackCategoryLabel,
  isValidFeedbackCategory,
  type FeedbackCategoryKey,
  type SiteFeedbackRecord,
  type SiteFeedbackStatus,
} from '@/lib/user-feedback-types';

export {
  FEEDBACK_CATEGORIES,
  getFeedbackCategoryLabel,
  isValidFeedbackCategory,
  type FeedbackCategoryKey,
  type SiteFeedbackRecord,
  type SiteFeedbackStatus,
} from '@/lib/user-feedback-types';

type DatabaseHandle = {
  exec: (sql: string) => void;
  prepare: (sql: string) => {
    run: (...args: unknown[]) => { changes: number };
    get: (...args: unknown[]) => Record<string, unknown> | undefined;
    all: (...args: unknown[]) => Record<string, unknown>[];
  };
};

let db: DatabaseHandle | null = null;

function getDatabasePath(): string {
  const configured = process.env.DATABASE_PATH?.trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') {
    return path.join(process.cwd(), 'data', 'lifekline.db');
  }
  return path.join(process.cwd(), 'data', 'lifekline.dev.db');
}

function openDatabase(): DatabaseHandle {
  if (db) return db;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3') as new (filename: string) => DatabaseHandle & {
    pragma: (value: string) => void;
  };
  const dbPath = getDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const handle = new Database(dbPath);
  handle.pragma('journal_mode = WAL');
  handle.exec(`
    CREATE TABLE IF NOT EXISTS site_feedback (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      page_url TEXT,
      user_agent TEXT,
      client_ip TEXT,
      user_id TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_site_feedback_created ON site_feedback(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_site_feedback_status ON site_feedback(status, created_at DESC);
  `);
  db = handle;
  return handle;
}

function nowIso() {
  return new Date().toISOString();
}

function mapRow(row: Record<string, unknown>): SiteFeedbackRecord {
  return {
    id: String(row.id),
    category: row.category as FeedbackCategoryKey,
    message: String(row.message),
    pageUrl: row.page_url ? String(row.page_url) : null,
    userAgent: row.user_agent ? String(row.user_agent) : null,
    clientIp: row.client_ip ? String(row.client_ip) : null,
    userId: row.user_id ? String(row.user_id) : null,
    status: (row.status as SiteFeedbackStatus) || 'new',
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function createSiteFeedback(input: {
  category: FeedbackCategoryKey;
  message: string;
  pageUrl?: string | null;
  userAgent?: string | null;
  clientIp?: string | null;
  userId?: string | null;
}): SiteFeedbackRecord {
  const database = openDatabase();
  const id = `fb_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const timestamp = nowIso();
  const message = input.message.trim().slice(0, 4000);
  const pageUrl = (input.pageUrl || '').trim().slice(0, 1000) || null;

  database
    .prepare(
      `INSERT INTO site_feedback (
        id, category, message, page_url, user_agent, client_ip, user_id, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
    )
    .run(
      id,
      input.category,
      message,
      pageUrl,
      input.userAgent?.slice(0, 500) || null,
      input.clientIp?.slice(0, 80) || null,
      input.userId || null,
      timestamp,
      timestamp,
    );

  return {
    id,
    category: input.category,
    message,
    pageUrl,
    userAgent: input.userAgent || null,
    clientIp: input.clientIp || null,
    userId: input.userId || null,
    status: 'new',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function listSiteFeedback(options?: {
  limit?: number;
  status?: SiteFeedbackStatus | 'all';
}): SiteFeedbackRecord[] {
  const database = openDatabase();
  const limit = Math.min(Math.max(options?.limit || 50, 1), 200);
  const status = options?.status || 'all';

  if (status === 'all') {
    const rows = database
      .prepare(`SELECT * FROM site_feedback ORDER BY created_at DESC LIMIT ?`)
      .all(limit);
    return rows.map(mapRow);
  }

  const rows = database
    .prepare(`SELECT * FROM site_feedback WHERE status = ? ORDER BY created_at DESC LIMIT ?`)
    .all(status, limit);
  return rows.map(mapRow);
}

export function countSiteFeedbackByStatus(): Record<string, number> {
  const database = openDatabase();
  const rows = database
    .prepare(`SELECT status, COUNT(*) AS c FROM site_feedback GROUP BY status`)
    .all();
  const out: Record<string, number> = { new: 0, read: 0, done: 0, ignored: 0, total: 0 };
  for (const row of rows) {
    const status = String(row.status || 'new');
    const count = Number(row.c || 0);
    out[status] = count;
    out.total += count;
  }
  return out;
}

export function updateSiteFeedbackStatus(
  id: string,
  status: SiteFeedbackStatus,
): SiteFeedbackRecord | null {
  const database = openDatabase();
  const timestamp = nowIso();
  database
    .prepare(`UPDATE site_feedback SET status = ?, updated_at = ? WHERE id = ?`)
    .run(status, timestamp, id);
  const row = database.prepare(`SELECT * FROM site_feedback WHERE id = ?`).get(id);
  return row ? mapRow(row) : null;
}

const recentByIp = new Map<string, number[]>();

export function checkFeedbackRateLimit(ip: string, maxPerHour = 8): boolean {
  const key = ip || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const list = (recentByIp.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= maxPerHour) {
    recentByIp.set(key, list);
    return false;
  }
  list.push(now);
  recentByIp.set(key, list);
  return true;
}

// re-export helpers used server-side
void getFeedbackCategoryLabel;
void isValidFeedbackCategory;
