import { createClient } from '@/lib/supabase/server';
import { getCachedUserProfile } from '@/lib/data';
import { mockPatients, mockCases } from '@/mockData';
import { UnifiedClinicalWorkspace } from '@/components/patient-workspace/UnifiedClinicalWorkspace';
import { Patient, Case } from '@/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function PatientDetailsPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ caseId?: string }>;
}) {
  const { id } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const targetCaseId = searchParams?.caseId;

  let patient: Patient | null = null;
  let cases: Case[] = [];
  let currentUser = null;

  try {
    const supabase = await createClient();
    currentUser = await getCachedUserProfile();

    // 1. Check patients table by ID or Name
    const { data: dbPatient } = await supabase
      .from('patients')
      .select('*')
      .or(`id.eq.${id},name.ilike.%${id}%`)
      .maybeSingle();

    if (dbPatient) {
      patient = {
        id: dbPatient.id,
        dentistId: dbPatient.dentist_id,
        name: dbPatient.name,
        age: dbPatient.age || 30,
        gender: dbPatient.gender || 'FEMALE',
        medicalHistory: dbPatient.medical_history,
        contactInfo: dbPatient.contact_info || dbPatient.phone,
        phone: dbPatient.phone || dbPatient.contact_info,
        createdAt: dbPatient.created_at,
      };

      const { data: dbCases } = await supabase
        .from('cases')
        .select('*')
        .or(`patient_id.eq.${dbPatient.id},patient_name.ilike.%${dbPatient.name}%`)
        .order('created_at', { ascending: false });

      if (dbCases) {
        cases = dbCases.map((c) => ({
          id: c.id,
          patientId: c.patient_id || dbPatient.id,
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
          instructions: c.instructions,
          designUrl: c.design_url,
          dicomUrl: c.dicom_url,
          patientAge: c.patient_age,
          patientGender: c.patient_gender,
          implantBrand: c.implant_brand,
          scanBodyModel: c.scan_body_model,
          analogLogistics: c.analog_logistics,
        }));
      }
    } else {
      // 2. Check if ID matches a Case record directly
      const { data: dbCase } = await supabase
        .from('cases')
        .select('*')
        .or(`id.eq.${id},patient_id.eq.${id},patient_name.ilike.%${id}%`)
        .maybeSingle();

      if (dbCase) {
        patient = {
          id: dbCase.patient_id || dbCase.id,
          dentistId: dbCase.dentist_id,
          name: dbCase.patient_name || 'Patient',
          age: dbCase.patient_age || 30,
          gender: dbCase.patient_gender || 'FEMALE',
          contactInfo: '+91 98765 43210',
          phone: '+91 98765 43210',
          createdAt: dbCase.created_at,
        };

        const { data: relatedCases } = await supabase
          .from('cases')
          .select('*')
          .or(`patient_name.ilike.%${dbCase.patient_name}%,patient_id.eq.${dbCase.patient_id || dbCase.id}`)
          .order('created_at', { ascending: false });

        if (relatedCases && relatedCases.length > 0) {
          cases = relatedCases.map((c) => ({
            id: c.id,
            patientId: c.patient_id || patient!.id,
            patientName: c.patient_name || patient!.name,
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
            instructions: c.instructions,
            designUrl: c.design_url,
            dicomUrl: c.dicom_url,
            patientAge: c.patient_age,
            patientGender: c.patient_gender,
            implantBrand: c.implant_brand,
            scanBodyModel: c.scan_body_model,
            analogLogistics: c.analog_logistics,
          }));
        }
      }
    }
  } catch (err) {
    console.warn('Supabase patient lookup error', err);
  }

  // 3. Fallback only if exact mock match exists (e.g. p1, p2, p3, p4)
  if (!patient) {
    const foundMock = mockPatients.find((p) => p.id === id || p.name.toLowerCase() === id.toLowerCase());
    if (foundMock) {
      patient = foundMock;
      cases = mockCases.filter((c) => c.patientId === foundMock.id || c.patientName === foundMock.name);
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

  return (
    <UnifiedClinicalWorkspace
      patient={patient}
      cases={cases}
      currentUser={currentUser || undefined}
      initialActiveCaseId={targetCaseId}
    />
  );
}
