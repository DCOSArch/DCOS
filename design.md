# DentalConnect — Dentist-first product design brief for Google Stitch

> **Purpose:** Use this document as the visual and interaction source of truth when generating the DentalConnect marketing site, authentication experience, and dentist-facing application in Google Stitch. It describes a high-fidelity responsive web product, not a generic dashboard or a code implementation.
>
> **Primary audience:** practising dentists who send restorative, implant, veneer, full-arch, and surgical-guide cases to dental laboratories. The dentist is the principal user and decision-maker. Laboratory workflows must be supported, but must never make the dentist experience feel like a lab back office.
>
> **Product promise:** *A calm, clinically precise workspace that helps a dentist send a complete digital case in minutes and always know what happens next.*

---

## 1. What DentalConnect is

DentalConnect is a shared case-workflow platform for dentists and dental laboratories. It replaces disconnected scan uploads, telephone calls, WhatsApp threads, spreadsheets, and uncertain delivery timelines with one structured, live case record.

The current product supports:

- Dentist and laboratory accounts with role-aware views.
- A dentist case dashboard, filters, case statuses, notifications, and real-time updates.
- A guided prescription flow for CNB, FPD, veneers, implants, full-arch work, and surgical guides.
- STL/PLY upload, conditional DICOM/CBCT upload, scan validation, 3D viewing, and design-file archive.
- Tooth charting in FDI notation, restoration indications, bridges/connector information, material selection, VITA shade selection, custom three-zone shade specification, characterization notes, and a shade-reference photo.
- Implant-specific details: implant brand, scan body type, and component logistics.
- Lab selection, requested due date, draft saving, submission, due-date proposals, approval/rejection, and case timeline.
- Case-specific chat once a lab has accepted a case.
- A laboratory directory, virtual/pre-purchased material inventory, and a controlled patient design-preview link.

This is **not** an all-purpose practice-management system or an EHR. Do not dilute the product with appointments, billing, claims, clinical notes, or a patient CRM. Its job is the clinical handoff and production journey between dentist and lab.

---

## 2. Design objective

Reimagine the product around the dentist’s working day. The user should feel that every screen answers one of three questions quickly:

1. **What needs my attention now?**
2. **How do I send a complete, low-risk case quickly?**
3. **Where is this restoration, and what happens next?**

The new light mode must be refined, warm, and clinical—not shiny, blue-heavy, childish, or “generic startup SaaS.” Preserve the confidence and distinctiveness of the existing Monokai-inspired dark mode, but mature it into a deliberate workbench theme rather than a rainbow of accent colors.

Success looks like this:

- A dentist can begin a new case from anywhere in one click.
- The dashboard foregrounds actions and deadlines, not decorative analytics.
- A prescription feels like a confident clinical workflow with progressive disclosure, not a long intimidating form.
- Case status, risk, incomplete information, and next action are obvious at a glance.
- The product feels premium and calm enough for clinical work, while remaining quick on a busy clinic day.

---

## 3. Product principles

Use these principles to resolve every visual or interaction decision.

### 3.1 Calm clinical clarity

Whitespace, hierarchy, and predictable placement do more work than decoration. Use colour to convey state or guide an action, not to make every block compete for attention.

### 3.2 The next action is the hero

Do not make a dentist hunt for an overdue date, a lab proposal, a blocked case, or the “new case” control. Surface the single most relevant action first, with a clear reason and outcome.

### 3.3 Progressive disclosure for clinical depth

Most cases should be easy. Advanced details—three-zone shade, connector configuration, implant components, DICOM, and design parameters—appear only when treatment type or user choice makes them relevant. Keep the simple path genuinely simple.

### 3.4 Trust is visible

Show file readiness, document completeness, lab acceptance, scan validation, dates, and audit-friendly timestamps in plain language. Avoid vague success states such as “Processed.” Prefer “STL checked — dimensions look plausible” or “Lab accepted at 10:42.”

### 3.5 Dentistry, not “health-tech wallpaper”

Use subtle clinical diagrams, an anatomical tooth/arch motif, and meaningful model previews where useful. Do not use stock photos of smiling patients, blue medical crosses, floating holograms, or decorative teeth everywhere.

### 3.6 Human language over operational jargon

Say “New case,” “Requested delivery,” “Lab accepted,” “Needs your approval,” and “Message the lab.” Avoid “ticket,” “pipeline,” “workflow engine,” “artifact,” “object,” or “fulfilment.”

### 3.7 Privacy by default

Treat patient identity, scans, shade photos, and DICOM files as sensitive. Include unobtrusive, specific privacy cues near sharing and upload actions. Do not make unsupported legal or compliance claims such as “HIPAA compliant.” Use “private,” “controlled access,” “expires,” and “only case participants can view this” where true.

---

## 4. Users, jobs, and emotional context

### Primary persona — Dr. Aanya Mehta, practice-owning dentist

She is between patients, often on a laptop at the practice or on a tablet after hours. She sends a few complex cases per week and cares about clinical quality, dependable delivery, and being able to explain decisions to patients. She is comfortable with digital scans but does not want to become a CAD technician.

**Her jobs:**

- Send a lab a complete prescription without forgetting a crucial detail.
- Attach scans and explain the intended restoration clearly.
- Know whether a case is accepted, in production, delayed, dispatched, or ready to fit.
- Respond quickly to a lab question or revised delivery proposal.
- Reuse trusted labs and understand material allocations or locked pricing.
- Share a controlled design preview with a patient when appropriate.

**Her anxieties:**

- A scan or implant detail may be missing, producing delay or a remake.
- A key case may be overlooked among routine cases.
- A requested date may silently slip.
- A long form may waste chairside time.
- Her patient’s data may be shared too broadly.

### Secondary persona — associate dentist / clinical coordinator

This user may prepare drafts and upload files, while a senior dentist reviews and submits. The experience needs visibly saved drafts, clear ownership, and no accidental submission.

### Secondary persona — laboratory administrator or technician

