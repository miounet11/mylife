/**
 * Username/email + password auth (NewAPI-style).
 * Email is optional at register; recommend binding later for subscriptions.
 */

import crypto from 'node:crypto';
import { db, userOperations } from '@/lib/database';
import {
  claimReportForUser,
  createSessionForVerifiedEmail,
  ensureAuthPasswordSchema,
  mergeGuestIntoUserId,
  setSessionUserId,
} from '@/lib/auth';
import { getAdminEmails as getConfiguredAdminEmails } from '@/lib/env';
import { generateId } from '@/lib/utils';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEYLEN = 32;

export type PasswordAuthUser = {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  role: string;
  emailVerified: boolean;
  hasPassword: boolean;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  // 3–32 chars: letters, numbers, underscore, hyphen (NewAPI-friendly)
  return /^[a-zA-Z0-9_-]{3,32}$/.test(username.trim());
}

export function isValidPassword(password: string): boolean {
  // 6–72 — keep low friction, scrypt handles strength
  const p = password || '';
  return p.length >= 6 && p.length <= 72;
}

/** scrypt hash → `scrypt$n$r$p$saltB64$hashB64` */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return [
    'scrypt',
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString('base64url'),
    hash.toString('base64url'),
  ].join('$');
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored || !password) return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
  try {
    const salt = Buffer.from(parts[4]!, 'base64url');
    const expected = Buffer.from(parts[5]!, 'base64url');
    const actual = crypto.scryptSync(password, salt, expected.length, { N: n, r, p });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  return getConfiguredAdminEmails().includes(normalizeEmail(email));
}

function rowToUser(row: any): PasswordAuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email || null,
    username: row.username || null,
    role: row.role || 'user',
    emailVerified: row.email_verified === 1 || row.email_verified === true,
    hasPassword: Boolean(row.password_hash),
  };
}

export function findUserByAccount(account: string): any | null {
  ensureAuthPasswordSchema();
  const raw = `${account || ''}`.trim();
  if (!raw) return null;
  if (raw.includes('@')) {
    const email = normalizeEmail(raw);
    const byEmail = db
      .prepare(`SELECT * FROM users WHERE lower(email) = lower(?) LIMIT 1`)
      .get(email) as any;
    if (byEmail) return byEmail;
  }
  const username = normalizeUsername(raw);
  return (
    (db
      .prepare(`SELECT * FROM users WHERE lower(username) = lower(?) LIMIT 1`)
      .get(username) as any) || null
  );
}

export async function registerWithPassword(params: {
  username: string;
  password: string;
  email?: string | null;
  currentUserId?: string | null;
  reportId?: string | null;
  rememberMe?: boolean;
}): Promise<
  | { success: true; isNewUser: true; user: PasswordAuthUser; reportClaimed?: boolean }
  | { success: false; error: string }
> {
  ensureAuthPasswordSchema();
  const username = normalizeUsername(params.username);
  if (!isValidUsername(params.username)) {
    return { success: false, error: '用户名需 3–32 位字母/数字/下划线/横线' };
  }
  if (!isValidPassword(params.password)) {
    return { success: false, error: '密码至少 6 位' };
  }

  const emailRaw = params.email?.trim() || '';
  const email = emailRaw ? normalizeEmail(emailRaw) : null;
  if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    return { success: false, error: '邮箱格式不正确' };
  }

  const existingUser = db
    .prepare(`SELECT id FROM users WHERE lower(username) = lower(?) LIMIT 1`)
    .get(username) as { id: string } | undefined;
  if (existingUser) {
    return { success: false, error: '用户名已被使用' };
  }
  if (email) {
    const existingEmail = db
      .prepare(`SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1`)
      .get(email) as { id: string } | undefined;
    if (existingEmail) {
      return { success: false, error: '该邮箱已注册，请直接登录或绑定密码' };
    }
  }

  const userId = `user_${generateId()}`;
  const passwordHash = hashPassword(params.password);
  const role = isAdminEmail(email) ? 'admin' : 'user';
  const emailVerified = email ? 0 : 0; // password register: email unbound or unverified until code

  try {
    db.prepare(`
      INSERT INTO users (
        id, name, email, username, password_hash, role, email_verified,
        gender, birth_date, birth_time, birth_place, timezone, last_login_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'male', '1990-01-01', '12:00', '北京', 8, datetime('now'))
    `).run(
      userId,
      params.username.trim().slice(0, 64),
      email,
      username,
      passwordHash,
      role,
      emailVerified,
    );
  } catch (error) {
    console.error('[auth-password] register insert failed', error);
    return { success: false, error: '注册失败，请稍后重试' };
  }

  // Merge guest data if any
  const guestId =
    params.currentUserId && params.currentUserId.startsWith('guest_')
      ? params.currentUserId
      : null;

  // Reuse session create path for claim + cookie (email may be empty)
  const session = await createSessionForPasswordUser({
    userId,
    currentUserId: guestId,
    reportId: params.reportId,
    rememberMe: params.rememberMe !== false,
  });

  return {
    success: true,
    isNewUser: true,
    reportClaimed: session.reportClaimed,
    user: session.user,
  };
}

