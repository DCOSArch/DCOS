# Demo Storyboard — 90-sec Loom + 10-min live

The single most-leveraged sales asset. Playbook §5 Stage 1: "This is the single most important asset in this whole playbook."

## Part A: The 90-second Loom (record ONCE, use everywhere)

**Setup checklist before recording:**
- Chrome incognito, dcos.in in production or a clean staging env.
- Seed data: one lab (name it "Precision Dental Lab" — generic, non-attributable), one dentist ("Dr. Alex Morgan"), one real STL file loaded.
- Screen resolution 1920x1080. Close all other tabs, Slack, notifications.
- Loom face-cam ON, 240p corner circle. Studies show 30% higher watch-time with face.
- Voice: normal talking pace, no "um", no "so". Rewatch and re-record if it's not clean. Under 90 seconds, hard.

### Storyboard (with timestamps)

**0:00–0:05 — Hook**
> "This is how a dental case moves from a scanner to a finished crown in DentalConnect OS. I'll show you in 90 seconds."

Zero preamble. No "hi, I'm [name]." Their attention span is 8 seconds.

**0:05–0:20 — Case creation (dentist view)**
- Screen: DentistDashboard.
- Click FAB → dialog opens.
- Type patient name, select lab from dropdown ("Precision Dental Lab"), select "Anterior Crown", drag an STL file into upload zone.
- Voice: "The dentist uploads a scan, picks the lab, and submits. That's the entire intake — no PDF, no WhatsApp, no phone call."

**0:20–0:35 — Lab receives it (Kanban)**
- Screen: switch to LabDashboard.
- Point cursor at the new card in "Incoming".
- Drag it to "In Production".
- Toast appears: "Deducted 1 unit of Zirconia Block."
- Voice: "The lab sees the case appear on their Kanban. Drag it into production — inventory deducts automatically. No spreadsheet."

**0:35–0:55 — The 3D moment**
- Click into the case detail.
- Three.js viewer loads, STL rotates.
- Click "Drop Annotation Pin", click a point on the STL, type "Margin unclear here", Save.
- Rotate the model, the pin follows in 3D space.
- Voice: "Both sides can see the 3D design. Drop a pin anywhere — it's spatial. The dentist gets notified. Argument over."

**0:55–1:15 — Chat unlock + timeline**
- Point at the chat panel (previously locked, now unlocked because status changed to IN_PROGRESS).
- Type a message: "Can you increase the buccal by 0.3mm?"
- Point at the timeline showing status change + chat unlock.
- Voice: "Chat unlocks the moment the lab accepts the case. Every conversation is tied to a case — no more losing threads in WhatsApp."

**1:15–1:30 — Close**
> "This runs on Next.js and Supabase. Full source code, deploys on your infra, your brand. If you're a lab owner or a dentist tired of PDF forms and phone calls, reply to this Loom and I'll walk you through your version live."

Stop recording. Do not add outro. Do not add music.

**Loom description (the text under the video):**
> "90-sec demo of DentalConnect OS — case intake, Kanban production, 3D annotations, order chat. Full source-code license from $6k. Reply here or DM to see it live on your lab's workflow."

**Where to use the Loom:**
- Email outbound (embed as image linking to Loom).
- LinkedIn DM (paste URL, don't attach video — link previews better).
- Landing page hero (autoplay muted, sound-on toggle).
- Sales one-pager QR code.
- Reddit r/DentalTech, r/dentallab (if you post there — comment-first, not a link drop).

## Part B: The 10-minute live demo (during discovery call)

Structure is the same beats as the Loom, but expanded and interactive.

### Beat 1: Case creation (2 min)
- **Use their name** as the patient name (or their kid's, if you know it).
- **Use their lab name** if you set it up in advance.
- Pause after upload: "How does this compare to how [war story from discovery] happens today?"

### Beat 2: Kanban (2 min)
- Show inventory deduction toast.
- Then intentionally break it: try to drag before inventory is stocked. Show the warning. "It won't let you deduct inventory you don't have. Prevents overselling."
- **Pause:** "Anything on this screen you'd want structured differently? I ask because we can."

### Beat 3: The 3D moment (3 min) — this is where you close
- Load the STL. Let it rotate for 3 full seconds before saying anything. Let the visual land.
- "This is the actual scan file, running in the browser. No plugin, no download."
- Drop a pin. Type their exact war-story issue as the note. Save.
- Rotate, show the pin follows.
- Click Resolve. Pin fades.
- **Sit in silence.** Best sales moment in the demo. They'll fill it with a question.

### Beat 4: White-label (2 min)
- Open dev tools. Change `--primary` to a hex color they mention. Change the logo alt text. Show a screenshot with their logo pasted in (prepared before the call).
- "This is what your login page looks like on Monday morning. Your brand, your infra, your customer data. You own it."

### Beat 5: Deployment story (1 min)
- Open the SOW template on screen. Point to deliverables.
- "Full repo, deployment guide, staging environment, 20 hours of setup. Four weeks to live. Any questions on the deployment side?"

### What NOT to demo (even if they ask)
- Inventory admin UI (looks unfinished).
- Case detail full page (too much text, kills momentum).
- Login/signup flow (boring).
- Any admin/settings screens.
- The B2B2C patient preview if the STL loader hasn't been wired to signed URLs yet (see Buyer Playbook §Fix First).

## Common demo failures (learned patterns)

- **Slow STL load:** pre-load a small STL file (< 5MB decimated) for demos. A 30MB scan taking 20 sec to load kills momentum.
- **Talking through it:** every second you're narrating is a second they're not absorbing. Show → pause → question.
- **Feature vomit:** they don't want to see every button. They want to see the ONE thing that solves their war story. Cut everything else.
- **Apologizing:** "Sorry, this UI is rough" tanks the sale. If you don't like it, don't show it.

## Demo environment setup (do once, per prospect)
1. Duplicate the prod DB (or use staging).
2. Create a lab named after their lab.
3. Create a dentist named after their known partner clinic (from their site's "our partners" page).
4. Seed 3 cases in different statuses.
5. Load a real, clean STL (use one from a public dental sample).
6. Test the whole demo end-to-end 30 min before the call. **Every single time.** A broken demo on the first call is unrecoverable.
