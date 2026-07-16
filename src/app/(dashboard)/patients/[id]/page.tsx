import { createClient } from '@/lib/supabase/server'
import { getCachedUserProfile } from '@/lib/data'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, User, Calendar, Activity, Phone, ClipboardList, Camera } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'

export default async function PatientDetails({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const userProfile = await getCachedUserProfile()

  if (!userProfile || userProfile.role !== 'DENTIST') {
    redirect('/')
  }

  const { id } = params
  
  if (id === 'new') {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/patients">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Add New Patient</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              New patient form would be here, or use the "Create Case" flow to automatically create a patient while creating a case!
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch patient
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('dentist_id', userProfile.id)
    .single()

  if (patientError || !patient) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Patient not found or you don't have access.
      </div>
    )
  }

  // Fetch patient cases
  const { data: cases } = await supabase
    .from('cases')
    .select('*')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-5xl mx-auto w-full animate-fade-in">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {patient.name}
            </h2>
            <p className="text-muted-foreground flex items-center gap-2">
              Patient ID: {patient.id.split('-')[0].toUpperCase()}
            </p>
          </div>
          <Link href={`/patients/${id}/capture`}>
            <Button className="bg-primary text-primary-foreground">
              <Camera className="w-4 h-4 mr-2" />
              Intra-Oral Scan
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center"><User className="w-4 h-4 mr-2" /> Age & Gender</span>
                <span className="text-sm font-medium">
                  {patient.age ? `${patient.age} yrs` : 'N/A'}, {patient.gender ? patient.gender : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center"><Phone className="w-4 h-4 mr-2" /> Contact</span>
                <span className="text-sm font-medium">{patient.contact_info || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground flex items-center"><Calendar className="w-4 h-4 mr-2" /> Registered</span>
                <span className="text-sm font-medium">{new Date(patient.created_at).toLocaleDateString()}</span>
              </div>
              <div className="pt-2">
                <span className="text-sm text-muted-foreground flex items-center mb-2"><Activity className="w-4 h-4 mr-2" /> Medical History</span>
                <p className="text-sm bg-muted/30 p-3 rounded-lg border border-border">
                  {patient.medical_history || 'No medical history notes provided.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Case History
                </CardTitle>
                <CardDescription>All lab cases for this patient.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {!cases || cases.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg bg-muted/10">
                  <ClipboardList className="w-8 h-8 mx-auto mb-3 opacity-20" />
                  <p>No cases found for this patient.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cases.map((c) => (
                    <Link key={c.id} href={`/cases/${c.id}`} className="block">
                      <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all">
                        <div>
                          <p className="font-semibold">{c.requested_treatment}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(c.created_at).toLocaleDateString()} • {c.material} • Shade {c.shade}
                          </p>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
