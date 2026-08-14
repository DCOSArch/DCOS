'use client';

import { useRef, useState, useEffect } from 'react';
import {
  FileText,
  Scan,
  Activity,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AntigravityCard } from '@/components/ui/AntigravityCard';

export default function SolutionReveal() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: '01',
      title: 'Build the Prescription',
      badge: 'Parametric Clinical Rx',
      desc: 'Select treatment, FDI tooth numbers, restorative material (Zirconia HT, IPS e.max, BruxZir), and calibrated VITA Classical/3D Master shade with zero missing fields.',
      icon: <FileText className="w-5 h-5 text-teal-400" />,
      tag: 'Zero-Omission Validation',
      accentColor: '#2dd4bf',
    },
    {
      num: '02',
      title: 'Send the Complete Case',
      badge: 'Scanner-Agnostic Ingestion',
      desc: 'Direct ingestion from Medit, 3Shape, iTero, and Sirona (STL/PLY/OBJ). Instant client-side manifold mesh verification and sub-millimeter occlusal clearance analysis.',
      icon: <Scan className="w-5 h-5 text-cyan-400" />,
      tag: 'Automatic Mesh Inspection',
      accentColor: '#38bdf8',
    },
    {
      num: '03',
      title: 'Follow Every Handoff',
      badge: 'Live Production Telemetry',
      desc: 'Real-time production milestones from lab intake to 5-axis CAM milling, sintering furnace, glaze inspection, and dispatch with in-context case messaging.',
      icon: <Activity className="w-5 h-5 text-emerald-400" />,
      tag: 'Real-Time Milestones',
      accentColor: '#34d399',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="landing-section dark-section"
      id="solution"
      style={{ paddingTop: 100, paddingBottom: 100 }}
    >
      {/* Background Ambience */}
      <div className="glow-orb glow-orb-teal" style={{ width: 500, height: 500, top: '10%', left: '15%', opacity: 0.15 }} />
      <div className="grid-bg opacity-30" />

      <div className="section-inner">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-medium tracking-wide mb-4">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            From Scan to Fit
          </div>

          <h2 className="landing-heading text-white" style={{ margin: '0 auto 16px' }}>
            A calmer handoff for <span className="gradient-text">every restoration.</span>
          </h2>

          <p className="landing-subheading mx-auto text-neutral-300">
            DentalConnect establishes a deterministic 3-stage protocol between clinic operatory and laboratory production.
          </p>
        </div>

        {/* 3-Step Antigravity Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16 items-stretch">
          {steps.map((step, idx) => {
            const isSelected = activeStep === idx;
            return (
              <AntigravityCard
                key={idx}
                maxTilt={6}
                glareOpacity={isSelected ? 0.2 : 0.1}
                onClick={() => setActiveStep(idx)}
                className={`p-8 rounded-3xl cursor-pointer transition-all duration-300 border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-neutral-900/90 border-teal-500/50 shadow-[0_0_40px_rgba(20,184,166,0.15)] ring-1 ring-teal-500/30'
                    : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700/90 backdrop-blur-xl'
                }`}
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-extrabold font-mono text-neutral-500">
                      {step.num}
                    </span>
                    <div className="p-3 rounded-2xl bg-neutral-800/80 border border-neutral-700/50 shadow-inner">
                      {step.icon}
                    </div>
                  </div>

                  <span className="text-xs font-bold uppercase tracking-wider text-teal-400 block mb-2">
                    {step.badge}
                  </span>

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>

                  <p className="text-xs text-neutral-400 leading-relaxed mb-6">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                  <span className="text-neutral-400 font-medium">{step.tag}</span>
                  <div className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </AntigravityCard>
            );
          })}
        </div>

        {/* Live Interactive Protocol Simulator Console */}
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-neutral-950/90 border border-neutral-800/80 backdrop-blur-2xl p-6 lg:p-8 shadow-2xl overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-6 border-b border-neutral-800/80">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-neutral-700" />
                  <div className="w-3 h-3 rounded-full bg-neutral-700" />
                  <div className="w-3 h-3 rounded-full bg-neutral-700" />
                </div>
                <span className="text-xs font-mono text-neutral-400 ml-2">
                  case_protocol://DC-2026-8492
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DCOS Live Handoff Active
              </div>
            </div>

            {/* Case Anatomy Preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Box 1: Prescription Details */}
              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-3">
                  01 • Parametric Rx
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-300">
                    <span>Tooth Assignment:</span>
                    <span className="font-bold text-white font-mono">FDI #46 (Lower R 1st Molar)</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Material:</span>
                    <span className="font-semibold text-teal-300">Zirconia HT Multi-Layer</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Shade / Margin:</span>
                    <span className="font-semibold text-white">VITA 3D 2M2 • Deep Chamfer</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Scan Verification */}
              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-3">
                  02 • Mesh Telemetry
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-300">
                    <span>Scan Ingestion:</span>
                    <span className="font-bold text-cyan-400 font-mono">Medit i700 (PLY Color)</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Watertight Mesh:</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 100% Manifold
                    </span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Occlusal Clearance:</span>
                    <span className="font-semibold text-white font-mono">1.85mm (Optimal)</span>
                  </div>
                </div>
              </div>

              {/* Box 3: Production Pipeline */}
              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
                <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-3">
                  03 • Live Production
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-300">
                    <span>Current Stage:</span>
                    <span className="font-bold text-teal-300">5-Axis Wet Milling</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Furnace Cycle:</span>
                    <span className="font-semibold text-neutral-300">Scheduled 16:30</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Est. Delivery:</span>
                    <span className="font-semibold text-white font-mono">Tomorrow, 11:00 AM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="mt-8 pt-6 border-t border-neutral-800/80">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-3">
                <span className="text-teal-400 font-bold">1. Digital Rx Built</span>
                <span className="text-cyan-400 font-bold">2. Scans Verified</span>
                <span className="text-emerald-400 font-bold">3. In CAM Production</span>
                <span className="text-neutral-500">4. Glazed & QC</span>
                <span className="text-neutral-500">5. Chairside Delivery</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden flex">
                <div className="h-full bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 w-3/5 rounded-full shadow-[0_0_12px_rgba(20,184,166,0.5)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
