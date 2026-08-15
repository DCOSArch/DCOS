'use client';

import React, { memo, useState } from 'react';
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

export const WorkspaceNavRail = memo(function WorkspaceNavRail({
  sections,
  value,
  onValueChange,
}: WorkspaceNavRailProps) {
  const reduceMotion = useReducedMotion() ?? false;
  // Tracks hover *and* focus so the label is reachable by keyboard, not just mouse.
  const [revealed, setRevealed] = useState<string | null>(null);

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
          const isRevealed = revealed === section.value;

          return (
            <li key={section.value} className="relative shrink-0">
              <motion.button
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-label={section.label}
                onClick={() => onValueChange(section.value)}
                onMouseEnter={() => setRevealed(section.value)}
                onMouseLeave={() => setRevealed((v) => (v === section.value ? null : v))}
                onFocus={() => setRevealed(section.value)}
                onBlur={() => setRevealed((v) => (v === section.value ? null : v))}
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

                {/* Desktop count badge.
                    Previously anchored to the icon at -top-1.5 -right-2, which
                    put it straddling the active indicator's 1px border and the
                    rail edge — it read as a clipped, broken chip. It is now
                    anchored inside the button and punched out with a ring in
                    the rail's own background colour, so it reads as a distinct
                    chip regardless of what sits behind it. */}
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

              {/* Desktop flyout label. pointer-events-none so it can never
                  swallow a click aimed at the next rail item. */}
              <AnimatePresence>
                {isRevealed && (
                  <motion.span
                    initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -6, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -4, scale: 0.98 }}
                    transition={{ duration: 0.16, ease: EASE_OUT }}
                    role="presentation"
                    className="hidden lg:flex items-center gap-2 absolute left-full top-1/2 -translate-y-1/2 ml-2.5 z-50 px-2.5 py-1.5 rounded-lg bg-popover border border-border shadow-md whitespace-nowrap pointer-events-none"
                  >
                    <span className="text-xs font-semibold text-foreground">
                      {section.label}
                    </span>
                    {section.count !== undefined && (
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                        {section.count}
                      </span>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
