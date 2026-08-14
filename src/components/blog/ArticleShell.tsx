'use client';

import Link from 'next/link';
import type { ReactNode, CSSProperties } from 'react';
import { Stethoscope, ArrowRight, Clock, Calendar, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export const proseStyles: Record<string, CSSProperties> = {
  p: {
    fontSize: '1rem',
    lineHeight: '1.75',
    color: 'var(--foreground)',
    marginBottom: '1.25rem',
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: '700',
    letterSpacing: '-0.02em',
    color: 'var(--foreground)',
    marginTop: '2.5rem',
    marginBottom: '1rem',
  },
  h3: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: 'var(--foreground)',
    marginTop: '2rem',
    marginBottom: '0.75rem',
  },
  ul: {
    listStyleType: 'disc',
    paddingLeft: '1.5rem',
    marginBottom: '1.25rem',
    color: 'var(--foreground)',
  },
  ol: {
    listStyleType: 'decimal',
    paddingLeft: '1.5rem',
    marginBottom: '1.25rem',
    color: 'var(--foreground)',
  },
  li: {
    marginBottom: '0.5rem',
    lineHeight: '1.6',
  },
  a: {
    color: 'var(--primary)',
    textDecoration: 'underline',
    fontWeight: '500',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '1.5rem',
    fontSize: '0.875rem',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem',
    borderBottom: '2px solid var(--border)',
    fontWeight: '700',
    color: 'var(--foreground)',
  },
  td: {
    padding: '0.75rem',
    borderBottom: '1px solid var(--border)',
    color: 'var(--foreground)',
  },
  blockquote: {
    borderLeft: '4px solid var(--primary)',
    paddingLeft: '1rem',
    fontStyle: 'italic',
    margin: '1.5rem 0',
    color: 'var(--muted-foreground)',
  },
};

export function BlogNav() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const newMode = !isDarkMode;
    if (newMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
  };

  return (
    <nav className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary font-extrabold tracking-tight text-lg hover:opacity-90 transition-opacity">
          <Stethoscope className="w-6 h-6 text-primary" />
          <span className="font-bold text-foreground">
            DentalConnect <span className="font-light text-muted-foreground">OS</span>
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
          <Link href="/landing" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:inline-block">
            Home
          </Link>
          <Link href="/labs" className="text-muted-foreground hover:text-foreground transition-colors">
            Find Labs
          </Link>
          <Link href="/blog" className="text-primary font-semibold">
            Blog
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground h-9 w-9"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Link
            href="/login"
            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs tracking-wide transition-all shadow-sm"
          >
            Sign In
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function BlogFooter() {
  return (
    <footer className="border-t border-border bg-card py-12 mt-20 text-muted-foreground text-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="flex items-center gap-2 text-foreground font-bold">
          <Stethoscope className="w-5 h-5 text-primary" />
          <span>DentalConnect OS</span>
        </div>
        <p className="text-xs max-w-md">
          A calm, clinically precise workspace connecting modern dental practices and digital laboratories.
        </p>
        <div className="flex items-center gap-5 text-xs font-medium">
          <Link href="/labs" className="hover:text-foreground transition-colors">Lab Directory</Link>
          <Link href="/blog" className="hover:text-foreground transition-colors">Articles</Link>
          <Link href="/login" className="text-primary hover:underline font-semibold">Sign In</Link>
        </div>
      </div>
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
    <div className="min-h-screen bg-background text-foreground transition-colors flex flex-col justify-between">
      <BlogNav />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 w-full">
        <div className="mb-6">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary font-medium transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to all articles
          </Link>
        </div>
        <header className="mb-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-soft text-primary font-bold text-xs uppercase tracking-wider mb-4">
            {eyebrow}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-6">
            {title}
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed mb-6 font-normal">
            {lede}
          </p>
          <div className="flex items-center gap-4 py-3 border-y border-border text-xs text-muted-foreground font-medium">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <time dateTime={publishedISO}>{publishedLabel}</time>
            </span>
            <span>&bull;</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {readMinutes} min read
            </span>
          </div>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed space-y-4">
          {children}
        </div>

        {/* CTA Card at bottom of article */}
        <div className="mt-16 p-8 rounded-2xl bg-card border border-border text-center space-y-4">
          <h3 className="text-xl font-bold text-foreground">Ready to streamline your digital dental cases?</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Connect directly with verified laboratories, route STL/DICOM scans, and track orders in real time.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all shadow-md gap-2"
          >
            Start Free with DentalConnect OS <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </article>
      <BlogFooter />
    </div>
  );
}
