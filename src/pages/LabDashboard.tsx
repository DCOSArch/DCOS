import React, { useState } from 'react';
import { mockUsers } from '@/src/mockData';
import { StatusBadge } from '@/src/components/StatusBadge';
import SummaryChart from '@/src/components/SummaryChart';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CaseStatus, Urgency, Case, InventoryItem } from '@/src/types';
import { Clock, Activity, CheckCircle2, Filter, Plus, PackageMinus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud } from 'lucide-react';

interface LabDashboardProps {
  navigateTo: (page: { name: 'dashboard' } | { name: 'case_details'; caseId: string }) => void;
  cases: Case[];
  setCases: React.Dispatch<React.SetStateAction<Case[]>>;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}

export default function LabDashboard({ navigateTo, cases, setCases, inventory, setInventory }: LabDashboardProps) {
  const [filterUrgency, setFilterUrgency] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [draggedCaseId, setDraggedCaseId] = useState<string | null>(null);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  const KANBAN_COLUMNS: { id: CaseStatus; label: string }[] = [
    { id: 'PENDING', label: 'Incoming' },
    { id: 'IN_PROGRESS', label: 'In Production' },
    { id: 'QUALITY_CHECK', label: 'QC & Finishing' },
    { id: 'DISPATCHED', label: 'Dispatched' },
  ];

  const activeCasesCount = cases.filter(c => c.status !== 'DELIVERED').length;
  const completedCasesCount = cases.filter(c => c.status === 'DELIVERED').length;

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCaseId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, statusId: CaseStatus) => {
    e.preventDefault();
    if (draggedCaseId) {
      const caseItem = cases.find(c => c.id === draggedCaseId);
      
      // Material Sync Logic
      if (caseItem && caseItem.status === 'PENDING' && statusId === 'IN_PROGRESS' && caseItem.material) {
        const matchedItem = inventory.find(inv => inv.name === caseItem.material && inv.quantity > 0);
        if (matchedItem) {
          setSyncNotification(`Deducted 1 ${matchedItem.unit} of ${matchedItem.name}`);
          setTimeout(() => setSyncNotification(null), 3000);
          setInventory(prev => prev.map(inv => 
            inv.id === matchedItem.id ? { ...inv, quantity: inv.quantity - 1 } : inv
          ));
        }
      }

      setCases(prev => prev.map(c => c.id === draggedCaseId ? { ...c, status: statusId } : c));
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
        <div className="flex gap-2 items-center bg-background rounded-lg border border-border p-1 shadow-sm">
          <Filter className="w-4 h-4 ml-2 text-muted-foreground" />
          <Select value={filterUrgency} onValueChange={setFilterUrgency}>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-stretch pb-6 border-b border-border">
        <SummaryChart cases={cases} />
        <Card className="flex flex-col justify-center h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Production</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeCasesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Cases in pipeline</p>
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
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-200">System Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">New batch of STL files processed. Ready for QC inspection.</p>
          </CardContent>
        </Card>
      </div>

      <div className="w-full pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {KANBAN_COLUMNS.map(column => {
            const columnCases = filteredCases.filter(c => c.status === column.id);
            return (
              <div 
                key={column.id} 
                className="flex flex-col pt-2"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {column.label}
                    <span className="bg-muted text-foreground text-xs py-0.5 px-2 rounded-full font-medium">
                      {columnCases.length}
                    </span>
                  </h3>
                </div>
                
                <div className={`flex-1 space-y-3 rounded-xl p-3 min-h-[500px] transition-colors ${draggedCaseId ? 'bg-muted/50 border-2 border-dashed border-primary/20' : 'bg-muted/30 border-2 border-transparent'}`}>
                  {columnCases.length === 0 ? (
                    <div className="h-24 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-sm text-muted-foreground pointer-events-none">
                      Drop cases here
                    </div>
                  ) : (
                    columnCases.map(caseItem => {
                      const dentist = mockUsers.find(u => u.id === caseItem.dentistId);
                      return (
                        <Card 
                          key={caseItem.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, caseItem.id)}
                          onClick={() => navigateTo({ name: 'case_details', caseId: caseItem.id })}
                          className="cursor-move hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-border hover:border-primary/50 opacity-100 overflow-hidden"
                        >
                          <CardContent className="p-2 bg-background">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="font-mono text-[9px] text-muted-foreground font-medium">#{caseItem.id.toUpperCase()}</span>
                              <div className="flex gap-1 items-center scale-[0.85] origin-right">
                                {caseItem.urgency === 'URGENT' && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                                {caseItem.urgency === 'HIGH' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>}
                                <StatusBadge status={caseItem.status} />
                              </div>
                            </div>
                            <h4 className="font-semibold text-xs text-foreground truncate">{caseItem.patientName}</h4>
                            <div className="mt-1.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded px-1.5 py-1">
                              <p className="text-[10px] font-medium text-blue-800 dark:text-blue-300 leading-none truncate">{caseItem.requestedTreatment}</p>
                            </div>
                            
                            <div className="mt-2 pt-1.5 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground">
                              <span className="font-medium text-foreground truncate max-w-[100px]">
                                {dentist?.name || 'Unknown Dr.'}
                              </span>
                              <div className="flex items-center gap-1 text-destructive font-medium">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(caseItem.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogTrigger 
          render={<Button className="fixed bottom-6 right-6 md:bottom-10 md:right-10 h-14 w-14 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 p-0 z-50" />}
        >
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
             {/* Simple form for creating case */}
             <div className="grid gap-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input id="patientName" placeholder="e.g. John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="treatment">Treatment Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crown">Zirconia Crown</SelectItem>
                      <SelectItem value="bridge">Fixed Bridge</SelectItem>
                      <SelectItem value="nightguard">Nightguard</SelectItem>
                      <SelectItem value="implant">Implant Abutment</SelectItem>
                      <SelectItem value="veneer">Porcelain Veneer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select>
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
                <div className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium text-foreground">Drag & Drop STL Files Here</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse from your computer</p>
                </div>
              </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsCreateModalOpen(false)}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
