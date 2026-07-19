/**
 * Timing daily reminder email (personal report-linked, educational tone).
 *
 * Lives outside protected `lib/email.ts` so we can ship without bulk-overwriting
 * production mail. Cron imports this module directly.
 *
 * Content: focus items + light daily tip — no invented 日主/用神 claims.
 */

import { sendMailV2 } from '@/mail';
import type { EmailFocusItem } from '@/lib/email-subscription-focus';
import {
  type EmailLocale,
  type EmailLocaleInput,
  localizeText,
  pickLocaleString,
  resolveEmailLocale,
} from '@/lib/email-locale';
import { escapeHtml, renderBrandedEmail, renderInfoCard } from '@/lib/email-layout';
import { getAppBaseUrl, getMailAppName } from '@/lib/env';

export type TimingDailyReminderParams = {
  email: string;
  reportId: string;
  dateLabel: string;
  focusItems?: EmailFocusItem[];
  highlights?: string[];
  dailyTip?: string;
  cautionTip?: string;
  utmCampaign: string;
  /** Optional HTML footer already localized by caller */
  profileArchiveFooterHtml?: string;
} & EmailLocaleInput & {
  locale?: EmailLocale | string | null;
};

function resolveLocale(email: string, options?: TimingDailyReminderParams): EmailLocale {
  return resolveEmailLocale({
    email,
    language: options?.language,
    locale: options?.locale,
    acceptLanguage: options?.acceptLanguage,
  });
}

/**
 * Send report-linked daily timing reminder.
 * Mirrors subject/preview expectations of timing email cron (`category: daily`).
 */
export async function sendTimingDailyReminderEmail(params: TimingDailyReminderParams) {
  const appName = getMailAppName();
  const baseUrl = getAppBaseUrl();
  const locale = resolveLocale(params.email, params);
  const dateLabel = localizeText(params.dateLabel || '', locale) || params.dateLabel;
  const campaign = encodeURIComponent(params.utmCampaign || dateLabel);
  const link = `${baseUrl}/r/${encodeURIComponent(params.reportId)}?utm_source=email&utm_medium=timing_daily&utm_campaign=${campaign}`;

  const highlights = (params.highlights || [])
    .map((h) => `${h || ''}`.trim())
    .filter(Boolean)
    .slice(0, 5);
  const dailyTip =
    `${params.dailyTip || ''}`.trim()
    || pickLocaleString(locale, {
      'zh-CN': '今天先稳住节奏，把一件最重要的小事做完。',
      'zh-Hant': '今天先穩住節奏，把一件最重要的小事做完。',
      en: 'Keep a steady pace today — finish one small important thing.',
    });
  const cautionTip =
    `${params.cautionTip || ''}`.trim()
    || pickLocaleString(locale, {
      'zh-CN': '避免同时推进多个高成本决定。',
      'zh-Hant': '避免同時推進多個高成本決定。',
      en: 'Avoid pushing several high-cost decisions at once.',
    });

  const subject = pickLocaleString(locale, {
    'zh-CN': `${dateLabel} · 今日窗口提醒`,
    'zh-Hant': `${dateLabel} · 今日窗口提醒`,
    en: `${dateLabel} · today’s timing window`,
  });

  const intro = pickLocaleString(locale, {
    'zh-CN': '结合你的报告关注点，给今天一个可执行的轻提醒（结构参考，非恐吓式运势）。',
    'zh-Hant': '結合你的報告關注點，給今天一個可執行的輕提醒（結構參考，非恐嚇式運勢）。',
    en: 'A light, actionable note from your report focus — structure reference, not fortune fear.',
  });

  const highlightHtml =
    highlights.length > 0
      ? `<ul style="margin:0 0 16px;padding:0 0 0 18px;color:#444950;font-size:14px;line-height:1.7">${highlights
          .map((h) => `<li style="margin:0 0 6px">${escapeHtml(localizeText(h, locale))}</li>`)
          .join('')}</ul>`
      : '';

  const tipsCard = renderInfoCard({
    tone: 'amber',
    bodyHtml: `
      <div style="font-size:13px;line-height:1.65">
        <strong style="color:#2f9e6b">${pickLocaleString(locale, {
          'zh-CN': '今天适合',
          'zh-Hant': '今天適合',
          en: 'Favor today',
        })}：</strong>${escapeHtml(localizeText(dailyTip, locale))}
      </div>
      <div style="margin-top:8px;font-size:13px;line-height:1.65">
        <strong style="color:#b56a1a">${pickLocaleString(locale, {
          'zh-CN': '今天注意',
          'zh-Hant': '今天注意',
          en: 'Watch today',
        })}：</strong>${escapeHtml(localizeText(cautionTip, locale))}
      </div>
    `,
  });

  const footerExtraParts = [
    pickLocaleString(locale, {
      'zh-CN': `你订阅了 ${appName} 的每日窗口提醒。`,
      'zh-Hant': `你訂閱了 ${appName} 的每日窗口提醒。`,
      en: `You subscribed to ${appName} daily timing notes.`,
    }),
  ];
  if (params.profileArchiveFooterHtml) {
    footerExtraParts.push(params.profileArchiveFooterHtml);
  }

  const bodyHtml = `
    <p style="margin:0 0 14px;color:#65676b;font-size:14px;line-height:1.65">${intro}</p>
    ${highlightHtml}
    ${tipsCard}
  `;

  const textLines = [
    subject,
    '',
    intro,
    ...highlights.map((h) => `· ${localizeText(h, locale)}`),
    '',
    `${pickLocaleString(locale, { 'zh-CN': '今天适合', 'zh-Hant': '今天適合', en: 'Favor today' })}：${localizeText(dailyTip, locale)}`,
    `${pickLocaleString(locale, { 'zh-CN': '今天注意', 'zh-Hant': '今天注意', en: 'Watch today' })}：${localizeText(cautionTip, locale)}`,
    '',
    link,
  ];

  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email: params.email,
    preheader: subject,
    title: pickLocaleString(locale, {
      'zh-CN': '今日窗口',
      'zh-Hant': '今日窗口',
      en: 'Today’s window',
    }),
    bodyHtml,
    primaryCta: {
      href: link,
      label: pickLocaleString(locale, {
        'zh-CN': '打开时间地图',
        'zh-Hant': '打開時間地圖',
        en: 'Open timing map',
      }),
    },
    footerExtra: footerExtraParts.join('<br/>'),
    textBody: textLines.join('\n'),
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
