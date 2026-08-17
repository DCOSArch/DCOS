'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Square, Loader2, Sparkles, Check, RefreshCw, Volume2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface ExtractedNotes {
  chiefComplaint?: string;
  clinicalFindings?: string;
  diagnosis?: string;
  treatmentRendered?: string;
  prescriptionsDraft?: string;
}

interface VisitVoiceRecorderProps {
  onApplyExtraction: (data: { transcript: string; extracted: ExtractedNotes }) => void;
  disabled?: boolean;
}

export function VisitVoiceRecorder({ onApplyExtraction, disabled = false }: VisitVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const stopTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
      stopTracks();
    };
  }, [clearTimer, stopTracks]);

  const startRecording = async () => {
    if (disabled || typeof window === 'undefined') return;
    setErrorMessage(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording is not supported on this browser or connection.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stopTracks();
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone access error:', err);
      clearTimer();
      stopTracks();
      setIsRecording(false);
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'Microphone permission denied. Please enable microphone access in your browser settings.'
        : err.message || 'Unable to access microphone.';
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearTimer();
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success && data.transcript) {
        setTranscript(data.transcript);
        toast.success('Voice dictation transcribed successfully.');
      } else {
        const msg = data.message || data.error || 'No speech recognized. Please speak clearly and try again.';
        setErrorMessage(msg);
        toast.error(msg);
      }
    } catch (e: any) {
      console.error('Audio upload failed:', e);
      const msg = 'Network error while connecting to speech transcription service.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (!transcript) return;

    // Apply the real transcribed dictation directly into the clinical record without fabricated data
    const extractedData: ExtractedNotes = {
      chiefComplaint: transcript,
    };

    onApplyExtraction({ transcript, extracted: extractedData });
    toast.success('Applied dictation to visit record.');
  };

  return (
    <Card className="border border-border bg-[#1E1F1C] overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                isRecording
                  ? 'bg-red-500/20 text-red-400 animate-pulse'
                  : 'bg-[#F92672]/20 text-[#F92672]'
              }`}
            >
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Clinical Voice Dictation
                <Badge variant="outline" className="text-[10px] text-[#66D9EF] border-[#66D9EF]/30">
                  Whisper Live
                </Badge>
              </h4>
              <p className="text-xs text-muted-foreground">
                Speak chairside observations, treatment details, or clinical notes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isRecording ? (
              <Button
                type="button"
                onClick={stopRecording}
                variant="destructive"
                size="sm"
                className="gap-2 bg-red-600 hover:bg-red-700 text-white font-mono text-xs shadow-lg shadow-red-500/20 animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Stop ({formatTimer(recordingSeconds)})
              </Button>
            ) : (
              <Button
                type="button"
                onClick={startRecording}
                disabled={isProcessing || disabled}
                size="sm"
                className="gap-2 bg-[#F92672] hover:bg-[#E01E5A] text-white font-semibold text-xs shadow-lg shadow-[#F92672]/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    Record Dictation
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {transcript && (
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-[#A6E22E]" />
                Captured Transcript
              </span>
              <Button
                type="button"
                onClick={handleApply}
                size="sm"
                className="gap-1.5 bg-[#A6E22E] hover:bg-[#8EC024] text-[#1E1F1C] font-bold text-xs shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                Apply to Visit Notes
              </Button>
            </div>

            <div className="p-3 bg-background/60 border border-border/80 rounded-lg text-xs leading-relaxed text-foreground font-mono">
              {transcript}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
