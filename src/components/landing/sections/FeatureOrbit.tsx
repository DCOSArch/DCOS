'use client';

import { useRef, useEffect, useState } from 'react';
import {
  Mic,
  Activity,
  Layers,
  ShieldCheck,
  Cpu,
  Scan,
  Database,
  Sparkles,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: <Mic className="w-5 h-5" />,
    badge: 'Ambient Voice AI',
    title: 'Zero-Hallucination Operatory Voice',
    desc: 'Client-side VAD and Grammar-Constrained Decoding maps chairside voice directly to ISO 3950 tooth numbers, 6-point perio probing, and SNOMED-CT findings without generic LLM latency.',
    color: '#66D9EF',
    stats: '< 40ms local decoding',
  },
  {
    icon: <Database className="w-5 h-5" />,
    badge: 'Bi-Temporal Core',
    title: 'SHA-256 Merkle Ledger & Time-Travel',
    desc: 'Dual-timeline architecture cleanly separates real-world clinical observation time from immutable system transaction time. Reconstruct any historical chart state with cryptographic tamper-proofing.',
    color: '#A6E22E',
    stats: '100% audit-sealed',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    badge: 'National Compliance',
    title: 'ABDM M1–M3 & HL7 FHIR R5 Native',
    desc: 'ABHA ID verification, Dynamic Care Context linking, and NRCeS-compliant Fidelius Curve25519 ECDH + AES-GCM-256 encryption with active consent window guardrails.',
    color: '#FD971F',
    stats: 'M1–M3 Verified',
  },
  {
    icon: <Layers className="w-5 h-5" />,
    badge: 'WebGL 3D Engine',
    title: 'Progressive LOD & Occlusal Heatmaps',
    desc: 'Quadric Error Metric decimation streams 50MB+ color scans with instant 5% coarse proxy meshes. Real-time GLSL clearance shaders highlight prep gaps and subgingival margin splines.',
    color: '#F92672',
    stats: '60 FPS • <80ms load',
  },
  {
    icon: <Scan className="w-5 h-5" />,
    badge: 'Maxillofacial MPR',
    title: 'Cornerstone Tri-Planar CBCT Viewer',
    desc: 'Multi-Planar Reconstruction (Axial, Coronal, Sagittal) with synchronized crosshair navigation, Hounsfield Unit bone/soft presets, and Inferior Alveolar Nerve canal tracing.',
    color: '#AE81FF',
    stats: '16-bit Grayscale',
  },
  {
    icon: <Cpu className="w-5 h-5" />,
    badge: 'Autonomous Loops',
    title: 'CDT Prior-Auth & Fatigue Queue Reshaper',
    desc: 'Autonomous claims scrubber evaluates CDT clinical necessity rules in real time. Probabilistic scheduling models provider cognitive fatigue to auto-rebalance clinic queues.',
    color: '#E6DB74',
    stats: 'Real-time settlement',
  },
];

export default function FeatureOrbit() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number>(0);
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

        // Cards entrance
        const cards = orbitRef.current?.querySelectorAll('.orbit-bento-card');
        if (cards) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: orbitRef.current,
                start: 'top 75%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }
      } catch {
        // Fallback
      }
    };

    animate();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="landing-section dark-section relative overflow-hidden py-24 px-4 sm:px-6 lg:px-8"
      id="features"
    >
      <div className="grid-bg opacity-30" />
      <div
        className="glow-orb glow-orb-cyan absolute -top-20 right-1/4 w-96 h-96 opacity-15 pointer-events-none"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Architecture
          </span>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Engineered for <span className="gradient-text">Precision & Autonomy</span>
          </h2>

          <p className="text-base sm:text-lg text-neutral-400">
            DCOS 2.0 unites bi-temporal ledger integrity, hands-free ambient voice decoding, progressive 3D medical imaging, and autonomous administrative workflows in one unified operating system.
          </p>
        </div>

        {/* Bento Grid Features */}
        <div ref={orbitRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => {
            const isActive = activeIdx === idx;
            return (
              <div
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`orbit-bento-card relative rounded-2xl p-6 transition-all duration-300 cursor-pointer border ${
                  isActive
                    ? 'bg-neutral-900/90 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.15)] -translate-y-1'
                    : 'bg-neutral-900/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/60'
                } backdrop-blur-xl flex flex-col justify-between`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-md transition-transform duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: `${feat.color}15`,
                        borderColor: `${feat.color}40`,
                        color: feat.color,
                      }}
                    >
                      {feat.icon}
                    </div>

                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-neutral-800/80 text-neutral-300 border border-neutral-700">
                      {feat.stats}
                    </span>
                  </div>

                  <span
                    className="text-[11px] font-bold uppercase tracking-wider block mb-1"
                    style={{ color: feat.color }}
                  >
                    {feat.badge}
                  </span>

                  <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>

                  <p className="text-xs text-neutral-400 leading-relaxed">{feat.desc}</p>
                </div>

                {/* Bottom Active Indicator */}
                <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500 font-mono">DCOS 2.0 Subsystem</span>
                  <div className="flex items-center gap-1.5 font-semibold text-cyan-400">
                    <Zap className="w-3 h-3" /> Live Engine
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
