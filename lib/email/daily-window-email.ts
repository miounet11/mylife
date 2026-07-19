/**
 * Light educational daily-window email body.
 * Date-seeded tip only — never personal 八字 / 日主 / 用神.
 */

import { dailyWindowChrome, getDailyWindowCopy } from '@/lib/daily/window-copy';
import {
  type EmailLocale,
  getEmailChrome,
  pickLocaleString,
  resolveEmailLocale,
} from '@/lib/email-locale';
import { escapeHtml, renderBrandedEmail, renderInfoCard } from '@/lib/email-layout';
import { getAppBaseUrl, getMailAppName } from '@/lib/env';

export type BuildDailyWindowEmailInput = {
  locale?: string | null;
  date?: Date;
  email?: string | null;
  /** UTM campaign (defaults to YYYY-MM-DD local). */
  utmCampaign?: string;
};

export type BuildDailyWindowEmailResult = {
  subject: string;
  html: string;
  text: string;
  locale: EmailLocale;
  tip: string;
  dateLabel: string;
  dayOfYear: number;
  tipIndex: number;
};

function formatDateLabel(date: Date, locale: EmailLocale): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const key = `${y}-${m}-${d}`;
  if (locale === 'en') return key;
  return pickLocaleString(locale, {
    'zh-CN': `${y} 年 ${Number(m)} 月 ${Number(d)} 日`,
    'zh-Hant': `${y} 年 ${Number(m)} 月 ${Number(d)} 日`,
    en: key,
  });
}

function defaultCampaign(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Build a short educational daily email (subject + branded html + text).
 * Content comes from `lib/daily/window-copy.ts` tip-of-the-day.
 */
export function buildDailyWindowEmail(
  input: BuildDailyWindowEmailInput = {},
): BuildDailyWindowEmailResult {
  const date = input.date instanceof Date && !Number.isNaN(input.date.getTime())
    ? input.date
    : new Date();
  const locale = resolveEmailLocale({
    locale: input.locale,
    email: input.email,
  });
  const appName = getMailAppName();
  const baseUrl = getAppBaseUrl().replace(/\/$/, '');
  const chrome = getEmailChrome(locale);
  const stripChrome = dailyWindowChrome(locale === 'en' ? 'en' : 'zh-CN');
  const tipPack = getDailyWindowCopy(date, locale === 'en' ? 'en' : 'zh-CN');
  const dateLabel = formatDateLabel(date, locale);
  const campaign = (input.utmCampaign || defaultCampaign(date)).trim() || defaultCampaign(date);

  const utm = new URLSearchParams({
    utm_source: 'email',
    utm_medium: 'daily_window',
    utm_campaign: campaign,
  });

  const yearWindowUrl = `${baseUrl}/tools/timing-yearly-window?${utm.toString()}`;
  const updatesUrl = `${baseUrl}/updates?${utm.toString()}`;
  const homeUrl = `${baseUrl}/?${utm.toString()}`;

  const subject = pickLocaleString(locale, {
    'zh-CN': `${dateLabel} · 今日窗口轻提醒`,
    'zh-Hant': `${dateLabel} · 今日窗口輕提醒`,
    en: `${dateLabel} · Today’s window tip`,
  });

  const title = pickLocaleString(locale, {
    'zh-CN': '今日窗口',
    'zh-Hant': '今日窗口',
    en: 'Today’s window',
  });

  const intro = pickLocaleString(locale, {
    'zh-CN': '一条通用节奏提示——不绑定个人命盘，不恐吓，可验证。',
    'zh-Hant': '一條通用節奏提示——不綁定個人命盤，不恐嚇，可驗證。',
    en: 'One generic rhythm tip — not a personal chart, not fear-based, reviewable.',
  });

  const tipTitle = pickLocaleString(locale, {
    'zh-CN': '今日一句',
    'zh-Hant': '今日一句',
    en: 'Tip of the day',
  });

  const bodyHtml = `
    <p style="margin:0 0 14px;color:#65676b;font-size:14px">${escapeHtml(intro)}</p>
    ${renderInfoCard({
      tone: 'blue',
      title: tipTitle,
      bodyHtml: `<p style="margin:0;font-size:15px;line-height:1.75;color:#1c1e21">${escapeHtml(tipPack.text)}</p>`,
    })}
    <p style="margin:0 0 8px;font-size:12px;color:#8a8d91;line-height:1.55">${escapeHtml(stripChrome.disclaimer)}</p>
  `;

  const ctaYear = pickLocaleString(locale, {
    'zh-CN': stripChrome.ctaYear,
    'zh-Hant': '填生日測年度窗口',
    en: stripChrome.ctaYear,
  });
  const ctaUpdates = pickLocaleString(locale, {
    'zh-CN': '打开站内更新',
    'zh-Hant': '打開站內更新',
    en: 'Open site updates',
  });
  const ctaHome = pickLocaleString(locale, {
    'zh-CN': '人生K线',
    'zh-Hant': '人生K線',
    en: 'Life K-Line',
  });

  const footerExtra = pickLocaleString(locale, {
    'zh-CN': `你订阅了 ${appName} 的日常轻提醒（timing:daily）。也可从邮件底部管理订阅。`,
    'zh-Hant': `你訂閱了 ${appName} 的日常輕提醒（timing:daily）。也可從郵件底部管理訂閱。`,
    en: `You subscribed to ${appName} light daily tips (timing:daily). Manage preferences in the footer.`,
  });

  const { html, text: brandedText } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: input.email || undefined,
    preheader: tipPack.text.slice(0, 90),
    eyebrow: stripChrome.eyebrow,
    title,
    bodyHtml,
    primaryCta: {
      href: yearWindowUrl,
      label: ctaYear,
    },
    secondaryCta: {
      href: updatesUrl,
      label: ctaUpdates,
    },
    footerExtra: `${escapeHtml(footerExtra)} · <a href="${escapeHtml(homeUrl)}" style="color:#3b5998;text-decoration:none;font-weight:600">${escapeHtml(ctaHome)}</a>`,
    showUnsubscribe: true,
    // title + primary/secondary CTAs are appended by renderBrandedEmail
    textBody: [
      dateLabel,
      '',
      tipPack.text,
      '',
      stripChrome.disclaimer,
      '',
      `${ctaHome}: ${homeUrl}`,
      chrome.legal,
    ].join('\n'),
  });

  return {
    subject,
    html,
    text: brandedText,
    locale,
    tip: tipPack.text,
    dateLabel,
    dayOfYear: tipPack.dayOfYear,
    tipIndex: tipPack.index,
  };
}
