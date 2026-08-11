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
import {
  type EmailLocale,
  type EmailLocaleInput,
  getEmailChrome,
  localizeText,
  pickLocaleString,
  resolveEmailLocale,
} from '@/lib/email-locale';
import {
  escapeHtml,
  renderBrandedEmail,
  renderInfoCard,
  renderPrimaryButton,
} from '@/lib/email-layout';

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

export type EmailLocaleOptions = EmailLocaleInput & {
  /** Explicit override; wins over language/locale fields. */
  locale?: EmailLocale | string | null;
};

function resolveLocale(email: string, options?: EmailLocaleOptions): EmailLocale {
  return resolveEmailLocale({
    email,
    language: options?.language,
    locale: options?.locale,
    acceptLanguage: options?.acceptLanguage,
  });
}

async function resolveLocaleForEmail(email: string, options?: EmailLocaleOptions): Promise<EmailLocale> {
  if (options?.locale || options?.language || options?.acceptLanguage) {
    return resolveLocale(email, options);
  }
  // Best-effort: read preferences.language when available (prod DB).
  try {
    // Lazy import avoids circular deps with database stubs.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dbMod = require('@/lib/database') as {
      db?: { prepare: (sql: string) => { get: (...args: unknown[]) => unknown } };
    };
    const db = dbMod.db;
    if (db?.prepare) {
      const row = db
        .prepare(
          `SELECT p.language AS language
           FROM users u
           LEFT JOIN preferences p ON p.user_id = u.id
           WHERE lower(u.email) = lower(?)
           LIMIT 1`
        )
        .get(email.trim()) as { language?: string } | undefined;
      if (row?.language) {
        return resolveEmailLocale({ email, language: row.language });
      }
    }
  } catch {
    // ignore — fall back to domain heuristics
  }
  return resolveLocale(email, options);
}

export function isEmailDeliveryConfigured() {
  // HTTP ESP alone is enough for transactional (login codes) — critical for Gmail
  if (process.env.RESEND_API_KEY?.trim() || process.env.BREVO_API_KEY?.trim()) {
    return true;
  }
  const { from, authUser, password, host, hostIp, disableAuth } = getEmailConfig();
  if (disableAuth) {
    return Boolean(from && (host || hostIp));
  }
  return Boolean(from && authUser && password && (host || hostIp));
}

export const deliverMailWithRetry = deliverMailWithRetryRaw;

export async function sendLoginCodeEmail(
  email: string,
  code: string,
  _expiresAt: string,
  options?: EmailLocaleOptions
) {
  const locale = await resolveLocaleForEmail(email, options);
  return sendVerificationCode(email, code, 'login', { locale });
}

export async function sendWelcomeEmail(email: string, name: string, options?: EmailLocaleOptions) {
  const { appName, baseUrl } = getEmailConfig();
  const locale = await resolveLocaleForEmail(email, options);
  const chrome = getEmailChrome(locale);
  const safeName = escapeHtml(name || chrome.defaultGreetingName);

  const title = pickLocaleString(locale, {
    'zh-CN': `欢迎加入 ${appName}`,
    'zh-Hant': `歡迎加入 ${appName}`,
    en: `Welcome to ${appName}`,
  });
  const bodyHtml = `
    <p style="margin:0 0 12px">${safeName}${locale === 'en' ? ',' : '，'}${pickLocaleString(locale, {
      'zh-CN': '你的邮箱已经绑定成功。',
      'zh-Hant': '你的郵箱已經綁定成功。',
      en: ' your email is now linked.',
    })}</p>
    <p style="margin:0 0 12px">${pickLocaleString(locale, {
      'zh-CN': '后续你会收到这些内容：',
      'zh-Hant': '後續你會收到這些內容：',
      en: 'You will receive:',
    })}</p>
    <ul style="margin:0 0 8px;padding-left:20px;color:#444950">
      <li style="margin:0 0 6px">${pickLocaleString(locale, {
        'zh-CN': '登录验证码与账号安全通知',
        'zh-Hant': '登入驗證碼與帳號安全通知',
        en: 'Login codes and account security notices',
      })}</li>
      <li style="margin:0 0 6px">${pickLocaleString(locale, {
        'zh-CN': '内容更新、精选案例与知识文章',
        'zh-Hant': '內容更新、精選案例與知識文章',
        en: 'Content updates, featured cases, and knowledge articles',
      })}</li>
      <li style="margin:0 0 6px">${pickLocaleString(locale, {
        'zh-CN': '重要功能上线与可选活动提醒',
        'zh-Hant': '重要功能上線與可選活動提醒',
        en: 'Product updates and optional event reminders',
      })}</li>
    </ul>
  `;
  const ctaLabel = pickLocaleString(locale, {
    'zh-CN': '管理订阅',
    'zh-Hant': '管理訂閱',
    en: 'Manage subscription',
  });
  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email,
    preheader: title,
    title,
    bodyHtml,
    primaryCta: { href: `${baseUrl}/updates`, label: ctaLabel },
    showUnsubscribe: false,
  });

  return sendMailV2({
    to: email,
    subject: title,
    subtype: 'html',
    text,
    content: html,
  });
}

