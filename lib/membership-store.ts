import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { MembershipPlanId } from '@/lib/membership-plans';

export type MemberStatus = 'lead' | 'pending' | 'active' | 'expired' | 'cancelled';

export interface MemberRecord {
  id: string;
  email: string;
  status: MemberStatus;
  plan: MembershipPlanId | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface LeadRecord {
  id: string;
  email: string;
  source: string;
  intent: string | null;
  birthDate: string | null;
  birthTime: string | null;
  birthPlace: string | null;
  birthAccuracy: string | null;
  reportId: string | null;
  createdAt: string;
}

export interface SavedReportRecord {
  id: string;
  email: string;
  birthDate: string;
  birthTime: string | null;
  birthPlace: string | null;
  intent: string | null;
  birthAccuracy: string | null;
  snapshot: string;
  createdAt: string;
}

export interface CheckoutSessionRecord {
  id: string;
  email: string;
  plan: MembershipPlanId;
  source: string;
  status: 'pending' | 'completed' | 'failed';
  checkoutUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  const Database = require('better-sqlite3') as new (filename: string) => DatabaseHandle & { pragma: (value: string) => void };
  const dbPath = getDatabasePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const handle = new Database(dbPath);
  handle.pragma('journal_mode = WAL');
  handle.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      plan TEXT,
      source TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      source TEXT NOT NULL,
      intent TEXT,
      birth_date TEXT,
      birth_time TEXT,
      birth_place TEXT,
      birth_accuracy TEXT,
      report_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_leads_email_created ON leads(email, created_at DESC);

