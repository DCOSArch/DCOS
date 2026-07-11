'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { User, Case, ChatMessage, CaseStatus } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, FileText, User as UserIcon, Building2, Download, Box, Link2, Send, Lock, Clock, Cpu, Eye, Truck, CheckCircle2, UploadCloud, Activity, Camera } from 'lucide-react';
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
  { status: 'DELIVERED', label: 'Delivered', desc: 'Delivered to clinic' },
  { status: 'COMPLETED', label: 'Completed', desc: 'Fitted and confirmed' }
];
const statusOrder = ['PENDING', 'IN_PROGRESS', 'QUALITY_CHECK', 'DISPATCHED', 'DELIVERED', 'COMPLETED'];

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

  const SHADE_HEX_MAP: Record<string, string> = useMemo(() => ({
    A1: '#f4ebe1',
    A2: '#ebdccb',
    A3: '#e3ceb5',
    'A3.5': '#d8bf9f',
    A4: '#cca782',
    B1: '#f4ecd8',
    B2: '#eadbb9',
    B3: '#e1ca9e',
    B4: '#d4b882',
    C1: '#ebdcd4',
    C2: '#dfc7bd',
    C3: '#d4b8aa',
    C4: '#c09e8f',
    D2: '#e2cfbd',
    D3: '#d4b79f',
    D4: '#cca487',
  }), []);

  const parsedDesignParams = useMemo(() => {
    if (!caseItem.instructions) return null;
    const marker = '[Design Parameters]:';
    const index = caseItem.instructions.indexOf(marker);
    if (index === -1) return null;
    
    try {
      const jsonStr = caseItem.instructions.substring(index + marker.length).trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse design parameters from instructions:', e);
      return null;
    }
  }, [caseItem.instructions]);

  const displayInstructions = useMemo(() => {
    if (!caseItem.instructions) return '';
    const marker = '[Design Parameters]:';
    const index = caseItem.instructions.indexOf(marker);
    if (index === -1) return caseItem.instructions;
    return caseItem.instructions.substring(0, index).trim();
  }, [caseItem.instructions]);

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
  const [tempProposalDate, setTempProposalDate] = useState('');
  
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
          dicomUrl: updated.dicom_url,
          proposedDueDate: updated.proposed_due_date,
          dueDateProposalsCount: updated.due_date_proposals_count
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

  const handleProposeDueDate = async () => {
    if (!tempProposalDate) return;
    try {
      const { error } = await supabase
        .from('cases')
        .update({
          proposed_due_date: tempProposalDate,
          due_date_proposals_count: (caseItem.dueDateProposalsCount || 0) + 1
        })
        .eq('id', caseItem.id);
      
      if (error) throw error;
      
      await supabase.from('timeline_events').insert({
        case_id: caseItem.id,
        status_update: 'Timeline proposed update',
        notes: `Lab proposed new delivery due date: ${new Date(tempProposalDate).toLocaleDateString()} (proposal #${(caseItem.dueDateProposalsCount || 0) + 1})`,
        visibility: 'BOTH'
      });
      
      setCaseItem(prev => ({
        ...prev,
        proposedDueDate: tempProposalDate,
        dueDateProposalsCount: (prev.dueDateProposalsCount || 0) + 1
      }));
      toast.success("Timeline proposed update successfully sent to dentist!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit due date proposal: " + err.message);
    }
  };

  const handleAcknowledgeDueDate = async (approved: boolean) => {
    try {
      if (approved) {
        const { error } = await supabase
          .from('cases')
          .update({
            due_date: new Date(caseItem.proposedDueDate!).toISOString(),
            proposed_due_date: null
          })
          .eq('id', caseItem.id);
        if (error) throw error;
        
        await supabase.from('timeline_events').insert({
          case_id: caseItem.id,
          status_update: 'Due date updated',
          notes: `Dentist approved due date adjustment to ${new Date(caseItem.proposedDueDate!).toLocaleDateString()}`,
          visibility: 'BOTH'
        });
        
        setCaseItem(prev => ({
          ...prev,
          dueDate: new Date(prev.proposedDueDate!).toISOString(),
          proposedDueDate: undefined
        }));
        toast.success("Delivery due date successfully adjusted!");
      } else {
        const { error } = await supabase
          .from('cases')
          .update({
            proposed_due_date: null
          })
          .eq('id', caseItem.id);
        if (error) throw error;
        
        await supabase.from('timeline_events').insert({
          case_id: caseItem.id,
          status_update: 'Timeline proposal rejected',
          notes: `Dentist rejected due date adjustment to ${new Date(caseItem.proposedDueDate!).toLocaleDateString()}`,
          visibility: 'BOTH'
        });
        
        setCaseItem(prev => ({
          ...prev,
          proposedDueDate: undefined
        }));
        toast.error("Timeline proposed update was rejected.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to process due date proposal: " + err.message);
    }
  };

  const handleConfirmFinalStatus = async (targetStatus: CaseStatus) => {
    try {
      const notes = 
        targetStatus === 'COMPLETED' 
          ? 'Dentist confirmed clinical fit on patient. Case completed.'
          : targetStatus === 'IN_PROGRESS'
            ? 'Dentist flagged restoration fit failure. Remake order queued.'
            : 'Dentist rejected case due to quality/aesthetic mismatch.';
            
      const { error } = await supabase
        .from('cases')
        .update({
          status: targetStatus
        })
        .eq('id', caseItem.id);
      if (error) throw error;
      
      await supabase.from('timeline_events').insert({
        case_id: caseItem.id,
        status_update: targetStatus === 'COMPLETED' ? 'Case Completed' : targetStatus === 'IN_PROGRESS' ? 'Remake Initiated' : 'Case Rejected',
        notes: notes,
        visibility: 'BOTH'
      });
      
      setCaseItem(prev => ({
        ...prev,
        status: targetStatus
      }));
      
      if (targetStatus === 'COMPLETED') {
        toast.success("Case successfully completed and closed!");
      } else if (targetStatus === 'IN_PROGRESS') {
        toast.warning("Remake loop initialized. Laboratory notified.");
      } else {
        toast.error("Case marked as rejected. Disputes support team notified.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update final status: " + err.message);
    }
  };

  const handleRequestTrial = async () => {
    try {
      await supabase.from('timeline_events').insert({
        case_id: caseItem.id,
        status_update: 'Trial Try-In Requested',
        notes: `${currentUser.role === 'DENTIST' ? 'Dentist' : 'Lab'} requested an additional clinical trial stage.`,
        visibility: 'BOTH'
      });
      
      const { error } = await supabase
        .from('cases')
        .update({ status: 'IN_PROGRESS' })
        .eq('id', caseItem.id);
      if (error) throw error;
      
      setCaseItem(prev => ({ ...prev, status: 'IN_PROGRESS' }));
      toast.info("Clinical trial stage appended to active pipeline.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to request trial: " + err.message);
    }
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
          <Button onClick={handlePublishDraft} className="bg-primary hover:bg-primary-hover text-primary-foreground shrink-0">
            Submit Case
          </Button>
        </div>
      )}

      {caseItem.proposedDueDate && currentUser.role === 'DENTIST' && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in slide-in-from-top-2 duration-300">
          <div>
            <h3 className="font-semibold text-amber-500 text-sm flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Proposed Timeline Adjustment (Proposal #{caseItem.dueDateProposalsCount})
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              The laboratory has proposed adjusting the delivery due date to <span className="font-semibold text-foreground">{new Date(caseItem.proposedDueDate).toLocaleDateString()}</span>. Please approve or reject this adjustment.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button onClick={() => handleAcknowledgeDueDate(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs">
              Confirm Date
            </Button>
            <Button onClick={() => handleAcknowledgeDueDate(false)} variant="outline" className="border-border text-foreground hover:bg-muted bg-background h-9 text-xs">
              Reject
            </Button>
          </div>
        </div>
      )}

      {caseItem.status === 'DELIVERED' && currentUser.role === 'DENTIST' && (
        <div className="bg-success-soft border border-success/30 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-top-2 duration-300">
          <div>
            <h3 className="font-semibold text-success text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Verify Restoration Delivery & Patient Fit
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              The laboratory has marked this restoration as delivered. Please confirm the clinical fit on the patient.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            <Button onClick={() => handleConfirmFinalStatus('COMPLETED')} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs">
              Done (Confirm Fit)
            </Button>
            <Button onClick={() => handleConfirmFinalStatus('IN_PROGRESS')} className="bg-amber-500 hover:bg-amber-600 text-white h-9 text-xs">
              Repeat (Redo Remake)
            </Button>
            <Button onClick={() => handleConfirmFinalStatus('REJECTED')} variant="destructive" className="h-9 text-xs">
              Reject Case
            </Button>
          </div>
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

          {caseItem.status !== 'DRAFT' && caseItem.status !== 'DELIVERED' && caseItem.status !== 'COMPLETED' && caseItem.status !== 'REJECTED' && (
            <Button variant="outline" size="sm" onClick={handleRequestTrial} className="gap-1.5 border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/20 dark:text-orange-400">
              <Activity className="h-4 w-4" />
              Request Trial Try-In
            </Button>
          )}

          {currentUser.role === 'LAB_ADMIN' && caseItem.status !== 'DELIVERED' && caseItem.status !== 'COMPLETED' && caseItem.status !== 'REJECTED' && (
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
                    colorClass = "text-primary bg-primary-soft border-primary/30";
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
                  <div className="flex flex-col gap-1">
                    <p className="font-medium text-foreground text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/50 border border-red-100 dark:border-red-900 inline-block px-2 rounded self-start">
                      {new Date(caseItem.dueDate).toLocaleDateString()}
                    </p>
                    {caseItem.proposedDueDate && (
                      <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 self-start text-[10px] py-0">
                        Proposed: {new Date(caseItem.proposedDueDate).toLocaleDateString()} (Awaiting doctor approval)
                      </Badge>
                    )}
                    {currentUser.role === 'LAB_ADMIN' && (
                      <Dialog>
                        <DialogTrigger render={<Button variant="link" size="sm" className="h-5 p-0 text-primary justify-start text-[10px]">Propose new date</Button>}>
                            Propose new date
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px] bg-background border-border">
                          <DialogHeader>
                            <DialogTitle className="text-foreground">Propose Delivery Date Adjustment</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                              The dentist will receive a notification to approve or reject this proposal.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Input 
                              type="date"
                              id="proposalDate"
                              min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                              onChange={(e) => setTempProposalDate(e.target.value)}
                              className="border-border text-foreground bg-background"
                            />
                          </div>
                          <DialogFooter>
                            <DialogClose render={<Button variant="outline" className="border-border text-foreground">Cancel</Button>}>Cancel</DialogClose>
                            <Button onClick={handleProposeDueDate} className="bg-primary text-primary-foreground hover:bg-primary-hover">Submit Proposal</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><UserIcon className="w-4 h-4" /> Prescribing Dentist</p>
                  <p className="font-medium text-foreground">{dentistName || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><Building2 className="w-4 h-4" /> Destination Lab</p>
                  <p className="font-medium text-foreground">{labName || '—'}</p>
                </div>

                {caseItem.patientGender && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">🧬 Biological Gender</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {caseItem.patientGender === 'MALE' ? (
                        <Badge className="bg-muted text-muted-foreground border-border hover:bg-muted text-xs">Male (M)</Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground border-border hover:bg-muted text-xs">Female (F)</Badge>
                      )}
                    </div>
                  </div>
                )}
                {caseItem.patientAge && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">🎂 Patient Age</p>
                    <p className="font-medium text-foreground">{caseItem.patientAge} years old</p>
                  </div>
                )}

                {caseItem.implantBrand && (
                  <div className="space-y-1 col-span-2 border-t border-border pt-4 mt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Implant Specifications</p>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Implant Brand</p>
                        <p className="font-semibold text-xs text-foreground mt-0.5">{caseItem.implantBrand}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Scan Body Model</p>
                        <p className="font-semibold text-xs text-foreground mt-0.5">{caseItem.scanBodyModel} Type</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Logistics / Parts</p>
                        <p className="font-semibold text-xs text-foreground mt-0.5">{caseItem.analogLogistics}</p>
                      </div>
                    </div>
                  </div>
                )}
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
                {displayInstructions && (
                  <div className="space-y-1 col-span-2 border-t border-border pt-4 mt-2">
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-2"><FileText className="w-4 h-4" /> Custom Instructions</p>
                    <p className="text-xs text-foreground bg-muted/30 p-3 rounded-lg border border-border whitespace-pre-wrap leading-relaxed mt-1">{displayInstructions}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {parsedDesignParams && (
            <Card className="shadow-sm border-border">
              <CardHeader className="bg-muted/30 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">🎨 Clinical Design Specifications</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Tooth Chart and Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Parameter list */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Restoration Parameters</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border">
                        <p className="text-muted-foreground font-medium">Occlusal Clearance</p>
                        <p className="font-bold text-foreground mt-1">{parsedDesignParams.occlusalClearance || '—'}</p>
                      </div>
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border">
                        <p className="text-muted-foreground font-medium">Contact Design</p>
                        <p className="font-bold text-foreground mt-1">{parsedDesignParams.contactDesign || '—'}</p>
                      </div>
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border">
                        <p className="text-muted-foreground font-medium">Connector Design</p>
                        <p className="font-bold text-foreground mt-1">{parsedDesignParams.connectorDesign || '—'}</p>
                      </div>
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-border">
                        <p className="text-muted-foreground font-medium">Pontic Design</p>
                        <p className="font-bold text-foreground mt-1">{parsedDesignParams.ponticDesign || '—'}</p>
                      </div>
                    </div>

                    {parsedDesignParams.characterizations && parsedDesignParams.characterizations.length > 0 && (
                      <div className="space-y-1.5 mt-4">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Aesthetic Characterizations</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {parsedDesignParams.characterizations.map((char: string) => (
                            <Badge key={char} variant="secondary" className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border">{char}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3-Zone Custom Shading Canvas */}
                  {parsedDesignParams.customShade?.enabled && (
                    <div className="border border-border rounded-lg p-4 bg-muted/15 flex gap-4 items-center justify-center">
                      <div className="text-center">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Custom Shading Map</p>
                        <div className="flex gap-4 items-center">
                          <div className="flex flex-col justify-between text-[9px] text-muted-foreground py-2" style={{ height: '110px' }}>
                            <span>Cervical: <strong>{parsedDesignParams.customShade.cervical}</strong></span>
                            <span>Body: <strong>{parsedDesignParams.customShade.body}</strong></span>
                            <span>Incisal: <strong>{parsedDesignParams.customShade.incisal}</strong></span>
                          </div>
                          
                          <svg viewBox="0 0 80 120" className="w-16 shrink-0" style={{ height: '110px' }}>
                            <defs>
                              <clipPath id="detailsToothClip">
                                <path d="M 15 8 Q 40 3 65 8 L 63 45 L 60 80 L 55 105 Q 40 115 25 105 L 20 80 L 17 45 Z" />
                              </clipPath>
                            </defs>
                            <rect x="0" y="0" width="80" height="40" fill={SHADE_HEX_MAP[parsedDesignParams.customShade.cervical] || '#ebdccb'} clipPath="url(#detailsToothClip)" />
                            <rect x="0" y="40" width="80" height="40" fill={SHADE_HEX_MAP[parsedDesignParams.customShade.body] || '#ebdccb'} clipPath="url(#detailsToothClip)" />
                            <rect x="0" y="80" width="80" height="40" fill={SHADE_HEX_MAP[parsedDesignParams.customShade.incisal] || '#ebdccb'} clipPath="url(#detailsToothClip)" />
                            <path d="M 15 8 Q 40 3 65 8 L 63 45 L 60 80 L 55 105 Q 40 115 25 105 L 20 80 L 17 45 Z" fill="none" stroke="#999" strokeWidth="1.5" />
                            <line x1="15" y1="40" x2="65" y2="40" stroke="#aaa" strokeWidth="0.5" strokeDasharray="2,2" />
                            <line x1="18" y1="80" x2="62" y2="80" stroke="#aaa" strokeWidth="0.5" strokeDasharray="2,2" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tooth Chart Detail List */}
                {parsedDesignParams.toothConfigs && Object.keys(parsedDesignParams.toothConfigs).length > 0 && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tooth Configuration Details</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(parsedDesignParams.toothConfigs).map(([tooth, status]) => {
                        const getIndicationDetails = (s: string) => {
                          switch (s) {
                            case 'coping':
                              return { label: 'Coping', color: 'bg-teal-500/10 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-900' };
                            case 'anatomic':
                              return { label: 'Anatomic Crown', color: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-900' };
                            case 'pontic':
                              return { label: 'Pontic Segment', color: 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-900' };
                            case 'adjacent':
                              return { label: 'Adjacent Element', color: 'bg-orange-500/10 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-900' };
                            case 'antagonist':
                              return { label: 'Antagonist Layer', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-900' };
                            default:
                              return { label: s, color: 'bg-zinc-100 text-zinc-800 border-zinc-200' };
                          }
                        };
                        const details = getIndicationDetails(status as string);
                        return (
                          <div key={tooth} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border ${details.color}`}>
                            <span className="font-bold font-mono">Tooth {tooth}:</span>
                            <span className="font-medium">{details.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Reference Photograph */}
                {parsedDesignParams.shadePhotoUrl && (
                  <div className="border-t border-border pt-4">
                    <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Clinical Reference Photograph</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border overflow-hidden">
                        <Camera className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">Shade matching reference photo attached</p>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="h-5 p-0 text-primary font-semibold"
                          onClick={() => {
                            const { data } = supabase.storage.from('scans').getPublicUrl(parsedDesignParams.shadePhotoUrl);
                            window.open(data.publicUrl, '_blank');
                          }}
                        >
                          View Full Photograph
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
            {(caseItem.status === 'DELIVERED' || caseItem.status === 'COMPLETED') && (
              <CardFooter className="bg-red-500/5 border-t border-border p-4 flex flex-col items-start gap-2">
                <p className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  Data Retention Alert (Indian Dental Standards)
                </p>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  Under DCOS local data storage policies, patient 3D STL files are automatically purged from secure cloud servers 30 days after delivery. Please download scan history for local archives.
                </p>
                <Button size="sm" variant="outline" className="w-full text-red-700 border-red-200 hover:bg-red-50 text-xs h-8 mt-1" onClick={() => window.open(scanFileUrl, '_blank')}>
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Export Patient Case History (ZIP)
                </Button>
              </CardFooter>
            )}
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
          {/* Chat Integration Card */}
          <Card className="flex flex-col h-[600px] shadow-sm border-border">
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