export async function sendPredictionDueReminderEmail(params: {
  email: string;
  userName?: string | null;
  subject: string;
  html: string;
  text: string;
  utmCampaign?: string;
  itemCount?: number;
  locale?: EmailLocale | string | null;
  language?: string | null;
  acceptLanguage?: string | null;
}) {
  // Caller may pass fully-built html (due-reminder template). Wrap if not already branded.
  const locale = await resolveLocaleForEmail(params.email, params);
  const alreadyBranded = /LIFE KLINE|人生K线|人生K線|Life K-Line/.test(params.html)
    && params.html.includes('<!DOCTYPE html');
  if (alreadyBranded) {
    return sendMailV2({
      to: params.email,
      subject: localizeText(params.subject, locale),
      subtype: 'html',
      text: params.text,
      content: params.html,
    });
  }
  const { appName, baseUrl } = getEmailConfig();
  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    title: params.subject,
    bodyHtml: params.html,
    textBody: params.text,
    showUnsubscribe: true,
  });
  return sendMailV2({
    to: params.email,
    subject: localizeText(params.subject, locale),
    subtype: 'html',
    text,
    content: html,
  });
}

export async function sendSubscriptionConfirmationEmail(
  email: string,
  options?: {
    source?: string;
  } & EmailLocaleOptions
) {
  const { appName, baseUrl } = getEmailConfig();
  const locale = await resolveLocaleForEmail(email, options);
  const isReportSubscription = options?.source === 'result_report';

  const title = isReportSubscription
    ? pickLocaleString(locale, {
        'zh-CN': '月度更新与报告提醒已生效',
        'zh-Hant': '月度更新與報告提醒已生效',
        en: 'Monthly updates & report alerts are on',
      })
    : pickLocaleString(locale, {
        'zh-CN': '订阅已生效',
        'zh-Hant': '訂閱已生效',
        en: 'Subscription confirmed',
      });

  const subject = isReportSubscription
    ? pickLocaleString(locale, {
        'zh-CN': `${appName} 月度更新与报告提醒已生效`,
        'zh-Hant': `${appName} 月度更新與報告提醒已生效`,
        en: `${appName}: monthly updates enabled`,
      })
    : pickLocaleString(locale, {
        'zh-CN': `${appName} 订阅已生效`,
        'zh-Hant': `${appName} 訂閱已生效`,
        en: `${appName}: subscription confirmed`,
      });

  const introBody = isReportSubscription
    ? pickLocaleString(locale, {
        'zh-CN': '你已经成功订阅这份报告的后续更新。',
        'zh-Hant': '你已經成功訂閱這份報告的後續更新。',
        en: 'You are subscribed to follow-ups for this report.',
      })
    : pickLocaleString(locale, {
        'zh-CN': `你已经成功订阅 ${appName} 的更新内容。`,
        'zh-Hant': `你已經成功訂閱 ${appName} 的更新內容。`,
        en: `You are subscribed to ${appName} updates.`,
      });

  const detailBody = isReportSubscription
    ? pickLocaleString(locale, {
        'zh-CN': '后续会收到月度窗口更新、报告升级完成提醒、关键节点通知和精选内容。',
        'zh-Hant': '後續會收到月度窗口更新、報告升級完成提醒、關鍵節點通知和精選內容。',
        en: 'You will get monthly windows, upgrade notices, key-node alerts, and curated content.',
      })
    : pickLocaleString(locale, {
        'zh-CN': '后续会收到精选案例、知识文章、产品更新和重要提醒。',
        'zh-Hant': '後續會收到精選案例、知識文章、產品更新和重要提醒。',
        en: 'You will receive featured cases, knowledge pieces, product updates, and key alerts.',
      });

  const bodyHtml = `
    <p style="margin:0 0 12px">${introBody}</p>
    <p style="margin:0 0 4px">${detailBody}</p>
  `;
  const ctaLabel = pickLocaleString(locale, {
    'zh-CN': '管理订阅',
    'zh-Hant': '管理訂閱',
    en: 'Manage subscription',
  });
  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email,
    preheader: title,
    title,
    bodyHtml,
    primaryCta: { href: `${baseUrl}/updates`, label: ctaLabel },
    showUnsubscribe: true,
  });

  return sendMailV2({
    to: email,
    subject,
    subtype: 'html',
    text,
    content: html,
  });
}

