export type Role = 'DENTIST' | 'LAB_ADMIN' | 'LAB_STAFF';
export type CaseStatus = 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'QUALITY_CHECK' | 'DISPATCHED' | 'DELIVERED' | 'COMPLETED' | 'REJECTED';
export type Urgency = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  role: Role;
  labId?: string;
  avatarUrl?: string;
}

export interface Patient {
  id: string;
  dentistId: string;
  name: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE';
  medicalHistory?: string;
  contactInfo?: string;
  createdAt: string;
}

export interface Case {
  id: string;
  patientId?: string; // Link to the new Patient entity
  patientName: string; // Kept for backwards compatibility
  dentistId: string;
  labId: string;
  status: CaseStatus;
  urgency: Urgency;
  requestedTreatment: string;
  material?: string;
  scanUrl?: string;
  createdAt: string;
  dueDate: string;
  shade?: string;
  selectedTeeth?: number[];
  instructions?: string;
  designUrl?: string;
  dicomUrl?: string;
  patientAge?: number;
  patientGender?: 'MALE' | 'FEMALE';
  implantBrand?: string;
  scanBodyModel?: string;
  analogLogistics?: string;
  proposedDueDate?: string;
  dueDateProposalsCount?: number;
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

export interface DoctorInventoryItem {
  id: string;
  dentistId: string;
  labId: string;
  materialName: string;
  totalUnits: number;
  remainingUnits: number;
  lockedPrice: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export interface OrderChat {
  id: string;
  caseId: string;
  messages: ChatMessage[];
}
