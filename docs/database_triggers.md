# Database Orchestration Triggers

> **Source of Truth:** For change-impact routing and blast radius analysis, refer to [`docs/map/effects/CONTEXT.md`](./map/effects/CONTEXT.md).

In DentalConnect OS, key workflow orchestrations occur via PostgreSQL database triggers that execute directly within Supabase. Because these triggers execute at the database layer, they are invisible to TypeScript grep. 

---

## 1. Auth Mirror (`handle_new_user`)

- **Event:** `AFTER INSERT ON auth.users`
- **Definition:** `supabase/migrations/20260621000001_auth_and_triggers.sql`
- **Behavior:**
  - Automatically provisions a corresponding row in `public.users` with the new user's `id`, `name`, and `role`.
  - If the user registers with the `LAB` role, it auto-generates a linked laboratory record in `public.lab_profiles` and sets `users.lab_id`.
- **Impact:** Any code touching signup, authentication, or identity migration must preserve this trigger to prevent orphaned auth accounts.

---

## 2. Realtime Chat Channel Provisioning (`handle_new_case_chat`)

- **Event:** `AFTER INSERT ON public.cases`
- **Definition:** `supabase/migrations/20260621000001_auth_and_triggers.sql`
- **Behavior:**
  - Instantly provisions an active conversation channel in `public.order_chats` tied to the newly created `case_id`.
- **Impact:** Case creation endpoints do not need to manually initialize chat rooms; inserting into `cases` guarantees a chat channel exists.

---

## 3. Physical Inventory Deduction (`deduct_inventory_on_case`)

- **Event:** `AFTER UPDATE ON public.cases`
- **Definition:** Redefined in `supabase/migrations/20260707000002_update_inventory_trigger_for_drafts.sql`
- **Behavior:**
  - Evaluates case status transitions. When a case transitions **out of `DRAFT`** into an active state (`PENDING`, `IN_PROGRESS`, etc.), it automatically decrements the corresponding stock level in `public.doctor_inventory` by 1 unit.
- **Impact:** Prevents double-deductions during draft editing while ensuring automated inventory tracking upon official case submission.
