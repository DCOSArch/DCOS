# DentalConnect OS (DCOS) — Master Vision & Production Roadmap (Phase 2 & 3 Expansion)

> **Document Status:** Reference Specification & Active Blueprint  
> **Target Audience:** Dr. Maneesh Vishnoi, Baleegh, and Core Engineering Partners  
> **Source Directory:** `.agent_memory/master_vision_and_production_roadmap.md`

---

## 1. Contextual Triangulation: Meeting Analysis

This roadmap compiles and structures the strategic, technical, and commercial decisions from the key client meetings (Meeting 1: July 6, 2026; Meeting 2: July 7, 2026) and the hand-drawn diary notes.

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
To make DCOS instantly familiar to digital dentists and technicians, we are modeling the tooth selection after standard dental CAD software (like *exocad* or *DentalDB*), as recorded in Dr. Vishnoi's notebook under "Dental DB Interface".

### 2.1 Quadrant Charting & FDI Tooth Selection
*   **Interface Layout:** Render the standard 32-tooth FDI dental chart split into four quadrants:
    *   **Quadrant 1 (Upper Right):** Teeth 18 to 11
    *   **Quadrant 2 (Upper Left):** Teeth 21 to 28
    *   **Quadrant 3 (Lower Left):** Teeth 31 to 38
    *   **Quadrant 4 (Lower Right):** Teeth 41 to 48
*   **Multi-Select States:** Let the user select multiple teeth to apply batch properties (e.g. materials, shading, restoration types).

### 2.2 Restoration Connection Visualization
When teeth are mapped, the grid must visually connect and color-code the restoration types:
*   **Single Crown:** Individual tooth cells highlighted in a solid cyan/blue block.
*   **Pontics & Bridges (FPD):** Connected spans of teeth highlighted in a green outline. If teeth 11, 12, and 13 are selected as a bridge, the visual grid should connect them with a thick green horizontal bar representing the bridge span.
*   **Implants:** Marked with an orange fixture badge overlaying the tooth root representation to indicate screw-retained or custom abutment placement.

---

## 3. Biological & Demographic Guardrails (Gender & Age)
As emphasized by Dr. Vishnoi (*"gender mandatory karo aur age mandatory karo"*), patient age and biological gender play a critical role in prosthetic fabrication:
*   **Female Biological Restoration:** Average female crowns are smaller, have slightly sharper/more rounded incisal corners, and feature higher translucency/brightness.
*   **Male Biological Restoration:** Average male crowns are wider, flatter, and feature a slightly darker saturation profile.

### 3.1 Input Enforcement
*   **Validation:** Both **Age** and **Gender** fields are strictly mandatory inside Step 0 (Administration) of case submission.
*   **Visual Indicators:**
    *   **Male Cases:** Render a blue theme or masculine symbol badge on the dashboard list entries and details headers.
    *   **Female Cases:** Render a pink/green theme or feminine symbol badge to provide instant visual context for technicians at the bench.

---

## 4. Visual Shade Selection Engine
Rather than relying on generic text dropdowns, DCOS features a visual shade mapping canvas.

### 4.1 The 16 VITA Classical Shade Grid
*   **The Grid:** Render 16 interactive tiles corresponding to the 16 VITA Classical shades:
    *   **Group A (Reddish-Brownish):** A1, A2, A3, A3.5, A4
    *   **Group B (Reddish-Yellowish):** B1, B2, B3, B4
    *   **Group C (Greyish Shades):** C1, C2, C3, C4
    *   **Group D (Reddish-Grey):** D2, D3, D4
*   **Visual Representation:** Each grid tile features a background color representing the actual tooth hue of that specific VITA value to aid quick visual clicking.

### 4.2 3-Zone Custom Shading Canvas
When the doctor toggles the **"Custom Shading"** checkbox:
*   **Visual Tooth Slicing:** A diagram of a central incisor appears, divided horizontally into three zones:
    1.  **Cervical / Neck (Gingival Third):** Controls the neck saturation.
    2.  **Body / Middle (Middle Third):** Represents the main body shade.
    3.  **Incisal / Tip (Incisal Third):** Controls the transparent or translucent edge shade.
*   **Interactive Assignment:** Dentists click on each of the three zones independently to assign a specific shade from the VITA grid.
*   **Staining Details & Photo Portal:**
    *   Checkboxes for specific characterizations: `White Spots`, `Crack Lines`, `Incisal Translucency`, `Hypoplasia Marks`.
    *   An image upload dropzone specifically for custom shade photo guides to show staining patterns.
*   *If the custom toggle is unchecked, this entire section remains greyed out and defaults to a single shade for the entire crown.*

