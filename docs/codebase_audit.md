---
tags: [dcos, audit, architecture, docs]
---
# DentalConnect OS — Exhaustive Codebase & Architecture Audit

> Related: [[CLAUDE]] · [[design]] · [[product_analysis]]

This document presents a comprehensive technical audit of the **DentalConnect OS (DCOS)** codebase. The analysis evaluates DCOS from the perspective of enterprise software engineering, systems design, database performance, graphics programming, and security compliance (specifically targeting DPDP Act and general medical data privacy constraints).

---

## Executive Summary & Architectural Overview

The DCOS system is built as a real-time collaborative workspace bridging **Clinics/Dentists** and **Dental Laboratories**. Structurally, the frontend is built on **Next.js 16 (App Router)** and **React 19**, with database automation and realtime messaging offloaded to **Supabase (PostgreSQL + Auth + Storage)**. 

Our audit has revealed that the system has an excellent foundational blueprint with advanced features—such as a custom Three.js mesh annotation engine and a browser File System Access API scanner watcher. However, critical security gaps (unprotected middleware and public storage buckets) and database schema conflicts (`users` vs `profiles` tables) currently block the system from working correctly in production and threaten compliance integrity.

---

## A. Gotten Right & Executed Well
*Architectural patterns, engineering designs, and practices implemented to industry standards.*

