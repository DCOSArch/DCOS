# FORM 2
## THE PATENTS ACT, 1970 (39 OF 1970)
### & THE PATENTS RULES, 2003
# COMPLETE SPECIFICATION
*(See section 10 and rule 13)*

---

### 1. TITLE OF THE INVENTION
**A SYSTEM AND METHOD FOR BI-TEMPORAL EVENT-SOURCED DENTAL STATE PROJECTION AND TAMPER-EVIDENT MERKLE CHAIN LEDGER FOR OPERATORY RECORDS**

---

### 2. APPLICANT(S)
- **Nationality:** Indian
- **Jurisdiction:** Indian Patent Office (New Delhi / Mumbai / Chennai / Kolkata)

---

### 3. PREAMBLE TO THE DESCRIPTION
The following specification particularly describes the invention and the manner in which it is to be performed.

---

### 4. FIELD OF THE INVENTION
The present invention relates generally to healthcare informatics and computerized dental practice management systems (PMS). More particularly, the invention relates to a cryptographic, bi-temporal event-sourced computational engine for reconstructing, auditing, and projecting multi-dimensional odontogram charts and periodontal matrices with mathematical non-repudiation and Ayushman Bharat Digital Mission (ABDM) FHIR R5 compliance.

---

### 5. BACKGROUND OF THE INVENTION & PRIOR ART LIMITATIONS
Conventional dental electronic health record (EHR) and Practice Management Systems (PMS) record patient clinical state through destructive `UPDATE` database operations. When a practitioner amends a tooth condition (e.g., from 'caries' to 'restoration' or updates a 6-point periodontal pocket depth from 4mm to 2mm), the prior state is overwritten or relegated to an unverified secondary log.

This architecture exhibits severe legal, clinical, and technological deficiencies:
1. **Destructive Overwriting:** In medico-legal malpractice disputes or dental insurance fraud investigations (under Section 33 of the Dentists Act, 1948 and Digital Personal Data Protection Act, 2023), conventional systems cannot mathematically prove what the oral cavity's exact physiological state was at a precise historical instant ($T_{\text{valid}}$) versus when the data entry was committed ($T_{\text{transaction}}$).
2. **Vulnerability to Internal Log Tampering:** Traditional relational audit tables can be modified by database administrators or unauthorized root actors without breaking cryptographic referential integrity.
3. **Loss of Historical Time-Travel Projection:** Clinicians cannot replay longitudinal treatment evolutions (e.g., bone resorption rates or wear facet progression over 5 years) through deterministic projection replay.

Accordingly, there exists a critical need in Indian and global digital dentistry for a non-destructive, bi-temporal event ledger coupled with cryptographic Merkle chain verification.

---

### 6. OBJECTS OF THE INVENTION
- **Primary Object:** To provide a system and method that eliminates destructive overwriting in dental charting by recording all clinical observations as immutable, append-only domain events.
- **Secondary Object:** To provide an SHA-256 Merkle chain linking mechanism where every clinical event contains the cryptographic hash of its predecessor, anchored to an unalterable Genesis block (`GENESIS_HASH_DCOS_V2_GENESIS_2026`).
- **Another Object:** To provide a bi-temporal projection engine enabling instantaneous reconstruction of complete 32-tooth FDI/Universal odontograms at any historical $(T_{\text{valid}}, T_{\text{transaction}})$ coordinate.
- **Yet Another Object:** To provide seamless serialization into HL7 FHIR R5 `Observation` and `DiagnosticReport` bundles encrypted via Fidelius (ECDH Curve25519 + AES-GCM-256) for India's ABDM M3 health information exchange.

---

### 7. SUMMARY OF THE INVENTION
The present invention provides a bi-temporal event-sourcing computing system. Each clinical event $E_i$ is encapsulated with:
1. An aggregate identifier $A_{\text{id}}$ (Patient UUID);
2. An aggregate version $V_i \in \mathbb{N}$ strictly satisfying $V_i = V_{i-1} + 1$;
3. A bi-temporal timestamp tuple $(T_{\text{valid}}, T_{\text{transaction}})$;
4. A typed domain payload containing tooth indices, periodontal 6-point probing arrays, surface maps $(B, M, O, D, L)$, and mobility grades;
5. A SHA-256 cryptographic digest $H_i = \text{SHA256}(V_i \parallel A_{\text{id}} \parallel H_{i-1} \parallel T_{\text{valid}} \parallel T_{\text{transaction}} \parallel \text{JSON}(\text{Payload}))$.

Upon querying an odontogram at an arbitrary historical target timestamp $T_{\text{target}}$, a projection processor filters events where $T_{\text{valid}} \le T_{\text{target}} \land T_{\text{transaction}} \le T_{\text{target}}$, sequentially applies the delta transformations in memory, and outputs the exact historical anatomical state without database rollback.

