
## 2026-07-03T18:50:25.302Z — /learn
Analyzed 555 session(s), 9 kept signal(s) from autoclaw-native, claude-code, cline-roo, gemini.
Successful patterns:
- Kept (git commit): {"AllowMultiple":false,"Description":"Initialize scratchpad with task list","EndLine":1,"Instruction":"Initialize scratchpad with task list","ReplacementContent":"# Scratchpad - Debugging FDB Booklet
- Kept (git commit): {"ClickType":"left","PageID":"AC5AFC5562021D145B429AB0ABCABCA7","X":635,"Y":371,"explanation":"Click the Next Page button in the virtual booklet viewer.","toolAction":"Clicking next page","toolSummary
- Kept (git commit): +┌──────────────────────────────────────────────────────────────────┐
- Kept (git commit): {"JavaScriptDescription":"Click the Vendor Tracker nav item","JavaScriptSource":"(() =\u003e {\n const items = Array.from(document.querySelectorAll('[class*=\"navItem\"]'));\n const vt = items.find(
- Kept (git commit): {"JavaScriptDescription":"Get list of options in the crop selector dropdown.","JavaScriptSource":"(() =\u003e {\n const select = document.querySelector('select');\n if (!select) return 'No select fo
- Kept (git commit): const trimmed = text.trim().toUpperCase();
- Kept (git commit): // Fetch membership_tier and ai_autopsies_used
- Kept (git commit): const result = await runPolicyPipeline();
- Kept (git commit): Apply this to the `summary` before insert.
Patterns to avoid:
- Avoid large speculative rewrites that are not backed by tests.
- Avoid adding new dependencies when an existing project utility already covers the need.
