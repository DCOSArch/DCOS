# DentalConnect OS — Bug Fix & Live Feature Plan

## Summary of Identified Issues

Based on browser testing + codebase review, here are all confirmed bugs and missing features:

---

## 🔴 CRITICAL BUGS

### 1. 3D Viewer Always Shows "Loading 3D Engine..."
**Root cause:** `CaseDetailsClient.tsx` renders `<ThreeDViewer />` with **no `stlUrl` prop**. The viewer correctly shows a spinner when `stlUrl` is undefined. The `scanUrl` from the case data is never passed through.
```tsx
// BROKEN (line 271)
<ThreeDViewer />
// SHOULD BE
<ThreeDViewer stlUrl={caseItem.scanUrl || undefined} />
```
Additionally, the seed `scanUrl` values are relative paths like `scans/crown.stl` — these need to be valid public URLs. Since we don't have real R2/Supabase Storage public URLs, we should replace the 3D viewer placeholder with a **real publicly-hosted STL demo file** OR replace it with a proper "No 3D model uploaded" empty state instead of infinite spinner.

**Fix:** Pass `stlUrl` prop; replace placeholder spinner with a proper empty state when no URL exists. Use a public demo STL file from a CDN for demonstration.

---

### 2. Dentist & Lab Name Show as "undefined" in Case Details
**Root cause:** `CaseDetailsClient.tsx` looks up dentist/lab names using `mockUsers` (which doesn't contain our real dummy accounts). Since the real UUIDs are different from mock UUIDs, `dentist?.name` and `lab?.name` are always `undefined`.
```tsx
// BROKEN (lines 34-35)
const dentist = mockUsers.find(u => u.id === caseItem?.dentistId);
const lab = mockUsers.find(u => u.id === caseItem?.labId);
```
**Fix:** Fetch dentist and lab names from Supabase (`users` and `lab_profiles` tables) using `useEffect`, just like the chat and timeline panels.

---

### 3. Timeline Shows Mock Data For Wrong Cases
**Root cause:** `CaseDetailsClient.tsx` merges `mockTimelineEvents` with DB timeline events. The mock events have hardcoded case IDs that don't match our real UUIDs.
```tsx
// BROKEN (line 154)
const combinedTimeline = [...mockTimelineEvents.filter(t => t.caseId === caseItem.id), ...dbTimeline...]
```
**Fix:** Remove `mockTimelineEvents` merge entirely. Only show DB timeline events.

---

### 4. Lab Dashboard: `LAB_STAFF` Has No lab_id
**Root cause:** When `labstaff@demo.com` was created, no `lab_id` was assigned. The RLS policy for staff checking `lab_id` will return 0 cases.
**Fix:** Update `labstaff@demo.com`'s `lab_id` to `33333333-3333-3333-3333-333333333333`.

---

## 🟠 BROKEN FEATURES

### 5. Chat Panel: Sending Works But Receiving Real-Time Doesn't Update Correctly
The chat sends via Supabase INSERT, but the sender's own message is immediately added via the realtime subscription. The subscription filter needs to only listen on new INSERTS, not pick up its own sent message twice if there's a race. This appears to work but needs verification.

### 6. Create Case Form: Not Actually Saving the Case
**Root cause:** In `DentistDashboard.tsx` `handleSubmitCase`, the form collects data and creates a case, but after creation calls `router.refresh()`. This is correct, but the form doesn't validate `dueDate` (no due date field in the form!) and the lab_id is selected — it should work. Needs confirmation.

### 7. LabDashboard Create Case Modal: Non-Functional Submit Button
The `+` floating button opens the Create Case modal but the **Submit button does nothing** — no `handleSubmitCase` function is wired up, and no form state is tracked.

---

## 🟡 INCOMPLETE / POLISH

### 8. Dark Mode Toggle Doesn't Persist
The dark mode toggle in the Navbar adds/removes `.dark` class from the HTML element, but **never saves to localStorage**. On page refresh, it resets to light mode.

### 9. "Generate Patient Link" Modal: Hardcoded Fake URL
The patient link modal shows `https://dentalconnect.os/preview/hash-${caseItem.id}` — a fake URL. The actual working URL should be `https://dcos-ntw0f0d0w-dcosv1.vercel.app/preview/${hash}`.

### 10. Inventory Page: No LAB_STAFF or DENTIST View Redirect
The `/inventory` page only works for Lab Admin. Dentist users hitting `/inventory` get an error.

---

## Proposed Fixes (in execution order)

| # | Fix | Files Changed |
|---|---|---|
| 1 | Pass `stlUrl` to `<ThreeDViewer>` + proper empty state | `CaseDetailsClient.tsx`, `ThreeDViewer.tsx` |
| 2 | Replace `mockUsers` lookup with real DB fetch | `CaseDetailsClient.tsx` |
| 3 | Remove `mockTimelineEvents` merge | `CaseDetailsClient.tsx` |
| 4 | Assign `lab_id` to `labstaff@demo.com` | Supabase SQL |
| 5 | Persist dark mode to localStorage | `Navbar.tsx` |
| 6 | Fix patient preview URL | `CaseDetailsClient.tsx` |
| 7 | Update changelog and project_context | `.agent_memory/` |

> [!NOTE]
> The 3D viewer demo will show a fallback empty state (not a spinning loader) when no real STL URL is present, since our seed case scan_urls are relative paths, not public CDN URLs.

## Open Questions
- Should we point the `stlUrl` to a publicly hosted sample STL for demonstration, or just show a clean "No scan uploaded" empty state?
- Should the dark mode default to dark (Monokai) on first load, or remain light?