```
                    BI-TEMPORAL MERKLE EVENT CHAIN
+-----------------------------------------------------------------------------------+
|  GENESIS BLOCK (V0)                                                               |
|  Hash: "0000000000000000000000000000000000000000000000000000000000000000"         |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  EVENT 1 (V1): ToothObservationRecorded                                           |
|  ValidTime: 2026-06-01T10:00:00Z | TxTime: 2026-06-01T10:05:00Z                   |
|  Payload: Tooth #16 -> Carious Cavity (MOD)                                       |
|  PrevHash: GENESIS_HASH                                                           |
|  EventHash: SHA256(V1 + Payload + PrevHash)                                       |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  EVENT 2 (V2): PerioProbingRecorded                                               |
|  ValidTime: 2026-07-15T11:00:00Z | TxTime: 2026-07-15T11:02:00Z                   |
|  Payload: Tooth #16 -> [5mm, 3mm, 3mm, 2mm, 2mm, 4mm], Bleeding: True            |
|  PrevHash: EventHash(V1)                                                          |
|  EventHash: SHA256(V2 + Payload + PrevHash)                                       |
+-----------------------------------------------------------------------------------+
```

---

### 8. DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS

Referring to the architecture implemented in `src/lib/events/BiTemporalEventStore.ts`, the method of processing clinical observations proceeds as follows:

#### Step 1: Observation Capture & Payload Packaging
A clinician records an observation (e.g., caries on tooth FDI 16 on mesial and occlusal surfaces). The system constructs an observation payload:
$$\text{Payload} = \{ \text{toothNumber}: 16, \text{condition}: \text{"cavity"}, \text{surfaces}: [M, O], \text{perio}: [5, 3, 3, 2, 2, 4] \}$$

#### Step 2: Concurrency & Monotonicity Verification
The event repository retrieves the latest aggregate version $V_{\text{latest}}$ and latest hash $H_{\text{latest}}$. If no events exist:
$$V_1 = 1, \quad H_0 = \text{"0000000000000000000000000000000000000000000000000000000000000000"}$$

If a concurrent modification is detected ($V_{\text{expected}} \neq V_{\text{latest}}$), the transaction aborts with an optimistic concurrency exception, preventing split-brain record states.

#### Step 3: Cryptographic Hash Generation & Chain Anchoring
The cryptographic digest is computed:
$$H_i = \text{CryptoJS.SHA256}(V_i + A_{\text{id}} + H_{i-1} + T_{\text{valid}} + T_{\text{transaction}} + \text{serialize}(\text{Payload}))$$
The event is written to the immutable Postgres partition table `clinical_event_stream`.

#### Step 4: Bi-Temporal Time Travel Projection
When a projection request is submitted for time $t$:
$$S(t) = \sum_{j=1}^{k} \Delta(E_j) \quad \forall E_j \text{ where } T_{\text{valid}}(E_j) \le t \land T_{\text{transaction}}(E_j) \le t$$
The resulting state $S(t)$ yields the exact 32-tooth odontogram rendered in the UI without modifying persistent state.

---

### 9. WE CLAIM (PATENT CLAIMS)

1. **A computer-implemented method for maintaining a tamper-evident bi-temporal dental operatory ledger, comprising:**
   - receiving, by at least one hardware processor, a dental observation payload comprising an identification of at least one tooth and a clinical condition parameter;
   - assigning to said observation payload a valid timestamp corresponding to the clinical observation time and a transaction timestamp corresponding to the database commitment time;
   - retrieving a cryptographic hash of an immediately preceding clinical event in an aggregate sequence associated with a patient;
   - generating a current event cryptographic digest by executing a SHA-256 hash function over an aggregated string comprising a monotonic aggregate version number, an aggregate patient identifier, said preceding cryptographic hash, said valid timestamp, said transaction timestamp, and said clinical observation payload; and
   - storing said generated event in an append-only cryptographic event store.

2. **The method as claimed in claim 1, further comprising:**
   - reconstructing a historical odontogram state at an arbitrary target timestamp by filtering all recorded events having valid timestamps and transaction timestamps less than or equal to said target timestamp; and
   - sequentially projecting state mutations across an in-memory 32-tooth data structure in ascending order of version numbers.

3. **The method as claimed in claim 1, wherein said observation payload comprises a 6-point periodontal probing matrix defining probing depths for mesio-buccal, mid-buccal, disto-buccal, mesio-lingual, mid-lingual, and disto-lingual anatomical sites.**

4. **The method as claimed in claim 1, further comprising:**
   - verifying ledger integrity across $N$ events by iteratively computing the SHA-256 hash of each event $E_i$ using the hash $H_{i-1}$ of event $E_{i-1}$; and
   - raising a cryptographic tampering alert if any recomputed hash differs from the stored hash.

5. **The method as claimed in claim 1, wherein each verified event is serialized into an HL7 FHIR R5 standard bundle and encrypted using an ECDH Curve25519 key encapsulation mechanism for Ayushman Bharat Digital Mission (ABDM) Milestone 3 health data exchange.**

---

### 10. ABSTRACT
A system and method for maintaining an immutable, tamper-evident bi-temporal event-sourced dental operatory record. Clinical observations including 32-tooth odontogram diagnostics, surface restorations, and 6-point periodontal probing arrays are committed as monotonically incremented domain events. Each event incorporates a valid time, transaction time, and a SHA-256 Merkle chain hash linking to the preceding event. A bi-temporal projection engine reconstructs historical dental states at any past point in time without database rollbacks, providing non-repudiation for medico-legal audits and encrypted ABDM FHIR R5 health data exchange.
