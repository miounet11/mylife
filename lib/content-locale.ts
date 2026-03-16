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

export function getContentLocalePresentation(locale?: string, market?: string): ContentLocalePresentation {
  const normalizedLocale = `${locale || ''}`.trim();
  const normalizedMarket = `${market || ''}`.trim() || DEFAULT_MARKET_LABEL;

  if (normalizedLocale === 'en-US') {
    return {
      groupKey: 'en',
      groupLabel: 'English',
      groupDescription: 'For international readers, overseas-born Chinese, and English-speaking professionals.',
      localeLabel: 'Global / US',
      marketLabel: normalizedMarket,
      sortOrder: 1,
    };
  }

  if (normalizedLocale === 'en-GB') {
    return {
      groupKey: 'en',
      groupLabel: 'English',
      groupDescription: 'For international readers, overseas-born Chinese, and English-speaking professionals.',
      localeLabel: 'UK / Europe',
      marketLabel: normalizedMarket,
      sortOrder: 1,
    };
  }

  if (normalizedLocale === 'en-SG') {
    return {
      groupKey: 'en',
      groupLabel: 'English',
      groupDescription: 'For international readers, overseas-born Chinese, and English-speaking professionals.',
      localeLabel: 'Singapore',
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
    localeLabel: '简体中文',
    marketLabel: normalizedMarket,
    sortOrder: 3,
  };
}

export function getLocaleAnchorId(groupKey: ContentLocaleGroupKey) {
  return `content-locale-${groupKey}`;
}
