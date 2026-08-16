# Objection Handling

Every objection gets: (1) acknowledge, (2) reframe, (3) prove, (4) advance. Do not argue. Do not concede price without concession on scope.

## Price objections

### "$12k is too expensive."
- **Acknowledge:** "Fair. That's a real number."
- **Reframe:** "For context — LabStar at $250/mo is $9k over 3 years and you never own it. Dandy's minimum spend is $12–30k a year. A dev shop building this from scratch is $50–75k plus 6 months."
- **Prove:** open a browser to competitor pricing. Have URLs ready.
- **Advance:** "But if that's outside your window this quarter, the Starter tier is $6k. Same code, we host it, you get one branded environment. Would that fit?"

### "Can we pay monthly?"
- **Reframe:** "This is a source code license, not a subscription — same reason you don't pay Microsoft for Office monthly if you buy it outright. What I can do: 50% on signature, 50% on deployment complete or 60 days, whichever's first."
- If they insist on 3+ installments: red flag. Not a real buyer at this price point.

### "Can you match [competitor] at $X/mo?"
- **Reframe:** "They're renting; we're selling. Different product. If a monthly-only fit is what you need, LabStar is the right answer. If ownership matters, we're the only game at this price."
- Never race a subscription vendor on monthly price. You lose economics AND positioning.

### "I need it for $5k."
- If they're India Tier A and unnamed reference: "I can get to $6k Starter tier for the first customer in your region because I need the reference." (Playbook: first reference is worth 3x the price.)
- If they're Western: "At $5k I'd be selling you an unfinished product. What I *won't* do is quote you cheap and ship broken. Let me show you what $12k gets you that $5k can't." Then walk if they insist.

## Trust / traction objections

### "How many customers do you have?"
- **Truth-tell:** "Zero paying, pre-launch pricing. That's why this deal is $12k not $30k. In six months when I have three references, this same package is $18k+."
- Never invent traction. Small industry. Verified in 30 seconds.

### "Who's your reference?"
- If you have one: "I can get them on a 15-min call this week."
- If you don't: "You'd be the first. Which is exactly why I'm offering Starter pricing and 12 months of free support instead of 6."
- Do NOT lie. Do NOT name-drop the anchor JV as a "customer" — that's a partner, not a paying reference.

### "Why should I trust a solo founder?"
- **Reframe:** "You shouldn't — trust the code. It's yours after signature. If I disappear tomorrow, your dev team keeps running it. That's the point of the license structure vs. a SaaS you rent."
- Show the license terms. Have SOW ready.

## Security / compliance objections

### "Is patient data safe?"
- Assumes you fixed the four things in Buyer Playbook §6.
- Give [08_Compliance_One_Pager.md](08_Compliance_One_Pager.md) verbally: "Row-level security on every table, patient PHI isolated in a separate table only the prescribing dentist can read, storage buckets are private and served through pre-signed URLs. If you deploy on your own Supabase/AWS, no third party — including me — sees your data."
- Have the schema diagram ready to share.
- If they push on HIPAA specifically: "HIPAA compliance is a deployment property, not a code property. I deliver a HIPAA-ready architecture. You sign the BAA with Supabase and AWS on your account. I can walk you through the checklist."

### "What about GDPR / DPDPA / ABDM?"
- GDPR: "Data controller = you, processor = your infra. I'm neither once you deploy."
- India DPDPA: "Deploy on Mumbai region. I'll ship you the consent flow templates."
- ABDM: "Not integrated in v1. Roadmap Q1 2027. Won't block a clinic deal today."

### "What if you get hacked?"
- **Reframe:** "You'd be exposed if I hosted your data. You deploy on your own cloud — I never touch your database in production. Worst case is I get hacked and someone steals the same source code you already own."

## Scope objections

### "Can it do X?" (feature they want that doesn't exist)
- **Framework:** Is it 1-hour, 1-day, 1-week, or 1-month of work?
  - 1-hour: "Included, done by kickoff."
  - 1-day: "Included in the 20 hours of setup consulting."
  - 1-week: "That's a change order — $750 flat, adds a week to timeline."
  - 1-month: "That's a v2 conversation — let's talk about it after go-live. For now, is [existing capability] a workable stopgap?"
- Never say "sure, we can build that" without scoping. That's how projects die.

### "We need integration with [their existing system]."
- Ask: is the system's API documented? If yes → "one-time integration, $2k add-on." If no → "we'd write a CSV importer/exporter — $500 add-on, done in a week."
- Do NOT commit to a proprietary API integration you haven't scoped.

### "Can we white-label it fully?"
- "Yes — logo, colors, favicon, email templates, custom domain. The 'DentalConnect' branding disappears. That's included in Standard." Show them how (dev tools tweak on the call).

## Authority / timing objections

### "I need to talk to my partner."
- "Understood. Two things: what specific question is your partner going to ask that I should answer now? And when would you like me to follow up — Wednesday?"
- Never leave without (a) the partner's question and (b) a follow-up time.

### "Not now — maybe Q4."
- "Fair. What changes between now and Q4?" Listen. Then: "If [trigger] happens sooner, do you want me to hold this pricing?"
- If they say yes: sign a **letter of intent** with the trigger and price locked. Not a contract, but a commitment.

### "Send me info and I'll get back to you."
- Send the [one-pager](05_One_Pager_Leave_Behind.md), NOT a deck.
- Book the follow-up on the call: "I'll send it in the next hour. Can we do 15 minutes next Wednesday to answer questions?" 90% of "send me info" is polite decline. Force the follow-up while you have them.

## Post-sale objections (after signature, before deployment)

### "Can we delay kickoff?"
- Once: fine. Twice: they're getting cold. "Happy to push a week. What's changed?" Listen for a real blocker vs. buyer's remorse.

### "Can we add [scope creep item]?"
- Change order form. Priced. Signed. Deploy first, then extras.

## What to never do
- Never drop price without dropping scope. Signals the price was fake.
- Never argue. If they're wrong, ask a question that leads them.
- Never trash a competitor. Respect them and reposition. "LabStar is a great product for [X]. We're different because [Y]."
- Never end a call without a specific next step + date.
