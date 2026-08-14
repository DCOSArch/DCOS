@AGENTS.md

# Vault Map

This repo is a **hybrid**: a Next.js app (`next-app`) *and* an Obsidian vault living in
the same root (`C:\Users\bentn\OneDrive\Desktop\DEs`). Product = **Dental ConnectOS (DCOS)**.

## How search / "indexing" works here
- Obsidian indexes these notes with **Omnisearch** (full-text) and **Smart Connections**
  (semantic embeddings, stored in `.smart-env/`). Those indexes power Obsidian's own UI.
- Claude Code cannot query those indexes directly. It reaches the same source files via
  `Grep` (content), `Glob` (filenames), and `Read` (full notes). This map is the shortcut
  that tells Claude where to look — treat it as the entry point every session.

## Knowledge / notes (read these for project context)
- `.agent_memory/` — strategic brain of the project. Start here:
  - `Master_Context.md` — largest, most complete context doc (read first)
  - `Dental_ConnectOS_Strategic_Architecture_Blueprint.md` — architecture
  - `Master_Vision_and_Feasibility_Study.md`, `master_vision_and_production_roadmap.md` — vision + roadmap
  - `codebase_audit.md`, `feasibility_study_and_sprint_plan.md`, `implementation_plan.md` — status + plans
  - `session_handoff.md`, `changelog.md`, `task.md` — running state between sessions
- `.autoclaw/orchestrator/` — multi-agent orchestration memory (`board.md`, `sprints/*.context.md`)
- Root docs: `design.md` (design system), `product_analysis.md`, `codebase_audit.md`

## Code
- `src/app/` — Next.js App Router: route groups `(dashboard)`, plus `api/`, `labs/`,
  `landing/`, `login/`, `preview/`; `layout.tsx`, `globals.css`, `sitemap.ts`
- `src/components/` — React components · `src/lib/` — helpers
- `src/types.ts`, `src/mockData.ts`, `src/proxy.ts` — shared types + mock data
- `supabase/migrations/` — database schema · `.env.local` — secrets (do not commit)
- `src_vite/`, `vite_backup/`, `dist/` — legacy Vite build (superseded by Next.js; avoid editing)

## Data
- `DCOS_Buyer_Playbook_v3.xlsx`, `DCOS_India_Leads_v2.xlsx`, `DCOS_India_Leads_verified.xlsx`
- `test_sales_data.csv`

## Conventions
- Notes use tags/frontmatter and `[[wikilinks]]`; keep links valid so both Obsidian's graph
  and Claude's traversal stay intact.
- When context is needed, read `.agent_memory/Master_Context.md` before searching blindly.
- Do not edit `.smart-env/`, `.obsidian/`, `.next/`, `node_modules/` — generated/index data.
