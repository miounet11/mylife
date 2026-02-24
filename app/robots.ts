import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/result/'], // We disallow indexing individual private results
    },
    sitemap: 'https://life-kline.com/sitemap.xml',
  };
}
