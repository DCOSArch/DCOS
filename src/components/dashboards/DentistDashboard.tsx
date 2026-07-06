'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import SummaryChart from '@/components/SummaryChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Activity, CheckCircle2, UploadCloud, FileBox, Filter, FileText, Box, Building2, ChevronRight, ChevronLeft } from 'lucide-react';
import { Case, User, DoctorInventoryItem } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { validateSTLFile } from '@/lib/utils/stlValidator';

interface DentistDashboardProps {
  initialCases: Case[];
  currentUser: User;
  availableLabs: { id: string; name: string }[];
}

export default function DentistDashboard({ initialCases, currentUser, availableLabs }: DentistDashboardProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [cases, setCases] = useState<Case[]>(initialCases);
  
  // Sync initialCases with cases when router.refresh() happens
  useEffect(() => {
    setCases(initialCases);
  }, [initialCases]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  const [uploadState, setUploadState] = useState<'idle' | 'analyzing' | 'warning'>('idle');
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [validationDimensions, setValidationDimensions] = useState<{ x: number; y: number; z: number } | null>(null);
  
  const [patientName, setPatientName] = useState('');
  const [treatmentType, setTreatmentType] = useState('');
  const [urgency, setUrgency] = useState<Case['urgency']>('NORMAL');
  const [selectedLabId, setSelectedLabId] = useState<string>(availableLabs.length > 0 ? availableLabs[0].id : '');
  const [dueDate, setDueDate] = useState<string>('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inventory, setInventory] = useState<DoctorInventoryItem[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // 5-Tab Pipeline State
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [isTeethNotSpecified, setIsTeethNotSpecified] = useState(false);
  const [material, setMaterial] = useState('Zirconia HT');
  const [shade, setShade] = useState('A2');
  const [isDesignNotSpecified, setIsDesignNotSpecified] = useState(false);
  const [instructions, setInstructions] = useState('');

  const steps = [
    { label: 'Admin', desc: 'Patient Info' },
    { label: 'Scan', desc: '3D Files' },
    { label: 'Model', desc: 'Teeth Chart' },
    { label: 'CAD', desc: 'Materials' },
    { label: 'CAM', desc: 'Due Date' }
  ];

  const isStepComplete = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Administration
        return patientName.trim().length > 0 && selectedLabId !== '';
      case 1: // Acquisition
        return selectedFile !== null && uploadState !== 'analyzing';
      case 2: // Model Mapping
        return selectedTeeth.length > 0 || isTeethNotSpecified;
      case 3: // CAD Design
        return isDesignNotSpecified || (material !== '' && shade !== '');
      case 4: // CAM Manufacturing
        return dueDate !== '';
      default:
        return false;
    }
  };

  const toggleTooth = (toothNumber: number) => {
    if (selectedTeeth.includes(toothNumber)) {
      setSelectedTeeth(prev => prev.filter(t => t !== toothNumber));
    } else {
      setSelectedTeeth(prev => [...prev, toothNumber]);
    }
  };

  const renderToothButton = (toothNumber: number) => {
    const isSelected = selectedTeeth.includes(toothNumber);
    return (
      <button
        key={toothNumber}
        type="button"
        disabled={isTeethNotSpecified}
        onClick={() => toggleTooth(toothNumber)}
        className={`w-7 h-7 text-[10px] font-bold rounded flex items-center justify-center border transition-colors ${
          isSelected 
            ? 'bg-blue-600 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-600' 
            : 'border-border text-foreground hover:bg-muted bg-background'
        } ${isTeethNotSpecified ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {toothNumber}
      </button>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Inventory
      const { data: invData } = await supabase
        .from('doctor_inventory')
        .select('*')
        .eq('dentist_id', currentUser.id);
      
      if (invData) {
        setInventory(invData.map((item: any) => ({
          id: item.id,
          dentistId: item.dentist_id,
          labId: item.lab_id,
          materialName: item.material_name,
          totalUnits: item.total_units,
          remainingUnits: item.remaining_units,
          lockedPrice: item.locked_price
        })));
      }
    };

    const fetchNotifications = async () => {
      const { data: timelineData, error } = await supabase
        .from('timeline_events')
        .select(`
          id,
          status_update,
          notes,
          timestamp,
          case_id,
          cases!inner(patient_name, dentist_id)
        `)
        .eq('cases.dentist_id', currentUser.id)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (timelineData) {
        setNotifications(timelineData.map((n: any) => ({
          id: n.id,
          statusUpdate: n.status_update,
          notes: n.notes,
          timestamp: n.timestamp,
          caseId: n.case_id,
          patientName: n.cases.patient_name
        })));
      }
    };
    
    fetchData();
    fetchNotifications();

    // Subscribe to cases
    const channel = supabase.channel('dentist_cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `dentist_id=eq.${currentUser.id}` }, payload => {
        const eventType = payload.eventType;
        const newCase = payload.new as any;
        
        if (eventType === 'UPDATE') {
          toast.info(`Case updated: ${newCase.patient_name}'s status is now ${newCase.status}`);
          setCases(prev => prev.map(c => c.id === newCase.id ? {
            ...c,
            status: newCase.status,
            urgency: newCase.urgency,
            requestedTreatment: newCase.requested_treatment,
            material: newCase.material,
            scanUrl: newCase.scan_url,
            deliveryTrackingId: newCase.delivery_tracking_id
          } : c));
          fetchData();
          fetchNotifications();
        }
        
        router.refresh();
      })
      .subscribe();

    // Subscribe to timeline events
    const timelineChannel = supabase.channel('dentist_timeline')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'timeline_events' }, payload => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(timelineChannel);
    };
  }, [currentUser.id, router, supabase]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Auto-fill patient name if not yet entered
      const baseName = file.name.replace(/\.(stl|ply)$/i, '');
      let nameGuess = baseName
        .replace(/(upper|lower|bite|arch|scan|prep|mesh)/gi, '') // remove common keywords
        .replace(/[^a-zA-Z\s]/g, ' ') // replace non-alphabetic chars with spaces
        .replace(/\s+/g, ' ') // collapse multiple spaces
        .trim();
      
      if (nameGuess) {
        nameGuess = nameGuess.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        if (!patientName) {
          setPatientName(nameGuess);
          toast.success(`Auto-filled Patient Name: "${nameGuess}"`);
        }
      }

      // Detect arch type
      let archGuess = '';
      if (/upper/i.test(baseName)) archGuess = 'Upper Arch';
      else if (/lower/i.test(baseName)) archGuess = 'Lower Arch';
      else if (/bite/i.test(baseName)) archGuess = 'Bite Registry';
      
      if (archGuess) {
        toast.info(`Detected scan: ${archGuess}`);
      }

      // Pre-flight validation
      setUploadState('analyzing');
      try {
        const result = await validateSTLFile(file);
        if (!result.isValid) {
          setUploadState('warning');
          setValidationWarnings(result.warnings);
        } else if (result.warnings.length > 0) {
          setUploadState('warning');
          setValidationWarnings(result.warnings);
        } else {
          setUploadState('idle');
          setValidationWarnings([]);
        }
        if (result.dimensions) {
          setValidationDimensions(result.dimensions);
        }
      } catch (err) {
        console.error('STL validation error:', err);
        setUploadState('idle');
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitCase = async (isDraft: boolean = false) => {
    if (!patientName.trim() || !selectedFile || !selectedLabId) {
      alert('Please fill out patient name, select a lab, and select a scan file.');
      return;
    }
    
    setUploadState('analyzing');
    
    try {
      // 1. Upload to Supabase Storage
      let scanUrl = null;
      if (selectedFile) {
        const fileName = `${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { data, error } = await supabase.storage
          .from('scans')
          .upload(fileName, selectedFile);
          
        if (error) {
          console.error('Storage upload error (ignoring and proceeding):', error);
          alert('Warning: File upload failed (e.g. storage bucket issue). The case will still be created without the file.');
        } else {
          scanUrl = data.path;
        }
      }
      
      // 2. Insert the case into the Supabase 'cases' table
      const dbCase = {
        patient_name: patientName,
        dentist_id: currentUser.id, 
        lab_id: selectedLabId,
        status: isDraft ? 'DRAFT' : 'PENDING',
        urgency,
        requested_treatment: treatmentType || 'Not Specified',
        material: isDesignNotSpecified ? 'Not Specified' : material,
        scan_url: scanUrl, // Store the file path
        due_date: dueDate ? new Date(dueDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        shade: isDesignNotSpecified ? 'Not Specified' : shade,
        selected_teeth: isTeethNotSpecified ? null : selectedTeeth,
        instructions: instructions || null
      };

      const { data: insertedCase, error: insertError } = await supabase
        .from('cases')
        .insert([dbCase])
        .select()
        .single();

      if (insertError) {
        console.error('DB Insert Error:', insertError);
        alert('Error inserting case: ' + insertError.message);
      } else if (insertedCase) {
        // Create initial timeline event
        await supabase.from('timeline_events').insert({
          case_id: insertedCase.id,
          status_update: isDraft ? 'Draft Saved' : 'Case Created',
          notes: isDraft ? 'Dentist saved case as draft.' : 'Dentist submitted new case.',
          visibility: 'BOTH'
        });

        // Refetch inventory to reflect deduction (only if not a draft)
        if (!isDraft) {
          const { data: invData } = await supabase
            .from('doctor_inventory')
            .select('*')
            .eq('dentist_id', currentUser.id);
          
          if (invData) {
            setInventory(invData.map((item: any) => ({
              id: item.id,
              dentistId: item.dentist_id,
              labId: item.lab_id,
              materialName: item.material_name,
              totalUnits: item.total_units,
              remainingUnits: item.remaining_units,
              lockedPrice: item.locked_price
            })));
          }
        }
      }
      
      const newCase: Case = {
        id: insertedCase ? insertedCase.id : `case-${Date.now().toString().slice(-4)}`,
        patientName,
        dentistId: currentUser.id, 
        labId: selectedLabId, 
        status: isDraft ? 'DRAFT' : 'PENDING',
        urgency,
        requestedTreatment: dbCase.requested_treatment,
        material: dbCase.material,
        createdAt: new Date().toISOString(),
        dueDate: dbCase.due_date,
        shade: dbCase.shade,
        selectedTeeth: isTeethNotSpecified ? undefined : selectedTeeth,
        instructions: instructions || undefined
      };
      
      // Optimistic UI - Immediately show the new case
      setCases(prev => [newCase, ...prev]);
      
      router.refresh();
      setIsCreateModalOpen(false);
      
      // Reset form
      setPatientName('');
      setTreatmentType('');
      setUrgency('NORMAL');
      setDueDate('');
      setSelectedFile(null);
      setUploadState('idle');
      setValidationWarnings([]);
      setValidationDimensions(null);
      setSelectedTeeth([]);
      setIsTeethNotSpecified(false);
      setMaterial('Zirconia HT');
      setShade('A2');
      setIsDesignNotSpecified(false);
      setInstructions('');
      setCurrentStep(0);
      
      toast.success(isDraft ? 'Case saved as draft!' : 'Case successfully submitted!');
      
    } catch (err) {
      console.error('Submission error:', err);
      setUploadState('idle');
    }
  };

  const activeCasesCount = cases.filter(c => c.status !== 'DELIVERED').length;
  const completedCasesCount = cases.filter(c => c.status === 'DELIVERED').length;

  const filteredCases = cases.filter(c => {
    if (filterStatus !== 'ALL' && c.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dentist Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your patients' lab cases and track progress.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-stretch mb-6">
        <SummaryChart cases={cases} />
        <Card className="flex flex-col justify-center h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCasesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently in production</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-center h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedCasesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Delivered this month</p>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 dark:from-blue-950/40 dark:to-indigo-950/40 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-200">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 dark:text-blue-300">You have no cases requiring immediate attention. Great job!</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Virtual Inventory (Takes 2 columns) */}
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2"><Box className="w-5 h-5 text-primary"/> Virtual Inventory (Bulk Orders)</CardTitle>
              <CardDescription>Track your pre-purchased materials with partner labs.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/inventory')}>
              Purchase More
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inventory.length === 0 ? (
                <div className="col-span-full py-8 text-center text-muted-foreground">
                  <p>No active bulk inventory found.</p>
                  <p className="text-sm mt-1">Purchase materials from a lab partner to lock in pricing.</p>
                </div>
              ) : inventory.map(item => {
                const lab = availableLabs.find(l => l.id === item.labId);
                const percentage = (item.remainingUnits / item.totalUnits) * 100;
                return (
                  <div key={item.id} className="border border-border rounded-lg p-4 bg-muted/20 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-foreground">{item.materialName}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building2 className="w-3 h-3" /> {lab?.name}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs font-mono">{item.lockedPrice.replace('$', '₹')}/unit</Badge>
                    </div>
                    
                    <div className="space-y-1.5 mt-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span>{item.remainingUnits} units left</span>
                        <span className="text-muted-foreground">of {item.totalUnits}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${percentage < 20 ? 'bg-red-500' : percentage < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Live Notification Center (Takes 1 column) */}
        <Card className="shadow-sm border-border flex flex-col h-full min-h-[220px]">
          <CardHeader className="pb-3 border-b border-border bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Production Tracking
            </CardTitle>
            <CardDescription className="text-xs">Real-time laboratory updates.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pt-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-xs text-muted-foreground py-8">
                <Activity className="h-8 w-8 text-muted-foreground/40 mb-2 animate-pulse" />
                <p>No recent status updates.</p>
                <p className="text-[10px] mt-0.5">Updates appear here when the lab advances your cases.</p>
              </div>
            ) : (
              <div className="space-y-4 pl-4 border-l border-border relative">
                {notifications.map((n) => (
                  <div key={n.id} className="relative group text-xs text-left">
                    <div className="absolute -left-[21px] top-1 bg-background rounded-full p-0.5 border border-background">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center gap-2">
                        <span className="font-semibold text-foreground text-xs truncate max-w-[120px]">{n.patientName}</span>
                        <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-normal">{n.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle>Recent Case Submissions</CardTitle>
            <CardDescription>View and track your patients' restorations.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || 'ALL')}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="QUALITY_CHECK">QC Hold</SelectItem>
                <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Case ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Treatment</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((caseItem) => (
                  <TableRow key={caseItem.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-mono text-xs font-medium text-muted-foreground">{caseItem.id.slice(-8).toUpperCase()}</TableCell>
                    <TableCell className="font-medium text-foreground">{caseItem.patientName}</TableCell>
                    <TableCell className="text-muted-foreground">{caseItem.requestedTreatment}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(caseItem.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 items-center">
                        <StatusBadge status={caseItem.status} />
                        {caseItem.urgency === 'URGENT' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.push(`/cases/${caseItem.id}`)}
                        className="text-primary hover:text-primary/80 hover:bg-primary/10"
                      >
                        <FileBox className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
        setIsCreateModalOpen(open);
        if (!open) {
          setTimeout(() => {
            setUploadState('idle');
            setSelectedFile(null);
            setPatientName('');
            setTreatmentType('');
            setUrgency('NORMAL');
            setDueDate('');
            setValidationWarnings([]);
            setValidationDimensions(null);
            setSelectedTeeth([]);
            setIsTeethNotSpecified(false);
            setMaterial('Zirconia HT');
            setShade('A2');
            setIsDesignNotSpecified(false);
            setInstructions('');
            setCurrentStep(0);
          }, 300);
        }
      }}>
        <DialogTrigger render={<Button className="fixed bottom-6 right-6 md:bottom-10 md:right-10 h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 p-0 z-50 focus:outline-none" />}>
             <Plus className="h-6 w-6 text-white" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px] bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Lab Case</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Submit a new prescription to the dental laboratory using Sirona-style 5-Tab Pipeline.
            </DialogDescription>
          </DialogHeader>

          {/* Stepper Dot Indicators */}
          <div className="flex justify-between items-center my-4 border-b border-border pb-4">
            {steps.map((step, idx) => {
              const isCurrent = idx === currentStep;
              const isDone = idx < currentStep || isStepComplete(idx);
              const isSelectable = idx <= currentStep || (idx > 0 && isStepComplete(idx - 1));
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!isSelectable}
                  onClick={() => setCurrentStep(idx)}
                  className={`flex flex-col items-center gap-1 focus:outline-none transition-colors ${
                    isCurrent ? 'text-primary' : isDone ? 'text-emerald-500' : 'text-muted-foreground'
                  } ${!isSelectable ? 'opacity-40 cursor-not-allowed' : 'hover:text-foreground'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 text-xs font-semibold ${
                    isCurrent ? 'border-blue-600 bg-blue-600/10 text-blue-600' : isDone ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500' : 'border-muted-foreground/30'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-[10px] font-medium hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 py-2 min-h-[260px]">
            {/* Step 0: Administration */}
            {currentStep === 0 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid gap-2">
                  <Label htmlFor="patientName" className="text-foreground">Patient Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="patientName" 
                    placeholder="e.g. John Doe" 
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="border-border text-foreground bg-background"
                  />
                  <p className="text-xs text-muted-foreground">Or upload a scan file in the next step to auto-extract the name.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lab" className="text-foreground">Assign to Laboratory <span className="text-red-500">*</span></Label>
                  <Select value={selectedLabId} onValueChange={(val) => setSelectedLabId(val || '')} disabled>
                    <SelectTrigger className="border-border text-foreground">
                      <SelectValue placeholder="Select a laboratory" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLabs.map(lab => (
                        <SelectItem key={lab.id} value={lab.id}>{lab.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="urgency" className="text-foreground">Urgency <span className="text-red-500">*</span></Label>
                  <Select value={urgency} onValueChange={(val) => setUrgency((val as Case['urgency']) || 'NORMAL')}>
                    <SelectTrigger className="border-border text-foreground">
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
              </div>
            )}

            {/* Step 1: Acquisition (Scan upload & STL Validator) */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <Label className="text-foreground mb-2 block">Upload 3D Scan (STL/PLY) <span className="text-red-500">*</span></Label>
                <input 
                  type="file" 
                  accept=".stl,.ply" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                />
                
                {uploadState === 'idle' && !selectedFile && (
                  <div 
                    onClick={handleUploadClick}
                    className="border-2 border-dashed border-border rounded-lg p-10 flex flex-col items-center justify-center text-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium text-foreground">Drag & Drop STL/PLY Files Here</p>
                    <p className="text-xs text-muted-foreground mt-1">or click to browse from your computer</p>
                  </div>
                )}

                {selectedFile && (
                  <div className="space-y-4">
                    <div 
                      onClick={handleUploadClick}
                      className="border-2 border-blue-600/40 rounded-lg p-4 flex items-center gap-4 bg-blue-600/5 cursor-pointer hover:bg-blue-600/10 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                        </p>
                      </div>
                    </div>

                    {uploadState === 'analyzing' && (
                      <div className="border border-border rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/20">
                        <Activity className="h-8 w-8 text-blue-600 mb-2 animate-pulse" />
                        <p className="text-sm font-medium text-foreground">Analyzing STL geometry bounds...</p>
                        <div className="w-full max-w-xs bg-muted rounded-full h-1 mt-3 overflow-hidden">
                          <div className="bg-blue-600 h-1 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    )}

                    {uploadState === 'warning' && (
                      <div className="border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                          <Activity className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                          Pre-Flight Analysis Alerts
                        </h4>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {validationWarnings.map((warn, i) => (
                            <li key={i} className="text-xs text-amber-700 dark:text-amber-400">{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {validationDimensions && (
                      <div className="border border-border rounded-lg p-3 bg-muted/20 text-xs flex justify-around text-foreground">
                        <div><span className="font-semibold">Width (X):</span> {validationDimensions.x.toFixed(1)} mm</div>
                        <div><span className="font-semibold">Length (Y):</span> {validationDimensions.y.toFixed(1)} mm</div>
                        <div><span className="font-semibold">Height (Z):</span> {validationDimensions.z.toFixed(1)} mm</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Model Mapping (Teeth chart selector) */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-foreground">Select Treatment Teeth (FDI Notation)</Label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="teethNotSpecified"
                      checked={isTeethNotSpecified}
                      onChange={(e) => {
                        setIsTeethNotSpecified(e.target.checked);
                        if (e.target.checked) setSelectedTeeth([]);
                      }}
                      className="rounded border-border text-blue-600 focus:ring-blue-600 h-4 w-4 bg-background"
                    />
                    <Label htmlFor="teethNotSpecified" className="text-xs text-muted-foreground cursor-pointer">Not Specified</Label>
                  </div>
                </div>

                {!isTeethNotSpecified ? (
                  <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/10">
                    <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Upper Jaw</div>
                    {/* Upper row: UR 18-11 then UL 21-28 */}
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {[18,17,16,15,14,13,12,11].map(t => renderToothButton(t))}
                      <div className="w-[1px] bg-border mx-1"></div>
                      {[21,22,23,24,25,26,27,28].map(t => renderToothButton(t))}
                    </div>

                    <div className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mt-4">Lower Jaw</div>
                    {/* Lower row: LR 48-41 then LL 31-38 */}
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {[48,47,46,45,44,43,42,41].map(t => renderToothButton(t))}
                      <div className="w-[1px] bg-border mx-1"></div>
                      {[31,32,33,34,35,36,37,38].map(t => renderToothButton(t))}
                    </div>

                    {selectedTeeth.length > 0 && (
                      <div className="text-xs text-muted-foreground text-center mt-2">
                        Selected: <span className="font-semibold text-blue-600">{selectedTeeth.sort((a,b)=>a-b).join(', ')}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
                    Teeth not specified. The lab will design according to the scan models provided.
                  </div>
                )}
              </div>
            )}

            {/* Step 3: CAD Design */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-foreground">Restoration Materials & Shade</Label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="designNotSpecified"
                      checked={isDesignNotSpecified}
                      onChange={(e) => {
                        setIsDesignNotSpecified(e.target.checked);
                      }}
                      className="rounded border-border text-blue-600 focus:ring-blue-600 h-4 w-4 bg-background"
                    />
                    <Label htmlFor="designNotSpecified" className="text-xs text-muted-foreground cursor-pointer">Not Specified</Label>
                  </div>
                </div>

                {!isDesignNotSpecified ? (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="material" className="text-foreground">Restoration Material <span className="text-red-500">*</span></Label>
                      <Select value={material} onValueChange={(val) => setMaterial(val || 'Zirconia HT')}>
                        <SelectTrigger className="border-border text-foreground bg-background">
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Zirconia HT">Zirconia HT (High Translucency)</SelectItem>
                          <SelectItem value="BruxZir Solid Zirconia">BruxZir Solid Zirconia</SelectItem>
                          <SelectItem value="IPS e.max CAD">IPS e.max CAD (Lithium Disilicate)</SelectItem>
                          <SelectItem value="PMMA Temporary">PMMA Temporary</SelectItem>
                          <SelectItem value="Titanium Abutment">Titanium Custom Abutment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="shade" className="text-foreground">Vita Shade Code <span className="text-red-500">*</span></Label>
                      <Select value={shade} onValueChange={(val) => setShade(val || 'A2')}>
                        <SelectTrigger className="border-border text-foreground bg-background">
                          <SelectValue placeholder="Select shade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A1">A1 (Light)</SelectItem>
                          <SelectItem value="A2">A2 (Standard Natural)</SelectItem>
                          <SelectItem value="A3">A3 (Medium)</SelectItem>
                          <SelectItem value="A3.5">A3.5 (Darker Medium)</SelectItem>
                          <SelectItem value="B1">B1 (Bleach White)</SelectItem>
                          <SelectItem value="B2">B2 (Yellow-White)</SelectItem>
                          <SelectItem value="C1">C1 (Grayish)</SelectItem>
                          <SelectItem value="D2">D2 (Reddish-Gray)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
                    Material and Shade parameters left unspecified. The lab technician will select appropriate aesthetic choices.
                  </div>
                )}
              </div>
            )}

            {/* Step 4: CAM Manufacturing */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid gap-2">
                  <Label htmlFor="dueDate" className="text-foreground">Requested Due Date <span className="text-red-500">*</span></Label>
                  <Input 
                    id="dueDate" 
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Min 1 day ahead
                    className="border-border text-foreground bg-background"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instructions" className="text-foreground">Custom Lab Instructions</Label>
                  <textarea 
                    id="instructions"
                    placeholder="Provide specific notes regarding occlusal clearances, contacts, prep margins, or custom glazing instructions..."
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full min-h-[100px] p-2 border border-border rounded bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center gap-2 sm:gap-0 mt-4 border-t border-border pt-4">
            <div>
              {currentStep > 0 && (
                <Button variant="outline" type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="border-border text-foreground hover:bg-muted bg-background">
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {/* Show Save as Draft if file is uploaded */}
              {selectedFile && (
                <Button 
                  variant="secondary"
                  type="button"
                  disabled={uploadState === 'analyzing'}
                  onClick={() => handleSubmitCase(true)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:border-zinc-700"
                >
                  Save as Draft
                </Button>
              )}
              {currentStep < 4 ? (
                <Button 
                  type="button"
                  disabled={!isStepComplete(currentStep)}
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="button"
                  disabled={uploadState === 'analyzing' || !isStepComplete(4)} 
                  className="bg-blue-600 hover:bg-blue-700 text-white" 
                  onClick={() => handleSubmitCase(false)}
                >
                  Submit Case
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
