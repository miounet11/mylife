import { cookies } from 'next/headers';
import { db, userOperations } from '@/lib/database';
import { getAdminEmails as getConfiguredAdminEmails, isProductionEnvironment } from '@/lib/env';
import { generateId } from '@/lib/utils';

const SESSION_COOKIE_NAME = 'life_kline_session_id';
const LOGIN_PURPOSE = 'login';
const CODE_TTL_MINUTES = 15;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getAdminEmails() {
  return new Set(getConfiguredAdminEmails());
}

function isAdminEmail(email: string) {
  return getAdminEmails().has(normalizeEmail(email));
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

function markCodeUsed(id: string) {
  db.prepare(`UPDATE auth_codes SET used_at = datetime('now') WHERE id = ?`).run(id);
}

function createUserForEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const userId = `user_${generateId()}`;
  const localName = normalizedEmail.split('@')[0] || '用户';
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

function mergeGuestDataIntoUser(guestUserId: string, targetUserId: string) {
  if (!guestUserId || !targetUserId || guestUserId === targetUserId) {
    return;
  }

  const transaction = db.transaction(() => {
    db.prepare(`UPDATE fortunes SET user_id = ? WHERE user_id = ?`).run(targetUserId, guestUserId);
    db.prepare(`UPDATE events SET user_id = ? WHERE user_id = ?`).run(targetUserId, guestUserId);
    db.prepare(`UPDATE questions SET user_id = ? WHERE user_id = ?`).run(targetUserId, guestUserId);

    const targetPreference = db.prepare(`SELECT id FROM preferences WHERE user_id = ? LIMIT 1`).get(targetUserId) as { id: string } | undefined;
    if (targetPreference) {
      db.prepare(`DELETE FROM preferences WHERE user_id = ?`).run(guestUserId);
    } else {
      db.prepare(`UPDATE preferences SET user_id = ? WHERE user_id = ?`).run(targetUserId, guestUserId);
    }

    db.prepare(`UPDATE enhancements SET user_id = ? WHERE user_id = ?`).run(targetUserId, guestUserId);
    db.prepare(`UPDATE sessions SET user_id = ? WHERE user_id = ?`).run(targetUserId, guestUserId);
    db.prepare(`DELETE FROM users WHERE id = ? AND id != ?`).run(guestUserId, targetUserId);
  });

  transaction();
}

async function setSessionUserId(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    secure: isProductionEnvironment(),
    sameSite: 'lax',
    path: '/',
  });
}

export async function getAuthSession() {
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

  const authenticated = !!user.email && user.email_verified === 1;
  return {
    authenticated,
    user: {
      id: user.id,
      name: user.name,
      email: user.email || null,
      role: user.role || 'guest',
      emailVerified: user.email_verified === 1,
    },
  };
}

export async function verifyLoginCodeAndCreateSession({
  email,
  code,
  currentUserId,
}: {
  email: string;
  code: string;
  currentUserId?: string | null;
}) {
  const normalizedEmail = normalizeEmail(email);
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

  let user = userOperations.getByEmail(normalizedEmail) as any;
  if (!user) {
    user = createUserForEmail(normalizedEmail);
  } else {
    updateUserLoginState(user.id, normalizedEmail);
    user = userOperations.getById(user.id) as any;
  }

  markCodeUsed(row.id);

  if (currentUserId && currentUserId.startsWith('guest_') && currentUserId !== user.id) {
    mergeGuestDataIntoUser(currentUserId, user.id);
  }

  await setSessionUserId(user.id);

  return {
    success: true,
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
