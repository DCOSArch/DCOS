'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Cpu, 
  Layers, 
  Sparkles, 
  Box, 
  Download, 
  ExternalLink, 
  Printer, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  FileCode, 
  Maximize2, 
  Minimize2, 
  RotateCw, 
  Eye, 
  ShieldCheck, 
  Check, 
  Copy,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Case, CaseStatus, User } from '@/types';
import { LabProductionStepper } from '@/components/lab/LabProductionStepper';
import { LabQCChecklist } from '@/components/lab/LabQCChecklist';
import { LabWarrantyCard } from '@/components/lab/LabWarrantyCard';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { formatDate, formatTime } from '@/lib/datetime';

const ThreeDViewer = dynamic(() => import('@/components/ThreeDViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 text-xs">
      Loading CAD/CAM 3D Viewport...
    </div>
  ),
});

interface LabWorkstationStudioProps {
  caseData: Case;
  currentUser?: User | null;
  dentistName?: string;
  dentistPhone?: string;
  initialTimeline?: any[];
  initialMessages?: any[];
}

// Helper to extract JSON design parameters if present
interface ParsedDesignParams {
  cleanNote: string;
  occlusalClearance?: string;
  contactDesign?: string;
  connectorDesign?: string;
  ponticDesign?: string;
  toothConfigs?: Record<string, string>;
  customShade?: { cervical?: string; body?: string; incisal?: string; enabled?: boolean };
  characterizations?: string[];
}

function parseDoctorInstructions(rawText?: string): ParsedDesignParams {
  if (!rawText) return { cleanNote: 'Standard clinical preparation.' };

  try {
    const jsonMatch = rawText.match(/\[Design Parameters\]:\s*(\{[\s\S]*\})/) || rawText.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      const cleanNote = rawText.replace(jsonMatch[0], '').trim() || 'Custom CAD design parameters provided.';
      return {
        cleanNote,
        occlusalClearance: parsed.occlusalClearance,
        contactDesign: parsed.contactDesign,
        connectorDesign: parsed.connectorDesign,
        ponticDesign: parsed.ponticDesign,
        toothConfigs: parsed.toothConfigs,
        customShade: parsed.customShade,
        characterizations: parsed.characterizations,
      };
    }
  } catch (e) {
    // fallback
  }

  return { cleanNote: rawText };
}

