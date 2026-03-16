import { MetadataRoute } from 'next';
import { db } from '@/lib/database';
import { getCaseStudies, getEntityInsights, getKnowledgeArticles } from '@/lib/content-store';
import { listKnowledgeTopicHubRoutes } from '@/lib/knowledge-network-feed';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const knowledgeArticles = getKnowledgeArticles();
  const caseStudies = getCaseStudies();
  const entityInsights = getEntityInsights();
  const knowledgeTopics = listKnowledgeTopicHubRoutes();
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: 'https://www.life-kline.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://www.life-kline.com/analyze',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.life-kline.com/chat',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://www.life-kline.com/knowledge',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://www.life-kline.com/knowledge/topics',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.78,
    },
    {
      url: 'https://www.life-kline.com/cases',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: 'https://www.life-kline.com/insights',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.76,
    },
    {
      url: 'https://www.life-kline.com/updates',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.45,
    },
    ...knowledgeArticles.map((article) => ({
      url: `https://www.life-kline.com/knowledge/${article.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.72,
    })),
    ...knowledgeTopics.map((topic) => ({
      url: `https://www.life-kline.com/knowledge/topics/${topic.topicSlug}`,
      lastModified: new Date(topic.updatedAt || Date.now()),
      changeFrequency: 'weekly' as const,
      priority: 0.74,
    })),
    ...caseStudies.map((item) => ({
      url: `https://www.life-kline.com/cases/${item.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...entityInsights.map((item) => ({
      url: `https://www.life-kline.com/insights/${item.type}/${item.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.68,
    })),
  ];

  try {
    const resultRoutes = db
      .prepare('SELECT id, updated_at, created_at FROM fortunes WHERE is_public = 1 ORDER BY updated_at DESC')
      .all() as Array<{ id: string; updated_at?: string; created_at?: string }>;

    return [
      ...staticRoutes,
      ...resultRoutes.map((item) => ({
        url: `https://www.life-kline.com/result/${item.id}`,
        lastModified: new Date(item.updated_at || item.created_at || Date.now()),
        changeFrequency: 'monthly' as const,
        priority: 0.65,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
