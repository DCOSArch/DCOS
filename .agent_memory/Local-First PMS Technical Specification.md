# **Architectural Blueprint and Technical Specification for a Local-First Event-Sourced Patient Management System**

## **Domain Event Model and Bi-Temporal Schema Architecture**

Modern clinical software systems require continuous transactional availability, deterministic historical auditability, and zero-latency local user responsiveness. Traditional relational Healthcare Information Systems (HIS) rely on mutable, state-overwrite models that erase operational history and fail under network partitions. The architecture specified herein adopts an append-only, event-sourced engine utilizing bi-temporal data modeling to preserve both the real-world clinical context and the system transactional context for every atomic change1.

### **Bi-Temporal Event Sourcing Mechanics**

Bi-temporal event sourcing decouples the system processing timeline from the real-world clinical timeline. Every event appended to local or distributed event logs records two independent temporal dimensions:

> 1. **Valid Time (observed\_at)**: The real-world timestamp indicating when a clinical observation, administrative action, or diagnosis actually occurred in physical reality, as declared by a clinician or sensor device.  
> 2. **Transaction Time (system\_at)**: The immutable database system timestamp recorded when the event was committed to the log store1.

The separation of valid time and transaction time resolves historical retroactive adjustments. For example, if a clinician reviews lab results from an encounter that took place at 09:00 AM (observed\_at) but enters the diagnosis into the mobile client at 10:30 AM (system\_at), the bi-temporal model logs the event without altering historical state projections evaluated prior to 10:30 AM1. This dual-axis timeline guarantees full support for point-in-time state reconstruction, enabling deterministic compliance auditing and clinical decision support re-evaluation.

### **Domain Event Taxonomy**

System operations are driven by an append-only log of domain events. Each domain event represents an immutable fact, carries a dual timestamp, and serves as the single source of truth for constructing projected read models, such as HL7 FHIR R5 resources1.

| Event Name | Lifecycle Phase | Aggregate Root | Description | Projected FHIR R5 Resource |
| :---- | :---- | :---- | :---- | :---- |
| PatientRegistered | Identity & Intake | PatientAggregate | Logs initial demographic intake and national identifier assignment2. | Patient \[cite: 3\] |
| CoverageVerified | Payor & Billing | CoverageAggregate | Logs insurance eligibility validation, copay structures, and payer authorization2. | Coverage |
| ConsentGranted | Governance | ConsentAggregate | Records explicit patient consent scopes, purpose-of-use constraints, and expiration2. | Consent \[cite: 5\] |
| AppointmentScheduled | Queue Management | ScheduleAggregate | Captures initial slot allocations, estimated durations, and assigned practitioners6. | Appointment |
| PatientArrived | Queue Management | ScheduleAggregate | Marks arrival at facility, capturing punctuality delta for dynamic queue optimization6. | Encounter |
| ClinicalObservationRecorded | Clinical Encounter | EncounterAggregate | Records vital signs, laboratory metrics, or ambiently captured physical measurements7. | Observation |
| DiagnosisAsserted | Clinical Encounter | EncounterAggregate | Records problem list additions, diagnostic assertions, and certainty metrics. | Condition |
| ServiceRequested | Clinical Encounter | EncounterAggregate | Encapsulates orders for laboratory tests, imaging procedures, or specialist referrals. | ServiceRequest |
| ChargeCaptured | Revenue Cycle | BillingAggregate | Logs fee items, procedural billing codes (CPT/ICD-10), and modifier flags. | ChargeItem |
| ClaimAdjudicated | Revenue Cycle | BillingAggregate | Records payer claim responses, adjudication status, and remaining patient liability. | ClaimResponse |

### **Concrete Schemas for Core Domain Events**

The following JSON Schemas define six critical domain events, embedding dual-timestamp structures, tracing metadata, and native HL7 FHIR R5 resource definitions.

#### **1\. PatientRegistered Event Schema**

JSON  
{  
  "$schema": "http://json-schema.org/draft-07/schema\#",  
  "title": "PatientRegisteredEvent",  
  "type": "object",  
  "required": \[  
    "event\_id",  
    "aggregate\_id",  
    "event\_type",  
    "temporal\_metadata",  
    "actor\_id",  
    "payload"  
  \],  
  "properties": {  
    "event\_id": { "type": "string", "format": "uuid" },  
    "aggregate\_id": { "type": "string", "format": "uuid" },  
    "event\_type": { "type": "string", "const": "PatientRegistered" },  
    "temporal\_metadata": {  
      "type": "object",  
      "required": \["system\_at", "observed\_at"\],  
      "properties": {  
        "system\_at": { "type": "string", "format": "date-time" },  
        "observed\_at": { "type": "string", "format": "date-time" }  
      }  
    },  
    "actor\_id": { "type": "string", "format": "uuid" },  
    "payload": {  
      "type": "object",  
      "required": \["national\_health\_id", "fhir\_patient"\],  
      "properties": {  
        "national\_health\_id": { "type": "string" },  
        "fhir\_patient": {  
          "type": "object",  
          "required": \["resourceType", "identifier", "name", "gender", "birthDate"\],  
          "properties": {  
            "resourceType": { "type": "string", "const": "Patient" },  
            "identifier": {  
              "type": "array",  
              "items": {  
                "type": "object",  
                "required": \["system", "value"\],  
                "properties": {  
                  "system": { "type": "string" },  
                  "value": { "type": "string" }  
                }  
              }  
            },  
            "name": {  
              "type": "array",  
              "items": {  
                "type": "object",  
                "required": \["family", "given"\],  
                "properties": {  
                  "family": { "type": "string" },  
                  "given": { "type": "array", "items": { "type": "string" } }  
                }  
              }  
            },  
            "gender": { "type": "string", "enum": \["male", "female", "other", "unknown"\] },  
            "birthDate": { "type": "string", "format": "date" }  
          }  
        }  
      }  
    }  
  }  
}

#### **2\. CoverageVerified Event Schema**

JSON  
{  
  "$schema": "http://json-schema.org/draft-07/schema\#",  
  "title": "CoverageVerifiedEvent",  
  "type": "object",  
  "required": \[  
    "event\_id",  
    "aggregate\_id",  
    "event\_type",  
    "temporal\_metadata",  
    "actor\_id",  
    "payload"  
  \],  
  "properties": {  
    "event\_id": { "type": "string", "format": "uuid" },  
    "aggregate\_id": { "type": "string", "format": "uuid" },  
    "event\_type": { "type": "string", "const": "CoverageVerified" },  
    "temporal\_metadata": {  
      "type": "object",  
      "required": \["system\_at", "observed\_at"\],  
      "properties": {  
        "system\_at": { "type": "string", "format": "date-time" },  
        "observed\_at": { "type": "string", "format": "date-time" }  
      }  
    },  
    "actor\_id": { "type": "string", "format": "uuid" },  
    "payload": {  
      "type": "object",  
      "required": \["payer\_id", "status", "fhir\_coverage"\],  
      "properties": {  
        "payer\_id": { "type": "string" },  
        "status": { "type": "string", "enum": \["active", "cancelled", "draft", "entered-in-error"\] },  
        "copay\_amount": { "type": "number" },  
        "fhir\_coverage": {  
          "type": "object",  
          "required": \["resourceType", "status", "kind", "beneficiary", "insurer"\],  
          "properties": {  
            "resourceType": { "type": "string", "const": "Coverage" },  
            "status": { "type": "string", "const": "active" },  
            "kind": { "type": "string", "const": "insurance" },  
            "beneficiary": {  
              "type": "object",  
              "required": \["reference"\],  
              "properties": { "reference": { "type": "string" } }  
            },  
            "insurer": {  
              "type": "object",  
              "required": \["reference"\],  
              "properties": { "reference": { "type": "string" } }  
            }  
          }  
        }  
      }  
    }  
  }  
}

#### **3\. AppointmentScheduled Event Schema**

JSON  
{  
  "$schema": "http://json-schema.org/draft-07/schema\#",  
  "title": "AppointmentScheduledEvent",  
  "type": "object",  
  "required": \[  
    "event\_id",  
    "aggregate\_id",  
    "event\_type",  
    "temporal\_metadata",  
    "actor\_id",  
    "payload"  
  \],  
  "properties": {  
    "event\_id": { "type": "string", "format": "uuid" },  
    "aggregate\_id": { "type": "string", "format": "uuid" },  
    "event\_type": { "type": "string", "const": "AppointmentScheduled" },  
    "temporal\_metadata": {  
      "type": "object",  
      "required": \["system\_at", "observed\_at"\],  
      "properties": {  
        "system\_at": { "type": "string", "format": "date-time" },  
        "observed\_at": { "type": "string", "format": "date-time" }  
      }  
    },  
    "actor\_id": { "type": "string", "format": "uuid" },  
    "payload": {  
      "type": "object",  
      "required": \["patient\_id", "practitioner\_id", "scheduled\_start", "estimated\_duration\_minutes"\],  
      "properties": {  
        "patient\_id": { "type": "string", "format": "uuid" },  
        "practitioner\_id": { "type": "string", "format": "uuid" },  
        "scheduled\_start": { "type": "string", "format": "date-time" },  
        "estimated\_duration\_minutes": { "type": "integer", "minimum": 1 },  
        "procedure\_code": { "type": "string" }  
      }  
    }  
  }  
}

#### **4\. ClinicalObservationRecorded Event Schema**

JSON  
{  
  "$schema": "http://json-schema.org/draft-07/schema\#",  
  "title": "ClinicalObservationRecordedEvent",  
  "type": "object",  
  "required": \[  
    "event\_id",  
    "aggregate\_id",  
    "event\_type",  
    "temporal\_metadata",  
    "actor\_id",  
    "payload"  
  \],  
  "properties": {  
    "event\_id": { "type": "string", "format": "uuid" },  
    "aggregate\_id": { "type": "string", "format": "uuid" },  
    "event\_type": { "type": "string", "const": "ClinicalObservationRecorded" },  
    "temporal\_metadata": {  
      "type": "object",  
      "required": \["system\_at", "observed\_at"\],  
      "properties": {  
        "system\_at": { "type": "string", "format": "date-time" },  
        "observed\_at": { "type": "string", "format": "date-time" }  
      }  
    },  
    "actor\_id": { "type": "string", "format": "uuid" },  
    "payload": {  
      "type": "object",  
      "required": \["fhir\_observation"\],  
      "properties": {  
        "fhir\_observation": {  
          "type": "object",  
          "required": \["resourceType", "status", "code", "subject", "valueQuantity"\],  
          "properties": {  
            "resourceType": { "type": "string", "const": "Observation" },  
            "status": { "type": "string", "enum": \["registered", "preliminary", "final", "amended"\] },  
            "code": {  
              "type": "object",  
              "required": \["coding"\],  
              "properties": {  
                "coding": {  
                  "type": "array",  
                  "items": {  
                    "type": "object",  
                    "required": \["system", "code", "display"\],  
                    "properties": {  
                      "system": { "type": "string" },  
                      "code": { "type": "string" },  
                      "display": { "type": "string" }  
                    }  
                  }  
                }  
              }  
            },  
            "subject": {  
              "type": "object",  
              "required": \["reference"\],  
              "properties": { "reference": { "type": "string" } }  
            },  
            "valueQuantity": {  
              "type": "object",  
              "required": \["value", "unit", "system", "code"\],  
              "properties": {  
                "value": { "type": "number" },  
                "unit": { "type": "string" },  
                "system": { "type": "string" },  
                "code": { "type": "string" }  
              }  
            }  
          }  
        }  
      }  
    }  
  }  
}

