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

export function savePatientToothChart(patientId: string, chart: ToothChartData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`dcos_tooth_chart_${patientId}`, JSON.stringify(chart));
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
