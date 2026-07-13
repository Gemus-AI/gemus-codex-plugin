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
5. Call `open_canvas` once after obtaining the workflow ID and open its one-time URL in Codex's visible in-app browser. Do not consume the URL with browser automation.

Use `node_list` for node/model discovery and `canvas_read` for current IDs, outputs, ports, and status. Read matching Gemus resources before complex domain work.
