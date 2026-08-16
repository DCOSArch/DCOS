# Landing Page Copy — dcos.in

Ship this over the current landing. Optimized for **one goal only: book a discovery call**. Not "sign up", not "download whitepaper".

**Layout:** long-scroll one-pager. Hero → problem → demo → pricing → FAQ → CTA. Everything routes to a Calendly link at the top-right nav AND at the bottom.

## Hero

**Above the fold, left column:**

```
The portal your dental lab needs.
Owned by you, not rented from Dandy.

Full source code. Deployed to your cloud. Your brand.
From $6,000 — one-time.

[Book a 30-min demo →]  [See the 90-sec walkthrough]
```

**Above the fold, right column:**

Embed the 90-sec Loom, autoplay muted, sound-on toggle. Or a looping GIF of the Kanban drag → 3D pin. Either way — motion. Static hero image tanks the hero.

## Trust bar (thin strip below hero)

```
Next.js 16  •  Supabase  •  Cloudflare R2  •  Three.js  •  HIPAA-ready architecture
```

Don't fake logos. Don't claim "trusted by 100+ labs". If you're pre-launch, say nothing.

## The problem

Two-column layout, plain language.

**Left column — how it works today:**
> **The intake:** dentists email PDFs, WhatsApp voice notes, or call.
> **The tracking:** whiteboards, spreadsheets, or a spreadsheet-as-app someone wrote in 2015.
> **The chat:** WhatsApp threads that vanish when your case manager quits.
> **The archive:** a NAS drive labeled "SCANS 2019 FINAL", corrupted since Q2.
>
> Every one of these is a case delayed or lost.

**Right column — how it works with DCOS:**
> **Intake:** dentists upload STL directly. Auto-parsed. No PDF.
> **Tracking:** drag-drop Kanban. Real-time. Both sides see it.
> **Chat:** per-case, threaded, gated until you accept the order.
> **Archive:** every case, every design file, every annotation — searchable forever.
>
> **All of it, on your infrastructure. Your customer data never touches ours.**

## Demo (product tour section)

Three panels, each one screenshot + one sentence.

**Panel 1 — Kanban:** "Your production pipeline as a real-time board. Inventory auto-deducts when a case enters production."
[Screenshot of Kanban with drag in progress, toast visible]

**Panel 2 — 3D + annotations:** "The scan, in the browser. Drop a pin on any tooth to flag margin, occlusion, or any issue. Spatial. Resolvable."
[Screenshot of 3D viewer with a red pin + "Margin unclear" annotation]

**Panel 3 — Patient preview:** "A private, HIPAA-safe 3D link for your dentist to share with the patient. No login. No PHI exposed. Approves the design before manufacturing starts."
[Screenshot of patient preview page]

## What you own

Bullet list, punchy:

- **The source code.** Full repository. Perpetual license.
- **Your data.** Deployed to your Supabase + your Cloudflare R2. We never touch it.
- **Your brand.** Logo, colors, custom domain, email sender — all yours.
- **The right to fire us.** Own the code. Run it yourself. Fork it. Sell it if we vanish (except back to us).

## Pricing (three cards, honest)

Do this as three cards.

### Starter — $6,000
For the first customer in your region, or small labs testing the workflow.
- Hosted by us (we manage the cloud accounts).
- 1 admin, up to 20 dentist logins.
- 3 months email support.
- Ready in 2 weeks.

**[Book a demo →]**

### Standard — $12,000
For independent labs, 5–30 employees. **Most common deal.**
- Full source code, perpetual license.
- Deployed to your cloud (Supabase + Cloudflare R2 + Vercel).
- 6 months email support.
- 20 hours setup consulting included.
- Ready in 4 weeks.

**[Book a demo →]** ← default highlighted card

### Enterprise — from $22,000
For PE-backed rollups, multi-lab operations, dental-tech startups.
- Everything in Standard + custom branding, custom domain automation.
- Regional exclusivity option (+50%).
- 12 months support + change-order retainer available.
- Roadmap collaboration.