---

## 5. Treatment Categories & Implant Workflows
Based on the U-jaw diagram and column structure in the client notebook:

| Treatment Category | Sub-Category | Mandatory Inputs & Selections |
| :--- | :--- | :--- |
| **FPD upto 6** | Crown & Bridge (Natural Teeth) | Material, Shade selection, custom instructions. |
| **upto 6 Implant** | Implant-Supported FPD | 1. Implant Brand/Company (e.g. Osstem, Dentium, Nobel)<br>2. Scan Body Model code / visual selection<br>3. Prosthetic Parts Logistics: *Doctor Provided* vs *Lab Analog/Abutment Provided*. |
| **Full Arch FPD** | Full Arch Bridge (Natural Teeth) | Material, Shade selection, custom instructions. |
| **Full Arch Implant** | Full Arch Implant Bridge | 1. Number of Implants (select from radio buttons: 4, 6, 8, 10, 12)<br>2. Implant Brand/Company<br>3. Scan Body Model<br>4. Prosthetic Parts Logistics: *Doctor Provided* vs *Lab Analog/Abutment Provided*. |

---

## 6. Dynamic Trials & Manufacturing Steps
Different materials and restorations dictate distinct manufacturing step paths on the details tracker.

### 6.1 Material-Driven Workflows
For complex restorations like a **Full Arch Implant Bridge (Zirconia)**, the system auto-configures the following trackable steps:
1.  **CAD/CAM Framework:** Milling the primary structural bar (Titanium or Zirconia framework).
2.  **Trial 1 (Fit Try-in):** Shipping the milled bar/metal frame to check passivity and fit on implants.
3.  **Bite Record / Wax Try-in:** Checking occlusion and teeth alignment on a PMMA/wax base.
4.  **Final Restoration:** Milling/sintering individual zirconia crowns, cementing them into slots on the framework, glazing, and final delivery.

### 6.2 Infinite Trials Generator
In clinical reality, fit checks can fail multiple times. DCOS does not enforce a rigid workflow lock.
*   **The Feature:** Provide an interactive button: `[+ Request Trial]` on both the lab and dentist details panels.
*   **Behavior:** Clicking it appends a dynamic `Trial Try-In (Failed - Redo)` phase back into the active production sequence, allowing the case to loop on trials as many times as necessary before final glazing/sintering is authorized.

---

## 7. Storage Policy & Patient Privacy Life Cycle

### 7.1 HIPAA & Patient Health Information (PHI) Isolation
*   **Hash Anonymization:** Raw file paths and patient database records are labeled by a secure generated hash (e.g., `hash-{UUID}`).
*   **Preview Access:** B2B2C patient share links read *only* the anonymized hash. They render the 3D STL file and the lab logo without exposing the patient's name, age, or clinical records to the public web.

### 7.2 Data Retention & Purge Lifecycle
Raw 3D intraoral scans (.STL/.PLY) are heavy files (20MB to 100MB+ per file). Retaining them indefinitely causes massive database bloat and storage costs.
*   **Retention Limit:** Automatically delete raw STL/PLY scan files from the storage bucket 30 days after the case changes status to `DELIVERED`.
*   **Export Summary:** Before the 30-day purge, DCOS displays an automated export action: `[Export Patient Case History (ZIP)]` on the dentist's panel. This allows the doctor to download a compressed archive of the scans and CAD design for their local storage before the cloud purge occurs.

---

## 8. Joint Venture Business Model & Development Roadmap

DCOS operates as a shared joint venture co-founded by the development partners and the clinical anchor, Dr. Maneesh Vishnoi.

### 8.1 Financial Arrangements & Runway
*   **100% Capital Coverage:** Dr. Vishnoi covers all infrastructure, server, and development setup costs. Developers incur zero out-of-pocket costs.
*   **CTO & Product Equity:** Development partners are onboarded as co-founders with a defined equity stake in the platform's intellectual property.
*   **Per-Crown Royalty:** In addition to equity, developers receive a transaction royalty for each restoration unit/crown milled through the software.
*   **Free Dentist Ingestion:** Dentists onboard entirely for free. DCOS generates revenue by charging laboratories a monthly subscription or transaction fee.

### 8.2 Progression Phases (1-Year Pilot)
*   **Phase 1: Local Deployment (August/September 2026):** In-house debugging and clinical testing using cases from Dr. Vishnoi's hospital and self-owned laboratory.
*   **Phase 2: Regional Beta Testing:** Expanding onboarding to Kanpur's local dentist networks.
*   **Phase 3: National Commercial Rollout:** Marketing DCOS as a white-labeled laboratory operating system across India.