export async function loginWithPassword(params: {
  account: string;
  password: string;
  currentUserId?: string | null;
  reportId?: string | null;
  rememberMe?: boolean;
}): Promise<
  | { success: true; isNewUser: false; user: PasswordAuthUser; reportClaimed?: boolean }
  | { success: false; error: string }
> {
  ensureAuthPasswordSchema();
  const account = `${params.account || ''}`.trim();
  if (!account || !params.password) {
    return { success: false, error: '请输入账号和密码' };
  }

  const row = findUserByAccount(account);
  if (!row || !row.password_hash) {
    return { success: false, error: '账号或密码不正确' };
  }
  if (!verifyPassword(params.password, row.password_hash)) {
    return { success: false, error: '账号或密码不正确' };
  }

  try {
    db.prepare(`UPDATE users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).run(
      row.id,
    );
  } catch {
    // optional column
  }

  // Promote role if admin email list matches
  if (row.email && isAdminEmail(row.email) && row.role !== 'admin') {
    try {
      userOperations.update(row.id, { role: 'admin' });
    } catch {
      db.prepare(`UPDATE users SET role = 'admin' WHERE id = ?`).run(row.id);
    }
  }

  const guestId =
    params.currentUserId && params.currentUserId.startsWith('guest_')
      ? params.currentUserId
      : null;

  const session = await createSessionForPasswordUser({
    userId: row.id,
    currentUserId: guestId,
    reportId: params.reportId,
    rememberMe: params.rememberMe !== false,
  });

  return {
    success: true,
    isNewUser: false,
    reportClaimed: session.reportClaimed,
    user: session.user,
  };
}

/** Set / change password for current verified user (email OTP / Google already in). */
export async function setPasswordForUser(params: {
  userId: string;
  password: string;
  currentPassword?: string | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  ensureAuthPasswordSchema();
  if (!isValidPassword(params.password)) {
    return { success: false, error: '密码至少 6 位' };
  }
  const row = db.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).get(params.userId) as any;
  if (!row) return { success: false, error: '用户不存在' };

  if (row.password_hash) {
    if (!params.currentPassword || !verifyPassword(params.currentPassword, row.password_hash)) {
      return { success: false, error: '当前密码不正确' };
    }
  }

  const passwordHash = hashPassword(params.password);
  db.prepare(
    `UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(passwordHash, params.userId);
  return { success: true };
}

async function createSessionForPasswordUser(params: {
  userId: string;
  currentUserId?: string | null;
  reportId?: string | null;
  rememberMe?: boolean;
}) {
  // Prefer shared session helper when email exists; otherwise set cookie directly
  const row = db.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).get(params.userId) as any;
  if (!row) {
    throw new Error('user missing after register');
  }

  if (row.email) {
    const result = await createSessionForVerifiedEmail({
      email: row.email,
      currentUserId: params.currentUserId,
      reportId: params.reportId,
      displayName: row.name,
      rememberMe: params.rememberMe,
      // skip emailVerified upgrade for password users who haven't verified email
      requireEmailVerified: false,
      existingUserId: row.id,
    });
    return {
      reportClaimed: result.reportClaimed,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        username: row.username || null,
        role: result.user.role,
        emailVerified: result.user.emailVerified,
        hasPassword: true,
      } satisfies PasswordAuthUser,
    };
  }

  // username-only: merge guest + claim + cookie without email path
  const guestId =
    params.currentUserId && params.currentUserId.startsWith('guest_')
      ? params.currentUserId
      : null;
  if (guestId && guestId !== row.id) {
    try {
      mergeGuestIntoUserId(guestId, row.id);
    } catch (e) {
      console.error('[auth-password] merge guest failed', e);
    }
  }
  const claim = claimReportForUser(params.reportId, row.id, guestId);
  await setSessionUserId(row.id, { rememberMe: params.rememberMe !== false });
  return {
    reportClaimed: claim.claimed,
    user: rowToUser({ ...row, password_hash: row.password_hash || '1' }),
  };
}
