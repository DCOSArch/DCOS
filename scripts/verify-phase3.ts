/**
 * DCOS 2.0 / Next-Gen Reactive PMS — Phase 3 Verification Test Suite
 * Validates: Voice Activity Detection (VAD), Grammar-Constrained Decoding,
 * Hardware WebSocket Bridge, and Chairside Mobile QR Intake.
 */

import { VoiceActivityDetector } from '../src/lib/voice/vad';
import { DentalGrammarParser } from '../src/lib/voice/grammar-parser';
import { AmbientVoiceEngine } from '../src/lib/voice/ambient-engine';
import { CaptureAgentBridge } from '../src/lib/hardware/capture-agent-bridge';
import { QRIntakeManager } from '../src/lib/hardware/qr-intake';
import { ToothChartProjectionEngine } from '../src/lib/projections/tooth-chart';

async function runPhase3Verification() {
  console.log('================================================================');
  console.log('🚀 STARTING DCOS 2.0 HARDENED PHASE 3 VERIFICATION SUITE');
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

  const patientId = `pat-voice-${Date.now()}`;
  const dentistId = `doc-voice-${Date.now()}`;
  const encounterId = `enc-voice-${Date.now()}`;

  // -------------------------------------------------------------
  // TEST 1: Voice Activity Detection (VAD) RMS Energy & Frame Segmenting
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: Client-Side Voice Activity Detection (VAD) ---');

  const vad = new VoiceActivityDetector({ energyThreshold: 0.02 });

  // 1. Silent audio frame (RMS ~0)
  const silentFrame = new Float32Array(512).fill(0.001);
  const isSpeechSilent = vad.processFrame(silentFrame);
  assert(!isSpeechSilent, 'VAD correctly ignores background operatory silence (RMS < threshold)');

  // 2. Active speech audio frame (RMS > threshold)
  const activeFrame = new Float32Array(512);
  for (let i = 0; i < 512; i++) {
    activeFrame[i] = Math.sin(i / 10) * 0.1; // Sine wave speech simulation
  }
  const isSpeechActive = vad.processFrame(activeFrame);
  assert(isSpeechActive, 'VAD detects speech presence during active phonetic frame');

  // 3. Segment commitment
  const committedSegment = vad.commitSegment();
  assert(
    committedSegment !== null && committedSegment.pcmData.length >= 512,
    'VAD successfully commits contiguous audio segment with accurate sample buffer'
  );

  // -------------------------------------------------------------
  // TEST 2: Grammar-Constrained Decoding for Dental Nomenclature
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Grammar-Constrained Decoding (SNOMED-CT / ISO 3950) ---');

  // Case A: 6-Point Periodontal Probing Dictation
  const perioDictation = 'Probing depth tooth 16 mesial-buccal 5 millimeters with bleeding';
  const perioIntents = DentalGrammarParser.parse(perioDictation);

  assert(perioIntents.length === 1, 'Grammar parser extracted 1 periodontal intent');
  assert(
    perioIntents[0]?.toothFdi === 16 &&
    perioIntents[0]?.perioProbingLocation === 'MB' &&
    perioIntents[0]?.probingDepthMm === 5 &&
    perioIntents[0]?.bleeding === true,
    'Periodontal intent accurately decoded: Tooth 16, MB, 5mm, Bleeding=true'
  );

  // Case B: Caries & Surface Topology Dictation
  const cariesDictation = 'Tooth 46 MOD Caries';
  const cariesIntents = DentalGrammarParser.parse(cariesDictation);

  assert(
    Boolean(
      cariesIntents[0]?.toothFdi === 46 &&
      cariesIntents[0]?.observationType === 'caries' &&
      cariesIntents[0]?.surfaces?.includes('M') &&
      cariesIntents[0]?.surfaces?.includes('O') &&
      cariesIntents[0]?.surfaces?.includes('D')
    ),
    'Caries intent accurately decoded: Tooth 46, Surfaces [M, O, D]'
  );

  // Case C: Restorative Milestone Dictation
  const crownDictation = 'Tooth 21 Zirconia Crown';
  const crownIntents = DentalGrammarParser.parse(crownDictation);

  assert(
    Boolean(
      crownIntents[0]?.toothFdi === 21 &&
      crownIntents[0]?.restorationMaterial === 'ZIRCONIA'
    ),
    'Restorative intent accurately decoded: Tooth 21, Material Zirconia'
  );

  // -------------------------------------------------------------
  // TEST 3: Ambient Voice Engine End-to-End Commit to Event Store
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Ambient Voice Direct Event Store Commits ---');

  await AmbientVoiceEngine.processDictation(
    'Tooth 36 MOD Composite Restoration',
    encounterId,
    patientId,
    dentistId
  );

  const toothChart = ToothChartProjectionEngine.getPatientChart(patientId);
  const tooth36 = toothChart.teeth[36];

  assert(
    Boolean(tooth36 && tooth36.activeConditions.some((c) => c.material === 'COMPOSITE')),
    'Ambient dictation directly updated materialized odontogram (Tooth 36 Composite)'
  );

  // -------------------------------------------------------------
  // TEST 4: Hardware Bridge Protocol & Operatory Camera Snaps
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Hardware Bridge (ws://127.0.0.1:12345) ---');

  let receivedFrame: any = null;
  const unsubscribe = CaptureAgentBridge.onFrame((frame) => {
    receivedFrame = frame;
  });

  CaptureAgentBridge.triggerCapture('IOC-01', 16);

  assert(
    receivedFrame !== null && receivedFrame.toothNumber === 16,
    'Hardware capture bridge emitted frame with tooth metadata'
  );
  unsubscribe();

  // -------------------------------------------------------------
  // TEST 5: Chairside Mobile QR Intake Token Lifecycle
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Chairside Mobile QR Ingestion Lifecycle ---');

  const sessionToken = QRIntakeManager.generateSessionToken(patientId, encounterId, dentistId);
  assert(Boolean(sessionToken.token), 'Generated 15-minute mobile intake session token');

  const validation = QRIntakeManager.validateToken(sessionToken.token);
  assert(validation.isValid && validation.session?.patientId === patientId, 'Token successfully validated for patient intake');

  QRIntakeManager.markTokenUsed(sessionToken.token);
  assert(sessionToken.isUsed === true, 'Token successfully marked as used post-upload');

  // -------------------------------------------------------------
  // TEST SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ALL DCOS 2.0 PHASE 3 SPECIFICATIONS HARDENED & VERIFIED WITH 100% SUCCESS.\n');
  } else {
    process.exit(1);
  }
}

runPhase3Verification().catch((err) => {
  console.error('Fatal Phase 3 test error:', err);
  process.exit(1);
});
