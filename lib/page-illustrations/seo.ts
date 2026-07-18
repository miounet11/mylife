/**
 * Image SEO / GEO helpers for page illustrations.
 * Google Image + multi-locale (zh-CN / zh-Hant / en) seed markets.
 */

import {
  PAGE_ILLUSTRATION_CATALOG,
  publicSrc,
  type PageIllustrationEntry,
  type PageIllustLocale,
} from '@/lib/page-illustrations/catalog';
import { SITE_URL, absoluteUrl } from '@/lib/seo';

/** Surface → public indexable paths (no private /chat /profile). */
export const SURFACE_SEO_PATHS: Record<string, string[]> = {
  'home/workspace': ['/'],
  'analyze/workspace': ['/analyze'],
  'tools/hub': ['/tools'],
  'dimensions/hub': ['/dimensions'],
  'teachers/hub': ['/teachers'],
  'knowledge/hub': ['/knowledge'],
  'cases/hub': ['/cases'],
  'world-yi/hub': ['/world-yi', '/world-yi/en'],
  'docs/hub': ['/docs'],
  'docs/read-first-report': ['/docs/read-first-report'],
  'docs/solar-time': ['/docs/true-solar-time'],
  'learn/hub': ['/learn'],
  'membership/hub': ['/membership'],
  'hehun/hub': ['/hehun'],
  'movement/hub': ['/movement'],
  'community/hub': ['/community'],
  'insights/hub': ['/insights'],
  'boundary/not-fatalism': ['/docs', '/movement'],
  'geo/shanghai': ['/insights/city/world-yi-city-shanghai', '/insights'],
  'insights/city/world-yi-city-shanghai': ['/insights/city/world-yi-city-shanghai'],
  'geo/shenzhen': ['/insights/city/world-yi-city-shenzhen', '/insights'],
  'insights/city/world-yi-city-shenzhen': ['/insights/city/world-yi-city-shenzhen'],
  'geo/beijing': ['/insights/city/world-yi-city-beijing', '/insights'],
  'insights/city/world-yi-city-beijing': ['/insights/city/world-yi-city-beijing'],
  'geo/new-york': ['/insights/city/world-yi-city-new-york', '/insights'],
  'insights/city/world-yi-city-new-york': ['/insights/city/world-yi-city-new-york'],
  'geo/sydney': ['/insights/city/world-yi-city-sydney', '/insights'],
  'insights/city/world-yi-city-sydney': ['/insights/city/world-yi-city-sydney'],
  'geo/london': ['/insights/city/world-yi-city-london', '/insights'],
  'insights/city/world-yi-city-london': ['/insights/city/world-yi-city-london'],
  'geo/tokyo': ['/insights/city/world-yi-city-tokyo', '/insights'],
  'insights/city/world-yi-city-tokyo': ['/insights/city/world-yi-city-tokyo'],
  'geo/los-angeles': ['/insights/city/world-yi-city-los-angeles', '/insights'],
  'insights/city/world-yi-city-los-angeles': ['/insights/city/world-yi-city-los-angeles'],
  'geo/singapore': ['/insights/city/world-yi-city-singapore', '/insights'],
  'insights/city/world-yi-city-singapore': ['/insights/city/world-yi-city-singapore'],
};

/** Priority bases for multi-language image generation (seed traffic hubs). */
export const MULTI_LOCALE_PRIORITY_IDS = [
  'PI-HOME-01',
  'PI-REPORT-READ-01',
  'PI-REPORT-TIMING-01',
  'PI-REPORT-DECISION-01',
  'PI-YONGSHEN-01',
  'PI-FIVE-ELEMENTS-01',
  'PI-TOOLS-01',
  'PI-DIMENSIONS-MAP-01',
  'PI-CASES-01',
  'PI-KNOWLEDGE-01',
  'PI-WORLDYI-01',
  'PI-FREE-PATH-01',
  'PI-BAZI-PILLARS-01',
  'PI-BOUNDARY-01',
  'PI-SOLAR-TIME-01',
] as const;

export function normalizeIllustLocale(raw?: string | null): PageIllustLocale {
  const v = `${raw || 'zh-CN'}`.toLowerCase();
  if (v.startsWith('en')) return 'en';
  if (v.includes('hant') || v === 'zh-tw' || v === 'zh-hk' || v === 'zh-mo') return 'zh-Hant';
  return 'zh-CN';
}

