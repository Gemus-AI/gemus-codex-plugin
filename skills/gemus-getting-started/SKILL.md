---
name: gemus-getting-started
description: Use when building, editing, running, or opening an AI design workflow on the Gemus canvas through the Gemus MCP connection.
---

# Working With Gemus

Use the installed MCP tools to operate the user's live Gemus canvas. Tool loading is deferred: when a required tool is absent, call `tool_search` with its exact name before concluding it is unavailable.

## Delivery Surface

When the requested deliverable is a Gemus workflow, keep planning and implementation on the Gemus MCP surface. MCP mutations are the implementation: use `project_plan` for durable decisions, `blueprint` for multi-node phases, `canvas_edit` for focused changes, `execute` for generation, and `publish_workflow` for a confirmed direct publish.

Do not create local implementation plans, specs, apps, or documents as substitutes for those canvas operations. Local filesystem work is limited to reading user-provided files or preparing assets for upload unless the user explicitly asks for a local code or document deliverable.

Browser control after `open_canvas` is for opening the returned one-time URL and visual inspection only. It does not replace MCP reads, mutations, execution, or publishing.

## Workflow Contract

1. Resolve the connection mode and target before the first mutation. In Bridge mode, the platform session's active workflow is authoritative: edit it in place and never try to redirect or create elsewhere with `workflowId` or `workspaceTarget`; the user must open or start the conversation in another workflow to change targets. In Mode B (the Codex plugin), there is no current-canvas binding. Reuse an explicit `workflowId`; when the user names an existing workflow, call `workflow_list` with its exact `name`, reuse the ID only when exactly one match is returned, and ask the user to disambiguate zero or multiple matches. For a new workflow, pass `workspaceTarget: "personal"` when the user requests personal space or `workspaceTarget: "active"` only when the user explicitly chooses the active workspace. Never send both fields. If no destination is established, ask instead of guessing; omitting both fields fails closed. The presence of `workflow_list` identifies Mode B because Bridge intentionally does not expose it.
2. For a workflow with three or more connected nodes, search for and call `blueprint`; do not hand-build it with `canvas_edit`. Use the editor only for focused changes. When creating a new workflow, always set `blueprint`'s `name` to what the user ultimately wants to design — the final deliverable (e.g. "Coffee brand identity", "Product hero video"). Never leave it unset or use a generic/technical name like "MCP …", "Workflow", or a node label.
3. Call `blueprint` once per phase. Reuse the first returned `workflowId` on every later call. For phase 2+, read actual prior outputs, then anchor the phase with `after`.
4. Give every analyzer, brainstorm, and generated-text node its own dedicated prompt written for that node. Connect research or other generated material to its `reference` port, never its `prompt` port.
5. Run `execute` as a dry run first and show any platform-credit estimate before requesting confirmation. For images, also load `gemus-codex-imagen`.
6. Call `open_canvas` once after obtaining the workflow ID. Then load and follow `browser:control-in-app-browser` and immediately navigate the returned one-time URL in the user-visible browser selected by that skill. Calling `open_canvas`, printing the URL, or handing it to the user is not complete. Do not use `browser_navigate`, `browser_snapshot`, standalone Playwright MCP, chrome-devtools, or other external or headless browser-control surfaces: they can consume the link outside the visible Browser. This restriction does not prohibit the Browser skill's own runtime. Only report `url` and `fallbackEditorUrl` as diagnostics when the Browser skill is unavailable or its documented troubleshooting still cannot connect.

Use `node_list` for node/model discovery and `canvas_read` for current IDs, outputs, ports, and status.

## Presentation decks

A workflow carries **at most one `gen-ppt` node**. It is the deck's identity: its node ID owns the revision, the plan and the slide bindings. Creating a second one abandons that state instead of repairing it.

Pick one authoring mode per node and stay in it:

