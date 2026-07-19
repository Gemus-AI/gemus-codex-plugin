# Gemus Codex plugin (Issue #1751)

Gives **Codex desktop (direct-connect / Mode B)** users automatic canvas backfill: images Codex
generates with its built-in imagegen land on the planned `codex-imagen` nodes of a [Gemus](https://gemus.ai)
canvas, instead of only orphaning as `image-upload`. The plugin is **hooks + skills only** — the MCP
server + upstream auth live in the companion proxy (`@gemus/mcp-proxy`), registered locally with the
user's own `mak_` key.

## Layout

| File | Purpose |
|------|---------|
| `plugin.json` | Codex plugin manifest (metadata + `interface` + root `skills` pointer) |
| `hooks/hooks.json` | Declares the `Stop` hook (command → `stop-backfill.mjs`) |
| `hooks/stop-backfill.mjs` | Turn-end relay: reads the Stop payload, POSTs `transcript_path`+`turn_id` to the local proxy over loopback so it backfills |
| `../skills/gemus-getting-started/SKILL.md` | Multi-node planning, prompt wiring, execution, and canvas-opening workflow |
| `../skills/gemus-codex-imagen/SKILL.md` | Local image generation and automatic backfill protocol |

There is **no `.mcp.json`**: the companion is registered by the user locally (see below), because a
public manifest can't carry a per-user key and Codex does not interpolate `${VAR}` in an MCP `env`
(both verified on codex-cli 0.142.2, #1751 Step-0.4).

## Install / onboarding

```bash
# 1. Register the companion as Codex's gemus MCP server (your own key, kept as a literal in local config):
codex mcp add gemus --env GEMUS_KEY=mak_<your key> -- npx -y @gemus/mcp-proxy
#    (mak_ key: gemus.ai → Settings → MCP Keys. GEMUS_URL defaults to https://gemus.ai/api/mcp.)

# 2. Install this plugin, then TRUST its Stop hook (required for backfill to the planned node):
codex plugin marketplace add Gemus-AI/gemus-codex-plugin
codex plugin add gemus@gemus
#    In interactive Codex run `/hooks` and trust the gemus Stop hook. Untrusted → images still land on
#    the canvas as an orphan node (proxy idle-timer salvage), just not on the planned node.
```

## Distribution (automated — Issue #2094)

The Gemus monorepo is **private + large**, so it can't be the public marketplace source. The plugin
ships from a **separate lightweight public repo** (`Gemus-AI/gemus-codex-plugin`) whose contents are
generated from this monorepo (SSOT) by `scripts/pack-codex-plugin.mjs` → `dist-codex-plugin/`
(`.codex-plugin/` + `skills/` + `.agents/plugins/marketplace.json`, the real-machine-validated layout).

**Sync is automatic**: `.github/workflows/publish-codex-plugin.yml` fires on every master push touching
`.codex-plugin/**`, `skills/**`, or the pack script, re-packs, and `rsync --delete`s the tree onto the
mirror. The mirror is a **pure derived artifact** — never push to it by hand once the workflow is live
(a manual push racing the automated one gets rejected non-fast-forward), and any file not produced by
the pack script is deleted on the next sync. A version bump in `plugin.json` is enforced by the
`check:codex-plugin-version` CI gate, so users always get an upgrade signal. `codex plugin marketplace
add Gemus-AI/gemus-codex-plugin` then resolves `gemus@gemus`.

**One-time admin prerequisite**: a fine-grained PAT scoped to `Gemus-AI/gemus-codex-plugin` only,
`Contents: Read and write`, stored as the `CODEX_PLUGIN_PUSH_TOKEN` Actions secret (see the workflow
header). Also confirm master branch protection is PR-only with `Code Quality Check` required, so the
version-drift gate can't be bypassed by a direct push.

## Validated (real Codex, codex-cli 0.142.2)

- Plugin-bundled `hooks/hooks.json` **fires** (needs `/hooks` trust; `plugin_hooks:removed` does not
  block it). `CLAUDE_PLUGIN_ROOT` = the cloned plugin repo root; the hook command resolves
  `${CLAUDE_PLUGIN_ROOT}/.codex-plugin/hooks/stop-backfill.mjs`.
- End-to-end: Codex generates a `codex-imagen` image → Stop hook → proxy `backfill: claimed
  {delivered:1}` → image on the planned node, zero self-forwarding, 0 platform credits.
- Marketplace manifest `policy.authentication` enum = `ON_INSTALL` | `ON_USE` only.
- Plugin source must be a clean dir/tree (Git clone is clean; a dirty local working tree with
  `node_modules` junctions fails on Windows `os error 87` — the pack script emits a clean tree).

## Still needed for public use

1. **Publish `@gemus/mcp-proxy`** (+ `@gemus/codex-backfill-core`) to npm (`publish-mcp-proxy.yml`) so
   `npx -y @gemus/mcp-proxy` resolves.
2. ~~Create the public plugin repo and push the packed output~~ — done; sync is now automated by
   `publish-codex-plugin.yml` (Issue #2094). Remaining one-time admin step: add the
   `CODEX_PLUGIN_PUSH_TOKEN` secret (see "Distribution" above).
3. **Assets/legal**: add `composerIcon` / `logo` / `screenshots` to `interface` and confirm
   `gemus.ai/terms` & `/privacy` before any official-marketplace submission.
