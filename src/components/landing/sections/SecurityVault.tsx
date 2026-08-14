'use client';

import { useRef, useEffect } from 'react';
import { ShieldCheck, Lock, Key, Server, FileText, CheckCircle2 } from 'lucide-react';

const trustPillars = [
  {
    icon: <Lock className="w-6 h-6" />,
    title: 'Fidelius Curve25519 & AES-256-GCM',
    desc: 'NRCeS ABDM Milestone 3 standard compliant encryption. ECDH key exchange with transient keypairs and auto-enforced data retention / erase windows.',
    color: '#66D9EF',
    badge: 'ABDM M3 Certified',
  },
  {
    icon: <Server className="w-6 h-6" />,
    title: 'SHA-256 Cryptographic Merkle Ledger',
    desc: 'Immutable append-only domain event chaining from GENESIS. Every clinical chart mutation is cryptographically sealed, guaranteeing zero silent tampering.',
    color: '#A6E22E',
    badge: 'Bi-Temporal Proofs',
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'Native HL7 FHIR R5 Bundling',
    desc: 'Transform domain events seamlessly into standardized FHIR R5 Diagnostic Document Bundles for national health exchange interoperability.',
    color: '#FD971F',
    badge: 'HL7 FHIR R5',
  },
  {
    icon: <Key className="w-6 h-6" />,
    title: 'Row-Level Isolation & Private S3/R2',
    desc: 'Multi-tenant database policies isolate dentist and lab workspaces. High-res DICOM and 3D scan meshes are stored securely on Cloudflare R2 via presigned URLs.',
    color: '#F92672',
    badge: 'Zero-Trust Architecture',
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

        // Cards stagger
        const cards = sectionRef.current?.querySelectorAll('.security-card-item');
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
                trigger: sectionRef.current,
                start: 'top 70%',
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
      id="security"
    >
      <div className="grid-bg opacity-30" />
      <div className="glow-orb glow-orb-cyan absolute bottom-10 left-1/3 w-80 h-80 opacity-15 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <ShieldCheck className="w-4 h-4" /> Military-Grade Compliance
          </div>

          <h2 className="security-title-main text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Security & <span className="gradient-text">Cryptographic Trust</span>
          </h2>

          <p className="text-base sm:text-lg text-neutral-400">
            Engineered from first principles to meet Indian ABDM, US HIPAA, and European GDPR requirements with mathematical ledger proofs and client-side encryption.
          </p>
        </div>

        {/* Security Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trustPillars.map((p, idx) => (
            <div
              key={idx}
              className="security-card-item rounded-2xl p-7 bg-neutral-900/40 border border-neutral-800 backdrop-blur-xl hover:border-neutral-700 hover:bg-neutral-900/60 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center border shadow-md"
                    style={{
                      backgroundColor: `${p.color}15`,
                      borderColor: `${p.color}40`,
                      color: p.color,
                    }}
                  >
                    {p.icon}
                  </div>

                  <span
                    className="text-xs font-mono font-semibold px-3 py-1 rounded-full border"
                    style={{
                      backgroundColor: `${p.color}10`,
                      borderColor: `${p.color}30`,
                      color: p.color,
                    }}
                  >
                    {p.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">{p.title}</h3>
                <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">{p.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800/60 flex items-center gap-2 text-xs text-neutral-400 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero-trust verified • End-to-end audit ready</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
