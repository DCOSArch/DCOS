'use client';

import React, { useState, useRef, useEffect } from 'react';
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
import { Plus, Activity, CheckCircle2, UploadCloud, FileBox, Filter, FileText, Box, Building2 } from 'lucide-react';
import { Case, User, DoctorInventoryItem } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface DentistDashboardProps {
  initialCases: Case[];
  currentUser: User;
  availableLabs: { id: string; name: string }[];
}

export default function DentistDashboard({ initialCases, currentUser, availableLabs }: DentistDashboardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  const [uploadState, setUploadState] = useState<'idle' | 'analyzing' | 'warning'>('idle');
  
  const [patientName, setPatientName] = useState('');
  const [treatmentType, setTreatmentType] = useState('');
  const [urgency, setUrgency] = useState<Case['urgency']>('NORMAL');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inventory, setInventory] = useState<DoctorInventoryItem[]>([]);
  const [selectedLabId, setSelectedLabId] = useState<string>('');

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
    
    fetchData();

    // Subscribe to cases
    const channel = supabase.channel('dentist_cases')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cases', filter: `dentist_id=eq.${currentUser.id}` }, payload => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser.id, router, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmitCase = async () => {
    if (!patientName.trim() || !treatmentType || !selectedFile || !selectedLabId) {
      alert('Please fill out patient name, treatment type, select a lab, and select a scan file.');
      return;
    }
    
    setUploadState('analyzing');
    
    try {
      // 1. Upload to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('scans')
        .upload(fileName, selectedFile);
        
      if (error) {
        console.error('Storage upload error:', error);
        alert('Failed to upload file. Please ensure the Supabase scans bucket exists and RLS allows public uploads.');
        setUploadState('idle');
        return;
      }
      
      // 2. Insert the case into the Supabase 'cases' table
      const dbCase = {
        patient_name: patientName,
        dentist_id: currentUser.id, 
        lab_id: selectedLabId,
        status: 'PENDING',
        urgency,
        requested_treatment: treatmentType,
        material: 'Zirconia HT', // Match the inventory name to trigger deduction
        scan_url: data.path, // Store the file path
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      const { data: insertedCase, error: insertError } = await supabase
        .from('cases')
        .insert([dbCase])
        .select()
        .single();

      if (insertError) {
        console.error('DB Insert Error:', insertError);
        alert('Error inserting case: ' + insertError.message);
      } else {
        // Refetch inventory to reflect deduction
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
      
      const newCase: Case = {
        id: insertedCase ? insertedCase.id : `case-${Date.now().toString().slice(-4)}`,
        patientName,
        dentistId: currentUser.id, 
        labId: selectedLabId, 
        status: 'PENDING',
        urgency,
        requestedTreatment: treatmentType,
        material: 'Zirconia HT',
        createdAt: new Date().toISOString(),
        dueDate: dbCase.due_date
      };
      
      router.refresh();
      setIsCreateModalOpen(false);
      
      // Reset form
      setPatientName('');
      setTreatmentType('');
      setUrgency('NORMAL');
      setSelectedFile(null);
      setUploadState('idle');
      
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

      <Card className="shadow-sm border-border mb-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <Badge variant="secondary" className="text-xs font-mono">{item.lockedPrice}/unit</Badge>
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
                    <TableCell className="font-mono text-xs font-medium text-muted-foreground">{caseItem.id.substring(0, 8).toUpperCase()}</TableCell>
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
          }, 300);
        }
      }}>
        <DialogTrigger render={<Button className="fixed bottom-6 right-6 md:bottom-10 md:right-10 h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 p-0 z-50 focus:outline-none" />}>
             <Plus className="h-6 w-6" />
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Lab Case</DialogTitle>
            <DialogDescription>
              Submit a new prescription to the dental laboratory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="patientName">Patient Name</Label>
              <Input 
                id="patientName" 
                placeholder="e.g. John Doe" 
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lab">Assign to Laboratory</Label>
              <Select value={selectedLabId} onValueChange={(val) => setSelectedLabId(val || '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a laboratory" />
                </SelectTrigger>
                <SelectContent>
                  {availableLabs.map(lab => (
                    <SelectItem key={lab.id} value={lab.id}>{lab.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="grid gap-2">
                <Label htmlFor="urgency">Urgency</Label>
                <Select value={urgency} onValueChange={(val: any) => setUrgency(val)}>
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
            </div>
            
            <div className="mt-4">
              <Label className="mb-2 block">Upload Scans (STL/PLY)</Label>
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
                  className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Drag & Drop STL/PLY Files Here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse from your computer</p>
                </div>
              )}

              {uploadState === 'idle' && selectedFile && (
                <div 
                  onClick={handleUploadClick}
                  className="border-2 border-primary/50 rounded-lg p-6 flex items-center gap-4 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                    </p>
                  </div>
                </div>
              )}
              
              {uploadState === 'analyzing' && (
                <div className="border border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-muted/20">
                  <Activity className="h-10 w-10 text-primary mb-3 animate-pulse" />
                  <p className="text-sm font-medium text-foreground">Uploading and Analyzing Scans...</p>
                  <div className="w-full max-w-xs bg-muted rounded-full h-1.5 mt-4 overflow-hidden">
                    <div className="bg-primary h-1.5 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                  </div>
                </div>
              )}

              {uploadState === 'warning' && (
                <div className="border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-6">
                  <div className="flex gap-3">
                    <div className="shrink-0">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Pre-Flight Analysis Warning</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                        Less than 1.5mm occlusal clearance detected on Tooth #14. This may result in a thin crown that is prone to fracture.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={uploadState === 'analyzing' || !patientName || !treatmentType || !selectedFile} 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={handleSubmitCase}
            >
              Submit Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
