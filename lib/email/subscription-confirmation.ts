/**
 * Educational subscription confirmation email.
 *
 * Lives outside protected `lib/email.ts` so we can ship without bulk-overwriting
 * production mail. Callers import this module directly.
 *
 * Tone: structure windows / updates — not fear-based 运势.
 * Free, cancel anytime; manage at /updates.
 */

import { sendMailV2 } from '@/mail';
import {
  type EmailLocale,
  type EmailLocaleInput,
  pickLocaleString,
  resolveEmailLocale,
} from '@/lib/email-locale';
import { renderBrandedEmail } from '@/lib/email-layout';
import { getAppBaseUrl, getMailAppName } from '@/lib/env';

export type SubscriptionConfirmationSource =
  | 'result_report'
  | 'login_auto'
  | 'newsletter'
  | 'generic'
  | string;

export type SubscriptionConfirmationOptions = {
  source?: SubscriptionConfirmationSource;
} & EmailLocaleInput & {
  /** Explicit override; wins over language/locale fields. */
  locale?: EmailLocale | string | null;
};

function resolveLocale(email: string, options?: SubscriptionConfirmationOptions): EmailLocale {
  return resolveEmailLocale({
    email,
    language: options?.language,
    locale: options?.locale,
    acceptLanguage: options?.acceptLanguage,
  });
}

function normalizeSource(source?: string | null): 'result_report' | 'login_auto' | 'newsletter' | 'generic' {
  const s = `${source || ''}`.trim().toLowerCase();
  if (s === 'result_report') return 'result_report';
  if (s === 'login_auto') return 'login_auto';
  if (s === 'newsletter') return 'newsletter';
  return 'generic';
}

type CopyPack = {
  title: string;
  subject: string;
  intro: string;
  detail: string;
};

function copyForSource(
  locale: EmailLocale,
  appName: string,
  source: ReturnType<typeof normalizeSource>
): CopyPack {
  if (source === 'result_report') {
    return {
      title: pickLocaleString(locale, {
        'zh-CN': '报告更新提醒已开启',
        'zh-Hant': '報告更新提醒已開啟',
        en: 'Report update notes are on',
      }),
      subject: pickLocaleString(locale, {
        'zh-CN': `${appName} · 报告更新提醒已开启`,
        'zh-Hant': `${appName} · 報告更新提醒已開啟`,
        en: `${appName}: report update notes enabled`,
      }),
      intro: pickLocaleString(locale, {
        'zh-CN': '你已开启这份报告的后续更新。邮件用于跨设备找回报告，以及可选的轻量结构窗口提醒——不是恐吓式「每日运势」。',
        'zh-Hant': '你已開啟這份報告的後續更新。郵件用於跨裝置找回報告，以及可選的輕量結構窗口提醒——不是恐嚇式「每日運勢」。',
        en: 'You enabled follow-ups for this report. Email is for recovering the report across devices and optional light structure-window notes — not fear-based “daily fortune.”',
      }),
      detail: pickLocaleString(locale, {
        'zh-CN': '后续可能收到：月度窗口更新、报告升级完成提醒、关键节点结构提示与精选学习内容。',
        'zh-Hant': '後續可能收到：月度窗口更新、報告升級完成提醒、關鍵節點結構提示與精選學習內容。',
        en: 'You may receive monthly window updates, upgrade notices, key-node structure notes, and curated learning content.',
      }),
    };
  }

  if (source === 'login_auto') {
    return {
      title: pickLocaleString(locale, {
        'zh-CN': '登录后已开启结构窗口更新',
        'zh-Hant': '登入後已開啟結構窗口更新',
        en: 'Structure-window updates enabled after login',
      }),
      subject: pickLocaleString(locale, {
        'zh-CN': `${appName} · 结构窗口更新已开启`,
        'zh-Hant': `${appName} · 結構窗口更新已開啟`,
        en: `${appName}: structure-window updates on`,
      }),
      intro: pickLocaleString(locale, {
        'zh-CN': `登录后已为你开启 ${appName} 的轻量更新：结构窗口与学习提醒，而非恐吓式运势推送。`,
        'zh-Hant': `登入後已為你開啟 ${appName} 的輕量更新：結構窗口與學習提醒，而非恐嚇式運勢推送。`,
        en: `After login we enabled light ${appName} updates: structure windows and learning notes — not fear-based fortune pushes.`,
      }),
      detail: pickLocaleString(locale, {
        'zh-CN': '后续可能收到日常窗口提示、月度结构更新、节气学习内容与报告进展。可在报告页勾选最多 3 项关注重点。',
        'zh-Hant': '後續可能收到日常窗口提示、月度結構更新、節氣學習內容與報告進展。可在報告頁勾選最多 3 項關注重點。',
        en: 'You may get light daily window tips, monthly structure updates, solar-term learning notes, and report progress. Pick up to 3 focus items on the report page.',
      }),
    };
  }

  if (source === 'newsletter') {
    return {
      title: pickLocaleString(locale, {
        'zh-CN': '通讯订阅已生效',
        'zh-Hant': '通訊訂閱已生效',
        en: 'Newsletter subscription confirmed',
      }),
      subject: pickLocaleString(locale, {
        'zh-CN': `${appName} · 通讯订阅已生效`,
        'zh-Hant': `${appName} · 通訊訂閱已生效`,
        en: `${appName}: newsletter confirmed`,
      }),
      intro: pickLocaleString(locale, {
        'zh-CN': `你已订阅 ${appName} 的精选通讯：结构窗口、案例与知识更新——以学习与参考为主。`,
        'zh-Hant': `你已訂閱 ${appName} 的精選通訊：結構窗口、案例與知識更新——以學習與參考為主。`,
        en: `You subscribed to the ${appName} newsletter: structure windows, cases, and knowledge updates — learning-first, not fear-based fortune.`,
      }),
      detail: pickLocaleString(locale, {
        'zh-CN': '后续会收到精选案例、知识文章、产品更新与可选的节点提醒。',
        'zh-Hant': '後續會收到精選案例、知識文章、產品更新與可選的節點提醒。',
        en: 'You will receive featured cases, knowledge pieces, product updates, and optional node notes.',
      }),
    };
  }

  // generic
  return {
    title: pickLocaleString(locale, {
      'zh-CN': '订阅已生效',
      'zh-Hant': '訂閱已生效',
      en: 'Subscription confirmed',
    }),
    subject: pickLocaleString(locale, {
      'zh-CN': `${appName} · 订阅已生效`,
      'zh-Hant': `${appName} · 訂閱已生效`,
      en: `${appName}: subscription confirmed`,
    }),
    intro: pickLocaleString(locale, {
      'zh-CN': `你已成功订阅 ${appName} 的更新内容。我们发送的是结构窗口与学习提醒，不是恐吓式「每日运势」。`,
      'zh-Hant': `你已成功訂閱 ${appName} 的更新內容。我們發送的是結構窗口與學習提醒，不是恐嚇式「每日運勢」。`,
      en: `You are subscribed to ${appName} updates: structure windows and learning notes — not fear-based “daily fortune.”`,
    }),
    detail: pickLocaleString(locale, {
      'zh-CN': '后续会收到精选案例、知识文章、产品更新和重要提醒。',
      'zh-Hant': '後續會收到精選案例、知識文章、產品更新和重要提醒。',
      en: 'You will receive featured cases, knowledge pieces, product updates, and key alerts.',
    }),
  };
}