function deliveryTierLabel(
  locale: EmailLocale,
  tier?: 'basic' | 'enhanced' | 'expert'
) {
  if (tier === 'expert') {
    return pickLocaleString(locale, {
      'zh-CN': 'S级专家版',
      'zh-Hant': 'S級專家版',
      en: 'S-tier Expert',
    });
  }
  if (tier === 'enhanced') {
    return pickLocaleString(locale, {
      'zh-CN': '增强版',
      'zh-Hant': '增強版',
      en: 'Enhanced',
    });
  }
  return pickLocaleString(locale, {
    'zh-CN': '可读版',
    'zh-Hant': '可讀版',
    en: 'Readable',
  });
}

export async function sendReportUpgradeReadyEmail(params: {
  email: string;
  name: string;
  reportId: string;
  score?: number;
  grade?: 'S' | 'A' | 'B' | 'C';
  deliveryTier?: 'basic' | 'enhanced' | 'expert';
} & EmailLocaleOptions) {
  const { appName, baseUrl } = getEmailConfig();
  const locale = await resolveLocaleForEmail(params.email, params);
  const chrome = getEmailChrome(locale);
  const safeName = escapeHtml(params.name || chrome.defaultGreetingName);
  const resultUrl = `${baseUrl}/result/${encodeURIComponent(params.reportId)}`;
  const tier = deliveryTierLabel(locale, params.deliveryTier);
  const scoreLabel = params.score ? `${params.score} / ${params.grade || 'B'}` : (params.grade || 'S');

  const title = pickLocaleString(locale, {
    'zh-CN': '你的报告增强已完成',
    'zh-Hant': '你的報告增強已完成',
    en: 'Your report upgrade is ready',
  });
  const subject = pickLocaleString(locale, {
    'zh-CN': `${appName} 报告增强已完成`,
    'zh-Hant': `${appName} 報告增強已完成`,
    en: `${appName}: report upgrade ready`,
  });
  const bodyHtml = `
    <p style="margin:0 0 12px">${safeName}${locale === 'en' ? ',' : '，'}${pickLocaleString(locale, {
      'zh-CN': '系统已经完成这份报告的后台增强。',
      'zh-Hant': '系統已經完成這份報告的後台增強。',
      en: ' background enhancement for this report is complete.',
    })}</p>
    ${renderInfoCard({
      tone: 'blue',
      bodyHtml: `
        <div><strong>${pickLocaleString(locale, { 'zh-CN': '当前版本', 'zh-Hant': '目前版本', en: 'Version' })}：</strong>${escapeHtml(tier)}</div>
        <div style="margin-top:6px"><strong>${pickLocaleString(locale, { 'zh-CN': '质量评级', 'zh-Hant': '品質評級', en: 'Quality' })}：</strong>${escapeHtml(scoreLabel)}</div>
      `,
    })}
    <p style="margin:0 0 4px">${pickLocaleString(locale, {
      'zh-CN': '现在最适合做的，是重新回到结果页看最新结论、月度窗口和行动建议，然后继续把关键判断带去 AI 深问。',
      'zh-Hant': '現在最適合做的，是重新回到結果頁看最新結論、月度窗口和行動建議，然後繼續把關鍵判斷帶去 AI 深問。',
      en: 'Reopen your result page for the latest conclusions, monthly windows, and next actions — then continue deep Q&A.',
    })}</p>
  `;
  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    preheader: title,
    title,
    bodyHtml,
    primaryCta: {
      href: resultUrl,
      label: pickLocaleString(locale, {
        'zh-CN': '查看最新报告',
        'zh-Hant': '查看最新報告',
        en: 'Open latest report',
      }),
    },
    showUnsubscribe: true,
  });

  return sendMailV2({
    to: params.email,
    subject,
    subtype: 'html',
    text,
    content: html,
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
} & EmailLocaleOptions) {
  const { appName, baseUrl } = getEmailConfig();
  const locale = await resolveLocaleForEmail(params.email, params);
  const chrome = getEmailChrome(locale);
  const safeName = escapeHtml(params.name || chrome.defaultGreetingName);
  const resultUrl = `${baseUrl}/result/${encodeURIComponent(params.reportId)}`;
  const tier = deliveryTierLabel(locale, params.deliveryTier);
  const scoreLabel = params.score ? `${params.score} / ${params.grade || 'B'}` : (params.grade || 'B');
  const nextStepCopy = params.queuedUpgrade
    ? pickLocaleString(locale, {
        'zh-CN': '当前先为你送达可阅读版本，后台会继续增强，并在升级完成后再次提醒你。',
        'zh-Hant': '目前先為你送達可閱讀版本，後台會繼續增強，並在升級完成後再次提醒你。',
        en: 'You have a readable version now; we will keep enhancing in the background and notify you again.',
      })
    : pickLocaleString(locale, {
        'zh-CN': '这份报告已经完整保存，你现在可以直接打开结果页继续阅读与追问。',
        'zh-Hant': '這份報告已經完整保存，你現在可以直接打開結果頁繼續閱讀與追問。',
        en: 'Your report is saved. Open the result page to keep reading and asking follow-ups.',
      });

  const title = pickLocaleString(locale, {
    'zh-CN': '你的报告已经生成',
    'zh-Hant': '你的報告已經生成',
    en: 'Your report is ready',
  });
  const subject = pickLocaleString(locale, {
    'zh-CN': `${appName} 报告已生成`,
    'zh-Hant': `${appName} 報告已生成`,
    en: `${appName}: your report is ready`,
  });

  const bodyHtml = `
    <p style="margin:0 0 12px">${safeName}${locale === 'en' ? ',' : '，'}${pickLocaleString(locale, {
      'zh-CN': '系统已经完成本次测算，并为你保存了专属结果页。',
      'zh-Hant': '系統已經完成本次測算，並為你保存了專屬結果頁。',
      en: ' your analysis is complete and a private result page has been saved.',
    })}</p>
    ${renderInfoCard({
      tone: 'blue',
      bodyHtml: `
        <div><strong>${pickLocaleString(locale, { 'zh-CN': '当前版本', 'zh-Hant': '目前版本', en: 'Version' })}：</strong>${escapeHtml(tier)}</div>
        <div style="margin-top:6px"><strong>${pickLocaleString(locale, { 'zh-CN': '质量评级', 'zh-Hant': '品質評級', en: 'Quality' })}：</strong>${escapeHtml(scoreLabel)}</div>
      `,
    })}
    <p style="margin:0 0 4px">${nextStepCopy}</p>
  `;
  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    preheader: title,
    title,
    bodyHtml,
    primaryCta: {
      href: resultUrl,
      label: pickLocaleString(locale, {
        'zh-CN': '打开报告',
        'zh-Hant': '打開報告',
        en: 'Open report',
      }),
    },
    footerExtra: pickLocaleString(locale, {
      'zh-CN': `手机上稍后继续：${resultUrl}`,
      'zh-Hant': `手機上稍後繼續：${resultUrl}`,
      en: `Continue later on mobile: ${resultUrl}`,
    }),
    showUnsubscribe: false,
  });

  return sendMailV2({
    to: params.email,
    subject,
    subtype: 'html',
    text,
    content: html,
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
} & EmailLocaleOptions) {
  const { appName, baseUrl } = getEmailConfig();
  const locale = await resolveLocaleForEmail(params.email, params);
  const chrome = getEmailChrome(locale);
  const safeName = escapeHtml(params.name || chrome.defaultGreetingName);
  const resultUrl = `${baseUrl}/result/${encodeURIComponent(params.reportId)}`;
  const cycle = localizeText(params.cycleLabel, locale);

  const statusLabel = (status: 'push' | 'steady' | 'caution') => {
    if (status === 'push') {
      return pickLocaleString(locale, { 'zh-CN': '适合推进', 'zh-Hant': '適合推進', en: 'Good to push' });
    }
    if (status === 'steady') {
      return pickLocaleString(locale, { 'zh-CN': '适合稳步布局', 'zh-Hant': '適合穩步佈局', en: 'Steady layout' });
    }
    return pickLocaleString(locale, { 'zh-CN': '适合谨慎收缩', 'zh-Hant': '適合謹慎收縮', en: 'Stay cautious' });
  };

  const highlightsHtml = params.monthlyHighlights
    .map((item) => `
      <li style="margin:0 0 10px">
        <strong>${escapeHtml(localizeText(item.label, locale))}</strong>：${escapeHtml(localizeText(item.theme, locale))}（${statusLabel(item.status)}）
      </li>
    `)
    .join('');

  const title = pickLocaleString(locale, {
    'zh-CN': `${cycle} 月度更新`,
    'zh-Hant': `${cycle} 月度更新`,
    en: `${cycle} monthly update`,
  });
  const subject = pickLocaleString(locale, {
    'zh-CN': `${appName} ${cycle}月度更新`,
    'zh-Hant': `${appName} ${cycle}月度更新`,
    en: `${appName} · ${cycle} monthly update`,
  });

  const bodyHtml = `
    <p style="margin:0 0 12px">${safeName}${locale === 'en' ? ',' : '，'}${pickLocaleString(locale, {
      'zh-CN': '这是你本月最值得关注的一版节律摘要。',
      'zh-Hant': '這是你本月最值得關注的一版節律摘要。',
      en: ' here is this month’s rhythm summary worth your attention.',
    })}</p>
    ${renderInfoCard({
      tone: 'blue',
      title: pickLocaleString(locale, { 'zh-CN': '阶段重点', 'zh-Hant': '階段重點', en: 'Stage focus' }),
      bodyHtml: escapeHtml(localizeText(params.stageFocus, locale)),
    })}
    <p style="margin:0 0 12px">${escapeHtml(localizeText(params.summary, locale))}</p>
    ${params.monthlyHighlights.length > 0 ? `
      <div style="margin:8px 0 8px;font-weight:700;color:#1c1e21">${pickLocaleString(locale, {
        'zh-CN': '本月重点窗口',
        'zh-Hant': '本月重點窗口',
        en: 'Key windows this month',
      })}</div>
      <ul style="margin:0 0 8px;padding-left:20px">${highlightsHtml}</ul>
    ` : ''}
  `;

  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    preheader: title,
    title,
    bodyHtml,
    primaryCta: {
      href: resultUrl,
      label: pickLocaleString(locale, {
        'zh-CN': '查看完整报告',
        'zh-Hant': '查看完整報告',
        en: 'View full report',
      }),
    },
    showUnsubscribe: true,
  });

  return sendMailV2({
    to: params.email,
    subject,
    subtype: 'html',
    text,
    content: html,
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
} & EmailLocaleOptions) {
  const { appName, baseUrl } = getEmailConfig();
  const locale = await resolveLocaleForEmail(params.email, params);
  const chrome = getEmailChrome(locale);
  const safeName = escapeHtml(params.name || chrome.defaultGreetingName);
  const bulletsHtml = (params.bullets || [])
    .map((item) => `<li style="margin:0 0 10px">${escapeHtml(localizeText(item, locale))}</li>`)
    .join('');

  const title = `${safeName}${locale === 'en' ? ', ' : '，'}${escapeHtml(localizeText(params.intro, locale))}`;
  // title already has HTML name — renderBrandedEmail escapes title; pass plain
  const plainTitle = `${params.name || chrome.defaultGreetingName}${locale === 'en' ? ', ' : '，'}${params.intro}`;

  const bodyHtml = `
    <p style="margin:0 0 12px">${escapeHtml(localizeText(params.detail, locale))}</p>
    ${params.bullets && params.bullets.length > 0 ? `<ul style="margin:0 0 8px;padding-left:20px">${bulletsHtml}</ul>` : ''}
  `;

  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    preheader: params.previewText,
    eyebrow: `${appName} · ${localizeText(params.stageLabel, locale)}`,
    title: plainTitle,
    bodyHtml,
    primaryCta: {
      href: params.primaryCtaHref,
      label: params.primaryCtaLabel,
    },
    secondaryCta: params.secondaryCtaLabel && params.secondaryCtaHref
      ? { href: params.secondaryCtaHref, label: params.secondaryCtaLabel }
      : undefined,
    showUnsubscribe: true,
  });

  return sendMailV2({
    to: params.email,
    subject: localizeText(params.subject, locale),
    subtype: 'html',
    text: `${localizeText(params.previewText, locale)} ${params.primaryCtaHref}`,
    content: html,
    priority: 'bulk',
  });
}

