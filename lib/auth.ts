// @ts-nocheck
import { cookies } from 'next/headers';
import { db, userOperations } from '@/lib/database';
import { getAdminEmails as getConfiguredAdminEmails, getAdminLoginPassword, isProductionEnvironment } from '@/lib/env';
import { generateId } from '@/lib/utils';

const SESSION_COOKIE_NAME = 'life_kline_session_id';
const LOGIN_PURPOSE = 'login';
const CODE_TTL_MINUTES = 15;
/** Long-lived product session (remember me) — ~2 years */
const SESSION_MAX_AGE_REMEMBER_SEC = 60 * 60 * 24 * 730;
/** Shorter session when user unchecks remember me — 30 days */
const SESSION_MAX_AGE_SHORT_SEC = 60 * 60 * 24 * 30;

let passwordSchemaReady = false;

/** Add password/username columns once (prod SQLite). Safe to call often. */
export function ensureAuthPasswordSchema() {
  if (passwordSchemaReady) return;
  try {
    const cols = (
      db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string }>
    ).map((c) => c.name);
    if (!cols.includes('password_hash')) {
      db.exec(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
    }
    if (!cols.includes('username')) {
      db.exec(`ALTER TABLE users ADD COLUMN username TEXT`);
    }
    if (!cols.includes('last_login_at')) {
      db.exec(`ALTER TABLE users ADD COLUMN last_login_at TEXT`);
    }
    db.exec(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username) WHERE username IS NOT NULL AND username != ''`,
    );
    passwordSchemaReady = true;
  } catch (error) {
    console.warn(
      '[auth] ensureAuthPasswordSchema:',
      error instanceof Error ? error.message : error,
    );
    // still mark ready to avoid hammering bad schema in a tight loop
    passwordSchemaReady = true;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getAdminEmails() {
  return new Set(getConfiguredAdminEmails());
}

function isAdminEmail(email: string) {
  return getAdminEmails().has(normalizeEmail(email));
}

/**
 * v5-D50 暴露给 API：该邮箱是否需要在登录时输入 admin 二次密码。
 * 用于 /api/auth/request-code 响应里告知前端展示密码输入框。
 */
export function adminPasswordRequiredFor(email: string) {
  return isAdminEmail(email) && Boolean(getAdminLoginPassword());
}

export function createLoginCode(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString();

  db.prepare(`DELETE FROM auth_codes WHERE email = ? AND purpose = ?`).run(normalizedEmail, LOGIN_PURPOSE);
  db.prepare(`
    INSERT INTO auth_codes (id, email, code, purpose, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(`auth_${generateId()}`, normalizedEmail, code, LOGIN_PURPOSE, expiresAt);

  return {
    email: normalizedEmail,
    code,
    expiresAt,
  };
}

export function deletePendingLoginCode(email: string, code: string) {
  return db.prepare(`
    DELETE FROM auth_codes
    WHERE email = ? AND code = ? AND purpose = ? AND used_at IS NULL
  `).run(normalizeEmail(email), code.trim(), LOGIN_PURPOSE);
}

function markCodeUsed(id: string) {
  db.prepare(`UPDATE auth_codes SET used_at = datetime('now') WHERE id = ?`).run(id);
}

function createUserForEmail(email: string, displayName?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  const userId = `user_${generateId()}`;
  const localName =
    `${displayName || ''}`.trim().slice(0, 64) ||
    normalizedEmail.split('@')[0] ||
    '用户';
  const role = isAdminEmail(normalizedEmail) ? 'admin' : 'user';

  userOperations.create({
    id: userId,
    name: localName,
    email: normalizedEmail,
    role,
    emailVerified: true,
    gender: 'male',
    birthDate: '1990-01-01',
    birthTime: '12:00',
    birthPlace: '北京',
    timezone: 8,
  });

  return userOperations.getById(userId) as any;
}

function updateUserLoginState(userId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);
  const role = isAdminEmail(normalizedEmail) ? 'admin' : 'user';
  userOperations.update(userId, {
    email: normalizedEmail,
    role,
    emailVerified: true,
  });
}

const USER_ID_MERGE_TABLES = [
  'fortunes',
  'events',
  'questions',
  'enhancements',
  'sessions',
  'analytics_events',
  'report_journey_events',
  'content_generation_jobs',
  'report_upgrade_jobs',
  'report_monthly_digest_runs',
  'user_lifecycle_email_runs',
  'premium_service_requests',
  'tool_sessions',
] as const;

export function mergeGuestIntoUserId(guestUserId: string, targetUserId: string) {
  return mergeGuestDataIntoUser(guestUserId, targetUserId);
}

function mergeGuestDataIntoUser(guestUserId: string, targetUserId: string) {
  if (!guestUserId || !targetUserId || guestUserId === targetUserId) {
    return;
  }

  // Per-table try so a missing table/column never aborts the whole login.
  for (const tableName of USER_ID_MERGE_TABLES) {
    try {
      db.prepare(`UPDATE ${tableName} SET user_id = ? WHERE user_id = ?`).run(targetUserId, guestUserId);
    } catch (error) {
      console.warn(`[auth] merge skip table=${tableName}:`, error instanceof Error ? error.message : error);
    }
  }

  try {
    const targetPreference = db
      .prepare(`SELECT id FROM preferences WHERE user_id = ? LIMIT 1`)
      .get(targetUserId) as { id: string } | undefined;
    if (targetPreference) {
      db.prepare(`DELETE FROM preferences WHERE user_id = ?`).run(guestUserId);
    } else {
      db.prepare(`UPDATE preferences SET user_id = ? WHERE user_id = ?`).run(targetUserId, guestUserId);
    }
  } catch (error) {
    console.warn('[auth] merge preferences skipped:', error instanceof Error ? error.message : error);
  }

  try {
    db.prepare(`DELETE FROM users WHERE id = ? AND id != ?`).run(guestUserId, targetUserId);
  } catch (error) {
    console.warn('[auth] delete guest user skipped:', error instanceof Error ? error.message : error);
  }
}

/**
 * Attach a report to the newly registered user when ownership is guest/self/empty.
 * Safe no-op when the report is already owned by another registered account.
 */
export function claimReportForUser(
  reportId: string | null | undefined,
  userId: string,
  previousGuestId?: string | null,
) {
  const id = `${reportId || ''}`.trim();
  if (!id || !userId) return { claimed: false, reason: 'missing_ids' as const };

  try {
    const row = db
      .prepare(`SELECT id, user_id FROM fortunes WHERE id = ? LIMIT 1`)
      .get(id) as { id: string; user_id: string | null } | undefined;
    if (!row) return { claimed: false, reason: 'not_found' as const };

    const owner = `${row.user_id || ''}`.trim();
    const canClaim =
      !owner ||
      owner === userId ||
      (previousGuestId && owner === previousGuestId) ||
      owner.startsWith('guest_');

    if (!canClaim) {
      return { claimed: false, reason: 'owned_by_other' as const };
    }

    if (owner !== userId) {
      db.prepare(`UPDATE fortunes SET user_id = ? WHERE id = ?`).run(userId, id);
    }
    return { claimed: true, reason: 'ok' as const };
  } catch (error) {
    console.warn('[auth] claimReportForUser failed:', error instanceof Error ? error.message : error);
    return { claimed: false, reason: 'error' as const };
  }
}

export async function setSessionUserId(
  userId: string,
  options?: { rememberMe?: boolean },
) {
  const rememberMe = options?.rememberMe !== false;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    maxAge: rememberMe ? SESSION_MAX_AGE_REMEMBER_SEC : SESSION_MAX_AGE_SHORT_SEC,
    httpOnly: true,
    secure: isProductionEnvironment(),
    sameSite: 'lax',
    path: '/',
  });
}

