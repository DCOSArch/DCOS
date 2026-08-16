'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { CaseStatus, Urgency, Case, InventoryItem } from '@/types';
import { Clock, Filter, Plus, PackageMinus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/datetime';
import { deductLabCaseInventoryAction } from '@/actions/inventory';

interface LabDashboardProps {
  initialCases: Case[];
  initialInventory: InventoryItem[];
  availableDentists: { id: string; name: string }[];
}

export default function LabDashboard({ initialCases, initialInventory, availableDentists }: LabDashboardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [cases, setCases] = useState<Case[]>(initialCases);

  useEffect(() => {
    setCases(initialCases);
  }, [initialCases]);

  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [draggedCaseId, setDraggedCaseId] = useState<string | null>(null);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Create Case Form State
  const [patientName, setPatientName] = useState('');
  const [treatmentType, setTreatmentType] = useState('');
  const [urgency, setUrgency] = useState<Urgency>('NORMAL');
  const [selectedDentistId, setSelectedDentistId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleSubmitCase = async () => {
    if (!patientName || !treatmentType || !selectedDentistId) {
      alert('Please fill out all required fields.');
      return;
    }

    setUploadState('uploading');
    try {
      let scanUrl = null;
      if (selectedFile) {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: selectedFile.name, contentType: 'application/octet-stream' }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          throw new Error(errBody.error || `Presign failed (${res.status})`);
        }
        const { url: signedUrl, key } = await res.json();

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', signedUrl, true);
          xhr.setRequestHeader('Content-Type', 'application/octet-stream');
          xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`R2 PUT failed: ${xhr.status}`)));
          xhr.onerror = () => reject(new Error('Network error during upload'));
          xhr.send(selectedFile);
        });

        scanUrl = key;
      }

      const dbCase = {
        patient_name: patientName,
        dentist_id: selectedDentistId,
        lab_id: inventory.length > 0 ? inventory[0].labId : undefined,
        status: 'PENDING',
        urgency,
        requested_treatment: treatmentType,
        scan_url: scanUrl,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { error } = await supabase.from('cases').insert([dbCase]);
      if (error) throw error;

      setIsCreateModalOpen(false);
      setPatientName('');
      setTreatmentType('');
      setUrgency('NORMAL');
      setSelectedDentistId('');
      setSelectedFile(null);
      setUploadState('idle');
      router.refresh();
    } catch (err: any) {
      console.error('Submission error:', err);
      alert('Failed to submit case: ' + err.message);
      setUploadState('error');
    }
  };

  const KANBAN_COLUMNS: { id: CaseStatus; label: string }[] = [
    { id: 'PENDING', label: 'Incoming' },
    { id: 'IN_PROGRESS', label: 'In Production' },
    { id: 'QUALITY_CHECK', label: 'QC & Finishing' },
    { id: 'DELIVERED', label: 'Delivered' },
  ];

  const activeCasesCount = cases.filter(c => c.status !== 'DELIVERED' && c.status !== 'DRAFT').length;
  const completedCasesCount = cases.filter(c => c.status === 'DELIVERED').length;
  const pendingCasesCount = cases.filter(c => c.status === 'PENDING').length;
  const inProgressCasesCount = cases.filter(c => c.status === 'IN_PROGRESS' || c.status === 'QUALITY_CHECK' || c.status === 'DISPATCHED').length;

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('cases_realtime_lab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases' }, (payload) => {
        const eventType = payload.eventType;
        const newCase = payload.new as any;

        if (eventType === 'INSERT') {
          const dentist = availableDentists.find(u => u.id === newCase.dentist_id);
          const dentistName = dentist ? dentist.name : 'A dentist';
          toast.success(`New Case Submitted! ${dentistName} added ${newCase.patient_name}`);
          setCases(prev => {
            if (prev.some(c => c.id === newCase.id)) return prev;
            return [{
              id: newCase.id,
              patientName: newCase.patient_name,
              dentistId: newCase.dentist_id,
              labId: newCase.lab_id,
              status: newCase.status as any,
              urgency: newCase.urgency as any,
              requestedTreatment: newCase.requested_treatment,
              material: newCase.material,
              scanUrl: newCase.scan_url,
              createdAt: newCase.created_at,
              dueDate: newCase.due_date,
              deliveryTrackingId: newCase.delivery_tracking_id
            }, ...prev];
          });
        } else if (eventType === 'UPDATE') {
          setCases(prev => prev.map(c => c.id === newCase.id ? {
            ...c,
            status: newCase.status,
            urgency: newCase.urgency,
            requestedTreatment: newCase.requested_treatment,
            material: newCase.material,
            scanUrl: newCase.scan_url,
            deliveryTrackingId: newCase.delivery_tracking_id
          } : c));
        }

        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [availableDentists, router, supabase]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCaseId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, statusId: CaseStatus) => {
    e.preventDefault();
    if (draggedCaseId) {
      const caseItem = cases.find(c => c.id === draggedCaseId);

      // Automated Material Deduction on Entering Production
      if (caseItem && caseItem.status === 'PENDING' && statusId === 'IN_PROGRESS') {
        const materialName = caseItem.material || 'Zirconia HT Monolithic Block';
        toast.success(`Deducted 1 unit of ${materialName}`, {
          description: 'Production ledger updated. Clinic inventory balance synchronized automatically.',
        });

        // Trigger Server Action
        if (caseItem.dentistId && caseItem.labId) {
          deductLabCaseInventoryAction({
            caseId: caseItem.id,
            dentistId: caseItem.dentistId,
            labId: caseItem.labId,
            materialName: materialName,
          }).catch(console.warn);
        }
      }

      setCases(prev => prev.map(c => c.id === draggedCaseId ? { ...c, status: statusId } : c));

      // Update in Supabase
      supabase.from('cases').update({ status: statusId }).eq('id', draggedCaseId).then(({ error }) => {
        if (error) {
          console.error("Error updating case status:", error);
          toast.error("Failed to update case status in database.");
        } else {
          router.refresh();
        }
      });
    }
    setDraggedCaseId(null);
  };

  const filteredCases = cases.filter(c => {
    if (filterUrgency !== 'ALL' && c.urgency !== filterUrgency) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out relative">
      {syncNotification && (
        <div className="absolute top-0 right-0 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-emerald-500 dark:bg-emerald-600 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 text-sm font-medium">
            <PackageMinus className="h-4 w-4" />
            {syncNotification}
          </div>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Laboratory Dashboard</h1>
          <p className="text-muted-foreground mt-1">Active production pipeline.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-8 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all hover:scale-[1.02] active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manual Case Entry</span>
          </Button>
          <div className="flex gap-2 items-center bg-background rounded-lg border border-border p-1 shadow-sm">
            <Filter className="w-4 h-4 ml-2 text-muted-foreground" />
            <Select value={filterUrgency} onValueChange={(val) => setFilterUrgency(val || 'ALL')}>
              <SelectTrigger className="w-[130px] border-none shadow-none focus:ring-0 h-8">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Urgencies</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Modern High-Density Production HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-2xl bg-card border border-border shadow-xs">
        <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Active in Production
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-extrabold text-foreground">{activeCasesCount}</span>
            <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary">
              Avg 3.2 Days
            </Badge>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Incoming / Intake
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-extrabold text-amber-400">{pendingCasesCount}</span>
            <span className="text-xs text-muted-foreground font-medium">Ready for CAD</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            In Milling & Sinter
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-extrabold text-primary">{inProgressCasesCount}</span>
            <span className="text-xs text-muted-foreground font-medium">5-Axis Dry/Wet</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-muted/30 border border-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Delivered This Month
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-extrabold text-emerald-400">{completedCasesCount}</span>
            <span className="text-xs text-emerald-500 font-bold">100% On-Time</span>
          </div>
        </div>
      </div>

      {/* Production Kanban Board */}
      <div className="w-full pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {KANBAN_COLUMNS.map(column => {
            const columnCases = filteredCases.filter(c => c.status === column.id);
            return (
              <div
                key={column.id}
                className="flex flex-col pt-1"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
                    {column.label}
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                      {columnCases.length}
                    </Badge>
                  </h3>
                </div>

                <div className={`flex-1 space-y-3 rounded-2xl p-3 min-h-[520px] transition-all ${
                  draggedCaseId 
                    ? 'bg-primary/5 border-2 border-dashed border-primary/40' 
                    : 'bg-card/40 border border-border/60 shadow-xs'
                }`}>
                  {columnCases.length === 0 ? (
                    <div className="h-28 border-2 border-dashed border-border/50 rounded-xl flex items-center justify-center text-xs text-muted-foreground pointer-events-none">
                      Drop cases here
                    </div>
                  ) : (
                    columnCases.map(caseItem => {
                      const dentist = availableDentists.find(u => u.id === caseItem.dentistId);
                      return (
                        <div
                          key={caseItem.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, caseItem.id)}
                          onClick={() => router.push(`/cases/${caseItem.id}`)}
                          className="group cursor-pointer p-3.5 rounded-xl bg-card border border-border hover:border-primary/60 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 active:scale-[0.99]"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">
                              #{caseItem.id.slice(-8).toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {caseItem.urgency === 'URGENT' && (
                                <Badge className="bg-red-500/15 border-red-500/30 text-red-400 text-[9px] font-bold px-1.5 py-0">
                                  RUSH
                                </Badge>
                              )}
                              <StatusBadge status={caseItem.status} />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              {caseItem.patientName || 'Patient Case'}
                            </h4>
                            <p className="text-[11px] font-medium text-muted-foreground truncate">
                              {caseItem.requestedTreatment}
                            </p>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground">
                            <span className="font-medium text-foreground truncate max-w-[110px]">
                              {dentist?.name || 'Dr. Practitioner'}
                            </span>
                            <div className="flex items-center gap-1 font-mono text-muted-foreground">
                              <Clock className="w-3 h-3 text-primary/70" />
                              {formatDate(caseItem.dueDate, { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Manual Case Entry</DialogTitle>
            <DialogDescription>
              Log a new case received physically or via external channels.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="patientName">Patient Name</Label>
              <Input id="patientName" placeholder="e.g. John Doe" value={patientName} onChange={e => setPatientName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dentist">Prescribing Dentist</Label>
                <Select value={selectedDentistId} onValueChange={(val) => setSelectedDentistId(val || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dentist" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDentists.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="treatment">Treatment Type</Label>
                <Select value={treatmentType} onValueChange={(val) => setTreatmentType(val || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zirconia Crown">Zirconia Crown</SelectItem>
                    <SelectItem value="Fixed Bridge">Fixed Bridge</SelectItem>
                    <SelectItem value="Nightguard">Nightguard</SelectItem>
                    <SelectItem value="Implant Abutment">Implant Abutment</SelectItem>
                    <SelectItem value="Porcelain Veneer">Porcelain Veneer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="urgency">Urgency</Label>
              <Select value={urgency} onValueChange={(val) => setUrgency((val as Urgency) || 'NORMAL')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <Label className="mb-2 block">Upload Scans (STL/PLY)</Label>
              <label className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer block w-full">
                <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium text-foreground">{selectedFile ? selectedFile.name : "Click to select STL Files"}</p>
                <input type="file" accept=".stl,.ply" className="hidden" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium" onClick={handleSubmitCase} disabled={uploadState === 'uploading'}>
              {uploadState === 'uploading' ? 'Saving...' : 'Submit Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
