/**
 * EN/zh chrome for events calendar hub (/events).
 * Validation-loop language only — do not invent superstition copy.
 * Keep event title/description as user data; do not translate free text.
 * zh-Hant falls back to simplified conversion unless a traditional string is provided.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';
import type { EventViewImpact, EventViewType } from '@/lib/event-view';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

export type EventFilterKey = EventViewType | 'all';

/** Page hero + SEO for /events */
export function eventsPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '事件日历',
      'zh-Hant': '事件日曆',
      en: 'Events calendar',
    }),
    metaDescription: pick(locale, {
      'zh-CN': '记录人生关键节点，校准报告与预测回访。',
      'zh-Hant': '記錄人生關鍵節點，校準報告與預測回訪。',
      en: 'Log life milestones to calibrate reports and prediction check-ins.',
    }),
    headerCta: pick(locale, {
      'zh-CN': '预测回访',
      'zh-Hant': '預測回訪',
      en: 'Prediction check-in',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '验证',
      'zh-Hant': '驗證',
      en: 'Verify',
    }),
    title: pick(locale, {
      'zh-CN': '事件日历',
      'zh-Hant': '事件日曆',
      en: 'Events calendar',
    }),
    description: pick(locale, {
      'zh-CN': '记录跳槽、搬家、关系等节点，与报告和预测回访对照。',
      'zh-Hant': '記錄跳槽、搬家、關係等節點，與報告和預測回訪對照。',
      en: 'Log job changes, moves, relationship milestones, and more—then check them against reports and prediction check-ins.',
    }),
    linkPredictions: pick(locale, {
      'zh-CN': '预测回访',
      'zh-Hant': '預測回訪',
      en: 'Prediction check-in',
    }),
    linkProfileEvents: pick(locale, {
      'zh-CN': '人生事件档案',
      'zh-Hant': '人生事件檔案',
      en: 'Life events archive',
    }),
    linkHistory: pick(locale, {
      'zh-CN': '报告历史',
      'zh-Hant': '報告歷史',
      en: 'Report history',
    }),
    stripTitle: pick(locale, {
      'zh-CN': '验证闭环',
      'zh-Hant': '驗證閉環',
      en: 'Validation loop',
    }),
  };
}

/** Category filter / type labels */
export function eventTypeLabels(locale: SiteLocale): Record<EventFilterKey, string> {
  return {
    all: pick(locale, { 'zh-CN': '全部', en: 'All' }),
    career: pick(locale, { 'zh-CN': '事业', 'zh-Hant': '事業', en: 'Career' }),
    wealth: pick(locale, { 'zh-CN': '财富', 'zh-Hant': '財富', en: 'Wealth' }),
    marriage: pick(locale, { 'zh-CN': '关系', 'zh-Hant': '關係', en: 'Relationships' }),
    health: pick(locale, { 'zh-CN': '健康', en: 'Health' }),
    family: pick(locale, { 'zh-CN': '家庭', en: 'Family' }),
    other: pick(locale, { 'zh-CN': '其他', 'zh-Hant': '其他', en: 'Other' }),
  };
}

/** Impact option labels (form + list chrome) */
export function eventImpactLabels(locale: SiteLocale): Record<EventViewImpact, string> {
  return {
    positive: pick(locale, {
      'zh-CN': '偏正面',
      'zh-Hant': '偏正面',
      en: 'Positive lean',
    }),
    neutral: pick(locale, {
      'zh-CN': '中性',
      en: 'Neutral',
    }),
    negative: pick(locale, {
      'zh-CN': '偏压力',
      'zh-Hant': '偏壓力',
      en: 'Pressure lean',
    }),
  };
}

/** Feedback labels: confirmed / partial / not confirmed (validation loop) */
export function eventFeedbackLabels(locale: SiteLocale) {
  return {
    confirmed: pick(locale, {
      'zh-CN': '应验',
      'zh-Hant': '應驗',
      en: 'Confirmed',
    }),
    partial: pick(locale, {
      'zh-CN': '部分',
      en: 'Partial',
    }),
    /** Stored in userNotes for partial feedback */
    partialNotes: pick(locale, {
      'zh-CN': '部分应验',
      'zh-Hant': '部分應驗',
      en: 'Partial confirmation',
    }),
    missed: pick(locale, {
      'zh-CN': '未应验',
      'zh-Hant': '未應驗',
      en: 'Not confirmed',
    }),
    recorded: pick(locale, {
      'zh-CN': '已记',
      'zh-Hant': '已記',
      en: 'Logged',
    }),
    fallbackNote: pick(locale, {
      'zh-CN': '反馈',
      'zh-Hant': '回饋',
      en: 'Feedback',
    }),
  };
}

