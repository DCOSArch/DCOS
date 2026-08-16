'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OperatoryChair, QueueEntry, QueueStage } from '@/types';
import {
  getOperatoryChairs,
  saveOperatoryChairs,
  getQueueEntries,
  saveQueueEntries,
} from '@/lib/services';
import { Card } from '@/components/ui/card';
import { Activity, MessageSquare, Undo2, AlertTriangle } from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────────────
 * Clinic Live — cockpit
 *
 * One frame, divided by hairlines. Previously this was four stacked bordered
 * surfaces (header card > chair cards > a bordered box INSIDE each chair card >
 * timeline wrapper > timeline rail > focus card), which is what made it read as
 * cluttered. Separation here is `divide-y` and single hairlines only; there is
 * no nested bordered box anywhere below.
 *
 * Layout responds to the CARD's width via container queries, not the viewport —
 * this is a panel inside a dashboard, so `lg:` would pick the wrong layout
 * whenever the surrounding columns change.
 * ──────────────────────────────────────────────────────────────────────────── */

/** Every numeral in the cockpit. slashed-zero matters for 0/O at 11px. */
const NUM = 'font-mono tabular-nums slashed-zero tracking-tight';

/**
 * Stage colour is carried by a single `--stage` custom property per row, fed
 * from THIS APP's semantic theme tokens. Deliberately not Tailwind palette
 * variables (`--color-amber-500`): those are only emitted when a matching
 * utility survives source scanning, so an unrelated refactor can silently
 * collapse them to nothing.
 *
 * IN_CHAIR / IN_TREATMENT are primary, NOT red. A patient being treated is the
 * normal healthy state of an operatory; painting it the same colour as an
 * overdue wait manufactures alarm fatigue. Red is reserved for genuine trouble.
 */
const STAGE: Record<QueueStage, { label: string; token: string }> = {
  SCHEDULED: { label: 'Scheduled', token: 'var(--color-muted-foreground)' },
  CHECKED_IN: { label: 'Checked in', token: 'var(--color-success)' },
  WAITING: { label: 'Waiting', token: 'var(--color-attention)' },
  IN_CHAIR: { label: 'In chair', token: 'var(--color-primary)' },
  IN_TREATMENT: { label: 'In treatment', token: 'var(--color-primary)' },
  BILLING: { label: 'Billing', token: 'var(--color-accent-coral)' },
  COMPLETED: { label: 'Completed', token: 'var(--color-success)' },
  NO_SHOW: { label: 'No show', token: 'var(--color-muted-foreground)' },
  CANCELLED: { label: 'Cancelled', token: 'var(--color-critical)' },
};

const NEXT_STAGE: Partial<Record<QueueStage, QueueStage>> = {
  SCHEDULED: 'CHECKED_IN',
  CHECKED_IN: 'WAITING',
  WAITING: 'IN_CHAIR',
  IN_CHAIR: 'IN_TREATMENT',
  IN_TREATMENT: 'BILLING',
  BILLING: 'COMPLETED',
};

/** Stages that cannot be walked back and therefore require confirmation. */
const TERMINAL: QueueStage[] = ['COMPLETED', 'NO_SHOW', 'CANCELLED'];

const ACTIVE_STAGES: QueueStage[] = ['CHECKED_IN', 'WAITING', 'IN_CHAIR', 'IN_TREATMENT', 'BILLING'];
const ARRIVED_STAGES: QueueStage[] = ['CHECKED_IN', 'WAITING'];

/**
 * Display thresholds only. These are presentation conventions, NOT clinical
 * norms — the data model carries no procedure duration, so the cockpit never
 * claims a chair is "overrunning". Long waits are tinted; nothing is alarmed.
 */
const WAIT_NOTICE_MIN = 10;
const WAIT_URGENT_MIN = 20;
/**
 * Beyond a working day the underlying timestamp is stale, not real. A chair
 * record can keep `occupiedSince` after it is freed, which otherwise renders as
 * "776m in chair" — a confidently wrong number, which is worse than none.
 */
const STALE_MINUTES = 12 * 60;

const parseTimeToMinutes = (t?: string): number | null => {
  if (!t) return null;
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(t.trim());
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
};

