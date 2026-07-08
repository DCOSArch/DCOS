# DentalConnect OS (DCOS) — Master Vision & Production Roadmap (Phase 2 & 3 Expansion)

> **Document Status:** Reference Specification & Active Baseline  
> **Target Audience:** Dr. Maneesh Vishnoi, Baleegh, and Core Engineering Partners  
> **Source Directory:** `.agent_memory/master_vision_and_production_roadmap.md`

---

## 1. Contextual Triangulation & Transcription Analysis

This master vision triangulates Dr. Vishnoi's handwritten notebooks with the comprehensive transcripts of the July 6 and July 7 meetings. 

```
                  +----------------------------------------------+
                  |            DCOS CASE INTAKE ENGINE           |
                  +----------------------------------------------+
                                         |
     +-------------------------+---------+---------+-------------------------+
     |                         |                   |                         |
     v                         v                   v                         v
[Demographics]           [DentalDB Grid]     [Shade Engine]         [Implant Workflow]
 - Age (Mandatory)        - Quad Charting     - 16 VITA Classical    - Brand Selector
 - Gender (Mandatory)     - Connection Colors  - 3-Zone custom tooth  - Scan body mapping
 - Biological UI themes   - Crowns vs Bridges - Stains & Photos      - Abutment logistics
```

---

## 2. Interactive DentalDB Charting Grid
To mimic standard dental CAD software (like *exocad* or *DentalDB*), the tooth selection interface is quadrant-based, containing FDI teeth numbers 18-11, 21-28, 31-38, 41-48.

### 2.1 Connection and Status Color Coding
*   **Single Crown:** Individual teeth are color-coded in **Red** to denote isolated restorations.
*   **Connected Bridge (FPD):** Bridges are highlighted in **Blue**. Inside a bridge span:
    *   **Abutments (Prepared teeth):** Rendered in **Dark Blue**.
    *   **Pontics (Missing teeth being replaced):** Rendered in **Light Blue**.
*   **Implants:** Indicated with a **center-hole overlay** representing the access chimney for screw-retained crown configurations.

---

## 3. Carousel Transition UI
To keep case creation frictionless and fast on both mobile and desktop:
*   **Behavior:** Step 3 (Model Mapping) and Step 4 (CAD Design) utilize a carousel-style sliding effect.
*   **Trigger:** The moment a clinician clicks/selects a Material (e.g., *Zirconia*), the panel automatically slides horizontally (carousel effect) to reveal the Shade selection card, eliminating the need to click a manual `"Next"` button.

---

## 4. Biological & Demographic Guardrails
*   **Mandatory Inputs:** **Patient Age** and **Biological Gender** are strictly mandatory in Step 0.
*   **Clinical Justification:** Restorations for female patients feature smaller anatomical shapes, rounded/sharper incisal corners, and higher translucence value, while male restorations are wider and more saturated.
*   **Visual Themes:** Dashboard case entries are color-coded:
    *   **Male Patients:** Labeled with a blue border/badge.
    *   **Female Patients:** Labeled with a pink/green border/badge.

---

## 5. Visual Shade Selection Engine
*   **16 VITA Classic Grid:** Interactive grid tiles representing the 16 VITA shades (A1–D4). The background of each tile represents the actual tooth hue.
*   **3-Zone Custom Shading Canvas:** If the doctor enables `"Custom Shading"`, they can click separate areas of a tooth diagram to assign distinct shades:
    1.  **Cervical / Neck** (Gingival third saturation)
    2.  **Body / Middle** (Main tooth body value)
    3.  **Incisal / Tip** (Translucent edge value)
*   **Staining Checkboxes:** Select specific characterizations (`White Spots`, `Crack Lines`, `Incisal Translucency`) and upload reference photos.

---

## 6. Treatment Categories & Implant Workflows
Restorations are grouped into:
1.  **Single:** Crown, Veneer, Inlay, Onlay, Nightguard, Surgical Guide.
2.  **Multi / Bridge:** Multi-unit bridges up to 6 units.
3.  **Full Arch:** Full Arch FPD or Full Arch Implant (All-on-4, All-on-6).

### 6.1 Implant Specifications
When implant treatments are selected, the clinician must input:
*   **Implant Brand/Company:** Dropdown containing leading brands (e.g. *Osstem, Dentium, Nobel Biocare, Straumann*).
*   **Scan Body Model:** Short vs Long scan body specifications.
*   **Prosthetic Parts Logistics:** Checkbox/Radio selection for:
    *   `Doctor Provided` (Doctor ships the implant analogs/abutments to the lab).
    *   `Lab Provided` (Lab supplies the analogs/abutments, billed to the case).

---

## 7. Dynamic Trials & Proposed Due Dates

### 7.1 Infinite Trials Loop
For complex full-arch zirconia implant bridges, DCOS generates trackable intermediate steps (framework milling ➔ metal try-in ➔ wax setup try-in ➔ final crown cementation in slots). 
*   If a trial fails, the dentist or lab can click `[+ Request Trial]`, which dynamically appends another trial step into the live stepper sequence rather than locking the case.
*   Final case completion requires the dentist to explicitly click one of three actions: **`Done`**, **`Repeat`**, or **`Reject`**. Clicking `Done` freezes the case and locks the ledger.

### 7.2 Proposed Due Dates (Acknowledge Flow)
To prevent laboratories from unilaterally extending timelines without clinical alignment:
*   **Frozen Original Date:** The due date requested by the dentist remains frozen as the baseline.
*   **Proposals:** If the lab changes the shipping date, it is marked as `Proposed Due Date by Lab` in the details panel.
*   **Awaiting Acknowledgement:** DCOS triggers a real-time notification to the dentist's panel with two action buttons: `Confirm` and `Reject`. The timeline only updates to the new date once the dentist clicks `Confirm` (acknowledgement). DCOS maintains an audit log of how many times a lab has proposed a delay.

---

## 8. HIPAA, Storage Purges, & Co-Founder JV Model

### 8.1 Data Retention & Purge
Raw 3D files (.STL/.PLY) are deleted 30 days after the case reaches `DELIVERED` status to avoid cloud storage bloat. Doctors are prompted to download a compressed case ZIP via an `[Export Patient Case History]` button before the automatic purge date.

### 8.2 Business Model
Dr. Vishnoi covers 100% of Capex/infrastructure costs (zero out-of-pocket for development partners). Developers are co-founders with a defined equity stake in DCOS plus a recurring royalty fee per milled crown unit.
