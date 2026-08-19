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
    "keyNodeIds": { "site": "n-site", "hero": "n-hero", "ppt": "n-ppt" },
    "pptRevision": 18
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

Before `record`, compare the actual canvas and delivery against the brief: node minimum, forbidden node types, video policy, required site dependency, image model and credit configuration, promised zones or views, PPT page coverage, and final quality status. Store concise results in the candidate if the batch needs an auditable handoff.

## Score interpretation

The deterministic score combines node-type multiset, typed edges, archetype, deliverables, and differentiation axes. It is a screening signal, not an aesthetic judgment. Passing does not authorize publishing and does not replace visual/output review.
