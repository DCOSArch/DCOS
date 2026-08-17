import { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dcos.in';

const blogSlugs = [
  'best-dental-lab-software-india-2026',
  'dcos-vs-labyx',
  'how-to-choose-dental-lab-management-software',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  // NOTE: `/` is deliberately NOT listed. For signed-out visitors it 307-redirects
  // to /landing, and for signed-in users it serves the dashboard — so it is never a
  // stable indexable URL. Submitting a redirecting URL is what produces Search
  // Console's "Page with redirect" status. /landing is the canonical public homepage.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/landing`, lastModified, changeFrequency: 'weekly', priority: 1.0 },
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
