# **Executive Architectural Spec & Strategic Blueprint**

**System Target:** DentalConnect OS (DCOS) & Next-Generation Reactive PMS Engine  
**Document Revision:** 3.0  
**Compliance Standards:** HL7 FHIR R5, US Core, ABDM JSON-LD, HIPAA, GDPR

## **PART 1: Executive Audit & Strategic Alignment (DentalConnect OS)**

### **1\. Architectural Reality Matrix**

An evaluation of current functional capabilities versus vision promises reveals several critical failure points that must be addressed prior to global scaling.

| Functional Module | Vision & Marketing Promise | Current Codebase Implementation | Critical Failure Point & Technical Risk |
| :---- | :---- | :---- | :---- |
| **3D Scan Inspection** | Instant, zero-latency WebGL/3D inspection for intraoral scans (.stl, .ply, .obj, .dcm). | Standard Three.js canvas (ThreeDViewerInner.tsx) with client-side STL loading. | **Memory Exhaustion:** Real intraoral color scans (50MB+ .ply) or CBCT stacks (200MB+) cause browser tab OOM crashes without progressive level-of-detail (LOD) streaming and worker-thread decimation. |
| **Scanner Bridge / Sync** | Zero-touch background file ingestion directly from intraoral scanner software. | Browser-based folderWatcher.ts using File System Access APIs. | **Sandbox Limitations:** Browsers cannot run background daemon sync loops across system restarts without constant user permission re-prompts. |
| **AI Voice Charting** | Hands-free clinical charting while wearing sterile gloves via ambient voice. | Generic Whisper transcription proxy (/api/voice/transcribe/route.ts) returning unstructured plain text. | **Dental Vocabulary Breakdown:** Vanilla Whisper fails on dental nomenclature (e.g., "mesio-occlusal-distal on tooth 16") without grammar-constrained decoding. |
| **Lab Workflow Engine** | Full CAD/CAM handoff, margin marking, and step-by-step milling tracking. | Status-dropdown Kanban boards (DentalFlowBoard.tsx) backed by Postgres enum updates. | **Cad Software Disconnect:** Techs live in exocad/3Shape. Lack of direct .constructionInfo / XML project integration causes double-entry friction. |
| **Global Data Security** | Global-ready, enterprise-grade clinical data vault. | Standard Supabase PostgreSQL with basic RLS and Cloudflare R2 presigned URLs. | **Compliance Bottleneck:** Lacks BAA (HIPAA), GDPR data-sovereignty routing (EU scans must remain in EU region), and cryptographic audit trails. |

### **2\. Strategic Pivot: Hardware Scanner Bridge as an Enterprise Pipeline**

Attempting to distribute a browser-bound directory watcher to thousands of independent clinics creates severe technical debt and high support overhead.  
                                ENTERPRISE PIPELINE TIERING  
 ┌──────────────────────────────────────────────────┐  ┌──────────────────────────────────────────────────┐  
 │           CORE SAAS (Self-Serve / Pro)           │  │            ENTERPRISE CUSTOM PIPELINE            │  
 │        Frictionless • Global • Cloud-Only        │  │        High-Ticket • Bespoke • Integrated        │  
 ├──────────────────────────────────────────────────┤  ├──────────────────────────────────────────────────┤  
 │ • Drag-and-drop web upload (.stl/.ply/.zip)      │  │ • Native Go/Rust background tray daemon          │  
 │ • Zero-install WebGL 3D review links             │  │ • Direct Medit/3Shape/iTero watch-folder hooks   │  
 │ • Real-time Lab & Clinic Kanban                  │  │ • Local NAS & clinic server sync                 │  
 │ • AI Clinical Voice Charting & Tooth Charting    │  │ • Custom PMS / EMR sync (Dentrix, Open Dental)   │  
 └──────────────────────────────────────────────────┘  └──────────────────────────────────────────────────┘

> 1. **Elimination of Edge Support Fatigue:** Removes browser sandbox permission bugs across unmanaged Windows 10/11 clinic PCs.  
> 2. **High-Value Enterprise Monetiation:** Dental Service Organizations (DSOs), hospital chains, and large industrial milling networks pay $5,000–$25,000+ setup fees plus enterprise ARR for automated hardware ingestion.  
> 3. **Core SaaS Purity:** Keeps the self-serve product lightweight, browser-native, and globally accessible on any iPad, Mac, or PC.

### **3\. Product Roadmap & Go-To-Market Strategy**

                                    B2B2C VIRAL ACQUISITION LOOP  
                       ┌─────────────────────────────────────────────────────┐  
                       │          Onboard 1 Commercial Dental Lab            │  
                       └──────────────────────────┬──────────────────────────┘  
                                                  │  
                                                  │ (Forces workflow)  
                                                  ▼  
             ┌────────────────────────────────────┴────────────────────────────────────┐  
             ▼                                                                         ▼  
   \[ Clinic A (30 cases/mo) \]                                                \[ Clinic B (50 cases/mo) \]  
   \* Uses free web 3D viewer                                                 \* Enjoys real-time status  
   \* Adopts DCOS Chairside tools                                             \* Adopts DCOS Inventory Hub

> * **The Lab-First Distribution Loop:** Selling directly to fragmented clinics yields high Customer Acquisition Cost (CAC). Target commercial dental labs first: a single lab routes 30–100 clinics into DCOS for zero-friction scan submission, driving down CAC.  
> * **Pricing Architecture:**  
  * **Free/Starter:** $0/mo (Up to 20 active cases/mo, drag-and-drop WebGL viewer, basic tooth charting).  
  * **Pro Lab Center:** $99–$249/mo (Unlimited active cases, automated CAD bridge, WhatsApp bot alerts, inventory tracking).  
  * **Enterprise Pipeline:** Custom Retainer ($10,000+ onboarding \+ custom ARR for native background daemons, dedicated R2 storage isolation, and custom EMR integrations).

## **PART 2: Architectural Deconstruction & Next-Gen Reactive PMS Spec**

### **1\. Paradigm Shift: Legacy PMS vs. Next-Gen Reactive Stack**

