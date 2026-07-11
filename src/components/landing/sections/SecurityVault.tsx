'use client';

import { useRef, useEffect } from 'react';

const trustPillars = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Row-Level Security',
    desc: 'Every database query checks ownership. Dentists see only their cases. Labs see only assigned work. No exceptions, no leaks.',
    color: '#66D9EF',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
    title: 'Patient Privacy',
    desc: 'Smile preview links expose zero patient names. Links expire in 72 hours. Patient PHI is isolated in a separate, encrypted table.',
    color: '#A6E22E',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 16V4a2 2 0 0 1 2-2h11"/>
        <path d="M5 14H4a2 2 0 1 0 0 4h1"/>
        <path d="M22 18H11a2 2 0 1 0 0 4h11V6H11a2 2 0 0 0-2 2v12"/>
      </svg>
    ),
    title: 'Encrypted Transit',
    desc: 'All data encrypted via TLS. Scan files served through presigned URLs with 1-hour expiry. Cookie-based JWT sessions via Supabase SSR.',
    color: '#FD971F',
  },
];

export default function SecurityVault() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animate = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        // Title
        const title = sectionRef.current?.querySelector('.security-title-main');
        if (title) {
          gsap.fromTo(
            title,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 65%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // Shield
        const shield = sectionRef.current?.querySelector('.shield-icon');
        if (shield) {
          gsap.fromTo(
            shield,
            { opacity: 0, scale: 0.5, rotation: -20 },
            {
              opacity: 1,
              scale: 1,
              rotation: 0,
              duration: 0.8,
              ease: 'elastic.out(1, 0.6)',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 60%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // Cards stagger
        const cards = sectionRef.current?.querySelectorAll('.security-card');
        if (cards) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.15,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: sectionRef.current?.querySelector('.security-grid'),
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }
      } catch {
        // fallback
      }
    };

    animate();
  }, []);

  return (
    <section ref={sectionRef} className="landing-section dark-section" id="security" style={{ paddingTop: 100, paddingBottom: 100, background: 'var(--landing-dark)' }}>
      <div className="scanline-bg" />

      <div className="glow-orb glow-orb-cyan" style={{ width: 300, height: 300, top: '20%', left: '50%', transform: 'translateX(-50%)', opacity: 0.08 }} />

      <div className="section-inner text-center">
        {/* Shield Icon */}
        <div className="shield-icon" style={{ opacity: 0, margin: '0 auto 24px', width: 80, height: 80 }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--landing-cyan)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
            <path d="m9 12 2 2 4-4" stroke="var(--landing-green)" strokeWidth="2"/>
          </svg>
        </div>

        <span className="landing-label" style={{ color: 'var(--landing-cyan)', marginBottom: 16, display: 'block' }}>
          Trust & Privacy
        </span>

        <h2 className="landing-heading security-title-main" style={{ opacity: 0, maxWidth: 700, margin: '0 auto 16px' }}>
          Security is not a feature.{' '}
          <span style={{ color: 'var(--landing-cyan)' }}>It&apos;s the foundation.</span>
        </h2>

        <p className="landing-subheading mx-auto">
          Built on Supabase Postgres with Row-Level Security, encrypted transit, and strict data isolation from day one.
        </p>

        {/* Trust Pillars */}
        <div className="security-grid">
          {trustPillars.map((pillar, i) => (
            <div key={i} className="security-card glass-card">
              <div className="security-icon" style={{ borderColor: `${pillar.color}20`, background: `${pillar.color}10`, color: pillar.color }}>
                {pillar.icon}
              </div>
              <div className="security-title" style={{ color: '#F8F8F2' }}>{pillar.title}</div>
              <div className="security-desc">{pillar.desc}</div>
            </div>
          ))}
        </div>

        {/* Compliance badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 48, flexWrap: 'wrap' }}>
          {[
            'Postgres RLS on all tables',
            'Cookie-based JWT sessions',
            'Presigned URL file access',
            'PHI data isolation',
          ].map((badge, i) => (
            <div
              key={i}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: 'rgba(102,217,239,0.06)',
                border: '1px solid rgba(102,217,239,0.1)',
                fontSize: '0.78rem',
                color: 'rgba(248,248,242,0.6)',
              }}
            >
              ✓ {badge}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
