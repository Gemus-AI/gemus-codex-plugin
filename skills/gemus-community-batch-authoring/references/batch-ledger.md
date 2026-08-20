# Batch ledger

The ledger is durable memory for a multi-session authoring batch. Keep it beside the seed document or in the user's chosen batch workspace. Do not put it in Gemus product data or commit a user-specific ledger to the plugin.

## Candidate format

```json
{
  "id": "seed-001",
  "title": "Dose Light",
  "domain": "PRODUCT",
  "archetype": "mechanism-first",
  "workflowId": "optional-gemus-workflow-id",
  "status": "planned | built | generated | delivery",
  "resume": {
    "phase": "locked-hero",
    "nextAction": "generate-derivatives",
    "keyNodeIds": { "site": "n-site", "hero": "n-hero" },
    "pptNodeId": "agent_xxx",
    "pptAuthoringMode": "direct",
    "pptRevision": 18,
    "pptPlanValidated": true,
    "pptSlideBindings": [{ "planSlideId": "plan-slide-1", "slideId": "slide_x" }],
    "pptQualityStatus": "failed"
  },
  "nodes": [
    { "id": "n1", "type": "text-prompt" },
    { "id": "n2", "type": "image-generation" }
  ],
  "edges": [{ "source": "n1", "target": "n2" }],
  "deliverables": ["annotated-prototype"],
  "differentiationAxes": ["error-proofing", "low-light"],
  "similarityOverrideReason": "required only for an intentional similarity override"
}
```

## Presentation state

A candidate that touches a deck must carry its PPT state in `resume`, because a resumed session cannot rediscover it from the canvas alone:

| Field | Meaning |
| --- | --- |
| `pptNodeId` | The workflow's single `gen-ppt` node. Recovery reuses this ID; a second PPT node is never the answer. |
| `pptAuthoringMode` | `direct` (`ppt_edit` owns the deck, never `execute`) or `model` (the node's generation model owns it). |
| `pptRevision` | The revision the last successful mutation returned. The next mutation must pass it. |
| `pptPlanValidated` | Whether `validate_plan` returned no blocking issue at that revision. |
| `pptSlideBindings` | `planSlideId` → `slideId` pairs, so a resumed session updates slides instead of appending duplicates. |
| `pptQualityStatus` | The last `finalize_deck` outcome: `passed`, `failed` or `needs-review`. |

`checkpoint` rejects an unknown `pptAuthoringMode`, and rejects PPT state that omits `pptNodeId` — a revision with no node to apply it to is not resumable. `report` echoes these fields on every resumable entry, and `nextAction` must name the concrete next move at that revision, for example `rewrite plan-slide-8 structurally at revision 17`.

Node IDs and titles do not affect similarity. Use stable node `type` values from the actual canvas. Include every meaningful dependency edge; an incomplete candidate produces a misleading score.

## Commands

Run with the Node.js executable available to Codex:

```powershell
node scripts/batch-ledger.mjs init C:\path\batch-ledger.json --source C:\path\seeds.docx
node scripts/batch-ledger.mjs check C:\path\batch-ledger.json C:\path\candidate.json
node scripts/batch-ledger.mjs checkpoint C:\path\batch-ledger.json C:\path\candidate.json
node scripts/batch-ledger.mjs record C:\path\batch-ledger.json C:\path\candidate.json
node scripts/batch-ledger.mjs report C:\path\batch-ledger.json
```

`check` exits with code `2` when the closest score meets the threshold (default `0.78`). Replan the graph and check again. `checkpoint` upserts the same `id`; use it after planning, building, generation, and delivery milestones with a precise `nextAction`. `record` enforces the similarity gate, replaces that draft with one `completed` entry, and removes its resume cursor.

For an intentional series only, add a non-empty `similarityOverrideReason`, show the collision to the user, and run:

```powershell
node scripts/batch-ledger.mjs record C:\path\batch-ledger.json C:\path\candidate.json --allow-similar
```

Use `--threshold 0.82` on `check` or `record` only when the batch has an explicitly chosen threshold. The report contains status totals, resumable work, archetype and deliverable coverage, and the closest pairwise collisions. Resume from the reported `nextAction`, inspect the named key nodes, and update `pptRevision` after every successful deck mutation.

## Exit evidence

Before `record`, compare the actual canvas and delivery against the brief: node minimum, forbidden node types, video policy, required site dependency, image model and credit configuration, promised zones or views, PPT page coverage, `gen-ppt count === 1` with no empty PPT orphan left by this batch, and final quality status. Store concise results in the candidate if the batch needs an auditable handoff.

## Score interpretation

The deterministic score combines node-type multiset, typed edges, archetype, deliverables, and differentiation axes. It is a screening signal, not an aesthetic judgment. Passing does not authorize publishing and does not replace visual/output review.