Existing Patient Management Systems treat patients as static rows in isolated relational tables. The Next-Generation Reactive PMS models the clinic as an event-sourced, ambient-first, local-first reactive ecosystem.  
                    ┌────────────────────────────────────────────────────────┐  
                    │               AMBIENT MULTIMODAL INGESTION             │  
                    │  (Audio Stream Diarization \+ Intent Graph Extraction)  │  
                    └───────────────────────────┬────────────────────────────┘  
                                                │ Streaming Delta  
                                                ▼  
┌────────────────────────────────────────────────────────────────────────────────────────────┐  
│                             LOCAL-FIRST ENGINE (EDGE / WORKSTATION)                        │  
│  ┌───────────────────────┐      Bi-directional Sync       ┌─────────────────────────────┐  │  
│  │ Embedded SQLite / WASM│ ◄────────────────────────────► │ Local CRDT State (Yjs/Loro) │  │  
│  └───────────────────────┘                                └──────────────┬──────────────┘  │  
└──────────────────────────────────────────────────────────────────────────┼─────────────────┘  
                                                                           │ Encrypted  
                                                                           │ WebSocket/WebRTC  
                                                                           ▼  
┌────────────────────────────────────────────────────────────────────────────────────────────┐  
│                           CENTRAL EVENT-SOURCED CORE (CLOUD / ON-PREM)                     │  
│  ┌─────────────────────────────────┐           ┌────────────────────────────────────────┐  │  
│  │   Immutable Bi-Temporal Stream  │  ───────► │ Read-Model Projections (Native FHIR R5)│  │  
│  │  (EventStoreDB / Apache Kafka)  │           │ (Search, Graph Analytics, Dashboards)  │  │  
│  └────────────────┬────────────────┘           └────────────────────────────────────────┘  │  
│                   │                                                                        │  
│                   ▼                                                                        │  
│  ┌──────────────────────────────────────────────────────────────────────────────────────┐  │  
│  │            DETERMINISTIC CLINICAL & ADMINISTRATIVE AGENT LOOPS                       │  │  
│  │  • Autonomous Prior-Auth Engine     • Probabilistic Schedule Reshaper                │  │  
│  │  • Real-Time Claims Adjudication    • Automated Patient Routing State Machines       │  │  
│  └──────────────────────────────────────────────────────────────────────────────────────┘  │  
└────────────────────────────────────────────────────────────────────────────────────────────┘

| Layer | Traditional PMS Stack | Next-Gen Reactive PMS Stack | Core Architectural Innovation |
| :---- | :---- | :---- | :---- |
| **State & Storage** | Normalised SQL CRUD (Postgres/MySQL) | Bi-Temporal Event Store \+ Native FHIR Graph Projections | Immutable event stream; instantaneous time-travel audits; zero schema drift across EHR interop. |
| **Data Sync / Latency** | Request-Response REST/GraphQL to remote DB | Local-First Sync Engines via CRDTs & Embedded SQLite | Sub-millisecond UI interaction; 100% offline resilience; peer-to-peer clinic mesh sync. |
| **Data Ingestion** | Manual form entry, multi-tab dropdowns | Ambient Multimodal Capture & Constrained Decoding | Audio/vision streams parsed into structured FHIR entities in real time; zero manual typing. |
| **Scheduling** | Static fixed-interval slot booking | Probabilistic Dynamic Binning & Real-Time Queue Optimization | ML-driven slot duration based on patient acuity, provider fatigue, and no-show risk distributions. |
| **Insurance / Billing** | Batch EDI 837/835 flat-file uploads | Agentic Clearinghouse Micro-Tunnels & Real-Time Adjudication | Autonomous prior-auth agents, deterministic code scrubbers, instant co-pay settlement at check-in. |

### **2\. Domain Event Model & Bi-Temporal Schema Specs**

Every mutation in the system is stored as an immutable event with two distinct time axes:

> 1. **Valid Time (observed\_at):** When the event occurred in human reality.  
> 2. **Transaction Time (system\_at):** When the system ingested and appended the event.

#### **Core Taxonomy**

> * **Registration & Identity:** PatientRegistered, IdentityVerified, CoverageAttached, ConsentGranted  
> * **Scheduling & Flow:** AppointmentEnqueued, QueueStateReshaped, PatientCheckedIn, ProviderAssigned  
> * **Clinical Encounters:** EncounterStarted, AudioDiarizationChunkIngested, ObservationExtracted, ConditionDiagnosed, ServiceRequested  
> * **Revenue Cycle:** ChargeCaptured, PriorAuthRequested, ClaimAdjudicated, PaymentSettled

#### **Event Schemas**

##### **1\. PatientRegistered**

{  
  "$schema": "https://json-schema.org/draft/2020-12/schema",  
  "title": "PatientRegistered",  
  "type": "object",  
  "properties": {  
    "event\_id": { "type": "string", "format": "uuid" },  
    "aggregate\_id": { "type": "string", "format": "uuid" },  
    "event\_type": { "type": "string", "const": "PatientRegistered" },  
    "version": { "type": "integer", "const": 1 },  
    "system\_at": { "type": "string", "format": "date-time" },  
    "observed\_at": { "type": "string", "format": "date-time" },  
    "actor\_id": { "type": "string", "format": "uuid" },  
    "payload": { "type": "object", "required": \["mrn", "name", "gender", "birth\_date"\], "properties": {  
        "mrn": { "type": "string" },  
        "name": { "type": "object", "required": \["family", "given"\], "properties": {  
            "family": { "type": "string" },  
            "given": { "type": "array", "items": { "type": "string" } }  
          }  
        },  
        "gender": { "type": "string", "enum": \["male", "female", "other", "unknown"\] },  
        "birth\_date": { "type": "string", "format": "date" },  
        "telecom": { "type": "array", "items": { "type": "object", "properties": {  
              "system": { "type": "string", "enum": \["phone", "email"\] },  
              "value": { "type": "string" }  
            }  
          }  
        }  
      }  
    }  
  },  
  "required": \["event\_id", "aggregate\_id", "event\_type", "version", "system\_at", "observed\_at", "actor\_id", "payload"\]  
}

