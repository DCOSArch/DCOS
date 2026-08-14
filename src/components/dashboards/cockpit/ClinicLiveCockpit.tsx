'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { OperatoryChair, QueueEntry, QueueStage, ChairStatus } from '@/types';
import {
  getOperatoryChairs,
  saveOperatoryChairs,
  getQueueEntries,
  saveQueueEntries,
} from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Activity, Clock, MessageSquare, ChevronRight, Sparkle, Users, Timer, ArrowRight,
} from 'lucide-react';

const STAGE_STYLES: Record<QueueStage, { label: string; color: string; ring: string; bg: string }> = {
  SCHEDULED:    { label: 'Scheduled',    color: '#64748b', ring: 'ring-slate-500/40',    bg: 'rgba(100,116,139,0.18)' },
  CHECKED_IN:   { label: 'Checked in',   color: '#10b981', ring: 'ring-emerald-500/40',  bg: 'rgba(16,185,129,0.20)' },
  WAITING:      { label: 'Waiting',      color: '#f59e0b', ring: 'ring-amber-500/40',    bg: 'rgba(245,158,11,0.22)' },
  IN_CHAIR:     { label: 'In chair',     color: '#ef4444', ring: 'ring-red-500/40',      bg: 'rgba(239,68,68,0.22)' },
  IN_TREATMENT: { label: 'In treatment', color: '#8b5cf6', ring: 'ring-violet-500/40',   bg: 'rgba(139,92,246,0.22)' },
  BILLING:      { label: 'Billing',      color: '#f97316', ring: 'ring-orange-500/40',   bg: 'rgba(249,115,22,0.22)' },
  COMPLETED:    { label: 'Completed',    color: '#059669', ring: 'ring-emerald-600/40',  bg: 'rgba(5,150,105,0.20)' },
  NO_SHOW:      { label: 'No show',      color: '#71717a', ring: 'ring-zinc-500/40',     bg: 'rgba(113,113,122,0.18)' },
  CANCELLED:    { label: 'Cancelled',    color: '#dc2626', ring: 'ring-red-600/40',      bg: 'rgba(220,38,38,0.20)' },
};

const NEXT_STAGE: Partial<Record<QueueStage, QueueStage>> = {
  SCHEDULED: 'CHECKED_IN',
  CHECKED_IN: 'WAITING',
  WAITING: 'IN_CHAIR',
  IN_CHAIR: 'IN_TREATMENT',
  IN_TREATMENT: 'BILLING',
  BILLING: 'COMPLETED',
};

const ACTIVE_STAGES: QueueStage[] = ['CHECKED_IN', 'WAITING', 'IN_CHAIR', 'IN_TREATMENT', 'BILLING'];

// Parse "10:30 AM" → minutes since midnight
const parseTimeToMinutes = (t: string): number => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(t.trim());
  if (!m) return 0;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = (m[3] || '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return h * 60 + min;
};

const formatHourLabel = (min: number): string => {
  const h = Math.floor(min / 60);
  const suffix = h < 12 ? 'a' : 'p';
  const disp = ((h + 11) % 12) + 1;
  return `${disp}${suffix}`;
};

