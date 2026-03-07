#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const connectors = ['discord', 'slack', 'email'];
const files = ['normalized-signals.json', 'decision-outputs.json', 'errors.json'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function stable(value) {
  return JSON.stringify(value, null, 2);
}

let mismatches = 0;
for (const connector of connectors) {
  for (const file of files) {
    const generatedPath = path.resolve(root, 'docs/artifacts/connectors', connector, file);
    const snapshotPath = path.resolve(root, 'ops/fixtures/snapshots/connectors', connector, file);
    const generated = stable(readJson(generatedPath));
    const snapshot = stable(readJson(snapshotPath));
    if (generated !== snapshot) {
      mismatches += 1;
      console.error(`SNAPSHOT_MISMATCH connector=${connector} file=${file}`);
    }
  }
}

if (mismatches > 0) {
  console.error(`CONNECTOR_FIXTURE_CHECK_FAIL mismatches=${mismatches}`);
  process.exit(1);
}

console.log('CONNECTOR_FIXTURE_CHECK_PASS');
