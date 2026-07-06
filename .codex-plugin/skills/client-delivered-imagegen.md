---
name: gemus-codex-imagen
description: Use when generating images for a Gemus gen-image node from Codex desktop — how codex-imagen + automatic canvas backfill works, and why a node staying empty during your turn is normal.
---

# codex-imagen on Gemus (desktop / direct MCP)

Canonical rules live at `GET https://gemus.ai/api/mcp/knowledge` (source of truth). This skill is the
irreducible steering you need locally so you don't self-correct away from the intended flow. It mirrors
the platform's `CLIENT_DELIVERED_GUIDANCE` (`src/lib/agent/core/prompt/workflowBehavior.ts`).

## Prefer codex-imagen for gen-image nodes

You have a native image generator (Codex's built-in imagegen). For gen-image nodes, set the node's
`config.model` to **`codex-imagen`** — it runs on **your own subscription** (0 Gemus platform credits)
and its output is backfilled onto the node automatically. This is the default; don't reach for a
platform provider (gemini/flux/…) unless the **user explicitly asks** for one.

## The flow (create → dry-run → generate locally → stop)

1. Add the gen-image node with `config.model = "codex-imagen"` FIRST (`blueprint` or `canvas_edit`).
   `execute` can only run a node that already exists.
2. `execute` with `dryRun:true` → returns `status:"awaiting_client_content"` + a `resolvedPrompt`
   (and `referenceImageUrls` for i2i).
3. Generate the image **locally** with your built-in imagegen, using `resolvedPrompt`.
4. **STOP.** Do NOT try to locate, read, convert, or submit the imagegen file — you cannot access it,
   and hand-submitting base64 has hung sessions. For a `codex-imagen` node you **never pass `content`**.

## A node staying empty during your turn is NORMAL — do not "fix" it

Backfill happens at **turn end** (a local companion reads your rollout and delivers the image to the
node). Throughout your turn the node shows no output, and `canvas_read(nodeId)` returns
`clientDeliveredStatus:"awaiting_backfill"` — that means **on track**, not broken.

- DO NOT loop `canvas_read` to "verify" the image landed.
- DO NOT switch the node's `config.model` to a platform provider to "recover".
- DO NOT try to self-forward the image.

If an `execute` call errors or the protocol feels stuck, **retry the two-phase flow** (node exists →
dryRun → generate → stop) — a confusing error is never a reason to abandon codex-imagen.

> Requires the local Gemus companion (`@gemus/mcp-proxy`) + its Stop hook trusted via `/hooks`. Without
> a trusted hook the image still lands on the canvas (as an orphan node), just not on the planned node.
