# Gemus — Codex plugin

Stop hook + skills that let your local Codex auto-backfill its own image generations onto the
planned nodes of a [Gemus](https://gemus.ai) canvas. Pairs with the `@gemus/mcp-proxy` companion.

## Install

```bash
# 1. Register the companion (your own gemus.ai API key, kept in local config):
codex mcp add gemus --env GEMUS_KEY=mak_<your key> -- npx -y @gemus/mcp-proxy

# 2. Install this plugin, then trust its Stop hook with /hooks in Codex:
codex plugin marketplace add Gemus-AI/gemus-codex-plugin
codex plugin add gemus@gemus
```

Get a `mak_` key at gemus.ai → Settings → MCP Keys. Generated from the Gemus monorepo
(`scripts/pack-codex-plugin.mjs`) — do not edit here; edit `.codex-plugin/` or `skills/` upstream.
