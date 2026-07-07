'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { User, Case, ChatMessage } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, FileText, User as UserIcon, Building2, Download, Box, Link2, Send, Lock, Clock, Cpu, Eye, Truck, CheckCircle2, UploadCloud } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// ThreeDViewer uses WebGL/canvas APIs — must be loaded client-side only
const ThreeDViewer = dynamic(() => import('@/components/ThreeDViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3">
      <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-t-blue-500 animate-spin" />
      <p className="text-xs text-slate-500">Initialising 3D engine...</p>
    </div>
  ),
});

interface CaseDetailsProps {
  initialCase: Case;
  currentUser: User;
  initialDentistName?: string;
  initialLabName?: string;
  initialTimeline?: any[];
  initialMessages?: ChatMessage[];
  initialChatId?: string | null;
}

const PIPELINE_STEPS = [
  { status: 'PENDING', label: 'Incoming', desc: 'Awaiting lab approval' },
  { status: 'IN_PROGRESS', label: 'Production', desc: 'CAD/CAM milling' },
  { status: 'QUALITY_CHECK', label: 'QC & Finishing', desc: 'Precision inspection' },
  { status: 'DISPATCHED', label: 'Dispatched', desc: 'In transit to clinic' },
  { status: 'DELIVERED', label: 'Completed', desc: 'Delivered and fitted' }
];
const statusOrder = ['PENDING', 'IN_PROGRESS', 'QUALITY_CHECK', 'DISPATCHED', 'DELIVERED'];

