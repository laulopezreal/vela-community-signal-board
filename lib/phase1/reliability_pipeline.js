const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PHASE1_DIR = path.resolve(__dirname, '../../data/phase1');
const SIGNALS_PATH = path.join(PHASE1_DIR, 'normalized-signals.json');
const BOARD_PATH = path.join(PHASE1_DIR, 'ranked-board.json');
const IDEMPOTENCY_PATH = path.join(PHASE1_DIR, 'idempotency.json');
const DLQ_PATH = path.join(PHASE1_DIR, 'dead-letter-queue.jsonl');

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

function normalizeEvent(raw, traceId, idempotencyKey) {
  if (!raw || typeof raw !== 'object') throw new Error('invalid_event_object');
  const id = String(raw.id || '').trim();
  const content = String(raw.content || '').trim();
  const createdAtMs = new Date(raw.createdAt).getTime();
  if (!id) throw new Error('missing_id');
  if (!content) throw new Error('missing_content');
  if (!Number.isFinite(createdAtMs)) throw new Error('invalid_created_at');
  if (content.includes('FORCE_FAIL')) throw new Error('forced_transform_failure');

  const lower = content.toLowerCase();
  const revenue = lower.includes('deal') || lower.includes('client') ? 5 : 3;
  const product = lower.includes('bug') || lower.includes('feature') ? 5 : 2;
  const risk = lower.includes('urgent') || lower.includes('incident') ? 5 : 2;
  const leverage = lower.includes('automation') || lower.includes('template') ? 5 : 2;
  const weighted = Number((revenue * 0.35 + product * 0.25 + risk * 0.25 + leverage * 0.15).toFixed(2));

  return {
    signalId: `sig_${hash(id).slice(0, 12)}`,
    externalId: `discord:${id}`,
    threadId: String(raw.threadId || id),
    source: String(raw.channel || 'Discord #unknown'),
    title: content.length > 120 ? `${content.slice(0, 117)}...` : content,
    content,
    createdAt: new Date(createdAtMs).toISOString(),
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
    provider: String(event.provider || 'discord'),
    eventType: String(event.event_type || event.eventType || 'message'),
    eventId: String(event.id || ''),
    payload: event,
  };
  appendJsonl(DLQ_PATH, entry);
  return entry;
}

async function processEvents(rawEvents, options = {}) {
  const events = Array.isArray(rawEvents) ? rawEvents : [rawEvents];
  const traceId = String(options.traceId || `trace_${Date.now().toString(36)}_${hash(Math.random()).slice(0, 8)}`);
  const idState = loadIdempotency();
  const signalsState = readJson(SIGNALS_PATH, { signals: [] });
  const accepted = []; const duplicates = []; const dlqEntries = [];

  for (const event of events.filter(Boolean)) {
    const key = idempotencyToken(event);
    if (!key || key.endsWith(':')) { duplicates.push({ reason: 'invalid_idempotency_key', key }); continue; }
    if (idState.processed[key]) { duplicates.push({ reason: 'already_processed', key, traceId: idState.processed[key].traceId }); continue; }

    try {
      const signal = await withRetry(() => normalizeEvent(event, traceId, key), {
        retries: Number.isInteger(options.retries) ? options.retries : 3,
        baseDelayMs: Number.isFinite(options.baseDelayMs) ? options.baseDelayMs : 120,
        jitterMs: Number.isFinite(options.jitterMs) ? options.jitterMs : 40,
        onRetry: ({ attempt, waitMs, error }) => console.log(`PHASE1_RETRY traceId=${traceId} key=${key} attempt=${attempt} waitMs=${waitMs} reason=${error.message}`),
      });
      accepted.push(signal);
      idState.processed[key] = { traceId, processedAt: nowIso(), signalId: signal.signalId };
    } catch (err) {
      const dlqEntry = routeToDlq({ event, reason: err.message, traceId, idempotencyKey: key });
      dlqEntries.push(dlqEntry);
      console.log(`PHASE1_DLQ traceId=${traceId} key=${key} dlqId=${dlqEntry.dlqId} reason=${err.message}`);
    }
  }

  const dedupByExternal = new Map();
  for (const signal of [...signalsState.signals, ...accepted]) dedupByExternal.set(signal.externalId, signal);
  const normalizedSignals = [...dedupByExternal.values()];
  const rankedSignals = rankSignals(normalizedSignals);

  writeJson(SIGNALS_PATH, { updatedAt: nowIso(), signals: normalizedSignals });
  writeJson(BOARD_PATH, { updatedAt: nowIso(), traceId, rankedSignals });
  saveIdempotency(idState);

  return { traceId, accepted: accepted.length, duplicateIgnored: duplicates.length, dlqRouted: dlqEntries.length, totalRanked: rankedSignals.length, duplicates, dlqEntries };
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
  const candidates = inspectDlq(filters);
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
    console.log(`PHASE1_REPLAY traceId=${replayTraceId} sourceDlqId=${entry.dlqId} accepted=${result.accepted} dlqRouted=${result.dlqRouted}`);
  }
  return { replayed, selected: candidates.length, traces };
}

module.exports = {
  PATHS: { PHASE1_DIR, SIGNALS_PATH, BOARD_PATH, IDEMPOTENCY_PATH, DLQ_PATH },
  withRetry,
  processEvents,
  inspectDlq,
  replayDlq,
  idempotencyToken,
};
