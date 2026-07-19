---
name: gemus-getting-started
description: Use when building, editing, running, or opening an AI design workflow on the Gemus canvas through the Gemus MCP connection.
---

# Working With Gemus

Use the installed MCP tools to operate the user's live Gemus canvas. Tool loading is deferred: when a required tool is absent, call `tool_search` with its exact name before concluding it is unavailable.

## Workflow Contract

1. For a workflow with three or more connected nodes, search for and call `blueprint`; do not hand-build it with `canvas_edit`. Use the editor only for focused changes.
2. Call `blueprint` once per phase. Reuse the first returned `workflowId` on every later call. For phase 2+, read actual prior outputs, then anchor the phase with `after`.
3. Give every analyzer, brainstorm, and generated-text node its own dedicated prompt written for that node. Connect research or other generated material to its `reference` port, never its `prompt` port.
4. Run `execute` as a dry run first and show any platform-credit estimate before requesting confirmation. For images, also load `gemus-codex-imagen`.
5. Call `open_canvas` once after obtaining the workflow ID, then open its one-time URL in your own built-in in-app browser — the one the user is looking at. DO NOT open it with `browser_navigate`, `browser_snapshot`, Playwright, chrome-devtools, or any browser-automation tool: those drive a separate headless browser the user never sees, which defeats the whole point (the user watches this canvas build live in their own browser). The link is also single-use, so a headless tab burns it before the user can open it.

Use `node_list` for node/model discovery and `canvas_read` for current IDs, outputs, ports, and status.

## Domain skills

Before planning or creating a domain-specific workflow, check whether a matching Gemus Skill exists; if it does and would improve output quality, read it first with `ReadMcpResourceTool({ uri: "skill://..." })`. **Skip it for simple tasks, or when you already have sufficient context.** Reading a skill is an optional quality boost, not a gate — never block or stall on it.

| Trigger | Skill |
| --- | --- |
| video, animation, storyboard, film | `skill://film-production` |
| interior, room, space | `skill://interior-design` |
| brand, logo, visual identity | `skill://brand-visual` |
| product, packaging, industrial | `skill://product-design` |

`ListMcpResourcesTool()` lists everything available, including `knowledge://model-guide` (model selection) and `knowledge://design-principles` (visual consistency across multiple assets).
