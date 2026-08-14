'use client';

import React, { useState, useEffect } from 'react';
import {
  Camera,
  Mic,
  MicOff,
  QrCode,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AmbientVoiceEngine } from '@/lib/voice/ambient-engine';
import { AmbientVoiceState, DentalVoiceIntent } from '@/lib/voice/types';
import { CaptureAgentBridge } from '@/lib/hardware/capture-agent-bridge';
import { QRIntakeManager } from '@/lib/hardware/qr-intake';
import { CapturedFramePayload } from '@/lib/hardware/types';

interface MediaCaptureHubProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  encounterId: string;
  dentistId: string;
  onMediaCaptured?: (mediaUrl: string, mediaType: string) => void;
}

export function MediaCaptureHub({
  isOpen,
  onClose,
  patientId,
  patientName,
  encounterId,
  dentistId,
  onMediaCaptured,
}: MediaCaptureHubProps) {
  const [activeTab, setActiveTab] = useState('ambient-voice');

  // Ambient Voice State
  const [voiceState, setVoiceState] = useState<AmbientVoiceState>({
    isListening: false,
    isSpeechActive: false,
    audioLevel: 0,
    activeTranscript: '',
    extractedIntents: [],
  });
  const [manualDictationInput, setManualDictationInput] = useState('');
  const [isDictating, setIsDictating] = useState(false);

  // Hardware Bridge State
  const [isBridgeConnected, setIsBridgeConnected] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<CapturedFramePayload[]>([]);
  const [selectedToothForCamera, setSelectedToothForCamera] = useState<number>(16);

  // QR Mobile Intake State
  const [qrToken, setQrToken] = useState<string>('');
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    // 1. Subscribe to Ambient Voice Engine
    const unsubscribeVoice = AmbientVoiceEngine.subscribe((state) => {
      setVoiceState(state);
    });

    // 2. Initialize Hardware Bridge
    CaptureAgentBridge.initialize('OPERATORY-01');
    const unsubscribeStatus = CaptureAgentBridge.onStatusChange((conn) => {
      setIsBridgeConnected(conn);
    });
    const unsubscribeFrames = CaptureAgentBridge.onFrame((frame) => {
      setCapturedFrames((prev) => [frame, ...prev]);
      if (onMediaCaptured) {
        onMediaCaptured(frame.base64Data, 'IMAGE');
      }
    });

    // 3. Generate QR Session Token
    const session = QRIntakeManager.generateSessionToken(patientId, encounterId, dentistId);
    setQrToken(session.token);
    const host = typeof window !== 'undefined' ? window.location.origin : 'https://dcos.in';
    setQrUrl(QRIntakeManager.getMobileUploadUrl(session.token, host));

    return () => {
      unsubscribeVoice();
      unsubscribeStatus();
      unsubscribeFrames();
    };
  }, [isOpen, patientId, encounterId, dentistId, onMediaCaptured]);

  if (!isOpen) return null;

  const handleToggleVoice = async () => {
    if (voiceState.isListening) {
      AmbientVoiceEngine.stopListening();
    } else {
      await AmbientVoiceEngine.startListening(encounterId, patientId, dentistId);
    }
  };

  const handleRunManualDictation = async () => {
    if (!manualDictationInput.trim()) return;
    setIsDictating(true);
    try {
      await AmbientVoiceEngine.processDictation(
        manualDictationInput,
        encounterId,
        patientId,
        dentistId
      );
      setManualDictationInput('');
    } finally {
      setIsDictating(false);
    }
  };

  const handleTriggerCameraSnap = () => {
    CaptureAgentBridge.triggerCapture('IOC-01', selectedToothForCamera);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                Multimodal Clinical Ingestion Hub
                <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                  DCOS 2.0
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Patient: <span className="font-semibold text-foreground">{patientName}</span> (ID: {patientId})
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full w-8 h-8 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content Tabs */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
            <TabsList className="grid grid-cols-4 bg-muted/60 p-1 rounded-xl border border-border">
              <TabsTrigger value="ambient-voice" className="text-xs font-semibold gap-2">
                <Mic className="w-3.5 h-3.5" /> Ambient Voice
              </TabsTrigger>
              <TabsTrigger value="operatory-cam" className="text-xs font-semibold gap-2">
                <Camera className="w-3.5 h-3.5" /> Operatory Camera
              </TabsTrigger>
              <TabsTrigger value="mobile-qr" className="text-xs font-semibold gap-2">
                <QrCode className="w-3.5 h-3.5" /> Smartphone QR
              </TabsTrigger>
              <TabsTrigger value="file-drop" className="text-xs font-semibold gap-2">
                <UploadCloud className="w-3.5 h-3.5" /> Scanner / DSLR
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: AMBIENT VOICE */}
            <TabsContent value="ambient-voice" className="space-y-6">
              <div className="border border-border bg-background rounded-2xl p-6 space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        voiceState.isListening
                          ? 'bg-red-500/10 text-red-500 animate-pulse border border-red-500/30'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {voiceState.isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {voiceState.isListening ? 'Ambient Mic Active (Grammar Worker Listening)' : 'Ambient Dictation Offline'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        SNOMED-CT / CDT Grammar Constrained Decoding Enabled
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleToggleVoice}
                    variant={voiceState.isListening ? 'destructive' : 'default'}
                    className="gap-2 font-semibold text-xs"
                  >
                    {voiceState.isListening ? 'Stop Listening' : 'Start Ambient Stream'}
                  </Button>
                </div>

                {/* Live Waveform Indicator */}
                {voiceState.isListening && (
                  <div className="space-y-2 bg-muted/40 p-4 rounded-xl border border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-primary" /> Audio Level
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {voiceState.isSpeechActive ? 'SPEECH DETECTED (VAD ACTIVE)' : 'AMBIENT BACKGROUND'}
                      </span>
                    </div>
                    <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-border">
                      <div
                        className="bg-primary h-full transition-all duration-75"
                        style={{ width: `${Math.min(voiceState.audioLevel * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Quick Dictation Simulator Input */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-primary" /> Dictation Test Benchmark
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={manualDictationInput}
                      onChange={(e) => setManualDictationInput(e.target.value)}
                      placeholder="e.g., 'Tooth 16 MOD Caries' or 'Probing depth tooth 16 mesial-buccal 5 mm with bleeding'"
                      className="text-xs"
                      onKeyDown={(e) => e.key === 'Enter' && handleRunManualDictation()}
                    />
                    <Button
                      onClick={handleRunManualDictation}
                      disabled={isDictating || !manualDictationInput.trim()}
                      className="text-xs font-semibold shrink-0"
                    >
                      {isDictating ? 'Parsing...' : 'Decode'}
                    </Button>
                  </div>
                </div>

                {/* Extracted Intents Display */}
                {voiceState.extractedIntents.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Extracted Dental Findings ({voiceState.extractedIntents.length})
                    </h4>
                    <div className="grid gap-2">
                      {voiceState.extractedIntents.map((intent, idx) => (
                        <div
                          key={idx}
                          className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">
                                Tooth {intent.toothFdi}
                              </Badge>
                              <span className="font-bold text-foreground">
                                {intent.intentType}: {intent.observationType?.toUpperCase() || intent.restorationMaterial}
                              </span>
                              {intent.surfaces && (
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  Surfaces: [{intent.surfaces.join(', ')}]
                                </span>
                              )}
                            </div>
                            {intent.probingDepthMm && (
                              <p className="text-[11px] text-muted-foreground">
                                Probing: {intent.perioProbingLocation} {intent.probingDepthMm}mm ({intent.bleeding ? 'Bleeding' : 'No Bleeding'})
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                            Confidence: {(intent.confidence * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: OPERATORY CAMERA */}
            <TabsContent value="operatory-cam" className="space-y-6">
              <div className="border border-border bg-background rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isBridgeConnected
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                      }`}
                    >
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        Local Hardware Bridge (ws://127.0.0.1:12345)
                        <Badge
                          variant="outline"
                          className={
                            isBridgeConnected
                              ? 'text-emerald-600 border-emerald-500/30'
                              : 'text-amber-600 border-amber-500/30'
                          }
                        >
                          {isBridgeConnected ? 'ONLINE' : 'MOCK / READY'}
                        </Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Direct foot-pedal trigger & USB/UVC Intraoral Camera snap integration
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedToothForCamera}
                      onChange={(e) => setSelectedToothForCamera(Number(e.target.value))}
                      aria-label="Target FDI Tooth"
                      className="bg-muted border border-border rounded-lg text-xs px-3 py-2 font-semibold"
                    >
                      <option value={16}>Tooth 16 (UR Molar)</option>
                      <option value={21}>Tooth 21 (UL Incisor)</option>
                      <option value={36}>Tooth 36 (LL Molar)</option>
                      <option value={46}>Tooth 46 (LR Molar)</option>
                    </select>
                    <Button onClick={handleTriggerCameraSnap} className="gap-2 text-xs font-semibold">
                      <Camera className="w-3.5 h-3.5" /> Trigger Snap
                    </Button>
                  </div>
                </div>

                {/* Captured Frames Gallery */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Captured Frames ({capturedFrames.length})
                  </h4>
                  {capturedFrames.length === 0 ? (
                    <div className="p-8 border border-dashed border-border rounded-xl text-center text-xs text-muted-foreground">
                      No intraoral frames captured yet. Press foot pedal or click &ldquo;Trigger Snap&rdquo;.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                      {capturedFrames.map((frame) => (
                        <div
                          key={frame.frameId}
                          className="border border-border bg-card rounded-xl p-3 space-y-2 relative group"
                        >
                          <div className="w-full h-24 bg-muted/60 rounded-lg flex items-center justify-center text-muted-foreground border border-border overflow-hidden">
                            <Camera className="w-8 h-8 opacity-40" />
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="font-bold text-foreground">Tooth {frame.toothNumber}</span>
                            <span className="text-muted-foreground font-mono">{frame.shadeGuide}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: SMARTPHONE QR */}
            <TabsContent value="mobile-qr" className="space-y-6">
              <div className="border border-border bg-background rounded-2xl p-6 text-center space-y-6">
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-base font-bold text-foreground">Chairside Smartphone Intake</h3>
                  <p className="text-xs text-muted-foreground">
                    Scan with any iPhone or Android camera to instantly upload high-resolution shade photos directly into this patient&apos;s workspace.
                  </p>
                </div>

                {/* Styled QR Visual Card */}
                <div className="inline-block p-6 bg-white rounded-2xl shadow-md border border-neutral-200">
                  <div className="w-48 h-48 bg-neutral-900 rounded-xl flex flex-col items-center justify-center p-4 text-white relative">
                    <QrCode className="w-32 h-32 text-white" />
                    <span className="text-[10px] font-mono tracking-widest text-emerald-400 mt-2">DCOS 2.0 LIVE</span>
                  </div>
                </div>

                <div className="space-y-2 max-w-sm mx-auto">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Listening for chairside mobile stream
                  </div>
                  <p className="text-[11px] font-mono bg-muted p-2 rounded-lg text-muted-foreground truncate border border-border">
                    {qrUrl}
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: FILE DROP */}
            <TabsContent value="file-drop" className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center space-y-4 hover:border-primary/50 transition-colors cursor-pointer bg-background">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Drag & Drop Clinical Media</h3>
                  <p className="text-xs text-muted-foreground">
                    Supports Intraoral Scans (.STL, .PLY), CBCT (.DCM), and DSLR High-Res Shade Photos (.JPG, .PNG)
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-xs font-semibold gap-2">
                  Browse Files
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Bi-Temporal Ledger Sync Active</span>
          </div>
          <Button onClick={onClose} className="text-xs font-semibold px-6">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
