---
tags: [dcos, memory, state]
---

# Global Project Context

## User Profile System
The application uses the `public.users` table as the single source of truth for user profiles (not `public.profiles`). A Postgres trigger on `auth.users` replicates metadata (`full_name`, `role`, `lab_id`/`lab_name`) into `public.users` upon sign-up.

## Row-Level Security (RLS)
The database tables (`cases`, `timeline_events`, `inventory_items`, `spatial_annotations`, etc.) have Row-Level Security enabled. All policies filter access based on the user's `role` and `lab_id` from the `public.users` table:
- **Dentists:** Access cases where `dentist_id = auth.uid()`.
- **Labs:** Access cases where `lab_id` matches the user's `lab_id` from `public.users`.

## Dark Mode Theme
Dark mode is activated by adding the `.dark` class to the root `<html>` element (managed via `src/components/Navbar.tsx`). The theme is defined in `src/app/globals.css` using custom Tailwind CSS v4 variables mapping to a Monokai color palette:
- Background: `#272822`
- Foreground: `#F8F8F2`
- Primary (Pink): `#F92672`
- Secondary/Muted (Cyan): `#66D9EF`
- Accent (Green): `#A6E22E`
- Destructive (Orange): `#FD971F`
- Card/Sidebar BG: `#1E1F1C`
- Border: `#3E3D32`

## Pre-Paid Virtual Inventory
Clinics purchase material blocks (Zirconia, Lithium Disilicate, PFM) in bulk. This is tracked in `doctor_inventory`. 
- Triggers: A database trigger `trigger_deduct_inventory` runs `AFTER INSERT OR UPDATE ON public.cases`.
- Draft Safety: Inventory is **not** deducted when a case is saved as a `DRAFT`. The deduction of 1 unit occurs automatically when the status updates from `DRAFT` to `PENDING` (or is created as `PENDING` directly).

## CAD/CAM Design Soft-Copy Archive
A storage bucket `designs` holds the final milling-ready CAD output uploaded by technicians. The file path is saved in the `cases.design_url` column. Both lab admins and clinics have read access for warranty verification.

## DICOM / CBCT Scan Archive
A column `cases.dicom_url` stores references to 3D DICOM / CBCT scan files uploaded by clinics for surgical guide cases. This is stored under the `dicom/` prefix in the `scans` bucket.

## Realtime RLS Optimizations
To support Supabase Realtime WebSocket notifications on tables containing RLS, we configured `REPLICA IDENTITY FULL` on `cases` and `timeline_events`. We also denormalized `dentist_id` and `lab_id` onto `timeline_events` via a `BEFORE INSERT` trigger function `populate_timeline_event_participants()`, ensuring that RLS rules (`dentist_id = auth.uid()`) can be evaluated directly on the row by the Supabase Realtime filter without subqueries.

## DCOS 2.0 Database Hierarchy (Phase 1)
To support the guiding principle of "One Patient, One Record, One Timeline" and eliminate the flat case structure, the plan proposes to introduce the following schemas (to be implemented by Cline in Phase 1):
- **`public.patients`**: Stores patient records with a unique `patient_id` (e.g. PT-100234), age, gender, and prescribing dentist.
- **`public.appointments`**: Logs scheduled visits per operatory, linked to patients.
- **`public.visits`**: Maps a clinical encounter to a patient and appointment, housing the core `clinical_notes`.
- **`public.treatments`**: Captures dentist prescriptions and treatment plans.
- **`public.devices`**: Registry for multi-camera architecture hardware tags (e.g., `IOC-01`, `CAMP-01`).
- **`public.clinical_media`**: A unified, HIPAA-compliant catalog of all uploaded scans, images, and videos (Cloudflare R2 keys) mapped directly to patient, visit, case, and capturing device.
- **Cases Association**: The `cases` table is altered to reference `patient_id` and `visit_id`, with case-specific design parameters serialized under `design_parameters` (JSONB).