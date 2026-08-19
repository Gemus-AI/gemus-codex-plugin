---
name: gemus-community-batch-authoring
description: Use when a Gemus owner or curator is turning a document, folder, or loose set of ideas into many distinct, community-quality Gemus workflows and needs delivery-first planning, anti-homogeneity checks, resumable execution, or controlled publishing. Do not use for an ordinary user's one-off workflow.
---

# Gemus Community Batch Authoring

Create a varied portfolio of Gemus workflows from seed briefs without forcing every idea through one topology, story, deliverable, or visual formula. This is an authoring layer for Codex desktop; the workflows themselves still live on Gemus.

## Required setup

Load and follow [`gemus-getting-started`](../gemus-getting-started/SKILL.md) before using Gemus MCP tools. At the start of a batch, read:

- [Seed brief contract](references/seed-brief.md)
- [Workflow archetypes](references/workflow-archetypes.md)
- [Batch ledger](references/batch-ledger.md)

If a matching Gemus domain skill exists, use it for domain judgment. Keep local files limited to the source material and the batch ledger; all workflow planning and implementation stays on the Gemus MCP surface.

## Authoring loop

1. **Normalize, do not transcribe.** Convert each source item into the seed brief contract. Treat prescribed stages and node lists as hints unless the user marks them fixed. Add reversible assumptions when the seed is vague.
2. **Write the delivery contract when the destination is fixed.** If the user specifies a PPT, report, page count, or audience, define its narrative spine, per-page evidence map, asset roles, and quality gate before choosing nodes. Keep deliverables open when the destination is not fixed.
3. **Choose a structure from the uncertainty.** Inspect the ledger report, name the hard decision, and choose an underused archetype. The delivery contract constrains evidence; it does not replace the archetype.
4. **Ground without copying.** Use `search_community` and `study_community_work` on one or two relevant works unless the user requests a clean-room build. Extract principles, then differ materially in reasoning, evidence, and output.
5. **Plan staged execution.** Use `project_plan` for durable decisions and `blueprint` one phase at a time. For site-dependent design, execute site/anchor → concept → locked hero → derivative evidence → delivery. Read real upstream outputs before building the next phase, then `checkpoint` the ledger.
6. **Build evidence, not node volume.** Give each reasoning node one job, connect evidence to reference ports, and build only assets that prove a delivery claim. For the same object or building, derive front/side/back and other consistent views with `multi-angle-view`; use separate image-generation nodes for genuinely different spaces, moments, or scenes, anchored to the site image and locked hero where relevant.
7. **Check structure before costly execution.** Read the canvas with `canvas_read`, create a candidate JSON, and run `batch-ledger.mjs check`. If it is too similar, change the causal structure, evidence grammar, or decision object—not merely labels, prompts, or colors.
8. **Verify and recover.** Dry-run credit-bearing execution first. After approval, run and visually inspect outputs. For PPT, serialize mutations per deck, always pass the latest revision, fix all flagged slides in one batch, and finalize again. If `correctionAllowed` is false, delete and recreate the invalid slide; do not retry an illegal correction. Completion requires a final `passed` result.
9. **Record and publish deliberately.** Run the exit gate, then upgrade the checkpoint with `record`. `publish_workflow` is non-idempotent; publish only with explicit confirmation for the named workflow or approved batch.

## Exit gate

Before recording completion, verify the promised node count or minimum, forbidden node types, video policy, site-to-design dependency, image model and credit configuration, planned zones, delivery pages, and final quality status. Report the actual values and the ledger resume state; do not substitute “workflow created” for evidence.

## Portfolio gates

- For batches of 40 or more, target at least six archetypes; no archetype should exceed 20% without a documented reason.
- Do not let presentation decks become the default terminal output. When PPT is fixed, make every page claim traceable to generated or reasoned evidence.
- Treat a similarity score of `0.78` or higher as a replan signal. An intentional series may override it only with `similarityOverrideReason`.
- Record meaningful differentiation axes such as audience, evidence source, branching logic, interaction mode, temporal pattern, narrative spine, visual grammar, or decision object—not surface adjectives.

## Quick reference

| Situation | Required move |
| --- | --- |
| Fixed PPT/report | Write delivery contract and evidence map first |
| Site-dependent design | Generate and lock the site before design derivatives |
| Same building, many angles | Use `multi-angle-view` from the locked hero |
| Different scene or space | Use separate generation, grounded by site/hero references |
| Long or interrupted batch | `checkpoint`, then resume from `nextAction` |
| PPT correction rejected | When `correctionAllowed=false`, delete and recreate |
| Final handoff | Run exit gate, require `passed`, then `record` |

## Example

Seed: “独居老人夜间用药辅助，做一个完整工作流。”

Normalize it as a safety-sensitive product problem with low-light use, memory uncertainty, and caregiver handoff. Depending on the dominant uncertainty, choose mechanism-first (error-proofing), journey-first (night-time sequence), or evidence-first (medication-risk findings). Do not automatically add brand, video, and PPT nodes. A valid output could instead be an annotated interaction prototype plus failure-mode test evidence.

## Stop conditions

Stop and replan when the candidate duplicates a prior topology or story, the source has silently become a fixed template, outputs do not support the delivery claims, a checkpoint lacks a safe next action, or publishing scope is ambiguous. Surface the ledger evidence rather than hiding an override.
