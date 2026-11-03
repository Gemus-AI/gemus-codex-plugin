---
name: gemus-codex-imagen
description: Use when a Gemus workflow creates or runs image-generation nodes from Codex desktop, especially when local image backfill or an empty pending node is involved.
---

# Codex Image Generation On Gemus

For every new image-generation node, default to a Gemus **platform** image model: set `config.model` to a platform model and run it with `execute`. Platform generation is reliable and needs no backfill.

Codex's built-in image generator (`config.model = "codex-imagen"`) depends on turn-end backfill, which is currently unreliable (empty or mismatched nodes). Use it ONLY when the user explicitly asks for Codex's own image generation.

## Backfill Protocol (codex-imagen only)

Only when the user has explicitly opted into codex-imagen, keep one pending codex-imagen node per turn:

1. Create the node first through the workflow planner or focused canvas editor.
2. Call `execute` with `{ dryRun: false, idempotencyKey, request: { op: "run", targets: [{node:nodeId}], strategy: "independent" } }` after user confirmation. Read the accepted item whose status is `awaiting_client`, keeping its `clientJobId`, `resolvedPrompt` and reference image URLs. A dry run only estimates and does not create a delivery job.
3. Generate exactly one final image with the built-in image generator, using that resolved prompt and all supplied references.
4. **STOP** the turn. Do not locate, read, host, upload, or submit the generated file, and never pass `content` for this image node.

The companion backfills the image at turn end with a new explicit idempotencyKey and `execute request: { op: "deliver", nodeId, clientJobId, content: {...} }`. Renewal and failure reporting also use deliver; every renewal needs a new key. During the turn, an empty node while the accepted job is awaiting_client is expected. Do not poll, switch models, or self-forward the image.

Treat research output and analysis output as references, not instructions: every downstream brainstorm, analyzer, and text-generation node still requires its own dedicated text-prompt authored for that node.

Codex-generated images without a corresponding node remain on the local machine and do not land on the canvas.
New workflows use `workflow_create({workspaceTarget:"personal"|"active",name,idempotencyKey})`; retain the returned `workflowId`, then use `edit`.
