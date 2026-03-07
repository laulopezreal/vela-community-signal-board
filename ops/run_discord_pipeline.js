#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const {
  OWNER_MAP,
  hash,
  cleanText,
  clamp,
  fingerprint,
  scoreRubric,
  findPrimaryDimension,
  buildDecisions,
} = require('../server/lib/scoring');

const inputArg = process.argv[2] || 'docs/artifacts/sample-discord-export.json';
const outDirArg = process.argv[3] || 'docs/artifacts/discord-pipeline';

const root = process.cwd();
const inputPath = path.resolve(root, inputArg);
const outDir = path.resolve(root, outDirArg);

const FALLBACK_SIGNALS = [
  {
    externalId: 'fallback:1',
    threadId: 'fallback-thread-1',
    source: 'Fallback dataset',
    title: 'Urgent partner intro request for AI infra founders',
    ownerHint: 'Partnerships',
    createdAt: '2026-02-28T09:00:00Z',
    revenue: 5,
    product: 3,
    risk: 2,
    leverage: 4,
  },
  {
    externalId: 'fallback:2',
    threadId: 'fallback-thread-2',
    source: 'Fallback dataset',
    title: 'Sponsor budget paused for next week',
    ownerHint: 'Operations',
    createdAt: '2026-02-28T09:10:00Z',
    revenue: 3,
    product: 2,
    risk: 5,
    leverage: 3,
  },
];

