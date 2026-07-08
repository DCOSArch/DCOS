import DentistDashboard from '@/components/dashboards/DentistDashboard'
import LabDashboard from '@/components/dashboards/LabDashboard'
import { getCachedUserProfile, getCachedCases } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardRoot() {
  const supabase = await createClient()

  const [userProfile, cases, labProfilesResult] = await Promise.all([
    getCachedUserProfile(),
    getCachedCases(),
    supabase.from('lab_profiles').select('*')
  ])

  if (!userProfile) {
    return <div className="p-8 text-center">User profile not found.</div>
  }

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
    createdAt: c.created_at,
    patientAge: c.patient_age,
    patientGender: c.patient_gender,
    implantBrand: c.implant_brand,
    scanBodyModel: c.scan_body_model,
    analogLogistics: c.analog_logistics,
    proposedDueDate: c.proposed_due_date,
    dueDateProposalsCount: c.due_date_proposals_count
  })) || []

  if (userProfile.role === 'LAB_ADMIN') {
    // Fetch inventory and dentists in parallel
    const [inventoryResult, dentistsResult] = await Promise.all([
      supabase
        .from('inventory_items')
        .select('*')
        .eq('lab_id', userProfile.lab_id || userProfile.id),
      supabase
        .from('users')
        .select('*')
        .eq('role', 'DENTIST')
    ])

    const inventoryData = inventoryResult.data
    const dentistsData = dentistsResult.data

    const mappedInventory = inventoryData?.map(i => ({
      id: i.id,
      labId: i.lab_id,
      name: i.name,
      category: i.category,
      quantity: i.quantity,
      unit: i.unit,
      threshold: i.threshold,
      lastRestocked: i.created_at
    })) || []

    return <LabDashboard initialCases={mappedCases} initialInventory={mappedInventory} availableDentists={dentistsData || []} />
  }

  // Default to Dentist view
  const labProfiles = labProfilesResult.data || []
  
  return <DentistDashboard initialCases={mappedCases} currentUser={userProfile} availableLabs={labProfiles} />
}
