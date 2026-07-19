/**
 * EN/zh chrome for annual review hub (/annual-review).
 * Keep prediction statements / notes / adjustment text as user/engine data — do not translate.
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

/** Page hero + SEO + footer for /annual-review */
export function annualReviewPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '年度复盘｜命中率与校准',
      'zh-Hant': '年度復盤｜命中率與校準',
      en: 'Annual review · Hit rate & calibration',
    }),
    metaDescription: pick(locale, {
      'zh-CN': '汇总预测反馈与人生事件，查看年度命中率、亮点与下一年校准建议。',
      'zh-Hant': '彙總預測回饋與人生事件，查看年度命中率、亮點與下一年校準建議。',
      en: 'Aggregate prediction feedback and life events—see yearly hit rate, highlights, and next-year calibration tips.',
    }),
    headerCta: pick(locale, {
      'zh-CN': '我的档案',
      'zh-Hant': '我的檔案',
      en: 'My profile',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '复盘',
      'zh-Hant': '復盤',
      en: 'Review',
    }),
    title: pick(locale, {
      'zh-CN': '年度命中率回顾',
      'zh-Hant': '年度命中率回顧',
      en: 'Yearly hit-rate review',
    }),
    description: pick(locale, {
      'zh-CN': '汇总预测回访与人生事件：哪些判断贴近现实，哪些领域需要收敛。',
      'zh-Hant': '彙總預測回訪與人生事件：哪些判斷貼近現實，哪些領域需要收斂。',
      en: 'Pull together prediction check-ins and life events: which calls tracked reality, and which areas need tightening.',
    }),
    linkPredictions: pick(locale, {
      'zh-CN': '预测回访',
      'zh-Hant': '預測回訪',
      en: 'Prediction check-in',
    }),
    linkDimensions: pick(locale, {
      'zh-CN': '十维度',
      'zh-Hant': '十維度',
      en: 'Ten dimensions',
    }),
    linkEvents: pick(locale, {
      'zh-CN': '人生事件',
      'zh-Hant': '人生事件',
      en: 'Life events',
    }),
    stripTitle: pick(locale, {
      'zh-CN': '复盘闭环',
      'zh-Hant': '復盤閉環',
      en: 'Review loop',
    }),
    footerTitle: pick(locale, {
      'zh-CN': '复盘如何生效',
      'zh-Hant': '復盤如何生效',
      en: 'How review feeds the next report',
    }),
    footerBody: pick(locale, {
      'zh-CN': '年度复盘会写入长期档案，并在下次报告生成时影响表达重点与保守程度。',
      'zh-Hant': '年度復盤會寫入長期檔案，並在下次報告生成時影響表達重點與保守程度。',
      en: 'Annual review writes into your long-term profile and shapes focus and caution on the next report.',
    }),
    footerCta: pick(locale, {
      'zh-CN': '生成新报告',
      'zh-Hant': '生成新報告',
      en: 'Generate new report',
    }),
  };
}

