import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  const { data: cases } = await supabase
    .from('cases')
    .select('*')

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
    createdAt: c.created_at
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
