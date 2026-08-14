/**
 * DCOS 2.0 / Next-Gen Reactive PMS — Domain Event Types & Bi-Temporal Contract
 * Standards: HL7 FHIR R5, ABDM JSON-LD, ISO 3950 (FDI Dental Notation)
 */

export type ToothSurface = 'M' | 'O' | 'D' | 'B' | 'L' | 'I' | 'F';

export type ObservationType =
  | 'caries'
  | 'restoration'
  | 'perio_probing'
  | 'mobility'
  | 'fracture'
  | 'endodontic'
  | 'implant'
  | 'missing';

export interface PerioProbeMetrics {
  /** 6-point probing depth in mm: [MB, B, DB, ML, L, DL] */
  probingDepthMm: [number, number, number, number, number, number];
  /** 6-point bleeding on probing boolean mask: [MB, B, DB, ML, L, DL] */
  bleedingOnProbing: [boolean, boolean, boolean, boolean, boolean, boolean];
  /** Clinical Attachment Level in mm (optional) */
  clinicalAttachmentLevelMm?: [number, number, number, number, number, number];
  /** Furcation involvement grade (0-4) */
  furcationGrade?: 0 | 1 | 2 | 3 | 4;
}

export interface FHIRObservationResource {
  resourceType: 'Observation';
  id?: string;
  status: 'preliminary' | 'final' | 'amended' | 'corrected';
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  bodySite?: {
    coding: Array<{
      system: 'http://snomed.info/sct' | 'http://fdi.org/tooth' | string;
      code: string;
      display: string;
    }>;
  };
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
  valueString?: string;
  note?: Array<{ text: string }>;
}

export interface DentalObservationPayload {
  encounter_id: string;
  patient_id: string;
  tooth_fdi: number; // 11-48 FDI Notation
  tooth_universal?: number; // 1-32 Universal Numbering System
  surfaces?: ToothSurface[];
  observation_type: ObservationType;
  restoration_material?: 'ZIRCONIA' | 'EMAX' | 'COMPOSITE' | 'AMALGAM' | 'PFM' | 'PMMA' | 'TITANIUM';
  perio_metrics?: PerioProbeMetrics;
  notes?: string;
  fhir_observation: FHIRObservationResource;
}

export interface PatientRegisteredPayload {
  mrn: string;
  national_health_id?: string; // ABDM 14-digit ABHA Number
  abha_address?: string; // patient@abdm
  name: {
    family: string;
    given: string[];
    prefix?: string;
  };
  gender: 'male' | 'female' | 'other' | 'unknown';
  birth_date: string; // YYYY-MM-DD
  telecom: Array<{
    system: 'phone' | 'email';
    value: string;
    use?: 'mobile' | 'home' | 'work';
  }>;
  primary_dentist_id: string;
  medical_alerts?: string[];
  allergies?: string[];
}

export interface AppointmentScheduledPayload {
  patient_id: string;
  provider_id: string;
  operatory_id: string;
  scheduled_start: string; // ISO8601
  estimated_duration_minutes: number;
  cpt_codes: string[];
  priority: 'routine' | 'urgent' | 'emergency';
}

export interface TreatmentPlannedPayload {
  encounter_id: string;
  patient_id: string;
  teeth: number[]; // FDI numbers
  treatment_code: string; // CDT Code (e.g. D2740 for crown)
  description: string;
  estimated_cost: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PLANNED' | 'ACCEPTED' | 'DECLINED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface CoverageVerifiedPayload {
  coverage_id: string;
  patient_id: string;
  payer_id: string;
  payer_name: string;
  subscriber_id: string;
  relationship: 'self' | 'spouse' | 'child' | 'other';
  status: 'active' | 'cancelled' | 'draft';
  copay_amount: number;
  deductible_remaining: number;
  annual_maximum_remaining: number;
  period: {
    start: string;
    end: string;
  };
}

export interface ChargeCapturedPayload {
  encounter_id: string;
  patient_id: string;
  charge_id: string;
  cdt_code: string;
  description: string;
  tooth_number?: number;
  surfaces?: ToothSurface[];
  fee_amount: number;
  patient_copay: number;
  insurance_share: number;
  status: 'PENDING' | 'BILLED' | 'SETTLED' | 'VOIDED';
}

export interface ClaimAdjudicatedPayload {
  claim_id: string;
  patient_id: string;
  payer_id: string;
  status: 'approved' | 'partial' | 'denied';
  total_submitted: number;
  total_benefit: number;
  patient_responsibility: number;
  adjudication_items: Array<{
    line_number: number;
    cdt_code: string;
    charge_amount: number;
    allowed_amount: number;
    paid_amount: number;
    reason_code?: string;
  }>;
}

/**
 * Universal Event Payload Union
 */
export type EventPayloadMap = {
  PatientRegistered: PatientRegisteredPayload;
  DentalObservationRecorded: DentalObservationPayload;
  AppointmentScheduled: AppointmentScheduledPayload;
  TreatmentPlanned: TreatmentPlannedPayload;
  CoverageVerified: CoverageVerifiedPayload;
  ChargeCaptured: ChargeCapturedPayload;
  ClaimAdjudicated: ClaimAdjudicatedPayload;
  [key: string]: any;
};

/**
 * The Canonical Domain Event Envelope
 * Implements strict Bi-Temporal metadata and SHA-256 Merkle chaining.
 */
export interface DomainEvent<T = any> {
  event_id: string;
  aggregate_id: string;
  aggregate_type: 'PatientAggregate' | 'EncounterAggregate' | 'ScheduleAggregate' | 'BillingAggregate' | 'LabCaseAggregate' | string;
  aggregate_version: number;
  event_type: keyof EventPayloadMap | string;
  /** Transaction Time: Immutable server commit timestamp */
  system_at: string;
  /** Valid Time: Real-world physical occurrence timestamp */
  observed_at: string;
  actor_id: string;
  payload: T;
  /** SHA-256 Merkle hash of previous event in this aggregate stream */
  prev_event_hash: string;
  /** SHA-256(prev_event_hash + aggregate_id + aggregate_version + system_at + observed_at + payload) */
  event_hash: string;
}
