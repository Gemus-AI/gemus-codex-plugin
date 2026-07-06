#!/usr/bin/env node
// Gemus Stop hook (Issue #1751) — relays the turn-end signal to the local @gemus/mcp-proxy so it
// backfills codex imagegen output into the planned gen-* nodes on the Gemus canvas.
//
// codex passes the Stop payload as JSON on stdin: { session_id, turn_id, transcript_path, ... }.
// The proxy (spawned per session) writes its loopback endpoint to a discovery file keyed by
// session_id; this hook reads it and POSTs { turn_id, transcript_path } so the proxy reads that
// exact rollout and claims/orphans the images.
//
// Contract: NEVER block codex — best-effort, short timeout, always exit 0. If the proxy isn't the
// configured MCP server (or the discovery file is missing), this silently no-ops.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'

let raw = ''
let finished = false
function done() {
  if (finished) return
  finished = true
  process.exit(0)
}

function relay() {
  if (finished) return
  let payload
  try {
    payload = JSON.parse(raw)
  } catch {
    return done()
  }
  const sessionId = payload.session_id || payload.sessionId
  const turnId = payload.turn_id || payload.turnId
  const transcriptPath = payload.transcript_path || payload.transcriptPath
  if (!sessionId) return done()

  let disc
  try {
    disc = JSON.parse(fs.readFileSync(path.join(os.tmpdir(), `gemus-proxy-${sessionId}.json`), 'utf8'))
  } catch {
    return done() // proxy not running / not the gemus MCP server → nothing to do
  }
  if (!disc || !disc.port || !disc.token) return done()

  const body = JSON.stringify({
    token: disc.token,
    session_id: sessionId,
    turn_id: turnId,
    transcript_path: transcriptPath,
  })
  const req = http.request(
    {
      host: '127.0.0.1',
      port: disc.port,
      path: '/backfill',
      method: 'POST',
      headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) },
    },
    (res) => {
      res.resume()
      res.on('end', done)
    },
  )
  req.on('error', done)
  req.setTimeout(3000, () => {
    req.destroy()
    done()
  })
  req.end(body)
}

process.stdin.on('data', (c) => {
  raw += c
})
process.stdin.on('end', relay)
// codex may not close stdin — also relay on a short timer (guarded so we POST at most once).
setTimeout(relay, 500)
