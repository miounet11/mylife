import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.life-kline.com';

/**
 * Index public product + content hubs.
 * Keep private / low-value / thin app surfaces out of the crawl budget.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard',
          '/login',
          '/history',
          '/profile',
          '/profile/',
          '/predictions',
          '/events',
          '/chat',
          '/updates',
          '/updates/',
          // Personal report result pages (shareable but not primary SEO inventory)
          '/result/',
          '/r/',
        ],
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/sitemap-images.xml`],
    host: siteUrl,
  };
}