export async function sendPremiumServiceRequestReceivedEmail(params: {
  email: string;
  name?: string;
  requestId: string;
  reportId?: string;
  serviceLabel: string;
  question: string;
} & EmailLocaleOptions) {
  const { appName, baseUrl } = getEmailConfig();
  const locale = await resolveLocaleForEmail(params.email, params);
  const chrome = getEmailChrome(locale);
  const safeName = escapeHtml(params.name || chrome.defaultGreetingName);
  const resultUrl = params.reportId
    ? `${baseUrl}/result/${encodeURIComponent(params.reportId)}`
    : `${baseUrl}/updates`;
  const service = localizeText(params.serviceLabel, locale);

  const title = pickLocaleString(locale, {
    'zh-CN': `已收到你的${service}需求`,
    'zh-Hant': `已收到你的${service}需求`,
    en: `We received your ${service} request`,
  });
  const subject = pickLocaleString(locale, {
    'zh-CN': `${appName} 已收到你的${service}需求`,
    'zh-Hant': `${appName} 已收到你的${service}需求`,
    en: `${appName}: ${service} request received`,
  });

  const bodyHtml = `
    <p style="margin:0 0 12px">${safeName}${locale === 'en' ? ',' : '，'}${pickLocaleString(locale, {
      'zh-CN': '系统已经记录这次专项需求，后续跟进会围绕这份问题继续展开。',
      'zh-Hant': '系統已經記錄這次專項需求，後續跟進會圍繞這份問題繼續展開。',
      en: ' we logged this specialty request and will follow up around your question.',
    })}</p>
    ${renderInfoCard({
      tone: 'neutral',
      bodyHtml: `
        <div><strong>${pickLocaleString(locale, { 'zh-CN': '需求编号', 'zh-Hant': '需求編號', en: 'Request ID' })}：</strong>${escapeHtml(params.requestId)}</div>
        <div style="margin-top:8px"><strong>${pickLocaleString(locale, { 'zh-CN': '你提交的问题', 'zh-Hant': '你提交的問題', en: 'Your question' })}：</strong>${escapeHtml(params.question)}</div>
      `,
    })}
    <p style="margin:0">${pickLocaleString(locale, {
      'zh-CN': '建议你保留这份报告与后续事件记录，方便继续补充上下文和现实反馈。',
      'zh-Hant': '建議你保留這份報告與後續事件記錄，方便繼續補充上下文和現實反饋。',
      en: 'Keep this report and later event notes so you can add context and real-world feedback.',
    })}</p>
  `;

  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    title,
    bodyHtml,
    primaryCta: {
      href: resultUrl,
      label: pickLocaleString(locale, {
        'zh-CN': '查看相关页面',
        'zh-Hant': '查看相關頁面',
        en: 'Open related page',
      }),
    },
    showUnsubscribe: false,
  });

  return sendMailV2({
    to: params.email,
    subject,
    subtype: 'html',
    text,
    content: html,
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
  // Admin ops always zh-CN for internal tooling consistency.
  const locale: EmailLocale = 'zh-CN';
  const bodyHtml = `
    ${renderInfoCard({
      tone: 'amber',
      title: '新增专项需求单',
      bodyHtml: `
        <div><strong>需求编号：</strong>${escapeHtml(params.requestId)}</div>
        <div style="margin-top:6px"><strong>专项类型：</strong>${escapeHtml(params.serviceLabel)}</div>
        <div style="margin-top:6px"><strong>联系人：</strong>${escapeHtml(params.contactName || '未填写')}</div>
        <div style="margin-top:6px"><strong>联系方式：</strong>${escapeHtml(params.contactValue)}</div>
        <div style="margin-top:6px"><strong>偏好渠道：</strong>${escapeHtml(params.preferredContact || '未填写')}</div>
        <div style="margin-top:6px"><strong>用户问题：</strong>${escapeHtml(params.question)}</div>
        ${resultUrl ? `<div style="margin-top:6px"><strong>关联报告：</strong><a href="${escapeHtml(resultUrl)}" style="color:#3b5998">${escapeHtml(resultUrl)}</a></div>` : ''}
      `,
    })}
  `;
  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    title: '新增专项需求单',
    bodyHtml,
    primaryCta: { href: adminUrl, label: '进入后台跟进' },
    showUnsubscribe: false,
  });

  return sendMailV2({
    to: params.emails,
    subject: `${appName} 新增专项需求单 ${params.requestId}`,
    subtype: 'html',
    text,
    content: html,
  });
}

