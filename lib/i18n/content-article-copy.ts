/**
 * EN/zh chrome for knowledge + case article pages (/knowledge/[slug], /cases/[slug]).
 * Article body stays content-locale truth; this layer only covers shell UI + SEO fallbacks.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Shared shell labels used by both knowledge and case articles */
export function contentArticleChromeCopy(locale: SiteLocale) {
  return {
    homeCrumb: pick(locale, {
      'zh-CN': '首页',
      'zh-Hant': '首頁',
      en: 'Home',
    }),
    dimensionsCta: pick(locale, {
      'zh-CN': '十维度研判',
      'zh-Hant': '十維度研判',
      en: '10 dimensions',
    }),
    dimensionsShort: pick(locale, {
      'zh-CN': '十维度',
      'zh-Hant': '十維度',
      en: '10 dimensions',
    }),
    sceneJudgment: pick(locale, {
      'zh-CN': '场景研判',
      'zh-Hant': '場景研判',
      en: 'Scenario analysis',
    }),
    toolsLink: pick(locale, {
      'zh-CN': '工具',
      'zh-Hant': '工具',
      en: 'Tools',
    }),
    backToTopic: pick(locale, {
      'zh-CN': '回到专题',
      'zh-Hant': '回到專題',
      en: 'Back to topic',
    }),
    relatedTopic: pick(locale, {
      'zh-CN': '相关专题',
      'zh-Hant': '相關專題',
      en: 'Related topic',
    }),
    geoReadyBadge: pick(locale, {
      'zh-CN': 'AI 可引用',
      'zh-Hant': 'AI 可引用',
      en: 'AI-citable',
    }),
  };
}

export function knowledgeArticleCopy(locale: SiteLocale) {
  const chrome = contentArticleChromeCopy(locale);
  return {
    ...chrome,
    metaFallback: pick(locale, {
      'zh-CN': '知识库',
      'zh-Hant': '知識庫',
      en: 'Knowledge',
    }),
    hubCrumb: pick(locale, {
      'zh-CN': '知识库',
      'zh-Hant': '知識庫',
      en: 'Knowledge',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '知识库',
      'zh-Hant': '知識庫',
      en: 'Knowledge',
    }),
    railTitle: pick(locale, {
      'zh-CN': '把这篇文章接到功能',
      'zh-Hant': '把這篇文章接到功能',
      en: 'Connect this article to product tools',
    }),
    railDescription: pick(locale, {
      'zh-CN':
        '相关十维度研判、免费工具与完整报告入口，帮助你从「读懂」走到「验证」。',
      'zh-Hant':
        '相關十維度研判、免費工具與完整報告入口，幫助你從「讀懂」走到「驗證」。',
      en: 'Related 10-dimension paths, free tools, and full-report entry—from reading to verification.',
    }),
    defaultKeywords: (trackKey: string) =>
      locale === 'en'
        ? [trackKey, 'World Yi', 'Life K-Line', 'bazi structure']
        : [trackKey, '世界易', '人生K线'],
    hubMetaKeywords:
      locale === 'en'
        ? [
            'bazi knowledge',
            'World Yi',
            'true solar time',
            'how to read bazi report',
            'overseas Chinese destiny structure',
            '10 dimensions',
            'GEO',
            'Life K-Line',
          ]
        : [
            '八字知识',
            '世界易',
            '真太阳时',
            '报告读法',
            '海外华人运势',
            '十维度',
            'GEO',
            'bazi knowledge',
            'World Yi',
          ],
  };
}

export function caseArticleCopy(locale: SiteLocale) {
  const chrome = contentArticleChromeCopy(locale);
  return {
    ...chrome,
    metaFallback: pick(locale, {
      'zh-CN': '案例库',
      'zh-Hant': '案例庫',
      en: 'Cases',
    }),
    hubCrumb: pick(locale, {
      'zh-CN': '案例库',
      'zh-Hant': '案例庫',
      en: 'Cases',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '案例库',
      'zh-Hant': '案例庫',
      en: 'Cases',
    }),
    generateSimilar: pick(locale, {
      'zh-CN': '生成类似报告',
      'zh-Hant': '生成類似報告',
      en: 'Generate a similar report',
    }),
    generateSimilarLong: pick(locale, {
      'zh-CN': '生成类似处境的报告',
      'zh-Hant': '生成類似處境的報告',
      en: 'Generate a report for a similar situation',
    }),
    railTitle: pick(locale, {
      'zh-CN': '案例之后：落到你的处境',
      'zh-Hant': '案例之後：落到你的處境',
      en: 'After the case: apply it to your situation',
    }),
    railDescription: pick(locale, {
      'zh-CN':
        '用十维度场景与工具，把案例中的结构判断迁移到你自己的命盘与时间窗。',
      'zh-Hant':
        '用十維度場景與工具，把案例中的結構判斷遷移到你自己的命盤與時間窗。',
      en: 'Use 10-dimension scenarios and tools to map the case’s structure judgment onto your own chart and timing window.',
    }),
    defaultKeywords: (trackKey: string) =>
      locale === 'en'
        ? [trackKey, 'case study', 'World Yi', 'Life K-Line']
        : [trackKey, '案例', '世界易', '人生K线'],
    hubMetaKeywords:
      locale === 'en'
        ? [
            'bazi case study',
            'career case',
            'relationship case',
            'migration case',
            'World Yi',
            '10 dimensions',
            'Life K-Line',
          ]
        : [
            '八字案例',
            '事业案例',
            '关系案例',
            '迁移案例',
            '世界易',
            '十维度',
            'bazi case study',
            'World Yi',
          ],
  };
}
