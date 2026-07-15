/**
 * Content locale presentation (decoupled from UI cookie locale).
 * See docs/GLOBALIZATION_STANDARD.md §2.3
 */

export type ContentLocaleGroupKey = 'en' | 'zh-Hant' | 'zh-Hans';

export interface ContentLocalePresentation {
  groupKey: ContentLocaleGroupKey;
  groupLabel: string;
  groupDescription: string;
  localeLabel: string;
  marketLabel: string;
  sortOrder: number;
}

const DEFAULT_MARKET_LABEL = '面向多语言用户';

export function getContentLocalePresentation(
  locale?: string | null,
  market?: string | null
): ContentLocalePresentation {
  const normalizedLocale = `${locale || ''}`.trim();
  const normalizedMarket = `${market || ''}`.trim() || DEFAULT_MARKET_LABEL;

  if (normalizedLocale === 'en-US') {
    return {
      groupKey: 'en',
      groupLabel: 'English',
      groupDescription:
        'For international readers, overseas-born Chinese, and English-speaking professionals.',
      localeLabel: 'Global / US',
      marketLabel: normalizedMarket,
      sortOrder: 1,
    };
  }

  if (normalizedLocale === 'en-GB') {
    return {
      groupKey: 'en',
      groupLabel: 'English',
      groupDescription:
        'For international readers, overseas-born Chinese, and English-speaking professionals.',
      localeLabel: 'UK / Europe',
      marketLabel: normalizedMarket,
      sortOrder: 1,
    };
  }

  if (normalizedLocale === 'en-SG') {
    return {
      groupKey: 'en',
      groupLabel: 'English',
      groupDescription:
        'For international readers, overseas-born Chinese, and English-speaking professionals.',
      localeLabel: 'Singapore',
      marketLabel: normalizedMarket,
      sortOrder: 1,
    };
  }

  if (normalizedLocale === 'en' || normalizedLocale.toLowerCase().startsWith('en-')) {
    return {
      groupKey: 'en',
      groupLabel: 'English',
      groupDescription:
        'For international readers, overseas-born Chinese, and English-speaking professionals.',
      localeLabel: 'English',
      marketLabel: normalizedMarket,
      sortOrder: 1,
    };
  }

  if (normalizedLocale === 'zh-TW') {
    return {
      groupKey: 'zh-Hant',
      groupLabel: '繁體中文',
      groupDescription: '面向台灣、香港與偏好繁體中文閱讀的用戶。',
      localeLabel: '台灣',
      marketLabel: normalizedMarket,
      sortOrder: 2,
    };
  }

  if (normalizedLocale === 'zh-HK') {
    return {
      groupKey: 'zh-Hant',
      groupLabel: '繁體中文',
      groupDescription: '面向台灣、香港與偏好繁體中文閱讀的用戶。',
      localeLabel: '香港',
      marketLabel: normalizedMarket,
      sortOrder: 2,
    };
  }

  if (
    normalizedLocale === 'zh-Hant'
    || /hant|tw|hk|mo/i.test(normalizedLocale)
  ) {
    return {
      groupKey: 'zh-Hant',
      groupLabel: '繁體中文',
      groupDescription: '面向台灣、香港與偏好繁體中文閱讀的用戶。',
      localeLabel: '繁體',
      marketLabel: normalizedMarket,
      sortOrder: 2,
    };
  }

  if (normalizedLocale === 'zh-US') {
    return {
      groupKey: 'zh-Hans',
      groupLabel: '简体中文',
      groupDescription: '面向中国大陆、海外华人和偏好简体中文阅读的用户。',
      localeLabel: '海外华人',
      marketLabel: normalizedMarket,
      sortOrder: 3,
    };
  }

  if (normalizedLocale === 'zh-SG' || normalizedLocale === 'zh-MY') {
    return {
      groupKey: 'zh-Hans',
      groupLabel: '简体中文',
      groupDescription: '面向中国大陆、海外华人和偏好简体中文阅读的用户。',
      localeLabel: '新马华人',
      marketLabel: normalizedMarket,
      sortOrder: 3,
    };
  }

  return {
    groupKey: 'zh-Hans',
    groupLabel: '简体中文',
    groupDescription: '面向中国大陆、海外华人和偏好简体中文阅读的用户。',
    localeLabel: normalizedLocale ? '简体中文' : '简体中文',
    marketLabel: normalizedMarket,
    sortOrder: 3,
  };
}

export function getLocaleAnchorId(groupKey: ContentLocaleGroupKey) {
  return `content-locale-${groupKey}`;
}

/** Infer content locale from slug/title/tags when meta.locale is missing (local seeds). */
export function inferContentLocale(input: {
  slug?: string | null;
  title?: string | null;
  tags?: string[] | null;
  keywords?: string[] | null;
  trackKey?: string | null;
}): string {
  const blob = [
    input.slug || '',
    input.title || '',
    ...(input.tags || []),
    ...(input.keywords || []),
    input.trackKey || '',
  ]
    .join(' ')
    .toLowerCase();

  if (
    /\ben-us\b|\benglish\b|world-yi-en|\/en\b|four pillars|bazi chart|life rhythm|career reset overseas/.test(
      blob
    )
  ) {
    return 'en-US';
  }
  if (/zh-tw|繁體|台灣|台湾|香港|zh-hk|zh-hant/.test(blob)) {
    return /香港|zh-hk|hk/.test(blob) ? 'zh-HK' : 'zh-TW';
  }
  if (
    /海外|华人|華人|migration|toronto|singapore|vancouver|sydney|london|new-york|nyc|global|zh-us|geo/.test(
      blob
    )
  ) {
    return 'zh-US';
  }
  return 'zh-Hans';
}

export function inferContentMarket(locale: string): string {
  if (locale.startsWith('en')) return 'World Yi English';
  if (locale === 'zh-TW') return 'Taiwan Chinese';
  if (locale === 'zh-HK') return 'Hong Kong Chinese';
  if (locale === 'zh-US') return 'Global Chinese';
  if (locale === 'zh-SG' || locale === 'zh-MY') return 'SEA Chinese';
  return 'World Yi';
}
