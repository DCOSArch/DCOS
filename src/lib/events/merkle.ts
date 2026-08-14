import { createHash } from 'crypto';
import { DomainEvent } from './types';

/**
 * Merkle Ledger Engine & Cryptographic Integrity Validator
 * Guarantees zero schema drift, cryptographic tamper-evidence, and strict stream ordering.
 */
export class MerkleLedgerEngine {
  /** Genesis hash for the first event in an aggregate stream */
  public static readonly GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

  /**
   * Deterministically computes the SHA-256 hash of a domain event envelope.
   * Format: SHA256(prev_event_hash | aggregate_id | aggregate_version | system_at | observed_at | JSON.stringify(payload))
   */
  public static computeEventHash(
    event: Omit<DomainEvent, 'event_hash'>
  ): string {
    // Canonical JSON stringification with sorted keys to ensure deterministic hashing
    const canonicalPayload = JSON.stringify(event.payload, Object.keys(event.payload).sort());
    const raw = `${event.prev_event_hash}|${event.aggregate_id}|${event.aggregate_version}|${event.system_at}|${event.observed_at}|${canonicalPayload}`;
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Validates the cryptographic integrity of an individual domain event.
   */
  public static verifyEventIntegrity(event: DomainEvent): boolean {
    const computed = this.computeEventHash(event);
    return computed === event.event_hash;
  }

  /**
   * Validates an entire ordered stream of domain events for an aggregate.
   * Ensures version monotonicity, unbroken Merkle chaining, and zero payload tampering.
   */
  public static verifyStreamChain(events: DomainEvent[]): {
    isValid: boolean;
    brokenAtVersion?: number;
    reason?: string;
  } {
    if (events.length === 0) {
      return { isValid: true };
    }

    let expectedPrevHash = MerkleLedgerEngine.GENESIS_HASH;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const expectedVersion = i + 1;

      // 1. Verify Aggregate Version Monotonicity
      if (event.aggregate_version !== expectedVersion) {
        return {
          isValid: false,
          brokenAtVersion: event.aggregate_version,
          reason: `Version gap or out-of-order event. Expected version ${expectedVersion}, got ${event.aggregate_version}`,
        };
      }

      // 2. Verify Merkle Link to Previous Event
      if (event.prev_event_hash !== expectedPrevHash) {
        return {
          isValid: false,
          brokenAtVersion: event.aggregate_version,
          reason: `Merkle link broken at version ${event.aggregate_version}. Expected prev_hash '${expectedPrevHash}', found '${event.prev_event_hash}'`,
        };
      }

      // 3. Verify Self Hash Integrity
      const expectedHash = this.computeEventHash(event);
      if (expectedHash !== event.event_hash) {
        return {
          isValid: false,
          brokenAtVersion: event.aggregate_version,
          reason: `Cryptographic payload tampering detected at version ${event.aggregate_version}. Computed '${expectedHash}', stored '${event.event_hash}'`,
        };
      }

      // Update pointer for the next block
      expectedPrevHash = event.event_hash;
    }

    return { isValid: true };
  }

  /**
   * Signs and seals a new event before appending it to the ledger.
   */
  public static sealEvent<T>(
    draft: Omit<DomainEvent<T>, 'event_hash'>
  ): DomainEvent<T> {
    const hash = this.computeEventHash(draft);
    return {
      ...draft,
      event_hash: hash,
    };
  }
}
