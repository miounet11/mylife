import { NextResponse } from 'next/server';
import { adminPasswordRequiredFor, createLoginCode, deletePendingLoginCode } from '@/lib/auth';
import { trackServerEvent } from '@/lib/analytics';
import { isEmailDeliveryConfigured, sendLoginCodeEmail } from '@/lib/email';
import { resolveEmailLocale } from '@/lib/email-locale';
import { checkRateLimit, getClientKey, RATE_LIMITS } from '@/lib/rate-limit';
import { getCurrentUserId } from '@/lib/user-utils';
import { normalizeEmail, validateEmail } from '@/lib/validators';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawEmail = `${body.email || ''}`;
    const source = typeof body.source === 'string' ? body.source.slice(0, 80) : 'login';
    const reportId = typeof body.reportId === 'string' ? body.reportId.trim().slice(0, 120) : '';
    const validation = validateEmail(rawEmail);
    if (validation) {
      return NextResponse.json({ success: false, error: validation.message }, { status: 400 });
    }

    const email = normalizeEmail(rawEmail);
    const clientKey = getClientKey(request);
    const emailLimit = checkRateLimit(`auth-code:email:${email}`, RATE_LIMITS.authCodeEmail);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: '验证码发送过于频繁，请稍后再试（约 15 分钟内最多 5 次）',
          retryAfterSec: Math.max(1, Math.ceil((emailLimit.resetAt - Date.now()) / 1000)),
        },
        { status: 429 },
      );
    }
    const ipLimit = checkRateLimit(`auth-code:ip:${clientKey}`, RATE_LIMITS.authCodeIp);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: '请求过于频繁，请稍后再试',
          retryAfterSec: Math.max(1, Math.ceil((ipLimit.resetAt - Date.now()) / 1000)),
        },
        { status: 429 },
      );
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

    const currentUserId = await getCurrentUserId().catch(() => null);

    // Always log server-side for ops recovery (do not expose code in production response).
    console.info('[auth/request-code] issued', {
      email: issued.email,
      expiresAt: issued.expiresAt,
      emailSent,
      emailError,
      locale,
      source,
      reportId: reportId || null,
    });

    const emailDomain = email.split('@')[1] || '';
    const isGmail =
      emailDomain === 'gmail.com' ||
      emailDomain === 'googlemail.com' ||
      emailDomain.endsWith('.gmail.com');
    const httpEsp =
      Boolean(process.env.RESEND_API_KEY?.trim()) || Boolean(process.env.BREVO_API_KEY?.trim());

    trackServerEvent({
      userId: currentUserId || undefined,
      sessionId: currentUserId || clientKey,
      eventName: 'auth_code_requested',
      page: typeof body.page === 'string' ? body.page : '/login',
      userAgent: request.headers.get('user-agent'),
      meta: {
        emailDomain,
        emailSent,
        emailError: emailError || null,
        source,
        reportId: reportId || null,
        locale,
        isGmail,
        httpEsp,
      },
    });

    // Dev: allow proceeding without SMTP so local QA works.
    const allowWithoutMail = process.env.NODE_ENV === 'development';

    if (!emailSent && !allowWithoutMail) {
      // Remove unusable code so users don't burn a rate-limit slot on a dead code.
      try {
        deletePendingLoginCode(issued.email, issued.code);
      } catch {
        // ignore
      }
      const failMessage =
        locale === 'en'
          ? 'Could not send the verification email. Check the address or retry shortly.'
          : locale === 'zh-Hant'
            ? '驗證碼郵件未能送達，請檢查郵箱或稍後重試'
            : '验证码邮件未能送达，请检查邮箱或稍后重试';
      return NextResponse.json(
        {
          success: false,
          error: failMessage,
          emailSent: false,
          warning: failMessage,
        },
        { status: 502 },
      );
    }

    const messageByLocale = {
      'zh-CN': emailSent
        ? '验证码已发送到你的邮箱，请查收（含垃圾箱）'
        : '验证码已生成（开发环境）。若未收到邮件，请查看服务器日志中的验证码',
      'zh-Hant': emailSent
        ? '驗證碼已發送到你的郵箱，請查收（含垃圾箱）'
        : '驗證碼已生成（開發環境）。若未收到郵件，請查看伺服器日誌中的驗證碼',
      en: emailSent
        ? 'A verification code has been sent to your email (check spam too).'
        : 'Code generated (dev). If no email arrives, check server logs.',
    } as const;

    const payload: Record<string, unknown> = {
      success: true,
      message: messageByLocale[locale],
      adminPasswordRequired: adminPasswordRequiredFor(email),
      expiresAt: issued.expiresAt,
      emailSent,
      locale,
      isGmail,
      httpEsp,
    };

    if (isGmail && emailSent) {
      payload.gmailHint =
        locale === 'en'
          ? httpEsp
            ? 'Gmail: check Inbox and Spam/Promotions within 1–2 minutes.'
            : 'Gmail often filters our self-hosted SMTP. Check Spam/Promotions, or use QQ / work email for a more reliable login.'
          : locale === 'zh-Hant'
            ? httpEsp
              ? 'Gmail：請同時查看收件匣與垃圾郵件/促銷分類。'
              : 'Gmail 對自建 SMTP 過濾較嚴。請查垃圾郵件/促銷；若 2 分鐘仍未收到，建議改用 QQ 或企業郵。'
            : httpEsp
              ? 'Gmail：请同时查看收件箱与垃圾邮件/促销分类。'
              : 'Gmail 对自建 SMTP 过滤较严。请查垃圾邮件/促销；若 2 分钟仍未收到，建议改用 QQ 或企业邮。';
    }

    // Dev convenience only.
    if (process.env.NODE_ENV === 'development') {
      payload.devCode = issued.code;
    }

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