They receive structured instructions, change production status, ask focused questions, upload a CAD/CAM design, propose a delivery date, and manage materials. Their interface can be denser and operational, but must use the same information model and visual language.

### Key user moments

| Moment | User need | Product response |
| --- | --- | --- |
| Between appointments | Send a crown case fast | Persistent `New case` button, draft-safe guided flow, scan upload first if convenient |
| Morning review | Know what is at risk | “Needs attention” queue above all aggregate metrics |
| Lab changes a date | Decide without searching | A focused approval card with original and proposed dates |
| Lab asks a question | Respond in context | Case-specific chat beside the exact prescription and files |
| Patient asks to see the design | Share safely | Explicit preview-sharing surface with expiry and no patient identity shown in the preview |
| Clinical handover | Avoid omissions | Completion meter and a concise final prescription summary |

---

## 5. Information architecture

### Public site

- Home
- How it works
- For dentists
- For laboratories
- Trust & privacy
- Sign in
- Create account

### Dentist application

Use a left sidebar on desktop and a compact bottom navigation on mobile. The global `New case` action is always reachable.

1. **Home** — personal daily command centre.
2. **Cases** — all cases, saved views, search, filters, and drafts.
3. **Labs** — trusted lab directory, profiles, services, turnaround, and connection context.
4. **Materials** — optional virtual/pre-purchased material allocations, only if the practice uses them.
5. **Notifications** — a focused chronological inbox, not merely a dropdown.
6. **Profile & practice** — settings, account, theme, and team when available.

### Case-level navigation

Inside a case, use a strong top-level case header and four tabs/sections:

1. **Overview** — status, next action, timeline, patient/case summary.
2. **Prescription** — teeth, restoration recipe, materials, shades, notes, and lab details.
3. **Files & design** — scans, 3D viewer, DICOM, shade image, and final CAD file.
4. **Messages** — contextual conversation and system updates.

On a wide desktop, the status rail and next action should remain visible while working within any tab. Do not force the user to return to Overview to see a deadline or lab state.

### What should not be top-level navigation

- Analytics and charts: keep in contextual dashboard summaries, not a main destination.
- “Inventory” for a dentist: call it **Materials** and only show it if meaningful allocations exist.
- Patient preview: it is a case action, not a main navigation item.
- Lab staff administration: only visible in the lab role.

---

## 6. Brand and visual direction

### 6.1 Overall feel

The visual language is **“quiet clinical studio.”** It should feel like a well-designed dental practice: natural light, warm white surfaces, graphite text, precise tools, orderly labels, and confidence without sterility.

Light mode is the default public-facing and dentist-facing theme. Dark mode is a focused after-hours “Monokai Workbench” mode for people who already like it.

Use modest depth, restrained borders, and large breathable spacing. The interface should be polished enough to feel premium but never ornamental.

### 6.2 Light theme — Clinical Canvas

Avoid the current pure-white + generic cobalt + pale-blue gradient look. Use a warm off-white foundation with one serious blue-green action colour.

| Token / role | Value | Usage |
| --- | ---: | --- |
| Canvas | `#F7F7F2` | App background; warm, nearly white |
| Surface | `#FFFFFF` | Main cards, forms, sidebars |
| Surface subtle | `#F1F3EE` | Grouped fields, inactive panels, table headers |
| Surface selected | `#EAF2F0` | Selected neutral/action state |
| Ink | `#1D2A33` | Main text |
| Ink muted | `#66757D` | Secondary labels, metadata |
| Hairline | `#DCE2DF` | Dividers, input borders |
| Primary — deep teal | `#176B68` | Main action, links, focus, active nav |
| Primary hover | `#0F5755` | Hover / pressed |
| Primary soft | `#DCEDEA` | Selected state, light backgrounds |
| Clinical blue | `#366C9B` | Informational file/scan state only |
| Success | `#26734D` | Completed, accepted, safe confirmation |
| Success soft | `#E4F2E9` | Success background |
| Attention | `#A76715` | Needs review, deadline approaching |
| Attention soft | `#FFF3DC` | Attention background |
| Critical | `#B24743` | Rejected, overdue, destructive action |
| Critical soft | `#FBE9E7` | Critical background |
| Accent coral | `#B85B52` | Small brand illustration accent; never the default CTA |

Do not use blue, green, amber, red, pink, purple, and gradients on one dashboard simultaneously. Treat the palette as a quiet system: teal is action, the status colours are semantic, and coral is occasional identity detail.

### 6.3 Dark theme — Monokai Workbench

Keep the familiar Monokai soul, but use the colours with discipline. This is a dark, focused work surface—not a code editor imitation.

| Token / role | Value | Usage |
| --- | ---: | --- |
| Canvas | `#272822` | Page background |
| Raised surface | `#30312B` | Main cards and sidebar |
| Surface subtle | `#3A3B33` | Fields and table headers |
| Ink | `#F8F8F2` | Main text |
| Ink muted | `#B5B5A5` | Secondary text; never use the original low-contrast comment grey for important copy |
| Hairline | `#4A4B40` | Borders |
| Primary | `#66D9EF` | Main action, focus, active state |
| Primary hover | `#8BE4F4` | Hover |
| Brand accent | `#F92672` | Small identity marks and urgent-but-not-dangerous highlights only |
| Success | `#A6E22E` | Success / completed |
| Attention | `#FD971F` | Attention / pending review |
| Critical | `#FF6B6B` | Destructive / overdue |

The pale blue (`#66D9EF`) is the primary action in dark mode. Use Monokai pink only sparingly; it should not become the background of every button or chip. Preserve 4.5:1 contrast minimum for body text.

### 6.4 Typography

Use a friendly, highly legible sans serif with clinical restraint:

- **Primary:** Manrope. If unavailable, use Inter or Geist Sans.
- **Technical metadata / case IDs:** Geist Mono or IBM Plex Mono, only for short case IDs, files, timestamps, and numerical data.
- **Do not use a display serif, playful rounded font, or more than two font families.**

