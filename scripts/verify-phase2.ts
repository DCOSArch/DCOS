/**
 * DCOS 2.0 / Next-Gen Reactive PMS — Phase 2 Verification Test Suite
 * Validates: Merkle ledger integrity, Bi-temporal time travel, Tooth chart projection, FHIR R5, ABDM Fidelius.
 */

import { MerkleLedgerEngine } from '../src/lib/events/merkle';
import { BiTemporalEventStore } from '../src/lib/events/store';
import { ToothChartProjectionEngine } from '../src/lib/projections/tooth-chart';
import { FHIRR5Serializer } from '../src/lib/projections/fhir-r5';
import { ABHAService } from '../src/lib/abdm/abha-service';
import { CareContextEngine } from '../src/lib/abdm/care-context';
import { FideliusCryptoEngine } from '../src/lib/abdm/fidelius-crypto';
import { DomainEvent, PatientRegisteredPayload, DentalObservationPayload } from '../src/lib/events/types';

async function runPhase2Verification() {
  console.log('================================================================');
  console.log('🚀 STARTING DCOS 2.0 HARDENED PHASE 2 VERIFICATION SUITE');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  const patientId = `pat-${Date.now()}`;
  const dentistId = `doc-${Date.now()}`;
  const encounterId = `enc-${Date.now()}`;

  // -------------------------------------------------------------
  // TEST 1: Patient Registration & Bi-Temporal Commit
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: Bi-Temporal Event Ingestion & Merkle Sealing ---');

  const patientPayload: PatientRegisteredPayload = {
    mrn: 'MRN-2026-8891',
    national_health_id: '91-1234-5678-9012',
    abha_address: 'maneesh.vishnoi@abdm',
    name: { family: 'Sharma', given: ['Rahul'] },
    gender: 'male',
    birth_date: '1988-05-14',
    telecom: [{ system: 'phone', value: '+919876543210' }],
    primary_dentist_id: dentistId,
  };

  const regEvent = await BiTemporalEventStore.append<PatientRegisteredPayload>({
    aggregateId: patientId,
    aggregateType: 'PatientAggregate',
    eventType: 'PatientRegistered',
    actorId: dentistId,
    payload: patientPayload,
    observedAt: new Date(Date.now() - 3600 * 1000 * 24), // 24 hours ago
  });

  assert(Boolean(regEvent.event_hash), 'PatientRegistered event carries SHA-256 event_hash');
  assert(
    regEvent.prev_event_hash === MerkleLedgerEngine.GENESIS_HASH,
    'First event in aggregate links to GENESIS_HASH'
  );
  assert(
    MerkleLedgerEngine.verifyEventIntegrity(regEvent),
    'Cryptographic signature validation succeeds for initial event'
  );

  // -------------------------------------------------------------
  // TEST 2: Multi-Tooth Dental Observation & Periodontal Probing
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: High-Density Odontogram & 6-Point Perio Probing ---');

  const obsPayload1: DentalObservationPayload = {
    encounter_id: encounterId,
    patient_id: patientId,
    tooth_fdi: 16, // Upper Right First Molar
    tooth_universal: 3,
    surfaces: ['M', 'O', 'D'],
    observation_type: 'caries',
    perio_metrics: {
      probingDepthMm: [3, 2, 4, 3, 2, 5],
      bleedingOnProbing: [false, false, true, false, false, true],
    },
    fhir_observation: {
      resourceType: 'Observation',
      status: 'final',
      code: {
        coding: [{ system: 'http://snomed.info/sct', code: '80967001', display: 'CARIES' }],
      },
    },
  };

  const obsEvent1 = await BiTemporalEventStore.append<DentalObservationPayload>({
    aggregateId: patientId,
    aggregateType: 'EncounterAggregate',
    eventType: 'DentalObservationRecorded',
    actorId: dentistId,
    payload: obsPayload1,
    observedAt: new Date(Date.now() - 3600 * 1000 * 12), // 12 hours ago
  });

  assert(
    obsEvent1.prev_event_hash === regEvent.event_hash,
    'Second event successfully links to previous event_hash (Merkle Chain Monotonicity)'
  );

  // Add second observation (Tooth 21 Zirconia Crown Restoration)
  const obsPayload2: DentalObservationPayload = {
    encounter_id: encounterId,
    patient_id: patientId,
    tooth_fdi: 21, // Upper Left Central Incisor
    tooth_universal: 9,
    surfaces: ['B', 'L', 'I'],
    observation_type: 'restoration',
    restoration_material: 'ZIRCONIA',
    fhir_observation: {
      resourceType: 'Observation',
      status: 'final',
      code: {
        coding: [{ system: 'http://snomed.info/sct', code: '255459008', display: 'RESTORATION' }],
      },
    },
  };

  const obsEvent2 = await BiTemporalEventStore.append<DentalObservationPayload>({
    aggregateId: patientId,
    aggregateType: 'EncounterAggregate',
    eventType: 'DentalObservationRecorded',
    actorId: dentistId,
    payload: obsPayload2,
    observedAt: new Date(),
  });

  // Verify stream chain integrity across all events for this patient
  const allEvents = await BiTemporalEventStore.query({ aggregateId: patientId });
  const chainVerification = MerkleLedgerEngine.verifyStreamChain(allEvents);
  assert(chainVerification.isValid, 'Full aggregate stream chain passes cryptographic verification');

  // Verify Materialized Odontogram Projection
  await ToothChartProjectionEngine.projectEvent(obsEvent1);
  await ToothChartProjectionEngine.projectEvent(obsEvent2);

  const toothChart = ToothChartProjectionEngine.getPatientChart(patientId);
  assert(
    toothChart.teeth[16].activeConditions.some((c) => c.type === 'caries'),
    'Tooth 16 correctly projected active caries condition'
  );
  assert(
    toothChart.teeth[16].perioMetrics?.probingDepthMm[5] === 5,
    'Tooth 16 6-point perio probing depth correctly recorded (5mm at DL)'
  );
  assert(
    toothChart.teeth[21].activeConditions.some((c) => c.material === 'ZIRCONIA'),
    'Tooth 21 correctly projected Zirconia restoration'
  );

  // -------------------------------------------------------------
  // TEST 3: Bi-Temporal Time-Travel Query (Point-in-Time State Reconstruction)
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Bi-Temporal Time Travel State Reconstruction ---');

  // Query as of 18 hours ago (before Tooth 16 and Tooth 21 observations)
  const historicalChart = await ToothChartProjectionEngine.projectAsOf(
    patientId,
    allEvents,
    new Date(Date.now() - 3600 * 1000 * 18)
  );

  assert(
    historicalChart.teeth[16].activeConditions.length === 0,
    'Historical chart at T-18h correctly reflects clean tooth 16 (zero caries prior to observed_at)'
  );

  // -------------------------------------------------------------
  // TEST 4: HL7 FHIR R5 Serialization & Bundle Compilation
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: HL7 FHIR R5 Compliance & Bundling ---');

  const fhirPatient = FHIRR5Serializer.serializePatient(regEvent);
  assert(
    fhirPatient.resourceType === 'Patient' && fhirPatient.identifier.length >= 2,
    'FHIR R5 Patient resource serialized with multiple identifiers (MRN + ABHA)'
  );

  const fhirBundle = FHIRR5Serializer.compileEncounterBundle(regEvent, [obsEvent1, obsEvent2]);
  assert(
    fhirBundle.resourceType === 'Bundle' && fhirBundle.entry.length === 3,
    'FHIR R5 Diagnostic Document Bundle compiled with Patient + 2 Observations'
  );

  // -------------------------------------------------------------
  // TEST 5: ABDM M1, M2 & M3 Integration & Fidelius Encryption
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: ABDM Ecosystem & Fidelius Encryption ---');

  assert(ABHAService.isValidABHANumber('91-1234-5678-9012'), 'ABHA Number format validation succeeds');
  assert(ABHAService.isValidABHAAddress('maneesh.vishnoi@abdm'), 'ABHA Address validation succeeds');

  CareContextEngine.registerCareContext(patientId, {
    referenceNumber: `ENC-${encounterId.slice(-6)}`,
    display: 'Tooth 16 MOD Caries Prep & Tooth 21 Zirconia Crown',
    careContextType: 'PROCEDURE',
    encounterDate: new Date().toISOString().slice(0, 10),
  });

  const discoveredContexts = CareContextEngine.discoverCareContexts(patientId, 'Rahul Sharma');
  assert(
    discoveredContexts.careContexts.length >= 1,
    'ABDM Milestone 2 Care Context discovery successfully returned registered dental procedures'
  );

  const senderKeyPair = FideliusCryptoEngine.generateKeyPair();
  const dataEraseAt = new Date(Date.now() + 3600 * 1000 * 24 * 7).toISOString(); // 7 days
  const encryptedPayload = FideliusCryptoEngine.encryptFHIRBundle(
    JSON.stringify(fhirBundle),
    senderKeyPair,
    dataEraseAt
  );

  assert(
    Boolean(encryptedPayload.encryptedData) && encryptedPayload.keyMaterial.cryptoAlg === 'ECDH',
    'ABDM Milestone 3 Fidelius (ECDH Curve25519 + AES-GCM-256) encryption completed successfully'
  );
  assert(
    !FideliusCryptoEngine.isDataExpired(dataEraseAt),
    'Consent retention guardrail: data is not expired within valid consent window'
  );

  // -------------------------------------------------------------
  // TEST SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ALL DCOS 2.0 PHASE 2 SPECIFICATIONS HARDENED & VERIFIED WITH 100% SUCCESS.\n');
  } else {
    process.exit(1);
  }
}

runPhase2Verification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
