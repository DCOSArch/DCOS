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
import { AntigravityCard } from '@/components/ui/AntigravityCard';
import { motion, AnimatePresence, useMotionValue, useTransform, animate as fmAnimate } from 'framer-motion';

// Splits "18.4%" / "4.2 hrs" / "100%" into numeric + suffix + decimals so we can count up.
function parseMetric(raw: string): { num: number; suffix: string; decimals: number } {
  const m = /^([\d.]+)\s*(.*)$/.exec(raw.trim());
  if (!m) return { num: 0, suffix: raw, decimals: 0 };
  const num = parseFloat(m[1]);
  const decimals = (m[1].split('.')[1]?.length ?? 0);
  return { num, suffix: m[2], decimals };
}

function AnimatedMetric({ raw }: { raw: string }) {
  const parsed = parseMetric(raw);
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => v.toFixed(parsed.decimals));
  useEffect(() => {
    mv.set(0);
    const controls = fmAnimate(mv, parsed.num, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [parsed.num, parsed.decimals, mv]);
  return (
    <span className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {parsed.suffix && <span className="text-cyan-500/80 ml-0.5">{parsed.suffix}</span>}
    </span>
  );
}

// Fade-and-slide preset used for panel content swaps.
const swapVariants = {
  initial: { opacity: 0, y: 8, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit:    { opacity: 0, y: -6, filter: 'blur(4px)' },
};
const swapTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };

const bulletContainer = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const bulletItem = {
  initial: { opacity: 0, x: -6 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
};

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
    dcosHeadline: 'One-shot Rx with every field validated before submission',
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
    dcosHeadline: 'Live production milestones, delivered like food-order tracking',
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
    dcosHeadline: 'Bad scans caught the moment you upload — not two days later',
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
    dcosHeadline: 'Every CAD file archived. Remakes in one click, not from scratch.',
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
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-15% 0px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium tracking-wide mb-4"
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: swapTransition } }}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            The Clinical Disconnect
          </motion.div>

          <motion.h2
            className="landing-heading text-white"
            style={{ margin: '0 auto 16px' }}
            variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
          >
            Why digital dental workflows <span className="text-rose-400">still break down.</span>
          </motion.h2>

          <motion.p
            className="landing-subheading mx-auto text-neutral-300"
            variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: swapTransition } }}
          >
            Intraoral scanners digitized the impression. The handoff didn't. Cases still get lost in WhatsApp threads, ambiguous notes, and daily follow-up calls to the lab.
          </motion.p>

          {/* Friction Point Selector Navigation */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10 max-w-4xl mx-auto"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
          >
            {frictionPoints.map((item, idx) => {
              const isSelected = activeFrictionIdx === idx;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveFrictionIdx(idx)}
                  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: swapTransition } }}
                  whileHover={{ y: -3, transition: { duration: 0.18 } }}
                  whileTap={{ scale: 0.97 }}
                  className={`group relative p-3.5 rounded-2xl text-left border backdrop-blur-md flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? 'bg-neutral-900/90 border-cyan-500/50 shadow-[0_0_25px_rgba(6,182,212,0.15)]'
                      : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="frictionRing"
                      className="absolute inset-0 rounded-2xl ring-1 ring-cyan-500/50 pointer-events-none"
                      style={{ boxShadow: '0 0 30px rgba(6,182,212,0.18) inset' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <div className="relative flex items-center justify-between mb-2">
                    <span className="text-xs font-mono opacity-60">0{idx + 1}</span>
                    <motion.div
                      className="p-1.5 rounded-lg bg-neutral-800/80"
                      animate={isSelected ? { rotate: [0, -6, 6, 0], scale: [1, 1.08, 1] } : { rotate: 0, scale: 1 }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                      {item.icon}
                    </motion.div>
                  </div>
                  <div className={`relative text-xs font-bold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                    {item.title}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>

        {/* Interactive Comparison Console */}
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-neutral-950/90 border border-neutral-800/80 backdrop-blur-2xl p-8 lg:p-10 shadow-2xl">
            {/* Console Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-neutral-800/80">
              <div className="flex items-center gap-3">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`icon-${currentPoint.id}`}
                    initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 12 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="w-10 h-10 rounded-2xl bg-neutral-800 flex items-center justify-center border border-neutral-700/60 shadow-inner"
                  >
                    {currentPoint.icon}
                  </motion.div>
                </AnimatePresence>
                <div className="overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`vec-${currentPoint.id}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={swapTransition}
                      className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold"
                    >
                      Friction Vector 0{activeFrictionIdx + 1}
                    </motion.div>
                  </AnimatePresence>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.h3
                      key={`title-${currentPoint.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={swapTransition}
                      className="text-xl font-bold text-white"
                    >
                      {currentPoint.title}
                    </motion.h3>
                  </AnimatePresence>
                </div>
              </div>

              {/* View Mode Switcher */}
              <div className="relative flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                {(['compare', 'legacy', 'dcos'] as const).map((mode) => {
                  const isActive = viewMode === mode;
                  const label = mode === 'compare' ? 'Side-by-Side' : mode === 'legacy' ? 'Status Quo' : 'DCOS Protocol';
                  const activeText = mode === 'compare' ? 'text-white' : mode === 'legacy' ? 'text-rose-300' : 'text-cyan-300';
                  const activeBg = mode === 'compare' ? 'bg-neutral-800' : mode === 'legacy' ? 'bg-rose-500/20 border border-rose-500/30' : 'bg-cyan-500/20 border border-cyan-500/30';
                  return (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`relative px-3 py-1.5 rounded-lg font-medium transition-colors z-10 ${
                        isActive ? activeText : 'text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="viewModePill"
                          className={`absolute inset-0 rounded-lg -z-10 ${activeBg}`}
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        />
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Comparison Grid */}
            <motion.div layout className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 items-stretch">
              {/* Left Column: Fragmented Status Quo */}
              <AnimatePresence mode="popLayout" initial={false}>
                {(viewMode === 'compare' || viewMode === 'legacy') && (
                  <motion.div
                    layout
                    key="legacy-panel"
                    initial={{ opacity: 0, x: -20, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20, scale: 0.98 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className={`p-6 rounded-2xl bg-rose-950/20 border border-rose-500/20 flex flex-col justify-between ${viewMode === 'legacy' ? 'lg:col-span-2' : ''}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-3">
                        <AlertTriangle className="w-4 h-4" />
                        The Fragmented Reality
                      </div>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={`legacy-head-${currentPoint.id}`}
                          variants={swapVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={swapTransition}
                          className="text-base font-semibold text-white mb-4"
                        >
                          {currentPoint.problemHeadline}
                        </motion.div>
                      </AnimatePresence>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.ul
                          key={`legacy-list-${currentPoint.id}`}
                          variants={bulletContainer}
                          initial="initial"
                          animate="animate"
                          className="space-y-3 text-xs text-neutral-300"
                        >
                          {currentPoint.legacyDetails.map((detail, dIdx) => (
                            <motion.li key={dIdx} variants={bulletItem} className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                              <span className="leading-relaxed">{detail}</span>
                            </motion.li>
                          ))}
                        </motion.ul>
                      </AnimatePresence>
                    </div>

                    <div className="mt-6 pt-4 border-t border-rose-500/20 flex items-center justify-between text-xs">
                      <span className="text-neutral-400">Clinical Impact</span>
                      <span className="font-bold text-rose-400">Uncontrolled Overhead</span>
                    </div>
                  </motion.div>
                )}

                {(viewMode === 'compare' || viewMode === 'dcos') && (
                  <motion.div
                    layout
                    key="dcos-panel"
                    initial={{ opacity: 0, x: 20, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.98 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className={`p-6 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex flex-col justify-between shadow-[0_0_30px_rgba(6,182,212,0.08)] ${viewMode === 'dcos' ? 'lg:col-span-2' : ''}`}
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        The DCOS Deterministic Protocol
                      </div>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={`dcos-head-${currentPoint.id}`}
                          variants={swapVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={swapTransition}
                          className="text-base font-semibold text-white mb-4"
                        >
                          {currentPoint.dcosHeadline}
                        </motion.div>
                      </AnimatePresence>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.ul
                          key={`dcos-list-${currentPoint.id}`}
                          variants={bulletContainer}
                          initial="initial"
                          animate="animate"
                          className="space-y-3 text-xs text-neutral-200"
                        >
                          {currentPoint.dcosDetails.map((detail, dIdx) => (
                            <motion.li key={dIdx} variants={bulletItem} className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                              <span className="leading-relaxed">{detail}</span>
                            </motion.li>
                          ))}
                        </motion.ul>
                      </AnimatePresence>
                    </div>

                    <div className="mt-6 pt-4 border-t border-cyan-500/20 flex items-center justify-between text-xs">
                      <span className="text-neutral-400">System Benchmark</span>
                      <span className="font-bold text-cyan-400">Zero-Rework Assurance</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Impact Metric Footer Bar */}
            <div className="mt-8 pt-6 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-3xl lg:text-4xl font-extrabold font-mono text-cyan-400 tracking-tight">
                  <AnimatedMetric raw={currentPoint.metric} />
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`metric-label-${currentPoint.id}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={swapTransition}
                    className="text-xs text-neutral-400 max-w-xs leading-snug"
                  >
                    {currentPoint.metricLabel}
                  </motion.div>
                </AnimatePresence>
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
