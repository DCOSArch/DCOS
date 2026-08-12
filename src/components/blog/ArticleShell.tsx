import Link from 'next/link';
import type { ReactNode } from 'react';

const styles = {
  page: {
    minHeight: '100vh',
    background: '#F8F7F2',
    color: '#1E1F1C',
    fontFamily:
      "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    lineHeight: 1.7,
  } as const,
  nav: {
    borderBottom: '1px solid #E5E2D6',
    background: '#F3F1E7',
  } as const,
  navInner: {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '18px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '15px',
  } as const,
  brand: {
    color: '#1E1F1C',
    fontWeight: 800,
    letterSpacing: '-0.01em',
    textDecoration: 'none',
    fontSize: '17px',
  } as const,
  navLinks: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
  } as const,
  navLink: {
    color: '#3E3D32',
    textDecoration: 'none',
    fontWeight: 500,
  } as const,
  ctaLink: {
    background: '#1E1F1C',
    color: '#F3F1E7',
    padding: '8px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
  } as const,
  article: {
    maxWidth: '760px',
    margin: '0 auto',
    padding: '64px 24px 96px',
  } as const,
  eyebrow: {
    color: '#66D9EF',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontSize: '13px',
    marginBottom: '16px',
  } as const,
  h1: {
    fontSize: 'clamp(32px, 5vw, 48px)',
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    fontWeight: 800,
    margin: '0 0 20px',
    color: '#1E1F1C',
  } as const,
  lede: {
    fontSize: '20px',
    color: '#3E3D32',
    lineHeight: 1.55,
    margin: '0 0 32px',
  } as const,
  meta: {
    fontSize: '14px',
    color: '#8E8B7F',
    marginBottom: '48px',
    borderTop: '1px solid #E5E2D6',
    borderBottom: '1px solid #E5E2D6',
    padding: '12px 0',
  } as const,
  footer: {
    borderTop: '1px solid #E5E2D6',
    background: '#F3F1E7',
    padding: '48px 24px',
    textAlign: 'center' as const,
    color: '#3E3D32',
    fontSize: '14px',
  } as const,
  cta: {
    display: 'block',
    marginTop: '48px',
    padding: '32px',
    background: '#1E1F1C',
    color: '#F3F1E7',
    borderRadius: '16px',
    textDecoration: 'none',
  } as const,
};

export function BlogNav() {
  return (
    <nav style={styles.nav}>
      <div style={styles.navInner}>
        <Link href="/landing" style={styles.brand}>
          DentalConnect OS
        </Link>
        <div style={styles.navLinks}>
          <Link href="/blog" style={styles.navLink}>
            Blog
          </Link>
          <Link href="/labs" style={styles.navLink}>
            Labs
          </Link>
          <Link href="/login" style={styles.ctaLink}>
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function BlogFooter() {
  return (
    <footer style={styles.footer}>
      <p>
        DentalConnect OS — the operating system for modern dentistry.{' '}
        <Link href="/login" style={{ color: '#1E1F1C', fontWeight: 700 }}>
          Start free
        </Link>
        .
      </p>
    </footer>
  );
}

export function ArticleShell({
  eyebrow,
  title,
  lede,
  publishedISO,
  publishedLabel,
  readMinutes,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  publishedISO: string;
  publishedLabel: string;
  readMinutes: number;
  children: ReactNode;
}) {
  return (
    <div style={styles.page}>
      <BlogNav />
      <article style={styles.article}>
        <div style={styles.eyebrow}>{eyebrow}</div>
        <h1 style={styles.h1}>{title}</h1>
        <p style={styles.lede}>{lede}</p>
        <div style={styles.meta}>
          <time dateTime={publishedISO}>{publishedLabel}</time>
          {' · '}
          {readMinutes} min read
        </div>
        <div className="blog-body">{children}</div>
        <Link href="/login" style={styles.cta}>
          <div style={{ fontSize: '13px', color: '#A6E22E', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Try DentalConnect OS
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '8px' }}>
            Route your next case in minutes, not days.
          </div>
          <div style={{ fontSize: '15px', opacity: 0.75, marginTop: '8px' }}>
            Free for the first clinic-lab pair. No credit card. Setup in one call.
          </div>
        </Link>
      </article>
      <BlogFooter />
    </div>
  );
}

export const proseStyles = {
  h2: {
    fontSize: '30px',
    lineHeight: 1.25,
    fontWeight: 700,
    letterSpacing: '-0.015em',
    margin: '48px 0 16px',
    color: '#1E1F1C',
  } as const,
  h3: {
    fontSize: '22px',
    lineHeight: 1.3,
    fontWeight: 700,
    margin: '32px 0 12px',
    color: '#1E1F1C',
  } as const,
  p: {
    fontSize: '18px',
    color: '#272822',
    margin: '0 0 20px',
  } as const,
  ul: {
    fontSize: '18px',
    color: '#272822',
    margin: '0 0 20px',
    paddingLeft: '24px',
  } as const,
  li: {
    marginBottom: '10px',
  } as const,
  quote: {
    fontSize: '20px',
    fontStyle: 'italic' as const,
    borderLeft: '4px solid #A6E22E',
    padding: '4px 20px',
    color: '#3E3D32',
    margin: '32px 0',
  } as const,
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    margin: '24px 0 32px',
    fontSize: '16px',
  } as const,
  th: {
    textAlign: 'left' as const,
    borderBottom: '2px solid #1E1F1C',
    padding: '10px 12px',
    fontWeight: 700,
  } as const,
  td: {
    borderBottom: '1px solid #E5E2D6',
    padding: '10px 12px',
    verticalAlign: 'top' as const,
  } as const,
  a: {
    color: '#1E1F1C',
    textDecoration: 'underline',
    textDecorationColor: '#A6E22E',
    textDecorationThickness: '2px',
  } as const,
};
