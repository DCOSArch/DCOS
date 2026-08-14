import { ToothSurface, ObservationType, DentalObservationPayload } from '../events/types';
import { DentalVoiceIntent, GrammarRule } from './types';

/**
 * Grammar-Constrained Decoding & Semantic Parser for Dental Dictations
 * Maps natural operatory speech directly into structured ISO 3950 & SNOMED-CT payloads.
 */
export class DentalGrammarParser {
  private static readonly TOOTH_WORD_MAP: Record<string, number> = {
    'one one': 11, 'one two': 12, 'one three': 13, 'one four': 14, 'one five': 15, 'one six': 16, 'one seven': 17, 'one eight': 18,
    'two one': 21, 'two two': 22, 'two three': 23, 'two four': 24, 'two five': 25, 'two six': 26, 'two seven': 27, 'two eight': 28,
    'three one': 31, 'three two': 32, 'three three': 33, 'three four': 34, 'three five': 35, 'three six': 36, 'three seven': 37, 'three eight': 38,
    'four one': 41, 'four two': 42, 'four three': 43, 'four four': 44, 'four five': 45, 'four six': 46, 'four seven': 47, 'four eight': 48,
  };

  /**
   * Grammar rules for deterministic pattern extraction
   */
  private static readonly RULES: GrammarRule[] = [
    // 1. Periodontal Probing Rule: "probing depth tooth 16 mesial buccal 5 millimeters with bleeding"
    {
      pattern: /(?:probing(?:\s+depth)?|pocket)\s+(?:on\s+)?(?:tooth\s+)?([0-9]{2}|[a-z\s]+?)\s+(mesial[\s-]buccal|buccal|distal[\s-]buccal|mesial[\s-]lingual|lingual|distal[\s-]lingual|mb|b|db|ml|l|dl)\s+(\d+)(?:\s*(?:mm|millimeters))?(?:\s+(with|no)\s+bleeding)?/i,
      extract: (match) => {
        const toothStr = match[1].trim();
        const toothFdi = DentalGrammarParser.parseToothNumber(toothStr);
        const locRaw = match[2].toLowerCase().replace(/[\s-]/g, '');
        const locMap: Record<string, 'MB' | 'B' | 'DB' | 'ML' | 'L' | 'DL'> = {
          mesialbuccal: 'MB', mb: 'MB',
          buccal: 'B', b: 'B',
          distalbuccal: 'DB', db: 'DB',
          mesiallingual: 'ML', ml: 'ML',
          lingual: 'L', l: 'L',
          distallingual: 'DL', dl: 'DL',
        };
        const depth = parseInt(match[3], 10);
        const bleeding = match[4]?.toLowerCase() === 'with';

        return {
          intentType: 'PERIODONTAL',
          toothFdi,
          perioProbingLocation: locMap[locRaw] || 'B',
          probingDepthMm: depth,
          bleeding,
        };
      },
    },

    // 2. Caries / Cavity Finding Rule: "tooth 16 MOD caries" or "cavity on tooth 46 occlusal"
    {
      pattern: /(?:tooth\s+)?([0-9]{2}|[a-z\s]+?)\s+([modbfli\s,]+?)\s+(caries|cavity|decay|fracture|mobility|missing)/i,
      extract: (match) => {
        const toothFdi = DentalGrammarParser.parseToothNumber(match[1].trim());
        const surfaces = DentalGrammarParser.parseSurfaces(match[2]);
        const obsRaw = match[3].toLowerCase();
        const obsMap: Record<string, ObservationType> = {
          caries: 'caries',
          cavity: 'caries',
          decay: 'caries',
          fracture: 'fracture',
          mobility: 'mobility',
          missing: 'missing',
        };

        return {
          intentType: 'OBSERVATION',
          toothFdi,
          surfaces,
          observationType: obsMap[obsRaw] || 'caries',
        };
      },
    },

    // 3. Restoration / Prosthetics Rule: "tooth 21 zirconia crown", "tooth 36 composite restoration MOD", "tooth 36 MOD composite restoration"
    {
      pattern: /(?:tooth\s+)?([0-9]{2}|[a-z\s]+?)\s+(?:([modbfli\s,]+)\s+)?(zirconia|emax|composite|amalgam|pfm|titanium)\s+(crown|restoration|filling|inlay|onlay|implant)(?:\s+([modbfli\s,]+))?/i,
      extract: (match) => {
        const toothFdi = DentalGrammarParser.parseToothNumber(match[1].trim());
        const leadingSurfaces = match[2];
        const material = match[3].toUpperCase();
        const obsType: ObservationType = match[4].toLowerCase() === 'implant' ? 'implant' : 'restoration';
        const trailingSurfaces = match[5];
        const surfaceRaw = leadingSurfaces || trailingSurfaces;
        const surfaces = surfaceRaw ? DentalGrammarParser.parseSurfaces(surfaceRaw) : undefined;

        return {
          intentType: 'TREATMENT',
          toothFdi,
          surfaces,
          observationType: obsType,
          restorationMaterial: material,
        };
      },
    },
  ];

