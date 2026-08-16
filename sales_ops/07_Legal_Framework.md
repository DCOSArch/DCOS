# Legal Framework — NDA Triage + MSA Red Flags + JV Risk

**Not legal advice.** This is a triage guide so you can decide (a) what to sign yourself, (b) what needs a $200 lawyer review, and (c) what needs a real lawyer. At $10–15k deal size, you can afford $200–500 of legal review per deal; you cannot afford $5k. Use this to filter.

## Part 1: NDA Triage (before any real conversation)

Rule of thumb: a real buyer at this size won't insist on an NDA before the first call. If they do, it's usually not sophistication — it's a stall or a lawyer-y personality. Sign a mutual, standard NDA. Never sign what they send verbatim.

### GREEN — sign as-is (with 2 min review)

Signals a standard, boilerplate NDA:
- **Mutual** — both parties disclose and receive.
- **Term:** 1–3 years.
- **Definition of Confidential Info:** limited to information marked or reasonably understood as confidential.
- **Standard carve-outs present:** publicly available, independently developed, lawfully obtained from third party, required by law.
- **No exclusivity language** ("shall not discuss with any competitor").
- **No non-solicitation of employees** beyond 12 months.
- **Governing law:** neutral or your jurisdiction.
- **No hidden IP assignment.**
- Under 6 pages.

### YELLOW — send back with 3 redlines

Signals a semi-aggressive template:
- **One-way** — you disclose, they don't. Redline to mutual.
- **Term > 5 years.** Redline to 3 years.
- **"All information shared" is Confidential** (no marking requirement). Redline to require marking or documented notice.
- **IP assignment clause** that could assign your IP to them. Delete entirely.
- **"Discuss with anyone in the industry"** language. Redline: exclude your existing prospects.
- **Non-solicit of your employees.** Redline to 12 months, mutual.
- **6–12 pages.**

Redline yourself. Save turnaround time.

### RED — do not sign, or get a lawyer

Signals: this is not really an NDA, it's a lock-out:
- **"No compete" or "exclusivity" for 12+ months** in any form.
- **Assignment of IP** created during discussions to them.
- **Injunctive relief** with automatic damages > $50k.
- **You will indemnify** them for third-party claims arising from your disclosures.
- **Jurisdiction:** their home country + waived jury trial + damages > $100k liquidated.
- **12+ pages** with schedules.

If a $10–15k prospect sends an aggressive NDA: reply with your own 2-page mutual. If they insist on theirs, decline politely: "This deal size doesn't support the legal review this NDA requires. Happy to work under mutual standard terms — attached." If they walk, they weren't a buyer.

### Draft mutual NDA you can send

Keep a boilerplate mutual NDA in `sales_ops/legal_templates/DCOS_Mutual_NDA_v1.pdf` (you write this once with a lawyer for $200; then reuse forever). Key clauses:

- Mutual disclosure.
- 3-year term.
- Confidential = information marked "confidential" OR reasonably understood as such (list examples: source code, pricing, roadmap, financial info).
- Carve-outs: publicly available, independently developed, third-party lawful, required by law with notice.
- Return/destroy on request.
- Governing law: your jurisdiction, or neutral.
- No IP assignment. No exclusivity. No non-solicit beyond 12 months.
- No consequential damages.

## Part 2: MSA / SOW Red Flags to Reject

When a buyer sends their own MSA (mostly PE consolidators, tech startups):

### Red flags to strike

1. **Uncapped liability** — Cap must be ≤ total fees paid in preceding 12 months.
2. **Unlimited indemnification** — Cap same as above; exclude third-party IP claims outside your control.
3. **Perpetual audit rights** — Fine for financial records, not fine for source-code inspection.
4. **Source code escrow with automatic release triggers** — Escrow is OK; automatic release on any breach is not. Release only on your bankruptcy or 60-day support failure.
5. **Assignment restriction on you** — You must be able to assign to a successor entity. If they need consent, "consent not to be unreasonably withheld".
6. **"Vendor represents software is bug-free"** — No software is. Delete or scope to "material bugs in Schedule A features".
7. **Jurisdiction: their home + jury waiver + venue in a plaintiff-friendly county** — Push for neutral arbitration (JAMS, LCIA, SIAC).
8. **"Time is of the essence"** — Triggers liability for any missed date. Delete or add force majeure.
9. **Automatic renewal of support at same price** — Only in writing, with 30 days opt-out.
10. **IP created during engagement belongs to them** — Delete. Your existing IP is yours. New IP created for them specifically is theirs (if paid for). Everything else is yours.

### Reasonable clauses to accept
- Basic reps (authority to enter contract, no conflict, comply with laws).
- Confidentiality (mutual, 3 years).
- Standard warranty of workmanship on delivered code (see [06_Proposal_SOW_Template.md](06_Proposal_SOW_Template.md) §7.2).
- Termination for material breach with 15-day cure.
- Notices in writing to specified addresses.
- Force majeure with 30-day termination right.

