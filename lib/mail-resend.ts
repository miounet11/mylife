/**
 * Optional Resend HTTP provider for transactional mail (login codes).
 * Used when RESEND_API_KEY is set — dramatically better Gmail inbox rates
 * than raw port-25 self-hosted SMTP.
 */

export type ResendSendResult = {
  success: boolean;
  messageId?: string;
  message?: string;
  errorCode?: string;
  provider: 'resend';
};

function readEnv(name: string): string {
  const v = process.env[name];
  return typeof v === 'string' ? v.trim() : '';
}

export function isResendConfigured(): boolean {
  return Boolean(readEnv('RESEND_API_KEY'));
}

export async function sendViaResend(input: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  fromName?: string;
  tags?: Array<{ name: string; value: string }>;
}): Promise<ResendSendResult> {
  const apiKey = readEnv('RESEND_API_KEY');
  if (!apiKey) {
    return { success: false, message: 'RESEND_API_KEY missing', errorCode: 'NO_KEY', provider: 'resend' };
  }

  const fromAddr =
    input.from ||
    readEnv('RESEND_FROM') ||
    readEnv('MAIL_FROM') ||
    'code@life-kline.com';
  const fromName =
    input.fromName || readEnv('MAIL_FROM_NAME') || readEnv('EMAIL_APP_NAME') || '人生K线';
  const toList = Array.isArray(input.to) ? input.to : [input.to];

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromAddr}>`,
        to: toList,
        subject: input.subject,
        html: input.html || undefined,
        text: input.text || undefined,
        tags: input.tags,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!res.ok) {
      console.error('[mail/resend] failed', res.status, data);
      return {
        success: false,
        message: data.message || data.name || `Resend HTTP ${res.status}`,
        errorCode: `RESEND_${res.status}`,
        provider: 'resend',
      };
    }

    return {
      success: true,
      messageId: data.id,
      provider: 'resend',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[mail/resend] exception', message);
    return {
      success: false,
      message,
      errorCode: 'RESEND_EXCEPTION',
      provider: 'resend',
    };
  }
}
