/**
 * EN/zh chrome for docs hub (/docs) and articles (/docs/[slug]).
 * Chinese source for entries/content stays in `lib/portal-nav.ts` (DOC_ENTRIES / DOC_CONTENT).
 * Present via href/slug map; zh-Hant falls back to simplified conversion unless a traditional string is provided.
 */

import type { PortalEntry } from '@/lib/portal-nav';
import { DOC_CONTENT } from '@/lib/portal-nav';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };
type EntryFields = { title: string; description: string; cta?: string };
type DocSection = [string, string];
type DocBody = { title: string; sections: DocSection[] };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Page hero + SEO + section chrome for /docs */
export function docsPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '文档与读法指南',
      'zh-Hant': '文檔與讀法指南',
      en: 'Docs & reading guide',
    }),
    metaDescription: pick(locale, {
      'zh-CN': '出生信息填写、真太阳时说明、第一份报告阅读顺序。',
      'zh-Hant': '出生資訊填寫、真太陽時說明、第一份報告閱讀順序。',
      en: 'How to enter birth data, true solar time, and the reading order for your first report.',
    }),
    headerCta: pick(locale, {
      'zh-CN': '开始判断',
      'zh-Hant': '開始判斷',
      en: 'Start analysis',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '文档',
      'zh-Hant': '文檔',
      en: 'Docs',
    }),
    title: pick(locale, {
      'zh-CN': '先理解方法，再读报告',
      'zh-Hant': '先理解方法，再讀報告',
      en: 'Understand the method, then read the report',
    }),
    description: pick(locale, {
      'zh-CN': '出生信息、真太阳时与第一份报告的阅读顺序。',
      'zh-Hant': '出生資訊、真太陽時與第一份報告的閱讀順序。',
      en: 'Birth data, true solar time, and the reading order for your first report.',
    }),
    linkAnalyze: pick(locale, {
      'zh-CN': '开始判断',
      'zh-Hant': '開始判斷',
      en: 'Start analysis',
    }),
    linkLearn: pick(locale, {
      'zh-CN': '学习专题',
      'zh-Hant': '學習專題',
      en: 'Learning tracks',
    }),
    stripTitle: pick(locale, {
      'zh-CN': '方法路径',
      'zh-Hant': '方法路徑',
      en: 'Method path',
    }),
    sectionsTitle: pick(locale, {
      'zh-CN': '推荐阅读',
      'zh-Hant': '推薦閱讀',
      en: 'Recommended reading',
    }),
  };
}

/** Article chrome for /docs/[slug] */
export function docsArticleCopy(locale: SiteLocale) {
  return {
    metaFallback: pick(locale, {
      'zh-CN': '文档',
      'zh-Hant': '文檔',
      en: 'Docs',
    }),
    metaTitleSuffix: pick(locale, {
      'zh-CN': '文档',
      'zh-Hant': '文檔',
      en: 'Docs',
    }),
    headerCta: pick(locale, {
      'zh-CN': '全部文档',
      'zh-Hant': '全部文檔',
      en: 'All docs',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '文档',
      'zh-Hant': '文檔',
      en: 'Docs',
    }),
    practiceCta: pick(locale, {
      'zh-CN': '去工作台实践',
      'zh-Hant': '去工作台實踐',
      en: 'Practice in the workspace',
    }),
  };
}

/**
 * Preferred lookup: full href → EN fields.
 * Covers DOC_ENTRIES in portal-nav.ts.
 */
const DOC_ENTRY_EN_BY_HREF: Record<string, EntryFields> = {
  '/docs/birth-info': {
    title: 'How to enter birth data',
    description: 'Gregorian / lunar / four pillars, and confidence bounds when hour is unknown.',
  },
  '/docs/true-solar-time': {
    title: 'True solar time explained',
    description: 'Why birthplace affects hour judgment, and how boundary cases are handled.',
  },
  '/docs/read-first-report': {
    title: 'How to read a report',
    description: 'A 5-minute order: conclusion → action → verification.',
  },
};