Type scale:

| Role | Desktop | Mobile | Weight / behaviour |
| --- | ---: | ---: | --- |
| Marketing hero | 56–64 px | 38–44 px | 650–700, tight tracking |
| Screen title | 32–36 px | 26–30 px | 650–700 |
| Section title | 22–24 px | 20–22 px | 650 |
| Card title | 16–18 px | 16–18 px | 650 |
| Body | 14–16 px | 14–16 px | 400–500, line-height 1.5 |
| Label | 12–13 px | 12–13 px | 600, sentence case |
| Meta | 12 px | 12 px | 450, muted |

Avoid all-caps except compact table/group labels. Avoid tiny text below 12 px for meaningful content.

### 6.5 Shape, elevation, spacing, and icons

- **Grid:** 12 columns at 1440 px, 24 px gutters, max content width 1440 px. Use 8 px base spacing.
- **Radii:** 10 px for fields and compact cards, 14 px for major cards, 18–20 px for feature/marketing surfaces. Avoid pill-shaped containers except chips, avatars, and simple toggles.
- **Elevation:** Prefer a 1 px warm border. Reserve a soft, diffuse shadow for floating menus, dialogs, and the primary marketing device mockup. No dark drop shadows on every card.
- **Icons:** precise, 1.75–2 px stroke, rounded ends, consistent size. Use recognisable icons with text labels for unfamiliar actions.
- **Motion:** 160–220 ms for hover/focus, 220–300 ms for panel changes. Respect `prefers-reduced-motion`. Avoid bouncing icons, perpetual spinners, and flashy chart motion.

### 6.6 Imagery and illustration

- Use a restrained 3D tooth/arch mesh, subtle scan contours, or a clinical prescription diagram—not smiling stock imagery.
- On landing pages, show real interface UI in a device-like frame rather than decorative photographs.
- Use a single, highly polished illustrative system: thin line anatomy combined with soft tonal mesh/gradient shapes in the brand palette.
- Never display identifiable patient imagery in marketing mocks.

---

## 7. Core components and interaction standards

### App shell

**Desktop:**

- 248 px left sidebar, fixed but not visually heavy.
- Logo at top; workspace/practice switcher only when it exists.
- Main navigation in the middle.
- A clear full-width `+ New case` button near the top of the sidebar.
- Profile, help, and light/dark theme control at the bottom.
- Top bar contains page context, global search, notification indicator, and optional avatar—not duplicated navigation.

**Mobile:**

- Compact top bar: product mark, page title/back, notification, profile.
- Bottom navigation: Home, Cases, a prominent centre `New case`, Labs, More.
- Never hide the primary create action behind a menu.

### Buttons

| Type | Visual | Examples |
| --- | --- | --- |
| Primary | Solid deep teal / cyan in dark theme, white label | `New case`, `Submit case`, `Approve date` |
| Secondary | White/surface with hairline border | `Save draft`, `View details`, `Download file` |
| Tertiary | Text with leading or trailing icon | `See all cases`, `Change lab` |
| Destructive | Text/border until final confirmation | `Reject proposed date`, `Delete draft` |

One dominant primary action per panel. A dialog should not contain two equally loud solid buttons. Buttons must use outcome-based labels: `Submit to Apex Dental Lab`, not `Continue`; `Review case`, not `View` when more useful.

### Status chips

Status must never depend on colour alone. Use a tiny dot or icon, concise label, and accessible colour pair.

| System status | Dentist-facing label | Visual treatment |
| --- | --- | --- |
| `DRAFT` | Draft | neutral grey, file icon |
| `PENDING` | Awaiting lab acceptance | amber, clock icon |
| `IN_PROGRESS` | In production | clinical blue/teal, tool/gear icon |
| `QUALITY_CHECK` | Quality check | violet is not needed; use teal-blue outline + check icon |
| `DISPATCHED` | Dispatched | blue, truck icon |
| `DELIVERED` | Delivered to clinic | green, package/check icon |
| `COMPLETED` | Fitted / completed | deep green, check-circle |
| `REJECTED` | Needs revision | red, alert icon |

Urgency is a separate property. Avoid a red dot next to every urgent case without a label. Use `Due today`, `Due tomorrow`, `Overdue`, and `Urgent` plainly where relevant.

### Forms

- Group labels must explain the clinical category: `Patient & case`, `Scan files`, `Restoration design`, `Delivery & notes`.
- Mark required fields with text in the intro (“Required fields are marked *”) and an asterisk in the label—not red asterisks alone.
- Validate immediately after a field is complete, but do not shout errors while the user types.
- Error message format: what happened + how to fix it. Example: “Add the scan body model so the lab can match the implant components.”
- Use short help text under fields only when it removes uncertainty. Avoid instructional paragraphs inside every control.
- Conditionally show implant and surgical-guide fields as a well-labelled expandable section.

### Data tables and case cards

- Default to a useful desktop table and a compact, tappable card list on mobile.
- Cases should show: patient name or practice-safe ID, treatment, selected teeth summary, lab, current state, requested delivery, and next action/alert.
- Show meaningful empty states with a direct action. Never present a blank data table.
- Make each row/card fully tappable with a visible right-facing cue; retain an overflow menu for low-frequency actions.

### Notifications

Treat notifications as a human inbox:

- Group by `Needs your response`, `Today`, `Earlier`.
- Each item states the case, event, time, and direct action.
- Do not show a notification bell as the only place for a due-date proposal or revision request; surface critical events in the dashboard and case header too.

### Files and 3D scan states

- Files must always show file name, type, file size, upload/scan-validation status, and replacement/remove action.
- A successful validation state is a quiet, compact confirmation. Warnings explain risk and permit continuation if clinically appropriate.
- Keep the 3D viewer visually utilitarian: neutral tooth surface, dark or soft-grey viewport, orbit controls, orientation cue, fullscreen, and a clear “Add annotation” mode.
- Never represent a scan validation as a diagnosis.

