/**
 * Optional Brevo (Sendinblue) transactional email — free tier friendly for Gmail.
 * Enable with BREVO_API_KEY (+ optional BREVO_FROM / BREVO_SENDER_NAME).
 */

export type BrevoSendResult = {
  success: boolean;
  messageId?: string;
  message?: string;
  errorCode?: string;
  provider: 'brevo';
};

function env(name: string): string {
  const v = process.env[name];
  return typeof v === 'string' ? v.trim() : '';
}

export function isBrevoConfigured(): boolean {
  return Boolean(env('BREVO_API_KEY'));
}

export async function sendViaBrevo(input: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
}): Promise<BrevoSendResult> {
  const apiKey = env('BREVO_API_KEY');
  if (!apiKey) {
    return { success: false, message: 'BREVO_API_KEY missing', errorCode: 'NO_KEY', provider: 'brevo' };
  }

  const fromEmail =
    input.from || env('BREVO_FROM') || env('RESEND_FROM') || env('MAIL_FROM') || 'code@life-kline.com';
  const fromName =
    input.fromName || env('BREVO_SENDER_NAME') || env('MAIL_FROM_NAME') || '人生K线';
  const toList = (Array.isArray(input.to) ? input.to : [input.to]).map((email) => ({ email }));

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: toList,
        subject: input.subject,
        htmlContent: input.html || undefined,
        textContent: input.text || undefined,
        tags: ['life-kline', 'login-code'],
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      messageId?: string;
      message?: string;
      code?: string;
    };

    if (!res.ok) {
      console.error('[mail/brevo] failed', res.status, data);
      return {
        success: false,
        message: data.message || data.code || `Brevo HTTP ${res.status}`,
        errorCode: `BREVO_${res.status}`,
        provider: 'brevo',
      };
    }

    return {
      success: true,
      messageId: data.messageId,
      provider: 'brevo',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[mail/brevo] exception', message);
    return {
      success: false,
      message,
      errorCode: 'BREVO_EXCEPTION',
      provider: 'brevo',
    };
  }
}