##### **2\. InsurancePolicyAttached**

{  
  "$schema": "https://json-schema.org/draft/2020-12/schema",  
  "title": "InsurancePolicyAttached",  
  "type": "object",  
  "properties": {  
    "event\_id": { "type": "string", "format": "uuid" },  
    "aggregate\_id": { "type": "string", "format": "uuid" },  
    "event\_type": { "type": "string", "const": "InsurancePolicyAttached" },  
    "version": { "type": "integer", "const": 1 },  
    "system\_at": { "type": "string", "format": "date-time" },  
    "observed\_at": { "type": "string", "format": "date-time" },  
    "actor\_id": { "type": "string", "format": "uuid" },  
    "payload": { "type": "object", "required": \["coverage\_id", "payer\_id", "subscriber\_id", "relationship"\], "properties": {  
        "coverage\_id": { "type": "string", "format": "uuid" },  
        "payer\_id": { "type": "string" },  
        "payer\_name": { "type": "string" },  
        "subscriber\_id": { "type": "string" },  
        "relationship": { "type": "string", "enum": \["self", "spouse", "child", "other"\] },  
        "period": { "type": "object", "properties": {  
            "start": { "type": "string", "format": "date" },  
            "end": { "type": "string", "format": "date" }  
          }  
        }  
      }  
    }  
  },  
  "required": \["event\_id", "aggregate\_id", "event\_type", "version", "system\_at", "observed\_at", "actor\_id", "payload"\]  
}

##### **3\. EncounterScheduled**

{  
  "$schema": "https://json-schema.org/draft/2020-12/schema",  
  "title": "EncounterScheduled",  
  "type": "object",  
  "properties": {  
    "event\_id": { "type": "string", "format": "uuid" },  
    "aggregate\_id": { "type": "string", "format": "uuid" },  
    "event\_type": { "type": "string", "const": "EncounterScheduled" },  
    "version": { "type": "integer", "const": 1 },  
    "system\_at": { "type": "string", "format": "date-time" },  
    "observed\_at": { "type": "string", "format": "date-time" },  
    "actor\_id": { "type": "string", "format": "uuid" },  
    "payload": { "type": "object", "required": \["patient\_id", "provider\_id", "planned\_start", "estimated\_duration\_minutes", "cpt\_codes"\], "properties": {  
        "patient\_id": { "type": "string", "format": "uuid" },  
        "provider\_id": { "type": "string", "format": "uuid" },  
        "planned\_start": { "type": "string", "format": "date-time" },  
        "estimated\_duration\_minutes": { "type": "integer" },  
        "cpt\_codes": { "type": "array", "items": { "type": "string" } },  
        "priority": { "type": "string", "enum": \["routine", "urgent", "emergency"\] }  
      }  
    }  
  },  
  "required": \["event\_id", "aggregate\_id", "event\_type", "version", "system\_at", "observed\_at", "actor\_id", "payload"\]  
}

##### **4\. VitalsRecorded**

{  
  "$schema": "https://json-schema.org/draft/2020-12/schema",  
  "title": "VitalsRecorded",  
  "type": "object",  
  "properties": {  
    "event\_id": { "type": "string", "format": "uuid" },  
    "aggregate\_id": { "type": "string", "format": "uuid" },  
    "event\_type": { "type": "string", "const": "VitalsRecorded" },  
    "version": { "type": "integer", "const": 1 },  
    "system\_at": { "type": "string", "format": "date-time" },  
    "observed\_at": { "type": "string", "format": "date-time" },  
    "actor\_id": { "type": "string", "format": "uuid" },  
    "payload": { "type": "object", "required": \["encounter\_id", "vitals"\], "properties": {  
        "encounter\_id": { "type": "string", "format": "uuid" },  
        "vitals": { "type": "array", "items": { "type": "object", "required": \["code", "value", "unit"\], "properties": {  
              "code": { "type": "string" },  
              "display": { "type": "string" },  
              "value": { "type": "number" },  
              "unit": { "type": "string" }  
            }  
          }  
        }  
      }  
    }  
  },  
  "required": \["event\_id", "aggregate\_id", "event\_type", "version", "system\_at", "observed\_at", "actor\_id", "payload"\]  
}

##### **5\. ClinicalObservationExtracted**

{  
  "$schema": "https://json-schema.org/draft/2020-12/schema",  
  "title": "ClinicalObservationExtracted",  
  "type": "object",  
  "properties": {  
    "event\_id": { "type": "string", "format": "uuid" },  
    "aggregate\_id": { "type": "string", "format": "uuid" },  
    "event\_type": { "type": "string", "const": "ClinicalObservationExtracted" },  
    "version": { "type": "integer", "const": 1 },  
    "system\_at": { "type": "string", "format": "date-time" },  
    "observed\_at": { "type": "string", "format": "date-time" },  
    "actor\_id": { "type": "string", "format": "uuid" },  
    "payload": { "type": "object", "required": \["encounter\_id", "fhir\_observation"\], "properties": {  
        "encounter\_id": { "type": "string", "format": "uuid" },  
        "source\_audio\_segment\_id": { "type": "string" },  
        "confidence\_score": { "type": "number" },  
        "fhir\_observation": { "type": "object", "required": \["resourceType", "code", "status"\], "properties": {  
            "resourceType": { "type": "string", "const": "Observation" },  
            "status": { "type": "string", "const": "preliminary" },  
            "code": { "type": "object" },  
            "valueQuantity": { "type": "object" },  
            "valueString": { "type": "string" }  
          }  
        }  
      }  
    }  
  },  
  "required": \["event\_id", "aggregate\_id", "event\_type", "version", "system\_at", "observed\_at", "actor\_id", "payload"\]  
}

##### **6\. ClaimAdjudicated**