## Part 3: Legal Risk Register (your business, not the deal)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **JV structure ambiguity** — anchor JV partnership has no signed shareholder agreement | High | High | Get one signed before selling to a third party. Ambiguity kills exits and lets partner claim IP. |
| **Selling code you don't fully own** — anchor JV may have IP claims on features built during pilot | High | Very High | Confirm in JV agreement that source code is 100% yours to license commercially. Get it in writing. |
| **HIPAA violation via a buyer's misconfig** — buyer deploys, leaks patient data, blames you | Medium | High | SOW §6.2 puts compliance responsibility on Client. Do not sign a BAA. Do not offer HIPAA "certified" language. |
| **India DPDPA violation** — patient data stored outside India or without consent | Medium | Medium | Default India deployments to Mumbai (ap-south-1). Include consent flow templates. |
| **Medical device classification** — regulators claim DCOS is a Class I/II device | Low | Very High | SOW §7.4 disclaims medical use. Do not market as "diagnostic". Do not add treatment planning. Avoid FDA/CDSCO submission triggers. |
| **Patent claim by a competitor** — someone patents your workflow | Low | Medium | Publish workflow diagrams publicly (blog posts) to establish prior art. File your own provisional patents on the Bi-temporal Merkle Chain + Scanner Ingestion Bridge (per AGENTS.md protocol). |
| **Buyer breaches license, resells your code** — someone in emerging markets resells DCOS | Medium | Low-Medium | License terms clear on prohibited use. Register copyright in India + US. Watermark code with license identifier (`// LICENSED-TO: buyer-id-hash`). |
| **Late payment on milestone 2** — buyer stalls after deployment | Medium | Medium | Deployment Complete triggers invoice. Suspend support if unpaid 30 days. Ship code as encrypted archive; decryption key on payment. |
| **Currency exchange loss on wire** — INR received differs from USD invoice | Low | Low | Invoice in USD, receive in USD. Or price in USD, accept INR at RBI rate on invoice date + 1% buffer. |
| **Anchor partner blocks a deal** — the anchor JV partner vetos a specific buyer | Medium | Medium | JV agreement must specify: developer partners retain right to commercialize product outside anchor's territory. Negotiate now. |

## Part 4: When to actually pay a lawyer (and how much)

| Situation | Get a lawyer? | Budget |
|---|---|---|
| Standard NDA under 6 pages | No | $0 |
| Aggressive NDA over 6 pages | Maybe (fixed-fee review) | $150 |
| Your standard MSA/SOW template (build once) | **Yes** | $400–800 |
| Their MSA/SOW under 20 pages | Fixed-fee review | $300–500 |
| Their MSA/SOW over 20 pages | Yes, full review | $1,000–2,000 |
| JV shareholder agreement with anchor partner | **Yes, absolutely** | $1,500–3,000 |
| Setting up your legal entity for receiving payment | Yes | $500–1,500 |
| Trademark filing (DCOS/DentalConnect) | Yes | $600 US + $150 India |
| Patent filing (Merkle Chain, Scanner Bridge) | Yes | $5,000+ per patent |
| Buyer disputes a payment | Yes | $500 letter → $5k+ arbitration |

At $10–15k deal size, target ≤5% of deal in legal fees per deal. $500–750 max. Use fixed-fee lawyers (Rocket Lawyer, Vakilsearch, LegalZoom for standard docs; small-firm attorneys for JV work).

## Part 5: Red-line playbook for common buyer asks

### "We need mutual indemnity."
→ Fine, mutual and capped at fees paid. Add: "excluding gross negligence and willful misconduct" carve-in for both.

### "We need source code escrow."
→ Fine at Enterprise tier ($20k+). Include escrow fee in price. Release trigger: your bankruptcy OR 60 days of failed support after written notice.

### "Warranty period should be 12 months, not 6."
→ Trade for it: 12 months, or 6 months + additional $1k. Do not give it away.

### "We need SOC 2 compliance."
→ You don't have SOC 2. Say so: "We deliver a SOC-2-ready architecture. If SOC 2 audit is required, we can help scope one at $30k+ with an auditor. Not included in this SOW." They'll drop it 80% of the time.

### "We need to talk to your other customers."
→ If you have references, "yes." If you don't, "you'd be first. Which is why the price is $8k not $15k."

### "We need to onboard your team to our vendor portal / security review / etc."
→ At $10–15k deal size, vendor onboarding overhead can eat the margin. Push back: "For Standard tier, we can complete a security questionnaire (up to 3 hours). Full vendor portal onboarding is Enterprise tier scope."

## Part 6: Compliance disclaimers you should include everywhere

Add to email footer, one-pager fine print, SOW §7.4, landing page footer:

> DentalConnect OS is a workflow management platform for dental laboratories and clinics. It is not a medical device, does not provide diagnostic or treatment recommendations, and is not a substitute for professional judgment. Compliance with HIPAA, GDPR, DPDPA, and other regulations depends on Client's deployment configuration. Client is responsible for obtaining patient consent for scan storage and preview sharing.
