/**
 * Resend free tier is ~100 emails/day. Guard the budget so login codes
 * to Gmail keep working; bulk/cron must not burn the quota first.
 *
 * State file: data/runtime/resend-daily-budget.json (UTC day key).
 */

import fs from 'node:fs';
import path from 'node:path';

export type MailPriority = 'auth' | 'transactional' | 'bulk';

type BudgetState = {
  day: string; // YYYY-MM-DD UTC
  used: number;
  authUsed: number;
  bulkUsed: number;
  exhausted: boolean;
  lastError?: string;
  updatedAt: string;
};

function readEnv(name: string, fallback = ''): string {
  const v = process.env[name];
  return typeof v === 'string' ? v.trim() || fallback : fallback;
}

function readInt(name: string, fallback: number, min: number, max: number): number {
  const raw = readEnv(name);
  const n = raw ? Number(raw) : fallback;
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function readBool(name: string, fallback: boolean): boolean {
  const raw = readEnv(name);
  if (!raw) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

/** UTC calendar day — Resend resets on UTC typically */
export function resendBudgetDayKey(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function getResendBudgetConfig() {
  return {
    /** Soft cap before we stop calling Resend (default 95 of 100 free tier) */
    dailyBudget: readInt('MAIL_RESEND_DAILY_BUDGET', 95, 1, 10000),
    /** Keep this many sends for auth (login codes) only */
    authReserve: readInt('MAIL_RESEND_AUTH_RESERVE', 25, 0, 500),
    /** Only route Gmail/Googlemail through Resend by default */
    gmailOnly: readBool('MAIL_RESEND_GMAIL_ONLY', true),
    /** Never spend Resend on bulk/cron digests */
    skipBulk: readBool('MAIL_RESEND_SKIP_BULK', true),
  };
}

export function isGmailAddress(email: string): boolean {
  const domain = `${email || ''}`.split('@')[1]?.toLowerCase().trim() || '';
  return (
    domain === 'gmail.com' ||
    domain === 'googlemail.com' ||
    domain.endsWith('.gmail.com')
  );
}

function budgetFilePath(): string {
  const root =
    readEnv('MAIL_RESEND_BUDGET_DIR') ||
    path.join(process.cwd(), 'data', 'runtime');
  return path.join(root, 'resend-daily-budget.json');
}

function emptyState(day: string): BudgetState {
  return {
    day,
    used: 0,
    authUsed: 0,
    bulkUsed: 0,
    exhausted: false,
    updatedAt: new Date().toISOString(),
  };
}

function loadState(): BudgetState {
  const day = resendBudgetDayKey();
  const file = budgetFilePath();
  try {
    if (!fs.existsSync(file)) return emptyState(day);
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw) as Partial<BudgetState>;
    if (parsed.day !== day) return emptyState(day);
    return {
      day,
      used: Number(parsed.used) || 0,
      authUsed: Number(parsed.authUsed) || 0,
      bulkUsed: Number(parsed.bulkUsed) || 0,
      exhausted: Boolean(parsed.exhausted),
      lastError: parsed.lastError,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return emptyState(day);
  }
}

function saveState(state: BudgetState): void {
  const file = budgetFilePath();
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf8');
    fs.renameSync(tmp, file);
  } catch (error) {
    console.warn(
      '[mail/resend-budget] save failed',
      error instanceof Error ? error.message : String(error),
    );
  }
}

export function getResendBudgetSnapshot() {
  const cfg = getResendBudgetConfig();
  const state = loadState();
  const remaining = Math.max(0, cfg.dailyBudget - state.used);
  return {
    ...cfg,
    ...state,
    remaining,
    nonAuthRemaining: Math.max(0, remaining - cfg.authReserve),
  };
}

/**
 * Decide whether this send may use Resend.
 * Does not increment yet — call recordResendSend after success.
 */
export function canUseResend(input: {
  to: string;
  priority?: MailPriority;
}): { allowed: boolean; reason: string; snapshot: ReturnType<typeof getResendBudgetSnapshot> } {
  const priority = input.priority || 'transactional';
  const snap = getResendBudgetSnapshot();
  const gmail = isGmailAddress(input.to);

  if (snap.gmailOnly && !gmail) {
    return {
      allowed: false,
      reason: 'resend_gmail_only',
      snapshot: snap,
    };
  }

  if (snap.skipBulk && priority === 'bulk') {
    return {
      allowed: false,
      reason: 'resend_skip_bulk',
      snapshot: snap,
    };
  }

  if (snap.exhausted || snap.remaining <= 0) {
    return {
      allowed: false,
      reason: 'resend_budget_exhausted',
      snapshot: snap,
    };
  }

  // Non-auth must leave authReserve for login codes
  if (priority !== 'auth' && snap.nonAuthRemaining <= 0) {
    return {
      allowed: false,
      reason: 'resend_auth_reserve',
      snapshot: snap,
    };
  }

  return { allowed: true, reason: 'ok', snapshot: snap };
}

export function recordResendSend(priority: MailPriority = 'transactional'): BudgetState {
  const cfg = getResendBudgetConfig();
  const state = loadState();
  state.used += 1;
  if (priority === 'auth') state.authUsed += 1;
  if (priority === 'bulk') state.bulkUsed += 1;
  if (state.used >= cfg.dailyBudget) state.exhausted = true;
  state.updatedAt = new Date().toISOString();
  saveState(state);
  return state;
}

/** Call when Resend returns 429 / daily quota message */
export function markResendExhausted(errorMessage?: string): BudgetState {
  const state = loadState();
  state.exhausted = true;
  state.lastError = (errorMessage || 'daily quota').slice(0, 200);
  state.updatedAt = new Date().toISOString();
  saveState(state);
  return state;
}

export function isResendQuotaError(message?: string | null): boolean {
  return /daily email sending quota|rate.?limit|too many requests|429/i.test(
    `${message || ''}`,
  );
}
