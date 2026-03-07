const fs = require('fs');
const path = require('path');

const {
  OWNER_MAP,
  clamp,
  toIsoSafe,
  hash,
  cleanText,
  fingerprint,
  scoreRubric,
  findPrimaryDimension,
  buildDecisions,
} = require('../scoring');

const DB_PATH = path.resolve(process.cwd(), 'server/data/connector-db.json');

function defaultDb() {
  return {
    signals: [],
    connectorRuns: [],
    seenIdempotencyKeys: [],
    seenDedupeKeys: [],
  };
}

function loadDb() {
  try {
    return { ...defaultDb(), ...JSON.parse(fs.readFileSync(DB_PATH, 'utf8')) };
  } catch {
    return defaultDb();
  }
}

function saveDb(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, `${JSON.stringify(db, null, 2)}\n`);
}

function parsePayload(source, payload) {
  if (source === 'discord') {
    if (Array.isArray(payload?.messages)) {
      return payload.messages.map((m) => ({ ...m, _sourceChannel: m.channel || 'Discord #unknown' }));
    }
    const rows = [];
    for (const channel of payload?.channels || []) {
      const channelName = channel?.name ? `Discord #${channel.name}` : 'Discord #unknown';
      for (const message of channel?.messages || []) rows.push({ ...message, _sourceChannel: channelName });
    }
    return rows;
  }

  if (source === 'slack') {
    return (payload?.messages || []).map((m) => ({
      id: m.ts || m.id,
      content: m.text,
      createdAt: m.ts ? new Date(Number(m.ts) * 1000).toISOString() : m.createdAt,
      channel: payload?.channel || m.channel || 'Slack #unknown',
      threadId: m.thread_ts || m.ts,
      reactions: Array.isArray(m.reactions) ? m.reactions.reduce((acc, r) => acc + (Number(r.count) || 0), 0) : 0,
    }));
  }

  if (source === 'email') {
    return (payload?.emails || []).map((e) => ({
      id: e.messageId,
      content: `${e.subject || ''} ${e.preview || ''}`.trim(),
      createdAt: e.sentAt,
      channel: `Email ${e.mailbox || 'inbox'}`,
      threadId: e.threadId || e.messageId,
      reactions: 0,
    }));
  }

  return [];
}

function normalizeRow(source, row) {
  const id = cleanText(row.id || row.messageId || '');
  const content = cleanText(row.content || row.body || row.text || '');
  const createdAt = toIsoSafe(row.createdAt || row.timestamp);
  const sourceLabel = cleanText(row._sourceChannel || row.channel || source);
  const threadId = cleanText(row.threadId || row.parentId || id || '');

  if (!id || !content || !createdAt) {
    return { skip: true, reason: 'missing_required_fields' };
  }

  const title = content.length > 120 ? `${content.slice(0, 117)}...` : content;
  const reactions = clamp(row.reactionCount || row.reactions || 0, 0, 999, 0);
  const rubric = scoreRubric(title, content, reactions);
  const primary = findPrimaryDimension(rubric);

  return {
    skip: false,
    signal: {
      signalId: `sig_${hash(`${source}:${id}`).slice(0, 12)}`,
      connector: source,
      externalId: `${source}:${id}`,
      threadId: threadId || `thread:${id}`,
      source: sourceLabel,
      title,
      content,
      createdAt,
      ownerHint: OWNER_MAP[primary],
      primaryDimension: primary,
      ...rubric,
      dedupeKey: `${source}:${fingerprint(title)}`,
      idempotencyKey: hash(`${source}|${id}|${createdAt}|${content}`),
    },
  };
}

function runConnectorJob(source, payload, options = {}) {
  const startedAt = new Date().toISOString();
  const rows = parsePayload(source, payload);
  const db = loadDb();
  const seenIdempotency = new Set(db.seenIdempotencyKeys || []);
  const seenDedupe = new Set(db.seenDedupeKeys || []);
  const errors = [];
  const imported = [];
  let duplicatesSkipped = 0;

  for (const row of rows) {
    const result = normalizeRow(source, row);
    if (result.skip) {
      errors.push({ rowId: row?.id || null, reason: result.reason });
      continue;
    }

    const signal = result.signal;
    if (seenIdempotency.has(signal.idempotencyKey)) {
      duplicatesSkipped += 1;
      continue;
    }

    seenIdempotency.add(signal.idempotencyKey);
    if (!seenDedupe.has(signal.dedupeKey)) seenDedupe.add(signal.dedupeKey);
    imported.push(signal);
  }

  const ranked = imported.sort((a, b) => b.weighted - a.weighted || b.createdAt.localeCompare(a.createdAt));
  const decisions = buildDecisions(ranked, new Date(options.decisionNow || '2026-02-28T12:00:00Z'));

  const persistedSignals = [];
  for (const signal of ranked) {
    if (db.signals.find((s) => s.idempotencyKey === signal.idempotencyKey)) continue;
    db.signals.push(signal);
    persistedSignals.push(signal.signalId);
  }

  db.seenIdempotencyKeys = [...seenIdempotency];
  db.seenDedupeKeys = [...seenDedupe];

  const runRecord = {
    runId: `run_${hash(`${source}:${startedAt}`).slice(0, 12)}`,
    connector: source,
    status: errors.length ? 'success_with_errors' : 'success',
    startedAt,
    finishedAt: new Date().toISOString(),
    rowsProcessed: rows.length,
    rowsImported: ranked.length,
    rowsPersisted: persistedSignals.length,
    duplicatesSkipped,
    errorCount: errors.length,
    idempotencyKey: options.idempotencyKey || hash(`${source}:${startedAt}:${rows.length}`),
  };
  db.connectorRuns.push(runRecord);

  saveDb(db);

  return {
    run: runRecord,
    errors,
    normalizedSignals: ranked,
    decisions,
  };
}

module.exports = {
  DB_PATH,
  loadDb,
  saveDb,
  parsePayload,
  normalizeRow,
  runConnectorJob,
};
