# Discovery + Demo Call Script (30 minutes)

Per Playbook §5 Stage 3: the first meeting is not a demo — it's discovery-then-demo-then-price, on one call, ideally ending with "if I get you this deployed for $12k, can we start next week?"

## Pre-call (5 min before)
- Have their site open in one tab.
- Have Loom demo URL copied.
- Have their **specific hook** written on a Post-it (e.g., "still uses PDF Rx form", "site says dashboard but URL 404s").
- Assume you have 25 usable minutes, not 30. They will be late by 5.

## 0:00–0:02 — Frame (60 seconds, then shut up)
> "Thanks for the time. I know I've got you for 30 min. Quickest thing: I'll spend 5 minutes learning how you actually intake cases today, then show you the exact fix in about 10, then talk about what it would take to get it into your lab. Fair?"

**Do not** open with "so tell me about your lab" — they've told 100 people. **Do** name the specific hook: "I noticed your Rx form is still a PDF download — is that how the dentists actually send you cases, or is that just the marketing site?" Instant credibility.

## 0:02–0:10 — Discovery (six questions, in this order)

Score each answer green / yellow / red in your notes.

1. **How does a case start today?**
   *(Looking for: PDF, WhatsApp, email attachment, phone call. Not looking for: "we have a portal".)*

2. **What breaks most often? Missing info? Wrong file? Wrong shade?**
   *(Looking for a specific war story. If they can't name one, need is soft.)*

3. **How does the dentist find out the case is delayed?**
   *(Answer is almost always "they call us". Note this — it's your demo hook.)*

4. **What software are you already paying for?**
   *(LabStar? Magic Touch? DDX? Custom internal? "Excel and WhatsApp" is the ideal answer.)*

5. **Who else touches the decision — a partner, an office manager, an owner if you're not the owner?**
   *(This is Authority.)*

6. **What would have to be true for you to say 'we're moving to a portal next quarter'?**
   *(This is Timeline + Budget disguised as one question. They will name a trigger — a new location, a Dandy contract expiring, a hire, a scan volume threshold.)*

If they've given you three war stories and named a trigger by 0:08 — go to demo. If they've been vague — one more question: "if you had a magic wand for one thing about intake, what would it be?" Then demo.

## 0:10–0:20 — Demo (10 minutes, live)

Follow [04_Demo_Storyboard.md](04_Demo_Storyboard.md). Three beats:
1. **Dentist creates a case** (30 sec) — screenshare, use their name as the patient name.
2. **Lab Kanban** (2 min) — drag a card, show automatic inventory deduction, chat unlock.
3. **The 3D moment** (2 min) — open the STL, drop a spatial pin, resolve it. This is the "oh" moment. Sit in silence after.
4. **Their brand** (1 min) — open dev tools, change the logo/color to their brand. "This is what your portal looks like on Monday morning."
5. **Their specific fix** (3 min) — go back to their war story from discovery and show how DCOS handles it.

**Do not** show settings pages, admin UI, inventory management for the lab, or anything backend. **Do not** apologize for what's missing. **Do not** open a browser tab that shows another prospect's data.

## 0:20–0:25 — Price + close attempt

Read the room. If they leaned in during the 3D moment, go direct.

> "Here's how it works. Standard deal is $12k one-time — full source code, we deploy to your infra, six months of support. I could be done in about 4 weeks. If we shake hands today, we start Monday. What do you need to see to say yes?"

**Silence.** Do not fill it. Whoever speaks first loses.

Possible responses and what they mean:

| They say | Meaning | Do |
|---|---|---|
| "That's more than I thought" | They're negotiating, not walking. | Don't drop price — drop scope. Offer Starter ($6k, you host). |
| "I need to think about it" | They're deferring. | "Totally fair — what's the specific unknown I can clear up right now?" |
| "How does support work?" | Buying signal. | Answer clearly, then ask "any other blockers?" |
| "Send me info" | They're ending the call. | Send [05_One_Pager_Leave_Behind.md](05_One_Pager_Leave_Behind.md), NOT a deck. Set a specific follow-up date. |
| "Can I talk to a customer?" | Serious buyer. | "Yes. I have one lab live in India — I can loop you in on a call this week." (If not: "I'll be honest, you'd be #1. Which is why the price is $8k not $15k.") |
| "Yes." | Real. | Send proposal same day. Don't celebrate — schedule kickoff. |

## 0:25–0:30 — Next step (always specific)

Never end with "I'll follow up". Always with a date + a deliverable.

- Good: "I'll send the one-pager and the proposal Friday. Can we get 15 minutes Monday 3pm your time to walk through it?"
- Bad: "Sounds great, I'll be in touch."

## After the call (do within 60 min while it's fresh)
1. Update lead status in your tracking (see [09_30day_Execution_Plan.md](09_30day_Execution_Plan.md)).
2. Send the one-pager PDF + Loom link within 2 hours. Same-day follow-up = 3x reply rate.
3. Add three notes to your CRM/spreadsheet: the war story, the trigger, the objection.
4. If they asked for a reference — introduce them BEFORE 24 hours pass. Momentum decays fast.

## What not to say (ever)
- "We're a startup." (You're a product.)
- "We just raised $X." (Irrelevant to a lab owner.)
- "SaaS." (One-time deal. Say "license".)
- "MRR", "churn", "LTV" — they don't care and it makes you sound naive.
- "We can build that in a sprint." (Never commit on a live call.)
- "Trust me." (Show, don't ask.)
