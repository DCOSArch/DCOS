'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/StatusBadge';
import { ArchToothChart as ToothChart } from '@/components/dental/ArchToothChart';
import {
  Patient,
  Case,
  ToothChartData,
  ClinicalVisit,
  ClinicalInvoice,
  User,
  ChatMessage,
  CaseStatus,
} from '@/types';
import {
  getPatientToothChart,
  savePatientToothChart,
  getPatientVisits,
  getInvoices,
} from '@/lib/services';
import { createClient } from '@/lib/supabase/client';
import { getR2PublicUrl } from '@/lib/r2';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User as UserIcon,
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
  Box,
  Link2,
  Send,
  Lock,
  Cpu,
  Eye,
  Truck,
  CheckCircle2,
  UploadCloud,
  RefreshCw,
  Share2,
  Shield,
  CreditCard,
  ChevronDown,
  Check,
  Maximize2,
  Radio,
  ExternalLink,
} from 'lucide-react';

// Dynamic import for WebGL ThreeDViewer (client-side only)
const ThreeDViewer = dynamic(() => import('@/components/ThreeDViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] flex flex-col items-center justify-center text-muted-foreground gap-3 bg-neutral-950/40 rounded-xl border border-border">
      <div className="w-10 h-10 rounded-full border-2 border-border border-t-primary animate-spin" />
      <p className="text-xs font-mono text-muted-foreground">Initializing 3D WebGL Engine...</p>
    </div>
  ),
});

// Dynamic import for DICOM MPR Viewer
const DicomMprViewer = dynamic(() => import('@/components/viewer/DicomMprViewer').then(m => m.DicomMprViewer), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] flex flex-col items-center justify-center text-muted-foreground gap-3 bg-neutral-950/40 rounded-xl border border-border">
      <div className="w-10 h-10 rounded-full border-2 border-border border-t-cyan-500 animate-spin" />
      <p className="text-xs font-mono text-muted-foreground">Loading DICOM MPR Slices...</p>
    </div>
  ),
});

const PIPELINE_STEPS = [
  { status: 'PENDING', label: 'Incoming', desc: 'Awaiting lab approval' },
  { status: 'IN_PROGRESS', label: 'Production', desc: 'CAD/CAM milling' },
  { status: 'QUALITY_CHECK', label: 'QC & Finishing', desc: 'Precision inspection' },
  { status: 'DISPATCHED', label: 'Dispatched', desc: 'In transit to clinic' },
  { status: 'DELIVERED', label: 'Delivered', desc: 'Delivered to clinic' },
  { status: 'COMPLETED', label: 'Completed', desc: 'Fitted and confirmed' },
];
const statusOrder = ['PENDING', 'IN_PROGRESS', 'QUALITY_CHECK', 'DISPATCHED', 'DELIVERED', 'COMPLETED'];

interface UnifiedClinicalWorkspaceProps {
  patient: Patient;
  cases: Case[];
  currentUser?: User;
  initialActiveCaseId?: string;
  initialTimeline?: any[];
  initialMessages?: ChatMessage[];
  initialChatId?: string | null;
}