export function LabWorkstationStudio({
  caseData,
  currentUser,
  dentistName = 'Dr. Aryan Sharma',
  dentistPhone = '+91 98765 43210',
  initialTimeline = [],
  initialMessages = [],
}: LabWorkstationStudioProps) {
  const [currentStatus, setCurrentStatus] = useState<CaseStatus>(caseData.status);
  const [trackingId, setTrackingId] = useState(caseData.deliveryTrackingId || '');
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [activeViewportMode, setActiveViewportMode] = useState<'ANATOMY' | 'OCCLUSION_HEATMAP' | 'WIREFRAME'>('ANATOMY');
  const [activeRightTab, setActiveRightTab] = useState<'QC' | 'WARRANTY' | 'CHAT' | 'LOGISTICS'>('QC');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const supabase = createClient();
  const parsedParams = parseDoctorInstructions(caseData.instructions);

  const handleAdvanceStage = async (nextStatus: CaseStatus) => {
    setIsUpdatingStatus(true);
    setCurrentStatus(nextStatus);
    try {
      await supabase.from('cases').update({ status: nextStatus }).eq('id', caseData.id);
      toast.success(`Stage updated: ${nextStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update stage');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveTracking = async () => {
    if (!trackingId.trim()) return;
    try {
      await supabase.from('cases').update({ 
        delivery_tracking_id: trackingId,
        status: 'DISPATCHED' 
      }).eq('id', caseData.id);
      setCurrentStatus('DISPATCHED');
      toast.success('Waybill saved & marked Dispatched');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save tracking ID');
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: Date.now().toString(),
      senderId: currentUser?.id || 'lab-tech-1',
      content: newMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage('');
    toast.success('Message sent to doctor');
  };

  const selectedTeeth = caseData.selectedTeeth || [15, 17, 18, 31, 32, 41, 42, 43];

  const stages: { key: CaseStatus; label: string; step: number }[] = [
    { key: 'PENDING', label: 'Intake', step: 1 },
    { key: 'IN_PROGRESS', label: 'CAD/CAM', step: 2 },
    { key: 'QUALITY_CHECK', label: 'QC Fit', step: 3 },
    { key: 'DISPATCHED', label: 'Transit', step: 4 },
    { key: 'DELIVERED', label: 'Delivered', step: 5 },
  ];

  const currentStepIdx = stages.findIndex(s => s.key === currentStatus);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-[1600px] mx-auto w-full p-3 md:p-5 gap-3 overflow-hidden text-foreground">
      {/* ========================================================================= */}
      {/* 1. COMPACT MASTER CAD/CAM TOP BAR                                         */}
      {/* ========================================================================= */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-card border border-border/80 shadow-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-muted">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <div className="flex items-center gap-2.5 flex-wrap min-w-0">
            <span className="font-mono font-bold text-xs text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-lg">
              #{caseData.id.slice(-8).toUpperCase()}
            </span>
            <h1 className="text-base font-extrabold text-foreground truncate">
              {caseData.patientName || 'Case Workspace'}
            </h1>
            <Badge variant="outline" className="text-[10px] font-bold border-border/70 text-muted-foreground uppercase">
              {caseData.urgency || 'NORMAL'}
            </Badge>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span>Dr. <strong className="text-foreground">{dentistName}</strong></span>
              <span className="text-border">•</span>
              <span>{caseData.requestedTreatment}</span>
              <span className="text-border">•</span>
              <span>Due: <strong className="text-foreground">{caseData.dueDate ? formatDate(caseData.dueDate) : '7 Days'}</strong></span>
            </div>
          </div>
        </div>

        {/* Integrated Clean Stage Stepper Pills */}
        <div className="hidden xl:flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/50">
          {stages.map((stage, idx) => {
            const isPassed = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => handleAdvanceStage(stage.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground shadow-xs font-bold'
                    : isPassed
                    ? 'text-emerald-400 hover:bg-emerald-950/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="text-[10px] opacity-70 font-mono">{stage.step}.</span>
                <span>{stage.label}</span>
                {isPassed && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5">
          <a
            href={`https://wa.me/${dentistPhone.replace(/[^0-9]/g, '')}?text=Hello%20Dr.%20${encodeURIComponent(dentistName)},%20regarding%20Case%20${caseData.id.slice(-6).toUpperCase()}:`}
            target="_blank"
            rel="noreferrer"
          >
            <Button size="sm" variant="outline" className="h-8 text-xs rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/20 px-2.5 font-bold">
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> WhatsApp
            </Button>
          </a>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs rounded-xl px-2.5 font-semibold"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5 mr-1" /> Slip
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-3 font-bold shadow-xs"
            onClick={() => toast.success('CAD ZIP Package downloaded')}
          >
            <Download className="w-3.5 h-3.5 mr-1" /> CAD ZIP
          </Button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. 3-PANE BALANCED STUDIO CANVAS (MATCHING VIEWPORT HEIGHT)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        
        {/* LEFT PANE: CAD SPECIFICATIONS INSPECTOR (3.5 cols) */}
        <div className="lg:col-span-3 h-full flex flex-col rounded-2xl bg-card border border-border/80 shadow-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between bg-muted/20 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-primary" />
              CAD Specifications
            </span>
            <Badge variant="outline" className="text-[9px] font-mono border-primary/40 text-primary">
              .constructionInfo
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs divide-y divide-border/50">
            {/* Restoration & Teeth */}
            <div className="space-y-2.5 pb-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Teeth (FDI)</span>
                <div className="flex gap-1 flex-wrap justify-end max-w-[180px]">
                  {selectedTeeth.map(t => (
                    <span key={t} className="bg-primary/10 border border-primary/30 text-primary font-mono font-bold text-[11px] px-1.5 py-0.5 rounded-md">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Material</span>
                <span className="font-bold text-foreground">{caseData.material || 'Titanium Abutment'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Target Shade</span>
                <Badge variant="outline" className="text-xs font-bold border-amber-500/40 text-amber-400 bg-amber-950/20 px-2 py-0.5">
                  {caseData.shade || 'D4'}
                </Badge>
              </div>
            </div>

            {/* Exocad Milling Parameters Grid */}
            <div className="pt-3 space-y-2">
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Exocad Geometry Matrix</span>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[9px] text-muted-foreground block font-bold uppercase">Cement Gap</span>
                  <p className="font-mono font-bold text-primary text-xs mt-0.5">30 μm</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[9px] text-muted-foreground block font-bold uppercase">Min Thickness</span>
                  <p className="font-mono font-bold text-foreground text-xs mt-0.5">0.8 mm</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[9px] text-muted-foreground block font-bold uppercase">Margin Offset</span>
                  <p className="font-mono font-bold text-foreground text-xs mt-0.5">40 μm</p>
                </div>
                <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                  <span className="text-[9px] text-muted-foreground block font-bold uppercase">Antagonist</span>
                  <p className="font-mono font-bold text-emerald-400 text-xs mt-0.5">1.6 mm</p>
                </div>
              </div>
            </div>

            {/* Morphology & Shade Details */}
            {(parsedParams.occlusalClearance || parsedParams.customShade || parsedParams.characterizations) && (
              <div className="pt-3 space-y-2">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">Morphology & Characterization</span>
                
                <div className="grid grid-cols-2 gap-1.5">
                  {parsedParams.occlusalClearance && (
                    <div className="p-1.5 rounded-lg bg-muted/20 border border-border/50">
                      <span className="text-[8px] text-muted-foreground block uppercase font-semibold">Occlusion</span>
                      <strong className="text-foreground text-[11px]">{parsedParams.occlusalClearance}</strong>
                    </div>
                  )}
                  {parsedParams.connectorDesign && (
                    <div className="p-1.5 rounded-lg bg-muted/20 border border-border/50">
                      <span className="text-[8px] text-muted-foreground block uppercase font-semibold">Connector</span>
                      <strong className="text-foreground text-[11px]">{parsedParams.connectorDesign}</strong>
                    </div>
                  )}
                  {parsedParams.ponticDesign && (
                    <div className="p-1.5 rounded-lg bg-muted/20 border border-border/50">
                      <span className="text-[8px] text-muted-foreground block uppercase font-semibold">Pontic</span>
                      <strong className="text-foreground text-[11px]">{parsedParams.ponticDesign}</strong>
                    </div>
                  )}
                </div>

                {/* 3-Layer Shade Recipe */}
                {parsedParams.customShade && (
                  <div className="p-2 rounded-xl bg-amber-950/15 border border-amber-500/25 grid grid-cols-3 gap-1 text-center">
                    <div>
                      <span className="text-[8px] text-amber-400 block font-mono">Cervical</span>
                      <strong className="text-amber-300 text-xs font-bold">{parsedParams.customShade.cervical || 'A2'}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] text-amber-400 block font-mono">Body</span>
                      <strong className="text-amber-300 text-xs font-bold">{parsedParams.customShade.body || 'B2'}</strong>
                    </div>
                    <div>
                      <span className="text-[8px] text-amber-400 block font-mono">Incisal</span>
                      <strong className="text-amber-300 text-xs font-bold">{parsedParams.customShade.incisal || 'D4'}</strong>
                    </div>
                  </div>
                )}

                {/* Characterizations */}
                {parsedParams.characterizations && parsedParams.characterizations.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {parsedParams.characterizations.map((c, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded-md bg-purple-950/30 border border-purple-500/30 text-purple-300 text-[10px]">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Doctor Note */}
            <div className="pt-3 space-y-1.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Doctor Preparation Note</span>
              <p className="text-foreground bg-muted/20 p-2.5 rounded-xl border border-border/50 leading-relaxed text-[11px]">
                {parsedParams.cleanNote}
              </p>
            </div>
          </div>
        </div>

        {/* CENTER HERO PANE: EXPANSIVE 3D CAD/CAM VIEWPORT (5.5 cols) */}
        <div className="lg:col-span-5 h-full flex flex-col rounded-2xl bg-slate-950 border border-slate-800/90 shadow-xl overflow-hidden relative">
          
          {/* Floating Top Controls Header */}
          <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
            {/* Viewport Telemetry Badge */}
            <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-white flex items-center gap-2 text-xs shadow-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-[11px] tracking-wide">WebGL CAD Viewport</span>
              <span className="text-slate-500 font-mono text-[10px]">| 60 FPS</span>
            </div>

            {/* Shader Switcher Buttons */}
            <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
              <button
                type="button"
                onClick={() => setActiveViewportMode('ANATOMY')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activeViewportMode === 'ANATOMY' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Anatomy
              </button>
              <button
                type="button"
                onClick={() => setActiveViewportMode('OCCLUSION_HEATMAP')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activeViewportMode === 'OCCLUSION_HEATMAP' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Heatmap
              </button>
              <button
                type="button"
                onClick={() => setActiveViewportMode('WIREFRAME')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  activeViewportMode === 'WIREFRAME' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Wireframe
              </button>
            </div>
          </div>

          {/* Full-Bleed 3D Canvas */}
          <div className="flex-1 w-full h-full relative">
            <ThreeDViewer
              stlUrl={caseData.scanUrl || ''}
              selectedTeeth={selectedTeeth}
              material={caseData.material || 'Titanium Abutment'}
              shade={caseData.shade || 'D4'}
              activeViewportMode={activeViewportMode}
              isReadOnly={false}
            />

            {/* Occlusal Clearance Legend Overlay */}
            {activeViewportMode === 'OCCLUSION_HEATMAP' && (
              <div className="absolute bottom-3 left-3 z-10 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[10px] space-y-1 text-slate-200 shadow-lg">
                <span className="font-bold uppercase tracking-wider block text-slate-400">Occlusal Clearance</span>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>&gt; 1.5 mm (Safe)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>1.0 - 1.5 mm (Tight)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <span>&lt; 1.0 mm (High Risk)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: UNIFIED WORKSTATION UTILITY DOCK (3.5 cols) */}
        <div className="lg:col-span-4 h-full flex flex-col rounded-2xl bg-card border border-border/80 shadow-xs overflow-hidden">
          
          {/* Segmented Utility Switcher Tabs */}
          <div className="p-2 border-b border-border/70 bg-muted/20 shrink-0">
            <div className="grid grid-cols-4 gap-1 bg-muted/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveRightTab('QC')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                  activeRightTab === 'QC' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                QC Fit
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab('WARRANTY')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                  activeRightTab === 'WARRANTY' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Warranty
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab('CHAT')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center relative ${
                  activeRightTab === 'CHAT' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Chat
                {messages.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary absolute top-1 right-2" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab('LOGISTICS')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                  activeRightTab === 'LOGISTICS' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Transit
              </button>
            </div>
          </div>

          {/* Tab Content Container (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeRightTab === 'QC' && (
              <LabQCChecklist
                caseId={caseData.id}
                technicianName={currentUser?.name || 'Master Lab Ceramist'}
                onQCPassed={() => handleAdvanceStage('QUALITY_CHECK')}
              />
            )}

            {activeRightTab === 'WARRANTY' && (
              <LabWarrantyCard
                caseId={caseData.id}
                patientName={caseData.patientName || 'Patient'}
                doctorName={dentistName}
                material={caseData.material || 'Titanium Custom Abutment'}
                shade={caseData.shade || 'D4'}
                selectedTeeth={selectedTeeth}
              />
            )}

            {activeRightTab === 'CHAT' && (
              <div className="flex flex-col h-full space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground">Direct Operatory Channel</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Dr. {dentistName}</span>
                </div>

                <div className="flex-1 min-h-[220px] max-h-[360px] overflow-y-auto space-y-2 pr-1">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-1">
                      <MessageSquare className="w-6 h-6 text-muted-foreground/40 mb-1" />
                      <p className="text-xs font-medium">No messages yet</p>
                      <p className="text-[11px] text-muted-foreground/70">Communicate directly with doctor regarding shade or margins.</p>
                    </div>
                  ) : (
                    messages.map((m: any) => (
                      <div
                        key={m.id}
                        className={`p-2.5 rounded-xl text-xs ${
                          m.senderId === currentUser?.id || m.senderId?.includes('lab')
                            ? 'bg-primary/15 text-primary ml-4 border border-primary/25'
                            : 'bg-muted text-foreground mr-4 border border-border'
                        }`}
                      >
                        <p className="leading-tight">{m.content}</p>
                        <span className="text-[9px] text-muted-foreground mt-1 block text-right font-mono">
                          {formatTime(m.timestamp, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-border mt-auto">
                  <Input
                    placeholder="Message doctor..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="text-xs h-9 rounded-xl"
                  />
                  <Button size="sm" onClick={handleSendMessage} className="h-9 px-3 text-xs font-bold rounded-xl">
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {activeRightTab === 'LOGISTICS' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground block">
                    Courier Dispatch & Waybill
                  </span>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Tracking Number / Carrier Waybill</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. BLUEDART-984214"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        className="text-xs h-9 font-mono rounded-xl"
                      />
                      <Button size="sm" onClick={handleSaveTracking} className="h-9 px-3 text-xs font-bold rounded-xl shrink-0">
                        <Truck className="w-3.5 h-3.5 mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-2">
                  <span className="text-xs font-bold text-foreground block">Dispatch Address</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Apex Clinical Center • Dr. {dentistName}<br />
                    Indiranagar 100ft Rd, Bengaluru 560038
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
