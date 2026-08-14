'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToothChart } from '@/components/dentos/ToothChart';
import { StatusBadge } from '@/components/StatusBadge';
import {
  Patient,
  Case,
  ToothChartData,
  ClinicalVisit,
  ClinicalInvoice,
} from '@/types';
import {
  getPatientToothChart,
  savePatientToothChart,
  getPatientVisits,
  getInvoices,
} from '@/lib/services';
import {
  ArrowLeft,
  User,
  Calendar,
  Activity,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  FileText,
  Clock,
  Plus,
  Camera,
  Layers,
  DollarSign,
  MessageSquare,
  Sparkles,
  Printer,
  ChevronRight,
  Stethoscope,
} from 'lucide-react';

interface PatientWorkspaceProps {
  patient: Patient;
  cases: Case[];
}

export function PatientWorkspace({ patient, cases }: PatientWorkspaceProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [toothChart, setToothChart] = useState<ToothChartData>({});
  const [visits, setVisits] = useState<ClinicalVisit[]>([]);
  const [invoices, setInvoices] = useState<ClinicalInvoice[]>([]);

  useEffect(() => {
    if (patient?.id) {
      setToothChart(getPatientToothChart(patient.id));
      setVisits(getPatientVisits(patient.id));
      setInvoices(getInvoices(patient.id));
    }
  }, [patient?.id]);

  const handleChartChange = (updatedChart: ToothChartData) => {
    setToothChart(updatedChart);
    if (patient?.id) {
      savePatientToothChart(patient.id, updatedChart);
    }
  };

  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

  const generateWhatsAppLink = (messageType: 'reminder' | 'balance' | 'followup') => {
    const cleanPhone = (patient.phone || patient.contactInfo || '').replace(/[^0-9]/g, '');
    let text = '';
    if (messageType === 'reminder') {
      text = `Dear ${patient.name}, this is a reminder from Dr. Maneesh Vishnoi's clinic regarding your upcoming appointment. Please reply to confirm.`;
    } else if (messageType === 'balance') {
      text = `Dear ${patient.name}, your current treatment balance is ₹${totalOutstanding.toLocaleString('en-IN')}. You can clear it via UPI/Card at your next visit.`;
    } else {
      text = `Dear ${patient.name}, following up on your recent dental procedure. How are you feeling today? Please reach out if you experience any discomfort.`;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full animate-fade-in text-foreground">
      {/* Header & Quick Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/patients">
            <Button variant="ghost" size="icon" className="hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {patient.name}
              </h1>
              <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                ID: {patient.id.toUpperCase()}
              </Badge>
              {patient.medicalAlerts && patient.medicalAlerts.length > 0 && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {patient.medicalAlerts.join(', ')}
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span>{patient.age ? `${patient.age} yrs` : 'Age N/A'}, {patient.gender || 'Unspecified'}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-primary" /> {patient.phone || patient.contactInfo || 'No Phone'}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Registered: {new Date(patient.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/patients/${patient.id}/capture`}>
            <Button variant="outline" size="sm" className="text-xs">
              <Camera className="w-4 h-4 mr-1.5 text-primary" />
              IOS Scan
            </Button>
          </Link>

          <Link href={`/visits/new?patientId=${patient.id}`}>
            <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs shadow-sm">
              <Plus className="w-4 h-4 mr-1.5" />
              New Clinical Encounter
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Workspace Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val || 'overview')} className="w-full space-y-6">
        <TabsList className="bg-muted/60 border border-border p-1 rounded-xl inline-flex w-fit max-w-full overflow-x-auto gap-1">
          <TabsTrigger value="overview" className="text-xs sm:text-sm flex items-center gap-1.5 px-3.5 py-2">
            <User className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="tooth-chart" className="text-xs sm:text-sm flex items-center gap-1.5 px-3.5 py-2">
            <Layers className="w-4 h-4" /> Tooth Chart
          </TabsTrigger>
          <TabsTrigger value="visits" className="text-xs sm:text-sm flex items-center gap-1.5 px-3.5 py-2">
            <FileText className="w-4 h-4" /> Visits ({visits.length})
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="text-xs sm:text-sm flex items-center gap-1.5 px-3.5 py-2">
            <Activity className="w-4 h-4" /> Prescriptions (Rx)
          </TabsTrigger>
          <TabsTrigger value="cases" className="text-xs sm:text-sm flex items-center gap-1.5 px-3.5 py-2">
            <Sparkles className="w-4 h-4" /> Lab Cases ({cases.length})
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs sm:text-sm flex items-center gap-1.5 px-3.5 py-2">
            <DollarSign className="w-4 h-4" /> Invoices & Dues
          </TabsTrigger>
          <TabsTrigger value="communication" className="text-xs sm:text-sm flex items-center gap-1.5 px-3.5 py-2">
            <MessageSquare className="w-4 h-4" /> WhatsApp
          </TabsTrigger>
        </TabsList>

        {/* 1. OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Demographic & Medical History */}
            <Card className="bg-card border-border md:col-span-1 shadow-xs">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <User className="w-4 h-4 text-primary" /> Patient Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold text-foreground">{patient.phone || patient.contactInfo || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold text-foreground">{patient.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-semibold text-foreground text-right max-w-[180px] truncate">{patient.address || 'Bengaluru, India'}</span>
                </div>
                <div className="py-2 border-b border-border">
                  <span className="text-muted-foreground block mb-1 font-semibold text-amber-600 dark:text-amber-400">Allergies:</span>
                  <p className="bg-muted/40 p-2 rounded-lg border border-border text-foreground font-medium">
                    {patient.allergies && patient.allergies.length > 0 ? patient.allergies.join(', ') : 'No known drug allergies reported'}
                  </p>
                </div>
                <div className="pt-1">
                  <span className="text-muted-foreground block mb-1 font-semibold text-primary">Medical History:</span>
                  <p className="bg-muted/40 p-2.5 rounded-lg border border-border text-foreground">
                    {patient.medicalHistory || 'Fit for routine dental care. No systemic contraindications.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Treatment Summary & Quick Odontogram Teaser */}
            <div className="md:col-span-2 space-y-6">
              {/* Financial & Status Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-card border-border p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-muted-foreground">Outstanding Balance</span>
                    <h3 className={`text-xl font-bold mt-0.5 ${totalOutstanding > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      ₹{totalOutstanding.toLocaleString('en-IN')}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </Card>

                <Card className="bg-card border-border p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-muted-foreground">Active Lab Cases</span>
                    <h3 className="text-xl font-bold text-foreground mt-0.5">
                      {cases.filter((c) => c.status !== 'DELIVERED' && c.status !== 'COMPLETED').length} Active
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </Card>

                <Card className="bg-card border-border p-4 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-xs text-muted-foreground">Total Visits</span>
                    <h3 className="text-xl font-bold text-foreground mt-0.5">{visits.length} Recorded</h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Activity className="w-5 h-5" />
                  </div>
                </Card>
              </div>

              {/* Mini Odontogram Preview */}
              <ToothChart
                initialData={toothChart}
                readOnly={true}
                title="Current Dentition Overview"
                description="Live dental record reflecting ongoing restorations, cavities, and planned crowns."
              />
            </div>
          </div>
        </TabsContent>

        {/* 2. TOOTH CHART TAB */}
        <TabsContent value="tooth-chart" className="space-y-4">
          <ToothChart
            initialData={toothChart}
            onChange={handleChartChange}
            readOnly={false}
            title="Interactive Odontogram & Treatment Planning"
            description="Select any tooth or anatomical surface (Buccal, Mesial, Occlusal/Incisal, Distal, Lingual) to apply diagnoses, restorations, or crowns."
          />
        </TabsContent>

        {/* 3. VISITS TAB */}
        <TabsContent value="visits" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Clinical Encounters & SOAP Notes</h3>
            <Link href={`/visits/new?patientId=${patient.id}`}>
              <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold">
                <Plus className="w-4 h-4 mr-1.5" /> Start New Encounter
              </Button>
            </Link>
          </div>

          {visits.length === 0 ? (
            <Card className="bg-card border-border text-center py-12">
              <CardContent className="space-y-3">
                <FileText className="w-10 h-10 mx-auto text-muted-foreground opacity-30" />
                <h4 className="text-sm font-semibold text-foreground">No clinical encounters logged yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Log your first encounter with voice dictation, tooth charting, and prescription generation.
                </p>
                <Link href={`/visits/new?patientId=${patient.id}`}>
                  <Button size="sm" className="bg-primary text-primary-foreground text-xs mt-2">
                    Create Visit Note
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {visits.map((visit) => (
                <Card key={visit.id} className="bg-card border-border overflow-hidden shadow-xs">
                  <CardHeader className="p-4 bg-muted/30 border-b border-border flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold text-foreground">
                          {visit.diagnosis || 'Clinical Consultation'}
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          {new Date(visit.visitDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                      {visit.status}
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-5 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                        <span className="text-[10px] font-bold uppercase text-primary">Chief Complaint:</span>
                        <p className="text-foreground mt-0.5">{visit.chiefComplaint}</p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                        <span className="text-[10px] font-bold uppercase text-primary">Clinical Findings:</span>
                        <p className="text-foreground mt-0.5">{visit.clinicalFindings}</p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-[10px] font-bold uppercase text-primary">Treatment Rendered & Procedures:</span>
                      <p className="text-foreground mt-0.5 font-medium">{visit.treatmentRendered}</p>
                    </div>

                    {visit.prescriptions && visit.prescriptions.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground block mb-1.5">
                          Prescribed Medications (Rx):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {visit.prescriptions.map((rx) => (
                            <Badge key={rx.id} variant="secondary" className="bg-muted text-foreground text-xs py-1 px-2.5">
                              💊 <strong className="ml-1 text-primary">{rx.drugName}</strong> — {rx.dosage} ({rx.frequency}) for {rx.duration}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 4. PRESCRIPTIONS TAB */}
        <TabsContent value="prescriptions" className="space-y-4">
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                  <Activity className="w-4 h-4 text-primary" /> Active & Historical Prescriptions
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Complete pharmacological history prescribed at this practice.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" className="text-xs flex items-center gap-1.5" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5" /> Print Rx Slip
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {visits.flatMap((v) => v.prescriptions || []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No prescriptions issued yet.</p>
              ) : (
                <div className="space-y-3">
                  {visits.map((v) =>
                    v.prescriptions?.map((rx) => (
                      <div key={rx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-muted/40 border border-border gap-2 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{rx.drugName}</span>
                            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">{rx.dosage}</Badge>
                          </div>
                          <p className="text-muted-foreground mt-1">
                            Frequency: <span className="text-foreground font-medium">{rx.frequency}</span> &bull; Duration: <span className="text-foreground font-medium">{rx.duration}</span>
                          </p>
                          {rx.instructions && (
                            <p className="text-muted-foreground mt-0.5 italic">Instructions: {rx.instructions}</p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          Prescribed: {new Date(v.visitDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. CAD/CAM LAB CASES TAB */}
        <TabsContent value="cases" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Digital CAD/CAM & Dental Lab Cases</h3>
            <Link href="/?action=create">
              <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs">
                <Plus className="w-4 h-4 mr-1" /> New Lab Order
              </Button>
            </Link>
          </div>

          {cases.length === 0 ? (
            <Card className="bg-card border-border text-center py-12">
              <CardContent className="space-y-2">
                <Sparkles className="w-10 h-10 mx-auto text-muted-foreground opacity-30" />
                <p className="text-xs text-muted-foreground">No active lab cases linked to this patient.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cases.map((c) => (
                <Card key={c.id} className="bg-card border-border hover:border-primary/50 transition-all shadow-xs">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">{c.requestedTreatment}</CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Material: {c.material || 'Zirconia'} &bull; Shade: {c.shade || 'A2'}
                      </CardDescription>
                    </div>
                    <StatusBadge status={c.status} />
                  </CardHeader>
                  <CardContent className="p-4 pt-2 flex items-center justify-between text-xs border-t border-border mt-3">
                    <span className="text-muted-foreground">
                      Due: {new Date(c.dueDate).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <Link href={`/viewer/${c.id}`}>
                        <Button size="sm" variant="outline" className="text-xs h-7 px-2 text-primary">
                          3D STL
                        </Button>
                      </Link>
                      <Link href={`/cases/${c.id}`}>
                        <Button size="sm" className="bg-primary text-primary-foreground text-xs h-7 px-2.5">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 6. BILLING TAB */}
        <TabsContent value="billing" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Invoices & Statements</h3>
              <p className="text-xs text-muted-foreground">Track procedure charges, payment receipts, and outstanding dues.</p>
            </div>
            <Link href="/billing">
              <Button size="sm" className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs">
                Open Billing Hub
              </Button>
            </Link>
          </div>

          {invoices.length === 0 ? (
            <Card className="bg-card border-border text-center py-10">
              <CardContent>
                <DollarSign className="w-10 h-10 mx-auto text-muted-foreground opacity-30 mb-2" />
                <p className="text-xs text-muted-foreground">No invoices generated for this patient.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {invoices.map((inv) => (
                <Card key={inv.id} className="bg-card border-border overflow-hidden shadow-xs">
                  <CardHeader className="p-4 bg-muted/30 flex flex-row items-center justify-between border-b border-border">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm font-bold">{inv.invoiceNumber}</CardTitle>
                      <span className="text-xs text-muted-foreground">&bull; {new Date(inv.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        inv.paymentStatus === 'PAID'
                          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                          : 'border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                      }`}
                    >
                      {inv.paymentStatus}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
                    <div className="divide-y divide-border">
                      {inv.items.map((item) => (
                        <div key={item.id} className="py-2 flex justify-between items-center">
                          <div>
                            <span className="font-medium text-foreground">{item.description}</span>
                            {item.toothNumber && (
                              <Badge variant="secondary" className="ml-2 text-[10px] py-0">
                                Tooth #{item.toothNumber}
                              </Badge>
                            )}
                          </div>
                          <span className="font-mono text-foreground">₹{item.total.toLocaleString('en-IN')}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-border flex justify-between items-center font-bold">
                      <span>Total Amount:</span>
                      <span className="text-sm font-mono text-primary">₹{inv.grandTotal.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Paid ({inv.paymentMethod || 'Cash'}):</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">₹{inv.paidAmount.toLocaleString('en-IN')}</span>
                    </div>

                    {inv.balanceAmount > 0 && (
                      <div className="flex justify-between items-center text-red-500 font-bold">
                        <span>Balance Due:</span>
                        <span className="font-mono">₹{inv.balanceAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 7. WHATSAPP & COMMUNICATION TAB */}
        <TabsContent value="communication" className="space-y-4">
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                <MessageSquare className="w-4 h-4 text-emerald-600" /> Patient WhatsApp Communication
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Send appointment reminders, post-operative recalls, and invoice receipts directly to the patient's phone.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                  href={generateWhatsAppLink('reminder')}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-start p-4 rounded-xl border border-border bg-muted/20 hover:border-emerald-500 hover:shadow-md transition-all group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 mb-3">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                    Appointment Reminder
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Send booking confirmation with scheduled date and time.
                  </p>
                </a>

                <a
                  href={generateWhatsAppLink('followup')}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-start p-4 rounded-xl border border-border bg-muted/20 hover:border-emerald-500 hover:shadow-md transition-all group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 mb-3">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                    Post-Op Care Follow-Up
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check on patient healing and medication instructions after procedure.
                  </p>
                </a>

                <a
                  href={generateWhatsAppLink('balance')}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-start p-4 rounded-xl border border-border bg-muted/20 hover:border-emerald-500 hover:shadow-md transition-all group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 mb-3">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                    Statement & Balance Due
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Send treatment statement and pending balance payment reminder.
                  </p>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
