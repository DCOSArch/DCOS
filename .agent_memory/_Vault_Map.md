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

## 🧠 Knowledge / strategic notes
Read these for project context (start with the first):
- [[Master_Context]] — largest, most complete context doc (**read first**)
- [[Dental_ConnectOS_Strategic_Architecture_Blueprint]] — architecture
- [[Master_Vision_and_Feasibility_Study]] · [[master_vision_and_production_roadmap]] — vision + roadmap
- [[codebase_audit]] · [[feasibility_study_and_sprint_plan]] · [[implementation_plan]] — status + plans
- [[session_handoff]] · [[changelog]] · [[task]] — running state between sessions

## 🗂️ Orchestration memory
- `.autoclaw/orchestrator/` — multi-agent board + sprints (`board.md`, `sprints/*.context.md`)

## 💻 Code (do not treat as notes)
- `src/app/` — Next.js App Router: `(dashboard)`, `api/`, `labs/`, `landing/`, `login/`, `preview/`
- `src/components/` · `src/lib/` · `src/types.ts` · `src/mockData.ts`
- `supabase/migrations/` — database schema
- `src_vite/`, `vite_backup/`, `dist/` — **legacy Vite build; avoid editing**

## 📊 Data
- `DCOS_Buyer_Playbook_v3.xlsx` · `DCOS_India_Leads_v2.xlsx` · `DCOS_India_Leads_verified.xlsx`
- `test_sales_data.csv`

## ⚙️ Conventions
- Use consistent terminology + frontmatter `tags:`/`aliases:` so full-text search stays effective.
- Keep `[[wikilinks]]` valid — protects both Obsidian's graph and agent traversal.
- Do not edit generated dirs: `.smart-env/`, `.obsidian/`, `.next/`, `node_modules/`.