export async function sendPremiumServiceStatusUpdateEmail(params: {
  email: string;
  name?: string;
  serviceLabel: string;
  statusLabel: string;
  reportId?: string;
  note?: string;
} & EmailLocaleOptions) {
  const { appName, baseUrl } = getEmailConfig();
  const locale = await resolveLocaleForEmail(params.email, params);
  const chrome = getEmailChrome(locale);
  const safeName = escapeHtml(params.name || chrome.defaultGreetingName);
  const resultUrl = params.reportId
    ? `${baseUrl}/result/${encodeURIComponent(params.reportId)}`
    : `${baseUrl}/updates`;
  const service = localizeText(params.serviceLabel, locale);
  const status = localizeText(params.statusLabel, locale);

  const title = pickLocaleString(locale, {
    'zh-CN': `${service}状态已更新`,
    'zh-Hant': `${service}狀態已更新`,
    en: `${service} status updated`,
  });
  const subject = pickLocaleString(locale, {
    'zh-CN': `${appName} ${service}已更新为${status}`,
    'zh-Hant': `${appName} ${service}已更新為${status}`,
    en: `${appName}: ${service} → ${status}`,
  });

  const bodyHtml = `
    <p style="margin:0 0 12px">${safeName}${locale === 'en' ? ',' : '，'}${pickLocaleString(locale, {
      'zh-CN': `当前这项专项服务的状态已经更新为 `,
      'zh-Hant': `目前這項專項服務的狀態已經更新為 `,
      en: ' this specialty service is now ',
    })}<strong>${escapeHtml(status)}</strong>。</p>
    ${params.note ? renderInfoCard({
      tone: 'neutral',
      title: pickLocaleString(locale, { 'zh-CN': '跟进说明', 'zh-Hant': '跟進說明', en: 'Follow-up note' }),
      bodyHtml: escapeHtml(params.note),
    }) : ''}
  `;

  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    title,
    bodyHtml,
    primaryCta: {
      href: resultUrl,
      label: pickLocaleString(locale, {
        'zh-CN': '查看相关页面',
        'zh-Hant': '查看相關頁面',
        en: 'Open related page',
      }),
    },
    showUnsubscribe: false,
  });

  return sendMailV2({
    to: params.email,
    subject,
    subtype: 'html',
    text,
    content: html,
  });
}

