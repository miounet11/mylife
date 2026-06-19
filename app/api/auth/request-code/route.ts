import { NextRequest, NextResponse } from 'next/server';
import { adminPasswordRequiredFor, createLoginCode, deletePendingLoginCode } from '@/lib/auth';
import { shouldShowAuthPreviewCode } from '@/lib/env';
import { isEmailDeliveryConfigured, sendLoginCodeEmail } from '@/lib/email';
import { validateEmail } from '@/lib/validators';
import { trackServerEvent } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = `${body.email || ''}`;
    const error = validateEmail(email);
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const result = createLoginCode(email);
    const emailConfigured = isEmailDeliveryConfigured();

    if (emailConfigured) {
      let deliveryResult;
      try {
        deliveryResult = await sendLoginCodeEmail(result.email, result.code, result.expiresAt);
      } catch (deliveryError) {
        const reason = deliveryError instanceof Error ? deliveryError.message : 'unknown';
        deletePendingLoginCode(result.email, result.code);
        console.error('[Auth] 登录验证码邮件发送异常:', deliveryError);
        trackServerEvent({
          eventName: 'email_delivery_failed',
          page: '/login',
          userAgent: request.headers.get('user-agent'),
          meta: {
            channel: 'auth_code',
            emailDomain: result.email.split('@')[1] || '',
            reason,
          },
        });

        return NextResponse.json(
          { success: false, error: '邮件服务暂时不可用，请稍后重试' },
          { status: 503 }
        );
      }

      if (!deliveryResult?.success) {
        deletePendingLoginCode(result.email, result.code);
        trackServerEvent({
          eventName: 'email_delivery_failed',
          page: '/login',
          userAgent: request.headers.get('user-agent'),
          meta: {
            channel: 'auth_code',
            emailDomain: result.email.split('@')[1] || '',
            reason: deliveryResult?.message || 'unknown',
          },
        });

        return NextResponse.json(
          { success: false, error: '邮件服务暂时不可用，请稍后重试' },
          { status: 503 }
        );
      }

      trackServerEvent({
        eventName: 'email_delivery_succeeded',
        page: '/login',
        userAgent: request.headers.get('user-agent'),
        meta: {
          channel: 'auth_code',
          emailDomain: result.email.split('@')[1] || '',
        },
      });
    } else {
      console.log(`[Auth] Login code for ${result.email}: ${result.code}`);
    }

    trackServerEvent({
      eventName: 'auth_code_requested',
      page: '/login',
      userAgent: request.headers.get('user-agent'),
      meta: {
        emailDomain: result.email.split('@')[1] || '',
        deliveryConfigured: emailConfigured,
      },
    });

    return NextResponse.json({
      success: true,
      message: emailConfigured ? '验证码已发送至邮箱' : '验证码已生成',
      expiresAt: result.expiresAt,
      deliveryConfigured: emailConfigured,
      previewCode: shouldShowAuthPreviewCode() ? result.code : undefined,
      // v5-D50 通知前端展示 admin 二次密码输入框（仅 admin 邮箱命中）
      adminPasswordRequired: adminPasswordRequiredFor(result.email),
    });
  } catch (error) {
    console.error('[API] 请求登录验证码失败:', error);
    return NextResponse.json(
      { success: false, error: '发送验证码失败，请稍后重试' },
      { status: 500 }
    );
  }
}
