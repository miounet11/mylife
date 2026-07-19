/**
 * EN/zh chrome for updates hub (/updates, /updates/messages) + subscription panel.
 * Preference labels: honest educational framing — structure windows & check-ins,
 * not fear-based “daily fortune.” Keep user email / API focus labels as-is.
 * zh-Hant falls back to simplified conversion unless a traditional string is provided.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';
import type { ResolvedEmailSubscriptionPreferenceGroup } from '@/lib/email-subscription-focus';
import { MAX_EMAIL_FOCUS_ITEMS } from '@/lib/email-subscription-focus';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Page hero + SEO for /updates */
export function updatesPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '订阅与更新中心',
      'zh-Hant': '訂閱與更新中心',
      en: 'Subscription & updates',
    }),
    metaDescription: pick(locale, {
      'zh-CN': '管理运势提醒、月度更新与邮件订阅偏好。',
      'zh-Hant': '管理運勢提醒、月度更新與郵件訂閱偏好。',
      en: 'Manage rhythm reminders, monthly windows, and email preferences — educational notes, cancel anytime.',
    }),
    headerCta: pick(locale, {
      'zh-CN': '开始分析',
      'zh-Hant': '開始分析',
      en: 'Start analysis',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '更新中心',
      'zh-Hant': '更新中心',
      en: 'Updates',
    }),
    title: pick(locale, {
      'zh-CN': '订阅设置与邮件偏好',
      'zh-Hant': '訂閱設定與郵件偏好',
      en: 'Subscription & email preferences',
    }),
    description: pick(locale, {
      'zh-CN': '控制日常提醒、月度窗口与报告更新通知；所有邮件都会在站内归档，可随时追问。',
      'zh-Hant': '控制日常提醒、月度窗口與報告更新通知；所有郵件都會在站內歸檔，可隨時追問。',
      en: 'Control daily check-ins, monthly windows, and report-update mail. Messages archive on-site so you can follow up anytime.',
    }),
    linkMailCenter: pick(locale, {
      'zh-CN': '邮件中心',
      'zh-Hant': '郵件中心',
      en: 'Mail center',
    }),
    stripTitle: pick(locale, {
      'zh-CN': '消息类型',
      'zh-Hant': '消息類型',
      en: 'Message types',
    }),
  };
}

/** Page hero + SEO for /updates/messages */
export function messagesPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '邮件中心 | 人生K线',
      'zh-Hant': '郵件中心 | 人生K線',
      en: 'Mail center | Life K-Line',
    }),
    metaDescription: pick(locale, {
      'zh-CN': '查看运势提醒与报告邮件发送记录，继续追问并获得专业回复。',
      'zh-Hant': '查看運勢提醒與報告郵件發送記錄，繼續追問並獲得專業回覆。',
      en: 'Review reminder and report emails, then follow up for structured professional replies.',
    }),
    headerCta: pick(locale, {
      'zh-CN': '开始分析',
      'zh-Hant': '開始分析',
      en: 'Start analysis',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '邮件中心',
      'zh-Hant': '郵件中心',
      en: 'Mail center',
    }),
    title: pick(locale, {
      'zh-CN': '我的邮件与专业回复',
      'zh-Hant': '我的郵件與專業回覆',
      en: 'My mail & professional replies',
    }),
    description: pick(locale, {
      'zh-CN':
        '这里归档你收到的运势提醒、报告更新和系统通知。任何一封邮件都可以继续追问，我们会用专业引擎结合 LLM 表达层给出回复。',
      'zh-Hant':
        '這裡歸檔你收到的運勢提醒、報告更新和系統通知。任何一封郵件都可以繼續追問，我們會用專業引擎結合 LLM 表達層給出回覆。',
      en: 'Archive of rhythm reminders, report updates, and system notices. Follow up on any message—replies combine the deterministic engine with a professional expression layer.',
    }),
    linkSubscription: pick(locale, {
      'zh-CN': '订阅设置',
      'zh-Hant': '訂閱設定',
      en: 'Subscription settings',
    }),
    linkLogin: pick(locale, {
      'zh-CN': '登录后自动加载',
      'zh-Hant': '登入後自動載入',
      en: 'Sign in to auto-load',
    }),
  };
}

