import { NextRequest, NextResponse } from 'next/server';
import { registerWithPassword } from '@/lib/auth-password';
import { trackServerEvent } from '@/lib/analytics';
import { checkRateLimit, getClientKey, RATE_LIMITS } from '@/lib/rate-limit';
import { getCurrentUserId } from '@/lib/user-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = `${body.username || body.account || ''}`.trim();
    const password = `${body.password || ''}`;
    const email =
      typeof body.email === 'string' && body.email.trim()
        ? body.email.trim()
        : null;
    const rememberMe = body.rememberMe !== false;
    const reportId =
      typeof body.reportId === 'string' ? body.reportId.trim().slice(0, 120) : '';
    const source =
      typeof body.source === 'string' ? body.source.slice(0, 80) : 'password_register';
    const page = typeof body.page === 'string' ? body.page : '/login';

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: '请填写用户名和密码' },
        { status: 400 },
      );
    }

    const ip = getClientKey(request);
    const ipLimit = checkRateLimit(`auth-reg-ip:${ip}`, RATE_LIMITS.authRegisterIp);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { success: false, error: '注册过于频繁，请稍后再试' },
        { status: 429 },
      );
    }

    const currentUserId = await getCurrentUserId();
    const result = await registerWithPassword({
      username,
      password,
      email,
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
      eventName: 'auth_password_register',
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
      isNewUser: true,
      reportClaimed: !!result.reportClaimed,
      needsEmailBind: !result.user.email,
      message: result.user.email
        ? '注册成功。建议之后在个人中心验证邮箱，方便接收订阅。'
        : '注册成功。建议绑定邮箱，方便接收节点提醒与找回报告。',
    });
  } catch (error) {
    console.error('[api/auth/password/register]', error);
    return NextResponse.json(
      { success: false, error: '注册失败，请稍后重试' },
      { status: 500 },
    );
  }
}
