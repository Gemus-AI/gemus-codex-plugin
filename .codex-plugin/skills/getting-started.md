---
name: gemus-getting-started
description: Use when the user wants to build or run an AI design workflow on the Gemus canvas via the gemus MCP server.
---

# Working with Gemus (Mode B — direct MCP)

You are connected to the Gemus remote MCP server through the local `@gemus/mcp-proxy`
companion, which owns upstream auth with the user's own `mak_` API key (no browser
session). You operate on the user's Gemus account.

## Core loop

1. Use `blueprint` to scaffold a workflow graph from a plain-language goal, or
   `canvas_edit` to add/modify individual nodes.
2. Use `execute` (defaults to a dry-run cost estimate first) to run AI generation.
   Platform-provider models spend the user's **Gemus platform credits**; the
   client-delivered `codex-imagen` / `codex-text` models run on the user's **own Codex
   subscription** (0 platform credits) — see the `gemus-codex-imagen` skill.
3. Use `open_canvas` to hand the user a one-time deep link to view/continue the result
   at gemus.ai.

## Authoritative behavior guidance

The live, canonical behavior rules (risk tiers, prompt-writing, hero-node conventions,
the exact tool surface for this connection) are served by the server at
`GET https://gemus.ai/api/mcp/knowledge`. Treat that endpoint as the source of truth;
this file is only an orientation. Tools requiring a browser checkpoint UI
(`agent_iterate`, `checkpoint_respond`) are intentionally unavailable on this connection.
