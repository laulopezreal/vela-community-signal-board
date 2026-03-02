#!/usr/bin/env node
const http = require('http');
const { URL } = require('url');
const { ingestDiscordEvents, loadStore } = require('./pipeline');

const PORT = Number(process.env.PHASE0_PORT || 8787);

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
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function handler(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/healthz') {
    return sendJson(res, 200, { ok: true, service: 'phase0-api' });
  }

  if (req.method === 'POST' && url.pathname === '/v1/ingest/discord/events') {
    try {
      const payload = await readJsonBody(req);
      const events = Array.isArray(payload) ? payload : (Array.isArray(payload.events) ? payload.events : [payload]);
      const result = ingestDiscordEvents(events);
      return sendJson(res, 200, { ok: true, ...result });
    } catch (err) {
      return sendJson(res, 400, { ok: false, error: `invalid_json: ${err.message}` });
    }
  }

  if (req.method === 'GET' && url.pathname === '/v1/board') {
    const store = loadStore();
    return sendJson(res, 200, {
      ok: true,
      ingestedAt: store.ingestedAt,
      rankedSignals: store.board?.rankedSignals || [],
      decisions: store.board?.decisions || [],
    });
  }

  return sendJson(res, 404, { ok: false, error: 'not_found' });
}

const server = http.createServer((req, res) => {
  handler(req, res).catch((err) => sendJson(res, 500, { ok: false, error: err.message }));
});

server.listen(PORT, () => {
  console.log(`PHASE0_API_LISTENING http://localhost:${PORT}`);
});
