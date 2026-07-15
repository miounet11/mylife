import { NextResponse } from 'next/server';
import { adminPasswordRequiredFor, createLoginCode } from '@/lib/auth';
import { isEmailDeliveryConfigured, sendLoginCodeEmail } from '@/lib/email';
import { resolveEmailLocale } from '@/lib/email-locale';
import { validateEmail } from '@/lib/validators';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = `${body.email || ''}`;
    const validation = validateEmail(email);
    if (validation) {
      return NextResponse.json({ success: false, error: validation.message }, { status: 400 });
    }

    const acceptLanguage = request.headers.get('accept-language');
    const locale = resolveEmailLocale({
      email,
      locale: body.locale || body.language || body.lang,
      language: body.language || body.locale || body.lang,
      acceptLanguage,
    });

    const issued = createLoginCode(email);

    let emailSent = false;
    let emailError: string | null = null;

    if (isEmailDeliveryConfigured()) {
      try {
        await sendLoginCodeEmail(issued.email, issued.code, issued.expiresAt, {
          locale,
          acceptLanguage,
        });
        emailSent = true;
      } catch (error) {
        emailError = error instanceof Error ? error.message : String(error);
        console.error('[auth/request-code] sendLoginCodeEmail failed:', error);
      }
    } else {
      emailError = 'EMAIL_NOT_CONFIGURED';
      console.warn('[auth/request-code] mail delivery not configured; code stored only');
    }

    // Always log server-side for ops recovery (do not expose in production response).
    console.info('[auth/request-code] issued', {
      email: issued.email,
      expiresAt: issued.expiresAt,
      emailSent,
      emailError,
      locale,
    });

    const messageByLocale = {
      'zh-CN': emailSent
        ? '验证码已发送到你的邮箱，请查收（含垃圾箱）'
        : '验证码已生成。若未收到邮件，请稍后重试或联系管理员查看服务器邮件配置',
      'zh-Hant': emailSent
        ? '驗證碼已發送到你的郵箱，請查收（含垃圾箱）'
        : '驗證碼已生成。若未收到郵件，請稍後重試或聯繫管理員查看伺服器郵件配置',
      en: emailSent
        ? 'A verification code has been sent to your email (check spam too).'
        : 'Code generated. If you did not receive the email, retry later or contact support.',
    } as const;

    const payload: Record<string, unknown> = {
      success: true,
      message: messageByLocale[locale],
      adminPasswordRequired: adminPasswordRequiredFor(email),
      expiresAt: issued.expiresAt,
      emailSent,
      locale,
    };

    // Dev convenience only.
    if (process.env.NODE_ENV === 'development') {
      payload.devCode = issued.code;
    }

    // If mail failed but code exists, still 200 so UI can proceed with admin recovery;
    // surface soft warning via emailSent=false.
    if (!emailSent && emailError) {
      payload.warning =
        locale === 'en'
          ? 'Email delivery failed. Check SMTP or retry shortly.'
          : locale === 'zh-Hant'
            ? '郵件發送未成功，請檢查 SMTP 或稍後重試'
            : '邮件发送未成功，请检查 SMTP 或稍后重试';
    }

    return NextResponse.json(payload);
  } catch (error: unknown) {
    console.error('[auth/request-code]', error);
    return NextResponse.json({ success: false, error: '发送验证码失败' }, { status: 500 });
  }
}
