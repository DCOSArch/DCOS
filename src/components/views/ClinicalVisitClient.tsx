'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToothChart } from '@/components/dentos/ToothChart';
import { VisitVoiceRecorder } from '@/components/dentos/VisitVoiceRecorder';
import {
  Patient,
  ClinicalVisit,
  PrescriptionItem,
  ToothChartData,
} from '@/types';
import {
  mockPatients,
  mockClinicalVisits,
} from '@/mockData';
import {
  getPatientToothChart,
  savePatientToothChart,
  saveClinicalVisit,
} from '@/lib/services';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Plus,
  Trash2,
  Activity,
  FileText,
  User,
  Heart,
  Sparkles,
  Layers,
} from 'lucide-react';

export function ClinicalVisitClient({ visitId }: { visitId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdFromQuery = searchParams.get('patientId') || 'p1';

  const [patient, setPatient] = useState<Patient>(
    mockPatients.find((p) => p.id === patientIdFromQuery) || mockPatients[0]
  );
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [clinicalFindings, setClinicalFindings] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentRendered, setTreatmentRendered] = useState('');
  const [procedures, setProcedures] = useState<string[]>(['Clinical Examination']);
  const [newProcedure, setNewProcedure] = useState('');
  const [bp, setBp] = useState('120/80');
  const [pulse, setPulse] = useState('72 bpm');
  const [temp, setTemp] = useState('98.6 F');
  const [spO2, setSpO2] = useState('99%');
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      id: 'rx-init-1',
      drugName: 'Amoxicillin 500mg',
      dosage: '1 Tab',
      frequency: '1-0-1 (Twice daily after food)',
      duration: '5 days',
      instructions: 'Take after meals',
    },
  ]);
  const [toothChart, setToothChart] = useState<ToothChartData>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (patient?.id) {
      setToothChart(getPatientToothChart(patient.id));
    }
  }, [patient?.id]);

  const handleVoiceExtraction = (data: { transcript: string; extracted: any }) => {
    if (data.extracted.chiefComplaint) setChiefComplaint(data.extracted.chiefComplaint);
    if (data.extracted.clinicalFindings) setClinicalFindings(data.extracted.clinicalFindings);
    if (data.extracted.diagnosis) setDiagnosis(data.extracted.diagnosis);
    if (data.extracted.treatmentRendered) setTreatmentRendered(data.extracted.treatmentRendered);
  };

  const handleAddPrescription = () => {
    const newItem: PrescriptionItem = {
      id: `rx-${Date.now()}`,
      drugName: '',
      dosage: '1 Tab',
      frequency: '1-0-1',
      duration: '3 days',
      instructions: 'After meals',
    };
    setPrescriptions([...prescriptions, newItem]);
  };

  const handleRemovePrescription = (id: string) => {
    setPrescriptions(prescriptions.filter((p) => p.id !== id));
  };

  const handleUpdatePrescription = (id: string, field: keyof PrescriptionItem, val: string) => {
    setPrescriptions(
      prescriptions.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleAddProcedure = () => {
    if (newProcedure.trim()) {
      setProcedures([...procedures, newProcedure.trim()]);
      setNewProcedure('');
    }
  };

  const handleSaveVisit = () => {
    setIsSaving(true);

    const newVisitRecord: ClinicalVisit = {
      id: visitId === 'new' ? `v-${Date.now()}` : visitId,
      patientId: patient.id,
      dentistId: 'u1',
      visitDate: new Date().toISOString().slice(0, 10),
      chiefComplaint: chiefComplaint || 'Routine clinical assessment',
      diagnosis: diagnosis || 'General Dental Examination',
      clinicalFindings: clinicalFindings || 'No acute abnormalities',
      treatmentRendered: treatmentRendered || 'Examination and treatment planning conducted',
      procedures,
      vitals: { bp, pulse, temperature: temp, spO2 },
      prescriptions: prescriptions.filter((p) => p.drugName.trim()),
      toothChartSnapshot: toothChart,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveClinicalVisit(newVisitRecord);
    savePatientToothChart(patient.id, toothChart);

    setTimeout(() => {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => {
        router.push(`/patients/${patient.id}`);
      }, 1200);
    }, 600);
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 max-w-6xl mx-auto w-full animate-fade-in text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href={`/patients/${patient.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Clinical Encounter & SOAP Notes
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Patient: <strong className="text-[#66D9EF]">{patient.name}</strong> ({patient.id.toUpperCase()}) • Date: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveVisit}
            disabled={isSaving}
            className="bg-[#A6E22E] text-[#272822] hover:bg-[#A6E22E]/90 font-bold text-xs shadow-lg shadow-[#A6E22E]/20"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-[#272822]" /> Visit Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" /> Save & Finalize Encounter
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Voice Dictation Bar */}
      <VisitVoiceRecorder onApplyExtraction={handleVoiceExtraction} />

      {/* Main Form Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: SOAP Notes & Vitals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Vitals Card */}
          <Card className="bg-[#1E1F1C] border-border">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" /> Patient Vitals
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1">Blood Pressure:</label>
                <input
                  type="text"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#272822] border border-border font-mono text-foreground"
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1">Pulse:</label>
                <input
                  type="text"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#272822] border border-border font-mono text-foreground"
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1">Temperature:</label>
                <input
                  type="text"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#272822] border border-border font-mono text-foreground"
                />
              </div>
              <div>
                <label className="text-muted-foreground block mb-1">SpO2:</label>
                <input
                  type="text"
                  value={spO2}
                  onChange={(e) => setSpO2(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded bg-[#272822] border border-border font-mono text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          {/* SOAP Clinical Entry Form */}
          <Card className="bg-[#1E1F1C] border-border">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F92672]" /> SOAP Clinical Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              {/* S: Subjective / Chief Complaint */}
              <div>
                <label className="font-bold text-[#66D9EF] uppercase block mb-1">
                  1. Subjective / Chief Complaint:
                </label>
                <textarea
                  rows={2}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Patient's reported symptoms, duration, triggers (e.g. sharp cold sensitivity on lower left molar)..."
                  className="w-full p-2.5 rounded-lg bg-[#272822] border border-border text-foreground focus:ring-1 focus:ring-[#66D9EF]"
                />
              </div>

              {/* O: Objective / Clinical Findings */}
              <div>
                <label className="font-bold text-[#A6E22E] uppercase block mb-1">
                  2. Objective / Clinical & Radiographic Findings:
                </label>
                <textarea
                  rows={2}
                  value={clinicalFindings}
                  onChange={(e) => setClinicalFindings(e.target.value)}
                  placeholder="Intraoral examination, percussion testing, IOPA radiographic assessment, probing depths..."
                  className="w-full p-2.5 rounded-lg bg-[#272822] border border-border text-foreground focus:ring-1 focus:ring-[#A6E22E]"
                />
              </div>

              {/* A: Assessment / Diagnosis */}
              <div>
                <label className="font-bold text-[#F92672] uppercase block mb-1">
                  3. Assessment / Clinical Diagnosis:
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Symptomatic Irreversible Pulpitis #36 / Dental Caries #26..."
                  className="w-full p-2.5 rounded-lg bg-[#272822] border border-border text-foreground font-semibold focus:ring-1 focus:ring-[#F92672]"
                />
              </div>

              {/* P: Plan & Treatment Rendered */}
              <div>
                <label className="font-bold text-[#FD971F] uppercase block mb-1">
                  4. Plan / Treatment Rendered Today:
                </label>
                <textarea
                  rows={3}
                  value={treatmentRendered}
                  onChange={(e) => setTreatmentRendered(e.target.value)}
                  placeholder="Exact clinical procedure performed, local anesthesia administered, restorative materials used..."
                  className="w-full p-2.5 rounded-lg bg-[#272822] border border-border text-foreground focus:ring-1 focus:ring-[#FD971F]"
                />
              </div>

              {/* Performed Procedure Tags */}
              <div className="pt-2">
                <label className="font-semibold text-muted-foreground block mb-1.5">
                  Procedure Codes / Tags:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {procedures.map((p, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-[#272822] text-xs py-1 px-2 border border-border flex items-center gap-1">
                      {p}
                      <button
                        type="button"
                        onClick={() => setProcedures(procedures.filter((_, i) => i !== idx))}
                        className="hover:text-red-400 ml-1"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProcedure}
                    onChange={(e) => setNewProcedure(e.target.value)}
                    placeholder="Add procedure (e.g. Rubber Dam Isolation, Composite Restoration)..."
                    className="flex-1 px-2.5 py-1.5 rounded bg-[#272822] border border-border text-foreground text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProcedure())}
                  />
                  <Button size="sm" variant="outline" onClick={handleAddProcedure} className="text-xs">
                    Add Tag
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prescriptions (Rx) Writer */}
          <Card className="bg-[#1E1F1C] border-border">
            <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FD971F]" /> Prescriptions (Rx) Writer
              </CardTitle>
              <Button size="sm" variant="outline" onClick={handleAddPrescription} className="text-xs h-7">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Medication
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="p-3 rounded-lg bg-[#272822] border border-border space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <label className="text-muted-foreground block text-[10px]">Drug Name & Strength:</label>
                      <input
                        type="text"
                        value={rx.drugName}
                        onChange={(e) => handleUpdatePrescription(rx.id, 'drugName', e.target.value)}
                        placeholder="e.g. Amoxicillin 500mg, Zerodol-SP..."
                        className="w-full px-2 py-1 rounded bg-[#1E1F1C] border border-border text-foreground font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground block text-[10px]">Dosage:</label>
                      <input
                        type="text"
                        value={rx.dosage}
                        onChange={(e) => handleUpdatePrescription(rx.id, 'dosage', e.target.value)}
                        placeholder="1 Tab / 1 Cap"
                        className="w-full px-2 py-1 rounded bg-[#1E1F1C] border border-border text-foreground"
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground block text-[10px]">Duration:</label>
                      <input
                        type="text"
                        value={rx.duration}
                        onChange={(e) => handleUpdatePrescription(rx.id, 'duration', e.target.value)}
                        placeholder="5 days"
                        className="w-full px-2 py-1 rounded bg-[#1E1F1C] border border-border text-foreground"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-muted-foreground block text-[10px]">Frequency & Timing:</label>
                      <input
                        type="text"
                        value={rx.frequency}
                        onChange={(e) => handleUpdatePrescription(rx.id, 'frequency', e.target.value)}
                        placeholder="1-0-1 (Twice daily after meals)"
                        className="w-full px-2 py-1 rounded bg-[#1E1F1C] border border-border text-foreground"
                      />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemovePrescription(rx.id)}
                      className="text-muted-foreground hover:text-red-400 mt-3.5 h-7 w-7"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Live Odontogram Charting */}
        <div className="space-y-6">
          <ToothChart
            initialData={toothChart}
            onChange={(updated) => setToothChart(updated)}
            readOnly={false}
            title="Encounter Odontogram"
            description="Update cavity, restoration, or crown statuses during this visit."
          />
        </div>
      </div>
    </div>
  );
}
