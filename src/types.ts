export type Role = 'DENTIST' | 'LAB_ADMIN' | 'LAB_STAFF';
export type CaseStatus = 'PENDING' | 'IN_PROGRESS' | 'QUALITY_CHECK' | 'DISPATCHED' | 'DELIVERED';
export type Urgency = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  role: Role;
  labId?: string;
  avatarUrl?: string;
}

export interface Case {
  id: string;
  patientName: string;
  dentistId: string;
  labId: string;
  status: CaseStatus;
  urgency: Urgency;
  requestedTreatment: string;
  material?: string;
  createdAt: string;
  dueDate: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  statusUpdate: string;
  notes: string;
  timestamp: string;
  visibility: 'INTERNAL' | 'EXTERNAL' | 'BOTH';
}

export interface LabProfile {
  id: string;
  name: string;
  rating: number;
  reviewsCount: number;
  services: string[];
  pricing: string;
  turnaroundTime: string;
  contactEmail: string;
  contactPhone: string;
}

export interface InventoryItem {
  id: string;
  labId: string;
  name: string;
  category: string;
  quantity: number;
  threshold: number;
  unit: string;
}
