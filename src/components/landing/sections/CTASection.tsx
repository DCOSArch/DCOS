'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';

interface CTASectionProps {
  onRequestDemo: () => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenDocs: () => void;
}

export default function CTASection({
  onRequestDemo,
  onOpenPrivacy,
  onOpenTerms,
  onOpenDocs,
}: CTASectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animate = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        // Title
        const title = sectionRef.current?.querySelector('.cta-title');
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

        // CTA buttons
        const ctas = sectionRef.current?.querySelector('.cta-buttons');
        if (ctas) {
          gsap.fromTo(
            ctas,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              delay: 0.3,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 60%',
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
    <>
      <section ref={sectionRef} className="landing-section dark-section cta-section" id="cta" style={{ paddingTop: 120, paddingBottom: 80 }}>
        {/* Gradient mesh background */}
        <div className="cta-gradient-mesh">
          <div
            className="cta-gradient-blob"
            style={{
              width: 500,
              height: 500,
              top: '10%',
              left: '20%',
              background: 'radial-gradient(circle, rgba(23,107,104,0.3), transparent 70%)',
            }}
          />
          <div
            className="cta-gradient-blob"
            style={{
              width: 400,
              height: 400,
              bottom: '10%',
              right: '20%',
              background: 'radial-gradient(circle, rgba(102,217,239,0.2), transparent 70%)',
              animationDelay: '4s',
            }}
          />
        </div>

        <div className="section-inner text-center" style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="landing-display cta-title" style={{ opacity: 0, maxWidth: 800, margin: '0 auto 20px' }}>
            Your next case can be{' '}
            <span className="gradient-text">clearer than your last.</span>
          </h2>

          <p className="landing-subheading mx-auto" style={{ marginBottom: 40 }}>
            DentalConnect brings scans, prescriptions, shade details, lab communication, and live production updates into one calm clinical workspace.
          </p>

          <div className="cta-buttons" style={{ display: 'flex', gap: 16, justifySelf: 'center', justifyContent: 'center', flexWrap: 'wrap', opacity: 0 }}>
            <Link href="/login" className="landing-btn landing-btn-primary" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
              Create your dentist workspace
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <button onClick={onRequestDemo} className="landing-btn landing-btn-outline" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Request Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-links">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onOpenPrivacy(); }}
            className="landing-footer-link"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onOpenTerms(); }}
            className="landing-footer-link"
          >
            Terms of Service
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onRequestDemo(); }}
            className="landing-footer-link"
          >
            Contact
          </a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onOpenDocs(); }}
            className="landing-footer-link"
          >
            Documentation
          </a>
        </div>
        <div className="landing-footer-copy">
          © {new Date().getFullYear()} DCOS. Built for modern dentistry.
        </div>
      </footer>
    </>
  );
}
