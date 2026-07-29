# Gemus Codex plugin (Issue #1751)

Gives **Codex desktop (direct-connect / Mode B)** users automatic canvas backfill: images Codex
generates with its built-in imagegen land on the planned `codex-imagen` nodes of a [Gemus](https://gemus.ai)
canvas, instead of only orphaning as `image-upload`. The plugin ships a **default-disabled**
plugin-scoped Companion MCP server, the Stop hook, and both Gemus skills. The plugin owns the
non-secret startup contract; the user's process environment owns `GEMUS_KEY`.

## Layout

| File | Purpose |
|------|---------|
| `plugin.json` | Codex plugin manifest (metadata + `interface` + root `skills` pointer) |
| `../codex-plugin/.mcp.json` | Secret-free, default-disabled Companion process contract |
| `hooks/hooks.json` | Declares the `Stop` hook (command → `stop-backfill.mjs`) |
| `hooks/stop-backfill.mjs` | Turn-end relay: reads the Stop payload, POSTs `transcript_path`+`turn_id` to the local proxy over loopback so it backfills |
| `../skills/gemus-getting-started/SKILL.md` | Multi-node planning, prompt wiring, execution, and canvas-opening workflow |
| `../skills/gemus-codex-imagen/SKILL.md` | Local image generation and automatic backfill protocol |

## Companion setup and migration

The bundled contract uses exact `@gemus/mcp-proxy@0.1.10`,
`startup_timeout_sec = 60`, and `tool_timeout_sec = 300`. It forwards `GEMUS_KEY`, optional
`GEMUS_URL`, and optional `PROXY_CONNECT_ATTEMPT_TIMEOUT_MS` from the user environment; their
values are not stored in this public plugin.

For the production Gemus service, the recommended Windows/macOS setup is one command that is safe to rerun:

```bash
npx -y @gemus/mcp-proxy@0.1.10 setup
```

It securely prompts for the key, reconciles the marketplace/plugin, removes legacy Gemus config,
enables the Companion, and preserves a backup when it changes `config.toml`. Fully quit and restart
Codex when it finishes, then open a new task and run `/hooks` to trust the Gemus Stop hook.

The public setup command, shell history, and setup diagnostics remain key-free. On macOS, the
short-lived `launchctl setenv` child necessarily receives the key in its argv.

Environment ownership and lifetime:

- **Windows / PowerShell:** the setup flow persists `GEMUS_KEY` in the Windows user environment
  scope. Fully quit and restart Codex so it receives the updated environment.
- **macOS:** If changing login context, sign out and back in first; rerun the `launchctl setenv`
  setup in the new login session; the value lasts for the current login session only. Then fully quit
  and restart Codex and open a new task.
- **Linux:** the supported flow exports `GEMUS_KEY` for Codex launched from the same terminal. It
  does not claim universal GNOME/KDE desktop-session inheritance.

Companion and direct modes are mutually exclusive. Use this advanced manual fallback for Linux,
self-hosted `GEMUS_URL`, or troubleshooting when the production one-command setup is not applicable:

1. Set `GEMUS_KEY` in the user environment (and optional `GEMUS_URL` for self-hosted/development).
2. Remove a legacy global server if present. This command is safe/idempotent if none exists:

   ```bash
   codex mcp remove gemus
   ```

3. Install the marketplace and plugin:

   ```bash
   codex plugin marketplace add Gemus-AI/gemus-codex-plugin
   codex plugin add gemus@gemus
   ```

   Existing users refresh the marketplace snapshot, then replace the installed plugin cache:

   ```bash
   codex plugin marketplace upgrade gemus
   codex plugin remove gemus@gemus
   codex plugin add gemus@gemus
   ```

4. Explicitly enable the default-disabled plugin-scoped Companion:

   ```toml
   [plugins."gemus@gemus".mcp_servers.gemus]
   enabled = true
   ```

5. Fully quit and restart Codex, open a new task, then trust the Gemus Stop hook with `/hooks`.
   Without trust, idle salvage
   can still orphan the image, but deterministic planned-node backfill is unavailable.

Intentional direct HTTP/OAuth users leave the plugin Companion disabled, keeping the global direct
server as the only active `gemus` connection:

```toml
[plugins."gemus@gemus".mcp_servers.gemus]
enabled = false
```

## Distribution (automated — Issue #2094)

The Gemus monorepo is **private + large**, so it can't be the public marketplace source. The plugin
ships from a **separate lightweight public repo** (`Gemus-AI/gemus-codex-plugin`) whose contents are
generated from this monorepo (SSOT) by `scripts/pack-codex-plugin.mjs` → `dist-codex-plugin/`
(`.codex-plugin/` + `assets/` + `codex-plugin/` + `skills/` +
`.agents/plugins/marketplace.json`, the
real-machine-validated layout).

**Sync is automatic**: `.github/workflows/publish-codex-plugin.yml` fires on every master push touching
`.codex-plugin/**`, `assets/**`, `codex-plugin/**`, `skills/**`, or the pack script, re-packs, and
`rsync --delete`s the tree onto the mirror. The mirror is a **pure derived artifact** — never push to
it by hand once the workflow is live
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
3. **Assets/legal**: keep `composerIcon` / `logo` paths plugin-root-relative (`./assets/...`) and
   keep the files in the root `assets/` directory, add marketplace screenshots, and confirm
   `gemus.ai/terms` & `/privacy` before any official-marketplace submission.