export function ClinicLiveCockpit() {
  const [chairs, setChairs] = useState<OperatoryChair[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [nowMinutes, setNowMinutes] = useState<number>(0);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChairs(getOperatoryChairs());
    setQueue(getQueueEntries());
    const tick = () => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const activeInClinic = useMemo(
    () => queue.filter(q => ACTIVE_STAGES.includes(q.stage)),
    [queue],
  );

  const waitingCount = useMemo(() => queue.filter(q => q.stage === 'WAITING').length, [queue]);
  const inChairCount = useMemo(() => queue.filter(q => q.stage === 'IN_CHAIR' || q.stage === 'IN_TREATMENT').length, [queue]);
  const scheduledCount = useMemo(() => queue.filter(q => q.stage === 'SCHEDULED').length, [queue]);

  const nextAppointment = useMemo(() => {
    const future = queue
      .filter(q => q.stage === 'SCHEDULED')
      .map(q => ({ q, mins: parseTimeToMinutes(q.scheduledTime) }))
      .filter(x => x.mins >= nowMinutes - 5)
      .sort((a, b) => a.mins - b.mins);
    return future[0] || null;
  }, [queue, nowMinutes]);

  const avgWait = useMemo(() => {
    const waits = queue.filter(q => q.stage === 'WAITING' && q.waitingMinutes > 0).map(q => q.waitingMinutes);
    if (!waits.length) return 0;
    return Math.round(waits.reduce((a, b) => a + b, 0) / waits.length);
  }, [queue]);

  // Timeline domain: earliest scheduled → latest scheduled + 60m
  const timelineDomain = useMemo(() => {
    if (!queue.length) return { start: 9 * 60, end: 18 * 60 };
    const times = queue.map(q => parseTimeToMinutes(q.scheduledTime));
    const min = Math.min(...times);
    const max = Math.max(...times);
    const start = Math.floor(min / 60) * 60;
    const end = Math.ceil((max + 45) / 60) * 60;
    return { start, end: Math.max(end, start + 120) };
  }, [queue]);

  const timelineHourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let m = timelineDomain.start; m <= timelineDomain.end; m += 60) marks.push(m);
    return marks;
  }, [timelineDomain]);

  const nowInDomain =
    nowMinutes >= timelineDomain.start && nowMinutes <= timelineDomain.end
      ? ((nowMinutes - timelineDomain.start) / (timelineDomain.end - timelineDomain.start)) * 100
      : null;

  const handleAdvance = (qId: string) => {
    const updated = queue.map(q => {
      if (q.id !== qId) return q;
      const next = NEXT_STAGE[q.stage] ?? 'COMPLETED';
      return { ...q, stage: next };
    });
    setQueue(updated);
    saveQueueEntries(updated);
  };

  const handleCycleChair = (chairId: string) => {
    const updated = chairs.map(c => {
      if (c.id !== chairId) return c;
      const next: ChairStatus =
        c.status === 'AVAILABLE' ? 'OCCUPIED' : c.status === 'OCCUPIED' ? 'CLEANING' : 'AVAILABLE';
      return { ...c, status: next };
    });
    setChairs(updated);
    saveOperatoryChairs(updated);
  };

  const focusedEntry = useMemo(() => {
    if (selectedQueueId) return queue.find(q => q.id === selectedQueueId) || null;
    // Auto-focus: first in-chair, otherwise longest waiting
    return (
      queue.find(q => q.stage === 'IN_CHAIR' || q.stage === 'IN_TREATMENT') ||
      queue.filter(q => q.stage === 'WAITING').sort((a, b) => b.waitingMinutes - a.waitingMinutes)[0] ||
      queue.filter(q => q.stage === 'SCHEDULED').sort((a, b) => parseTimeToMinutes(a.scheduledTime) - parseTimeToMinutes(b.scheduledTime))[0] ||
      null
    );
  }, [queue, selectedQueueId]);

  const emptyState = chairs.length === 0 && queue.length === 0;
  if (emptyState) return null;

  return (
    <Card className="relative overflow-hidden border-border bg-gradient-to-br from-card via-card to-slate-950/40 shadow-sm">
      {/* Ambient pulse background */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      {/* Header + pulse bar */}
      <div className="relative px-5 py-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
            <span className="relative block w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold tracking-tight text-foreground">Clinic Live</h2>
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Cockpit
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Real-time chair status, patient flow, and today's schedule — one glance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Pill icon={<Users className="w-3 h-3" />} label="In clinic" value={activeInClinic.length} tone="primary" />
          <Pill icon={<Sparkle className="w-3 h-3" />} label="In chair" value={inChairCount} tone="red" />
          <Pill icon={<Clock className="w-3 h-3" />} label="Waiting" value={waitingCount} tone="amber" />
          <Pill icon={<Timer className="w-3 h-3" />} label="Avg wait" value={avgWait > 0 ? `${avgWait}m` : '—'} tone="slate" />
          {nextAppointment && (
            <Pill
              icon={<ArrowRight className="w-3 h-3" />}
              label={`Next · ${nextAppointment.q.scheduledTime}`}
              value={nextAppointment.q.patientName.split(' ')[0]}
              tone="emerald"
            />
          )}
        </div>
      </div>

      {/* Chair channels */}
      {chairs.length > 0 && (
        <div className="relative px-5 pt-4 pb-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {chairs.map(chair => {
              const isOccupied = chair.status === 'OCCUPIED';
              const isAvailable = chair.status === 'AVAILABLE';
              const isCleaning = chair.status === 'CLEANING';

              const chairPatient = isOccupied
                ? queue.find(q => q.chairId === chair.id) ||
                  { patientName: chair.currentPatientName, patientId: chair.currentPatientId, treatmentType: chair.currentProcedure, id: null } as any
                : null;

              const chairQueueEntry = isOccupied
                ? queue.find(q => q.chairId === chair.id && (q.stage === 'IN_CHAIR' || q.stage === 'IN_TREATMENT'))
                : null;

              const nextForChair = queue
                .filter(q => q.stage === 'WAITING' || q.stage === 'SCHEDULED')
                .sort((a, b) => parseTimeToMinutes(a.scheduledTime) - parseTimeToMinutes(b.scheduledTime))[0];

              const statusMeta = isOccupied
                ? { label: 'Occupied', dot: 'bg-red-500', ring: 'border-red-500/50', tint: 'from-red-500/[0.06] to-transparent', text: 'text-red-500' }
                : isAvailable
                ? { label: 'Ready',    dot: 'bg-emerald-500', ring: 'border-emerald-500/50', tint: 'from-emerald-500/[0.06] to-transparent', text: 'text-emerald-600 dark:text-emerald-400' }
                : { label: 'Cleaning', dot: 'bg-amber-500', ring: 'border-amber-500/50', tint: 'from-amber-500/[0.06] to-transparent', text: 'text-amber-600 dark:text-amber-400' };

              return (
                <div
                  key={chair.id}
                  className={`relative rounded-xl border ${statusMeta.ring} bg-gradient-to-br ${statusMeta.tint} bg-card/40 p-3 flex flex-col gap-2 transition-all hover:shadow-md`}
                >
                  {/* channel bar top */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot} ${isOccupied ? 'animate-pulse' : ''}`} />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {chair.roomNumber}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${statusMeta.text}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground leading-tight">{chair.name}</h3>
                  </div>

                  {/* Body varies by state */}
                  {isOccupied && chairPatient ? (
                    <div className="mt-1 rounded-lg bg-background/60 border border-border/60 p-2 space-y-1">
                      {chairPatient.patientId ? (
                        <Link
                          href={`/patients/${chairPatient.patientId}`}
                          className="text-sm font-semibold text-primary hover:underline block leading-tight"
                        >
                          {chairPatient.patientName}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-foreground">{chairPatient.patientName}</span>
                      )}
                      <p className="text-[11px] text-muted-foreground truncate">
                        {chairPatient.treatmentType || chair.currentProcedure}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                          {chair.occupiedSince ? `since ${chair.occupiedSince}` : 'in session'}
                        </span>
                        {chairQueueEntry && NEXT_STAGE[chairQueueEntry.stage] && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAdvance(chairQueueEntry.id)}
                            className="h-6 px-2 text-[10px] font-semibold text-primary hover:bg-primary/10"
                          >
                            {STAGE_STYLES[NEXT_STAGE[chairQueueEntry.stage]!].label}
                            <ChevronRight className="w-3 h-3 ml-0.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : isCleaning ? (
                    <div className="mt-1 rounded-lg bg-amber-500/[0.06] border border-amber-500/25 p-2">
                      <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Turnover in progress
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {chair.currentProcedure || 'Disinfection cycle'}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1 rounded-lg bg-emerald-500/[0.05] border border-emerald-500/20 p-2 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Ready for next</p>
                        {nextForChair ? (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                            up next · {nextForChair.patientName} · {nextForChair.scheduledTime}
                          </p>
                        ) : (
                          <p className="text-[10px] text-muted-foreground mt-0.5">no one waiting</p>
                        )}
                      </div>
                      {nextForChair && (
                        <Button
                          size="sm"
                          onClick={() => handleAdvance(nextForChair.id)}
                          className="h-7 text-[10px] px-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0"
                        >
                          Bring in
                        </Button>
                      )}
                    </div>
                  )}

                  {/* footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 mt-auto">
                    <span className="text-[10px] text-muted-foreground truncate max-w-[60%]">
                      {chair.doctorName || 'Unassigned'}
                    </span>
                    <button
                      onClick={() => handleCycleChair(chair.id)}
                      className="text-[10px] text-muted-foreground hover:text-foreground font-semibold transition-colors"
                      title="Cycle chair status"
                    >
                      Cycle →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline ribbon */}
      {queue.length > 0 && (
        <div className="relative px-5 pt-3 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                Today's flow
              </span>
              <span className="text-[10px] text-muted-foreground">
                {queue.length} appointment{queue.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              {(['IN_CHAIR', 'WAITING', 'SCHEDULED', 'COMPLETED'] as QueueStage[]).map(s => (
                <span key={s} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_STYLES[s].color }} />
                  {STAGE_STYLES[s].label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative rounded-xl bg-background/40 border border-border/60 p-3">
            {/* hour rail */}
            <div className="relative h-4 mb-2">
              {timelineHourMarks.map(m => {
                const left = ((m - timelineDomain.start) / (timelineDomain.end - timelineDomain.start)) * 100;
                return (
                  <span
                    key={m}
                    className="absolute top-0 -translate-x-1/2 text-[10px] font-mono text-muted-foreground"
                    style={{ left: `${left}%` }}
                  >
                    {formatHourLabel(m)}
                  </span>
                );
              })}
            </div>

            {/* rail */}
            <div ref={timelineRef} className="relative h-16 rounded-lg bg-muted/40 border border-border/50 overflow-visible">
              {/* hour dividers */}
              {timelineHourMarks.map(m => {
                const left = ((m - timelineDomain.start) / (timelineDomain.end - timelineDomain.start)) * 100;
                return (
                  <span
                    key={`div-${m}`}
                    className="absolute top-0 bottom-0 w-px bg-border/60"
                    style={{ left: `${left}%` }}
                  />
                );
              })}

              {/* now line */}
              {nowInDomain !== null && (
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none"
                  style={{ left: `${nowInDomain}%`, transform: 'translateX(-1px)' }}
                >
                  <div className="w-0.5 h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                  <div className="absolute -top-1.5 -left-1 w-2 h-2 rounded-full bg-cyan-400" />
                </div>
              )}

              {/* patient blocks */}
              {queue.map(entry => {
                const start = parseTimeToMinutes(entry.scheduledTime);
                const dur = 30; // assume 30-min slots
                const leftPct = ((start - timelineDomain.start) / (timelineDomain.end - timelineDomain.start)) * 100;
                const widthPct = (dur / (timelineDomain.end - timelineDomain.start)) * 100;
                const style = STAGE_STYLES[entry.stage];
                const isSelected = focusedEntry?.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedQueueId(entry.id)}
                    className={`absolute top-1 bottom-1 rounded-md text-left px-2 flex flex-col justify-center transition-all overflow-hidden border ${
                      isSelected ? 'z-10 ring-2 shadow-lg scale-[1.02] ' + style.ring : 'hover:z-10 hover:shadow-md hover:scale-[1.01]'
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      width: `max(56px, ${widthPct}%)`,
                      backgroundColor: style.bg,
                      borderColor: style.color + '80',
                    }}
                    title={`${entry.patientName} · ${STAGE_STYLES[entry.stage].label}`}
                  >
                    <span className="text-[10px] font-mono opacity-70 leading-none" style={{ color: style.color }}>
                      {entry.scheduledTime}
                    </span>
                    <span className="text-[11px] font-bold text-foreground leading-tight truncate">
                      {entry.patientName}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider truncate" style={{ color: style.color }}>
                      {STAGE_STYLES[entry.stage].label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focus card — the single most-important next action */}
          {focusedEntry && (
            <FocusCard
              entry={focusedEntry}
              onAdvance={handleAdvance}
              onClear={() => setSelectedQueueId(null)}
              isPinned={!!selectedQueueId}
            />
          )}
        </div>
      )}
    </Card>
  );
}

