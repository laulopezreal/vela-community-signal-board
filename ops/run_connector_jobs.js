#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const { runConnectorJob, loadDb, saveDb } = require('../server/lib/connectors');

const root = process.cwd();
const outDir = path.resolve(root, 'docs/artifacts/connectors');
const uiHistoryPath = path.resolve(root, 'app/data/connector-run-history.json');


function resetDbForDeterministicRun() {
  saveDb({
    signals: [],
    connectorRuns: [],
    seenIdempotencyKeys: [],
    seenDedupeKeys: [],
  });
}

const jobs = [
  { connector: 'discord', file: 'docs/artifacts/sample-discord-export.json' },
  { connector: 'slack', file: 'ops/fixtures/slack-export.json' },
  { connector: 'email', file: 'ops/fixtures/email-export.json' },
];

function run() {
  fs.mkdirSync(outDir, { recursive: true });
  resetDbForDeterministicRun();

  const summary = [];
  for (const job of jobs) {
    const payloadPath = path.resolve(root, job.file);
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
    const result = runConnectorJob(job.connector, payload, {
      idempotencyKey: `${job.connector}:${path.basename(job.file)}`,
    });

    const connectorOutDir = path.join(outDir, job.connector);
    fs.mkdirSync(connectorOutDir, { recursive: true });
    fs.writeFileSync(path.join(connectorOutDir, 'normalized-signals.json'), `${JSON.stringify(result.normalizedSignals, null, 2)}\n`);
    fs.writeFileSync(path.join(connectorOutDir, 'decision-outputs.json'), `${JSON.stringify(result.decisions, null, 2)}\n`);
    fs.writeFileSync(path.join(connectorOutDir, 'errors.json'), `${JSON.stringify(result.errors, null, 2)}\n`);
    fs.writeFileSync(path.join(connectorOutDir, 'run.json'), `${JSON.stringify(result.run, null, 2)}\n`);

    summary.push({ connector: job.connector, run: result.run });
  }

  const db = loadDb();
  fs.mkdirSync(path.dirname(uiHistoryPath), { recursive: true });
  fs.writeFileSync(
    uiHistoryPath,
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      runs: db.connectorRuns.slice(-20).reverse(),
    }, null, 2)}\n`
  );

  fs.writeFileSync(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`CONNECTOR_JOBS_PASS out=${path.relative(root, outDir)} runs=${summary.length}`);
}

run();
