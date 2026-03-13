import { sendMailV2, sendVerificationCode } from '@/mail';

function getEmailConfig() {
  return {
    from: process.env.MAIL_FROM || '',
    password: process.env.MAIL_PASSWORD || '',
    host: process.env.MAIL_SMTP_HOST || '',
    hostIp: process.env.MAIL_SMTP_HOST_IP || '',
    appName: process.env.MAIL_FROM_NAME || process.env.EMAIL_APP_NAME || '人生K线',
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://www.life-kline.com',
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function isEmailDeliveryConfigured() {
  const { from, password, host, hostIp } = getEmailConfig();
  return Boolean(from && password && (host || hostIp));
}

export async function sendLoginCodeEmail(email: string, code: string, _expiresAt: string) {
  return sendVerificationCode(email, code, 'login');
}

export async function sendWelcomeEmail(email: string, name: string) {
  const { appName, baseUrl } = getEmailConfig();
  const safeName = escapeHtml(name || '用户');

  return sendMailV2({
    to: email,
    subject: `欢迎使用 ${appName}`,
    subtype: 'html',
    text: `欢迎加入 ${appName}。你的邮箱已经绑定成功，后续会收到登录验证码、内容更新和功能通知。订阅管理：${baseUrl}/updates`,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8">
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">欢迎加入 ${appName}</h2>
        <p style="margin:0 0 12px">${safeName}，你的邮箱已经绑定成功。</p>
        <p style="margin:0 0 12px">后续你会收到这些内容：</p>
        <ul style="margin:0 0 16px;padding-left:20px">
          <li>登录验证码与账号安全通知</li>
          <li>内容更新、精选案例与知识文章</li>
          <li>重要功能上线与可选活动提醒</li>
        </ul>
        <p style="margin:0 0 16px">你可以随时在站内管理订阅状态。</p>
        <a href="${escapeHtml(baseUrl)}/updates" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          管理订阅
        </a>
      </div>
    `,
  });
}

export async function sendSubscriptionConfirmationEmail(email: string) {
  const { appName, baseUrl } = getEmailConfig();

  return sendMailV2({
    to: email,
    subject: `${appName} 订阅已生效`,
    subtype: 'html',
    text: `你已经成功订阅 ${appName} 更新内容。订阅管理：${baseUrl}/updates`,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8">
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">订阅已生效</h2>
        <p style="margin:0 0 12px">你已经成功订阅 ${appName} 的更新内容。</p>
        <p style="margin:0 0 12px">后续会收到精选案例、知识文章、产品更新和重要提醒。</p>
        <a href="${escapeHtml(baseUrl)}/updates" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          管理订阅
        </a>
      </div>
    `,
  });
}