export async function getAuthSession() {
  ensureAuthPasswordSchema();
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!userId) {
    return {
      authenticated: false,
      user: null,
    };
  }

  const user = userOperations.getById(userId) as any;
  if (!user) {
    return {
      authenticated: false,
      user: null,
    };
  }

  // Password / registered users are authenticated without requiring verified email.
  // Guest cookies remain unauthenticated for gated surfaces.
  const role = user.role || 'guest';
  const hasPassword = Boolean(user.password_hash);
  const emailVerified = user.email_verified === 1;
  const authenticated =
    role === 'admin' ||
    role === 'user' ||
    hasPassword ||
    (Boolean(user.email) && emailVerified);

  return {
    authenticated,
    user: {
      id: user.id,
      name: user.name,
      email: user.email || null,
      username: user.username || null,
      role,
      emailVerified,
      hasPassword,
      needsEmailBind: !user.email,
    },
  };
}

export async function verifyLoginCodeAndCreateSession({
  email,
  code,
  adminPassword,
  currentUserId,
  reportId,
}: {
  email: string;
  code: string;
  adminPassword?: string;
  currentUserId?: string | null;
  /** When binding from a report page, claim this report onto the user. */
  reportId?: string | null;
}) {
  const normalizedEmail = normalizeEmail(email);
  const guestId =
    currentUserId && currentUserId.startsWith('guest_') ? currentUserId : null;

  // v5-D50 admin 二次密码校验：仅对白名单邮箱生效，非 admin 邮箱完全跳过
  if (isAdminEmail(normalizedEmail)) {
    const expected = getAdminLoginPassword();
    if (expected) {
      const provided = (adminPassword || '').trim();
      if (provided !== expected) {
        return { success: false, error: '管理员二次密码不正确' };
      }
    }
  }

  const row = db.prepare(`
    SELECT * FROM auth_codes
    WHERE email = ? AND code = ? AND purpose = ? AND used_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  `).get(normalizedEmail, code.trim(), LOGIN_PURPOSE) as any;

  if (!row) {
    return { success: false, error: '验证码无效或已过期' };
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { success: false, error: '验证码已过期，请重新获取' };
  }

  markCodeUsed(row.id);

  return createSessionForVerifiedEmail({
    email: normalizedEmail,
    currentUserId: guestId,
    reportId,
  });
}

