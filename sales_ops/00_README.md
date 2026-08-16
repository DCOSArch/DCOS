# DCOS Sales Ops — Execution Packet

Built on top of `docs/data/DCOS_Buyer_Playbook_v3.xlsx` (16 Jul 2026). The playbook is strategy; this folder is the daily-use kit.

## Target
- **Buyer:** independent dental lab owner (5–30 employees) or CEREC-equipped clinic owner in West / UAE / India.
- **Deal size:** $10–15k perpetual license (Standard tier). $5–8k Starter for the first India reference. $20–25k Enterprise for a PE-backed rollup ops lead.
- **Timeline:** first paid India reference in 3–5 weeks; first Western close in 8–12 weeks.

## The gate you cannot skip
Before your first Western call: **fix the four issues in Buyer Playbook Sheet 6 (Fix First)**. Public storage bucket, `getSession` vs `getUser`, client-side inventory writes, split-brain `users/profiles` schema. Any of these die on the first "is patient data safe?" question. Est. 1.5–2 days of work. See [08_Compliance_One_Pager.md](08_Compliance_One_Pager.md) — that doc pre-answers the question, but only if the code is actually fixed.

## What's in this folder

| # | File | Use when |
|---|---|---|
| 01 | [ICP_and_Personas.md](01_ICP_and_Personas.md) | Deciding whether a lead is worth working. |
| 02 | [Discovery_Script.md](02_Discovery_Script.md) | Running the first 30-min call. |
| 03 | [Objection_Handling.md](03_Objection_Handling.md) | Mid-call when they push back. |
| 04 | [Demo_Storyboard.md](04_Demo_Storyboard.md) | Recording the 90-sec Loom + running live demo. |
| 05 | [One_Pager_Leave_Behind.md](05_One_Pager_Leave_Behind.md) | After the "send me info" ask. |
| 06 | [Proposal_SOW_Template.md](06_Proposal_SOW_Template.md) | Verbal yes → contract. |
| 07 | [Legal_Framework.md](07_Legal_Framework.md) | They send an NDA/MSA, or you're negotiating JV terms. |
| 08 | [Compliance_One_Pager.md](08_Compliance_One_Pager.md) | The "is patient data safe?" question. |
| 09 | [30day_Execution_Plan.md](09_30day_Execution_Plan.md) | Monday-morning "what do I do today". |
| 10 | [Landing_Page_Copy.md](10_Landing_Page_Copy.md) | Updating dcos.in for inbound. |
| 11 | [LinkedIn_Content_Plan.md](11_LinkedIn_Content_Plan.md) | Building personal brand while outbound runs. |

## Not in this folder (gitignored)
- `sales_ops/leads/` — personalized outreach drafts naming real labs. Kept off git because business intel; write drafts there and paste them into Gmail/LinkedIn manually.

## Priority order for a founder with 40 hours a week
1. **Fix First** (2 days) — non-negotiable gate.
2. **Loom demo** (1 day) — see [04_Demo_Storyboard.md](04_Demo_Storyboard.md). Single most leveraged asset.
3. **India Tier A outbound** (weeks 3–5) — 6 labs. Land 1 reference at $5–8k. See [09_30day_Execution_Plan.md](09_30day_Execution_Plan.md).
4. **Western Tier A outbound** (weeks 6–8) — Freedom Crown & Bridge (UK), Crown Creations (Oregon), Smile Design Dubai. High personalization, low volume.
5. **PE consolidator LinkedIn** (weeks 8+) — Catalis, Denbright, Standard Dental. Warm only.

## What this packet is NOT
- Not legal advice. [07_Legal_Framework.md](07_Legal_Framework.md) is a triage guide; use it to decide when to escalate to a lawyer, not to replace one.
- Not a substitute for the working demo. All the copy in the world doesn't close a lab owner. A live case going through the pipeline does.
- Not a lead list. See the xlsx files in `docs/data/` for the vetted 11 India leads + 8 Western targets.