const formatHourLabel = (min: number): string => {
  const h = Math.floor(min / 60);
  return `${((h + 11) % 12) + 1}${h < 12 ? 'a' : 'p'}`;
};

const formatClock = (min: number): string => {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const ap = h24 < 12 ? 'AM' : 'PM';
  const h = ((h24 + 11) % 12) + 1;
  return `${h}:${String(m).padStart(2, '0')} ${ap}`;
};

/** Live minutes elapsed since a wall-clock string. Null when unknowable. */
const minutesSince = (t: string | undefined, now: number | null): number | null => {
  if (now === null) return null;
  const start = parseTimeToMinutes(t);
  if (start === null) return null;
  const d = now - start;
  if (d < 0 || d > STALE_MINUTES) return null;
  return d;
};

/** How long a patient has actually been waiting, ticking. */
const liveWait = (e: QueueEntry, now: number | null): number | null => {
  const fromCheckIn = minutesSince(e.checkInTime, now);
  if (fromCheckIn !== null) return fromCheckIn;
  // Seeded fallback. Never invented — only used when checkInTime is absent.
  return e.waitingMinutes > 0 ? e.waitingMinutes : null;
};

const waitTone = (m: number | null): string =>
  m === null ? 'text-muted-foreground'
    : m >= WAIT_URGENT_MIN ? 'text-[var(--color-critical)]'
      : m >= WAIT_NOTICE_MIN ? 'text-[var(--color-attention)]'
        : 'text-muted-foreground';

/** An em-dash beats a confidently wrong number on a clinical board. */
const Dash = () => <span className="text-muted-foreground/50">—</span>;