### 1. Dynamic Role-Based Routing & Code Splitting
- **Dynamic Dashboards**: In [src/app/(dashboard)/page.tsx](file:///c:/Users/balee/Desktop/DCOS/src/app/(dashboard)/page.tsx), the dashboard root is a Next.js Server Component that fetches the user profile and evaluates the role. It dynamically loads either `<DentistDashboard>` or `<LabDashboard>`, preventing the client from downloading heavy bundle dependencies of the dashboard they do not have access to.
- **Lazy WebGL Loading**: In [src/components/views/CaseDetailsClient.tsx](file:///c:/Users/balee/Desktop/DCOS/src/components/views/CaseDetailsClient.tsx), the Three.js 3D viewer is loaded asynchronously using `next/dynamic` with `ssr: false`:
  ```typescript
  const ThreeDViewer = dynamic(() => import('@/components/ThreeDViewer'), { ssr: false, ... })
  ```
  This is a best practice. It prevents server-side rendering (SSR) environments (Node.js) from breaking on browser-only canvas/WebGL API calls and ensures a lightweight initial bundle load.

### 2. Request Memoization & Performance
- In [src/lib/data.ts](file:///c:/Users/balee/Desktop/DCOS/src/lib/data.ts), database helper functions (`getCachedSession`, `getCachedUserProfile`, `getCachedCases`) are wrapped using React's `cache` function:
  ```typescript
  export const getCachedUserProfile = cache(async () => { ... });
  ```
  This ensures that if multiple layout files or nested server components request the same user profile or case catalog within a single render request lifecycle, the database query is executed exactly once, with results memoized.

### 3. Database Realtime & RLS Optimization
- **Denormalized WebSocket Filters**: To support real-time websocket subscriptions on tables containing RLS rules (which usually reject subqueries), a denormalization trigger `trigger_populate_timeline_event_participants` was created on `timeline_events` in [20260707000005_fix_timeline_realtime.sql](file:///c:/Users/balee/Desktop/DCOS/supabase/migrations/20260707000005_fix_timeline_realtime.sql).
- By copying `dentist_id` and `lab_id` onto each timeline event during insert, policies like `"Dentists see external timeline"` can check `dentist_id = auth.uid()` directly on the row, bypassing the WebSocket filter limitation.
- The use of `REPLICA IDENTITY FULL` on `cases` and `timeline_events` ensures that update payloads contain full preceding row details for the Realtime listener client.

---

## B. Done Amateurly (Optimization Needed)
*Technically functional approaches that represent technical debt, performance degradation, or design smells.*

### 1. Dual User Schema Mismatch (`users` vs `profiles`)
- **The Issue**: There are two parallel tables for user profile data: `public.users` (created in the initial schema) and `public.profiles` (created in the Phase 1 Core migration).
  - The Auth signup trigger `handle_new_user` in [20260621000001_auth_and_triggers.sql](file:///c:/Users/balee/Desktop/DCOS/supabase/migrations/20260621000001_auth_and_triggers.sql) inserts records strictly into `public.users`.
  - The subsequent workflow and wealth migrations (Phase 2 & 3) create tables referencing `public.profiles(id)` (e.g., `inventory_items.lab_id`, `spatial_annotations.author_id`) and write RLS policies checking `profiles`:
    ```sql
    -- Example from inventory RLS:
    lab_id IN (SELECT id FROM public.profiles WHERE id = auth.uid() ...)
    ```
- **The Consequence**: Because `profiles` is empty (users are only created in `users`), all operations querying `profiles` or relying on policies matching `profiles` will fail. Lab administrators cannot update inventory, and users cannot create spatial annotations.
- **The Optimised Approach**: Standardize the schema. Delete the duplicate `public.profiles` table and modify all policies and foreign keys in [20260622_phase2_workflows.sql](file:///c:/Users/balee/Desktop/DCOS/supabase/migrations/20260622_phase2_workflows.sql) and [20260622_phase3_wealth.sql](file:///c:/Users/balee/Desktop/DCOS/supabase/migrations/20260622_phase3_wealth.sql) to point to `public.users`.

### 2. Client-Side Payment Triggers & direct DB Writes
- **The Issue**: In [src/components/views/DentistInventoryClient.tsx](file:///c:/Users/balee/Desktop/DCOS/src/components/views/DentistInventoryClient.tsx), once a dentist confirms a simulated UPI checkout, the frontend directly invokes:
  ```typescript
  await supabase.from('doctor_inventory').insert({ ... }) // or update()
  ```
- **The Consequence**: Allowing the client-side JavaScript bundle to write directly to inventory balances is a high-risk security exploit. Any dentist user can open the browser console and execute a script to credit themselves infinite material credits for free.
- **The Optimised Approach**: The frontend should only handle the checkout UI. The database write must be gated behind a secure, server-side callback (webhook) from a payment processor (e.g. Razorpay, Stripe) or a signed Postgres RPC validating transactional tokens.

### 3. In-Memory Lab Inventory Deductions (Lack of Persistence)
- **The Issue**: In [src/components/dashboards/LabDashboard.tsx](file:///c:/Users/balee/Desktop/DCOS/src/components/dashboards/LabDashboard.tsx) (lines 168-190), when a lab operator moves a Kanban card to the `IN_PROGRESS` column, the material deduction is computed and updated in React state:
  ```typescript
  setInventory(prev => prev.map(inv => inv.id === matchedItem.id ? { ...inv, quantity: inv.quantity - 1 } : inv));
  ```
  But the corresponding database call only updates the case status:
  ```typescript
  supabase.from('cases').update({ status: statusId }).eq('id', draggedCaseId)
  ```
- **The Consequence**: The laboratory's physical stock count is never updated in the database. When the page is refreshed, the inventory counts reset, rendering stock tracking non-functional.
- **The Optimised Approach**: The RPC `deduct_inventory_for_case(case_id, sku, quantity)` written in the Phase 2 migration is never called. Call this RPC from the frontend via `supabase.rpc('deduct_inventory_for_case', ...)` when a card transitions columns.

### 4. String-JSON Custom State Serialization
- **The Issue**: To avoid schema updates, 30+ complex design parameters (individual teeth configuration arrays, custom incisor shader values, characterization checkmarks) are JSON-stringified and appended to the text `instructions` column during submission:
  ```
  [Design Parameters]: {"toothConfigs":{"18":"pontic"},"shade":"A2",...}
  ```
- **The Consequence**: If the lab technician or dentist edits the text box and accidentally modifies the `[Design Parameters]:` header or the JSON content, the case configuration is corrupted. Furthermore, SQL queries cannot index or filter on these fields.
- **The Optimised Approach**: Add a `design_parameters` `JSONB` column directly to the `public.cases` table. `JSONB` allows Postgres to parse, index, and query internal keys directly while maintaining schema flexibility.

### 5. WebGL Context Recreation (No Canvas Suspense)
- **The Issue**: The component `STLModel` inside [src/components/ThreeDViewerInner.tsx](file:///c:/Users/balee/Desktop/DCOS/src/components/ThreeDViewerInner.tsx) suspends while downloading files using React Three Fiber's `useLoader`. However, there is no `<Suspense>` boundary inside the `<Canvas>`.
- **The Consequence**: The suspension bubbles out to the `dynamic()` wrapper in `CaseDetailsClient.tsx`. This causes the entire HTML Canvas element to be unmounted and destroyed during the download, then recreated once the file is loaded.
- **The Optimised Approach**: Wrap only the loader elements in `<Suspense>` *inside* the `<Canvas>`:
  ```typescript
  <Canvas shadows>
    <Suspense fallback={<Html><Loader /></Html>}>
      <Stage environment="city">
        <STLModel url={activeUrl} />
      </Stage>
    </Suspense>
  </Canvas>
  ```
  This keeps the WebGL context alive and displays progress animations smoothly inside the 3D viewport.

### 6. Memory Leaks in 3D Mesh & Object URLs
- **Object URL Leak**: In `ThreeDViewerInner.tsx`, local files are previewed via `URL.createObjectURL(file)`. The code never calls `URL.revokeObjectURL(activeUrl)` when the file is changed or the component is unmounted, leaking browser DOM memory.
- **WebGL Geometry Cache Leak**: `STLLoader` caches parsed geometries in memory. For custom, unique 3D scan meshes (often 30MB+ per file), keeping these in memory indefinitely causes the browser tab to crash with Out-Of-Memory errors after viewing multiple cases.
- **The Optimised Approach**: Clean up resources on unmount/URL change:
  ```typescript
  useEffect(() => {
    return () => {
      if (activeUrl && activeUrl.startsWith('blob:')) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [activeUrl]);
  ```

---

## C. Gotten Wrong & Critical Fixes
*High-severity issues that block execution, compromise compliance, or introduce critical security vulnerabilities.*



### 2. Completely Public Scans Bucket (CRITICAL DATA PRIVACY RISK)
- **The Error**: The initial storage bucket setup in [20260618131640_add_scans_bucket.sql](file:///c:/Users/balee/Desktop/DCOS/supabase/migrations/20260618131640_add_scans_bucket.sql) creates the `scans` bucket as `public: true` and defines a policy allowing public anonymous access:
  ```sql
  CREATE POLICY "Allow public uploads to scans bucket" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'scans');
  ```
- **Why It's Wrong**: Although the Phase 2 migration adds `authenticated` policies, it does not drop the Phase 1 public policies. In Postgres, RLS policies are additive (OR-based). Having both means the public policies are still applied.
- **The Consequence**: Anyone on the internet can read, upload, overwrite, or delete private patient STL scan files without authenticating, violating medical data regulations.
- **The Fix**: Run a migration to drop all public policies on `storage.objects` for the `scans` bucket, and alter the `scans` bucket to `public = false`. Access should be provided strictly via server-side signed URLs.

### 3. Insecure Session Verification (`getSession` vs `getUser`)
- **The Error**: In [src/lib/data.ts](file:///c:/Users/balee/Desktop/DCOS/src/lib/data.ts), the session is verified via `supabase.auth.getSession()`:
  ```typescript
  const { data: { session } } = await supabase.auth.getSession();
  ```
- **Why It's Wrong**: `getSession()` retrieves the session from cookies but does not verify the signature of the JWT against the Supabase Auth server. A compromised or forged cookie could bypass this check.
- **The Consequence**: High risk of JWT token spoofing or session hijack exploitation.
- **The Fix**: Replace `getSession()` with `supabase.auth.getUser()` in all authentication checks on the server side:
  ```typescript
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  ```

### 4. Missing INSERT/UPDATE Policies on `doctor_inventory`
- **The Error**: In [20260621000000_add_bulk_inventory_and_chat.sql](file:///c:/Users/balee/Desktop/DCOS/supabase/migrations/20260621000000_add_bulk_inventory_and_chat.sql), policies are created only for `SELECT` on the `doctor_inventory` table.
- **The Consequence**: When a dentist clicks "Confirm UPI Payment", the client-side attempt to insert/update the balance is blocked by RLS, causing a database permission error.
- **The Fix**: Add corresponding write policies (after resolving the architectural security concern in item B.2) to allow authorized systems or users to insert/update.

### 5. Log-Purge Order Bug in DB Scheduled Purges
- **The Error**: The daily purge function `purge_expired_scans()` in [20260708000002_scan_retention_purge.sql](file:///c:/Users/balee/Desktop/DCOS/supabase/migrations/20260708000002_scan_retention_purge.sql) is written in this order:
  ```sql
  -- Step 1: Nullify
  UPDATE public.cases SET scan_url = NULL, dicom_url = NULL WHERE ... ;

  -- Step 2: Log (filtered by NOT NULL check)
  INSERT INTO public.timeline_events (...)
  SELECT ... FROM public.cases
  WHERE ... AND (scan_url IS NOT NULL OR dicom_url IS NOT NULL);
  ```
- **Why It's Wrong**: Step 1 clears the URLs. When Step 2 runs, `scan_url` and `dicom_url` are already `NULL` for the target cases, meaning the log filter is never matched.
- **The Consequence**: Scanner files are purged from cases, but the audit trail event `Scan Data Purged` is never logged.
- **The Fix**: Swap the statement execution order so that the audit trail is inserted first, or perform both operations in a single Common Table Expression (CTE):
  ```sql
  WITH purged_cases AS (
    UPDATE public.cases 
    SET scan_url = NULL, dicom_url = NULL
    WHERE (status = 'DELIVERED' OR status = 'COMPLETED') AND (created_at < NOW() - INTERVAL '30 days')
    RETURNING id
  )
  INSERT INTO public.timeline_events (case_id, status_update, notes, visibility)
  SELECT id, 'Scan Data Purged', 'Patient 3D scan files automatically purged.', 'BOTH'
  FROM purged_cases;
  ```

---

## Conclusion & Action Plan

This codebase features impressive domain modeling and rich client components, but the deployment readiness is limited by the critical issues outlined in Section C. 

### Critical Path to Production:
1. **Rename** `src/proxy.ts` to `src/middleware.ts` to secure routing authentication.
2. **Revoke** public storage policies on the `scans` bucket to secure patient healthcare data.
3. **Unify** the user profile tables by migrating references from `public.profiles` to `public.users` and cleanup RLS policies.
4. **Implement** proper payment processing validation rather than client-side direct writes to inventory.
