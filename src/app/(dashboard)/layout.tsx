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
      {/* Full-bleed. Any max-width here centres the app and leaves dead gutters
          on wide displays — wrong for a clinical cockpit, where horizontal
          space is the scarce resource. Padding scales instead of clamping. */}
      <main className="flex-1 w-full px-4 py-4 md:px-6 md:py-5 xl:px-8 2xl:px-10">
        {children}
      </main>
    </>
  )
}
