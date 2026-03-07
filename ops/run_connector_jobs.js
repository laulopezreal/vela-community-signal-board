#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { runConnectorJob } from '../server/lib/connectors/runConnectorJob.js';
import { listRunHistory } from '../server/lib/db/fileDb.js';

const root = process.cwd();
const fixtureDir = path.resolve(root, 'ops/fixtures');
const outDir = path.resolve(root, 'docs/artifacts/connector-pipeline');

const inputs = {
  discord: path.join(fixtureDir, 'discord-export.json'),
  slack: path.join(fixtureDir, 'slack-export.json'),
  email: path.join(fixtureDir, 'email-export.json'),
};

const results = Object.entries(inputs).map(([connector, inputPath]) =>
  runConnectorJob({ connector, inputPath, outputDir: outDir }),
);

if (process.argv.includes('--write-ui-history')) {
  fs.mkdirSync(path.resolve(root, 'app/data'), { recursive: true });
  fs.writeFileSync(path.resolve(root, 'app/data/connector-run-history.json'), `${JSON.stringify(listRunHistory(), null, 2)}\n`);
}

for (const result of results) {
  console.log(`CONNECTOR_${result.status.toUpperCase()} connector=${result.connector} processed=${result.rowsProcessed} inserted=${result.rowsInserted} deduped=${result.rowsDeduped}`);
}
