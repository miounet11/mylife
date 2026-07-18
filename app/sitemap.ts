import type { MetadataRoute } from 'next';
import { CONTENT_ARTICLES } from '@/lib/content-seeds';
import {
  getCaseStudies,
  getEntityInsights,
  getKnowledgeArticles,
} from '@/lib/content-store';
import { DIMENSIONS } from '@/lib/dimensions/config';
import { LEARNING_TRACKS } from '@/lib/learning-tracks';
import { TOOL_CONTENT } from '@/lib/portal-nav';
import { TOOL_CATEGORY_META } from '@/lib/portal-tools';
import { absoluteUrl, buildProductLanguageAlternates, GEO_CITY_SEEDS } from '@/lib/seo';
import { imagesForSeoPath } from '@/lib/page-illustrations/seo';

const siteUrl = 'https://www.life-kline.com';

type RouteDef = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  lastModified?: Date | string;
  /** Emit hreflang cluster (product hubs + World Yi EN gateway). */
  multiLanguage?: boolean;
  /** English-native surface: x-default points to EN path. */
  enGateway?: boolean;
};

function uniqueRoutes(routes: RouteDef[]): RouteDef[] {
  const seen = new Set<string>();
  const out: RouteDef[] = [];
  for (const route of routes) {
    if (!route.path || seen.has(route.path)) continue;
    seen.add(route.path);
    out.push(route);
  }
  return out;
}

function contentRoutesFromStore(): RouteDef[] {
  try {
    const knowledge = getKnowledgeArticles() || [];
    const cases = getCaseStudies() || [];
    const insights = getEntityInsights() || [];

    const knowledgeRoutes = knowledge
      .map((item) => item?.slug)
      .filter(Boolean)
      .map((slug) => ({
        path: `/knowledge/${slug}`,
        priority: 0.76,
        changeFrequency: 'monthly' as const,
      }));

    const caseRoutes = cases
      .map((item) => item?.slug)
      .filter(Boolean)
      .map((slug) => ({
        path: `/cases/${slug}`,
        priority: 0.72,
        changeFrequency: 'monthly' as const,
      }));

    const insightRoutes = insights
      .map((item) => {
        const type = (item as { type?: string; insightType?: string }).type
          || (item as { insightType?: string }).insightType
          || 'city';
        const slug = item?.slug;
        if (!slug) return null;
        return {
          path: `/insights/${type}/${slug}`,
          priority: type === 'city' ? 0.8 : 0.72,
          changeFrequency: 'monthly' as const,
        };
      })
      .filter(Boolean) as RouteDef[];

    // Prefer store inventory; if empty (local stub edge), fall back to seeds below.
    if (knowledgeRoutes.length + caseRoutes.length + insightRoutes.length > 0) {
      return [...knowledgeRoutes, ...caseRoutes, ...insightRoutes];
    }
  } catch {
    // fall through to seeds
  }

  return CONTENT_ARTICLES.map((article) => {
    if (article.type === 'case') {
      return { path: `/cases/${article.slug}`, priority: 0.7, changeFrequency: 'monthly' as const };
    }
    if (article.type === 'insight' && article.insightType) {
      return {
        path: `/insights/${article.insightType}/${article.slug}`,
        priority: article.insightType === 'city' ? 0.8 : 0.72,
        changeFrequency: 'monthly' as const,
      };
    }
    return { path: `/knowledge/${article.slug}`, priority: 0.76, changeFrequency: 'monthly' as const };
  });
}

