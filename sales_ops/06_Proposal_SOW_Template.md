# Proposal / SOW Template — Standard Tier

$10–15k perpetual license deal. This is a template — fill in the `[BRACKETS]`. Send as a PDF, not a Word doc (harder to edit, feels more committed).

Deal shape adapted from Buyer Playbook v3 §2 template terms.

---

# Master Services Agreement + Statement of Work

**Between:** [YOUR LEGAL ENTITY NAME, e.g., "DCOS Technologies Pvt. Ltd." / your company name]
**Address:** [YOUR ADDRESS]
**GST/Tax ID:** [YOUR NUMBER]
("**Vendor**")

**And:** [BUYER LEGAL NAME, e.g., "Precision Dental Laboratory Pvt. Ltd."]
**Address:** [BUYER ADDRESS]
**Tax ID:** [BUYER NUMBER]
("**Client**")

**Effective Date:** [DATE OF LAST SIGNATURE]

---

## 1. Deliverables

Vendor will deliver the **DentalConnect OS** platform to Client, comprising:

**1.1 Source Code License**
- Full source code repository for DentalConnect OS as of the Effective Date, delivered as a Git repository transfer or archive.
- Includes: Next.js application, Supabase database migrations, Cloudflare R2 upload service, Three.js viewer, and all UI components as listed in Schedule A.

**1.2 Deployment**
- Vendor deploys DentalConnect OS to Client's own cloud infrastructure:
  - Client's Supabase project (Client owns the account and pays Supabase directly).
  - Client's Cloudflare R2 bucket (Client owns the account and pays Cloudflare directly).
  - Client's Vercel or equivalent hosting (Client owns the account).
- Deployment includes one production environment + one staging environment.

**1.3 Branding**
- One branding pass: logo, favicon, primary/accent color, custom domain configuration, email sender name.
- Additional branding revisions billable at $100/hour.

**1.4 Setup Consulting**
- Up to twenty (20) hours of setup consulting during the deployment window: user onboarding, data seeding, dentist invite setup, initial admin training.

**1.5 Documentation**
- Deployment guide (Markdown).
- Environment variables reference.
- Admin user guide (PDF, 10 pages max).

**1.6 Support**
- Six (6) months of email support from Deployment Complete date.
- Response within 24 business hours (Monday–Friday, 09:00–17:00 IST).
- **Bugs in delivered scope:** fixed free of charge.
- **Feature requests:** billable at $100/hour, subject to change order in Section 5.

---

## 2. Timeline

| Milestone | Target Date | Trigger |
|---|---|---|
| Kickoff | [Effective Date + 3 business days] | Signature + 50% payment received |
| Client cloud accounts provisioned | Kickoff + 7 days | Client responsibility |
| Staging environment live | Kickoff + 14 days | Vendor delivers |
| Branding pass complete | Kickoff + 21 days | Client approves designs |
| Production deployment | Kickoff + 28 days | All above complete |
| Deployment Complete (billing trigger) | Production live + 3-day acceptance | Client signs acceptance |

Client delays that impact the timeline (unavailable stakeholders, delayed account provisioning, delayed branding assets) do not extend the support period.

---

## 3. Fees & Payment

**3.1 Total Fee: [$12,000] USD** (or INR equivalent at the RBI reference rate on invoice date)

**3.2 Payment Schedule:**
- **50% ($6,000) on signature** — invoice issued Effective Date, due within 7 days.
- **50% ($6,000) on Deployment Complete** — invoice issued when Client signs acceptance, due within 30 days.

**3.3 Payment Methods:**
- International wire (SWIFT) to account in Schedule B.
- Stripe / Razorpay link (Client pays processing fees).
- USDC to wallet in Schedule B (if agreed in advance).

**3.4 Late Payment:**
- 1.5% interest per month on overdue amounts after grace period.
- Vendor may suspend support if invoices are 30+ days overdue.

