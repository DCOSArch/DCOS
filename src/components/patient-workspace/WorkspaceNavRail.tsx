'use client';

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { TRAVEL_SPRING, TACTILE_SPRING, EASE_OUT } from './workspace-motion';

/**
 * Vertical section navigation.
 *
 * Replaces the horizontal tab strip, which was `w-fit` and therefore left a
 * large ambiguous void between itself and the right operatory rail. Moving
 * navigation to a fixed-width left rail turns the page into a true three
 * column cockpit — nothing floats, and the centre column has a real reason to
 * fill the space between two rails.
 *
 * Desktop: icon-only rail, label flies out on hover OR keyboard focus.
 * Mobile:  horizontal scrolling row with inline labels (a 56px vertical rail
 *          plus flyouts is unusable on a phone).
 */

export type NavSection = {
  value: string;
  label: string;
  icon: LucideIcon;
  count?: number;
};

interface WorkspaceNavRailProps {
  sections: NavSection[];
  value: string;
  onValueChange: (value: string) => void;
}

/** Where the flyout should be painted, in viewport coordinates. */
type Reveal = {
  value: string;
  label: string;
  count?: number;
  top: number;
  left: number;
  flipped: boolean;
};

/** Approximate flyout width, used only to decide which side it opens on. */
const FLYOUT_ESTIMATED_WIDTH = 190;

export const WorkspaceNavRail = memo(function WorkspaceNavRail({
  sections,
  value,
  onValueChange,
}: WorkspaceNavRailProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [revealed, setRevealed] = useState<Reveal | null>(null);
  /** The element the flyout is anchored to, so it can be re-measured. */
  const triggerRef = useRef<HTMLElement | null>(null);

  // Portal target only exists on the client.
  const [isPortalReady, setIsPortalReady] = useState(false);
  useEffect(() => setIsPortalReady(true), []);

  const measure = useCallback((section: NavSection, el: HTMLElement): Reveal => {
    const r = el.getBoundingClientRect();
    // Open to the left instead if there isn't room on the right.
    const flipped = r.right + FLYOUT_ESTIMATED_WIDTH > window.innerWidth;
    return {
      value: section.value,
      label: section.label,
      count: section.count,
      top: r.top + r.height / 2,
      left: flipped ? r.left - 10 : r.right + 10,
      flipped,
    };
  }, []);

  // Tracks hover *and* focus so the label is reachable by keyboard, not just mouse.
  const reveal = useCallback(
    (section: NavSection, el: HTMLElement) => {
      triggerRef.current = el;
      setRevealed(measure(section, el));
    },
    [measure],
  );

  const clear = useCallback((sectionValue: string) => {
    setRevealed((cur) => {
      if (cur?.value !== sectionValue) return cur;
      triggerRef.current = null;
      return null;
    });
  }, []);

  // Keep the flyout glued to its trigger rather than dismissing it. Dismissing
  // on scroll looked reasonable but broke keyboard use outright: focusing a
  // button can scroll it into view, and that scroll fired immediately —
  // clearing the label before it was ever readable.
  useEffect(() => {
    if (!revealed) return;
    const sync = () => {
      const el = triggerRef.current;
      if (!el || !el.isConnected) return setRevealed(null);
      const r = el.getBoundingClientRect();
      const flipped = r.right + FLYOUT_ESTIMATED_WIDTH > window.innerWidth;
      setRevealed((cur) =>
        cur
          ? { ...cur, top: r.top + r.height / 2, left: flipped ? r.left - 10 : r.right + 10, flipped }
          : cur,
      );
    };
    window.addEventListener('scroll', sync, true);
    window.addEventListener('resize', sync);
    return () => {
      window.removeEventListener('scroll', sync, true);
      window.removeEventListener('resize', sync);
    };
  }, [revealed?.value]);

  return (
    <nav
      aria-label="Patient workspace sections"
      className="w-full lg:w-14 shrink-0 lg:sticky lg:top-6"
    >
      <ul
        role="tablist"
        aria-orientation="vertical"
        className="flex lg:flex-col gap-1 p-1 rounded-2xl bg-card border border-border overflow-x-auto lg:overflow-visible"
      >
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = section.value === value;

          return (
            <li key={section.value} className="relative shrink-0">
              <motion.button
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-label={section.label}
                onClick={() => onValueChange(section.value)}
                onMouseEnter={(e) => reveal(section, e.currentTarget)}
                onMouseLeave={() => clear(section.value)}
                onFocus={(e) => reveal(section, e.currentTarget)}
                onBlur={() => clear(section.value)}
                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                transition={TACTILE_SPRING}
                className="relative flex items-center gap-2 lg:justify-center w-full lg:w-12 h-11 lg:h-12 px-3 lg:px-0 rounded-xl cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              >
                {/* Single travelling indicator shared across all sections. */}
                {isActive && (
                  <motion.span
                    layoutId="workspace-nav-indicator"
                    transition={reduceMotion ? { duration: 0 } : TRAVEL_SPRING}
                    className="absolute inset-0 rounded-xl bg-primary/15 border border-primary/50"
                  />
                )}

                <span className="relative z-10 flex items-center gap-2">
                  <Icon
                    className={`w-[18px] h-[18px] transition-colors ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    }`}
                    strokeWidth={2}
                  />

                  {/* Inline label — mobile only. */}
                  <span
                    className={`lg:hidden text-xs font-medium whitespace-nowrap ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {section.label}
                    {section.count !== undefined && section.count > 0 && (
                      <span className="ml-1.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                        {section.count}
                      </span>
                    )}
                  </span>
                </span>

                {/* Desktop count badge. Anchored inside the button and punched
                    out with a ring in the rail's own background colour so it
                    never merges with the active indicator's border. */}
                {section.count !== undefined && section.count > 0 && (
                  <span
                    className={`hidden lg:flex absolute top-1 right-1 z-20 min-w-[15px] h-[15px] px-[3px] items-center justify-center rounded-full font-mono text-[9px] font-bold leading-none tabular-nums ring-2 ring-card ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {section.count}
                  </span>
                )}
              </motion.button>
            </li>
          );
        })}
      </ul>

      {/* Flyout is portaled to <body> and positioned in viewport coordinates.
          Rendering it inside the rail put it at the mercy of every ancestor
          stacking context on the page — the odontogram card painted straight
          over it regardless of z-index. Nothing in the document can occlude it
          from here. */}
      {isPortalReady &&
        createPortal(
          <AnimatePresence>
            {revealed && (
              <motion.div
                key={revealed.value}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: revealed.flipped ? 6 : -6, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
                style={{
                  top: revealed.top,
                  left: revealed.left,
                  transform: `translateY(-50%)${revealed.flipped ? ' translateX(-100%)' : ''}`,
                }}
                className="hidden lg:flex items-center gap-2 fixed z-[200] px-2.5 py-1.5 rounded-lg bg-popover border border-border shadow-lg whitespace-nowrap pointer-events-none"
              >
                <span className="text-xs font-semibold text-foreground">{revealed.label}</span>
                {revealed.count !== undefined && (
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                    {revealed.count}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </nav>
  );
});
