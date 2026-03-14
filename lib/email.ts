import {
  deliverMailWithRetry as deliverMailWithRetryRaw,
  sendMailV2,
  sendVerificationCode,
} from '@/mail';

function getEmailConfig() {
  const disableAuth = process.env.MAIL_SMTP_DISABLE_AUTH === 'true';
  return {
    from: process.env.MAIL_FROM || '',
    password: process.env.MAIL_AUTH_PASSWORD || process.env.MAIL_PASSWORD || '',
    authUser: process.env.MAIL_AUTH_USER || process.env.MAIL_FROM || '',
    host: process.env.MAIL_SMTP_HOST || '',
    hostIp: process.env.MAIL_SMTP_HOST_IP || '',
    disableAuth,
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
  const { from, authUser, password, host, hostIp, disableAuth } = getEmailConfig();
  if (disableAuth) {
    return Boolean(from && (host || hostIp));
  }
  return Boolean(from && authUser && password && (host || hostIp));
}

export const deliverMailWithRetry = deliverMailWithRetryRaw;

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

export async function sendSubscriptionConfirmationEmail(
  email: string,
  options?: {
    source?: string;
  }
) {
  const { appName, baseUrl } = getEmailConfig();
  const isReportSubscription = options?.source === 'result_report';
  const subject = isReportSubscription ? `${appName} 月度更新与报告提醒已生效` : `${appName} 订阅已生效`;
  const text = isReportSubscription
    ? `你已经成功订阅 ${appName} 的月度更新、报告升级提醒和关键节点通知。订阅管理：${baseUrl}/updates`
    : `你已经成功订阅 ${appName} 更新内容。订阅管理：${baseUrl}/updates`;
  const introTitle = isReportSubscription ? '月度更新与报告提醒已生效' : '订阅已生效';
  const introBody = isReportSubscription
    ? '你已经成功订阅这份报告的后续更新。'
    : `你已经成功订阅 ${appName} 的更新内容。`;
  const detailBody = isReportSubscription
    ? '后续会收到月度窗口更新、报告升级完成提醒、关键节点通知和精选内容。'
    : '后续会收到精选案例、知识文章、产品更新和重要提醒。';

  return sendMailV2({
    to: email,
    subject,
    subtype: 'html',
    text,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8">
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">${introTitle}</h2>
        <p style="margin:0 0 12px">${introBody}</p>
        <p style="margin:0 0 12px">${detailBody}</p>
        <a href="${escapeHtml(baseUrl)}/updates" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          管理订阅
        </a>
      </div>
    `,
  });
}

export async function sendReportUpgradeReadyEmail(params: {
  email: string;
  name: string;
  reportId: string;
  score?: number;
  grade?: 'S' | 'A' | 'B' | 'C';
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
}) {
  const { appName, baseUrl } = getEmailConfig();
  const safeName = escapeHtml(params.name || '用户');
  const resultUrl = `${baseUrl}/result/${encodeURIComponent(params.reportId)}`;
  const deliveryTierLabel = params.deliveryTier === 'expert'
    ? 'S级专家版'
    : params.deliveryTier === 'enhanced'
      ? '增强版'
      : '可读版';
  const scoreLabel = params.score ? `${params.score} / ${params.grade || 'B'}` : (params.grade || 'S');

  return sendMailV2({
    to: params.email,
    subject: `${appName} 报告增强已完成`,
    subtype: 'html',
    text: `${safeName}，你的报告增强已完成，当前版本 ${deliveryTierLabel}，质量 ${scoreLabel}。查看报告：${resultUrl}`,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8">
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">你的报告增强已完成</h2>
        <p style="margin:0 0 12px">${safeName}，系统已经完成这份报告的后台增强。</p>
        <p style="margin:0 0 12px">当前版本：<strong>${deliveryTierLabel}</strong></p>
        <p style="margin:0 0 12px">质量评级：<strong>${escapeHtml(scoreLabel)}</strong></p>
        <p style="margin:0 0 16px">现在最适合做的，是重新回到结果页看最新结论、月度窗口和行动建议，然后继续把关键判断带去 AI 深问。</p>
        <a href="${escapeHtml(resultUrl)}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          查看最新报告
        </a>
        <p style="margin:16px 0 0;color:#6b7280;font-size:13px">你可以随时在站内管理订阅状态：${escapeHtml(baseUrl)}/updates</p>
      </div>
    `,
  });
}

export async function sendMonthlyReportDigestEmail(params: {
  email: string;
  name: string;
  reportId: string;
  cycleLabel: string;
  summary: string;
  stageFocus: string;
  monthlyHighlights: Array<{
    label: string;
    theme: string;
    status: 'push' | 'steady' | 'caution';
  }>;
}) {
  const { appName, baseUrl } = getEmailConfig();
  const safeName = escapeHtml(params.name || '用户');
  const resultUrl = `${baseUrl}/result/${encodeURIComponent(params.reportId)}`;
  const highlightsHtml = params.monthlyHighlights
    .map((item) => {
      const statusLabel = item.status === 'push'
        ? '适合推进'
        : item.status === 'steady'
          ? '适合稳步布局'
          : '适合谨慎收缩';
      return `
        <li style="margin:0 0 10px">
          <strong>${escapeHtml(item.label)}</strong>：${escapeHtml(item.theme)}（${statusLabel}）
        </li>
      `;
    })
    .join('');

  return sendMailV2({
    to: params.email,
    subject: `${appName} ${params.cycleLabel}月度更新`,
    subtype: 'html',
    text: `${safeName}，你的 ${params.cycleLabel} 月度更新已生成。当前重点：${params.stageFocus}。查看报告：${resultUrl}`,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8">
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">${params.cycleLabel} 月度更新</h2>
        <p style="margin:0 0 12px">${safeName}，这是你本月最值得关注的一版节律摘要。</p>
        <p style="margin:0 0 12px"><strong>阶段重点：</strong>${escapeHtml(params.stageFocus)}</p>
        <p style="margin:0 0 12px">${escapeHtml(params.summary)}</p>
        ${params.monthlyHighlights.length > 0 ? `
          <div style="margin:16px 0 12px;font-weight:700;color:#111827">本月重点窗口</div>
          <ul style="margin:0 0 16px;padding-left:20px">
            ${highlightsHtml}
          </ul>
        ` : ''}
        <a href="${escapeHtml(resultUrl)}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          查看完整报告
        </a>
        <p style="margin:16px 0 0;color:#6b7280;font-size:13px">你也可以在站内管理订阅状态：${escapeHtml(baseUrl)}/updates</p>
      </div>
    `,
  });
}

export async function sendPremiumServiceRequestReceivedEmail(params: {
  email: string;
  name?: string;
  requestId: string;
  reportId?: string;
  serviceLabel: string;
  question: string;
}) {
  const { appName, baseUrl } = getEmailConfig();
  const safeName = escapeHtml(params.name || '用户');
  const resultUrl = params.reportId
    ? `${baseUrl}/result/${encodeURIComponent(params.reportId)}`
    : `${baseUrl}/updates`;

  return sendMailV2({
    to: params.email,
    subject: `${appName} 已收到你的${params.serviceLabel}需求`,
    subtype: 'html',
    text: `${safeName}，我们已经收到你的${params.serviceLabel}需求。需求编号：${params.requestId}。查看相关页面：${resultUrl}`,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8">
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">已收到你的${escapeHtml(params.serviceLabel)}需求</h2>
        <p style="margin:0 0 12px">${safeName}，系统已经记录这次专项需求，后续跟进会围绕这份问题继续展开。</p>
        <p style="margin:0 0 12px"><strong>需求编号：</strong>${escapeHtml(params.requestId)}</p>
        <p style="margin:0 0 12px"><strong>你提交的问题：</strong>${escapeHtml(params.question)}</p>
        <p style="margin:0 0 16px">建议你保留这份报告与后续事件记录，方便继续补充上下文和现实反馈。</p>
        <a href="${escapeHtml(resultUrl)}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          查看相关页面
        </a>
      </div>
    `,
  });
}

export async function sendPremiumServiceAdminNotificationEmail(params: {
  emails: string[];
  requestId: string;
  reportId?: string;
  serviceLabel: string;
  question: string;
  contactName?: string;
  contactValue: string;
  preferredContact?: string;
}) {
  const { appName, baseUrl } = getEmailConfig();
  const adminUrl = `${baseUrl}/admin/premium-services`;
  const resultUrl = params.reportId
    ? `${baseUrl}/result/${encodeURIComponent(params.reportId)}`
    : '';

  return sendMailV2({
    to: params.emails,
    subject: `${appName} 新增专项需求单 ${params.requestId}`,
    subtype: 'html',
    text: `新增专项需求：${params.serviceLabel}，联系人 ${params.contactValue}，后台查看：${adminUrl}`,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8">
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">新增专项需求单</h2>
        <p style="margin:0 0 12px"><strong>需求编号：</strong>${escapeHtml(params.requestId)}</p>
        <p style="margin:0 0 12px"><strong>专项类型：</strong>${escapeHtml(params.serviceLabel)}</p>
        <p style="margin:0 0 12px"><strong>联系人：</strong>${escapeHtml(params.contactName || '未填写')}</p>
        <p style="margin:0 0 12px"><strong>联系方式：</strong>${escapeHtml(params.contactValue)}</p>
        <p style="margin:0 0 12px"><strong>偏好渠道：</strong>${escapeHtml(params.preferredContact || '未填写')}</p>
        <p style="margin:0 0 12px"><strong>用户问题：</strong>${escapeHtml(params.question)}</p>
        ${resultUrl ? `<p style="margin:0 0 16px"><strong>关联报告：</strong><a href="${escapeHtml(resultUrl)}">${escapeHtml(resultUrl)}</a></p>` : ''}
        <a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          进入后台跟进
        </a>
      </div>
    `,
  });
}

export async function sendPremiumServiceStatusUpdateEmail(params: {
  email: string;
  name?: string;
  serviceLabel: string;
  statusLabel: string;
  reportId?: string;
  note?: string;
}) {
  const { appName, baseUrl } = getEmailConfig();
  const safeName = escapeHtml(params.name || '用户');
  const resultUrl = params.reportId
    ? `${baseUrl}/result/${encodeURIComponent(params.reportId)}`
    : `${baseUrl}/updates`;

  return sendMailV2({
    to: params.email,
    subject: `${appName} ${params.serviceLabel}已更新为${params.statusLabel}`,
    subtype: 'html',
    text: `${safeName}，你的${params.serviceLabel}当前状态已更新为${params.statusLabel}。查看页面：${resultUrl}`,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8">
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">${escapeHtml(params.serviceLabel)}状态已更新</h2>
        <p style="margin:0 0 12px">${safeName}，当前这项专项服务的状态已经更新为 <strong>${escapeHtml(params.statusLabel)}</strong>。</p>
        ${params.note ? `<p style="margin:0 0 12px"><strong>跟进说明：</strong>${escapeHtml(params.note)}</p>` : ''}
        <a href="${escapeHtml(resultUrl)}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          查看相关页面
        </a>
      </div>
    `,
  });
}
