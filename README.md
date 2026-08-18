# Gemus — Codex plugin

A default-disabled Companion MCP server, Stop hook, and skills that let your local Codex auto-backfill
its own image generations onto planned nodes of a [Gemus](https://gemus.ai) canvas.

## Install

```bash
# Production Gemus on Windows or macOS — safe to rerun:
npx -y @gemus/mcp-proxy@0.1.18 setup
```

The setup securely prompts for your key, reconciles the plugin, migrates legacy Gemus config,
and enables the default-disabled Companion. On Windows it writes the user environment; on macOS
the environment lasts for the current login session. Fully quit and restart Codex, then open a new
task. The setup reconciliation enables the plugin-owned integration.
The full setup reports the exact PATH-resolved Codex executable, validated CLI version, and config
home so machines with multiple Codex installations show which target was changed.

The public setup command, shell history, and setup diagnostics remain key-free. On macOS, the
short-lived `launchctl setenv` child necessarily receives the key in its argv.

## Advanced environment setup

For Linux, self-hosted `GEMUS_URL`, or troubleshooting, use the same key-free single-line command
on every supported terminal. It securely prompts for `GEMUS_KEY`; optional `GEMUS_URL` for self-hosted/development
is passed with `--url`. This environment-only setup is safe to rerun:

```bash
npx -y @gemus/mcp-proxy@0.1.18 setup-env
# Self-hosted/development:
npx -y @gemus/mcp-proxy@0.1.18 setup-env --url "https://your-gemus.example/api/mcp"
```

On Windows it updates the user environment; on macOS it updates the current login session; on Linux
it launches Codex from the same terminal with the acquired environment.

```bash
codex mcp remove gemus
codex plugin marketplace add Gemus-AI/gemus-codex-plugin
codex plugin add gemus@gemus
```

Existing users refresh the marketplace snapshot, then replace the installed cache:

```bash
codex plugin marketplace upgrade gemus
codex plugin remove gemus@gemus
codex plugin add gemus@gemus
```

```toml
[plugins."gemus@gemus".mcp_servers.gemus]
enabled = true
```

After enabling, fully quit and restart Codex, open a new task, then trust the Stop hook with `/hooks`.

Get a `mak_` key at gemus.ai → Settings → MCP Keys. Generated from the Gemus monorepo
(`scripts/pack-codex-plugin.mjs`) — do not edit here; edit `.codex-plugin/`, `assets/`, `codex-plugin/`, or `skills/` upstream.
