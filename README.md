# Gemus — Codex plugin

A default-disabled Companion MCP server, Stop hook, and skills that let your local Codex auto-backfill
its own image generations onto planned nodes of a [Gemus](https://gemus.ai) canvas.

## Install

```bash
# 1. Set GEMUS_KEY in your user environment (and optionally GEMUS_URL for development).

# 2. Install this plugin, then trust its Stop hook with /hooks in Codex:
codex plugin marketplace add Gemus-AI/gemus-codex-plugin
codex plugin add gemus@gemus
```

# Existing users: refresh the marketplace snapshot, then replace the installed cache:
```bash
codex plugin marketplace upgrade gemus
codex plugin remove gemus@gemus
codex plugin add gemus@gemus
```

Then explicitly enable the default-disabled Companion in your Codex config and restart Codex:

```toml
[plugins."gemus@gemus".mcp_servers.gemus]
enabled = true
```

Get a `mak_` key at gemus.ai → Settings → MCP Keys. Generated from the Gemus monorepo
(`scripts/pack-codex-plugin.mjs`) — do not edit here; edit `.codex-plugin/`, `codex-plugin/`, or `skills/` upstream.
