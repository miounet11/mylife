import { cookies } from 'next/headers';
import { generateId } from './utils';
import { userOperations } from './database';

const SESSION_COOKIE_NAME = 'life_kline_session_id';

/**
 * 获取当前的会话ID，如果不存在则创建并设置Cookie
 * 这允许未注册用户在同一个浏览器下保持一致的身份
 */
export async function getOrCreateGuestUserId(): Promise<string> {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (existingSessionId) {
    // 确保数据库中有这个用户
    try {
      const user = userOperations.getById(existingSessionId);
      if (!user) {
        // 如果Cookie里有但是数据库里没有，补齐数据库记录
        userOperations.create({
          id: existingSessionId,
          name: '未命名测算者',
          gender: 'male',
          birthDate: '1990-01-01',
          birthTime: '12:00',
          birthPlace: '北京',
          timezone: 8
        });
      }
    } catch (e) {
      console.error('[Session] Error checking/creating user:', e);
    }
    return existingSessionId;
  }

  // 生成新的会话ID
  const newSessionId = `guest_${generateId()}`;
  
  // 写入数据库
  try {
    userOperations.create({
      id: newSessionId,
      name: '未命名测算者',
      gender: 'male',
      birthDate: '1990-01-01',
      birthTime: '12:00',
      birthPlace: '北京',
      timezone: 8
    });
  } catch (e) {
    console.error('[Session] Error creating new guest user:', e);
  }

  // 写入Cookie（有效期1年）
  cookieStore.set(SESSION_COOKIE_NAME, newSessionId, {
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  return newSessionId;
}

/**
 * 仅获取当前会话ID（不创建）
 */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}
