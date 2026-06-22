import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import CaseDetailsClient from '@/components/views/CaseDetailsClient'

export default async function CaseDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: caseData, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !caseData) {
    return <div className="p-8 text-center">Case not found or you don't have access.</div>
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
    scanUrl: caseData.scan_url,
    createdAt: caseData.created_at
  }

  return <CaseDetailsClient initialCase={mappedCase} currentUser={currentUser} />
}
