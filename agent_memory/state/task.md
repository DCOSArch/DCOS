---
tags: [dcos, memory, state]
---

# DCOS Backend & Logistics Checklist

- `[ ]` **Phase 1: Clinical Ingestion & Demographic Guardrails**
  - `[ ]` Supabase Migration: Add `patient_age`, `patient_gender`, `implant_brand`, `scan_body_model`, and `analog_logistics` columns to the `cases` table.
  - `[ ]` Form Input Integration: Add mandatory Patient Age and Biological Gender select inputs to Step 0 (Administration) of case wizard in `DentistDashboard.tsx`.
  - `[ ]` Implant Specifics UI: Add conditional brand, scan body model, and analog logistics inputs to the form (visible when treatment type is "Implant Abutment").
  - `[ ]` Submission Payload Mapping: Map new demographic and implant variables inside the case creation database transaction in `DentistDashboard.tsx`.
  - `[ ]` Dashboard Visual Indicators: Render blue themed badges for male patient cases and pink/green themed badges for female patient cases.

- `[ ]` **Phase 4: Complex Workflows, Redos, & Proposed Due Dates**
  - `[ ]` Supabase Migration: Add `proposed_due_date` (date) and `due_date_proposals_count` (int) columns to the `cases` table.
  - `[ ]` Infinite Trials Loop: Add a `[+ Request Trial]` button to `CaseDetailsClient.tsx` that inserts a `TRIAL_TRY_IN` event and reverts status to `IN_PROGRESS`.
  - `[ ]` Case End Triggers: Add the dentist delivery confirmation triple-button panel (`Done`, `Repeat`, `Reject`) to `CaseDetailsClient.tsx`.
  - `[ ]` Proposed Due Dates: Display proposed due date alerts and confirmation triggers (`Confirm` / `Reject`) in `CaseDetailsClient.tsx` dentist view.
  - `[ ]` Scan Purge Lifecycle: Configure scan purge trigger logic and add the dentist-facing `[Export Patient Case History (ZIP)]` download button.
