# Compliance One-Pager — "Is Patient Data Safe?"

Send this the moment someone asks. Or better, send it before they ask.

**Gate:** the four "Fix First" items in Buyer Playbook §6 MUST be resolved before this doc is truthful. Do not send until:
1. Public storage bucket policy dropped.
2. `getSession()` replaced with `getUser()` for server-side auth checks.
3. Client-side inventory writes moved behind server actions.
4. `users/profiles` schema unified.

Once those are fixed, this doc is accurate. Until then, it isn't. Do not lie.

---

# DentalConnect OS — Security & Compliance Overview

## The one-sentence answer
Your data lives in **your** cloud accounts, isolated by row-level security, with patient PHI stored in a separate table only the prescribing dentist can read. We never touch it after deployment.

## Architecture summary

```
┌────────────────────────────┐        ┌────────────────────────────┐
│    YOUR SUPABASE PROJECT   │        │    YOUR CLOUDFLARE R2      │
│    (your account, your DB) │        │    (your bucket, your keys)│
│                            │        │                            │
│  ┌──────────────────────┐  │        │  ┌──────────────────────┐  │
│  │  Postgres            │  │        │  │  STL/PLY scan files  │  │
│  │  RLS on every table  │  │        │  │  Presigned URLs only │  │
│  │  patient_phi table   │  │        │  │  1-hour expiry       │  │
│  │  isolated from cases │  │        │  └──────────────────────┘  │
│  └──────────────────────┘  │        │                            │
│                            │        │                            │
│  ┌──────────────────────┐  │        │                            │
│  │  Auth (JWT cookies)  │  │        │                            │
│  │  Server-verified     │  │        │                            │
│  └──────────────────────┘  │        │                            │
└────────────────────────────┘        └────────────────────────────┘
             │                                    ▲
             │                                    │
             ▼                                    │
      ┌──────────────────────────────────────────┐
      │  YOUR VERCEL DEPLOYMENT                  │
      │  Next.js App Router                      │
      │  Server-side auth on every request       │
      │  No secrets in client bundle             │
      └──────────────────────────────────────────┘
```

**We do not touch your production database or files after deployment.** Support access requires you to grant a temporary read-only role and revoke it after the ticket closes.

## Data isolation

**Every table has Row-Level Security enabled.** Enforcement is at the Postgres level, not the app level. Even if a bug in the frontend tried to leak data, Postgres refuses the query.

Key policies:
- **Dentists** can only read/write cases where `dentist_id = auth.uid()`.
- **Labs** can only read/write cases where `lab_id = user's lab`.
- **Patient PHI** (real name, DOB) is in a **separate table** (`patient_phi`) that only the prescribing dentist can read. **Labs never see patient real names** — only a hashed identifier and the case data.
- **Chat** is scoped to case participants; nobody outside the case sees any message.
- **Inventory** is scoped per lab; competitors on the same platform can't see each other's stock.

## Authentication

- **JWT sessions via Supabase Auth**, cookie-based, HttpOnly + Secure + SameSite=Strict.
- **Server-side verification** — every server component and API route re-verifies the JWT signature against Supabase Auth using `supabase.auth.getUser()`. A forged or stolen cookie fails signature verification.
- **Middleware guards** every route except `/login`, `/auth`, `/preview/*`. Unauthenticated requests redirect to login.
- **Rate limiting on auth endpoints** — Supabase Auth defaults + optional Cloudflare rules.

## File storage

- **Scans (STL/PLY/OBJ)** stored in your Cloudflare R2 bucket.
- **Presigned URLs** issued server-side after JWT verification. URLs expire in 1 hour.
- **No public bucket policy.** Direct bucket access requires signed URL. Reproducing the URL after expiry is cryptographically infeasible.
- **Per-user path partitioning** — `userId/timestamp_filename` prevents guessing others' file paths.

## B2B2C patient preview

