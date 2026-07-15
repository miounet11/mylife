/**
 * Localize public report SEO titles/descriptions for zh-Hant / en.
 * Engine facts stay identical; expression layer only.
 */

import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';
import { absoluteUrl, withLocalePrefix } from '@/lib/seo';

/** Common day-master glossary (天干). */
const DAY_MASTER_EN: Record<string, string> = {
  甲: 'Jia (Yang Wood)',
  乙: 'Yi (Yin Wood)',
  丙: 'Bing (Yang Fire)',
  丁: 'Ding (Yin Fire)',
  戊: 'Wu (Yang Earth)',
  己: 'Ji (Yin Earth)',
  庚: 'Geng (Yang Metal)',
  辛: 'Xin (Yin Metal)',
  壬: 'Ren (Yang Water)',
  癸: 'Gui (Yin Water)',
};

/** Frequent pattern-type fragments → English. */
const PATTERN_EN: Array<[RegExp, string]> = [
  [/正官格/, 'Direct Officer pattern'],
  [/七杀格|偏官格/, 'Seven Killings pattern'],
  [/正财格/, 'Direct Wealth pattern'],
  [/偏财格/, 'Indirect Wealth pattern'],
  [/正印格/, 'Direct Resource pattern'],
  [/偏印格|枭神格/, 'Indirect Resource pattern'],
  [/食神格/, 'Eating God pattern'],
  [/伤官格/, 'Hurting Officer pattern'],
  [/建禄格|月刃格|羊刃格/, 'Competitive/Blade pattern'],
  [/从财格/, 'Follow-Wealth pattern'],
  [/从杀格|从官格/, 'Follow-Officer pattern'],
  [/从儿格/, 'Follow-Output pattern'],
  [/化气格/, 'Transformation pattern'],
  [/正格/, 'Standard pattern'],
  [/从势格|从强格/, 'Follow-Strength pattern'],
  [/结构格局|普通格局|格局/, 'Structure pattern'],
];

export type PublicReportSeoLike = {
  title: string;
  description: string;
  patternType?: string;
  dayMaster?: string;
  canonical?: string;
  id?: string;
};

export function translateDayMaster(raw?: string | null, locale: SiteLocale = 'en'): string {
  const v = `${raw || ''}`.trim();
  if (!v) return locale === 'en' ? 'Daymaster' : locale === 'zh-Hant' ? '日主' : '日主';
  if (locale === 'zh-CN') return v;
  if (locale === 'zh-Hant') return toSiteLocaleText(v, 'zh-Hant');
  // en: first character stem if present
  const stem = v[0];
  if (DAY_MASTER_EN[stem]) {
    return v.length > 1 ? `${DAY_MASTER_EN[stem]} (${v})` : DAY_MASTER_EN[stem];
  }
  return v;
}

export function translatePatternType(raw?: string | null, locale: SiteLocale = 'en'): string {
  const v = `${raw || ''}`.trim() || '结构格局';
  if (locale === 'zh-CN') return v;
  if (locale === 'zh-Hant') return toSiteLocaleText(v, 'zh-Hant');
  for (const [re, en] of PATTERN_EN) {
    if (re.test(v)) return en;
  }
  // keep original with English wrapper when unknown
  return `Bazi pattern (${v})`;
}

function englishFallbackDescription(pattern: string, dayMaster: string): string {
  return (
    `Anonymous ${pattern} structure case for a ${dayMaster} daymaster. `
    + 'Focus on stage fit, risk bounds, and executable next actions. '
    + 'Life K-Line report — verify with prediction check-in; not medical, legal, or investment advice.'
  );
}

/**
 * Build locale-aware public SEO from base (usually Chinese) fields.
 */
export function localizePublicReportSeo(
  base: PublicReportSeoLike,
  locale: SiteLocale,
  reportId?: string
): PublicReportSeoLike & {
  patternType: string;
  dayMaster: string;
  locale: SiteLocale;
} {
  const id = reportId || base.id || '';
  const patternType = translatePatternType(base.patternType || extractPatternFromTitle(base.title), locale);
  const dayMaster = translateDayMaster(base.dayMaster || extractDayMasterFromTitle(base.title), locale);

  if (locale === 'zh-CN') {
    return {
      ...base,
      patternType,
      dayMaster,
      locale,
      canonical: absoluteUrl(withLocalePrefix(`/result/${id}`, 'zh-CN')),
    };
  }

  if (locale === 'zh-Hant') {
    return {
      title: toSiteLocaleText(base.title, 'zh-Hant'),
      description: toSiteLocaleText(base.description, 'zh-Hant'),
      patternType,
      dayMaster,
      locale,
      canonical: absoluteUrl(withLocalePrefix(`/result/${id}`, 'zh-Hant')),
    };
  }

  // English L2 title + decision-oriented description (engine Chinese body remains below)
  const title = `${patternType} · ${dayMaster} — anonymous structure case`;
  const description = englishFallbackDescription(patternType, dayMaster);

  return {
    title,
    description,
    patternType,
    dayMaster,
    locale,
    canonical: absoluteUrl(withLocalePrefix(`/result/${id}`, 'en')),
  };
}

function extractPatternFromTitle(title?: string): string {
  const t = `${title || ''}`;
  const m = t.match(/^([^·•]+)/);
  return (m?.[1] || '').trim();
}

function extractDayMasterFromTitle(title?: string): string {
  const t = `${title || ''}`;
  // e.g. 偏财格 · 甲匿名结构判断案例
  const m = t.match(/[·•]\s*([甲乙丙丁戊己庚辛壬癸])/);
  return m?.[1] || '';
}

/** Structured SSR summary bullets for public/locale chrome. */
export function publicReportSummaryPoints(locale: SiteLocale): string[] {
  if (locale === 'en') {
    return [
      'Start with the core structure verdict, not jargon.',
      'Map your current stage (lift vs consolidate).',
      'Pick one executable action; verify in 30–90 days.',
      'Use 10 dimensions for a narrow question; full report for global structure.',
    ];
  }
  if (locale === 'zh-Hant') {
    return [
      '先看結構結論，不要先堆術語。',
      '對準當前階段（抬升或收斂）。',
      '選一個可執行動作，在 30–90 天內回訪驗證。',
      '窄問題用十維度；全局結構用完整報告。',
    ];
  }
  return [
    '先看结构结论，不要先堆术语。',
    '对准当前阶段（抬升或收敛）。',
    '选一个可执行动作，在 30–90 天内回访验证。',
    '窄问题用十维度；全局结构用完整报告。',
  ];
}
