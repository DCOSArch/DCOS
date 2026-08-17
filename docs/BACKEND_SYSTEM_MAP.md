# DentalConnect OS (DCOS) 2.0: Master Backend System Map & Decision Engine

> **Canonical Backend Source of Truth**: This document maps the live PostgreSQL database schema on Supabase (`https://rrjjwerahglpsqxdpmkr.supabase.co`) to the exact components, services, and routes in the DentalConnect OS codebase.
> 
> **MANDATORY AGENT DIRECTIVE**: Before designing, approving, or deploying any new feature or schema migration, all developer agents (Antigravity, Claude Code, Cline) **MUST** consult this document and execute the **Feature Feasibility & Ripple-Effect Calculation Protocol** (Section 5).

---

## 1. High-Level Relational ERD Architecture

```mermaid
erDiagram
    organizations ||--o{ organization_memberships : "has members"
    organizations ||--o{ subscriptions : "owns billing tier"
    organizations ||--o{ patients : "tenant owns"
    organizations ||--o{ cases : "tenant owns"
    organizations ||--o{ tooth_charts : "tenant owns"
    organizations ||--o{ inventory_items : "stocks"

    users ||--o{ organization_memberships : "joins"
    users ||--o| profiles : "mirrored via view"
    users ||--o{ patients : "prescribing dentist"
    users ||--o{ cases : "doctor owner"
    users ||--o{ spatial_annotations : "authored by"
    users ||--o{ chat_messages : "sender"
    users ||--o{ phi_access_logs : "accessed by"

    lab_profiles ||--o{ users : "staff mapped via lab_id"
    lab_profiles ||--o{ cases : "manufacturing lab"
    lab_profiles ||--o{ lab_services : "offers Rx catalog"
    lab_profiles ||--o{ doctor_inventory : "stock allocations"

    patients ||--o{ cases : "subject of"
    patients ||--o| tooth_charts : "1-to-1 odontogram"
    patients ||--o| patient_phi : "encrypted PHI link"
    patient_phi ||--o{ phi_access_logs : "audit trail"

    cases ||--o{ timeline_events : "realtime log"
    cases ||--o| order_chats : "auto-creates chat"
    cases ||--o{ case_designs : "CAD version history"
    cases ||--o{ spatial_annotations : "3D mesh pins"
    cases ||--o{ inventory_transactions : "deducts parts"

    order_chats ||--o{ chat_messages : "contains messages"
```

---

## 2. Complete Database Dictionary & Code-Binding Matrix

