import type { Metadata } from 'next';
import { DIMENSIONS } from '@/lib/dimensions/config';
import type { DimensionSlug } from '@/lib/dimensions/types';

export const SITE_URL = 'https://www.life-kline.com';
export const SITE_NAME = 'Life K-Line 命运K线';
export const SITE_LOCALE = 'zh_CN';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;

/**
 * Product-page language strategy (see docs/GLOBALIZATION_STANDARD.md):
 * same path + ?lang= for zh-Hant / en, x-default → zh-CN main path.
 */
export type ProductUiLocale = 'zh-CN' | 'zh-Hant' | 'en';

/** Core brand keywords + product/GEO expansions */
export const CORE_KEYWORDS = [
  '免费八字命理分析',
  '八字排盘',
  '人生K线',
  '人生运势曲线',
  '流年大运',
  '十维度研判',
  '运势节奏',
  '事业行业分析',
  '投资理财节奏',
  '谈婚论嫁择时',
  '起名改名五行',
  '世界易',
  '海外华人运势',
  '迁移择城',
  'bazi chart',
  'four pillars of destiny',
  'life rhythm',
  'World Yi',
];

export type SeoPageInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  type?: 'website' | 'article';
  noIndex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  images?: string[];
  /** UI/content locale for OG + hreflang self */
  locale?: ProductUiLocale | string;
  /** Override hreflang map; absolute or site-relative paths */
  languages?: Record<string, string>;
  /** When false, only emit zh-CN (private/tooling pages) */
  multiLanguage?: boolean;
};

export function absoluteUrl(path: string): string {
  if (!path) return SITE_URL;
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Strip UI locale prefix (/en, /zh-hant) and ?lang= */
export function stripLocalePrefix(path: string): string {
  try {
    const url = path.startsWith('http')
      ? new URL(path)
      : new URL(path, SITE_URL);
    let pathname = url.pathname || '/';
    pathname = pathname.replace(/^\/(en|zh-hant|zh-tw|zh-hk)(?=\/|$)/i, '') || '/';
    if (!pathname.startsWith('/')) pathname = `/${pathname}`;
    url.searchParams.delete('lang');
    const qs = url.searchParams.toString();
    return `${pathname}${qs ? `?${qs}` : ''}${url.hash || ''}`;
  } catch {
    return path.split('?')[0] || path;
  }
}

/**
 * Locale-prefixed product path (preferred for SEO hreflang).
 * Next Metadata drops ?query on alternates; path prefixes survive.
 *   zh-CN → /analyze
 *   en    → /en/analyze
 *   zh-Hant → /zh-hant/analyze
 */
export function withLocalePrefix(path: string, lang: ProductUiLocale): string {
  const base = stripLocalePrefix(path) || '/';
  if (lang === 'zh-CN') return base;
  const prefix = lang === 'en' ? '/en' : '/zh-hant';
  if (base === '/') return prefix;
  return `${prefix}${base}`;
}

/** @deprecated use withLocalePrefix — kept for callers expecting ?lang= */
export function withLangQuery(path: string, lang: ProductUiLocale): string {
  const base = stripLocalePrefix(path);
  if (lang === 'zh-CN') return base || '/';
  const join = base.includes('?') ? '&' : '?';
  return `${base || '/'}${join}lang=${lang}`;
}

/**
 * Default product hreflang cluster (Globalization Standard §3.3).
 * Uses path prefixes so HTML <link rel="alternate"> keeps language distinction.
 */
export function buildProductLanguageAlternates(
  path: string,
  options?: { xDefault?: 'zh-CN' | 'en' }
): Record<string, string> {
  const clean = stripLocalePrefix(path) || '/';
  const xDefaultPath =
    options?.xDefault === 'en' ? withLocalePrefix(clean, 'en') : clean;
  return {
    'zh-CN': absoluteUrl(clean),
    'zh-Hant': absoluteUrl(withLocalePrefix(clean, 'zh-Hant')),
    'zh-TW': absoluteUrl(withLocalePrefix(clean, 'zh-Hant')),
    'zh-HK': absoluteUrl(withLocalePrefix(clean, 'zh-Hant')),
    en: absoluteUrl(withLocalePrefix(clean, 'en')),
    'x-default': absoluteUrl(xDefaultPath),
  };
}

function ogLocaleFor(locale?: string): string {
  const v = `${locale || 'zh-CN'}`.toLowerCase();
  if (v === 'en' || v.startsWith('en')) return 'en_US';
  if (v.includes('hant') || v === 'zh-tw' || v === 'zh-hk' || v === 'zh-mo') return 'zh_TW';
  return 'zh_CN';
}

export function buildPageMetadata(input: SeoPageInput): Metadata {
  const keywords = Array.from(new Set([...(input.keywords || []), ...CORE_KEYWORDS.slice(0, 10)]));
  const images = input.images?.length ? input.images : [DEFAULT_OG_IMAGE];
  const multi = input.multiLanguage !== false && !input.noIndex;
  const cleanPath = stripLocalePrefix(input.path) || '/';
  const canonicalPath = input.locale
    ? withLocalePrefix(cleanPath, (
      `${input.locale}`.toLowerCase().startsWith('en')
        ? 'en'
        : /hant|tw|hk|mo/.test(`${input.locale}`.toLowerCase())
          ? 'zh-Hant'
          : 'zh-CN'
    ) as ProductUiLocale)
    : cleanPath;
  const url = absoluteUrl(canonicalPath);
  const languages = multi
    ? Object.fromEntries(
        Object.entries(
          input.languages
            || buildProductLanguageAlternates(cleanPath)
        ).map(([key, value]) => [key, absoluteUrl(value)])
      )
    : { 'zh-CN': absoluteUrl(cleanPath) };

  return {
    title: input.title,
    description: input.description,
    keywords,
    alternates: {
      canonical: url,
      languages,
    },
    openGraph: {
      type: input.type || 'website',
      locale: ogLocaleFor(input.locale),
      url,
      siteName: SITE_NAME,
      title: input.title,
      description: input.description,
      images: images.map((src) => ({ url: src })),
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images,
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-snippet': -1,
            'max-image-preview': 'large',
            'max-video-preview': -1,
          },
        },
  };
}