/** Preference group/option chrome keyed by group.key / option.tag (honest educational EN). */
const PREF_GROUP: Record<string, { title: Tri; description: Tri }> = {
  timing: {
    title: {
      'zh-CN': '运势与时序提醒',
      'zh-Hant': '運勢與時序提醒',
      en: 'Rhythm & timing notes',
    },
    description: {
      'zh-CN': '围绕你的测算结果，提醒你日常该注意的细节和关键时间点。',
      'zh-Hant': '圍繞你的測算結果，提醒你日常該注意的細節和關鍵時間點。',
      en: 'Light check-ins around structure windows and stages from your chart—educational, not scare tactics.',
    },
  },
  report: {
    title: {
      'zh-CN': '报告与补全',
      'zh-Hant': '報告與補全',
      en: 'Reports & completion',
    },
    description: {
      'zh-CN': '和你生成过的报告直接相关的后续更新。',
      'zh-Hant': '和你生成過的報告直接相關的後續更新。',
      en: 'Follow-ups tied to reports you already generated.',
    },
  },
  content: {
    title: {
      'zh-CN': '内容与产品动态',
      'zh-Hant': '內容與產品動態',
      en: 'Content & product updates',
    },
    description: {
      'zh-CN': '站点精选内容、案例和产品能力更新。',
      'zh-Hant': '站點精選內容、案例和產品能力更新。',
      en: 'Selected articles, cases, and product capability notes.',
    },
  },
};

const PREF_OPTION: Record<string, { label: Tri; description: Tri }> = {
  'timing:daily': {
    label: {
      'zh-CN': '日常运势细节',
      'zh-Hant': '日常運勢細節',
      en: 'Daily rhythm check-in',
    },
    description: {
      'zh-CN': '每天一条轻提醒：节奏提示与可验证动作，不恐吓、不替代完整报告。',
      'zh-Hant': '每天一條輕提醒：節奏提示與可驗證動作，不恐嚇、不替代完整報告。',
      en: 'One light daily note: pace hints and verifiable actions—no fear copy, not a full report substitute.',
    },
  },
  'timing:monthly': {
    label: {
      'zh-CN': '月度窗口汇总',
      'zh-Hant': '月度窗口彙總',
      en: 'Monthly window summary',
    },
    description: {
      'zh-CN': '每月初发送本月值得留意的时点列表。',
      'zh-Hant': '每月初發送本月值得留意的時點列表。',
      en: 'Early each month: structure windows worth watching this month.',
    },
  },
  'timing:solar_terms': {
    label: {
      'zh-CN': '节气过渡提醒',
      'zh-Hant': '節氣過渡提醒',
      en: 'Seasonal transition notes',
    },
    description: {
      'zh-CN': '立春、立夏、立秋、立冬前 7 天的生活建议。',
      'zh-Hant': '立春、立夏、立秋、立冬前 7 天的生活建議。',
      en: 'Practical notes ~7 days before the four major solar-term turns.',
    },
  },
  'timing:major_events': {
    label: {
      'zh-CN': '命理大事通知',
      'zh-Hant': '命理大事通知',
      en: 'Major stage notices',
    },
    description: {
      'zh-CN': '本命年、换大运、岁运并临等重大节点单独提醒。',
      'zh-Hant': '本命年、換大運、歲運並臨等重大節點單獨提醒。',
      en: 'Separate notices for major stage nodes (e.g. dayun change, year-luck overlap).',
    },
  },
  monthly_report: {
    label: {
      'zh-CN': '月度报告更新',
      'zh-Hant': '月度報告更新',
      en: 'Monthly report updates',
    },
    description: {
      'zh-CN': '报告关联的月度复盘和窗口变化。',
      'zh-Hant': '報告關聯的月度複盤和窗口變化。',
      en: 'Monthly review notes and window changes linked to your report.',
    },
  },
  report_upgrade: {
    label: {
      'zh-CN': '报告补全完成',
      'zh-Hant': '報告補全完成',
      en: 'Report completion ready',
    },
    description: {
      'zh-CN': '后台补全结束后通知你回来查看完整版。',
      'zh-Hant': '後台補全結束後通知你回來查看完整版。',
      en: 'Notify when background completion finishes so you can open the full version.',
    },
  },
  knowledge_updates: {
    label: {
      'zh-CN': '知识与案例',
      'zh-Hant': '知識與案例',
      en: 'Knowledge & cases',
    },
    description: {
      'zh-CN': '精选文章、案例解读和命理知识更新。',
      'zh-Hant': '精選文章、案例解讀和命理知識更新。',
      en: 'Selected articles, case reads, and educational knowledge updates.',
    },
  },
  updates: {
    label: {
      'zh-CN': '产品动态',
      'zh-Hant': '產品動態',
      en: 'Product updates',
    },
    description: {
      'zh-CN': '新功能、体验优化和重要公告。',
      'zh-Hant': '新功能、體驗優化和重要公告。',
      en: 'New features, UX improvements, and important notices.',
    },
  },
};

