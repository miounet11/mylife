/**
 * EN/zh chrome for history hub (/history).
 * Keep report.name / intent / relation / birthAccuracy as API/user data — do not translate.
 * zh-Hant falls back to simplified conversion unless a traditional string is provided.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Page hero + SEO for /history */
export function historyPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '历史记录｜报告与工具结果',
      'zh-Hant': '歷史記錄｜報告與工具結果',
      en: 'History · Reports & tool results',
    }),
    metaDescription: pick(locale, {
      'zh-CN': '查看本机会话的综合报告与单项工具运行结果，方便快速回看结论与建议。',
      'zh-Hant': '查看本機會話的綜合報告與單項工具運行結果，方便快速回看結論與建議。',
      en: 'Review comprehensive reports and tool runs from this browser session—quick access to conclusions and next steps.',
    }),
    headerCta: pick(locale, {
      'zh-CN': '生成新报告',
      'zh-Hant': '生成新報告',
      en: 'New report',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '历史',
      'zh-Hant': '歷史',
      en: 'History',
    }),
    title: pick(locale, {
      'zh-CN': '报告与工具结果',
      'zh-Hant': '報告與工具結果',
      en: 'Reports & tool results',
    }),
    description: pick(locale, {
      'zh-CN': '未登录也可在本浏览器查看会话结果；登录后可跨设备归档。',
      'zh-Hant': '未登入也可在本瀏覽器查看會話結果；登入後可跨裝置歸檔。',
      en: 'View session results in this browser without signing in; sign in to archive across devices.',
    }),
    linkTools: pick(locale, {
      'zh-CN': '工具',
      en: 'Tools',
    }),
    linkProfile: pick(locale, {
      'zh-CN': '我的档案',
      'zh-Hant': '我的檔案',
      en: 'My profile',
    }),
    linkPredictions: pick(locale, {
      'zh-CN': '预测回访',
      'zh-Hant': '預測回訪',
      en: 'Prediction check-in',
    }),
    stripTitle: pick(locale, {
      'zh-CN': '历史回看',
      'zh-Hant': '歷史回看',
      en: 'History review',
    }),
  };
}

