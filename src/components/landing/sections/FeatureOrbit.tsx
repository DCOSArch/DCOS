'use client';

import { useRef, useEffect, useState } from 'react';
import { Stethoscope } from 'lucide-react';

const features = [
  {
    icon: '🦷',
    title: 'FDI Tooth Charting (Digital Rx)',
    desc: 'Clinical-first guided prescription builder capturing tooth positions, materials, shades, and custom zone characteristics with zero omissions.',
    color: '#66D9EF',
  },
  {
    icon: '📂',
    title: 'Scanner Folder Watcher',
    desc: 'Auto-detects new STL/PLY scanner folder exports in real-time via the browser File System Access API. Zero upload clicks.',
    color: '#A6E22E',
  },
  {
    icon: '🔬',
    title: 'Spatial 3D Annotations',
    desc: 'Drop pin notes directly on exact 3D coordinates and surface face normals of uploaded STL models to visually resolve queries.',
    color: '#F92672',
  },
  {
    icon: '💬',
    title: 'Dual-Layer Timeline',
    desc: 'Segregates internal dental lab technician workflow states (e.g. milling, sintering) from dentist-visible delivery milestones.',
    color: '#FD971F',
  },
  {
    icon: '📊',
    title: 'Automated Inventory Sync',
    desc: 'Triggers instant material deductions from clinic pre-purchased inventory allocations when laboratory starts case production.',
    color: '#AE81FF',
  },
  {
    icon: '👁️',
    title: 'B2B2C Smile Preview Link',
    desc: 'Share secure, GPDP-compliant patient-facing 3D links of crown & bridge designs with zero clinical PHI or patient identity exposure.',
    color: '#E6DB74',
  },
];

export default function FeatureOrbit() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const animate = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        // Title entrance
        const title = sectionRef.current?.querySelector('.orbit-title');
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

        // Orbit nodes entrance
        const nodes = orbitRef.current?.querySelectorAll('.orbit-node');
        if (nodes) {
          gsap.fromTo(
            nodes,
            { opacity: 0, scale: 0.6 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.6,
              stagger: 0.12,
              ease: 'back.out(1.5)',
              scrollTrigger: {
                trigger: orbitRef.current,
                start: 'top 70%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }

        // Center pulse
        const center = orbitRef.current?.querySelector('.orbit-center');
        if (center) {
          gsap.fromTo(
            center,
            { opacity: 0, scale: 0 },
            {
              opacity: 1,
              scale: 1,
              duration: 0.8,
              ease: 'elastic.out(1, 0.5)',
              scrollTrigger: {
                trigger: orbitRef.current,
                start: 'top 70%',
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

  // Calculate orbit positions (adjusted for 220px card width and auto height)
  const getNodePosition = (index: number, total: number, radius: number) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    return {
      left: `calc(50% + ${Math.cos(angle) * radius}px - 110px)`,
      top: `calc(50% + ${Math.sin(angle) * radius}px - 60px)`,
    };
  };

  const orbitRadius = 260;

  return (
    <section ref={sectionRef} className="landing-section dark-section" id="features" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <div className="grid-bg" />

      <div className="glow-orb glow-orb-cyan" style={{ width: 400, height: 400, top: '30%', right: '-5%', opacity: 0.15 }} />
      <div className="glow-orb glow-orb-pink" style={{ width: 300, height: 300, bottom: '10%', left: '10%', opacity: 0.1 }} />

      <div className="section-inner text-center">
        <span className="landing-label" style={{ color: 'var(--landing-cyan)', marginBottom: 16, display: 'block' }}>
          Exact Capabilities
        </span>

        <h2 className="landing-heading orbit-title" style={{ opacity: 0, maxWidth: 650, margin: '0 auto 16px' }}>
          What DCOS{' '}
          <span className="gradient-text">Does EXACTLY</span>
        </h2>

        <p className="landing-subheading mx-auto" style={{ marginBottom: 60 }}>
          Six custom B2B workflows engineering a seamless handoff from the scanner to the bench.
        </p>

        <div ref={orbitRef} className="orbit-container">
          {/* Orbit rings */}
          {!isMobile && (
            <>
              <div className="orbit-ring" style={{ width: orbitRadius * 2 + 40, height: orbitRadius * 2 + 40 }} />
              <div className="orbit-ring" style={{ width: orbitRadius * 2 + 120, height: orbitRadius * 2 + 120, opacity: 0.5 }} />
            </>
          )}

          {/* Center */}
          {!isMobile && (
            <div className="orbit-center">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
          )}

          {/* Feature nodes */}
          {features.map((feature, i) => (
            <div
              key={i}
              className="orbit-node"
              style={!isMobile ? getNodePosition(i, features.length, orbitRadius) : undefined}
              onMouseEnter={() => setActiveIdx(i)}
              onMouseLeave={() => setActiveIdx(null)}
            >
              <div className={`orbit-node-content ${activeIdx === i ? 'neo-card-dark' : 'glass-card'}`}>
                <div
                  className="orbit-node-icon"
                  style={{
                    background: `${feature.color}15`,
                    borderColor: `${feature.color}30`,
                  }}
                >
                  {feature.icon}
                </div>
                <div className="orbit-node-title">{feature.title}</div>
                <div className="orbit-node-desc">{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
