import { createClient } from '@/lib/supabase/client';
import {
  ToothChartData,
  ClinicalVisit,
  OperatoryChair,
  QueueEntry,
  ConsumableItem,
  InventoryMovement,
  ClinicalInvoice,
  Patient,
  Appointment,
  AppointmentStatus,
} from '@/types';
import {
  mockToothCharts,
  mockClinicalVisits,
  mockChairs,
  mockQueue,
  mockConsumables,
  mockInventoryMovements,
  mockInvoices,
  mockPatients,
} from '@/mockData';

export interface LabService {
  id: string;
  category: string;
  service_name: string;
  turnaround_days: number;
  price: number;
}

/**
 * Fetches the active Rx catalog (services) for a specific laboratory.
 */
export async function fetchLabServices(labId: string): Promise<LabService[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('lab_services')
      .select('id, category, service_name, turnaround_days, price')
      .eq('lab_id', labId)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('service_name', { ascending: true });

    if (!error && data && data.length > 0) {
      return data as LabService[];
    }
  } catch (err) {
    console.warn('Supabase not reachable, returning default lab services', err);
  }

  return [
    { id: 'ls1', category: 'Crown & Bridge', service_name: 'Zirconia HT Monolithic', turnaround_days: 3, price: 2450 },
    { id: 'ls2', category: 'Crown & Bridge', service_name: 'IPS e.max CAD Veneer/Crown', turnaround_days: 4, price: 3200 },
    { id: 'ls3', category: 'Implantology', service_name: 'Custom Titanium Abutment & Screw Crown', turnaround_days: 5, price: 4800 },
    { id: 'ls4', category: 'Removables', service_name: 'Dual Laminate Nightguard', turnaround_days: 2, price: 1800 },
  ];
}

// ----------------- TOOTH CHART SERVICE -----------------
/**
 * Synchronous tooth chart reader (reads local cache with mock fallback).
 */
export function getPatientToothChart(patientId: string): ToothChartData {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`dcos_tooth_chart_${patientId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
  }
  return mockToothCharts[patientId] || {};
}

/**
 * Asynchronously loads patient tooth chart from Supabase Postgres with local storage cache sync.
 */
export async function fetchPatientToothChart(patientId: string): Promise<ToothChartData> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('tooth_charts')
      .select('chart_data')
      .eq('patient_id', patientId)
      .maybeSingle();

    if (!error && data?.chart_data) {
      const chart = data.chart_data as ToothChartData;
      if (typeof window !== 'undefined') {
        localStorage.setItem(`dcos_tooth_chart_${patientId}`, JSON.stringify(chart));
      }
      return chart;
    }
  } catch (err) {
    console.warn('Supabase tooth chart query failed, falling back to local cache', err);
  }

  return getPatientToothChart(patientId);
}

/**
 * Saves patient tooth chart to both local cache and Supabase Postgres database.
 */
export async function savePatientToothChart(patientId: string, chart: ToothChartData, organizationId?: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`dcos_tooth_chart_${patientId}`, JSON.stringify(chart));
  }

  try {
    const supabase = createClient();
    await supabase.from('tooth_charts').upsert({
      patient_id: patientId,
      chart_data: chart,
      organization_id: organizationId || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'patient_id' });
  } catch (err) {
    console.warn('Could not sync tooth chart to Supabase:', err);
  }
}

// ----------------- CLINICAL VISITS SERVICE -----------------
export function getPatientVisits(patientId: string): ClinicalVisit[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`dcos_visits_${patientId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
  }
  return mockClinicalVisits.filter((v) => v.patientId === patientId);
}

export function getAllVisits(): ClinicalVisit[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dcos_all_visits');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
  }
  return mockClinicalVisits;
}

export function saveClinicalVisit(visit: ClinicalVisit): void {
  if (typeof window !== 'undefined') {
    const all = getAllVisits();
    const idx = all.findIndex((v) => v.id === visit.id);
    let updated: ClinicalVisit[];
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = visit;
    } else {
      updated = [visit, ...all];
    }
    localStorage.setItem('dcos_all_visits', JSON.stringify(updated));
    localStorage.setItem(
      `dcos_visits_${visit.patientId}`,
      JSON.stringify(updated.filter((v) => v.patientId === visit.patientId))
    );
  }
}

// ----------------- OPERATORY FLOW SERVICE -----------------
export function getOperatoryChairs(): OperatoryChair[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dcos_chairs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
  }
  return mockChairs;
}

export function saveOperatoryChairs(chairs: OperatoryChair[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dcos_chairs', JSON.stringify(chairs));
  }
}

export function getQueueEntries(): QueueEntry[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dcos_queue');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
  }
  return mockQueue;
}

