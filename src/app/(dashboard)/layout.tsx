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
      {/* 1600px rather than max-w-7xl (1280px): this is a data-dense clinical
          cockpit and 1280 left ~300px of dead gutter per side on wide
          displays. */}
      <main className="flex-1 w-full p-4 md:p-6 lg:px-8 lg:py-6 max-w-[1600px] mx-auto">
        {children}
      </main>
    </>
  )
}
