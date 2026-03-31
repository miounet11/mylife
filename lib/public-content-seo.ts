import type { Metadata } from 'next';

const SITE_URL = 'https://www.life-kline.com';
const SITE_NAME = '人生K线';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

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
}

interface ArticleSchemaInput {
  headline: string;
  description: string;
  path: string;
  articleSection?: string;
  keywords?: string[];
}

interface CollectionSchemaInput {
  headline: string;
  description: string;
  path: string;
  keywords?: string[];
}

interface ItemListElementInput {
  name: string;
  path: string;
  position?: number;
}

function toAbsoluteUrl(path: string) {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

function normalizeOgLocale(locale?: string) {
  if (!locale) {
    return 'zh_CN';
  }

  return locale.replace('-', '_');
}

export function createPublicContentMetadata(input: PublicMetadataInput): Metadata {
  const url = toAbsoluteUrl(input.path);

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: input.type === 'website' ? 'website' : 'article',
      url,
      siteName: SITE_NAME,
      title: input.title,
      description: input.description,
      locale: normalizeOgLocale(input.locale),
      images: [
        {
          url: DEFAULT_OG_IMAGE,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: [DEFAULT_OG_IMAGE],
    },
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

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    articleSection: input.articleSection,
    keywords: input.keywords?.join(', '),
    mainEntityOfPage: url,
    url,
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon.svg`,
      },
    },
  };
}

export function createCollectionPageSchema(input: CollectionSchemaInput) {
  const url = toAbsoluteUrl(input.path);

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    headline: input.headline,
    description: input.description,
    keywords: input.keywords?.join(', '),
    mainEntityOfPage: url,
    url,
    isPartOf: SITE_URL,
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
