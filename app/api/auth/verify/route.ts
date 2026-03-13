import { NextRequest, NextResponse } from 'next/server';
import { verifyLoginCodeAndCreateSession } from '@/lib/auth';
import { emailSubscriptionOperations } from '@/lib/database';
import { isEmailDeliveryConfigured, sendWelcomeEmail } from '@/lib/email';
import { getCurrentUserId } from '@/lib/user-utils';
import { validateEmail } from '@/lib/validators';
import { trackServerEvent } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = `${body.email || ''}`;
    const code = `${body.code || ''}`.trim();

    const error = validateEmail(email);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: '请输入 6 位验证码' },
        { status: 400 }
      );
    }

    const currentUserId = await getCurrentUserId();
    const result = await verifyLoginCodeAndCreateSession({
      email,
      code,
      currentUserId,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    emailSubscriptionOperations.upsert(email, 'login_auto', ['auth', 'welcome', 'updates']);

    if (isEmailDeliveryConfigured() && result.user?.email) {
      sendWelcomeEmail(result.user.email, result.user.name || '用户').catch((error) => {
        console.error('[Auth] 发送欢迎邮件失败:', error);
      });
    }

    trackServerEvent({
      userId: result.user?.id,
      sessionId: currentUserId || result.user?.id,
      eventName: 'auth_verified',
      page: '/login',
      meta: {
        emailDomain: email.split('@')[1] || '',
      },
    });

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error('[API] 验证登录验证码失败:', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