| # | Database Entity | Relational Keys | RLS Policy Scope | TypeScript Types | Services & API Routes | UI Components & Dashboards |
|---|---|---|---|---|---|---|
| **1** | **`public.users`** | `id UUID PK` (Auth user)<br>`lab_id UUID FK $	o$ lab_profiles` | Users view self; Tenant members view team; Lab staff view assigned | `User`<br>(`src/types.ts:5`) | `src/lib/data.ts:9` (`getCachedSession`)<br>`src/lib/data.ts:25` (`getCachedUserProfile`) | `src/app/(dashboard)/page.tsx`<br>`src/components/views/CaseDetailsClient.tsx` |
| **2** | **`public.profiles`** *(VIEW)* | `id UUID PK` over `users.id` | Evaluated via underlying `public.users` RLS | `User` (`src/types.ts:5`) | Transparent compatibility layer over `users` | Deprecated direct queries; queries routed to `users` |
| **3** | **`public.organizations`** | `id UUID PK`<br>`slug TEXT UNIQUE` | Members view tenant; Owners/Admins update | `Organization`<br>(`src/types.ts:210`) | `src/lib/subscriptions.ts` | Multi-tenant organization selector & clinic settings |
| **4** | **`public.organization_memberships`** | `organization_id UUID FK`<br>`user_id UUID FK` | Members view co-workers | `OrganizationMembership` (`src/types.ts:225`) | Evaluated in `get_auth_organization_ids()` | Clinic team management & RBAC |
| **5** | **`public.subscriptions`** | `organization_id UUID FK (UNIQUE)` | Tenant members view subscription | `Subscription`<br>(`src/types.ts:240`) | `src/lib/subscriptions.ts` (`getOrganizationSubscription`, `evaluateCaseQuota`) | `src/app/billing/page.tsx`<br>`SubscriptionTierBadge` |
| **6** | **`public.patients`** | `id TEXT PK (DEFAULT gen_random_uuid())`<br>`dentist_id UUID`<br>`organization_id UUID FK` | Prescribing dentist + Tenant members + Assigned lab staff | `Patient`<br>(`src/types.ts:45`) | `src/lib/services.ts` | `src/app/(dashboard)/patients/page.tsx`<br>`src/components/dashboards/DentistDashboard.tsx#L1315` |
| **7** | **`public.patient_phi`** | `id UUID PK`<br>`case_id UUID FK`<br>`dentist_id UUID FK $	o$ users` | `FORCE RLS`: Strictly isolated to prescribing dentist | `PatientPhi`<br>(`src/types.ts:270`) | Isolated encrypted vault | Encrypted patient demographic card |
| **8** | **`public.phi_access_logs`** | `id UUID PK`<br>`patient_phi_id UUID FK`<br>`accessed_by UUID FK $	o$ users` | `FORCE RLS`: Dentists view own access history | `PhiAccessLog` | Automated audit logger | Compliance / Medico-legal audit viewer |
| **9** | **`public.tooth_charts`** | `id UUID PK`<br>`patient_id TEXT FK (UNIQUE)`<br>`organization_id UUID FK` | Prescribing dentist + Tenant organization members | `ToothChartData`<br>(`src/types.ts:101`) | `src/lib/services.ts` (`fetchPatientToothChart`, `savePatientToothChart`) | `src/components/patient-workspace/UnifiedClinicalWorkspace.tsx`<br>`src/components/views/ClinicalVisitClient.tsx` |
| **10** | **`public.cases`** | `id UUID PK`<br>`patient_id TEXT FK $	o$ patients`<br>`dentist_id UUID FK $	o$ users`<br>`lab_id UUID FK $	o$ lab_profiles`<br>`organization_id UUID FK` | Doctor owner + Tenant members + Assigned lab staff | `Case`<br>(`src/types.ts:15`) | `src/lib/data.ts:71` (`getCachedCases`)<br>`src/app/api/upload/route.ts` | `src/app/(dashboard)/cases/page.tsx`<br>`src/components/views/CaseDetailsClient.tsx`<br>`src/components/dashboards/DentistDashboard.tsx`<br>`src/components/dashboards/LabDashboard.tsx` |
| **11** | **`public.case_designs`** | `id UUID PK`<br>`case_id UUID FK $	o$ cases` | Inherits parent case accessibility | `CaseDesign` | Technician design uploaders | `CaseDetailsClient.tsx` CAD/CAM version tab |
| **12** | **`public.spatial_annotations`** | `id UUID PK`<br>`case_id UUID FK $	o$ cases`<br>`author_id UUID FK $	o$ users` | Prescribing doctor + Assigned lab staff | `SpatialAnnotation` | Three.js 3D raycasting pins | `src/components/views/ThreeDViewer.tsx` |
| **13** | **`public.timeline_events`** | `id UUID PK`<br>`case_id UUID FK $	o$ cases`<br>`dentist_id UUID`<br>`lab_id UUID` | Doctor owner + Assigned lab staff | `TimelineEvent`<br>(`src/types.ts:60`) | Supabase Realtime websocket subscriptions | `src/components/views/CaseDetailsClient.tsx` activity feed |
| **14** | **`public.order_chats`** | `id UUID PK`<br>`case_id UUID FK $	o$ cases` | Auto-created by DB trigger on case insert | `OrderChat` | Realtime channel subscriber | `CaseDetailsClient.tsx` chat drawer |
| **15** | **`public.chat_messages`** | `id UUID PK`<br>`chat_id UUID FK $	o$ order_chats`<br>`sender_id UUID FK $	o$ users` | Chat participants (doctor & lab staff) | `ChatMessage`<br>(`src/types.ts:75`) | Realtime message broadcast | `CaseDetailsClient.tsx` chat feed |
| **16** | **`public.lab_profiles`** | `id UUID PK` | Public read for authenticated dentists | `LabProfile`<br>(`src/types.ts:85`) | `src/lib/services.ts` | `src/app/labs/page.tsx`<br>`src/app/lab-directory/page.tsx` |
| **17** | **`public.lab_services`** | `id UUID PK`<br>`lab_id UUID FK $	o$ lab_profiles` | Active catalog is publicly readable | `LabService`<br>(`src/lib/services.ts:23`) | `src/lib/services.ts` (`fetchLabServices`) | `src/app/labs/page.tsx` catalog accordion |
| **18** | **`public.doctor_inventory`** | `id UUID PK`<br>`dentist_id UUID FK $	o$ users`<br>`lab_id UUID FK $	o$ lab_profiles` | Owning dentist only | `DoctorInventory` | `src/components/dashboards/DentistInventoryClient.tsx` | Pre-paid crown & bridge balance trackers |
| **19** | **`public.inventory_items`** | `id UUID PK`<br>`lab_id UUID FK $	o$ lab_profiles`<br>`organization_id UUID FK` | Lab staff & Tenant owners | `InventoryItem`<br>(`src/types.ts:130`) | `src/app/inventory/page.tsx` | `src/components/dashboards/InventoryDashboard.tsx` |
| **20** | **`public.inventory_transactions`** | `id UUID PK`<br>`inventory_id UUID FK`<br>`case_id UUID FK` | Lab staff & Tenant owners | `InventoryTransaction` | Physical consumable ledger | Lab materials traceability |
| **21** | **`public.domain_events`** | `id UUID PK` (Bi-temporal append-only ledger) | Enterprise audit administrators | `DomainEvent` | `src/lib/events/event-store.ts` | Cryptographic tamper-evident Merkle ledger |