/**
 * Send educational subscription confirmation email.
 * Free, cancel anytime; manage at /updates.
 */
export async function sendSubscriptionConfirmationEmail(
  email: string,
  options?: SubscriptionConfirmationOptions
) {
  const appName = getMailAppName();
  const baseUrl = getAppBaseUrl().replace(/\/$/, '');
  const locale = resolveLocale(email, options);
  const source = normalizeSource(options?.source);
  const copy = copyForSource(locale, appName, source);

  const freeNote = pickLocaleString(locale, {
    'zh-CN': '完全免费 · 随时可取消。在「管理订阅」里可调整偏好或退订。',
    'zh-Hant': '完全免費 · 隨時可取消。在「管理訂閱」裡可調整偏好或退訂。',
    en: 'Free · cancel anytime. Manage preferences or unsubscribe at “Manage subscription.”',
  });

  const ctaLabel = pickLocaleString(locale, {
    'zh-CN': '管理订阅',
    'zh-Hant': '管理訂閱',
    en: 'Manage subscription',
  });

  const manageUrl = `${baseUrl}/updates`;

  const bodyHtml = `
    <p style="margin:0 0 12px;color:#444950;font-size:14px;line-height:1.7">${copy.intro}</p>
    <p style="margin:0 0 12px;color:#444950;font-size:14px;line-height:1.7">${copy.detail}</p>
    <p style="margin:0 0 4px;color:#65676b;font-size:13px;line-height:1.65">${freeNote}</p>
  `;

  const textLines = [
    copy.subject,
    '',
    copy.intro,
    copy.detail,
    freeNote,
    '',
    `${ctaLabel}: ${manageUrl}`,
  ];

  const { html, text } = renderBrandedEmail({
    locale,
    appName,
    baseUrl,
    email,
    preheader: copy.title,
    title: copy.title,
    bodyHtml,
    primaryCta: { href: manageUrl, label: ctaLabel },
    showUnsubscribe: true,
    textBody: textLines.join('\n'),
  });

  return sendMailV2({
    to: email,
    subject: copy.subject,
    subtype: 'html',
    text,
    content: html,
  });
}
