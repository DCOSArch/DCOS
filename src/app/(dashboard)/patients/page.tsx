import { createClient } from '@/lib/supabase/server';
import { getCachedUserProfile } from '@/lib/data';
import { mockPatients } from '@/mockData';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, User as UserIcon, Calendar, Activity, ChevronRight, AlertTriangle, Phone } from 'lucide-react';

export default async function PatientsDirectory() {
  let userProfile = null;
  let patients: any[] = [];

  try {
    const supabase = await createClient();
    userProfile = await getCachedUserProfile();

    if (userProfile && userProfile.role === 'DENTIST') {
      const { data: dbPatients } = await supabase
        .from('patients')
        .select('*')
        .eq('dentist_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (dbPatients && dbPatients.length > 0) {
        patients = dbPatients;
      }
    }
  } catch (err) {
    console.warn('Database error, falling back to mock dataset', err);
  }

  // If no DB patients found or in demo mode, use our rich mockPatients
  if (patients.length === 0) {
    patients = mockPatients.map((p) => ({
      id: p.id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      medical_history: p.medicalHistory,
      contact_info: p.phone || p.contactInfo,
      created_at: p.createdAt,
      allergies: p.allergies,
      medicalAlerts: p.medicalAlerts,
      outstandingBalance: p.outstandingBalance,
    }));
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full animate-fade-in text-foreground">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="w-8 h-8 text-[#F92672]" />
            Patient Directory & Clinical Cockpit
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-sm">
            Access 360-degree patient workspaces, interactive tooth charts, clinical encounters, and digital lab cases.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {patients.map((patient: any) => (
          <Link key={patient.id} href={`/patients/${patient.id}`}>
            <Card className="h-full hover:border-[#66D9EF] hover:shadow-lg transition-all duration-300 group cursor-pointer bg-[#1E1F1C] border-border">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#F92672]/20 flex items-center justify-center text-[#F92672] font-extrabold group-hover:bg-[#F92672] group-hover:text-white transition-colors">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground group-hover:text-[#66D9EF] transition-colors">
                        {patient.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        {patient.age ? `${patient.age} yrs • ` : ''}
                        {patient.gender ? patient.gender : 'Gender N/A'}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-[#66D9EF] transition-all" />
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Phone className="w-3.5 h-3.5 text-[#66D9EF]" />
                    {patient.contact_info || 'No Phone'}
                  </span>
                  <span className="font-mono text-[11px]">
                    ID: {patient.id.toUpperCase()}
                  </span>
                </div>

                {patient.medicalAlerts && patient.medicalAlerts.length > 0 && (
                  <Badge variant="destructive" className="bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] flex items-center gap-1 w-fit">
                    <AlertTriangle className="w-3 h-3" />
                    {patient.medicalAlerts[0]}
                  </Badge>
                )}

                <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Registered: {new Date(patient.created_at).toLocaleDateString()}</span>
                  {patient.outstandingBalance !== undefined && (
                    <span className={`font-mono font-bold ${patient.outstandingBalance > 0 ? 'text-red-400' : 'text-[#A6E22E]'}`}>
                      {patient.outstandingBalance > 0 ? `Due: ₹${patient.outstandingBalance.toLocaleString()}` : 'Cleared'}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
