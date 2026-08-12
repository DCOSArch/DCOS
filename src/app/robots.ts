import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dcos.in';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/landing', '/labs', '/blog'],
        disallow: [
          '/login',
          '/auth/',
          '/api/',
          '/cases/',
          '/inventory/',
          '/patients/',
          '/viewer/',
          '/lab-directory/',
          '/preview/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
