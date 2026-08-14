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
  Play,
  RotateCcw,
} from 'lucide-react';

const STAGE_LABELS: Record<QueueStage, { label: string; color: string; bg: string }> = {
  SCHEDULED: { label: 'Scheduled', color: '#66D9EF', bg: '#1E293B' },
  CHECKED_IN: { label: 'Checked In', color: '#A6E22E', bg: '#064E3B' },
  WAITING: { label: 'Waiting Room', color: '#FD971F', bg: '#451A03' },
  IN_CHAIR: { label: 'In Chair', color: '#F92672', bg: '#4C0519' },
  IN_TREATMENT: { label: 'In Treatment', color: '#A855F7', bg: '#3B0764' },
  BILLING: { label: 'Billing / Rx', color: '#EAB308', bg: '#422006' },
  COMPLETED: { label: 'Completed', color: '#10B981', bg: '#022C22' },
  NO_SHOW: { label: 'No Show', color: '#9CA3AF', bg: '#1F2937' },
  CANCELLED: { label: 'Cancelled', color: '#EF4444', bg: '#450A0A' },
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
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-[#F92672]" />
            Operatory Flow & Waiting Queue
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Real-time chair telemetry, patient arrival tracking, and procedure pipeline management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono border-[#A6E22E] text-[#A6E22E]">
            {activeInClinic.length} Patients in Clinic
          </Badge>
        </div>
      </div>

      {/* Operatory Chairs Live Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#66D9EF] flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Dental Operatories & Surgical Suites
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {chairs.map((chair) => {
            const isAvailable = chair.status === 'AVAILABLE';
            const isOccupied = chair.status === 'OCCUPIED';
            const isCleaning = chair.status === 'CLEANING';

            return (
              <Card
                key={chair.id}
                className={`bg-[#1E1F1C] border transition-all duration-200 ${
                  isOccupied
                    ? 'border-[#F92672]/60 shadow-lg shadow-[#F92672]/10'
                    : isAvailable
                    ? 'border-[#A6E22E]/40'
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
                        ? 'border-red-500 text-red-400 bg-red-500/10'
                        : isAvailable
                        ? 'border-green-500 text-green-400 bg-green-500/10'
                        : 'border-amber-500 text-amber-400 bg-amber-500/10'
                    }`}
                  >
                    {chair.status}
                  </Badge>
                </CardHeader>

                <CardContent className="p-4 space-y-3 text-xs">
                  {isOccupied ? (
                    <div className="space-y-1.5 p-2.5 rounded-lg bg-[#272822] border border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Patient:</span>
                        <Link href={`/patients/${chair.currentPatientId || 'p1'}`} className="font-bold text-[#66D9EF] hover:underline">
                          {chair.currentPatientName}
                        </Link>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Procedure:</span>
                        <span className="font-medium text-foreground">{chair.currentProcedure}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] text-muted-foreground">
                        <span>Occupied Since:</span>
                        <span className="font-mono text-[#A6E22E]">{chair.occupiedSince}</span>
                      </div>
                    </div>
                  ) : isCleaning ? (
                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/30 text-amber-300">
                      <p className="font-semibold text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Undergoing Disinfection
                      </p>
                      <p className="text-[11px] opacity-80 mt-0.5">{chair.currentProcedure || 'Standard operatory turnover cycle'}</p>
                    </div>
                  ) : (
                    <div className="p-4 text-center rounded-lg bg-[#272822] border border-border text-muted-foreground">
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-[#A6E22E] opacity-60" />
                      <p className="text-xs text-[#A6E22E] font-medium">Ready for next patient intake</p>
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
      <Card className="bg-[#1E1F1C] border-border">
        <CardHeader className="p-4 pb-3 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#FD971F]" /> Today's Patient Queue & Procedure Lifecycle
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
                    <div className="p-2 rounded-xl bg-[#272822] border border-border text-[#66D9EF] font-bold font-mono text-center min-w-[64px]">
                      {entry.scheduledTime}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/patients/${entry.patientId}`} className="text-sm font-bold text-foreground hover:text-[#66D9EF] hover:underline">
                          {entry.patientName}
                        </Link>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium py-0 px-1.5 border"
                          style={{ borderColor: stageInfo.color, color: stageInfo.color, backgroundColor: stageInfo.bg }}
                        >
                          {stageInfo.label}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        Treatment: <strong className="text-foreground">{entry.treatmentType}</strong> • Doctor: {entry.doctorName}
                        {entry.chairName && <span className="text-[#A6E22E]"> • {entry.chairName}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between md:justify-end">
                    {entry.waitingMinutes > 0 && entry.stage !== 'COMPLETED' && (
                      <span className="text-[11px] font-mono text-amber-400 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-900/40">
                        ⏱ {entry.waitingMinutes}m wait
                      </span>
                    )}

                    {entry.patientPhone && (
                      <a
                        href={`https://wa.me/${entry.patientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          `Hello ${entry.patientName}, your dental appointment for ${entry.treatmentType} is scheduled today at ${entry.scheduledTime}.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-[#25D366] hover:bg-[#25D366]/10">
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </a>
                    )}

                    {nextStage ? (
                      <Button
                        size="sm"
                        onClick={() => handleAdvanceStage(entry.id)}
                        className="bg-[#F92672] text-white hover:bg-[#F92672]/90 text-xs font-semibold h-8"
                      >
                        Advance to {STAGE_LABELS[nextStage]?.label || nextStage}
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-xs text-green-400 border-green-500/40">
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