{  
  "$schema": "https://json-schema.org/draft/2020-12/schema",  
  "title": "ClaimAdjudicated",  
  "type": "object",  
  "properties": {  
    "event\_id": { "type": "string", "format": "uuid" },  
    "aggregate\_id": { "type": "string", "format": "uuid" },  
    "event\_type": { "type": "string", "const": "ClaimAdjudicated" },  
    "version": { "type": "integer", "const": 1 },  
    "system\_at": { "type": "string", "format": "date-time" },  
    "observed\_at": { "type": "string", "format": "date-time" },  
    "actor\_id": { "type": "string", "format": "uuid" },  
    "payload": { "type": "object", "required": \["claim\_id", "payer\_id", "status", "total\_submitted", "total\_benefit"\], "properties": {  
        "claim\_id": { "type": "string", "format": "uuid" },  
        "payer\_id": { "type": "string" },  
        "status": { "type": "string", "enum": \["approved", "partial", "denied"\] },  
        "total\_submitted": { "type": "number" },  
        "total\_benefit": { "type": "number" },  
        "patient\_responsibility": { "type": "number" },  
        "adjudication\_items": { "type": "array", "items": { "type": "object" } }  
      }  
    }  
  },  
  "required": \["event\_id", "aggregate\_id", "event\_type", "version", "system\_at", "observed\_at", "actor\_id", "payload"\]  
}

### **3\. Local-First Sync Architecture & CRDT Topology**

The edge client UI executes against an in-memory embedded database (LibSQL/SQLite via OPFS in browsers or native SQLite on Tauri/Desktop). Mutations occur sub-millisecond on local state using Loro/Yjs state vectors and CRDTs before asynchronous propagation.  
       EDGE WORKSTATION A                     EDGE WORKSTATION B  
 ┌────────────────────────────┐         ┌────────────────────────────┐  
 │  Local Mutation (0ms UI)   │         │  Local Mutation (0ms UI)   │  
 │   Embedded LibSQL / OPFS   │         │   Embedded LibSQL / OPFS   │  
 └─────────────┬──────────────┘         └─────────────┬──────────────┘  
               │                                      │  
               ▼                                      ▼  
 ┌────────────────────────────┐         ┌────────────────────────────┐  
 │  State Vector Delta (Loro) │         │  State Vector Delta (Loro) │  
 └─────────────┬──────────────┘         └─────────────┬──────────────┘  
               │                                      │  
               └───────────────► ┌──────────────────┐ ◄───────────────┘  
                                 │ Peer-to-Peer Mesh│  
                                 │ WebRTC / WebSocket│  
                                 └────────┬─────────┘  
                                          │ Encrypted Vector Stream  
                                          ▼  
                               ┌─────────────────────┐  
                               │ Central EventStoreDB│  
                               └─────────────────────┘

#### **Vector Clock Sync & Offline Reconciliation (TypeScript Protocol)**

import \* as Loro from 'loro-crdt';

export interface ClockVector {  
  clientId: string;  
  counter: number;  
}

export interface SyncMessage {  
  senderId: string;  
  vector: Record\<string, number\>;  
  changes: Uint8Array;  
}

export class LocalFirstSyncEngine {  
  private doc: Loro.LoroDoc;  
  private localVector: Record\<string, number\> \= {};  
  private clientId: string;  
  private websocket: WebSocket | null \= null;

  constructor(clientId: string) {  
    this.clientId \= clientId;  
    this.doc \= new Loro.LoroDoc();  
    this.doc.setPeerId(BigInt(parseInt(clientId.replace(/-/g, '').substring(0, 8), 16)));  
  }

  public applyLocalMutation(mapName: string, key: string, value: any): Uint8Array {  
    const map \= this.doc.getMap(mapName);  
    map.set(key, value);  
    this.doc.commit();  
      
    this.localVector\[this.clientId\] \= (this.localVector\[this.clientId\] || 0\) \+ 1;  
    return this.doc.exportFrom();  
  }

  public receiveRemoteSync(msg: SyncMessage): void {  
    // Determine missing updates based on vector clocks  
    const needsImport \= Object.entries(msg.vector).some((\[peer, counter\]) \=\> {  
      return counter \> (this.localVector\[peer\] || 0);  
    });

    if (needsImport) {  
      this.doc.import(msg.changes);  
      // Merge vectors  
      for (const \[peer, counter\] of Object.entries(msg.vector)) {  
        this.localVector\[peer\] \= Math.max(this.localVector\[peer\] || 0, counter);  
      }  
      this.notifyUI();  
    }  
  }

  private notifyUI(): void {  
    const state \= this.doc.toJSON();  
    window.dispatchEvent(new CustomEvent('pms-state-update', { detail: state }));  
  }  
}

### **4\. Ambient Multimodal Clinical Ingestion Engine**

Clinicians interact naturally with patients while ambient microphones stream audio to an edge worker. The audio is diarized and parsed using **Grammar-Constrained Decoding** directly into valid HL7 FHIR R5 payloads without intermediate copy-pasting.  
 Ambient Audio ──► WebRTC Stream ──► Whisper Worker ──► Grammar Parser ──► FHIR R5 Payload

#### **Production Python Scaffolding (Grammar-Constrained FHIR Ingestion)**

import json  
import asyncio  
from typing import Dict, Any, List  
from pydantic import BaseModel, Field, ValidationError

\# \--- Target FHIR R5 Schemas \---

class FHIRCoding(BaseModel):  
    system: str \= "http://snomed.info/sct"  
    code: str  
    display: str

class FHIRCodeableConcept(BaseModel):  
    coding: List\[FHIRCoding\]

class FHIRQuantity(BaseModel):  
    value: float  
    unit: str  
    system: str \= "http://unitsofmeasure.org"  
    code: str

class FHIRObservationPayload(BaseModel):  
    resourceType: str \= Field(default="Observation", const=True)  
    status: str \= Field(default="final")  
    code: FHIRCodeableConcept  
    valueQuantity: FHIRQuantity | None \= None  
    valueString: str | None \= None

class FHIRConditionPayload(BaseModel):  
    resourceType: str \= Field(default="Condition", const=True)  
    clinicalStatus: str \= Field(default="active")  
    code: FHIRCodeableConcept

