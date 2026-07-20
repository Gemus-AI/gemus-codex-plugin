---
name: gemus-getting-started
description: Use when building, editing, running, or opening an AI design workflow on the Gemus canvas through the Gemus MCP connection.
---

# Working With Gemus

Use the installed MCP tools to operate the user's live Gemus canvas. Tool loading is deferred: when a required tool is absent, call `tool_search` with its exact name before concluding it is unavailable.

## Workflow Contract

1. For a workflow with three or more connected nodes, search for and call `blueprint`; do not hand-build it with `canvas_edit`. Use the editor only for focused changes. When creating a new workflow, always set `blueprint`'s `name` to what the user ultimately wants to design — the final deliverable (e.g. "Coffee brand identity", "Product hero video"). Never leave it unset or use a generic/technical name like "MCP …", "Workflow", or a node label.
2. Call `blueprint` once per phase. Reuse the first returned `workflowId` on every later call. For phase 2+, read actual prior outputs, then anchor the phase with `after`.
3. Give every analyzer, brainstorm, and generated-text node its own dedicated prompt written for that node. Connect research or other generated material to its `reference` port, never its `prompt` port.
4. Run `execute` as a dry run first and show any platform-credit estimate before requesting confirmation. For images, also load `gemus-codex-imagen`.
5. Call `open_canvas` once after obtaining the workflow ID. Then load and follow `browser:control-in-app-browser` and immediately navigate the returned one-time URL in the user-visible browser selected by that skill. Calling `open_canvas`, printing the URL, or handing it to the user is not complete. Do not use `browser_navigate`, `browser_snapshot`, standalone Playwright MCP, chrome-devtools, or other external or headless browser-control surfaces: they can consume the link outside the visible Browser. This restriction does not prohibit the Browser skill's own runtime. Only report `url` and `fallbackEditorUrl` as diagnostics when the Browser skill is unavailable or its documented troubleshooting still cannot connect.

Use `node_list` for node/model discovery and `canvas_read` for current IDs, outputs, ports, and status.

## Presentation decks

When the user wants Codex to design and fill a presentation directly on the Gemus canvas, use the MCP PPT editor instead of executing the `gen-ppt` node's configured generation model:

1. Ensure a `gen-ppt` node exists, creating one with `canvas_edit` when needed. Search for `ppt_edit` with `tool_search` if it is not already loaded.
2. Call `ppt_edit` with `action: "list_skeletons"` before outlining or writing slides. Filter by `kind` when useful and use only a returned `skeletonId`; never guess one. Read the selected style resource, such as `skill://corporate`, for visual guidance.
3. Call `ppt_edit` with `action: "init_deck"` once. Keep the returned revision, starting at `0` for a new deck.
4. Call `write_slide_html` once per slide and pass the revision returned by the previous write. Omit `slideId` to create a new slide. Pass `slideId` to update an existing slide.
5. Read the optional `critique` returned by each persisted `write_slide_html` or `patch_slide`. If `critique.pass` is false and `critique.correctionAllowed` is true, apply exactly one corrective round: prefer `patch_slide` for local text/image/class/style changes and use `write_slide_html` only for structural rewrites. The correction is re-evaluated automatically. If `correctionAllowed` is false, `critique` is absent, or it passes, continue; never poll or retry the evaluator.
6. For later edits, call `canvas_read(nodeId)` to get `deckSummary`, then `canvas_read(nodeId, slideId)` to read the target HTML before patching or rewriting it.

Do not call a retired structured slide-rendering action. Direct `ppt_edit` mutations do not use the `execute` dry-run/credit flow; only run the `gen-ppt` node when the user explicitly asks for its model-driven generation pipeline.

## Domain skills

Before planning or creating a domain-specific workflow, check whether a matching Gemus Skill exists; if it does and would improve output quality, read it first with `ReadMcpResourceTool({ uri: "skill://..." })`. **Skip it for simple tasks, or when you already have sufficient context.** Reading a skill is an optional quality boost, not a gate — never block or stall on it.

| Trigger | Skill |
| --- | --- |
| video, animation, storyboard, film | `skill://film-production` |
| interior, room, space | `skill://interior-design` |
| brand, logo, visual identity | `skill://brand-visual` |
| product, packaging, industrial | `skill://product-design` |

`ListMcpResourcesTool()` lists everything available, including `knowledge://model-guide` (model selection) and `knowledge://design-principles` (visual consistency across multiple assets).
