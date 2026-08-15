# FORM 2
## THE PATENTS ACT, 1970 (39 OF 1970)
### & THE PATENTS RULES, 2003
# COMPLETE SPECIFICATION
*(See section 10 and rule 13)*

---

### 1. TITLE OF THE INVENTION
**A SYSTEM AND METHOD FOR DUAL-LAYER CONTEXT-AWARE CLINICAL-LABORATORY ASYNCHRONOUS MESSAGING AND SOFT-COPY CAD/CAM ARCHIVAL ENGINE**

---

### 2. APPLICANT(S)
- **Nationality:** Indian
- **Jurisdiction:** Indian Patent Office (New Delhi / Mumbai / Chennai / Kolkata)

---

### 3. PREAMBLE TO THE DESCRIPTION
The following specification particularly describes the invention and the manner in which it is to be performed.

---

### 4. FIELD OF THE INVENTION
The present invention relates to collaborative digital healthcare workflows and computer-aided design and manufacturing (CAD/CAM) in prosthodontics. Specifically, the invention relates to an asynchronous communication and production orchestration system featuring state-machine gated direct messaging, dual-layer operational timeline visibility, and automated Exocad CAD design parameter archiving with permanent remake warranty assurance.

---

### 5. BACKGROUND OF THE INVENTION & PRIOR ART LIMITATIONS
The restorative dental workflow requires continuous communication between prescribing clinicians (dentists/prosthodontists) and dental laboratories (CAD designers, CAM milling technicians, ceramists).

Current dental lab communication suffers from profound operational flaws:
1. **Unstructured Communication Channels:** Clinicians and lab technicians communicate over consumer messaging apps (e.g., WhatsApp, phone calls) or general emails. These communications are disconnected from the specific case order, 3D scan files, and CAD margin definitions.
2. **Premature & Cluttered Lab Inquiries:** Clinicians frequently barrage laboratory channels with inquiries or CAD revision notes before the lab has reviewed the case, verified scan quality, or accepted the order into production.
3. **Internal vs. External Operational Friction:** Dental labs have granular internal manufacturing milestones (e.g., nesting, 5-axis zirconia milling, sintering furnace cycles, glazing, QC margin inspection). Exposing every raw internal micro-state overwhelms clinicians, while exposing nothing results in endless phone check-ins.
4. **Remake Warranty & Design Loss:** In India and emerging markets, 5% to 15% of crowns or bridges require remakes due to patient shade dissatisfaction or fracture. Because laboratories overwrite or discard temporary design files after milling, a remake requires re-scanning the patient or re-designing from scratch, creating massive financial waste.

Accordingly, there is an urgent need for an order-locked communication engine with state-gated chat access, dual-layer timeline isolation, and permanent soft-copy CAD mesh archiving.

---

### 6. OBJECTS OF THE INVENTION
- **Primary Object:** To provide a state-machine driven bidirectional communication protocol where direct case messaging remains cryptographically locked in `DRAFT`, `PENDING`, and `REJECTED` states, and automatically unlocks upon the laboratory transitioning the order into `IN_PROGRESS` (Active Production).
- **Secondary Object:** To provide a dual-layer operational timeline filtering engine that partitions case events into `LAB_INTERNAL` (e.g., CAM nesting, sintering), `CLINIC_EXTERNAL`, and `BOTH` (e.g., Dispatched, Delivered), maintaining operational privacy while providing real-time transparency.
- **Another Object:** To automatically parse, extract, and bind Exocad `.constructionInfo` XML parameters (occlusal clearance, cement gap, contact strength, pontic geometry) to the cloud order record.
- **Yet Another Object:** To bind and store an encrypted permanent soft-copy CAD output mesh (.stl/.ply/.exocad), generating an immutable Remake Warranty Token that enables zero-cost 1-click re-milling without clinical re-scanning.

---

### 7. SUMMARY OF THE INVENTION

The system provides a unified clinical and digital laboratory operating workspace. The engine comprises:
1. A **State-Gated Chat Controller:** Maintains an access control evaluation:
   $$\text{ChatUnlocked}(S) = \begin{cases} \text{False}, & \text{if } S \in \{\text{DRAFT}, \text{PENDING}, \text{REJECTED}\} \\ \text{True}, & \text{if } S \in \{\text{IN\_PROGRESS}, \text{QUALITY\_CHECK}, \text{DISPATCHED}, \text{DELIVERED}\} \end{cases}$$