class AmbientExtractionResult(BaseModel):  
    encounter\_id: str  
    observations: List\[FHIRObservationPayload\]  
    conditions: List\[FHIRConditionPayload\]

class GrammarConstrainedExtractor:  
    """  
    Simulates grammar-constrained decoding engine.  
    Applies JSON Schema enforcement directly onto transcription logits stream.  
    """  
    def \_\_init\_\_(self):  
        self.snomed\_dictionary \= {  
            "caries": {"code": "80967001", "display": "Dental Caries"},  
            "gingivitis": {"code": "66383009", "display": "Gingivitis"},  
            "blood pressure": {"code": "75367002", "display": "Blood Pressure"}  
        }

    async def extract\_fhir\_entities(self, audio\_transcript: str, encounter\_id: str) \-\> Dict\[str, Any\]:  
        \# Simulated constrained LLM decoding via schema enforcement  
        extracted\_data \= {  
            "encounter\_id": encounter\_id,  
            "observations": \[  
                {  
                    "resourceType": "Observation",  
                    "status": "final",  
                    "code": {  
                        "coding": \[{  
                            "system": "http://loinc.org",  
                            "code": "8480-6",  
                            "display": "Systolic blood pressure"  
                        }\]  
                    },  
                    "valueQuantity": {  
                        "value": 120.0,  
                        "unit": "mmHg",  
                        "system": "http://unitsofmeasure.org",  
                        "code": "mm\[Hg\]"  
                    }  
                }  
            \],  
            "conditions": \[  
                {  
                    "resourceType": "Condition",  
                    "clinicalStatus": "active",  
                    "code": {  
                        "coding": \[{  
                            "system": "http://snomed.info/sct",  
                            "code": "80967001",  
                            "display": "Dental Caries on Tooth 16"  
                        }\]  
                    }  
                }  
            \]  
        }

        \# Strict validation  
        try:  
            validated \= AmbientExtractionResult(\*\*extracted\_data)  
            return validated.model\_dump()  
        except ValidationError as e:  
            raise ValueError(f"Extracted payload failed FHIR R5 Structure Definition: {e}")

\# \--- Execution Example \---  
if \_\_name\_\_ \== "\_\_main\_\_":  
    extractor \= GrammarConstrainedExtractor()  
    sample\_transcript \= "Patient presents with dental caries on tooth 16, blood pressure is 120 over 80."  
    result \= asyncio.run(extractor.extract\_fhir\_entities(sample\_transcript, "enc-77821-uuid"))  
    print(json.dumps(result, indent=2))

### **5\. Probabilistic Dynamic Scheduling Engine**

Fixed appointment blocks are replaced with a dynamic queue model. The system continuously evaluates appointment duration as a function of patient arrival probability, procedure variance, and provider fatigue.

#### **Mathematical Model**

The estimated appointment duration ![][image1] and queue state are modeled as:  
![][image2]![][image3]Where:

> * ![][image4] \= Baseline time for ICD/CPT code combination.  
> * ![][image5] represents the provider cognitive fatigue multiplier.  
> * ![][image6] \= Historical variance for specific procedures.  
> * ![][image7] \= Confidence scaling factor for buffer allocation (![][image8] for 90% coverage).

                      DYNAMIC QUEUE STATE MACHINE  
 ┌──────────────┐   Check-In    ┌──────────────┐   Variance \> Threshold  ┌──────────────┐  
 │   ENQUEUED   ├──────────────►│  IN\_CHAIR    ├────────────────────────►│  RESHAPING   │  
 └──────┬───────┘               └──────┬───────┘                         └──────┬───────┘  
        │                              │                                        │  
        │ No-Show Risk                 │ Completed                              │ Recalculated  
        ▼                              ▼                                        ▼  
 ┌──────────────┐               ┌──────────────┐                         ┌──────────────┐  
 │  AUTO\_CANCEL │               │  DISCHARGED  │                         │  NOTIFIED    │  
 └──────────────┘               └──────────────┘                         └──────────────┘

#### **Production Rust Implementation**

use serde::{Serialize, Deserialize};  
use std::collections::HashMap;

\#\[derive(Debug, Clone, Serialize, Deserialize)\]  
pub enum QueueState {  
    Enqueued,  
    InChair,  
    Reshaping,  
    Notified,  
    Discharged,  
    AutoCancelled,  
}

\#\[derive(Debug, Clone, Serialize, Deserialize)\]  
pub struct AppointmentSlot {  
    pub appointment\_id: String,  
    pub patient\_id: String,  
    pub base\_duration\_min: f64,  
    pub cpt\_variances: Vec\<f64\>,  
    pub arrival\_mean\_offset\_min: f64,  
    pub transit\_variance: f64,  
}

pub struct ProbabilisticScheduler {  
    pub fatigue\_alpha: f64, // e.g., 0.05  
    pub confidence\_factor\_k: f64, // e.g., 1.28  
}

impl ProbabilisticScheduler {  
    pub fn new(fatigue\_alpha: f64, confidence\_factor\_k: f64) \-\> Self {  
        Self { fatigue\_alpha, confidence\_factor\_k }  
    }

    pub fn calculate\_dynamic\_duration(\&self, slot: \&AppointmentSlot, shift\_hours\_elapsed: f64) \-\> f64 {  
        // Cognitive fatigue multiplier: beta(t) \= alpha \* ln(1 \+ t)  
        let fatigue\_beta \= self.fatigue\_alpha \* (1.0 \+ shift\_hours\_elapsed).ln();  
          
        // Sum procedure variances  
        let total\_proc\_variance: f64 \= slot.cpt\_variances.iter().sum();  
        let procedure\_std\_dev \= total\_proc\_variance.sqrt();

        // Calculate expected duration  
        let adjusted\_base \= slot.base\_duration\_min \* (1.0 \+ fatigue\_beta);  
        let duration\_buffer \= self.confidence\_factor\_k \* procedure\_std\_dev;

        adjusted\_base \+ duration\_buffer  
    }