---

## 3. Database Orchestration Triggers & Side-Effects

```mermaid
flowchart TD
    A[auth.users Insert] -->|Trigger: handle_new_user| B[public.users + public.lab_profiles]
    C[public.cases Insert] -->|Trigger: on_case_created_create_chat| D[public.order_chats auto-created]
    C -->|Trigger: trigger_deduct_inventory| E{Status == DRAFT?}
    E -->|No / Transition out of DRAFT| F[public.doctor_inventory stock decremented by 1]
    G[public.timeline_events Insert] -->|Trigger: populate_timeline_event_participants| H[Auto-fills dentist_id and lab_id for RLS broadcast]
```

---

## 4. Storage & Media Asset Topology (Cloudflare R2)

All binary medical assets (STL meshes, DICOM volumes, DSLR shade photos, and Exocad CAD designs) are stored outside Postgres in Cloudflare R2:

| Storage Asset | R2 Bucket & Path Structure | Client Resolution | Security Model |
|---|---|---|---|
| **3D STL Scans** | `dcos-scans/scans/<caseId>/<fileName>.stl` | `getR2PublicUrl(key)` | Presigned S3 PUT via `/api/upload` |
| **CBCT DICOM Volumes** | `dcos-scans/dicom/<caseId>/<fileName>.dcm` | `getR2PublicUrl(key)` | Presigned S3 PUT via `/api/upload` |
| **Shade Photos** | `dcos-scans/shade/<patientId>/<fileName>.jpg` | `getR2PublicUrl(key)` | Presigned S3 PUT via `/api/upload` |
| **Soft-Copy Designs** | `dcos-scans/designs/<caseId>/<fileName>.stl` | `getR2PublicUrl(key)` | Technician authenticated upload |

---

## 5. Agent Feature Feasibility & Ripple-Effect Calculation Engine

Whenever an agent or developer proposes adding, refactoring, or deploying a feature, execute this **4-Step Evaluation Matrix**:

### Step 1: Feasibility Analysis (The 5 Core Checks)
1. **Schema Check:** Does the target table exist in Section 2, or does it require a tracked SQL migration?
2. **Type Harmony:** Does the primary key / foreign key match (`TEXT` vs `UUID`)?
3. **RLS Blast Radius:** Does the new query access rows via `auth.uid()` or `get_auth_organization_ids()`?
4. **Trigger Interception:** Does the mutation hit `cases`, `users`, or `timeline_events` and fire background triggers?
5. **Ghost Code Filter:** Does the feature rely on unwired subsystems (`lib/events`, `lib/abdm`, `lib/agents`)? If yes, hard-gate until wired.

### Step 2: Ripple-Effect Permutation Calculator

| If You Are Modifying… | You MUST Cross-Check These Dependencies: |
|---|---|
| **Patient Registration / Intake** | 1. `patients.id` must use `DEFAULT gen_random_uuid()::text` if omitted.<br>2. `tooth_charts` 1-to-1 sync.<br>3. `patient_phi` dentist isolation.<br>4. `cases.patient_id` foreign key. |
| **Case Creation / Status Machine** | 1. Trigger `on_case_created_create_chat` auto-provisions chat.<br>2. Trigger `trigger_deduct_inventory` decrements `doctor_inventory` when leaving `DRAFT`.<br>3. RLS policy for `cases` evaluates both `organization_id` and `users.lab_id`. |
| **Lab Directory & Services** | 1. `lab_services.lab_id` references `public.lab_profiles(id)`, NOT `users(id)`.<br>2. Query `lab_profiles` with relational `lab_services(*)`. |
| **Tooth Chart (Odontogram)** | 1. Writes must persist to `public.tooth_charts` via `savePatientToothChart`.<br>2. Reads must call `fetchPatientToothChart` for cloud multi-device sync with fallback to `getPatientToothChart`. |
| **User Signups / Identity** | 1. `public.users` is canonical.<br>2. `public.profiles` is a read-only compatibility view. Never insert into `profiles`. |

### Step 3: Deployment & Verification Protocol
1. **Migration Verification:** Execute DDL via Supabase MCP `apply_migration` (never run unreviewed manual ALTERs).
2. **Catalog Verification:** Inspect `information_schema` and `pg_constraint` via `execute_sql`.
3. **Master Suite Test:** Run `npx tsx scripts/verify-backend-master.ts` (must pass 33/33 tests).
4. **Build Verification:** Run `npm run build` (must yield 0 errors across 21 routes).
5. **Parallel Documentation:** Update `session_handoff.md`, `changelog.md`, `antigravity_inbox.md`, and relevant ICM cards.
