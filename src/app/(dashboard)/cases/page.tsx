import { redirect } from 'next/navigation';
import { getCachedSession, getCachedUserProfile, getCachedCases } from '@/lib/data';
import CasesIndexClient from '@/components/cases/CasesIndexClient';

export default async function CasesIndexPage() {
  const session = await getCachedSession();
  if (!session) redirect('/login');

  const [currentUser, cases] = await Promise.all([
    getCachedUserProfile(),
    getCachedCases(),
  ]);

  if (!currentUser) redirect('/login');

  const mappedCases = (cases || []).map((c: any) => ({
    id: c.id,
    dentistId: c.dentist_id,
    labId: c.lab_id,
    patientId: c.patient_id ?? undefined,
    patientName: c.patient_name,
    requestedTreatment: c.requested_treatment,
    status: c.status,
    urgency: c.urgency,
    dueDate: c.due_date,
    material: c.material,
    createdAt: c.created_at,
    shade: c.shade,
    selectedTeeth: c.selected_teeth,
    instructions: c.instructions,
    patientAge: c.patient_age,
    patientGender: c.patient_gender,
    proposedDueDate: c.proposed_due_date,
  }));

  return <CasesIndexClient initialCases={mappedCases} currentUser={currentUser} />;
}