    pub fn evaluate\_queue\_rebalance(  
        \&self,  
        queue: Vec\<AppointmentSlot\>,  
        shift\_hours\_elapsed: f64  
    ) \-\> HashMap\<String, (f64, QueueState)\> {  
        let mut schedule\_plan \= HashMap::new();  
        let mut current\_timeline\_cursor \= 0.0;

        for slot in queue {  
            let predicted\_duration \= self.calculate\_dynamic\_duration(\&slot, shift\_hours\_elapsed);  
              
            // Check for delay propagation  
            let state \= if slot.arrival\_mean\_offset\_min \> 15.0 {  
                QueueState::Reshaping  
            } else {  
                QueueState::Enqueued  
            };

            schedule\_plan.insert(slot.appointment\_id.clone(), (current\_timeline\_cursor, state));  
            current\_timeline\_cursor \+= predicted\_duration;  
        }

        schedule\_plan  
    }  
}

fn main() {  
    let scheduler \= ProbabilisticScheduler::new(0.05, 1.28);  
    let slot \= AppointmentSlot {  
        appointment\_id: "app-101".to\_string(),  
        patient\_id: "pat-505".to\_string(),  
        base\_duration\_min: 45.0,  
        cpt\_variances: vec\!\[4.0, 9.0\], // std dev sum  
        arrival\_mean\_offset\_min: 2.0,  
        transit\_variance: 1.5,  
    };

    let duration \= scheduler.calculate\_dynamic\_duration(\&slot, 4.5); // 4.5 hours into shift  
    println\!("Dynamic Duration Prediction: {:.2} minutes", duration);  
}

### **6\. Security, Access Control & Cryptographic Audit Ledgers**

#### **Attribute-Based Access Control (ABAC) Policy Schema**

Access to clinical events is evaluated dynamically using ABAC attributes:

![][image9]{  
  "$schema": "https://json-schema.org/draft/2020-12/schema",  
  "title": "ABACPolicy",  
  "type": "object",  
  "properties": {  
    "policy\_id": { "type": "string" },  
    "target\_event": { "type": "string" },  
    "rules": {  
      "type": "array",  
      "items": {  
        "type": "object",  
        "properties": {  
          "attribute": { "type": "string" },  
          "operator": { "type": "string", "enum": \["EQUALS", "IN", "NOT\_IN", "CONTAINS"\] },  
          "value": { "type": "string" }  
        }  
      }  
    }  
  }  
}

#### **Cryptographic Merkle Verification for Audits**

Every event block generates a SHA-256 hash incorporating the previous event's hash, forming an immutable tamper-evident Merkle chain:  
![][image10]     Event Block 01                Event Block 02                Event Block 03  
 ┌────────────────────┐        ┌────────────────────┐        ┌────────────────────┐  
 │ Event: PatientReg  │        │ Event: VitalsRec   │        │ Event: ObsExtracted│  
 │ PrevHash: 00000000 │ ─────► │ PrevHash: H(Block1)│ ─────► │ PrevHash: H(Block2)│  
 │ Hash: H(Block1)    │        │ Hash: H(Block2)    │        │ Hash: H(Block3)    │  
 └────────────────────┘        └────────────────────┘        └────────────────────┘

