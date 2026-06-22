import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import DentistDashboard from '@/components/dashboards/DentistDashboard'
import LabDashboard from '@/components/dashboards/LabDashboard'

export default async function DashboardRoot() {
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

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session?.user.id)
    .single()

  // Fetch Cases based on role
  let casesQuery = supabase.from('cases').select('*')
  
  if (userProfile?.role === 'DENTIST') {
    casesQuery = casesQuery.eq('dentist_id', userProfile.id)
  }

  const { data: cases } = await casesQuery

  const mappedCases = cases?.map(c => ({
    id: c.id,
    dentistId: c.dentist_id,
    labId: c.lab_id,
    patientName: c.patient_name,
    requestedTreatment: c.requested_treatment,
    status: c.status,
    urgency: c.urgency,
    dueDate: c.due_date,
    material: c.material,
    scanUrl: c.scan_url,
    createdAt: c.created_at
  })) || []

  if (userProfile?.role === 'LAB_ADMIN') {
    // Fetch inventory for LabDashboard
    const { data: inventoryData } = await supabase
      .from('inventory')
      .select('*')
      .eq('lab_id', userProfile.id) // Assuming lab admin is associated with their user ID for now

    const mappedInventory = inventoryData?.map(i => ({
      id: i.id,
      labId: i.lab_id,
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      unit: i.unit,
      threshold: i.threshold,
      lastRestocked: i.last_restocked
    })) || []

    return <LabDashboard initialCases={mappedCases} initialInventory={mappedInventory} />
  }

  // Default to Dentist view
  return <DentistDashboard initialCases={mappedCases} currentUser={userProfile} />
}