/** Whether stored userNotes mark partial confirmation (zh or en). */
export function isPartialFeedbackNotes(notes?: string | null): boolean {
  const raw = `${notes || ''}`.trim();
  if (!raw) return false;
  return /部分|partial/i.test(raw);
}

/** Client chrome: consultant, form, list, errors */
export function eventsHubCopy(locale: SiteLocale) {
  const feedback = eventFeedbackLabels(locale);
  const types = eventTypeLabels(locale);
  const impacts = eventImpactLabels(locale);

  return {
    stripTitle: pick(locale, {
      'zh-CN': '验证闭环',
      'zh-Hant': '驗證閉環',
      en: 'Validation loop',
    }),

    // Consultant strip
    consultantEyebrow: pick(locale, {
      'zh-CN': '顾问',
      'zh-Hant': '顧問',
      en: 'Consultant',
    }),
    consultantTitleWithReport: pick(locale, {
      'zh-CN': '对照事件回聊',
      'zh-Hant': '對照事件回聊',
      en: 'Review events with report',
    }),
    consultantTitleWithoutReport: pick(locale, {
      'zh-CN': '先问实践老师',
      'zh-Hant': '先問實踐老師',
      en: 'Ask the practice consultant',
    }),
    consultantDesc: pick(locale, {
      'zh-CN': '标记应验或偏差后，可带上下文开场复盘；不预填长问题',
      'zh-Hant': '標記應驗或偏差後，可帶上下文開場復盤；不預填長問題',
      en: 'After you mark confirmed or drift, reopen with context—no long prefilled question.',
    }),
    openWithReport: pick(locale, {
      'zh-CN': '带报告开场 →',
      'zh-Hant': '帶報告開場 →',
      en: 'Open with report →',
    }),
    practiceTeacher: pick(locale, {
      'zh-CN': '实践老师 →',
      'zh-Hant': '實踐老師 →',
      en: 'Practice consultant →',
    }),
    allTeachers: pick(locale, {
      'zh-CN': '全部老师',
      'zh-Hant': '全部老師',
      en: 'All consultants',
    }),
    hubWindowLabel: pick(locale, {
      'zh-CN': '事件日历复盘',
      'zh-Hant': '事件日曆復盤',
      en: 'Events calendar review',
    }),

    // Filter links
    linkProfileEvents: pick(locale, {
      'zh-CN': '人生事件档案 →',
      'zh-Hant': '人生事件檔案 →',
      en: 'Life events archive →',
    }),
    linkPredictions: pick(locale, {
      'zh-CN': '预测回访 →',
      'zh-Hant': '預測回訪 →',
      en: 'Prediction check-in →',
    }),

    // Errors / transport notices
    loadServerFailed: pick(locale, {
      'zh-CN': '暂无法从服务器拉取事件（可先本地记录）',
      'zh-Hant': '暫無法從伺服器拉取事件（可先本機記錄）',
      en: 'Could not load events from the server—you can still log locally.',
    }),
    networkRetry: pick(locale, {
      'zh-CN': '网络异常，请稍后重试',
      'zh-Hant': '網路異常，請稍後重試',
      en: 'Network error. Please try again.',
    }),
    savedLocalOnServerFail: pick(locale, {
      'zh-CN': '已保存到本地缓存（服务器写入失败时）',
      'zh-Hant': '已儲存到本機快取（伺服器寫入失敗時）',
      en: 'Saved to local cache (server write failed).',
    }),
    networkSavedLocal: pick(locale, {
      'zh-CN': '网络异常，已写入本地缓存',
      'zh-Hant': '網路異常，已寫入本機快取',
      en: 'Network error—saved to local cache.',
    }),
    feedbackLocalOnly: pick(locale, {
      'zh-CN': '应验反馈已写入本机缓存；登录且服务器可用时会优先同步服务端。',
      'zh-Hant': '應驗回饋已寫入本機快取；登入且伺服器可用時會優先同步服務端。',
      en: 'Feedback saved on this device; it syncs to the server when you are signed in and online.',
    }),
    localCacheMarker: pick(locale, {
      'zh-CN': '本地',
      'zh-Hant': '本機',
      en: 'local',
    }),

    // Form
    formTitle: pick(locale, {
      'zh-CN': '记录新事件',
      'zh-Hant': '記錄新事件',
      en: 'Log a new event',
    }),
    formHint: pick(locale, {
      'zh-CN': '写入后用于校准报告与回访（与报告避险「记入事件」同源 API）',
      'zh-Hant': '寫入後用於校準報告與回訪（與報告避險「記入事件」同源 API）',
      en: 'Used to calibrate reports and check-ins (same API as report “log to events”).',
    }),
    labelTitle: pick(locale, {
      'zh-CN': '标题',
      'zh-Hant': '標題',
      en: 'Title',
    }),
    titlePlaceholder: pick(locale, {
      'zh-CN': '如：跳槽入职 / 搬家签约',
      'zh-Hant': '如：跳槽入職 / 搬家簽約',
      en: 'e.g. started a new role / signed a lease',
    }),
    labelDate: pick(locale, {
      'zh-CN': '日期',
      en: 'Date',
    }),
    labelType: pick(locale, {
      'zh-CN': '类型',
      'zh-Hant': '類型',
      en: 'Type',
    }),
    labelImpact: pick(locale, {
      'zh-CN': '影响',
      'zh-Hant': '影響',
      en: 'Impact',
    }),
    labelDescription: pick(locale, {
      'zh-CN': '说明',
      'zh-Hant': '說明',
      en: 'Notes',
    }),
    descriptionPlaceholder: pick(locale, {
      'zh-CN': '可选：经过、结果、是否与报告预测对照',
      'zh-Hant': '可選：經過、結果、是否與報告預測對照',
      en: 'Optional: what happened, outcome, and how it compares to the report',
    }),
    saving: pick(locale, {
      'zh-CN': '保存中…',
      'zh-Hant': '儲存中…',
      en: 'Saving…',
    }),
    saveEvent: pick(locale, {
      'zh-CN': '保存事件',
      'zh-Hant': '儲存事件',
      en: 'Save event',
    }),

    // Calendar / list
    loading: pick(locale, {
      'zh-CN': '加载事件…',
      'zh-Hant': '載入事件…',
      en: 'Loading events…',
    }),
    listTitle: (count: number) =>
      pick(locale, {
        'zh-CN': `事件列表（${count}）`,
        'zh-Hant': `事件列表（${count}）`,
        en: `Events (${count})`,
      }),
    emptyList: pick(locale, {
      'zh-CN': '还没有事件。从报告避险一键记入，或在上方新建。',
      'zh-Hant': '還沒有事件。從報告避險一鍵記入，或在上方新建。',
      en: 'No events yet. Log one from a report risk tip, or create one above.',
    }),
    linkedReport: pick(locale, {
      'zh-CN': '关联报告',
      'zh-Hant': '關聯報告',
      en: 'Linked report',
    }),
    defaultEventTitle: pick(locale, {
      'zh-CN': '事件',
      en: 'Event',
    }),

    // Review chat CTAs
    reviewDrift: pick(locale, {
      'zh-CN': '带偏差回聊纠偏',
      'zh-Hant': '帶偏差回聊糾偏',
      en: 'Review drift with consultant',
    }),
    reviewConfirmed: pick(locale, {
      'zh-CN': '带应验回聊复盘',
      'zh-Hant': '帶應驗回聊復盤',
      en: 'Review confirmation with consultant',
    }),
    reviewOpen: pick(locale, {
      'zh-CN': '回聊对照',
      'zh-Hant': '回聊對照',
      en: 'Open for comparison',
    }),
    windowDrift: (title: string) =>
      pick(locale, {
        'zh-CN': `偏差复盘：${title}`,
        'zh-Hant': `偏差復盤：${title}`,
        en: `Drift review: ${title}`,
      }),
    windowConfirmed: (title: string) =>
      pick(locale, {
        'zh-CN': `应验复盘：${title}`,
        'zh-Hant': `應驗復盤：${title}`,
        en: `Confirmation review: ${title}`,
      }),
    windowOpen: (title: string) =>
      pick(locale, {
        'zh-CN': `事件对照：${title}`,
        'zh-Hant': `事件對照：${title}`,
        en: `Event check: ${title}`,
      }),

    types,
    impacts,
    feedback,
  };
}

/** Convenience bundle for the hub surface */
export function eventsCopy(locale: SiteLocale) {
  return {
    page: eventsPageCopy(locale),
    hub: eventsHubCopy(locale),
    types: eventTypeLabels(locale),
    impacts: eventImpactLabels(locale),
    feedback: eventFeedbackLabels(locale),
  };
}
