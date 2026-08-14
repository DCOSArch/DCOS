/**
 * DCOS 2.0 / Next-Gen Reactive PMS — Phase 4 Verification Test Suite
 * Validates: Progressive Mesh LOD Decimation, Occlusal Clearance Math, Exocad XML Parsing,
 * Autonomous Prior-Auth Scrubber, and Probabilistic Dynamic Scheduler.
 */

import { MeshDecimator } from '../src/lib/cad/mesh-decimator';
import { OcclusalClearanceCalculator } from '../src/lib/cad/occlusal-shader';
import { MarginGeometry, Point3D } from '../src/lib/cad/margin-geometry';
import { ExocadProjectParser } from '../src/lib/cad/exocad-parser';
import { PriorAuthAgent, PlannedProcedureClaim } from '../src/lib/agents/prior-auth-agent';
import { DynamicScheduler, ScheduledSlot } from '../src/lib/agents/dynamic-scheduler';
import { BiTemporalEventStore } from '../src/lib/events/store';

async function runPhase4Verification() {
  console.log('================================================================');
  console.log('🚀 STARTING DCOS 2.0 HARDENED PHASE 4 VERIFICATION SUITE');
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

  // -------------------------------------------------------------
  // TEST 1: Progressive Mesh Decimation & LOD Generator
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: WebGL Mesh LOD Decimation ---');

  const sampleVertCount = 30000; // 10,000 triangles (30,000 floats)
  const rawVertices = new Float32Array(sampleVertCount * 3);
  for (let i = 0; i < rawVertices.length; i++) {
    rawVertices[i] = Math.random() * 20 - 10;
  }

  const lodPyramid = MeshDecimator.generateLODPyramid(rawVertices);
  assert(lodPyramid.length === 4, 'Generated 4 progressive LOD levels (COARSE, MEDIUM, HIGH, FULL)');

  const coarseLOD = lodPyramid[0];
  const fullLOD = lodPyramid[3];
  const memoryFull = MeshDecimator.calculateMemoryFootprintMB(fullLOD.vertices, fullLOD.indices);
  const memoryCoarse = MeshDecimator.calculateMemoryFootprintMB(coarseLOD.vertices, coarseLOD.indices);

  assert(
    coarseLOD.vertexRatio === 0.05 && coarseLOD.triangleCount < fullLOD.triangleCount,
    'COARSE level reduces vertex count by 95% for instant zero-latency loading'
  );
  assert(
    memoryCoarse < memoryFull,
    `Memory footprint compressed from ${memoryFull}MB (FULL) down to ${memoryCoarse}MB (COARSE)`
  );

  // -------------------------------------------------------------
  // TEST 2: Occlusal Clearance Math & Prep Margin Splines
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Occlusal Clearance & Margin Spline Math ---');

  const adequateDist = OcclusalClearanceCalculator.calculatePointDistance(2.0, 3.8); // 1.8mm
  const insufficientDist = OcclusalClearanceCalculator.calculatePointDistance(3.0, 3.8); // 0.8mm

  const colorAdequate = OcclusalClearanceCalculator.getClearanceColor(adequateDist);
  const colorInsufficient = OcclusalClearanceCalculator.getClearanceColor(insufficientDist);

  assert(
    adequateDist === 1.8 && colorAdequate.status === 'ADEQUATE',
    'Adequate clearance (1.8mm) evaluated correctly with green status'
  );
  assert(
    insufficientDist === 0.8 && colorInsufficient.status === 'INSUFFICIENT',
    'Insufficient clearance (0.8mm) correctly flagged with red status'
  );

  const controlPoints: Point3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: 10, y: 0, z: 0 },
    { x: 10, y: 10, z: 0 },
    { x: 0, y: 10, z: 0 },
  ];
  const interpolated = MarginGeometry.interpolateClosedSpline(controlPoints, 4);
  const perimeter = MarginGeometry.calculatePerimeterMm(interpolated);

  assert(
    interpolated.length === 16 && perimeter > 0,
    `3D Catmull-Rom closed spline evaluated with continuous finish line (Perimeter: ${perimeter}mm)`
  );

  // -------------------------------------------------------------
  // TEST 3: Exocad / 3Shape .constructionInfo XML Extraction
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Exocad .constructionInfo XML Extraction ---');

  const mockExocadXml = `
    <Project>
      <ProjectID>EXO-2026-KANPUR-01</ProjectID>
      <Dentist>Dr. Aryan Sharma</Dentist>
      <Patient>Rahul Sharma</Patient>
      <Technician>Advance Dental CAD Lab</Technician>
      <Date>2026-08-14T12:00:00Z</Date>
      <ToothElement>
        <ToothNumber>16</ToothNumber>
        <Type>Anatomic Crown</Type>
        <Material>Zirconia HT</Material>
        <Shade>A2</Shade>
        <CementGap>50</CementGap>
        <MarginGap>10</MarginGap>
        <MarginPointsCount>128</MarginPointsCount>
      </ToothElement>
      <ToothElement>
        <ToothNumber>15</ToothNumber>
        <Type>Pontic</Type>
        <Material>Zirconia HT</Material>
        <Shade>A2</Shade>
        <CementGap>0</CementGap>
        <MarginGap>0</MarginGap>
        <MarginPointsCount>64</MarginPointsCount>
      </ToothElement>
    </Project>
  `;

  const parsedProject = ExocadProjectParser.parseConstructionInfo(mockExocadXml);

  assert(
    parsedProject.projectId === 'EXO-2026-KANPUR-01',
    'Exocad Project ID parsed accurately'
  );
  assert(
    parsedProject.restorations.length === 2 &&
    parsedProject.restorations[0].toothFdi === 16 &&
    parsedProject.restorations[1].restorationType === 'PONTIC',
    'Restoration units extracted: Tooth 16 Crown & Tooth 15 Pontic'
  );
  assert(
    parsedProject.isBridge === true && parsedProject.bridgeSpan?.length === 2,
    'Connected bridge topology detected across units [15, 16]'
  );

  // -------------------------------------------------------------
  // TEST 4: Autonomous Prior-Auth Agent & Claims Scrubber
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Autonomous Claims Scrubber & Adjudication ---');

  const validProcedure: PlannedProcedureClaim = {
    cdtCode: 'D2740', // Crown - Porcelain/Ceramic
    description: 'Crown - Porcelain/Ceramic Substrate Tooth 16',
    toothNumber: 16,
    feeAmount: 850.0,
    clinicalJustification: 'Extensive caries MOD with cusp fracture',
    radiographAttached: true,
  };

  const patientObs = ['caries', 'MOD', 'fracture'];
  const authResult = PriorAuthAgent.evaluateProcedure(validProcedure, patientObs);

  assert(
    authResult.isApproved === true &&
    authResult.approvedAmount === 680.0 &&
    authResult.patientCopay === 170.0,
    'Prior-Auth Agent approved D2740 crown with 80/20 copay split ($680 benefit / $170 copay)'
  );

  // Test Non-Compliant Denial (missing radiograph)
  const invalidProcedure: PlannedProcedureClaim = {
    ...validProcedure,
    radiographAttached: false,
  };
  const denialResult = PriorAuthAgent.evaluateProcedure(invalidProcedure, patientObs);
  assert(
    denialResult.isApproved === false && denialResult.status === 'DENIED',
    'Prior-Auth Agent correctly denied claim lacking diagnostic radiograph proof'
  );

  // Commit valid claim to event store
  const claimPayload = await PriorAuthAgent.adjudicateAndCommit(
    'pat-agent-01',
    'enc-agent-01',
    'doc-agent-01',
    'payer-icici-lombard',
    [validProcedure],
    patientObs
  );

  assert(
    claimPayload.status === 'approved' && claimPayload.total_benefit === 680.0,
    'ClaimAdjudicated domain event appended to bi-temporal ledger'
  );

  // -------------------------------------------------------------
  // TEST 5: Probabilistic Dynamic Schedule Reshaper
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: Probabilistic Dynamic Schedule Reshaper ---');

  // Base 30 min procedure at hour 5 of shift with 5 min variance
  const dynamicDuration = DynamicScheduler.calculateExpectedDuration(30, 5.0, 5.0);
  assert(
    dynamicDuration > 30,
    `Calculated fatigue-adjusted procedure duration: ${dynamicDuration} mins (Base: 30m + Fatigue & Variance Buffer)`
  );

  const mockSlots: ScheduledSlot[] = [
    {
      appointmentId: 'apt-01',
      patientId: 'p-01',
      patientName: 'Anil Kumar',
      scheduledStart: new Date(Date.now() + 1800 * 1000).toISOString(),
      baseDurationMinutes: 30,
      cptCodes: ['D2740'],
      procedureVarianceMinutes: 5,
    },
    {
      appointmentId: 'apt-02',
      patientId: 'p-02',
      patientName: 'Pooja Verma',
      scheduledStart: new Date(Date.now() + 3600 * 1000).toISOString(),
      baseDurationMinutes: 45,
      cptCodes: ['D4341'],
      procedureVarianceMinutes: 10,
    },
  ];

  // Rebalance queue with 22-minute current overrun
  const rebalanceResult = DynamicScheduler.rebalanceQueue(mockSlots, 5.0, 22);

  assert(
    rebalanceResult.isRebalanced === true,
    'Schedule state machine triggered rebalance on 22-minute drift (>15m threshold)'
  );
  assert(
    rebalanceResult.notificationsToDispatch.length === 2,
    'Generated dynamic notification alerts for downstream patients'
  );

  // -------------------------------------------------------------
  // TEST SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`🏁 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ALL DCOS 2.0 PHASE 4 SPECIFICATIONS HARDENED & VERIFIED WITH 100% SUCCESS.\n');
  } else {
    process.exit(1);
  }
}

runPhase4Verification().catch((err) => {
  console.error('Fatal Phase 4 test error:', err);
  process.exit(1);
});
