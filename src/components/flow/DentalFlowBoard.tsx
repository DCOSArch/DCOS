'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OperatoryChair, QueueEntry, QueueStage, ChairStatus } from '@/types';
import {
  getOperatoryChairs,
  saveOperatoryChairs,
  getQueueEntries,
  saveQueueEntries,
} from '@/lib/services';
import {
  Activity,
  Clock,
  User,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Phone,
  MessageSquare,
  AlertCircle,
  Plus,
} from 'lucide-react';

const STAGE_LABELS: Record<QueueStage, { label: string; color: string; bg: string }> = {
  SCHEDULED: { label: 'Scheduled', color: 'var(--primary)', bg: 'rgba(23, 107, 104, 0.1)' },
  CHECKED_IN: { label: 'Checked In', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  WAITING: { label: 'Waiting Room', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  IN_CHAIR: { label: 'In Chair', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  IN_TREATMENT: { label: 'In Treatment', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  BILLING: { label: 'Billing / Rx', color: '#F97316', bg: 'rgba(249, 115, 22, 0.1)' },
  COMPLETED: { label: 'Completed', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
  NO_SHOW: { label: 'No Show', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.1)' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
};

const NEXT_STAGE_MAP: Partial<Record<QueueStage, QueueStage>> = {
  SCHEDULED: 'CHECKED_IN',
  CHECKED_IN: 'WAITING',
  WAITING: 'IN_CHAIR',
  IN_CHAIR: 'IN_TREATMENT',
  IN_TREATMENT: 'BILLING',
  BILLING: 'COMPLETED',
};

export function DentalFlowBoard() {
  const [chairs, setChairs] = useState<OperatoryChair[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);

  useEffect(() => {
    setChairs(getOperatoryChairs());
    setQueue(getQueueEntries());
  }, []);

  const handleToggleChairStatus = (chairId: string) => {
    const updated = chairs.map((c) => {
      if (c.id === chairId) {
        const nextStatus: ChairStatus =
          c.status === 'AVAILABLE' ? 'OCCUPIED' : c.status === 'OCCUPIED' ? 'CLEANING' : 'AVAILABLE';
        return { ...c, status: nextStatus };
      }
      return c;
    });
    setChairs(updated);
    saveOperatoryChairs(updated);
  };

  const handleAdvanceStage = (queueId: string) => {
    const updated = queue.map((q) => {
      if (q.id === queueId) {
        const nextStage = NEXT_STAGE_MAP[q.stage] || 'COMPLETED';
        return { ...q, stage: nextStage };
      }
      return q;
    });
    setQueue(updated);
    saveQueueEntries(updated);
  };

  const activeInClinic = queue.filter(
    (q) => q.stage !== 'COMPLETED' && q.stage !== 'CANCELLED' && q.stage !== 'NO_SHOW'
  );

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5 text-foreground">
            <Activity className="w-7 h-7 text-primary" />
            Operatory Flow & Waiting Queue
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time chair status, patient arrivals, and procedure pipeline management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono border-primary/40 text-primary">
            {activeInClinic.length} Patients in Clinic
          </Badge>
        </div>
      </div>

      {/* Operatory Chairs Live Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Dental Operatories & Suites
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {chairs.map((chair) => {
            const isAvailable = chair.status === 'AVAILABLE';
            const isOccupied = chair.status === 'OCCUPIED';
            const isCleaning = chair.status === 'CLEANING';

            return (
              <Card
                key={chair.id}
                className={`bg-card border transition-all duration-200 shadow-xs ${
                  isOccupied
                    ? 'border-red-500/40 bg-red-500/[0.02]'
                    : isAvailable
                    ? 'border-emerald-500/40'
                    : 'border-amber-500/40'
                }`}
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground">{chair.roomNumber}</span>
                    <CardTitle className="text-sm font-bold text-foreground mt-0.5">{chair.name}</CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs uppercase font-mono ${
                      isOccupied
                        ? 'border-red-500 text-red-500 bg-red-500/10'
                        : isAvailable
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                        : 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                    }`}
                  >
                    {chair.status}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-3 text-xs">
                  {isOccupied ? (
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-muted/40 border border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Patient:</span>
                        <Link href={`/patients/${chair.currentPatientId || 'p1'}`} className="font-bold text-primary hover:underline">
                          {chair.currentPatientName}
                        </Link>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Procedure:</span>
                        <span className="font-medium text-foreground">{chair.currentProcedure}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                        <span>Occupied Since:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">{chair.occupiedSince}</span>
                      </div>
                    </div>
                  ) : isCleaning ? (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                      <p className="font-semibold text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Undergoing Disinfection
                      </p>
                      <p className="text-[11px] opacity-80 mt-0.5">{chair.currentProcedure || 'Standard operatory turnover cycle'}</p>
                    </div>
                  ) : (
                    <div className="p-4 text-center rounded-lg bg-muted/30 border border-border text-muted-foreground">
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600 dark:text-emerald-400 opacity-70" />
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Ready for next patient</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-[11px] text-muted-foreground">Assigned: {chair.doctorName}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleChairStatus(chair.id)}
                      className="text-[11px] h-7 px-2 border-border hover:border-primary"
                    >
                      Cycle Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Live Reception Queue Table */}
      <Card className="bg-card border-border shadow-xs">
        <CardHeader className="p-4 pb-3 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <Clock className="w-4 h-4 text-primary" /> Today's Patient Queue & Schedule
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Track check-ins, waiting room duration, and stage transitions through checkout.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {queue.map((entry) => {
              const stageInfo = STAGE_LABELS[entry.stage] || STAGE_LABELS.SCHEDULED;
              const nextStage = NEXT_STAGE_MAP[entry.stage];

              return (
                <div
                  key={entry.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-muted/20 transition-colors text-xs"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted/50 border border-border text-primary font-bold font-mono text-center min-w-[64px]">
                      {entry.scheduledTime}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/patients/${entry.patientId}`} className="text-sm font-bold text-foreground hover:text-primary hover:underline">
                          {entry.patientName}
                        </Link>
                        <span
                          className="text-[10px] font-semibold py-0.5 px-2 rounded-md border"
                          style={{ borderColor: stageInfo.color, color: stageInfo.color, backgroundColor: stageInfo.bg }}
                        >
                          {stageInfo.label}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        Treatment: <strong className="text-foreground">{entry.treatmentType}</strong> &bull; Doctor: {entry.doctorName}
                        {entry.chairName && <span className="text-primary"> &bull; {entry.chairName}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between md:justify-end">
                    {entry.waitingMinutes > 0 && entry.stage !== 'COMPLETED' && (
                      <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        ⏱ {entry.waitingMinutes}m wait
                      </span>
                    )}

                    {entry.patientPhone && (
                      <a
                        href={`https://wa.me/${entry.patientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello ${entry.patientName}, your appointment for ${entry.treatmentType} is scheduled today at ${entry.scheduledTime}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </a>
                    )}

                    {nextStage ? (
                      <Button
                        size="sm"
                        onClick={() => handleAdvanceStage(entry.id)}
                        className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold h-8"
                      >
                        Advance to {STAGE_LABELS[nextStage]?.label || nextStage}
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/40">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Finished
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