export function absoluteImageUrl(entry: PageIllustrationEntry): string {
  return absoluteUrl(publicSrc(entry));
}

export function listReadySeoImages(opts?: {
  locale?: PageIllustLocale | 'all';
  complexOnly?: boolean;
}): PageIllustrationEntry[] {
  const locale = opts?.locale || 'all';
  return PAGE_ILLUSTRATION_CATALOG.filter((e) => {
    if (!e.ready) return false;
    if (opts?.complexOnly && e.complexity === 'simple') return false;
    if (e.aspectRatio === '1:1') return false; // skip tiny icons for image sitemap noise
    const loc = e.locale || 'zh-CN';
    if (locale !== 'all' && loc !== locale) return false;
    return true;
  });
}

/**
 * Build image URLs for a product path to attach on HTML sitemap entries.
 * Includes zh-CN + locale variants so Google can discover multi-language diagrams.
 */
export function imagesForSeoPath(path: string): string[] {
  const clean = path.split('?')[0] || '/';
  const surfaces = Object.entries(SURFACE_SEO_PATHS)
    .filter(([, paths]) => paths.some((p) => p === clean || clean.startsWith(`${p}/`)))
    .map(([surface]) => surface);

  const urls: string[] = [];
  const seen = new Set<string>();
  for (const surface of surfaces) {
    for (const entry of PAGE_ILLUSTRATION_CATALOG) {
      if (!entry.ready || !entry.surfaces.includes(surface)) continue;
      if (entry.complexity === 'simple' || entry.aspectRatio === '1:1') continue;
      const abs = absoluteImageUrl(entry);
      if (seen.has(abs)) continue;
      seen.add(abs);
      urls.push(abs);
    }
  }
  return urls.slice(0, 8);
}

/** JSON-LD ImageObject for a figure (embed near <figure>). */
export function buildImageObjectJsonLd(entry: {
  id: string;
  title: string;
  caption?: string;
  alt?: string;
  src: string;
  width?: number;
  height?: number;
  locale?: string;
}) {
  const contentUrl = entry.src.startsWith('http') ? entry.src : absoluteUrl(entry.src);
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    '@id': `${SITE_URL}/images/page-illustrations#${entry.id}`,
    contentUrl,
    url: contentUrl,
    name: entry.title,
    description: entry.caption || entry.alt || entry.title,
    caption: entry.caption || entry.alt || entry.title,
    inLanguage:
      entry.locale === 'en'
        ? 'en'
        : entry.locale === 'zh-Hant'
          ? 'zh-Hant'
          : 'zh-CN',
    width: entry.width || 1600,
    height: entry.height || 900,
    isPartOf: { '@type': 'WebSite', name: 'Life K-Line', url: SITE_URL },
    license: `${SITE_URL}/`,
    acquireLicensePage: `${SITE_URL}/`,
    creditText: 'Life K-Line',
    creator: { '@type': 'Organization', name: 'Life K-Line', url: SITE_URL },
  };
}

/** Flat list for a dedicated image sitemap (all locales). */
export function listImageSitemapRows(): Array<{
  pageUrl: string;
  imageUrl: string;
  title: string;
  caption: string;
  locale: PageIllustLocale;
}> {
  const rows: Array<{
    pageUrl: string;
    imageUrl: string;
    title: string;
    caption: string;
    locale: PageIllustLocale;
  }> = [];
  const seen = new Set<string>();

  for (const entry of listReadySeoImages({ locale: 'all' })) {
    const loc = entry.locale || 'zh-CN';
    const imageUrl = absoluteImageUrl(entry);
    for (const surface of entry.surfaces) {
      const paths = SURFACE_SEO_PATHS[surface];
      if (!paths?.length) continue;
      for (const p of paths) {
        // Prefer locale-matching page path for EN gateway
        let pagePath = p;
        if (loc === 'en' && p === '/world-yi') pagePath = '/world-yi/en';
        else if (loc === 'en' && !p.startsWith('/world-yi/en') && p !== '/world-yi/en') {
          pagePath = p === '/' ? '/en' : `/en${p}`;
        } else if (loc === 'zh-Hant') {
          pagePath = p === '/' ? '/zh-hant' : `/zh-hant${p}`;
        }
        const key = `${pagePath}|${imageUrl}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push({
          pageUrl: absoluteUrl(pagePath),
          imageUrl,
          title: entry.title,
          caption: entry.caption || entry.alt,
          locale: loc,
        });
      }
    }
  }
  return rows;
}