export function dimensionSeo(slug: DimensionSlug) {
  const def = DIMENSIONS.find((item) => item.slug === slug);
  if (!def) {
    return buildPageMetadata({
      title: '十维度研判',
      description: '人生K线十维度深度研判中心。',
      path: '/dimensions',
    });
  }

  const title = `${def.title}深度研判｜${def.question.replace(/？/g, '')}`;
  const description = `${def.description} 基于八字用神、大运流年与人生K线引擎，输出核心结论、行动建议与可验证预测。适合需要「${def.title}」具体判断的用户。`;
  const keywords = [
    def.title,
    def.question.replace(/[？?]/g, ''),
    `${def.title}分析`,
    `${def.title}运势`,
    '十维度研判',
    '人生K线',
    '八字分析',
    ...(def.engineTags || []),
  ];

  return buildPageMetadata({
    title,
    description,
    path: `/dimensions/${slug}`,
    keywords,
  });
}

/** Normalize DB / ISO timestamps to YYYY-MM-DD for Open Graph + JSON-LD. */
export function toSeoDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const raw = String(value).trim();
  if (!raw) return undefined;
  // already date-only
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw.includes('T') ? raw : raw.replace(' ', 'T') + (raw.includes('Z') ? '' : 'Z'));
  if (Number.isNaN(parsed.getTime())) {
    const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : undefined;
  }
  return parsed.toISOString().slice(0, 10);
}

