import { DomainEvent, DentalObservationPayload, PerioProbeMetrics, ToothSurface } from '../events/types';
import { MerkleLedgerEngine } from '../events/merkle';

export interface ToothConditionState {
  type: string;
  surfaces?: ToothSurface[];
  material?: string;
  notedAt: string;
  notes?: string;
}

export interface ToothState {
  toothNumber: number; // FDI 11-48
  toothUniversal: number; // 1-32
  activeConditions: ToothConditionState[];
  perioMetrics?: PerioProbeMetrics;
  isMissing: boolean;
  hasImplant: boolean;
  lastExaminedAt?: string;
}

export interface PatientToothChartReadModel {
  patientId: string;
  teeth: Record<number, ToothState>;
  updatedAt: string;
  streamVersion: number;
}

/** In-memory materialized projection cache */
const toothChartReadStore: Record<string, PatientToothChartReadModel> = {};

/** Convert FDI tooth number (11-48) to Universal Numbering System (1-32) */
export function fdiToUniversal(fdi: number): number {
  const mapping: Record<number, number> = {
    // Upper Right (Quadrant 1)
    18: 1, 17: 2, 16: 3, 15: 4, 14: 5, 13: 6, 12: 7, 11: 8,
    // Upper Left (Quadrant 2)
    21: 9, 22: 10, 23: 11, 24: 12, 25: 13, 26: 14, 27: 15, 28: 16,
    // Lower Left (Quadrant 3)
    38: 17, 37: 18, 36: 19, 35: 20, 34: 21, 33: 22, 32: 23, 31: 24,
    // Lower Right (Quadrant 4)
    41: 25, 42: 26, 43: 27, 44: 28, 45: 29, 46: 30, 47: 31, 48: 32,
  };
  return mapping[fdi] || 1;
}

/**
 * Tooth Chart & Periodontal Projection Engine
 * Transforms raw bi-temporal dental events into high-density clinical odontogram states.
 */
export class ToothChartProjectionEngine {
  /**
   * Initializes a baseline 32-tooth odontogram for a patient.
   */
  public static initializePatientChart(patientId: string): PatientToothChartReadModel {
    const teeth: Record<number, ToothState> = {};

    // Standard FDI teeth (11-18, 21-28, 31-38, 41-48)
    const quadrants = [
      [11, 12, 13, 14, 15, 16, 17, 18],
      [21, 22, 23, 24, 25, 26, 27, 28],
      [31, 32, 33, 34, 35, 36, 37, 38],
      [41, 42, 43, 44, 45, 46, 47, 48],
    ];

    for (const quad of quadrants) {
      for (const toothNum of quad) {
        teeth[toothNum] = {
          toothNumber: toothNum,
          toothUniversal: fdiToUniversal(toothNum),
          activeConditions: [],
          isMissing: false,
          hasImplant: false,
        };
      }
    }

    const chart: PatientToothChartReadModel = {
      patientId,
      teeth,
      updatedAt: new Date().toISOString(),
      streamVersion: 0,
    };

    toothChartReadStore[patientId] = chart;
    return chart;
  }

  /**
   * Projects a single domain event into the patient's odontogram read-model.
   */
  public static async projectEvent(event: DomainEvent): Promise<void> {
    // 1. Verify Cryptographic Integrity
    const isIntegrityValid = MerkleLedgerEngine.verifyEventIntegrity(event);
    if (!isIntegrityValid) {
      throw new Error(`CRITICAL: Cryptographic integrity failure for event ${event.event_id}`);
    }

    if (event.event_type === 'DentalObservationRecorded') {
      await this.handleDentalObservation(event);
    }
  }

  private static async handleDentalObservation(
    event: DomainEvent<DentalObservationPayload>
  ): Promise<void> {
    const {
      patient_id,
      tooth_fdi,
      surfaces,
      observation_type,
      restoration_material,
      perio_metrics,
      notes,
    } = event.payload;

    if (!toothChartReadStore[patient_id]) {
      this.initializePatientChart(patient_id);
    }

    const chart = toothChartReadStore[patient_id];
    let tooth = chart.teeth[tooth_fdi];

    if (!tooth) {
      tooth = {
        toothNumber: tooth_fdi,
        toothUniversal: fdiToUniversal(tooth_fdi),
        activeConditions: [],
        isMissing: false,
        hasImplant: false,
      };
      chart.teeth[tooth_fdi] = tooth;
    }

    // Update conditions
    if (observation_type === 'missing') {
      tooth.isMissing = true;
    } else if (observation_type === 'implant') {
      tooth.hasImplant = true;
    } else {
      tooth.activeConditions.push({
        type: observation_type,
        surfaces,
        material: restoration_material,
        notedAt: event.observed_at,
        notes,
      });
    }

    // Update 6-point perio metrics if provided
    if (perio_metrics) {
      tooth.perioMetrics = perio_metrics;
    }

    tooth.lastExaminedAt = event.observed_at;
    chart.updatedAt = event.system_at;
    chart.streamVersion = Math.max(chart.streamVersion, event.aggregate_version);
  }

  /**
   * Retrieves the current materialized tooth chart for a patient.
   */
  public static getPatientChart(patientId: string): PatientToothChartReadModel {
    if (!toothChartReadStore[patientId]) {
      return this.initializePatientChart(patientId);
    }
    return toothChartReadStore[patientId];
  }

  /**
   * Bi-Temporal State Reconstruction: Rebuilds patient chart state as it existed at a historical timestamp.
   */
  public static async projectAsOf(
    patientId: string,
    events: DomainEvent[],
    asOfObservedAt: string | Date
  ): Promise<PatientToothChartReadModel> {
    const maxTime = new Date(asOfObservedAt).getTime();
    const historicalEvents = events
      .filter((e) => new Date(e.observed_at).getTime() <= maxTime)
      .sort((a, b) => a.aggregate_version - b.aggregate_version);

    const tempChart = this.initializePatientChart(patientId);

    for (const event of historicalEvents) {
      if (event.event_type === 'DentalObservationRecorded') {
        const payload = event.payload as DentalObservationPayload;
        const tooth = tempChart.teeth[payload.tooth_fdi];
        if (tooth) {
          if (payload.observation_type === 'missing') tooth.isMissing = true;
          else if (payload.observation_type === 'implant') tooth.hasImplant = true;
          else {
            tooth.activeConditions.push({
              type: payload.observation_type,
              surfaces: payload.surfaces,
              material: payload.restoration_material,
              notedAt: event.observed_at,
              notes: payload.notes,
            });
          }
          if (payload.perio_metrics) tooth.perioMetrics = payload.perio_metrics;
          tooth.lastExaminedAt = event.observed_at;
        }
      }
    }

    return tempChart;
  }
}