// ===========================================
// Life Timing 触达邮件
// ===========================================

interface TimingEmailPoint {
  date: string;
  title: string;
  summary: string;
  todoSuggestions?: string[];
  avoidSuggestions?: string[];
}

function renderTimingPoints(points: TimingEmailPoint[], locale: EmailLocale) {
  const todoLabel = pickLocaleString(locale, { 'zh-CN': '该做', 'zh-Hant': '該做', en: 'Do' });
  const avoidLabel = pickLocaleString(locale, { 'zh-CN': '该避', 'zh-Hant': '該避', en: 'Avoid' });
  return points.map((p) => `
    <li style="margin:0 0 16px;list-style:none;padding-left:12px;border-left:3px solid #3b5998">
      <div style="font-size:12px;color:#65676b;margin-bottom:4px">${escapeHtml(p.date)}</div>
      <div style="font-size:15px;font-weight:700;color:#1c1e21;margin-bottom:6px">${escapeHtml(localizeText(p.title, locale))}</div>
      <div style="font-size:14px;color:#444950;margin-bottom:8px;line-height:1.7">${escapeHtml(localizeText(p.summary, locale))}</div>
      ${p.todoSuggestions && p.todoSuggestions.length > 0 ? `
        <div style="margin-top:6px;font-size:13px"><strong style="color:#2f9e6b">${todoLabel}：</strong>${escapeHtml(localizeText(p.todoSuggestions.join('；'), locale))}</div>
      ` : ''}
      ${p.avoidSuggestions && p.avoidSuggestions.length > 0 ? `
        <div style="margin-top:4px;font-size:13px"><strong style="color:#b56a1a">${avoidLabel}：</strong>${escapeHtml(localizeText(p.avoidSuggestions.join('；'), locale))}</div>
      ` : ''}
    </li>
  `).join('');
}

