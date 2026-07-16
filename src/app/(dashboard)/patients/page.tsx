import { createClient } from '@/lib/supabase/server'
import { getCachedUserProfile } from '@/lib/data'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Plus, User as UserIcon, Calendar, Activity, ChevronRight } from 'lucide-react'

export default async function PatientsDirectory() {
  const supabase = await createClient()
  const userProfile = await getCachedUserProfile()

  if (!userProfile) {
    redirect('/login')
  }

  if (userProfile.role !== 'DENTIST') {
    redirect('/')
  }

  // Fetch patients from Supabase
  // Note: if the table doesn't exist yet, this will return an error, which we will handle gracefully.
  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .eq('dentist_id', userProfile.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Patient Directory
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your patients, their medical history, and related cases.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/patients/new">
            <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300">
              <Plus className="mr-2 h-4 w-4" /> Add Patient
            </Button>
          </Link>
        </div>
      </div>

      {error ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-foreground">Database Setup Required</h3>
            <p className="text-muted-foreground max-w-md mt-2">
              The patients table is not available yet. Please ensure you have run the Supabase migration to create the Patient directory structure.
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-4 p-2 bg-muted rounded">
              {error.message}
            </p>
          </CardContent>
        </Card>
      ) : !patients || patients.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-foreground">No patients found</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              You haven't added any patients yet. Start by adding your first patient to manage their cases seamlessly.
            </p>
            <Link href="/patients/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Patient
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient: any) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all duration-300 group cursor-pointer bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{patient.name}</CardTitle>
                        <CardDescription>
                          {patient.age ? `${patient.age} yrs • ` : ''} 
                          {patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase() : 'Unspecified'}
                        </CardDescription>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-2 text-sm">
                    {patient.contact_info && (
                      <div className="flex items-center text-muted-foreground">
                        <UserIcon className="h-4 w-4 mr-2" />
                        <span className="truncate">{patient.contact_info}</span>
                      </div>
                    )}
                    {patient.medical_history && (
                      <div className="flex items-center text-muted-foreground">
                        <Activity className="h-4 w-4 mr-2" />
                        <span className="truncate">{patient.medical_history}</span>
                      </div>
                    )}
                    <div className="flex items-center text-muted-foreground mt-2 text-xs">
                      <Calendar className="h-3 w-3 mr-1.5" />
                      Added {new Date(patient.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