#### **5\. DiagnosisAsserted Event Schema**

JSON  
{  
  "$schema": "http://json-schema.org/draft-07/schema\#",  
  "title": "DiagnosisAssertedEvent",  
  "type": "object",  
  "required": \[  
    "event\_id",  
    "aggregate\_id",  
    "event\_type",  
    "temporal\_metadata",  
    "actor\_id",  
    "payload"  
  \],  
  "properties": {  
    "event\_id": { "type": "string", "format": "uuid" },  
    "aggregate\_id": { "type": "string", "format": "uuid" },  
    "event\_type": { "type": "string", "const": "DiagnosisAsserted" },  
    "temporal\_metadata": {  
      "type": "object",  
      "required": \["system\_at", "observed\_at"\],  
      "properties": {  
        "system\_at": { "type": "string", "format": "date-time" },  
        "observed\_at": { "type": "string", "format": "date-time" }  
      }  
    },  
    "actor\_id": { "type": "string", "format": "uuid" },  
    "payload": {  
      "type": "object",  
      "required": \["fhir\_condition"\],  
      "properties": {  
        "fhir\_condition": {  
          "type": "object",  
          "required": \["resourceType", "clinicalStatus", "code", "subject"\],  
          "properties": {  
            "resourceType": { "type": "string", "const": "Condition" },  
            "clinicalStatus": {  
              "type": "object",  
              "required": \["coding"\],  
              "properties": {  
                "coding": {  
                  "type": "array",  
                  "items": {  
                    "type": "object",  
                    "required": \["system", "code"\],  
                    "properties": {  
                      "system": { "type": "string" },  
                      "code": { "type": "string" }  
                    }  
                  }  
                }  
              }  
            },  
            "code": {  
              "type": "object",  
              "required": \["coding"\],  
              "properties": {  
                "coding": {  
                  "type": "array",  
                  "items": {  
                    "type": "object",  
                    "required": \["system", "code", "display"\],  
                    "properties": {  
                      "system": { "type": "string" },  
                      "code": { "type": "string" },  
                      "display": { "type": "string" }  
                    }  
                  }  
                }  
              }  
            },  
            "subject": {  
              "type": "object",  
              "required": \["reference"\],  
              "properties": { "reference": { "type": "string" } }  
            }  
          }  
        }  
      }  
    }  
  }  
}

#### **6\. ServiceRequested Event Schema**

JSON  
{  
  "$schema": "http://json-schema.org/draft-07/schema\#",  
  "title": "ServiceRequestedEvent",  
  "type": "object",  
  "required": \[  
    "event\_id",  
    "aggregate\_id",  
    "event\_type",  
    "temporal\_metadata",  
    "actor\_id",  
    "payload"  
  \],  
  "properties": {  
    "event\_id": { "type": "string", "format": "uuid" },  
    "aggregate\_id": { "type": "string", "format": "uuid" },  
    "event\_type": { "type": "string", "const": "ServiceRequested" },  
    "temporal\_metadata": {  
      "type": "object",  
      "required": \["system\_at", "observed\_at"\],  
      "properties": {  
        "system\_at": { "type": "string", "format": "date-time" },  
        "observed\_at": { "type": "string", "format": "date-time" }  
      }  
    },  
    "actor\_id": { "type": "string", "format": "uuid" },  
    "payload": {  
      "type": "object",  
      "required": \["fhir\_service\_request"\],  
      "properties": {  
        "fhir\_service\_request": {  
          "type": "object",  
          "required": \["resourceType", "status", "intent", "code", "subject"\],  
          "properties": {  
            "resourceType": { "type": "string", "const": "ServiceRequest" },  
            "status": { "type": "string", "enum": \["draft", "active", "on-hold", "completed", "revoked"\] },  
            "intent": { "type": "string", "enum": \["proposal", "plan", "order", "original-order"\] },  
            "code": {  
              "type": "object",  
              "required": \["concept"\],  
              "properties": {  
                "concept": {  
                  "type": "object",  
                  "required": \["coding"\],  
                  "properties": {  
                    "coding": {  
                      "type": "array",  
                      "items": {  
                        "type": "object",  
                        "required": \["system", "code", "display"\],  
                        "properties": {  
                          "system": { "type": "string" },  
                          "code": { "type": "string" },  
                          "display": { "type": "string" }  
                        }  
                      }  
                    }  
                  }  
                }  
              }  
            },  
            "subject": {  
              "type": "object",  
              "required": \["reference"\],  
              "properties": { "reference": { "type": "string" } }  
            }  
          }  
        }  
      }  
    }  
  }  
}

## **Local-First Synchronization Engine and CRDT Topology**

To fulfill the operational mandate of total availability during WAN partitions, edge clients execute as fully functional local nodes. Local storage uses WebAssembly-compiled SQLite embedded within the client binary or browser runtime, paired with a memory-mapped operation graph1.

### **Topology and Pipeline Architecture**

The synchronization framework relies on a multi-tiered topology:

> * **Local Edge Engine**: Runs WebAssembly (WASM) modules encapsulating an embedded SQLite database and a local CRDT document model (LoroDoc or Yrs)1. UI interactions append directly to local SQLite event tables and mutate the local memory-mapped CRDT document instance, achieving interactive rendering latencies well under 10 milliseconds1.  
> * **Central Event Hub**: Utilizes EventStoreDB or Apache Kafka cluster deployments acting as global event aggregators and long-term storage vaults1.  
> * **Dual Transport Layer**: Maintains real-time streaming using WebSockets over TLS 1.3 when connected to central infrastructure. When WAN connectivity drops, edge clients fall back to an intra-clinic peer-to-peer (P2P) mesh network running WebRTC DataChannels over local mDNS peer discovery10.

The synchronization pipeline executes through distinct state phases designed to minimize overhead and prevent lock contention across nodes.

| Phase | Processing Scope | Primary Data Payload | Network Requirements |
| :---- | :---- | :---- | :---- |
| **1\. Local Commit** | On-Device WASM Engine | Immutable Event Row & Local Vector Clock | Local Offline Execution |
| **2\. P2P Intra-Mesh** | Local Subnet (WebRTC / mDNS) | State Vector Delta (![][image1]) & Cryptographic Signatures | Local Area Network (No WAN Required)10 |
| **3\. Central Ingestion** | Cloud Event Cluster | Compressed Batch Event Stream & Merkle Leaf Hashes | Active WAN / Internet Stream |
| **4\. Projection Materialization** | Central Read Models | Reconciled HL7 FHIR R5 Resources & Analytics Read Models | Central Database Execution |

### **CRDT Data Structures and Convergence Formalisms**

Collaborative charting requires real-time concurrent text editing and state merging without centralized lock coordination. Traditional Last-Write-Wins (LWW) conflict resolution is unacceptable for clinical narratives because concurrent modifications by different team members would result in invisible data destruction.  
The charting framework utilizes **Loro CRDTs** based on Directed Acyclic Graph (DAG) Version Vectors combined with the Fugue sequence algorithm8. Each local node maintains a state representation governed by a vector clock:  
![][image2]  
where ![][image3] represents the continuous operation counter generated by ![][image4].  
When Node A initiates synchronization with Node B:

> 1. **Vector Exchange**: Node A sends its current Version Vector ![][image5] to Node B8.  
> 2. **Delta Calculation**: Node B evaluates ![][image5] against its DAG frontier vector ![][image6] to extract missing operations8:  
>    ![][image7]  
> 3. **Run-Length Encoding (RLE) Compression**: Node B packs the resulting delta into contiguous byte sequences using Run-Length Encoding to minimize transport payload overhead8.  
> 4. **Deterministic Merge**: Node A applies ![][image8] to its local LoroDoc instance, triggering non-interleaving text inserts and field-level map updates to achieve complete convergence8.

### **Offline-to-Online Reconciliation and Edge Mesh Protocol**

During network partitions, clinic workstations construct a local mesh topology:

> 1. **Subnet Discovery**: Workstations broadcast presence tokens over mDNS (\_pms-sync.\_tcp.local).  
> 2. **Mesh Topology Formation**: Nodes form a peer-to-peer web using WebRTC DataChannels, dynamically electing the workstation with the highest system uptime as the local Mesh Relay10.  
> 3. **Local Mesh Delta Synchronization**: Offline edits are propagated across local workstations via P2P state vector exchanges, ensuring that all clinicians in the physical building view identical patient chart updates regardless of WAN status8.  
> 4. **WAN Re-connection Protocol**: When internet connectivity returns, the Mesh Relay buffers local offline events, calculates a unified Merkle tree delta, and submits a single batch transaction to the central EventStoreDB cluster.  
> 5. **Conflict Resolution Strategy**: If a vector clock collision occurs at the central cluster, the bi-temporal model resolves valid-time sequence ordering while assigning the current transaction time ![][image9] to the newly integrated entries, preserving historical integrity1.

## **Ambient Clinical Extraction Engine Architecture and Implementation**

To eliminate administrative friction, clinical encounters are documented ambiently via dual-channel microphone input. The Ambient Engine ingests dialogue, performs diarization routing, and translates freeform clinical conversations into structured HL7 FHIR R5 JSON payloads without external API latency7.

### **Speech Processing and Diarization Architecture**

Audio input is captured at 16kHz PCM via WebAudio or native audio pipelines. The stream is divided into 100-millisecond audio buffers and directed into a local Whisper speech recognition engine and speaker diarization pipeline:

> * **Acoustic Feature Extraction**: Converts raw PCM streams into mel-spectrogram representations.  
> * **Speaker Diarization Router**: Assigns speaker turns to distinct speaker vectors, identifying SPEAKER\_CLINICIAN and SPEAKER\_PATIENT.  
> * **Dialogue Aggregator**: Assembles chronological, speaker-attributed dialogue frames into a running encounter context window.

### **Grammar-Constrained Decoding Framework**

To guarantee structural validity without network-dependent schema validation steps, the engine uses **grammar-constrained decoding** during local LLM token generation11. By converting HL7 FHIR R5 JSON Schemas into Context-Free Grammars (EBNF/GBNF) or state-machine token masks, the generation pipeline constrains token output probabilities at sampling time11. Tokens that violate schema syntax or LOINC/SNOMED coding value sets are assigned a logit probability of ![][image10], ensuring that generated output strictly adheres to FHIR structural specifications11.

### **Production Scaffolding and In-Process FHIR Validation Code**

The following Python module demonstrates speech frame ingestion simulation, diarization routing, grammar-constrained entity extraction, and instant structural validation against FHIR R5 models using Pydantic.

Python  
import json  
import uuid  
from datetime import datetime, timezone  
from typing import Dict, Any, List, Optional, Tuple  
from pydantic import BaseModel, Field, ValidationError

\# \=====================================================================  
\# HL7 FHIR R5 PYDANTIC STRUCTURE DEFINITIONS (In-Process Validation)  
\# \=====================================================================

class FHIRCoding(BaseModel):  
    system: str  
    code: str  
    display: str

class FHIRCodeableConcept(BaseModel):  
    coding: List\[FHIRCoding\]

class FHIRReference(BaseModel):  
    reference: str

class FHIREncounter(BaseModel):  
    resourceType: str \= Field(default="Encounter", const=True)  
    id: str  
    status: str \= Field(pattern="^(planned|in-progress|on-hold|completed|cancelled)$")  
    class\_code: str \= Field(alias="class")  
    subject: FHIRReference

