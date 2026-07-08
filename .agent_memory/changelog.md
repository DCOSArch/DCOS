# Agent Changelog
* 2026-07-08 - FEATURE: Case Details Visual Design Specs — Parsed the serialized JSON design parameters from custom instructions and rendered them as a visual card on the Case Details screen, including parameters table, 3-zone custom shading SVG preview, FDI tooth configs list, and attached shade matching photographs.
* 2026-07-08 - FEATURE: Cline Sprint Phase 2 (Shade Canvas & Carousel UI) — Replaced shade dropdown with 16-tile VITA Classical grid (A1-D4 with hex colors). Implemented horizontal carousel that auto-slides from Material to Shade panel on click. Added 3-zone custom shading SVG incisor canvas with clickable Cervical/Body/Incisal zones, floating shade mini-grids, characterizations checkboxes, and shade reference photo upload.
* 2026-07-08 - FEATURE: Cline Sprint Phase 3 (Interactive DentalDB Charting Grid) — Replaced tooth toggle buttons with FDI quadrant chart featuring click-to-cycle status (None → Crown → Abutment → Pontic → Implant). Applied exocad color coding (Red/Blue/Light Blue/Zinc) with implant screw chimney overlay and bridge connector lines. Added 4 predefined dropdown parameters (Occlusal Clearance, Contact Design, Connector Design, Pontic Design). All new states serialized as JSON into `instructions` field — no DB schema changes.
* 2026-07-07 - FEATURE: Auth Recovery & Reset — Integrated native Supabase password recovery and secure reset morphing screens directly into the main Login card.
* 2026-07-07 - FEATURE: CBCT DICOM Ingestion — Built Treatment Type selectors and conditional CBCT scan uploads for surgical guide cases, archiving DICOM path links in the database.
* 2026-07-07 - FEATURE: Global Real-Time Chime Bell — Embedded browser Web Audio API synth double-beep alerts and live WebSocket subscriptions inside the navbar bell component.
* 2026-07-07 - FEATURE: Live Stepper Updates — Wired real-time cases and timeline subscriptions inside CaseDetailsClient.tsx to automatically advance progress steps and history feeds.
* 2026-07-07 - FEATURE: Dentist Dashboard & Case Ingestion — Refactored Create Case modal into Sirona-style 5-Tab Pipeline stepper with FDI tooth toggles, active locks, and "Not Specified" overrides.
* 2026-07-07 - FEATURE: Scanner File Ingestion & Validation — Integrated client-side STL validator checks (warnings on margins/clearances) and auto-name/arch parsing from uploaded files.
* 2026-07-07 - FEATURE: Asynchronous Cart Engine — Implemented "Save as Draft" status, detail page Submit Case banner, and updated database trigger `trigger_deduct_inventory` to only deduct units when transitioning from DRAFT to production statuses.
* 2026-07-07 - FEATURE: 3D Scan URL Resolver — Resolved relative paths to fully-qualified public CDN urls on both dentist case details and unauthenticated patient preview routes.
* 2026-07-07 - FEATURE: UPI Intent Payments — Built `DentistInventoryClient.tsx` to calculate bulk discounts, generate mobile `upi://pay` deep links, show desktop QR codes, and credit doctor inventory databases dynamically.
* 2026-07-07 - FEATURE: Live Notification Center — Integrated a live production tracker feed on the dentist dashboard subscribing in real-time to Supabase `timeline_events`.
* 2026-07-07 - FEATURE: CAD/CAM Soft-Copy Archiver — Created `designs` storage bucket and `design_url` database columns for permanent design archiving and technician file upload dropzones.
* 2026-07-04 - BUG FIX: CaseDetailsClient.tsx — removed all mockData dependencies (mockUsers, mockTimelineEvents). Dentist/lab names now fetched from Supabase. Timeline shows only real DB events.
* 2026-07-04 - BUG FIX: ThreeDViewer.tsx — replaced infinite spinner with a clean 'No 3D scan uploaded' empty state when no stlUrl is provided.
* 2026-07-04 - BUG FIX: CaseDetailsClient.tsx — passed `stlUrl` prop to ThreeDViewer so real STL files render when available.
* 2026-07-04 - BUG FIX: CaseDetailsClient.tsx — chat deduplication on realtime subscribe; patient preview URL now uses dynamic `window.location.origin`.
* 2026-07-04 - BUG FIX: Navbar.tsx — dark mode now persists to localStorage and defaults to Monokai dark on first visit.
* 2026-07-04 - BUG FIX: Supabase — assigned lab_id to labstaff@demo.com so Lab Staff role can view cases via RLS.
* 2026-07-04 - Truncated Case UUID displays in dashboards, case detail view, navbar, and notifications to first 8 characters for a cleaner, compact UI.
* 2026-07-04 - Fixed auth client initialization by restoring the Supabase Anon Key in `.env.local`.
* 2026-07-04 - Created dummy login credentials for Dentist, Lab Admin, and Lab Staff.
* 2026-07-04 - Fixed B2B database RLS policies to use `public.users` instead of the empty `public.profiles` table.
* 2026-07-04 - Re-seeded the database cases and inventory allocations to populate the dashboards.
* 2026-07-04 - Implemented a complete Monokai dark theme in `src/app/globals.css` by mapping Tailwind v4 variables.
* 2026-06-26 - Delegated data generation (50K rows) and revenue calculation to native Gemini agent.
