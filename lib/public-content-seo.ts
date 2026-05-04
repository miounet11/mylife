import type { Metadata } from 'next';

const SITE_URL = 'https://www.life-kline.com';
const SITE_NAME = '人生K线';
const DEFAULT_OG_IMAGE = `${SITE_URL}/icon.svg`;

type DateLike = string | Date | null | undefined;

export interface PublicContentImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

interface PublicMetadataInput {
  title: string;
  description: string;
  path: string;
  type?: 'article' | 'website';
  locale?: string;
  languages?: Record<string, string>;
  keywords?: string[];
  images?: PublicContentImage[];
  publishedTime?: DateLike;
  modifiedTime?: DateLike;
  section?: string;
  tags?: string[];
  answerSummary?: string;
  searchIntents?: string[];
  entityKeywords?: string[];
  geoRegion?: string;
  geoPlaceName?: string;
}

interface ArticleSchemaInput {
  headline: string;
  description: string;
  path: string;
  articleSection?: string;
  keywords?: string[];
  image?: PublicContentImage[];
  datePublished?: DateLike;
  dateModified?: DateLike;
  inLanguage?: string;
  abstract?: string;
  about?: string[];
  mentions?: string[];
  audience?: string;
  mainEntityName?: string;
  isAccessibleForFree?: boolean;
}

interface CollectionSchemaInput {
  headline: string;
  description: string;
  path: string;
  keywords?: string[];
  inLanguage?: string;
  about?: string[];
  image?: PublicContentImage[];
}

interface ItemListElementInput {
  name: string;
  path: string;
  position?: number;
}

function toAbsoluteUrl(path: string) {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

function toIsoDate(value?: DateLike) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function normalizeLocale(locale?: string) {
  if (!locale) {
    return 'zh-CN';
  }

  if (locale === 'en') {
    return 'en-US';
  }

  if (locale === 'zh' || locale === 'zh-Hans') {
    return 'zh-CN';
  }

  if (locale === 'zh-Hant') {
    return 'zh-TW';
  }

  return locale;
}

function normalizeOgLocale(locale?: string) {
  return normalizeLocale(locale).replace('-', '_');
}

function uniqueStrings(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((item) => `${item || ''}`.trim()).filter(Boolean)));
}

function normalizeImages(images?: PublicContentImage[]) {
  const normalized = (images || [])
    .map((image) => ({
      ...image,
      url: toAbsoluteUrl(image.url),
    }))
    .filter((image) => image.url);

  if (normalized.length > 0) {
    return normalized;
  }

  return [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME }];
}

function toSchemaImage(image: PublicContentImage) {
  return {
    '@type': 'ImageObject',
    url: toAbsoluteUrl(image.url),
    ...(image.width ? { width: image.width } : {}),
    ...(image.height ? { height: image.height } : {}),
    ...(image.alt ? { caption: image.alt } : {}),
  };
}

function toSchemaThings(values?: string[]) {
  return uniqueStrings(values || [])
    .slice(0, 12)
    .map((name) => ({
      '@type': 'Thing',
      name,
    }));
}

export function normalizeAlternateLanguagePaths(input: {
  languages?: Record<string, string>;
  defaultLocale?: string;
  defaultPath: string;
}) {
  const defaultLocale = normalizeLocale(input.defaultLocale);
  const languageEntries = input.languages ?? {
    [defaultLocale]: input.defaultPath,
    'x-default': input.defaultPath,
  };

  return {
    ...languageEntries,
    'x-default': languageEntries['x-default'] ?? languageEntries[defaultLocale] ?? input.defaultPath,
  };
}

export function createPublicContentMetadata(input: PublicMetadataInput): Metadata {
  const url = toAbsoluteUrl(input.path);
  const pageLocale = normalizeLocale(input.locale);
  const images = normalizeImages(input.images);
  const keywords = uniqueStrings([
    ...(input.keywords || []),
    ...(input.tags || []),
    ...(input.entityKeywords || []),
  ]);
  const publishedTime = toIsoDate(input.publishedTime);
  const modifiedTime = toIsoDate(input.modifiedTime);
  const other: NonNullable<Metadata['other']> = {
    ...(input.answerSummary ? { 'ai-answer-summary': input.answerSummary } : {}),
    ...(input.searchIntents?.length ? { 'search-intent': input.searchIntents.join(' | ') } : {}),
    ...(input.entityKeywords?.length ? { 'entity-keywords': input.entityKeywords.join(', ') } : {}),
    ...(input.geoRegion ? { 'geo.region': input.geoRegion } : {}),
    ...(input.geoPlaceName ? { 'geo.placename': input.geoPlaceName } : {}),
  };
  const languages = Object.fromEntries(
    Object.entries(normalizeAlternateLanguagePaths({
      languages: input.languages,
      defaultLocale: pageLocale,
      defaultPath: input.path,
    })).map(([key, value]) => [key, toAbsoluteUrl(value)]),
  );

  return {
    title: input.title,
    description: input.description,
    keywords: keywords.length ? keywords : undefined,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: input.type === 'website'
      ? {
          type: 'website',
          url,
          siteName: SITE_NAME,
          title: input.title,
          description: input.description,
          locale: normalizeOgLocale(pageLocale),
          images,
        }
      : {
          type: 'article',
          url,
          siteName: SITE_NAME,
          title: input.title,
          description: input.description,
          locale: normalizeOgLocale(pageLocale),
          images,
          publishedTime,
          modifiedTime,
          section: input.section,
          tags: input.tags,
        },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: images.map((image) => image.url),
    },
    ...(Object.keys(other).length ? { other } : {}),
  };
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function createArticleSchema(input: ArticleSchemaInput) {
  const url = toAbsoluteUrl(input.path);
  const images = normalizeImages(input.image);
  const about = toSchemaThings(input.about);
  const mentions = toSchemaThings(input.mentions);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${url}#article`,
    headline: input.headline,
    description: input.description,
    abstract: input.abstract,
    inLanguage: normalizeLocale(input.inLanguage),
    articleSection: input.articleSection,
    keywords: uniqueStrings(input.keywords || []).join(', '),
    image: images.map(toSchemaImage),
    datePublished: toIsoDate(input.datePublished),
    dateModified: toIsoDate(input.dateModified),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    mainEntity: input.mainEntityName ? {
      '@type': 'Thing',
      name: input.mainEntityName,
    } : undefined,
    about: about.length ? about : undefined,
    mentions: mentions.length ? mentions : undefined,
    audience: input.audience ? {
      '@type': 'Audience',
      audienceType: input.audience,
    } : undefined,
    isAccessibleForFree: input.isAccessibleForFree ?? true,
    url,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon.svg`,
      },
    },
  };
}

export function createCollectionPageSchema(input: CollectionSchemaInput) {
  const url = toAbsoluteUrl(input.path);
  const about = toSchemaThings(input.about);

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    headline: input.headline,
    description: input.description,
    inLanguage: normalizeLocale(input.inLanguage),
    keywords: uniqueStrings(input.keywords || []).join(', '),
    image: input.image?.map(toSchemaImage),
    about: about.length ? about : undefined,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
    isPartOf: SITE_URL,
    isAccessibleForFree: true,
  };
}

export function createItemListSchema(name: string, items: ItemListElementInput[]) {
  if (items.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: item.position ?? index + 1,
      name: item.name,
      url: toAbsoluteUrl(item.path),
    })),
  };
}
