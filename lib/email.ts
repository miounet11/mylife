import {
  deliverMailWithRetry as deliverMailWithRetryRaw,
  sendMailV2,
  sendVerificationCode,
} from '@/mail';
import {
  getAppBaseUrl,
  getMailAppName,
  getMailAuthUser,
  getMailFromAddress,
  getMailPassword,
  getMailSmtpHost,
  getMailSmtpHostIp,
  isMailSmtpAuthDisabled,
} from '@/lib/env';

function getEmailConfig() {
  const disableAuth = isMailSmtpAuthDisabled();
  return {
    from: getMailFromAddress(),
    password: getMailPassword(),
    authUser: getMailAuthUser(),
    host: getMailSmtpHost(),
    hostIp: getMailSmtpHostIp(),
    disableAuth,
    appName: getMailAppName(),
    baseUrl: getAppBaseUrl(),
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

function renderPrimaryButton(href: string, label: string) {
  return `
    <a href="${escapeHtml(href)}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
      ${escapeHtml(label)}
    </a>
  `;
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

export async function sendReportReadyEmail(params: {
  email: string;
  name: string;
  reportId: string;
  score?: number;
  grade?: 'S' | 'A' | 'B' | 'C';
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
  queuedUpgrade?: boolean;
}) {
  const { appName, baseUrl } = getEmailConfig();
  const safeName = escapeHtml(params.name || '用户');
  const resultUrl = `${baseUrl}/result/${encodeURIComponent(params.reportId)}`;
  const deliveryTierLabel = params.deliveryTier === 'expert'
    ? 'S级专家版'
    : params.deliveryTier === 'enhanced'
      ? '增强版'
      : '可读版';
  const scoreLabel = params.score ? `${params.score} / ${params.grade || 'B'}` : (params.grade || 'B');
  const nextStepCopy = params.queuedUpgrade
    ? '当前先为你送达可阅读版本，后台会继续增强，并在升级完成后再次提醒你。'
    : '这份报告已经完整保存，你现在可以直接打开结果页继续阅读与追问。';

  return sendMailV2({
    to: params.email,
    subject: `${appName} 报告已生成`,
    subtype: 'html',
    text: `${safeName}，你的报告已经生成。当前版本 ${deliveryTierLabel}，质量 ${scoreLabel}。查看报告：${resultUrl}`,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8">
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">你的报告已经生成</h2>
        <p style="margin:0 0 12px">${safeName}，系统已经完成本次测算，并为你保存了专属结果页。</p>
        <p style="margin:0 0 12px">当前版本：<strong>${deliveryTierLabel}</strong></p>
        <p style="margin:0 0 12px">质量评级：<strong>${escapeHtml(scoreLabel)}</strong></p>
        <p style="margin:0 0 16px">${nextStepCopy}</p>
        <a href="${escapeHtml(resultUrl)}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          打开报告
        </a>
        <p style="margin:16px 0 0;color:#6b7280;font-size:13px">如果你在手机上稍后继续阅读，可直接从这封邮件重新打开：${escapeHtml(resultUrl)}</p>
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

export async function sendUserLifecycleEmail(params: {
  email: string;
  name: string;
  stageKey: string;
  stageLabel: string;
  subject: string;
  previewText: string;
  intro: string;
  detail: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  bullets?: string[];
  reportId?: string;
}) {
  const { appName, baseUrl } = getEmailConfig();
  const safeName = escapeHtml(params.name || '用户');
  const bulletsHtml = (params.bullets || [])
    .map((item) => `<li style="margin:0 0 10px">${escapeHtml(item)}</li>`)
    .join('');
  const secondaryLink = params.secondaryCtaLabel && params.secondaryCtaHref
    ? `<a href="${escapeHtml(params.secondaryCtaHref)}" style="margin-left:12px;color:#92400e;text-decoration:none;font-weight:600">${escapeHtml(params.secondaryCtaLabel)}</a>`
    : '';

  return sendMailV2({
    to: params.email,
    subject: params.subject,
    subtype: 'html',
    text: `${params.previewText} ${params.primaryCtaHref}`,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8">
        <div style="margin:0 0 8px;color:#92400e;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase">${escapeHtml(appName)} · ${escapeHtml(params.stageLabel)}</div>
        <h2 style="margin:0 0 16px;font-size:22px;color:#111827">${safeName}，${escapeHtml(params.intro)}</h2>
        <p style="margin:0 0 12px">${escapeHtml(params.detail)}</p>
        ${params.bullets && params.bullets.length > 0 ? `
          <ul style="margin:0 0 16px;padding-left:20px">
            ${bulletsHtml}
          </ul>
        ` : ''}
        <div style="margin:18px 0 0">
          ${renderPrimaryButton(params.primaryCtaHref, params.primaryCtaLabel)}
          ${secondaryLink}
        </div>
        <p style="margin:16px 0 0;color:#6b7280;font-size:13px">
          你可以随时在站内管理订阅状态：${escapeHtml(baseUrl)}/updates
        </p>
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

// ===========================================
// Sub-Spec C (2026-05-10): Life Timing 触达邮件
// ===========================================

interface TimingEmailPoint {
  date: string;
  title: string;
  summary: string;
  todoSuggestions?: string[];
  avoidSuggestions?: string[];
}

/** 月度运势邮件（每月 1 号触发） */
export async function sendTimingMonthlyDigestEmail(params: {
  email: string;
  reportId: string;
  monthLabel: string;
  points: TimingEmailPoint[];
  utmCampaign: string;
  highlightFirstId?: string;
}) {
  const { appName, baseUrl } = getEmailConfig();
  const utmSuffix = `?utm_source=email&utm_medium=monthly&utm_campaign=${encodeURIComponent(params.utmCampaign)}`;
  const baseLink = `${baseUrl}/r/${encodeURIComponent(params.reportId)}${utmSuffix}`;
  const highlightLink = params.highlightFirstId
    ? `${baseLink}&highlight=${encodeURIComponent(params.highlightFirstId)}`
    : baseLink;

  const pointsHtml = params.points.map((p) => `
    <li style="margin:0 0 16px;list-style:none;padding-left:12px;border-left:3px solid #f7d3a1">
      <div style="font-size:13px;color:#6b7280;margin-bottom:4px">${escapeHtml(p.date)}</div>
      <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:6px">${escapeHtml(p.title)}</div>
      <div style="font-size:14px;color:#374151;margin-bottom:8px;line-height:1.7">${escapeHtml(p.summary)}</div>
      ${p.todoSuggestions && p.todoSuggestions.length > 0 ? `
        <div style="margin-top:6px;font-size:13px"><strong style="color:#047857">该做：</strong>${escapeHtml(p.todoSuggestions.join('；'))}</div>
      ` : ''}
      ${p.avoidSuggestions && p.avoidSuggestions.length > 0 ? `
        <div style="margin-top:4px;font-size:13px"><strong style="color:#b91c1c">该避：</strong>${escapeHtml(p.avoidSuggestions.join('；'))}</div>
      ` : ''}
    </li>
  `).join('');

  const subject = params.points.length > 0
    ? `${params.monthLabel}，你会有 ${params.points.length} 个值得留意的时点`
    : `${params.monthLabel} · 来自 ${appName} 的命理时间提醒`;

  return sendMailV2({
    to: params.email,
    subject,
    subtype: 'html',
    text: `${params.monthLabel} 时点提醒。查看完整：${highlightLink}`,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8;max-width:600px">
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827">${escapeHtml(params.monthLabel)}</h2>
        <p style="margin:0 0 20px;color:#6b7280;font-size:14px">
          ${params.points.length > 0
            ? `下面是这个月需要你留意的 ${params.points.length} 个时点。`
            : '这个月相对平稳，没有特别需要留意的时点。'}
        </p>
        ${params.points.length > 0 ? `<ul style="margin:0 0 24px;padding:0">${pointsHtml}</ul>` : ''}
        <a href="${escapeHtml(highlightLink)}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          看完整的本月时间地图
        </a>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:12px">
          你订阅了 ${appName} 的命理时间提醒。
          <a href="${escapeHtml(baseUrl)}/unsubscribe?email=${encodeURIComponent(params.email)}" style="color:#9ca3af">退订</a>
        </p>
      </div>
    `,
  });
}

/** 节气邮件 */
export async function sendTimingSolarTermEmail(params: {
  email: string;
  reportId: string;
  termName: string;
  termDate: string;
  summary: string;
  todoSuggestions: string[];
  avoidSuggestions: string[];
  utmCampaign: string;
}) {
  const { appName, baseUrl } = getEmailConfig();
  const link = `${baseUrl}/r/${encodeURIComponent(params.reportId)}?utm_source=email&utm_medium=solar_term&utm_campaign=${encodeURIComponent(params.utmCampaign)}`;

  return sendMailV2({
    to: params.email,
    subject: `${params.termName}前 7 天 · 你的过渡期来了`,
    subtype: 'html',
    text: `${params.termName}（${params.termDate}）前 7 天：${params.summary}`,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8;max-width:600px">
        <h2 style="margin:0 0 8px;font-size:22px;color:#111827">${escapeHtml(params.termName)} · ${escapeHtml(params.termDate)}</h2>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px">命理上能量切换的关键 7 天</p>
        <p style="margin:0 0 16px;font-size:15px">${escapeHtml(params.summary)}</p>
        <div style="background:#fefce8;border:1px solid #fde047;padding:12px 16px;border-radius:8px;margin:16px 0">
          <div style="font-size:13px"><strong style="color:#047857">该做：</strong>${escapeHtml(params.todoSuggestions.join('；'))}</div>
          <div style="margin-top:6px;font-size:13px"><strong style="color:#b91c1c">该避：</strong>${escapeHtml(params.avoidSuggestions.join('；'))}</div>
        </div>
        <a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          看你完整的时间地图
        </a>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:12px">
          你订阅了 ${appName} 的节气提醒。
          <a href="${escapeHtml(baseUrl)}/unsubscribe?email=${encodeURIComponent(params.email)}" style="color:#9ca3af">退订</a>
        </p>
      </div>
    `,
  });
}

/** 重大事件邮件（太岁年 / 换大运 / 岁运并临） */
export async function sendTimingMajorEventEmail(params: {
  email: string;
  reportId: string;
  eventType: 'tai_sui' | 'dayun_shift' | 'sui_yun_bing_lin';
  eventLabel: string;
  summary: string;
  todoSuggestions: string[];
  avoidSuggestions: string[];
  utmCampaign: string;
}) {
  const { appName, baseUrl } = getEmailConfig();
  const link = `${baseUrl}/r/${encodeURIComponent(params.reportId)}?utm_source=email&utm_medium=major_event&utm_campaign=${encodeURIComponent(params.utmCampaign)}`;

  return sendMailV2({
    to: params.email,
    subject: `${params.eventLabel} · 你需要先知道这件事`,
    subtype: 'html',
    text: `${params.eventLabel}：${params.summary}`,
    content: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;line-height:1.8;max-width:600px">
        <h2 style="margin:0 0 8px;font-size:22px;color:#dc2626">${escapeHtml(params.eventLabel)}</h2>
        <p style="margin:0 0 16px;color:#6b7280;font-size:14px">这是命理意义上的关键节点，提前告诉你</p>
        <p style="margin:0 0 16px;font-size:15px">${escapeHtml(params.summary)}</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;padding:12px 16px;border-radius:8px;margin:16px 0">
          <div style="font-size:13px"><strong style="color:#047857">该做：</strong>${escapeHtml(params.todoSuggestions.join('；'))}</div>
          <div style="margin-top:6px;font-size:13px"><strong style="color:#b91c1c">该避：</strong>${escapeHtml(params.avoidSuggestions.join('；'))}</div>
        </div>
        <a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#111827;color:#f7d3a1;text-decoration:none;font-weight:700">
          看你完整的时间地图
        </a>
        <p style="margin:24px 0 0;color:#9ca3af;font-size:12px">
          你订阅了 ${appName} 的命理提醒。
          <a href="${escapeHtml(baseUrl)}/unsubscribe?email=${encodeURIComponent(params.email)}" style="color:#9ca3af">退订</a>
        </p>
      </div>
    `,
  });
}
