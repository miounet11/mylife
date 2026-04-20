import { MetadataRoute } from 'next';
import { db } from '@/lib/database';
import { getCaseStudies, getEntityInsights, getKnowledgeArticles } from '@/lib/content-store';
import { listKnowledgeTopicHubRoutes } from '@/lib/knowledge-network-feed';
import { normalizeAlternateLanguagePaths } from '@/lib/public-content-seo';
import { listToolCategories, listToolDefinitions } from '@/lib/tools';
import { worldYiPublicRoutes } from '@/lib/world-yi-public-stats';

const SITE_URL = 'https://www.life-kline.com';

function withSiteUrl(path: string) {
  return path.startsWith('http') ? path : `${SITE_URL}${path}`;
}

function createSitemapEntry(path: string, options: {
  lastModified: Date;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
  languages?: Record<string, string>;
}) {
  const languages = Object.fromEntries(
    Object.entries(normalizeAlternateLanguagePaths({
      languages: options.languages,
      defaultLocale: 'zh-CN',
      defaultPath: path,
    })).map(([key, value]) => [key, withSiteUrl(value)]),
  );

  return {
    url: withSiteUrl(path),
    lastModified: options.lastModified,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
    alternates: {
      languages,
    },
  } satisfies MetadataRoute.Sitemap[number];
}

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const knowledgeArticles = getKnowledgeArticles();
  const caseStudies = getCaseStudies();
  const entityInsights = getEntityInsights();
  const knowledgeTopics = listKnowledgeTopicHubRoutes();
  const toolCategories = listToolCategories();
  const tools = listToolDefinitions();
  const staticRoutes: MetadataRoute.Sitemap = [
    createSitemapEntry('/', {
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
      languages: {
        'zh-CN': '/',
        'en-US': '/world-yi/en',
      },
    }),
    createSitemapEntry('/knowledge', {
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      languages: {
        'zh-CN': '/knowledge',
        'en-US': '/world-yi/en',
      },
    }),
    createSitemapEntry('/knowledge/topics', {
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.78,
    }),
    createSitemapEntry('/cases', {
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
      languages: {
        'zh-CN': '/cases',
        'en-US': '/world-yi/en/cases',
      },
    }),
    createSitemapEntry('/insights', {
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.76,
    }),
    createSitemapEntry('/tools', {
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.82,
    }),
    ...toolCategories.map((category) => createSitemapEntry(`/tools/category/${category.key}`, {
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.74,
    })),
    ...tools.map((tool) => createSitemapEntry(`/tools/${tool.slug}`, {
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.68,
    })),
    ...worldYiPublicRoutes.map((path) => createSitemapEntry(path, {
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: path === '/world-yi' ? 0.86 : 0.8,
    })),
    ...knowledgeArticles.map((article) => createSitemapEntry(`/knowledge/${article.slug}`, {
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.72,
    })),
    ...knowledgeTopics.map((topic) => createSitemapEntry(`/knowledge/topics/${topic.topicSlug}`, {
      lastModified: new Date(topic.updatedAt || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.74,
    })),
    ...caseStudies.map((item) => createSitemapEntry(`/cases/${item.slug}`, {
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    ...entityInsights.map((item) => createSitemapEntry(`/insights/${item.type}/${item.slug}`, {
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.68,
    })),
  ];

  try {
    const resultRoutes = db
      .prepare('SELECT id, updated_at, created_at FROM fortunes WHERE is_public = 1 ORDER BY updated_at DESC')
      .all() as Array<{ id: string; updated_at?: string; created_at?: string }>;

    return [
      ...staticRoutes,
      ...resultRoutes.map((item) => createSitemapEntry(`/result/${item.id}`, {
        lastModified: new Date(item.updated_at || item.created_at || Date.now()),
        changeFrequency: 'monthly',
        priority: 0.65,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
