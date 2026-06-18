import { useState } from 'react';
import { User, Case } from '@/src/types';
import { mockCases, mockTimelineEvents, mockUsers } from '@/src/mockData';
import { StatusBadge } from '@/src/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, FileText, User as UserIcon, Building2, Download, Box, Link2, Eye, Layers } from 'lucide-react';
import { ThreeDViewer } from '@/src/components/ThreeDViewer';

interface CaseDetailsProps {
  caseId: string;
  currentUser: User;
  goBack: () => void;
  cases: Case[];
}

export default function CaseDetails({ caseId, currentUser, goBack, cases }: CaseDetailsProps) {
  const [showPatientLinkModal, setShowPatientLinkModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const caseItem = cases.find(c => c.id === caseId);
  const dentist = mockUsers.find(u => u.id === caseItem?.dentistId);
  const lab = mockUsers.find(u => u.id === caseItem?.labId);
  
  // Timeline Filtering based on role
  const timeline = mockTimelineEvents
    .filter(t => t.caseId === caseId)
    .filter(t => {
      if (currentUser.role === 'DENTIST') {
        return t.visibility === 'EXTERNAL' || t.visibility === 'BOTH';
      } else {
        return t.visibility === 'INTERNAL' || t.visibility === 'BOTH';
      }
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (!caseItem) return <div>Case not found</div>;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`dentalconnect.os/preview/hash-${caseItem.id}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 transition-transform hover:-translate-x-1">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{caseItem.patientName}</h1>
            <StatusBadge status={caseItem.status} />
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
            <span className="font-mono">#{caseItem.id.toUpperCase()}</span>
            <span>•</span>
            <span>Created {new Date(caseItem.createdAt).toLocaleDateString()}</span>
          </p>
        </div>
        
        <div className="flex gap-2 items-center flex-wrap">
          {currentUser.role === 'DENTIST' && (
            <Button variant="outline" size="sm" onClick={() => setShowPatientLinkModal(true)} className="gap-2">
              <Link2 className="h-4 w-4" />
              Generate Patient Link
            </Button>
          )}

          {currentUser.role === 'LAB_ADMIN' && caseItem.status !== 'DELIVERED' && (
            <div className="flex items-center gap-2 bg-background rounded-lg p-1.5 shadow-sm border border-border">
              <span className="text-sm font-medium text-muted-foreground pl-2 hidden sm:inline">Update Status:</span>
              <Select defaultValue={caseItem.status}>
                <SelectTrigger className="w-[160px] border-none shadow-none h-8 bg-muted/50 focus:ring-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="QUALITY_CHECK">Quality Check</SelectItem>
                  <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Info Card */}
          <Card className="shadow-sm border-border">
            <CardHeader className="bg-muted/30 border-b border-border">
              <CardTitle className="text-lg">Prescription Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Requested Treatment</p>
                  <p className="font-medium text-foreground">{caseItem.requestedTreatment}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Calendar className="w-4 h-4" /> Due Date</p>
                  <p className="font-medium text-foreground text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/50 border border-red-100 dark:border-red-900 inline-block px-2 rounded">{new Date(caseItem.dueDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><UserIcon className="w-4 h-4" /> Prescribing Dentist</p>
                  <p className="font-medium text-foreground">{dentist?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Building2 className="w-4 h-4" /> Destination Lab</p>
                  <p className="font-medium text-foreground">{lab?.name}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3D Viewer */}
          <Card className="overflow-hidden border-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg flex items-center gap-2"><Box className="w-5 h-5 text-primary"/> 3D Design Viewer</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-9 shadow-sm hidden sm:flex">
                  <Download className="mr-2 h-4 w-4" /> Download STL
                </Button>
              </div>
            </CardHeader>
            <div className="h-[400px] w-full bg-[#111827] relative flex items-center justify-center group overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-[#111827]/80 pointer-events-none"></div>
              
              <div className="absolute inset-0 w-full h-full">
                <ThreeDViewer />
              </div>
            </div>
          </Card>
        </div>

        {/* Timeline Column */}
        <div className="space-y-6">
          <Card className="h-full shadow-sm border-border">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="text-lg">Case Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No timeline events</p>
                  <p className="text-xs text-muted-foreground mt-1">This case hasn't been updated yet.</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-border space-y-8 pb-4">
                  {timeline.map((event, index) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[31px] bg-background p-1 rounded-full border border-background">
                        <div className={`w-3 h-3 rounded-full ring-4 ${event.visibility === 'INTERNAL' ? 'bg-amber-500 ring-amber-500/20' : 'bg-primary ring-primary/20'}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{event.statusUpdate.replace('_', ' ')}</p>
                            {event.visibility === 'INTERNAL' && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-900 dark:text-amber-400 dark:bg-amber-950/30">Internal</Badge>
                            )}
                          </div>
                          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">{new Date(event.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-1">{event.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showPatientLinkModal} onOpenChange={setShowPatientLinkModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>B2B2C Smile Preview Link</DialogTitle>
            <DialogDescription>
              Share this secure, HIPAA-compliant 3D preview with your patient so they can approve the aesthetic design.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <Input
                readOnly
                className="font-mono text-sm bg-muted/50"
                value={`https://dentalconnect.os/preview/hash-${caseItem.id}`}
              />
            </div>
            <Button size="sm" className="px-3" onClick={handleCopyLink}>
              {isCopied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Link expires in 72 hours.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