---

## 8. Public marketing site

Generate a responsive landing page that speaks to dentists first. It should make a busy practitioner immediately understand why the product matters before asking them to create an account.

### 8.1 Landing page structure

#### A. Navigation

Left: dental arch/connection mark + **DentalConnect** wordmark. Treat “OS” as a small product descriptor, not the dominant brand word.

Centre/right links: `How it works`, `For dentists`, `For laboratories`, `Trust & privacy`.

Actions: `Sign in` as quiet text, `Get started` as primary button. On mobile: logo + menu + primary compact CTA.

#### B. Hero

**Eyebrow:** `THE DIGITAL HANDOFF, MADE CLINICAL`

**Headline:** `Send a complete lab case. Know exactly what happens next.`

**Supporting copy:** `DentalConnect brings scans, prescriptions, shade details, lab communication, and live production updates into one calm clinical workspace.`

**Primary CTA:** `Start your dentist workspace`

**Secondary CTA:** `See a case journey`

**Trust line below actions:** `Structured prescriptions • controlled file access • live case updates`

Hero art: a clean 3D UI montage on a warm canvas—case dashboard on the left, prescription/teeth selection in the foreground, a subtle scan mesh on the right. Avoid floating random cards. Make a single coherent product image.

#### C. “From scan to fit” three-step story

Use a horizontal desktop sequence / vertical mobile sequence:

1. **Build the prescription** — Choose treatment, teeth, material, shade, and delivery date with only the details this case needs.
2. **Send the complete case** — Upload scans, see file checks, and submit to a trusted lab with a clear case record.
3. **Follow every handoff** — Receive acceptance, production, delivery, and clarification updates in the same case timeline.

Use procedural diagrams or screen fragments, not icon-only feature blocks.

#### D. Dentist value section

Headline: `A clearer handoff for every restoration.`

Feature grid with a visual preview each:

- **Clinical prescription, not a blank note** — FDI teeth, bridges, materials, VITA shades, and specific design instructions.
- **No more “where is this case?”** — A case timeline with live status and delivery clarity.
- **Answer in context** — Controlled, case-specific lab messaging after acceptance.
- **Make decisions without rework** — Scan checks, visible missing details, and a concise review before submission.

#### E. Workflow spotlight — “Create a case in five calm steps”

Show a large product mock with the redesigned case builder stepper, tooth chart, selected shade, and a live completeness rail. Pair it with short copy: `Every detail in the place your lab expects it.`

#### F. Labs section

Headline: `Better information for labs. Better outcomes for dentists.`

Explain structured incoming cases, fewer follow-up calls, production updates, and shared case context. Keep dentist benefit primary; use a link `Explore the laboratory workspace`.

#### G. Trust and privacy section

Headline: `Built around the sensitivity of clinical case data.`

Use precise, non-legal-copy statements:

- Role-aware case access
- Case-specific communication
- Controlled sharing for patient design preview
- Visible file and timeline history

Avoid compliance badges that cannot be substantiated.

#### H. Final CTA

Headline: `Your next case can be clearer than your last.`

Primary: `Create your dentist workspace`

Secondary: `Sign in`

#### I. Footer

Simple dark/ink footer with logo, Product, Company, Support, privacy/legal links, and theme-safe colours. No huge sitemap.

### 8.2 Marketing page behaviour

- Navigation becomes a slim, subtly bordered floating bar after scrolling.
- Product mockups animate gently into view once; no parallax or auto-rotating carousels.
- CTAs lead to account creation with dentist selected by default, while still allowing lab registration.
- On mobile, hero CTA stays above the fold and no key copy overlays fine product detail.

---

## 9. Authentication and entry experience

The existing login is a centred generic card. Replace it with a welcome surface that establishes trust, reduces the perceived burden, and keeps sign-in fast.

### 9.1 Sign-in screen

**Desktop composition:** two-column layout.

- Left 45%: warm off-white brand panel with wordmark, a restrained scan/teeth line illustration, and a short promise: `Your cases, clearly in hand.` Include three compact trust/value statements, not a giant marketing page.
- Right 55%: generously spaced authentication form on a white surface. It should feel like a refined workspace entry, not a modal floating in blank space.

**Form content:**

- Heading: `Welcome back`
- Copy: `Sign in to review cases, send prescriptions, and stay aligned with your laboratory.`
- Email input
- Password input with show/hide affordance
- `Forgot password?` text link aligned to password label
- Primary `Sign in` button
- Divider: `New to DentalConnect?`
- Secondary `Create an account` button or link
- Small support link at the bottom

Show an inline, non-destructive error panel below the heading when necessary. Never use a browser alert.

### 9.2 Account creation

Make registration a short, choice-led sequence rather than a single overloaded form.

1. **Choose workspace** — Dentist/clinic selected by default; Laboratory is the alternative. Explain each in one line.
2. **Your details** — name, practice/lab name as applicable, email, password.
3. **Ready to begin** — concise confirmation with next step.

For dentists, use `I’m a dentist` and `I manage a dental clinic` language. Do not expose laboratory-specific fields until that role is selected.

### 9.3 First-run dentist onboarding

This is a recommended new experience after account creation. It should be skippable and resumable.

1. **Welcome, Dr. [Name]** — What do you want to do first? `Send a case` / `Explore the workspace`.
2. **Add a laboratory** — choose from directory or skip. Clarify that the lab can be selected when creating a case.
3. **A two-minute tour** — point to New case, attention queue, and case status. Do not make the user click through a long product tour.

The dashboard empty state should carry the same onboarding forward: `Your case desk is ready. Send your first case when you are.`

---

## 10. Dentist home dashboard — the daily command centre

### 10.1 Core layout at 1440 px

Use a 12-column grid. The content should feel like a personal command centre, not an operations dashboard.

