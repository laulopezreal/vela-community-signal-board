const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PHASE1_DIR = path.resolve(__dirname, '../../data/phase1');
const CONTRACTS_DIR = path.resolve(__dirname, '../../contracts/phase1');
const SIGNALS_PATH = path.join(PHASE1_DIR, 'normalized-signals.json');
const BOARD_PATH = path.join(PHASE1_DIR, 'ranked-board.json');
const IDEMPOTENCY_PATH = path.join(PHASE1_DIR, 'idempotency.json');
const DLQ_PATH = path.join(PHASE1_DIR, 'dead-letter-queue.jsonl');
const VALIDATION_REPORT_PATH = path.join(PHASE1_DIR, 'contract-validation-report.json');

const REASON = {
  INVALID_EVENT_OBJECT: 'INVALID_EVENT_OBJECT',
  MISSING_ID: 'MISSING_ID',
  MISSING_CONTENT: 'MISSING_CONTENT',
  INVALID_CREATED_AT: 'INVALID_CREATED_AT',
  INVALID_PROVIDER: 'INVALID_PROVIDER',
  INVALID_EVENT_TYPE: 'INVALID_EVENT_TYPE',
  INVALID_SOURCE: 'INVALID_SOURCE',
  FORCED_TRANSFORM_FAILURE: 'FORCED_TRANSFORM_FAILURE',
};

const CONTRACT_VERSION = process.env.CONTRACT_VERSION || 'v1';
const MAX_REPLAY_BATCH = Number(process.env.PHASE1_REPLAY_BATCH_SIZE || 100);

function ensureDir() { fs.mkdirSync(PHASE1_DIR, { recursive: true }); }
const nowIso = () => new Date().toISOString();
const hash = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readJson(filePath, fallback) {
  ensureDir();
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function writeJson(filePath, value) {
  ensureDir();
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
function readJsonl(filePath) {
  ensureDir();
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return [];
  return raw.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
}
function appendJsonl(filePath, value) { ensureDir(); fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, 'utf8'); }

async function withRetry(taskFn, options = {}) {
  const retries = Number.isInteger(options.retries) ? options.retries : 3;
  const baseDelayMs = Number.isFinite(options.baseDelayMs) ? options.baseDelayMs : 120;
  const jitterMs = Number.isFinite(options.jitterMs) ? options.jitterMs : 40;
  let attempt = 0; let lastErr;
  while (attempt <= retries) {
    try { return await taskFn(attempt); } catch (err) {
      lastErr = err;
      if (attempt === retries) break;
      const waitMs = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * (jitterMs + 1));
      if (typeof options.onRetry === 'function') options.onRetry({ attempt: attempt + 1, waitMs, error: err });
      await sleep(waitMs);
    }
    attempt += 1;
  }
  throw lastErr;
}

function fail(reason) {
  const err = new Error(reason);
  err.reason = reason;
  throw err;
}

function validateInboundEvent(raw) {
  if (!raw || typeof raw !== 'object') fail(REASON.INVALID_EVENT_OBJECT);

  const provider = String(raw.provider || 'discord').trim().toLowerCase();
  if (!['discord'].includes(provider)) fail(REASON.INVALID_PROVIDER);

  const eventType = String(raw.event_type || raw.eventType || 'message').trim().toLowerCase();
  if (!['message'].includes(eventType)) fail(REASON.INVALID_EVENT_TYPE);

  const id = String(raw.id || '').trim();
  if (!id) fail(REASON.MISSING_ID);

  const source = String(raw.channel || raw.source || '').trim();
  if (!source) fail(REASON.INVALID_SOURCE);

  const content = String(raw.content || '').trim();
  if (!content) fail(REASON.MISSING_CONTENT);

  const createdAt = new Date(raw.createdAt);
  if (Number.isNaN(createdAt.getTime())) fail(REASON.INVALID_CREATED_AT);

  return {
    ...raw,
    provider,
    event_type: eventType,
    id,
    content,
    channel: source,
    createdAt: createdAt.toISOString(),
  };
}

