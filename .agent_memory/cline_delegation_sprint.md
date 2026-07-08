# Cline Sprint Delegation: DCOS Frontend Overhaul (Phases 2 & 3)

> **Sprint Status:** Ready for Frontend Developer (Cline)  
> **Source Target File:** [DentistDashboard.tsx](file:///c:/Users/bentn/OneDrive/Desktop/DEs/src/components/dashboards/DentistDashboard.tsx)  
> **Backend Constraints:** **NO Supabase database schema or API endpoint modifications are allowed in this sprint.** Bind all newly collected UI states into local React state variables and include them in the final payload JSON submitted by the form.

---

## 1. Sprint Overview & Objectives

In this sprint, you will implement the UI/UX features for **Phase 2 (Visual Shade Canvas & Carousel UI)** and **Phase 3 (Interactive DentalDB Charting Grid)** inside the case creation wizard of `DentistDashboard.tsx`. 

---

## 2. Phase 2 Specifications: Shade Canvas & Carousel UI

### 2.1 Vita Classical 16-Shade Grid UI
*   **Location:** Replace the simple Select dropdown for `Vita Shade Code` in Step 3 (CAD Design).
*   **Design:** Render a grid of 16 interactive clickable tiles.
*   **Shades & Color Representation (Backgrounds):**
    *   **Group A (Reddish-Brownish):** A1 (`#f4ebe1`), A2 (`#ebdccb`), A3 (`#e3ceb5`), A3.5 (`#d8bf9f`), A4 (`#cca782`)
    *   **Group B (Reddish-Yellowish):** B1 (`#f4ecd8`), B2 (`#eadbb9`), B3 (`#e1ca9e`), B4 (`#d4b882`)
    *   **Group C (Greyish):** C1 (`#ebdcd4`), C2 (`#dfc7bd`), C3 (`#d4b8aa`), C4 (`#c09e8f`)
    *   **Group D (Reddish-Grey):** D2 (`#e2cfbd`), D3 (`#d4b79f`), D4 (`#cca487`)
*   **Behavior:** Clicking a tile directly updates the `shade` state. Outline the active selected tile with a thick border (e.g. `border-2 border-blue-600 shadow-md scale-105 transition-all`).

### 2.2 3-Zone Custom Shading Canvas (Interactive SVG Central Incisor)
*   **Activation:** Provide a checkbox/toggle labeled `"Enable Custom Shading"`. If unchecked, the custom shading inputs remain disabled/hidden.
*   **Interactive SVG Diagram:**
    *   Render an SVG silhouette of a central incisor tooth divided horizontally into three separate sections (g/paths):
        1.  **Cervical Third (Top / Gingival):** Represents the neck.
        2.  **Body Third (Middle):** Represents the center body.
        3.  **Incisal Third (Bottom / Tip):** Represents the translucent edge.
    *   **Behavior:** Clicking any of the three zones opens a floating mini-grid of the 16 VITA shades. Selecting a shade binds it specifically to that zone (`cervicalShade`, `bodyShade`, `incisalShade`).
    *   **Visual Feedback:** Fill the clicked SVG zone with the background color hex representing the selected shade.
*   **Aesthetic Details & Photos:**
    *   Add a multi-select checkbox row for characterizations: `White Spots`, `Crack Lines`, `Incisal Translucency`, `Hypoplasia Marks`.
    *   Add a sub-file upload picker specifically for Shade reference photographs.

### 2.3 Material to Shade Carousel Transition
*   **Behavior:** Replace the standard vertical form layout in Step 3. Divide Step 3 into two sub-sections (Material Selection and Shade Selection) in a horizontal carousel layout.
*   **Trigger:** The moment the user clicks a material (e.g., Zirconia HT, PMMA, etc.), the carousel horizontally slides (using smooth CSS `transform: translateX(...)` transitions) to reveal the Shade grid panel, eliminating the need to click "Next".

---

## 3. Phase 3 Specifications: Interactive DentalDB Charting Grid

### 3.1 FDI Quadrant Tooth Selector Chart
*   **Location:** Step 2 (Model Mapping) in `DentistDashboard.tsx`.
*   **Structure:** Arrange the 32 teeth in 4 distinct rows/quadrants mimicking digital dentistry interfaces (FDI Notation):
    *   **Quadrant 1 (Upper Right):** Teeth 18 to 11
    *   **Quadrant 2 (Upper Left):** Teeth 21 to 28
    *   **Quadrant 3 (Lower Left):** Teeth 31 to 38
    *   **Quadrant 4 (Lower Right):** Teeth 41 to 48
*   **Tooth Status Controls:** Clicking a tooth opens a context menu or cycle selector to set the configuration for that tooth:
    *   `None` (Default)
    *   `Single Crown`
    *   `Bridge Abutment` (Prepared anchor tooth)
    *   `Bridge Pontic` (Missing tooth being replaced)
    *   `Implant`

### 3.2 Dynamic Color Connections
Update the grid buttons to render styling matching exocad/DentalDB color codes:
*   **Single Crown:** Colored in **Red** (`bg-red-500 border-red-600 text-white`).
*   **Bridges:** Spans of teeth configured as part of a bridge are highlighted in **Blue**. Connect adjacent bridge teeth with a thick blue horizontal bridge line.
    *   **Abutments:** Highlighted in **Dark Blue** (`bg-blue-800 border-blue-900 text-white`).
    *   **Pontics:** Highlighted in **Light Blue** (`bg-blue-300 border-blue-400 text-slate-900`).
*   **Implants:** Overlay a circular center-hole cutout SVG icon inside the tooth button (`w-2 h-2 rounded-full bg-zinc-950 border border-zinc-700`) representing the implant screw chimney.

### 3.3 Predefined Interactive Dropdown Parameters
Add four new dropdown select inputs under the tooth chart:
1.  **Occlusal Clearance:** Select from `High / Light / Out of Occlusion` (Default: `Medium`).
2.  **Contact Design:** Select from `Tight / Normal / Light / Open` (Default: `Normal`).
3.  **Connector Design:** Select from `Anatomical / Reduced / Knife Edge` (Default: `Anatomical`).
4.  **Pontic Design:** Select from `Sanitary / Saddle / Ovate / Modified Ridge Lap` (Default: `Ovate`).

---

## 4. Integration Guidelines & State Binding

Please declare and bind the following new local state variables in `DentistDashboard.tsx`:

```tsx
// Phase 2 states
const [customShadeEnabled, setCustomShadeEnabled] = useState(false);
const [cervicalShade, setCervicalShade] = useState('A2');
const [bodyShade, setBodyShade] = useState('A2');
const [incisalShade, setIncisalShade] = useState('A2');
const [characterizations, setCharacterizations] = useState<string[]>([]);
const [shadePhotoFile, setShadePhotoFile] = useState<File | null>(null);

// Phase 3 states
const [toothConfigs, setToothConfigs] = useState<Record<number, 'single' | 'abutment' | 'pontic' | 'implant' | 'none'>>({});
const [occlusalClearance, setOcclusalClearance] = useState('Medium');
const [contactDesign, setContactDesign] = useState('Normal');
const [connectorDesign, setConnectorDesign] = useState('Anatomical');
const [ponticDesign, setPonticDesign] = useState('Ovate');
```

When building the final case creation payload inside `handleSubmitCase`, serialize these fields into the case configuration or prepend them to the `instructions` notes field as a structured JSON/text block, ensuring no changes to the Supabase tables are necessary.

Good luck! Maintain clean, modular CSS/Tailwind transitions, and check for compile warnings during build.
