// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { verifyLoginCodeAndCreateSession } from '@/lib/auth';
import { emailSubscriptionOperations } from '@/lib/database';
import {
  isEmailDeliveryConfigured,
  sendWelcomeEmail,
} from '@/lib/email';
import { sendSubscriptionConfirmationEmail } from '@/lib/email/subscription-confirmation';
import {
  LOGIN_AUTO_SUBSCRIPTION_TAGS,
  REPORT_SUBSCRIPTION_TAGS,
} from '@/lib/email-subscription-focus';
import { getCurrentUserId } from '@/lib/user-utils';
import { normalizeEmail, validateEmail } from '@/lib/validators';
import { trackServerEvent } from '@/lib/analytics';
import { checkRateLimit, getClientKey, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail = `${body.email || ''}`;
    const code = `${body.code || ''}`.trim();
    const adminPassword = typeof body.adminPassword === 'string' ? body.adminPassword : undefined;
    const source = typeof body.source === 'string' ? body.source.slice(0, 80) : 'login';
    const reportId = typeof body.reportId === 'string' ? body.reportId.trim().slice(0, 120) : '';
    const page = typeof body.page === 'string' ? body.page : '/login';

    const error = validateEmail(rawEmail);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const email = normalizeEmail(rawEmail);

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { success: false, error: '请输入 6 位验证码' },
        { status: 400 }
      );
    }

    const verifyLimit = checkRateLimit(`auth-verify:email:${email}`, RATE_LIMITS.authVerifyEmail);
    if (!verifyLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: '验证尝试过于频繁，请稍后再试',
          retryAfterSec: Math.max(1, Math.ceil((verifyLimit.resetAt - Date.now()) / 1000)),
        },
        { status: 429 },
      );
    }

    const currentUserId = await getCurrentUserId();
    const result = await verifyLoginCodeAndCreateSession({
      email,
      code,
      adminPassword,
      currentUserId,
      reportId: reportId || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    const subSource = reportId ? source || 'report_bind' : source || 'login_auto';
    const tags = [
      ...new Set([
        ...LOGIN_AUTO_SUBSCRIPTION_TAGS,
        ...(reportId ? REPORT_SUBSCRIPTION_TAGS : []),
      ]),
    ];
    const metaPatch = reportId ? { focusReportId: reportId } : undefined;

    try {
      emailSubscriptionOperations.upsert(email, subSource, tags, metaPatch);
    } catch (subError) {
      console.error('[Auth] subscription upsert failed:', subError);
    }

    if (isEmailDeliveryConfigured() && result.user?.email) {
      // Welcome only for brand-new accounts to reduce inbox noise on re-login.
      if (result.isNewUser) {
        sendWelcomeEmail(result.user.email, result.user.name || '用户').catch((err) => {
          console.error('[Auth] 发送欢迎邮件失败:', err);
        });
      }
      sendSubscriptionConfirmationEmail(result.user.email, { source: subSource }).catch((err) => {
        console.error('[Auth] 发送订阅确认邮件失败:', err);
      });
    }

    trackServerEvent({
      userId: result.user?.id,
      sessionId: currentUserId || result.user?.id || getClientKey(request),
      eventName: 'auth_verified',
      page,
      userAgent: request.headers.get('user-agent'),
      meta: {
        emailDomain: email.split('@')[1] || '',
        autoSubscribed: true,
        source: subSource,
        reportId: reportId || null,
        reportClaimed: !!result.reportClaimed,
        isNewUser: !!result.isNewUser,
      },
    });

    return NextResponse.json({
      success: true,
      user: result.user,
      isNewUser: !!result.isNewUser,
      reportClaimed: !!result.reportClaimed,
    });
  } catch (error) {
    console.error('[API] 验证登录验证码失败:', error);
    return NextResponse.json(
      { success: false, error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
