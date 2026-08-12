import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogNav, BlogFooter } from '@/components/blog/ArticleShell';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dcos.in';

export const metadata: Metadata = {
  title: 'DentalConnect OS Blog — Dental Lab & Clinic Insights',
  description:
    'Guides, comparisons, and playbooks on dental lab management software, clinic-to-lab collaboration, and digital dentistry workflows for clinics and labs in India and beyond.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'DentalConnect OS Blog',
    description:
      'Guides and comparisons on dental lab management software and clinic-to-lab collaboration.',
    url: `${SITE_URL}/blog`,
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'DentalConnect OS Blog',
      },
    ],
  },
};

const posts = [
  {
    slug: 'best-dental-lab-software-india-2026',
    title: 'Best dental lab software in India (2026 buyer’s guide)',
    dek: 'What to look for, what to skip, and how the top platforms compare when your clinic or lab is picking software this year.',
    date: '2026-08-13',
    dateLabel: 'August 13, 2026',
    readMinutes: 9,
  },
  {
    slug: 'dcos-vs-labyx',
    title: 'DCOS vs Labyx: which dental lab software is right for you?',
    dek: 'A side-by-side look at how DentalConnect OS and Labyx approach clinic-lab collaboration, pricing, digital workflows, and scanner integration.',
    date: '2026-08-13',
    dateLabel: 'August 13, 2026',
    readMinutes: 7,
  },
  {
    slug: 'how-to-choose-dental-lab-management-software',
    title: 'How to choose dental lab management software: 7 criteria that matter',
    dek: 'The framework we use with dentists and lab owners to cut through demos, marketing pages, and edge features — and pick software that ships cases faster.',
    date: '2026-08-13',
    dateLabel: 'August 13, 2026',
    readMinutes: 8,
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  '@id': `${SITE_URL}/blog#blog`,
  name: 'DentalConnect OS Blog',
  url: `${SITE_URL}/blog`,
  publisher: { '@type': 'Organization', name: 'DentalConnect OS', url: SITE_URL },
  blogPost: posts.map((p) => ({
    '@type': 'BlogPosting',
    headline: p.title,
    url: `${SITE_URL}/blog/${p.slug}`,
    datePublished: p.date,
    author: { '@type': 'Organization', name: 'DentalConnect OS' },
  })),
};

export default function BlogIndexPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8F7F2',
        color: '#1E1F1C',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogNav />
      <main style={{ maxWidth: '840px', margin: '0 auto', padding: '64px 24px 96px' }}>
        <header style={{ marginBottom: '48px' }}>
          <div
            style={{
              color: '#66D9EF',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: '13px',
              marginBottom: '12px',
            }}
          >
            Blog
          </div>
          <h1
            style={{
              fontSize: 'clamp(32px, 5vw, 48px)',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              fontWeight: 800,
              margin: 0,
            }}
          >
            Playbooks for modern dental clinics and labs.
          </h1>
          <p
            style={{
              fontSize: '20px',
              color: '#3E3D32',
              marginTop: '16px',
              lineHeight: 1.55,
            }}
          >
            Straight-talk guides on dental lab software, clinic-to-lab collaboration, and
            the digital dentistry workflow. No fluff.
          </p>
        </header>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {posts.map((p) => (
            <li
              key={p.slug}
              style={{
                borderTop: '1px solid #E5E2D6',
                padding: '32px 0',
              }}
            >
              <article>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#8E8B7F',
                    marginBottom: '10px',
                  }}
                >
                  <time dateTime={p.date}>{p.dateLabel}</time> · {p.readMinutes} min read
                </div>
                <h2 style={{ fontSize: '28px', lineHeight: 1.2, margin: '0 0 12px' }}>
                  <Link
                    href={`/blog/${p.slug}`}
                    style={{ color: '#1E1F1C', textDecoration: 'none' }}
                  >
                    {p.title}
                  </Link>
                </h2>
                <p style={{ fontSize: '17px', color: '#3E3D32', margin: '0 0 12px' }}>
                  {p.dek}
                </p>
                <Link
                  href={`/blog/${p.slug}`}
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#1E1F1C',
                    textDecoration: 'underline',
                    textDecorationColor: '#A6E22E',
                    textDecorationThickness: '2px',
                  }}
                >
                  Read the guide →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </main>
      <BlogFooter />
    </div>
  );
}
