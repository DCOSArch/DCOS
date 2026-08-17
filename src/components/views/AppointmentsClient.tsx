'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Activity,
  ArrowRight,
  X,
  FileText,
  Sliders,
  Maximize2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Appointment, AppointmentStatus, OperatoryChair, Patient } from '@/types';
import {
  fetchAppointments,
  createAppointment,
  updateAppointment,
  fetchLiveOperatoryChairs,
  saveLiveOperatoryChair,
  fetchPatients
} from '@/lib/services';
import { toast } from 'sonner';

type CalendarViewMode = 'CHAIR_GRID' | 'DAY_TIMELINE' | 'AGENDA';

const PROCEDURE_PRESETS = [
  { name: 'General Dental Consultation & Examination', durationMinutes: 30, color: '#66D9EF' },
  { name: 'Ultrasonic Full-Mouth Scaling & Polishing', durationMinutes: 30, color: '#A6E22E' },
  { name: 'Composite Resin Restoration (1-2 surfaces)', durationMinutes: 45, color: '#FD971F' },
  { name: 'Biomechanical Root Canal Preparation', durationMinutes: 60, color: '#F92672' },
  { name: 'Crown Preparation & Digital Intraoral Scan', durationMinutes: 60, color: '#AE81FF' },
  { name: 'Surgical Extraction / Implant Placement', durationMinutes: 75, color: '#E6DB74' },
];

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; bg: string; text: string; border: string }> = {
  SCHEDULED: { label: 'Scheduled', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30' },
  CONFIRMED: { label: 'Confirmed', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  CHECKED_IN: { label: 'Checked In', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  IN_CHAIR: { label: 'In Chair', bg: 'bg-[#F92672]/20', text: 'text-[#F92672]', border: 'border-[#F92672]/50' },
  IN_TREATMENT: { label: 'In Treatment', bg: 'bg-[#66D9EF]/20', text: 'text-[#66D9EF]', border: 'border-[#66D9EF]/50' },
  BILLING: { label: 'Billing', bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
  COMPLETED: { label: 'Completed', bg: 'bg-zinc-500/15', text: 'text-zinc-400', border: 'border-zinc-500/30' },
  CANCELLED: { label: 'Cancelled', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  NO_SHOW: { label: 'No Show', bg: 'bg-zinc-700/20', text: 'text-zinc-500', border: 'border-zinc-700/40' },
};

const TIME_SLOTS = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM',
];

export function AppointmentsClient() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState<CalendarViewMode>('CHAIR_GRID');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [chairs, setChairs] = useState<OperatoryChair[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Booking Modal State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedChairId, setSelectedChairId] = useState('chair-1');
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [procedureType, setProcedureType] = useState(PROCEDURE_PRESETS[0].name);
  const [slotTime, setSlotTime] = useState('09:30 AM');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [notes, setNotes] = useState('');

  // Load Data
  const loadSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const [aptData, chairData, patientData] = await Promise.all([
        fetchAppointments(),
        fetchLiveOperatoryChairs(),
        fetchPatients(),
      ]);
      setAppointments(aptData);
      setChairs(chairData);
      setPatients(patientData);
    } catch (e) {
      console.error('Error loading schedule:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  // Filter appointments for the selected date
  const dayAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptDate = apt.startTime.slice(0, 10);
      return aptDate === selectedDate;
    });
  }, [appointments, selectedDate]);

  // Metrics
  const metrics = useMemo(() => {
    const total = dayAppointments.length;
    const inChair = dayAppointments.filter((a) => a.status === 'IN_CHAIR' || a.status === 'IN_TREATMENT').length;
    const confirmed = dayAppointments.filter((a) => a.status === 'CONFIRMED' || a.status === 'CHECKED_IN').length;
    const completed = dayAppointments.filter((a) => a.status === 'COMPLETED').length;
    return { total, inChair, confirmed, completed };
  }, [dayAppointments]);

  const handleDateShift = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleStatusChange = async (aptId: string, newStatus: AppointmentStatus) => {
    const apt = appointments.find((a) => a.id === aptId);
    if (!apt) return;

    await updateAppointment(aptId, { status: newStatus });
    toast.success(`Appointment marked ${newStatus.replace('_', ' ')}`);

    // If marked IN_CHAIR, update the corresponding operatory chair state
    if (newStatus === 'IN_CHAIR' || newStatus === 'IN_TREATMENT') {
      const targetChair = chairs.find((c) => c.id === apt.chairId) || chairs[0];
      if (targetChair) {
        await saveLiveOperatoryChair({
          ...targetChair,
          status: 'OCCUPIED',
          currentPatientId: apt.patientId,
          currentPatientName: apt.patientName || 'Patient',
          currentProcedure: apt.procedureType,
          occupiedSince: new Date().toISOString(),
        });
      }
    } else if (newStatus === 'COMPLETED') {
      const targetChair = chairs.find((c) => c.id === apt.chairId);
      if (targetChair) {
        await saveLiveOperatoryChair({
          ...targetChair,
          status: 'AVAILABLE',
          currentPatientId: undefined,
          currentPatientName: undefined,
          currentProcedure: undefined,
          occupiedSince: undefined,
        });
      }
    }

    loadSchedule();
  };

  const handleCreateAppointment = async () => {
    if (!selectedPatientId) {
      toast.error('Please select a patient.');
      return;
    }

    const patient = patients.find((p) => p.id === selectedPatientId);
    const [hStr, mRest] = slotTime.split(':');
    let hours = parseInt(hStr, 10);
    const mins = parseInt(mRest.slice(0, 2), 10);
    const isPM = slotTime.toUpperCase().includes('PM');
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    const startDate = new Date(selectedDate);
    startDate.setHours(hours, mins, 0, 0);

    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    await createAppointment({
      organizationId: '00000000-0000-0000-0000-000000000001',
      dentistId: 'be06be12-31af-47b8-ac63-296411f41942',
      patientId: selectedPatientId,
      patientName: patient?.name || 'Patient',
      patientPhone: patient?.phone,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      chairId: selectedChairId,
      procedureType,
      status: 'SCHEDULED',
      notes,
    });

    toast.success(`Booked appointment for ${patient?.name || 'Patient'}`);
    setIsBookingOpen(false);
    setNotes('');
    loadSchedule();
  };

  const generateWhatsAppLink = (apt: Appointment) => {
    const timeFormatted = new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg = encodeURIComponent(
      `Hello ${apt.patientName || 'Sir/Madam'}, this is an appointment reminder from Dr. Ayan Haider's Dental Practice for ${apt.procedureType} scheduled on ${selectedDate} at ${timeFormatted}. Reply YES to confirm.`
    );
    const phone = (apt.patientPhone || '').replace(/[^0-9]/g, '');
    return `https://wa.me/${phone}?text=${msg}`;
  };

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 8);
    return patients
      .filter((p) => p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.phone?.includes(patientSearch))
      .slice(0, 8);
  }, [patients, patientSearch]);

  return (
    <div className="space-y-6 animate-fade-in text-foreground">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                Operatory Schedule & Appointments
                <Badge variant="outline" className="text-xs text-primary border-primary/30 font-mono">
                  Live Cockpit
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                Multi-chair clinical schedule, live operatory progression & WhatsApp patient reminders.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Date Navigator */}
          <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => handleDateShift(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-0 text-xs font-mono text-foreground px-2 focus:outline-hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => handleDateShift(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs font-medium text-primary hover:bg-primary/10 ml-1"
              onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
            >
              Today
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-xs">
            <Button
              variant={viewMode === 'CHAIR_GRID' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => setViewMode('CHAIR_GRID')}
            >
              Multi-Chair Grid
            </Button>
            <Button
              variant={viewMode === 'DAY_TIMELINE' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => setViewMode('DAY_TIMELINE')}
            >
              Day Timeline
            </Button>
            <Button
              variant={viewMode === 'AGENDA' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => setViewMode('AGENDA')}
            >
              Agenda
            </Button>
          </div>

          <Button
            onClick={() => setIsBookingOpen(true)}
            size="sm"
            className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md"
          >
            <Plus className="w-4 h-4" />
            Book Slot
          </Button>
        </div>
      </div>

      {/* Daily Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Scheduled Today</p>
              <h3 className="text-xl sm:text-2xl font-black font-mono mt-0.5">{metrics.total}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">In Operatory Chair</p>
              <h3 className="text-xl sm:text-2xl font-black font-mono text-[#F92672] mt-0.5">{metrics.inChair}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#F92672]/15 text-[#F92672] flex items-center justify-center animate-pulse">
              <Activity className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Confirmed Arrivals</p>
              <h3 className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-0.5">{metrics.confirmed}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border shadow-xs">
          <CardContent className="p-3 sm:p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Completed Visits</p>
              <h3 className="text-xl sm:text-2xl font-black font-mono text-muted-foreground mt-0.5">{metrics.completed}</h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-zinc-500/10 text-zinc-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Schedule View */}
      {viewMode === 'CHAIR_GRID' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {chairs.map((chair) => {
            const chairApts = dayAppointments.filter((a) => a.chairId === chair.id);
            const isOccupied = chair.status === 'OCCUPIED';

            return (
              <Card key={chair.id} className="bg-card border-border flex flex-col h-full shadow-xs">
                <CardHeader className="p-3.5 pb-3 border-b border-border/80 flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      {chair.name}
                    </CardTitle>
                    <p className="text-[11px] font-mono text-muted-foreground">{chair.roomNumber} • {chair.doctorName}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-mono ${
                      isOccupied
                        ? 'bg-[#F92672]/20 text-[#F92672] border-[#F92672]/40 animate-pulse'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {chair.status}
                  </Badge>
                </CardHeader>

                <CardContent className="p-3 flex-1 flex flex-col justify-between space-y-3">
                  {/* Live Active Patient in Chair */}
                  {isOccupied && chair.currentPatientName && (
                    <div className="p-3 bg-[#F92672]/10 border border-[#F92672]/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#F92672] uppercase tracking-wider flex items-center gap-1">
                          <Activity className="w-3 h-3 animate-spin" /> In Active Treatment
                        </span>
                        {chair.currentPatientId && (
                          <Link
                            href={`/visits/new?patientId=${chair.currentPatientId}`}
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
                          >
                            Open SOAP <ArrowRight className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                      <p className="text-xs font-bold text-foreground">{chair.currentPatientName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{chair.currentProcedure}</p>
                    </div>
                  )}

                  {/* Scheduled Appointments for Chair */}
                  <div className="space-y-2.5 flex-1">
                    {chairApts.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/60 rounded-xl">
                        <Clock className="w-5 h-5 text-muted-foreground mb-1.5 opacity-40" />
                        <p className="text-xs text-muted-foreground">No bookings today</p>
                        <Button
                          variant="link"
                          size="sm"
                          className="text-[11px] text-primary p-0 h-auto mt-1"
                          onClick={() => {
                            setSelectedChairId(chair.id);
                            setIsBookingOpen(true);
                          }}
                        >
                          + Book Chair
                        </Button>
                      </div>
                    ) : (
                      chairApts.map((apt) => {
                        const statusCfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.SCHEDULED;
                        const timeStr = new Date(apt.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={apt.id}
                            className="p-3 bg-background/60 hover:bg-background border border-border/80 rounded-xl space-y-2 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {timeStr}
                              </span>
                              <Badge className={`text-[10px] ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                                {statusCfg.label}
                              </Badge>
                            </div>

                            <div>
                              <Link
                                href={`/patients/${apt.patientId}`}
                                className="text-xs font-bold text-foreground hover:text-primary transition-colors block truncate"
                              >
                                {apt.patientName}
                              </Link>
                              <p className="text-[11px] text-muted-foreground truncate">{apt.procedureType}</p>
                            </div>

                            {/* Quick Action Bar */}
                            <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px]">
                              {apt.patientPhone ? (
                                <a
                                  href={generateWhatsAppLink(apt)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                                >
                                  <MessageSquare className="w-3 h-3" /> WhatsApp
                                </a>
                              ) : (
                                <span className="text-muted-foreground">No Phone</span>
                              )}

                              <div className="flex items-center gap-1">
                                {apt.status !== 'IN_CHAIR' && apt.status !== 'COMPLETED' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-[10px] text-primary hover:bg-primary/10 font-bold"
                                    onClick={() => handleStatusChange(apt.id, 'IN_CHAIR')}
                                  >
                                    Check In
                                  </Button>
                                )}
                                {apt.status === 'IN_CHAIR' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-[10px] text-emerald-400 hover:bg-emerald-500/10 font-bold"
                                    onClick={() => handleStatusChange(apt.id, 'COMPLETED')}
                                  >
                                    Done
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-medium border-dashed border-border"
                    onClick={() => {
                      setSelectedChairId(chair.id);
                      setIsBookingOpen(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Booking
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Day Timeline View */}
      {viewMode === 'DAY_TIMELINE' && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-3">
            <div className="divide-y divide-border/60">
              {TIME_SLOTS.map((slot) => {
                const matchingApts = dayAppointments.filter((a) => {
                  const aptTime = new Date(a.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return aptTime === slot || aptTime.startsWith(slot.slice(0, 4));
                });

                return (
                  <div key={slot} className="py-2.5 flex items-start gap-4">
                    <div className="w-20 shrink-0 font-mono text-xs text-muted-foreground pt-1">{slot}</div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                      {matchingApts.map((apt) => (
                        <div
                          key={apt.id}
                          className="p-2.5 bg-background border border-border/80 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-foreground block">{apt.patientName}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{apt.chairName} • {apt.procedureType}</span>
                          </div>
                          <Badge className={`text-[10px] ${STATUS_CONFIG[apt.status]?.bg} ${STATUS_CONFIG[apt.status]?.text}`}>
                            {STATUS_CONFIG[apt.status]?.label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agenda List View */}
      {viewMode === 'AGENDA' && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 space-y-3">
            {dayAppointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                No appointments booked for {selectedDate}.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {dayAppointments.map((apt) => (
                  <div key={apt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs font-mono">
                        {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
                        <Link href={`/patients/${apt.patientId}`} className="font-bold text-sm text-foreground hover:underline">
                          {apt.patientName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{apt.chairName} • {apt.procedureType}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${STATUS_CONFIG[apt.status]?.bg} ${STATUS_CONFIG[apt.status]?.text}`}>
                        {STATUS_CONFIG[apt.status]?.label}
                      </Badge>

                      {apt.patientPhone && (
                        <a
                          href={generateWhatsAppLink(apt)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs"
                        onClick={() => router.push(`/visits/new?patientId=${apt.patientId}&appointmentId=${apt.id}`)}
                      >
                        Start SOAP
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Appointment Booking Modal */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border text-foreground shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Book Clinical Appointment Slot
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Patient Search & Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Select Patient</label>
              <input
                type="text"
                placeholder="Search patient name or phone..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-background border border-border text-foreground focus:outline-hidden"
              />
              <div className="max-h-32 overflow-y-auto divide-y divide-border/40 border border-border/60 rounded-lg mt-1 bg-background/50">
                {filteredPatients.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientId(p.id);
                      setPatientSearch(p.name);
                    }}
                    className={`p-2 text-xs flex items-center justify-between cursor-pointer hover:bg-primary/10 transition-colors ${
                      selectedPatientId === p.id ? 'bg-primary/20 text-primary font-bold' : ''
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{p.phone || p.id}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Operatory Chair */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Operatory Chair</label>
              <select
                value={selectedChairId}
                onChange={(e) => setSelectedChairId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-background border border-border text-foreground focus:outline-hidden font-mono"
              >
                {chairs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.roomNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* Procedure Preset & Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Procedure Type</label>
              <select
                value={procedureType}
                onChange={(e) => {
                  setProcedureType(e.target.value);
                  const found = PROCEDURE_PRESETS.find((p) => p.name === e.target.value);
                  if (found) setDurationMinutes(found.durationMinutes);
                }}
                className="w-full px-3 py-2 text-xs rounded-lg bg-background border border-border text-foreground focus:outline-hidden"
              >
                {PROCEDURE_PRESETS.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name} ({p.durationMinutes} mins)
                  </option>
                ))}
              </select>
            </div>

            {/* Time Slot & Duration */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Start Time</label>
                <select
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-background border border-border text-foreground focus:outline-hidden font-mono"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Duration (Minutes)</label>
                <input
                  type="number"
                  step="15"
                  min="15"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-background border border-border text-foreground focus:outline-hidden font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Clinical / Booking Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Needs localized anesthesia on lower right quadrant..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-background border border-border text-foreground focus:outline-hidden"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" size="sm" onClick={() => setIsBookingOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCreateAppointment}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
