# DentalConnect OS (DCOS) — Master Vision & Production Roadmap (Phase 2 & 3 Expansion)

> **Document Status:** Reference Specification & Active Baseline  
> **Target Audience:** Dr. Maneesh Vishnoi, Baleegh, and Core Engineering Partners  
> **Source Directory:** `.agent_memory/master_vision_and_production_roadmap.md`

---

## 1. Contextual Triangulation & Transcription Analysis

This master vision roadmap structures the clinical, technical, and commercial decisions from the Kanpur client meetings (Meeting 1: July 6, 2026; Meeting 2: July 7, 2026) and hand-drawn diary notes.

> [!NOTE]
> **Indian Market Fit:** Because DCOS is built exclusively for the Indian dental ecosystem, the US-based **HIPAA regulations do not apply**. Data privacy focuses on secure database storage and unique preview hashes without over-complicating clinical file sharing with heavy regulatory isolation frameworks.

---

## 2. Workable Development Phases

To ensure development progresses smoothly without architectural hiccups, the roadmap is divided into four chronological phases:

```
+-------------------------------------------------------------------------------+
|                             WORKABLE DEVELOPMENT PHASES                       |
+-------------------------------------------------------------------------------+
                                        |
       +--------------------+-----------+-----------+--------------------+
       |                    |                       |                    |
       v                    v                       v                    v
  [Phase 1]            [Phase 2]               [Phase 3]            [Phase 4]
 Ingestion & Demo     Shade Canvas & UI       FDI DentalDB Grid    Logistics & Lifecycle
  - Age & Gender check - 16 VITA Shade Grid   - Quad FDI teeth      - Redo Trials loop
  - M/F Visual badges  - 3-Zone Shading Tooth - Single/Bridge colors- Proposed Due Dates
  - Implant components - Material Carousel    - Dropdown options   - 30-Day Storage Purge
```

### Phase 1: Clinical Ingestion & Demographic Guardrails
*   **Goal:** Implement mandatory patient demographics and clinical components setup.
*   **Scope:**
    1.  Make **Patient Age** and **Biological Gender** strictly mandatory inputs in Step 0 (Administration) of case submission.
    2.  Add color-coded visual indicator badges (Blue border for Male, Pink/Green border for Female) on dashboards and details page.
    3.  Create DB fields and select inputs for Implant details: Brand/Company selection (Osstem, Dentium, Nobel, Straumann), Scan Body (Short vs Long), and Analogs logistics (`Doctor Provided` vs `Lab Provided`).

### Phase 2: Visual Shade Canvas & Carousel UI
*   **Goal:** Implement interactive visual shade selections and smooth wizard page transitions.
*   **Scope:**
    1.  Build the **16 VITA Classical Shade Grid** of color-coded clickable boxes (A1–D4).
    2.  Create the **3-Zone Custom Shading Canvas** (Cervical, Body, Incisal tooth mapping) and staining/characterization checkmarks.
    3.  Develop the **Carousel sliding effect** (smooth CSS transition) that automatically slides to the shade selector step once a material is selected in the wizard, eliminating the "Next" button.

### Phase 3: Interactive DentalDB Charting Grid
*   **Goal:** Connect restoration tooth selections and define predefined clinical options.
*   **Scope:**
    1.  Build the quadrant-based FDI teeth charting interface (18-11, 21-28, 31-38, 41-48).
    2.  Implement color-coded connection highlighting:
        *   *Single Crowns:* Highlighted in **Red**.
        *   *Connected Bridges (FPD):* Highlighted in **Blue** (Abutments in **Dark Blue**, Pontics in **Light Blue**).
        *   *Implants:* Marked with a **center-hole chimney overlay**.
    3.  Predefine interactive select dropdowns for: Occlusal Clearance (high, medium, low), Connectors (anatomical vs non-anatomical), Contact Design (light, medium, tight), and Pontic Designs (high/low pressure, sanitary, ovate, saddle).

### Phase 4: Complex Workflows, Redos, & Proposed Due Dates
*   **Goal:** Manage multi-step logs, timeline proposed updates, and file-retention limits.
*   **Scope:**
    1.  Create the **Infinite Trials redos** button (`[+ Request Trial]`) and dentist end-state confirmation triggers (`Done`, `Repeat`, `Reject`).
    2.  Build the **Proposed Due Date by Lab** flow where the original date remains frozen, the lab proposes an update, and the dentist receives an alert to `Confirm` or `Reject` it.
    3.  Setup the **30-day storage purge lifecycle** for `.STL`/`.PLY` scans with the dentist-facing `[Export Patient Case History (ZIP)]` download button.

---

## 3. Interactive DentalDB Charting Grid