/** Always index GEO seed cities (zh + EN sisters) even when prod DB omits EN entities. */
function geoCitySeedRoutes(): RouteDef[] {
  const out: RouteDef[] = [];
  for (const city of GEO_CITY_SEEDS) {
    out.push({
      path: `/insights/city/${city.slug}`,
      priority: 0.82,
      changeFrequency: 'monthly',
    });
    const enSlug = `world-yi-en-${city.slug.replace(/^world-yi-/, '')}`;
    out.push({
      path: `/insights/city/${enSlug}`,
      priority: 0.8,
      changeFrequency: 'monthly',
    });
  }
  return out;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Public marketing / product hubs only — no private or noindex surfaces.
  const routes: RouteDef[] = [
    { path: '/', priority: 1, changeFrequency: 'daily', multiLanguage: true },
    { path: '/analyze', priority: 0.98, changeFrequency: 'daily', multiLanguage: true },
    { path: '/dimensions', priority: 0.97, changeFrequency: 'daily', multiLanguage: true },
    { path: '/tools', priority: 0.9, changeFrequency: 'weekly', multiLanguage: true },
    { path: '/knowledge', priority: 0.88, changeFrequency: 'daily', multiLanguage: true },
    { path: '/knowledge/topics', priority: 0.82, changeFrequency: 'weekly', multiLanguage: true },
    { path: '/cases', priority: 0.85, changeFrequency: 'weekly', multiLanguage: true },
    { path: '/membership', priority: 0.85, changeFrequency: 'weekly', multiLanguage: true },
    { path: '/movement', priority: 0.84, changeFrequency: 'weekly', multiLanguage: true },
    { path: '/learn', priority: 0.8, changeFrequency: 'weekly', multiLanguage: true },
    { path: '/teachers', priority: 0.88, changeFrequency: 'weekly', multiLanguage: true },
    { path: '/world-yi', priority: 0.8, changeFrequency: 'weekly', multiLanguage: true },
    // English World Yi gateway (x-default → EN for this cluster in page metadata; sitemap lists EN loc)
    { path: '/world-yi/en', priority: 0.86, changeFrequency: 'weekly', enGateway: true },
    { path: '/world-yi/en/cases', priority: 0.8, changeFrequency: 'weekly', enGateway: true },
    { path: '/world-yi/en/tracks', priority: 0.8, changeFrequency: 'weekly', enGateway: true },
    { path: '/world-yi/global', priority: 0.78, changeFrequency: 'weekly', multiLanguage: true },
    { path: '/insights', priority: 0.75, changeFrequency: 'weekly', multiLanguage: true },
    { path: '/docs', priority: 0.75, changeFrequency: 'weekly', multiLanguage: true },
    { path: '/docs/birth-info', priority: 0.7, changeFrequency: 'monthly', multiLanguage: true },
    { path: '/docs/true-solar-time', priority: 0.7, changeFrequency: 'monthly', multiLanguage: true },
    { path: '/docs/read-first-report', priority: 0.7, changeFrequency: 'monthly', multiLanguage: true },
    { path: '/community', priority: 0.7, changeFrequency: 'weekly', multiLanguage: true },
    { path: '/annual-review', priority: 0.65, changeFrequency: 'monthly', multiLanguage: true },
    { path: '/visual-assets/world-yi-six-step-method', priority: 0.65, changeFrequency: 'monthly' },
  ];

  const dimensionRoutes = DIMENSIONS.map((item) => ({
    path: `/dimensions/${item.slug}`,
    priority: item.priority === 'p0' ? 0.92 : 0.84,
    changeFrequency: 'weekly' as const,
    multiLanguage: true,
  }));

  const toolCategoryRoutes = Object.keys(TOOL_CATEGORY_META).map((key) => ({
    path: `/tools/category/${key}`,
    priority: 0.78,
    changeFrequency: 'weekly' as const,
  }));

  const toolDetailRoutes = Object.keys(TOOL_CONTENT || {}).map((slug) => ({
    path: `/tools/${slug}`,
    priority: 0.8,
    changeFrequency: 'weekly' as const,
  }));

  const learnRoutes = LEARNING_TRACKS.map((track) => ({
    path: `/learn/${track.key}`,
    priority: 0.74,
    changeFrequency: 'weekly' as const,
  }));

  const all = uniqueRoutes([
    ...routes,
    ...dimensionRoutes,
    ...toolCategoryRoutes,
    ...toolDetailRoutes,
    ...learnRoutes,
    ...contentRoutesFromStore(),
    ...geoCitySeedRoutes(),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const route of all) {
    const entry: MetadataRoute.Sitemap[number] = {
      url: absoluteUrl(route.path),
      lastModified: route.lastModified ? new Date(route.lastModified) : now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    };

    // Google Image discovery: attach page-illustration URLs (multi-locale when ready)
    const seoImages = imagesForSeoPath(route.path);
    if (seoImages.length) {
      entry.images = seoImages;
    }

    if (route.multiLanguage) {
      const langs = buildProductLanguageAlternates(route.path);
      entry.alternates = {
        languages: {
          'zh-CN': langs['zh-CN'],
          'zh-Hant': langs['zh-Hant'],
          en: langs.en,
          'x-default': langs['x-default'],
        },
      };
    } else if (route.enGateway) {
      // EN-native World Yi surfaces: pair with Chinese World Yi hub
      entry.alternates = {
        languages: {
          en: absoluteUrl(route.path),
          'zh-CN': absoluteUrl('/world-yi'),
          'zh-Hant': absoluteUrl('/zh-hant/world-yi'),
          'x-default': absoluteUrl(route.path),
        },
      };
    }

    entries.push(entry);

    // Explicit /en/* and /zh-hant/* locs for multi-language hubs (Google discovery of prefix routes)
    if (route.multiLanguage) {
      for (const prefix of ['/en', '/zh-hant'] as const) {
        const locPath = route.path === '/' ? prefix : `${prefix}${route.path}`;
        const locEntry: MetadataRoute.Sitemap[number] = {
          url: absoluteUrl(locPath),
          lastModified: route.lastModified ? new Date(route.lastModified) : now,
          changeFrequency: route.changeFrequency,
          // Slightly lower priority than zh-CN canonical
          priority: Math.max(0.4, (route.priority || 0.7) - 0.08),
        };
        const locImages = imagesForSeoPath(route.path);
        if (locImages.length) {
          locEntry.images = locImages;
        }
        const langs = buildProductLanguageAlternates(route.path);
        locEntry.alternates = {
          languages: {
            'zh-CN': langs['zh-CN'],
            'zh-Hant': langs['zh-Hant'],
            en: langs.en,
            'x-default': langs['x-default'],
          },
        };
        entries.push(locEntry);
      }
    }
  }

  return entries;
}