class FHIRCondition(BaseModel):  
    resourceType: str \= Field(default="Condition", const=True)  
    id: str  
    clinicalStatus: FHIRCodeableConcept  
    code: FHIRCodeableConcept  
    subject: FHIRReference  
    encounter: FHIRReference

class FHIRServiceRequest(BaseModel):  
    resourceType: str \= Field(default="ServiceRequest", const=True)  
    id: str  
    status: str \= Field(pattern="^(draft|active|on-hold|completed|revoked)$")  
    intent: str \= Field(pattern="^(proposal|plan|order|original-order)$")  
    code: FHIRCodeableConcept  
    subject: FHIRReference  
    encounter: FHIRReference

\# \=====================================================================  
\# AMBIENT EXTRACTION ENGINE & CONSTRAINED DECODER MOCK  
\# \=====================================================================

class AmbientAudioChunk(BaseModel):  
    chunk\_id: str  
    speaker\_id: str  \# e.g., "SPEAKER\_CLINICIAN", "SPEAKER\_PATIENT"  
    pcm\_bytes\_base64: str  
    timestamp: str

class ExtractedClinicalEntities(BaseModel):  
    encounter: FHIREncounter  
    conditions: List\[FHIRCondition\]  
    service\_requests: List\[FHIRServiceRequest\]

class GrammarConstrainedExtractor:  
    """  
    Simulates local constrained LLM execution leveraging token logit  
    masking against FHIR R5 schema state machines.  
    """  
    def \_\_init\_\_(self, patient\_id: str):  
        self.patient\_id \= patient\_id  
        self.current\_encounter\_id \= f"Encounter/{uuid.uuid4()}"

    def decode\_dialogue\_to\_fhir(self, transcript\_history: List\[Tuple\[str, str\]\]) \-\> Dict\[str, Any\]:  
        """  
        Executes logit-masked token generation mapping dialogue to JSON.  
        Returns guaranteed structurally valid FHIR payload dictionaries.  
        """  
        \# Mocking constrained decoding output based on ingested dialogue context  
        return {  
            "encounter": {  
                "resourceType": "Encounter",  
                "id": self.current\_encounter\_id.split("/")\[1\],  
                "status": "in-progress",  
                "class": "AMB",  
                "subject": {"reference": f"Patient/{self.patient\_id}"}  
            },  
            "conditions": \[  
                {  
                    "resourceType": "Condition",  
                    "id": str(uuid.uuid4()),  
                    "clinicalStatus": {  
                        "coding": \[{  
                            "system": "http://terminology.hl7.org/CodeSystem/condition-clinical",  
                            "code": "active",  
                            "display": "Active"  
                        }\]  
                    },  
                    "code": {  
                        "coding": \[{  
                            "system": "http://snomed.info/sct",  
                            "code": "38341003",  
                            "display": "Essential hypertension"  
                        }\]  
                    },  
                    "subject": {"reference": f"Patient/{self.patient\_id}"},  
                    "encounter": {"reference": self.current\_encounter\_id}  
                }  
            \],  
            "service\_requests": \[  
                {  
                    "resourceType": "ServiceRequest",  
                    "id": str(uuid.uuid4()),  
                    "status": "active",  
                    "intent": "order",  
                    "code": {  
                        "coding": \[{  
                            "system": "http://loinc.org",  
                            "code": "2093-3",  
                            "display": "Cholesterol in Blood"  
                        }\]  
                    },  
                    "subject": {"reference": f"Patient/{self.patient\_id}"},  
                    "encounter": {"reference": self.current\_encounter\_id}  
                }  
            \]  
        }

class AmbientExtractionPipeline:  
    def \_\_init\_\_(self, patient\_id: str):  
        self.patient\_id \= patient\_id  
        self.extractor \= GrammarConstrainedExtractor(patient\_id=patient\_id)  
        self.transcript\_buffer: List\[Tuple\[str, str\]\] \= \[\]

    def process\_audio\_chunk(self, chunk: AmbientAudioChunk) \-\> None:  
        """  
        Ingests audio frames and applies speaker diarization routing.  
        """  
        role \= "Doctor" if chunk.speaker\_id \== "SPEAKER\_CLINICIAN" else "Patient"  
        simulated\_text \= (  
            "We will check your blood pressure and order a lipid panel."  
            if role \== "Doctor"  
            else "I have been experiencing persistent chest tightness."  
        )  
        self.transcript\_buffer.append((role, simulated\_text))

    def extract\_and\_validate(self) \-\> ExtractedClinicalEntities:  
        """  
        Executes constrained decoding and performs instant in-process validation.  
        """  
        raw\_fhir\_dict \= self.extractor.decode\_dialogue\_to\_fhir(self.transcript\_buffer)  
          
        try:  
            validated\_encounter \= FHIREncounter(\*\*raw\_fhir\_dict\["encounter"\])  
            validated\_conditions \= \[FHIRCondition(\*\*c) for c in raw\_fhir\_dict\["conditions"\]\]  
            validated\_services \= \[FHIRServiceRequest(\*\*s) for s in raw\_fhir\_dict\["service\_requests"\]\]  
              
            return ExtractedClinicalEntities(  
                encounter=validated\_encounter,  
                conditions=validated\_conditions,  
                service\_requests=validated\_services  
            )  
        except ValidationError as err:  
            raise RuntimeError(f"FHIR R5 Structural Validation Error: {err.json()}")

\# \=====================================================================  
\# VERIFICATION EXECUTION  
\# \=====================================================================

if \_\_name\_\_ \== "\_\_main\_\_":  
    patient\_id \= str(uuid.uuid4())  
    pipeline \= AmbientExtractionPipeline(patient\_id=patient\_id)

    \# Ingest dual-channel ambient audio frames  
    pipeline.process\_audio\_chunk(AmbientAudioChunk(  
        chunk\_id="chk\_101", speaker\_id="SPEAKER\_PATIENT",   
        pcm\_bytes\_base64="...", timestamp=datetime.now(timezone.utc).isoformat()  
    ))  
    pipeline.process\_audio\_chunk(AmbientAudioChunk(  
        chunk\_id="chk\_102", speaker\_id="SPEAKER\_CLINICIAN",   
        pcm\_bytes\_base64="...", timestamp=datetime.now(timezone.utc).isoformat()  
    ))

    \# Extract entities and validate against FHIR R5 definitions  
    extracted\_entities \= pipeline.extract\_and\_validate()  
    print("In-Process Validation Succeeded.")  
    print(f"Validated Encounter ID: {extracted\_entities.encounter.id}")  
    print(f"Extracted Condition SNOMED Code: {extracted\_entities.conditions\[0\].code.coding\[0\].code}")  
    print(f"Extracted ServiceRequest LOINC Code: {extracted\_entities.service\_requests\[0\].code.coding\[0\].code}")

## **Probabilistic Dynamic Scheduling Algorithm and Queue Optimization**

Traditional clinical scheduling systems rely on fixed time allocations, producing severe schedule drift when appointments overrun or patients arrive late6. The dynamic scheduling engine models procedure variance, arrival punctuality distributions, and clinician fatigue factors to continuously re-balance appointment queues.

### **Mathematical Formulation**

The dynamic queue engine evaluates system variables using continuous probabilistic distributions:

> 1. **Patient Arrival Punctuality ![][image11]**: Modeled as a Gaussian probability distribution over arrival offset ![][image12]6:  
>    ![][image13]  
> 2. **Procedure Duration Variance ![][image14]**: Procedure execution length follows a log-normal distribution to account for non-negative, right-skewed surgical and clinical procedure times:  
>    ![][image15]  
> 3. **Clinician Burnout and Fatigue Factor ![][image16]**: A scaling multiplier modeling clinical slowdown as a function of continuous working hours ![][image17]:  
>    ![][image18]  
>    where ![][image19] represents the clinician-specific fatigue sensitivity index and ![][image20] is the reference shift length.  
> 4. **Dynamic Expected Duration ![][image21]**: Combining base procedure parameters, duration variance buffers, and current fatigue state yields:  
>    ![][image22]  
> 5. **Queue Overrun Risk Metric ![][image23]**: Represents the probability that remaining queue activities will exceed operational facility limits ![][image24]:  
>    ![][image25]

### **Python Dynamic Queue Optimizer Implementation**

The following engine calculates duration expectations, computes delay risk, and triggers automated queue re-balancing via a deterministic state machine.

Python  
import math  
from typing import List, Optional  
from dataclasses import dataclass

@dataclass  
class AppointmentSlot:  
    appointment\_id: str  
    patient\_id: str  
    base\_duration\_minutes: float  
    procedure\_variance: float  
    historical\_punctuality\_mean: float  \# Negative \= early, Positive \= late  
    scheduled\_start\_minute: float  
    actual\_start\_minute: Optional\[float\] \= None  
    actual\_end\_minute: Optional\[float\] \= None

class DynamicQueueOptimizer:  
    """  
    Probabilistic queue optimizer adjusting remaining time allocations  
    based on punctuality distributions, duration variance, and fatigue coefficients.  
    """  
    def \_\_init\_\_(self, alpha\_fatigue: float \= 0.12, baseline\_hours: float \= 4.0):  
        self.alpha \= alpha\_fatigue  
        self.T0 \= baseline\_hours \* 60.0  \# Convert to minutes

    def calculate\_fatigue\_factor(self, active\_shift\_minutes: float) \-\> float:  
        """  
        Calculates beta(t) \= 1 \+ alpha \* ln(1 \+ t / T0)  
        """  
        return 1.0 \+ self.alpha \* math.log(1.0 \+ max(0.0, active\_shift\_minutes) / self.T0)

    def predict\_slot\_duration(self, slot: AppointmentSlot, current\_shift\_minutes: float) \-\> float:  
        """  
        Calculates E\[D\_actual\] adjusting for log-normal variance and fatigue.  
        """  
        beta \= self.calculate\_fatigue\_factor(current\_shift\_minutes)  
        mu\_proc \= math.log(slot.base\_duration\_minutes)  
        expected\_base \= math.exp(mu\_proc \+ (slot.procedure\_variance / 2.0))  
        return expected\_base \* beta

    def optimize\_schedule(self, slots: List\[AppointmentSlot\], current\_shift\_minutes: float) \-\> List\[AppointmentSlot\]:  
        """  
        Deterministic state-machine adjusting scheduled start times to prevent queue overrun.  
        """  
        rebalanced\_slots: List\[AppointmentSlot\] \= \[\]  
        accumulated\_time \= current\_shift\_minutes

        for slot in slots:  
            if slot.actual\_end\_minute is not None:  
                accumulated\_time \= slot.actual\_end\_minute  
                rebalanced\_slots.append(slot)  
                continue

            \# Calculate arrival delta and duration expectation  
            expected\_arrival\_delta \= slot.historical\_punctuality\_mean  
            expected\_duration \= self.predict\_slot\_duration(slot, accumulated\_time)

            \# Adjust start time based on upstream queue progress  
            adjusted\_start \= max(accumulated\_time, slot.scheduled\_start\_minute \+ expected\_arrival\_delta)  
            delay\_drift \= adjusted\_start \- slot.scheduled\_start\_minute

            \# State Machine Action: Trigger automated schedule compression if drift exceeds tolerance  
            if delay\_drift \> 15.0:  
                \# Buffer optimization rule: compress expected duration by 10% via administrative task delegation  
                expected\_duration \*= 0.90

            slot.scheduled\_start\_minute \= adjusted\_start  
            accumulated\_time \= adjusted\_start \+ expected\_duration  
            rebalanced\_slots.append(slot)

        return rebalanced\_slots

\# \=====================================================================  
\# SIMULATION VERIFICATION  
\# \=====================================================================