1. **Header row (12 columns)**
   - `Good morning, Dr. Mehta` or time-aware equivalent.
   - Supporting line: `Here’s what needs attention across your laboratory cases.`
   - Primary `+ New case` button on the right.
   - Optional compact calendar/date context; no clutter.

2. **Attention queue (8 columns) + Today overview (4 columns)**
   - Attention queue is first and central. List 0–3 action cards: due-date proposal awaiting approval, lab clarification, a draft ready to submit, an overdue/urgent case.
   - Each item has case name/ID, plain-language event, timing, and one direct action.
   - Today overview shows `In production`, `Due this week`, `Delivered this month` as compact numeric summaries. Do not lead with a pie/donut chart.

3. **Active cases (8 columns) + Recent activity (4 columns)**
   - A dense but breathable table/list of active cases, default sorted by attention and requested delivery.
   - Recent activity is a small chronological timeline, useful but secondary.

4. **Materials snapshot / clinic allocations (optional 4 columns) + cases continuation (8 columns)**
   - Only show the Materials snapshot when inventory exists. Otherwise use contextual education or expand active cases.

### 10.2 Dashboard hierarchy and content

**Primary cards should contain live, useful information:**

- `Needs your attention` — action queue, never a generic “Great job!” card when there are no issues. If empty: `Nothing needs your approval today.`
- `Active cases` — number + relevant descriptive subtext, e.g. `7 moving through production`.
- `Due this week` — clear number and a link/filter.
- `Delivered this month` — quieter historical measure.

**Active cases list columns:**

| Column | Content |
| --- | --- |
| Case | Patient name / case number, treatment, selected teeth summary |
| Laboratory | name and small trusted/partner cue only if genuine |
| Status | semantic status chip |
| Delivery | requested date plus relative signal (`Tomorrow`, `3 days late`) |
| Next | e.g. `Approve revised date`, `Awaiting lab`, `Open case` |

Desktop table actions should not require a separate tiny `View` button in every row. Make the row clickable, then provide an overflow menu. On mobile, render cards with the same priority order.

### 10.3 Empty, quiet, and high-volume states

- **No cases:** show a calm case folder/arch illustration, `Your case desk is ready`, explanation, and `Send your first case` primary action.
- **No attention items:** a subtle checkmark and `Nothing needs your approval today.` Do not use a large celebratory gradient.
- **Many cases:** show saved filters, prioritised sorting, and `Load more`; do not create an infinite noisy dashboard.
- **No lab connected:** banner with `Find a laboratory` and `You can choose a lab before submitting a case.`

---

## 11. Cases index

Create a dedicated cases page even if the dashboard has a recent-case section.

### Header

- Title: `Cases`
- Subcopy: `All prescriptions, drafts, and production updates in one place.`
- Primary `+ New case`

### Saved views and filters

Use easy, visible pills/tabs across the top:

- `All`
- `Needs attention`
- `In progress`
- `Due this week`
- `Drafts`
- `Completed`

Secondary filters in a compact popover or drawer: lab, treatment, status, date range, urgency. Search supports patient name and case ID. Avoid having a row of 10 controls in the header.

### Row/card content

Show a small dental-arch glyph only if it represents selected teeth or treatment—not as decoration. Include treatment, FDI teeth summary (e.g. `16, 17 — crowns`), lab, status, delivery, and next action. Offer a case ID on a second line in monospace.

### Bulk actions

Do not introduce bulk controls until a real dentist action exists (such as archive, export, or assign). Do not make the table feel like enterprise admin software.

---

## 12. New case builder — the most important workflow

### 12.1 General approach

Replace the compact modal with a dedicated full-page, draft-safe case builder. A dense clinical prescription deserves space, clear navigation, and review—not a narrow dialog that constrains the tooth chart and design controls.

**Desktop:**

- Fixed top bar: back to cases, `New case`, autosave state (`Saved just now`), `Save draft`.
- Main content: 8-column form canvas plus a 4-column sticky `Case summary` / `Completion` rail.
- Stepper is horizontal on desktop with both number and label.

**Mobile:**

- Full-screen flow with a compact progress header (`Step 2 of 5 — Files`).
- Persistent bottom bar with `Back`, `Save draft`, and context-aware `Continue` / `Review case`.
- Never require horizontal scrolling for the tooth chart; use an optimised touch view with zoom/expanded full-screen chart.

### 12.2 Five-step structure

#### Step 1 — Patient & case

**Goal:** establish a complete, routable case with the least cognitive load.

Fields, ordered:

1. Patient name or practice-safe patient reference.
2. Treatment type: `Crown & bridge`, `Fixed partial denture`, `Veneer`, `Implant`, `Full arch`, `Surgical guide`.
3. Laboratory selector: searchable list of recent/trusted labs first, then directory. Do not preselect a lab silently. If a default is used, label it `Your usual lab` and allow change.
4. Requested delivery date, with lab turnaround context when available: `Apex Dental Lab usually needs 5–7 working days.`
5. Priority: default `Standard`; expose `High` and `Urgent` with a short reason/expectation message.
6. Age and gender only where required by the clinical workflow. Explain why these fields are requested if they are mandatory.

**Conditional implant section:**

- Implant brand
- Scan body model/type
- Component/analog logistics: `I will send the component` / `Please supply the component`

Use a succinct expandable card titled `Implant details` with a green/teal completion state once complete. Do not show it for non-implant cases.

#### Step 2 — Scans & files

**Goal:** make upload, readiness, and exceptions clear.

- Primary upload panel: `Add intraoral scan` with drop zone and browse option; accepted formats `STL, PLY`.
- Provide a recent scanner/folder integration affordance only when supported, e.g. `Choose from scanner folder`.
- After selection, show a structured file card: name, type, size, `Checking scan…`, then `Scan checked` plus dimensions.
- Warnings are amber, specific, and non-alarmist. Example: `The model is unusually small (12 mm wide). Check export units before sending.`
- For surgical guides, conditionally add a second clearly separate `CBCT / DICOM` upload area with formats and confidentiality cue.
- Allow replacement and removal. Make upload progress visible for large files.

