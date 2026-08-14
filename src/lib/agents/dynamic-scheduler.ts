/**
 * DCOS 2.0 / Next-Gen Reactive PMS — Phase 4 Probabilistic Dynamic Schedule Reshaper
 * Models provider fatigue and procedure variance: E[D_actual] = D_base * beta(t) + k * sigma_proc
 */

export interface ScheduledSlot {
  appointmentId: string;
  patientId: string;
  patientName: string;
  scheduledStart: string; // ISO8601
  baseDurationMinutes: number;
  cptCodes: string[];
  procedureVarianceMinutes: number;
  actualStart?: string;
  actualDurationMinutes?: number;
  adjustedStart?: string;
}

export interface ScheduleRebalanceResult {
  isRebalanced: boolean;
  totalDriftMinutes: number;
  rebalancedSlots: ScheduledSlot[];
  notificationsToDispatch: Array<{
    patientId: string;
    patientName: string;
    newScheduledStart: string;
    delayMinutes: number;
  }>;
}

export class DynamicScheduler {
  private static readonly ALPHA_FATIGUE = 0.05; // Fatigue acceleration coefficient
  private static readonly T0_HOURS = 4.0; // Half-shift baseline hours
  private static readonly CONFIDENCE_BUFFER_K = 1.28; // 90% confidence interval multiplier

  /**
   * Calculates expected procedure duration considering continuous provider cognitive fatigue.
   * Formula: E[D_actual] = D_base * (1 + alpha * ln(1 + t / T0)) + k * sigma_proc
   */
  public static calculateExpectedDuration(
    baseDurationMinutes: number,
    shiftElapsedHours: number,
    procedureVarianceMinutes = 5.0
  ): number {
    const fatigueMultiplier = 1 + this.ALPHA_FATIGUE * Math.log(1 + shiftElapsedHours / this.T0_HOURS);
    const varianceBuffer = this.CONFIDENCE_BUFFER_K * procedureVarianceMinutes;
    const expected = baseDurationMinutes * fatigueMultiplier + varianceBuffer;
    return Math.round(expected);
  }

  /**
   * Rebalances a clinic schedule queue when delay drift exceeds the 15-minute threshold.
   */
  public static rebalanceQueue(
    slots: ScheduledSlot[],
    shiftElapsedHours: number,
    currentOverrunMinutes: number
  ): ScheduleRebalanceResult {
    const notifications: ScheduleRebalanceResult['notificationsToDispatch'] = [];
    let cumulativeDelay = currentOverrunMinutes;

    const rebalancedSlots = slots.map((slot) => {
      // Calculate adjusted expected duration
      const dynamicDuration = this.calculateExpectedDuration(
        slot.baseDurationMinutes,
        shiftElapsedHours,
        slot.procedureVarianceMinutes
      );

      const originalStartTime = new Date(slot.scheduledStart).getTime();
      const adjustedStartTime = new Date(originalStartTime + cumulativeDelay * 60 * 1000).toISOString();

      if (cumulativeDelay >= 15) {
        notifications.push({
          patientId: slot.patientId,
          patientName: slot.patientName,
          newScheduledStart: adjustedStartTime,
          delayMinutes: cumulativeDelay,
        });
      }

      // Add small procedure buffer drift for subsequent appointments
      cumulativeDelay += Math.max(0, dynamicDuration - slot.baseDurationMinutes);

      return {
        ...slot,
        adjustedStart: adjustedStartTime,
      };
    });

    return {
      isRebalanced: currentOverrunMinutes >= 15,
      totalDriftMinutes: currentOverrunMinutes,
      rebalancedSlots,
      notificationsToDispatch: notifications,
    };
  }
}
