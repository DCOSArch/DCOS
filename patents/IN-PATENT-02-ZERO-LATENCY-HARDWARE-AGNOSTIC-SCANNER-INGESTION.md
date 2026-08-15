# FORM 2
## THE PATENTS ACT, 1970 (39 OF 1970)
### & THE PATENTS RULES, 2003
# COMPLETE SPECIFICATION
*(See section 10 and rule 13)*

---

### 1. TITLE OF THE INVENTION
**A SYSTEM AND METHOD FOR HARDWARE-AGNOSTIC AUTOMATED INGESTION AND REAL-TIME NORMALIZATION OF 3D INTRAORAL VOLUMETRIC DATASETS VIA NON-INVASIVE BROWSER KERNEL WATCHER**

---

### 2. APPLICANT(S)
- **Nationality:** Indian
- **Jurisdiction:** Indian Patent Office (New Delhi / Mumbai / Chennai / Kolkata)

---

### 3. PREAMBLE TO THE DESCRIPTION
The following specification particularly describes the invention and the manner in which it is to be performed.

---

### 4. FIELD OF THE INVENTION
The present invention relates to computer graphics, intraoral optical scanning systems, and clinical cloud synchronization. In particular, the invention relates to a non-invasive, driverless browser-level directory watcher that intercepts heterogeneous volumetric 3D intraoral dental meshes (.STL, .PLY, .OBJ) from multi-vendor hardware, generates a multi-tier progressive Level-of-Detail (LOD) pyramid, and calculates occlusal clearances in real time prior to cloud upload.

---

### 5. BACKGROUND OF THE INVENTION & PRIOR ART LIMITATIONS
In contemporary digital dentistry, clinics employ diverse intraoral optical scanner (IOS) hardware from manufacturers including 3Shape, Medit, Align iTero, Dentsply Sirona, Carestream, and Rainbow Dental. Each scanner system runs proprietary acquisition software storing gigabyte-scale 3D mesh files in vendor-specific local directory trees.

Clinicians face severe workflow friction:
1. **Manual File Ingestion Bottleneck:** Staff must manually browse local Windows folder structures, select appropriate upper/lower arch STL/PLY files, rename them, and upload them through web portals.
2. **Massive Payload Latency:** Full-resolution intraoral scans regularly contain 1,000,000 to 4,000,000 triangular polygons (50MB–250MB). Transmitting these over standard broadband connections in tier-2/tier-3 Indian clinics induces substantial chairside waiting times (2 to 10 minutes) before the lab or dentist can view the model.
3. **Misfit & Prep Detection Delays:** Undercuts, insufficient occlusal clearances (<1.5mm for zirconia crowns), and subgingival margin unclarity are typically only discovered hours later by the laboratory technician, necessitating patient recalls for re-preparation.

Existing solutions require bulky native Windows background services (.exe) or proprietary scanner vendor cloud locks. There is an urgent need for an open, driverless, browser-native ingestion and automated mesh pre-computation engine.

---

### 6. OBJECTS OF THE INVENTION
- **Primary Object:** To provide a driverless, zero-installation directory watcher operating within standard web browser sandboxes utilizing the File System Access API to auto-detect newly exported dental meshes.
- **Secondary Object:** To compute a 4-tier progressive Level-of-Detail (LOD) mesh pyramid (`COARSE`, `MEDIUM`, `FINE`, `FULL`) on client GPU/CPU threads, transmitting a decimate 95% reduced mesh (COARSE) within sub-80ms for instant 3D viewport rendering.
- **Another Object:** To execute an automated 3D spatial distance field analysis between the prepared tooth vertex points and the opposing maxillary/mandibular mesh, visually highlighting clearance deficiencies in color-coded gradients (Red < 1.0mm, Yellow 1.0–1.5mm, Green > 1.5mm).
- **Yet Another Object:** To extract and parameterize continuous 3D Catmull-Rom closed splines representing subgingival finish line perimeters for automated CAD margin verification.

---

### 7. SUMMARY OF THE INVENTION

The system operates via a client-side architecture incorporating:
1. A **Browser File System Watcher** maintaining non-invasive file handle locks on configured local scanner output folders, utilizing an MD5/size delta polling cycle (1,000ms) to detect completed file writes;
2. A **Multi-Format Mesh Ingestion Normalizer** capable of parsing ASCII/Binary STL, color-vertex PLY, and textured OBJ formats into standard Three.js `BufferGeometry`;
3. A **Progressive LOD Pyramid Generator** implementing quadratic error decimation to construct:
   - `LOD 0 (COARSE)`: ~5% polygon count (<50,000 triangles) for immediate streaming;
   - `LOD 1 (MEDIUM)`: ~20% polygon count for intermediate inspection;
   - `LOD 2 (FINE)`: ~50% polygon count;
   - `LOD 3 (FULL)`: 100% original high-density mesh for CAD/CAM milling;
4. A **Real-Time Occlusal Clearance Engine** that casts bidirectional ray vectors across opposing mesh boundaries, measuring Euclidean spatial distance $D(p, M_{\text{opp}})$ to verify minimum restorative thickness.

