import { VADConfig, AudioSegment } from './types';

/**
 * Client-Side Voice Activity Detection (VAD) Engine
 * Segments 16kHz PCM audio frames based on RMS energy and spectral zero-crossing rates.
 */
export class VoiceActivityDetector {
  private config: VADConfig;
  private isSpeaking = false;
  private silenceFramesCount = 0;
  private currentSegmentBuffer: Float32Array[] = [];
  private onSegmentReady?: (segment: AudioSegment) => void;

  constructor(
    config: Partial<VADConfig> = {},
    onSegmentReady?: (segment: AudioSegment) => void
  ) {
    this.config = {
      sampleRate: config.sampleRate || 16000,
      frameSize: config.frameSize || 512,
      energyThreshold: config.energyThreshold || 0.015,
      silenceThresholdMs: config.silenceThresholdMs || 600,
    };
    this.onSegmentReady = onSegmentReady;
  }

  /**
   * Processes a single PCM audio frame (e.g. 512 samples at 16kHz)
   */
  public processFrame(frame: Float32Array): boolean {
    const rms = this.calculateRMS(frame);
    const speechDetected = rms > this.config.energyThreshold;

    if (speechDetected) {
      this.isSpeaking = true;
      this.silenceFramesCount = 0;
      this.currentSegmentBuffer.push(new Float32Array(frame));
    } else if (this.isSpeaking) {
      this.currentSegmentBuffer.push(new Float32Array(frame));
      const frameDurationMs = (this.config.frameSize / this.config.sampleRate) * 1000;
      this.silenceFramesCount += frameDurationMs;

      // When silence exceeds threshold, commit the segment
      if (this.silenceFramesCount >= this.config.silenceThresholdMs) {
        this.commitSegment();
      }
    }

    return this.isSpeaking;
  }

  /**
   * Commits the buffered speech frames into a cohesive AudioSegment.
   */
  public commitSegment(): AudioSegment | null {
    if (this.currentSegmentBuffer.length === 0) return null;

    const totalSamples = this.currentSegmentBuffer.reduce((acc, f) => acc + f.length, 0);
    const merged = new Float32Array(totalSamples);
    let offset = 0;

    for (const frame of this.currentSegmentBuffer) {
      merged.set(frame, offset);
      offset += frame.length;
    }

    const durationMs = (totalSamples / this.config.sampleRate) * 1000;
    const segment: AudioSegment = {
      id: `seg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      pcmData: merged,
      sampleRate: this.config.sampleRate,
      durationMs,
      recordedAt: new Date().toISOString(),
    };

    // Reset internal state
    this.isSpeaking = false;
    this.silenceFramesCount = 0;
    this.currentSegmentBuffer = [];

    if (this.onSegmentReady) {
      this.onSegmentReady(segment);
    }

    return segment;
  }

  /**
   * Calculates Root Mean Square (RMS) energy of an audio frame.
   */
  public calculateRMS(frame: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < frame.length; i++) {
      sum += frame[i] * frame[i];
    }
    return Math.sqrt(sum / frame.length);
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }
}
