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
8. **Verify and recover.** Dry-run credit-bearing execution first. After approval, run and visually inspect outputs. For PPT, follow the presentation node lifecycle below. If `correctionAllowed` is false, delete and recreate the invalid slide; do not retry an illegal correction. Completion requires a final `passed` result.
9. **Record and publish deliberately.** Run the exit gate, then upgrade the checkpoint with `record`. `publish_workflow` is non-idempotent; publish only with explicit confirmation for the named workflow or approved batch.

## Presentation node lifecycle

A workflow carries **at most one `gen-ppt` node**. That node ID is the deck's identity — it owns the revision, the plan and the slide bindings — so every later phase reuses it instead of creating a replacement.

1. **Create it once, in a phase blueprint.** Build the `gen-ppt` node and its outline/material connections inside the `blueprint` call for the phase that introduces delivery. Later phases may add a missing edge or config with a focused `canvas_edit`, but may not create an alternative node.
2. **Choose one authoring mode and stay in it.** Direct authoring means `ppt_edit` owns init/plan/write/finalize and you never `execute` the `gen-ppt` node. Model pipeline means the node's own generation model produces the deck via `execute`, and only when the user explicitly asked for it; do not also author that node directly in the same pass. Record the choice as `pptAuthoringMode` in the ledger.
3. **Scope model constraints to the nodes they name.** A request such as “use `gpt-image-2` for all image generation” constrains `gen-image-generation` only. Never propagate an image model onto `gen-ppt`, text, or analysis nodes. `blueprint` returns `warnings` when it auto-corrects an incompatible model — read them and report what changed.
4. **Serialize deck mutations.** You may collect every critique first, but each mutation of one deck runs alone and carries the latest revision. Only different workflows or different decks may proceed in parallel.
5. **Recover on the original node.** `canvas_read` for `deckSummary` and the error code, then act: `PPT_REVISION_CONFLICT` → retry with `currentRevision`; `PPT_DECK_MALFORMED` or a failed/model-polluted init → `init_deck` with `force: true` on that same node; an unknown transport outcome → read the persisted revision and continue from it. Creating a new PPT node before that sequence is exhausted is forbidden.
6. **Plan the evidence before the pixels.** When the batch has produced real design imagery, the deck is image-led: every page names its visual protagonist and each asset's evidence role, technical claims carry technical artefacts rather than an aerial render, each asset gets its own caption, annotated assets use `contain`, and no image is the protagonist of several pages. `validate_plan` checks all of this deterministically before a slide exists — fix the plan there.
7. **Route the correction by its cause.** `critique.repairClass` names it: `local-style` takes `patch_slide`; `structural-layout` takes a whole-slide `write_slide_html` rewrite; `asset-semantic` means rebind the right evidence (replan first when the plan is wrong) and then rewrite; `invalid-source` means swap the asset. The corrective round happens once — do not spend it on a patch that cannot reach the cause. Only when `correctionAllowed` is false do you delete and recreate the slide, still on the same deck.
8. **Clean up before recording.** Delete only PPT nodes this batch created, that are empty, and that the final deck replaced. Never delete a node that existed before the batch.

## Exit gate

Before recording completion, verify the promised node count or minimum, forbidden node types, video policy, site-to-design dependency, image model and credit configuration, planned zones, delivery pages, and final quality status. Also verify `gen-ppt count === 1` on the delivered canvas and that no empty PPT orphan created by this batch survives. Report the actual values and the ledger resume state; do not substitute “workflow created” for evidence.

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
| Workflow already has a PPT node | Reuse that nodeId; never create a second `gen-ppt` |
| PPT init, HTTP or revision failure | Recover on the same node before considering anything else |
| Codex is authoring the deck | Direct mode: `ppt_edit` only, never `execute` that node |
| Canvas holds real design imagery | Plan an image-led deck: name each page's visual protagonist and evidence role |
| PPT correction rejected | When `correctionAllowed=false`, delete and recreate |
| Final handoff | Run exit gate, require `passed`, then `record` |

## Example

Seed: “独居老人夜间用药辅助，做一个完整工作流。”

Normalize it as a safety-sensitive product problem with low-light use, memory uncertainty, and caregiver handoff. Depending on the dominant uncertainty, choose mechanism-first (error-proofing), journey-first (night-time sequence), or evidence-first (medication-risk findings). Do not automatically add brand, video, and PPT nodes. A valid output could instead be an annotated interaction prototype plus failure-mode test evidence.

## Stop conditions

Stop and replan when the candidate duplicates a prior topology or story, the source has silently become a fixed template, outputs do not support the delivery claims, a checkpoint lacks a safe next action, or publishing scope is ambiguous. Surface the ledger evidence rather than hiding an override.