### 3.1 Connection and Status Color Coding
*   **Single Crown:** Individual teeth are color-coded in **Red** to denote isolated restorations.
*   **Connected Bridge (FPD):** Bridges are highlighted in **Blue**. Inside a bridge span:
    *   **Abutments (Prepared teeth):** Rendered in **Dark Blue**.
    *   **Pontics (Missing teeth being replaced):** Rendered in **Light Blue**.
*   **Implants:** Indicated with a **center-hole overlay** representing the access chimney for screw-retained crown configurations.

---

## 4. Carousel Transition UI
*   **Behavior:** Step 3 (Model Mapping) and Step 4 (CAD Design) utilize a carousel-style sliding effect.
*   **Trigger:** The moment a clinician clicks/selects a Material (e.g., *Zirconia*), the panel automatically slides horizontally (carousel effect) to reveal the Shade selection card, eliminating the need to click a manual `"Next"` button.

---

## 5. Biological & Demographic Guardrails
*   **Clinical Justification:** Restorations for female patients feature smaller anatomical shapes, rounded/sharper incisal corners, and higher translucence value, while male restorations are wider and more saturated.
*   **Visual Themes:** Dashboard case entries are color-coded:
    *   **Male Patients:** Labeled with a blue border/badge.
    *   **Female Patients:** Labeled with a pink/green border/badge.

---

## 6. Visual Shade Selection Engine
*   **16 VITA Classic Grid:** Interactive grid tiles representing the 16 VITA shades (A1–D4). The background of each tile represents the actual tooth hue.
*   **3-Zone Custom Shading Canvas:** If the doctor enables `"Custom Shading"`, they can click separate areas of a tooth diagram to assign distinct shades:
    1.  **Cervical / Neck** (Gingival third saturation)
    2.  **Body / Middle** (Main tooth body value)
    3.  **Incisal / Tip** (Translucent edge value)
*   **Staining Checkboxes:** Select specific characterizations (`White Spots`, `Crack Lines`, `Incisal Translucency`) and upload reference photos.

---

## 7. Treatment Categories & Implant Workflows
Restorations are grouped into:
1.  **Single:** Crown, Veneer, Inlay, Onlay, Nightguard, Surgical Guide.
2.  **Multi / Bridge:** Multi-unit bridges up to 6 units.
3.  **Full Arch:** Full Arch FPD or Full Arch Implant (All-on-4, All-on-6).

### 7.1 Implant Specifications
When implant treatments are selected, the clinician must input:
*   **Implant Brand/Company:** Dropdown containing leading brands (e.g. *Osstem, Dentium, Nobel Biocare, Straumann*).
*   **Scan Body Model:** Short vs Long scan body specifications.
*   **Prosthetic Parts Logistics:** Checkbox/Radio selection for:
    *   `Doctor Provided` (Doctor ships the implant analogs/abutments to the lab).
    *   `Lab Provided` (Lab supplies the analogs/abutments, billed to the case).

---

## 8. Dynamic Trials & Proposed Due Dates

### 8.1 Infinite Trials Loop
For complex full-arch zirconia implant bridges, DCOS generates trackable intermediate steps (framework milling ➔ metal try-in ➔ wax setup try-in ➔ final crown cementation in slots). 
*   If a trial fails, the dentist or lab can click `[+ Request Trial]`, which dynamically appends another trial step into the live stepper sequence rather than locking the case.
*   Final case completion requires the dentist to explicitly click one of three actions: **`Done`**, **`Repeat`**, or **`Reject`**. Clicking `Done` freezes the case and locks the ledger.

### 8.2 Proposed Due Dates (Acknowledge Flow)
*   **Frozen Original Date:** The due date requested by the dentist remains frozen as the baseline.
*   **Proposals:** If the lab changes the shipping date, it is marked as `Proposed Due Date by Lab` in the details panel.
*   **Awaiting Acknowledgement:** DCOS triggers a real-time notification to the dentist's panel with two action buttons: `Confirm` and `Reject`. The timeline only updates to the new date once the dentist clicks `Confirm` (acknowledgement). DCOS maintains an audit log of how many times a lab has proposed a delay.

---

## 9. Storage Policy & Patient Privacy Life Cycle

### 9.1 Data Retention & Purge
Raw 3D files (.STL/.PLY) are deleted 30 days after the case reaches `DELIVERED` status to avoid cloud storage bloat. Doctors are prompted to download a compressed case ZIP via an `[Export Patient Case History]` button before the automatic purge date.

### 9.2 Business Model
Dr. Vishnoi covers 100% of Capex/infrastructure costs (zero out-of-pocket for development partners). Developers are co-founders with a defined equity stake in DCOS plus a recurring royalty fee per milled crown unit.
