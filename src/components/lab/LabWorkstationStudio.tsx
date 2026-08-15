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
  const [activeViewportMode, setActiveViewportMode] = useState<'ANATOMY' | 'OCCLUSION_HEATMAP' | 'WIREFRAME' | 'MARGIN_LINE'>('ANATOMY');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const supabase = createClient();
  const parsedParams = parseDoctorInstructions(caseData.instructions);

  const handleAdvanceStage = async (nextStatus: CaseStatus) => {
    setIsUpdatingStatus(true);
    setCurrentStatus(nextStatus);
    try {
      await supabase.from('cases').update({ status: nextStatus }).eq('id', caseData.id);
      toast.success(`Production stage advanced to ${nextStatus.replace('_', ' ')}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update stage in database');
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
      toast.success(`Tracking ID updated & case marked Dispatched`);
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
    toast.success('Message sent to dentist operatory');
  };

  const selectedTeeth = caseData.selectedTeeth || [11, 12, 14, 15, 16, 21, 22];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto w-full animate-fade-in text-foreground">
      {/* ========================================================================= */}
      {/* 1. MASTER LAB WORKSTATION HEADER                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-muted">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono font-bold text-sm text-primary bg-primary/10 border border-primary/30 px-2 py-0.5 rounded-md">
                #{caseData.id.slice(-8).toUpperCase()}
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                {caseData.patientName || 'Clinical Case'}
              </h1>
              <Badge
                variant="outline"
                className={`text-xs font-bold uppercase ${
                  caseData.urgency === 'URGENT'
                    ? 'border-red-500/50 text-red-400 bg-red-950/20 animate-pulse'
                    : caseData.urgency === 'HIGH'
                    ? 'border-amber-500/50 text-amber-400 bg-amber-950/20'
                    : 'border-border text-muted-foreground'
                }`}
              >
                {caseData.urgency} Priority
              </Badge>
              <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                {currentStatus.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-2.5 flex-wrap">
              <span>Doctor: <strong className="text-foreground">{dentistName}</strong></span>
              <span className="text-border">|</span>
              <span>Treatment: <strong className="text-foreground">{caseData.requestedTreatment}</strong></span>
              <span className="text-border">|</span>
              <span>Due: <strong className="text-foreground">{caseData.dueDate ? new Date(caseData.dueDate).toLocaleDateString() : '7 Days'}</strong></span>
            </p>
          </div>
        </div>

        {/* Quick CAD Export & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://wa.me/${dentistPhone.replace(/[^0-9]/g, '')}?text=Hello%20Dr.%20${encodeURIComponent(dentistName)},%20regarding%20Case%20${caseData.id.slice(-6).toUpperCase()}%20for%20${encodeURIComponent(caseData.patientName || 'patient')}:`}
            target="_blank"
            rel="noreferrer"
          >
            <Button size="sm" variant="outline" className="h-9 text-xs rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-950/20 font-bold px-3">
              <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Doctor WhatsApp
            </Button>
          </a>
          <Button
            size="sm"
            variant="outline"
            className="h-9 text-xs rounded-xl font-semibold px-3"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Packing Slip
          </Button>
          <Button
            size="sm"
            className="h-9 text-xs rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-4 shadow-xs"
            onClick={() => {
              toast.success('Exocad .constructionInfo & STL package downloaded');
            }}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download CAD ZIP
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. 3-COLUMN HIGH-PRECISION PRODUCTION STUDIO                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
        {/* LEFT FLANK (Specs & Exocad Metadata, 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Restoration Card */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Restoration Specifications
            </span>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Teeth (FDI)</span>
                <div className="flex gap-1 flex-wrap justify-end max-w-[200px]">
                  {selectedTeeth.map(t => (
                    <Badge key={t} className="bg-primary/10 border-primary/30 text-primary font-mono font-bold text-xs px-2 py-0.5">
                      #{t}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Material</span>
                <span className="text-xs font-bold text-foreground">{caseData.material || 'Zirconia HT (Multi-Layer)'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Shade Match</span>
                <Badge variant="outline" className="text-xs font-bold border-amber-500/40 text-amber-400 bg-amber-950/20">
                  {caseData.shade || 'D4'}
                </Badge>
              </div>

              {caseData.implantBrand && (
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <span className="text-xs text-muted-foreground">Implant Brand</span>
                  <span className="text-xs font-bold text-foreground">{caseData.implantBrand}</span>
                </div>
              )}
            </div>
          </div>

          {/* Exocad CAD Parameters Card */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-primary" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                  Exocad / 3Shape Parameters
                </span>
              </div>
              <Badge variant="outline" className="text-[9px] font-mono border-primary/40 text-primary">
                .constructionInfo
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[9px] font-bold text-muted-foreground block uppercase">Cement Gap</span>
                <p className="font-mono font-bold text-primary text-xs mt-0.5">30 μm (0.03mm)</p>
              </div>
              <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[9px] font-bold text-muted-foreground block uppercase">Min Thickness</span>
                <p className="font-mono font-bold text-foreground text-xs mt-0.5">0.8 mm (Axial)</p>
              </div>
              <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[9px] font-bold text-muted-foreground block uppercase">Margin Offset</span>
                <p className="font-mono font-bold text-foreground text-xs mt-0.5">40 μm (Finish Line)</p>
              </div>
              <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                <span className="text-[9px] font-bold text-muted-foreground block uppercase">Antagonist Clear</span>
                <p className="font-mono font-bold text-emerald-400 text-xs mt-0.5">1.6 mm (Adequate)</p>
              </div>
            </div>
          </div>

          {/* Parsed CAD Design Specifications & Characterizations */}
          {(parsedParams.occlusalClearance || parsedParams.customShade || parsedParams.characterizations) && (
            <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                CAD Morphology & Shade Matrix
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {parsedParams.occlusalClearance && (
                  <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-[9px] text-muted-foreground block uppercase font-bold">Occlusion</span>
                    <span className="font-bold text-foreground">{parsedParams.occlusalClearance}</span>
                  </div>
                )}
                {parsedParams.connectorDesign && (
                  <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-[9px] text-muted-foreground block uppercase font-bold">Connector</span>
                    <span className="font-bold text-foreground">{parsedParams.connectorDesign}</span>
                  </div>
                )}
                {parsedParams.ponticDesign && (
                  <div className="p-2 rounded-xl bg-muted/30 border border-border/60">
                    <span className="text-[9px] text-muted-foreground block uppercase font-bold">Pontic</span>
                    <span className="font-bold text-foreground">{parsedParams.ponticDesign}</span>
                  </div>
                )}
              </div>

              {/* Custom 3-Layer Shade Gradient */}
              {parsedParams.customShade && (
                <div className="p-2.5 rounded-xl bg-muted/20 border border-border/60 space-y-1.5">
                  <span className="text-[9px] font-bold uppercase text-muted-foreground block">3-Layer Shade Recipe</span>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="p-1.5 rounded-lg bg-amber-950/20 border border-amber-500/30">
                      <span className="text-[8px] text-amber-400 block font-mono">Cervical</span>
                      <strong className="text-amber-300 font-bold">{parsedParams.customShade.cervical || 'A2'}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-950/20 border border-amber-500/30">
                      <span className="text-[8px] text-amber-400 block font-mono">Body</span>
                      <strong className="text-amber-300 font-bold">{parsedParams.customShade.body || 'B2'}</strong>
                    </div>
                    <div className="p-1.5 rounded-lg bg-amber-950/20 border border-amber-500/30">
                      <span className="text-[8px] text-amber-400 block font-mono">Incisal</span>
                      <strong className="text-amber-300 font-bold">{parsedParams.customShade.incisal || 'D4'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Characterizations */}
              {parsedParams.characterizations && parsedParams.characterizations.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase text-muted-foreground block">Characterizations</span>
                  <div className="flex flex-wrap gap-1">
                    {parsedParams.characterizations.map((c, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-purple-950/30 border border-purple-500/30 text-purple-300 text-[10px] font-medium">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Clinical Doctor Preparation Note */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Doctor Preparation Notes
            </span>
            <p className="text-xs text-foreground bg-muted/20 p-3 rounded-xl border border-border/60 leading-relaxed">
              {parsedParams.cleanNote}
            </p>
          </div>
        </div>

        {/* CENTER STAGE (Interactive 3D CAD/CAM Viewport, 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border-border bg-card text-card-foreground shadow-xs overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border gap-3 bg-muted/20">
              <div className="min-w-0">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <Cpu className="w-4 h-4 text-primary" />
                  CAD/CAM 3D Model Inspection
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                  Prep Scan & Crown Mesh Alignment
                </CardDescription>
              </div>

              {/* Viewport mode switcher */}
              <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveViewportMode('ANATOMY')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    activeViewportMode === 'ANATOMY' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Anatomy
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewportMode('OCCLUSION_HEATMAP')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    activeViewportMode === 'OCCLUSION_HEATMAP' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Heatmap
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewportMode('WIREFRAME')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    activeViewportMode === 'WIREFRAME' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Wireframe
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-3">
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 h-[380px]">
                <ThreeDViewer
                  stlUrl={caseData.scanUrl || ''}
                  isReadOnly={false}
                />

                {/* Occlusal Heatmap Legend Overlay */}
                {activeViewportMode === 'OCCLUSION_HEATMAP' && (
                  <div className="absolute bottom-3 left-3 z-10 p-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[10px] space-y-1 text-slate-200">
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
            </CardContent>
          </Card>

          {/* Realtime Doctor-Lab Chat */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Direct Case Chat with {dentistName}
            </span>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">No messages yet. Direct channel active.</p>
              ) : (
                messages.map((m: any) => (
                  <div
                    key={m.id}
                    className={`p-2.5 rounded-xl text-xs ${
                      m.senderId === currentUser?.id || m.senderId?.includes('lab')
                        ? 'bg-primary/15 text-primary ml-6 border border-primary/25'
                        : 'bg-muted text-foreground mr-6 border border-border'
                    }`}
                  >
                    <p className="leading-tight">{m.content}</p>
                    <span className="text-[9px] text-muted-foreground mt-1 block text-right font-mono">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-1 border-t border-border">
              <Input
                placeholder="Message doctor regarding margin, shade, or try-in..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="text-xs h-9"
              />
              <Button size="sm" onClick={handleSendMessage} className="h-9 px-3 text-xs font-bold">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT FLANK (Production Stepper, QC & Warranty, 4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Production Stepper */}
          <LabProductionStepper
            currentStatus={currentStatus}
            onAdvanceStage={handleAdvanceStage}
            isReadOnly={false}
          />

          {/* Microscope QC Checklist */}
          <LabQCChecklist
            caseId={caseData.id}
            technicianName={currentUser?.name || 'Master Lab Ceramist'}
            onQCPassed={() => handleAdvanceStage('QUALITY_CHECK')}
          />

          {/* Authenticity Warranty Card */}
          <LabWarrantyCard
            caseId={caseData.id}
            patientName={caseData.patientName || 'Patient'}
            doctorName={dentistName}
            material={caseData.material || 'Multi-Layered Translucent Zirconia'}
            shade={caseData.shade || 'VITA Classical A2'}
            selectedTeeth={selectedTeeth}
          />

          {/* Logistics & Dispatch Card */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Logistics & Courier Dispatch
            </span>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Courier Partner / Waybill Tracking ID</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. BLUEDART-984214"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  className="text-xs h-9 font-mono"
                />
                <Button size="sm" onClick={handleSaveTracking} className="h-9 px-3 text-xs font-bold shrink-0">
                  <Truck className="w-3.5 h-3.5 mr-1" /> Dispatch
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
