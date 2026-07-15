import { getCaseStudies, getKnowledgeArticles } from '@/lib/content-store';

export type ContentSearchResult = {
  type: 'knowledge' | 'case';
  slug: string;
  title: string;
  summary: string;
};

function summaryOf(article: { excerpt?: string; summary?: string }) {
  return article.excerpt || article.summary || '';
}

export function searchContentArticles(query: string, limit = 12): ContentSearchResult[] {
  const q = query.trim().toLowerCase();
  const items: ContentSearchResult[] = [
    ...getKnowledgeArticles().map((article) => ({
      type: 'knowledge' as const,
      slug: article.slug,
      title: article.title,
      summary: summaryOf(article),
    })),
    ...getCaseStudies().map((article) => ({
      type: 'case' as const,
      slug: article.slug,
      title: article.title,
      summary: summaryOf(article),
    })),
  ];

  if (!q) return items.slice(0, limit);

  return items
    .filter(
      (item) =>
        item.title.toLowerCase().includes(q)
        || item.summary.toLowerCase().includes(q)
        || item.slug.includes(q),
    )
    .slice(0, limit);
}