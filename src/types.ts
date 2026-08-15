export type Role = 'DENTIST' | 'LAB_ADMIN' | 'LAB_STAFF';
export type CaseStatus = 'DRAFT' | 'PENDING' | 'IN_PROGRESS' | 'QUALITY_CHECK' | 'DISPATCHED' | 'DELIVERED' | 'COMPLETED' | 'REJECTED';
export type Urgency = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  name: string;
  role: Role;
  labId?: string;
  organizationId?: string;
  organizationName?: string;
  orgRole?: 'OWNER' | 'ADMIN' | 'MEMBER';
  tier?: SubscriptionTier;
  avatarUrl?: string;
}

export interface Patient {
  id: string;
  dentistId: string;
  name: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  medicalHistory?: string;
  contactInfo?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string[];
  medicalAlerts?: string[];
  createdAt: string;
  outstandingBalance?: number;
  lastVisitDate?: string;
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
  patientGender?: 'MALE' | 'FEMALE' | 'OTHER';
  implantBrand?: string;
  scanBodyModel?: string;
  analogLogistics?: string;
  proposedDueDate?: string;
  dueDateProposalsCount?: number;
  deliveryTrackingId?: string;
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

// ----------------- TOOTH CHARTING (ODONTOGRAM) -----------------
export type ToothSurface = 'B' | 'M' | 'O' | 'D' | 'L' | 'I'; // Buccal/Facial, Mesial, Occlusal, Distal, Lingual, Incisal

export type ToothCondition =
  | 'healthy'
  | 'cavity'
  | 'filling'
  | 'rct'
  | 'crown'
  | 'missing'
  | 'implant'
  | 'bridge'
  | 'fracture'
  | 'sealant'
  | 'watch'
  | 'unerupted';

export interface ToothData {
  condition: ToothCondition;
  surfaces: {
    B?: ToothCondition;
    M?: ToothCondition;
    O?: ToothCondition;
    D?: ToothCondition;
    L?: ToothCondition;
    I?: ToothCondition;
  };
  note?: string;
}

export type ToothChartData = Record<number, ToothData>;

export interface ToothChartRecord {
  id: string;
  patientId: string;
  visitId?: string;
  teeth: ToothChartData;
  lastUpdated: string;
  updatedBy?: string;
}

// ----------------- CLINICAL VISITS & SOAP NOTES -----------------
export interface PrescriptionItem {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string; // e.g. "1-0-1 (Twice daily after food)"
  duration: string;  // e.g. "5 days"
  instructions: string; // e.g. "Take with warm water"
}

export interface ClinicalVisit {
  id: string;
  patientId: string;
  dentistId: string;
  appointmentId?: string;
  visitDate: string;
  chiefComplaint: string;
  diagnosis: string;
  clinicalFindings: string;
  treatmentRendered: string;
  procedures: string[];
  vitals?: {
    bp?: string;
    pulse?: string;
    temperature?: string;
    spO2?: string;
    bloodSugar?: string;
  };
  prescriptions: PrescriptionItem[];
  voiceTranscript?: string;
  toothChartSnapshot?: ToothChartData;
  linkedCaseId?: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
}

// ----------------- OPERATORY FLOW & CHAIR QUEUE -----------------
export type ChairStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE';

export interface OperatoryChair {
  id: string;
  name: string;
  roomNumber: string;
  status: ChairStatus;
  currentPatientId?: string;
  currentPatientName?: string;
  currentProcedure?: string;
  occupiedSince?: string;
  doctorName?: string;
}

export type QueueStage =
  | 'SCHEDULED'
  | 'CHECKED_IN'
  | 'WAITING'
  | 'IN_CHAIR'
  | 'IN_TREATMENT'
  | 'BILLING'
  | 'COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED';

export interface QueueEntry {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  dentistId: string;
  doctorName: string;
  scheduledTime: string;
  checkInTime?: string;
  waitingMinutes: number;
  stage: QueueStage;
  chairId?: string;
  chairName?: string;
  treatmentType: string;
  notes?: string;
}

// ----------------- CLINICAL INVENTORY & CONSUMABLES -----------------
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

export type ConsumableCategory =
  | 'RESTORATIVE'
  | 'ENDODONTICS'
  | 'PROSTHODONTICS'
  | 'SURGICAL'
  | 'PERIODONTICS'
  | 'PREVENTIVE'
  | 'PPE_DISPOSABLES';

export interface ConsumableItem {
  id: string;
  dentistId: string;
  name: string;
  category: ConsumableCategory;
  brand?: string;
  sku: string;
  currentStock: number;
  minThreshold: number;
  unit: string; // e.g., "Syringe", "Pack", "Cartridge", "Box", "Piece"
  costPerUnit: number;
  expiryDate?: string;
  supplierName?: string;
  location?: string; // e.g., "Cabinet A", "Operatory 1"
  lastRestocked?: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  itemName: string;
  movementType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'PROCEDURE_USE';
  quantity: number;
  previousStock: number;
  newStock: number;
  patientId?: string;
  visitId?: string;
  reason?: string;
  timestamp: string;
  performedBy: string;
}

// ----------------- BILLING & INVOICING -----------------
export interface InvoiceLineItem {
  id: string;
  description: string;
  toothNumber?: number;
  unitPrice: number;
  quantity: number;
  discount?: number;
  total: number;
}

export interface ClinicalInvoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  dentistId: string;
  visitId?: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  paymentMethod?: 'CASH' | 'UPI' | 'CARD' | 'NETBANKING' | 'INSURANCE';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  notes?: string;
}

// ----------------- CHAT & COMMUNICATION -----------------
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

// ----------------- MULTI-TENANCY & ORGANIZATIONS -----------------
export type OrganizationType = 'CLINIC' | 'LAB' | 'DSO_NETWORK';
export type OrgMemberRole = 'OWNER' | 'ADMIN' | 'DENTIST' | 'TECHNICIAN' | 'RECEPTIONIST';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  slug: string;
  billingEmail?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgMemberRole;
  createdAt: string;
}

// ----------------- SUBSCRIPTIONS & TIER ENTITLEMENTS -----------------
export type SubscriptionTier = 'STARTER' | 'PRO_LAB' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELED';

export type FeatureKey =
  | 'dicom_mpr'
  | 'cad_bridge'
  | 'whatsapp_automation'
  | 'unlimited_cases'
  | 'hardware_bridge'
  | 'ai_margin_detection'
  | 'merkle_audit'
  | 'custom_sso';

export interface SubscriptionFeatures {
  dicom_mpr: boolean;
  cad_bridge: boolean;
  whatsapp_automation: boolean;
  unlimited_cases: boolean;
  hardware_bridge: boolean;
  ai_margin_detection: boolean;
  merkle_audit: boolean;
  custom_sso: boolean;
}

export interface Subscription {
  id: string;
  organizationId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  casesUsedThisPeriod: number;
  caseLimit: number; // -1 indicates unlimited
  currentPeriodStart: string;
  currentPeriodEnd: string;
  features: SubscriptionFeatures;
  createdAt: string;
  updatedAt: string;
}