2. A **Dual-Visibility Timeline Filter:** Evaluates actor roles (Dentist vs. Lab Technician) against event visibility metadata (`LAB_ONLY`, `DENTIST_ONLY`, `BOTH`), streaming tailored websocket update payloads.
3. An **Automated CAD Bridge & Soft-Copy Archive:** Intercepts outgoing CAM milling meshes and Exocad metadata, persisting them to immutable cloud object storage tagged with SHA-256 case hashes.

```
                  STATE-GATED CLINICAL-LAB ENGINE
+-----------------------------------------------------------------------------------+
|  CASE STATUS: DRAFT / PENDING (Incoming Review)                                   |
|  - Lab Order Chat: [LOCKED] (Clinician cannot spam technician)                    |
|  - Production Rail: "Awaiting Lab Approval"                                       |
+-----------------------------------------+-----------------------------------------+
                                          |
                              [Lab Accepts Case -> IN_PROGRESS]
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  CASE STATUS: IN_PROGRESS / QUALITY_CHECK                                         |
|  - Lab Order Chat: [UNLOCKED & LIVE] (Realtime WebSocket active)                  |
|  - Dual Timeline: Internal sintering logged for lab; macro status for dentist     |
|  - CAD Soft-Copy: Milled mesh archived with Permanent Warranty Token               |
+-----------------------------------------------------------------------------------+
```

---

### 8. DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS

Referring to `src/components/patient-workspace/UnifiedClinicalWorkspace.tsx` and `src/lib/cad/ExocadBridge.ts`:

#### Embodiment 1: Asynchronous State Gating
When a dental practice submits a prescription, a Postgres record is committed with `status = 'PENDING'`. In the clinician's workspace, the chat component evaluates `isChatUnlocked = false`. Input fields are disabled with a visual lock badge. Upon the lab technician clicking "Accept Case" on their Kanban workstation, a database transition hook updates `status = 'IN_PROGRESS'`, creates an `order_chats` room UUID, and pushes a Postgres realtime change event that automatically unlocks the chat input on the clinician's screen in sub-50ms.

#### Embodiment 2: Exocad XML Parsing & Soft-Copy Binding
The laboratory uploads the finalized restorative CAD file alongside the `.constructionInfo` XML metadata. The parser extracts:
```xml
<DentalRestoration>
  <Tooth Number="16" RestorativeMaterial="ZirconiaHT" Shade="A2" MarginGap="0.03" CementGap="0.05" />
</DentalRestoration>
```
The values are stored in the relational schema and linked to the active warranty ledger.

---

### 9. WE CLAIM (PATENT CLAIMS)

1. **A system for orchestrating asynchronous clinical-laboratory workflows and digital prosthodontic communication, comprising:**
   - a state machine managing an order lifecycle comprising a plurality of sequential production states;
   - an order-specific real-time messaging engine configured to dynamically evaluate the current production state of a dental case order;
   - wherein said messaging engine locks communication channels while said dental case order resides in an unconfirmed intake state, and automatically provisions an encrypted real-time chat channel upon said dental case order transitioning to an active manufacturing state; and
   - a dual-layer operational timeline engine configured to filter granular manufacturing milestones between internal laboratory personnel and external clinical prescribers.

2. **The system as claimed in claim 1, further comprising:**
   - a CAD metadata parser configured to ingest an Exocad `.constructionInfo` structured XML file; and
   - automatically extract restorative material, tooth shade, margin gap, and cement clearance parameters to populate a clinical case specification.

3. **The system as claimed in claim 1, further comprising:**
   - an archival storage interface that ingests and cryptographically binds a finalized 3D CAD restorative mesh corresponding to a milled dental prosthetic; and
   - generates an immutable remake token enabling automated re-milling of identical restorative geometry without requiring re-acquisition of optical intraoral impressions.

---

### 10. ABSTRACT
A system and method for orchestrating clinical-laboratory prosthodontic workflows. The system enforces state-machine gated communication, locking direct chat until a dental laboratory formally accepts a case into active production, thereby eliminating premature clutter. A dual-layer timeline isolates internal fabrication events from clinician-facing progress updates. The system extracts structured CAD parameters from Exocad files and cryptographically archives the final 3D milled prosthetic geometry to guarantee permanent remake warranties without clinical re-scanning.
