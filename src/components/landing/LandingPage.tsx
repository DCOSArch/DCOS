'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

/* ---- Section imports (dynamic for code-splitting 3D sections) ---- */
const HeroSection = dynamic(() => import('./sections/HeroSection'), { ssr: false });
const ProblemSection = dynamic(() => import('./sections/ProblemSection'), { ssr: false });
const SolutionReveal = dynamic(() => import('./sections/SolutionReveal'), { ssr: false });
const FeatureOrbit = dynamic(() => import('./sections/FeatureOrbit'), { ssr: false });
const DualDashboard = dynamic(() => import('./sections/DualDashboard'), { ssr: false });
const ThreeDShowcase = dynamic(() => import('./sections/ThreeDShowcase'), { ssr: false });
const RealtimeDemo = dynamic(() => import('./sections/RealtimeDemo'), { ssr: false });
const SecurityVault = dynamic(() => import('./sections/SecurityVault'), { ssr: false });
const CTASection = dynamic(() => import('./sections/CTASection'), { ssr: false });

/* ---- Section IDs for progress nav ---- */
const sectionIds = ['hero', 'problem', 'solution', 'features', 'dashboards', 'viewer', 'realtime', 'security', 'cta'];
const sectionLabels = ['Home', 'Problem', 'Solution', 'Features', 'Dashboards', '3D Viewer', 'Real-time', 'Security', 'Get Started'];