export default function CaseDetailsClient({ 
  initialCase, 
  currentUser,
  initialDentistName = '',
  initialLabName = '',
  initialTimeline = [],
  initialMessages = [],
  initialChatId = null
}: CaseDetailsProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  
  // Real-time synchronization
  const [caseItem, setCaseItem] = useState<Case>(initialCase);
  useEffect(() => {
    setCaseItem(initialCase);
  }, [initialCase]);
  const [showPatientLinkModal, setShowPatientLinkModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [dbTimeline, setDbTimeline] = useState<any[]>(initialTimeline);
  const [dentistName, setDentistName] = useState<string>(initialDentistName);
  const [labName, setLabName] = useState<string>(initialLabName);
  
  const isChatUnlocked = caseItem?.status !== 'DRAFT' && caseItem?.status !== 'PENDING' && (caseItem?.status as string) !== 'REJECTED';

  const currentIdx = useMemo(() => statusOrder.indexOf(caseItem.status), [caseItem.status]);

  const [isUploadingDesign, setIsUploadingDesign] = useState(false);

  const designFileUrl = useMemo(() => {
    if (!caseItem.designUrl) return undefined;
    if (caseItem.designUrl.startsWith('http')) return caseItem.designUrl;
    const { data } = supabase.storage.from('designs').getPublicUrl(caseItem.designUrl);
    return data.publicUrl;
  }, [caseItem.designUrl, supabase]);

  const handleDesignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDesign(true);
    try {
      const fileName = `${caseItem.id}_design_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data, error } = await supabase.storage.from('designs').upload(fileName, file);
      if (error) throw error;

      const { error: updateError } = await supabase
        .from('cases')
        .update({ design_url: data.path })
        .eq('id', caseItem.id);

      if (updateError) throw updateError;

      setCaseItem(prev => ({ ...prev, designUrl: data.path }));
      toast.success("CAD/CAM design soft-copy successfully archived!");
    } catch (err: any) {
      console.error("Design upload error:", err);
      toast.error("Failed to archive design: " + err.message);
    } finally {
      setIsUploadingDesign(false);
    }
  };

  const handlePublishDraft = async () => {
    // 1. Update cases state to PENDING
    setCaseItem(prev => ({ ...prev, status: 'PENDING' }));
    
    // 2. Update Supabase cases table
    const { error: updateError } = await supabase.from('cases').update({ status: 'PENDING' }).eq('id', caseItem.id);
    if (updateError) {
      console.error("Error publishing draft case:", updateError);
      toast.error("Error submitting case. Please try again.");
      return;
    }

    // 3. Push a timeline event
    await supabase.from('timeline_events').insert({
      case_id: caseItem.id,
      status_update: 'Case Submitted',
      notes: 'Dentist submitted the draft case for production.',
      visibility: 'BOTH'
    });

    toast.success("Case successfully submitted for production!");
  };

  // Fetch dentist name and lab name from real DB if not provided
  useEffect(() => {
    if (initialDentistName && initialLabName) return;
    const fetchNames = async () => {
      if (caseItem.dentistId && !dentistName) {
        const { data: dentistData } = await supabase
          .from('users')
          .select('name')
          .eq('id', caseItem.dentistId)
          .single();
        if (dentistData) setDentistName(dentistData.name);
      }
      if (caseItem.labId && !labName) {
        const { data: labData } = await supabase
          .from('lab_profiles')
          .select('name')
          .eq('id', caseItem.labId)
          .single();
        if (labData) setLabName(labData.name);
      }
    };
    fetchNames();
  }, [caseItem.dentistId, caseItem.labId, initialDentistName, initialLabName]);

  useEffect(() => {
    if (!isChatUnlocked) return;

    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const fetchChat = async () => {
      let activeChatId = chatId;
      if (!activeChatId) {
        // 1. Get the chat ID for this case
        let { data: chatData } = await supabase
          .from('order_chats')
          .select('id')
          .eq('case_id', caseItem.id)
          .single();
          
        if (!chatData) {
          // Auto-initialize chat room if it doesn't exist
          const { data: newChat } = await supabase
            .from('order_chats')
            .insert({ case_id: caseItem.id })
            .select('id')
            .single();
            
          chatData = newChat;
        }

        if (chatData) {
          setChatId(chatData.id);
          activeChatId = chatData.id;
        }
      }

      if (activeChatId && messages.length === 0) {
        // 2. Fetch existing messages if not already provided
        const { data: messageData } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_id', activeChatId)
          .order('created_at', { ascending: true });
        
        if (messageData) {
          setMessages(messageData.map((m: any) => ({
            id: m.id,
            chatId: m.chat_id,
            senderId: m.sender_id,
            content: m.content,
            timestamp: m.created_at
          })));
        }
      }

      if (activeChatId) {
        // 3. Subscribe to real-time new messages
        subscription = supabase
          .channel(`chat_${activeChatId}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${activeChatId}` }, payload => {
            const newMsg = payload.new;
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, {
                id: newMsg.id,
                chatId: newMsg.chat_id,
                senderId: newMsg.sender_id,
                content: newMsg.content,
                timestamp: newMsg.created_at
              }];
            });
          })
          .subscribe();
      }
    };

    fetchChat();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [caseItem.id, isChatUnlocked, supabase, chatId, messages.length]);

  useEffect(() => {
    if (initialTimeline.length === 0 && dbTimeline.length === 0) {
      const fetchTimeline = async () => {
        const { data } = await supabase
          .from('timeline_events')
          .select('*')
          .eq('case_id', caseItem.id)
          .order('timestamp', { ascending: false });
        
        if (data) {
          setDbTimeline(data);
        }
      };
      fetchTimeline();
    }
    
    // Subscribe to new timeline events
    const timelineSub = supabase.channel(`timeline_${caseItem.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'timeline_events', filter: `case_id=eq.${caseItem.id}` }, payload => {
        setDbTimeline(prev => [payload.new, ...prev]);
      })
      .subscribe();

    // Subscribe to updates on the case itself (live stepper updates)
    const caseSub = supabase.channel(`case_update_${caseItem.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cases', filter: `id=eq.${caseItem.id}` }, payload => {
        const updated = payload.new as any;
        setCaseItem(prev => ({
          ...prev,
          status: updated.status,
          urgency: updated.urgency,
          dueDate: updated.due_date,
          material: updated.material,
          shade: updated.shade,
          selectedTeeth: updated.selected_teeth,
          instructions: updated.instructions,
          designUrl: updated.design_url,
          dicomUrl: updated.dicom_url
        }));
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(timelineSub);
      supabase.removeChannel(caseSub);
    };
  }, [caseItem.id, initialTimeline, dbTimeline.length, supabase]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || isSending) return;

    const content = newMessage;
    setIsSending(true);
    setNewMessage(''); // optimistic clear

    await supabase.from('chat_messages').insert({
      chat_id: chatId,
      sender_id: currentUser.id,
      content: content
    });
    
    setIsSending(false);
  };
  
  const handleStatusUpdate = async (newStatus: string) => {
    // 1. Update cases state
    setCaseItem(prev => ({ ...prev, status: newStatus as any }));
    
    // 2. Update Supabase cases table
    const { error: updateError } = await supabase.from('cases').update({ status: newStatus }).eq('id', caseItem.id);
    if (updateError) {
      console.error("Error updating case:", updateError);
      return;
    }

    // 3. Push a timeline event
    await supabase.from('timeline_events').insert({
      case_id: caseItem.id,
      status_update: `Status changed to ${newStatus}`,
      notes: `Lab updated case status to ${newStatus}`,
      visibility: 'BOTH'
    });
  };

  // Timeline: only use real DB events (no mock data)
  const timeline = dbTimeline
    .map(t => ({
      id: t.id,
      caseId: t.case_id,
      statusUpdate: t.status_update,
      notes: t.notes,
      timestamp: t.timestamp,
      visibility: t.visibility
    }))
    .filter(t => {
      if (currentUser.role === 'DENTIST') {
        return t.visibility === 'EXTERNAL' || t.visibility === 'BOTH';
      } else {
        return t.visibility === 'INTERNAL' || t.visibility === 'BOTH';
      }
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (!caseItem) return <div>Case not found</div>;

  // Determine the public base URL for patient preview links
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dcos-ntw0f0d0w-dcosv1.vercel.app';
  const patientPreviewUrl = `${baseUrl}/preview/${caseItem.id}`;

  const scanFileUrl = useMemo(() => {
    if (!caseItem.scanUrl) return undefined;
    if (caseItem.scanUrl.startsWith('http')) return caseItem.scanUrl;
    const { data } = supabase.storage.from('scans').getPublicUrl(caseItem.scanUrl);
    return data.publicUrl;
  }, [caseItem.scanUrl, supabase]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(patientPreviewUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {caseItem.status === 'DRAFT' && currentUser.role === 'DENTIST' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-300">
          <div>
            <h3 className="font-semibold text-amber-500 text-sm">Draft Case</h3>
            <p className="text-xs text-muted-foreground mt-1">This case is currently saved as a draft. Click "Submit Case" to send it to the lab for production.</p>
          </div>
          <Button onClick={handlePublishDraft} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            Submit Case
          </Button>
        </div>
      )}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0 transition-transform hover:-translate-x-1">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-[200px]">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{caseItem.patientName}</h1>
            <StatusBadge status={caseItem.status} />
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
            <span className="font-mono">#{caseItem.id.slice(-8).toUpperCase()}</span>
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
              <Select defaultValue={caseItem.status} onValueChange={(val) => handleStatusUpdate(val || 'PENDING')}>
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

      {caseItem.status !== 'DRAFT' && (
        <Card className="shadow-sm border-border">
          <CardContent className="py-6 px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-4 relative">
              {/* Progress Line */}
              <div className="absolute left-[19px] top-[19px] bottom-[19px] w-0.5 bg-border md:left-0 md:right-0 md:top-[19px] md:h-0.5 md:w-full -z-10" />
              
              {PIPELINE_STEPS.map((step, idx) => {
                const isCompleted = idx < currentIdx;
                const isActive = idx === currentIdx;
                
                // Icon rendering
                let IconComponent = Clock;
                let animationClass = "";
                let colorClass = "text-muted-foreground bg-muted border-muted-foreground/20";
                
                if (step.status === 'PENDING') {
                  IconComponent = Clock;
                  if (isActive) {
                    animationClass = "animate-pulse";
                    colorClass = "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900";
                  } else if (isCompleted) {
                    IconComponent = CheckCircle2;
                    colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900";
                  }
                } else if (step.status === 'IN_PROGRESS') {
                  IconComponent = Cpu;
                  if (isActive) {
                    animationClass = "animate-spin duration-3000";
                    colorClass = "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900";
                  } else if (isCompleted) {
                    IconComponent = CheckCircle2;
                    colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900";
                  }
                } else if (step.status === 'QUALITY_CHECK') {
                  IconComponent = Eye;
                  if (isActive) {
                    animationClass = "animate-pulse";
                    colorClass = "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900";
                  } else if (isCompleted) {
                    IconComponent = CheckCircle2;
                    colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900";
                  }
                } else if (step.status === 'DISPATCHED') {
                  IconComponent = Truck;
                  if (isActive) {
                    animationClass = "animate-bounce";
                    colorClass = "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900";
                  } else if (isCompleted) {
                    IconComponent = CheckCircle2;
                    colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900";
                  }
                } else if (step.status === 'DELIVERED') {
                  IconComponent = CheckCircle2;
                  if (isActive || isCompleted) {
                    colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900";
                  }
                }
                
                return (
                  <div key={step.status} className="flex md:flex-col items-center gap-4 md:gap-2 flex-1 md:text-center z-10 w-full bg-background md:bg-transparent pr-4 md:pr-0">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${colorClass} ${isActive ? 'ring-4 ring-primary/10 scale-110 shadow-sm' : ''}`}>
                      <IconComponent className={`w-5 h-5 ${animationClass}`} />
                    </div>
                    <div className="space-y-0.5">
                      <p className={`text-sm font-semibold ${isActive ? 'text-foreground font-bold' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                      <p className="text-[10px] text-muted-foreground hidden sm:block">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                  <p className="font-medium text-foreground">{dentistName || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Building2 className="w-4 h-4" /> Destination Lab</p>
                  <p className="font-medium text-foreground">{labName || '—'}</p>
                </div>
                {caseItem.shade && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">🦷 Material Shade</p>
                    <p className="font-medium text-foreground">{caseItem.shade}</p>
                  </div>
                )}
                {caseItem.selectedTeeth && caseItem.selectedTeeth.length > 0 && (
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">🦷 Selected Teeth (FDI)</p>
                    <div className="flex gap-1.5 flex-wrap mt-1">
                      {caseItem.selectedTeeth.map(tooth => (
                        <Badge key={tooth} variant="outline" className="font-mono text-xs">{tooth}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {caseItem.instructions && (
                  <div className="space-y-1 col-span-2 border-t border-border pt-4 mt-2">
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Custom Instructions</p>
                    <p className="text-xs text-foreground bg-muted/30 p-3 rounded-lg border border-border whitespace-pre-wrap leading-relaxed mt-1">{caseItem.instructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 3D Viewer */}
          <Card className="overflow-hidden border-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg flex items-center gap-2"><Box className="w-5 h-5 text-primary"/> 3D Design Viewer</CardTitle>
              <div className="flex gap-2">
                {caseItem.scanUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 shadow-sm hidden sm:flex"
                    onClick={() => window.open(scanFileUrl, '_blank')}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download STL
                  </Button>
                )}
              </div>
            </CardHeader>
            <div className="h-[400px] w-full bg-[#111827] relative flex items-center justify-center group overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-[#111827]/80 pointer-events-none"></div>
              
              <div className="absolute inset-0 w-full h-full">
                <ThreeDViewer stlUrl={scanFileUrl} />
              </div>
            </div>
          </Card>

          {/* CAD/CAM Design Archive */}
          <Card className="shadow-sm border-border">
            <CardHeader className="bg-muted/30 border-b border-border py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Box className="w-5 h-5 text-emerald-500" />
                CAD/CAM Design Soft-Copy
              </CardTitle>
              <CardDescription>Permanent remake archiving and warranty verification.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {caseItem.designUrl ? (
                <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">CAD/CAM Design File Active</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[220px]">
                        {caseItem.designUrl.split('/').pop()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(designFileUrl, '_blank')}
                      className="gap-1.5 h-9"
                    >
                      <Download className="w-4 h-4" /> Download CAD
                    </Button>
                    {currentUser.role === 'LAB_ADMIN' && (
                      <label className="flex items-center justify-center px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold rounded-md cursor-pointer transition-colors shadow-sm h-9 border border-zinc-700">
                        Replace
                        <input type="file" className="hidden" onChange={handleDesignUpload} disabled={isUploadingDesign} />
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-border rounded-lg bg-muted/10 p-4">
                  <UploadCloud className="h-8 w-8 text-muted-foreground/60 mb-2 animate-bounce" />
                  <p className="text-sm font-semibold text-foreground">No Design Archived Yet</p>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
                    {currentUser.role === 'LAB_ADMIN' 
                      ? 'Upload the final milling-ready CAD soft-copy for permanent warranty archiving.' 
                      : 'Laboratory has not uploaded the final CAD soft-copy yet.'}
                  </p>
                  {currentUser.role === 'LAB_ADMIN' && (
                    <label className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-semibold rounded-md cursor-pointer transition-colors shadow-sm h-9">
                      {isUploadingDesign ? 'Uploading Design...' : 'Upload Design File'}
                      <input type="file" className="hidden" onChange={handleDesignUpload} disabled={isUploadingDesign} />
                    </label>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* DICOM / CBCT Scan (Surgical Guide) */}
          {caseItem.dicomUrl && (
            <Card className="shadow-sm border-border">
              <CardHeader className="bg-muted/30 border-b border-border py-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Box className="w-5 h-5 text-indigo-500" />
                  DICOM / CBCT Scan File
                </CardTitle>
                <CardDescription>Surgical guide fabrication CBCT scan archive.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">CBCT Scan Active</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px] sm:max-w-[220px]">
                        {caseItem.dicomUrl.split('/').pop()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={async () => {
                        const { data } = supabase.storage.from('scans').getPublicUrl(caseItem.dicomUrl!);
                        window.open(data.publicUrl, '_blank');
                      }}
                      className="gap-1.5 h-9"
                    >
                      <Download className="w-4 h-4" /> Download DICOM
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
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

          {/* Chat Integration Card */}
          <Card className="flex flex-col h-[500px] shadow-sm border-border">
            <CardHeader className="border-b border-border bg-muted/30 py-4">
              <CardTitle className="text-lg flex items-center justify-between">
                Order Chat
                {!isChatUnlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-4 overflow-y-auto bg-background/50">
              {!isChatUnlocked ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-80">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Chat Locked</p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">
                    Secure communication will be enabled once the lab confirms this order.
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-80">
                  <p className="text-sm font-medium text-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground">Start the conversation with the {currentUser.role === 'DENTIST' ? 'lab' : 'dentist'}.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map(msg => {
                    const isMe = msg.senderId === currentUser.id;
                    const senderName = isMe ? 'You' : 'Participant';
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                          {senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            {isChatUnlocked && (
              <CardFooter className="border-t border-border p-3 bg-muted/30">
                <form className="flex w-full items-center gap-2" onSubmit={handleSendMessage}>
                  <Input 
                    placeholder="Type your message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-background"
                    disabled={isSending}
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardFooter>
            )}
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
                value={patientPreviewUrl}
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