export function saveQueueEntries(queue: QueueEntry[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dcos_queue', JSON.stringify(queue));
  }
}

// ----------------- CONSUMABLES INVENTORY SERVICE -----------------
export function getConsumableInventory(): ConsumableItem[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dcos_consumables');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
  }
  return mockConsumables;
}

export function saveConsumableInventory(items: ConsumableItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('dcos_consumables', JSON.stringify(items));
  }
}

export function getInventoryMovements(): InventoryMovement[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dcos_movements');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
  }
  return mockInventoryMovements;
}

export function logInventoryMovement(movement: InventoryMovement): void {
  if (typeof window !== 'undefined') {
    const all = getInventoryMovements();
    localStorage.setItem('dcos_movements', JSON.stringify([movement, ...all]));
  }
}

// ----------------- BILLING & INVOICING SERVICE -----------------
export function getInvoices(patientId?: string): ClinicalInvoice[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dcos_invoices');
    if (saved) {
      try {
        const all: ClinicalInvoice[] = JSON.parse(saved);
        return patientId ? all.filter((inv) => inv.patientId === patientId) : all;
      } catch (e) {
        console.error(e);
      }
    }
  }
  return patientId ? mockInvoices.filter((inv) => inv.patientId === patientId) : mockInvoices;
}

export function saveInvoice(invoice: ClinicalInvoice): void {
  if (typeof window !== 'undefined') {
    const all = getInvoices();
    const idx = all.findIndex((i) => i.id === invoice.id);
    let updated: ClinicalInvoice[];
    if (idx >= 0) {
      updated = [...all];
      updated[idx] = invoice;
    } else {
      updated = [invoice, ...all];
    }
    localStorage.setItem('dcos_invoices', JSON.stringify(updated));
  }
}

// ----------------- APPOINTMENT SCHEDULING SERVICE (P10) -----------------
export async function fetchAppointments(filters?: {
  startDate?: string;
  endDate?: string;
  patientId?: string;
  chairId?: string;
}): Promise<Appointment[]> {
  try {
    const supabase = createClient();
    let query = supabase
      .from('appointments')
      .select('*, patients(name, phone), operatory_chairs(name)')
      .order('start_time', { ascending: true });

    if (filters?.startDate) {
      query = query.gte('start_time', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('start_time', filters.endDate);
    }
    if (filters?.patientId) {
      query = query.eq('patient_id', filters.patientId);
    }
    if (filters?.chairId) {
      query = query.eq('chair_id', filters.chairId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase fetchAppointments error, falling back to local state:', error.message);
    } else if (data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        organizationId: row.organization_id,
        dentistId: row.dentist_id,
        patientId: row.patient_id,
        patientName: row.patients?.name || 'Patient',
        patientPhone: row.patients?.phone,
        startTime: row.start_time,
        endTime: row.end_time,
        chairId: row.chair_id || 'chair-1',
        chairName: row.operatory_chairs?.name || 'Operatory 1',
        procedureType: row.procedure_type,
        status: row.status,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }
  } catch (e) {
    console.warn('fetchAppointments exception:', e);
  }

  // Fallback to local storage or demo seed appointments
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dcos_appointments');
    if (saved) {
      try {
        const localList: Appointment[] = JSON.parse(saved);
        if (filters?.patientId) return localList.filter((a) => a.patientId === filters.patientId);
        return localList;
      } catch (e) {
        console.error(e);
      }
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  return [
    {
      id: 'apt-01',
      organizationId: '00000000-0000-0000-0000-000000000001',
      dentistId: 'be06be12-31af-47b8-ac63-296411f41942',
      patientId: 'p-01',
      patientName: 'Anil Kumar',
      patientPhone: '+91 98765 43210',
      startTime: `${todayStr}T09:30:00.000Z`,
      endTime: `${todayStr}T10:15:00.000Z`,
      chairId: 'chair-1',
      chairName: 'Operatory 1 (General)',
      procedureType: 'Root Canal Preparation #46',
      status: 'IN_CHAIR',
      notes: 'Patient requested extra topical anesthetic.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'apt-02',
      organizationId: '00000000-0000-0000-0000-000000000001',
      dentistId: 'be06be12-31af-47b8-ac63-296411f41942',
      patientId: 'p-02',
      patientName: 'Priya Sharma',
      patientPhone: '+91 98111 22334',
      startTime: `${todayStr}T10:30:00.000Z`,
      endTime: `${todayStr}T11:00:00.000Z`,
      chairId: 'chair-2',
      chairName: 'Operatory 2 (Restorative)',
      procedureType: 'Composite Restoration #16',
      status: 'CONFIRMED',
      notes: 'Recall visit from last month.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'apt-03',
      organizationId: '00000000-0000-0000-0000-000000000001',
      dentistId: 'be06be12-31af-47b8-ac63-296411f41942',
      patientId: 'p-03',
      patientName: 'Rahul Verma',
      patientPhone: '+91 99887 76655',
      startTime: `${todayStr}T11:15:00.000Z`,
      endTime: `${todayStr}T11:45:00.000Z`,
      chairId: 'chair-4',
      chairName: 'Operatory 4 (Hygiene)',
      procedureType: 'Ultrasonic Scaling & Polishing',
      status: 'SCHEDULED',
      notes: 'New patient intake.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export async function createAppointment(apt: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
  const newId = `apt-${Date.now()}`;
  const createdRecord: Appointment = {
    ...apt,
    id: newId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        organization_id: apt.organizationId || '00000000-0000-0000-0000-000000000001',
        dentist_id: apt.dentistId || 'be06be12-31af-47b8-ac63-296411f41942',
        patient_id: apt.patientId,
        start_time: apt.startTime,
        end_time: apt.endTime,
        chair_id: apt.chairId || 'chair-1',
        procedure_type: apt.procedureType,
        status: apt.status || 'SCHEDULED',
        notes: apt.notes,
      })
      .select()
      .single();

    if (error) {
      console.warn('Supabase createAppointment error, saving locally:', error.message);
    } else if (data) {
      createdRecord.id = data.id;
    }
  } catch (e) {
    console.warn('createAppointment exception:', e);
  }

  // Update local fallback
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dcos_appointments');
    const all: Appointment[] = saved ? JSON.parse(saved) : [];
    localStorage.setItem('dcos_appointments', JSON.stringify([createdRecord, ...all]));
  }

  return createdRecord;
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
  try {
    const supabase = createClient();
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.status) payload.status = updates.status;
    if (updates.chairId) payload.chair_id = updates.chairId;
    if (updates.startTime) payload.start_time = updates.startTime;
    if (updates.endTime) payload.end_time = updates.endTime;
    if (updates.notes) payload.notes = updates.notes;
    if (updates.procedureType) payload.procedure_type = updates.procedureType;

    const { error } = await supabase.from('appointments').update(payload).eq('id', id);
    if (error) {
      console.warn('Supabase updateAppointment error:', error.message);
    }
  } catch (e) {
    console.warn('updateAppointment exception:', e);
  }

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dcos_appointments');
    if (saved) {
      const all: Appointment[] = JSON.parse(saved);
      const idx = all.findIndex((a) => a.id === id);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
        localStorage.setItem('dcos_appointments', JSON.stringify(all));
        return all[idx];
      }
    }
  }
  return null;
}

