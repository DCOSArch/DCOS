'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, Zap, Shield, Building2, Code2, Database, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PricingSectionProps {
  onRequestDemo: () => void;
}

interface PricingTier {
  name: string;
  badge: string;
  description: string;
  price: string;
  period: string;
  highlight: boolean;
  icon: React.ReactNode;
  features: string[];
  ctaText: string;
  ctaHref?: string;
  onRequest?: boolean;
  isCustom?: boolean;
  savings?: string;
}

export default function PricingSection({ onRequestDemo }: PricingSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [modelType, setModelType] = useState<'perpetual' | 'cloud'>('perpetual');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  useEffect(() => {
    const animate = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        const cards = sectionRef.current?.querySelectorAll('.pricing-card');
        if (cards) {
          gsap.fromTo(
            cards,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.7,
              stagger: 0.12,
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
      }
    };

    animate();
  }, []);

  const perpetualTiers: PricingTier[] = [
    {
      name: 'Starter License',
      badge: 'Independent Labs (5–15 staff)',
      description: 'Own your complete lab portal. Full Next.js & Supabase source code deployed to your own AWS/Cloudflare account.',
      price: '$6,000',
      period: 'one-time perpetual buyout',
      highlight: false,
      icon: <Code2 className="w-5 h-5 text-teal-400" />,
      features: [
        'Full source-code repository (Next.js 16 + React 19 + Supabase)',
        'Deploy on your own infrastructure (Zero per-case cloud tax)',
        'Unlimited clinic connections & intraoral scan intake',
        '3D STL/PLY WebGL interactive CAD viewer with spatial pins',
        'Real-time production Kanban with automated inventory deduction',
        'Standard deployment manual & environment setup guide',
        '10 hours dedicated engineering deployment assistance',
      ],
      ctaText: 'Book Buyout Walkthrough',
      onRequest: true,
      isCustom: false,
    },
    {
      name: 'Standard License',
      badge: '★ Most Popular for Commercial Labs',
      description: 'The complete turnkey package. White-labeled under your brand with custom CAD integration and 20 hours hands-on setup.',
      price: '$12,000',
      period: 'one-time perpetual buyout',
      savings: 'Zero monthly fees — ROI in <6 months',
      highlight: true,
      icon: <Rocket className="w-5 h-5 text-cyan-400" />,
      features: [
        'Complete source code + white-label rebranding assets',
        'Exocad & 3Shape .constructionInfo CAD bridge integration',
        'Direct Cloudflare R2 scanner watcher & streaming intake',
        'Multi-stage QC certification with digital holographic stamps',
        'Doctor prepaid credit wallets & automated UPI checkout flows',
        'Full bi-temporal Merkle audit ledger & compliance logs',
        '20 hours hands-on white-glove cloud onboarding & DNS setup',
        '12 months security patch upgrades included',
      ],
      ctaText: 'Claim Standard License',
      onRequest: true,
      isCustom: false,
    },
    {
      name: 'Enterprise Rollup',
      badge: 'For DSOs & Lab Consolidators',
      description: 'Multi-tenant architecture designed for dental private equity rollups, multi-location lab networks, and hospital chains.',
      price: '$25,000',
      period: 'one-time multi-lab license',
      highlight: false,
      icon: <Building2 className="w-5 h-5 text-purple-400" />,
      features: [
        'Multi-tenant DSO architecture with centralized analytics cockpit',
        'Custom EMR / EHR & ABDM M1–M3 National Gateway connectors',
        'Tri-planar CBCT DICOM MPR viewer with IAN nerve tracing',
        'Autonomous CDT prior-authorization & dynamic queue reshaper',
        'Dedicated solutions architect & custom CAD pipeline plugins',
        'Custom SSO (SAML 2.0 / Okta / Azure AD)',
        'Lifetime perpetual multi-entity deployment rights',
      ],
      ctaText: 'Schedule Executive Review',
      onRequest: true,
      isCustom: true,
    },
  ];

  const cloudTiers: PricingTier[] = [
    {
      name: 'Free Clinic Starter',
      badge: 'For Dentists & Clinics',
      description: 'For dentists who want scans, prescriptions, and lab status in one place — with nothing to pay, ever.',
      price: '$0',
      period: 'forever free',
      highlight: false,
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      features: [
        'Up to 20 active digital cases / month',
        'Scanner-agnostic ingestion (Medit, 3Shape, iTero, Sirona)',
        'Progressive WebGL 3D scan viewer (STL / PLY / OBJ)',
        '32-tooth odontogram & 6-point perio charting',
        'Chairside QR smartphone capture bridge',
        'Controlled case messaging & live status timeline',
      ],
      ctaText: 'Start Free Workspace',
      ctaHref: '/login',
      isCustom: false,
    },
    {
      name: 'Pro Lab Center',
      badge: 'Cloud Managed for Labs',
      description: 'Hosted on DCOS ultra-fast edge infrastructure with automated backups, monitoring, and zero dev maintenance.',
      price: billingCycle === 'annual' ? '$149' : '$199',
      period: 'per month, billed ' + (billingCycle === 'annual' ? 'annually' : 'monthly'),
      savings: billingCycle === 'annual' ? 'Save 25% with annual billing' : undefined,
      highlight: true,
      icon: <Zap className="w-5 h-5 text-emerald-400" />,
      features: [
        'Unlimited active cases & scan routing',
        'Exocad & 3Shape .constructionInfo CAD bridge',
        'Real-time Kanban staging (Milling, Sintering, QC, Dispatch)',
        'Automated WhatsApp & push notification alerts',
        'Consumable inventory tracking (Zirconia discs, burs)',
        'Permanent soft-copy design archiving & 1-click remakes',
      ],
      ctaText: 'Launch Cloud Lab',
      ctaHref: '/login',
      isCustom: false,
    },
    {
      name: 'Enterprise Cloud',
      badge: 'Dedicated Network Node',
      description: 'Dedicated isolated infrastructure, custom SSO, EMR connectors, and a solutions architect on call.',
      price: 'Custom',
      period: 'tailored annual retainer',
      highlight: false,
      icon: <Building2 className="w-5 h-5 text-purple-400" />,
      features: [
        'Dedicated Cloudflare R2 storage isolation & custom buckets',
        'ABDM M1–M3 National Gateway & HL7 FHIR R5 connectors',
        'Bi-temporal Merkle audit ledger with cryptographic proofs',
        'Custom SSO (SAML / Okta) & role-based permissions',
        '24/7 dedicated engineering support & 99.99% uptime SLA',
      ],
      ctaText: 'Contact Enterprise Sales',
      onRequest: true,
      isCustom: true,
    },
  ];

  const activeTiers = modelType === 'perpetual' ? perpetualTiers : cloudTiers;

  return (
    <section ref={sectionRef} className="landing-section dark-section" id="pricing" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <div className="section-inner">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="landing-label" style={{ color: 'var(--landing-cyan)', marginBottom: 16, display: 'block' }}>
            Ownership vs SaaS
          </span>

          <h2 className="landing-heading" style={{ margin: '0 auto 16px' }}>
            Own the portal. <span className="gradient-text">Stop paying monthly rents.</span>
          </h2>

          <p className="landing-subheading mx-auto mb-8 text-neutral-300">
            Buy the full source code once and deploy on your own infrastructure, or choose fully-managed cloud hosting.
          </p>

          {/* Model Switcher */}
          <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 backdrop-blur-xl mb-4">
            <button
              onClick={() => setModelType('perpetual')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                modelType === 'perpetual'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-black shadow-md shadow-cyan-500/25'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Source Code Buyout (Perpetual)
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/20 font-extrabold">NEW</span>
            </button>
            <button
              onClick={() => setModelType('cloud')}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                modelType === 'cloud'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              Cloud Hosted SaaS
            </button>
          </div>

          {modelType === 'cloud' && (
            <div className="flex items-center justify-center gap-3 mt-4 text-xs">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 rounded-full ${billingCycle === 'monthly' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1 rounded-full flex items-center gap-1 ${billingCycle === 'annual' ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300' : 'text-neutral-400'}`}
              >
                Annual (25% off)
              </button>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {activeTiers.map((tier, idx) => (
            <div
              key={idx}
              className={`pricing-card relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${
                tier.highlight
                  ? 'bg-gradient-to-b from-neutral-900/95 to-neutral-950/95 border-2 border-cyan-500/60 shadow-[0_0_50px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/30'
                  : 'bg-neutral-900/50 border border-neutral-800/80 hover:border-neutral-700/90 backdrop-blur-xl shadow-lg'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 text-black text-[11px] font-extrabold uppercase tracking-wider shadow-md z-30">
                  {tier.badge.includes('★') ? tier.badge : '★ RECOMMENDED'}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    {tier.name}
                  </span>
                  <div className="p-2 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                    {tier.icon}
                  </div>
                </div>

                <p className="text-xs text-neutral-400 mb-6 leading-relaxed min-h-[36px]">
                  {tier.description}
                </p>

                <div className="mb-6 pb-6 border-b border-neutral-800/80">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                      {tier.price}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">
                      /{tier.period}
                    </span>
                  </div>
                  {tier.savings && (
                    <span className="inline-block mt-2 text-xs font-semibold text-emerald-400">
                      {tier.savings}
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Deliverables & Capabilities:
                  </span>
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                      <Check className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                {tier.onRequest ? (
                  <button
                    onClick={onRequestDemo}
                    className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
                      tier.highlight
                        ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-black hover:opacity-90 shadow-lg shadow-cyan-500/25'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                    }`}
                  >
                    {tier.ctaText}
                  </button>
                ) : (
                  <Link
                    href={tier.ctaHref || '/login'}
                    className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-center block transition-all duration-300 ${
                      tier.highlight
                        ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-black hover:opacity-90 shadow-lg shadow-cyan-500/25'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                    }`}
                  >
                    {tier.ctaText}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
