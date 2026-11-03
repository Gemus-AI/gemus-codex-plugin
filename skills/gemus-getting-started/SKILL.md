---
name: gemus-getting-started
description: Use when building, editing, running, or opening an AI design workflow on the Gemus canvas through the Gemus MCP connection.
---

# Working With Gemus

Use the installed MCP tools to operate the user's live Gemus canvas. If the host provides `tool_search`, load a missing tool by its exact name. Other hosts expose connected MCP tools directly; use their tool inventory and report a missing connection instead of requiring an unavailable discovery tool.

## Delivery Surface

When the requested deliverable is a Gemus workflow, keep planning and implementation on the Gemus MCP surface. MCP mutations are the implementation: use `edit` with `op: "planCreate" / "planUpdate" / "planDecide"` for durable decisions, `op: "graph"` for multi-node phases, and structure operations for focused changes, `execute` for generation, and `publish_workflow` for a confirmed direct publish.

Do not create local implementation plans, specs, apps, or documents as substitutes for those canvas operations. Local filesystem work is limited to reading user-provided files or preparing assets for upload unless the user explicitly asks for a local code or document deliverable.

Browser control after `open_canvas` is for opening the returned one-time URL and visual inspection only. It does not replace MCP reads, mutations, execution, or publishing.

## Workflow Contract

1. Resolve the connection mode and target before the first mutation. In Bridge mode, the platform session's active workflow is authoritative: edit it in place and omit workflowId, or pass that exact ID. The user must open another workflow to change targets. In standalone MCP clients (Codex, DSH, and other harnesses), there is no current-canvas binding. Reuse an explicit workflowId; when the user names an existing workflow, call `workflow_list` with its exact `name`, reuse the ID only when exactly one match is returned, and ask the user to disambiguate zero or multiple matches. If a new canvas is needed, call `workflow_create` with explicit `workspaceTarget` (`personal` or `active`), `name`, and `idempotencyKey`; keep the returned `workflowId` and use `edit` afterward. Edit does not create workflows. Never guess a target.
2. For a workflow with three or more connected nodes, load `edit` and use `op: "graph"`; use focused structure operations for small changes. Name each new zone for its design purpose. Declare deliverables in the graph or create the plan first; follow returned node and zone IDs.
3. Call `edit` with one graph per phase. Reuse the same workflowId on later calls. For phase 2+, read actual prior outputs and connect existingNodeId to the new nodes; extend an existing zone with `zone: { id }`.
4. Give every analyzer, brainstorm, and generated-text node its own dedicated prompt written for that node. Connect research or other generated material to its `reference` port, never its `prompt` port.
5. Run `execute` as a dry run first and show any platform-credit estimate before requesting confirmation. In Codex, also load `gemus-codex-imagen` for local image generation and canvas backfill. Other hosts use the providers available through `execute`; they do not require the Codex companion skill.
6. Call `open_canvas` once after obtaining the workflow ID. In Codex, load and follow `browser:control-in-app-browser`, navigating the one-time URL in its selected user-visible browser. Do not use `browser_navigate`, `browser_snapshot`, standalone Playwright MCP, chrome-devtools, or other external/headless browser surfaces in this Codex flow: they can consume the link outside the visible Browser. The Browser skill's own runtime is allowed. In DSH and other MCP hosts, use the host's available user-visible browser capability. If the host cannot open it, provide `url` and `fallbackEditorUrl` and say that the user must open it; never claim the canvas opened without evidence.

Use `read` with `requests: [{ target: "contract" }]` for node/model discovery and `target: "workspace" / "node"` for current IDs, outputs, ports, and status. Every write requires idempotencyKey (8–128 safe characters): keep it for retries of the same request, use a new key for a changed operation. Read receipts item by item; an accepted execute item is not proof of completion—check its matching wait handle or read the canvas.

### Minimal graph request