**[Contact us →]**

Footnote below the cards:
> *All prices in USD, one-time unless noted. Payment: 50% on signature, 50% on deployment complete. Optional maintenance retainer at $1,000/month post-support.*

## Testimonial (leave blank until you have one)

Big empty white space. When you close India Tier A #1, this is where their quote goes. In their words. With their photo. Their lab name. Their location.

Until then, don't fake it. Don't put a "Sarah at Acme Lab said…". Buyers verify.

## FAQ

Answer the real questions.

**Is patient data safe?**
Yes. Every table has row-level security. Patient PHI lives in a separate table only the prescribing dentist can read. Files are served via presigned URLs with 1-hour expiry. Your data lives in your cloud accounts — we never touch it after deployment. Full compliance details in the SOW.

**How is this different from LabStar or Dandy?**
LabStar and Dandy are rentals. You pay monthly, forever, and never own it. DCOS is a one-time license — you own the code, your data, and your brand. Over 3 years, DCOS ($12k one-time) is cheaper than LabStar ($9k) and dramatically cheaper than Dandy ($36k+).

**Can I customize it?**
Yes. You own the source. Add features, change the UI, integrate with your accounting — whatever you need. We offer paid change orders ($100/hr) if you want us to do the work.

**Do you sign a HIPAA BAA?**
No — because we don't access your production PHI. Sign BAAs with Supabase and Cloudflare on your account. A vendor who signs a BAA without touching your data is either misrepresenting their access or actually accessing your data.

**Do you have paying customers?**
Not yet — we're pre-launch, which is why Starter is $6k instead of $15k. First reference customer gets 12 months free support and their logo prominently featured (with consent).

**What if you disappear?**
Everything you need to run DCOS is delivered on day one: source code, deployment guide, docs. You could fork it and run it forever without us. That's the point of a license, not a subscription.

**What's your roadmap?**
UPI payment integration (India Q1 2027). Scanner folder watcher UI. Patient PHI hashing. Custom Rx catalog. Roadmap ships to buyers monthly. Change requests get you priority.

## Final CTA (footer of long scroll)

Big, one-line, one button.

```
Ready to own your lab's portal?

[Book a 30-min demo →]

Or reply to any email at hi@dcos.in
```

## Footer disclaimers (small print, gray)

```
DentalConnect OS is a workflow platform for dental laboratories and clinics. It is not a medical device, does not provide diagnostic recommendations, and is not a substitute for professional judgment.

Compliance with HIPAA, GDPR, DPDPA depends on Client deployment configuration.

© 2026 [YOUR ENTITY]  •  dcos.in  •  hi@dcos.in
```

## What NOT to put on the landing

- ❌ "Trusted by 100+ labs" (fake).
- ❌ "AI-powered" anything (not what you're selling).
- ❌ Team photo section with LinkedIn links (implies you're bigger than you are + adds risk of "wait, only one dev?").
- ❌ Feature comparison table with 40 rows (buyers don't read).
- ❌ Signup form ("get a free account"). This is a sales page, not a product page.
- ❌ Pricing calculator (implies more complexity than a $12k one-time deal).
- ❌ Chatbot (support burden without payoff).
- ❌ Blog CTA (no traffic to blog yet).

## SEO essentials

- **Title tag:** "DentalConnect OS — Own your lab's portal. From $6k, one-time."
- **Meta description:** "Full source-code license for a modern dental lab portal. 3D scan upload, Kanban production, real-time chat. Deployed to your cloud, your brand. From $6,000."
- **Structured data:** SoftwareApplication schema with price + offerType=OneTime.
- **Open Graph image:** the same hero screenshot, 1200×630.
- **Twitter card:** summary_large_image.

## Load performance

- Hero image / Loom embed lazy-loaded.
- All screenshots WebP + 2x for retina.
- Total page < 500KB before Loom.
- Lighthouse mobile score > 85. Test on real 4G before shipping.
