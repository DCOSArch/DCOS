# The One-Pager (leave-behind PDF)

Playbook §5 Stage 3: "Send a 1-page PDF, not a deck. One page: what you're selling, price, timeline, one screenshot, one Loom link. Any longer and it never gets read."

Below is the finished copy. Paste into Google Docs → export PDF (landscape, 11×8.5, single page). Update the screenshot + Loom URL + your email before sending.

---

# DentalConnect OS
### A working portal for your lab. Yours to own.

**For:** dental lab owners and CEREC-certified clinic owners who intake cases via PDF forms, WhatsApp, or phone — and are tired of it.

---

**What you get (Standard tier — $12,000 one-time):**
- Full source code, perpetual license, non-exclusive.
- Deployed to your Supabase + Cloudflare R2 (or your own AWS).
- Branded with your logo, colors, custom domain.
- One admin, up to 20 dentist logins. Additional users free.
- 6 months email support. Bugs: free. Feature requests: $100/hr.
- 20 hours of setup consulting included.
- 4-week deployment timeline from signature.

**What it does:**
- Case intake with 3D scan upload (STL/PLY/OBJ) — no PDF forms.
- Kanban production board with drag-and-drop status updates.
- 3D viewer with spatial annotations dentists can drop on the model.
- Real-time chat, per-case, unlocks the moment lab accepts.
- Auto-inventory sync — material deducts when a case enters production.
- Dual-layer timeline — labs see internal notes, dentists see external only.
- B2B2C patient preview link — read-only 3D, no login, HIPAA-safe.

**What you own:**
- The code.
- Your data. Your patients. Your dentists. Your brand.
- The right to modify it. The right to fire us and keep running.

**Alternatives, honestly:**
| Product | Price | You own it? |
|---|---|---|
| **DentalConnect OS (this)** | **$12k one-time** | **Yes — full source** |
| LabStar (3Shape) | $250/mo = $9k / 3 yrs | No |
| Dandy | $12–30k / yr minimum | No |
| Custom dev shop build | $50–75k + 6 months | Yes, if delivered |

**[SCREENSHOT: Lab Kanban with a card mid-drag, inventory deduction toast visible]**

**See it in 90 seconds:** [Loom link — replace with your URL]
**See it on your workflow:** [your email] — reply and I'll book 30 min this week.

---

*DentalConnect OS is built on Next.js 16, Supabase, Cloudflare R2, Three.js. Row-level security on every table. Patient PHI isolated from lab-visible case data. Deploys HIPAA-ready on your own cloud accounts.*

*Also available: Starter tier ($6k, hosted by us, first-reference-customer pricing). Enterprise tier ($20–25k, full transfer + regional exclusivity option).*

---

## Design notes for the PDF layout

- **Font:** Inter or Geist (matches the product).
- **Colors:** brand primary + one accent + neutral gray. No gradients.
- **Layout:** two-column landscape. Left column = What you get + What it does. Right column = What you own + Alternatives + Screenshot.
- **Header:** logo top-left, "One-page overview" top-right.
- **Footer:** company name, dcos.in, date generated.
- **Screenshot:** 300–400 pixels wide, 2x resolution for print. Show the Kanban with a drag in progress — that's the "aha" screen.
- **Loom link:** make it a QR code AND a shortlink (dcos.in/demo). Some readers print the PDF.
- **File size:** under 200KB. Anything bigger gets flagged by mail filters.
- **Filename:** `DentalConnect_OS_Overview_2026.pdf`. Not `dcos_v3_final_FINAL.pdf`.

## When to send
- Immediately after a discovery call ends. Same hour.
- As an attachment to the outbound email (only for warm leads — cold outbound has higher reply rate with just a Loom link, no attachment).
- Never before a call unless they explicitly ask. Attachments in cold email tank deliverability.

## What NOT to include
- A pitch deck. This is a one-pager for a reason.
- A team bio. They don't care.
- A "problem statement" section. If they don't already know the problem, they're not a buyer.
- A roadmap. They're buying what exists, not what's coming.
- Screenshots of the mock UI or admin screens. Only the pretty parts.
- Any claim of paying customers you don't have.