| Mode | When | What runs | What is forbidden |
| --- | --- | --- | --- |
| Direct authoring | You are designing and filling the deck (the default when the user asks Codex to make the PPT) | `ppt_edit` init/plan/write/finalize | Never `execute` the `gen-ppt` node — it overwrites the deck output with model-generated content |
| Model pipeline | The user explicitly asks for the node's own generation model to produce the deck | `execute` on the `gen-ppt` node | Do not also author the same node with `ppt_edit` in the same pass |

Model constraints are scoped to what they name. "Use `gpt-image-2` for all image generation" applies to `gen-image-generation` nodes only; never propagate an image model onto `gen-ppt`, text, or analysis nodes. `blueprint` returns `warnings` when it auto-corrects an incompatible model — read them and tell the user what changed.

When the canvas already holds real design imagery, plan an image-led deck: every page names its visual protagonist and each asset's evidence role. Support a technical claim with the technical artefact — a plan, section, exploded view or detail — because an aerial or hero render does not stand in for one. Caption each asset with what THAT asset shows, mark annotated assets and give them `contain`, and do not make one image the protagonist of several pages. `validate_plan` reports all of this deterministically before any slide exists; fix the plan there rather than meeting the same defects as critique findings afterwards.

When the user wants Codex to design and fill a presentation directly on the Gemus canvas, use the MCP PPT editor instead of executing the `gen-ppt` node's configured generation model:

1. Find the workflow's existing `gen-ppt` node with `canvas_read` and reuse it. Create one with `canvas_edit` **only when the canvas has none**; when one already exists you may not create a second. Search for `ppt_edit` with `tool_search` if it is not already loaded.
2. Call `ppt_edit` with `action: "list_skeletons"` before outlining or writing slides. Filter by `kind` when useful and use only a returned `skeletonId`; never guess one. Read the selected style resource, such as `skill://corporate`, for visual guidance.
3. Call `ppt_edit` with `action: "init_deck"` once. Keep the returned revision, starting at `0` for a new deck.
4. Call `write_slide_html` once per slide and pass the revision returned by the previous write. Omit `slideId` to create a new slide. Pass `slideId` to update an existing slide. Call `get_layout_seed` for the row first and act on its `assetHints` — natural aspect ratio, image-box aspect ratio, predicted `object-fit:cover` crop, whether the asset is annotated, and the recommended fit. None of that is computable from the canvas or the seed alone.
5. Read the optional `critique` returned by each persisted `write_slide_html` or `patch_slide`. If `critique.pass` is false and `critique.correctionAllowed` is true, apply exactly one corrective round, routed by `critique.repairClass`: `local-style` → `patch_slide`; `structural-layout` → rewrite the slide with `write_slide_html`; `asset-semantic` → rebind the right evidence (replan first when the plan is what is wrong) and rewrite; `invalid-source` → swap the unusable asset or drop it to a lesser role. The correction is re-evaluated automatically. If `correctionAllowed` is false, `critique` is absent, or it passes, continue; never poll or retry the evaluator.
6. For later edits, call `canvas_read(nodeId)` to get `deckSummary`, then `canvas_read(nodeId, slideId)` to read the target HTML before patching or rewriting it.

### Recovering the same node

Every failure below is repaired **on the original nodeId**. Exhaust this table before even considering a new node; a second `gen-ppt` node is not a recovery step.

| Symptom | Recovery |
| --- | --- |
| `code: 'PPT_REVISION_CONFLICT'` | Retry the same call with the returned `currentRevision` |
| `code: 'PPT_DECK_MALFORMED'` | `init_deck` with `force: true` on that same node |
| `init_deck` failed or the node holds model-generated, non-deck output | `canvas_read(nodeId)` for `deckSummary`, then `init_deck` with `force: true` on that same node |
| Transport/HTTP error with unknown outcome | `canvas_read(nodeId)` to learn the persisted revision, then continue from it |

Route a failed `critique` by `repairClass` — what is actually wrong — not by how cheap the fix looks. The corrective round happens once, so do not spend it on a patch that cannot reach the cause.

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
