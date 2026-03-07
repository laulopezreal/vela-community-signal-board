#!/usr/bin/env node
const fs = require('fs');
const http = require('http');
const { URL } = require('url');
const { processEvents, PATHS } = require('../../lib/phase1/reliability_pipeline');
const { createDiscordConnector } = require('./discord_connector');

const PORT = Number(process.env.PHASE1_PORT || 8791);
const STARTED_AT = Date.now();

const metrics = {
  ingestRequestsTotal: 0,
  ingestAcceptedTotal: 0,
  ingestDuplicateIgnoredTotal: 0,
  ingestDlqRoutedTotal: 0,
  lastTraceId: null,
  discordGatewayEventsTotal: { received: 0, accepted: 0, dropped: 0 },
};

const sseClients = new Set();

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadBoardSnapshot() {
  const board = readJson(PATHS.BOARD_PATH, { updatedAt: null, traceId: null, rankedSignals: [] });
  const signals = readJson(PATHS.SIGNALS_PATH, { signals: [] });
  return {
    ok: true,
    updatedAt: board.updatedAt,
    traceId: board.traceId,
    rankedSignals: board.rankedSignals || [],
    normalizedSignals: signals.signals || [],
  };
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(`${JSON.stringify(body, null, 2)}\n`);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8') || '{}';
        resolve(JSON.parse(raw));
      } catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}

function broadcastBoardUpdate(update) {
  const data = `event: board.update\ndata: ${JSON.stringify(update)}\n\n`;
  for (const client of sseClients) client.write(data);
}


function incGatewayMetric(status, labels = {}) {
  if (!Object.prototype.hasOwnProperty.call(metrics.discordGatewayEventsTotal, status)) return;
  metrics.discordGatewayEventsTotal[status] += 1;
  const detail = Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(' ');
  console.log(`PHASE1_DISCORD_GATEWAY status=${status}${detail ? ` ${detail}` : ''}`);
}

function metricsText() {
  return [
    '# HELP phase1_ingest_requests_total Total ingest requests',
    '# TYPE phase1_ingest_requests_total counter',
    `phase1_ingest_requests_total ${metrics.ingestRequestsTotal}`,
    '# HELP phase1_ingest_accepted_total Total accepted events',
    '# TYPE phase1_ingest_accepted_total counter',
    `phase1_ingest_accepted_total ${metrics.ingestAcceptedTotal}`,
    '# HELP phase1_ingest_duplicate_ignored_total Total duplicate ignored events',
    '# TYPE phase1_ingest_duplicate_ignored_total counter',
    `phase1_ingest_duplicate_ignored_total ${metrics.ingestDuplicateIgnoredTotal}`,
    '# HELP phase1_ingest_dlq_routed_total Total DLQ routed events',
    '# TYPE phase1_ingest_dlq_routed_total counter',
    `phase1_ingest_dlq_routed_total ${metrics.ingestDlqRoutedTotal}`,
    '# HELP phase1_discord_gateway_events_total Discord gateway events by status',
    '# TYPE phase1_discord_gateway_events_total counter',
    `phase1_discord_gateway_events_total{status="received"} ${metrics.discordGatewayEventsTotal.received}`,
    `phase1_discord_gateway_events_total{status="accepted"} ${metrics.discordGatewayEventsTotal.accepted}`,
    `phase1_discord_gateway_events_total{status="dropped"} ${metrics.discordGatewayEventsTotal.dropped}`,
    '# HELP phase1_uptime_seconds Process uptime in seconds',
    '# TYPE phase1_uptime_seconds gauge',
    `phase1_uptime_seconds ${Math.floor((Date.now() - STARTED_AT) / 1000)}`,
  ].join('\n') + '\n';
}

async function ingestAndPersist(events, traceId) {
  const result = await processEvents(events, { traceId, retries: 3, baseDelayMs: 100, jitterMs: 30 });
  metrics.ingestRequestsTotal += 1;
  metrics.ingestAcceptedTotal += result.accepted;
  metrics.ingestDuplicateIgnoredTotal += result.duplicateIgnored;
  metrics.ingestDlqRoutedTotal += result.dlqRouted;
  metrics.lastTraceId = result.traceId;

  const board = loadBoardSnapshot();
  const update = {
    traceId: result.traceId,
    accepted: result.accepted,
    duplicateIgnored: result.duplicateIgnored,
    dlqRouted: result.dlqRouted,
    totalRanked: result.totalRanked,
    topSignalId: board.rankedSignals[0]?.signalId || null,
    updatedAt: board.updatedAt,
  };
  broadcastBoardUpdate(update);
  return { result, board };
}

const connector = createDiscordConnector({
  enabled: process.env.DISCORD_CONNECTOR_ENABLED !== 'false',
  token: process.env.DISCORD_BOT_TOKEN,
  guildId: process.env.DISCORD_GUILD_ID,
  channelAllowlist: process.env.DISCORD_CHANNEL_ALLOWLIST || '',
});
connector.on('gateway_metric', (metric) => {
  const status = metric.status || 'dropped';
  incGatewayMetric(status, { event: metric.event || 'unknown', reason: metric.reason || 'none' });
});

connector.on('event', async ({ envelope, traceId }) => {
  try {
    await ingestAndPersist([envelope], traceId);
  } catch (err) {
    incGatewayMetric('dropped', { event: 'MESSAGE_CREATE', reason: `persist_error:${err.message}` });
  }
});

connector.start();

async function handler(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/readyz') {
    const ready = connector.isReady();
    return sendJson(res, ready ? 200 : 503, {
      ok: ready,
      service: 'phase1-live-ingest',
      connector: { ...connector.config, ...connector.status() },
      dataPaths: PATHS,
    });
  }

  if (req.method === 'GET' && url.pathname === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' });
    res.end(metricsText());
    return;
  }

  if (req.method === 'GET' && url.pathname === '/v1/live/board') return sendJson(res, 200, loadBoardSnapshot());

  if (req.method === 'GET' && url.pathname === '/v1/live/board/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    });
    res.write('event: hello\ndata: {"ok":true}\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/v1/live/ingest/discord/event') {
    try {
      const payload = await readJsonBody(req);
      const event = payload.event || payload;
      const envelope = connector.ingest(event);
      const traceId = String(payload.traceId || req.headers['x-trace-id'] || '').trim() || undefined;
      const { result } = await ingestAndPersist([envelope], traceId);
      return sendJson(res, 200, { ok: true, connector: 'discord', envelope, ingest: result });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  if (req.method === 'POST' && url.pathname === '/v1/live/ingest/discord/events') {
    try {
      const payload = await readJsonBody(req);
      const events = Array.isArray(payload.events) ? payload.events : [];
      const envelopes = events.map((event) => connector.ingest(event));
      const traceId = String(payload.traceId || req.headers['x-trace-id'] || '').trim() || undefined;
      const { result } = await ingestAndPersist(envelopes, traceId);
      return sendJson(res, 200, { ok: true, connector: 'discord', events: envelopes.length, ingest: result });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: err.message });
    }
  }

  return sendJson(res, 404, { ok: false, error: 'not_found' });
}

const server = http.createServer((req, res) => {
  handler(req, res).catch((err) => sendJson(res, 500, { ok: false, error: err.message }));
});

server.listen(PORT, () => console.log(`PHASE1_API_LISTENING http://localhost:${PORT}`));
