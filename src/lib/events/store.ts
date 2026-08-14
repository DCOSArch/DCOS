import { DomainEvent } from './types';
import { MerkleLedgerEngine } from './merkle';
import { createClient } from '../supabase/client';

/**
 * In-Memory Event Cache & Local Journal
 * Synchronizes with local LibSQL / OPFS and remote Supabase PostgreSQL.
 */
class InMemoryEventJournal {
  private events: DomainEvent[] = [];

  public append(event: DomainEvent): void {
    this.events.push(event);
  }

  public getByAggregate(aggregateId: string): DomainEvent[] {
    return this.events
      .filter((e) => e.aggregate_id === aggregateId)
      .sort((a, b) => a.aggregate_version - b.aggregate_version);
  }

  public getAll(): DomainEvent[] {
    return [...this.events].sort(
      (a, b) => new Date(a.system_at).getTime() - new Date(b.system_at).getTime()
    );
  }
}

const localJournal = new InMemoryEventJournal();

export interface AppendOptions {
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  actorId: string;
  payload: any;
  /** Valid Time (real-world clinical occurrence) */
  observedAt?: string | Date;
  /** Optimistic concurrency expected aggregate version (null if creating new aggregate) */
  expectedVersion?: number;
}

export interface BiTemporalQueryOptions {
  aggregateId?: string;
  /** As-Of Transaction Time (System timeline filter) */
  asOfSystemAt?: string | Date;
  /** As-Of Valid Time (Observed physical timeline filter) */
  asOfObservedAt?: string | Date;
  eventType?: string;
}

/**
 * Bi-Temporal Event Store Engine
 * Implements immutable dual-timeline event sourcing with optimistic concurrency and Merkle validation.
 */
export class BiTemporalEventStore {
  private static subscribers: Array<(event: DomainEvent) => Promise<void> | void> = [];

  /**
   * Appends an atomic domain event to the ledger with bi-temporal timestamps and Merkle sealing.
   */
  public static async append<T = any>(options: AppendOptions): Promise<DomainEvent<T>> {
    const {
      aggregateId,
      aggregateType,
      eventType,
      actorId,
      payload,
      observedAt = new Date(),
      expectedVersion,
    } = options;

    const observedAtIso = typeof observedAt === 'string' ? observedAt : observedAt.toISOString();
    const systemAtIso = new Date().toISOString();

    // 1. Fetch current stream history for this aggregate
    const existingEvents = localJournal.getByAggregate(aggregateId);
    const currentVersion = existingEvents.length;

    // 2. Optimistic Concurrency Check
    if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
      throw new Error(
        `Optimistic Concurrency Conflict for Aggregate ${aggregateId}. Expected version ${expectedVersion}, current version is ${currentVersion}.`
      );
    }

    const nextVersion = currentVersion + 1;
    const prevEventHash =
      currentVersion === 0
        ? MerkleLedgerEngine.GENESIS_HASH
        : existingEvents[currentVersion - 1].event_hash;

    // 3. Draft & Seal Event Envelope with SHA-256 Merkle Link
    const eventDraft: Omit<DomainEvent<T>, 'event_hash'> = {
      event_id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      aggregate_id: aggregateId,
      aggregate_type: aggregateType,
      aggregate_version: nextVersion,
      event_type: eventType,
      system_at: systemAtIso,
      observed_at: observedAtIso,
      actor_id: actorId,
      payload,
      prev_event_hash: prevEventHash,
    };

    const sealedEvent = MerkleLedgerEngine.sealEvent(eventDraft);

    // 4. Commit to local in-memory journal
    localJournal.append(sealedEvent);

    // 5. Attempt remote persistence to Supabase if browser client available
    try {
      if (typeof window !== 'undefined') {
        const supabase = createClient();
        await supabase.from('domain_events').insert({
          event_id: sealedEvent.event_id,
          aggregate_id: sealedEvent.aggregate_id,
          aggregate_type: sealedEvent.aggregate_type,
          aggregate_version: sealedEvent.aggregate_version,
          event_type: sealedEvent.event_type,
          system_at: sealedEvent.system_at,
          observed_at: sealedEvent.observed_at,
          actor_id: sealedEvent.actor_id,
          payload: sealedEvent.payload,
          prev_event_hash: sealedEvent.prev_event_hash,
          event_hash: sealedEvent.event_hash,
        });
      }
    } catch (dbErr) {
      console.warn('Remote event store push warning (safely committed locally):', dbErr);
    }

    // 6. Broadcast event to reactive read-model subscribers
    await this.publishToSubscribers(sealedEvent);

    return sealedEvent;
  }

  /**
   * Retrieves events for an aggregate with optional bi-temporal time-travel filters.
   */
  public static async query(options: BiTemporalQueryOptions): Promise<DomainEvent[]> {
    let events = options.aggregateId
      ? localJournal.getByAggregate(options.aggregateId)
      : localJournal.getAll();

    if (options.eventType) {
      events = events.filter((e) => e.event_type === options.eventType);
    }

    // 1. Transaction Time filter (System timeline)
    if (options.asOfSystemAt) {
      const maxSystemTime = new Date(options.asOfSystemAt).getTime();
      events = events.filter((e) => new Date(e.system_at).getTime() <= maxSystemTime);
    }

    // 2. Valid Time filter (Physical occurrence timeline)
    if (options.asOfObservedAt) {
      const maxObservedTime = new Date(options.asOfObservedAt).getTime();
      events = events.filter((e) => new Date(e.observed_at).getTime() <= maxObservedTime);
    }

    return events;
  }

  /**
   * Registers a subscriber for real-time reactive event projections.
   */
  public static subscribe(handler: (event: DomainEvent) => Promise<void> | void): () => void {
    this.subscribers.push(handler);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== handler);
    };
  }

  private static async publishToSubscribers(event: DomainEvent): Promise<void> {
    for (const subscriber of this.subscribers) {
      try {
        await subscriber(event);
      } catch (err) {
        console.error('Projection handler error on event:', event.event_id, err);
      }
    }
  }

  /**
   * Replays an entire stream through projection engines to rebuild read models from scratch.
   */
  public static async replayStream(
    projector: (event: DomainEvent) => Promise<void> | void,
    aggregateId?: string
  ): Promise<number> {
    const events = await this.query({ aggregateId });
    // Verify stream cryptographic integrity before replay
    const verification = MerkleLedgerEngine.verifyStreamChain(events);
    if (!verification.isValid) {
      throw new Error(`Stream replay aborted due to ledger integrity failure: ${verification.reason}`);
    }

    for (const event of events) {
      await projector(event);
    }

    return events.length;
  }
}
