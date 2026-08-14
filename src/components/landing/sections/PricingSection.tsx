'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Sparkles, Zap, Shield, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PricingSectionProps {
  onRequestDemo: () => void;
}

export default function PricingSection({ onRequestDemo }: PricingSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
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
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.15,
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

  const tiers = [
    {
      name: 'Free Starter',
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
        'Standard email & community support',
      ],
      ctaText: 'Start Free Workspace',
      ctaHref: '/login',
      isCustom: false,
    },
    {
      name: 'Pro Lab Center',
      badge: 'Most Popular for Labs',
      description: 'For labs and milling centers routing dozens of cases a day — with CAD bridges, kanban production, and automated clinic alerts.',
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
        'Consumable inventory tracking (Zirconia discs, milling burs)',
        'Permanent soft-copy design archiving & 1-click remakes',
        'Bulk purchase restoration credit wallets',
        'Frictionless 1-tap UPI deep-linking & expense analytics',
        'Priority 24/7 technician support',
      ],
      ctaText: 'Launch Pro Lab Center',
      ctaHref: '/login',
      isCustom: false,
    },
    {
      name: 'Enterprise Pipeline',
      badge: 'For DSOs & Hospital Networks',
      description: 'For DSOs, hospital networks, and enterprise lab groups — dedicated infra, SSO, EMR connectors, and a solutions architect on call.',
      price: 'Custom',
      period: 'tailored annual retainer',
      highlight: false,
      icon: <Building2 className="w-5 h-5 text-purple-400" />,
      features: [
        'Dedicated Cloudflare R2 storage isolation & custom buckets',
        'Native background hardware bridge (Foot-pedal & USB camera WS)',
        'ABDM M1–M3 National Gateway & HL7 FHIR R5 EMR connectors',
        'Bi-temporal Merkle audit ledger with cryptographic proofs',
        'Tri-planar CBCT DICOM MPR viewer with IAN nerve tracing',
        'Autonomous CDT Prior-Auth & Fatigue dynamic scheduler',
        'Custom SSO (SAML / Okta) & role-based permissions',
        'Dedicated enterprise solutions architect & custom SLAs',
      ],
      ctaText: 'Contact Enterprise Sales',
      onRequest: true,
      isCustom: true,
    },
  ];

  return (
    <section ref={sectionRef} className="landing-section dark-section" id="pricing" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <div className="section-inner">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="landing-label" style={{ color: 'var(--landing-cyan)', marginBottom: 16, display: 'block' }}>
            Transparent Pricing
          </span>

          <h2 className="landing-heading" style={{ margin: '0 auto 16px' }}>
            Predictable plans for <span className="gradient-text">every scale of dentistry.</span>
          </h2>

          <p className="landing-subheading mx-auto mb-8 text-neutral-300">
            Free forever for clinics. Paid tiers where labs and networks scale.
          </p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-neutral-900/80 border border-neutral-800 backdrop-blur-md">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                billingCycle === 'annual'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Annual Billing
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 font-bold">25% OFF</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`pricing-card relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${
                tier.highlight
                  ? 'bg-gradient-to-b from-neutral-900/95 to-neutral-950/95 border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500/30'
                  : 'bg-neutral-900/50 border border-neutral-800/80 hover:border-neutral-700/90 backdrop-blur-xl shadow-lg'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-black text-xs font-extrabold uppercase tracking-wider shadow-md z-30">
                  ★ MOST POPULAR
                </div>
              )}

              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/50 shadow-inner">
                    {tier.icon}
                  </div>
                  <Badge variant="outline" className="text-xs border-neutral-700 text-neutral-300 font-medium">
                    {tier.badge}
                  </Badge>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed mb-6">{tier.description}</p>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-neutral-800/80">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-mono">
                      {tier.price}
                    </span>
                    {!tier.isCustom && <span className="text-xs text-neutral-400">/ mo</span>}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">{tier.period}</div>
                  {tier.savings && (
                    <div className="text-xs text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      {tier.savings}
                    </div>
                  )}
                </div>

                {/* Feature List */}
                <div className="space-y-3 mb-8">
                  <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Included Features:
                  </div>
                  {tier.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                      <div className="mt-0.5 w-4 h-4 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/20">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className="leading-tight">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {tier.onRequest ? (
                  <Button
                    onClick={onRequestDemo}
                    className="w-full h-12 rounded-xl text-sm font-bold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-all hover:shadow-lg"
                  >
                    {tier.ctaText}
                  </Button>
                ) : (
                  <Link href={tier.ctaHref || '/login'} className="block w-full">
                    <Button
                      className={`w-full h-12 rounded-xl text-sm font-bold transition-all ${
                        tier.highlight
                          ? 'bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                          : 'bg-white hover:bg-neutral-200 text-black shadow-sm'
                      }`}
                    >
                      {tier.ctaText}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Value Reassurance */}
        <div className="mt-16 text-center text-xs text-neutral-500 max-w-xl mx-auto flex items-center justify-center gap-6 flex-wrap">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            No credit card required for clinic accounts
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Instant automated setup in &lt; 3 minutes
          </span>
        </div>
      </div>
    </section>
  );
}
