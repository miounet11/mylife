/**
 * EN/zh chrome for community hub (/community).
 * Chinese source for category entries stays in `lib/portal-nav.ts` (COMMUNITY_CATEGORIES).
 * Present via href map; zh-Hant falls back to simplified conversion unless a traditional string is provided.
 */

import type { PortalEntry } from '@/lib/portal-nav';
import type { SiteLocale } from '@/lib/i18n/site-locale';
import { toSiteLocaleText } from '@/lib/i18n/site-locale';

type Tri = { 'zh-CN': string; 'zh-Hant'?: string; en: string };
type EntryFields = { title: string; description: string; cta?: string };

function pick(locale: SiteLocale, map: Tri): string {
  if (locale === 'en') return map.en;
  if (locale === 'zh-Hant') return map['zh-Hant'] || toSiteLocaleText(map['zh-CN'], 'zh-Hant');
  return map['zh-CN'];
}

/** Page hero + SEO + section/footer chrome for /community */
export function communityPageCopy(locale: SiteLocale) {
  return {
    metaTitle: pick(locale, {
      'zh-CN': '社区｜结构追问与术数讨论',
      'zh-Hant': '社區｜結構追問與術數討論',
      en: 'Community · Structure Q&A and systems discussion',
    }),
    metaDescription: pick(locale, {
      'zh-CN': '八字、紫微、六爻、世界易等术数结构讨论区，按板块浏览高意图问题。',
      'zh-Hant': '八字、紫微、六爻、世界易等術數結構討論區，按板塊瀏覽高意圖問題。',
      en: 'Structure-focused discussion of Bazi, Zi Wei, Liu Yao, World-Yi, and more—browse boards by topic.',
    }),
    headerCta: pick(locale, {
      'zh-CN': '开始判断',
      'zh-Hant': '開始判斷',
      en: 'Start judgment',
    }),
    eyebrow: pick(locale, {
      'zh-CN': '社区',
      'zh-Hant': '社區',
      en: 'Community',
    }),
    title: pick(locale, {
      'zh-CN': '用结构语言讨论',
      'zh-Hant': '用結構語言討論',
      en: 'Discuss in structural language',
    }),
    description: pick(locale, {
      'zh-CN': '按术数板块浏览。可用工作台生成报告后，再回来对照。',
      'zh-Hant': '按術數板塊瀏覽。可用工作台生成報告後，再回來對照。',
      en: 'Browse by system board. Generate a report in the workspace, then come back to compare.',
    }),
    linkSearch: pick(locale, {
      'zh-CN': '站内搜索',
      'zh-Hant': '站內搜尋',
      en: 'Site search',
    }),
    linkChat: pick(locale, {
      'zh-CN': '结构追问',
      'zh-Hant': '結構追問',
      en: 'Structure Q&A',
    }),
    linkTeachers: pick(locale, {
      'zh-CN': '请老师',
      'zh-Hant': '請老師',
      en: 'Consultants',
    }),
    stripTitle: pick(locale, {
      'zh-CN': '讨论结构',
      'zh-Hant': '討論結構',
      en: 'Structured discussion',
    }),
    sectionsTitle: pick(locale, {
      'zh-CN': '板块',
      'zh-Hant': '板塊',
      en: 'Boards',
    }),
    footerBefore: pick(locale, {
      'zh-CN': '也可先从',
      'zh-Hant': '也可先從',
      en: 'Or start from',
    }),
    linkLearn: pick(locale, {
      'zh-CN': '学习专题',
      'zh-Hant': '學習專題',
      en: 'Learning tracks',
    }),
    footerOr: pick(locale, {
      'zh-CN': '或',
      en: 'or',
    }),
    linkKnowledge: pick(locale, {
      'zh-CN': '知识库',
      'zh-Hant': '知識庫',
      en: 'Knowledge base',
    }),
    footerAfter: pick(locale, {
      'zh-CN': '继续。',
      'zh-Hant': '繼續。',
      en: 'instead.',
    }),
  };
}

/**
 * Preferred lookup: full href → EN fields.
 * Covers COMMUNITY_CATEGORIES in portal-nav.ts.
 */
const COMMUNITY_CATEGORY_EN_BY_HREF: Record<string, EntryFields> = {
  '/community/category/bazi': {
    title: 'Bazi chart',
    description: 'Day master, favorable gods, dayun/yearly flow, and wealth/officer structure.',
    cta: 'Enter board',
  },
  '/community/category/ziwei': {
    title: 'Zi Wei Dou Shu',
    description: 'Life palace, four transformations, and palace-role fit questions.',
    cta: 'Enter board',
  },
  '/community/category/liuyao': {
    title: 'Liu Yao forecasting',
    description: 'Self/response lines, moving/changing lines, and favorable-god trade-offs.',
    cta: 'Enter board',
  },
  '/community/category/world_yi': {
    title: 'World-Yi framework',
    description: 'Modern judgment frame for structure, timing, environment, and action.',
    cta: 'Enter board',
  },
  '/community/category/fengshui': {
    title: 'Feng shui',
    description: 'Home layout, orientation, and environment-layer observation.',
    cta: 'Enter board',
  },
  '/community/category/geo': {
    title: 'Overseas Chinese destiny',
    description: 'Migration, cross-culture, and environment re-matching topics.',
    cta: 'Enter board',
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
 * Present a community category entry for the active locale.
 * EN: match by href; otherwise keep Chinese source from portal-nav.
 * zh-Hant: traditionalize source strings. zh-CN: pass-through.
 */
export function presentCommunityCategory(entry: PortalEntry, locale: SiteLocale): PortalEntry {
  if (locale === 'zh-CN') return entry;
  if (locale === 'zh-Hant') return localizeZhFields(entry, 'zh-Hant');

  const byHref = COMMUNITY_CATEGORY_EN_BY_HREF[entry.href];
  if (byHref) return applyEntryFields(entry, byHref);

  return entry;
}

/** Map COMMUNITY_CATEGORIES for EntryLinkGrid. */
export function presentCommunityCategories(
  entries: PortalEntry[],
  locale: SiteLocale,
): PortalEntry[] {
  return entries.map((entry) => presentCommunityCategory(entry, locale));
}
