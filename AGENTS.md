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

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Related: [[CLAUDE]] · [[design]] · [[product_analysis]] · [[codebase_audit]]
