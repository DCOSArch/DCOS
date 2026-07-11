'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

/* ---- Animation sequence data ---- */
const kanbanSteps = [
  { card: 'Zirconia Crown — Dr. Mehta', from: 0, to: 1 },
];

const chatMessages = [
  { type: 'received' as const, text: 'Case moved to In Production ⚡', delay: 1500 },
  { type: 'received' as const, text: 'Started milling your crown, Dr. Mehta. ETA 2 days.', delay: 3000 },
  { type: 'sent' as const, text: 'Great, thanks! Please double-check the distal margin.', delay: 5000 },
];

const timelineEvents = [
  { text: 'Lab moved case to In Production', time: '10:42 AM', delay: 1200 },
  { text: 'Material deducted: Zirconia Block (1 unit)', time: '10:42 AM', delay: 2000 },
];

export default function RealtimeDemo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [kanbanState, setKanbanState] = useState([
    ['Zirconia Crown — Dr. Mehta', 'Full Arch — Dr. Patel'],
    ['PFM Bridge — Dr. Singh'],
    ['E.max Veneer — Dr. Kumar'],
    [],
  ]);
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [visibleEvents, setVisibleEvents] = useState<number[]>([]);
  const [inventoryCount, setInventoryCount] = useState(24);
  const [inventoryFlash, setInventoryFlash] = useState(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const resetAnimation = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
    setKanbanState([
      ['Zirconia Crown — Dr. Mehta', 'Full Arch — Dr. Patel'],
      ['PFM Bridge — Dr. Singh'],
      ['E.max Veneer — Dr. Kumar'],
      [],
    ]);
    setVisibleMessages([]);
    setVisibleEvents([]);
    setInventoryCount(24);
    setInventoryFlash(false);
  }, []);

  const playAnimation = useCallback(() => {
    resetAnimation();
    setIsPlaying(true);

    // Step 1: Move kanban card (800ms)
    const t1 = setTimeout(() => {
      setKanbanState([
        ['Full Arch — Dr. Patel'],
        ['Zirconia Crown — Dr. Mehta', 'PFM Bridge — Dr. Singh'],
        ['E.max Veneer — Dr. Kumar'],
        [],
      ]);
    }, 800);
    timeoutRefs.current.push(t1);

    // Step 2: Inventory deduction (1200ms)
    const t2 = setTimeout(() => {
      setInventoryCount(23);
      setInventoryFlash(true);
      setTimeout(() => setInventoryFlash(false), 600);
    }, 1200);
    timeoutRefs.current.push(t2);

    // Step 3: Timeline events
    timelineEvents.forEach((evt, i) => {
      const t = setTimeout(() => {
        setVisibleEvents((prev) => [...prev, i]);
      }, evt.delay);
      timeoutRefs.current.push(t);
    });

    // Step 4: Chat messages
    chatMessages.forEach((msg, i) => {
      const t = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, i]);
      }, msg.delay);
      timeoutRefs.current.push(t);
    });

    // Reset after full cycle
    const tReset = setTimeout(() => {
      setIsPlaying(false);
    }, 7000);
    timeoutRefs.current.push(tReset);
  }, [resetAnimation]);

  useEffect(() => {
    const animate = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        // Title
        const title = sectionRef.current?.querySelector('.realtime-title');
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

        // Auto-play on scroll
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 40%',
          onEnter: () => playAnimation(),
          onLeaveBack: () => resetAnimation(),
        });
      } catch {
        // auto-play fallback
        playAnimation();
      }
    };

    animate();

    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, [playAnimation, resetAnimation]);

  const columnNames = ['Incoming', 'In Production', 'QC', 'Dispatched'];
  const columnColors = ['var(--landing-orange)', 'var(--landing-cyan)', 'var(--landing-green)', 'var(--landing-teal)'];

  return (
    <section ref={sectionRef} className="landing-section dark-section" id="realtime" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <div className="grid-bg" />

      <div className="glow-orb glow-orb-cyan" style={{ width: 350, height: 350, bottom: '5%', right: '10%', opacity: 0.12 }} />

      <div className="section-inner">
        <div className="text-center" style={{ marginBottom: 48 }}>
          <span className="landing-label" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className="live-dot" />
            <span style={{ color: '#FF4444' }}>Live Demo</span>
          </span>

          <h2 className="landing-heading realtime-title" style={{ opacity: 0, maxWidth: 700, margin: '0 auto 16px' }}>
            Everything syncs in{' '}
            <span className="gradient-text">real-time</span>
          </h2>

          <p className="landing-subheading mx-auto" style={{ marginBottom: 16 }}>
            Watch how a single Kanban drag triggers inventory updates, timeline events, and chat notifications — simultaneously.
          </p>

          <button
            className="landing-btn landing-btn-outline"
            onClick={() => { resetAnimation(); setTimeout(playAnimation, 100); }}
            style={{ margin: '0 auto', fontSize: '0.85rem', padding: '10px 24px' }}
            disabled={isPlaying}
          >
            {isPlaying ? '▶ Playing...' : '↻ Replay Animation'}
          </button>
        </div>

        <div className="realtime-container">
          {/* Kanban Board */}
          <div className="realtime-kanban">
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📋</span> Production Pipeline
            </div>

            <div className="mock-kanban">
              {kanbanState.map((col, i) => (
                <div key={i} className="mock-kanban-col">
                  <div className="mock-kanban-header" style={{ color: columnColors[i] }}>
                    {columnNames[i]} ({col.length})
                  </div>
                  {col.map((card, j) => (
                    <div
                      key={card}
                      className="mock-kanban-card"
                      style={{
                        borderLeftColor: columnColors[i],
                        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    >
                      {card.split(' — ')[0]}
                      <div style={{ fontSize: '0.65rem', opacity: 0.5, marginTop: 2 }}>
                        {card.split(' — ')[1]}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Inventory indicator */}
            <div
              style={{
                marginTop: 16,
                padding: '12px 16px',
                background: inventoryFlash ? 'rgba(166,226,46,0.12)' : 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.4s ease',
                border: inventoryFlash ? '1px solid rgba(166,226,46,0.3)' : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Zirconia Block Inventory</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-geist-mono)' }}>
                  {inventoryCount} units
                </div>
              </div>
              {inventoryFlash && (
                <span style={{ fontSize: '0.75rem', color: 'var(--landing-green)', fontWeight: 600 }}>
                  -1 unit ✓
                </span>
              )}
            </div>

            {/* Timeline events */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: 0.4, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Timeline
              </div>
              {timelineEvents.map((evt, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 12px',
                    background: visibleEvents.includes(i) ? 'rgba(255,255,255,0.04)' : 'transparent',
                    borderRadius: 8,
                    fontSize: '0.78rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    opacity: visibleEvents.includes(i) ? 1 : 0,
                    transform: visibleEvents.includes(i) ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    marginBottom: 4,
                  }}
                >
                  <span>{evt.text}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.4, fontFamily: 'var(--font-geist-mono)' }}>{evt.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Panel */}
          <div className="realtime-chat">
            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💬</span> Order Chat — DC-0847
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
              {/* Existing message */}
              <div className="chat-bubble received visible" style={{ marginBottom: 10 }}>
                Case received. We&apos;ll start processing shortly.
                <div style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: 4 }}>
                  Advance Lab · 09:15
                </div>
              </div>

              {/* Animated messages */}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-bubble ${msg.type} ${visibleMessages.includes(i) ? 'visible' : ''}`}
                  style={{ marginBottom: 10 }}
                >
                  {msg.text}
                  <div style={{ fontSize: '0.6rem', opacity: 0.4, marginTop: 4 }}>
                    {msg.type === 'sent' ? 'Dr. Mehta' : 'Advance Lab'} · 10:42
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
