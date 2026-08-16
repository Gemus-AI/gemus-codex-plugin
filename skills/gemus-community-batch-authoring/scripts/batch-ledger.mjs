#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const SCHEMA_VERSION = 1;
const DEFAULT_THRESHOLD = 0.78;

function print(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(message, details = undefined, exitCode = 1) {
  print(
    { status: "error", message, ...(details ? { details } : {}) },
    process.stderr,
  );
  process.exitCode = exitCode;
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read JSON ${filePath}: ${error.message}`);
  }
}

function atomicWrite(filePath, value) {
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, filePath);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(nonEmptyString).map((item) => item.trim().toLowerCase()),
    ),
  ].sort();
}

function validateCandidate(candidate) {
  for (const field of ["id", "title", "archetype"]) {
    if (!nonEmptyString(candidate?.[field]))
      throw new Error(`Candidate field "${field}" is required`);
  }
  if (!Array.isArray(candidate.nodes) || candidate.nodes.length === 0) {
    throw new Error("Candidate must include at least one node");
  }
  if (!Array.isArray(candidate.edges))
    throw new Error('Candidate field "edges" must be an array');

  const nodeIds = new Set();
  for (const node of candidate.nodes) {
    if (!nonEmptyString(node?.id) || !nonEmptyString(node?.type)) {
      throw new Error('Every node requires non-empty "id" and "type" fields');
    }
    if (nodeIds.has(node.id)) throw new Error(`Duplicate node id "${node.id}"`);
    nodeIds.add(node.id);
  }
  for (const edge of candidate.edges) {
    if (!nodeIds.has(edge?.source) || !nodeIds.has(edge?.target)) {
      throw new Error(
        `Edge ${JSON.stringify(edge)} references an unknown node`,
      );
    }
  }
}

function count(items) {
  const result = {};
  for (const item of items) result[item] = (result[item] ?? 0) + 1;
  return Object.fromEntries(
    Object.entries(result).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function signature(candidate) {
  validateCandidate(candidate);
  const typeById = new Map(
    candidate.nodes.map((node) => [node.id, node.type.trim().toLowerCase()]),
  );
  return {
    nodeTypes: count([...typeById.values()]),
    edgeTypes: count(
      candidate.edges.map(
        (edge) => `${typeById.get(edge.source)}->${typeById.get(edge.target)}`,
      ),
    ),
    archetype: candidate.archetype.trim().toLowerCase(),
    deliverables: normalizeList(candidate.deliverables),
    differentiationAxes: normalizeList(candidate.differentiationAxes),
  };
}

function multisetSimilarity(left, right) {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  let intersection = 0;
  let union = 0;
  for (const key of keys) {
    intersection += Math.min(left[key] ?? 0, right[key] ?? 0);
    union += Math.max(left[key] ?? 0, right[key] ?? 0);
  }
  return union === 0 ? 1 : intersection / union;
}

function jaccard(left, right) {
  const a = new Set(left);
  const b = new Set(right);
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 1;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection += 1;
  return intersection / union.size;
}

function similarity(left, right) {
  const score =
    multisetSimilarity(left.nodeTypes, right.nodeTypes) * 0.25 +
    multisetSimilarity(left.edgeTypes, right.edgeTypes) * 0.35 +
    (left.archetype === right.archetype ? 1 : 0) * 0.15 +
    jaccard(left.deliverables, right.deliverables) * 0.1 +
    jaccard(left.differentiationAxes, right.differentiationAxes) * 0.15;
  return Math.round(score * 1_000_000) / 1_000_000;
}

function readLedger(ledgerPath) {
  const ledger = readJson(ledgerPath);
  if (
    ledger.schemaVersion !== SCHEMA_VERSION ||
    !Array.isArray(ledger.entries)
  ) {
    throw new Error(`Unsupported or malformed ledger at ${ledgerPath}`);
  }
  return ledger;
}

function thresholdFrom(args, ledger) {
  const index = args.indexOf("--threshold");
  const raw =
    index >= 0 ? args[index + 1] : ledger?.settings?.similarityThreshold;
  const value = raw === undefined ? DEFAULT_THRESHOLD : Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error("Similarity threshold must be a number from 0 to 1");
  }
  return value;
}

function closestMatch(ledger, candidateSignature) {
  let closest = null;
  for (const entry of ledger.entries) {
    const entrySignature = entry.signature ?? signature(entry);
    const score = similarity(candidateSignature, entrySignature);
    if (!closest || score > closest.score) {
      closest = {
        id: entry.id,
        title: entry.title,
        workflowId: entry.workflowId,
        score,
      };
    }
  }
  return closest;
}

function inspect(ledger, candidate, threshold) {
  const candidateSignature = signature(candidate);
  const closest = closestMatch(ledger, candidateSignature);
  const tooSimilar = Boolean(closest && closest.score >= threshold);
  return {
    status: tooSimilar ? "too_similar" : "clear",
    threshold,
    closest,
    signature: candidateSignature,
  };
}

function sortedCounts(entries, field) {
  const values = entries.flatMap((entry) => {
    const value = entry[field];
    return Array.isArray(value)
      ? normalizeList(value)
      : nonEmptyString(value)
        ? [value.toLowerCase()]
        : [];
  });
  return count(values);
}

function createReport(ledger) {
  const collisions = [];
  for (let leftIndex = 0; leftIndex < ledger.entries.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < ledger.entries.length;
      rightIndex += 1
    ) {
      const left = ledger.entries[leftIndex];
      const right = ledger.entries[rightIndex];
      collisions.push({
        left: left.id,
        right: right.id,
        score: similarity(
          left.signature ?? signature(left),
          right.signature ?? signature(right),
        ),
      });
    }
  }
  collisions.sort((a, b) => b.score - a.score || a.left.localeCompare(b.left));
  return {
    total: ledger.entries.length,
    archetypes: sortedCounts(ledger.entries, "archetype"),
    deliverables: sortedCounts(ledger.entries, "deliverables"),
    closestCollisions: collisions.slice(0, 10),
  };
}

function usage() {
  return {
    usage: [
      "batch-ledger.mjs init <ledger> [--source <path>]",
      "batch-ledger.mjs check <ledger> <candidate> [--threshold 0.78]",
      "batch-ledger.mjs record <ledger> <candidate> [--threshold 0.78] [--allow-similar]",
      "batch-ledger.mjs report <ledger>",
    ],
  };
}

function main(args) {
  const [command, ledgerPath, candidatePath] = args;
  if (!command || !ledgerPath) {
    print(usage(), process.stderr);
    process.exitCode = 1;
    return;
  }

  if (command === "init") {
    if (fs.existsSync(ledgerPath)) {
      const existing = readLedger(ledgerPath);
      print({
        status: "exists",
        ledger: ledgerPath,
        total: existing.entries.length,
      });
      return;
    }
    const sourceIndex = args.indexOf("--source");
    const ledger = {
      schemaVersion: SCHEMA_VERSION,
      source: sourceIndex >= 0 ? args[sourceIndex + 1] : null,
      settings: { similarityThreshold: DEFAULT_THRESHOLD },
      entries: [],
    };
    atomicWrite(ledgerPath, ledger);
    print({ status: "initialized", ledger: ledgerPath });
    return;
  }

  const ledger = readLedger(ledgerPath);
  if (command === "report") {
    print(createReport(ledger));
    return;
  }
  if (!candidatePath)
    throw new Error(`Command "${command}" requires a candidate JSON path`);
  const candidate = readJson(candidatePath);
  const threshold = thresholdFrom(args, ledger);
  const result = inspect(ledger, candidate, threshold);

  if (command === "check") {
    print(result);
    if (result.status === "too_similar") process.exitCode = 2;
    return;
  }
  if (command === "record") {
    if (ledger.entries.some((entry) => entry.id === candidate.id)) {
      throw new Error(`Ledger already contains candidate id "${candidate.id}"`);
    }
    if (
      nonEmptyString(candidate.workflowId) &&
      ledger.entries.some((entry) => entry.workflowId === candidate.workflowId)
    ) {
      throw new Error(
        `Ledger already contains workflowId "${candidate.workflowId}"`,
      );
    }
    if (result.status === "too_similar") {
      const allowed =
        args.includes("--allow-similar") &&
        nonEmptyString(candidate.similarityOverrideReason);
      if (!allowed) {
        print(result);
        process.exitCode = 2;
        return;
      }
    }
    ledger.entries.push({
      ...candidate,
      signature: result.signature,
      recordedAt: new Date().toISOString(),
    });
    atomicWrite(ledgerPath, ledger);
    print({ status: "recorded", id: candidate.id, closest: result.closest });
    return;
  }

  throw new Error(`Unknown command "${command}"`);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
