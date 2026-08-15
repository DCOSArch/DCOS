---
title: Vault Map
aliases: [Vault Map, Index, Map of Content, MOC, Start Here]
tags: [moc, index, meta, vault-map, dcos]
type: index
created: 2026-08-12
---

# 🗺️ Vault Map — Dental ConnectOS (DCOS)

> [!info] Start here
> This repo is a **hybrid**: the Next.js **Dental ConnectOS (DCOS)** app *and* an Obsidian
> vault in the same root. This note is the entry point for both humans and AI agents.
> A machine-readable copy lives in `CLAUDE.md` at the vault root (auto-loaded by Claude Code).

## 🔎 How search / indexing works here
- **Omnisearch** indexes full text; **Smart Connections** builds semantic embeddings
  (model `bge-micro-v2`, stored in `.smart-env/`). Both power Obsidian's own UI.
- **Claude Code** cannot query those indexes — it reads the same source files via
  full-text search (Grep), filename match (Glob), and Read. This map is its shortcut.

## 🧠 Knowledge / strategic notes (`agent_memory/`, renamed from `.agent_memory/` so Obsidian can index it)
Read these for project context (start with the first):
- [[Master_Context]] — largest, most complete context doc (**read first**)
- **architecture/** — [[Dental_ConnectOS_Strategic_Architecture_Blueprint]] · [[Local-First PMS Technical Specification]] · [[Next-Gen Reactive PMS Technical Blueprint & DCOS Audit]]
- **vision/** — [[Master_Vision_and_Feasibility_Study]] · [[master_vision_and_production_roadmap]]
- **status/** — [[codebase_audit_2026-07-11]] *(superseded by `docs/codebase_audit.md`)* · [[feasibility_study_and_sprint_plan]] · [[implementation_plan]] · [[implementation_planv2]]
- **state/** — [[session_handoff]] · [[changelog]] · [[task]] · [[project_context]] · [[cline_inbox]] · [[cline_delegation_sprint]] — running state between sessions, read/written by Cline per `.clinerules`
- **raw/** — source transcripts and reference images (not notes; not linked, just archival)

## 🗂️ Orchestration memory
- `.autoclaw/orchestrator/` — multi-agent board + sprints (`board.md`, `sprints/*.context.md`)

## 📄 Root docs
- `docs/design.md` (design system) · `docs/product_analysis.md` · `docs/codebase_audit.md`
- `docs/DCOS - Clinical Operating System Product Requirements Document.pdf` (PRD source PDF)
- `archive/` — retired scratch/debug files (old build logs, one-off `find-*.cjs` scripts); not active work

## 💻 Code (do not treat as notes)
- `src/app/` — Next.js App Router: `(dashboard)`, `api/`, `labs/`, `landing/`, `login/`, `preview/`
- `src/components/` · `src/lib/` · `src/types.ts` · `src/mockData.ts`
- `supabase/migrations/` — database schema
- `src_vite/`, `vite_backup/`, `dist/` — **legacy Vite build; avoid editing**

## 📊 Data
- `docs/data/DCOS_Buyer_Playbook_v3.xlsx` · `docs/data/DCOS_India_Leads_v2.xlsx` · `docs/data/DCOS_India_Leads_verified.xlsx`
- `docs/data/test_sales_data.csv`

## ⚙️ Conventions
- Use consistent terminology + frontmatter `tags:`/`aliases:` so full-text search stays effective.
- Keep `[[wikilinks]]` valid — protects both Obsidian's graph and agent traversal.
- Do not edit generated dirs: `.smart-env/`, `.obsidian/`, `.next/`, `node_modules/`.
