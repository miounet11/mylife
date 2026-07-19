/**
 * EN/zh chrome for EmailTrustPanel (subscription / messages / profile / report).
 * Honest educational framing — engine + professional expression, not superstition marketing.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

export function emailTrustCopy(locale: SiteLocale) {
  return {
    compactTitle: pick(locale, {
      'zh-CN': '专业可追溯的邮件服务',
      'zh-Hant': '專業可追溯的郵件服務',
      en: 'Professional, auditable email',
    }),
    compactLink: pick(locale, {
      'zh-CN': '查看我的邮件记录 →',
      'zh-Hant': '查看我的郵件記錄 →',
      en: 'View my email history →',
    }),
    badge: pick(locale, {
      'zh-CN': '专业可信',
      'zh-Hant': '專業可信',
      en: 'Professional & trusted',
    }),
    title: pick(locale, {
      'zh-CN': '我们如何把专业判断送到你的邮箱',
      'zh-Hant': '我們如何把專業判斷送到你的郵箱',
      en: 'How structured judgment reaches your inbox',
    }),
    description: pick(locale, {
      'zh-CN':
        '人生K线的邮件不是单向群发。你会看到完整发送记录，也可以对任何提醒继续追问，获得基于报告上下文的专业回复。',
      'zh-Hant':
        '人生K線的郵件不是單向群發。你會看到完整發送記錄，也可以對任何提醒繼續追問，獲得基於報告上下文的專業回覆。',
      en: 'Life K-Line mail is not one-way blast. You get a full send archive and can follow up on any reminder for a reply grounded in your report context.',
    }),
    enterMailCenter: pick(locale, {
      'zh-CN': '进入邮件中心',
      'zh-Hant': '進入郵件中心',
      en: 'Open mail center',
    }),
    manageSubscription: pick(locale, {
      'zh-CN': '管理订阅设置',
      'zh-Hant': '管理訂閱設定',
      en: 'Manage subscription',
    }),
    items: [
      {
        title: pick(locale, {
          'zh-CN': '确定性引擎 + 专业表达',
          'zh-Hant': '確定性引擎 + 專業表達',
          en: 'Deterministic engine + professional wording',
        }),
        text: pick(locale, {
          'zh-CN':
            '运势判断来自确定性命理引擎，邮件文案由专业表达层整理，避免空泛迷信话术。',
          'zh-Hant':
            '運勢判斷來自確定性命理引擎，郵件文案由專業表達層整理，避免空泛迷信話術。',
          en: 'Judgments come from a deterministic structure engine; copy is rewritten by a professional layer—no vague superstition slogans.',
        }),
      },
      {
        title: pick(locale, {
          'zh-CN': '发送记录可回看',
          'zh-Hant': '發送記錄可回看',
          en: 'Send history you can re-read',
        }),
        text: pick(locale, {
          'zh-CN': '你收到的每封提醒都会在站内归档，随时查看主题、摘要与发送时间。',
          'zh-Hant': '你收到的每封提醒都會在站內歸檔，隨時查看主題、摘要與發送時間。',
          en: 'Every reminder is archived on-site—subject, summary, and send time anytime.',
        }),
      },
      {
        title: pick(locale, {
          'zh-CN': '支持追问与回复',
          'zh-Hant': '支援追問與回覆',
          en: 'Follow-ups and replies',
        }),
        text: pick(locale, {
          'zh-CN':
            '对任何一封邮件继续追问，系统会结合你的报告上下文生成专业回复，并同步发回邮箱。',
          'zh-Hant':
            '對任何一封郵件繼續追問，系統會結合你的報告上下文生成專業回覆，並同步發回郵箱。',
          en: 'Ask about any message; replies use your report context and can land back in your inbox.',
        }),
      },
      {
        title: pick(locale, {
          'zh-CN': '订阅完全可控',
          'zh-Hant': '訂閱完全可控',
          en: 'Fully controllable subscription',
        }),
        text: pick(locale, {
          'zh-CN':
            '日常提醒、月度窗口、报告更新等都可逐项开关，最多选 3 项重点关注。',
          'zh-Hant':
            '日常提醒、月度窗口、報告更新等都可逐項開關，最多選 3 項重點關注。',
          en: 'Toggle daily check-ins, monthly windows, and report updates—pick up to 3 focus items.',
        }),
      },
    ] as const,
  };
}