/** Localize preference group titles/labels for UI display (enabled flags unchanged). */
export function localizePreferenceGroups(
  groups: ResolvedEmailSubscriptionPreferenceGroup[],
  locale: SiteLocale,
): ResolvedEmailSubscriptionPreferenceGroup[] {
  if (locale === 'zh-CN') return groups;
  return groups.map((group) => {
    const g = PREF_GROUP[group.key];
    return {
      ...group,
      title: g ? pick(locale, g.title) : group.title,
      description: g ? pick(locale, g.description) : group.description,
      options: group.options.map((option) => {
        const o = PREF_OPTION[option.tag];
        if (!o) return option;
        return {
          ...option,
          label: pick(locale, o.label),
          description: pick(locale, o.description),
        };
      }),
    };
  });
}

/** Client chrome: /updates SubscriptionSettingsPanel */
export function subscriptionSettingsCopy(locale: SiteLocale) {
  return {
    sectionEyebrow: pick(locale, {
      'zh-CN': '订阅设置',
      'zh-Hant': '訂閱設定',
      en: 'Subscription',
    }),
    sectionTitle: pick(locale, {
      'zh-CN': '管理你想收到的邮件类型',
      'zh-Hant': '管理你想收到的郵件類型',
      en: 'Choose which emails you want',
    }),
    sectionIntro: pick(locale, {
      'zh-CN':
        '按类别开关运势提醒、报告更新和内容动态；还可以为日常提醒指定最多 3 个重点关注。提醒保持教育向：结构窗口与可验证动作，非恐吓式每日运势。',
      'zh-Hant':
        '按類別開關運勢提醒、報告更新和內容動態；還可以為日常提醒指定最多 3 個重點關注。提醒保持教育向：結構窗口與可驗證動作，非恐嚇式每日運勢。',
      en: `Toggle rhythm notes, report updates, and content by category. Optionally pick up to ${MAX_EMAIL_FOCUS_ITEMS} daily focus items. Educational framing only—structure windows and check-ins, not fear-based “daily fortune.”`,
    }),
    emailPlaceholder: pick(locale, {
      'zh-CN': '输入订阅邮箱',
      'zh-Hant': '輸入訂閱郵箱',
      en: 'Email for light reminders',
    }),
    loadSettings: pick(locale, {
      'zh-CN': '加载设置',
      'zh-Hant': '載入設定',
      en: 'Load settings',
    }),
    noRecordYet: pick(locale, {
      'zh-CN': '这个邮箱还没有订阅记录，可以先开启默认订阅。',
      'zh-Hant': '這個郵箱還沒有訂閱記錄，可以先開啟預設訂閱。',
      en: 'No subscription for this email yet. You can enable defaults first.',
    }),
    lookupFailed: pick(locale, {
      'zh-CN': '查询失败，请稍后重试',
      'zh-Hant': '查詢失敗，請稍後重試',
      en: 'Lookup failed. Please try again.',
    }),
    lookupTimeout: pick(locale, {
      'zh-CN': '查询订阅等待时间过长，请稍后重试',
      'zh-Hant': '查詢訂閱等待時間過長，請稍後重試',
      en: 'Lookup timed out. Please try again.',
    }),
    networkError: pick(locale, {
      'zh-CN': '网络异常，请稍后重试',
      'zh-Hant': '網路異常，請稍後重試',
      en: 'Network error. Please try again.',
    }),
    saveFailed: pick(locale, {
      'zh-CN': '保存失败，请稍后重试',
      'zh-Hant': '儲存失敗，請稍後重試',
      en: 'Save failed. Please try again.',
    }),
    saveTimeout: pick(locale, {
      'zh-CN': '保存等待时间过长，请稍后重试',
      'zh-Hant': '儲存等待時間過長，請稍後重試',
      en: 'Save timed out. Please try again.',
    }),
    saveSuccess: pick(locale, {
      'zh-CN': '订阅设置已保存。',
      'zh-Hant': '訂閱設定已儲存。',
      en: 'Subscription settings saved.',
    }),
    subscribeFailed: pick(locale, {
      'zh-CN': '开启订阅失败，请稍后重试',
      'zh-Hant': '開啟訂閱失敗，請稍後重試',
      en: 'Could not enable subscription. Please try again.',
    }),
    subscribeTimeout: pick(locale, {
      'zh-CN': '开启订阅等待时间过长，请稍后重试',
      'zh-Hant': '開啟訂閱等待時間過長，請稍後重試',
      en: 'Enable subscription timed out. Please try again.',
    }),
    subscribeSuccess: pick(locale, {
      'zh-CN': '订阅已开启，你可以继续细调下面的提醒选项。',
      'zh-Hant': '訂閱已開啟，你可以繼續細調下面的提醒選項。',
      en: 'Subscription enabled. You can refine the options below.',
    }),
    unsubscribeFailed: pick(locale, {
      'zh-CN': '退订失败，请稍后重试',
      'zh-Hant': '退訂失敗，請稍後重試',
      en: 'Unsubscribe failed. Please try again.',
    }),
    unsubscribeTimeout: pick(locale, {
      'zh-CN': '退订等待时间过长，请稍后重试',
      'zh-Hant': '退訂等待時間過長，請稍後重試',
      en: 'Unsubscribe timed out. Please try again.',
    }),
    unsubscribeSuccess: pick(locale, {
      'zh-CN': '已退订所有邮件。你随时可以再开启。',
      'zh-Hant': '已退訂所有郵件。你隨時可以再開啟。',
      en: 'Unsubscribed from all mail. You can re-enable anytime.',
    }),
    focusTitle: pick(locale, {
      'zh-CN': `日常提醒重点（最多 ${MAX_EMAIL_FOCUS_ITEMS} 项）`,
      'zh-Hant': `日常提醒重點（最多 ${MAX_EMAIL_FOCUS_ITEMS} 項）`,
      en: `Daily focus (max ${MAX_EMAIL_FOCUS_ITEMS})`,
    }),
    focusHint: pick(locale, {
      'zh-CN': '从你关联的报告结果里选择日常邮件优先围绕的内容。',
      'zh-Hant': '從你關聯的報告結果裡選擇日常郵件優先圍繞的內容。',
      en: 'Pick what daily notes should prioritize from your linked report. Unchecked still gets general notes.',
    }),
    focusReportLink: pick(locale, {
      'zh-CN': '去报告页查看更多可选项',
      'zh-Hant': '去報告頁查看更多可選項',
      en: 'See more options on the report page',
    }),
    statusEyebrow: pick(locale, {
      'zh-CN': '当前状态',
      'zh-Hant': '目前狀態',
      en: 'Current status',
    }),
    enabledCount: (n: number) =>
      pick(locale, {
        'zh-CN': `已开启 ${n} 项`,
        'zh-Hant': `已開啟 ${n} 項`,
        en: `${n} enabled`,
      }),
    statusEmpty: pick(locale, {
      'zh-CN': '输入邮箱并加载设置后，可在这里查看当前订阅状态。',
      'zh-Hant': '輸入郵箱並載入設定後，可在這裡查看目前訂閱狀態。',
      en: 'Enter an email and load settings to see subscription status here.',
    }),
    actionsEyebrow: pick(locale, {
      'zh-CN': '保存与操作',
      'zh-Hant': '儲存與操作',
      en: 'Save & actions',
    }),
    saveActive: pick(locale, {
      'zh-CN': '保存订阅设置',
      'zh-Hant': '儲存訂閱設定',
      en: 'Save subscription settings',
    }),
    saveEnable: pick(locale, {
      'zh-CN': '按当前选项开启订阅',
      'zh-Hant': '按目前選項開啟訂閱',
      en: 'Enable with current options',
    }),
    quickSubscribe: pick(locale, {
      'zh-CN': '一键开启默认订阅',
      'zh-Hant': '一鍵開啟預設訂閱',
      en: 'Enable defaults',
    }),
    processing: pick(locale, {
      'zh-CN': '处理中…',
      'zh-Hant': '處理中…',
      en: 'Working…',
    }),
    unsubscribeAll: pick(locale, {
      'zh-CN': '退订所有邮件',
      'zh-Hant': '退訂所有郵件',
      en: 'Unsubscribe from all',
    }),
    viewMessages: pick(locale, {
      'zh-CN': '查看邮件记录与追问',
      'zh-Hant': '查看郵件記錄與追問',
      en: 'View mail archive & follow-ups',
    }),
  };
}

