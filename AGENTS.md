<!-- BEGIN:company-secrets-protocol -->
# DCOS Enterprise Security & Confidentiality Protocol

1. **Strict Local Isolation of Memory & Notes**:
   - Never stage or commit files under `agent_memory/`, `agent_memory/raw/`, `agent_memory/vision/`, or user notes (`Notes*.jpeg`, `*.txt`, transcripts).
   - `.gitignore` must strictly ignore `agent_memory/`, credentials, and private design artifacts.

2. **Zero Leaks of Business Secrets & CapEx Terms**:
   - Partner names, financial figures, transaction cuts, and raw voice meeting transcripts are strictly confidential and must never be exposed in public commits, PR descriptions, or public markdown.

3. **Code & Architecture Integrity**:
   - Technical implementations of algorithms (Bi-temporal Merkle Chain, Scanner Ingestion Bridge, Fidelius ABDM integration) belong in source code or formal patent filings under `patents/`, never leaked in unredacted third-party logs.
<!-- END:company-secrets-protocol -->

<!-- BEGIN:vault-search-protocol -->
# Vault Search Protocol — do NOT default to Grep

This vault is indexed by Obsidian and exposed to agents through the **`obsidian` MCP server**.
If that server is connected, prefer its index-backed tools over filesystem scanning.

**Priority order:**

1. **`search_query`** — JsonLogic over note *metadata*: `tags`, `frontmatter.*`, `path`,
   `stat.mtime`, `links`, `backlinks`, `unresolvedLinks`. Grep cannot do this at all.
   Use for "notes tagged X", "what links here", "changed since Y".
2. **`search_simple`** — Obsidian's built-in full-text index. Returns ranked
   `{filename, score, matches}` with context. Faster than Grep for content lookup because it
   queries a prebuilt index instead of scanning files.
3. **`vault_get_document_map`** — heading tree, block IDs, and frontmatter keys for one file.
   Use before `vault_read`/`vault_patch` to target a section instead of reading the whole note.
4. **`Grep` / `Glob`** — fallback only: regex, code under `src/`, or non-markdown files the
   Obsidian index doesn't cover.

**Semantic search is NOT available to agents.** Smart Connections (embeddings in `.smart-env/`,
model `bge-micro-v2`) powers Obsidian's *UI only*. Its registered commands
(`smart-connections:*`, `smart-context:*`, `smart-lookup:*`) are view-openers — executing one
opens a pane in the app and returns **no data to the agent**. Never use them for retrieval, and
never try to parse `.smart-env/` (opaque vector store).

**Compensate for the missing semantics** with consistent vocabulary plus frontmatter
`tags:`/`aliases:`, then query metadata (`search_query`) and text (`search_simple`).
<!-- END:vault-search-protocol -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Related: [[CLAUDE]] · [[design]] · [[product_analysis]] · [[codebase_audit]]
