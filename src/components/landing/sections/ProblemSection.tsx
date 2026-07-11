'use client';

import { useRef, useEffect } from 'react';

const chaosItems = [
  { text: '📱 "Dr. can you send the scan again?"', className: 'chaos-whatsapp', x: '5%', y: '10%', rotate: -8 },
  { text: '📧 Re: Re: Re: Crown Case #47', className: 'chaos-email', x: '55%', y: '5%', rotate: 5 },
  { text: '📊 A3 | B1 | C2 | ...', className: 'chaos-spreadsheet', x: '70%', y: '55%', rotate: -3 },
  { text: '📦 Physical impressions shipped', className: 'chaos-impression', x: '10%', y: '60%', rotate: 7 },
  { text: '"Where\'s my crown?!"', className: 'chaos-question', x: '40%', y: '35%', rotate: -5 },
  { text: '📱 "Check WhatsApp for shade"', className: 'chaos-whatsapp', x: '60%', y: '75%', rotate: 10 },
  { text: '📧 FW: Urgent - Case delayed', className: 'chaos-email', x: '25%', y: '80%', rotate: -12 },
  { text: '❓ "Did the lab get my file?"', className: 'chaos-question', x: '75%', y: '30%', rotate: 4 },
  { text: '📊 Inventory ?? | Qty ??', className: 'chaos-spreadsheet', x: '15%', y: '40%', rotate: -6 },
  { text: '📱 "Call me about case 23"', className: 'chaos-whatsapp', x: '45%', y: '65%', rotate: 8 },
];

export default function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const chaosRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animate = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        const items = chaosRef.current?.querySelectorAll('.chaos-item');
        if (!items) return;

        // Stagger chaos items in
        gsap.fromTo(
          items,
          {
            opacity: 0,
            scale: 0.5,
            y: () => 60 + Math.random() * 40,
          },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'back.out(1.5)',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 60%',
              toggleActions: 'play none none reverse',
            },
          }
        );

        // Float animation loop for chaos items
        items.forEach((item, i) => {
          gsap.to(item, {
            y: `+=${8 + Math.random() * 12}`,
            x: `+=${-5 + Math.random() * 10}`,
            rotation: `+=${-3 + Math.random() * 6}`,
            duration: 2 + Math.random() * 2,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: i * 0.15,
          });
        });

        // Counter animation
        const counterEl = counterRef.current;
        if (counterEl) {
          const counter = { val: 0 };
          gsap.to(counter, {
            val: 73,
            duration: 2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: counterEl,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
            onUpdate: () => {
              counterEl.textContent = `${Math.round(counter.val)}%`;
            },
          });
        }

        // Title animation
        const title = sectionRef.current?.querySelector('.problem-title');
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
                start: 'top 70%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }
      } catch {
        // fallback
        const items = chaosRef.current?.querySelectorAll('.chaos-item');
        items?.forEach((el) => {
          (el as HTMLElement).style.opacity = '1';
        });
      }
    };

    animate();
  }, []);

  return (
    <section ref={sectionRef} className="landing-section dark-section" id="problem">
      <div className="grid-bg" />

      <div className="section-inner text-center">
        <span className="landing-label" style={{ color: 'var(--landing-pink)', marginBottom: 16, display: 'block' }}>
          The Problem
        </span>

        <h2 className="landing-heading problem-title" style={{ opacity: 0, maxWidth: 700, margin: '0 auto 16px' }}>
          This is how dental workflows look{' '}
          <span style={{ color: 'var(--landing-pink)' }}>today</span>
        </h2>

        <p className="landing-subheading mx-auto" style={{ marginBottom: 40 }}>
          Fragmented tools, lost files, no visibility. Dentists and labs stuck in an
          endless loop of calls, texts, and spreadsheets.
        </p>

        {/* Chaos visualization */}
        <div ref={chaosRef} className="chaos-container">
          {chaosItems.map((item, i) => (
            <div
              key={i}
              className={`chaos-item ${item.className}`}
              style={{
                left: item.x,
                top: item.y,
                transform: `rotate(${item.rotate}deg)`,
              }}
            >
              {item.text}
            </div>
          ))}
        </div>

        {/* Fragmentation score */}
        <div ref={counterRef} className="frag-counter">0%</div>
        <div className="frag-counter-label">of dental lab communication is still unstructured</div>
      </div>
    </section>
  );
}