export function UnifiedClinicalWorkspace({
  patient,
  cases: initialCases,
  currentUser,
  initialActiveCaseId,
  initialTimeline = [],
  initialMessages = [],
  initialChatId = null,
}: UnifiedClinicalWorkspaceProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // 1. Core Patient EHR State
  const [toothChart, setToothChart] = useState<ToothChartData>({});
  const [visits, setVisits] = useState<ClinicalVisit[]>([]);
  const [invoices, setInvoices] = useState<ClinicalInvoice[]>([]);
  const [leftTab, setLeftTab] = useState<'overview' | 'visits' | 'prescriptions' | 'billing' | 'whatsapp'>('overview');

  // 2. Central Stage Mode (Tooth Chart vs 3D STL vs CAD Specs)
  const [centerMode, setCenterMode] = useState<'chart' | 'stl' | 'specs' | 'dicom'>('chart');

  // 3. Multi-Case Selection State
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => {
    if (initialActiveCaseId && initialCases.some(c => c.id === initialActiveCaseId)) {
      return initialActiveCaseId;
    }
    return initialCases.length > 0 ? initialCases[0].id : null;
  });

  const activeCase = useMemo(() => {
    return cases.find(c => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  // 4. Case Logistics, Modals & Chat State
  const [showPatientLinkModal, setShowPatientLinkModal] = useState(false);
  const [showTryInModal, setShowTryInModal] = useState(false);
  const [tryInNotes, setTryInNotes] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [timeline, setTimeline] = useState<any[]>(initialTimeline);
  const [isUploadingDesign, setIsUploadingDesign] = useState(false);
  const [dentistName, setDentistName] = useState('');
  const [labName, setLabName] = useState('');

  // 5. Initial Data Load
  useEffect(() => {
    if (patient?.id) {
      setToothChart(getPatientToothChart(patient.id));
      setVisits(getPatientVisits(patient.id));
      setInvoices(getInvoices(patient.id));
    }
  }, [patient?.id]);

  useEffect(() => {
    setCases(initialCases);
  }, [initialCases]);

  // 6. Parsed Design Parameters from Custom Instructions
  const parsedDesignParams = useMemo(() => {
    if (!activeCase?.instructions) return null;
    const marker = '[Design Parameters]:';
    const index = activeCase.instructions.indexOf(marker);
    if (index === -1) return null;
    try {
      const jsonStr = activeCase.instructions.substring(index + marker.length).trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse design parameters:', e);
      return null;
    }
  }, [activeCase?.instructions]);

  // 7. Chat Lock Rules
  const isChatUnlocked = useMemo(() => {
    if (!activeCase) return false;
    return activeCase.status !== 'DRAFT' && activeCase.status !== 'PENDING' && (activeCase.status as string) !== 'REJECTED';
  }, [activeCase]);

  const currentStatusIdx = useMemo(() => {
    if (!activeCase) return -1;
    return statusOrder.indexOf(activeCase.status);
  }, [activeCase]);

  const designFileUrl = useMemo(() => {
    return activeCase?.designUrl ? getR2PublicUrl(activeCase.designUrl) : null;
  }, [activeCase?.designUrl]);

  // 8. Realtime Chat Subscription
  useEffect(() => {
    if (!activeCase || !isChatUnlocked) return;

    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const initChat = async () => {
      let activeChatId = chatId;
      if (!activeChatId) {
        let { data: chatData } = await supabase
          .from('order_chats')
          .select('id')
          .eq('case_id', activeCase.id)
          .maybeSingle();

        if (!chatData) {
          const { data: newChat } = await supabase
            .from('order_chats')
            .insert({ case_id: activeCase.id })
            .select('id')
            .single();
          chatData = newChat;
        }

        if (chatData) {
          setChatId(chatData.id);
          activeChatId = chatData.id;
        }
      }

      if (activeChatId) {
        const { data: msgData } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('chat_id', activeChatId)
          .order('created_at', { ascending: true });

        if (msgData) {
          setMessages(msgData.map((m: any) => ({
            id: m.id,
            chatId: m.chat_id,
            senderId: m.sender_id,
            content: m.content,
            timestamp: m.created_at,
          })));
        }

        subscription = supabase
          .channel(`order_chat:${activeChatId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
              filter: `chat_id=eq.${activeChatId}`,
            },
            (payload) => {
              const newMsg = payload.new as any;
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, {
                  id: newMsg.id,
                  chatId: newMsg.chat_id,
                  senderId: newMsg.sender_id,
                  content: newMsg.content,
                  timestamp: newMsg.created_at,
                }];
              });
            }
          )
          .subscribe();
      }
    };

    initChat();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, [activeCase?.id, isChatUnlocked, supabase]);

  // 9. Handlers
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId || isSending) return;

    const currentUserId = currentUser?.id || 'u1';
    const textToSend = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: currentUserId,
          content: textToSend,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.id)) return prev;
          return [...prev, {
            id: data.id,
            chatId: data.chat_id,
            senderId: data.sender_id,
            content: data.content,
            timestamp: data.created_at,
          }];
        });
      }
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message: ' + err.message);
      setNewMessage(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handlePublishDraft = async () => {
    if (!activeCase) return;
    try {
      const { error } = await supabase.from('cases').update({ status: 'PENDING' }).eq('id', activeCase.id);
      if (error) throw error;

      setCases(prev => prev.map(c => c.id === activeCase.id ? { ...c, status: 'PENDING' } : c));
      toast.success('Case submitted to laboratory for production!');
    } catch (err: any) {
      console.error('Error submitting draft:', err);
      toast.error('Failed to submit case: ' + err.message);
    }
  };

  const handleDesignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCase) return;

    setIsUploadingDesign(true);
    try {
      const presignRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type || 'application/octet-stream' }),
      });
      if (!presignRes.ok) throw new Error('Presign failed');
      const { url: signedUrl, key } = await presignRes.json();

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedUrl, true);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed')));
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });

      await supabase.from('cases').update({ design_url: key }).eq('id', activeCase.id);
      setCases(prev => prev.map(c => c.id === activeCase.id ? { ...c, designUrl: key } : c));
      toast.success('CAD design soft-copy successfully archived!');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setIsUploadingDesign(false);
    }
  };

  const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

  const generateWhatsAppLink = (type: 'reminder' | 'balance' | 'followup') => {
    const cleanPhone = (patient.phone || patient.contactInfo || '').replace(/[^0-9]/g, '');
    if (!cleanPhone) return '#';
    let text = '';
    if (type === 'reminder') {
      text = `Dear ${patient.name}, this is a reminder from DentalConnect OS regarding your upcoming visit. Please reply to confirm.`;
    } else if (type === 'balance') {
      text = `Dear ${patient.name}, your outstanding balance is ₹${totalOutstanding.toLocaleString('en-IN')}. Pay via UPI: upi://pay?pa=clinic@okaxis&pn=DentalClinic&am=${totalOutstanding}`;
    } else {
      text = `Dear ${patient.name}, following up on your recent dental procedure. How are you feeling today? Let us know if you have any discomfort.`;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="flex-1 space-y-5 p-4 md:p-6 max-w-[1700px] mx-auto w-full animate-fade-in text-foreground">
      {/* ========================================================================= */}
      {/* 1. MASTER PATIENT HEADER & OPERATORY STATUS                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <Link href="/patients">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {patient.name}
              </h1>
              <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                ID: {patient.id.slice(-6).toUpperCase()}
              </Badge>
              {patient.medicalAlerts && patient.medicalAlerts.length > 0 && (
                <Badge variant="destructive" className="text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {patient.medicalAlerts.join(', ')}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span>{patient.age ? `${patient.age} yrs` : 'Age N/A'}, {patient.gender || 'Unspecified'}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-primary" /> {patient.phone || patient.contactInfo || 'No Phone'}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground" /> Registered: {new Date(patient.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Quick Operatory Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/patients/${patient.id}/capture`}>
            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
              <Camera className="w-3.5 h-3.5 mr-1 text-primary" />
              IOS Scan Body
            </Button>
          </Link>

          <Link href={`/visits/new?patientId=${patient.id}`}>
            <Button size="sm" variant="secondary" className="h-8 text-xs font-semibold">
              <Stethoscope className="w-3.5 h-3.5 mr-1" />
              New Clinical Encounter
            </Button>
          </Link>

          <Link href="/?action=create">
            <Button size="sm" className="h-8 bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Lab Case
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. LINKED LAB CASES STRIP & CASE SELECTOR                                 */}
      {/* ========================================================================= */}
      {cases.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-2.5 px-4 rounded-xl bg-muted/40 border border-border overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-primary" /> Active Lab Orders ({cases.length}):
            </span>
            <div className="flex items-center gap-2">
              {cases.map((c) => {
                const isSelected = c.id === selectedCaseId;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCaseId(c.id);
                      if (c.scanUrl && centerMode === 'chart') setCenterMode('stl');
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-card text-foreground border-primary shadow-xs'
                        : 'bg-muted/60 text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      c.status === 'DELIVERED' || c.status === 'COMPLETED' ? 'bg-emerald-500' :
                      c.status === 'IN_PROGRESS' || c.status === 'QUALITY_CHECK' ? 'bg-cyan-500 animate-pulse' :
                      'bg-amber-500'
                    }`} />
                    <span>#{c.id.slice(-6).toUpperCase()} ({c.requestedTreatment})</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-border">
                      {c.status}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {activeCase && (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setShowPatientLinkModal(true)}
              >
                <Share2 className="w-3 h-3 mr-1 text-primary" /> Patient 3D Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setShowTryInModal(true)}
              >
                <RefreshCw className="w-3 h-3 mr-1 text-amber-500" /> Request Try-In
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. LIVE CAD/CAM MANUFACTURING STEPPER                                     */}
      {/* ========================================================================= */}
      {activeCase && (
        <Card className="bg-card border-border shadow-xs overflow-hidden">
          {/* Draft Notice Banner if status is DRAFT */}
          {activeCase.status === 'DRAFT' && (
            <div className="bg-amber-500/10 border-b border-amber-500/30 p-3 px-4 flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span><strong>Draft Lab Order:</strong> This case is saved as a draft and has not yet been submitted to the milling center.</span>
              </div>
              <Button size="sm" className="h-7 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs" onClick={handlePublishDraft}>
                Publish for Production
              </Button>
            </div>
          )}

          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {PIPELINE_STEPS.map((step, idx) => {
              const isPast = currentStatusIdx > idx;
              const isCurrent = currentStatusIdx === idx;
              return (
                <div
                  key={step.status}
                  className={`p-2.5 rounded-xl border transition-all text-center ${
                    isCurrent
                      ? 'bg-primary/10 border-primary shadow-xs'
                      : isPast
                      ? 'bg-muted/40 border-emerald-500/30 text-muted-foreground'
                      : 'bg-muted/20 border-border opacity-50 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : isCurrent ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                    <span className={`text-xs font-bold ${isCurrent ? 'text-foreground font-extrabold' : ''}`}>
                      {step.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight truncate">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 4. MAIN 3-PANE WORKSPACE (CLINICAL EHR | OPERATORY STAGE | LAB HUB)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ----------------------------------------------------------------------- */}
        {/* PANE 1: CLINICAL PRACTICE RECORD & EHR (4 COLS)                         */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="p-3.5 pb-2 border-b border-border">
              <Tabs value={leftTab} onValueChange={(val: any) => setLeftTab(val)} className="w-full">
                <TabsList className="grid grid-cols-5 h-8 bg-muted/60 p-0.5 rounded-lg text-xs">
                  <TabsTrigger value="overview" className="text-[11px] p-0 font-medium">Overview</TabsTrigger>
                  <TabsTrigger value="visits" className="text-[11px] p-0 font-medium">Visits ({visits.length})</TabsTrigger>
                  <TabsTrigger value="prescriptions" className="text-[11px] p-0 font-medium">Rx</TabsTrigger>
                  <TabsTrigger value="billing" className="text-[11px] p-0 font-medium">Ledger</TabsTrigger>
                  <TabsTrigger value="whatsapp" className="text-[11px] p-0 font-medium">WhatsApp</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className="p-4 text-xs space-y-4 max-h-[620px] overflow-y-auto">
              {/* TAB A: OVERVIEW & DEMOGRAPHICS */}
              {leftTab === 'overview' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Balance Due</span>
                      <span className={`text-base font-extrabold ${totalOutstanding > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        ₹{totalOutstanding.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Visits Logged</span>
                      <span className="text-base font-extrabold text-foreground">{visits.length} Visits</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between p-2 rounded-lg bg-muted/20 border border-border">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="font-medium text-foreground">{patient.phone || patient.contactInfo || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded-lg bg-muted/20 border border-border">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium text-foreground truncate max-w-[180px]">{patient.email || 'N/A'}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/20 border border-border">
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-0.5">Medical History & Allergies:</span>
                      <p className="text-foreground">{patient.medicalHistory || 'No major systemic conditions logged.'}</p>
                      {patient.allergies && patient.allergies.length > 0 && (
                        <p className="text-rose-400 mt-1 font-semibold">⚠️ Allergies: {patient.allergies.join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB B: CLINICAL VISITS (SOAP NOTES) */}
              {leftTab === 'visits' && (
                <div className="space-y-3">
                  {visits.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No clinical encounters recorded yet.</p>
                  ) : (
                    visits.map((v) => (
                      <div key={v.id} className="p-3 rounded-xl bg-muted/30 border border-border space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground">{v.diagnosis || 'Clinical Consultation'}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{new Date(v.visitDate).toLocaleDateString()}</span>
                        </div>
                        {v.chiefComplaint && (
                          <p className="text-muted-foreground"><strong className="text-primary">Complaint:</strong> {v.chiefComplaint}</p>
                        )}
                        {v.treatmentRendered && (
                          <p className="text-muted-foreground"><strong className="text-primary">Treatment:</strong> {v.treatmentRendered}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB C: PRESCRIPTIONS (Rx) */}
              {leftTab === 'prescriptions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="font-bold text-foreground">Pharmacological Record</span>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => window.print()}>
                      <Printer className="w-3 h-3 mr-1" /> Print Slip
                    </Button>
                  </div>
                  {visits.flatMap(v => v.prescriptions || []).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No prescriptions issued.</p>
                  ) : (
                    visits.map(v => v.prescriptions?.map(rx => (
                      <div key={rx.id} className="p-2.5 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center justify-between font-bold text-foreground">
                          <span>💊 {rx.drugName}</span>
                          <Badge variant="outline" className="text-[9px]">{rx.dosage}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Frequency: {rx.frequency} &bull; Duration: {rx.duration}
                        </p>
                      </div>
                    )))
                  )}
                </div>
              )}

              {/* TAB D: BILLING & LEDGER */}
              {leftTab === 'billing' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">Invoices & Dues</span>
                    <Link href={`/billing`}>
                      <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-primary">
                        Open Billing Hub
                      </Button>
                    </Link>
                  </div>
                  {invoices.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No invoices recorded.</p>
                  ) : (
                    invoices.map(inv => (
                      <div key={inv.id} className="p-3 rounded-lg bg-muted/30 border border-border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold font-mono text-foreground">{inv.invoiceNumber}</span>
                          <Badge variant={inv.paymentStatus === 'PAID' ? 'secondary' : 'destructive'} className="text-[9px]">
                            {inv.paymentStatus}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Total: ₹{inv.grandTotal.toLocaleString('en-IN')}</span>
                          <span>Balance: <strong className="text-rose-400">₹{inv.balanceAmount.toLocaleString('en-IN')}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB E: WHATSAPP 1-CLICK ACTIONS */}
              {leftTab === 'whatsapp' && (
                <div className="space-y-2.5">
                  <span className="font-bold text-foreground block text-xs mb-1">Instant WhatsApp Communication</span>
                  <a href={generateWhatsAppLink('reminder')} target="_blank" rel="noreferrer" className="block">
                    <Button variant="outline" className="w-full justify-start text-xs h-9 bg-emerald-950/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/30">
                      <MessageSquare className="w-3.5 h-3.5 mr-2 text-emerald-400" /> Send Appointment Reminder
                    </Button>
                  </a>
                  <a href={generateWhatsAppLink('balance')} target="_blank" rel="noreferrer" className="block">
                    <Button variant="outline" className="w-full justify-start text-xs h-9 bg-amber-950/20 border-amber-500/30 text-amber-300 hover:bg-amber-900/30">
                      <DollarSign className="w-3.5 h-3.5 mr-2 text-amber-400" /> Send Outstanding Balance Notice
                    </Button>
                  </a>
                  <a href={generateWhatsAppLink('followup')} target="_blank" rel="noreferrer" className="block">
                    <Button variant="outline" className="w-full justify-start text-xs h-9 bg-cyan-950/20 border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/30">
                      <Stethoscope className="w-3.5 h-3.5 mr-2 text-cyan-400" /> Send Post-Op Comfort Follow-up
                    </Button>
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* PANE 2: CENTRAL OPERATORY STAGE (TOOTH CHART | 3D STL | CAD SPECS) (5 COLS)*/}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="bg-card border-border shadow-xs overflow-hidden">
            {/* Center Stage Mode Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/20">
              <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg">
                <Button
                  size="sm"
                  variant={centerMode === 'chart' ? 'secondary' : 'ghost'}
                  className="h-7 text-xs px-3 font-semibold"
                  onClick={() => setCenterMode('chart')}
                >
                  <Layers className="w-3.5 h-3.5 mr-1" /> 32-Tooth Chart
                </Button>
                <Button
                  size="sm"
                  variant={centerMode === 'stl' ? 'secondary' : 'ghost'}
                  className="h-7 text-xs px-3 font-semibold"
                  onClick={() => setCenterMode('stl')}
                >
                  <Box className="w-3.5 h-3.5 mr-1 text-cyan-400" /> 3D STL Mesh
                </Button>
                <Button
                  size="sm"
                  variant={centerMode === 'specs' ? 'secondary' : 'ghost'}
                  className="h-7 text-xs px-3 font-semibold"
                  onClick={() => setCenterMode('specs')}
                >
                  <Cpu className="w-3.5 h-3.5 mr-1 text-primary" /> CAD Specs
                </Button>
                {activeCase?.dicomUrl && (
                  <Button
                    size="sm"
                    variant={centerMode === 'dicom' ? 'secondary' : 'ghost'}
                    className="h-7 text-xs px-3 font-semibold text-purple-400"
                    onClick={() => setCenterMode('dicom')}
                  >
                    <Radio className="w-3.5 h-3.5 mr-1" /> CBCT Slices
                  </Button>
                )}
              </div>

              {centerMode === 'stl' && activeCase?.scanUrl && (
                <a href={getR2PublicUrl(activeCase.scanUrl)} download>
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-primary">
                    <UploadCloud className="w-3 h-3 mr-1" /> Download STL
                  </Button>
                </a>
              )}
            </div>

            {/* STAGE VIEWPORT */}
            <CardContent className="p-4 min-h-[480px] flex flex-col justify-center">
              {/* MODE A: 32-TOOTH ODONTOGRAM */}
              {centerMode === 'chart' && (
                <div className="w-full flex flex-col items-center">
                  <ToothChart
                    initialData={toothChart}
                    onChange={(updated) => {
                      setToothChart(updated);
                      if (patient?.id) savePatientToothChart(patient.id, updated);
                    }}
                  />
                </div>
              )}

              {/* MODE B: 3D WEBGL STL VIEWER */}
              {centerMode === 'stl' && (
                <div className="w-full h-[450px] relative rounded-xl overflow-hidden bg-neutral-950/80 border border-neutral-800">
                  {activeCase?.scanUrl ? (
                    <ThreeDViewer
                      stlUrl={getR2PublicUrl(activeCase.scanUrl)}
                      isReadOnly={false}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center space-y-3">
                      <Box className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">No 3D Scan Uploaded for this Case</p>
                        <p className="text-xs text-muted-foreground mt-1">Upload an IOS STL impression file to activate interactive 3D inspection.</p>
                      </div>
                      <Link href={`/patients/${patient.id}/capture`}>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Camera className="w-3.5 h-3.5 mr-1.5 text-primary" /> Capture via Hardware Bridge
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* MODE C: EXOCAD CAD SPECS & VITA SHADE CANVAS */}
              {centerMode === 'specs' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Occlusal Clearance</span>
                      <span className="text-sm font-bold text-foreground">{parsedDesignParams?.occlusalClearance || 'Medium (1.5mm)'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Contact Design</span>
                      <span className="text-sm font-bold text-foreground">{parsedDesignParams?.contactDesign || 'Normal'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Connector Design</span>
                      <span className="text-sm font-bold text-foreground">{parsedDesignParams?.connectorDesign || 'Anatomical'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Pontic Geometry</span>
                      <span className="text-sm font-bold text-foreground">{parsedDesignParams?.ponticDesign || 'Ovate'}</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">Prescribed Material & Shade</span>
                      <Badge className="bg-primary/20 text-primary border-primary/30">
                        {activeCase?.shade || 'A2'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      Material: <strong className="text-foreground">{activeCase?.material || 'Monolithic Zirconia HT'}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* MODE D: CBCT DICOM MPR SLICES */}
              {centerMode === 'dicom' && activeCase?.dicomUrl && (
                <div className="w-full h-[450px] rounded-xl overflow-hidden border border-border">
                  <DicomMprViewer />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* PANE 3: DIGITAL LAB COLLABORATION & TELEMETRY (3 COLS)                  */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-card border-border shadow-xs flex flex-col h-[560px]">
            <CardHeader className="p-3.5 pb-2 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
                  <MessageSquare className="w-4 h-4 text-cyan-400" /> Lab Order Chat
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  {activeCase ? `Direct line for Case #${activeCase.id.slice(-6).toUpperCase()}` : 'Select a case'}
                </CardDescription>
              </div>
              <Badge variant={isChatUnlocked ? 'secondary' : 'outline'} className="text-[10px]">
                {isChatUnlocked ? 'Live' : 'Locked'}
              </Badge>
            </CardHeader>

            {/* CHAT BODY */}
            <CardContent className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
              {!activeCase ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                  <Box className="w-8 h-8 opacity-30 mb-2" />
                  <p>No active case selected.</p>
                </div>
              ) : !isChatUnlocked ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4 space-y-2">
                  <Lock className="w-8 h-8 text-amber-500/60 mb-1" />
                  <p className="font-semibold text-foreground">Communication Locked</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Direct order chat automatically unlocks once the laboratory accepts this case into production.
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                  <Sparkles className="w-8 h-8 text-primary opacity-40 mb-2" />
                  <p>Order room active. Send your first message or CAD instruction to the technician.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.senderId === (currentUser?.id || 'u1');
                  return (
                    <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                        isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted/60 text-foreground border border-border rounded-bl-none'
                      }`}>
                        {m.content}
                      </div>
                      <span className="text-[9px] text-muted-foreground font-mono mt-0.5 px-1">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>

            {/* CHAT INPUT */}
            <CardFooter className="p-2.5 border-t border-border bg-muted/10">
              <form onSubmit={handleSendMessage} className="flex items-center gap-1.5 w-full">
                <Input
                  disabled={!isChatUnlocked || isSending}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={isChatUnlocked ? 'Message technician...' : 'Chat locked'}
                  className="h-8 text-xs bg-background"
                />
                <Button disabled={!isChatUnlocked || isSending || !newMessage.trim()} size="icon" className="h-8 w-8 shrink-0 bg-primary text-primary-foreground">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </CardFooter>
          </Card>

          {/* CAD/CAM Design Soft-Copy Card */}
          {activeCase && (
            <Card className="bg-card border-border shadow-xs p-3.5 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" /> CAD Soft-Copy Archive
                </span>
                {designFileUrl && (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px]">
                    Archived
                  </Badge>
                )}
              </div>

              {designFileUrl ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border">
                  <span className="text-muted-foreground truncate max-w-[140px] font-mono text-[10px]">
                    {activeCase.designUrl}
                  </span>
                  <a href={designFileUrl} download target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-primary">
                      Download
                    </Button>
                  </a>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">Permanent remake warranty file not yet uploaded.</p>
                  <label className="block cursor-pointer">
                    <div className="flex items-center justify-center w-full h-7 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-xs font-medium transition-colors">
                      <UploadCloud className="w-3 h-3 mr-1" />
                      {isUploadingDesign ? 'Uploading...' : 'Archive Milled Mesh'}
                    </div>
                    <input type="file" className="hidden" accept=".stl,.ply,.zip,.exocad" onChange={handleDesignUpload} disabled={isUploadingDesign} />
                  </label>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODALS (PATIENT 3D LINK & TRY-IN REQUEST)                              */}
      {/* ========================================================================= */}
      {/* Modal A: Patient 3D Link */}
      <Dialog open={showPatientLinkModal} onOpenChange={setShowPatientLinkModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Share 3D Model with Patient</DialogTitle>
            <DialogDescription>
              A tokenized, HIPAA-isolated link allowing the patient to view and rotate their custom restoration on their phone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              readOnly
              value={typeof window !== 'undefined' ? `${window.location.origin}/preview/case-${activeCase?.id || 'demo'}` : ''}
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <Button
              className="w-full text-xs font-semibold"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  navigator.clipboard.writeText(`${window.location.origin}/preview/case-${activeCase?.id || 'demo'}`);
                  toast.success('Patient preview link copied to clipboard!');
                  setShowPatientLinkModal(false);
                }
              }}
            >
              Copy Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal B: Trial Try-in Request */}
      <Dialog open={showTryInModal} onOpenChange={setShowTryInModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Request Intermediate Trial Try-In</DialogTitle>
            <DialogDescription>
              Request a metal coping, PMMA prototype, or bisque-bake trial before final glazing and sintering.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Specify try-in instructions (e.g. Verify interproximal contact and margin fit on #14 before final shading)..."
              value={tryInNotes}
              onChange={(e) => setTryInNotes(e.target.value)}
              className="text-xs"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              className="w-full text-xs font-semibold"
              onClick={() => {
                toast.success('Trial Try-In request sent to dental laboratory!');
                setShowTryInModal(false);
                setTryInNotes('');
              }}
            >
              Submit Try-In Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