export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Footer & Demo Request Modal states
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [practiceType, setPracticeType] = useState('Dental Clinic');
  const [scannerType, setScannerType] = useState('iTero');
  const [message, setMessage] = useState('');

  /* ---- Lenis smooth scroll ---- */
  useEffect(() => {
    let lenisInstance: any = null;

    const initLenis = async () => {
      try {
        const LenisModule = await import('lenis');
        const Lenis = LenisModule.default;

        lenisInstance = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          smoothWheel: true,
        });

        function raf(time: number) {
          lenisInstance?.raf(time);
          requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
      } catch {
        // Lenis fallback
      }
    };

    initLenis();

    return () => {
      lenisInstance?.destroy();
    };
  }, []);

  /* ---- Scroll observation ---- */
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };

    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id, index) => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(index);
            }
          });
        },
        { threshold: 0.3 }
      );

      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }, 500);

      observers.push(observer);
    });

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      observers.forEach((obs) => obs.disconnect());
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim() && email.trim()) {
      setIsSubmitted(true);
    }
  };

  return (
    <div ref={rootRef} className="landing-root landing-grain">
      {/* ---- Floating Nav Bar ---- */}
      <nav className={`landing-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="landing-nav-brand">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--landing-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"/>
            <path d="M8 15a6.63 6.63 0 0 0 4 1 6.63 6.63 0 0 0 4-1"/>
            <path d="M18 2h-1a.3.3 0 1 0 .2.3A2 2 0 0 1 20 4v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/>
          </svg>
          DCOS
        </div>

        <div className="landing-nav-links">
          <button className="landing-nav-link" onClick={() => scrollToSection('features')}>Features</button>
          <button className="landing-nav-link" onClick={() => scrollToSection('dashboards')}>Dashboards</button>
          <button className="landing-nav-link" onClick={() => scrollToSection('viewer')}>3D Viewer</button>
          <button className="landing-nav-link" onClick={() => scrollToSection('security')}>Security</button>
        </div>

        <Link href="/login" className="landing-nav-cta">
          Get Started
        </Link>
      </nav>

      {/* ---- Scroll Progress Dots ---- */}
      <div className="scroll-progress">
        {sectionIds.map((id, i) => (
          <div
            key={id}
            className={`scroll-progress-dot ${activeSection === i ? 'active' : ''}`}
            onClick={() => scrollToSection(id)}
            title={sectionLabels[i]}
          />
        ))}
      </div>

      {/* ---- Sections ---- */}
      <HeroSection onRequestDemo={() => { setIsSubmitted(false); setIsDemoOpen(true); }} />
      <ProblemSection />
      <SolutionReveal />
      <FeatureOrbit />
      <DualDashboard />
      <ThreeDShowcase />
      <RealtimeDemo />
      <SecurityVault />
      <CTASection
        onRequestDemo={() => { setIsSubmitted(false); setIsDemoOpen(true); }}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenTerms={() => setIsTermsOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* ---- Request Demo Modal ---- */}
      {isDemoOpen && (
        <div className="demo-modal-overlay" onClick={() => setIsDemoOpen(false)}>
          <div className="demo-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                  {isSubmitted ? 'Request Confirmed!' : 'Request a Custom Demo'}
                </h3>
                <button
                  onClick={() => setIsDemoOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  ✕ Close
                </button>
              </div>

              {isSubmitted ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(166,226,46,0.15)', color: 'var(--landing-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 20px', border: '2px solid var(--landing-green)' }}>
                    ✓
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 12 }}>Thank you, {fullName}!</h4>
                  <p style={{ fontSize: '0.88rem', opacity: 0.7, lineHeight: 1.6, marginBottom: 24 }}>
                    Your demo request for <strong>DCOS</strong> has been received. Our clinical onboarding team will contact you at <strong>{email}</strong> within 24 hours to schedule your custom walkthrough.
                  </p>
                  <button
                    onClick={() => setIsDemoOpen(false)}
                    className="landing-btn landing-btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '0.9rem', borderRadius: 8 }}
                  >
                    Got it, thanks!
                  </button>
                </div>
              ) : (
                <form onSubmit={handleDemoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.6, marginBottom: 6 }}>Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Jane Smith"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ width: '100%', padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.6, marginBottom: 6 }}>Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="name@practice.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: '100%', padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.6, marginBottom: 6 }}>Practice Type</label>
                      <select
                        value={practiceType}
                        onChange={(e) => setPracticeType(e.target.value)}
                        style={{ width: '100%', padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="Dental Clinic">Dental Clinic</option>
                        <option value="Dental Lab">Dental Laboratory</option>
                        <option value="Group Practice">DSO / Group Practice</option>
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.6, marginBottom: 6 }}>Scanner Ecosystem</label>
                      <select
                        value={scannerType}
                        onChange={(e) => setScannerType(e.target.value)}
                        style={{ width: '100%', padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem' }}
                      >
                        <option value="iTero">iTero</option>
                        <option value="3Shape">3Shape TRIOS</option>
                        <option value="Carestream">Carestream</option>
                        <option value="Medit">Medit</option>
                        <option value="Other">Other / None</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', opacity: 0.6, marginBottom: 6 }}>Special Requests / Message</label>
                    <textarea
                      placeholder="Tell us about your clinic's monthly restoration volume..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      style={{ width: '100%', padding: 10, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.85rem', resize: 'none' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="landing-btn landing-btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '0.9rem', borderRadius: 8, marginTop: 8 }}
                  >
                    Submit Demo Request ⚡
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- Privacy Policy Modal ---- */}
      {isPrivacyOpen && (
        <div className="demo-modal-overlay" onClick={() => setIsPrivacyOpen(false)}>
          <div className="demo-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                  Privacy Policy (GPDP Compliant)
                </h3>
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p>
                  <strong>Digital Personal Data Protection Act (GPDP) Compliance</strong>
                  <br />
                  DCOS is fully compliant with the Digital Personal Data Protection Act, 2023 of India. We act strictly as a <strong>Data Processor</strong> on behalf of our clinics and laboratories (the Data Fiduciaries).
                </p>
                <p>
                  <strong>Patient Data Isolation & Masking</strong>
                  <br />
                  We isolate all Patient Personal Health Information (PHI) in restricted database schemas protected by strict Row-Level Security (RLS) policies. Share preview links mask patient identifiers and automatically expire after 72 hours.
                </p>
                <p>
                  <strong>Security & Transit</strong>
                  <br />
                  All data in transit is encrypted using industry-standard SSL/TLS connections. Raw scan files are securely stored on private buckets and accessed only via signed URLs with temporary access windows.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Terms of Service Modal ---- */}
      {isTermsOpen && (
        <div className="demo-modal-overlay" onClick={() => setIsTermsOpen(false)}>
          <div className="demo-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                  Terms of Service
                </h3>
                <button
                  onClick={() => setIsTermsOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p>
                  <strong>1. Clinical Integrity & Usage</strong>
                  <br />
                  DCOS is a B2B SaaS tool facilitating laboratory prescription delivery. Clinics and technicians are solely responsible for final diagnostic validations and material fabrication parameters.
                </p>
                <p>
                  <strong>2. Subscription & Inventory Deductions</strong>
                  <br />
                  Pre-purchased block inventory deductions are executed automatically via Postgres backend triggers when laboratory technicians accept case orders.
                </p>
                <p>
                  <strong>3. Scanner Integration License</strong>
                  <br />
                  Usage of the local Scanner Folder Watcher utility relies on browser File System Access API capabilities. Subscribing organizations guarantee proper folder authorization permissions on their local workstation endpoints.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---- Documentation Modal ---- */}
      {isDocsOpen && (
        <div className="demo-modal-overlay" onClick={() => setIsDocsOpen(false)}>
          <div className="demo-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                  DCOS System Documentation
                </h3>
                <button
                  onClick={() => setIsDocsOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{ fontSize: '0.85rem', opacity: 0.8, lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <h4 style={{ color: 'var(--landing-cyan)', fontWeight: 700, fontSize: '0.92rem', marginBottom: 4 }}>1. File System Watcher Setup</h4>
                  <p style={{ margin: 0 }}>
                    Enable scanner exports synchronization by selecting the watch folder (e.g., `C:/iTero/exports/`) inside your clinic dashboard. The browser will request read-only permissions to automatically pick up and upload newly generated `.stl` files.
                  </p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--landing-cyan)', fontWeight: 700, fontSize: '0.92rem', marginBottom: 4 }}>2. 3D Model Coordinate Pinning</h4>
                  <p style={{ margin: 0 }}>
                    Drop spatial pins on models in the viewer by hovering, typing a comment, and clicking on the crown mesh. Pins are stored with exact vertex normal vectors, allowing labs to view comments from the identical camera angle.
                  </p>
                </div>
                <div>
                  <h4 style={{ color: 'var(--landing-cyan)', fontWeight: 700, fontSize: '0.92rem', marginBottom: 4 }}>3. Database Triggers & Audits</h4>
                  <p style={{ margin: 0 }}>
                    Inventory transactions and case transitions are audited and stored securely. Move lab Kanban cards to `In Production` to automatically subtract corresponding material block allocations via isolated schema database triggers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
