'use client';

import React, { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { EASE_OUT, TRAVEL_SPRING } from './workspace-motion';

/**
 * Lab production pipeline.
 *
 * Replaces a row of disconnected dots + dashed borders with one continuous
 * track whose fill animates on `scaleX` (GPU) and a single active halo that
 * physically travels between stages via `layoutId`. The eye tracks one moving
 * object instead of re-parsing six independent nodes on every status change.
 */

export type FlowStep = {
  status: string;
  label: string;
  desc: string;
};

export const PIPELINE_STEPS: FlowStep[] = [
  { status: 'PENDING', label: 'Incoming', desc: 'Awaiting lab approval' },
  { status: 'IN_PROGRESS', label: 'Production', desc: 'CAD/CAM milling' },
  { status: 'QUALITY_CHECK', label: 'Checks', desc: 'Being inspected' },
  { status: 'DISPATCHED', label: 'Dispatched', desc: 'In transit to clinic' },
  { status: 'DELIVERED', label: 'Delivered', desc: 'Delivered to clinic' },
  { status: 'COMPLETED', label: 'Completed', desc: 'Fitted & finalized' },
];

export const STATUS_ORDER = PIPELINE_STEPS.map((s) => s.status);

interface CaseFlowRailProps {
  currentIdx: number;
  /** Stable id so the travelling halo animates per case, not across cases. */
  caseId: string;
}

export const CaseFlowRail = memo(function CaseFlowRail({
  currentIdx,
  caseId,
}: CaseFlowRailProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const lastIdx = PIPELINE_STEPS.length - 1;
  const progress = currentIdx <= 0 ? 0 : Math.min(currentIdx / lastIdx, 1);

  return (
    <div className="relative rounded-2xl border border-border bg-card px-5 py-5">
      <div className="relative">
        {/* Continuous track. Sits behind the nodes at node-center height and
            is inset by half a column so it starts/ends under the first and
            last node rather than at the container edge. */}
        <div
          className="absolute top-[13px] left-[8.33%] right-[8.33%] h-px bg-border"
          aria-hidden
        >
          <motion.div
            className="h-full origin-left bg-emerald-500/70"
            initial={false}
            animate={{ scaleX: progress }}
            transition={
              reduceMotion ? { duration: 0 } : { duration: 0.65, ease: EASE_OUT }
            }
          />
        </div>

        <ol
          className="relative grid"
          style={{ gridTemplateColumns: `repeat(${PIPELINE_STEPS.length}, minmax(0,1fr))` }}
        >
          {PIPELINE_STEPS.map((step, idx) => {
            const isPast = currentIdx > idx;
            const isCurrent = currentIdx === idx;

            return (
              <li
                key={step.status}
                className="flex flex-col items-center gap-1.5 min-w-0 px-1"
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className="relative grid place-items-center w-[26px] h-[26px]">
                  {/* The single travelling element. One halo exists in the
                      DOM at a time; framer-motion tweens it between slots. */}
                  {isCurrent && (
                    <motion.span
                      layoutId={`flow-halo-${caseId}`}
                      transition={reduceMotion ? { duration: 0 } : TRAVEL_SPRING}
                      className="absolute inset-0 rounded-full bg-primary/15 border-2 border-primary"
                    />
                  )}
                  <span
                    className={`relative grid place-items-center rounded-full transition-colors duration-300 ${
                      isPast
                        ? 'w-[22px] h-[22px] bg-emerald-500/20 border border-emerald-500/50'
                        : isCurrent
                          ? 'w-2.5 h-2.5 bg-primary'
                          : 'w-[22px] h-[22px] bg-muted/40 border border-border'
                    }`}
                  >
                    {isPast && <Check className="w-3 h-3 text-emerald-500" strokeWidth={3} />}
                    {!isPast && !isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </span>

                  {/* Breathing pulse marks the live stage without a static glow. */}
                  {isCurrent && !reduceMotion && (
                    <motion.span
                      className="absolute inset-0 rounded-full border border-primary/40"
                      animate={{ scale: [1, 1.45], opacity: [0.55, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </span>

                <span
                  className={`text-[10px] leading-tight text-center transition-colors ${
                    isCurrent
                      ? 'font-bold text-foreground'
                      : isPast
                        ? 'font-semibold text-muted-foreground'
                        : 'font-medium text-muted-foreground/50'
                  }`}
                >
                  {step.label}
                </span>

                {isCurrent && (
                  <motion.span
                    initial={reduceMotion ? false : { opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: EASE_OUT }}
                    className="text-[9px] text-primary font-medium text-center leading-tight"
                  >
                    {step.desc}
                  </motion.span>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
});