Replace the workflow ID with the returned ID. Graph deliverable references are zero-based: `new:0` is the first entry. Use returned node IDs in later calls; discover node/model contracts before filling their config.

```json
{
  "workflowId": "workflow-id",
  "idempotencyKey": "getting-started-graph-01",
  "requests": [{
    "op": "graph",
    "deliverables": [{ "title": "Launch poster", "kind": "image-set" }],
    "groups": [{
      "zone": { "name": "Launch poster" },
      "deliverableIds": ["new:0"],
      "nodes": [
        { "bind": "brief", "nodeType": "text-prompt", "config": { "text": "A minimal ceramic studio launch poster" } },
        { "bind": "poster", "nodeType": "gen-image-generation", "deliverableId": "new:0", "config": { "model": "gemini-2.5-flash-image", "mode": "text-to-image" } }
      ],
      "edges": [{ "from": "brief", "fromPort": "text", "to": "poster", "toPort": "prompt" }]
    }]
  }]
}
```

## Presentation decks

A workflow carries **at most one `gen-ppt` node**. It is the deck's identity: its node ID owns the revision, the plan and the slide bindings. Creating a second one abandons that state instead of repairing it.

Pick one authoring mode per node and stay in it:

| Mode | When | What runs | What is forbidden |
| --- | --- | --- | --- |
| Direct authoring | You are designing and filling the deck (the default when the user asks Codex to make the PPT) | `ppt_edit` init/plan/write/finalize | Never `execute` the `gen-ppt` node — it overwrites the deck output with model-generated content |
| Model pipeline | The user explicitly asks for the node's own generation model to produce the deck | `execute` on the `gen-ppt` node | Do not also author the same node with `ppt_edit` in the same pass |

Model constraints are scoped to what they name. "Use `gpt-image-2` for all image generation" applies to `gen-image-generation` nodes only; never propagate an image model onto `gen-ppt`, text, or analysis nodes. `edit` returns `completions` when it auto-corrects an incompatible model — read them and tell the user what changed.

When the canvas already holds real design imagery, plan an image-led deck: every page names its visual protagonist and each asset's evidence role. Support a technical claim with the technical artefact — a plan, section, exploded view or detail — because an aerial or hero render does not stand in for one. Caption each asset with what THAT asset shows, mark annotated assets and give them `contain`, and do not make one image the protagonist of several pages. `read` with `target: "ppt-plan-check"` and the current revision reports all of this deterministically before any slide exists; fix the plan there rather than meeting the same defects as critique findings afterwards.

When the user wants Codex to design and fill a presentation directly on the Gemus canvas, use the MCP PPT editor instead of executing the `gen-ppt` node's configured generation model:

1. Find the workflow's existing `gen-ppt` node with `read` target `workspace` and reuse it. Create one with `edit` op `add` **only when the canvas has none**; when one already exists you may not create a second. Search for `ppt_edit` with `tool_search` if it is not already loaded.
2. Read the selected `ppt-style` profile to discover its skeleton catalog before outlining or writing slides. Use only a returned `skeletonId`; never guess one. Read the selected style resource, such as `skill://corporate`, for visual guidance.
3. Every `ppt_edit` write uses `{ idempotencyKey, request: { op, nodeId, ... } }`. Call `ppt_edit` with `request: { op: "init_deck", nodeId, title }` once. Keep the returned revision, starting at `0` for a new deck.
4. Call `write_slide_html` once per slide and pass the revision returned by the previous write. Omit `slideId` to create a new slide. Pass `slideId` to update an existing slide. Call `get_layout_seed` for the row first and act on its `assetHints` — natural aspect ratio, image-box aspect ratio, predicted `object-fit:cover` crop, whether the asset is annotated, and the recommended fit. None of that is computable from the canvas or the seed alone.
5. Read the optional `critique` returned by each persisted `write_slide_html` or `patch_slide`. If `critique.pass` is false and `critique.correctionAllowed` is true, apply exactly one corrective round, routed by `critique.repairClass`: `local-style` → `patch_slide`; `structural-layout` → rewrite the slide with `write_slide_html`; `asset-semantic` → rebind the right evidence (replan first when the plan is what is wrong) and rewrite; `invalid-source` → swap the unusable asset or drop it to a lesser role. The correction is re-evaluated automatically. If `correctionAllowed` is false, `critique` is absent, or it passes, continue; never poll or retry the evaluator.
6. For later edits, call `read` with `requests: [{ target: "node", address: "node://<nodeId>" }]` to get `deckSummary`, then `read` target `node` with that address and `slideId` to read the target HTML before patching or rewriting it.

