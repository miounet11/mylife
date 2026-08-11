import { NextRequest, NextResponse } from 'next/server';
import { loginWithPassword } from '@/lib/auth-password';
import { trackServerEvent } from '@/lib/analytics';
import { checkRateLimit, getClientKey, RATE_LIMITS } from '@/lib/rate-limit';
import { getCurrentUserId } from '@/lib/user-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const account = `${body.account || body.username || body.email || ''}`.trim();
    const password = `${body.password || ''}`;
    const rememberMe = body.rememberMe !== false;
    const reportId =
      typeof body.reportId === 'string' ? body.reportId.trim().slice(0, 120) : '';
    const source =
      typeof body.source === 'string' ? body.source.slice(0, 80) : 'password_login';
    const page = typeof body.page === 'string' ? body.page : '/login';

    if (!account || !password) {
      return NextResponse.json(
        { success: false, error: '请输入账号和密码' },
        { status: 400 },
      );
    }

    const ip = getClientKey(request);
    const ipLimit = checkRateLimit(`auth-pw-ip:${ip}`, RATE_LIMITS.authPasswordIp);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: '尝试过于频繁，请稍后再试' },
        { status: 429 },
      );
    }
    const accLimit = checkRateLimit(
      `auth-pw-acc:${account.toLowerCase()}`,
      RATE_LIMITS.authPasswordAccount,
    );
    if (!accLimit.allowed) {
      return NextResponse.json(
        { success: false, error: '该账号尝试过多，请稍后再试' },
        { status: 429 },
      );
    }

    const currentUserId = await getCurrentUserId();
    const result = await loginWithPassword({
      account,
      password,
      currentUserId,
      reportId: reportId || null,
      rememberMe,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    trackServerEvent({
      userId: result.user.id,
      sessionId: currentUserId || result.user.id || ip,
      eventName: 'auth_password_login',
      page,
      userAgent: request.headers.get('user-agent'),
      meta: {
        source,
        reportId: reportId || null,
        reportClaimed: !!result.reportClaimed,
        hasEmail: Boolean(result.user.email),
        rememberMe,
      },
    });

    return NextResponse.json({
      success: true,
      user: result.user,
      reportClaimed: !!result.reportClaimed,
      needsEmailBind: !result.user.email,
    });
  } catch (error) {
    console.error('[api/auth/password/login]', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 },
    );
  }
}
