#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const inputArg = process.argv[2] || 'docs/artifacts/sample-exported-signals.json';
const outputArg = process.argv[3] || 'docs/artifacts/real-input-ranked-queue-snapshot.md';

const root = process.cwd();
const inputPath = path.resolve(root, inputArg);
const outputPath = path.resolve(root, outputArg);

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(1, Math.min(5, Math.round(n)));
}

function score(item) {
  return item.urgency * 2 + item.relevance + item.confidence;
}

function normalizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const required = ['externalId', 'title', 'source', 'category', 'createdAt'];
  for (const key of required) {
    if (!raw[key] || String(raw[key]).trim() === '') return null;
  }

  const createdAtMs = new Date(raw.createdAt).getTime();
  if (!Number.isFinite(createdAtMs)) return null;

  return {
    externalId: String(raw.externalId),
    title: String(raw.title),
    source: String(raw.source),
    category: String(raw.category),
    urgency: clampScore(raw.urgency),
    relevance: clampScore(raw.relevance),
    confidence: clampScore(raw.confidence),
    owner: raw.owner && String(raw.owner).trim() ? String(raw.owner) : 'Unassigned',
    createdAt: createdAtMs,
    createdAtIso: new Date(createdAtMs).toISOString()
  };
}

function run() {
  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  const normalized = rawItems.map(normalizeItem).filter(Boolean);

  const ranked = normalized
    .map((item) => ({ ...item, score: score(item) }))
    .sort((a, b) => b.score - a.score || b.createdAt - a.createdAt || a.title.localeCompare(b.title));

  const nowIso = new Date().toISOString();

  const lines = [
    '# Real Input Ranked Queue Snapshot',
    '',
    `Generated at: ${nowIso}`,
    `Adapter: ${payload.adapter || 'unknown'}`,
    `Input file: ${path.relative(root, inputPath)}`,
    `Accepted items: ${ranked.length}/${rawItems.length}`,
    '',
    'Scoring formula: `urgency * 2 + relevance + confidence`',
    'Sort rule: `score desc -> createdAt desc -> title asc`',
    '',
    '## Ranked queue',
    ''
  ];

  ranked.forEach((item, idx) => {
    lines.push(`${idx + 1}. **${item.title}** (${item.category})`);
    lines.push(`   - External ID: ${item.externalId}`);
    lines.push(`   - Source: ${item.source}`);
    lines.push(`   - Owner: ${item.owner}`);
    lines.push(`   - Score: ${item.score} (Urgency ${item.urgency} • Relevance ${item.relevance} • Confidence ${item.confidence})`);
    lines.push(`   - Created: ${item.createdAtIso}`);
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');

  console.log(`INGEST_PASS input=${path.relative(root, inputPath)} output=${path.relative(root, outputPath)} items=${ranked.length}`);
}

run();