```
                   ZERO-LATENCY INGESTION PIPELINE
+-----------------------------------------------------------------------------------+
|  LOCAL INTRAORAL SCANNER (3Shape / Medit / iTero / Rainbow)                       |
|  Local Directory: C:\ScannerExports\Patient_10492\ArchUpper.stl                   |
+-----------------------------------------+-----------------------------------------+
                                          |
                        [File System Access API Watcher]
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|  BROWSER CLIENT GPU/CPU PROCESSING (Zero Native Driver Required)                   |
|  1. Fast Binary Parser -> Three.js BufferGeometry                                 |
|  2. Quadratic Decimation -> Generates 4-Tier LOD Pyramid (Coarse to Full)         |
|  3. Ray-Casting Clearance -> Evaluates Occlusal Distance (Red/Yellow/Green)       |
|  4. Spline Extraction -> Catmull-Rom Closed Finish Line Perimeter                 |
+-----------------------------------------+-----------------------------------------+
                                          |
          +-------------------------------+-------------------------------+
          | (LOD 0: Coarse <80ms)                                         | (LOD 3: Full)
          v                                                               v
+-----------------------------------+                           +-------------------+
| Instant Cloud 3D Realtime Stream  |                           | Cloudflare R2 / S3|
| (Dentist & Lab Viewport Active)   |                           | (Full CAD Storage)|
+-----------------------------------+                           +-------------------+
```

---

### 8. DETAILED DESCRIPTION OF PREFERRED EMBODIMENTS

Referring to `src/lib/mesh/LODPipeline.ts` and `src/lib/scanner/ScannerWatcher.ts`:

#### Embodiment 1: Non-Invasive Browser Handle Polling
The web application initiates a directory picker through `window.showDirectoryPicker()`, obtaining a persistent `FileSystemDirectoryHandle`. A background request loop periodically enumerates directory entries. When a new file handle with extension `.stl`, `.ply`, or `.obj` is detected and its byte size stabilizes over two consecutive cycles, the file is identified as completely written by the scanner acquisition engine.

#### Embodiment 2: Clearance & Finish Line Computation
The upper and lower arch geometries $M_1 = (V_1, F_1)$ and $M_2 = (V_2, F_2)$ are aligned in intercuspal occlusion. For each vertex $v \in V_{\text{prep}}$ on the prepared tooth:
$$d(v, M_2) = \min_{f \in F_2} \| v - \text{proj}_f(v) \|$$
If $d < 1.0\text{ mm}$, vertex color is mapped to `#EF4444` (Red alert). If $1.0\text{ mm} \le d \le 1.5\text{ mm}$, vertex color is mapped to `#EAB308` (Yellow warning). If $d > 1.5\text{ mm}$, vertex color is mapped to `#10B981` (Green clearance adequate).

---

### 9. WE CLAIM (PATENT CLAIMS)

1. **A computer-implemented method for automated ingestion and progressive visualization of 3D intraoral dental scans, comprising:**
   - establishing, via a web browser sandbox without native binary drivers, a persistent directory handle to a local file system storage directory linked to an intraoral optical scanning device;
   - automatically detecting a newly exported 3D intraoral mesh file within said directory;
   - ingesting and parsing binary geometry of said 3D intraoral mesh file directly in client memory into a vertex-face buffer geometry;
   - generating a multi-tier progressive Level-of-Detail (LOD) pyramid comprising at least a coarse low-density mesh and a full-density production mesh; and
   - immediately transmitting said coarse low-density mesh to a cloud rendering stream to enable interactive 3D visualization in under 100 milliseconds while concurrently uploading said full-density production mesh to persistent cloud object storage.

2. **The method as claimed in claim 1, wherein generating said progressive LOD pyramid comprises performing quadratic error metric mesh decimation to reduce polygon count by at least 90% for said coarse low-density mesh.**

3. **The method as claimed in claim 1, further comprising:**
   - computing a minimum Euclidean spatial clearance between a plurality of vertices on a prepared tooth surface of said ingested mesh and an opposing dental arch mesh; and
   - assigning dynamic vertex shader colors to said prepared tooth surface to indicate inadequate clearance regions in real time prior to order dispatch.

4. **The method as claimed in claim 1, wherein said 3D intraoral mesh file is selected from the group consisting of STL, PLY with per-vertex RGB color, and OBJ with texture mapping.**

---

### 10. ABSTRACT
A system and method for zero-latency, driverless ingestion of 3D intraoral optical dental scans. A browser-native directory watcher monitors local scanner export folders, automatically detects completed scans, and normalizes multi-vendor 3D geometries in client memory. The system synthesizes a 4-tier progressive Level-of-Detail (LOD) pyramid, streaming a 95% decimated coarse mesh to clinicians and dental laboratories in under 80 milliseconds for immediate 3D inspection while uploading the production-grade high-density mesh asynchronously. Automated client-side occlusal clearance distance mapping identifies preparation inadequacies chairside before laboratory submission.