  /**
   * Parses a raw voice transcription segment into structured clinical intents.
   */
  public static parse(transcript: string): DentalVoiceIntent[] {
    const cleaned = transcript.trim().toLowerCase();
    const results: DentalVoiceIntent[] = [];

    for (const rule of this.RULES) {
      const match = rule.pattern.exec(cleaned);
      if (match) {
        const extracted = rule.extract(match);
        if (extracted.toothFdi && extracted.toothFdi >= 11 && extracted.toothFdi <= 48) {
          results.push({
            intentType: extracted.intentType || 'OBSERVATION',
            toothFdi: extracted.toothFdi,
            surfaces: extracted.surfaces,
            observationType: extracted.observationType,
            restorationMaterial: extracted.restorationMaterial,
            perioProbingLocation: extracted.perioProbingLocation,
            probingDepthMm: extracted.probingDepthMm,
            bleeding: extracted.bleeding,
            rawTranscript: transcript,
            confidence: 0.95,
          });
        }
      }
    }

    return results;
  }

  /**
   * Converts a structured voice intent into a production DentalObservationPayload.
   */
  public static intentToObservationPayload(
    intent: DentalVoiceIntent,
    encounterId: string,
    patientId: string
  ): DentalObservationPayload {
    const defaultPerio: [number, number, number, number, number, number] = [2, 2, 2, 2, 2, 2];
    const defaultBop: [boolean, boolean, boolean, boolean, boolean, boolean] = [false, false, false, false, false, false];

    if (intent.intentType === 'PERIODONTAL' && intent.perioProbingLocation && intent.probingDepthMm !== undefined) {
      const locIndexMap: Record<string, number> = { MB: 0, B: 1, DB: 2, ML: 3, L: 4, DL: 5 };
      const idx = locIndexMap[intent.perioProbingLocation] ?? 1;
      defaultPerio[idx] = intent.probingDepthMm;
      defaultBop[idx] = Boolean(intent.bleeding);
    }

    const obsType: ObservationType = intent.observationType || (intent.intentType === 'PERIODONTAL' ? 'perio_probing' : 'caries');

    return {
      encounter_id: encounterId,
      patient_id: patientId,
      tooth_fdi: intent.toothFdi,
      surfaces: intent.surfaces,
      observation_type: obsType,
      restoration_material: intent.restorationMaterial as any,
      perio_metrics: intent.intentType === 'PERIODONTAL' ? {
        probingDepthMm: defaultPerio,
        bleedingOnProbing: defaultBop,
      } : undefined,
      notes: `Captured via Ambient Voice Engine: "${intent.rawTranscript}"`,
      fhir_observation: {
        resourceType: 'Observation',
        status: 'final',
        code: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: '80967001',
            display: obsType.toUpperCase(),
          }],
        },
        bodySite: {
          coding: [{
            system: 'http://fdi.org/tooth',
            code: String(intent.toothFdi),
            display: `Tooth ${intent.toothFdi}`,
          }],
        },
      },
    };
  }

  /**
   * Parses tooth string into FDI number (11-48).
   */
  public static parseToothNumber(str: string): number {
    const num = parseInt(str, 10);
    if (!isNaN(num) && num >= 11 && num <= 48) {
      return num;
    }
    const normalized = str.toLowerCase().trim();
    if (this.TOOTH_WORD_MAP[normalized]) {
      return this.TOOTH_WORD_MAP[normalized];
    }
    return 16; // default fallback
  }

  /**
   * Parses surface strings like "MOD", "mesio-occlusal", "B L" into ToothSurface[]
   */
  public static parseSurfaces(str: string): ToothSurface[] {
    const surfaces: ToothSurface[] = [];
    const upper = str.toUpperCase();

    if (upper.includes('M') || upper.includes('MESIAL')) surfaces.push('M');
    if (upper.includes('O') || upper.includes('OCCLUSAL')) surfaces.push('O');
    if (upper.includes('D') || upper.includes('DISTAL')) surfaces.push('D');
    if (upper.includes('B') || upper.includes('BUCCAL') || upper.includes('FACIAL') || upper.includes('F')) surfaces.push('B');
    if (upper.includes('L') || upper.includes('LINGUAL')) surfaces.push('L');
    if (upper.includes('I') || upper.includes('INCISAL')) surfaces.push('I');

    return surfaces.length > 0 ? surfaces : ['O'];
  }
}
