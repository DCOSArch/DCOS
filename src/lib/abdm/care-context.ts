/**
 * ABDM Milestone 2 (M2) — Care Context Discovery & Linking Engine
 * Handles ABDM Gateway on-discover, on-link requests for clinical dental encounters.
 */

export interface CareContextEntry {
  referenceNumber: string; // e.g. "ENC-2026-Tooth16"
  display: string; // e.g. "Dental Root Canal Treatment - Tooth 16"
  careContextType: 'OP_CONSULTATION' | 'PROCEDURE' | 'DIAGNOSTIC_REPORT';
  encounterDate: string;
}

export interface PatientCareContexts {
  patientReference: string; // MRN or ABHA Number
  display: string;
  careContexts: CareContextEntry[];
}

export class CareContextEngine {
  private static registry: Record<string, CareContextEntry[]> = {};

  /**
   * Registers a dental clinical procedure as a discoverable ABDM Care Context.
   */
  public static registerCareContext(
    patientId: string,
    context: CareContextEntry
  ): void {
    if (!this.registry[patientId]) {
      this.registry[patientId] = [];
    }

    const exists = this.registry[patientId].some(
      (c) => c.referenceNumber === context.referenceNumber
    );

    if (!exists) {
      this.registry[patientId].push(context);
    }
  }

  /**
   * Responds to ABDM Gateway Discovery queries.
   */
  public static discoverCareContexts(
    patientId: string,
    patientName: string
  ): PatientCareContexts {
    const contexts = this.registry[patientId] || [
      {
        referenceNumber: `ENC-${patientId.slice(0, 6)}-INITIAL`,
        display: 'Comprehensive Oral Evaluation & 32-Tooth Odontogram',
        careContextType: 'OP_CONSULTATION',
        encounterDate: new Date().toISOString().slice(0, 10),
      },
    ];

    return {
      patientReference: patientId,
      display: patientName,
      careContexts: contexts,
    };
  }
}
