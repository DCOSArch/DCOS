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
- `agent_memory/` — strategic brain of the project (renamed from `.agent_memory/` so Obsidian can
  actually index it — Obsidian never scans dotfolders). Start here:
  - [[Master_Context]] — largest, most complete context doc (read first)
  - `agent_memory/architecture/` — [[Dental_ConnectOS_Strategic_Architecture_Blueprint]], [[Local-First PMS Technical Specification]], [[Next-Gen Reactive PMS Technical Blueprint & DCOS Audit]]
  - `agent_memory/vision/` — [[Master_Vision_and_Feasibility_Study]], [[master_vision_and_production_roadmap]]
  - `agent_memory/status/` — [[codebase_audit]] *(agent_memory copy — distinct from `docs/codebase_audit.md`)*, [[feasibility_study_and_sprint_plan]], [[implementation_plan]], [[implementation_planv2]]
  - `agent_memory/state/` — [[session_handoff]], [[changelog]], [[task]], [[project_context]], [[cline_inbox]], [[cline_delegation_sprint]] — running state between sessions
  - `agent_memory/raw/` — source transcripts and reference images (not notes; don't parse as docs)
- `.autoclaw/orchestrator/` — multi-agent orchestration memory (`board.md`, `sprints/*.context.md`)
- `docs/` — root docs: [[design]] (design system), [[product_analysis]], [[codebase_audit]],
  `DCOS - Clinical Operating System Product Requirements Document.pdf`
- [[AGENTS]] — Claude Code agent rules (also auto-loaded via `@AGENTS.md` above)
- `archive/` — retired scratch/debug files (old build logs, one-off `find-*.cjs` scripts); not active work

## Code
- `src/app/` — Next.js App Router: route groups `(dashboard)`, plus `api/`, `labs/`,
  `landing/`, `login/`, `preview/`; `layout.tsx`, `globals.css`, `sitemap.ts`
- `src/components/` — React components · `src/lib/` — helpers
- `src/types.ts`, `src/mockData.ts`, `src/proxy.ts` — shared types + mock data
- `supabase/migrations/` — database schema · `.env.local` — secrets (do not commit)
- `src_vite/`, `vite_backup/`, `dist/` — legacy Vite build (superseded by Next.js; avoid editing)

## Data
- `docs/data/DCOS_Buyer_Playbook_v3.xlsx`, `docs/data/DCOS_India_Leads_v2.xlsx`, `docs/data/DCOS_India_Leads_verified.xlsx`
- `docs/data/test_sales_data.csv`

## Conventions
- Notes use tags/frontmatter and `[[wikilinks]]`; keep links valid so both Obsidian's graph
  and Claude's traversal stay intact.
- When context is needed, read `agent_memory/Master_Context.md` before searching blindly.
- Do not edit `.smart-env/`, `.obsidian/`, `.next/`, `node_modules/` — generated/index data.
