---
name: gemus-community-batch-authoring
description: Use when a Gemus owner or curator is turning a document, folder, or loose set of ideas into many distinct, community-quality Gemus workflows and needs expansion, anti-homogeneity checks, resumability, or controlled publishing. Do not use for an ordinary user's one-off workflow.
---

# Gemus Community Batch Authoring

Create a varied portfolio of Gemus workflows from seed briefs without forcing every idea through one topology, deliverable, or visual formula. This is an authoring layer for Codex desktop; the workflows themselves still live on Gemus.

## Required setup

Load and follow [`gemus-getting-started`](../gemus-getting-started/SKILL.md) before using Gemus MCP tools. At the start of a batch, read:

- [Seed brief contract](references/seed-brief.md)
- [Workflow archetypes](references/workflow-archetypes.md)
- [Batch ledger](references/batch-ledger.md)

If a matching Gemus domain skill exists, use it for domain judgment. Keep local files limited to the source material and the batch ledger; all workflow planning and implementation stays on the Gemus MCP surface.

## Authoring loop

1. **Normalize, do not transcribe.** Convert each source item into the seed brief contract. Treat prescribed stages and node lists as hints unless the user marks them fixed. For a vague seed, add reasonable assumptions and creative latitude; ask only when a choice changes audience, safety, spend, or publishing intent.
2. **Choose a structure from the uncertainty.** Inspect the ledger report, identify what must be learned or decided, and choose an underused archetype. Do not default to a universal research → ideate → generate → review → PPT chain.
3. **Ground without copying.** Use `search_community` and `study_community_work` on one or two relevant works unless the user requests a clean-room build. Extract principles, then make the new workflow materially different in structure, decision logic, and output.
4. **Plan and build in Gemus.** Use `project_plan` for durable decisions and `blueprint` one phase at a time. Read real upstream outputs before later phases. Give each reasoning node a dedicated prompt and connect evidence to reference ports.
5. **Check topology before generation.** Read the canvas with `canvas_read`, create a candidate JSON, and run `batch-ledger.mjs check`. If it is too similar, change the causal structure—not merely labels, prompts, or colors—and check again.
6. **Verify quality.** Dry-run credit-bearing execution first. After approval, run and visually inspect outputs. A unique graph with weak outputs is not community quality.
7. **Record and resume.** Record only after the workflow passes structural and output review. Use the ledger report before selecting the next seed.
8. **Publish deliberately.** `publish_workflow` is non-idempotent. Never publish without the user's explicit confirmation for the named workflow or approved batch.

## Portfolio gates

- For batches of 40 or more, target at least six archetypes; no archetype should exceed 20% without a documented reason.
- Do not let presentation decks become the default terminal output. Match deliverables to the actual user outcome.
- Treat a similarity score of `0.78` or higher as a replan signal. An intentional series may override it only with `similarityOverrideReason`.
- Record meaningful differentiation axes such as audience, evidence source, branching logic, interaction mode, temporal pattern, or deliverable—not surface adjectives.

## Example

Seed: “独居老人夜间用药辅助，做一个完整工作流。”

Normalize it as a safety-sensitive product problem with low-light use, memory uncertainty, and caregiver handoff. Depending on the dominant uncertainty, choose mechanism-first (error-proofing), journey-first (night-time sequence), or evidence-first (medication-risk findings). Do not automatically add brand, video, and PPT nodes. A valid output could instead be an annotated interaction prototype plus failure-mode test evidence.

## Stop conditions

Stop and replan when the candidate duplicates a prior topology, the source has silently become a fixed template, outputs do not support the promised community value, or publishing scope is ambiguous. Surface the ledger evidence rather than hiding an override.
