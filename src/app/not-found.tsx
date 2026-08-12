import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you were looking for could not be found on DentalConnect OS.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#272822',
        color: '#F3F1E7',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1 style={{ fontSize: '4rem', margin: 0, color: '#66D9EF' }}>404</h1>
      <p style={{ fontSize: '1.25rem', margin: '0.5rem 0 2rem', color: '#C2BEAD' }}>
        We couldn&apos;t find that page.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/landing"
          style={{
            background: '#A6E22E',
            color: '#272822',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Back to DentalConnect OS
        </Link>
        <Link
          href="/labs"
          style={{
            border: '1px solid #3E3D32',
            color: '#F3F1E7',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Browse dental labs
        </Link>
      </div>
    </main>
  );
}
