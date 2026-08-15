import { redirect } from 'next/navigation';
import { getCachedSession, getCachedUserProfile } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { mockPatients, mockCases } from '@/mockData';
import { UnifiedClinicalWorkspace } from '@/components/patient-workspace/UnifiedClinicalWorkspace';
import { Patient, Case } from '@/types';

export default async function CaseDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getCachedSession();

  if (!session) {
    redirect('/login');
  }

  const supabase = await createClient();
  const currentUser = await getCachedUserProfile();

  if (!currentUser) {
    redirect('/login');
  }

  const [caseResult, timelineResult, chatResult] = await Promise.all([
    supabase
      .from('cases')
      .select('*, dentist:users(name), lab:lab_profiles(name)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('timeline_events')
      .select('*')
      .eq('case_id', params.id)
      .order('timestamp', { ascending: false }),
    supabase
      .from('order_chats')
      .select('id, chat_messages(*)')
      .eq('case_id', params.id)
      .maybeSingle(),
  ]);

  const { data: caseData } = caseResult;
  const { data: timelineData } = timelineResult;
  const { data: chatData } = chatResult;

  // If case is linked to a patient, redirect to unified workspace with that case active
  if (caseData?.patient_id) {
    redirect(`/patients/${caseData.patient_id}?caseId=${caseData.id}`);
  }

  // Fallback for mock/standalone cases:
  let mappedCase: Case | null = null;
  if (caseData) {
    mappedCase = {
      id: caseData.id,
      patientId: caseData.patient_id || 'p1',
      dentistId: caseData.dentist_id,
      labId: caseData.lab_id,
      patientName: caseData.patient_name || 'Rahul Sharma',
      requestedTreatment: caseData.requested_treatment,
      status: caseData.status,
      urgency: caseData.urgency,
      dueDate: caseData.due_date,
      material: caseData.material,
      scanUrl: caseData.scan_url,
      createdAt: caseData.created_at,
      shade: caseData.shade,
      selectedTeeth: caseData.selected_teeth,
      instructions: caseData.instructions,
      designUrl: caseData.design_url,
      dicomUrl: caseData.dicom_url,
      patientAge: caseData.patient_age,
      patientGender: caseData.patient_gender,
      implantBrand: caseData.implant_brand,
      scanBodyModel: caseData.scan_body_model,
      analogLogistics: caseData.analog_logistics,
      proposedDueDate: caseData.proposed_due_date,
      dueDateProposalsCount: caseData.due_date_proposals_count,
    };
  } else {
    // Check mockCases
    const foundMockCase = mockCases.find((c) => c.id === params.id);
    if (foundMockCase) {
      mappedCase = foundMockCase;
    }
  }

  if (!mappedCase) {
    return <div className="p-8 text-center text-muted-foreground">Case not found or you do not have access.</div>;
  }

  // Find or synthesize patient
  let patient: Patient | null = mockPatients.find(p => p.id === mappedCase?.patientId || p.name === mappedCase?.patientName) || null;
  if (!patient) {
    patient = {
      id: mappedCase.patientId || 'p1',
      dentistId: mappedCase.dentistId || 'u1',
      name: mappedCase.patientName || 'Patient',
      age: mappedCase.patientAge || 35,
      gender: mappedCase.patientGender || 'MALE',
      phone: '+91 98765 43210',
      email: 'patient@example.com',
      createdAt: mappedCase.createdAt || new Date().toISOString(),
      medicalAlerts: [],
      medicalHistory: 'Standard clinical record.',
    };
  }

  const initialMessages = chatData?.chat_messages?.map((m: any) => ({
    id: m.id,
    chatId: m.chat_id,
    senderId: m.sender_id,
    content: m.content,
    timestamp: m.created_at,
  })) || [];

  return (
    <UnifiedClinicalWorkspace
      patient={patient}
      cases={[mappedCase]}
      currentUser={currentUser}
      initialActiveCaseId={mappedCase.id}
      initialTimeline={timelineData || []}
      initialMessages={initialMessages}
      initialChatId={chatData?.id || null}
    />
  );
}