function normalizeEvent(raw, traceId, idempotencyKey) {
  const event = validateInboundEvent(raw);
  if (event.content.includes('FORCE_FAIL')) fail(REASON.FORCED_TRANSFORM_FAILURE);

  const lower = event.content.toLowerCase();
  const revenue = lower.includes('deal') || lower.includes('client') ? 5 : 3;
  const product = lower.includes('bug') || lower.includes('feature') ? 5 : 2;
  const risk = lower.includes('urgent') || lower.includes('incident') ? 5 : 2;
  const leverage = lower.includes('automation') || lower.includes('template') ? 5 : 2;
  const weighted = Number((revenue * 0.35 + product * 0.25 + risk * 0.25 + leverage * 0.15).toFixed(2));

  return {
    contractVersion: CONTRACT_VERSION,
    signalId: `sig_${hash(event.id).slice(0, 12)}`,
    externalId: `${event.provider}:${event.id}`,
    threadId: String(event.threadId || event.id),
    source: event.channel,
    title: event.content.length > 120 ? `${event.content.slice(0, 117)}...` : event.content,
    content: event.content,
    createdAt: event.createdAt,
    weighted,
    traceId,
    ingestIdempotencyKey: idempotencyKey,
  };
}

const rankSignals = (signals) => [...signals].sort((a, b) => b.weighted - a.weighted || b.createdAt.localeCompare(a.createdAt) || a.externalId.localeCompare(b.externalId));
function idempotencyToken(event) {
  const provider = String(event.provider || 'discord').trim();
  const eventType = String(event.event_type || event.eventType || 'message').trim();
  const eventId = String(event.id || '').trim();
  return `${provider}:${eventType}:${eventId}`;
}
const loadIdempotency = () => readJson(IDEMPOTENCY_PATH, { processed: {} });
const saveIdempotency = (state) => writeJson(IDEMPOTENCY_PATH, state);

function routeToDlq({ event, reason, traceId, idempotencyKey }) {
  const entry = {
    dlqId: `dlq_${Date.now().toString(36)}_${hash(`${traceId}:${idempotencyKey}`).slice(0, 8)}`,
    traceId,
    idempotencyKey,
    reason,
    failedAt: nowIso(),
    source: String(event.channel || event.source || 'unknown'),
    provider: String(event.provider || 'discord'),
    eventType: String(event.event_type || event.eventType || 'message'),
    eventId: String(event.id || ''),
    payload: event,
  };
  appendJsonl(DLQ_PATH, entry);
  return entry;
}

function updateValidationReport({ traceId, accepted, duplicateIgnored, dlqEntries, eventsCount }) {
  const report = readJson(VALIDATION_REPORT_PATH, {
    contractVersion: CONTRACT_VERSION,
    generatedAt: null,
    traces: [],
    totals: { processed: 0, passed: 0, failed: 0, duplicates: 0 },
    byReason: {},
    bySource: {},
  });

  const failed = dlqEntries.length;
  report.generatedAt = nowIso();
  report.traces.push({ traceId, processed: eventsCount, passed: accepted, failed, duplicates: duplicateIgnored, generatedAt: report.generatedAt });
  report.traces = report.traces.slice(-100);
  report.totals.processed += eventsCount;
  report.totals.passed += accepted;
  report.totals.failed += failed;
  report.totals.duplicates += duplicateIgnored;

  for (const entry of dlqEntries) {
    report.byReason[entry.reason] = (report.byReason[entry.reason] || 0) + 1;
    report.bySource[entry.source] = (report.bySource[entry.source] || 0) + 1;
  }

  writeJson(VALIDATION_REPORT_PATH, report);
}