export function articleSeo(input: {
  title: string;
  summary?: string;
  path: string;
  trackKey?: string;
  type?: 'knowledge' | 'case' | 'insight';
  keywords?: string[];
  publishedTime?: string | null;
  modifiedTime?: string | null;
  /** Content locale (zh-Hans / zh-TW / en-US …) for OG */
  locale?: string | null;
  /** Generative GEO fields */
  answerSummary?: string | null;
  searchIntents?: string[] | null;
  entityKeywords?: string[] | null;
  geoRegion?: string | null;
  geoPlaceName?: string | null;
  /** Sister language URLs if multi-entity translations exist */
  languages?: Record<string, string>;
  /** Content entities own their canonical URL, even in a locale UI shell. */
  canonicalPath?: string;
  /** OG/Twitter images (absolute or site-relative); first figure preferred for articles. */
  images?: string[];
}) {
  const typeLabel =
    input.type === 'case' ? '案例' : input.type === 'insight' ? '洞察' : '知识';
  const description =
    input.answerSummary
    || input.summary
    || `${input.title}｜${typeLabel}解读结构、时位与行动，并联动人生K线十维度研判与工具中心。`;
  const publishedTime = toSeoDate(input.publishedTime);
  const modifiedTime = toSeoDate(input.modifiedTime) || publishedTime;

  const uiLocale: ProductUiLocale = (() => {
    const v = `${input.locale || ''}`.toLowerCase();
    if (v.startsWith('en')) return 'en';
    if (v.includes('hant') || v === 'zh-tw' || v === 'zh-hk' || v === 'zh-mo') return 'zh-Hant';
    return 'zh-CN';
  })();

  // Content entity hreflang: same slug path + UI locale prefixes until true multi-entity pairs exist.
  // When sister URLs are provided via input.languages, they win.
  const languages = input.languages || buildProductLanguageAlternates(input.path);

  const typeLabelLocalized =
    uiLocale === 'en'
      ? input.type === 'case'
        ? 'Cases'
        : input.type === 'insight'
          ? 'Insights'
          : 'Knowledge'
      : typeLabel;

  const base = buildPageMetadata({
    title:
      uiLocale === 'en'
        ? `${input.title} | ${typeLabelLocalized}`
        : `${input.title}｜${typeLabel}库`,
    description: description.slice(0, 160),
    path: input.canonicalPath || input.path,
    type: 'article',
    locale: uiLocale,
    languages,
    publishedTime,
    modifiedTime,
    images: input.images,
    keywords: [
      input.title,
      typeLabel,
      typeLabelLocalized,
      input.trackKey || '',
      '世界易',
      '人生K线',
      '十维度',
      'World Yi',
      'Life K-Line',
      ...(input.entityKeywords || []),
      ...(input.keywords || []),
    ].filter(Boolean),
  });

  const other: Record<string, string> = {
    ...((base.other as Record<string, string> | undefined) || {}),
  };
  if (input.answerSummary) other['ai-answer-summary'] = input.answerSummary.slice(0, 400);
  if (input.searchIntents?.length) other['search-intent'] = input.searchIntents.join(' | ');
  if (input.entityKeywords?.length) other['entity-keywords'] = input.entityKeywords.join(', ');
  if (input.geoRegion) other['geo.region'] = input.geoRegion;
  if (input.geoPlaceName) other['geo.placename'] = input.geoPlaceName;
  if (input.locale) other['content-locale'] = String(input.locale);

  return {
    ...base,
    ...(Object.keys(other).length ? { other } : {}),
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildArticleJsonLd(input: {
  title: string;
  description: string;
  path: string;
  datePublished?: string | null;
  dateModified?: string | null;
  keywords?: string[];
  inLanguage?: string | null;
  abstract?: string | null;
  about?: string[] | null;
}) {
  const datePublished =
    toSeoDate(input.datePublished) || toSeoDate(input.dateModified) || new Date().toISOString().slice(0, 10);
  const dateModified = toSeoDate(input.dateModified) || datePublished;

  const lang = (() => {
    const v = `${input.inLanguage || 'zh-CN'}`;
    if (v.toLowerCase().startsWith('en')) return 'en-US';
    if (/hant|tw|hk|mo/i.test(v)) return 'zh-TW';
    if (v === 'zh-Hans' || v === 'zh-CN' || v === 'zh-US') return 'zh-CN';
    return v || 'zh-CN';
  })();

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    abstract: input.abstract || input.description,
    inLanguage: lang,
    mainEntityOfPage: absoluteUrl(input.path),
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icon.svg`,
      },
    },
    image: [DEFAULT_OG_IMAGE],
    datePublished,
    dateModified,
    keywords: (input.keywords || []).join(', '),
    ...(input.about?.length
      ? {
          about: input.about.slice(0, 12).map((name) => ({
            '@type': 'Thing',
            name,
          })),
        }
      : {}),
  };
}

/** Pull publish dates from content-store / seed article shapes. */
export function articleDatesFrom(article: unknown): {
  publishedTime?: string;
  modifiedTime?: string;
} {
  const a = (article || {}) as Record<string, unknown>;
  const published =
    (typeof a.createdAt === 'string' && a.createdAt)
    || (typeof a.created_at === 'string' && a.created_at)
    || (typeof a.publishedAt === 'string' && a.publishedAt)
    || null;
  const modified =
    (typeof a.updatedAt === 'string' && a.updatedAt)
    || (typeof a.updated_at === 'string' && a.updated_at)
    || published;
  return {
    publishedTime: toSeoDate(published) || undefined,
    modifiedTime: toSeoDate(modified) || undefined,
  };
}

export function buildFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function buildItemListJsonLd(name: string, items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}

export function buildServiceJsonLd(input: {
  name: string;
  description: string;
  path: string;
  areaServed?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    areaServed: (input.areaServed || ['中国', '海外华人社区']).map((name) => ({
      '@type': 'Place',
      name,
    })),
    availableLanguage: ['zh-CN'],
  };
}

/** GEO city content seeds for diaspora + domestic hubs */
export const GEO_CITY_SEEDS: Array<{
  slug: string;
  title: string;
  city: string;
  region: string;
  summary: string;
  focus: string[];
}> = [
  {
    slug: 'world-yi-city-shanghai',
    title: '城市观察：上海',
    city: '上海',
    region: '中国华东',
    summary: '高节奏商业城市下的角色压缩、居住成本与事业窗口判断。',
    focus: ['事业', '居住', '现金流'],
  },
  {
    slug: 'world-yi-city-shenzhen',
    title: '城市观察：深圳',
    city: '深圳',
    region: '中国华南',
    summary: '科技与创业密度高，适合评估扩张窗口与风险敞口。',
    focus: ['创业', '行业', '节奏'],
  },
  {
    slug: 'world-yi-city-beijing',
    title: '城市观察：北京',
    city: '北京',
    region: '中国华北',
    summary: '政策与资源节点密集，结构判断需结合行业周期。',
    focus: ['事业', '政策环境', '关系网络'],
  },
  {
    slug: 'world-yi-city-new-york',
    title: '城市观察：纽约',
    city: '纽约',
    region: '北美',
    summary: '海外华人在金融与创意产业中的角色匹配与成本结构。',
    focus: ['迁移', '职业', '现金流'],
  },
  {
    slug: 'world-yi-city-sydney',
    title: '城市观察：悉尼',
    city: '悉尼',
    region: '澳洲',
    summary: '移民节奏、家庭排序与本地就业窗口的结构观察。',
    focus: ['迁移', '家庭', '就业'],
  },
  {
    slug: 'world-yi-city-london',
    title: '城市观察：伦敦',
    city: '伦敦',
    region: '欧洲',
    summary: '跨文化职业路径与居住选择对命理结构的压力测试。',
    focus: ['迁移', '事业', '居住'],
  },
  {
    slug: 'world-yi-city-tokyo',
    title: '城市观察：东京',
    city: '东京',
    region: '东亚',
    summary: '高密度城市环境下的节奏管理与职业纵深。',
    focus: ['节奏', '事业', '生活秩序'],
  },
  {
    slug: 'world-yi-city-los-angeles',
    title: '城市观察：洛杉矶',
    city: '洛杉矶',
    region: '北美西岸',
    summary: '分散城市结构下的通勤、家庭与创业窗口。',
    focus: ['迁移', '家庭', '创业'],
  },
  {
    slug: 'world-yi-city-hong-kong',
    title: '城市观察：香港',
    city: '香港',
    region: '大湾区/港澳',
    summary: '跨境职业与居住成本结构下的节奏与角色匹配。',
    focus: ['迁移', '职业', '居住'],
  },
  {
    slug: 'world-yi-city-vancouver',
    title: '城市观察：温哥华',
    city: '温哥华',
    region: '加拿大西岸',
    summary: '移民家庭排序、就业节奏与居住选择的环境层观察。',
    focus: ['迁移', '家庭', '就业'],
  },
  {
    slug: 'world-yi-city-toronto',
    title: '城市观察：多伦多',
    city: '多伦多',
    region: '加拿大东岸',
    summary: '多元社区中的职业路径与家庭成本结构。',
    focus: ['迁移', '职业', '社区'],
  },
];