/** Full EN article bodies keyed by DOC_CONTENT slug. */
const DOC_CONTENT_EN_BY_SLUG: Record<string, DocBody> = {
  'birth-info': {
    title: 'How to enter birth data',
    sections: [
      [
        'Pick the question first, then birth data',
        'Question type shapes what the report emphasizes. Decide career, wealth, relationships, or yearly flow first, then complete birth time and place.',
      ],
      [
        'Unknown hour is still fine',
        'When you mark “hour unknown,” the system lowers hour-pillar weight, prioritizes year/month/day structure, and labels confidence bounds in the report.',
      ],
      [
        'Birthplace affects true solar time',
        'Place is used for timezone and true-solar-time correction. Near hour boundaries, correction can change which hour pillar applies.',
      ],
    ],
  },
  'true-solar-time': {
    title: 'True solar time explained',
    sections: [
      [
        'What true solar time is',
        'True solar time converts clock time to the local solar position for the birth longitude, then maps that to the hour pillar used in the four-pillar chart.',
      ],
      [
        'When it matters most',
        'Impact is largest near hour transitions (e.g. around 23:00 and other hour edges). Outside those boundaries it usually does not change the big structure.',
      ],
      [
        'Default system behavior',
        'The workspace enables true-solar-time correction by default; reports note the basis so you can judge confidence.',
      ],
    ],
  },
  'read-first-report': {
    title: 'How to read your first report',
    sections: [
      [
        'Screen 1: core conclusion',
        'First check whether the report answers your core question, then look at stage placement and the current score.',
      ],
      [
        'Screen 2: next actions',
        'Turn judgment into 1–3 verifiable actions. Do not try to absorb every term at once.',
      ],
      [
        'Screen 3: verify with feedback',
        'Record real-world nodes in the event calendar; use structure Q&A to refine action order.',
      ],
    ],
  },
};

function localizeZhFields(entry: PortalEntry, locale: 'zh-Hant'): PortalEntry {
  return {
    ...entry,
    title: toSiteLocaleText(entry.title, locale),
    description: toSiteLocaleText(entry.description, locale),
    ...(entry.cta ? { cta: toSiteLocaleText(entry.cta, locale) } : {}),
  };
}

function applyEntryFields(entry: PortalEntry, fields: EntryFields): PortalEntry {
  return {
    href: entry.href,
    title: fields.title,
    description: fields.description,
    ...(fields.cta !== undefined
      ? { cta: fields.cta }
      : entry.cta
        ? { cta: entry.cta }
        : {}),
  };
}

/**
 * Present a docs hub entry for the active locale.
 * EN: match by href; otherwise keep Chinese source from portal-nav.
 * zh-Hant: traditionalize source strings. zh-CN: pass-through.
 */
export function presentDocEntry(entry: PortalEntry, locale: SiteLocale): PortalEntry {
  if (locale === 'zh-CN') return entry;
  if (locale === 'zh-Hant') return localizeZhFields(entry, 'zh-Hant');

  const byHref = DOC_ENTRY_EN_BY_HREF[entry.href];
  if (byHref) return applyEntryFields(entry, byHref);

  return entry;
}

/** Map DOC_ENTRIES for EntryLinkGrid. */
export function presentDocEntries(entries: PortalEntry[], locale: SiteLocale): PortalEntry[] {
  return entries.map((entry) => presentDocEntry(entry, locale));
}

function traditionalizeDocBody(body: DocBody): DocBody {
  return {
    title: toSiteLocaleText(body.title, 'zh-Hant'),
    sections: body.sections.map(
      ([heading, text]) =>
        [toSiteLocaleText(heading, 'zh-Hant'), toSiteLocaleText(text, 'zh-Hant')] as DocSection,
    ),
  };
}

/**
 * Present DOC_CONTENT for a slug and locale.
 * zh-CN: portal-nav Chinese source. zh-Hant: traditionalized source. en: full EN map.
 * Returns null when slug is unknown.
 */
export function presentDocContent(slug: string, locale: SiteLocale): DocBody | null {
  const source = DOC_CONTENT[slug];
  if (!source) return null;

  if (locale === 'en') {
    return DOC_CONTENT_EN_BY_SLUG[slug] ?? source;
  }
  if (locale === 'zh-Hant') return traditionalizeDocBody(source);
  return source;
}
