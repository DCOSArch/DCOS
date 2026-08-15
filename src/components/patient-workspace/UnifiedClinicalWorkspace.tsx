'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  FeatureKey,
  SubscriptionTier,
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
  Plus,
  Camera,
  DollarSign,
  MessageSquare,
  Sparkles,
  Printer,
  Box,
  Send,
  Lock,
  Cpu,
  CheckCircle2,
  UploadCloud,
  RefreshCw,
  Share2,
  Shield,
  Radio,
  Zap,
} from 'lucide-react';
import { FeatureGate } from '@/components/subscription/FeatureGate';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { evaluateCaseQuota, DEFAULT_STARTER_SUBSCRIPTION } from '@/lib/subscriptions';

// Dynamic import for WebGL ThreeDViewer (client-side only)
const ThreeDViewer = dynamic(() => import('@/components/ThreeDViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[480px] flex flex-col items-center justify-center text-muted-foreground gap-3 bg-neutral-950/60 rounded-2xl border border-border">
      <div className="w-10 h-10 rounded-full border-2 border-border border-t-primary animate-spin" />
      <p className="text-xs font-mono text-muted-foreground">Initializing WebGL 3D Engine...</p>
    </div>
  ),
});

// Dynamic import for DICOM MPR Viewer
const DicomMprViewer = dynamic(() => import('@/components/viewer/DicomMprViewer').then(m => m.DicomMprViewer), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[480px] flex flex-col items-center justify-center text-muted-foreground gap-3 bg-neutral-950/60 rounded-2xl border border-border">
      <div className="w-10 h-10 rounded-full border-2 border-border border-t-purple-500 animate-spin" />
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
  { status: 'COMPLETED', label: 'Completed', desc: 'Fitted & finalized' },
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

  // Main Top-Level Tab State
  const [activeTab, setActiveTab] = useState<string>(() => {
    return initialActiveCaseId ? 'lab-cases' : 'overview';
  });

  // Patient EHR State
  const [toothChart, setToothChart] = useState<ToothChartData>({});
  const [visits, setVisits] = useState<ClinicalVisit[]>([]);
  const [invoices, setInvoices] = useState<ClinicalInvoice[]>([]);

  // Multi-Case State
  const [cases, setCases] = useState<Case[]>(initialCases);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(() => {
    if (initialActiveCaseId && initialCases.some(c => c.id === initialActiveCaseId)) {
      return initialActiveCaseId;
    }
    return initialCases.length > 0 ? initialCases[0].id : null;
  });

  const activeCase = useMemo(() => {
    return cases.find(c => c.id === selectedCaseId) || cases[0] || null;
  }, [cases, selectedCaseId]);

  // Lab View Submode (3D STL vs CAD Specs vs DICOM)
  const [labViewMode, setLabViewMode] = useState<'3d' | 'specs' | 'dicom'>('3d');

  // Subscription & Tier State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeatureKey, setUpgradeFeatureKey] = useState<FeatureKey | undefined>(undefined);
  const currentTier: SubscriptionTier = currentUser?.tier || 'STARTER';
  const quota = useMemo(() => evaluateCaseQuota(DEFAULT_STARTER_SUBSCRIPTION), []);

  // Modals & Chat State
  const [showPatientLinkModal, setShowPatientLinkModal] = useState(false);
  const [showTryInModal, setShowTryInModal] = useState(false);
  const [tryInNotes, setTryInNotes] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [isUploadingDesign, setIsUploadingDesign] = useState(false);

  // Initial load
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

  // Design Parameters Parser
  const parsedDesignParams = useMemo(() => {
    if (!activeCase?.instructions) return null;
    const marker = '[Design Parameters]:';
    const index = activeCase.instructions.indexOf(marker);
    if (index === -1) return null;
    try {
      const jsonStr = activeCase.instructions.substring(index + marker.length).trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  }, [activeCase?.instructions]);

  // Chat Unlock Rule
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

  // Realtime Chat Room Subscription
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

  // Handlers
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
      toast.success('Case submitted to lab for production!');
    } catch (err: any) {
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
      text = `Dear ${patient.name}, this is a friendly reminder from DentalConnect OS regarding your upcoming visit. Please reply to confirm.`;
    } else if (type === 'balance') {
      text = `Dear ${patient.name}, your treatment balance is ₹${totalOutstanding.toLocaleString('en-IN')}. Clear it via UPI: upi://pay?pa=clinic@okaxis&pn=DentalClinic&am=${totalOutstanding}`;
    } else {
      text = `Dear ${patient.name}, following up on your recent dental appointment. How is your comfort today? Reach out if you need anything.`;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full animate-fade-in text-foreground">
      {/* ========================================================================= */}
      {/* 1. MASTER PATIENT HEADER                                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-border">
        <div className="flex items-start gap-3">
          <Link href="/patients">
            <Button variant="ghost" size="icon" className="hover:bg-muted mt-1">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {patient.name}
              </h1>
              <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
                {patient.id.slice(-8).toUpperCase()}
              </Badge>
              {patient.medicalAlerts && patient.medicalAlerts.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {patient.medicalAlerts.join(', ')}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2.5 flex-wrap">
              <span>{patient.age ? `${patient.age} yrs` : 'Age N/A'}, {patient.gender || 'Unspecified'}</span>
              <span className="text-border">|</span>
              <span>{patient.phone || patient.contactInfo || 'No Phone'}</span>
              <span className="text-border">|</span>
              <span>Since {new Date(patient.createdAt).toLocaleDateString()}</span>
            </p>
            {/* Tenant org context — compact inline */}
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span>{currentUser?.organizationName || 'Main Practice Clinic'}</span>
              <Badge
                variant="outline"
                className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0 h-4 ${
                  currentTier === 'ENTERPRISE' ? 'border-purple-500/50 text-purple-400 bg-purple-950/20' :
                  currentTier === 'PRO_LAB' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20' :
                  'border-cyan-500/50 text-cyan-400 bg-cyan-950/20'
                }`}
              >
                {currentTier === 'ENTERPRISE' ? 'Enterprise' : currentTier === 'PRO_LAB' ? 'Pro Lab' : 'Starter'}
              </Badge>
              {!quota.isUnlimited && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {quota.used}/{quota.limit} cases
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Vertical action stack */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {currentTier === 'STARTER' && (
              <Button
                size="sm"
                variant="outline"
                className="h-9 text-xs rounded-full bg-primary/10 border-primary/40 text-primary hover:bg-primary/20 font-bold px-4"
                onClick={() => {
                  setUpgradeFeatureKey(undefined);
                  setShowUpgradeModal(true);
                }}
              >
                <Zap className="w-3.5 h-3.5 mr-1" /> Upgrade Plan
              </Button>
            )}
            <Link href={`/patients/${patient.id}/capture`}>
              <Button variant="outline" size="sm" className="h-9 text-xs rounded-full px-4">
                Scan
              </Button>
            </Link>
            <Link href={`/visits/new?patientId=${patient.id}`}>
              <Button size="sm" variant="secondary" className="h-9 text-xs rounded-full font-semibold px-4">
                New Visit
              </Button>
            </Link>
            <Link href="/?action=create">
              <Button size="sm" className="h-9 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs shadow-sm px-5">
                New Order
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MASTER SPACIOUS TABS NAVIGATION                                        */}
      {/* ========================================================================= */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val || 'overview')} className="w-full space-y-6">
        <TabsList className="bg-muted/60 border border-border p-1 rounded-xl inline-flex w-fit max-w-full overflow-x-auto gap-0.5">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-4 py-2 font-medium">
            Clinical Overview
          </TabsTrigger>
          {cases.length > 0 && (
            <TabsTrigger value="lab-cases" className="text-xs sm:text-sm px-4 py-2 font-medium">
              Lab Orders ({cases.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="visits" className="text-xs sm:text-sm px-4 py-2 font-medium">
            Visits ({visits.length})
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="text-xs sm:text-sm px-4 py-2 font-medium">
            Prescriptions
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs sm:text-sm px-4 py-2 font-medium">
            Invoices
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs sm:text-sm px-4 py-2 font-medium">
            WhatsApp
          </TabsTrigger>
        </TabsList>

        {/* ======================================================================= */}
        {/* TAB 1: CLINICAL OVERVIEW & EXPANSIVE 32-TOOTH ODONTOGRAM                */}
        {/* ======================================================================= */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top Row: Patient Vitals, Alerts & Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Patient Medical Alerts
                </CardDescription>
                <CardTitle className="text-base font-bold text-rose-400 mt-1">
                  {patient.allergies?.join(', ') || 'No known allergies'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                <span>{patient.medicalHistory || 'No systemic conditions'}</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Outstanding Balance
                </CardDescription>
                <CardTitle className={`text-2xl font-extrabold ${totalOutstanding > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                  ₹{totalOutstanding.toLocaleString('en-IN')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                <span>{invoices.filter((i) => i.paymentStatus !== 'PAID').length} pending invoices</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Active Lab Orders
                </CardDescription>
                <CardTitle className="text-2xl font-extrabold text-foreground">
                  {cases.length} Active
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                <span>{cases.filter((c) => c.status === 'IN_PROGRESS' || c.status === 'QUALITY_CHECK').length} in fabrication</span>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-xs">
              <CardHeader className="p-4 pb-2">
                <CardDescription className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Visits Recorded
                </CardDescription>
                <CardTitle className="text-2xl font-extrabold text-foreground">
                  {visits.length} Visits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                <span>Last: {visits.length > 0 ? new Date(visits[0].visitDate).toLocaleDateString() : 'None'}</span>
              </CardContent>
            </Card>
          </div>

          {/* Full-Width Hero 32-Tooth FDI Interactive Odontogram */}
          <div className="w-full">
            <ToothChart
              initialData={toothChart}
              onChange={(updated) => {
                setToothChart(updated);
                if (patient?.id) savePatientToothChart(patient.id, updated);
              }}
            />
          </div>
        </TabsContent>

        {/* ======================================================================= */}
        {/* TAB 2: DIGITAL LAB ORDERS & 3D CAD/CAM WORKSTATION                      */}
        {/* ======================================================================= */}
        <TabsContent value="lab-cases" className="space-y-6">
          {cases.length === 0 ? (
            <Card className="bg-card border-border text-center py-16">
              <CardContent className="space-y-3">
                <Box className="w-12 h-12 mx-auto text-muted-foreground opacity-30" />
                <h3 className="text-base font-bold text-foreground">No Lab Orders Linked to this Patient</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Create a structured digital prescription with prep scans and Exocad parameters to send to the lab.
                </p>
                <Link href="/?action=create">
                  <Button size="sm" className="bg-primary text-primary-foreground text-xs mt-2">
                    <Plus className="w-4 h-4 mr-1.5" /> Create First Lab Order
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              {/* Active Cases Switcher Bar */}
              <div className="flex items-center justify-between gap-3 p-3 px-4 rounded-xl bg-card border border-border overflow-x-auto shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    Active Cases:
                  </span>
                  <div className="flex items-center gap-2">
                    {cases.map((c) => {
                      const isSelected = c.id === activeCase?.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCaseId(c.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-muted text-foreground border-primary shadow-xs'
                              : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground hover:bg-muted/80'
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

                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-3"
                    onClick={() => setShowPatientLinkModal(true)}
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1.5 text-primary" /> Patient 3D Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs px-3"
                    onClick={() => setShowTryInModal(true)}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Request Try-In
                  </Button>
                </div>
              </div>

              {/* Obsidian Glass Production Rail */}
              {activeCase && (
                <div className="space-y-3">
                  {activeCase.status === 'DRAFT' && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 px-4 flex items-center justify-between text-xs text-amber-300">
                      <span><strong>Draft:</strong> Not yet submitted to lab.</span>
                      <Button size="sm" className="h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs px-4" onClick={handlePublishDraft}>
                        Publish
                      </Button>
                    </div>
                  )}

                  {/* Horizontal connected rail */}
                  <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-5 overflow-hidden">
                    {/* Background glass effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.03] via-transparent to-emerald-500/[0.03] pointer-events-none" />

                    <div className="relative flex items-center justify-between">
                      {PIPELINE_STEPS.map((step, idx) => {
                        const isPast = currentStatusIdx > idx;
                        const isCurrent = currentStatusIdx === idx;
                        const isFuture = !isPast && !isCurrent;
                        return (
                          <React.Fragment key={step.status}>
                            {/* Connecting line before node (skip first) */}
                            {idx > 0 && (
                              <div className="flex-1 h-px mx-1">
                                <div className={`h-full transition-all duration-500 ${
                                  isPast ? 'bg-emerald-500/60' : isCurrent ? 'bg-gradient-to-r from-emerald-500/60 to-border' : 'bg-border border-t border-dashed border-border'
                                }`} />
                              </div>
                            )}
                            {/* Stage node */}
                            <div className="flex flex-col items-center gap-1.5 min-w-0">
                              <div className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                                isCurrent
                                  ? 'w-10 h-10 bg-primary/15 border-2 border-primary shadow-[0_0_16px_rgba(var(--primary-rgb),0.25)]'
                                  : isPast
                                  ? 'w-7 h-7 bg-emerald-500/20 border border-emerald-500/50'
                                  : 'w-7 h-7 bg-muted/40 border border-border'
                              }`}>
                                {isPast ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                ) : isCurrent ? (
                                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                                ) : (
                                  <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                )}
                              </div>
                              <span className={`text-[10px] font-semibold leading-tight text-center max-w-[64px] ${
                                isCurrent ? 'text-foreground font-bold' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/50'
                              }`}>
                                {step.label}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] text-primary font-medium">{step.desc}</span>
                              )}
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Workstation: Left 3D Stage (8 Cols) + Right Order Chat (4 Cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 8 Cols: Full-Size 3D STL & CAD Specs Stage */}
                <div className="lg:col-span-8 space-y-4">
                  <Card className="bg-card border-border shadow-xs overflow-hidden">
                    <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/20">
                      <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg">
                        <Button
                          size="sm"
                          variant={labViewMode === '3d' ? 'secondary' : 'ghost'}
                          className="h-8 text-xs px-3.5 font-semibold"
                          onClick={() => setLabViewMode('3d')}
                        >
                          <Box className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> 3D STL Viewer
                        </Button>
                        <Button
                          size="sm"
                          variant={labViewMode === 'specs' ? 'secondary' : 'ghost'}
                          className="h-8 text-xs px-3.5 font-semibold"
                          onClick={() => setLabViewMode('specs')}
                        >
                          <Cpu className="w-3.5 h-3.5 mr-1.5 text-primary" /> CAD Specs & Shading
                        </Button>
                        {activeCase?.dicomUrl && (
                          <Button
                            size="sm"
                            variant={labViewMode === 'dicom' ? 'secondary' : 'ghost'}
                            className="h-8 text-xs px-3.5 font-semibold text-purple-400"
                            onClick={() => setLabViewMode('dicom')}
                          >
                            <Radio className="w-3.5 h-3.5 mr-1.5" /> CBCT Slices
                          </Button>
                        )}
                      </div>

                      {labViewMode === '3d' && activeCase?.scanUrl && (
                        <a href={getR2PublicUrl(activeCase.scanUrl)} download>
                          <Button size="sm" variant="outline" className="h-8 text-xs px-3 text-primary">
                            <UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Download STL
                          </Button>
                        </a>
                      )}
                    </div>

                    <CardContent className="p-4 sm:p-6 min-h-[500px] flex flex-col justify-center">
                      {labViewMode === '3d' && (
                        <div className="w-full h-[480px] relative rounded-2xl overflow-hidden bg-neutral-950/90 border border-neutral-800 shadow-inner">
                          {activeCase?.scanUrl ? (
                            <ThreeDViewer
                              stlUrl={getR2PublicUrl(activeCase.scanUrl)}
                              isReadOnly={false}
                            />
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-3">
                              <Box className="w-14 h-14 text-muted-foreground/30 animate-pulse" />
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

                      {labViewMode === 'specs' && (
                        <div className="space-y-5 text-xs">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Occlusal Clearance</span>
                              <span className="text-sm font-bold text-foreground mt-0.5 block">{parsedDesignParams?.occlusalClearance || 'Medium (1.5mm)'}</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Contact Design</span>
                              <span className="text-sm font-bold text-foreground mt-0.5 block">{parsedDesignParams?.contactDesign || 'Normal'}</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Connector Design</span>
                              <span className="text-sm font-bold text-foreground mt-0.5 block">{parsedDesignParams?.connectorDesign || 'Anatomical'}</span>
                            </div>
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground block">Pontic Geometry</span>
                              <span className="text-sm font-bold text-foreground mt-0.5 block">{parsedDesignParams?.ponticDesign || 'Ovate'}</span>
                            </div>
                          </div>

                          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-foreground text-sm">Prescribed Material & Shade</span>
                              <Badge className="bg-primary/20 text-primary border-primary/30 text-xs px-2.5 py-0.5">
                                Shade: {activeCase?.shade || 'A2'}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">
                              Restorative Material: <strong className="text-foreground">{activeCase?.material || 'Monolithic Zirconia HT'}</strong>
                            </p>
                          </div>
                        </div>
                      )}

                      {labViewMode === 'dicom' && activeCase?.dicomUrl && (
                        <FeatureGate feature="dicom_mpr" userTier={currentTier}>
                          <div className="w-full h-[480px] rounded-2xl overflow-hidden border border-border">
                            <DicomMprViewer />
                          </div>
                        </FeatureGate>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right 4 Cols: Live Lab Order Chat & Soft-Copy Archive */}
                <div className="lg:col-span-4 space-y-4">
                  <Card className="bg-card border-border shadow-xs flex flex-col h-[520px]">
                    <CardHeader className="p-3.5 pb-2 border-b border-border flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
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

                    {/* Chat Messages */}
                    <CardContent className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs">
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

                    {/* Chat Input */}
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

                  {/* CAD Soft-Copy Card */}
                  {activeCase && (
                    <FeatureGate feature="cad_bridge" userTier={currentTier} compact>
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
                    </FeatureGate>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ======================================================================= */}
        {/* TAB 3: CLINICAL ENCOUNTERS & SOAP VISITS                                */}
        {/* ======================================================================= */}
        <TabsContent value="visits" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Clinical Encounters & SOAP Notes</h3>
              <p className="text-xs text-muted-foreground">Chronological record of chairside examinations, diagnoses, and procedures.</p>
            </div>
            <Link href={`/visits/new?patientId=${patient.id}`}>
              <Button size="sm" className="bg-primary text-primary-foreground font-semibold text-xs">
                <Plus className="w-4 h-4 mr-1" /> New Clinical Visit
              </Button>
            </Link>
          </div>

          {visits.length === 0 ? (
            <Card className="bg-card border-border text-center py-12">
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">No visits recorded for this patient yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {visits.map((visit) => (
                <Card key={visit.id} className="bg-card border-border shadow-xs">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border">
                    <div>
                      <CardTitle className="text-sm font-bold text-foreground">
                        {visit.diagnosis || 'Clinical Consultation'}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        {new Date(visit.visitDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                      {visit.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs">
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
                      <span className="text-[10px] font-bold uppercase text-primary">Treatment Rendered:</span>
                      <p className="text-foreground mt-0.5 font-medium">{visit.treatmentRendered}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ======================================================================= */}
        {/* TAB 4: PRESCRIPTIONS (Rx)                                               */}
        {/* ======================================================================= */}
        <TabsContent value="prescriptions" className="space-y-4">
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Pharmacological Record
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Complete medication history prescribed at this practice.
                </CardDescription>
              </div>
              <Button size="sm" variant="outline" className="text-xs flex items-center gap-1.5" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5" /> Print Rx Slip
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {visits.flatMap((v) => v.prescriptions || []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No prescriptions issued yet.</p>
              ) : (
                visits.map((v) =>
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
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        Prescribed: {new Date(v.visitDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======================================================================= */}
        {/* TAB 5: INVOICES & FINANCIAL LEDGER                                      */}
        {/* ======================================================================= */}
        <TabsContent value="billing" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Invoices & Clinical Ledger</h3>
              <p className="text-xs text-muted-foreground">Comprehensive billing ledger with itemized treatment breakdown.</p>
            </div>
            <Link href="/billing">
              <Button size="sm" variant="outline" className="text-xs text-primary">
                Open Billing Hub
              </Button>
            </Link>
          </div>

          {invoices.length === 0 ? (
            <Card className="bg-card border-border text-center py-12">
              <CardContent className="space-y-2">
                <DollarSign className="w-10 h-10 mx-auto text-muted-foreground opacity-30" />
                <p className="text-xs text-muted-foreground">No invoices recorded for this patient.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => (
                <Card key={inv.id} className="bg-card border-border shadow-xs">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-border">
                    <div>
                      <CardTitle className="text-sm font-bold font-mono text-foreground">
                        {inv.invoiceNumber}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Issued: {new Date(inv.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={inv.paymentStatus === 'PAID' ? 'secondary' : 'destructive'} className="text-xs">
                      {inv.paymentStatus}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 flex justify-between items-center text-xs">
                    <div>
                      <p className="text-muted-foreground">Grand Total: <strong className="text-foreground">₹{inv.grandTotal.toLocaleString('en-IN')}</strong></p>
                      <p className="text-muted-foreground">Paid: ₹{(inv.paidAmount || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Balance Due</span>
                      <span className={`text-base font-extrabold ${inv.balanceAmount > 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                        ₹{inv.balanceAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ======================================================================= */}
        {/* TAB 6: WHATSAPP DIRECT ENGAGEMENT                                       */}
        {/* ======================================================================= */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card className="bg-card border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold text-foreground">
                WhatsApp Patient Automations
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pre-formatted, 1-click clinical communication templates sent to {patient.phone || patient.contactInfo || 'patient'}.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-foreground">Appointment Reminder</span>
                  <p className="text-muted-foreground mt-0.5">Sends scheduled visit date, chairside time, and clinic address.</p>
                </div>
                <a href={generateWhatsAppLink('reminder')} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline" className="text-xs bg-emerald-950/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/30">
                    Send Reminder
                  </Button>
                </a>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-foreground">Outstanding Balance Notice</span>
                  <p className="text-muted-foreground mt-0.5">Sends balance amount (₹{totalOutstanding.toLocaleString('en-IN')}) with UPI payment deep link.</p>
                </div>
                <a href={generateWhatsAppLink('balance')} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline" className="text-xs bg-amber-950/20 border-amber-500/30 text-amber-300 hover:bg-amber-900/30">
                    Send Balance Notice
                  </Button>
                </a>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-foreground">Post-Op Comfort Follow-up</span>
                  <p className="text-muted-foreground mt-0.5">Automated 48-hour post-procedure recovery check-in.</p>
                </div>
                <a href={generateWhatsAppLink('followup')} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline" className="text-xs bg-cyan-950/20 border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/30">
                    Send Follow-up
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ========================================================================= */}
      {/* 3. MODALS (PATIENT 3D LINK & TRY-IN REQUEST)                              */}
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

      {/* Modal C: Tier Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        featureKey={upgradeFeatureKey}
      />
    </div>
  );
}