- **Public route** at `/preview/hash-{CASE_UUID}`.
- Exposes only the 3D scan (via signed URL) and lab name.
- **Does not expose:** patient name, dentist name, treatment details, case ID, or any other PHI.
- Case UUID is 128-bit random; unguessable.
- Preview links are policy-labeled as expiring in 72 hours (enforceable by the dentist revoking the case's `preview_enabled` flag; server refuses signed URL requests when disabled).

## Chat gating

- Order chat is **locked** until the lab moves the case to `IN_PROGRESS`.
- Prevents unsolicited communication before an order is accepted.
- Chat messages are scoped to the case's participants only.

## Encryption

- **In transit:** TLS 1.3 on all client-server, Supabase, and R2 connections.
- **At rest:**
  - Postgres data: encrypted by Supabase (AES-256 with managed keys).
  - R2 files: encrypted by Cloudflare (AES-256).
  - Cookies: HttpOnly, Secure, SameSite=Strict.

## Audit logging

- All timeline events written to `timeline_events` with immutable append semantics.
- Supabase Auth logs all sign-in / sign-out / password reset events.
- Optional (recommended for HIPAA-covered deployments): enable Supabase Postgres audit extension for row-level read/write audit trails.

## What you're responsible for as the deployer

You are the **data controller** (GDPR/DPDPA) and **covered entity** (HIPAA). We are neither. Which means:

1. **Sign a BAA with Supabase and Cloudflare** on your account (both providers offer BAAs on paid plans). We don't sign a BAA because we don't touch your production data.
2. **Choose your region.** For HIPAA: US East / US West. For DPDPA: Mumbai (ap-south-1) / Hyderabad. For GDPR: Frankfurt / Ireland.
3. **Obtain patient consent** for scan storage and preview sharing. We ship consent-language templates in the docs; your lawyer approves them.
4. **Configure account access.** You choose who has admin access to Supabase, R2, and Vercel. Rotate keys quarterly.
5. **Backup policy.** Supabase does automatic daily backups on paid tiers; enable point-in-time recovery for HIPAA/DPDPA.
6. **Incident response.** You're the covered entity — breach notification is your obligation. We assist with root-cause analysis if it involves DCOS code.

## What we're responsible for

1. **Deliver secure code** as of the deployment date. Row-level security, verified auth, no client-side privilege escalation.
2. **Fix critical bugs** in delivered scope during the 6-month support window at no cost.
3. **Publish security advisories** if we find a bug that affects your deployment (via SOW notification clause).
4. **Not touch your data** without written permission for a specific support ticket.

## Certifications

- **What we have:** none. We are pre-launch.
- **What the underlying platforms have:** Supabase (SOC 2 Type 2, HIPAA BAA on Team/Enterprise, ISO 27001). Cloudflare (SOC 2, ISO 27001, HIPAA-ready). Vercel (SOC 2, HIPAA on Enterprise).
- **What we don't claim:** SOC 2 for DCOS itself. If you require SOC 2 for the app layer, we can help scope a compliance engagement (~$30k+, external auditor).

## Common questions

**"Do you have SOC 2?"** No, we're pre-launch. Our underlying platforms are SOC 2 Type 2. If SOC 2 for the app layer is a hard requirement, that's a separate engagement.

**"Do you sign a BAA?"** No — we don't have access to your production PHI. Sign BAAs with Supabase and Cloudflare instead. This is the correct pattern; a vendor who signs a BAA without touching your data is either misrepresenting their access or actually accessing your data.

**"What if you get breached?"** We can only lose the source code, which you already own. Your data lives on your infrastructure. A breach of us doesn't breach you.

**"How do you handle security disclosures?"** security@dcos.in (set this up as an alias to your monitored inbox). We commit to a 5-day response and 30-day fix window on critical issues.

**"Can you get penetration-tested code?"** Yes as a paid add-on ($5k for a third-party pentest by a firm like Cure53 or Trail of Bits). Scope: authentication, RLS enforcement, preview link security, file upload validation. Report delivered to buyer.

## The four things buyers will ask verbatim (Buyer Playbook §Fix First)

> "Is the storage bucket publicly readable?"

**No.** The bucket policy allows access only via signed URL from an authenticated server request. (Verify: `supabase storage list-policies scans` shows no `SELECT USING (true)` policy.)

> "Do you verify JWT signatures server-side?"

**Yes.** Every server component and API route uses `supabase.auth.getUser()`, which round-trips to Supabase Auth to verify the signature. `getSession()` (which only reads the cookie) is not used for authorization decisions.

> "Can a user modify inventory client-side?"

**No.** All inventory writes go through server actions. The client-side Supabase client cannot bypass RLS policies, and inventory writes require the `LAB_ADMIN` role via server-side check.

> "Is there a single source of truth for user profiles?"

**Yes.** All user profile data lives in `public.users`, populated by the `on_auth_user_created` trigger. The `profiles` table has been removed / merged.

If any of the four answers is "not yet" — do NOT send this document.
