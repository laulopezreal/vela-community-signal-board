#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const fixturePath = path.resolve(__dirname, 'fixtures/discord-raw-events.json');
const port = Number(process.env.PHASE0_PORT || 8787);

function waitForReady(proc, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server_start_timeout')), timeoutMs);
    proc.stdout.on('data', (buf) => {
      const s = buf.toString('utf8');
      process.stdout.write(s);
      if (s.includes('PHASE0_API_LISTENING')) {
        clearTimeout(timer);
        resolve();
      }
    });
    proc.stderr.on('data', (buf) => process.stderr.write(buf.toString('utf8')));
    proc.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`server_exited_early code=${code}`));
    });
  });
}

async function call(method, pathname, payload) {
  const url = `http://127.0.0.1:${port}${pathname}`;
  const init = { method, headers: { 'content-type': 'application/json' } };
  if (payload !== undefined) init.body = JSON.stringify(payload);
  const res = await fetch(url, init);
  const body = await res.json();
  return { status: res.status, body };
}

async function run() {
  const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const server = spawn('node', ['ops/phase0/server.js'], {
    cwd: root,
    env: { ...process.env, PHASE0_PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  try {
    await waitForReady(server);

    const ingest = await call('POST', '/v1/ingest/discord/events', fixture);
    if (ingest.status !== 200 || ingest.body.ok !== true) {
      throw new Error(`ingest_failed status=${ingest.status}`);
    }

    const board = await call('GET', '/v1/board');
    if (board.status !== 200 || board.body.ok !== true) {
      throw new Error(`board_failed status=${board.status}`);
    }

    const top = board.body.rankedSignals?.[0];
    if (!top || !Array.isArray(board.body.decisions) || !board.body.decisions.length) {
      throw new Error('board_missing_ranked_data');
    }

    console.log(`PHASE0_DEMO_PASS ingestAccepted=${ingest.body.accepted} ranked=${board.body.rankedSignals.length} topSignal=${top.signalId}`);
  } finally {
    server.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error(`PHASE0_DEMO_FAIL ${err.message}`);
  process.exit(1);
});