/** Client chrome: EmailMessageCenter */
export function emailMessageCenterCopy(locale: SiteLocale) {
  return {
    emailPlaceholder: pick(locale, {
      'zh-CN': '输入邮箱查看发送记录',
      'zh-Hant': '輸入郵箱查看發送記錄',
      en: 'Email to view send history',
    }),
    refresh: pick(locale, {
      'zh-CN': '刷新记录',
      'zh-Hant': '重新整理記錄',
      en: 'Refresh',
    }),
    loadFailed: pick(locale, {
      'zh-CN': '加载邮件记录失败',
      'zh-Hant': '載入郵件記錄失敗',
      en: 'Failed to load mail history',
    }),
    loadTimeout: pick(locale, {
      'zh-CN': '加载等待时间过长，请稍后重试',
      'zh-Hant': '載入等待時間過長，請稍後重試',
      en: 'Load timed out. Please try again.',
    }),
    networkError: pick(locale, {
      'zh-CN': '网络异常，请稍后重试',
      'zh-Hant': '網路異常，請稍後重試',
      en: 'Network error. Please try again.',
    }),
    saveLibraryFailed: pick(locale, {
      'zh-CN': '保存到资料库失败',
      'zh-Hant': '儲存到資料庫失敗',
      en: 'Failed to save to library',
    }),
    saveLibrarySuccess: pick(locale, {
      'zh-CN': '已保存到测算资料库。',
      'zh-Hant': '已儲存到測算資料庫。',
      en: 'Saved to your analysis library.',
    }),
    saveLibraryTimeout: pick(locale, {
      'zh-CN': '保存等待时间过长，请稍后重试',
      'zh-Hant': '儲存等待時間過長，請稍後重試',
      en: 'Save timed out. Please try again.',
    }),
    replyFailed: pick(locale, {
      'zh-CN': '追问失败，请稍后重试',
      'zh-Hant': '追問失敗，請稍後重試',
      en: 'Follow-up failed. Please try again.',
    }),
    replySuccess: pick(locale, {
      'zh-CN': '专业回复已生成，并同步发送到你的邮箱。',
      'zh-Hant': '專業回覆已生成，並同步發送到你的郵箱。',
      en: 'Professional reply generated and sent to your email.',
    }),
    replyTimeout: pick(locale, {
      'zh-CN': '回复生成等待时间过长，请稍后重试',
      'zh-Hant': '回覆生成等待時間過長，請稍後重試',
      en: 'Reply generation timed out. Please try again.',
    }),
    sendLogTitle: (n: number) =>
      pick(locale, {
        'zh-CN': `发送记录 (${n})`,
        'zh-Hant': `發送記錄 (${n})`,
        en: `Send history (${n})`,
      }),
    replyCount: (n: number) =>
      pick(locale, {
        'zh-CN': `${n} 条追问往来`,
        'zh-Hant': `${n} 條追問往來`,
        en: `${n} follow-up exchanges`,
      }),
    emptyLoading: pick(locale, {
      'zh-CN': '加载中…',
      'zh-Hant': '載入中…',
      en: 'Loading…',
    }),
    emptyList: pick(locale, {
      'zh-CN': '暂无邮件记录。开启订阅后会在这里归档。',
      'zh-Hant': '暫無郵件記錄。開啟訂閱後會在這裡歸檔。',
      en: 'No mail yet. After you subscribe, messages archive here.',
    }),
    viewReport: pick(locale, {
      'zh-CN': '查看关联报告 →',
      'zh-Hant': '查看關聯報告 →',
      en: 'Open linked report →',
    }),
    saveToLibrary: pick(locale, {
      'zh-CN': '保存到资料库',
      'zh-Hant': '儲存到資料庫',
      en: 'Save to library',
    }),
    openProfileSettings: pick(locale, {
      'zh-CN': '打开资料设置',
      'zh-Hant': '打開資料設定',
      en: 'Profile settings',
    }),
    threadTitle: pick(locale, {
      'zh-CN': '追问往来',
      'zh-Hant': '追問往來',
      en: 'Follow-up thread',
    }),
    yourQuestion: pick(locale, {
      'zh-CN': '你的追问',
      'zh-Hant': '你的追問',
      en: 'Your question',
    }),
    professionalReply: pick(locale, {
      'zh-CN': '专业回复',
      'zh-Hant': '專業回覆',
      en: 'Professional reply',
    }),
    followUpTitle: pick(locale, {
      'zh-CN': '继续追问这封邮件',
      'zh-Hant': '繼續追問這封郵件',
      en: 'Follow up on this email',
    }),
    followUpHint: pick(locale, {
      'zh-CN':
        '我们会结合这封提醒的内容和你的报告上下文，生成专业回复并同步发到你的邮箱。你也可以直接回复收到的邮件。',
      'zh-Hant':
        '我們會結合這封提醒的內容和你的報告上下文，生成專業回覆並同步發到你的郵箱。你也可以直接回覆收到的郵件。',
      en: 'We combine this note with your report context for a structured reply, also sent to your inbox. You can also reply to the email itself.',
    }),
    followUpPlaceholder: pick(locale, {
      'zh-CN': '例如：这封日常提醒里提到的“今天适合推进”，具体适合推进哪类事情？',
      'zh-Hant': '例如：這封日常提醒裡提到的「今天適合推進」，具體適合推進哪類事情？',
      en: 'e.g. This check-in said “good day to advance”—what kind of tasks fit best?',
    }),
    sendFollowUp: pick(locale, {
      'zh-CN': '发送追问并获取专业回复',
      'zh-Hant': '發送追問並獲取專業回覆',
      en: 'Send follow-up & get reply',
    }),
    selectPrompt: pick(locale, {
      'zh-CN': '选择左侧一封邮件，查看详情并追问',
      'zh-Hant': '選擇左側一封郵件，查看詳情並追問',
      en: 'Select a message on the left to read and follow up',
    }),
    backToSettings: pick(locale, {
      'zh-CN': '返回订阅设置',
      'zh-Hant': '返回訂閱設定',
      en: 'Back to subscription settings',
    }),
    dateLocale: locale === 'en' ? 'en-US' : locale === 'zh-Hant' ? 'zh-TW' : 'zh-CN',
  };
}
