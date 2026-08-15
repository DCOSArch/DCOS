'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Plus,
  Camera,
  Share2,
  RefreshCw,
  MessageSquare,
  Zap,
  CalendarPlus,
} from 'lucide-react';
import { SubscriptionTier } from '@/types';
import { staggerParent, staggerItem, TACTILE_SPRING } from './workspace-motion';

/**
 * Persistent vertical operatory dock.
 *
 * This is the single source of truth for patient-level actions. They used to
 * be duplicated — "Patient 3D Link"/"Request Try-In" sat in the case switcher
 * bar AND again in a second rail card under different labels ("Share 3D
 * Smile"). Both copies are consolidated here.
 *
 * Chrome is deliberately minimal: one surface, `divide-y` for grouping rather
 * than a stack of nested bordered cards.
 */

type RailAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Tailwind text color for the icon — the only per-row color allowed. */
  tone: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
};

interface OperatoryRailProps {
  patientId: string;
  tier: SubscriptionTier;
  whatsappHref: string;
  onShare3D: () => void;
  onRequestTryIn: () => void;
  onUpgrade: () => void;
}

/**
 * A single dock row. Memoized and isolated so hover springs never re-render
 * the workspace above it.
 */
const RailRow = memo(function RailRow({
  action,
  reduceMotion,
}: {
  action: RailAction;
  reduceMotion: boolean;
}) {
  const Icon = action.icon;

  const body = (
    <>
      <span
        className={`shrink-0 grid place-items-center w-7 h-7 rounded-lg bg-muted/40 ${action.tone}`}
      >
        <Icon className="w-3.5 h-3.5" strokeWidth={2} />
      </span>
      <span className="truncate text-xs font-medium text-foreground/90 group-hover:text-foreground">
        {action.label}
      </span>
    </>
  );

  const rowClass =
    'group w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 cursor-pointer';

  return (
    <motion.div
      variants={staggerItem}
      whileHover={reduceMotion ? undefined : { x: 3 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      transition={TACTILE_SPRING}
    >
      {action.href ? (
        <Link
          href={action.href}
          className={rowClass}
          {...(action.external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {body}
        </Link>
      ) : (
        <button type="button" onClick={action.onClick} className={rowClass}>
          {body}
        </button>
      )}
    </motion.div>
  );
});

export const OperatoryRail = memo(function OperatoryRail({
  patientId,
  tier,
  whatsappHref,
  onShare3D,
  onRequestTryIn,
  onUpgrade,
}: OperatoryRailProps) {
  const reduceMotion = useReducedMotion() ?? false;

  const actions: RailAction[] = [
    {
      key: 'visit',
      label: 'New Visit',
      icon: CalendarPlus,
      tone: 'text-foreground/70',
      href: `/visits/new?patientId=${patientId}`,
    },
    {
      key: 'scan',
      label: 'IOS Scan Body',
      icon: Camera,
      tone: 'text-primary',
      href: `/patients/${patientId}/capture`,
    },
    {
      key: 'share',
      label: 'Share 3D Smile',
      icon: Share2,
      tone: 'text-primary',
      onClick: onShare3D,
    },
    {
      key: 'tryin',
      label: 'Request Try-In',
      icon: RefreshCw,
      tone: 'text-amber-500',
      onClick: onRequestTryIn,
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp Notice',
      icon: MessageSquare,
      tone: 'text-emerald-400',
      href: whatsappHref,
      external: true,
    },
  ];

  return (
    <motion.aside
      variants={staggerParent}
      initial="hidden"
      animate="show"
      className="w-full lg:w-56 shrink-0 lg:sticky lg:top-6"
      aria-label="Operatory actions"
    >
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <motion.div variants={staggerItem} className="px-3 pt-3 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Operatory
          </span>
        </motion.div>

        {/* Primary action — the only filled control in the rail, so it reads
            as the obvious next step without competing with five siblings. */}
        <motion.div variants={staggerItem} className="px-3 pb-3">
          <motion.div
            whileHover={reduceMotion ? undefined : { y: -1 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            transition={TACTILE_SPRING}
          >
            <Link
              href="/?action=create"
              className="w-full h-9 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              New Lab Order
            </Link>
          </motion.div>
        </motion.div>

        <div className="divide-y divide-border/50 border-t border-border/50">
          {actions.map((action) => (
            <RailRow key={action.key} action={action} reduceMotion={reduceMotion} />
          ))}
        </div>

        {tier === 'STARTER' && (
          <motion.div
            variants={staggerItem}
            className="p-3 border-t border-border/50"
          >
            <motion.button
              type="button"
              onClick={onUpgrade}
              whileHover={reduceMotion ? undefined : { y: -1 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              transition={TACTILE_SPRING}
              className="w-full h-9 rounded-xl bg-primary/10 border border-primary/40 text-primary font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-primary/20 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
              Upgrade Plan
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
});
