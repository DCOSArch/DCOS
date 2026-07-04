# Agent Changelog
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