/**
 * Create session after a trusted identity proof (email OTP or Google OAuth).
 * Does not re-check OTP / OAuth — caller must verify first.
 */
export async function createSessionForVerifiedEmail({
  email,
  currentUserId,
  reportId,
  displayName,
  rememberMe = true,
  requireEmailVerified = true,
  existingUserId,
}: {
  email: string;
  currentUserId?: string | null;
  reportId?: string | null;
  displayName?: string | null;
  /** Default true — long product session (~2y) */
  rememberMe?: boolean;
  /** When false, do not force email_verified=1 (password user with unbound email path) */
  requireEmailVerified?: boolean;
  /** Prefer this user id when already known (password login) */
  existingUserId?: string | null;
}) {
  ensureAuthPasswordSchema();
  const normalizedEmail = normalizeEmail(email);
  const guestId =
    currentUserId && currentUserId.startsWith('guest_') ? currentUserId : null;

  let user: any = null;
  if (existingUserId) {
    user = userOperations.getById(existingUserId) as any;
  }
  if (!user) {
    user = userOperations.getByEmail(normalizedEmail) as any;
  }
  const isNewUser = !user;
  if (!user) {
    user = createUserForEmail(normalizedEmail, displayName);
  } else {
    if (requireEmailVerified !== false) {
      updateUserLoginState(user.id, normalizedEmail);
    } else if (normalizedEmail) {
      // keep role, optionally set email without forcing verified
      try {
        userOperations.update(user.id, {
          email: normalizedEmail,
          role: isAdminEmail(normalizedEmail) ? 'admin' : user.role || 'user',
        });
      } catch {
        // ignore
      }
    }
    if (displayName && !user.name) {
      try {
        userOperations.update(user.id, { name: `${displayName}`.trim().slice(0, 64) });
      } catch {
        // optional
      }
    }
    user = userOperations.getById(user.id) as any;
  }

  if (guestId && guestId !== user.id) {
    try {
      mergeGuestDataIntoUser(guestId, user.id);
    } catch (error) {
      console.error('[auth] mergeGuestDataIntoUser failed:', error);
    }
  }

  const claim = claimReportForUser(reportId, user.id, guestId);
  await setSessionUserId(user.id, { rememberMe: rememberMe !== false });

  return {
    success: true as const,
    isNewUser,
    reportClaimed: claim.claimed,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
      emailVerified: user.email_verified === 1,
    },
  };
}

export async function logoutCurrentSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function requireAdminUser(nextPath = '/admin/content') {
  const session = await getAuthSession();
  if (!session.authenticated || session.user?.role !== 'admin') {
    const { redirect } = await import('next/navigation');
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session.user;
}
