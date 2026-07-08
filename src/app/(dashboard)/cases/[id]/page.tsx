import { redirect } from 'next/navigation'
import CaseDetailsClient from '@/components/views/CaseDetailsClient'
import { getCachedSession, getCachedUserProfile } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

export default async function CaseDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getCachedSession()

  if (!session) {
    redirect('/login')
  }

  const supabase = await createClient()

  const [currentUser, caseResult, timelineResult, chatResult] = await Promise.all([
    getCachedUserProfile(),
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
      .maybeSingle()
  ])

  const { data: caseData, error } = caseResult
  const { data: timelineData } = timelineResult
  const { data: chatData } = chatResult

  if (error || !caseData) {
    return <div className="p-8 text-center">Case not found or you don't have access.</div>
  }

  let signedScanUrl = caseData.scan_url;

  // Construct Supabase public URL for the scan file
  if (caseData.scan_url && !caseData.scan_url.startsWith('http')) {
    signedScanUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/scans/${caseData.scan_url}`;
  }

  const mappedCase = {
    id: caseData.id,
    dentistId: caseData.dentist_id,
    labId: caseData.lab_id,
    patientName: caseData.patient_name,
    requestedTreatment: caseData.requested_treatment,
    status: caseData.status,
    urgency: caseData.urgency,
    dueDate: caseData.due_date,
    material: caseData.material,
    scanUrl: signedScanUrl,
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
    dueDateProposalsCount: caseData.due_date_proposals_count
  }

  const dentistName = (caseData.dentist as any)?.name || '';
  const labName = (caseData.lab as any)?.name || '';

  const initialMessages = chatData?.chat_messages?.map((m: any) => ({
    id: m.id,
    chatId: m.chat_id,
    senderId: m.sender_id,
    content: m.content,
    timestamp: m.created_at
  })) || [];

  return (
    <CaseDetailsClient 
      initialCase={mappedCase} 
      currentUser={currentUser} 
      initialDentistName={dentistName}
      initialLabName={labName}
      initialTimeline={timelineData || []}
      initialMessages={initialMessages}
      initialChatId={chatData?.id || null}
    />
  )
}
