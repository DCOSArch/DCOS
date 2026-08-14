/**
 * DCOS 2.0 / Next-Gen Reactive PMS — Phase 3 Ambient Voice & Grammar Types
 * Grammar-Constrained Decoding for Dental Nomenclature (SNOMED-CT, CDT, ISO 3950)
 */

import { ObservationType, ToothSurface, DentalObservationPayload } from '../events/types';

export interface VADConfig {
  sampleRate: number; // 16000 Hz
  frameSize: number; // e.g. 512 samples (32ms)
  energyThreshold: number; // RMS threshold for speech presence
  silenceThresholdMs: number; // Milliseconds of silence to trigger end-of-speech
}

export interface AudioSegment {
  id: string;
  pcmData: Float32Array;
  sampleRate: number;
  durationMs: number;
  recordedAt: string;
}

export interface DentalVoiceIntent {
  intentType: 'OBSERVATION' | 'PERIODONTAL' | 'TREATMENT' | 'NOTE';
  toothFdi: number;
  surfaces?: ToothSurface[];
  observationType?: ObservationType;
  restorationMaterial?: string;
  perioProbingLocation?: 'MB' | 'B' | 'DB' | 'ML' | 'L' | 'DL';
  probingDepthMm?: number;
  bleeding?: boolean;
  rawTranscript: string;
  confidence: number;
}

export interface GrammarRule {
  pattern: RegExp;
  extract: (match: RegExpExecArray) => Partial<DentalVoiceIntent>;
}

export interface AmbientVoiceState {
  isListening: boolean;
  isSpeechActive: boolean;
  audioLevel: number; // 0.0 - 1.0
  activeTranscript: string;
  extractedIntents: DentalVoiceIntent[];
}