Outline `assets` contains objects with a canvas asset `label` and optional `role` (`hero`, `evidence`, `background`, or `decoration`), never bare strings. For example, with the existing deck node and actual canvas asset label:

```json
{
  "workflowId": "workflow-id",
  "idempotencyKey": "getting-started-outline-01",
  "request": {
    "op": "create_outline",
    "nodeId": "deck-node-id",
    "rows": [{ "title": "The proposal", "intent": "Introduce the concept", "assets": [{ "label": "Hero render", "role": "hero" }] }]
  }
}
```

For PPT HTML, use `read` with `slideId` alone: `{ workflowId, requests: [{ target: "node", address: "node://<deckNodeId>", slideId: "<slideId>" }] }`. `includeHtml:true` reads a `gen-webpage` document; it is not a PPT selector and cannot be combined with `slideId` or `sectionId`.

### Recovering the same node

Every failure below is repaired **on the original nodeId**. Exhaust this table before even considering a new node; a second `gen-ppt` node is not a recovery step.

| Symptom | Recovery |
| --- | --- |
| `code: 'PPT_REVISION_CONFLICT'` | Retry the same call with the returned `currentRevision` |
| `code: 'PPT_DECK_MALFORMED'` | `init_deck` with `force: true` on that same node |
| `init_deck` failed or the node holds model-generated, non-deck output | `read` with `requests: [{ target: "node", address: "node://<nodeId>" }]` for `deckSummary`, then `init_deck` with `force: true` on that same node |
| Transport/HTTP error with unknown outcome | `read` with `requests: [{ target: "node", address: "node://<nodeId>" }]` to learn the persisted revision, then continue from it |

Route a failed `critique` by `repairClass` — what is actually wrong — not by how cheap the fix looks. The corrective round happens once, so do not spend it on a patch that cannot reach the cause.

Do not call a retired structured slide-rendering action. Direct `ppt_edit` mutations do not use the `execute` dry-run/credit flow; only run the `gen-ppt` node when the user explicitly asks for its model-driven generation pipeline.

## Bridge questions

In Bridge mode, ask_user_question accepts `{ idempotencyKey, request: { kind: "question", questions: [...] } }`. Ask all independent questions together (1–8), with optional context, image options and multiSelect. Answers return in the same call as ordered strings or arrays. Respect decline/cancel. Retrying a finalized key replays the answer; after a disconnection an unfinished question may be asked again. Other connection modes do not expose this tool.

## Domain skills

Before planning or creating a domain-specific workflow, check whether a matching Gemus Skill exists; if it does and would improve output quality, read it first with `ReadMcpResourceTool({ uri: "skill://..." })`. **Skip it for simple tasks, or when you already have sufficient context.** Reading a skill is an optional quality boost, not a gate — never block or stall on it.

| Trigger | Skill |
| --- | --- |
| video, animation, storyboard, film | `skill://film-production` |
| interior, room, space | `skill://interior-design` |
| brand, logo, visual identity | `skill://brand-visual` |
| product, packaging, industrial | `skill://product-design` |

`ListMcpResourcesTool()` lists everything available, including `knowledge://model-guide` (model selection) and `knowledge://design-principles` (visual consistency across multiple assets).

Codex-generated images without a corresponding node remain on the local machine and do not land on the canvas.
