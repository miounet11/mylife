/**
 * Dedicated Google Image sitemap (image: namespace).
 * Complements app/sitemap.ts HTML page entries that also list images.
 * https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
 */

import { listImageSitemapRows } from '@/lib/page-illustrations/seo';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const rows = listImageSitemapRows();
  // Group by page URL
  const byPage = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byPage.get(row.pageUrl) || [];
    list.push(row);
    byPage.set(row.pageUrl, list);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...byPage.entries()]
  .map(([pageUrl, images]) => {
    const imageBlocks = images
      .slice(0, 12)
      .map(
        (img) => `  <image:image>
    <image:loc>${escapeXml(img.imageUrl)}</image:loc>
    <image:title>${escapeXml(img.title)}</image:title>
    <image:caption>${escapeXml(img.caption)}</image:caption>
  </image:image>`,
      )
      .join('\n');
    return `<url>
  <loc>${escapeXml(pageUrl)}</loc>
${imageBlocks}
</url>`;
  })
  .join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