async function processEvents(rawEvents, options = {}) {
  const events = Array.isArray(rawEvents) ? rawEvents : [rawEvents];
  const traceId = String(options.traceId || `trace_${Date.now().toString(36)}_${hash(Math.random()).slice(0, 8)}`);
  const idState = loadIdempotency();
  const signalsState = readJson(SIGNALS_PATH, { signals: [] });
  const accepted = []; const duplicates = []; const dlqEntries = [];

  for (const event of events.filter(Boolean)) {
    const key = idempotencyToken(event);
    if (!key || key.endsWith(':')) {
      const dlqEntry = routeToDlq({ event, reason: REASON.MISSING_ID, traceId, idempotencyKey: key || 'missing' });
      dlqEntries.push(dlqEntry);
      continue;
    }
    if (idState.processed[key]) { duplicates.push({ reason: 'already_processed', key, traceId: idState.processed[key].traceId }); continue; }

    try {
      const signal = await withRetry(() => normalizeEvent(event, traceId, key), {
        retries: Number.isInteger(options.retries) ? options.retries : 3,
        baseDelayMs: Number.isFinite(options.baseDelayMs) ? options.baseDelayMs : 120,
        jitterMs: Number.isFinite(options.jitterMs) ? options.jitterMs : 40,
      });
      accepted.push(signal);
      idState.processed[key] = { traceId, processedAt: nowIso(), signalId: signal.signalId };
    } catch (err) {
      const reason = err.reason || err.message || 'UNKNOWN';
      const dlqEntry = routeToDlq({ event, reason, traceId, idempotencyKey: key });
      dlqEntries.push(dlqEntry);
      console.log(`PHASE1_DLQ traceId=${traceId} key=${key} dlqId=${dlqEntry.dlqId} reason=${reason}`);
    }
  }

  const dedupByExternal = new Map();
  for (const signal of [...signalsState.signals, ...accepted]) dedupByExternal.set(signal.externalId, signal);
  const normalizedSignals = [...dedupByExternal.values()];
  const rankedSignals = rankSignals(normalizedSignals);

  writeJson(SIGNALS_PATH, { updatedAt: nowIso(), contractVersion: CONTRACT_VERSION, signals: normalizedSignals });
  writeJson(BOARD_PATH, { updatedAt: nowIso(), traceId, contractVersion: CONTRACT_VERSION, rankedSignals });
  saveIdempotency(idState);
  updateValidationReport({ traceId, accepted: accepted.length, duplicateIgnored: duplicates.length, dlqEntries, eventsCount: events.length });

  return {
    traceId,
    contractVersion: CONTRACT_VERSION,
    accepted: accepted.length,
    duplicateIgnored: duplicates.length,
    dlqRouted: dlqEntries.length,
    totalRanked: rankedSignals.length,
    duplicates,
    dlqEntries,
  };
}

function inspectDlq(filters = {}) {
  return readJsonl(DLQ_PATH).filter((entry) => {
    if (filters.traceId && entry.traceId !== filters.traceId) return false;
    if (filters.from && new Date(entry.failedAt).getTime() < new Date(filters.from).getTime()) return false;
    if (filters.to && new Date(entry.failedAt).getTime() > new Date(filters.to).getTime()) return false;
    return true;
  });
}

async function replayDlq(filters = {}, options = {}) {
  const allCandidates = inspectDlq(filters);
  const candidates = allCandidates.slice(0, Number.isInteger(options.batchSize) ? options.batchSize : MAX_REPLAY_BATCH);
  if (!candidates.length) return { replayed: 0, selected: 0, traces: [], message: 'no_dlq_entries_match_filter' };

  let replayed = 0; const traces = [];
  for (const entry of candidates) {
    const replayTraceId = String(options.traceId || `replay_${Date.now().toString(36)}_${hash(entry.dlqId).slice(0, 6)}`);
    const payload = { ...entry.payload };
    if (options.repairForcedFailure === true && typeof payload.content === 'string') {
      payload.content = payload.content.replace(/FORCE_FAIL/g, 'REPAIRED');
    }
    const result = await processEvents([payload], { ...options, traceId: replayTraceId });
    replayed += result.accepted;
    traces.push({ dlqId: entry.dlqId, replayTraceId, accepted: result.accepted, dlqRouted: result.dlqRouted });
  }
  return { replayed, selected: candidates.length, truncatedByBatch: allCandidates.length - candidates.length, traces };
}

module.exports = {
  PATHS: {
    PHASE1_DIR,
    CONTRACTS_DIR,
    SIGNALS_PATH,
    BOARD_PATH,
    IDEMPOTENCY_PATH,
    DLQ_PATH,
    VALIDATION_REPORT_PATH,
  },
  REASON,
  withRetry,
  processEvents,
  inspectDlq,
  replayDlq,
  idempotencyToken,
  validateInboundEvent,
};