**3.5 Taxes:**
- Fees exclusive of GST, VAT, sales tax. Client pays applicable tax on top.
- Vendor provides tax-compliant invoice per jurisdiction.

---

## 4. License Grant

Vendor grants Client a **perpetual, non-exclusive, non-transferable, worldwide** license to use, modify, and deploy the DentalConnect OS source code delivered under this Agreement, subject to:

**4.1 Permitted uses:**
- Deploy the software for Client's own dental laboratory / clinic operations.
- Modify the source code for Client's internal use.
- White-label with Client's branding.
- Provide access to Client's own partner dentists and staff.

**4.2 Prohibited uses:**
- Reselling, sublicensing, or redistributing the source code to third parties.
- Offering DentalConnect OS as a SaaS product to other laboratories or clinics.
- Removing Vendor's copyright notices from source files (branding/UI text may be changed).

**4.3 Vendor retains:**
- All right, title, and interest in the DentalConnect OS platform code and IP.
- The right to license the same code to other buyers (non-exclusive).
- The right to continue developing and licensing DentalConnect OS commercially.

**4.4 Optional Regional Exclusivity Add-On (Enterprise tier only, not Standard):**
- Not included in Standard tier. See Enterprise SOW for regional exclusivity terms.

---

## 5. Change Orders

Any change to scope, deliverables, or timeline requires a written change order signed by both parties. Change orders specify: description, effort estimate in hours, cost, and revised timeline. Vendor bills change orders at $100/hour, invoiced monthly.

---

## 6. Data & Privacy

**6.1 Client Data.** All data entered into or processed by DentalConnect OS after deployment — including patient information, case data, files, dentist accounts, chat messages — is Client's property. Vendor has no access to Client's production data unless expressly granted in writing for support purposes.

**6.2 Compliance Responsibility.** Client is the data controller under GDPR/DPDPA and the covered entity under HIPAA. Client is responsible for:
- Signing Business Associate Agreements (BAA) with Supabase, Cloudflare, and any other subprocessors.
- Configuring row-level security policies as documented.
- Obtaining patient consent for 3D scan storage and preview sharing.

**6.3 Vendor's Responsibility.** Vendor delivers a HIPAA-ready architecture (encryption at rest, encryption in transit, isolated PHI, RLS on every table, audit logging). Vendor is not a business associate under this Agreement; Vendor has no ongoing access to production PHI.

---

## 7. Warranties & Disclaimers

**7.1** Vendor warrants that on the Deployment Complete date, the software will substantially conform to Schedule A ("Features Included").

**7.2** Vendor commits to fix critical bugs (defined as: prevents core case-creation, case-visibility, or file-upload workflows) in the delivered code during the 6-month support period at no cost.

**7.3** SOFTWARE IS PROVIDED "AS-IS". Vendor makes no warranty of uninterrupted operation, third-party service uptime (Supabase, Cloudflare, Vercel), or fitness for any specific medical or regulatory use case not documented in Schedule A.

**7.4 Vendor is not a medical device manufacturer.** DentalConnect OS is a workflow tool, not a diagnostic or treatment-planning system. Client is responsible for all clinical decisions made using the software.

---

## 8. Limitation of Liability

Vendor's aggregate liability under this Agreement is capped at the total fees paid by Client in the twelve (12) months preceding the claim. In no event shall Vendor be liable for indirect, consequential, punitive, or lost-profit damages.

---

## 9. Term & Termination

**9.1** The License granted in Section 4 is perpetual and survives termination of this Agreement.

**9.2** The Support obligations in Section 1.6 continue for six (6) months from Deployment Complete and may be extended via a maintenance retainer at $1,000/month (mutually agreed).

**9.3** Either party may terminate the support engagement with 30 days written notice. Termination does not affect the License, delivered code, or Client's ownership of their data.

**9.4** Client may terminate this Agreement before Deployment Complete for Vendor's material breach uncured after 15 days' written notice. In such case, Vendor refunds any payments received minus the reasonable value of work delivered to date.