/** Client body: load/error/empty, year picker, email gate */
export function annualReviewBodyCopy(locale: SiteLocale) {
  return {
    loading: pick(locale, {
      'zh-CN': '正在汇总年度复盘…',
      'zh-Hant': '正在彙總年度復盤…',
      en: 'Building annual review…',
    }),
    errorNoSettings: pick(locale, {
      'zh-CN': '无法读取测算资料，请先完善出生信息。',
      'zh-Hant': '無法讀取測算資料，請先完善出生資訊。',
      en: 'Could not read chart profile. Complete birth details first.',
    }),
    errorNoBirth: pick(locale, {
      'zh-CN': '还没有可用的出生资料，请先创建档案。',
      'zh-Hant': '還沒有可用的出生資料，請先建立檔案。',
      en: 'No birth profile yet. Create one first.',
    }),
    errorLoadFailed: pick(locale, {
      'zh-CN': '加载档案失败，请稍后重试。',
      'zh-Hant': '載入檔案失敗，請稍後重試。',
      en: 'Failed to load profile. Please try again.',
    }),
    ctaCreateProfile: pick(locale, {
      'zh-CN': '去创建档案',
      'zh-Hant': '去建立檔案',
      en: 'Create profile',
    }),

    // Email gate (hit rate < 60%)
    emailGateEyebrow: pick(locale, {
      'zh-CN': '命中率门禁',
      'zh-Hant': '命中率門禁',
      en: 'Hit-rate gate',
    }),
    emailGateTitle: (hitPercent: number) =>
      pick(locale, {
        'zh-CN': `当前命中率 ${hitPercent}%，建议先绑定邮箱`,
        'zh-Hant': `目前命中率 ${hitPercent}%，建議先綁定郵箱`,
        en: `Hit rate is ${hitPercent}%. Bind email first`,
      }),
    emailGateBody: pick(locale, {
      'zh-CN':
        '低于 60% 时，跨年校准需要保留历史预测与反馈。绑定邮箱后，预测会同步到账号，年度复盘才能持续收敛。',
      'zh-Hant':
        '低於 60% 時，跨年校準需要保留歷史預測與回饋。綁定郵箱後，預測會同步到帳號，年度復盤才能持續收斂。',
      en: 'Below 60%, year-over-year calibration needs saved history. Bind email so predictions sync to your account and the annual review can keep tightening.',
    }),
    emailGateBind: pick(locale, {
      'zh-CN': '绑定邮箱并保存预测',
      'zh-Hant': '綁定郵箱並儲存預測',
      en: 'Bind email & save predictions',
    }),
    emailGatePredictions: pick(locale, {
      'zh-CN': '先完成预测回访',
      'zh-Hant': '先完成預測回訪',
      en: 'Finish prediction check-ins first',
    }),

    // Year picker
    yearEyebrow: pick(locale, {
      'zh-CN': '复盘年份',
      'zh-Hant': '復盤年份',
      en: 'Review year',
    }),
    yearDescription: pick(locale, {
      'zh-CN': '汇总该年的预测反馈与人生事件，生成命中率与校准建议。',
      'zh-Hant': '彙總該年的預測回饋與人生事件，生成命中率與校準建議。',
      en: 'Aggregate that year’s prediction feedback and life events into hit rate and calibration tips.',
    }),
    yearLabel: pick(locale, {
      'zh-CN': '选择年份',
      'zh-Hant': '選擇年份',
      en: 'Select year',
    }),
    yearOption: (year: number) =>
      pick(locale, {
        'zh-CN': `${year} 年`,
        'zh-Hant': `${year} 年`,
        en: `${year}`,
      }),

    // Empty state
    emptyTitle: (year: number) =>
      pick(locale, {
        'zh-CN': `${year} 年暂无足够复盘数据`,
        'zh-Hant': `${year} 年暫無足夠復盤資料`,
        en: `Not enough review data for ${year}`,
      }),
    emptyBody: pick(locale, {
      'zh-CN': '先完成报告预测回访，或记录当年真实人生事件，系统才能汇总命中率与校准建议。',
      'zh-Hant': '先完成報告預測回訪，或記錄當年真實人生事件，系統才能彙總命中率與校準建議。',
      en: 'Check in on report predictions or log real life events for that year so hit rate and calibration can be built.',
    }),
    emptyCtaPredictions: pick(locale, {
      'zh-CN': '去预测回访',
      'zh-Hant': '去預測回訪',
      en: 'Prediction check-in',
    }),
    emptyCtaEvents: pick(locale, {
      'zh-CN': '记录人生事件',
      'zh-Hant': '記錄人生事件',
      en: 'Log life events',
    }),
  };
}

/** Card chrome: stats labels, section titles, pending/note fallbacks */
export function annualReviewCardCopy(locale: SiteLocale) {
  return {
    eyebrow: pick(locale, {
      'zh-CN': '年度复盘',
      'zh-Hant': '年度復盤',
      en: 'Annual review',
    }),
    yearTitle: (year: number) =>
      pick(locale, {
        'zh-CN': `${year} 年回顾`,
        'zh-Hant': `${year} 年回顧`,
        en: `${year} in review`,
      }),
    predictionSummary: (total: number, feedbackCount: number) =>
      pick(locale, {
        'zh-CN': `预测 ${total} 条 · 已反馈 ${feedbackCount} 条`,
        'zh-Hant': `預測 ${total} 條 · 已回饋 ${feedbackCount} 條`,
        en: `${total} predictions · ${feedbackCount} with feedback`,
      }),
    overallHitRate: pick(locale, {
      'zh-CN': '整体命中率',
      'zh-Hant': '整體命中率',
      en: 'Overall hit rate',
    }),
    dimensionsTitle: pick(locale, {
      'zh-CN': '十维度命中',
      'zh-Hant': '十維度命中',
      en: 'Ten-dimension hits',
    }),
    dimensionStats: (total: number, feedbackCount: number, visits: number) =>
      pick(locale, {
        'zh-CN': `预测 ${total} · 反馈 ${feedbackCount} · 访问 ${visits}`,
        'zh-Hant': `預測 ${total} · 回饋 ${feedbackCount} · 造訪 ${visits}`,
        en: `${total} predictions · ${feedbackCount} feedback · ${visits} visits`,
      }),
    pendingFeedback: pick(locale, {
      'zh-CN': '待反馈',
      'zh-Hant': '待回饋',
      en: 'Awaiting feedback',
    }),
    highlightsTitle: pick(locale, {
      'zh-CN': '命中亮点',
      'zh-Hant': '命中亮點',
      en: 'Hit highlights',
    }),
    missesTitle: pick(locale, {
      'zh-CN': '需校准',
      'zh-Hant': '需校準',
      en: 'Needs calibration',
    }),
    missNoteFallback: pick(locale, {
      'zh-CN': '建议补充事件反馈',
      'zh-Hant': '建議補充事件回饋',
      en: 'Add event feedback when you can',
    }),
    adjustmentsTitle: pick(locale, {
      'zh-CN': '今年调整建议',
      'zh-Hant': '今年調整建議',
      en: 'Adjustment tips this year',
    }),
  };
}
