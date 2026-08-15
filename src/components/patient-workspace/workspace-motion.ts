import type { Transition, Variants } from 'framer-motion';

/**
 * One motion language for the clinical workspace.
 *
 * Every animated surface on the patient page borrows from this file so the
 * workspace reads as a single instrument rather than a pile of independently
 * animated widgets. Two rules keep it coherent:
 *
 *  1. Springs are reserved for elements that physically TRAVEL between
 *     positions (the rail indicator, the pipeline node). Mass-based motion is
 *     what sells "physical control".
 *  2. Everything else is a tween on EASE_OUT. Same curve, every time.
 *
 * Only `transform` and `opacity` are ever animated — the STL/WebGL canvas
 * janks badly if layout or filter properties are tweened near it.
 */

/** Standard "smooth out" curve. Used for every non-spring transition. */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Weighty spring for shared-layout elements that move between slots. */
export const TRAVEL_SPRING: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 34,
  mass: 0.8,
};

/** Softer spring for hover/press feedback on dense controls. */
export const TACTILE_SPRING: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 30,
};

export const PANEL_TRANSITION: Transition = { duration: 0.28, ease: EASE_OUT };

/** Tab panel enter/exit. Kept short — clinical data must never feel withheld. */
export const panelVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: PANEL_TRANSITION },
  exit: { opacity: 0, y: -6, transition: { duration: 0.16, ease: EASE_OUT } },
};

/** Parent of a staggered group. Pair with `staggerItem` on direct children. */
export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.26, ease: EASE_OUT } },
};
