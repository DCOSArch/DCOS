import { VoiceActivityDetector } from './vad';
import { DentalGrammarParser } from './grammar-parser';
import { DentalVoiceIntent, AmbientVoiceState } from './types';
import { BiTemporalEventStore } from '../events/store';
import '../projections';

export class AmbientVoiceEngine {
  private static isListening = false;
  private static audioContext: AudioContext | null = null;
  private static mediaStream: MediaStream | null = null;
  private static vad: VoiceActivityDetector | null = null;
  private static subscribers: Array<(state: AmbientVoiceState) => void> = [];

  private static currentState: AmbientVoiceState = {
    isListening: false,
    isSpeechActive: false,
    audioLevel: 0,
    activeTranscript: '',
    extractedIntents: [],
  };

  /**
   * Starts ambient operatory microphone monitoring.
   */
  public static async startListening(
    encounterId: string,
    patientId: string,
    dentistId: string
  ): Promise<void> {
    if (this.isListening) return;

    try {
      this.isListening = true;
      this.currentState.isListening = true;
      this.notifySubscribers();

      // Browser Web Audio setup
      if (typeof window !== 'undefined' && navigator.mediaDevices) {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000,
        });

        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        const processor = this.audioContext.createScriptProcessor(512, 1, 1);

        this.vad = new VoiceActivityDetector({}, async (segment) => {
          // In real browser, transcribing via SpeechRecognition or local Whisper WASM
          console.log(`[VAD] Speech Segment completed (${segment.durationMs.toFixed(0)}ms). Parsing dental tokens...`);
        });

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const rms = this.vad?.calculateRMS(inputData) || 0;
          this.currentState.audioLevel = Math.min(rms * 10, 1.0);
          this.currentState.isSpeechActive = this.vad?.processFrame(inputData) || false;
          this.notifySubscribers();
        };

        source.connect(processor);
        processor.connect(this.audioContext.destination);
      }
    } catch (err) {
      console.warn('Microphone stream access unavailable (operating in simulated dictation mode):', err);
      this.isListening = true;
      this.currentState.isListening = true;
      this.notifySubscribers();
    }
  }

  /**
   * Processes a dictation transcript string through grammar decoding and commits it to the bi-temporal event store.
   */
  public static async processDictation(
    transcript: string,
    encounterId: string,
    patientId: string,
    dentistId: string
  ): Promise<DentalVoiceIntent[]> {
    this.currentState.activeTranscript = transcript;
    const intents = DentalGrammarParser.parse(transcript);
    this.currentState.extractedIntents = intents;
    this.notifySubscribers();

    for (const intent of intents) {
      const payload = DentalGrammarParser.intentToObservationPayload(intent, encounterId, patientId);

      // Append directly to the Bi-Temporal Event Store
      await BiTemporalEventStore.append({
        aggregateId: patientId,
        aggregateType: 'EncounterAggregate',
        eventType: 'DentalObservationRecorded',
        actorId: dentistId,
        payload,
        observedAt: new Date(),
      });
    }

    return intents;
  }

  /**
   * Stops ambient operatory microphone monitoring.
   */
  public static stopListening(): void {
    this.isListening = false;
    this.currentState.isListening = false;
    this.currentState.isSpeechActive = false;
    this.currentState.audioLevel = 0;

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.notifySubscribers();
  }

  public static subscribe(callback: (state: AmbientVoiceState) => void): () => void {
    this.subscribers.push(callback);
    callback(this.currentState);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private static notifySubscribers(): void {
    for (const sub of this.subscribers) {
      sub({ ...this.currentState });
    }
  }
}
