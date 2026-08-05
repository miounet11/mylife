import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.life-kline.com';

/**
 * Crawl budget strategy:
 * - Allow marketing, knowledge, tools, and high-quality public case summaries (/r/*)
 *   that self-gate via noindex when thin.
 * - Keep private product surfaces + chat API out of bots.
 * - /result/* full product reports stay disallowed (use /r for share/index).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/r/', '/knowledge/', '/cases/', '/tools/', '/dimensions/', '/teachers/', '/world-yi/', '/insights/', '/docs/', '/community/', '/analyze', '/membership', '/learn/'],
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
          '/chat/',
          '/updates',
          '/updates/',
          // Full interactive report shells — thin personal UIs; share via /r
          '/result/',
        ],
      },
      // Be explicit for common SEO bots (same rules, clearer for operators)
      {
        userAgent: 'Googlebot',
        allow: ['/', '/r/', '/knowledge/', '/cases/', '/tools/', '/dimensions/', '/teachers/', '/world-yi/', '/insights/', '/docs/', '/community/', '/analyze', '/membership', '/learn/'],
        disallow: ['/api/', '/admin/', '/chat', '/chat/', '/result/', '/profile', '/profile/', '/login', '/history', '/updates', '/updates/', '/events', '/predictions', '/dashboard'],
      },
      {
        userAgent: 'Baiduspider',
        allow: ['/', '/r/', '/knowledge/', '/cases/', '/tools/', '/dimensions/', '/teachers/', '/world-yi/', '/insights/', '/docs/', '/community/', '/analyze', '/membership', '/learn/'],
        disallow: ['/api/', '/admin/', '/chat', '/chat/', '/result/', '/profile', '/profile/', '/login', '/history', '/updates', '/updates/', '/events', '/predictions', '/dashboard'],
      },
      // Aggressive SEO scrapers: still allow content, block product APIs/chat
      {
        userAgent: 'SemrushBot',
        allow: ['/knowledge/', '/cases/', '/tools/', '/dimensions/', '/r/', '/world-yi/', '/insights/'],
        disallow: ['/api/', '/chat', '/chat/', '/admin/', '/result/', '/profile'],
      },
      {
        userAgent: 'AhrefsBot',
        allow: ['/knowledge/', '/cases/', '/tools/', '/dimensions/', '/r/', '/world-yi/', '/insights/'],
        disallow: ['/api/', '/chat', '/chat/', '/admin/', '/result/', '/profile'],
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/sitemap-images.xml`],
    host: siteUrl,
  };
}