if \_\_name\_\_ \== "\_\_main\_\_":  
    optimizer \= DynamicQueueOptimizer()  
      
    initial\_queue \= \[  
        AppointmentSlot("apt\_01", "pat\_101", 30.0, 0.05, \-2.0, 0.0, 0.0, 38.0), \# Completed 8 mins late  
        AppointmentSlot("apt\_02", "pat\_102", 20.0, 0.10, 8.0, 30.0),            \# Patient historically 8 mins late  
        AppointmentSlot("apt\_03", "pat\_103", 45.0, 0.18, 0.0, 50.0)  
    \]

    rebalanced \= optimizer.optimize\_schedule(initial\_queue, current\_shift\_minutes=38.0)  
      
    print("Re-balanced Schedule Allocations:")  
    for slot in rebalanced:  
        print(f"Appointment {slot.appointment\_id} \-\> Adjusted Start: Minute {slot.scheduled\_start\_minute:.1f}")

## **Security, Access Control, and Regulatory Compliance Framework**

Protecting clinical data across local-first offline environments requires strict access control models, zero-knowledge encryption, tamper-evident logging, and national regulatory integration2.

### **Field and Event Level Access Control (RBAC/ABAC)**

Access rights are determined by an Attribute-Based Access Control (ABAC) engine that evaluates context attributes at runtime2. Request evaluations inspect user roles, patient consent policies, emergency override statuses, and connection network types before granting access to unencrypted payloads2.

Attribute Request Evaluation Flow:

Incoming Request Context  
  ├── Actor Attributes: Physician Role, User ID, Emergency Credentials  
  ├── Resource Attributes: Patient Sensitivity Tier, Consent Scope  
  ├── Action Attributes: Read, Append, Decrypt, Export  
  └── Environmental Attributes: Purpose of Use (CAREMGT / ETREAT), Device Location, Time  
            │  
            ▼  
┌────────────────────────────────────────────────────────┐  
│             ABAC Policy Evaluation Engine              │  
└───────────────────────────┬────────────────────────────┘  
                            │  
            ┌───────────────┴───────────────┐  
            ▼                               ▼  
    \[ PERMIT ACCESS \]               \[ DENY ACCESS \]  
    Decrypt Field Payload          Mask Sensitive Payload  
    Emit Audit Log Entry           Emit Security Alert

Attribute-based permissions govern granular access across system roles:

| Data Element | Role: Attending Physician | Role: Triage Nurse | Role: Billing Specialist | Role: Patient |
| :---- | :---- | :---- | :---- | :---- |
| **Demographics** | Full Access | Full Access | Full Access | Full Access |
| **Vitals & Observations** | Full Access | Full Access | Denied | Full Access |
| **Clinical Encounter Notes** | Full Access | Read-Only | Denied | Read-Only |
| **Psychiatric Notes** | Consent Explicit4 | Denied | Denied | Consent Explicit4 |
| **Billing & CPT Codes** | Read-Only | Denied | Full Access | Read-Only |

### **Field-Level Envelope Encryption via HPKE**

To enforce zero-knowledge privacy at rest and across untrusted synchronization transports, sensitive data fields undergo individual envelope encryption using **Hybrid Public Key Encryption (HPKE \- RFC 9180\)**12.

> * **Key Encapsulation Mechanism (KEM)**: Uses Curve25519 (X25519) public key cryptography to establish shared secrets without online key distribution handshakes12.  
> * **Authenticated Encryption with Associated Data (AEAD)**: Employs AES-256-GCM or ChaCha20-Poly1305 for symmetric payload encryption using unique per-field nonces12.  
> * **Encapsulated Envelope JSON Payload**: Unencrypted database columns retain indexable metadata, while clinical contents are stored in encrypted envelopes12:

JSON  
{  
  "field\_name": "clinical\_impression",  
  "encapsulated\_key": "base64\_encoded\_hpke\_kem\_ct...",  
  "ciphertext": "base64\_encoded\_aead\_ciphertext...",  
  "auth\_tag": "base64\_encoded\_poly1305\_tag..."  
}

### **Deterministic Merkle Tree Cryptographic Audit Logging**

All system events are chained immutably using a SHA-256 Merkle DAG construction1. The hash ![][image26] of event record ![][image27] is computed sequentially:  
![][image28]  
Any modification of a historical event breaks the downstream hash chain, rendering tampering immediately detectable during validation audits1. Periodic root hashes (![][image29]) are anchored to external transparency ledgers or notarization authorities to guarantee tamper-proof audit trails1.

### **ABDM Integration and National Compliance Lifecycle**

The system natively supports national digital health specifications, such as India's Ayushman Bharat Digital Mission (ABDM), across all key compliance milestones2:

> 1. **Milestone 1 (M1 \- Identity Verification)**: Automates ABHA (Ayushman Bharat Health Account) creation, Aadhaar/mobile OTP verification, and linkage to national Health Facility (HFR) and Health Professional (HPR) registries2.  
> 2. **Milestone 2 (M2 \- Discovery & Care Context Binding)**: Translates local encounters into linkable Care Context tokens (e.g., OP-2026-00412)3. When discovery requests arrive via the ABDM Gateway, the system confirms context matches without exposing underlying medical data13.  
> 3. **Milestone 3 (M3 \- Consent-Gated Data Transfer)**:  
   * **Consent Artefact Validation**: Validates digitally signed consent artifacts from the Consent Manager, checking purpose codes (CAREMGT, ETREAT), date ranges, and access permissions prior to bundle generation4.  
   * **Fidelius Encryption**: Packages requested clinical records into NRCeS-compliant FHIR R4/R5 bundles, encrypting the payload using Fidelius/HPKE key pairs before transmitting encrypted payloads to the requesting Health Information User (HIU)4.  
   * **Automated Retention Purging (dataEraseAt)**: Reads the dataEraseAt expiration timestamp inside granted consent artifacts14. Local projected read models schedule background cleanup jobs that securely erase expired datasets once the timestamp passes14.

## **Architectural Synthesis and System Characteristics**

This technical specification replaces brittle centralized architectures with an autonomous, mathematically verifiable, local-first system.

| Architectural Dimension | Legacy Relational HIS | Local-First Event-Sourced PMS |
| :---- | :---- | :---- |
| **Interactive UI Latency** | 200ms \- 2000ms (Network bound) | **\<10ms** (Local WASM & SQLite execution)1 |
| **Partition Capability** | Read-only or completely unavailable | **100% Read/Write Capability** via CRDT sync8 |
| **Data Capture Overhead** | High (Manual form filling & mandatory inputs) | **Zero Manual Entry** (Ambient constrained audio extraction)11 |
| **Historical Traceability** | Limited (Database trigger logs / overrides) | **Complete Bi-Temporal Event History** \[cite: 1\] |
| **Data Encryption & Privacy** | At-rest disk encryption (Key exposed in memory) | **Field-Level Zero-Knowledge Envelope Encryption (HPKE)** \[cite: 12\] |
| **Interoperability Standard** | Proprietary interfaces / Batch HL7 v2 | **Native Event-Driven HL7 FHIR R5 Projections** \[cite: 1\] |

By implementing local-first event sourcing, CRDT-driven convergence, grammar-constrained ambient extraction, and field-level cryptographic controls, this architecture establishes a resilient platform capable of operating without interruption across any clinical environment.

#### **Works cited**

