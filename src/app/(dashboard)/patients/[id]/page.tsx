import { createClient } from '@/lib/supabase/server';
import { getCachedUserProfile } from '@/lib/data';
import { mockPatients, mockCases } from '@/mockData';
import { PatientWorkspace } from '@/components/patient-workspace/PatientWorkspace';
import { Patient, Case } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function PatientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let patient: Patient | null = null;
  let cases: Case[] = [];

  try {
    const supabase = await createClient();
    const userProfile = await getCachedUserProfile();

    if (userProfile?.role === 'DENTIST') {
      const { data: dbPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (dbPatient) {
        patient = {
          id: dbPatient.id,
          dentistId: dbPatient.dentist_id,
          name: dbPatient.name,
          age: dbPatient.age,
          gender: dbPatient.gender,
          medicalHistory: dbPatient.medical_history,
          contactInfo: dbPatient.contact_info,
          phone: dbPatient.contact_info,
          createdAt: dbPatient.created_at,
        };

        const { data: dbCases } = await supabase
          .from('cases')
          .select('*')
          .eq('patient_id', id)
          .order('created_at', { ascending: false });

        if (dbCases) {
          cases = dbCases.map((c) => ({
            id: c.id,
            patientId: c.patient_id,
            patientName: c.patient_name || dbPatient.name,
            dentistId: c.dentist_id,
            labId: c.lab_id,
            status: c.status,
            urgency: c.urgency,
            requestedTreatment: c.requested_treatment,
            material: c.material,
            scanUrl: c.scan_url,
            createdAt: c.created_at,
            dueDate: c.due_date,
            shade: c.shade,
            selectedTeeth: c.selected_teeth,
          }));
        }
      }
    }
  } catch (err) {
    console.warn('Supabase patient lookup fallback to mock dataset', err);
  }

  // Fallback to rich mock patient if not found in db or in local development
  if (!patient) {
    const foundMock = mockPatients.find((p) => p.id === id);
    if (foundMock) {
      patient = foundMock;
      cases = mockCases.filter((c) => c.patientId === id);
    }
  }

  if (!patient) {
    return (
      <div className="flex-1 p-8 text-center space-y-4 max-w-md mx-auto">
        <h3 className="text-xl font-bold text-foreground">Patient Record Not Found</h3>
        <p className="text-sm text-muted-foreground">
          The requested patient ID ({id}) could not be located in the clinic registry.
        </p>
        <Link href="/patients">
          <Button variant="outline" className="mt-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Patient Directory
          </Button>
        </Link>
      </div>
    );
  }

  return <PatientWorkspace patient={patient} cases={cases} />;
}
