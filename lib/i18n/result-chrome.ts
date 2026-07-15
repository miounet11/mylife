/**
 * Result page chrome labels (L2) for nav, anchors, steps.
 * Used by local shell + production result page patch.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';
import { resultCopy } from '@/lib/i18n/funnel-copy';
import { publicReportSummaryPoints } from '@/lib/i18n/public-report-seo';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

export function resultChrome(locale: SiteLocale) {
  const base = resultCopy(locale);
  return {
    ...base,
    reportRailTitle: pick(locale, {
      'zh-CN': '这份报告',
      'zh-Hant': '這份報告',
      en: 'This report',
    }),
    stepOverview: pick(locale, {
      'zh-CN': '完整报告：结构总览',
      'zh-Hant': '完整報告：結構總覽',
      en: 'Full report: structure overview',
    }),
    stepDeep: pick(locale, {
      'zh-CN': '深入细节：节奏与场景',
      'zh-Hant': '深入細節：節奏與場景',
      en: 'Deep dive: rhythm & scenarios',
    }),
    stepAction: pick(locale, {
      'zh-CN': '下一步：行动与验证',
      'zh-Hant': '下一步：行動與驗證',
      en: 'Next: actions & verification',
    }),
    deepReport: pick(locale, {
      'zh-CN': '深入报告',
      'zh-Hant': '深入報告',
      en: 'Deep report',
    }),
    jumpDeep: pick(locale, {
      'zh-CN': '直接看深入报告',
      'zh-Hant': '直接看深入報告',
      en: 'Jump to deep report',
    }),
    backToSummary: pick(locale, {
      'zh-CN': '回到摘要版',
      'zh-Hant': '回到摘要版',
      en: 'Back to summary',
    }),
    fullContentTitle: pick(locale, {
      'zh-CN': '这里是完整内容，不只是时间地图摘要。',
      'zh-Hant': '這裡是完整內容，不只是時間地圖摘要。',
      en: 'This is the full report—not just a timing map summary.',
    }),
    fullContentDesc: pick(locale, {
      'zh-CN':
        '下面会展开个人结构总览、深入命理细节、行动建议和验证闭环。想先看未来 30 天 / 12 个月 / 5 年关键时点，可以回到摘要版。',
      'zh-Hant':
        '下面會展開個人結構總覽、深入命理細節、行動建議和驗證閉環。想先看未來 30 天 / 12 個月 / 5 年關鍵時點，可以回到摘要版。',
      en: 'Below: structure overview, deeper chart detail, actions, and verification. For 30-day / 12-month / 5-year windows, return to the summary.',
    }),
    structureRhythm: pick(locale, {
      'zh-CN': '01 · 结构节奏',
      'zh-Hant': '01 · 結構節奏',
      en: '01 · Structure & rhythm',
    }),
    actionValidation: pick(locale, {
      'zh-CN': '02 · 行动验证',
      'zh-Hant': '02 · 行動驗證',
      en: '02 · Action & validation',
    }),
    readableTier: pick(locale, {
      'zh-CN': '基础可读版',
      'zh-Hant': '基礎可讀版',
      en: 'Readable base',
    }),
    enhancedTier: pick(locale, {
      'zh-CN': '内容已完善',
      'zh-Hant': '內容已完善',
      en: 'Content enhanced',
    }),
    degradePartial: pick(locale, {
      'zh-CN': '当前先显示可读版，内容补全仍在继续，不需要反复刷新页面。',
      'zh-Hant': '目前先顯示可讀版，內容補全仍在繼續，不需要反覆重新整理頁面。',
      en: 'Showing a readable version first; enrichment continues—no need to refresh repeatedly.',
    }),
    degradeLite: pick(locale, {
      'zh-CN': '当前这份结果适合先看结论、阶段和行动建议；如需更完整内容，可稍后重新生成。',
      'zh-Hant': '目前這份結果適合先看結論、階段和行動建議；如需更完整內容，可稍後重新生成。',
      en: 'Start with verdict, stage, and actions; regenerate later if you need fuller depth.',
    }),
    degradeReady: pick(locale, {
      'zh-CN': '当前内容已补全，可直接按完整路径阅读。',
      'zh-Hant': '目前內容已補全，可直接按完整路徑閱讀。',
      en: 'Content is complete—follow the full reading path.',
    }),
    feedbackCorrect: pick(locale, {
      'zh-CN': '需要纠偏',
      'zh-Hant': '需要糾偏',
      en: 'Needs correction',
    }),
    feedbackWatch: pick(locale, {
      'zh-CN': '持续观察',
      'zh-Hant': '持續觀察',
      en: 'Keep watching',
    }),
    feedbackStable: pick(locale, {
      'zh-CN': '反馈稳定',
      'zh-Hant': '回饋穩定',
      en: 'Feedback stable',
    }),
    enBodyNote: pick(locale, {
      'zh-CN': '',
      en: 'Engine detail sections below may remain in Chinese technical form. Use this summary for the decision path; switch language anytime in the header.',
    }),
    summaryPoints: publicReportSummaryPoints(locale),
    anchors: {
      cockpit: pick(locale, {
        'zh-CN': '总览与下一步',
        'zh-Hant': '總覽與下一步',
        en: 'Overview & next',
      }),
      deepReport: pick(locale, {
        'zh-CN': '深入报告',
        'zh-Hant': '深入報告',
        en: 'Deep report',
      }),
      currentState: pick(locale, {
        'zh-CN': '当前状态',
        'zh-Hant': '目前狀態',
        en: 'Current state',
      }),
      trend: pick(locale, {
        'zh-CN': '趋势与节奏',
        'zh-Hant': '趨勢與節奏',
        en: 'Trend & rhythm',
      }),
      scenario: pick(locale, {
        'zh-CN': '场景视图',
        'zh-Hant': '場景視圖',
        en: 'Scenarios',
      }),
      actionValidation: pick(locale, {
        'zh-CN': '行动与验证',
        'zh-Hant': '行動與驗證',
        en: 'Actions & verify',
      }),
      ppf: pick(locale, {
        'zh-CN': '过去 · 现在 · 未来',
        'zh-Hant': '過去 · 現在 · 未來',
        en: 'Past · Present · Future',
      }),
      validation: pick(locale, {
        'zh-CN': '可信报告',
        'zh-Hant': '可信報告',
        en: 'Trust report',
      }),
      subscription: pick(locale, {
        'zh-CN': '订阅与更新',
        'zh-Hant': '訂閱與更新',
        en: 'Subscribe & updates',
      }),
      nextStep: pick(locale, {
        'zh-CN': '下一步行动',
        'zh-Hant': '下一步行動',
        en: 'Next actions',
      }),
      tools: pick(locale, {
        'zh-CN': '推荐工具',
        'zh-Hant': '推薦工具',
        en: 'Tools',
      }),
      related: pick(locale, {
        'zh-CN': '延伸内容',
        'zh-Hant': '延伸內容',
        en: 'Related content',
      }),
    },
  };
}

export type ResultChrome = ReturnType<typeof resultChrome>;