export function ClinicLiveCockpit() {
  const reduce = useReducedMotion() ?? false;

  const [chairs, setChairs] = useState<OperatoryChair[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  /**
   * null until the first client tick. Previously this initialised to 0, so the
   * first paint computed every elapsed timer and the now-line against midnight.
   * Rendering nothing is safe; rendering a wrong live number is not.
   */
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const [canUndo, setCanUndo] = useState(false);

  const undoRef = useRef<{ chairs: OperatoryChair[]; queue: QueueEntry[] } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setChairs(getOperatoryChairs());
    setQueue(getQueueEntries());
    const tick = () => {
      const d = new Date();
      setNowMinutes(d.getHours() * 60 + d.getMinutes());
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => {
      clearInterval(id);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  /* ── Single writer ───────────────────────────────────────────────────────
   * Every mutation goes through commit(). Previously two handlers each wrote
   * only one collection, so advancing a patient never freed their chair and the
   * two records drifted apart. One write path makes that desync structurally
   * impossible rather than a rule each new handler has to remember, and gives
   * undo + the screen-reader announcement a single choke point.
   * ──────────────────────────────────────────────────────────────────────── */
  const commit = useCallback(
    (next: { chairs?: OperatoryChair[]; queue?: QueueEntry[] }, announce: string) => {
      undoRef.current = { chairs, queue };
      const nextChairs = next.chairs ?? chairs;
      const nextQueue = next.queue ?? queue;
      setChairs(nextChairs);
      setQueue(nextQueue);
      saveOperatoryChairs(nextChairs);
      saveQueueEntries(nextQueue);
      setAnnouncement(announce);
      setCanUndo(true);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setCanUndo(false), 10_000);
    },
    [chairs, queue],
  );

  const undo = useCallback(() => {
    const snap = undoRef.current;
    if (!snap) return;
    setChairs(snap.chairs);
    setQueue(snap.queue);
    saveOperatoryChairs(snap.chairs);
    saveQueueEntries(snap.queue);
    undoRef.current = null;
    setCanUndo(false);
    setAnnouncement('Last change undone.');
  }, []);

  /* ── Derived ─────────────────────────────────────────────────────────────── */

  const inClinic = useMemo(() => queue.filter((q) => ACTIVE_STAGES.includes(q.stage)).length, [queue]);
  const inChair = useMemo(
    () => queue.filter((q) => q.stage === 'IN_CHAIR' || q.stage === 'IN_TREATMENT').length,
    [queue],
  );
  const waitingEntries = useMemo(
    () => queue.filter((q) => ARRIVED_STAGES.includes(q.stage)),
    [queue],
  );

  /** Longest live wait — actionable, unlike an average over a handful of rows. */
  const longestWait = useMemo(() => {
    if (nowMinutes === null) return null;
    const vals = waitingEntries.map((e) => liveWait(e, nowMinutes)).filter((v): v is number => v !== null);
    return vals.length ? Math.max(...vals) : 0;
  }, [waitingEntries, nowMinutes]);

  const nextScheduled = useMemo(() => {
    if (nowMinutes === null) return null;
    return queue
      .filter((q) => q.stage === 'SCHEDULED')
      .map((q) => ({ q, mins: parseTimeToMinutes(q.scheduledTime) }))
      .filter((x): x is { q: QueueEntry; mins: number } => x.mins !== null && x.mins >= nowMinutes - 5)
      .sort((a, b) => a.mins - b.mins)[0]?.q ?? null;
  }, [queue, nowMinutes]);

  /** Waiting first (longest first), then scheduled by time. One clinic queue. */
  const onDeck = useMemo(() => {
    const arrived = waitingEntries
      .slice()
      .sort((a, b) => (liveWait(b, nowMinutes) ?? 0) - (liveWait(a, nowMinutes) ?? 0));
    const later = queue
      .filter((q) => q.stage === 'SCHEDULED')
      .slice()
      .sort((a, b) => (parseTimeToMinutes(a.scheduledTime) ?? 0) - (parseTimeToMinutes(b.scheduledTime) ?? 0));
    return [...arrived, ...later];
  }, [waitingEntries, queue, nowMinutes]);

  const freeChairs = useMemo(() => chairs.filter((c) => c.status === 'AVAILABLE'), [chairs]);

  /**
   * One pass, one patient per chair. The old code computed "next up" separately
   * inside every idle chair card, so all of them offered a Bring-in button for
   * the SAME patient — clicking two seated one person into two rooms.
   * Prefers a chair whose assigned dentist matches the patient's.
   */
  const seatPlan = useMemo(() => {
    const plan = new Map<string, QueueEntry>();
    const taken = new Set<string>();
    const ready = onDeck.filter((e) => ARRIVED_STAGES.includes(e.stage));

    // Pass 1 — dentist match, evaluated across EVERY free room before any
    // greedy fill. A single pass let whichever room came first in the array
    // grab the patient, so someone could be offered a chair belonging to a
    // different dentist while their own room sat empty.
    freeChairs.forEach((chair) => {
      const pick = ready.find(
        (e) => !taken.has(e.id) && chair.doctorName && e.doctorName === chair.doctorName,
      );
      if (pick) {
        plan.set(chair.id, pick);
        taken.add(pick.id);
      }
    });

    // Pass 2 — fill the rest by longest wait (onDeck is already sorted).
    freeChairs.forEach((chair) => {
      if (plan.has(chair.id)) return;
      const pick = ready.find((e) => !taken.has(e.id));
      if (pick) {
        plan.set(chair.id, pick);
        taken.add(pick.id);
      }
    });

    return plan;
  }, [freeChairs, onDeck]);

  const focusedEntry = useMemo(() => {
    if (selectedQueueId) return queue.find((q) => q.id === selectedQueueId) ?? null;
    const urgent = waitingEntries
      .slice()
      .sort((a, b) => (liveWait(b, nowMinutes) ?? 0) - (liveWait(a, nowMinutes) ?? 0))[0];
    if (urgent && (liveWait(urgent, nowMinutes) ?? 0) >= WAIT_URGENT_MIN) return urgent;
    return (
      queue.find((q) => q.stage === 'IN_CHAIR' || q.stage === 'IN_TREATMENT') ??
      urgent ??
      onDeck[0] ??
      null
    );
  }, [selectedQueueId, queue, waitingEntries, onDeck, nowMinutes]);

  const timelineDomain = useMemo(() => {
    const times = queue.map((q) => parseTimeToMinutes(q.scheduledTime)).filter((v): v is number => v !== null);
    if (!times.length) return { start: 9 * 60, end: 18 * 60 };
    const start = Math.floor(Math.min(...times) / 60) * 60;
    const end = Math.max(Math.ceil((Math.max(...times) + 45) / 60) * 60, start + 120);
    return { start, end };
  }, [queue]);

  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let m = timelineDomain.start; m <= timelineDomain.end; m += 60) marks.push(m);
    return marks;
  }, [timelineDomain]);

  const span = timelineDomain.end - timelineDomain.start;
  const pctOf = (mins: number) => ((mins - timelineDomain.start) / span) * 100;

  const nowPct = useMemo(() => {
    if (nowMinutes === null) return null;
    if (nowMinutes < timelineDomain.start || nowMinutes > timelineDomain.end) return null;
    return pctOf(nowMinutes);
  }, [nowMinutes, timelineDomain]);

  /**
   * Greedy lane packing so simultaneous appointments never z-fight. Every
   * appointment gets a row — nothing is hidden behind a "+n", because the board
   * matters most exactly when the clinic is busiest.
   */
  const lanes = useMemo(() => {
    const placed = queue
      .map((e) => ({ e, mins: parseTimeToMinutes(e.scheduledTime) }))
      .filter((x): x is { e: QueueEntry; mins: number } => x.mins !== null)
      .sort((a, b) => a.mins - b.mins);
    const laneEnds: number[] = [];
    return placed.map(({ e, mins }) => {
      const pct = pctOf(mins);
      // ~11% of track reserved per chip label; keeps chips from overlapping.
      let lane = laneEnds.findIndex((end) => pct >= end);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(0);
      }
      laneEnds[lane] = pct + 11;
      return { entry: e, mins, pct, lane };
    });
  }, [queue, timelineDomain]);

  const laneCount = Math.max(1, ...lanes.map((l) => l.lane + 1));

  /* ── Mutations ───────────────────────────────────────────────────────────── */

  const seat = useCallback(
    (entryId: string, chairId: string) => {
      const entry = queue.find((q) => q.id === entryId);
      const chair = chairs.find((c) => c.id === chairId);
      if (!entry || !chair || nowMinutes === null) return;
      const clock = formatClock(nowMinutes);
      commit(
        {
          queue: queue.map((q) =>
            q.id === entryId ? { ...q, stage: 'IN_CHAIR' as QueueStage, chairId: chair.id, chairName: chair.name } : q,
          ),
          chairs: chairs.map((c) =>
            c.id === chairId
              ? {
                  ...c,
                  status: 'OCCUPIED' as const,
                  currentPatientId: entry.patientId,
                  currentPatientName: entry.patientName,
                  currentProcedure: entry.treatmentType,
                  occupiedSince: clock,
                }
              : c,
          ),
        },
        `${entry.patientName} seated in ${chair.name}.`,
      );
    },
    [queue, chairs, nowMinutes, commit],
  );

  const advance = useCallback(
    (entryId: string) => {
      const entry = queue.find((q) => q.id === entryId);
      if (!entry) return;
      const next = NEXT_STAGE[entry.stage];
      if (!next) return;

      // Irreversible transitions require a deliberate second press.
      if (TERMINAL.includes(next) && confirmingId !== entryId) {
        setConfirmingId(entryId);
        if (confirmTimer.current) clearTimeout(confirmTimer.current);
        confirmTimer.current = setTimeout(() => setConfirmingId(null), 5_000);
        return;
      }
      setConfirmingId(null);

      const nextQueue = queue.map((q) => (q.id === entryId ? { ...q, stage: next } : q));
      let nextChairs = chairs;
      // Finishing frees the room: flip it to CLEANING and clear the occupant,
      // so a completed patient can never linger on a chair record.
      if (TERMINAL.includes(next) && entry.chairId && nowMinutes !== null) {
        nextChairs = chairs.map((c) =>
          c.id === entry.chairId
            ? {
                ...c,
                status: 'CLEANING' as const,
                currentPatientId: undefined,
                currentPatientName: undefined,
                currentProcedure: undefined,
                occupiedSince: formatClock(nowMinutes),
              }
            : c,
        );
      }
      commit({ queue: nextQueue, chairs: nextChairs }, `${entry.patientName} moved to ${STAGE[next].label}.`);
    },
    [queue, chairs, confirmingId, nowMinutes, commit],
  );

  const releaseChair = useCallback(
    (chairId: string) => {
      const chair = chairs.find((c) => c.id === chairId);
      if (!chair) return;
      commit(
        {
          chairs: chairs.map((c) =>
            c.id === chairId
              ? {
                  ...c,
                  status: 'AVAILABLE' as const,
                  currentPatientId: undefined,
                  currentPatientName: undefined,
                  currentProcedure: undefined,
                  occupiedSince: undefined,
                }
              : c,
          ),
        },
        `${chair.name} is ready.`,
      );
    },
    [chairs, commit],
  );

  if (chairs.length === 0 && queue.length === 0) return null;

  const tween = reduce ? { duration: 0 } : { duration: 0.16, ease: [0.32, 0.72, 0, 1] as const };

  return (
    <Card className="@container/cockpit border-border bg-card overflow-hidden p-0 divide-y divide-border/60">
      {/* Screen-reader channel for every mutation. */}
      <span aria-live="polite" className="sr-only">{announcement}</span>

      {/* ── A · STATUS LEDGER ────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 h-11">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] shrink-0" aria-hidden />
        <span className="text-[13px] font-semibold tracking-tight text-foreground">Today</span>

        <div className="ml-auto flex items-stretch divide-x divide-border/50 text-right">
          <Metric label="In clinic" value={inClinic} />
          <Metric label="In chair" value={inChair} />
          <Metric label="Waiting" value={waitingEntries.length} />
          <Metric
            label="Longest wait"
            value={longestWait}
            suffix="m"
            tone={waitTone(longestWait)}
          />
          <div className="px-3 flex flex-col justify-center min-w-[5.5rem]">
            <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground leading-none">Next</span>
            <span className={`${NUM} text-[12px] font-semibold text-foreground leading-tight mt-1 truncate`}>
              {nextScheduled ? nextScheduled.scheduledTime.replace(/\s?(AM|PM)/i, '') : <Dash />}
            </span>
          </div>
        </div>
      </div>

      {/* ── B · OPERATORIES + ON DECK ────────────────────────────────────── */}
      <div className="grid @[900px]/cockpit:grid-cols-[minmax(0,1fr)_17rem] @[900px]/cockpit:divide-x divide-border/60">
        {/* Operatory rows. One aligned grid, not three cards — an idle room no
            longer occupies the same third of the viewport as an active one. */}
        <div role="table" aria-label="Operatory status" className="py-1">
          {chairs.map((chair) => {
            const bound = queue.find(
              (q) => q.chairId === chair.id && (q.stage === 'IN_CHAIR' || q.stage === 'IN_TREATMENT'),
            );
            const occupied = chair.status === 'OCCUPIED';
            const cleaning = chair.status === 'CLEANING';
            const blocked = chair.status === 'MAINTENANCE';
            // Elapsed time only means something while a room is in use or
            // turning over. An AVAILABLE chair can still carry a stale
            // `occupiedSince`, which previously rendered as a live timer on an
            // idle room.
            const elapsed =
              chair.status === 'OCCUPIED' || chair.status === 'CLEANING'
                ? minutesSince(chair.occupiedSince, nowMinutes)
                : null;
            const planned = seatPlan.get(chair.id);

            const statusWord = occupied ? 'In use' : cleaning ? 'Cleaning' : blocked ? 'Closed' : 'Free';
            const statusToken = occupied
              ? 'var(--color-primary)'
              : cleaning
                ? 'var(--color-attention)'
                : blocked
                  ? 'var(--color-critical)'
                  : 'var(--color-success)';

            return (
              <div
                key={chair.id}
                role="row"
                style={{ ['--stage' as string]: statusToken }}
                className={`grid grid-cols-[3px_4.25rem_minmax(6rem,1.4fr)_minmax(0,1fr)_3.5rem_auto] items-center gap-x-3 px-4 border-b border-border/40 last:border-b-0 ${
                  occupied ? 'py-2.5' : 'py-1.5'
                }`}
              >
                <span className="h-6 w-[3px] rounded-full bg-[var(--stage)]" aria-hidden />

                <div className="min-w-0">
                  <div className={`${NUM} text-[11px] tracking-wider text-foreground`}>{chair.roomNumber}</div>
                  {/* Status is always stated in words, never colour alone. */}
                  <div className="text-[10px] uppercase tracking-[0.1em] text-[var(--stage)] leading-tight">
                    {statusWord}
                  </div>
                </div>

                <div className="min-w-0">
                  {occupied && (bound || chair.currentPatientName) ? (
                    bound ? (
                      <Link
                        href={`/patients/${bound.patientId}`}
                        className="text-[13px] font-semibold text-foreground hover:underline truncate block"
                      >
                        {bound.patientName}
                      </Link>
                    ) : (
                      <span className="text-[13px] font-semibold text-foreground truncate block">
                        {chair.currentPatientName}
                      </span>
                    )
                  ) : (
                    <span className="text-[12px] text-muted-foreground">
                      {cleaning ? 'Being cleaned' : blocked ? 'Closed' : 'Empty'}
                    </span>
                  )}
                </div>

                <div className="min-w-0 text-[11px] text-muted-foreground truncate">
                  {occupied ? bound?.treatmentType ?? chair.currentProcedure ?? '' : chair.doctorName ?? ''}
                </div>

                <div className={`${NUM} text-[11px] text-right ${cleaning ? 'text-[var(--color-attention)]' : 'text-muted-foreground'}`}>
                  {elapsed !== null ? `${elapsed}m` : <Dash />}
                </div>

                <div className="flex justify-end">
                  {occupied && bound ? (
                    <RowButton
                      onClick={() => advance(bound.id)}
                      confirming={confirmingId === bound.id}
                      label={
                        confirmingId === bound.id
                          ? 'Confirm?'
                          : NEXT_STAGE[bound.stage]
                            ? STAGE[NEXT_STAGE[bound.stage]!].label
                            : '—'
                      }
                      aria-label={`Advance ${bound.patientName} in ${chair.name}`}
                    />
                  ) : cleaning || blocked ? (
                    <RowButton onClick={() => releaseChair(chair.id)} label="Ready" aria-label={`Mark ${chair.name} ready`} />
                  ) : planned ? (
                    <RowButton
                      onClick={() => seat(planned.id, chair.id)}
                      label={`Seat ${planned.patientName.split(' ')[0]}`}
                      aria-label={`Seat ${planned.patientName} in ${chair.name}`}
                      primary
                    />
                  ) : (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Free</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* On deck — the single clinic queue, rendered once. */}
        <div className="px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5 px-1">
            Waiting · <span className={NUM}>{onDeck.length}</span>
          </div>
          <AnimatePresence initial={false}>
            {onDeck.slice(0, 5).map((e) => {
              const wait = ARRIVED_STAGES.includes(e.stage) ? liveWait(e, nowMinutes) : null;
              const isFocused = focusedEntry?.id === e.id;
              return (
                <motion.button
                  key={e.id}
                  layout={!reduce}
                  initial={reduce ? false : { opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, x: 8 }}
                  transition={tween}
                  type="button"
                  onClick={() => setSelectedQueueId(isFocused ? null : e.id)}
                  aria-pressed={isFocused}
                  className={`w-full grid grid-cols-[2.75rem_minmax(0,1fr)_auto] gap-x-2 items-baseline px-1 py-1.5 rounded-md text-left transition-colors duration-150 motion-reduce:transition-none ${
                    isFocused ? 'bg-muted/60' : 'hover:bg-muted/40'
                  }`}
                >
                  <span className={`${NUM} text-[11px] text-muted-foreground`}>
                    {e.scheduledTime.replace(/\s?(AM|PM)/i, '')}
                  </span>
                  <span className="text-[12px] text-foreground truncate flex items-center gap-1">
                    {e.notes && (
                      <AlertTriangle
                        className="w-3 h-3 shrink-0 text-[var(--color-attention)]"
                        aria-label="Has clinical note"
                      />
                    )}
                    {e.patientName}
                  </span>
                  <span className={`${NUM} text-[11px] ${wait !== null ? waitTone(wait) : 'text-muted-foreground/60'}`}>
                    {wait !== null ? `${wait}m` : 'sched'}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
          {onDeck.length === 0 && (
            <p className="text-[11px] text-muted-foreground px-1 py-2">Nobody waiting.</p>
          )}
        </div>
      </div>

      {/* ── C · FLOW LANE ────────────────────────────────────────────────── */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Schedule</span>
          <span className={`${NUM} text-[10px] text-muted-foreground/70`}>{lanes.length}</span>
        </div>

        {/* Below ~640px the Gantt becomes noise, so it is replaced by a compact
            list — never removed outright, since a phone is exactly where you
            check who is next. */}
        <div className="@[640px]/cockpit:hidden space-y-1">
          {lanes.slice(0, 4).map(({ entry }) => (
            <div key={entry.id} className="flex items-center gap-2 text-[11px]">
              <span className={`${NUM} text-muted-foreground w-14`}>
                {entry.scheduledTime.replace(/\s?(AM|PM)/i, '')}
              </span>
              <span className="text-foreground truncate">{entry.patientName}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{STAGE[entry.stage].label}</span>
            </div>
          ))}
        </div>

        <div className="hidden @[640px]/cockpit:block">
          <div className="relative h-3">
            {hourMarks.map((m) => (
              <span
                key={m}
                style={{ left: `${pctOf(m)}%` }}
                className={`${NUM} absolute -translate-x-1/2 text-[10px] text-muted-foreground`}
              >
                {formatHourLabel(m)}
              </span>
            ))}
          </div>

          <div
            className="relative border-t border-border/40"
            style={{
              height: `${laneCount * 26 + 6}px`,
              // Hour gridlines as one gradient rather than N absolute spans.
              backgroundImage:
                'repeating-linear-gradient(to right, var(--color-border) 0 1px, transparent 1px 100%)',
              backgroundSize: `${100 / Math.max(1, hourMarks.length - 1)}% 100%`,
              opacity: 0.999,
            }}
          >
            {lanes.map(({ entry, pct, lane }) => {
              const isFocused = focusedEntry?.id === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setSelectedQueueId(isFocused ? null : entry.id)}
                  style={{ left: `${pct}%`, top: `${lane * 26 + 4}px`, ['--stage' as string]: STAGE[entry.stage].token }}
                  className={`absolute flex items-center gap-1.5 h-[20px] pl-1.5 pr-2 rounded-[3px] border whitespace-nowrap transition-[opacity,box-shadow] duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    isFocused ? 'opacity-100 ring-1 ring-ring' : 'opacity-75 hover:opacity-100'
                  }`}
                  aria-label={`${entry.patientName}, ${entry.scheduledTime}, ${STAGE[entry.stage].label}`}
                >
                  <span className="absolute left-0 top-0 bottom-0 w-[2px] rounded-l-[3px] bg-[var(--stage)]" aria-hidden />
                  <span className={`${NUM} text-[10px] text-muted-foreground`}>
                    {entry.scheduledTime.replace(/\s?(AM|PM)/i, '')}
                  </span>
                  <span className="text-[11px] text-foreground">{entry.patientName.split(' ')[0]}</span>
                </button>
              );
            })}

            {/* Now-line. The marker layer is FULL WIDTH so a percentage
                translate resolves against the track; translating a zero-width
                element by a percentage would move it by zero. */}
            {nowPct !== null && (
              <motion.div
                className="absolute inset-y-0 left-0 w-full pointer-events-none"
                initial={false}
                animate={{ x: `${nowPct}%` }}
                transition={reduce ? { duration: 0 } : { duration: 0.6, ease: 'linear' }}
                aria-hidden
              >
                <span className="absolute inset-y-0 left-0 w-px bg-primary" />
                <span className="absolute -top-[3px] -left-[3px] w-[7px] h-[7px] rounded-full bg-primary" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── D · FOCUS STRIP ──────────────────────────────────────────────── */}
      {focusedEntry && (
        <div
          className="flex items-center gap-3 px-4 h-12"
          style={{ ['--stage' as string]: STAGE[focusedEntry.stage].token }}
        >
          <span className="h-6 w-[3px] rounded-full bg-[var(--stage)] shrink-0" aria-hidden />
          <span className={`${NUM} text-[11px] text-muted-foreground shrink-0`}>{focusedEntry.scheduledTime}</span>
          <Link
            href={`/patients/${focusedEntry.patientId}`}
            className="text-[13px] font-semibold text-foreground hover:underline shrink-0"
          >
            {focusedEntry.patientName}
          </Link>
          <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--stage)] shrink-0">
            {STAGE[focusedEntry.stage].label}
          </span>

          <FocusTimer entry={focusedEntry} chairs={chairs} now={nowMinutes} />

          {focusedEntry.notes && (
            <span className="flex items-center gap-1 min-w-0 text-[11px] text-[var(--color-attention)]">
              <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden />
              <span className="truncate">{focusedEntry.notes}</span>
            </span>
          )}

          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            {canUndo && (
              <button
                type="button"
                onClick={undo}
                className="flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 motion-reduce:transition-none"
              >
                <Undo2 className="w-3 h-3" /> Undo
              </button>
            )}
            {focusedEntry.patientPhone && (
              <a
                href={`https://wa.me/${focusedEntry.patientPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                aria-label={`WhatsApp ${focusedEntry.patientName}`}
                className="grid place-items-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 motion-reduce:transition-none"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </a>
            )}
            {NEXT_STAGE[focusedEntry.stage] && (
              <RowButton
                primary
                confirming={confirmingId === focusedEntry.id}
                onClick={() => advance(focusedEntry.id)}
                label={
                  confirmingId === focusedEntry.id
                    ? 'Confirm'
                    : STAGE[NEXT_STAGE[focusedEntry.stage]!].label
                }
                aria-label={`Advance ${focusedEntry.patientName} to ${STAGE[NEXT_STAGE[focusedEntry.stage]!].label}`}
              />
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ── Small pieces ─────────────────────────────────────────────────────────── */

function Metric({
  label,
  value,
  suffix = '',
  tone = 'text-foreground',
}: {
  label: string;
  value: number | null;
  suffix?: string;
  tone?: string;
}) {
  return (
    <div className="px-3 flex flex-col justify-center min-w-[3.75rem]">
      <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground leading-none">{label}</span>
      <span className={`${NUM} text-[13px] font-semibold leading-tight mt-1 ${tone}`}>
        {value === null ? <Dash /> : `${value}${suffix}`}
      </span>
    </div>
  );
}

function RowButton({
  label,
  onClick,
  primary,
  confirming,
  ...rest
}: {
  label: string;
  onClick: () => void;
  primary?: boolean;
  confirming?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-7 px-2.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
        confirming
          ? 'bg-[var(--color-critical)] text-white'
          : primary
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
      {...rest}
    >
      {label}
    </button>
  );
}

/** Live "28m in chair" / "12m wait", plus punctuality when it is knowable. */
function FocusTimer({
  entry,
  chairs,
  now,
}: {
  entry: QueueEntry;
  chairs: OperatoryChair[];
  now: number | null;
}) {
  const inChair = entry.stage === 'IN_CHAIR' || entry.stage === 'IN_TREATMENT';
  const chair = entry.chairId ? chairs.find((c) => c.id === entry.chairId) : undefined;
  const mins = inChair ? minutesSince(chair?.occupiedSince, now) : liveWait(entry, now);

  const sched = parseTimeToMinutes(entry.scheduledTime);
  const arrived = parseTimeToMinutes(entry.checkInTime);
  const punctuality =
    sched !== null && arrived !== null
      ? arrived <= sched
        ? `${sched - arrived}m early`
        : `${arrived - sched}m late`
      : null;

  return (
    <span className={`${NUM} text-[11px] text-muted-foreground shrink-0`}>
      {mins !== null ? `${mins}m ${inChair ? 'in chair' : 'wait'}` : <Dash />}
      {punctuality && <span className="text-muted-foreground/70"> · {punctuality}</span>}
    </span>
  );
}
