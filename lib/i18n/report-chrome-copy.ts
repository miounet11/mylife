/**
 * Report reading chrome (section titles, consultant strip, share image).
 * Not full narrative translation — engine body may remain Chinese.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { normalizeSiteLocale, toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

export function resolveReportChromeLocale(locale?: string | null): SiteLocale {
  return normalizeSiteLocale(locale) || 'zh-CN';
}

/** Agent cockpit section chrome */
export function reportCockpitCopy(locale: SiteLocale) {
  return {
    eyebrow: pick(locale, {
      'zh-CN': '先看核心结论',
      'zh-Hant': '先看核心結論',
      en: 'Core verdict first',
    }),
    title: pick(locale, {
      'zh-CN': '核心结论与当前状态',
      'zh-Hant': '核心結論與目前狀態',
      en: 'Core verdict & current state',
    }),
    dayMasterSuffix: pick(locale, {
      'zh-CN': '日主',
      en: 'Day master',
    }),
    yongShen: pick(locale, {
      'zh-CN': '用神',
      en: 'Favorable',
    }),
    pending: pick(locale, {
      'zh-CN': '待定',
      en: 'TBD',
    }),
    pendingExpand: pick(locale, {
      'zh-CN': '待展开',
      'zh-Hant': '待展開',
      en: 'To expand',
    }),
    currentScore: pick(locale, {
      'zh-CN': '当前得分',
      'zh-Hant': '目前得分',
      en: 'Current score',
    }),
    peak: pick(locale, {
      'zh-CN': '高点',
      'zh-Hant': '高點',
      en: 'Peak',
    }),
    trough: pick(locale, {
      'zh-CN': '低点',
      'zh-Hant': '低點',
      en: 'Trough',
    }),
    currentPhase: pick(locale, {
      'zh-CN': '当前阶段',
      'zh-Hant': '目前階段',
      en: 'Current stage',
    }),
    yearSuffix: pick(locale, {
      'zh-CN': '年',
      en: '',
    }),
    careerRhythm: pick(locale, {
      'zh-CN': '事业节奏',
      'zh-Hant': '事業節奏',
      en: 'Career rhythm',
    }),
    relationshipMode: pick(locale, {
      'zh-CN': '关系模式',
      'zh-Hant': '關係模式',
      en: 'Relationship mode',
    }),
    yearWindow: pick(locale, {
      'zh-CN': '年度窗口',
      'zh-Hant': '年度窗口',
      en: 'Year window',
    }),
    peakYear: (year: number) =>
      pick(locale, {
        'zh-CN': `${year} 高点`,
        'zh-Hant': `${year} 高點`,
        en: `${year} peak`,
      }),
  };
}

/** Report-first-screen consultant cards */
export function reportConsultantCardsCopy(locale: SiteLocale) {
  return {
    ariaLabel: pick(locale, {
      'zh-CN': '问顾问',
      'zh-Hant': '問顧問',
      en: 'Ask a consultant',
    }),
    title: pick(locale, {
      'zh-CN': '先问一位顾问',
      'zh-Hant': '先問一位顧問',
      en: 'Ask a consultant first',
    }),
    subtitle: pick(locale, {
      'zh-CN': '事业 · 时机 · 财务 — 结合本盘开场，不预填长问',
      'zh-Hant': '事業 · 時機 · 財務 — 結合本盤開場，不預填長問',
      en: 'Career · Timing · Wealth — open with this chart; no long prefilled question',
    }),
    allTeachers: pick(locale, {
      'zh-CN': '全部老师',
      'zh-Hant': '全部老師',
      en: 'All consultants',
    }),
    illustTitle: pick(locale, {
      'zh-CN': '决策结构',
      'zh-Hant': '決策結構',
      en: 'Decision structure',
    }),
    askCareer: pick(locale, {
      'zh-CN': '问事业',
      'zh-Hant': '問事業',
      en: 'Ask career',
    }),
    askTiming: pick(locale, {
      'zh-CN': '问时机',
      'zh-Hant': '問時機',
      en: 'Ask timing',
    }),
    askWealth: pick(locale, {
      'zh-CN': '问财务',
      'zh-Hant': '問財務',
      en: 'Ask wealth',
    }),
    bestWindow: (value: string) =>
      pick(locale, {
        'zh-CN': `较有利：${value}`,
        'zh-Hant': `較有利：${value}`,
        en: `Favorable: ${value}`,
      }),
    riskWindow: (value: string) =>
      pick(locale, {
        'zh-CN': `需谨慎：${value}`,
        'zh-Hant': `需謹慎：${value}`,
        en: `Caution: ${value}`,
      }),
  };
}

/** Share image download button + canvas chrome */
export function shareImageCopy(locale: SiteLocale) {
  return {
    brand: pick(locale, {
      'zh-CN': '人生K线',
      'zh-Hant': '人生K線',
      en: 'Life K-Line',
    }),
    label: pick(locale, {
      'zh-CN': '生成分享图',
      'zh-Hant': '生成分享圖',
      en: 'Save share image',
    }),
    generating: pick(locale, {
      'zh-CN': '生成中…',
      'zh-Hant': '生成中…',
      en: 'Generating…',
    }),
    downloaded: pick(locale, {
      'zh-CN': '已下载',
      'zh-Hant': '已下載',
      en: 'Downloaded',
    }),
    footerLeft: pick(locale, {
      'zh-CN': '结构参考',
      'zh-Hant': '結構參考',
      en: 'Structure reference',
    }),
    disclaimer: pick(locale, {
      'zh-CN': '结构与节奏参考，不替代专业医疗 / 法律 / 投资意见。',
      'zh-Hant': '結構與節奏參考，不替代專業醫療 / 法律 / 投資意見。',
      en: 'Structure and rhythm reference — not medical, legal, or investment advice.',
    }),
    fallbackLine: pick(locale, {
      'zh-CN': '结构参考 · life-kline.com',
      'zh-Hant': '結構參考 · life-kline.com',
      en: 'Structure reference · life-kline.com',
    }),
    filePrefix: pick(locale, {
      'zh-CN': '人生K线',
      'zh-Hant': '人生K線',
      en: 'Life_KLine',
    }),
  };
}

export type ReportCockpitCopy = ReturnType<typeof reportCockpitCopy>;
export type ReportConsultantCardsCopy = ReturnType<typeof reportConsultantCardsCopy>;
export type ShareImageCopy = ReturnType<typeof shareImageCopy>;
