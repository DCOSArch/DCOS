import { BiTemporalEventStore } from '../events/store';
import { DomainEvent } from '../events/types';
import { ToothChartProjectionEngine } from './tooth-chart';

/**
 * Master Projection Bus & Replay Coordinator
 * Synchronizes domain events into real-time materialized read models.
 */
export class MasterProjectionBus {
  private static initialized = false;

  public static initialize(): void {
    if (this.initialized) return;

    // Register real-time subscribers
    BiTemporalEventStore.subscribe(async (event: DomainEvent) => {
      try {
        await ToothChartProjectionEngine.projectEvent(event);
      } catch (err) {
        console.error(`Projection failure on event ${event.event_id}:`, err);
      }
    });

    this.initialized = true;
  }

  /**
   * Replays all historical events to rebuild full in-memory read models.
   */
  public static async rebuildAllProjections(): Promise<number> {
    return await BiTemporalEventStore.replayStream(async (event: DomainEvent) => {
      await ToothChartProjectionEngine.projectEvent(event);
    });
  }
}

// Auto-initialize projection bus on module load
MasterProjectionBus.initialize();

export * from './tooth-chart';
export * from './fhir-r5';
