import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { getCachedSession, getCachedUserProfile, getCachedCases } from '@/lib/data'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getCachedSession()

  if (!session) {
    redirect('/login')
  }

  const [userProfile, cases] = await Promise.all([
    getCachedUserProfile(),
    getCachedCases()
  ])

  if (!userProfile) {
    redirect('/login')
  }

  // Map case objects to camelCase
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
    dicomUrl: c.dicom_url
  })) || [];

  return (
    <>
      <Navbar currentUser={userProfile} cases={mappedCases} />
      <main className="flex-1 w-full p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {children}
      </main>
    </>
  )
}
