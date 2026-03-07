#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { hash, fingerprint, findPrimaryDimension } from '../server/lib/scoring/rubric.js';
import { parseExport, normalizeMessage, clusterDedupe } from '../server/lib/scoring/normalize.js';

const inputArg = process.argv[2] || 'scripts/fixtures/discord-raw-events.json';
const outDirArg = process.argv[3] || 'docs/artifacts/discord-pipeline';

const root = process.cwd();
const inputPath = path.resolve(root, inputArg);
const outDir = path.resolve(root, outDirArg);

const FALLBACK_SIGNALS = [
  {
    externalId: 'fallback:1', threadId: 'fallback-thread-1', source: 'Fallback dataset', title: 'Urgent partner intro request for AI infra founders', ownerHint: 'Partnerships', createdAt: '2026-02-28T09:00:00Z', revenue: 5, product: 3, risk: 2, leverage: 4,
  },
];

function aggregateThreads(signals) {
  const byThread = new Map();
  for (const s of signals) {
    const key = s.threadId || s.externalId;
    if (!byThread.has(key)) byThread.set(key, { threadId: key, source: s.source, messageCount: 0, topWeighted: 0, topSignalId: null, latestAt: s.createdAt });
    const row = byThread.get(key);
    row.messageCount += 1;
    if (s.weighted > row.topWeighted) { row.topWeighted = s.weighted; row.topSignalId = s.signalId; }
    if (s.createdAt > row.latestAt) row.latestAt = s.createdAt;
  }
  return [...byThread.values()].sort((a, b) => b.topWeighted - a.topWeighted || b.messageCount - a.messageCount);
}

function deriveDecisionBaseTime(ranked) {
  const latest = ranked.map((s) => new Date(s.createdAt).getTime()).filter((v) => Number.isFinite(v)).sort((a, b) => b - a)[0];
  if (!Number.isFinite(latest)) return new Date('2026-01-01T00:00:00.000Z');
  return new Date(latest);
}

function buildDecisions(ranked, now = deriveDecisionBaseTime(ranked)) {
  return ranked.slice(0, 5).map((s, idx) => ({
    decisionId: `dec_${s.signalId}`,
    signalId: s.signalId,
    owner: s.ownerHint || 'Unassigned',
    action: s.risk >= 4 ? 'Open mitigation thread and assign fallback owner' : 'Triage in standup and monitor for escalation',
    deadline: new Date(now.getTime() + (idx + 1) * 2 * 60 * 60 * 1000).toISOString(),
    expectedMetric: s.risk >= 4 ? 'missed-critical-risk alerts: down' : 'triage latency: down',
    weightedScore: s.weighted,
  }));
}

let payload;
try { payload = JSON.parse(fs.readFileSync(inputPath, 'utf8')); } catch (err) { console.error(`INGEST_FAIL reason=invalid_json input=${path.relative(root, inputPath)} message=${err.message}`); process.exit(1); }
const raw = parseExport(payload, 'discord');
const seenExternal = new Set();
const normalized = [];
const errors = [];
for (const row of raw) {
  const result = normalizeMessage(row, 'discord');
  if (result.skip) { errors.push({ rowId: row?.id || null, reason: result.reason }); continue; }
  if (seenExternal.has(result.signal.externalId)) continue;
  seenExternal.add(result.signal.externalId);
  normalized.push(result.signal);
}
if (!normalized.length) {
  for (const item of FALLBACK_SIGNALS) {
    const weighted = Number((item.revenue * 0.35 + item.product * 0.25 + item.risk * 0.25 + item.leverage * 0.15).toFixed(2));
    normalized.push({ signalId: `sig_${hash(item.externalId).slice(0, 12)}`, externalId: item.externalId, threadId: item.threadId, source: item.source, title: item.title, content: item.title, createdAt: item.createdAt, ownerHint: item.ownerHint, primaryDimension: findPrimaryDimension(item), revenue: item.revenue, product: item.product, risk: item.risk, leverage: item.leverage, weighted, weighted100: Number((weighted * 20).toFixed(1)), dedupeKey: fingerprint(item.title), idempotencyKey: hash(item.externalId), fallback: true });
  }
}
const ranked = [...normalized].sort((a, b) => b.weighted - a.weighted || b.createdAt.localeCompare(a.createdAt) || a.title.localeCompare(b.title));
const threads = aggregateThreads(ranked);
const clusters = clusterDedupe(ranked);
const decisions = buildDecisions(ranked);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'normalized-signals.json'), `${JSON.stringify(ranked, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'thread-aggregation.json'), `${JSON.stringify(threads, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'dedupe-clusters.json'), `${JSON.stringify(clusters, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'decision-outputs.json'), `${JSON.stringify(decisions, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'pipeline-errors.json'), `${JSON.stringify(errors, null, 2)}\n`);
console.log(`PIPELINE_PASS input=${path.relative(root, inputPath)} out=${path.relative(root, outDir)} signals=${ranked.length} decisions=${decisions.length} malformed=${errors.length}`);
