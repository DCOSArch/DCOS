import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dcos.in';

const blogSlugs = [
  'best-dental-lab-software-india-2026',
  'dcos-vs-labyx',
  'how-to-choose-dental-lab-management-software',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // `/` is the canonical homepage: for signed-out visitors the middleware rewrites it
  // to the landing content with a 200 (no redirect), and the /landing route canonicals
  // back to `/`. `/landing` is therefore intentionally omitted — listing a URL that
  // canonicals elsewhere is redundant.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${SITE_URL}/labs`, lastModified, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified, changeFrequency: 'weekly', priority: 0.8 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${SITE_URL}/blog/${slug}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}