---

## 10. Confidentiality

Each party will hold the other's Confidential Information in confidence for 3 years. Confidential Information includes source code (from Vendor), Client's data and business plans (from Client), and pricing terms of this Agreement.

---

## 11. General

- **Governing Law:** [Delaware, USA / India — pick one based on your entity]
- **Dispute Resolution:** Good-faith negotiation, then binding arbitration in [seat]. No class actions.
- **Assignment:** Vendor may assign to a successor entity in a corporate transaction; Client requires Vendor's consent.
- **Entire Agreement:** This SOW + attached Schedules is the entire agreement, supersedes prior discussions.
- **Amendments:** Only in writing signed by both parties.

---

## Schedule A — Features Included at Delivery

| # | Feature | Status |
|---|---|---|
| 1 | Email/password authentication (dentist + lab admin roles) | ✅ Included |
| 2 | Role-based dashboards (dentist table view + lab Kanban) | ✅ Included |
| 3 | Case creation with STL/PLY upload | ✅ Included |
| 4 | 3D STL viewer with orbit controls | ✅ Included |
| 5 | Spatial annotation pins on 3D model | ✅ Included |
| 6 | Real-time per-case chat (unlocks on IN_PROGRESS) | ✅ Included |
| 7 | Real-time timeline with visibility filtering | ✅ Included |
| 8 | Lab directory + profile pages | ✅ Included |
| 9 | Lab inventory management with auto-deduction | ✅ Included |
| 10 | Doctor virtual inventory (bulk pre-purchase) | ✅ Included |
| 11 | B2B2C patient preview link | ✅ Included |
| 12 | Global search + notification dropdown | ✅ Included |
| 13 | Dark mode | ✅ Included |
| 14 | Cloudflare R2 presigned upload | ✅ Included |
| 15 | STL pre-flight validation | ✅ Included |

**Features NOT included (available as change orders):**
- UPI payment integration (India-only).
- Scanner folder watcher UI wiring.
- Custom Rx catalog per lab.
- Multi-lab tenancy on same instance.
- Patient PHI hashing full implementation.
- Native mobile app.

---

## Schedule B — Payment Details

**Wire (international):**
- Beneficiary: [YOUR LEGAL NAME]
- Bank: [BANK NAME]
- Account: [ACCOUNT NUMBER]
- SWIFT: [SWIFT CODE]
- IFSC (India): [IFSC IF APPLICABLE]

**Stripe / Razorpay:** invoice link sent per milestone.

**USDC (if pre-agreed):** [WALLET ADDRESS]

---

**Signatures:**

**For Vendor:**
Name: _____________________ Title: _____________________ Date: __________ Signature: _____________________

**For Client:**
Name: _____________________ Title: _____________________ Date: __________ Signature: _____________________

---

## Redline notes for the sender (delete before sending)

1. **Governing law:** default to your jurisdiction (India → Bangalore/Delhi arbitration; if buyer is UK/US → mutually agreed neutral seat like Singapore/London). Buyers will push for their jurisdiction. Fine as long as they pay legal-review costs on their side.
2. **License exclusivity:** default non-exclusive. Enterprise-tier buyer may request regional exclusivity — priced at +50% of base fee. See Buyer Playbook §2.
3. **Support hours:** default 09:00–17:00 IST. If Western buyer insists on their timezone, price is +$1k for extended-hours support.
4. **Late payment interest:** 1.5% is standard. Some jurisdictions cap this (e.g., California) — check.
5. **Refund clause:** the 9.4 refund is reasonable and shows good faith. Do not remove unless a buyer specifically asks for zero-refund + a lower price.
6. **BAA question:** if buyer asks Vendor to sign a HIPAA BAA, they misunderstand the deal. You're not their business associate — you don't touch their PHI post-deployment. Redirect them to Supabase's BAA and Cloudflare's BAA.
