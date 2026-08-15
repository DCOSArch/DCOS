---
tags: [dcos, memory, status]
---

# Antigravity Implementation Plan: DCOS Backend & Logistics (Phases 1 & 4)

> **Sprint Status:** Awaiting User Approval  
> **Assigned Agent:** Antigravity (Supabase & Database Lead)  
> **Timeline:** Parallel Execution with Cline's Frontend OVERHAUL  
> **Source Target Files:** 
> - [CaseDetailsClient.tsx](file:///c:/Users/bentn/OneDrive/Desktop/DEs/src/components/views/CaseDetailsClient.tsx) (Logistics, redos, and due-date proposals UI)
> - Database SQL migrations in `supabase/migrations/`
> - [DentistDashboard.tsx](file:///c:/Users/bentn/OneDrive/Desktop/DEs/src/components/dashboards/DentistDashboard.tsx) (Add Age/Gender demographics to Step 0)

---

## 1. Phase 1: Ingestion & Demographics (Database & Ingestion Layer)

### 1.1 Supabase Schema Migration (Case Metadata Expansion)
We will create a new migration file `supabase/migrations/20260708000000_add_demographics_and_implant_details.sql` to add the required fields:
```sql
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS patient_age INTEGER,
ADD COLUMN IF NOT EXISTS patient_gender TEXT CHECK (patient_gender IN ('MALE', 'FEMALE')),
ADD COLUMN IF NOT EXISTS implant_brand TEXT,
ADD COLUMN IF NOT EXISTS scan_body_model TEXT,
ADD COLUMN IF NOT EXISTS analog_logistics TEXT;
```

### 1.2 Ingestion Form Integration
*   **Target File:** `DentistDashboard.tsx`
*   **Action:**
    *   Add **Age** (number) and **Gender** (select: Male / Female) inputs to Step 0 (Administration).
    *   Add validation to make these inputs strictly mandatory (`isStepComplete(0)` requires `patientAge !== null && patientGender !== ''`).
    *   Bind these values into `handleSubmitCase` payload, writing directly to the database columns.
    *   Add **Implant Brand**, **Scan Body**, and **Analog Logistics** fields into the UI, visible only when `treatmentType === 'Implant Abutment'`.

### 1.3 Visual Demographic Badges
*   **Target Files:** `DentistDashboard.tsx`, `LabDashboard.tsx`, `CaseDetailsClient.tsx`
*   **Action:** Render a visual biological badge on all list views and detail panels:
    *   *Male Case:* Blue border card/badge overlay.
    *   *Female Case:* Pink/Green border card/badge overlay.

---

## 2. Phase 4: Complex Workflows, Redos, & Proposed Due Dates

### 2.1 Timeline Redos & Case End Triggers
*   **Target File:** `CaseDetailsClient.tsx`
*   **Actions:**
    *   **Infinite Trials:** Add a button `[+ Request Trial]` visible when the case is `IN_PROGRESS` or `QUALITY_CHECK`. Clicking it adds a `TRIAL_TRY_IN` event to the `timeline_events` table and loops case status back to `IN_PROGRESS`.
    *   **Case End Actions:** When the lab marks a case as `DELIVERED`, render a triple button container for the dentist:
        *   `[Done (Acknowledge Final Delivery)]`: Freezes the case, locks the billing invoice, and transitions case status to `COMPLETED`.
        *   `[Repeat Case (Failed Fit)]`: Flags the case for remake, opens a new remake timeline track, and resets status to `IN_PROGRESS`.
        *   `[Reject Case]`: Marks case status as `REJECTED` and opens a support dispute.

### 2.2 Proposed Due Dates & Acknowledgement Flow
*   **Database Schema Migration:** Add tracking columns for proposed dates:
    ```sql
    ALTER TABLE cases 
    ADD COLUMN IF NOT EXISTS proposed_due_date DATE,
    ADD COLUMN IF NOT EXISTS due_date_proposals_count INTEGER DEFAULT 0;
    ```
*   **Logic (Lab proposes a date adjustment):**
    *   When the lab updates a case due date, they write to `proposed_due_date` instead of modifying the frozen `due_date` directly.
    *   DCOS increments `due_date_proposals_count` in the database.
*   **Logic (Dentist views details):**
    *   `CaseDetailsClient.tsx` renders a warning alert: *"The laboratory has proposed a new delivery date: [Date]."*
    *   Render two buttons: `[Confirm Proposed Date]` and `[Reject Proposal]`.
    *   Clicking `Confirm` updates `due_date` to `proposed_due_date` and clears the proposed field.
    *   Clicking `Reject` leaves the due date unchanged and flags the conflict to the lab.

### 2.3 Storage Retention Purge Cron Job (Postgres pg_cron)
To prevent R2 bucket egress charges and database storage bloat, we will write a Supabase Database Webhook or cron job that triggers every night:
```sql
-- Select all cases completed more than 30 days ago
-- Queue file removal request to our Edge Function or S3 client to delete .STL/.PLY scan files
```
*   **Dentist panel action:** Add a button `[Export Patient Case History (ZIP)]` to `CaseDetailsClient.tsx` allowing clinics to download the raw scans before the 30-day auto-purge occurs.

---

## 3. Verification & Local Testing Plan

1.  **DB Schema Migrations:** Run `npx supabase db reset` locally to verify migration scripts execute cleanly.
2.  **State Insertion:** Submit a case with demographics, verification that data commits to Postgres successfully.
3.  **Logistics Loop testing:** Simulate due date updates from a mock lab profile and verify real-time status notifications on the dentist dashboard.