    CREATE TABLE IF NOT EXISTS saved_reports (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      birth_date TEXT NOT NULL,
      birth_time TEXT,
      birth_place TEXT,
      intent TEXT,
      birth_accuracy TEXT,
      snapshot TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_saved_reports_email_created ON saved_reports(email, created_at DESC);

    CREATE TABLE IF NOT EXISTS checkout_sessions (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      plan TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL,
      checkout_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_checkout_sessions_email_created ON checkout_sessions(email, created_at DESC);
  `);

  db = handle;
  return handle;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mapMember(row: Record<string, unknown>): MemberRecord {
  return {
    id: String(row.id),
    email: String(row.email),
    status: row.status as MemberStatus,
    plan: (row.plan as MembershipPlanId | null) || null,
    source: row.source ? String(row.source) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    expiresAt: row.expires_at ? String(row.expires_at) : null,
  };
}

function addMonths(base: Date, months: number): Date {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function upsertLead(input: {
  email: string;
  source: string;
  intent?: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  birthAccuracy?: string;
  reportId?: string;
}): LeadRecord {
  const database = openDatabase();
  const email = normalizeEmail(input.email);
  const timestamp = nowIso();
  const leadId = randomUUID();

  database.prepare(`
    INSERT INTO leads (
      id, email, source, intent, birth_date, birth_time, birth_place, birth_accuracy, report_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    leadId,
    email,
    input.source,
    input.intent || null,
    input.birthDate || null,
    input.birthTime || null,
    input.birthPlace || null,
    input.birthAccuracy || null,
    input.reportId || null,
    timestamp,
  );

  const existing = database.prepare('SELECT * FROM members WHERE email = ?').get(email);
  if (!existing) {
    database.prepare(`
      INSERT INTO members (id, email, status, plan, source, created_at, updated_at, expires_at)
      VALUES (?, ?, 'lead', NULL, ?, ?, ?, NULL)
    `).run(randomUUID(), email, input.source, timestamp, timestamp);
  } else if (existing.status === 'cancelled' || existing.status === 'expired') {
    database.prepare(`
      UPDATE members
      SET status = 'lead', source = ?, updated_at = ?
      WHERE email = ?
    `).run(input.source, timestamp, email);
  } else {
    database.prepare(`
      UPDATE members
      SET source = ?, updated_at = ?
      WHERE email = ?
    `).run(input.source, timestamp, email);
  }

  return {
    id: leadId,
    email,
    source: input.source,
    intent: input.intent || null,
    birthDate: input.birthDate || null,
    birthTime: input.birthTime || null,
    birthPlace: input.birthPlace || null,
    birthAccuracy: input.birthAccuracy || null,
    reportId: input.reportId || null,
    createdAt: timestamp,
  };
}

export function saveReportSnapshot(input: {
  email: string;
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
  intent?: string;
  birthAccuracy?: string;
  snapshot: unknown;
}): SavedReportRecord {
  const database = openDatabase();
  const email = normalizeEmail(input.email);
  const timestamp = nowIso();
  const reportId = randomUUID();

  database.prepare(`
    INSERT INTO saved_reports (
      id, email, birth_date, birth_time, birth_place, intent, birth_accuracy, snapshot, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reportId,
    email,
    input.birthDate,
    input.birthTime || null,
    input.birthPlace || null,
    input.intent || null,
    input.birthAccuracy || null,
    JSON.stringify(input.snapshot),
    timestamp,
  );

  upsertLead({
    email,
    source: 'report_snapshot',
    intent: input.intent,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlace: input.birthPlace,
    birthAccuracy: input.birthAccuracy,
    reportId,
  });

  return {
    id: reportId,
    email,
    birthDate: input.birthDate,
    birthTime: input.birthTime || null,
    birthPlace: input.birthPlace || null,
    intent: input.intent || null,
    birthAccuracy: input.birthAccuracy || null,
    snapshot: JSON.stringify(input.snapshot),
    createdAt: timestamp,
  };
}

export function createCheckoutSession(input: {
  email: string;
  plan: MembershipPlanId;
  source: string;
  checkoutUrl?: string | null;
}): CheckoutSessionRecord {
  const database = openDatabase();
  const email = normalizeEmail(input.email);
  const timestamp = nowIso();
  const sessionId = randomUUID();

  database.prepare(`
    INSERT INTO checkout_sessions (
      id, email, plan, source, status, checkout_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
  `).run(sessionId, email, input.plan, input.source, input.checkoutUrl || null, timestamp, timestamp);

  const existing = database.prepare('SELECT * FROM members WHERE email = ?').get(email);
  if (!existing) {
    database.prepare(`
      INSERT INTO members (id, email, status, plan, source, created_at, updated_at, expires_at)
      VALUES (?, ?, 'pending', ?, ?, ?, ?, NULL)
    `).run(randomUUID(), email, input.plan, input.source, timestamp, timestamp);
  } else {
    database.prepare(`
      UPDATE members
      SET status = 'pending', plan = ?, source = ?, updated_at = ?
      WHERE email = ?
    `).run(input.plan, input.source, timestamp, email);
  }

  return {
    id: sessionId,
    email,
    plan: input.plan,
    source: input.source,
    status: 'pending',
    checkoutUrl: input.checkoutUrl || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function activateMembership(input: {
  email: string;
  plan: MembershipPlanId;
  source?: string;
  /** Optional ISO expiry; default plan duration from now (or extend if upgrading). */
  expiresAt?: string | null;
  /** When upgrading quarterly→annual during promo, prefer the later of remaining and new term. */
  extendIfLater?: boolean;
}): MemberRecord {
  const database = openDatabase();
  const email = normalizeEmail(input.email);
  const timestamp = nowIso();
  const months = input.plan === 'annual' ? 12 : 3;
  let expiresAt = input.expiresAt || addMonths(new Date(), months).toISOString();

  const existing = database.prepare('SELECT * FROM members WHERE email = ?').get(email);
  if (existing && input.extendIfLater && existing.expires_at) {
    const prev = new Date(String(existing.expires_at)).getTime();
    const next = new Date(expiresAt).getTime();
    if (Number.isFinite(prev) && prev > next) {
      expiresAt = String(existing.expires_at);
    }
  }

  if (!existing) {
    const memberId = randomUUID();
    database.prepare(`
      INSERT INTO members (id, email, status, plan, source, created_at, updated_at, expires_at)
      VALUES (?, ?, 'active', ?, ?, ?, ?, ?)
    `).run(memberId, email, input.plan, input.source || 'checkout', timestamp, timestamp, expiresAt);
  } else {
    database.prepare(`
      UPDATE members
      SET status = 'active', plan = ?, source = ?, updated_at = ?, expires_at = ?
      WHERE email = ?
    `).run(input.plan, input.source || 'checkout', timestamp, expiresAt, email);
  }

  // Mark latest pending checkout as completed when free/mock activating
  database.prepare(`
    UPDATE checkout_sessions
    SET status = 'completed', updated_at = ?
    WHERE email = ? AND status = 'pending'
  `).run(timestamp, email);

  const row = database.prepare('SELECT * FROM members WHERE email = ?').get(email);
  return mapMember(row || { id: '', email, status: 'active', plan: input.plan, source: input.source || null, created_at: timestamp, updated_at: timestamp, expires_at: expiresAt });
}

export function getMembershipStatus(email: string): {
  member: MemberRecord | null;
  savedReportsCount: number;
  latestLeadAt: string | null;
} {
  const database = openDatabase();
  const normalized = normalizeEmail(email);
  const memberRow = database.prepare('SELECT * FROM members WHERE email = ?').get(normalized);
  const savedReportsCount = Number(
    database.prepare('SELECT COUNT(*) AS count FROM saved_reports WHERE email = ?').get(normalized)?.count || 0,
  );
  const latestLead = database.prepare(`
    SELECT created_at FROM leads WHERE email = ? ORDER BY created_at DESC LIMIT 1
  `).get(normalized);

  let member = memberRow ? mapMember(memberRow) : null;
  if (member?.expiresAt && member.status === 'active' && new Date(member.expiresAt).getTime() < Date.now()) {
    database.prepare(`
      UPDATE members SET status = 'expired', updated_at = ? WHERE email = ?
    `).run(nowIso(), normalized);
    member = { ...member, status: 'expired' };
  }

  return {
    member,
    savedReportsCount,
    latestLeadAt: latestLead?.created_at ? String(latestLead.created_at) : null,
  };
}

export function getSavedReportById(id: string): SavedReportRecord | null {
  const database = openDatabase();
  const row = database.prepare('SELECT * FROM saved_reports WHERE id = ?').get(id.trim());
  if (!row) return null;

  return {
    id: String(row.id),
    email: String(row.email),
    birthDate: String(row.birth_date),
    birthTime: row.birth_time ? String(row.birth_time) : null,
    birthPlace: row.birth_place ? String(row.birth_place) : null,
    intent: row.intent ? String(row.intent) : null,
    birthAccuracy: row.birth_accuracy ? String(row.birth_accuracy) : null,
    snapshot: String(row.snapshot),
    createdAt: String(row.created_at),
  };
}

export function getSavedReports(email: string, limit = 5): SavedReportRecord[] {
  const database = openDatabase();
  const rows = database.prepare(`
    SELECT * FROM saved_reports
    WHERE email = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(normalizeEmail(email), limit);

  return rows.map((row) => ({
    id: String(row.id),
    email: String(row.email),
    birthDate: String(row.birth_date),
    birthTime: row.birth_time ? String(row.birth_time) : null,
    birthPlace: row.birth_place ? String(row.birth_place) : null,
    intent: row.intent ? String(row.intent) : null,
    birthAccuracy: row.birth_accuracy ? String(row.birth_accuracy) : null,
    snapshot: String(row.snapshot),
    createdAt: String(row.created_at),
  }));
}

export function buildCheckoutUrl(sessionId: string, plan: MembershipPlanId, email: string): string | null {
  const template = process.env.MEMBERSHIP_CHECKOUT_URL?.trim();
  if (!template) return null;

  return template
    .replaceAll('{sessionId}', encodeURIComponent(sessionId))
    .replaceAll('{plan}', encodeURIComponent(plan))
    .replaceAll('{email}', encodeURIComponent(email));
}