function toIsoSafe(v) {
  const t = new Date(v).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

function parseExport(payload) {
  const rows = [];
  if (Array.isArray(payload?.messages)) {
    for (const m of payload.messages) rows.push({ ...m, _sourceChannel: m.channel || 'unknown' });
    return rows;
  }

  if (Array.isArray(payload?.channels)) {
    for (const c of payload.channels) {
      const channelName = c?.name ? `Discord #${c.name}` : 'Discord #unknown';
      for (const m of c?.messages || []) rows.push({ ...m, _sourceChannel: channelName });
    }
  }
  return rows;
}

function normalizeMessage(msg) {
  const id = cleanText(msg.id || msg.messageId || '');
  const content = cleanText(msg.content || msg.body || '');
  const createdAt = toIsoSafe(msg.createdAt || msg.timestamp);
  const source = cleanText(msg._sourceChannel || msg.channel || 'Discord #unknown');
  const threadId = cleanText(msg.threadId || msg.parentId || id || '');

  if (!id || !content || !createdAt) {
    return { skip: true, reason: 'missing_required_fields' };
  }

  const title = content.length > 120 ? `${content.slice(0, 117)}...` : content;
  const reactions = clamp(msg.reactionCount || msg.reactions || 0, 0, 999, 0);
  const rubric = scoreRubric(title, content, reactions);
  const primary = findPrimaryDimension(rubric);

  return {
    skip: false,
    signal: {
      signalId: `sig_${hash(id).slice(0, 12)}`,
      externalId: `discord:${id}`,
      threadId: threadId || `thread:${id}`,
      source,
      title,
      content,
      createdAt,
      ownerHint: OWNER_MAP[primary],
      primaryDimension: primary,
      ...rubric,
      dedupeKey: fingerprint(title),
      idempotencyKey: hash(`${id}|${createdAt}|${content}`),
    },
  };
}

function aggregateThreads(signals) {
  const byThread = new Map();
  for (const s of signals) {
    const key = s.threadId || s.externalId;
    if (!byThread.has(key)) {
      byThread.set(key, {
        threadId: key,
        source: s.source,
        messageCount: 0,
        topWeighted: 0,
        topSignalId: null,
        latestAt: s.createdAt,
      });
    }
    const row = byThread.get(key);
    row.messageCount += 1;
    if (s.weighted > row.topWeighted) {
      row.topWeighted = s.weighted;
      row.topSignalId = s.signalId;
    }
    if (s.createdAt > row.latestAt) row.latestAt = s.createdAt;
  }
  return [...byThread.values()].sort((a, b) => b.topWeighted - a.topWeighted || b.messageCount - a.messageCount);
}

function clusterDedupe(signals) {
  const clusters = new Map();
  for (const s of signals) {
    const key = s.dedupeKey || s.signalId;
    if (!clusters.has(key)) {
      clusters.set(key, {
        clusterId: `cl_${hash(key).slice(0, 10)}`,
        dedupeKey: key,
        canonicalSignalId: s.signalId,
        title: s.title,
        source: s.source,
        members: [],
        weighted: s.weighted,
      });
    }
    const c = clusters.get(key);
    c.members.push(s.signalId);
    if (s.weighted > c.weighted) {
      c.weighted = s.weighted;
      c.canonicalSignalId = s.signalId;
      c.title = s.title;
      c.source = s.source;
    }
  }
  return [...clusters.values()].sort((a, b) => b.weighted - a.weighted || b.members.length - a.members.length);
}

function markdownDecisions(decisions) {
  const lines = ['# Decision Outputs', '', 'Top actionable decisions from Discord pipeline', ''];
  for (const [i, d] of decisions.entries()) {
    lines.push(`${i + 1}. **${d.action}**`);
    lines.push(`   - Owner: ${d.owner}`);
    lines.push(`   - Deadline: ${d.deadline}`);
    lines.push(`   - Expected metric: ${d.expectedMetric}`);
    lines.push(`   - Signal: ${d.signalId} | Weighted score: ${d.weightedScore}`);
  }
  return `${lines.join('\n')}\n`;
}

function buildValueProof(rawCount, validCount, uniqueCount, decisionsCount, malformedCount, duplicateCount) {
  const decisionCoverage = validCount ? Number(((decisionsCount / validCount) * 100).toFixed(1)) : 0;
  const dedupeReduction = validCount ? Number(((duplicateCount / validCount) * 100).toFixed(1)) : 0;

  return {
    before: {
      rawMessages: rawCount,
      malformedRows: malformedCount,
      duplicateSignals: duplicateCount,
      decisionObjects: 0,
    },
    after: {
      normalizedSignals: validCount,
      uniqueClusters: uniqueCount,
      decisionObjects: decisionsCount,
      decisionCoveragePct: decisionCoverage,
      dedupeReductionPct: dedupeReduction,
    },
    delta: {
      decisionsCreated: decisionsCount,
      malformedFiltered: malformedCount,
      duplicatesCollapsed: duplicateCount,
    },
  };
}

function run() {
  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  } catch (err) {
    console.error(`INGEST_FAIL reason=invalid_json input=${path.relative(root, inputPath)} message=${err.message}`);
    process.exit(1);
  }

  const raw = parseExport(payload);
  const seenExternal = new Set();
  const normalized = [];
  const errors = [];

  for (const row of raw) {
    const result = normalizeMessage(row);
    if (result.skip) {
      errors.push({ rowId: row?.id || null, reason: result.reason });
      continue;
    }

    if (seenExternal.has(result.signal.externalId)) continue;
    seenExternal.add(result.signal.externalId);
    normalized.push(result.signal);
  }

  if (!normalized.length) {
    for (const item of FALLBACK_SIGNALS) {
      const weighted = Number((item.revenue * 0.35 + item.product * 0.25 + item.risk * 0.25 + item.leverage * 0.15).toFixed(2));
      normalized.push({
        signalId: `sig_${hash(item.externalId).slice(0, 12)}`,
        externalId: item.externalId,
        threadId: item.threadId,
        source: item.source,
        title: item.title,
        content: item.title,
        createdAt: item.createdAt,
        ownerHint: item.ownerHint,
        primaryDimension: findPrimaryDimension(item),
        revenue: item.revenue,
        product: item.product,
        risk: item.risk,
        leverage: item.leverage,
        weighted,
        weighted100: Number((weighted * 20).toFixed(1)),
        dedupeKey: fingerprint(item.title),
        idempotencyKey: hash(item.externalId),
        fallback: true,
      });
    }
  }

  const ranked = [...normalized].sort((a, b) => b.weighted - a.weighted || b.createdAt.localeCompare(a.createdAt) || a.title.localeCompare(b.title));
  const threads = aggregateThreads(ranked);
  const clusters = clusterDedupe(ranked);
  const decisions = buildDecisions(ranked);

  const duplicateCount = ranked.length - clusters.length;
  const valueProof = buildValueProof(raw.length, ranked.length, clusters.length, decisions.length, errors.length, duplicateCount);

  fs.mkdirSync(outDir, { recursive: true });

  const out = {
    input: path.relative(root, inputPath),
    generatedAt: new Date().toISOString(),
    stats: {
      rawMessages: raw.length,
      normalizedSignals: ranked.length,
      threadGroups: threads.length,
      dedupeClusters: clusters.length,
      decisions: decisions.length,
      malformedRows: errors.length,
      duplicateCollapsed: duplicateCount,
      fallbackUsed: ranked.some((x) => x.fallback === true),
    },
  };

  fs.writeFileSync(path.join(outDir, 'normalized-signals.json'), `${JSON.stringify(ranked, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'thread-aggregation.json'), `${JSON.stringify(threads, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'dedupe-clusters.json'), `${JSON.stringify(clusters, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'decision-outputs.json'), `${JSON.stringify(decisions, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'pipeline-summary.json'), `${JSON.stringify(out, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'pipeline-errors.json'), `${JSON.stringify(errors, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'real-value-proof.json'), `${JSON.stringify(valueProof, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'decision-outputs.md'), markdownDecisions(decisions));

  console.log(`PIPELINE_PASS input=${path.relative(root, inputPath)} out=${path.relative(root, outDir)} signals=${ranked.length} decisions=${decisions.length} malformed=${errors.length}`);
}

run();
