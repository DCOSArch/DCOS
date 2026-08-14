import { DomainEvent, DentalObservationPayload, PatientRegisteredPayload, FHIRObservationResource } from '../events/types';

export interface FHIRPatientResource {
  resourceType: 'Patient';
  id: string;
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    use?: 'official' | 'usual';
    family: string;
    given: string[];
    prefix?: string[];
  }>;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  telecom: Array<{
    system: 'phone' | 'email';
    value: string;
    use?: 'mobile' | 'home' | 'work';
  }>;
}

export interface FHIRConditionResource {
  resourceType: 'Condition';
  id: string;
  clinicalStatus: {
    coding: Array<{
      system: 'http://terminology.hl7.org/CodeSystem/condition-clinical';
      code: 'active' | 'recurrence' | 'relapse' | 'remission' | 'resolved';
    }>;
  };
  code: {
    coding: Array<{
      system: 'http://snomed.info/sct';
      code: string;
      display: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string;
  };
  bodySite?: Array<{
    coding: Array<{
      system: 'http://snomed.info/sct' | 'http://fdi.org/tooth';
      code: string;
      display: string;
    }>;
  }>;
  recordedDate: string;
}

export interface FHIRBundleResource {
  resourceType: 'Bundle';
  type: 'document' | 'collection' | 'transaction';
  timestamp: string;
  entry: Array<{
    fullUrl: string;
    resource: any;
  }>;
}

/**
 * Native HL7 FHIR R5 Resource Serializer & Projection Engine
 */
export class FHIRR5Serializer {
  /**
   * Serializes a PatientRegistered event into a standard FHIR R5 Patient resource.
   */
  public static serializePatient(event: DomainEvent<PatientRegisteredPayload>): FHIRPatientResource {
    const p = event.payload;
    const identifiers: Array<{ system: string; value: string }> = [
      { system: 'https://dcos.in/mrn', value: p.mrn },
    ];

    if (p.national_health_id) {
      identifiers.push({
        system: 'https://healthid.abdm.gov.in',
        value: p.national_health_id,
      });
    }

    return {
      resourceType: 'Patient',
      id: event.aggregate_id,
      identifier: identifiers,
      name: [
        {
          use: 'official',
          family: p.name.family,
          given: p.name.given,
          prefix: p.name.prefix ? [p.name.prefix] : undefined,
        },
      ],
      gender: p.gender,
      birthDate: p.birth_date,
      telecom: p.telecom,
    };
  }

  /**
   * Serializes a DentalObservationRecorded event into an HL7 FHIR R5 Observation resource.
   */
  public static serializeDentalObservation(
    event: DomainEvent<DentalObservationPayload>
  ): FHIRObservationResource {
    const payload = event.payload;
    const fdiCode = String(payload.tooth_fdi);

    return {
      resourceType: 'Observation',
      id: event.event_id,
      status: 'final',
      code: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: this.mapObservationToSnomed(payload.observation_type),
            display: payload.observation_type.toUpperCase(),
          },
        ],
        text: `Dental observation on tooth ${payload.tooth_fdi} (${payload.observation_type})`,
      },
      bodySite: {
        coding: [
          {
            system: 'http://snomed.info/sct',
            code: fdiCode,
            display: `Permanent tooth ${fdiCode} (ISO 3950)`,
          },
        ],
      },
      valueString: payload.notes || payload.restoration_material,
    };
  }

  /**
   * Compiles an entire patient's encounter into an HL7 FHIR R5 Diagnostic Document Bundle.
   */
  public static compileEncounterBundle(
    patientEvent: DomainEvent<PatientRegisteredPayload>,
    observationEvents: DomainEvent<DentalObservationPayload>[]
  ): FHIRBundleResource {
    const patientResource = this.serializePatient(patientEvent);
    const observationResources = observationEvents.map((e) => this.serializeDentalObservation(e));

    return {
      resourceType: 'Bundle',
      type: 'document',
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: `urn:uuid:${patientResource.id}`,
          resource: patientResource,
        },
        ...observationResources.map((obs) => ({
          fullUrl: `urn:uuid:${obs.id}`,
          resource: obs,
        })),
      ],
    };
  }

  private static mapObservationToSnomed(type: string): string {
    const map: Record<string, string> = {
      caries: '80967001', // Dental Caries
      restoration: '255459008', // Tooth restoration
      perio_probing: '276189006', // Probing depth
      mobility: '246608006', // Tooth mobility
      fracture: '235122003', // Tooth fracture
      endodontic: '234988004', // Endodontic status
      implant: '272658006', // Dental implant present
      missing: '266934004', // Missing tooth
    };
    return map[type] || '404684003';
  }
}
