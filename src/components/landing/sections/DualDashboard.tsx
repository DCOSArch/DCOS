'use client';

import { useRef, useEffect, useState } from 'react';

export default function DualDashboard() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<'dentist' | 'lab'>('dentist');

  useEffect(() => {
    const animate = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        // Split pane entrance
        const panes = splitRef.current?.querySelectorAll('.dual-split-pane');
        if (panes) {
          gsap.fromTo(
            panes[0],
            { x: -60, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: splitRef.current,
                start: 'top 65%',
                toggleActions: 'play none none reverse',
              },
            }
          );
          gsap.fromTo(
            panes[1],
            { x: 60, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power3.out',
              delay: 0.15,
              scrollTrigger: {
                trigger: splitRef.current,
                start: 'top 65%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // Title
        const title = sectionRef.current?.querySelector('.dual-title');
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
    <section ref={sectionRef} className="landing-section dark-section" id="dashboards" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <div className="section-inner">
        <div className="text-center" style={{ marginBottom: 48 }}>
          <span className="landing-label" style={{ color: 'var(--landing-orange)', marginBottom: 16, display: 'block' }}>
            Two Sides, One Platform
          </span>

          <h2 className="landing-heading dual-title" style={{ opacity: 0, maxWidth: 700, margin: '0 auto 16px' }}>
            Designed for <span style={{ color: 'var(--landing-teal)' }}>dentists</span> and{' '}
            <span style={{ color: 'var(--landing-cyan)' }}>labs</span>
          </h2>

          <p className="landing-subheading mx-auto" style={{ marginBottom: 32 }}>
            Role-aware dashboards so each side sees exactly what they need.
          </p>

          {/* Toggle */}
          <div className="dual-toggle">
            <button
              className={`dual-toggle-btn ${activeView === 'dentist' ? 'active' : ''}`}
              onClick={() => setActiveView('dentist')}
            >
              🩺 Dentist View
            </button>
            <button
              className={`dual-toggle-btn ${activeView === 'lab' ? 'active' : ''}`}
              onClick={() => setActiveView('lab')}
            >
              🔬 Lab View
            </button>
          </div>
        </div>

        <div ref={splitRef} className="dual-split" style={{ borderRadius: 20, border: '1px solid rgba(248,248,242,0.06)', overflow: 'hidden' }}>
          {/* Dentist Pane */}
          <div
            className="dual-split-pane dentist-pane"
            style={{
              opacity: activeView === 'dentist' ? 1 : 0.3,
              transition: 'opacity 0.4s ease',
              background: 'rgba(23, 107, 104, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: '1.2rem' }}>🩺</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Dentist Dashboard</span>
            </div>

            {/* Summary cards row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: '3px solid var(--landing-teal)' }}>
                <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>Clinical Prescriptions</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-geist-mono)' }}>100% Validated</div>
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, borderLeft: '3px solid var(--landing-green)' }}>
                <div style={{ fontSize: '0.6rem', opacity: 0.5 }}>Follow-up Calls</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-geist-mono)' }}>Zero Needed</div>
              </div>
            </div>

            {/* Mini case table */}
            <table className="mock-table" style={{ width: '100%' }}>
              <tbody>
                {[
                  { id: 'DC-0847', treatment: 'Zirconia HT Crown (Tooth #16)', status: 'In Milling', color: 'var(--landing-cyan)' },
                  { id: 'DC-0846', treatment: 'IPS e.max Veneers × 4 (A1)', status: 'Sintering', color: 'var(--landing-orange)' },
                  { id: 'DC-0845', treatment: 'PFM Bridge (Teeth 45-47)', status: 'Dispatched', color: 'var(--landing-green)' },
                  { id: 'DC-0844', treatment: 'Custom Ti Abutment', status: 'Approved', color: 'var(--landing-teal)' },
                ].map((row, i) => (
                  <tr key={i} className="mock-table-row">
                    <td className="mock-table-cell" style={{ fontFamily: 'var(--font-geist-mono)', opacity: 0.4, fontSize: '0.7rem' }}>{row.id}</td>
                    <td className="mock-table-cell" style={{ fontSize: '0.78rem' }}>{row.treatment}</td>
                    <td className="mock-table-cell" style={{ textAlign: 'right' }}>
                      <span className="mock-badge" style={{ background: `${row.color}22`, color: row.color }}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dual-split-divider" />

          {/* Lab Pane */}
          <div
            className="dual-split-pane lab-pane"
            style={{
              opacity: activeView === 'lab' ? 1 : 0.3,
              transition: 'opacity 0.4s ease',
              background: 'rgba(102, 217, 239, 0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: '1.2rem' }}>🔬</span>
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Laboratory Production & CAD/CAM Hub</span>
            </div>

            {/* Mini Kanban */}
            <div className="mock-kanban">
              {[
                {
                  title: 'Incoming Scans',
                  cards: [
                    { text: '3Shape Upper/Lower', color: 'var(--landing-orange)', urgency: 'READY' },
                    { text: 'Medit i700 Bite', color: 'var(--landing-pink)', urgency: 'VALIDATED' },
                  ],
                },
                {
                  title: 'CAD Design & Milling',
                  cards: [
                    { text: '5-Axis Zirconia Mill', color: 'var(--landing-cyan)', urgency: 'IN PROGRESS' },
                  ],
                },
                {
                  title: 'Sintering & Glaze',
                  cards: [
                    { text: 'Ceramill Furnace 1500°C', color: 'var(--landing-green)', urgency: 'HEATING' },
                  ],
                },
                {
                  title: 'Dispatched & Vault',
                  cards: [
                    { text: 'Soft-Copy Archiving', color: 'var(--landing-teal)', urgency: 'SECURED' },
                  ],
                },
              ].map((col, i) => (
                <div key={i} className="mock-kanban-col">
                  <div className="mock-kanban-header">{col.title}</div>
                  {col.cards.map((card, j) => (
                    <div key={j} className="mock-kanban-card" style={{ borderLeftColor: card.color }}>
                      <div style={{ marginBottom: 4 }}>{card.text}</div>
                      <span className="mock-badge" style={{ background: `${card.color}22`, color: card.color, fontSize: '0.6rem' }}>
                        {card.urgency}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Callout labels */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 36, marginTop: 32, flexWrap: 'wrap' }}>
          {[
            { text: 'Scanner-Agnostic Ingestion (Medit, 3Shape, iTero, Sirona)', icon: '📥' },
            { text: 'Asynchronous Chairside Cart & Mobile Prescription', icon: '📱' },
            { text: 'Animated Zomato-Style Production Milestones', icon: '⚡' },
            { text: 'Permanent CAD Soft-Copy Vault & Remake Assurance', icon: '🛡️' },
            { text: '1-Tap UPI Deep-Linking & Bulk Credit Wallets', icon: '💳' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', opacity: 0.75 }}>
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