Do not bury scan validation in a toast. Do not use a decorative cloud upload illustration large enough to push important status below the fold.

#### Step 3 — Teeth & restoration

**Goal:** translate clinical intent into a legible, structured prescription.

Use a large, polished FDI tooth chart. It is a key product differentiator and deserves visual quality.

- Upper and lower arches with tooth numbers legible at normal zoom.
- Tap/click a tooth to select it; selected teeth get a subtle teal outline and fill, not a rainbow block.
- A contextual toolbar appears after selection: `Crown`, `Coping`, `Veneer`, `Implant`, `Abutment`, `Pontic`, `Bridge / FPD`, `Clear`.
- Use a small legend in an expandable `Legend` popover rather than permanently occupying visual space.
- Display selected teeth as a concise live sentence: `3 teeth configured — 16 crown, 17 pontic, 18 crown.`
- When a bridge/FPD is being made, guide the user through choosing retainers and pontics; visualise the connection with a purposeful bridge line.
- If the selected count exceeds a treatment limit, show a helpful panel: `More than six teeth in one arch? Switch this case to Full arch.`
- Add `I’ll specify this later` only when the underlying workflow safely permits it, and make the consequence clear.

Below the chart, reveal structured design inputs only as necessary:

- Occlusal clearance
- Contact design
- Connector design
- Pontic design

Use plain-language defaults and “Recommended” microcopy where clinically meaningful. Do not make users select every parameter for a simple single crown.

#### Step 4 — Aesthetics & material

**Goal:** make material and shade precise without feeling like a CAD interface.

- Present material selection as 3–5 informative cards/rows, not a carousel. Each shows material name and a one-line practical descriptor. Use neutral selections with a teal check, not five coloured cards.
- VITA shade grid grouped A/B/C/D with physical-looking swatches, labels, keyboard access, and a selected state that works in dark mode.
- `Advanced shade customisation` is an opt-in disclosure. When enabled, show a simple tooth illustration divided into cervical/body/incisal zones and a visible legend. The user can select each zone and see its selected shade.
- Characterisations are selectable chips/check boxes: White spots, crack lines, incisal translucency, hypoplasia marks.
- Shade-reference photo upload is a compact, clearly optional file tile with preview/removal and a privacy note.
- Allow `Let the lab advise` / `Not specified` only behind an explicit choice, with an explanatory sentence. Never treat missing shade as silently acceptable.

#### Step 5 — Review & submit

**Goal:** let the dentist verify the handoff in under 30 seconds.

Use a structured clinical summary, not a dump of form fields:

- Patient & treatment
- Lab & delivery expectation
- Scan file(s) and readiness
- Teeth/restoration diagram and concise selection text
- Material / shade / optional photo
- Implant or surgical-guide details, if relevant
- Notes

Show a completeness panel with explicit items such as `Scan attached`, `Teeth specified`, `Shade selected`, `Delivery requested`.

At the bottom:

- Secondary `Save draft`
- Primary `Submit to [Lab name]`
- A concise consequence: `The lab will be notified and chat will open after it accepts the case.`

On submit, show a polished confirmation state with the case number, expected next event (`Awaiting lab acceptance`), and two paths: `Open case` and `Create another case`.

### 12.3 Builder persistence and safety

- Auto-save at meaningful pauses and show `Saving…`, `Saved just now`, or a recoverable error state.
- Never throw away a partially completed clinical prescription when the dentist changes screen or loses connection.
- If the user exits with unsaved work, clearly offer `Keep editing`, `Save draft`, or `Discard draft`.
- Draft status is neutral and reassuring—not a warning colour.

---

## 13. Case detail — the single source of truth

### 13.1 Header and hierarchy

Build the case page around an immediately understandable header:

- Back link: `Cases`
- Title: patient/practice-safe name plus treatment (`Riya S. — 16–18 bridge`)
- Case ID in muted monospaced text, copyable but not dominant.
- Status chip and requested delivery date.
- Lab identity.
- Contextual primary action based on the case state.

Examples of contextual primary actions:

| State | Primary action |
| --- | --- |
| Draft | `Review and submit` |
| Awaiting acceptance | `View prescription` with a calm wait state |
| Lab asks a question | `Reply to lab` |
| Due-date proposal | `Review proposed date` |
| In production | `View progress` / `Message lab` |
| Design ready | `Review design` |
| Delivered | `Mark fitted` if that workflow exists |

### 13.2 Status rail

Below the header, show a compact horizontal journey for desktop and vertical/scrollable version on mobile:

`Draft → Sent → Accepted → In production → Quality check → Dispatched → Delivered → Fitted`

Use completed, current, future, and exception states clearly. Add timestamps only for completed/current steps. Do not pretend a granular production step occurred if the data only supports a high-level status.

### 13.3 Overview tab

Use a two-column desktop layout:

- **Main column:** action banner if needed, status journey, concise prescription summary, timeline, recent design/file state.
- **Right column / sticky rail:** `Next action`, delivery details, lab contact, case participants, and compact files summary.

**Critical events must appear above the fold:**

- Draft awaiting submission
- Lab date proposal with original date and proposed date
- Rejected case / missing information
- Lab clarification message
- A ready-for-review design

For a proposed delivery date, use a focused comparison card:

`Requested: Thu, 18 Jul` → `Lab proposes: Mon, 22 Jul`

Then present `Approve new date` primary and `Keep requested date` secondary. Explain what happens after each action.

### 13.4 Prescription tab

Use cards or semantic sections with a clear scan-friendly order:

1. Treatment and teeth — render a compact chart or selected teeth diagram.
2. Restoration plan — crown/bridge/implant/pontic configuration.
3. Materials and shade — swatches should be labelled in text.
4. Design details — occlusal, contact, connector, pontic parameters.
5. Implant or surgical guide details when relevant.
6. Dentist instructions.

