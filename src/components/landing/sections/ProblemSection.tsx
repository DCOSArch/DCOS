'use client';

import { useRef, useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  PhoneOff,
  FileWarning,
  EyeOff,
  RotateCcw,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';

const frictionPoints = [
  {
    id: 'rx-gap',
    title: 'The Unstructured Prescription Gap',
    icon: <FileWarning className="w-5 h-5 text-amber-400" />,
    problemHeadline: 'Shade notes & margin instructions lost in personal chat threads',
    legacyDetails: [
      'Handwritten slips with ambiguous abbreviations ("Zirc Cr #19, Vita A2 maybe?")',
      'Shade photos compressed heavily over messaging apps, losing chroma fidelity',
      'Technicians guessing prep margins or pausing work until the doctor calls back',
    ],
    dcosHeadline: 'Parametric, 100% deterministic clinical prescription',
    dcosDetails: [
      'Mandatory FDI tooth assignment, prep type, and VITA Classical/3D Master shade selection',
      'Uncompressed RAW tooth photography with chairside calibration references',
      'Deterministic validation ensures zero missing parameters before submission',
    ],
    metric: '18.4%',
    metricLabel: 'of lab delays caused by incomplete prescriptions',
  },
  {
    id: 'black-hole',
    title: 'The Blind Production Black Hole',
    icon: <PhoneOff className="w-5 h-5 text-rose-400" />,
    problemHeadline: 'Clinic staff making daily calls asking "Where is this case?"',
    legacyDetails: [
      'Receptionists spending hours calling lab dispatch to confirm patient arrival dates',
      'Lab managers constantly interrupted on the production floor to track physical trays',
      'Unexpected delays discovered only on the day of the patient seat appointment',
    ],
    dcosHeadline: 'Live Zomato-style production milestones in real-time',
    dcosDetails: [
      'Granular visibility: Intake → 5-Axis Milling → Sintering/Glaze → QC → Dispatched',
      'Automated SMS/WhatsApp milestones sent directly to clinic operatory dashboards',
      'Guaranteed delivery SLA tracking with proactive drift rescheduling alerts',
    ],
    metric: '4.2 hrs',
    metricLabel: 'wasted per week per clinic on manual lab follow-up calls',
  },
  {
    id: 'scan-corruption',
    title: 'Silent Scan File Corruptions',
    icon: <EyeOff className="w-5 h-5 text-red-400" />,
    problemHeadline: 'Defective mesh geometry discovered 48 hours after chairside scan',
    legacyDetails: [
      'Inverted face normals, non-manifold boundaries, or missing scan body data',
      'Laboratory opens the STL days later and requests a patient recall for re-scan',
      'Severe damage to clinic reputation and chair time waste ($250+/hr)',
    ],
    dcosHeadline: 'Client-side WebGL mesh validation before upload completes',
    dcosDetails: [
      'Scanner-agnostic parsing for Medit, 3Shape, iTero, and Sirona (STL/PLY/OBJ)',
      'Autonomous sub-millimeter occlusal clearance computation in browser WebAssembly',
      'Immediate chairside alert if prep taper or margin definition requires touch-up',
    ],
    metric: '12.8%',
    metricLabel: 'of raw digital scans contain unverified geometric defects',
  },
  {
    id: 'remake-friction',
    title: 'The Lost Soft-Copy Remake Loop',
    icon: <RotateCcw className="w-5 h-5 text-orange-400" />,
    problemHeadline: 'Lost CAD design files forcing full-price remakes from scratch',
    legacyDetails: [
      'Labs purging local CAD archives after 30 days due to unmanaged storage limits',
      'Remake requires repeating the entire wax-up, margin ditching, and CAM nesting',
      'Disputes over whether fit failure was due to impression shrinkage or milling error',
    ],
    dcosHeadline: 'Permanent soft-copy CAD archive with 1-click remake replication',
    dcosDetails: [
      'Full `.constructionInfo`, margin spline coordinates, and CAM toolpaths permanently saved',
      '1-click remake issuance reusing validated framework geometry instantly',
      'Cryptographic Merkle audit proof of original design and delivery timestamps',
    ],
    metric: '100%',
    metricLabel: 'reproducibility on remakes without re-designing from zero',
  },
];

export default function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeFrictionIdx, setActiveFrictionIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'compare' | 'legacy' | 'dcos'>('compare');

  const currentPoint = frictionPoints[activeFrictionIdx];

  return (
    <section ref={sectionRef} className="landing-section dark-section" id="problem" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <div className="section-inner">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium tracking-wide mb-4">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            The Clinical Disconnect
          </div>

          <h2 className="landing-heading text-white" style={{ margin: '0 auto 16px' }}>
            Why digital dental workflows <span className="text-rose-400">still break down.</span>
          </h2>

          <p className="landing-subheading mx-auto text-neutral-300">
            Intraoral scanners digitized impressions, but the handoff to dental laboratories remains trapped in fragmented messaging apps, missing notes, and blind production loops.
          </p>

          {/* Friction Point Selector Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 max-w-4xl mx-auto">
            {frictionPoints.map((item, idx) => {
              const isSelected = activeFrictionIdx === idx;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveFrictionIdx(idx)}
                  className={`p-3.5 rounded-2xl text-left transition-all duration-300 border backdrop-blur-md flex flex-col justify-between ${
                    isSelected
                      ? 'bg-neutral-900/90 border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                      : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono opacity-60">0{idx + 1}</span>
                    <div className="p-1.5 rounded-lg bg-neutral-800/80">
                      {item.icon}
                    </div>
                  </div>
                  <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                    {item.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Comparison Console */}
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-neutral-950/90 border border-neutral-800/80 backdrop-blur-2xl p-8 lg:p-10 shadow-2xl">
            {/* Console Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-neutral-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-800 flex items-center justify-center border border-neutral-700/60 shadow-inner">
                  {currentPoint.icon}
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                    Friction Vector 0{activeFrictionIdx + 1}
                  </div>
                  <h3 className="text-xl font-bold text-white">{currentPoint.title}</h3>
                </div>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                <button
                  onClick={() => setViewMode('compare')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    viewMode === 'compare' ? 'bg-neutral-800 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setViewMode('legacy')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    viewMode === 'legacy' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Status Quo
                </button>
                <button
                  onClick={() => setViewMode('dcos')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    viewMode === 'dcos' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  DCOS Protocol
                </button>
              </div>
            </div>

            {/* Split Comparison Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-stretch">
              {/* Left Column: Fragmented Status Quo */}
              {(viewMode === 'compare' || viewMode === 'legacy') && (
                <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-3">
                      <AlertTriangle className="w-4 h-4" />
                      The Fragmented Reality
                    </div>
                    <div className="text-base font-semibold text-white mb-4">
                      {currentPoint.problemHeadline}
                    </div>
                    <ul className="space-y-3 text-xs text-neutral-300">
                      {currentPoint.legacyDetails.map((detail, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          <span className="leading-relaxed">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-rose-500/20 flex items-center justify-between text-xs">
                    <span className="text-neutral-400">Clinical Impact</span>
                    <span className="font-bold text-rose-400">Uncontrolled Overhead</span>
                  </div>
                </div>
              )}

              {/* Right Column: DCOS Deterministic Standard */}
              {(viewMode === 'compare' || viewMode === 'dcos') && (
                <div className="p-6 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col justify-between shadow-[0_0_30px_rgba(6,182,212,0.08)]">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      The DCOS Deterministic Protocol
                    </div>
                    <div className="text-base font-semibold text-white mb-4">
                      {currentPoint.dcosHeadline}
                    </div>
                    <ul className="space-y-3 text-xs text-neutral-200">
                      {currentPoint.dcosDetails.map((detail, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                          <span className="leading-relaxed">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-cyan-500/20 flex items-center justify-between text-xs">
                    <span className="text-neutral-400">System Benchmark</span>
                    <span className="font-bold text-cyan-400">Zero-Rework Assurance</span>
                  </div>
                </div>
              )}
            </div>

            {/* Impact Metric Footer Bar */}
            <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl lg:text-4xl font-extrabold font-mono text-cyan-400 tracking-tight">
                  {currentPoint.metric}
                </div>
                <div className="text-xs text-neutral-400 max-w-xs leading-snug">
                  {currentPoint.metricLabel}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                DCOS 2.0 Bi-Temporal Verification
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