/** 月度运势邮件（每月 1 号触发） */
export async function sendTimingMonthlyDigestEmail(params: {
  email: string;
  reportId: string;
  monthLabel: string;
  points: TimingEmailPoint[];
  utmCampaign: string;
  highlightFirstId?: string;
} & EmailLocaleOptions) {
  const { appName, baseUrl } = getEmailConfig();
  const locale = await resolveLocaleForEmail(params.email, params);
  const utmSuffix = `?utm_source=email&utm_medium=monthly&utm_campaign=${encodeURIComponent(params.utmCampaign)}`;
  const baseLink = `${baseUrl}/r/${encodeURIComponent(params.reportId)}${utmSuffix}`;
  const highlightLink = params.highlightFirstId
    ? `${baseLink}&highlight=${encodeURIComponent(params.highlightFirstId)}`
    : baseLink;
  const month = localizeText(params.monthLabel, locale);

  const subject = params.points.length > 0
    ? pickLocaleString(locale, {
        'zh-CN': `${month}，你会有 ${params.points.length} 个值得留意的时点`,
        'zh-Hant': `${month}，你會有 ${params.points.length} 個值得留意的時點`,
        en: `${month}: ${params.points.length} timing points to watch`,
      })
    : pickLocaleString(locale, {
        'zh-CN': `${month} · 来自 ${appName} 的命理时间提醒`,
        'zh-Hant': `${month} · 來自 ${appName} 的命理時間提醒`,
        en: `${month} · timing note from ${appName}`,
      });

  const intro = params.points.length > 0
    ? pickLocaleString(locale, {
        'zh-CN': `下面是这个月需要你留意的 ${params.points.length} 个时点。`,
        'zh-Hant': `下面是這個月需要你留意的 ${params.points.length} 個時點。`,
        en: `Here are ${params.points.length} timing points for this month.`,
      })
    : pickLocaleString(locale, {
        'zh-CN': '这个月相对平稳，没有特别需要留意的时点。',
        'zh-Hant': '這個月相對平穩，沒有特別需要留意的時點。',
        en: 'This month looks relatively steady — no sharp timing flags.',
      });

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#65676b">${intro}</p>
    ${params.points.length > 0 ? `<ul style="margin:0 0 8px;padding:0">${renderTimingPoints(params.points, locale)}</ul>` : ''}
  `;

  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    preheader: subject,
    title: month,
    bodyHtml,
    primaryCta: {
      href: highlightLink,
      label: pickLocaleString(locale, {
        'zh-CN': '看完整的本月时间地图',
        'zh-Hant': '看完整的本月時間地圖',
        en: 'Open full monthly map',
      }),
    },
    footerExtra: pickLocaleString(locale, {
      'zh-CN': `你订阅了 ${appName} 的命理时间提醒。`,
      'zh-Hant': `你訂閱了 ${appName} 的命理時間提醒。`,
      en: `You subscribed to ${appName} timing reminders.`,
    }),
    showUnsubscribe: true,
  });

  return sendMailV2({
    to: params.email,
    subject,
    subtype: 'html',
    text,
    content: html,
    priority: 'bulk',
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
} & EmailLocaleOptions) {
  const { appName, baseUrl } = getEmailConfig();
  const locale = await resolveLocaleForEmail(params.email, params);
  const link = `${baseUrl}/r/${encodeURIComponent(params.reportId)}?utm_source=email&utm_medium=solar_term&utm_campaign=${encodeURIComponent(params.utmCampaign)}`;
  const term = localizeText(params.termName, locale);

  const title = `${term} · ${params.termDate}`;
  const subject = pickLocaleString(locale, {
    'zh-CN': `${term}前 7 天 · 你的过渡期来了`,
    'zh-Hant': `${term}前 7 天 · 你的過渡期來了`,
    en: `7 days before ${term} · transition window`,
  });

  const bodyHtml = `
    <p style="margin:0 0 12px;color:#65676b;font-size:14px">${pickLocaleString(locale, {
      'zh-CN': '命理上能量切换的关键 7 天',
      'zh-Hant': '命理上能量切換的關鍵 7 天',
      en: 'A key 7-day energy transition window',
    })}</p>
    <p style="margin:0 0 16px;font-size:15px">${escapeHtml(localizeText(params.summary, locale))}</p>
    ${renderInfoCard({
      tone: 'amber',
      bodyHtml: `
        <div style="font-size:13px"><strong style="color:#2f9e6b">${pickLocaleString(locale, { 'zh-CN': '该做', 'zh-Hant': '該做', en: 'Do' })}：</strong>${escapeHtml(localizeText(params.todoSuggestions.join('；'), locale))}</div>
        <div style="margin-top:6px;font-size:13px"><strong style="color:#b56a1a">${pickLocaleString(locale, { 'zh-CN': '该避', 'zh-Hant': '該避', en: 'Avoid' })}：</strong>${escapeHtml(localizeText(params.avoidSuggestions.join('；'), locale))}</div>
      `,
    })}
  `;

  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    title,
    bodyHtml,
    primaryCta: {
      href: link,
      label: pickLocaleString(locale, {
        'zh-CN': '看你完整的时间地图',
        'zh-Hant': '看你完整的時間地圖',
        en: 'Open your timing map',
      }),
    },
    footerExtra: pickLocaleString(locale, {
      'zh-CN': `你订阅了 ${appName} 的节气提醒。`,
      'zh-Hant': `你訂閱了 ${appName} 的節氣提醒。`,
      en: `You subscribed to ${appName} solar-term reminders.`,
    }),
    showUnsubscribe: true,
  });

  return sendMailV2({
    to: params.email,
    subject,
    subtype: 'html',
    text,
    content: html,
    priority: 'bulk',
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
} & EmailLocaleOptions) {
  const { appName, baseUrl } = getEmailConfig();
  const locale = await resolveLocaleForEmail(params.email, params);
  const link = `${baseUrl}/r/${encodeURIComponent(params.reportId)}?utm_source=email&utm_medium=major_event&utm_campaign=${encodeURIComponent(params.utmCampaign)}`;
  const eventLabel = localizeText(params.eventLabel, locale);

  const subject = pickLocaleString(locale, {
    'zh-CN': `${eventLabel} · 你需要先知道这件事`,
    'zh-Hant': `${eventLabel} · 你需要先知道這件事`,
    en: `${eventLabel} · something to know first`,
  });

  const bodyHtml = `
    <p style="margin:0 0 12px;color:#65676b;font-size:14px">${pickLocaleString(locale, {
      'zh-CN': '这是命理意义上的关键节点，提前告诉你',
      'zh-Hant': '這是命理意義上的關鍵節點，提前告訴你',
      en: 'A key structural node — flagged early for you',
    })}</p>
    <p style="margin:0 0 16px;font-size:15px">${escapeHtml(localizeText(params.summary, locale))}</p>
    ${renderInfoCard({
      tone: 'rose',
      bodyHtml: `
        <div style="font-size:13px"><strong style="color:#2f9e6b">${pickLocaleString(locale, { 'zh-CN': '该做', 'zh-Hant': '該做', en: 'Do' })}：</strong>${escapeHtml(localizeText(params.todoSuggestions.join('；'), locale))}</div>
        <div style="margin-top:6px;font-size:13px"><strong style="color:#b56a1a">${pickLocaleString(locale, { 'zh-CN': '该避', 'zh-Hant': '該避', en: 'Avoid' })}：</strong>${escapeHtml(localizeText(params.avoidSuggestions.join('；'), locale))}</div>
      `,
    })}
  `;

  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    title: eventLabel,
    bodyHtml,
    primaryCta: {
      href: link,
      label: pickLocaleString(locale, {
        'zh-CN': '看你完整的时间地图',
        'zh-Hant': '看你完整的時間地圖',
        en: 'Open your timing map',
      }),
    },
    footerExtra: pickLocaleString(locale, {
      'zh-CN': `你订阅了 ${appName} 的命理提醒。`,
      'zh-Hant': `你訂閱了 ${appName} 的命理提醒。`,
      en: `You subscribed to ${appName} destiny reminders.`,
    }),
    showUnsubscribe: true,
  });

  return sendMailV2({
    to: params.email,
    subject,
    subtype: 'html',
    text,
    content: html,
    priority: 'bulk',
  });
}

// re-export helpers for other mail builders
export { escapeHtml, renderPrimaryButton, renderBrandedEmail, renderInfoCard };
export type { EmailLocale };
