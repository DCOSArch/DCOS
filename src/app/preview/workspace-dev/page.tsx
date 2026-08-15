// TEMPORARY visual-verification harness. Delete after use.
import { UnifiedClinicalWorkspace } from '@/components/patient-workspace/UnifiedClinicalWorkspace';
import { mockPatients, mockCases } from '@/mockData';

export default function WorkspaceDevPreview() {
  const patient = mockPatients[0];
  const cases = mockCases.filter(
    (c) => c.patientId === patient.id || c.patientName === patient.name,
  );

  return (
    <main className="flex-1 w-full px-4 py-4 md:px-6 md:py-5 xl:px-8 2xl:px-10">
      <UnifiedClinicalWorkspace patient={patient} cases={cases} />
    </main>
  );
}