Avoid placing data such as `patient_gender` in visually loud coloured badges; present clinically relevant context as normal labelled metadata and only if truly needed by the lab.

### 13.5 Files & design tab

- Scan preview takes the primary visual space.
- 3D viewer has clear controls: orbit, reset view, fullscreen, annotate (when permitted), and download if authorised.
- Annotation mode visibly changes the viewer and gives concise instruction: `Click the scan to place a note.`
- Annotation list mirrors pins with author, text, status, and resolve action.
- File cards below or beside it show input scan, DICOM/CBCT, shade photo, and final CAD design in a consistent pattern.
- A final CAD design upload is clearly labelled as lab-provided. For dentists, its absence should read `The laboratory has not added a final design file yet.`
- Patient-preview sharing is a secondary case action with expiry/access wording. The sharing dialog needs a copy button, expiry status, and an obvious stop-sharing control if this is supported.

### 13.6 Messages tab

The conversation is case-specific and should not feel like a generic team chat.

- Header shows lab name, case state, and participants.
- System timeline events are visually distinct from human messages.
- Messages include sender role/name and timestamp, not just “Participant.”
- Compose area remains at bottom; support simple attachments later, but do not invent them now.
- Before lab acceptance, show a locked state with the precise reason: `Messaging opens after [Lab] accepts this case.`
- Prioritise clinician clarity: use subtle prompts such as `Ask the lab about the margin, shade, or delivery date.`

---

## 14. Laboratory discovery and Materials

### 14.1 Labs directory

Make this a selection tool for dentists, not a decorative marketplace.

**Header:** `Find the right laboratory` with subcopy about services, turnaround, and reliable case handoff.

**Search and filters:** location (if data exists), service, implant capability, turnaround, material, partner/favourite. Do not include pretend ratings/reviews unless the product has trustworthy sources.

**Lab card:**

- Name and practical relationship status (`Your partner lab`, `New lab`)
- Specialities / services
- Typical turnaround
- Pricing approach only when real and meaningful
- Contact method and profile details
- `View profile` / `Use for next case`

Avoid assigning random star ratings, fake reviews, or fictitious contact data in a production-looking design.

**Lab profile:**

- Overview of services, materials, timing, delivery/service region if applicable
- Operating preferences and component logistics when relevant
- A contextual `Start a case with this lab` CTA
- Explain that secure case messaging begins after a case is accepted.

### 14.2 Materials

Dentists should see this only if the workflow includes lab-held/pre-purchased material allocations.

Use title `Materials with your labs`, not `Virtual inventory`.

- Each allocation: material, lab, available units of total, locked rate if real, and low-stock/reorder signal.
- Use progress bars sparingly; pair with text (`3 of 10 units remaining`).
- If nothing exists, explain the value without pushing a fake purchase journey: `Your lab-held material allocations will appear here.`

---

## 15. Secondary laboratory workspace (only when generating lab screens)

The lab view should share the brand system but be appropriately operational.

- A production board can use status columns: Incoming, In production, Quality check, Dispatched.
- Cards must foreground treatment, selected teeth, requested date, dentist/practice, urgency, and missing-info flags.
- Drag/drop is optional enhancement; every status change must also have an accessible non-drag interaction.
- When a status is changed, ask whether the dentist should be notified and show the external-facing update text.
- The lab case page should distinguish internal notes from dentist-visible updates with a clear label and not merely colour.
- The lab can propose a new delivery date and upload final design files.

Do not let the lab board’s dense operational model leak into the dentist dashboard.

---

## 16. Responsive behaviour

### Desktop (1280–1440+ px)

- Sidebar + expansive 12-column content grid.
- Dense data tables are acceptable when rows are 56–64 px tall and scan cleanly.
- Case builder has sticky summary rail.
- Case detail can use two columns and an anchored action rail.

### Tablet (768–1279 px)

- Sidebar collapses to a slim icon rail or temporary drawer.
- Dashboard uses two columns, attention queue full width.
- Case builder summary moves below the current form section or becomes a collapsible sheet.
- Tooth chart remains full width and retains large hit targets.

### Mobile (360–767 px)

- Bottom navigation; no horizontal data tables.
- Turn tables into cards with most important information first.
- 44 px minimum touch targets; form controls at least 44 px high.
- Use full-screen sheets for filters and advanced selectors.
- Preserve progress and primary submit action as sticky but never obscure input fields with it.
- For shade selection, use a logical grid with sufficiently large swatches and text labels.
- The 3D viewer should be full-width and allow fullscreen.

### Reduced-motion and keyboard behaviour

- All interactive controls work with keyboard and show a visible primary-colour focus ring.
- Dialogs trap focus and return it to the triggering action.
- Drag-only interactions have buttons or menus as alternatives.
- Respect reduced-motion settings by removing continuous motion and large transitions.

---

## 17. Accessibility, content, and privacy standards

### Accessibility

- Meet WCAG AA colour contrast for all text and functional controls.
- Pair every status colour with text and/or an icon.
- Inputs have persistent labels; do not rely on placeholder text.
- Error and success messages are announced and visually adjacent to the relevant action.
- Do not use blue/pink labels for patient gender. If shown, use neutral text metadata.
- Do not use red/green alone to represent a clinically important condition.
- Charts must have text summaries and should not be necessary to interpret a case.

### Content voice

The voice is calm, concise, competent, and clinician-to-clinician.

**Use:**

- `Lab accepted your case`
- `Check the scan scale before you submit`
- `The lab proposes delivery on 22 Jul`
- `Your draft is safely saved`
- `Add shade details when they matter for this restoration`

**Avoid:**

- `Awesome!`
- `You’re all set!!!`
- `Sit tight`
- `Magic`
- `Seamless` / `revolutionary`
- Acronyms without expansion where a dentist may not expect them

### Date, number, and locale handling

