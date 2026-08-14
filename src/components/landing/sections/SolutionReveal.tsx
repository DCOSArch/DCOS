'use client';

import { useRef, useEffect } from 'react';

export default function SolutionReveal() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animate = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        // Browser frame entrance
        if (frameRef.current) {
          gsap.fromTo(
            frameRef.current,
            { opacity: 0, y: 80, scale: 0.92 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 1,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 50%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // Wireframe draw effect — border reveal
        const content = frameRef.current?.querySelector('.browser-frame-content');
        if (content) {
          gsap.fromTo(
            content,
            { clipPath: 'inset(0 100% 0 0)' },
            {
              clipPath: 'inset(0 0% 0 0)',
              duration: 1.5,
              ease: 'power2.inOut',
              scrollTrigger: {
                trigger: frameRef.current,
                start: 'top 60%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // Stats counter animation
        const statValues = statsRef.current?.querySelectorAll('.stat-value');
        if (statValues) {
          const targets = [3, 100, 0];
          const suffixes = [' min', '%', ''];
          const prefixes = ['', '', 'Zero'];

          statValues.forEach((el, i) => {
            if (i === 2) {
              // "Zero-click" — just fade in
              gsap.fromTo(
                el,
                { opacity: 0, y: 20 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.8,
                  delay: 0.6,
                  ease: 'power2.out',
                  scrollTrigger: {
                    trigger: statsRef.current,
                    start: 'top 80%',
                    toggleActions: 'play none none reverse',
                  },
                }
              );
              return;
            }

            const counter = { val: 0 };
            gsap.to(counter, {
              val: targets[i],
              duration: 1.5,
              ease: 'power2.out',
              delay: i * 0.2,
              scrollTrigger: {
                trigger: statsRef.current,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
              onUpdate: () => {
                (el as HTMLElement).textContent = `${prefixes[i]}${Math.round(counter.val)}${suffixes[i]}`;
              },
            });
          });
        }

        // Title
        const title = sectionRef.current?.querySelector('.solution-title');
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
      } catch {
        // fallback
      }
    };

    animate();
  }, []);

  return (
    <section ref={sectionRef} className="landing-section light-section" id="solution">
      <div className="section-inner text-center">
        <span className="landing-label" style={{ color: 'var(--landing-teal)', marginBottom: 16, display: 'block' }}>
          From Scan to Fit
        </span>

        <h2 className="landing-heading solution-title" style={{ opacity: 0, maxWidth: 800, margin: '0 auto 16px' }}>
          A clearer handoff for{' '}
          <span className="gradient-text-warm">every restoration.</span>
        </h2>

        <p className="landing-subheading mx-auto" style={{ marginBottom: 48, color: 'var(--landing-ink-muted)' }}>
          DentalConnect replaces chaotic phone calls and lost files with a structured, 3-step clinical workflow.
        </p>

        {/* 3-Step "From Scan to Fit" Story Sequence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16 text-left">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md hover:-translate-y-1 transition-all duration-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-sm mb-4 border border-teal-500/20">
              01
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-2">
              Build the prescription
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Choose treatment, FDI teeth, material (Zirconia HT, IPS e.max, BruxZir), VITA Classical/3D Master shades, and delivery date with only the details this case needs.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md hover:-translate-y-1 transition-all duration-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-sm mb-4 border border-cyan-500/20">
              02
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-2">
              Send the complete case
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Upload scans from any scanner (Medit, 3Shape, iTero, Sirona STL/PLY/OBJ), see automatic file integrity checks, and submit to your trusted lab with a clear case record.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 backdrop-blur-md hover:-translate-y-1 transition-all duration-200 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm mb-4 border border-amber-500/20">
              03
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-white mb-2">
              Follow every handoff
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Receive acceptance, CAD/CAM milling, sintering/glazing, delivery, and in-context case messaging in the same live case timeline.
            </p>
          </div>
        </div>

        <div ref={frameRef} className="browser-frame" style={{ opacity: 0, color: '#F8F8F2' }}>
          <div className="browser-frame-bar">
            <div className="browser-dot" style={{ background: '#FF5F56' }} />
            <div className="browser-dot" style={{ background: '#FFBD2E' }} />
            <div className="browser-dot" style={{ background: '#27C93F' }} />
            <span style={{ marginLeft: 12, fontSize: '0.75rem', opacity: 0.4, fontFamily: 'var(--font-geist-mono)' }}>
              dentalconnect.os
            </span>
          </div>
          <div className="browser-frame-content">
            {/* Simulated dashboard UI */}
            <div style={{ padding: '24px 28px' }}>
              {/* Top bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--landing-teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"/><path d="M8 15a6.63 6.63 0 0 0 4 1 6.63 6.63 0 0 0 4-1"/><path d="M18 2h-1a.3.3 0 1 0 .2.3A2 2 0 0 1 20 4v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/></svg>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>DentalConnect OS</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 80, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)' }} />
                </div>
              </div>

              {/* Summary cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Active Cases', value: '12', color: 'var(--landing-cyan)' },
                  { label: 'Completed', value: '47', color: 'var(--landing-green)' },
                  { label: 'Due This Week', value: '5', color: 'var(--landing-orange)' },
                  { label: 'Action Required', value: '3', color: 'var(--landing-pink)' },
                ].map((card, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 10,
                      borderLeft: `3px solid ${card.color}`,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-geist-mono)' }}>{card.value}</div>
                  </div>
                ))}
              </div>

              {/* Mini case table */}
              <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: '12px 14px', textAlign: 'left' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.5, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Recent Cases
                </div>
                {[
                  { id: 'DC-0847', patient: 'Patient A', treatment: 'Zirconia Crown', status: 'In Production', statusColor: 'var(--landing-cyan)' },
                  { id: 'DC-0846', patient: 'Patient B', treatment: 'E.max Veneer × 4', status: 'Quality Check', statusColor: 'var(--landing-orange)' },
                  { id: 'DC-0845', patient: 'Patient C', treatment: 'PFM Bridge', status: 'Dispatched', statusColor: 'var(--landing-green)' },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      fontSize: '0.78rem',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-geist-mono)', opacity: 0.5, width: 70 }}>{row.id}</span>
                    <span style={{ flex: 1, marginLeft: 12 }}>{row.patient}</span>
                    <span style={{ flex: 1, opacity: 0.6 }}>{row.treatment}</span>
                    <span
                      className="mock-badge"
                      style={{ background: `${row.statusColor}22`, color: row.statusColor }}
                    >
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div ref={statsRef} className="stats-row" style={{ marginTop: 56 }}>
          <div className="stat-item">
            <div className="stat-value gradient-text-warm">3 min</div>
            <div className="stat-label" style={{ color: 'var(--landing-ink-muted)', opacity: 0.85 }}>Avg. case submission</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--landing-success)' }}>100%</div>
            <div className="stat-label" style={{ color: 'var(--landing-ink-muted)', opacity: 0.85 }}>Real-time visibility</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--landing-teal)' }}>Zero-click</div>
            <div className="stat-label" style={{ color: 'var(--landing-ink-muted)', opacity: 0.85 }}>Scanner folder watcher</div>
          </div>
        </div>
      </div>
    </section>
  );
}