// ---------------- helpers ----------------

function Pill({
  icon, label, value, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: 'primary' | 'red' | 'amber' | 'emerald' | 'slate';
}) {
  const styles: Record<string, string> = {
    primary:  'border-primary/40 text-primary bg-primary/10',
    red:      'border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/10',
    amber:    'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10',
    emerald:  'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    slate:    'border-slate-500/40 text-slate-600 dark:text-slate-300 bg-slate-500/10',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-semibold ${styles[tone]}`}>
      {icon}
      <span className="text-muted-foreground uppercase tracking-wider text-[9px]">{label}</span>
      <span className="font-mono">{value}</span>
    </span>
  );
}

function FocusCard({
  entry, onAdvance, onClear, isPinned,
}: {
  entry: QueueEntry;
  onAdvance: (id: string) => void;
  onClear: () => void;
  isPinned: boolean;
}) {
  const style = STAGE_STYLES[entry.stage];
  const next = NEXT_STAGE[entry.stage];
  const nextLabel = next ? STAGE_STYLES[next].label : null;

  const waPhone = entry.patientPhone?.replace(/[^0-9]/g, '');
  const waLink = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(
        `Hello ${entry.patientName}, checking in on your appointment for ${entry.treatmentType} today at ${entry.scheduledTime}.`
      )}`
    : null;

  return (
    <div
      className="mt-3 rounded-xl border p-3 flex flex-col md:flex-row md:items-center gap-3 transition-all"
      style={{
        borderColor: style.color + '60',
        backgroundColor: style.bg,
      }}
    >
      <div className="flex items-center gap-3 flex-1">
        <div
          className="w-11 h-11 rounded-lg flex flex-col items-center justify-center font-mono border shrink-0"
          style={{ borderColor: style.color + '80', color: style.color, backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <span className="text-[9px] uppercase tracking-wider opacity-70">{entry.scheduledTime.split(' ')[1] || ''}</span>
          <span className="text-xs font-bold">{entry.scheduledTime.split(' ')[0]}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/patients/${entry.patientId}`} className="text-sm font-bold text-foreground hover:text-primary hover:underline truncate">
              {entry.patientName}
            </Link>
            <span
              className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: style.color + '25', color: style.color }}
            >
              {style.label}
            </span>
            {entry.waitingMinutes > 0 && (entry.stage === 'WAITING' || entry.stage === 'CHECKED_IN') && (
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${entry.waitingMinutes > 20 ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'}`}>
                {entry.waitingMinutes}m wait
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            {entry.treatmentType}
            {entry.doctorName && <> · {entry.doctorName}</>}
            {entry.chairName && <> · <span className="text-primary">{entry.chairName}</span></>}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {waLink && (
          <a href={waLink} target="_blank" rel="noreferrer" title="Ping on WhatsApp">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10">
              <MessageSquare className="w-4 h-4" />
            </Button>
          </a>
        )}
        {next ? (
          <Button
            size="sm"
            onClick={() => onAdvance(entry.id)}
            className="h-8 text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: style.color }}
          >
            → {nextLabel}
          </Button>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10">
            Done
          </span>
        )}
        {isPinned && (
          <button
            onClick={onClear}
            className="text-[10px] text-muted-foreground hover:text-foreground font-semibold px-1"
            title="Unpin (auto-focus most urgent)"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