export async function fetchLiveOperatoryChairs(): Promise<OperatoryChair[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('operatory_chairs')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Supabase fetchLiveOperatoryChairs error:', error.message);
    } else if (data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        name: row.name,
        roomNumber: row.room_number,
        status: row.status,
        currentPatientId: row.current_patient_id,
        currentPatientName: row.current_patient_name,
        currentProcedure: row.current_procedure,
        occupiedSince: row.occupied_since,
        doctorName: row.doctor_name,
      }));
    }
  } catch (e) {
    console.warn('fetchLiveOperatoryChairs exception:', e);
  }
  return getOperatoryChairs();
}

export async function saveLiveOperatoryChair(chair: OperatoryChair): Promise<void> {
  saveOperatoryChairs([chair]);
  try {
    const supabase = createClient();
    await supabase.from('operatory_chairs').upsert({
      id: chair.id,
      organization_id: '00000000-0000-0000-0000-000000000001',
      name: chair.name,
      room_number: chair.roomNumber,
      status: chair.status,
      current_patient_id: chair.currentPatientId || null,
      current_patient_name: chair.currentPatientName || null,
      current_procedure: chair.currentProcedure || null,
      occupied_since: chair.occupiedSince || null,
      doctor_name: chair.doctorName || null,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('saveLiveOperatoryChair exception:', e);
  }
}

// ----------------- PATIENTS QUERY SERVICE -----------------
export async function fetchPatients(): Promise<Patient[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Supabase fetchPatients error:', error.message);
    } else if (data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        dentistId: row.dentist_id || 'be06be12-31af-47b8-ac63-296411f41942',
        name: row.name,
        age: row.age,
        gender: row.gender,
        phone: row.phone,
        email: row.email,
        address: row.address,
        medicalHistory: row.medical_history,
        allergies: row.allergies,
        medicalAlerts: row.medical_alerts,
        createdAt: row.created_at || new Date().toISOString(),
        outstandingBalance: row.outstanding_balance || 0,
        lastVisitDate: row.last_visit_date,
      }));
    }
  } catch (e) {
    console.warn('fetchPatients exception:', e);
  }
  return mockPatients;
}
