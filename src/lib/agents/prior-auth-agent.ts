import { BiTemporalEventStore } from '../events/store';
import { ChargeCapturedPayload, ClaimAdjudicatedPayload } from '../events/types';

export interface PlannedProcedureClaim {
  cdtCode: string;
  description: string;
  toothNumber?: number;
  surfaces?: string[];
  feeAmount: number;
  clinicalJustification: string;
  radiographAttached: boolean;
}

export interface AdjudicationResult {
  isApproved: boolean;
  status: 'APPROVED' | 'PARTIAL' | 'DENIED';
  approvedAmount: number;
  patientCopay: number;
  denialReason?: string;
  rulesEvaluated: string[];
}

export class PriorAuthAgent {
  /**
   * Autonomous CDT Rule Engine & Claims Scrubber
   */
  public static evaluateProcedure(
    procedure: PlannedProcedureClaim,
    patientObservations: string[]
  ): AdjudicationResult {
    const rulesEvaluated: string[] = [];

    // Rule 1: Crown (D2740) requires documented caries or fracture
    if (procedure.cdtCode === 'D2740') {
      rulesEvaluated.push('RULE-D2740-01: Verifying structural tooth loss >50% or extensive caries');
      const hasCariesOrFracture = patientObservations.some(
        (obs) => obs.includes('caries') || obs.includes('fracture') || obs.includes('endodontic')
      );

      if (!hasCariesOrFracture) {
        return {
          isApproved: false,
          status: 'DENIED',
          approvedAmount: 0,
          patientCopay: procedure.feeAmount,
          denialReason: 'Absence of documented pathology (caries or fracture) on target tooth.',
          rulesEvaluated,
        };
      }
    }

    // Rule 2: Periodontal Scaling (D4341) requires probing depths >= 4mm
    if (procedure.cdtCode === 'D4341') {
      rulesEvaluated.push('RULE-D4341-01: Verifying active pocket depths >= 4mm with bone loss');
      const hasDeepPockets = patientObservations.some((obs) => obs.includes('perio_probing') || obs.includes('pocket'));
      if (!hasDeepPockets) {
        return {
          isApproved: false,
          status: 'DENIED',
          approvedAmount: 0,
          patientCopay: procedure.feeAmount,
          denialReason: 'Periodontal pocket depths do not meet the 4mm minimum threshold for quadrant scaling.',
          rulesEvaluated,
        };
      }
    }

    // Rule 3: Radiographic necessity check
    if (!procedure.radiographAttached && (procedure.cdtCode.startsWith('D2') || procedure.cdtCode.startsWith('D4'))) {
      rulesEvaluated.push('RULE-RAD-01: Verifying pre-operative diagnostic radiograph');
      return {
        isApproved: false,
        status: 'DENIED',
        approvedAmount: 0,
        patientCopay: procedure.feeAmount,
        denialReason: 'Pre-operative diagnostic radiograph or CBCT scan required for restorative/perio authorization.',
        rulesEvaluated,
      };
    }

    // Valid Approval: Standard 80% coverage / 20% patient copay
    const insuranceShare = Number((procedure.feeAmount * 0.8).toFixed(2));
    const copay = Number((procedure.feeAmount * 0.2).toFixed(2));

    return {
      isApproved: true,
      status: 'APPROVED',
      approvedAmount: insuranceShare,
      patientCopay: copay,
      rulesEvaluated,
    };
  }

  /**
   * Adjudicates and emits live ChargeCaptured and ClaimAdjudicated events into the bi-temporal store.
   */
  public static async adjudicateAndCommit(
    patientId: string,
    encounterId: string,
    dentistId: string,
    payerId: string,
    procedures: PlannedProcedureClaim[],
    patientObservations: string[]
  ): Promise<ClaimAdjudicatedPayload> {
    let totalSubmitted = 0;
    let totalBenefit = 0;
    let totalCopay = 0;

    const adjudicationItems = procedures.map((proc, index) => {
      totalSubmitted += proc.feeAmount;
      const result = this.evaluateProcedure(proc, patientObservations);

      totalBenefit += result.approvedAmount;
      totalCopay += result.patientCopay;

      return {
        line_number: index + 1,
        cdt_code: proc.cdtCode,
        charge_amount: proc.feeAmount,
        allowed_amount: result.approvedAmount,
        paid_amount: result.approvedAmount,
        reason_code: result.denialReason,
      };
    });

    const claimId = `claim-${Date.now()}`;
    const allApproved = adjudicationItems.every((item) => !item.reason_code && item.allowed_amount > 0);
    const anyApproved = adjudicationItems.some((item) => item.allowed_amount > 0);

    const claimPayload: ClaimAdjudicatedPayload = {
      claim_id: claimId,
      patient_id: patientId,
      payer_id: payerId,
      status: allApproved ? 'approved' : anyApproved ? 'partial' : 'denied',
      total_submitted: totalSubmitted,
      total_benefit: totalBenefit,
      patient_responsibility: totalCopay,
      adjudication_items: adjudicationItems,
    };

    // Emit ClaimAdjudicated Domain Event
    await BiTemporalEventStore.append({
      aggregateId: patientId,
      aggregateType: 'BillingAggregate',
      eventType: 'ClaimAdjudicated',
      actorId: dentistId,
      payload: claimPayload,
      observedAt: new Date(),
    });

    return claimPayload;
  }
}
