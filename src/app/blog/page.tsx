import type { Metadata } from 'next';
import Link from 'next/link';
import { BlogNav, BlogFooter } from '@/components/blog/ArticleShell';
import { ArrowRight, BookOpen, Clock, Calendar } from 'lucide-react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.dcos.in';

export const metadata: Metadata = {
  title: 'DentalConnect OS Blog — Clinical & Lab Insights',
  description:
    'Guides, comparisons, and playbooks on dental lab management software, clinic-to-lab collaboration, and digital dentistry workflows for clinics and labs.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'DentalConnect OS Blog — Digital Dentistry & Lab Insights',
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
    category: 'Buyer Guide',
    readMinutes: 9,
  },
  {
    slug: 'dcos-vs-labyx',
    title: 'DCOS vs Labyx: which dental lab software is right for you?',
    dek: 'A side-by-side look at how DentalConnect OS and Labyx approach clinic-lab collaboration, pricing, digital workflows, and scanner integration.',
    date: '2026-08-13',
    dateLabel: 'August 13, 2026',
    category: 'Comparison',
    readMinutes: 7,
  },
  {
    slug: 'how-to-choose-dental-lab-management-software',
    title: 'How to choose dental lab management software: 7 criteria that matter',
    dek: 'The framework we use with dentists and lab owners to cut through demos, marketing pages, and edge features — and pick software that ships cases faster.',
    date: '2026-08-13',
    dateLabel: 'August 13, 2026',
    category: 'Playbook',
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
    <div className="min-h-screen bg-background text-foreground transition-colors flex flex-col justify-between">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogNav />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 w-full animate-fade-in">
        <header className="mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-4 border border-primary/20">
            <BookOpen className="w-3.5 h-3.5" /> Clinical & Lab Insights
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-4">
            The DentalConnect Blog
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl font-normal leading-relaxed">
            Practical guides on dental lab software, intraoral scan routing, transparent pricing, and seamless clinic-to-lab digital handoffs.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col justify-between bg-card text-card-foreground p-6 sm:p-7 rounded-2xl border border-border hover:border-primary/50 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readMinutes} min
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-3">
                  {post.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {post.dek}
                </p>
              </div>

              <div className="flex items-center justify-between pt-6 mt-6 border-t border-border text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {post.dateLabel}
                </span>
                <span className="text-primary font-semibold inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <BlogFooter />
    </div>
  );
}