/** Client chrome: consultant CTA, lists, empty states, tool history, errors */
export function historyClientCopy(locale: SiteLocale) {
  return {
    loading: pick(locale, {
      'zh-CN': '正在加载历史记录…',
      'zh-Hant': '正在載入歷史記錄…',
      en: 'Loading history…',
    }),
    loadFailed: pick(locale, {
      'zh-CN': '加载失败',
      'zh-Hant': '載入失敗',
      en: 'Failed to load',
    }),
    networkError: pick(locale, {
      'zh-CN': '网络异常，请稍后重试',
      'zh-Hant': '網路異常，請稍後重試',
      en: 'Network error. Please try again.',
    }),

    // Consultant strip
    consultantEyebrow: pick(locale, {
      'zh-CN': '顾问',
      'zh-Hant': '顧問',
      en: 'Consultant',
    }),
    consultantTitleWithReport: pick(locale, {
      'zh-CN': '带最近报告开场',
      'zh-Hant': '帶最近報告開場',
      en: 'Open with latest report',
    }),
    consultantTitleWithoutReport: pick(locale, {
      'zh-CN': '直接问顾问',
      'zh-Hant': '直接問顧問',
      en: 'Ask a consultant',
    }),
    consultantDescWithReport: pick(locale, {
      'zh-CN': '不预填长问题。老师先开场，再对照你最近一份报告追问',
      'zh-Hant': '不預填長問題。老師先開場，再對照你最近一份報告追問',
      en: 'No long prefilled question. The consultant opens first, then follows up against your latest report.',
    }),
    consultantDescWithoutReport: pick(locale, {
      'zh-CN': '暂无报告时也可先开场；有盘后建议从报告进入，依据更稳',
      'zh-Hant': '暫無報告時也可先開場；有盤後建議從報告進入，依據更穩',
      en: 'You can open without a report; with a chart, start from the report for firmer ground.',
    }),
    continueChat: pick(locale, {
      'zh-CN': '继续聊 →',
      'zh-Hant': '繼續聊 →',
      en: 'Continue chat →',
    }),
    overviewOpening: pick(locale, {
      'zh-CN': '总览开场 →',
      'zh-Hant': '總覽開場 →',
      en: 'Overview opening →',
    }),
    allTeachers: pick(locale, {
      'zh-CN': '全部老师',
      'zh-Hant': '全部老師',
      en: 'All consultants',
    }),

    // Guest / auth notice
    guestHasSession: pick(locale, {
      'zh-CN':
        '本浏览器会话内生成的报告已列在下方。登录绑定邮箱后可跨设备找回，并开启订阅提醒。',
      'zh-Hant':
        '本瀏覽器會話內生成的報告已列在下方。登入綁定郵箱後可跨裝置找回，並開啟訂閱提醒。',
      en: 'Reports from this browser session are listed below. Sign in with email to recover across devices and enable reminders.',
    }),
    guestEmpty: pick(locale, {
      'zh-CN':
        '本浏览器暂无会话报告。生成后会自动保存在此设备；登录绑定邮箱可跨设备归档。',
      'zh-Hant':
        '本瀏覽器暫無會話報告。生成後會自動保存在此裝置；登入綁定郵箱可跨裝置歸檔。',
      en: 'No session reports in this browser yet. New ones save on this device; sign in with email to archive across devices.',
    }),
    goLogin: pick(locale, {
      'zh-CN': '去登录',
      'zh-Hant': '去登入',
      en: 'Sign in',
    }),

    // Reports section
    reportsSection: pick(locale, {
      'zh-CN': '综合报告',
      'zh-Hant': '綜合報告',
      en: 'Full reports',
    }),
    /** Fallback only when API intent is missing — not user/report content. */
    defaultIntentLabel: pick(locale, {
      'zh-CN': '综合判断报告',
      'zh-Hant': '綜合判斷報告',
      en: 'Full judgment report',
    }),
    membershipArchive: pick(locale, {
      'zh-CN': '邮箱归档',
      'zh-Hant': '郵箱歸檔',
      en: 'Email archive',
    }),
    openWithChart: pick(locale, {
      'zh-CN': '带盘开场',
      'zh-Hant': '帶盤開場',
      en: 'Open with chart',
    }),
    openReport: pick(locale, {
      'zh-CN': '打开报告 →',
      'zh-Hant': '打開報告 →',
      en: 'Open report →',
    }),
    emptyReports: pick(locale, {
      'zh-CN':
        '暂无报告。生成后会保存在本浏览器会话中；填写邮箱或登录可跨设备找回。',
      'zh-Hant':
        '暫無報告。生成後會保存在本瀏覽器會話中；填寫郵箱或登入可跨裝置找回。',
      en: 'No reports yet. New ones stay in this browser session; add email or sign in to recover across devices.',
    }),
    ctaGenerate: pick(locale, {
      'zh-CN': '去生成报告',
      'zh-Hant': '去生成報告',
      en: 'Generate report',
    }),

    // Tool history section
    toolsSection: pick(locale, {
      'zh-CN': '工具结果',
      'zh-Hant': '工具結果',
      en: 'Tool results',
    }),
    toolHistoryTitle: pick(locale, {
      'zh-CN': '单项工具运行记录',
      'zh-Hant': '單項工具運行記錄',
      en: 'Tool run history',
    }),
    toolHistoryDescription: pick(locale, {
      'zh-CN': '基于综合报告跑出的工具结论，可直接回看 headline 与建议动作。',
      'zh-Hant': '基於綜合報告跑出的工具結論，可直接回看 headline 與建議動作。',
      en: 'Tool conclusions from full reports—revisit headlines and suggested actions.',
    }),
  };
}

/** BCP 47 tag for date formatting in history rows */
export function historyDateLocale(locale: SiteLocale): string {
  if (locale === 'en') return 'en-US';
  if (locale === 'zh-Hant') return 'zh-TW';
  return 'zh-CN';
}
