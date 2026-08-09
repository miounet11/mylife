import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.life-kline.com';

/**
 * Crawl budget strategy (2026-08 recovery):
 * - Prefer a small allow-list of indexable product + content surfaces.
 * - Explicitly include /topics (destiny entity hubs) and /astro evergreen hubs.
 * - Keep private product surfaces + chat API out of bots.
 * - /result/* full product reports stay disallowed (use /r for share/index).
 * - Combinatorial calendar farms are still crawlable if linked, but sitemap is slimmed
 *   (see app/sitemap.ts) so Google is not forced to spend budget there first.
 */
const PUBLIC_CONTENT_ALLOW = [
  '/',
  '/r/',
  '/reports',
  '/share/',
  '/knowledge/',
  '/cases/',
  '/topics',
  '/topics/',
  '/tools/',
  '/dimensions/',
  '/teachers/',
  '/world-yi/',
  '/insights/',
  '/docs/',
  '/community/',
  '/questions/',
  '/analyze',
  '/membership',
  '/learn/',
  '/almanac',
  '/astro',
  '/astro/',
  '/hehun',
  '/movement',
];

const PRIVATE_DISALLOW = [
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
  '/chat/',
  '/updates',
  '/updates/',
  // Full interactive report shells — thin personal UIs; share via /r
  '/result/',
  '/tool-result/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: PUBLIC_CONTENT_ALLOW,
        disallow: PRIVATE_DISALLOW,
      },
      // Be explicit for common SEO bots (same rules, clearer for operators)
      {
        userAgent: 'Googlebot',
        allow: PUBLIC_CONTENT_ALLOW,
        disallow: [
          '/api/',
          '/admin/',
          '/chat',
          '/chat/',
          '/result/',
          '/tool-result/',
          '/profile',
          '/profile/',
          '/login',
          '/history',
          '/updates',
          '/updates/',
          '/events',
          '/predictions',
          '/dashboard',
        ],
      },
      {
        userAgent: 'Baiduspider',
        allow: PUBLIC_CONTENT_ALLOW,
        disallow: [
          '/api/',
          '/admin/',
          '/chat',
          '/chat/',
          '/result/',
          '/tool-result/',
          '/profile',
          '/profile/',
          '/login',
          '/history',
          '/updates',
          '/updates/',
          '/events',
          '/predictions',
          '/dashboard',
        ],
      },
      // Aggressive SEO scrapers: content only
      {
        userAgent: 'SemrushBot',
        allow: [
          '/knowledge/',
          '/cases/',
          '/topics/',
          '/tools/',
          '/dimensions/',
          '/r/',
          '/reports',
          '/share/',
          '/world-yi/',
          '/insights/',
          '/astro/',
        ],
        disallow: ['/api/', '/chat', '/chat/', '/admin/', '/result/', '/tool-result/', '/profile'],
      },
      {
        userAgent: 'AhrefsBot',
        allow: [
          '/knowledge/',
          '/cases/',
          '/topics/',
          '/tools/',
          '/dimensions/',
          '/r/',
          '/reports',
          '/share/',
          '/world-yi/',
          '/insights/',
          '/astro/',
        ],
        disallow: ['/api/', '/chat', '/chat/', '/admin/', '/result/', '/tool-result/', '/profile'],
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/sitemap-images.xml`],
    host: siteUrl,
  };
}