- Default to a human-readable, unambiguous date: `Thu, 18 Jul 2026` rather than `07/18/26`.
- Use relative date only alongside or immediately understandable from the absolute date when high stakes: `Tomorrow · Fri, 12 Jul`.
- Use `₹` and Indian number/date conventions when the practice locale is India; keep localisation-ready presentation.
- Use case IDs in short monospace form (`DC-81F2A`) but enable copy/full ID access.

### Privacy cues

- Near uploads: `Only people assigned to this case can access these files.`
- Near preview sharing: `This link gives read-only access to the design preview. Set an expiry before sharing.`
- In patient-facing preview: no patient name, clinical notes, or internal messages.
- Never use real patient data or realistic identifiable scans in marketing visuals.

---

## 18. Required states to design

For every core screen, Stitch should show thoughtful system states—not only the ideal happy path.

### Dashboard / cases

- First-time empty state
- No attention items
- Loading / skeleton state
- Search with no results
- Filtered view with no matching cases
- One urgent/overdue item
- Due-date proposal requiring response

### Case builder

- Empty upload state
- Upload progress
- Scan validation success
- Scan validation warning and safe next step
- Required-field validation
- Draft saved
- Offline/failed autosave that can retry
- Successful case submission

### Case detail

- Draft
- Awaiting lab acceptance
- In production
- A case with a lab clarification
- Proposed delivery-date approval
- Design file available
- Chat locked before acceptance
- No scan / scan removed by retention policy

### Labs / materials

- No partner lab yet
- Search no results
- Lab profile without public catalogue data
- No material allocation
- Low material allocation

---

## 19. What not to design

Do not create any of the following unless specifically requested in a later product phase:

- Generic telemedicine screens, appointment booking, claims, billing, insurance, patient CRM, or clinical record sections.
- Fake analytics dashboards packed with charts, conversion metrics, and growth arrows.
- Fake 5-star reviews, random testimonials, fabricated lab ratings, or invented contact details.
- Always-visible chatbot, AI copilot, or “Ask AI” bubble.
- Overly decorative dental icons, cartoon teeth, stock patient smiles, medical crosses, or a cobalt-blue hospital aesthetic.
- Full pages filled with gradients, glassmorphism, rounded pills, or decorative widgets.
- Colour-only differences between important status states.
- “HIPAA compliant” or other legal/compliance claims without an approved legal basis.

---

## 20. Google Stitch generation instructions

Generate a cohesive, high-fidelity responsive web application called **DentalConnect**. Treat this document as the design brief. Keep every screen within one shared design system: Clinical Canvas light mode and Monokai Workbench dark mode.

### Prioritised screens to generate

Generate these in this order, maintaining the same component system and data across screens:

1. Marketing landing page — desktop and mobile.
2. Sign-in and account creation — desktop and mobile.
3. Dentist dashboard — desktop, showing a realistic “needs your attention” case and active case list.
4. Cases index — desktop and mobile, including filters and a no-results state.
5. New case builder, Step 1 — patient, treatment, lab, delivery fields.
6. New case builder, Step 2 — scan upload with a validation warning.
7. New case builder, Step 3 — FDI tooth chart with a 16–18 bridge configured.
8. New case builder, Step 4 — material + VITA shade selection with optional three-zone shading open.
9. New case builder, Step 5 — review and submit summary.
10. Case detail Overview — lab proposes a new delivery date; dentist needs to approve or retain original date.
11. Case detail Files & design — 3D scan viewer, annotations, and file cards.
12. Case detail Messages — lab has accepted case and discussion is available.
13. Lab directory and lab profile.
14. Dentist Materials page, including low allocation state.
15. Optional secondary lab Kanban screen.

### Sample realistic display data

Use synthetic, non-identifying content consistently across the generated screens:

- Dentist: `Dr. Aanya Mehta`, `Mehta Dental Studio`
- Labs: `Apex Dental Lab`, `Ceramic Works`, `Precision Implant Studio`
- Case 1: `Riya S. — 16–18 fixed bridge`, Apex Dental Lab, requested `Thu, 18 Jul`, lab proposes `Mon, 22 Jul`, material `Zirconia HT`, shade `A2`.
- Case 2: `Kabir P. — implant crown at 36`, In production, due `Tomorrow`.
- Case 3: `Mira R. — veneers 11–21`, Draft, shade reference photo available.
- Case ID: `DC-81F2A`.

Use synthetic teeth/scan visuals. Never use a patient photograph or actual personal health data.

### Mandatory visual constraints for Stitch

- Light mode is warm off-white + deep teal, not generic white + cobalt blue.
- Dark mode preserves the Monokai-inspired charcoal, cyan, pink, lime, and orange palette—but uses each accent sparingly and semantically.
- Use a 12-column desktop grid and a mobile-first responsive layout.
- Make the dentist dashboard action-led, with “Needs your attention” above charts.
- Make `+ New case` globally prominent.
- Use meaningful labels, status chips, and plain-language clinical copy.
- The case builder is a full-page five-step experience, not a cramped modal.
- Treat the tooth chart and shade picker as premium, tactile, clinically precise interactions.
- Prefer subtle borders and warm surfaces over heavy shadows, gradient cards, and glassmorphism.
- Make essential state/action text legible at a glance and accessible in both themes.

### Final quality checklist for generated designs

- Does every dentist-facing screen have one obvious next action?
- Can a dentist understand the status and requested delivery of a case without opening it?
- Does the new-case flow clearly show what remains to be completed and preserve drafts?
- Are advanced details hidden until relevant?
- Does light mode feel calm, premium, and clinically precise rather than tacky or blue-heavy?
- Does dark mode feel distinctly Monokai without becoming noisy?
- Are labels and state colours accessible and non-reliant on colour alone?
- Are desktop and mobile layouts both intentional rather than a scaled-down version of each other?
- Is the visual system consistent across marketing, authentication, dashboard, builder, and case views?

---

## 21. One-line creative direction

**Design DentalConnect as the quiet, precise case desk a modern dentist wishes existed: a warm clinical workspace that turns a complex lab handoff into a clear, confident sequence of decisions.**