> 1. Data structures — list of Rust libraries/crates // Lib.rs, [https://lib.rs/data-structures](https://lib.rs/data-structures)  
> 2. ABDM Compliance for Hospitals (2026 Guide) \- Lifemaan, [https://www.lifemaan.com/blog/abdm-compliance-for-hospitals/](https://www.lifemaan.com/blog/abdm-compliance-for-hospitals/)  
> 3. ABDM FHIR Integration Guide 2026: How to Make Your HMS ABDM Compliant \- Adrine, [https://www.adrine.in/blog/abdm-fhir-integration-guide-2026](https://www.adrine.in/blog/abdm-fhir-integration-guide-2026)  
> 4. How Clinical Data Actually Flows Under ABDM: A Guide for Health IT Teams, [https://caladriushealth.ai/blog/2026/06/19/How-Records-Move/](https://caladriushealth.ai/blog/2026/06/19/How-Records-Move/)  
> 5. Artifacts Summary \- Scalable Consent Management v1.0.0-preview \- FHIR specification, [https://build.fhir.org/ig/HL7/fhir-consent-management/artifacts.html](https://build.fhir.org/ig/HL7/fhir-consent-management/artifacts.html)  
> 6. Appointment scheduling algorithm considering routine and urgent patients \- ResearchGate, [https://www.researchgate.net/publication/260439880\_Appointment\_scheduling\_algorithm\_considering\_routine\_and\_urgent\_patients](https://www.researchgate.net/publication/260439880_Appointment_scheduling_algorithm_considering_routine_and_urgent_patients)  
> 7. (PDF) HealthCare 5.0: An Industry 5.0 Perspective for Next-Generation Medical Systems with Synergistic Integration of IoT, AI, and 6G \- ResearchGate, [https://www.researchgate.net/publication/397408667\_HealthCare\_50\_An\_Industry\_50\_Perspective\_for\_Next-Generation\_Medical\_Systems\_with\_Synergistic\_Integration\_of\_IoT\_AI\_and\_6G](https://www.researchgate.net/publication/397408667_HealthCare_50_An_Industry_50_Perspective_for_Next-Generation_Medical_Systems_with_Synergistic_Integration_of_IoT_AI_and_6G)  
> 8. Docs \- Loro CRDT, [https://loro.dev/docs](https://loro.dev/docs)  
> 9. Yjs | Homepage, [https://yjs.dev/](https://yjs.dev/)  
> 10. A Collaborative Editor \- Yjs Docs, [https://docs.yjs.dev/getting-started/a-collaborative-editor](https://docs.yjs.dev/getting-started/a-collaborative-editor)  
> 11. Constrained decoding: forcing LLM output to a grammar \- ZeroEntropy, [https://zeroentropy.dev/concepts/constrained-decoding/](https://zeroentropy.dev/concepts/constrained-decoding/)  
> 12. Hybrid Public Key Encryption (HPKE) \- PyCryptodome's documentation, [https://pycryptodome.readthedocs.io/en/v3.22.0/src/protocol/hpke.html](https://pycryptodome.readthedocs.io/en/v3.22.0/src/protocol/hpke.html)  
> 13. ABDM HIP Integration from Scratch: M2 Certification and Health Records Push Guide, [https://nirmitee.io/blog/building-abdm-hip-from-scratch-m2-flow-reference-architecture/](https://nirmitee.io/blog/building-abdm-hip-from-scratch-m2-flow-reference-architecture/)  
> 14. ABDM HIU Integration from Scratch: M3 Certification and Health Records Pull Guide, [https://nirmitee.io/blog/building-abdm-hiu-from-scratch-m3-flow-reference-architecture/](https://nirmitee.io/blog/building-abdm-hiu-from-scratch-m3-flow-reference-architecture/)  
> 15. Home \- FHIR Implementation Guide for ABDM v6.5.0 \- NRCeS, [https://nrces.in/ndhm/fhir/r4/](https://nrces.in/ndhm/fhir/r4/)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAWCAYAAAAfD8YZAAAAi0lEQVR4Xu2SUQ2AMAwFqwELeEELWnCABJzgAAcYQAD0ICWhwNZ9wyUvS7p1t2QV+fG0msYXI9SaVTP7jQiDZpHjAl4QBitGnlxsx2q2UQrsZjVoCtt7uVtozNorzeSLErR38n570o6VA6xPJO1YSYpHe85qmJ3vO8HINFHMhWayzzw2G8OSXOxfYQNsOjvCMTU/vAAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAnCAYAAACylRSjAAAFBklEQVR4Xu3bjZHjVBBFYcdACsRACqRACqRACmRACIRABmRABiRAADCHrVvV1fST5R8NWvt8Va71SrL0XlvevvM8e7lIkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiT9T775ePz18fil73iy7/uGF/ftx+O7vlF3oZZn8ePH4+/L8Z8XSdKJ8A9/Hn8sth/t18uX0Nbl+j+UbTzP9r1hhKDW53dWmVutR7YRavf6+fLeTX26f6lF37bHPa85Wu5pSdIb+f3y39Wn39rfj8T1J6wk/HT50pjqCsef5flezK8Gv7MivDLfOkfGzvZb9eD3bhLuq36f75HwezZnHJMk6UA0pB5mzhDYCCmsovWVonvCC3P8GsILq4DUozZjQivh9VZfw4ri0ahlvbep5a04xxlraWCTpDdDQ6uBiHDzmVaBLaExq07Rf5+IIMaxzKN+bcgqFXPhz/p6QmCOX117wjm2ghPj4HzU8t4Gn0DBmDPP6Vzs51j21QCb7dShBhXqwHa27V1l6nWbMN9H53yE+j7VFdo+Ro5jntSl7mN7XeFNLXM/9eP3uFZL7kvey9TzmmvnkyS9GBp4gguNbdWItlao0rinx9ZqHedcfcWZ8JJVtgmvr+Ot80jwpPHW19dQtzrvpDburo5jT9BZye/lMfc07b6iyHxyHO9drlXDWP29QJ7XOe8N5Mxn6/fmOH/G9sicj1BrxrioZQJRxb5aS2rIo86F56kl9Uj421vH2KoPY0itOS738ZbV50aS9MLSTFY/2RMgbm1Q19AgaTp7VnwIKTTbhLhg3DUQEjJoqLU50vzS3NjH876K8egKUR8HqNeexht95ZBzMu9peyRc9FDanyc4p36MjbpT03vm3WscXKOH6M/G2Op7kRVattVa5iv3oJb5fbV6nyXkZfWLB/u3foC5Vb/mXoS8ft9Jkl4YDWP1Ezthhua0FdjYt3pca0RTqJleM42RbTXw8fdphYRAk5BS51Eb+Nb8sBUs+zhy3uk10zb0xktdplBU61XDZ46toYNr9XMwNrYTVlbBC+xb/U/c1XmpM/JnTHPuQTSmIDQdOx0H6tjHTY366lq/73Jv1XlRS65NLfvxkZVNjpnu25hqEFMt62eojx39NZKkN8A//j0wRJrQqmE9ajrvtI0x9sbFCkOCFk2aoFBDCE2d5wkpINwE10njvxbYEoImjCP7uE7GPzXpqdEyvv71Yw+eUY9jJYvxM+8cy/4Eucw/c8yxwZxXq2GcZ7o+OE8dR50z6nPqMp2H1/dgxbHTfTgdy3HT+8GxPcxRyx4imXv92jh1SL3q15TMh9fXOuZeTA1T65Vr++rX4flKO6+Z7s2t80mSXhQNbUKTohn3hvxMzzhvb+aoYakHp+n4qSneqp+3X/dZOG8PJcj1+z4CYd+WY6fVq70YR59zD0ZHevTeqUG+qjWp81sdX4PfvThHvS73Y3646GEeBjZJ0r/qKgKOahCPNt1neUZg66bmvgrHn4n3lhUqxvfMeRNuEvCrHhafZVph+2xbPxg8gs8F9woPnve5HvV5lCRplF/2Pqqpn01fkXp1vK9HrLo9Mxw9ot63z7yHt85L2J5W3SRJOhRf/ZxlpU06Mz4r+c8QkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiTpXf0Dx2VPqRYODJcAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAaCAYAAABozQZiAAAAu0lEQVR4Xu2SYQ3CQAxGq2EW0ICCJVjAAhawgINJQAIOcICDGUAA9NE16XV3ycFPspc02639el/vJrKx8QM7jZPGUWNIuSYU3pdAOGk8iooGCCm8hm+zxiusmyCiMNo8izlwyF3C+gMzIrzlRGIvNkrBQUy86tqDi3lmcAXYZzR2L2CWp9iMEZpx8qPY1WG56o7OnK4XIOKdxu6IvDupQuHKmljzrjuvwU1gndG6/zoHMWPkc+nm6x3/kTdkXCEE3s0g8AAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADcAAAAaCAYAAAAT6cSuAAAB8klEQVR4Xu2WDVFDMRCEowELaMACFrCABSzgAAlIwAEOcICBCoD39bHT7TZ5fbSBGUp2JtM0l9zv3rWlDAwM/GfcTOs6D3vhdloftt72xVtw5nde9sUn4bXs9N2FrDuep7UpszGymcABHLpKwRl4LLO9njqroDr3ZTZGoAkcQd4TJKvGlK6A81CNDKp6mU3kvXsDO0952BtU5OFrjzGMUinHsQwTONSlh1tJ4BxbutfqN+nibib524CG6jMUY/R9J97KalQVSIhozaL6SWHdwWnvb3eePTLXhR9nBZhVgYKeVaqazgo4kw7koCAwgvE7vHG7yPievtCXVPkkqN8cogyKQavfNICSWgoOPdKVvZVneiNdBEtSM1hY1Er0AbzfHGQWYwSVBgTuUJGE+pbAqCx7/3lRwO6kdJFQFu9qQYiuq+D95lBVCKzVb15dB28UNPJMgKrkbGjpOgs+OBz+s9DKFLKcqhpIOifQdJrvsquWaAWHH+pVGEaiVw0Y+N2iHBC9av0GRCFBQ8ErrekniBFyUu/zHsAucphFYGqRxQEjzvvKoQBQ1qoswKiCoVLss5IKmERxj08WeqmaHFWgnKGDTx9k3Dvmz4+AIBezWQ7//bOvMWJJlxJzkWAGkJBkx0WA4AisVdk/j1WTcmBg4HfwCT8bos+kxCKyAAAAAElFTkSuQmCC>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaCAYAAACtv5zzAAAA8UlEQVR4Xu2UYQ3CMBCFTwMW0IAFLGABC1jAARKQgAMc4AADEwB82V7S3go9OsKvfkmzpN3u3b27zqzT+RWX13q4dcreMDsmZ6xrfhyDDwe/mXCwMfDKH0RRdiUIepuezZAdAqUgWEQFi5DA1u2vp7PF0FgEdm6f4Bu314QmhafY23yiSoQSIFgqEG0sFYcsxPt0xs82t8ujJN5NXwbNlABiXMAaVKvKQ+gukBWCn+AcAVUe4m7jy5GZp/lYpMr9eBfBHrKvQTAEeKqCkABNjYwcA6DgXwlEwHefBNam96cJvNavPe0RVvEXxtraWHf+zBMwRkHyuP4a1AAAAABJRU5ErkJggg==>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAAaCAYAAABCfffNAAABAElEQVR4Xu2TbRHCMAyGowELaMACFrCABSzMARKQgAMc4AADCIA9sNxlaUq3FfjV5663XdrmTfMh0mj8mnO/Hm4dRydEOrPHuoy3p8PluzcaDvJ2vvIbc9AoI3B8Hb5VECUikSPSxUuqUZGts6+Hva9AsRHZOTsCG2dbjHYQX2UvaadVgUMrkis26eMMewTAP4tR8FlIoBZ2Bk6Sv4SQbxKC/DQCL/QiIggSWQ4c8hIL3VcUAZ0VHCCag1faWtEYN0k7M4SDiJRmgnO8lFogyOtzqU3gsE+DJ6qH2ia1OtGUDkb1QDCascX4eqgtavfZkBKc00GkVeeDf0SqBRr/4QnZjUk2B3jsgAAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAApCAYAAACIn3XTAAAFNElEQVR4Xu3cza0rRRRFYcdACoSASIEUSIEBCZACGZAAEiGQAQPmzBkwYEoAcJd0t3R0ONXdbuxrm7c+qeXn/q2qbulsVfu+y0WSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEn/8vnb8llfqdMYz0/JV32FJEnP7BUL1x/vyypk0KevL+vtr+S7vqKhryzp69n7+UtfsSHj+xGB+V7X+Olt+buvlCTpGaVofdM3PLnv+4p3hDj6FF++LX+V74/EGNfwRRDZG3v6M4UK+sW2Hs7YdzU2e44ENsay9oG2T+27lb2wCq7PeFR87+tWzo6XJEkfghmZBAI+X8lUZCnQNawF6+4x08b1Mrt1BO3oIYKQtBUof7vMgYhj2NaxLzNfZ+wFNsLZFC7v9ewwrr+/f26hz32fn9v3LdOzJEnS00ihvfcsyT30Isv3VR/Ylv3pa4r7mVd67L8XbCYExql9W+0mdNDWvr32pzvTttg6lm29HcG2jGkNdPz7zPhmVu2Hy7Hw2WcVCbLXXHc1lpIkPYVaXAlv0+zJs+pFlhmnVaCg8Gd/wgB9JQzR32uLe0LUtVaheBXYuEZm5Op22kpfVzOGq/VHbAU22jDN6IH1GRPGl3YzTvRtdcxKnRk7eixt4x7HkdeoVX+WJEl6GlORovD10MZ3Cjn7UxTzyrEWyI7QsPWa779gxmV6BdeLdmRmi6BD+MnvxoJ/bwWVjmvkNWhd9tDmaUy4/hTY6v2p26eAR59qWxJA6TuhJ4G1hqHJ1jhwzWm2qwbRjO+q7Xs4Vx3fb98/+2vkrt7DrT6s7hP3ZXp2JEl6KIrqKvRM62sxy/apeMc9//qOADIVZa43hdAecGh3D2zT795Wcv2+7OE6U2BifQ8LCZV1id4fEERoV4JLnWVjXQJcD+PdVj84zxR4OKaPb/brs4N7MiPHOX99/2SZxq3KGCXwTZh1m54PsH5r1lKSpIegQE3FizA2FdgazqZZoo7COZ2nqj/Yn5atWRWKct/O9aY+0d7aZo6tbUuhP2oVCPZwHUJDleDcX8n2AEloyT6cYxrbHkSjvlbs1+/OBLaExKjjs2rrCufP8dfckzy39LWPJVjHeafnAxxvWJMkPR0CTGYv+tILM4UzAY8gUQviNMuWUEARvKdefPusHu2c/iozhR30LdsTEPjcmtGhzz1QHdGDLmNdw1Swrgcj9q3rCB890Kx+w0dfGCvOMd2vqgavjnbVe5rXrT0g1TbQpgRz2sv58zyt0MYvLtv3oOv3vsszuerfVnskSXqI6XVbX2phq+EkPyaPPtvEudlOgZ7CyC1NRZb2JMwQLqZglcDGflOopA895HWcn6WHlUlmf/rSAxcSumr4qMfU9ua/9UiQZsx7ICFUpY2rv1Kt+vEV52E718v4TveAa/AMML4Zx3yyjfPsjdufb8uPfeWGvNJcYWym8YmpH5IkvYxe5CmKNWiwvX7PTAamsHRLZ4vsqmjTjwTQKUy9oh6290L0amyuMZ0jIS/juxeIb/XsZJY1VoH17LMkSdJToPhS5DKLM71SS0Gss2+ZgakB7tb67N4eindeZ06BgfOxjbbfs90fhf4QsLl3uX97M1tT2Dqqjm+XGTc+j4Th6Tk7g2cwIZUZNp7l/tzQbgObJOl/by8E3AuFfxW+dE4PM4/wkc8TAdWwJkmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmSJEmS9Mn5BwSMZRjRl08SAAAAAElFTkSuQmCC>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAaCAYAAADxNd/XAAABY0lEQVR4Xu2W4Y3CMAyFMwMrMAMrsMKtwAqswAaMwAhscBuwAQswAOQTepJl0sRIhTtL/ST/IHXTZz83pZSFhYUeuxpbv5iFdY17jau/kIVTjVt5FoETqaD7dJ7xSekC3VfXf0syF9R9gfBULhzLa7cRn8KFVY2LXyzzubD3CwOYBjSFOZTpLo9cYJ13h3eGfQjcZE0i+P0ONDP8HeIhiJyqOOICYr1I8tX5nxobc60H93CM04gQ6lqPkQtcR6QFEXZ0fIEtaCJ5cnPIqPtCLrCxR19uuweOnM1viBRADvuECyCJTnHDKBBJ+NmkOFlOkGvnX3Cfd8nCiMkxvVNdeID+MrwTfuPW/LccAJ9nIZ8iiVABc9Gaf4S2jmWNiAcXia8X0Jp/RgFnEeQh369zL4It5LDvR+Ehejc0/+qcd8RixTLzOIhbFAc4oH2nHPtTEC2xKaGjoSPyP9M7jVKQeoRm4QHAnnbl85V3PwAAAABJRU5ErkJggg==>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAAaCAYAAAD8K6+QAAABpklEQVR4Xu3WgU0DMQwF0JuBFZiBFViBFViBFdiAERiBDdiADVigA8A99T6yrKsKpa3UKl+yLnFix/520k7TwMDAwMBuPMzy3pXXAEl9dOU14GuWl668VNzOcj/L07RN7HmZ39RNlwgJacHPaZuYMZHwVWDcr3/irC3uTknMc39KaPtzkPcDD4bETs2mdn/sylOi3y/zmqTEI2DNuLIv4Dw4d8saMdYR9m9meV3mAbv4Yh/feZ192VhLxRPHXtT7lYMC86x5ORO0ANgFteL2GbN9W3Ts6CsELFhIEiS+U106xMe/tV+92gJl6OuwCk4FFAbB16HZa14r7uAEnWCMq+/c6yQTsui7P+SEgE7oXmB0jYW0hoMq49o1j01vS3pJaL2wLrh6v9jwsYbujx/xQe2Cg4GlHC7BGkhtPUknSUGksoLLmD7/ckj1DakWVNIkxDYIQanwQeCcI1+OwhqYh9mapKAcLPB6VyVPl0qEqLq33qFdLSwePo7y09SZCfO+Dugt1fcHa61eyQqqvXH31+dHQ1hzgEqsBXeRyJOvfdaqMDDwR3wDwrl4ArtRQTcAAAAASUVORK5CYII=>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACUAAAAZCAYAAAC2JufVAAAA9UlEQVR4Xu2UYQ3CMBCFTwMW0IAFLGBhFrCAAyQgAQc4wMEMTADcl+7IcaxhgS7w477kZaHt+l7vVkSSJEmSn7JR7VXbOOFYqzrVTrUKc805q3rVVXVTDVLMDQIcxzU8D1Le4SCLgAkVMjDCnHCYA2FP8lodgsWxB0xQ9rnyXMJvoE1Ui2DMT60B9vIHeoIe28tzhCmwqVUjwhyhUDyIpxb4Y2hVLRRgSCjaN9Umxmhhc2on7aSEwZRgfFMR1lTb9w1syuZxjG+KSlINu5UE9K2vVbAJtBADqtaPTzMHjFljH79dgMX+Egy7we9OzhofOEmSv+EONy4/MX8JAmQAAAAASUVORK5CYII=>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFMAAAAaCAYAAADL5WCkAAACdklEQVR4Xu2X4U3EMAyFMwMrMAMrsAA/WIEVWIENGIER2IAN2IAFGAD4VD1hrNhpck3vkPpJ0d3lmuTFfnHbUg4ODg66ufEd/5Srn3btO/fk4ae9+M4Kt2W59tJ5LSeYg4FfSfssS7DImoex774z4KMs87UyT9DfOhrXbwn7RGtLZwoBY7NeHL8JaC1oLOqvr4EjmYP5Wy7mf+8Oabs3faxb07sF6CVRw8g5NZjYC2dBxqyB6wiOApplnaT5UxBpO2nDDdA6lCg2h9hInDZjJ8c9z+Z3BEGXG59K7k6cxzWWTFvttGwFGiOdKWwYwX4joJpqXYhzfHAjGCcnKjCRO9Hh+zNta5I5ikpTN1G9JGg4gkltDVO98sfRg9N8drWW74+ItM1Ge/TJbaJjTPbVyDr9bMZPKLe0IBF+bMudnqhezkY6u5KoQdQfBtoWOU+1L4PxkfvWujOrl3vQHcysJkWsCSYBiISsdeeIti3pDuZITWoFk7lablrjzhFtW9K99khN4saSjclcKeRObm5ROdFzacZjWZLLJ04GbpbUfH6r/rMGuvmuz8zx6O8K5mhN0uNS7R1WIpiz1RSs2qa0RqYN5xJEIDi6lu/oUKL4vCu/N1eu0/wR2kcT+zZiW21TEYyXEywI9fO2mjZta6lv3CD945l9DrSB5T85Ur+Zm4Y+nMl6NTMIxs98KfgD4nkLOhds1q5PubLBUdA8JCYqKxYCqeRMRy5aI2wGOrJgtSgANW04dI3bmC+r5VNoFfGZ6MhSatCAM9FDfxQ0e/QzcPxurhRkzteyvbHuib6LWp+H5GSPa1NB4NkW3xj2cq6TdnBwcJl8AzXi8L3bpsL/AAAAAElFTkSuQmCC>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAO4AAAAaCAYAAACw7WAtAAAEkklEQVR4Xu2agXHbMAxFPUNX6AxdoSt0hazQFbpBR+gI3aAbdIMukAFav/O9Cw4hKSpRZKnBu+PZhkiJ+ARA2snlUhRFURRFURRFURTvg4dr+5yNRVEcl4/X9vfa/uQLDb5e268V7cNt2OmgiGVfRq2K3hOl3U78uLbHyy15H9K1DMn97XJL9mhjbExS+mA7K2jy89o+JRs+fQk2gg5bBd8Tpd0OkIAkniKOdl0WggWJuFtTOTMt21n4fXl+WrBAZc7s51tQ2u0AldBdFhFHu+73y/PqSF/GsMNGSHLufUbYFbI/owJFoBY3SrsdcLcVk7C36+YFAY9AOaFJ3F4BODrMO34V0NYqUEBBK26UdjuAaDm5PNJke4/eEeh/o1egimVKuw3hO0jrmLK060ZGR6A9ITCYw2xrVf4l3kuBegtKuw0heHu76uyua5K/JBHOxN4FaouvGawJfymYvQ+74WzLPzyN2Fo7fhx9ze7Nd3DiO//I2sK+a36rwV82RLTfHIRnQr0FMCHpM+K9HIH2LlA8bzbhRhA8+ftmC/rkU8moxT/pLLG1dsTsa3dv4pb/R5iBBF+7FvSfKQyrQcQlIUnapV3XPveGHSrvCqMW/744wxkLFD4uFd492Fo7igbF4zWgy+x8ZotfBJ+X8ms1S7utWCl7IhEYo+vAM3DAH8EUC/Gx+aqTPfsSVE+L0Uxbs2OA/5wywjnwarHTf+34hG40NeEa710P+rHwfmaufLbYUMljILWeq33NEe+tmNHO9Y46aFc//aePiRF1kahp1Ek7zfnE+BT6Oa5V/Ihhx8Tk105bUxim4caIScItNRzsVUsCY3QE8scvheU9fWMw8wwLQM9+b2YKVDx6saD21V81JOniorMOXOeVz9zD70h8phFI9Fdnr0HvucCzGHtPZrTTX8j+WHjUDeirPe++cbyJlO1RJ97no3d8z5hY/NCTuYj3iXbmtHncGiQm5GyLE8zXch9BtOgkVYiFZKH8ToWTzGlkvwf+oNJqsRiBCSg5eGgGJuPwy6AicOznK89Gq2iPxzXG8X70XHjJEW8L1mgH+oEWFhpt7r7qlpMsa8g1i79J2dLJhOYazzQ5+dwrfuaO47m/88KuX/TPuXAqmLyBxGJG8QCRXZhIz35UegVKYnBFLFAZ+sb+MfHBa6Pn8mrynwHiBF9Ye2IF31rBn3dYdFHD3piWThZEiOuQ1yoWPwtDZlQYTgmCKJBVCIEIqhyM0rMfGSs8uNtQeCxavQTtFSiDxXvGwMPuDjB6Lo0Aou89dt1Z8tch1575xwRy58QWfTZhsDMmJm482fR0grgOFgL6W/zUPM8V6Jt3aQvDaZMXp6w+VkOPJLmySc9+ZFhYfGNxmT8Lhw8mTCtBRwWKYOQ+Fj3uQ1/vL6Pnoj3JfnQt9cFksSihl3YSjGvY0MFThbros2O4Rxwz0gl4b6Mfr/SN93f9jGfv5Vy8f7xHq1ifhhiwvfeRnv0M9Pzr+dSzQ+ta/m4ovWcdeafNtPyF7HPulz9DHiM9nSBqlfu1+mYb5HFFURRFURRFURRFUST+AYOZ57SpqEOKAAAAAElFTkSuQmCC>

[image13]: <data:image/png;base64,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>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAbCAYAAAAOEM1uAAABi0lEQVR4Xu3WzVHDMBCGYdVAC9RACzTAgSNXSoAW6IASKIEO6IAOaIACwM/E32TROAGGBOuQd2YniqyfT7urtVs7sQ63kz1P9jDZWfdsdYi6nNtPk72WZ0Pw0jbeA+99tK3gISDmYm6ftwEFVoR7uBAHXiRuuEsC4h7ntjCzf0VO9RYRPOaSpL/e6qNiY16R9EuWXCOuf3Z0iCOAXbeNR9Q4m+f/qrnGc2/tqwiihighqWX3Xf8wAoWQkBTfQLD+f7+hPRHSI+R5pa1KQlw9RfRSEeZll8fXjDFyVwRQ//s1JuhTjvTXSGnrZ1lnEYvxmIE+BojoxSE1771tN3K4m7bZwFxjiNUGUdaDNc2F8XFCHb8TA78rJynM2RAE3pW2+Xm75DB1TWOu5v5cwIO+jZw04ctNz+H6D4dEJPB6hC3l/UGoN54nhRDJsUrfZ7y+fGhU9ubgT3FyuWrTfnOe6jfh2Xg8cwKxcs+ziP4zyb+lPF3qC7s2l3f75v0aYanlYygSCnawG3fi2HwC8dFrsIww//cAAAAASUVORK5CYII=>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAApCAYAAACIn3XTAAAEJUlEQVR4Xu3d3W0kRRQG0ImBFIhhUyABHnjkdVMgBTKADAiBDDYDMiABAgB/wldcrqrHM57u8dh7jtRy/1ZX1azUn26PvacTAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAefn5af504AAB5Dgtp3T8tv8wAA8H7kYX6Nt3rw//60fJo7D/DD3PHsr6fl79P/j39zuk+fbpHPN3389nn9NRL6UqUDAN5AAkiWS/30tPyy2Fft1PLn6d8ws6e0l3aPlv6v+r4KjNn3Xtz6SvTL3AEA3Ece4tcEtq3q2qqN7Ls1JKy8tkp0iQS19HuOcwa1SHh8L1Wn6n+qbLc44vMEAF5wbWDbel24aqMqbXubYWpPCYN59Zmlm1XF2KrEPZr0MZXAjO3WsHvE5wkAvKAHtoSSrOdnglke8r0ic666MgNO1OvRvaXNWytFWzLmjL33O4Hnj7ZdViEu5/Z5uudrxPr8+rLq9y3S5nupKgLAhzErbFmv72XN8LFV2Up4Wn2X64jAEGl3q1JUrzRXlaD68v05FTzzs6pnCSircLYKsAl71bfqyz1UqMz98znVHO1dAcy8rsYNABxoFdh6GLqkWpSAsApCCT1HVMJmH0v60Pub9R4YV6GySyjLL1BE2qprV+EvVsGl368qXkfLHPf7ZG6Oum/+DazGDQAcaI/Atgo0CT4VfvY2+1jS1xkQ69XuVqjsMo5+fd1na9wzuMyKWsLb1rV7mq9wM+8CGwB8INcEttVrwVndiQSj/p22vFJMYEpbaSPH87O2y2p7FQ5mH8tWILs0PM5wlfucCyhz/wxOWc85CYwJcxlbzqnr5na9gu7tpt/Z7q825zhnQEvwzD2PUGMCAO4oD+B6CCec9O1arzBQf3y1JIj1c7LMKlVku8JQglaWeujX+jxegW+Gk9j7e3F9jN0MYNOsLKZfNXcJTNmusJYx1fkZ66/PP3OPGmPNSc1Hn5NuFZryWdR183trfT5/PP0XEivEVkiu63I866uQm3vP9gGAB7N6iF+igk8FjV7N6lWsqijNalf32j5sSZCa4aucu1fG1ANlBakEpAo1PWzVL23kvAqDPfzUuQl5NQ8rPfB2/b5dzq1713hyXv3PB70a+n3bnsE7jqrcAQA7StVoVnxeksCQ6xIaUgnK9b1KltCTgJbjVd3J9iq0PFJgSKDpQW/1p026Gn+FqqpslYwtxysEZg4yVzM0XjsHFSwrtPU5zXr1o77nt1XBnP0AAB7UuQf6lgSPBJFuVQl6SdrY+tMib6WP61yQqpB7btxV9epWr4TPtbGSUJlQVsGsVy8rHOdYBbkKlj3YVagGAD6oPPhnpexrUq8wr61M7mWGZQAAHkhVymblDgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADg6/QPboMJaHkK3rYAAAAASUVORK5CYII=>

[image16]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAaCAYAAADfcP5FAAABrElEQVR4Xu2VbU1EMRBFqwELaFgLWMACFrCAg5WABBzgAAcYWAHwTsp9GW5m2r4E+MOepMnbaTvfnW3tyj/l5IKC1XMl99t62NatbwTYf3ZhwVPr5w9DJC+tX2ZdWnfO4dybCye8tlxXCdng0k2QEVlm+H1bdy78AqPocdBPgFH/EDLjJcIhjEfInMsiOJMFAdhA5xRKcHZh64q9T1CanRUfrd6fBbODApwinZSCTKmHYor5xqCXi/PIHlvfJwv89vJwjv3pq1PNcYALWn4RI8jdEI6gg+jZ55vlLQDsD18cyikDKFJklMqbE0UorBj1j8DpYR/xKojQUTYiKHJZZNQ/AqeHDql/HGXDx0DlkAKYzZqpQ1WKcZSeiowc0p73lzN0SK/GQY4zfpHos/Pg/cPvzDnuu94dDGDYS0ZDo9wVci57fRD7h3JXRjnnY2MHBVzGON/6q6iUAQFkz5b70uPDVFRjYyc+a6LOIncwpjHhcD+bPQJnq7vf5s8RNG3LKAcwg8pyVfNnBZX3CNgaJoA+WClRBtmhX1bvc656dT+G/l5WIJu/6syVP+cTPIVz/SyoEVYAAAAASUVORK5CYII=>

[image17]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAcCAYAAACtQ6WLAAAAb0lEQVR4XmNgGMogHIhPoAvCAF5JkMR1dEEY+A/EM5EFlIHYDYgroZJdUL4QSBIkCDLuGVQSxAZhkCY4IM0+GADZAZIEeQUDgBwBkgQ7Ah2g2wfiwxUi25fBADEJDkASIJ0geiWyBAyYMqD5baQAAG7XG40IUW0sAAAAAElFTkSuQmCC>

[image18]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAA3CAYAAACxQxY4AAAEZklEQVR4Xu3dYbHjNhgF0GAohWIohVJYCo9CKZRBIRRCGZRBGSyBBdC+213NaDSSIidO4iTnzHg2qzh+kvPDdz5ZzukEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAb++jbTiQP0/H7h8AwM0lEB3d320DAMC7+Pa5/dw23tkfbcPA18/tp7YRAODV/d423Nmvn9uXtnEgVbZnqAYCAOwilapU1x4pASx9yL9/Ne+NmBoFAN5GKmuPDmzxb9twRqpxv7SNAACvKEFpdSryVhIatwa2yGfcywYAvLxLgtLeMr35T9u4IH33mA8AOJjRFFiqLI9e4fiMcj4fvdggSpUvCwmy+GBVQt4RpnMB4O0kfOXi3ZvqmlVTVm9Wf0WjIHvOb6dtAelWErzy/c2+354EvCNUCAHgrdSPaqhXAaZ61quktM/tusXKwVSgjhwMEm4v7dvsfGXcOb859hFCXU/6denYAYALtBW1OkwkMPWeu9UGtoS6vcNFgsvWYDALQnvb2rfa7HMZdwmDq+f0nuOOa8YOAFwgF/tU0nIRTjirL/7tRbnsk0BRh4lMqfUqcXto+zCzJbik/5mavFQdWsr5yxTpueNmn5UxHTmwxcoYAIAdpLqWe5hy8c329Udb0a4gTDDoPWj1lhWXLcddDS4JTakSpt8ZY8ac11sWUNRjTmDN6/Ij6aVK1rN6rgQ2AOB/CS31jfMJGvXFvw0Cs7Axar/W7LilolW2hK/6/70AllBaB9GMMW29qd8cf1Qta89FXtdTxe25K9rPjcwCW6nojcZ96WKILVbGAADsoA0VCS1tmKnNHrQ6ar/W7Lip8qWPZSvVv7L1Hp2R49UhLPulrRfusl9dSay1wSuv67/Xnrui/dzILLCVYD0a96jPOeaWbebc+wDATtpQ0YaE3vupImUKsX5vFkISLmZbu+ihNTpuT9vfnvZ4sxA60445r+8V2Fqjv3VLK2MAAHbwcfpeUUsIa+9Xi1yU68rT6LldCSq9z1+jrvSshpeV4JKq2dfT9zFn//LoklFVaqT0K8cooa/0s+53KwG1117kePXne1XC1sq49zYbAwCwk7qy1ZsOjASb9h6uXnBKWGv3e4TV4NL+QsO5Kt/e9g47q+OO7DvaVs9Dzt3eYwAAOuob5GdWKmdHCGvPZEvA2lO9GCGh69J+fJwENgC4i9XAlov8rPKSizfbZJqzV6m8tfo7z/dWT7duWVl66X1/AABPIwG49xiRe8p096XKqlQAgJd2TWC61rX3oK0uhgAAeGoJPY+69y/VvTawJcSl8le2mZX7GgEAnl4eI/KoKlv+bhvY6vA4C5IJdu5bBADexqPuA+tNadZ9GfUrlbfcvwYA8DbKb6HeS3kcR9lGIW0U2BLyHlUVBAB4mKM8dLie5hxNea4+CgYA4KWkynaUqtWXH1vPKMQBALyN0TTkEaRv51aOAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMBO/gNefBjEJjQvfAAAAABJRU5ErkJggg==>

[image19]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAaCAYAAAAaAmTUAAABTUlEQVR4Xu3VgU3DMBCFYc/ACszQFViBFViBFboBIzACG7ABG7AAA0A+0hPB2E2cpFKR/EtWXTvx3bs7X1LqdDqdK+dhGM+ncZ/t/SsIeBvG7WmYW7s4jO3J3TA+0+9zza3ZuyjHYbyksSz2QAY4nmNtUXYOaXRGbd5ke0vwDlHKYauo91QX85ovTuGEB0SWEA59pFEcpLcltc57TOOZzloTmJrT1ksiv2GodLEIEx08pR9hrciQ81tFrRITtZkbYjwuIGe20iqqWUx0B1nICTEO3Fr/QQhSgnOwXQpiVUy0P47nMFyLTiutWQG7JaerPoWY0uU+t7eUNSIC97Qmxt4fGNC18rQTEJExV45LndmrPZc+kDqtteoH2sO6FrWcICIiySH/jTkxe4mY4hzB9judz0JUqf1anxMCwRC5vZEFlUNENSOdTqfTuTq+ANRxY+mJhEdJAAAAAElFTkSuQmCC>

[image20]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAaCAYAAAC3g3x9AAAA0klEQVR4Xu2UwQ3CMAxFPUNXYAZWYAVWYJZu0BEYgQ3YgA1YgAHAT1Eky02cNHDg0Cf5YiXfzrdbkZ2/5aRx3xCcD7lq3DSOLvfWOJscQuSagg+NyeWeki576DCEDmaXO0gSK12meMhFkoDPIegLweITPWT/ml71UvNviMg/YHg8m7AbUCXyDxhKXi9WrWlL5B9Cdsp0iGjIS+r+0bW1gqKcr0IHkX8lwVXxPIRSWL+gS3ALDMwLsmLD8BrrGR0zxK9g/xDKvzz/2Q6Br6W12vkBH68HQjVrpYYIAAAAAElFTkSuQmCC>

[image21]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFUAAAAaCAYAAADG+xDjAAACqUlEQVR4Xu2Y4U3EMAxGOwMrMAMrsAA/WIEVWIENGIER2IAN2IAFGAD6dP0kY2ynp7ana5UnRXfXJHb8xXEKw9DpdDqLuBvb/fR5VG6HU4y0i/AxtpexPfmOA4GYxPjlO1o8ju1nZsOBQNSM7+H/XNuYi9+9UMVa8jacAo5SnWcIZbOy5Yix2Ht2z2/G9jr17SXLW7GmkOIEmoFhK3jLkTYpq7nMZ6MQ+dppxRpCQdaxtHgRGWd/V7BJiJZBKdlLtrZiDdFRtTWTDPo0v20fVI60Se++wyBRvd1rpIo1RUeV+qdXCJ5R+zIqR1k9tRxeVNVTJtPIUH5XN3TlqFVPgfktH9dCFWtIVk8R1l4itp6CH29p1VPs4pO29KJaOh/YWNZMMkRUsYZE9RRsPWWM788czamn8lmVlzlQXpbaEKyXdUVksaZU76eCXfQZkTmSYFk9xQ72IpvnwhoyIc6Fk+VPo8hiTdFfPxmIEx2LzFGrntKPz6gfX5wIPr1Y6qM9TJ/YwZ4SQmvVZunSFfhkHtmNfYnIczY5I4s1BGNRPQUWphs6EiCaA1k9JTjmUFYie4ih7CZoa585Ehnb2PJCMBeRGCshsaHvjNc9oZruNyMji/UPGGv9fa6WGfTPCdDP9XZ89gmtR1iB2VjrKxOC54hqhcavwIZsMs76q+op+Fg3Y01HCEdgAmGUzfjxlyREQuhoAyLbyxaBZZN51l9VT2HNWEvWdKRaCXp74IiSWQRv32URRpnm/9/JmjQWcWnY0HEXZLh8qoxgy2+SWDPWkjUdEZDKA4ESJILwnKDpQzhdYkAW8l2ZCQiqzEY4NkSbJYH5pE/Cqg7zPHsbWTPWki0c2aB8gNHlFh1ZXUT6bsns2zkRW8Qaws7izGbK0eDkEOPFRO10OrvjF34E7mj3c6cXAAAAAElFTkSuQmCC>

[image22]: <data:image/png;base64,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>

[image23]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADUAAAAaCAYAAAAXHBSTAAABq0lEQVR4Xu2WgU3EMAxFMwMrMMNNgMQKrHAr3ApswAiMwAZswAYswAB3fWofZ5nmJFBB+JQvRW2T2PnfsZO2NjAwMPBN3E/teKG9Tm3/ObsYntssApERj0v/U+ovgfepfeTOBe5aKdy2mfRLHpiwa/NYT/C/BTUD8UMeaOf041kK1hO7EoHIkoKA9QR5Gt+mI6lZDr16Mu3yaVgC1lNOMe+vkkd5737qiS0B6ydDsWuiHtq5/hBPCnPIsKvx7yPbMkYf86xVDiPWulm+CW4MMO/a5MCvwnriVyiDviiKJ04hZv0hzoCwKN/6Ym70C3GvDInyDYe3pQ9g43tcy7EuMOK0g1BsMcoSxqnOiSZ2Hv30sxDEaBDXhzsJrE/7CAC+6MeObBEGybXwqU2+cn4EFoSkRA2GcEEBIdMIsQQGMKcXZQkD/LNrvq+VxebIKUWETZVICGEKNM2inbsEonjE0Zh/176Kct7mgITpmBdFFIQghmCe7DYitGMcoe6odUgfO49fd99MwI7nJunXA4Ssp4z4ByJx0SPFPOdmG4PyJ4gRvQqYQr+eEgPXhhPVNYo61gCQkgAAAABJRU5ErkJggg==>

[image24]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAaCAYAAADBuc72AAABSElEQVR4Xu2WbQ0CMQyGqwELaMACBviBBSxgAQdIQAIOcIADDCAA9mR5k9LcFsgt2ZHsSRpGbx9vu952ZoPBoCnbZLcfjP5duCS7JtsE3yvZ3vkQiK+b0HuyVfA9LIuKkNEukLFT8K0ti5wSRVBdOFgWFn0IjQHAOTp6ovrsVovfUqrPRVGrz0VRq89F8Tf1+bRyfXLWkmmMQPglMMrlaPlEiDuh4w+jj9BcjNFccWwRbqZafTIRC9CHEpHPXxg803FHH248QLBPAAIZg0heXq1dRC/PlCHAX6tMivlDHyHKlIJQm93ReC8a5FdW6e/Xmo0mFiUxBMQzQYn4rRfsnv+eaIafGIFeDCIRSyA7+ywhtle1yC7yTDugsml66/mJyRCZEghlMQWCGAmnrWcEiHD+++DiVT4L/5VFO3511f6X2k0FDgY9eANE+2O/Q14AzQAAAABJRU5ErkJggg==>

[image25]: <data:image/png;base64,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>

[image26]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAaCAYAAAC6nQw6AAAA0UlEQVR4Xu2UURHCQAxEowELaMACFrCABSzgAAlIwAEOcICBCoB70y5Dww6Q9rdvJtM2vW6SvZtGLExhPcRkzi0eQxzTuzL76IW2+UUVdTWbe4trTlbBYPnD/aHFbrTiT+QPHTEiPt2G5xLyB0FBd2XPqE68cwovtIlxwRer8OcH8y8pB4hYIUzN54eqedSfuBGUo1sKsYvAFT/Jf+B2h2flGE9Hgivr7emnsioKOpJHGo+PESJvwQ8H+fwnoAAxmy568bzDZRBCxHpUxe7YwneehdA0OlM70KoAAAAASUVORK5CYII=>

[image27]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAZCAYAAAA4/K6pAAAAoElEQVR4Xu2S2xFAQAxFU4MW1KAFLWhBLTpQghJ0oAMdaEAB5CA+4r0zfowzkzG72XvdDSI/Py+RaOVamW9cgbDRqmUWF8v6Foh7rdLtD259CG/icLSsY61KtoYkS93etIGYyEGcGZAESEbfJ1rpZNvEmKshpsfzcCYM0Uxs+iYCzPi0zOUUDmK2RysB/4ZhCWFvVpdgQAKuYNd6TLDw64zcsh5dz1vZvQAAAABJRU5ErkJggg==>

[image28]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAmCAYAAAB5yccGAAAE1UlEQVR4Xu3bgY3TMBiG4czACszACqzACrcCK7ABIzDCbcAGbMACDAD3qv10v345ia/ttT3ufaTo2sSxHRvJn5yyLJIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSXM+HI9b+bg8t89nSZJ0x1is/x6Pa/n1dHw7/v1zPJc+1L6MzlW5dw/B5OvT8f3peCjnvyzPYYXzfA/ueVwO93Sjcy/1eTmMwZrfy+GZKfcaaDt1/6wX3hnG4RLzKUnSVVxr0WaBzM4Of3sQ69/p1yi0EK4oO7NLRR0EMtqu9ec7B+HxU7lGYCLMEfSqujN1jr3Ahj4Wl3StwFbH9F4x15Ik3T3CzCgUvYYeQvpi2a+vBTbuI7SxC7aHOhO8qCsBZS0wcT47b3XXDbO7env2Ahvtb10/17UC22vWPWNmDBlrXwtLku4e4Se7UK/5Gg7ZGWNHa/QqKu3noNyoPwlSlK+vOfcQ3LKI85fAx7Onvuz60TeOGigpT38qdpBy/0w4iL3A9mM59I0yhMStsqeYCWw8K2PLs9GHPGtCNd8zl5RLuKbv4DzXOZ828qqZeUj4ZZwz5gnh1EOd9LOH5hHqohxtZgc0fa3tr0mfJUm6S/kNWxY5Ps+Eg+xUrR1bOxaEINoZha26wHKwEI8CW1B+ZpcNPCNt51l5zvrc9IW2+JyQQIhIGRb1vvDTv1Hw3LMX2OhnXifOBI6XmglsdTex9jWBDTlPUMouZmQsqzqedd7qPHK9tr3Wv4r7Ga/+Gru3v2amDUmSbia7G5GFL2bD0Kz+myba21pgWUh7YEtwSqCr9/A8udbbqrsvHeWpJwE2aDtj0IMTZQlWnKPd2s+9ELcX2Pqc1DHaqxuMUR+3aiawUQdtc9QyjAfjWEM5Y525SNjqgS3faTtH6uB87W8dm7X+VQ/LoVwP1f3f05qZNiRJuhlCTF2sCCAzWLBZYNeOtWDUXylmAa/fK/rWg0ftIzth9R4W7h4Gcj594jPX+i5O6ukhYy2wcW0rdG3Zu7cHtq0dyzV93KqZwAbaTXALxjzj3HGO+eE+6s99fM4r1JFzA1vdiR0Ftr3xm2lDkqSbqQtlDVxgYb70QkZ7Ncyx0NbvfUHvgY2yPSgQKAgQa2gjYYuD+6mnhkfazc5VwgXqKzx2ufp/Oqi7XdxH2b5rObIV2Pozpr+YqTvODWwEr7Tb+1rHC5Stu4CMH/emrymbsIc+76cGNtqqc5c5Rua4/g5u9Ju4/nySJN2VGkCym8KCl89bQegUtMfizgJJ/QlGLNj1GJ2jX/X6qMxIL5NgQNv0I32p6CMhoI7PaIco5ehbDQ29vm4rsNXAiATNXEvdzE36n6PuJJ0b2Ag7HHm+inGobWV+qLeW5Tv393DH98fj9zqvlK/ztDe3wXXq5H7mLHUTzhivOh+1LzEKcZIkvQk1UOlgJsDOjNlWYNsyU3ecG9hGahC6Nvo7Ol4iO6DVXriWJOmurf0O7b3rv8M7xamB7VJODWzcl9D2FtUdSvDsLwnBkiTpjbjEAk8dt9ilCnYK8xy3DI63UMf9EnMpSZKkCyKg+QpUkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkiRJkvTf+AdJx3X70J3wYQAAAABJRU5ErkJggg==>

[image29]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAG8AAAAZCAYAAAA/vnC8AAADHElEQVR4Xu2XC5HUQBRFowELaMACFrCABSzgAAlIwAEOcICBFcDOqeFUvbm8TnpnZtml6FPVlUn68z63XyezbYvFYrFYLF6CN6f2Lh82vP3d/ns+n9qv0n5edv/Bp+1y/PfL7qv4uM2tV33l9y3UGLL9OLUv23kz/ROQDJzG+ffRVyG5BnlvjsQDEnoP8aSLhaomFw/b3ElwK2yUmyAZVsDX6BMCqZV3b2bEg+cWD9jAPD86iW6FnM7EvAvJwGEWYsd1RwaisitHAd/KaxSv67snxDET8y6KZ/VxTazIvaA+bOe1qND6UcEOY336of6WKh6bhzG2utZIvJHtPUaxHFUe62MHexmHEAN59FTLgsAGhcIRbZw5ZgrFYzIL5m7AuIJ2ATOPOd+28zoEVt8ZPOeeeZzxfnzU876KxzztEFzdTCneke09uliO3nn4gqiIhj1iYHxNPPMYgy/6xL3rsQY+Y9t80zp7hygeUGEsWndvfQ92ARNAHrcks+5cBePK2vSlKFU8+vWpkuLN2B5hLKxH86ON+V0V4A/96ZfJBwsgTwfu088a89VU8XRQ4yR6Tzy/ANMJxcr7DFxcA+FI4ujoq77N2h6RsYBz68YSRM3x4Jz6UZdxmlf6pfP9yVTxgF3rzsVYLecMWKcY7w6uTRFmxNOuieigT/FmbY/IWIRnVEkyGm9sXD0OM059rWLl/VWkeO4ezvVcPAPw/ZTjkhnxrDjE4HeHSYJZ2yMyFhkJ4Hs7MTbyZnXmXMWjX6rvxJ1zpkjx/EtAAmuZQxfwKNmI7xk/I15WlPeVfD5je0QXCyheHp2jY5P3Ls/9Cu3ixJ9cs4rH+C7eQ3AqRdLRTEAXcOeYX4HyFPHAD6ccn+NmbI/oYgFjRxRgbV8fVF/NFbbYQI7lns1UKwy4z03Gvc+IIzXYxYTWZrJwOEs8W00QxgmCOQTC1fdWzqsJ63yAfDYaB3u2O3IdWo1FkWisTZ/vTz+otMXvrBgEVCz6uLIZsxBYGxv0df1/HYLbS9xzck/bJNKjrPvwmXlHucaeKI5ZLBaLxWKxWCxeCY8ENn2mlNloiQAAAABJRU5ErkJggg==>