When regulatory inspectors request audit validation, the system yields a deterministic zero-knowledge inclusion proof verifying that clinical notes or billing events were never mutated or deleted post-hoc.

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAE8AAAAaCAYAAAD2dwHCAAACHklEQVR4Xu2X4U3EMAxGMwMrMAMrsAIrsAIrsAEjMAIbsAEbsAADQJ/SJ1lWWtpIx/3AT4quTZzE+eI4vdaKoiiKYoK7pXzvlK+lvK12xQavrYuVRbpdynvrIua2YuWzdYFG3LTehohFgugi6jieWyAcNtgWgcfWhXnKDQHFu88N/52tfBcp8TbYy3fi7Uv+K1aO5LuH1m0+csMkjPeSK68AgcCaWNsUR/Kdx5pFz/Cc3plzb7NmyfMcAQGnxfst3/kRPbtYnJvtewZy8Yx4MC3eXr4zrCk51xGpHD2KwhOZ1FNYiB/YzMG7lw1i+s1IPc8uns1kHIrvzs0v79Y7L32Zg3GcF/jVPgpLP+tNSafZy3ccLRyibSQckwNjYAcxJ5rTWFj+uKYuOky7PuiTacQNAnxyoxVMskD4TLtC4i/99dc1nRYP5XHCGzQX/88aKRlEcpcp9NEp2uLuHxUvLjy2GZnCoo3KbBfHUBTrGcNoi+NlXy4OIkVHhYURMQjPBvAexYuCzoiHIGyOm5rtHIN5iLKRKFcXj2PksQUWZT4SHCTCcc7j7OKyw0fFi3ZeZIxFod7jzTMCsoHx7ySCYsvmS/bl4niD4iyOmp+MSJxUSC8d7VgMfXGYd2xZpBHFmLTxq/C0Y0fhnV/aeWYs5kBM3u0HbKqCU6+QPNNPP5kvbvyfgNPxMom3YmZUN0uMpsxonpG9vo/si6IoioUfYZHE9qoVw+YAAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAmwAAAAqCAYAAAAOCwd9AAADj0lEQVR4Xu3c3Y0jRRQF4I2BFIiBFEiBR3gkhU2BDAiBEMiADMiABAgA5khzpLtXbU+jmR33oO+TWt3uv6pqP/jolu1PnwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIBX+OV5/fcXewEALu7bvePJr0/LP0/Ln2Pfz2P7o/rhef3XF3vf1m97BwDwGH/cWb4f511d+ppwtqUC9c3aN8PbR/c1K2yt4gEADzbDTCpRH1UrabvK9t16/X+orkXet/eogCW4AwAPNMNLtj9yRSVhbU99dtqwEnKOQumuwF1NQmcqiFkaQDveo/G8pUy5ft47AYDHSLXmI02BTgkxqQQlrM0As6dIM76jgDPPm6HoChKWZjjL8p4BM8/1PSp5AMAJR0HmjExB/r53HkgIuvfdsYSQVHOyTmVsT13u8DWl/dx/VtDSr91eKoh7nLvqtq85K/fefX6tPIcZHh9RAU2bpkUB4CJ2kDmr1a0z7lXwUkmaxxPCWkl6abp2fvE+1zXw7WuOAlvO7b4d3s5oGwmUu71bzp63fwF69rqzEmpfqtYJbABwIUdBJR/W/R5YPrQTqhKIsp2Aku1+oCdsZbvrBKaGmN7jXmA7moZMoDgTUvZ9M5ajX0/OcFapqDWQpL85njZ/fH6d7U4JJtzkdfuaQJVr088+k8g6S/en3dyjPxRIG7sat4NT2ph97fW1x/xat55z+i+wAcADJVAkFHRJeJnBKaEgoSTrGRCyPacOZ4Uq95xhpPfo9ltKKNsBLNK3WwFkB7mOPQEr/c7x9r9BJePqc5mhL220nQbXtp0lz6Jjnuce9Tnt72CUNrt/B9r5LBPm0ue+n30fIuPJuQ2dM5zG7N+R3K+BGwC4mAavfMAfBbYZLmYAaRCIBLXeI946sLWStfX7bEf2F+jb9wai+bcgc4zpe4JL1juwtRKY8xtO61Zg238/Ejuwxa1nNvfvQJV2enz2NTL+PLMefymw7YALAFxIAkzCVqY9EySybjjKdj/Is28GthlYGthy/k/P66OA9d4aThLqPs8DS/vfMWU7S6poGUt/SJHQk3X/pDdjbJDrmHO8VcmGpinX3QqZRxoeY4auGY7z+iiwzde9tn2e7gVfAICv6mwImdO+V3N2DNt/CYZ7GhYA4FLO/uABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgtn8Bo6bUfP3bENMAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,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>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAaCAYAAAAjZdWPAAABYUlEQVR4Xu2WURHCMBBETwMW0IAFDPCBBSSABRwgAQk4wAEOMIAA6Jt0Z8LRpP2AJsNkZzJtc9tk724bMGtoaKgOq248M+PRjUvPqw5nCyK9uGU3rhbE+1hx3C0IG8LCQgzx1YBqUmVskAKC4cCtAjsLgg4+EEGi1z5QCik/x6hOdM7Pgk4T/F0cU/y8tcC59c9ceS6GKX6WfRAvFBU95mf9+PhOFBWd8zP+xQoM72VV/mghcSUNj2c/D+gmnSXGFWBP8RmjyPmZRUmImBcM4u4Qh8t6vKcicNIwr/tTfw8fgfF7APFK5gNsxsI6EfzQ/43c8ebtwZGo7wIx6oJ4cYHgicOcqswaCP8ZhkSzMUKwkxKOeQiHQxy+DoHZwGaxbWgzQiUe6CNmfm/vraebJKGrkLTHN0C18CiVVcsBmxLjSpx74ptonqTE530lCn+W/zapTfy8ujL0UQPPb2j4a7wA7Gp5K/uh4lYAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAO4AAAAaCAYAAACw7WAtAAAFjklEQVR4Xu2Z7ZHUMBBEHQMpEAMB8IcUSIEUSIEMCIEQyIAMyOASIAC4V3tdTHWNPmzLa9+tXpVqd2VbGs1Mj2zvskwmk8lkMplMJpMD+eAdBXrPm+S8f27vvHNyee4et8/P7ctym7gEx394Z4Fvy+38R4KAjShYjPFruXMCTIZAzO4SO5Lk53ITGe3PchOxw3m/vbMBC8jGemt8em5/Xxpr3gMBx8+1Avp1qR+fnAv5sFYrqyD4Xh3YKbNJn5abQRmIM0tYxqcQHF59LgJ+y/ywBu5oiIFD3/flFgcKRCkW94C4torLo1OK4xDYad35TEZyRNiJvS9CsmZiB+Y4bAEXAz/sES6xQJQeE8CHFEjEu1e4e2wEbMGGRynIW+AO9ZBNi4FJAgcB+nMs4svOFQSxdLwl+rfEXuFyC1wqgEKiOVO4tUI9+Q95T/4PBaEhXioCSUCVZxKvEnzPEoXz6SPZOE5C8dsrjHaRES9t9iJ7fS2jcOEyD03P+fJx6bkfMbTuTs4SrvKExvwUc+XNJIcNED8NRcFDqHqxkglMgXJBIgDGoKropQwtCyTHh1eeFbAm7KRYsR6ciUi0plEJ6MLlu/yrZ1REy9zZjsV5JVGLs4TLfNppmV/P8y17H5nssXMXJKwqgXZO+qgQHlQER6BKKJg1ML61kygx1rQeselZg3VE6NMjga95K7IrIqFR6ATJ7uLTnUlLkGcJVxz9fOsbx2uGnKtpZzUkTkwkod01okCV4Fjp+VaQKC3hHgVFIyss2MQxEsWf6SP6e6bnlqcm3Jjo8nMUX9aXsUa4KsreWI/30XpEw/oyfzokLf51fwhyMOYNtuLjtbeX+puylqNnoZgOA4dlQVKF8L+HSpPLsNbt0lnC1XqyIoVNHOOztnPjJ85jh25RE24kE2nWl7FGuJwrm2JjLd5H6xEMc7cKtdD8GcQmzqe/T/A3+aRi0sNwgQxiuF2liklAPEGzxBPZbpJB8FrCjS8/eltr3lqSkygca9kFXF8Tt7iacEu4jb3IxlahFjXhOpwX18S1vWuUXVdjqF16S+zQj2g9kfU8loGzYxHgdyamHoFQaTlnTcvminBOyfbasa3sEa7i0kpWjdc6r4bb2Ivmlt/5LRFzV8MuSh+fOs5cHGNT4Ldgt5UdrOVpuRVTruV8vYOI15SIBYXzuc7vGmnxTlO2ydZoD+NEu3WHka2xRhb7zWAUTvFbZRaLCF0MulX084F+LUoLytibaFtRQN12AhCfi/z4VvYIF4gLttU4U7hcp0KNz3Sriy3KA/JHecBn/HsRccrXvhsxdswffveu0f1JLsuP2BVFhv26e4pz+obGdbKXdZbWWEPFYQhaCAvgO4PzvWZI9lYWuF7jlF7wyKleEO4FASQAqrg4krUQPFV1JeBWtMbYsj4FMvbFwGJHyY9+XRxzLVuTSUVf61BM9UYc+/F33JHjXFGMRwhXMI7GUixEnMfn9DEkVCitsQbjxzF2ER1JNenZbWrJzfW15z8ML117L3AywXM71X8VKCj+juEItgoX8GGWM/RrE9D4I4RLjFoi8bEk3OwvtigmnzMbI5KtsYR28MxXq2GwLSKSA1oOzGC3u5I4rg7+0nPjUVAgRkJ845gqPnuFix84r5U/PlYUnfsT0el3nFM5Lly4pTWW4NyWuLvBYLb5LVClvAK1YK4theKRIUbDAn4nSGoEQbKSI8RdfXrMovGdfPj48olQOFfHNAYo8f1Fk6P/fxmLHNW8NL6z40mgnsPyNZ8cYwzm0xiIXvZkayyBvVw7ZLcFJt06GMZgeO/1cljN6ZOc+HLlNaAYj451HE87oLfWbixqtvXY33OO0Nvxy4DRpZcnDk7tWeQkhx3An8kn14cN61KinUwmk8lkMplM3ij/AL8TAkGYaxMPAAAAAElFTkSuQmCC>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEoAAAAbCAYAAADbAhkjAAACFElEQVR4Xu2YAVHEMBBFowELaMACFrCABSzgAAlIwAEOcIABBEDftG9u2Ul6ZQg3ZZo3k2mb5JLtz+4mvVIGgz1wP5WXqTxO5Sq1DRYQ53a5f57KW2gbBF7L7E2AN32Wk3CDAKLcLPfXZQi1CcJwhN4Z8CpEGsl8BUR6Wu4JP8ohIefkohh4EMnc+rgLHgIEwEtIzrViLkKk3HYYEAkhKHdl9hDOSIjg88hFZfak9/JdDMQZW3/As9BDqh9CJQgtBPEQKQhH/d52NNPExXOjgmQIRT9V9oafThfF0Iueg3h7P0xeXCjgbxM8iDMRH73seDWR8DDaCVf60s+Q9beMRT1X8HBKOyViHf0ZE1gwnnN/xrHedAFxXtBGoB/3LDw2xENybY5NIMy5Y0D+twDjP8rJG/FCRcIA6uO3IPUaq3je84KMz4I5nmPxHHflKBQghmPlsHRHx9a1ObqTXR4hWDHQ28TVFndSqO2oCuBK691r40AUCmIb9S4OtOboThYqGsl9fHkMqL1g9kxhZfP48FuhYltrju74osCV0POFs1AYFUOP1fQ5vxx9CYcYytYzJuEia0K5OUkWqjVHdzACV1YEJ+GKAVks+ho+Mflzpa+5ypA1ARsyvpB5jHn8vDJk/A1X+tmGHdiIyFGM1hxdcbV+Onhrk2iNU6tnDEuN6OlbqM3RBXPLVkMOi/FO+bPVGPxjvgDW+rgVTtmoyQAAAABJRU5ErkJggg==>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAbCAYAAACqenW9AAAAqElEQVR4Xu2SYQ2EMAxGqwELaMACFrBwFrCAAyTgBAc4wMAJuNujNOnKQvab8JJmsLVfvw5EnkF7xi1Lit8ZUzgr8hFN7uNBCVOvYk+xxs0SDBX9dinGFI3bO4h+Z9HCTbQgw/sl0VRjtwP8okIRicBK4sVGdbIN9xUtwMZFzfDDUXh7hfFjkEgXQCi7DVp7JZ7tnTWzhKqvHkSV8Y5yhk3vqfpVX6r4A9AILffqQy+fAAAAAElFTkSuQmCC>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAAAaCAYAAAD/nKG4AAAB9UlEQVR4Xu3YAVEDMRCF4dOABTRgAQtYwAIWcIAEJOAABzioAQRAP9ot2+31rqHQwpB/ZufaXHaTfdkknQ5Dp9Pp/G0u19aZ4HFpb2u7L+/Ozd3QtoAXw8rnaWkPS7vdfr1BTLk+r58tY3wEJdZ1fXEGTF6ii6FtToSSvFz4iMNfMWSuhlW/m2HVz9NYh46zqa7fgCQlQLAWseSgooiW28TIFaaP+BnvX0rbXihL7d9EVMahYpm//rZhwFdbzs33KpZ+r6VtFPu1nldK1aB5lU5Nq1iqgyjmHoyJpYIIk0VVxWyWel5xMlFBc8BT0yrWGOZfC0FVaQsRvavbdy/5vCJUVFUdpBIHaovV8p/iWLHMz/Fi0asQWbC5PLeIgESLEvYUoA5ySo4VSz5jQslNzvkSYfXW3CHOK3tYYM41+Lk4Riw7Y0wo3+WaY/pMPGPl826HfF4RjlM+DOfg12ItP/6+KpacqlDa8rtKiDi5HevvK0LFFSrw1AFvAMFbbHLlCnNiaa+VY2vV7WTMaIuKG0PuIeooHHMlxUEcn+tkTsmUWHEBucUColjofKGwxfBZMSq7bkOE72S+BszVY2U4ObsmVf5BJJhvqrC8ReI2y7+N9vlVweUlR9UmphiKZrbqxzr8h38fVBDBieXZ6XQ6nU6n8128A85QtEPr1yd4AAAAAElFTkSuQmCC>

[image9]: <data:image/png;base64,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>

[image10]: <data:image/png;base64,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>