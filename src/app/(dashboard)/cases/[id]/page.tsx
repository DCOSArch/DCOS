import { redirect } from 'next/navigation';
import { getCachedSession, getCachedUserProfile } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import { mockPatients, mockCases } from '@/mockData';
import { UnifiedClinicalWorkspace } from '@/components/patient-workspace/UnifiedClinicalWorkspace';
import { LabWorkstationStudio } from '@/components/lab/LabWorkstationStudio';
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

  // If dentist viewing case, redirect to unified clinical workspace for that patient
  if (currentUser.role === 'DENTIST') {
    const targetPatientKey = caseData?.patient_id || caseData?.id || params.id;
    redirect(`/patients/${targetPatientKey}?caseId=${caseData?.id || params.id}`);
  }

  // Fallback for mock/standalone cases:
  let mappedCase: Case | null = null;
  if (caseData) {
    mappedCase = {
      id: caseData.id,
      patientId: caseData.patient_id || `pat_${caseData.id}`,
      dentistId: caseData.dentist_id,
      labId: caseData.lab_id,
      patientName: caseData.patient_name || 'Patient',
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

  // Find real patient from database
  let patient: Patient | null = null;
  if (mappedCase.patientId) {
    const { data: dbPat } = await supabase
      .from('patients')
      .select('*')
      .or(`id.eq.${mappedCase.patientId},name.ilike.%${mappedCase.patientName}%`)
      .maybeSingle();

    if (dbPat) {
      patient = {
        id: dbPat.id,
        dentistId: dbPat.dentist_id || mappedCase.dentistId,
        name: dbPat.name,
        age: dbPat.age || 30,
        gender: dbPat.gender || 'FEMALE',
        phone: dbPat.phone || dbPat.contact_info || '+91 98765 43210',
        createdAt: dbPat.created_at,
        medicalAlerts: dbPat.medical_alerts || [],
        medicalHistory: dbPat.medical_history || 'Standard clinical record.',
      };
    }
  }

  if (!patient) {
    patient = {
      id: mappedCase.patientId || `pat_${mappedCase.id}`,
      dentistId: mappedCase.dentistId || currentUser.id,
      name: mappedCase.patientName || 'Patient',
      age: mappedCase.patientAge || 30,
      gender: mappedCase.patientGender || 'FEMALE',
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

  if (currentUser.role === 'LAB_ADMIN') {
    return (
      <LabWorkstationStudio
        caseData={mappedCase}
        currentUser={currentUser}
        dentistName={caseData?.dentist?.name || 'Dr. Lead Practitioner'}
        initialTimeline={timelineData || []}
        initialMessages={initialMessages}
      />
    );
  }

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
