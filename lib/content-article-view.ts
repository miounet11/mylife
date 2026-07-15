/** Normalize content-store shapes across local seeds and production SQLite entries. */

import { extractContentGeoFields, type ContentGeoFields } from '@/lib/content-geo';

export type NormalizedSection = {
  heading: string;
  body: string;
};

export function articleSummary(article: {
  summary?: string;
  excerpt?: string | null;
  seoDescription?: string | null;
}) {
  return article.summary || article.excerpt || article.seoDescription || '';
}

export function articleReadLabel(article: { readMinutes?: number; readTime?: string | null }) {
  if (article.readMinutes) return `约 ${article.readMinutes} 分钟`;
  if (article.readTime) return article.readTime;
  return null;
}

export function articleTrackKey(article: {
  trackKey?: string;
  category?: string | null;
  scenario?: string | null;
}) {
  return article.trackKey || article.category || article.scenario || 'intro';
}

/** Locale + geoReady fields for list/detail (works with seeds and prod DTOs). */
export function articleGeoFields(article: unknown): ContentGeoFields {
  return extractContentGeoFields(article);
}

export function normalizeSections(sections: unknown): NormalizedSection[] {
  if (!Array.isArray(sections)) return [];

  return sections
    .map((section) => {
      if (Array.isArray(section) && section.length >= 2) {
        return { heading: String(section[0]), body: String(section[1]) };
      }

      if (section && typeof section === 'object' && 'title' in section) {
        const typed = section as { title?: string; paragraphs?: string[] };
        const paragraphs = Array.isArray(typed.paragraphs) ? typed.paragraphs : [];
        return {
          heading: typed.title || '内容',
          body: paragraphs.join('\n\n'),
        };
      }

      return null;
    })
    .filter((item): item is NormalizedSection => Boolean(item?.body || item?.heading));
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}